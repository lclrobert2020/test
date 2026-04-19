import SqlJsModule, { type Database, type SqlJsStatic } from 'sql.js'
// sql.js is CJS — handle both default and namespace export shapes
const initSqlJs: (config?: { locateFile?: (file: string) => string }) => Promise<SqlJsStatic> =
  (SqlJsModule as unknown as { default: typeof SqlJsModule }).default ?? SqlJsModule

const DB_KEY = 'flowai_db'

let SQL: SqlJsStatic | null = null
let db: Database | null = null

const SCHEMA = `
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT DEFAULT '',
  sdlc_phase TEXT DEFAULT 'development', color TEXT DEFAULT '#E87040', created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sprints (
  id TEXT PRIMARY KEY, project_id TEXT NOT NULL, name TEXT NOT NULL, goal TEXT DEFAULT '',
  start_date TEXT, end_date TEXT, status TEXT DEFAULT 'planning'
);
CREATE TABLE IF NOT EXISTS issues (
  id TEXT PRIMARY KEY, project_id TEXT NOT NULL, sprint_id TEXT,
  type TEXT DEFAULT 'task', title TEXT NOT NULL, description TEXT DEFAULT '',
  status TEXT DEFAULT 'backlog', priority TEXT DEFAULT 'medium',
  assignee_id TEXT, story_points INTEGER DEFAULT 0,
  labels TEXT DEFAULT '', parent_id TEXT, created_at TEXT NOT NULL, order_index INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY, issue_id TEXT NOT NULL, author_id TEXT NOT NULL,
  content TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY, project_id TEXT NOT NULL, title TEXT NOT NULL,
  content TEXT DEFAULT '', parent_id TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT DEFAULT '',
  avatar TEXT DEFAULT '', role TEXT DEFAULT 'Developer'
);
CREATE TABLE IF NOT EXISTS ai_conversations (
  id TEXT PRIMARY KEY, project_id TEXT, messages TEXT DEFAULT '[]', created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY, value TEXT
);
`

async function loadFromIndexedDB(): Promise<Uint8Array | null> {
  return new Promise((resolve) => {
    const req = indexedDB.open('flowai', 1)
    req.onupgradeneeded = () => req.result.createObjectStore('data')
    req.onsuccess = () => {
      const tx = req.result.transaction('data', 'readonly')
      const store = tx.objectStore('data')
      const get = store.get(DB_KEY)
      get.onsuccess = () => resolve(get.result ? new Uint8Array(get.result) : null)
      get.onerror = () => resolve(null)
    }
    req.onerror = () => resolve(null)
  })
}

export async function saveDatabase(): Promise<void> {
  if (!db) return
  const data = db.export()
  const req = indexedDB.open('flowai', 1)
  req.onupgradeneeded = () => req.result.createObjectStore('data')
  req.onsuccess = () => {
    const tx = req.result.transaction('data', 'readwrite')
    tx.objectStore('data').put(data.buffer, DB_KEY)
  }
}

export async function initDatabase(): Promise<Database> {
  if (db) return db
  SQL = await initSqlJs({
    locateFile: () => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.wasm`,
  })
  const saved = await loadFromIndexedDB()
  db = saved ? new SQL.Database(saved) : new SQL.Database()
  db.run(SCHEMA)
  return db
}

export function getDb(): Database {
  if (!db) throw new Error('Database not initialized')
  return db
}

export function query<T = Record<string, unknown>>(sql: string, params: (string | number | null)[] = []): T[] {
  const d = getDb()
  const results = d.exec(sql, params)
  if (!results.length) return []
  const { columns, values } = results[0]
  return values.map(row =>
    Object.fromEntries(columns.map((col, i) => [col, row[i]]))
  ) as T[]
}

export function run(sql: string, params: (string | number | null)[] = []): void {
  getDb().run(sql, params)
  saveDatabase()
}

export function exportDb(): Uint8Array {
  return getDb().export()
}

export async function importDb(data: Uint8Array): Promise<void> {
  if (!SQL) throw new Error('SQL not initialized')
  if (db) db.close()
  db = new SQL.Database(data)
  db.run(SCHEMA)
  await saveDatabase()
}
