use anyhow::Result;
use std::path::PathBuf;
use tokio::fs;
// Remove: use crate::db::DbConn;

pub struct DownloadService;

impl DownloadService {
    pub fn get_download_dir() -> PathBuf {
        let app_dir = std::env::current_exe()
            .unwrap_or_default()
            .parent()
            .unwrap_or(std::path::Path::new("."))
            .to_path_buf();
        app_dir.join("downloads")
    }

    pub fn get_comic_dir(comic_title: &str) -> PathBuf {
        Self::get_download_dir().join(comic_title)
    }

    pub fn get_chapter_path(comic_title: &str, chapter_title: &str) -> PathBuf {
        let comic_dir = Self::get_comic_dir(comic_title);
        comic_dir.join(format!("{}.cbz", chapter_title))
    }

    pub async fn ensure_comic_dir(comic_title: &str) -> Result<()> {
        let comic_dir = Self::get_comic_dir(comic_title);
        if !comic_dir.exists() {
            fs::create_dir_all(&comic_dir).await?;
        }
        Ok(())
    }
}