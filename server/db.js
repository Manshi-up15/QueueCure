import Database from 'better-sqlite3'
import { mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dbPath = process.env.DATABASE_PATH || join(__dirname, 'data', 'queuecure.db')

mkdirSync(dirname(dbPath), { recursive: true })

const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS queue_sessions (
    id TEXT PRIMARY KEY,
    current_token INTEGER NOT NULL DEFAULT 0,
    next_token INTEGER NOT NULL DEFAULT 1,
    avg_consult_min INTEGER NOT NULL DEFAULT 10,
    date TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES queue_sessions(id),
    token_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'waiting',
    registered_at TEXT NOT NULL,
    called_at TEXT,
    UNIQUE(session_id, token_number)
  );

  CREATE INDEX IF NOT EXISTS idx_patients_session_status
    ON patients(session_id, status, token_number);
`)

export default db
