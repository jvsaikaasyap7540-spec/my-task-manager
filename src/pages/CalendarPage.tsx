import React, { useState, useEffect } from 'react';
import { useTasks } from '../store/TaskContext';
import { api } from '../services/api';
import { CalendarMonthDay } from '../types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export const CalendarPage: React.FC = () => {
  const { todayDate, taskRevision, setCurrentDate, setActiveTab } = useTasks();
  const [currentMonth, setCurrentMonth] = useState(() => todayDate.slice(0, 7));
  const [daysData, setDaysData] = useState<Record<string, CalendarMonthDay>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .getCalendarMonth(currentMonth)
      .then((res) => {
        const map: Record<string, CalendarMonthDay> = {};
        res.days.forEach((d) => {
          map[d.date] = d;
        });
        setDaysData(map);
      })
      .catch((err) => console.error('Failed to load calendar month', err))
      .finally(() => setLoading(false));
  }, [currentMonth, taskRevision]);

  const changeMonth = (delta: number) => {
    const [yearStr, monthStr] = currentMonth.split('-');
    let year = parseInt(yearStr, 10);
    let month = parseInt(monthStr, 10) + delta;

    if (month > 12) {
      month = 1;
      year += 1;
    } else if (month < 1) {
      month = 12;
      year -= 1;
    }

    const nextMonthStr = `${year}-${String(month).padStart(2, '0')}`;
    setCurrentMonth(nextMonthStr);
  };

  // Generate calendar grid
  const [yearStr, monthStr] = currentMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const monthName = new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month, 0).getDate();

  const calendarCells = [];
  // Empty padding for preceding days
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push(null);
  }
  // Days of current month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarCells.push({
      day,
      dateStr,
      data: daysData[dateStr] || null,
    });
  }

  const handleSelectDay = (dateStr: string) => {
    setCurrentDate(dateStr);
    setActiveTab('history');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Productivity Calendar</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Visual completion heatmaps across days. Click any date to explore historical activity.
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5 shadow-2xs">
            <button
              onClick={() => changeMonth(-1)}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-xs font-semibold text-slate-900 dark:text-slate-100 min-w-[120px] text-center">
              {monthName}
            </span>
            <button
              onClick={() => changeMonth(1)}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setCurrentMonth(todayDate.substring(0, 7))}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 hover:bg-indigo-100 transition-colors"
          >
            This Month
          </button>
        </div>
      </div>

      {/* Productivity Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
        <span className="font-semibold text-slate-700 dark:text-slate-300">Completion Indicators:</span>
        <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>100% Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span>50% – 99%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>1% – 49%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span>0% / No Tasks</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-center py-2.5">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <span key={d} className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {d}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-slate-800/60">
          {calendarCells.map((cell, index) => {
            if (!cell) {
              return (
                <div
                  key={`empty-${index}`}
                  className="min-h-[105px] p-2 bg-slate-50/20 dark:bg-slate-950/20 opacity-40"
                />
              );
            }

            const { day, dateStr, data } = cell;
            const isToday = dateStr === todayDate;
            const hasTasks = data && data.totalTasks > 0;
            const rate = data ? data.completionRate : 0;

            let rateColor = 'text-slate-400';
            let dotColor = 'bg-slate-300 dark:bg-slate-700';

            if (hasTasks) {
              if (rate === 100) {
                rateColor = 'text-emerald-600 dark:text-emerald-400 font-bold';
                dotColor = 'bg-emerald-500';
              } else if (rate >= 50) {
                rateColor = 'text-indigo-600 dark:text-indigo-400 font-bold';
                dotColor = 'bg-indigo-500';
              } else if (rate > 0) {
                rateColor = 'text-amber-600 dark:text-amber-400 font-semibold';
                dotColor = 'bg-amber-500';
              } else {
                rateColor = 'text-rose-500 font-semibold';
                dotColor = 'bg-rose-500';
              }
            }

            return (
              <div
                key={dateStr}
                onClick={() => handleSelectDay(dateStr)}
                className={`min-h-[105px] p-2.5 flex flex-col justify-between transition-colors cursor-pointer group hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 ${
                  isToday ? 'bg-indigo-50/30 dark:bg-indigo-950/30' : ''
                }`}
              >
                {/* Top: Day number & Today ring */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-mono tabular-nums font-semibold w-6 h-6 rounded-full flex items-center justify-center ${
                      isToday
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                    }`}
                  >
                    {day}
                  </span>

                  {hasTasks && (
                    <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                  )}
                </div>

                {/* Bottom: Task count & completion percent */}
                {hasTasks ? (
                  <div className="mt-2 text-right">
                    <p className={`text-xs font-mono tabular-nums ${rateColor}`}>
                      {rate}%
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-0.5">
                      {data?.completedTasks}/{data?.totalTasks} done
                    </p>
                  </div>
                ) : (
                  <div className="mt-2 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                      View history
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
