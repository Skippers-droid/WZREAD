// src-tauri/src/services/reading_history_service.rs
use anyhow::Result;
use rusqlite::params;
use crate::db::DbConn;
use crate::models::{ChapterHistoryEntry, ReadingHistoryResponse};
use std::collections::HashMap;

pub struct ReadingHistoryService;

impl ReadingHistoryService {
    pub fn save_reading_history_ext(
        conn: &DbConn,
        extension_id: &str,
        book_id: &str,
        chapter_number: i64,
        chapter_slug: &str,
        title: Option<&str>,
        page_number: i64,
    ) -> Result<()> {
        let key = format!("{}_{}", extension_id, book_id);
        let current_history = Self::get_history_map_ext(conn, extension_id, book_id)?;
        
        let mut history = current_history;
        let entry_key = chapter_slug.to_string();
        
        let entry = ChapterHistoryEntry {
            chapter_number,
            chapter_slug: chapter_slug.to_string(),
            title: title.map(|s| s.to_string()),
            page_number,
            read_at: chrono::Utc::now().to_rfc3339(),
        };
        
        history.insert(entry_key, entry);
        
        let history_json = serde_json::to_string(&history)?;
        
        conn.conn().execute(
            r#"
            INSERT INTO reading_history_ext (extension_id, book_id, history, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(extension_id, book_id) DO UPDATE SET
                history = excluded.history,
                updated_at = CURRENT_TIMESTAMP
            "#,
            params![extension_id, book_id, history_json]
        )?;
        
        Ok(())
    }

    pub fn get_history_map_ext(
        conn: &DbConn,
        extension_id: &str,
        book_id: &str,
    ) -> Result<HashMap<String, ChapterHistoryEntry>> {
        let result = conn.conn().query_row(
            "SELECT history FROM reading_history_ext WHERE extension_id = ? AND book_id = ?",
            params![extension_id, book_id],
            |row| row.get::<_, String>(0)
        );

        match result {
            Ok(history_json) => {
                let history: HashMap<String, ChapterHistoryEntry> = serde_json::from_str(&history_json)
                    .map_err(|e| anyhow::anyhow!("Failed to parse history JSON: {}", e))?;
                Ok(history)
            }
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(HashMap::new()),
            Err(e) => Err(e.into()),
        }
    }

    pub fn get_reading_history_ext(
        conn: &DbConn,
        extension_id: &str,
        book_id: &str,
    ) -> Result<ReadingHistoryResponse> {
        let history_map = Self::get_history_map_ext(conn, extension_id, book_id)?;
        
        let mut entries: Vec<&ChapterHistoryEntry> = history_map.values().collect();
        entries.sort_by(|a, b| b.read_at.cmp(&a.read_at));
        
        let last_read = entries.first().cloned().cloned();
        let total_chapters = history_map.len();
        
        Ok(ReadingHistoryResponse {
            history: history_map,
            last_read,
            total_chapters,
        })
    }

    pub fn get_last_read_ext(
        conn: &DbConn,
        extension_id: &str,
        book_id: &str,
    ) -> Result<Option<ChapterHistoryEntry>> {
        let history_map = Self::get_history_map_ext(conn, extension_id, book_id)?;
        
        let mut entries: Vec<&ChapterHistoryEntry> = history_map.values().collect();
        entries.sort_by(|a, b| b.read_at.cmp(&a.read_at));
        
        Ok(entries.first().cloned().cloned())
    }

    pub fn get_chapter_history_ext(
        conn: &DbConn,
        extension_id: &str,
        book_id: &str,
        chapter_slug: &str,
    ) -> Result<Option<ChapterHistoryEntry>> {
        let history_map = Self::get_history_map_ext(conn, extension_id, book_id)?;
        Ok(history_map.get(chapter_slug).cloned())
    }

    pub fn delete_chapter_history_ext(
        conn: &DbConn,
        extension_id: &str,
        book_id: &str,
        chapter_slug: &str,
    ) -> Result<()> {
        let mut history_map = Self::get_history_map_ext(conn, extension_id, book_id)?;
        history_map.remove(chapter_slug);
        
        let history_json = serde_json::to_string(&history_map)?;
        
        conn.conn().execute(
            r#"
            UPDATE reading_history_ext SET 
                history = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE extension_id = ? AND book_id = ?
            "#,
            params![history_json, extension_id, book_id]
        )?;
        
        Ok(())
    }

    pub fn clear_history_ext(
        conn: &DbConn,
        extension_id: &str,
        book_id: &str,
    ) -> Result<()> {
        conn.conn().execute(
            "DELETE FROM reading_history_ext WHERE extension_id = ? AND book_id = ?",
            params![extension_id, book_id]
        )?;
        Ok(())
    }

    pub fn get_all_reading_history_ext(
        conn: &DbConn,
    ) -> Result<Vec<serde_json::Value>> {
        let mut stmt = conn.conn().prepare(
            "SELECT extension_id, book_id, history, updated_at FROM reading_history_ext ORDER BY updated_at DESC"
        )?;
        
        let rows = stmt.query_map([], |row| {
            let extension_id: String = row.get(0)?;
            let book_id: String = row.get(1)?;
            let history: String = row.get(2)?;
            let updated_at: String = row.get(3)?;
            
            let history_map: HashMap<String, ChapterHistoryEntry> = serde_json::from_str(&history)
                .map_err(|e| rusqlite::Error::FromSqlConversionFailure(0, rusqlite::types::Type::Text, Box::new(e)))?;
            let mut entries: Vec<&ChapterHistoryEntry> = history_map.values().collect();
            entries.sort_by(|a, b| b.read_at.cmp(&a.read_at));
            
            Ok(serde_json::json!({
                "extension_id": extension_id,
                "book_id": book_id,
                "last_read": entries.first().cloned(),
                "total_chapters": history_map.len(),
                "updated_at": updated_at,
            }))
        })?;
        
        let mut result = Vec::new();
        for row in rows {
            result.push(row?);
        }
        
        Ok(result)
    }
}