use tauri::State;
use serde_json::Value;
use crate::db::DbPool;
use crate::db::DbConn;
use crate::services::ReadingHistoryService;
use crate::models::ChapterHistoryEntry;

#[tauri::command(rename_all = "snake_case")]
pub async fn save_reading_history_ext(
    pool: State<'_, DbPool>,
    extension_id: String,
    book_id: String,
    chapter_number: i64,
    chapter_slug: String,
    title: Option<String>,
    page_number: i64,
) -> Result<(), String> {
    let conn = DbConn::get(&pool).map_err(|e| e.to_string())?;
    ReadingHistoryService::save_reading_history_ext(
        &conn,
        &extension_id,
        &book_id,
        chapter_number,
        &chapter_slug,
        title.as_deref(),
        page_number,
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_reading_history_ext(
    pool: State<'_, DbPool>,
    extension_id: String,
    book_id: String,
) -> Result<Value, String> {
    let conn = DbConn::get(&pool).map_err(|e| e.to_string())?;
    let history = ReadingHistoryService::get_reading_history_ext(&conn, &extension_id, &book_id)
        .map_err(|e| e.to_string())?;
    serde_json::to_value(history).map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_last_read_ext(
    pool: State<'_, DbPool>,
    extension_id: String,
    book_id: String,
) -> Result<Option<ChapterHistoryEntry>, String> {
    let conn = DbConn::get(&pool).map_err(|e| e.to_string())?;
    let last_read = ReadingHistoryService::get_last_read_ext(&conn, &extension_id, &book_id)
        .map_err(|e| e.to_string())?;
    Ok(last_read)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_chapter_history_ext(
    pool: State<'_, DbPool>,
    extension_id: String,
    book_id: String,
    chapter_slug: String,
) -> Result<Option<ChapterHistoryEntry>, String> {
    let conn = DbConn::get(&pool).map_err(|e| e.to_string())?;
    let history = ReadingHistoryService::get_chapter_history_ext(&conn, &extension_id, &book_id, &chapter_slug)
        .map_err(|e| e.to_string())?;
    Ok(history)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn delete_chapter_history_ext(
    pool: State<'_, DbPool>,
    extension_id: String,
    book_id: String,
    chapter_slug: String,
) -> Result<(), String> {
    let conn = DbConn::get(&pool).map_err(|e| e.to_string())?;
    ReadingHistoryService::delete_chapter_history_ext(&conn, &extension_id, &book_id, &chapter_slug)
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn clear_reading_history_ext(
    pool: State<'_, DbPool>,
    extension_id: String,
    book_id: String,
) -> Result<(), String> {
    let conn = DbConn::get(&pool).map_err(|e| e.to_string())?;
    ReadingHistoryService::clear_history_ext(&conn, &extension_id, &book_id)
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_all_reading_history_ext(
    pool: State<'_, DbPool>,
) -> Result<Value, String> {
    let conn = DbConn::get(&pool).map_err(|e| e.to_string())?;
    let history = ReadingHistoryService::get_all_reading_history_ext(&conn)
        .map_err(|e| e.to_string())?;
    serde_json::to_value(history).map_err(|e| e.to_string())
}