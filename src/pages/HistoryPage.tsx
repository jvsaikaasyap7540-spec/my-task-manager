import React, { useState, useEffect } from 'react';
import { useTasks } from '../store/TaskContext';
import { api } from '../services/api';
import { DayHistoryData, Task } from '../types';
import {
  History,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Archive,
  ArrowRight,
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { todayDate, setSelectedTaskForHistory } = useTasks();
  const [selectedDate, setSelectedDate] = useState<string>(todayDate);
  const [historyData, setHistoryData] = useState<DayHistoryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [historyDays, setHistoryDays] = useState<Array<{ date: string; total: number; completed: number; rate: number }>>([]);

  // Fetch available history days overview
  useEffect(() => {
    api
      .getHistoryDays()
      .then((res) => setHistoryDays(res.days))
      .catch((err) => console.error('Failed to load history days', err));
  }, []);

  // Fetch detailed data for selected date
  useEffect(() => {
    setLoading(true);
    api
      .getHistoryByDate(selectedDate)
      .then((data) => setHistoryData(data))
      .catch((err) => {
        console.error('Failed to load history for date', err);
        setHistoryData(null);
      })
      .finally(() => setLoading(false));
  }, [selectedDate]);

  const changeDate = (daysDelta: number) => {
    const d = new Date(selectedDate + 'T12:00:00Z');
    d.setDate(d.getDate() + daysDelta);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const formattedDate = new Date(selectedDate + 'T12:00:00Z').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const summary = historyData?.summary || {
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    completionRate: 0,
    createdCount: 0,
    completedCount: 0,
    editedCount: 0,
    deletedCount: 0,
  };

  const tasks = historyData?.tasks || [];
  const timeline = historyData?.timeline || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header & Date Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Daily Task History</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Browse any day to inspect tasks, completion metrics, and immutable activity audits
          </p>
        </div>

        {/* Date Selector Navigation */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5 shadow-2xs">
            <button
              onClick={() => changeDate(-1)}
              title="Previous Day"
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2 py-1 text-xs font-mono tabular-nums bg-transparent text-slate-800 dark:text-slate-200 border-none focus:outline-none"
            />
            <button
              onClick={() => changeDate(1)}
              title="Next Day"
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {selectedDate !== todayDate && (
            <button
              onClick={() => setSelectedDate(todayDate)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 hover:bg-indigo-100 transition-colors"
            >
              Jump to Today
            </button>
          )}
        </div>
      </div>

      {/* Date Quick Strip (Shows recent days with completion tags) */}
      {historyDays.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 shrink-0">
            Recent Days:
          </span>
          {historyDays.slice(0, 7).map((d) => {
            const isSelected = d.date === selectedDate;
            const dayLabel = new Date(d.date + 'T12:00:00Z').toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });
            return (
              <button
                key={d.date}
                onClick={() => setSelectedDate(d.date)}
                className={`px-3 py-1.5 rounded-lg border font-mono tabular-nums transition-colors shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 font-semibold shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <span>{dayLabel}</span>
                <span className={`text-[10px] px-1 py-0.2 rounded ${isSelected ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  {d.rate}%
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Daily Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Completion Rate</p>
          <p className="text-xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400 mt-0.5">
            {summary.completionRate}%
          </p>
          <p className="text-[10px] text-slate-400 mt-1 font-mono tabular-nums">
            {summary.completedTasks} of {summary.totalTasks} tasks
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Tasks Created</p>
          <p className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
            {summary.createdCount}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">on this day</p>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Tasks Completed</p>
          <p className="text-xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
            {summary.completedCount}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">finished milestones</p>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Tasks Edited</p>
          <p className="text-xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-0.5">
            {summary.editedCount}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">updates tracked</p>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs col-span-2 sm:col-span-1">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Tasks Deleted</p>
          <p className="text-xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400 mt-0.5">
            {summary.deletedCount}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">soft-archived</p>
        </div>
      </div>

      {/* Main Grid: Tasks on left, Activity Timeline on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tasks for that day (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Tasks for {formattedDate}</span>
              <span className="text-xs font-normal text-slate-400 font-mono tabular-nums">({tasks.length})</span>
            </h3>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading daily tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-70" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No tasks assigned to this date</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Pick another day from the calendar strip above.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {tasks.map((task) => {
                const isDeleted = Boolean(task.deletedAt);
                const isCompleted = task.status === 'COMPLETED';

                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskForHistory(task)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isDeleted
                        ? 'bg-rose-50/30 dark:bg-rose-950/10 border-rose-200/50 dark:border-rose-900/30'
                        : isCompleted
                        ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="text-base mt-0.5 shrink-0">
                          {isDeleted ? (
                            <Archive className="w-4 h-4 text-rose-500" />
                          ) : isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <span className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600 block mt-0.5" />
                          )}
                        </span>

                        <div className="min-w-0">
                          <h4
                            className={`text-xs md:text-sm font-semibold truncate ${
                              isDeleted
                                ? 'line-through text-rose-500/80 dark:text-rose-400/80'
                                : isCompleted
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            {task.title}
                          </h4>

                          {task.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {task.description}
                            </p>
                          )}

                          <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                            <span>{task.category}</span>
                            <span>·</span>
                            <span>{task.priority}</span>
                            {task.dueTime && (
                              <>
                                <span>·</span>
                                <span>{task.dueTime}</span>
                              </>
                            )}
                            {isDeleted && (
                              <>
                                <span>·</span>
                                <span className="text-rose-500 font-semibold">Deleted (Archived)</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTaskForHistory(task);
                        }}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 font-medium"
                      >
                        Audit Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Activity Timeline for that day (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>Activity Timeline</span>
              <span className="text-xs font-normal text-slate-400 font-mono tabular-nums">({timeline.length})</span>
            </h3>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading timeline...</div>
          ) : timeline.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
              <History className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-70" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No activity recorded for this day.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Activities will appear automatically as tasks are modified.</p>
            </div>
          ) : (
            <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-200 dark:before:bg-slate-800">
              {timeline.map((act) => {
                const timeStr = new Date(act.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div key={act.id} className="relative">
                    {/* Circle */}
                    <div className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-indigo-600 ring-2 ring-white dark:ring-slate-900" />

                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                          {timeStr}
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {act.action}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                        {act.taskTitle || act.newValue || 'Task'}
                      </p>

                      {act.action === 'CREATED' && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Task created
                        </p>
                      )}

                      {act.action === 'COMPLETED' && (
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Task marked completed
                        </p>
                      )}

                      {act.action === 'REOPENED' && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5 flex items-center gap-1">
                          <RotateCcw className="w-3 h-3" />
                          Task reopened
                        </p>
                      )}

                      {act.action === 'PRIORITY_CHANGED' && (
                        <p className="text-[11px] text-orange-600 dark:text-orange-400 font-medium mt-0.5 flex items-center gap-1">
                          Priority changed to {act.newValue}
                        </p>
                      )}

                      {act.action === 'UPDATED' && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {act.field ? `${act.field} changed` : 'Task details updated'}
                        </p>
                      )}

                      {act.action === 'DELETED' && (
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-0.5 flex items-center gap-1">
                          <Trash2 className="w-3 h-3" />
                          Task deleted & archived
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
  );
};
