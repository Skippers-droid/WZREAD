use tauri::State;
use serde_json::Value;
use crate::db::DbPool;
use crate::db::DbConn;
use crate::services::ComicService;
use crate::models::SaveComicInput;

#[tauri::command(rename_all = "snake_case")]
pub async fn get_all_comics(
    pool: State<'_, DbPool>,
) -> Result<Value, String> {
    let conn = DbConn::get(&pool).map_err(|e| e.to_string())?;
    let comics = ComicService::get_all_comics(&conn).map_err(|e| e.to_string())?;
    serde_json::to_value(comics).map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn save_comic(
    pool: State<'_, DbPool>,
    input: SaveComicInput,
) -> Result<Value, String> {
    let conn = DbConn::get(&pool).map_err(|e| e.to_string())?;
    let comic = ComicService::save_comic(&conn, input).map_err(|e| e.to_string())?;
    serde_json::to_value(comic).map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_comic(
    pool: State<'_, DbPool>,
    extension_id: String,
    book_id: String,
) -> Result<Value, String> {
    let conn = DbConn::get(&pool).map_err(|e| e.to_string())?;
    let comic = ComicService::get_comic(&conn, &extension_id, &book_id)
        .map_err(|e| e.to_string())?;
    serde_json::to_value(comic).map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn toggle_favorite(
    pool: State<'_, DbPool>,
    comic_id: i64,
) -> Result<Value, String> {
    let conn = DbConn::get(&pool).map_err(|e| e.to_string())?;
    let is_favorite = ComicService::toggle_favorite(&conn, comic_id)
        .map_err(|e| e.to_string())?;
    serde_json::to_value(&serde_json::json!({
        "comic_id": comic_id,
        "is_favorite": is_favorite
    })).map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn delete_comic(
    pool: State<'_, DbPool>,
    comic_id: i64,
) -> Result<(), String> {
    let conn = DbConn::get(&pool).map_err(|e| e.to_string())?;
    ComicService::delete_comic(&conn, comic_id)
        .map_err(|e| e.to_string())?;
    Ok(())
}