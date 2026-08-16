use tauri::State;
use serde_json::Value;
use crate::db::DbPool;
use crate::db::DbConn;
use crate::services::SourceService;
use crate::extension::ExtensionHandler;
use tracing::{info, error};

#[tauri::command(rename_all = "snake_case")]
pub async fn search_extensions(
    pool: State<'_, DbPool>,
    query: String,
) -> Result<Value, String> {
    info!("Searching extensions with query: {}", query);
    
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
    let result = handler.search_all(query).await.map_err(|e| {
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