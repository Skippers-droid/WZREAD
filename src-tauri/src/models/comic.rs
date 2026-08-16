use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Comic {
    pub id: i64,
    pub extension_id: String,
    pub book_id: String,
    pub slug: String,
    pub title: String,
    pub alt_title: Option<String>,
    pub author: Option<String>,
    pub description: Option<String>,
    pub cover: Option<String>,
    pub status: Option<String>,
    pub type_: Option<String>,
    pub favorite: bool,
    pub last_read: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct SaveComicInput {
    pub extension_id: String,
    pub book_id: String,
    pub slug: String,
    pub title: String,
    pub alt_title: Option<String>,
    pub author: Option<String>,
    pub description: Option<String>,
    pub cover: Option<String>,
    pub status: Option<String>,
    pub type_: Option<String>,
    pub favorite: Option<bool>,
}