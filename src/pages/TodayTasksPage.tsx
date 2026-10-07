import React, { useMemo } from 'react';
import { useTasks } from '../store/TaskContext';
import { TaskCard } from '../components/tasks/TaskCard';
import {
  CheckSquare,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

export const TodayTasksPage: React.FC = () => {
  const {
    todayDate,
    allTasks,
    loading,
    setIsAddTaskOpen,
    searchQuery,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    categoryFilter,
    setCategoryFilter,
  } = useTasks();

  // Tasks belonging to today
  const todayTasks = useMemo(() => {
    return allTasks.filter((t) => t.dueDate === todayDate && !t.deletedAt);
  }, [allTasks, todayDate]);

  // Filtered today's tasks
  const filteredTasks = useMemo(() => {
    return todayTasks.filter((t) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q);
        const matchCat = t.category.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCat) return false;
      }
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
      return true;
    });
  }, [todayTasks, searchQuery, statusFilter, priorityFilter, categoryFilter]);

  const total = todayTasks.length;
  const completed = todayTasks.filter((t) => t.status === 'COMPLETED').length;
  const remaining = total - completed;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Today's Tasks</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Focus list for today · Every action is tracked in real-time
          </p>
        </div>

        <button
          onClick={() => setIsAddTaskOpen(true)}
          className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Task</span>
        </button>
      </div>

      {/* Progress Metric Card */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400">
            <span className="font-bold text-slate-900 dark:text-white text-sm">{total} Tasks</span>
            <span>·</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{completed} Completed</span>
            <span>·</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold">{remaining} Remaining</span>
          </div>
          <span className="text-sm font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
            {percentage}% Complete
          </span>
        </div>
        <div className="w-full h-2 mt-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Multi-Filter Bar */}
      <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-slate-200/80 bg-slate-100/70 p-2 text-xs dark:border-slate-800/80 dark:bg-slate-800/40 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="grid min-w-0 w-full flex-1 grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-1.5">
          <span className="col-span-2 flex items-center gap-1 pl-1 text-slate-400 sm:col-span-1">
            <Filter className="w-3.5 h-3.5" />
            Filters:
          </span>

          {/* Status buttons */}
          <div className="col-span-2 grid min-w-0 grid-cols-4 items-stretch rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900 sm:col-span-1 sm:flex sm:items-center">
            {['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`min-w-0 rounded px-1 py-1 text-center text-[11px] leading-tight font-medium transition-colors sm:px-2 sm:py-0.5 sm:text-xs ${
                  statusFilter === st
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {st === 'ALL' ? 'All' : st === 'PENDING' ? 'Pending' : st === 'IN_PROGRESS' ? 'In Progress' : 'Done'}
              </button>
            ))}
          </div>

          {/* Priority dropdown */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="min-w-0 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 sm:w-auto"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          {/* Category dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="min-w-0 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 sm:w-auto"
          >
            <option value="ALL">All Categories</option>
            <option value="Work">Work</option>
            <option value="Personal">Personal</option>
            <option value="Learning">Learning</option>
            <option value="Shopping">Shopping</option>
            <option value="Health">Health</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {(statusFilter !== 'ALL' || priorityFilter !== 'ALL' || categoryFilter !== 'ALL') && (
          <button
            onClick={() => {
              setStatusFilter('ALL');
              setPriorityFilter('ALL');
              setCategoryFilter('ALL');
            }}
            className="self-end text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400 sm:ml-auto"
          >
            Reset
          </button>
        )}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading today's tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-8">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3 opacity-90" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {total === 0 ? 'No tasks scheduled for today 🎉' : "You've completed everything."}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {total === 0 ? 'Add a task to start your flow today.' : 'Great job staying productive.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
