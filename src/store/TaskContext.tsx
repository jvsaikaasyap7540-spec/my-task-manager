import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Task, ActiveTab, TaskPriority, TaskCategory, TaskStatus } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { getLocalDateString } from '../utils/date';

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'info' | 'error' | 'warning';
}

interface TaskContextType {
  currentDate: string;
  setCurrentDate: (date: string) => void;
  todayDate: string;
  tasks: Task[];
  allTasks: Task[];
  taskRevision: number;
  loading: boolean;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  priorityFilter: string;
  setPriorityFilter: (priority: string) => void;
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
  
  // Modals & Drawers
  isAddTaskOpen: boolean;
  setIsAddTaskOpen: (open: boolean) => void;
  taskToEdit: Task | null;
  setTaskToEdit: (task: Task | null) => void;
  taskToDelete: Task | null;
  setTaskToDelete: (task: Task | null) => void;
  selectedTaskForHistory: Task | null;
  setSelectedTaskForHistory: (task: Task | null) => void;

  // Actions
  refreshTasks: () => Promise<void>;
  createTask: (data: {
    title: string;
    description?: string;
    category: TaskCategory;
    priority: TaskPriority;
    startDate: string;
    dueDate: string;
    dueTime?: string;
    status?: TaskStatus;
  }) => Promise<void>;
  updateTask: (
    id: string,
    data: {
      title?: string;
      description?: string;
      category?: TaskCategory;
      priority?: TaskPriority;
      status?: TaskStatus;
      startDate?: string;
      dueDate?: string;
      dueTime?: string;
    }
  ) => Promise<void>;
  toggleTaskStatus: (task: Task) => Promise<void>;
  confirmDeleteTask: (id: string) => Promise<void>;

  // Theme & Toasts
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  toasts: ToastMessage[];
  addToast: (title: string, message?: string, type?: 'success' | 'info' | 'error' | 'warning') => void;
  removeToast: (id: string) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [todayDate, setTodayDate] = useState<string>(() => getLocalDateString());
  const [currentDate, setCurrentDate] = useState<string>(() => getLocalDateString());
  const previousTodayRef = useRef(todayDate);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [taskRevision, setTaskRevision] = useState(0);
  const [tasksUserId, setTasksUserId] = useState<string | null>(null);
  const latestFetchId = useRef(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modals & Drawers
  const [isAddTaskOpen, setIsAddTaskOpen] = useState<boolean>(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [selectedTaskForHistory, setSelectedTaskForHistory] = useState<Task | null>(null);

  // Theme
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('dayflow_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'dark'; // Default sleek dark mode
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('dayflow_theme', theme);
  }, [theme]);

  useEffect(() => {
    const refreshToday = () => {
      const nextToday = getLocalDateString();
      const previousToday = previousTodayRef.current;
      if (nextToday === previousToday) return;

      previousTodayRef.current = nextToday;
      setTodayDate(nextToday);
      setCurrentDate((previousCurrentDate) =>
        previousCurrentDate === previousToday ? nextToday : previousCurrentDate
      );
    };

    const intervalId = window.setInterval(refreshToday, 60_000);
    window.addEventListener('focus', refreshToday);
    document.addEventListener('visibilitychange', refreshToday);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshToday);
      document.removeEventListener('visibilitychange', refreshToday);
    };
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const addToast = useCallback((title: string, message?: string, type: 'success' | 'info' | 'error' | 'warning' = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const fetchTasks = useCallback(async () => {
    const fetchId = ++latestFetchId.current;
    if (!user) {
      setTasks([]);
      setAllTasks([]);
      setTasksUserId(null);
      setLoading(false);
      return;
    }

    const requestedUserId = user.id;
    setLoading(true);
    try {
      // Fetch tasks for current view
      const dateParam = activeTab === 'today' ? todayDate : (activeTab === 'dashboard' ? currentDate : undefined);
      const res = await api.getTasks({
        date: dateParam,
        includeDeleted: false,
      });

      // Fetch all tasks for stats & search
      const allRes = await api.getTasks({ includeDeleted: false });
      if (fetchId !== latestFetchId.current) return;
      setTasks(res.tasks);
      setAllTasks(allRes.tasks);
      setTasksUserId(requestedUserId);
    } catch (err: any) {
      if (fetchId !== latestFetchId.current) return;
      console.error('Error fetching tasks:', err);
      addToast('Sync Error', 'Failed to retrieve tasks from server', 'error');
    } finally {
      if (fetchId === latestFetchId.current) setLoading(false);
    }
  }, [user, currentDate, activeTab, todayDate, addToast]);

  useEffect(() => {
    latestFetchId.current += 1;
    setTasks([]);
    setAllTasks([]);
    setTasksUserId(null);
    setLoading(Boolean(user));
  }, [user?.id]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = async (data: {
    title: string;
    description?: string;
    category: TaskCategory;
    priority: TaskPriority;
    startDate: string;
    dueDate: string;
    dueTime?: string;
    status?: TaskStatus;
  }) => {
    try {
      const res = await api.createTask(data);
      await fetchTasks();
      setTaskRevision((revision) => revision + 1);
      addToast('Task created successfully', `"${res.task.title}" is due ${res.task.dueDate}.`, 'success');
    } catch (err: any) {
      addToast('Creation Failed', err.message, 'error');
      throw err;
    }
  };

  const updateTask = async (
    id: string,
    data: {
      title?: string;
      description?: string;
      category?: TaskCategory;
      priority?: TaskPriority;
      status?: TaskStatus;
      startDate?: string;
      dueDate?: string;
      dueTime?: string;
    }
  ) => {
    try {
      const res = await api.updateTask(id, data);
      addToast('Task Updated', `Changes recorded in activity history`, 'success');
      await fetchTasks();
      setTaskRevision((revision) => revision + 1);
      if (selectedTaskForHistory && selectedTaskForHistory.id === id) {
        setSelectedTaskForHistory(res.task);
      }
    } catch (err: any) {
      addToast('Update Failed', err.message, 'error');
      throw err;
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    try {
      if (task.status === 'COMPLETED') {
        const res = await api.reopenTask(task.id);
        addToast('Task Reopened', `"${task.title}" marked as pending`, 'info');
        setTasks(prev => prev.map(t => (t.id === task.id ? res.task : t)));
        setAllTasks(prev => prev.map(t => (t.id === task.id ? res.task : t)));
        setTaskRevision((revision) => revision + 1);
      } else {
        const res = await api.completeTask(task.id);
        addToast('Task Completed 🎉', `"${task.title}" finished!`, 'success');
        setTasks(prev => prev.map(t => (t.id === task.id ? res.task : t)));
        setAllTasks(prev => prev.map(t => (t.id === task.id ? res.task : t)));
        setTaskRevision((revision) => revision + 1);
      }
      // Background full sync to refresh summaries
      fetchTasks();
    } catch (err: any) {
      addToast('Status Update Failed', err.message, 'error');
    }
  };

  const confirmDeleteTask = async (id: string) => {
    try {
      const res = await api.deleteTask(id);
      addToast('Task Deleted', `Archived in history. History is never lost.`, 'info');
      setTasks(prev => prev.filter(t => t.id !== id));
      setAllTasks(prev => prev.filter(t => t.id !== id));
      setTaskRevision((revision) => revision + 1);
      setTaskToDelete(null);
      fetchTasks();
    } catch (err: any) {
      addToast('Delete Failed', err.message, 'error');
    }
  };

  const visibleTasks = tasksUserId === user?.id ? tasks : [];
  const visibleAllTasks = tasksUserId === user?.id ? allTasks : [];

  return (
    <TaskContext.Provider
      value={{
        currentDate,
        setCurrentDate,
        todayDate,
        tasks: visibleTasks,
        allTasks: visibleAllTasks,
        taskRevision,
        loading,
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        priorityFilter,
        setPriorityFilter,
        categoryFilter,
        setCategoryFilter,
        isAddTaskOpen,
        setIsAddTaskOpen,
        taskToEdit,
        setTaskToEdit,
        taskToDelete,
        setTaskToDelete,
        selectedTaskForHistory,
        setSelectedTaskForHistory,
        refreshTasks: fetchTasks,
        createTask,
        updateTask,
        toggleTaskStatus,
        confirmDeleteTask,
        theme,
        toggleTheme,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export function useTasks() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}
