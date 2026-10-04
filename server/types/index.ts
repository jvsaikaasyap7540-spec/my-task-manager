export interface UserRecord {
  id: string;
  name: string;
  email: string;
  googleId?: string | null;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskCategory = 'Work' | 'Personal' | 'Learning' | 'Shopping' | 'Health' | 'Other';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface TaskRecord {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  startDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  dueTime: string | null; // HH:mm
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  deletedAt: string | null;
  pendingAlertSentAt: string | null;
}

export type ActivityAction =
  | 'CREATED'
  | 'UPDATED'
  | 'STATUS_CHANGED'
  | 'PRIORITY_CHANGED'
  | 'COMPLETED'
  | 'REOPENED'
  | 'DELETED';

export interface TaskActivityRecord {
  id: string;
  taskId: string;
  userId: string;
  action: ActivityAction;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  taskTitle?: string;
}

export interface DailySummaryRecord {
  id: string;
  userId: string;
  date: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number;
  createdAt: string;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  name: string;
}
