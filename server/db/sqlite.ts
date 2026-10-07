import initSqlJs, { Database as SqlDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { DatabaseAdapter } from './database.ts';

let database: SqlDatabase | null = null;
const databasePath = path.resolve(process.env.DATABASE_PATH || 'database/dayflow.sqlite');

const schema = `
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
`;

function persistDatabase(): void {
  if (!database) return;
  fs.writeFileSync(databasePath, Buffer.from(database.export()));
}

export async function initializeSqlite(): Promise<DatabaseAdapter> {
  if (!database) {
    const directory = path.dirname(databasePath);
    fs.mkdirSync(directory, { recursive: true });

    const SQL = await initSqlJs();
    if (fs.existsSync(databasePath)) {
      database = new SQL.Database(fs.readFileSync(databasePath));
    } else {
      database = new SQL.Database();
    }

    database.run(schema);

    const taskColumns = database.exec('PRAGMA table_info(tasks);')[0]?.values ?? [];
    const existingTaskColumns = new Set(taskColumns.map((column) => String(column[1])));
    if (!existingTaskColumns.has('startDate')) {
      database.run('ALTER TABLE tasks ADD COLUMN startDate TEXT');
      database.run('UPDATE tasks SET startDate = dueDate WHERE startDate IS NULL');
    }
    if (!existingTaskColumns.has('pendingAlertSentAt')) {
      database.run('ALTER TABLE tasks ADD COLUMN pendingAlertSentAt TEXT');
    }

    const userColumns = database.exec('PRAGMA table_info(users);')[0]?.values ?? [];
    const existingUserColumns = new Set(userColumns.map((column) => String(column[1])));
    if (!existingUserColumns.has('googleId')) {
      database.run('ALTER TABLE users ADD COLUMN googleId TEXT');
    }
    database.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users (googleId) WHERE googleId IS NOT NULL');
    persistDatabase();
  }

  const adapter: DatabaseAdapter = {
    async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
      if (!database) throw new Error('SQLite database has not been initialized');
      const statement = database.prepare(sql);
      try {
        if (params.length) statement.bind(params as (string | number | null)[]);
        const results: T[] = [];
        while (statement.step()) results.push(statement.getAsObject() as T);
        return results;
      } finally {
        statement.free();
      }
    },
    async queryOne<T>(sql: string, params: unknown[] = []): Promise<T | null> {
      const rows = await adapter.query<T>(sql, params);
      return rows[0] ?? null;
    },
    async execute(sql: string, params: unknown[] = []): Promise<void> {
      if (!database) throw new Error('SQLite database has not been initialized');
      database.run(sql, params as (string | number | null)[]);
      persistDatabase();
    },
  };
  return adapter;
}
