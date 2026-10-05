import {
  Task,
  TaskActivity,
  User,
  DayHistoryData,
  CalendarMonthDay,
  AnalyticsData,
  TaskCategory,
  TaskPriority,
  TaskStatus,
} from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/+$/, '');

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('dayflow_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') ?? '';
  const rawText = await response.text();
  let data: any = null;

  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { message: rawText };
    }
  }

  if (!response.ok) {
    if (response.status === 404 && !contentType.includes('application/json')) {
      throw new Error('The DayFlow API could not be found. Set VITE_API_BASE_URL to your deployed API URL and redeploy the frontend.');
    }

    const message =
      data && typeof data === 'object' && 'message' in data
        ? String(data.message)
        : `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data as T;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(name: string, email: string, password: string): Promise<{ token: string; user: User }> {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },

  async loginWithGoogle(credential: string): Promise<{ token: string; user: User }> {
    return request('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    });
  },

  async getMe(): Promise<{ user: User }> {
    return request('/auth/me');
  },

  // Tasks
  async getTasks(params: {
    date?: string;
    status?: string;
    priority?: string;
    category?: string;
    search?: string;
    includeDeleted?: boolean;
  } = {}): Promise<{ tasks: Task[] }> {
    const searchParams = new URLSearchParams();
    if (params.date) searchParams.set('date', params.date);
    if (params.status) searchParams.set('status', params.status);
    if (params.priority) searchParams.set('priority', params.priority);
    if (params.category) searchParams.set('category', params.category);
    if (params.search) searchParams.set('search', params.search);
    if (params.includeDeleted) searchParams.set('includeDeleted', 'true');

    const queryStr = searchParams.toString();
    return request(`/tasks${queryStr ? `?${queryStr}` : ''}`);
  },

  async getTask(id: string): Promise<{ task: Task }> {
    return request(`/tasks/${id}`);
  },

  async createTask(input: {
    title: string;
    description?: string;
    category: TaskCategory;
    priority: TaskPriority;
    startDate: string;
    dueDate: string;
    dueTime?: string;
    status?: TaskStatus;
  }): Promise<{ task: Task; message: string }> {
    return request('/tasks', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async updateTask(
    id: string,
    input: {
      title?: string;
      description?: string;
      category?: TaskCategory;
      priority?: TaskPriority;
      status?: TaskStatus;
      startDate?: string;
      dueDate?: string;
      dueTime?: string;
    }
  ): Promise<{ task: Task; message: string }> {
    return request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  async deleteTask(id: string): Promise<{ task: Task; message: string }> {
    return request(`/tasks/${id}`, {
      method: 'DELETE',
    });
  },

  async completeTask(id: string): Promise<{ task: Task; message: string }> {
    return request(`/tasks/${id}/complete`, {
      method: 'PATCH',
    });
  },

  async reopenTask(id: string): Promise<{ task: Task; message: string }> {
    return request(`/tasks/${id}/reopen`, {
      method: 'PATCH',
    });
  },

  async getTaskHistory(id: string): Promise<{ activities: TaskActivity[] }> {
    return request(`/tasks/${id}/history`);
  },

  // Daily History
  async getHistoryDays(): Promise<{ days: Array<{ date: string; total: number; completed: number; rate: number }> }> {
    return request('/history');
  },

  async getHistoryByDate(date: string): Promise<DayHistoryData> {
    return request(`/history/${date}`);
  },

  // Calendar
  async getCalendarMonth(month: string): Promise<{ month: string; days: CalendarMonthDay[] }> {
    return request(`/calendar/${month}`);
  },

  // Analytics
  async getAnalytics(): Promise<{ analytics: AnalyticsData }> {
    return request('/analytics');
  },

  // Reset demo
  async resetDemoData(): Promise<{ message: string }> {
    return request('/seed/reset', {
      method: 'POST',
    });
  },
};
