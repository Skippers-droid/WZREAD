use tauri::State;
use serde_json::Value;
use crate::db::DbPool;
use crate::db::DbConn;
use crate::services::SourceService;
use crate::services::SettingsService;
use crate::extension::ExtensionHandler;
use tracing::{info, error};

#[tauri::command(rename_all = "snake_case")]
pub async fn get_sources(pool: State<'_, DbPool>) -> Result<Value, String> {
    let conn = DbConn::get(&pool).map_err(|e| {
        error!("Failed to get DB connection: {}", e);
        e.to_string()
    })?;
    let sources = SourceService::get_all_sources(&conn).map_err(|e| {
        error!("Failed to get sources: {}", e);
        e.to_string()
    })?;
    serde_json::to_value(sources).map_err(|e| {
        error!("Failed to serialize sources: {}", e);
        e.to_string()
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_active_source(pool: State<'_, DbPool>) -> Result<Option<crate::models::Source>, String> {
    let conn = DbConn::get(&pool).map_err(|e| {
        error!("Failed to get DB connection: {}", e);
        e.to_string()
    })?;
    let source = SourceService::get_active_source(&conn).map_err(|e| {
        error!("Failed to get active source: {}", e);
        e.to_string()
    })?;
    Ok(source)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn save_source(
    pool: State<'_, DbPool>,
    source_name: String,
    source_link: Option<String>,
    is_active: bool,
) -> Result<Value, String> {
    info!("Saving source: {} ({:?})", source_name, source_link);
    
    let conn = DbConn::get(&pool).map_err(|e| {
        error!("Failed to get DB connection: {}", e);
        e.to_string()
    })?;

    let final_source_link = match source_link {
        Some(link) => link,
        None => {
            SettingsService::get_setting::<String>(&conn, "default_source")
                .map_err(|e| {
                    error!("Failed to get default source: {}", e);
                    e.to_string()
                })?
                .ok_or_else(|| "No default source found in settings".to_string())?
        }
    };

    let mut conn = DbConn::get(&pool).map_err(|e| {
        error!("Failed to get DB connection: {}", e);
        e.to_string()
    })?;
    
    let source = SourceService::save_source(&conn, &source_name, &final_source_link, is_active)
        .map_err(|e| {
            error!("Failed to save source: {}", e);
            e.to_string()
        })?;

    info!("Source saved with ID: {}", source.id);

    let handler = ExtensionHandler::new(final_source_link, pool.inner().clone());
    let extensions_result = handler.get_source_extensions().await
        .map_err(|e| {
            error!("Failed to get extensions from source: {}", e);
            e.to_string()
        })?;

    if let Some(extensions) = extensions_result.get("extensions").and_then(|v| v.as_array()) {
        let extensions_list: Vec<crate::models::ExtensionListItem> = serde_json::from_value(
            serde_json::to_value(extensions).map_err(|e| e.to_string())?
        ).map_err(|e| {
            error!("Failed to parse extensions: {}", e);
            e.to_string()
        })?;

        SourceService::save_loaded_extensions(&mut conn, source.id, &extensions_list)
            .map_err(|e| {
                error!("Failed to save loaded extensions: {}", e);
                e.to_string()
            })?;
        info!("Extensions saved successfully for source: {}", source.id);
    }

    serde_json::to_value(source).map_err(|e| {
        error!("Failed to serialize source: {}", e);
        e.to_string()
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn set_active_source(
    pool: State<'_, DbPool>,
    source_id: i64,
) -> Result<(), String> {
    info!("Setting active source to ID: {}", source_id);
    
    let conn = DbConn::get(&pool).map_err(|e| {
        error!("Failed to get DB connection: {}", e);
        e.to_string()
    })?;
    
    SourceService::set_active_source(&conn, source_id).map_err(|e| {
        error!("Failed to set active source: {}", e);
        e.to_string()
    })?;
    
    info!("Active source set to ID: {}", source_id);
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn delete_source(
    pool: State<'_, DbPool>,
    id: i64,
) -> Result<(), String> {
    info!("Deleting source ID: {}", id);
    
    let conn = DbConn::get(&pool).map_err(|e| {
        error!("Failed to get DB connection: {}", e);
        e.to_string()
    })?;
    
    SourceService::delete_source(&conn, id).map_err(|e| {
        error!("Failed to delete source: {}", e);
        e.to_string()
    })?;
    
    info!("Source ID {} deleted", id);
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_source_extensions(
    pool: State<'_, DbPool>,
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
    let result = handler.get_source_extensions().await.map_err(|e| {
        error!("Failed to get source extensions: {}", e);
        e.to_string()
    })?;

    Ok(result)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn set_active_extension(
    pool: State<'_, DbPool>,
    extension_id: String,
    is_active: bool,
) -> Result<(), String> {
    info!("Setting extension {} active: {}", extension_id, is_active);
    
    let mut conn = DbConn::get(&pool).map_err(|e| {
        error!("Failed to get DB connection: {}", e);
        e.to_string()
    })?;
    
    SourceService::set_active_extension(&mut conn, &extension_id, is_active)
        .map_err(|e| {
            error!("Failed to set active extension: {}", e);
            e.to_string()
        })?;
    
    info!("Extension {} active status set to: {}", extension_id, is_active);
    Ok(())
}