import React, { useState, useEffect } from 'react';
import { useTasks } from '../../store/TaskContext';
import { TaskActivity } from '../../types';
import { api } from '../../services/api';
import {
  X,
  History,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Tag,
  ArrowRight,
  Sparkles,
  Edit3,
  Trash2,
  RotateCcw,
} from 'lucide-react';

export const TaskHistoryDrawer: React.FC = () => {
  const { selectedTaskForHistory, setSelectedTaskForHistory } = useTasks();
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (selectedTaskForHistory) {
      setLoading(true);
      api
        .getTaskHistory(selectedTaskForHistory.id)
        .then((res) => setActivities(res.activities))
        .catch((err) => console.error('Failed to load history', err))
        .finally(() => setLoading(false));
    } else {
      setActivities([]);
    }
  }, [selectedTaskForHistory]);

  if (!selectedTaskForHistory) return null;

  const task = selectedTaskForHistory;

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATED':
        return {
          label: 'Created',
          icon: <Sparkles className="w-3.5 h-3.5 text-indigo-500" />,
          color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-900',
        };
      case 'COMPLETED':
        return {
          label: 'Completed',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
          color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900',
        };
      case 'REOPENED':
        return {
          label: 'Reopened',
          icon: <RotateCcw className="w-3.5 h-3.5 text-amber-500" />,
          color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900',
        };
      case 'PRIORITY_CHANGED':
        return {
          label: 'Priority Changed',
          icon: <AlertCircle className="w-3.5 h-3.5 text-orange-500" />,
          color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-900',
        };
      case 'UPDATED':
      case 'STATUS_CHANGED':
        return {
          label: 'Updated',
          icon: <Edit3 className="w-3.5 h-3.5 text-blue-500" />,
          color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900',
        };
      case 'DELETED':
        return {
          label: 'Deleted (Archived)',
          icon: <Trash2 className="w-3.5 h-3.5 text-rose-500" />,
          color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900',
        };
      default:
        return {
          label: action,
          icon: <History className="w-3.5 h-3.5 text-slate-500" />,
          color: 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
              Task Details & Activity History
            </h3>
          </div>
          <button
            onClick={() => setSelectedTaskForHistory(null)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Info */}
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{task.category}</span>
              <span>·</span>
              <span>Priority: {task.priority}</span>
              <span>·</span>
              <span className={task.status === 'COMPLETED' ? 'text-emerald-600 font-medium' : ''}>
                {task.status}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {task.title}
            </h2>
            {task.description && (
              <p className="mt-2 text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                {task.description}
              </p>
            )}
          </div>

          {/* Key Dates Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/70 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
            <div>
              <p className="text-slate-400 font-medium">Start / End Date</p>
              <p className="font-mono tabular-nums text-slate-800 dark:text-slate-200 mt-0.5 font-medium">
                {task.startDate || task.dueDate} – {task.dueDate} {task.dueTime ? `· ${task.dueTime}` : ''}
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Created At</p>
              <p className="font-mono tabular-nums text-slate-800 dark:text-slate-200 mt-0.5">
                {new Date(task.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Last Modified</p>
              <p className="font-mono tabular-nums text-slate-800 dark:text-slate-200 mt-0.5">
                {new Date(task.updatedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Completed At</p>
              <p className="font-mono tabular-nums text-slate-800 dark:text-slate-200 mt-0.5">
                {task.completedAt
                  ? new Date(task.completedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : 'Not completed yet'}
              </p>
            </div>
          </div>

          {/* Activity Timeline Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Activity Timeline ({activities.length})
              </h4>
              <span className="text-[11px] text-slate-400">Chronological Audit</span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading activity timeline...</div>
            ) : activities.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No activity recorded yet.</div>
            ) : (
              <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-200 dark:before:bg-slate-800">
                {activities.map((act) => {
                  const badge = getActionBadge(act.action);
                  const eventTime = new Date(act.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const eventDate = new Date(act.createdAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                  });

                  return (
                    <div key={act.id} className="relative group">
                      {/* Timeline dot */}
                      <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-500 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                      </div>

                      <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-800/40 shadow-xs">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-md border ${badge.color}`}>
                            {badge.icon}
                            {badge.label}
                          </span>
                          <span className="text-[11px] font-mono tabular-nums text-slate-400">
                            {eventDate} · {eventTime}
                          </span>
                        </div>

                        {/* Value change preview */}
                        {act.oldValue && act.newValue && act.action !== 'CREATED' && (
                          <div className="mt-2 text-xs flex items-center gap-2 font-mono text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                            <span className="line-through text-slate-400 truncate max-w-[120px]">{act.oldValue}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[120px]">{act.newValue}</span>
                          </div>
                        )}

                        {act.action === 'CREATED' && (
                          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                            Task initialized with title <span className="font-semibold">"{act.newValue}"</span>
                          </p>
                        )}

                        {act.action === 'DELETED' && (
                          <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                            Soft deleted from active list and moved to historical archive.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
