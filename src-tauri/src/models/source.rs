use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Source {
    pub id: i64,
    pub source_name: String,
    pub source_link: String,
    pub source_cover: Option<String>,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SourceWithExtensions {
    pub id: i64,
    pub source_name: String,
    pub source_link: String,
    pub source_cover: Option<String>,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
    pub loaded_extensions: Option<String>,
    pub loaded_extensions_active: Option<String>,
    pub loaded_extension_ids: Option<String>,
}