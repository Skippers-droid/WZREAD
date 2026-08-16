use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChapterHistoryEntry {
    pub chapter_number: i64,
    pub chapter_slug: String,
    pub title: Option<String>,
    pub page_number: i64,
    pub read_at: String,
}
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ReadingHistoryResponse {
    pub history: HashMap<String, ChapterHistoryEntry>,
    pub last_read: Option<ChapterHistoryEntry>,
    pub total_chapters: usize,
}