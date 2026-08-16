use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DownloadChapterInput {
    pub extension_id: String,
    pub source_link: String,
    pub book_id: String,
    pub chapter_number: i64,
    pub chapter_slug: String,
    pub chapter_title: Option<String>,
    pub comic_title: String,
    pub comic_id: i64,
}