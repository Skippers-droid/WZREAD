use tauri::State;
use serde_json::{Value, json};
use crate::db::DbPool;
use crate::db::DbConn;
use crate::services::SourceService;
use crate::extension::ExtensionHandler;
use tracing::{info, error};

#[tauri::command(rename_all = "snake_case")]
pub async fn search_extensions(
    pool: State<'_, DbPool>,
    query_type: String,
    query: Option<String>,
    page: Option<usize>,
) -> Result<Value, String> {
    info!("Searching extensions with type: {}, query: {:?}, page: {:?}", query_type, query, page);
    
    let conn = DbConn::get(&pool).map_err(|e| {
        error!("Failed to get DB connection: {}", e);
        e.to_string()
    })?;

    let source = SourceService::get_active_source(&conn)
        .map_err(|e| {
            error!("Failed to get active source: {}", e);
            e.to_string()
        })?
        .ok_or_else(|| {
            error!("No active source found");
            "No active source found".to_string()
        })?;

    let handler = ExtensionHandler::new(source.source_link, pool.inner().clone());
    let result = handler.search_all(&query_type, query.as_deref(), page).await.map_err(|e| {
        error!("Search failed: {}", e);
        e.to_string()
    })?;

    Ok(result)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_manga_info(
    pool: State<'_, DbPool>,
    extension_id: String,
    book_id: String,
) -> Result<Value, String> {
    info!("Getting manga info for extension: {}, book: {}", extension_id, book_id);
    
    let conn = DbConn::get(&pool).map_err(|e| {
        error!("Failed to get DB connection: {}", e);
        e.to_string()
    })?;

    let source = SourceService::get_active_source(&conn)
        .map_err(|e| {
            error!("Failed to get active source: {}", e);
            e.to_string()
        })?
        .ok_or_else(|| {
            error!("No active source found");
            "No active source found".to_string()
        })?;

    let handler = ExtensionHandler::new(source.source_link, pool.inner().clone());
    let result = handler.manga_info(&extension_id, &book_id).await.map_err(|e| {
        error!("Manga info failed: {}", e);
        e.to_string()
    })?;

    Ok(result)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_chapter_images(
    pool: State<'_, DbPool>,
    extension_id: String,
    book_id: String,
    chapter: String,
    page: Option<i64>,
    per_page: Option<i64>,
) -> Result<Value, String> {
    info!("Getting chapter images for extension: {}, book: {}, chapter: {}", extension_id, book_id, chapter);
    
    let conn = DbConn::get(&pool).map_err(|e| {
        error!("Failed to get DB connection: {}", e);
        e.to_string()
    })?;

    let source = SourceService::get_active_source(&conn)
        .map_err(|e| {
            error!("Failed to get active source: {}", e);
            e.to_string()
        })?
        .ok_or_else(|| {
            error!("No active source found");
            "No active source found".to_string()
        })?;

    let handler = ExtensionHandler::new(source.source_link, pool.inner().clone());
    let result = handler.get_chapter_images(
        &extension_id,
        &book_id,
        &chapter,
        page.unwrap_or(1),
        per_page.unwrap_or(5),
    ).await.map_err(|e| {
        error!("Get chapter images failed: {}", e);
        e.to_string()
    })?;

    serde_json::to_value(&result).map_err(|e| {
        error!("Failed to serialize result: {}", e);
        e.to_string()
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn download_extension(
    pool: State<'_, DbPool>,
    extension_id: String,
) -> Result<Value, String> {
    info!("Downloading extension: {}", extension_id);
    
    let conn = DbConn::get(&pool).map_err(|e| {
        error!("Failed to get DB connection: {}", e);
        e.to_string()
    })?;

    let source = SourceService::get_active_source(&conn)
        .map_err(|e| {
            error!("Failed to get active source: {}", e);
            e.to_string()
        })?
        .ok_or_else(|| {
            error!("No active source found");
            "No active source found".to_string()
        })?;

    let handler = ExtensionHandler::new(source.source_link, pool.inner().clone());
    
    let existing_worker = handler.get_worker_by_extension(&extension_id).await;
    if let Some(worker) = existing_worker {
        return Ok(json!({
            "success": true,
            "worker_id": worker.id,
            "message": "Download already in progress",
            "status": worker.status,
            "progress": worker.progress,
        }));
    }
    
    let worker_id = handler.create_download_worker(&extension_id).await;
    
    let handler_clone = handler.clone();
    let ext_id = extension_id.clone();
    let worker_id_clone = worker_id.clone();
    
    tokio::spawn(async move {
        let result = handler_clone.download_extension(&ext_id, &worker_id_clone).await;
        if let Err(e) = &result {
            error!("Extension download failed: {}", e);
            handler_clone.complete_worker(&worker_id_clone, Some(e.to_string())).await;
        }
    });
    
    Ok(json!({
        "success": true,
        "worker_id": worker_id,
        "message": "Download started"
    }))
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_extension_download_status(
    pool: State<'_, DbPool>,
    extension_id: String,
) -> Result<Value, String> {
    let conn = DbConn::get(&pool).map_err(|e| {
        error!("Failed to get DB connection: {}", e);
        e.to_string()
    })?;

    let source = SourceService::get_active_source(&conn)
        .map_err(|e| {
            error!("Failed to get active source: {}", e);
            e.to_string()
        })?
        .ok_or_else(|| {
            error!("No active source found");
            "No active source found".to_string()
        })?;

    let handler = ExtensionHandler::new(source.source_link, pool.inner().clone());
    
    if let Some(worker) = handler.get_worker_by_extension(&extension_id).await {
        Ok(json!({
            "success": true,
            "extension_id": worker.extension_id,
            "status": worker.status,
            "progress": worker.progress,
            "message": worker.message,
            "completed": worker.completed,
            "error": worker.error,
        }))
    } else {
        let exe_dir = std::env::current_exe()
            .unwrap_or_default()
            .parent()
            .unwrap_or(std::path::Path::new("."))
            .to_path_buf()
            .join("extensions")
            .join(&extension_id);
        
        let is_windows = cfg!(target_os = "windows");
        let exe_name = if is_windows { format!("{}.exe", extension_id) } else { extension_id.to_string() };
        let exe_path = exe_dir.join(&exe_name);
        
        if exe_path.exists() {
            Ok(json!({
                "success": true,
                "extension_id": extension_id,
                "status": "installed",
                "progress": 100,
                "message": "Extension is installed",
                "completed": true,
                "error": null,
            }))
        } else {
            Ok(json!({
                "success": true,
                "extension_id": extension_id,
                "status": "not_downloaded",
                "progress": 0,
                "message": "Extension not downloaded",
                "completed": false,
                "error": null,
            }))
        }
    }
}