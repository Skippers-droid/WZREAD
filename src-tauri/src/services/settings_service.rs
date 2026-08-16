use anyhow::Result;
use rusqlite::params;
use serde_json::Value;
use crate::db::DbConn;
use crate::models::{UserSettings};

pub struct SettingsService;

impl SettingsService {
    pub fn get_user_settings(conn: &DbConn) -> Result<UserSettings> {
        let mut stmt = conn.conn().prepare(
            "SELECT key, value FROM settings WHERE key LIKE 'user_%'"
        )?;

        let rows = stmt.query_map([], |row| {
            let key: String = row.get(0)?;
            let value: String = row.get(1)?;
            Ok((key, value))
        })?;

        let mut settings = UserSettings::default();

        for row in rows {
            let (key, value) = row?;
            match key.as_str() {
                "user_agents" => {
                    if let Ok(agents) = serde_json::from_str::<Vec<String>>(&value) {
                        settings.user_agents = agents;
                    }
                }
                _ => {
                    if let Ok(json_val) = serde_json::from_str::<Value>(&value) {
                        settings.extra.insert(key, json_val);
                    }
                }
            }
        }

        Ok(settings)
    }

    pub fn save_user_settings(conn: &DbConn, settings: &UserSettings) -> Result<()> {
        let value = serde_json::to_string(&settings.user_agents)?;
        
        conn.conn().execute(
            r#"
            INSERT INTO settings (key, value) 
            VALUES ('user_agents', ?) 
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
            "#,
            [&value]
        )?;

        for (key, value) in &settings.extra {
            let value_str = serde_json::to_string(value)?;
            conn.conn().execute(
                r#"
                INSERT INTO settings (key, value) 
                VALUES (?, ?) 
                ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
                "#,
                params![key, value_str]
            )?;
        }

        Ok(())
    }

    pub fn get_user_agents(conn: &DbConn) -> Result<Vec<String>> {
        let result = conn.conn().query_row(
            "SELECT value FROM settings WHERE key = 'user_agents'",
            [],
            |row| row.get::<_, String>(0)
        );

        match result {
            Ok(value) => {
                serde_json::from_str::<Vec<String>>(&value)
                    .map_err(|e| anyhow::anyhow!(e))
            }
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(Vec::new()),
            Err(e) => Err(e.into()),
        }
    }

    pub fn save_user_agents(conn: &DbConn, user_agents: &[String]) -> Result<()> {
        let value = serde_json::to_string(user_agents)?;
        
        conn.conn().execute(
            r#"
            INSERT INTO settings (key, value) 
            VALUES ('user_agents', ?) 
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
            "#,
            [&value]
        )?;

        Ok(())
    }

    pub fn set_setting<T: serde::Serialize>(
        conn: &DbConn,
        key: &str,
        value: &T,
    ) -> Result<()> {
        let value_str = serde_json::to_string(value)?;
        
        conn.conn().execute(
            r#"
            INSERT INTO settings (key, value) 
            VALUES (?, ?) 
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
            "#,
            params![key, value_str]
        )?;

        Ok(())
    }

    pub fn get_setting<T: serde::de::DeserializeOwned>(
        conn: &DbConn,
        key: &str,
    ) -> Result<Option<T>> {
        let result = conn.conn().query_row(
            "SELECT value FROM settings WHERE key = ?",
            [key],
            |row| row.get::<_, String>(0)
        );

        match result {
            Ok(value) => {
                let parsed: T = serde_json::from_str(&value)?;
                Ok(Some(parsed))
            }
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.into()),
        }
    }
}