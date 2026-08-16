use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LoadedExtension {
    pub id: i64,
    pub source_id: i64,
    pub extension_name: String,
    pub extension_description: Option<String>,
    pub extension_id: Option<String>,
    pub is_active: bool,
    pub loaded_at: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Manifest {
    pub extensions: Vec<ManifestExtension>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ManifestExtension {
    pub name: String,
    pub version: String,
    pub description: String,
    pub author: String,
    #[serde(default)]
    pub cover: Option<String>,
    #[serde(rename = "scriptPath")]
    #[serde(default)]
    pub script_path: Option<String>,
    #[serde(rename = "executable")]
    #[serde(default)]
    pub executable_path: Option<String>,
    #[serde(default)]
    pub icon: Option<String>,
    #[serde(default)]
    pub platform: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ExtensionInfo {
    pub name: String,
    pub version: String,
    pub description: String,
    pub author: String,
}

#[allow(dead_code)]
#[derive(Debug, Serialize, Deserialize)]
pub struct ExtensionSourceResult {
    pub success: bool,
    pub source_path: String,
    pub extensions: Vec<ExtensionListItem>,
    pub active_extension: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ExtensionListItem {
    pub name: String,
    pub id: String,
    pub version: String,
    pub description: String,
    pub author: String,
    pub cover: Option<String>,
    pub is_active: bool,
    pub is_loaded: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChapterImagesResult {
    pub images: Vec<String>,
    pub total: i64,
    pub page: i64,
    pub per_page: i64,
    pub has_more: bool,
}