use anyhow::Result;
use serde_json::{Value, json};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::{info, error, debug};
use std::process::Stdio;
use tokio::process::Command;
use std::path::PathBuf;
use regex::Regex;

use crate::db::DbPool;
use crate::models::*;
use crate::services::SourceService;
use crate::services::SettingsService;
use crate::extension::loader::*;

pub struct ExtensionHandler {
    source_path: String,
    extensions: Arc<Mutex<HashMap<String, ExtensionInfo>>>,
    extension_paths: Arc<Mutex<HashMap<String, PathBuf>>>,
    active_extension_ids: Arc<Mutex<Vec<String>>>,
    loaded: Arc<Mutex<bool>>,
    pool: DbPool,
    extensions_dir: PathBuf,
}

impl ExtensionHandler {
    pub fn new(source_path: String, pool: DbPool) -> Self {
        let exe_dir = std::env::current_exe()
            .unwrap_or_default()
            .parent()
            .unwrap_or(std::path::Path::new("."))
            .to_path_buf();
        
        let extensions_dir = exe_dir.join("extensions");
        
        Self {
            source_path,
            extensions: Arc::new(Mutex::new(HashMap::new())),
            extension_paths: Arc::new(Mutex::new(HashMap::new())),
            active_extension_ids: Arc::new(Mutex::new(Vec::new())),
            loaded: Arc::new(Mutex::new(false)),
            pool,
            extensions_dir,
        }
    }

    async fn execute_extension(&self, extension_id: &str, method: &str, args: Vec<String>) -> Result<String> {
        let ext_paths = self.extension_paths.lock().await;
        let exe_path = ext_paths.get(extension_id)
            .ok_or_else(|| anyhow::anyhow!("Extension executable not found: {}", extension_id))?;

        let is_windows = cfg!(target_os = "windows");
        let exe_name = if is_windows { format!("{}.exe", extension_id) } else { extension_id.to_string() };
        let full_exe_path = exe_path.join(&exe_name);

        if !full_exe_path.exists() {
            return Err(anyhow::anyhow!("Executable not found: {:?}", full_exe_path));
        }

        let conn = crate::db::DbConn::get(&self.pool)?;
        let user_agent = SettingsService::get_setting::<String>(&conn, "user_agent")?
            .unwrap_or_else(|| "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36".to_string());

        let mut cmd = Command::new(&full_exe_path);
        cmd.arg(method);
        for arg in &args {
            cmd.arg(arg);
        }
        
        cmd.env("USER_AGENT", user_agent);
        cmd.stdout(Stdio::piped());
        cmd.stderr(Stdio::piped());

        debug!("Executing extension: {} with method: {} and args: {:?}", extension_id, method, args);

        let output = cmd.output().await?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(anyhow::anyhow!("Extension execution failed: {}", stderr));
        }

        let stdout = String::from_utf8(output.stdout)?;
        debug!("Extension output for {}: {}", extension_id, stdout);
        Ok(stdout)
    }

    pub async fn load_extensions(&self) -> Result<()> {
        let mut loaded = self.loaded.lock().await;
        if *loaded {
            return Ok(());
        }

        info!("Loading extensions from source: {}", self.source_path);

        let conn = crate::db::DbConn::get(&self.pool)?;
        let active_extensions = SourceService::get_active_extensions(&conn)?;

        let mut active_ids = Vec::new();
        for ext in &active_extensions {
            if let Some(ref id) = ext.extension_id {
                active_ids.push(id.clone());
            }
        }

        let manifest = match fetch_manifest(&self.source_path).await {
            Ok(m) => m,
            Err(e) => {
                error!("Failed to fetch manifest: {}", e);
                return Err(e);
            }
        };

        let mut extensions_map = self.extensions.lock().await;
        let mut paths_map = self.extension_paths.lock().await;

        if !self.extensions_dir.exists() {
            std::fs::create_dir_all(&self.extensions_dir)?;
        }

        for active_ext in active_extensions {
            if let Some(ext_id) = &active_ext.extension_id {
                if let Some(ext_info) = find_extension_in_manifest(&manifest, ext_id) {
                    let info = ExtensionInfo {
                        name: ext_info.name.clone(),
                        version: ext_info.version.clone(),
                        description: ext_info.description.clone(),
                        author: ext_info.author.clone(),
                    };
                    
                    extensions_map.insert(ext_id.clone(), info);

                    let ext_dir = self.extensions_dir.join(ext_id);
                    if !ext_dir.exists() {
                        std::fs::create_dir_all(&ext_dir)?;
                    }

                    let is_windows = cfg!(target_os = "windows");
                    let exe_name = if is_windows { format!("{}.exe", ext_id) } else { ext_id.to_string() };
                    let exe_path = ext_dir.join(&exe_name);

                    if !exe_path.exists() {
                        if let Some(executable_path) = &ext_info.executable_path {
                            let base_path = self.source_path
                                .rsplit_once('/')
                                .map(|(path, _)| path)
                                .unwrap_or("");
                            
                            let url = format!("{}/{}", base_path, executable_path.trim_start_matches("./"));
                            
                            match fetch_extension_executable(&url, &exe_path).await {
                                Ok(_) => {
                                    info!("Downloaded executable for: {} (id: {})", ext_info.name, ext_id);
                                    #[cfg(unix)]
                                    {
                                        use std::os::unix::fs::PermissionsExt;
                                        let mut perms = std::fs::metadata(&exe_path)?.permissions();
                                        perms.set_mode(0o755);
                                        std::fs::set_permissions(&exe_path, perms)?;
                                    }
                                }
                                Err(e) => {
                                    error!("Failed to download executable for {}: {}", ext_info.name, e);
                                    continue;
                                }
                            }
                        } else {
                            error!("No executable path specified for extension: {}", ext_id);
                            continue;
                        }
                    }

                    paths_map.insert(ext_id.clone(), ext_dir.clone());
                    info!("Extension ready: {} (id: {})", ext_info.name, ext_id);
                }
            }
        }

        let mut active_ids_store = self.active_extension_ids.lock().await;
        *active_ids_store = active_ids;

        *loaded = true;
        Ok(())
    }

    pub async fn get_source_extensions(&self) -> Result<Value> {
        let manifest = fetch_manifest(&self.source_path).await?;

        let conn = crate::db::DbConn::get(&self.pool)?;
        let active_extensions = SourceService::get_active_extensions(&conn)?;
        let active_ids: Vec<String> = active_extensions
            .iter()
            .filter_map(|e| e.extension_id.clone())
            .collect();

        let source_id = SourceService::get_active_source(&conn)?
            .map(|s| s.id)
            .unwrap_or(0);

        let loaded_ids = if source_id > 0 {
            let mut stmt = conn.conn().prepare(
                "SELECT extension_id FROM loaded_extension WHERE source_id = ?"
            )?;
            let rows = stmt.query_map([source_id], |row| row.get::<_, String>(0))?;
            let mut ids = Vec::new();
            for row in rows {
                ids.push(row?);
            }
            ids
        } else {
            Vec::new()
        };

        let extensions: Vec<ExtensionListItem> = manifest.extensions
            .iter()
            .map(|ext| {
                let id = ext.name.to_lowercase().replace(' ', "");
                ExtensionListItem {
                    name: ext.name.clone(),
                    id: id.clone(),
                    version: ext.version.clone(),
                    description: ext.description.clone(),
                    author: ext.author.clone(),
                    cover: ext.cover.clone(),
                    is_active: active_ids.contains(&id),
                    is_loaded: loaded_ids.contains(&id),
                }
            })
            .collect();

        Ok(json!({
            "success": true,
            "source_path": self.source_path,
            "extensions": extensions,
            "active_extension": active_ids.first().cloned(),
        }))
    }

    pub async fn search_all(&self, query: String) -> Result<Value> {
        self.load_extensions().await?;

        let extensions = self.extensions.lock().await;
        let mut results = serde_json::Map::new();
        let active_ids = self.active_extension_ids.lock().await;

        for (id, info) in extensions.iter() {
            let is_active = active_ids.contains(id);
            
            if is_active {
                let result = match self.execute_extension(id, "search", vec![query.clone()]).await {
                    Ok(val) => {
                        match serde_json::from_str::<Value>(&val) {
                            Ok(v) => v,
                            Err(e) => {
                                error!("Failed to parse search result for {}: {}", id, e);
                                json!({ "error": format!("Parse error: {}", e), "data": [] })
                            }
                        }
                    }
                    Err(e) => {
                        error!("Failed to execute search for {}: {}", id, e);
                        json!({ "error": e.to_string(), "data": [] })
                    }
                };
                
                results.insert(id.clone(), json!({
                    "success": true,
                    "data": result.get("data").cloned().unwrap_or(json!([])),
                    "total": result.get("total").cloned().unwrap_or(json!(0)),
                    "info": info,
                    "extensionId": id,
                    "isActive": is_active,
                }));
            }
        }

        Ok(Value::Object(results))
    }

    pub async fn manga_info(&self, extension_id: &str, book_id: &str) -> Result<Value> {
        self.load_extensions().await?;

        let extensions = self.extensions.lock().await;
        if !extensions.contains_key(extension_id) {
            return Err(anyhow::anyhow!("Extension not found: {}", extension_id));
        }

        let active_ids = self.active_extension_ids.lock().await;
        if !active_ids.contains(&extension_id.to_string()) {
            return Err(anyhow::anyhow!("Extension not active: {}", extension_id));
        }

        match self.execute_extension(extension_id, "manga_info", vec![book_id.to_string()]).await {
            Ok(val) => {
                match serde_json::from_str::<Value>(&val) {
                    Ok(v) => Ok(v),
                    Err(e) => {
                        error!("Failed to parse manga_info result: {}", e);
                        Ok(json!({ "error": format!("Parse error: {}", e) }))
                    }
                }
            }
            Err(e) => {
                error!("Failed to execute manga_info for {}: {}", extension_id, e);
                Ok(json!({ "error": e.to_string() }))
            }
        }
    }

    fn sort_images_by_page_number(images: Vec<String>) -> Vec<String> {
        let page_regex = Regex::new(r"/(\d{4})[_.]").unwrap();
        
        let mut image_pages: Vec<(String, i64)> = images
            .into_iter()
            .filter_map(|url| {
                if let Some(cap) = page_regex.captures(&url) {
                    if let Some(page_match) = cap.get(1) {
                        if let Ok(page_num) = page_match.as_str().parse::<i64>() {
                            return Some((url, page_num));
                        }
                    }
                }
                Some((url, 0))
            })
            .collect();
        
        image_pages.sort_by_key(|(_, page_num)| *page_num);
        
        image_pages.into_iter().map(|(url, _)| url).collect()
    }

    pub async fn get_chapter_images(
        &self,
        extension_id: &str,
        book_id: &str,
        chapter: &str,
        page: i64,
        per_page: i64,
    ) -> Result<ChapterImagesResult> {
        self.load_extensions().await?;

        let extensions = self.extensions.lock().await;
        if !extensions.contains_key(extension_id) {
            return Err(anyhow::anyhow!("Extension not found: {}", extension_id));
        }

        let active_ids = self.active_extension_ids.lock().await;
        if !active_ids.contains(&extension_id.to_string()) {
            return Err(anyhow::anyhow!("Extension not active: {}", extension_id));
        }

        let args = vec![
            book_id.to_string(),
            chapter.to_string(),
            page.to_string(),
            per_page.to_string(),
        ];

        match self.execute_extension(extension_id, "get_chapter_images", args).await {
            Ok(result) => {
                let json: Value = serde_json::from_str(&result).unwrap_or(json!({}));
                
                if let Some(error) = json.get("error").and_then(|v| v.as_str()) {
                    error!("Extension error: {}", error);
                    return Err(anyhow::anyhow!("Extension error: {}", error));
                }
                
                let images: Vec<String> = json.get("images")
                    .and_then(|v| v.as_array())
                    .map(|a| {
                        a.iter()
                            .filter_map(|v| v.as_str().map(|s| s.to_string()))
                            .map(|s| s.replace("\\/", "/"))
                            .collect()
                    })
                    .unwrap_or_default();
                
                let sorted_images = Self::sort_images_by_page_number(images);
                
                Ok(ChapterImagesResult {
                    images: sorted_images,
                    total: json.get("total").and_then(|v| v.as_i64()).unwrap_or(0),
                    page: json.get("page").and_then(|v| v.as_i64()).unwrap_or(page),
                    per_page: json.get("per_page").and_then(|v| v.as_i64()).unwrap_or(per_page),
                    has_more: json.get("has_more").and_then(|v| v.as_bool()).unwrap_or(false),
                })
            }
            Err(e) => {
                error!("Failed to execute get_chapter_images: {}", e);
                Err(e)
            }
        }
    }

    pub async fn get_chapter_images_all(
        &self,
        extension_id: &str,
        book_id: &str,
        chapter: &str,
    ) -> Result<Vec<String>> {
        let result = self.get_chapter_images(extension_id, book_id, chapter, 1, 9999).await?;
        Ok(result.images)
    }
}