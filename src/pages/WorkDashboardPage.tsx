import React, { useMemo } from 'react';
import { BriefcaseBusiness, CircleDot, ListTodo, Plus } from 'lucide-react';
import { TaskCard } from '../components/tasks/TaskCard';
import { useTasks } from '../store/TaskContext';
import { TaskStatus } from '../types';

const statusOptions: Array<{ value: string; label: string }> = [
  { value: 'ALL', label: 'All tasks' },
  { value: 'PENDING', label: 'To do' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'COMPLETED', label: 'Completed' },
];

const priorityRank: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export const WorkDashboardPage: React.FC = () => {
  const {
    allTasks,
    loading,
    todayDate,
    setIsAddTaskOpen,
    searchQuery,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
  } = useTasks();
  const activeTasks = useMemo(
    () => allTasks.filter((task) => !task.deletedAt),
    [allTasks],
  );
  const selectedTasks = useMemo(
    () => activeTasks.filter((task) => task.category === 'Work'),
    [activeTasks],
  );
  const openTasks = selectedTasks.filter((task) => task.status !== 'COMPLETED');
  const overdueCount = openTasks.filter((task) => task.dueDate < todayDate).length;
  const dueTodayCount = openTasks.filter((task) => task.dueDate === todayDate).length;
  const inProgressCount = selectedTasks.filter((task) => task.status === 'IN_PROGRESS').length;
  const completedCount = selectedTasks.filter((task) => task.status === 'COMPLETED').length;

  const filteredTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return selectedTasks
      .filter((task) => {
        if (statusFilter !== 'ALL' && task.status !== statusFilter) return false;
        if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) return false;
        if (query && !`${task.title} ${task.description || ''} ${task.category}`.toLowerCase().includes(query)) return false;
        return true;
      })
      .sort((first, second) => {
        const completionOrder = Number(first.status === 'COMPLETED') - Number(second.status === 'COMPLETED');
        if (completionOrder !== 0) return completionOrder;
        const dateOrder = first.dueDate.localeCompare(second.dueDate);
        if (dateOrder !== 0) return dateOrder;
        return (priorityRank[first.priority] ?? 4) - (priorityRank[second.priority] ?? 4);
      });
  }, [selectedTasks, searchQuery, statusFilter, priorityFilter]);

  const todayLabel = new Date(`${todayDate}T12:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const clearFilters = () => {
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-400">
            <BriefcaseBusiness className="h-4 w-4" />
            <span>Workplace</span>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="font-medium normal-case text-slate-500 dark:text-slate-400">{todayLabel}</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">Work overview</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your priorities, deadlines, and active work in one place.</p>
        </div>
        <button
          onClick={() => setIsAddTaskOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:bg-emerald-600 dark:hover:bg-emerald-500"
        >
          <Plus className="h-4 w-4" />
          <span>New work task</span>
        </button>
      </section>

      <section aria-label="Work">
        <div className="mb-3">
          <h2 className="text-base font-semibold text-slate-950 dark:text-white">Work</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Your workload at a glance.</p>
        </div>
        <div aria-label="Work task summary" className="grid grid-cols-2 border-b border-slate-200 pb-5 dark:border-slate-800 lg:grid-cols-4">
        <div className="border-r border-slate-200 py-1 pr-4 dark:border-slate-800 sm:pr-6">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Open tasks</p>
          <p className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums text-slate-950 dark:text-white">{openTasks.length}</span>
            <span className="text-xs text-slate-400">in queue</span>
          </p>
        </div>
        <div className="border-slate-200 py-1 pl-4 dark:border-slate-800 sm:pl-6 lg:border-r">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Due today</p>
          <p className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums text-amber-700 dark:text-amber-400">{dueTodayCount}</span>
            <span className="text-xs text-slate-400">need attention</span>
          </p>
        </div>
        <div className="border-r border-slate-200 py-4 pr-4 dark:border-slate-800 sm:py-1 sm:pr-6 lg:pl-6">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Overdue</p>
          <p className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-semibold tabular-nums ${overdueCount ? 'text-rose-700 dark:text-rose-400' : 'text-slate-950 dark:text-white'}`}>{overdueCount}</span>
            <span className="text-xs text-slate-400">past due date</span>
          </p>
        </div>
        <div className="py-4 pl-4 dark:border-slate-800 sm:py-1 sm:pl-6">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">In progress</p>
          <p className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums text-sky-700 dark:text-sky-400">{inProgressCount}</span>
            <span className="text-xs text-slate-400">{completedCount} completed</span>
          </p>
        </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-semibold text-slate-950 dark:text-white">Task queue</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Sorted by due date, with higher priorities first.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="work-priority-filter">Task priority</label>
            <select
              id="work-priority-filter"
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="ALL">All priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        <div className="mb-3 flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800" role="tablist" aria-label="Filter tasks by status">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              role="tab"
              aria-selected={statusFilter === option.value}
              onClick={() => setStatusFilter(option.value as TaskStatus | 'ALL')}
              className={`shrink-0 border-b-2 px-3 py-2 text-xs font-medium transition-colors ${statusFilter === option.value ? 'border-emerald-700 text-emerald-800 dark:border-emerald-400 dark:text-emerald-300' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
            >
              {option.label}
              {option.value === 'ALL' && <span className="ml-1.5 text-slate-400">{selectedTasks.length}</span>}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-slate-500">Loading work tasks...</div>
        ) : filteredTasks.length ? (
          <div className="space-y-2">
            {filteredTasks.map((task) => <TaskCard key={task.id} task={task} />)}
          </div>
        ) : (
          <div className="border-y border-dashed border-slate-300 py-14 text-center dark:border-slate-700">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
              {searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL' ? <CircleDot className="h-5 w-5" /> : <ListTodo className="h-5 w-5" />}
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL' ? 'No matching tasks' : 'Your work queue is clear'}
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
              {searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL' ? 'Try adjusting your search or filters.' : 'Add the next piece of work you want to move forward.'}
            </p>
            {searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL' ? (
              <button onClick={clearFilters} className="mt-3 text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400">Clear filters</button>
            ) : (
              <button onClick={() => setIsAddTaskOpen(true)} className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500">
                <Plus className="h-3.5 w-3.5" /> Add a work task
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
