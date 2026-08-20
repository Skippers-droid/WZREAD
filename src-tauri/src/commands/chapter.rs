use tauri::State;
use serde_json::Value;
use crate::db::DbPool;
use crate::db::DbConn;
use crate::models::DownloadChapterInput;
use crate::services::DownloadService;
use std::path::PathBuf;

#[tauri::command(rename_all = "snake_case")]
pub async fn get_cached_chapter_images(
    _pool: State<'_, DbPool>,
    input: DownloadChapterInput,
) -> Result<Value, String> {
    let chapter_title = match input.chapter_title.as_deref() {
        Some(title) => title.to_string(),
        None => format!("Chapter {}", input.chapter_number),
    };
    let cbz_path = DownloadService::get_chapter_path(&input.comic_title, &chapter_title);
    
    if cbz_path.exists() {
        let result = serde_json::json!({
            "success": true,
            "path": cbz_path.to_string_lossy(),
            "title": chapter_title,
            "comic_title": input.comic_title,
            "chapter_number": input.chapter_number,
            "cached": true,
        });
        return serde_json::to_value(&result).map_err(|e| e.to_string());
    }
    
    let result = serde_json::json!({
        "success": false,
        "cached": false,
        "message": "Chapter not cached locally",
    });
    
    serde_json::to_value(&result).map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn download_chapter(
    _pool: State<'_, DbPool>,
    input: DownloadChapterInput,
) -> Result<Value, String> {
    let conn = DbConn::get(&_pool).map_err(|e| e.to_string())?;
    
    let chapter_title = match input.chapter_title.as_deref() {
        Some(title) => title.to_string(),
        None => format!("Chapter {}", input.chapter_number),
    };
    
    let safe_comic_title = sanitize_path(&input.comic_title);
    let safe_chapter_title = sanitize_path(&chapter_title);
    
    DownloadService::ensure_comic_dir(&safe_comic_title).await.map_err(|e| e.to_string())?;
    
    let cbz_path = DownloadService::get_chapter_path(&safe_comic_title, &safe_chapter_title);
    
    if cbz_path.exists() {
        let result = serde_json::json!({
            "success": true,
            "path": cbz_path.to_string_lossy(),
            "title": chapter_title,
            "comic_title": input.comic_title,
            "chapter_number": input.chapter_number,
            "already_downloaded": true,
        });
        return serde_json::to_value(&result).map_err(|e| e.to_string());
    }
    
    let source = crate::services::SourceService::get_active_source(&conn)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Active source not found".to_string())?;
    
    let handler = crate::extension::ExtensionHandler::new(source.source_link, _pool.inner().clone());
    
    let images = handler.get_chapter_images_all(
        &input.extension_id,
        &input.book_id,
        &input.chapter_slug,
    ).await.map_err(|e| format!("Failed to fetch images: {}", e))?;
    
    if images.is_empty() {
        return Err("No images found for this chapter".to_string());
    }
    
    create_cbz(&cbz_path, &images, &chapter_title).await.map_err(|e| format!("Failed to create CBZ: {}", e))?;
    
    let result = serde_json::json!({
        "success": true,
        "path": cbz_path.to_string_lossy(),
        "title": chapter_title,
        "comic_title": input.comic_title,
        "chapter_number": input.chapter_number,
        "page_count": images.len(),
        "already_downloaded": false,
    });
    
    serde_json::to_value(&result).map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_chapter_download_status(
    _pool: State<'_, DbPool>,
    input: DownloadChapterInput,
) -> Result<Value, String> {
    let chapter_title = match input.chapter_title.as_deref() {
        Some(title) => title.to_string(),
        None => format!("Chapter {}", input.chapter_number),
    };
    let safe_comic_title = sanitize_path(&input.comic_title);
    let safe_chapter_title = sanitize_path(&chapter_title);
    let cbz_path = DownloadService::get_chapter_path(&safe_comic_title, &safe_chapter_title);
    
    let result = serde_json::json!({
        "downloaded": cbz_path.exists(),
        "chapter_number": input.chapter_number,
        "title": chapter_title,
    });
    
    serde_json::to_value(&result).map_err(|e| e.to_string())
}

fn sanitize_path(name: &str) -> String {
    let invalid_chars = ['<', '>', ':', '"', '/', '\\', '|', '?', '*'];
    let mut sanitized = name
        .chars()
        .filter(|c| !invalid_chars.contains(c))
        .collect::<String>();
    
    sanitized = sanitized.trim().to_string();
    
    if sanitized.is_empty() {
        sanitized = "untitled".to_string();
    }
    
    sanitized
        .replace(' ', "_")
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '_' || *c == '-')
        .collect()
}

async fn create_cbz(path: &PathBuf, images: &[String], _title: &str) -> Result<(), String> {
    use zip::write::FileOptions;
    use zip::ZipWriter;
    use std::io::Write;
    use reqwest;
    
    let file = std::fs::File::create(path).map_err(|e| e.to_string())?;
    let mut zip = ZipWriter::new(file);
    let options = FileOptions::default().compression_method(zip::CompressionMethod::Stored);
    
    for (index, url) in images.iter().enumerate() {
        let response = reqwest::get(url).await.map_err(|e| format!("Failed to fetch image {}: {}", index + 1, e))?;
        let bytes = response.bytes().await.map_err(|e| format!("Failed to read image {}: {}", index + 1, e))?;
        
        let extension = url.split('.').last().unwrap_or("jpg");
        let filename = format!("{:04}.{}", index + 1, extension);
        
        zip.start_file(filename, options).map_err(|e| format!("Failed to create file in zip: {}", e))?;
        zip.write_all(&bytes).map_err(|e| format!("Failed to write image to zip: {}", e))?;
    }
    
    zip.finish().map_err(|e| format!("Failed to finish zip: {}", e))?;
    Ok(())
}