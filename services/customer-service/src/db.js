import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS customers (
     id            INTEGER PRIMARY KEY AUTOINCREMENT,
     name          TEXT    NOT NULL,
     email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
     password_hash TEXT    NOT NULL,
     created_at    TEXT    NOT NULL,
     updated_at    TEXT    NOT NULL
   )`,
];

/**
 * Open (or create) the SQLite database and apply the schema.
 * Uses Node's built-in `node:sqlite`, so there are no native add-ons to compile.
 */
export function openDatabase(path) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  for (const sql of MIGRATIONS) db.exec(sql);
  return db;
}
