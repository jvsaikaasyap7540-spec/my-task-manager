import React, { useState } from 'react';
import { useTasks } from '../../store/TaskContext';
import { AlertTriangle, Archive, X } from 'lucide-react';

export const DeleteConfirmModal: React.FC = () => {
  const { taskToDelete, setTaskToDelete, confirmDeleteTask } = useTasks();
  const [deleting, setDeleting] = useState(false);

  if (!taskToDelete) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await confirmDeleteTask(taskToDelete.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete this task?</h3>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1">
              "{taskToDelete.title}"
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              This task will be archived and removed from your active list. As guaranteed by DayFlow's immutable history architecture, all prior edits, completion timestamps, and audit records will remain preserved in historical reports.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            disabled={deleting}
            onClick={() => setTaskToDelete(null)}
            className="px-4 py-2 text-xs md:text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={handleDelete}
            className="px-4 py-2 text-xs md:text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg transition-colors shadow-xs active:scale-[0.98]"
          >
            {deleting ? 'Archiving...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};
