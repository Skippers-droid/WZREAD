use rusqlite::Connection;
use r2d2::{Pool, PooledConnection};
use r2d2_sqlite::SqliteConnectionManager;
use std::path::PathBuf;
use anyhow::Result;
use std::fs;

use super::migrations::run_migrations;

pub type DbPool = Pool<SqliteConnectionManager>;

pub struct DbConn(pub PooledConnection<SqliteConnectionManager>);

impl DbConn {
    pub fn get(pool: &DbPool) -> Result<Self> {
        Ok(Self(pool.get()?))
    }

    pub fn conn(&self) -> &Connection {
        &self.0
    }

    pub fn conn_mut(&mut self) -> &mut Connection {
        &mut self.0
    }
}

pub fn init_pool() -> Result<DbPool> {
    let db_path = get_db_path();
    
    if let Some(parent) = db_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)?;
        }
    }
    
    let manager = SqliteConnectionManager::file(&db_path);
    let pool = Pool::new(manager)?;
    
    let conn = pool.get()?;
    run_migrations(&conn)?;
    
    let default_source: Option<String> = conn.query_row(
        "SELECT value FROM settings WHERE key = 'default_source'",
        [],
        |row| row.get(0),
    ).ok();

    if let Some(default_source_json) = default_source {
        let default_source: String = serde_json::from_str(&default_source_json)?;
        conn.execute(
            "INSERT OR IGNORE INTO source
             (source_name, source_link, is_active)
             VALUES (?, ?, 1)",
            [
                "WZREAD Extensions",
                default_source.as_str(),
            ],
        )?;
    }
    
    let mut stmt = conn.prepare("SELECT key, value FROM settings")?;
    let rows = stmt.query_map([], |row| {
        let key: String = row.get(0)?;
        let value: String = row.get(1)?;
        Ok((key, value))
    })?;
    
    for row in rows {
        let (key, value) = row?;
        tracing::info!("Setting: {} = {}", key, value);
    }
    
    Ok(pool)
}

fn get_db_path() -> PathBuf {
    let app_data_dir = if cfg!(target_os = "windows") {
        let local_app_data = std::env::var("LOCALAPPDATA").unwrap_or_else(|_| ".".to_string());
        PathBuf::from(local_app_data).join("WZREAD")
    } else if cfg!(target_os = "macos") {
        let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
        PathBuf::from(home).join("Library/Application Support/WZREAD")
    } else {
        let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
        PathBuf::from(home).join(".local/share/wzread")
    };
    
    if !app_data_dir.exists() {
        let _ = fs::create_dir_all(&app_data_dir);
    }
    
    app_data_dir.join("data.db")
}