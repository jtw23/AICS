import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

const DB_PATH = join(process.cwd(), 'data', 'aics.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    const { mkdirSync } = require('fs');
    mkdirSync(join(process.cwd(), 'data'), { recursive: true });
    db = new Database(DB_PATH);
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
    db.exec(schema);

    // 마이그레이션: discord_webhook → notion_database_id
    try {
      db.exec('ALTER TABLE assignees ADD COLUMN notion_database_id TEXT');
    } catch (_) {
      // 이미 존재하는 경우 무시
    }
    try {
      db.exec('ALTER TABLE assignees DROP COLUMN discord_webhook');
    } catch (_) {
      // 존재하지 않거나 이미 제거된 경우 무시
    }
  }
  return db;
}
