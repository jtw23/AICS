PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'agent' CHECK(role IN ('admin','agent')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  content_masked TEXT NOT NULL,
  category TEXT,
  category_confidence REAL,
  tone TEXT NOT NULL DEFAULT '공식',
  summary TEXT,
  embedding BLOB,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inquiry_id INTEGER NOT NULL,
  variant INTEGER NOT NULL CHECK(variant IN (1,2,3)),
  content TEXT NOT NULL,
  selected INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (inquiry_id) REFERENCES inquiries(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assignees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT UNIQUE NOT NULL,
  user_id INTEGER,
  notion_database_id TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inquiry_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  channel TEXT NOT NULL DEFAULT 'in-app',
  message TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (inquiry_id) REFERENCES inquiries(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE VIRTUAL TABLE IF NOT EXISTS inquiries_fts
  USING fts5(content_masked, summary, content=inquiries, content_rowid=id);

CREATE TRIGGER IF NOT EXISTS inquiries_fts_insert
  AFTER INSERT ON inquiries BEGIN
    INSERT INTO inquiries_fts(rowid, content_masked, summary)
    VALUES (new.id, new.content_masked, new.summary);
  END;

CREATE TRIGGER IF NOT EXISTS inquiries_fts_update
  AFTER UPDATE ON inquiries BEGIN
    UPDATE inquiries_fts
    SET content_masked = new.content_masked, summary = new.summary
    WHERE rowid = new.id;
  END;

CREATE TRIGGER IF NOT EXISTS inquiries_fts_delete
  BEFORE DELETE ON inquiries BEGIN
    DELETE FROM inquiries_fts WHERE rowid = old.id;
  END;

INSERT OR IGNORE INTO assignees (category) VALUES
  ('결제'), ('배송'), ('환불'), ('기술지원'), ('계정'), ('기타');
