use anyhow::Result;
use reqwest;
use tracing::{debug, error};
use std::path::PathBuf;
use tokio::fs;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use once_cell::sync::Lazy;
use crate::models::{Manifest, ManifestExtension};

static DOWNLOAD_LOCKS: Lazy<Arc<Mutex<HashMap<String, Arc<Mutex<()>>>>>> = Lazy::new(|| {
    Arc::new(Mutex::new(HashMap::new()))
});

pub async fn fetch_manifest(source_path: &str) -> Result<Manifest> {
    debug!("Fetching manifest from: {}", source_path);
    
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| anyhow::anyhow!("Failed to build client: {}", e))?;
    
    let response = client.get(source_path)
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| anyhow::anyhow!("Failed to fetch manifest: {}", e))?;
    
    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        error!("Manifest fetch failed: {} - {}", status, text);
        return Err(anyhow::anyhow!("Failed to fetch manifest: {} - {}", status, text));
    }
    
    let text = response.text().await?;
    
    if !text.trim_start().starts_with('{') {
        error!("Manifest response is not JSON: {}", &text[..text.len().min(200)]);
        return Err(anyhow::anyhow!("Manifest is not valid JSON (got HTML or plain text)"));
    }
    
    let manifest: Manifest = serde_json::from_str(&text)
        .map_err(|e| anyhow::anyhow!("Failed to parse manifest JSON: {}", e))?;
    
    Ok(manifest)
}

pub async fn fetch_extension_executable(url: &str, dest_path: &PathBuf) -> Result<()> {
    let key = url.to_string();
    
    let lock = {
        let mut locks = DOWNLOAD_LOCKS.lock().await;
        locks.entry(key.clone())
            .or_insert_with(|| Arc::new(Mutex::new(())))
            .clone()
    };

    let _guard = lock.lock().await;

    if dest_path.exists() {
        debug!("Executable already exists at {:?}, skipping download", dest_path);
        return Ok(());
    }

    debug!("Fetching executable from URL: {} to {:?}", url, dest_path);
    
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| anyhow::anyhow!("Failed to build client: {}", e))?;
    
    let response = client.get(url)
        .send()
        .await
        .map_err(|e| anyhow::anyhow!("Failed to fetch executable: {}", e))?;
    
    if !response.status().is_success() {
        return Err(anyhow::anyhow!("Failed to fetch executable: {}", response.status()));
    }
    
    let bytes = response.bytes().await?;
    let bytes_len = bytes.len();
    
    if bytes_len < 100 {
        let text = String::from_utf8_lossy(&bytes);
        if text.contains("<!DOCTYPE") || text.contains("<html") {
            return Err(anyhow::anyhow!("Got HTML instead of executable binary"));
        }
    }
    
    if let Some(parent) = dest_path.parent() {
        if !parent.exists() {
            tokio::fs::create_dir_all(parent).await?;
        }
    }
    
    fs::write(dest_path, &bytes).await?;
    debug!("Downloaded {} bytes to {:?}", bytes_len, dest_path);
    Ok(())
}

pub fn find_extension_in_manifest<'a>(
    manifest: &'a Manifest,
    extension_id: &str,
) -> Option<&'a ManifestExtension> {
    manifest.extensions.iter().find(|e| {
        e.id == extension_id
    })
}