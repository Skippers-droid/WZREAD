use rusqlite::Connection;
use r2d2::{Pool, PooledConnection};
use r2d2_sqlite::SqliteConnectionManager;
use std::path::PathBuf;
use anyhow::Result;

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
    let manager = SqliteConnectionManager::file(db_path);
    let pool = Pool::new(manager)?;
    
    let conn = pool.get()?;
    run_migrations(&conn)?;
    
    Ok(pool)
}

fn get_db_path() -> PathBuf {
    let app_dir = std::env::current_exe()
        .unwrap_or_default()
        .parent()
        .unwrap_or(std::path::Path::new("."))
        .to_path_buf();
    
    app_dir.join("data.db")
}