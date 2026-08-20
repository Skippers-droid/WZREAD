use rusqlite::{Connection, Result};

pub fn run_migrations(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        r#"
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS source (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_name TEXT UNIQUE NOT NULL,
            source_link TEXT NOT NULL,
            source_cover TEXT,
            is_active INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS loaded_extension (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_id INTEGER NOT NULL,
            extension_name TEXT NOT NULL,
            extension_description TEXT,
            extension_id TEXT,
            is_active INTEGER DEFAULT 0,
            loaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (source_id) REFERENCES source(id) ON DELETE CASCADE,
            UNIQUE(source_id, extension_name)
        );

        CREATE TABLE IF NOT EXISTS comics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            extension_id TEXT NOT NULL,
            book_id TEXT NOT NULL,
            slug TEXT NOT NULL,
            title TEXT NOT NULL,
            alt_title TEXT,
            author TEXT,
            description TEXT,
            cover TEXT,
            status TEXT,
            type TEXT,
            favorite INTEGER DEFAULT 0,
            last_read TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(extension_id, book_id)
        );

        CREATE TABLE IF NOT EXISTS reading_history_ext (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            extension_id TEXT NOT NULL,
            book_id TEXT NOT NULL,
            history TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(extension_id, book_id)
        );

        CREATE TABLE IF NOT EXISTS reading_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            comic_id INTEGER NOT NULL,
            history TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE,
            UNIQUE(comic_id)
        );

        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE NOT NULL,
            value TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_source_name
            ON source(source_name);

        CREATE INDEX IF NOT EXISTS idx_source_is_active
            ON source(is_active);

        CREATE INDEX IF NOT EXISTS idx_loaded_extension_source_id
            ON loaded_extension(source_id);

        CREATE INDEX IF NOT EXISTS idx_loaded_extension_extension_id
            ON loaded_extension(extension_id);

        CREATE INDEX IF NOT EXISTS idx_loaded_extension_is_active
            ON loaded_extension(is_active);

        CREATE INDEX IF NOT EXISTS idx_comics_extension_id
            ON comics(extension_id);

        CREATE INDEX IF NOT EXISTS idx_comics_favorite
            ON comics(favorite);

        CREATE INDEX IF NOT EXISTS idx_reading_history_ext_extension_id
            ON reading_history_ext(extension_id);

        CREATE INDEX IF NOT EXISTS idx_reading_history_ext_book_id
            ON reading_history_ext(book_id);

        CREATE INDEX IF NOT EXISTS idx_reading_history_comic_id
            ON reading_history(comic_id);

        CREATE INDEX IF NOT EXISTS idx_settings_key
            ON settings(key);

        INSERT OR IGNORE INTO settings (key, value)
        VALUES
            (
                'user_agent',
                '"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"'
            ),
            (
                'default_source',
                '"https://raw.githubusercontent.com/Skippers-droid/wzread-extensions/refs/heads/main/bundled-extensions/wzread.mf.json"'
            );
        "#,
    )?;

    tracing::info!("Database migrations completed");

    Ok(())
}