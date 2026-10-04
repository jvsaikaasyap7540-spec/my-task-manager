import React from 'react';
import { Task, TaskPriority, TaskStatus } from '../../types';
import { useTasks } from '../../store/TaskContext';
import {
  Check,
  Clock,
  Calendar,
  Edit3,
  Trash2,
  History,
  RotateCcw,
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onSelectForHistory?: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onSelectForHistory }) => {
  const { toggleTaskStatus, updateTask, setTaskToEdit, setTaskToDelete, setSelectedTaskForHistory } = useTasks();

  const isCompleted = task.status === 'COMPLETED';

  // Format created time: "09:10 AM"
  const createdTime = new Date(task.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Priority color and label
  const priorityConfig: Record<TaskPriority, { label: string; textClass: string; dotClass: string }> = {
    LOW: { label: 'Low', textClass: 'text-slate-500 dark:text-slate-400', dotClass: 'bg-slate-400' },
    MEDIUM: { label: 'Medium', textClass: 'text-blue-600 dark:text-blue-400', dotClass: 'bg-blue-500' },
    HIGH: { label: 'High', textClass: 'text-amber-600 dark:text-amber-400', dotClass: 'bg-amber-500' },
    URGENT: { label: 'Urgent', textClass: 'text-rose-600 dark:text-rose-400 font-semibold', dotClass: 'bg-rose-500 animate-pulse' },
  };

  const prio = priorityConfig[task.priority] || priorityConfig.MEDIUM;

  const handleOpenHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelectForHistory) {
      onSelectForHistory(task);
    } else {
      setSelectedTaskForHistory(task);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTaskToEdit(task);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTaskToDelete(task);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    void updateTask(task.id, { status: e.target.value as TaskStatus }).catch(() => undefined);
  };

  const handleReopen = (e: React.MouseEvent) => {
    e.stopPropagation();
    void updateTask(task.id, { status: 'PENDING' }).catch(() => undefined);
  };

  return (
    <div
      onClick={handleOpenHistory}
      className={`group relative p-4 rounded-xl border transition-all cursor-pointer ${
        isCompleted
          ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/80 opacity-75'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Checkbox */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleTaskStatus(task);
          }}
          className={`w-5 h-5 mt-0.5 rounded flex items-center justify-center transition-colors border shrink-0 ${
            isCompleted
              ? 'bg-emerald-600 border-emerald-600 text-white'
              : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-400 bg-transparent'
          }`}
          aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
        >
          {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* Content body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <h4
              className={`text-sm font-semibold tracking-tight transition-colors ${
                isCompleted
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : 'text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
              }`}
            >
              {task.title}
            </h4>

            {/* Quick action buttons */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={handleOpenHistory}
                title="View activity history"
                className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <History className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleEdit}
                title="Edit task"
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                title="Archive / Delete task"
                className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {task.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Clean unboxed metadata with typographic separators */}
          <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs text-slate-500 dark:text-slate-400">
            <label className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <span>Status</span>
              <select
                aria-label={`Change status for ${task.title}`}
                value={task.status}
                onChange={handleStatusChange}
                onClick={(e) => e.stopPropagation()}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </label>

            {isCompleted && (
              <button
                type="button"
                onClick={handleReopen}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reopen
              </button>
            )}

            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>

            {/* Category */}
            <span className="font-medium text-slate-700 dark:text-slate-300">{task.category}</span>

            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>

            {/* Priority */}
            <span className={`inline-flex items-center gap-1.5 ${prio.textClass}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${prio.dotClass}`} />
              {prio.label}
            </span>

            {/* Due Time */}
            {task.dueTime && (
              <>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                <span className="inline-flex items-center gap-1 font-mono tabular-nums text-slate-600 dark:text-slate-400">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {task.dueTime}
                </span>
              </>
            )}

            {/* Task date range */}
            {(task.startDate || task.dueDate) && (
              <>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                <span className="inline-flex items-center gap-1 font-mono tabular-nums text-slate-600 dark:text-slate-400">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {task.startDate || task.dueDate} – {task.dueDate}
                </span>
              </>
            )}

            {/* Status (if In Progress) */}
            {task.status === 'IN_PROGRESS' && (
              <>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-medium">In Progress</span>
              </>
            )}

            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-[11px] font-mono tabular-nums text-slate-400">Created {createdTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
