mod db;
mod models;
mod extension;
mod commands;
mod services;

use commands::chapter::{
    get_cached_chapter_images,
    download_chapter,
    get_download_status,
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

use commands::comic::{
    toggle_favorite,
    delete_comic,
};

use tauri::{Builder, generate_context};
use tracing_subscriber;
use std::fs::File;
use std::path::PathBuf;

pub fn run() {
    let log_dir = get_log_dir();
    let _ = std::fs::create_dir_all(&log_dir);
    
    let log_file = log_dir.join("wzreadrust.log");
    let file = File::create(&log_file).expect("Failed to create log file");
    
    let subscriber = tracing_subscriber::fmt()
        .with_max_level(tracing::Level::DEBUG)
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
            commands::source::get_sources,
            commands::source::get_active_source,
            commands::source::save_source,
            commands::source::set_active_source,
            commands::source::delete_source,
            commands::source::get_source_extensions,
            commands::source::set_active_extension,
            commands::extension::search_extensions,
            commands::extension::get_manga_info,
            commands::extension::get_chapter_images,
            commands::comic::get_all_comics,
            commands::comic::save_comic,
            commands::comic::get_comic,
            toggle_favorite,
            delete_comic,
            get_cached_chapter_images,
            download_chapter,
            get_download_status,
            save_reading_history_ext,
            get_reading_history_ext,
            get_last_read_ext,
            get_chapter_history_ext,
            delete_chapter_history_ext,
            clear_reading_history_ext,
            get_all_reading_history_ext,
            commands::settings::get_settings,
            commands::settings::save_settings,
            commands::settings::get_user_agents,
            commands::settings::save_user_agents,
            commands::settings::get_setting,
            commands::settings::set_setting,
        ])
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