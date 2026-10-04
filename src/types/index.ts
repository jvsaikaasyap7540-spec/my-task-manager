export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskCategory = 'Work' | 'Personal' | 'Learning' | 'Shopping' | 'Health' | 'Other';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface Task {
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
}

export type ActivityAction =
  | 'CREATED'
  | 'UPDATED'
  | 'STATUS_CHANGED'
  | 'PRIORITY_CHANGED'
  | 'COMPLETED'
  | 'REOPENED'
  | 'DELETED';

export interface TaskActivity {
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

export interface DailySummary {
  id: string;
  userId: string;
  date: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface DayHistoryData {
  date: string;
  summary: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    completionRate: number;
    createdCount: number;
    completedCount: number;
    editedCount: number;
    deletedCount: number;
  };
  tasks: Task[];
  timeline: TaskActivity[];
}

export interface CalendarMonthDay {
  date: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number;
}

export interface AnalyticsData {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  dailyProductivity: Array<{ date: string; displayDate: string; completed: number; created: number }>;
  weeklyProductivity: Array<{ week: string; completed: number; total: number; rate: number }>;
  categoryBreakdown: Array<{ name: string; value: number }>;
  priorityBreakdown: Array<{ name: string; value: number }>;
}

export type ActiveTab = 'dashboard' | 'today' | 'calendar' | 'history' | 'analytics' | 'settings';
