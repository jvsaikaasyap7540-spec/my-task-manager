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
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users (googleId) WHERE googleId IS NOT NULL;
