mod db;
mod models;
mod extension;
mod commands;
mod services;

use commands::source::{
    get_sources,
    get_active_source,
    save_source,
    set_active_source,
    delete_source,
    get_source_extensions,
    set_active_extension,
};
use commands::extension::{
    search_extensions,
    get_manga_info,
    get_chapter_images,
    download_extension,
    get_extension_download_status,
};
use commands::comic::{
    get_all_comics,
    save_comic,
    get_comic,
    toggle_favorite,
    delete_comic,
};
use commands::chapter::{
    get_cached_chapter_images,
    download_chapter,
    get_chapter_download_status,
};
use commands::history::{
    save_reading_history_ext,
    get_reading_history_ext,
    get_last_read_ext,
    get_chapter_history_ext,
    delete_chapter_history_ext,
    clear_reading_history_ext,
    get_all_reading_history_ext,
};
use commands::settings::{
    get_settings,
    save_settings,
    get_user_agents,
    save_user_agents,
    get_setting,
    set_setting,
};

use tauri::{Builder, generate_context, Manager};
use tracing_subscriber;
use std::fs::File;
use std::path::PathBuf;
use extension::set_app_handle;

pub fn run() {
    let log_dir = get_log_dir();
    let _ = std::fs::create_dir_all(&log_dir);
    
    let log_file = log_dir.join("wzreadrust.log");
    let file = File::create(&log_file).expect("Failed to create log file");
    
    let subscriber = tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .with_target(false)
        .with_thread_ids(true)
        .with_thread_names(true)
        .with_writer(file)
        .finish();
    
    let _ = tracing::subscriber::set_global_default(subscriber);

    tracing::info!("Starting WzReadRust application");
    tracing::info!("Log file located at: {:?}", log_file);

    let pool = match db::init_pool() {
        Ok(p) => p,
        Err(e) => {
            tracing::error!("Failed to initialize database: {}", e);
            panic!("Failed to initialize database: {}", e);
        }
    };

    Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(pool)
        .invoke_handler(tauri::generate_handler![
            get_sources,
            get_active_source,
            save_source,
            set_active_source,
            delete_source,
            get_source_extensions,
            set_active_extension,
            search_extensions,
            get_manga_info,
            get_chapter_images,
            download_extension,
            get_extension_download_status,
            get_all_comics,
            save_comic,
            get_comic,
            toggle_favorite,
            delete_comic,
            get_cached_chapter_images,
            download_chapter,
            get_chapter_download_status,
            save_reading_history_ext,
            get_reading_history_ext,
            get_last_read_ext,
            get_chapter_history_ext,
            delete_chapter_history_ext,
            clear_reading_history_ext,
            get_all_reading_history_ext,
            get_settings,
            save_settings,
            get_user_agents,
            save_user_agents,
            get_setting,
            set_setting,
        ])
        .setup(|app| {
            let app_handle = app.handle().clone();
            set_app_handle(app_handle);
            Ok(())
        })
        .run(generate_context!())
        .expect("error while running tauri application");
}

fn get_log_dir() -> PathBuf {
    let app_dir = std::env::current_exe()
        .unwrap_or_default()
        .parent()
        .unwrap_or(std::path::Path::new("."))
        .to_path_buf();
    
    app_dir.join("logs")
}