import initSqlJs, { Database as SqlDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';

let dbInstance: SqlDatabase | null = null;
const dbDir = path.resolve(process.cwd(), 'database');
const dbPath = path.join(dbDir, 'dayflow.sqlite');

export async function getDb(): Promise<SqlDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    dbInstance = new SQL.Database(fileBuffer);
  } else {
    dbInstance = new SQL.Database();
  }

  // Initialize SQLite tables if not present
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      googleId TEXT,
      passwordHash TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL DEFAULT 'Work',
      priority TEXT NOT NULL DEFAULT 'MEDIUM',
      status TEXT NOT NULL DEFAULT 'PENDING',
      startDate TEXT,
      dueDate TEXT NOT NULL,
      dueTime TEXT,
      pendingAlertSentAt TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      completedAt TEXT,
      deletedAt TEXT,
      FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS task_activities (
      id TEXT PRIMARY KEY,
      taskId TEXT NOT NULL,
      userId TEXT NOT NULL,
      action TEXT NOT NULL,
      field TEXT,
      oldValue TEXT,
      newValue TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (taskId) REFERENCES tasks (id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS daily_summaries (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      date TEXT NOT NULL,
      totalTasks INTEGER NOT NULL DEFAULT 0,
      completedTasks INTEGER NOT NULL DEFAULT 0,
      pendingTasks INTEGER NOT NULL DEFAULT 0,
      completionRate REAL NOT NULL DEFAULT 0.0,
      createdAt TEXT NOT NULL,
      UNIQUE(userId, date),
      FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON tasks (userId, dueDate);
    CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks (userId, status);
    CREATE INDEX IF NOT EXISTS idx_tasks_deleted ON tasks (userId, deletedAt);
    CREATE INDEX IF NOT EXISTS idx_activities_task ON task_activities (taskId);
    CREATE INDEX IF NOT EXISTS idx_activities_user_created ON task_activities (userId, createdAt);
  `);

  const taskColumns = dbInstance.exec('PRAGMA table_info(tasks);')[0]?.values ?? [];
  const existingColumns = new Set(taskColumns.map((column) => String(column[1])));
  if (!existingColumns.has('startDate')) {
    dbInstance.run('ALTER TABLE tasks ADD COLUMN startDate TEXT');
    dbInstance.run('UPDATE tasks SET startDate = dueDate WHERE startDate IS NULL');
  }
  if (!existingColumns.has('pendingAlertSentAt')) {
    dbInstance.run('ALTER TABLE tasks ADD COLUMN pendingAlertSentAt TEXT');
  }

  const userColumns = dbInstance.exec('PRAGMA table_info(users);')[0]?.values ?? [];
  const existingUserColumns = new Set(userColumns.map((column) => String(column[1])));
  if (!existingUserColumns.has('googleId')) {
    dbInstance.run('ALTER TABLE users ADD COLUMN googleId TEXT');
  }
  dbInstance.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users (googleId) WHERE googleId IS NOT NULL');

  persistDb();
  return dbInstance;
}

export function persistDb(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  } catch (err) {
    console.error('Failed to persist database to file:', err);
  }
}

export async function query<T = any>(sqlStr: string, params: any[] = []): Promise<T[]> {
  const db = await getDb();
  const stmt = db.prepare(sqlStr);
  if (params && params.length > 0) {
    stmt.bind(params);
  }
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as unknown as T);
  }
  stmt.free();
  return results;
}

export async function queryOne<T = any>(sqlStr: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(sqlStr, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function execute(sqlStr: string, params: any[] = []): Promise<void> {
  const db = await getDb();
  if (params && params.length > 0) {
    db.run(sqlStr, params);
  } else {
    db.run(sqlStr);
  }
  persistDb();
}
