use tauri::State;
use serde_json::Value;
use crate::db::DbPool;
use crate::db::DbConn;
use crate::services::SettingsService;
use crate::models::UserSettings;

#[tauri::command(rename_all = "snake_case")]
pub async fn get_settings(
    pool: State<'_, DbPool>,
) -> Result<Value, String> {
    let conn = DbConn::get(&pool).map_err(|e| e.to_string())?;
    let settings = SettingsService::get_user_settings(&conn).map_err(|e| e.to_string())?;
    serde_json::to_value(&settings).map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn save_settings(
    pool: State<'_, DbPool>,
    settings: UserSettings,
) -> Result<(), String> {
    let conn = DbConn::get(&pool).map_err(|e| e.to_string())?;
    SettingsService::save_user_settings(&conn, &settings).map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_user_agents(
    pool: State<'_, DbPool>,
) -> Result<Value, String> {
    let conn = DbConn::get(&pool).map_err(|e| e.to_string())?;
    let agents = SettingsService::get_user_agents(&conn).map_err(|e| e.to_string())?;
    serde_json::to_value(&agents).map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn save_user_agents(
    pool: State<'_, DbPool>,
    user_agents: Vec<String>,
) -> Result<(), String> {
    let conn = DbConn::get(&pool).map_err(|e| e.to_string())?;
    SettingsService::save_user_agents(&conn, &user_agents).map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_setting(
    pool: State<'_, DbPool>,
    key: String,
) -> Result<Value, String> {
    let conn = DbConn::get(&pool).map_err(|e| e.to_string())?;
    let value = SettingsService::get_setting::<Value>(&conn, &key).map_err(|e| e.to_string())?;
    serde_json::to_value(&value).map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn set_setting(
    pool: State<'_, DbPool>,
    key: String,
    value: Value,
) -> Result<(), String> {
    let conn = DbConn::get(&pool).map_err(|e| e.to_string())?;
    SettingsService::set_setting(&conn, &key, &value).map_err(|e| e.to_string())
}