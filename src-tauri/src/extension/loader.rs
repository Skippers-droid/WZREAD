use anyhow::Result;
use reqwest;
use tracing::debug;
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
    let response = reqwest::get(source_path).await?;
    
    if !response.status().is_success() {
        return Err(anyhow::anyhow!("Failed to fetch manifest: {}", response.status()));
    }
    
    let manifest: Manifest = response.json().await?;
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
    
    let response = reqwest::get(url).await?;
    if !response.status().is_success() {
        return Err(anyhow::anyhow!("Failed to fetch executable: {}", response.status()));
    }
    
    let bytes = response.bytes().await?;
    let bytes_len = bytes.len();
    
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
        let manifest_id = e.name.to_lowercase().replace(' ', "");
        manifest_id == extension_id.to_lowercase()
    })
}