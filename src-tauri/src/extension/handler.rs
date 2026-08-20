use crate::extension::rpc_client::ExtensionRpcManager;
use crate::extension::loader::*;
use crate::db::DbPool;
use crate::models::*;
use crate::services::SourceService;
use anyhow::Result;
use serde_json::{Value, json};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::sync::mpsc;
use tracing::{info, error};

#[derive(Clone)]
pub struct ExtensionHandler {
    source_path: String,
    extensions: Arc<Mutex<HashMap<String, ExtensionInfo>>>,
    extension_paths: Arc<Mutex<HashMap<String, PathBuf>>>,
    active_extension_ids: Arc<Mutex<Vec<String>>>,
    loaded: Arc<Mutex<bool>>,
    pool: DbPool,
    extensions_dir: PathBuf,
    rpc_manager: ExtensionRpcManager,
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
            rpc_manager: ExtensionRpcManager::new(),
        }
    }

    pub async fn load_extensions(&self) -> Result<()> {
        let mut loaded = self.loaded.lock().await;
        if *loaded {
            return Ok(());
        }

        let conn = crate::db::DbConn::get(&self.pool)?;
        let active_extensions = SourceService::get_active_extensions(&conn)?;

        let manifest = fetch_manifest(&self.source_path).await?;

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

                    let exe_name = if cfg!(windows) { format!("{}.exe", ext_id) } else { ext_id.to_string() };
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
                }
            }
        }

        let mut active_ids = self.active_extension_ids.lock().await;
        *active_ids = extensions_map.keys().cloned().collect();
        info!("Loaded {} extensions", active_ids.len());

        *loaded = true;
        Ok(())
    }

    async fn execute_extension_rpc(&self, extension_id: &str, method: &str, params: Value) -> Result<Value> {
        self.load_extensions().await?;
        
        let paths = self.extension_paths.lock().await;
        let exe_path = paths.get(extension_id)
            .ok_or_else(|| anyhow::anyhow!("Extension not found: {}", extension_id))?;
        
        let exe_name = if cfg!(windows) { format!("{}.exe", extension_id) } else { extension_id.to_string() };
        let full_exe_path = exe_path.join(&exe_name);
        
        self.rpc_manager.start_extension(extension_id, full_exe_path.to_str().unwrap()).await?;
        
        self.rpc_manager.execute(extension_id, method, params).await
    }

    pub async fn download_extension_silent(&self, extension_id: &str) -> Result<()> {
        let manifest = fetch_manifest(&self.source_path).await?;
        
        let ext_info = find_extension_in_manifest(&manifest, extension_id)
            .ok_or_else(|| anyhow::anyhow!("Extension not found in manifest: {}", extension_id))?;

        let ext_dir = self.extensions_dir.join(extension_id);
        if !ext_dir.exists() {
            std::fs::create_dir_all(&ext_dir)?;
        }

        let exe_name = if cfg!(windows) { format!("{}.exe", extension_id) } else { extension_id.to_string() };
        let exe_path = ext_dir.join(&exe_name);

        if let Some(executable_path) = &ext_info.executable_path {
            let base_path = self.source_path
                .rsplit_once('/')
                .map(|(path, _)| path)
                .unwrap_or("");
            
            let url = format!("{}/{}", base_path, executable_path.trim_start_matches("./"));
            
            fetch_extension_executable(&url, &exe_path).await?;
            
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                let mut perms = std::fs::metadata(&exe_path)?.permissions();
                perms.set_mode(0o755);
                std::fs::set_permissions(&exe_path, perms)?;
            }

            let conn = crate::db::DbConn::get(&self.pool)?;
            let source = SourceService::get_active_source(&conn)?
                .ok_or_else(|| anyhow::anyhow!("No active source found"))?;

            let ext_list = vec![ExtensionListItem {
                name: ext_info.name.clone(),
                id: extension_id.to_string(),
                version: ext_info.version.clone(),
                description: ext_info.description.clone(),
                author: ext_info.author.clone(),
                cover: ext_info.cover.clone(),
                is_active: true,
                is_loaded: true,
                download_status: "completed".to_string(),
            }];

            let mut conn_mut = crate::db::DbConn::get(&self.pool)?;
            SourceService::save_loaded_extensions(&mut conn_mut, source.id, &ext_list)?;
            
            SourceService::set_active_extension(&mut conn_mut, extension_id, true)?;

            let mut extensions_map = self.extensions.lock().await;
            let info = ExtensionInfo {
                name: ext_info.name.clone(),
                version: ext_info.version.clone(),
                description: ext_info.description.clone(),
                author: ext_info.author.clone(),
            };
            extensions_map.insert(extension_id.to_string(), info);

            let mut paths_map = self.extension_paths.lock().await;
            paths_map.insert(extension_id.to_string(), ext_dir.clone());

            let mut active_ids = self.active_extension_ids.lock().await;
            if !active_ids.contains(&extension_id.to_string()) {
                active_ids.push(extension_id.to_string());
            }

            let mut loaded = self.loaded.lock().await;
            *loaded = false;

            info!("Extension installed successfully: {}", extension_id);
            Ok(())
        } else {
            let error = format!("No executable path specified for extension: {}", extension_id);
            Err(anyhow::anyhow!(error))
        }
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
                "SELECT extension_id, is_active FROM loaded_extension WHERE source_id = ?"
            )?;
            let rows = stmt.query_map([source_id], |row| {
                let id: String = row.get(0)?;
                let is_active: i64 = row.get(1)?;
                Ok((id, is_active == 1))
            })?;
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
                let id = ext.id.clone();
                let is_loaded = loaded_ids.iter().any(|(loaded_id, _)| loaded_id == &id);
                let is_active = loaded_ids.iter().any(|(loaded_id, active)| loaded_id == &id && *active);
                
                let download_status = if is_loaded {
                    let ext_dir = self.extensions_dir.join(&id);
                    let exe_name = if cfg!(windows) { format!("{}.exe", id) } else { id.to_string() };
                    let exe_path = ext_dir.join(&exe_name);
                    
                    if exe_path.exists() {
                        "installed"
                    } else {
                        "not_downloaded"
                    }
                } else {
                    "not_downloaded"
                };

                ExtensionListItem {
                    name: ext.name.clone(),
                    id: id.clone(),
                    version: ext.version.clone(),
                    description: ext.description.clone(),
                    author: ext.author.clone(),
                    cover: ext.cover.clone(),
                    is_active,
                    is_loaded,
                    download_status: download_status.to_string(),
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

    pub async fn search_all(&self, query_type: &str, query: Option<&str>, page: Option<usize>) -> Result<Value> {
        self.load_extensions().await?;

        let extensions = self.extensions.lock().await;
        let active_ids = self.active_extension_ids.lock().await;

        let mut results = serde_json::Map::new();

        if extensions.is_empty() {
            return Ok(json!({
                "error": "No extensions found. Please download and activate an extension first.",
                "data": []
            }));
        }

        let mut tasks = Vec::new();

        for (id, info) in extensions.iter() {
            let is_active = active_ids.contains(id);
            
            if is_active {
                let params = match query_type {
                    "search" => {
                        let q = query.unwrap_or("");
                        json!([q.to_string()])
                    }
                    "popular" => {
                        let p = page.unwrap_or(1).to_string();
                        json!([p])
                    }
                    "latest" => {
                        let p = page.unwrap_or(1).to_string();
                        json!([p])
                    }
                    "filtered" => {
                        let filter = query.unwrap_or("");
                        let p = page.unwrap_or(1).to_string();
                        json!([filter.to_string(), p])
                    }
                    _ => {
                        let q = query.unwrap_or("");
                        json!([q.to_string()])
                    }
                };

                let handler_clone = self.clone();
                let id_clone = id.clone();
                let info_clone = info.clone();
                let method = match query_type {
                    "popular" => "getPopular",
                    "latest" => "getLatest",
                    "filtered" => "getFiltered",
                    _ => "search",
                };

                tasks.push(tokio::spawn(async move {
                    let start_time = std::time::Instant::now();
                    let result = handler_clone.execute_extension_rpc(&id_clone, method, params).await;
                    let duration = start_time.elapsed().as_millis();

                    match result {
                        Ok(v) => {
                            let mut result_obj = v;
                            if !result_obj.get("data").is_some() {
                                result_obj = json!({
                                    "data": [],
                                    "total": 0,
                                    "page": 1,
                                    "per_page": 0,
                                    "has_more": false,
                                    "error": "Missing data field"
                                });
                            }
                            (id_clone, info_clone.name, Some(result_obj), None, duration)
                        }
                        Err(e) => {
                            error!("Failed to execute {} for {}: {}", method, id_clone, e);
                            (id_clone, info_clone.name, None, Some(e.to_string()), duration)
                        }
                    }
                }));
            }
        }

        for task in tasks {
            if let Ok((id, name, data, error, duration)) = task.await {
                if let Some(data) = data {
                    results.insert(id.clone(), json!({
                        "success": true,
                        "name": name,
                        "data": data.get("data").cloned().unwrap_or(json!([])),
                        "total": data.get("total").cloned().unwrap_or(json!(0)),
                        "page": data.get("page").cloned().unwrap_or(json!(1)),
                        "per_page": data.get("per_page").cloned().unwrap_or(json!(0)),
                        "has_more": data.get("has_more").cloned().unwrap_or(json!(false)),
                        "duration_ms": duration,
                    }));
                } else {
                    results.insert(id, json!({
                        "success": false,
                        "name": name,
                        "error": error,
                        "data": [],
                        "total": 0,
                        "page": 1,
                        "per_page": 0,
                        "has_more": false,
                        "duration_ms": duration,
                    }));
                }
            }
        }

        Ok(Value::Object(results))
    }

    pub async fn search_single(&self, extension_id: &str, query_type: &str, query: Option<&str>, page: Option<usize>) -> Result<Value> {
        self.load_extensions().await?;

        let extensions = self.extensions.lock().await;
        let active_ids = self.active_extension_ids.lock().await;

        if !extensions.contains_key(extension_id) {
            return Ok(json!({
                "error": format!("Extension not found: {}", extension_id),
                "data": []
            }));
        }

        let is_active = active_ids.contains(&extension_id.to_string());
        if !is_active {
            return Ok(json!({
                "error": format!("Extension not active: {}", extension_id),
                "data": []
            }));
        }

        let params = match query_type {
            "search" => {
                let q = query.unwrap_or("");
                json!([q.to_string()])
            }
            "popular" => {
                let p = page.unwrap_or(1).to_string();
                json!([p])
            }
            "latest" => {
                let p = page.unwrap_or(1).to_string();
                json!([p])
            }
            "filtered" => {
                let filter = query.unwrap_or("");
                let p = page.unwrap_or(1).to_string();
                json!([filter.to_string(), p])
            }
            _ => {
                let q = query.unwrap_or("");
                json!([q.to_string()])
            }
        };

        let method = match query_type {
            "popular" => "getPopular",
            "latest" => "getLatest",
            "filtered" => "getFiltered",
            _ => "search",
        };

        let result = self.execute_extension_rpc(extension_id, method, params).await?;
        
        let mut result_obj = result;
        if !result_obj.get("data").is_some() {
            result_obj = json!({
                "data": [],
                "total": 0,
                "page": 1,
                "per_page": 0,
                "has_more": false,
                "error": "Missing data field"
            });
        }

        Ok(result_obj)
    }

    pub async fn manga_info(&self, extension_id: &str, book_id: &str) -> Result<Value> {
        self.load_extensions().await?;
        let params = json!([book_id.to_string()]);
        self.execute_extension_rpc(extension_id, "manga_info", params).await
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
        let params = json!([book_id.to_string(), chapter.to_string(), page.to_string(), per_page.to_string()]);
        let result = self.execute_extension_rpc(extension_id, "get_chapter_images", params).await?;
        
        let images: Vec<String> = result.get("images")
            .and_then(|v| v.as_array())
            .map(|a| {
                a.iter()
                    .filter_map(|v| v.as_str().map(|s| s.to_string()))
                    .map(|s| s.replace("\\/", "/"))
                    .collect()
            })
            .unwrap_or_default();
        
        Ok(ChapterImagesResult {
            images,
            total: result.get("total").and_then(|v| v.as_i64()).unwrap_or(0),
            page: result.get("page").and_then(|v| v.as_i64()).unwrap_or(page),
            per_page: result.get("per_page").and_then(|v| v.as_i64()).unwrap_or(per_page),
            has_more: result.get("has_more").and_then(|v| v.as_bool()).unwrap_or(false),
        })
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