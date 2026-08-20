use anyhow::Result;
use rusqlite::params;
use crate::db::DbConn;
use crate::models::*;

pub struct SourceService;

impl SourceService {
    pub fn get_all_sources(conn: &DbConn) -> Result<Vec<SourceWithExtensions>> {
        let mut stmt = conn.conn().prepare(
            r#"
            SELECT 
                s.id,
                s.source_name,
                s.source_link,
                s.source_cover,
                s.is_active,
                s.created_at,
                s.updated_at,
                GROUP_CONCAT(le.extension_name) as loaded_extensions,
                GROUP_CONCAT(le.is_active) as loaded_extensions_active,
                GROUP_CONCAT(le.extension_id) as loaded_extension_ids
            FROM source s
            LEFT JOIN loaded_extension le ON s.id = le.source_id
            GROUP BY s.id
            ORDER BY s.created_at DESC
            "#
        )?;

        let rows = stmt.query_map([], |row| {
            Ok(SourceWithExtensions {
                id: row.get(0)?,
                source_name: row.get(1)?,
                source_link: row.get(2)?,
                source_cover: row.get(3)?,
                is_active: row.get::<_, i64>(4)? == 1,
                created_at: row.get::<_, String>(5)?.parse().unwrap_or_default(),
                updated_at: row.get::<_, String>(6)?.parse().unwrap_or_default(),
                loaded_extensions: row.get(7)?,
                loaded_extensions_active: row.get(8)?,
                loaded_extension_ids: row.get(9)?,
            })
        })?;

        let mut sources = Vec::new();
        for row in rows {
            sources.push(row?);
        }

        Ok(sources)
    }

    pub fn get_active_source(conn: &DbConn) -> Result<Option<Source>> {
        let mut stmt = conn.conn().prepare(
            "SELECT * FROM source WHERE is_active = 1 LIMIT 1"
        )?;

        let result = stmt.query_row([], |row| {
            Ok(Source {
                id: row.get(0)?,
                source_name: row.get(1)?,
                source_link: row.get(2)?,
                source_cover: row.get(3)?,
                is_active: row.get::<_, i64>(4)? == 1,
                created_at: row.get::<_, String>(5)?.parse().unwrap_or_default(),
                updated_at: row.get::<_, String>(6)?.parse().unwrap_or_default(),
            })
        });

        match result {
            Ok(source) => Ok(Some(source)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.into()),
        }
    }

    pub fn save_source(
        conn: &DbConn,
        source_name: &str,
        source_link: &str,
        is_active: bool,
    ) -> Result<Source> {
        let mut stmt = conn.conn().prepare(
            "SELECT id FROM source WHERE source_name = ? OR source_link = ?"
        )?;

        let exists = stmt.exists(params![source_name, source_link])?;

        if exists {
            return Err(anyhow::anyhow!("Source already exists"));
        }

        conn.conn().execute(
            "INSERT INTO source (source_name, source_link, is_active) VALUES (?, ?, ?)",
            params![source_name, source_link, if is_active { 1 } else { 0 }]
        )?;

        let mut stmt = conn.conn().prepare(
            "SELECT * FROM source WHERE source_name = ?"
        )?;

        let source = stmt.query_row([source_name], |row| {
            Ok(Source {
                id: row.get(0)?,
                source_name: row.get(1)?,
                source_link: row.get(2)?,
                source_cover: row.get(3)?,
                is_active: row.get::<_, i64>(4)? == 1,
                created_at: row.get::<_, String>(5)?.parse().unwrap_or_default(),
                updated_at: row.get::<_, String>(6)?.parse().unwrap_or_default(),
            })
        })?;

        Ok(source)
    }

    pub fn set_active_source(conn: &DbConn, source_id: i64) -> Result<()> {
        conn.conn().execute(
            "UPDATE source SET is_active = 0 WHERE is_active = 1",
            []
        )?;

        conn.conn().execute(
            "UPDATE source SET is_active = 1 WHERE id = ?",
            [source_id]
        )?;

        Ok(())
    }

    pub fn delete_source(conn: &DbConn, id: i64) -> Result<()> {
        conn.conn().execute(
            "DELETE FROM loaded_extension WHERE source_id = ?",
            [id]
        )?;

        conn.conn().execute(
            "DELETE FROM source WHERE id = ?",
            [id]
        )?;

        Ok(())
    }

    pub fn get_active_extensions(conn: &DbConn) -> Result<Vec<LoadedExtension>> {
        let mut stmt = conn.conn().prepare(
            r#"
            SELECT le.* 
            FROM loaded_extension le
            JOIN source s ON le.source_id = s.id
            WHERE le.is_active = 1 AND s.is_active = 1
            "#
        )?;

        let rows = stmt.query_map([], |row| {
            Ok(LoadedExtension {
                id: row.get(0)?,
                source_id: row.get(1)?,
                extension_name: row.get(2)?,
                extension_description: row.get(3)?,
                extension_id: row.get(4)?,
                is_active: row.get::<_, i64>(5)? == 1,
                loaded_at: row.get::<_, String>(6)?.parse().unwrap_or_default(),
            })
        })?;

        let mut extensions = Vec::new();
        for row in rows {
            extensions.push(row?);
        }

        Ok(extensions)
    }

    pub fn set_active_extension(
        conn: &mut DbConn,
        extension_id: &str,
        is_active: bool,
    ) -> Result<()> {
        let source_id: i64 = conn.conn().query_row(
            "SELECT id FROM source WHERE is_active = 1 LIMIT 1",
            [],
            |row| row.get(0)
        )?;

        conn.conn().execute(
            "UPDATE loaded_extension SET is_active = ? WHERE source_id = ? AND extension_id = ?",
            params![if is_active { 1 } else { 0 }, source_id, extension_id]
        )?;

        Ok(())
    }

    pub fn save_loaded_extensions(
        conn: &mut DbConn,
        source_id: i64,
        extensions: &[ExtensionListItem],
    ) -> Result<()> {
        let tx = conn.conn_mut().transaction()?;
        
        {
            let mut stmt = tx.prepare(
                r#"
                INSERT INTO loaded_extension (
                    source_id,
                    extension_name,
                    extension_description,
                    extension_id,
                    is_active
                )
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(source_id, extension_name)
                DO UPDATE SET
                    extension_description = excluded.extension_description,
                    extension_id = excluded.extension_id,
                    is_active = excluded.is_active
                "#
            )?;

            for ext in extensions {
                stmt.execute(params![
                    source_id,
                    ext.name,
                    ext.description,
                    ext.id,
                    if ext.is_active { 1 } else { 0 }
                ])?;
            }
        }

        tx.commit()?;
        Ok(())
    }

    pub fn ensure_default_source(conn: &DbConn, default_link: &str) -> Result<crate::models::Source> {
        let existing = conn.conn().query_row(
            "SELECT id, source_name, source_link, source_cover, is_active, created_at, updated_at
             FROM source
             WHERE source_link = ?
             LIMIT 1",
            [default_link],
            |row| {
                Ok(crate::models::Source {
                    id: row.get(0)?,
                    source_name: row.get(1)?,
                    source_link: row.get(2)?,
                    source_cover: row.get(3)?,
                    is_active: row.get::<_, i64>(4)? == 1,
                    created_at: row.get::<_, String>(5)?.parse().unwrap_or_default(),
                    updated_at: row.get::<_, String>(6)?.parse().unwrap_or_default(),
                })
            },
        );

        match existing {
            Ok(source) => Ok(source),
            Err(rusqlite::Error::QueryReturnedNoRows) => {
                conn.conn().execute(
                    "INSERT INTO source
                     (source_name, source_link, is_active)
                     VALUES (?, ?, 1)",
                    [
                        "WZREAD Extensions",
                        default_link,
                    ],
                )?;

                let source = conn.conn().query_row(
                    "SELECT id, source_name, source_link, source_cover, is_active, created_at, updated_at
                     FROM source
                     WHERE source_link = ?
                     LIMIT 1",
                    [default_link],
                    |row| {
                        Ok(crate::models::Source {
                            id: row.get(0)?,
                            source_name: row.get(1)?,
                            source_link: row.get(2)?,
                            source_cover: row.get(3)?,
                            is_active: row.get::<_, i64>(4)? == 1,
                            created_at: row.get::<_, String>(5)?.parse().unwrap_or_default(),
                            updated_at: row.get::<_, String>(6)?.parse().unwrap_or_default(),
                        })
                    },
                )?;

                Ok(source)
            }
            Err(e) => Err(e.into()),
        }
    }
}