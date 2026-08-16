use anyhow::Result;
use rusqlite::params;
use crate::db::DbConn;
use crate::models::*;

pub struct ComicService;

impl ComicService {
    pub fn get_all_comics(conn: &DbConn) -> Result<Vec<Comic>> {
        let mut stmt = conn.conn().prepare(
            "SELECT * FROM comics ORDER BY created_at DESC"
        )?;

        let rows = stmt.query_map([], |row| {
            Ok(Comic {
                id: row.get(0)?,
                extension_id: row.get(1)?,
                book_id: row.get(2)?,
                slug: row.get(3)?,
                title: row.get(4)?,
                alt_title: row.get(5)?,
                author: row.get(6)?,
                description: row.get(7)?,
                cover: row.get(8)?,
                status: row.get(9)?,
                type_: row.get(10)?,
                favorite: row.get::<_, i64>(11)? == 1,
                last_read: row.get(12)?,
                created_at: row.get::<_, String>(13)?.parse().unwrap_or_default(),
                updated_at: row.get::<_, String>(14)?.parse().unwrap_or_default(),
            })
        })?;

        let mut comics = Vec::new();
        for row in rows {
            comics.push(row?);
        }

        Ok(comics)
    }

    pub fn get_comic(conn: &DbConn, extension_id: &str, book_id: &str) -> Result<Option<Comic>> {
        let mut stmt = conn.conn().prepare(
            "SELECT * FROM comics WHERE extension_id = ? AND book_id = ?"
        )?;

        let result = stmt.query_row([extension_id, book_id], |row| {
            Ok(Comic {
                id: row.get(0)?,
                extension_id: row.get(1)?,
                book_id: row.get(2)?,
                slug: row.get(3)?,
                title: row.get(4)?,
                alt_title: row.get(5)?,
                author: row.get(6)?,
                description: row.get(7)?,
                cover: row.get(8)?,
                status: row.get(9)?,
                type_: row.get(10)?,
                favorite: row.get::<_, i64>(11)? == 1,
                last_read: row.get(12)?,
                created_at: row.get::<_, String>(13)?.parse().unwrap_or_default(),
                updated_at: row.get::<_, String>(14)?.parse().unwrap_or_default(),
            })
        });

        match result {
            Ok(comic) => Ok(Some(comic)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.into()),
        }
    }

    pub fn save_comic(conn: &DbConn, input: SaveComicInput) -> Result<Comic> {
        let favorite = input.favorite.unwrap_or(false);
        conn.conn().execute(
            r#"
            INSERT INTO comics (
                extension_id, book_id, slug, title, alt_title, author, 
                description, cover, status, type, favorite
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(extension_id, book_id) DO UPDATE SET
                slug = excluded.slug,
                title = excluded.title,
                alt_title = excluded.alt_title,
                author = excluded.author,
                description = excluded.description,
                cover = excluded.cover,
                status = excluded.status,
                type = excluded.type,
                favorite = excluded.favorite,
                updated_at = CURRENT_TIMESTAMP
            "#,
            params![
                input.extension_id,
                input.book_id,
                input.slug,
                input.title,
                input.alt_title,
                input.author,
                input.description,
                input.cover,
                input.status,
                input.type_,
                if favorite { 1 } else { 0 }
            ]
        )?;

        let comic = Self::get_comic(conn, &input.extension_id, &input.book_id)?
            .ok_or_else(|| anyhow::anyhow!("Failed to retrieve saved comic"))?;

        Ok(comic)
    }

    pub fn toggle_favorite(conn: &DbConn, comic_id: i64) -> Result<bool> {
        let current: i64 = conn.conn().query_row(
            "SELECT favorite FROM comics WHERE id = ?",
            [comic_id],
            |row| row.get(0)
        )?;

        let new_favorite = if current == 1 { 0 } else { 1 };
        conn.conn().execute(
            "UPDATE comics SET favorite = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            params![new_favorite, comic_id]
        )?;

        Ok(new_favorite == 1)
    }

    pub fn update_last_read(conn: &DbConn, comic_id: i64, last_read_json: &str) -> Result<()> {
        conn.conn().execute(
            r#"
            UPDATE comics SET 
                last_read = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            "#,
            params![last_read_json, comic_id]
        )?;
        Ok(())
    }

    pub fn delete_comic(conn: &DbConn, comic_id: i64) -> Result<()> {
        conn.conn().execute(
            "DELETE FROM reading_history WHERE comic_id = ?",
            [comic_id]
        )?;
        conn.conn().execute(
            "DELETE FROM comics WHERE id = ?",
            [comic_id]
        )?;
        Ok(())
    }
}