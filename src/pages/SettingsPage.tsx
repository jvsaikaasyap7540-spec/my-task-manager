import React, { useState } from 'react';
import { useAuth } from '../store/AuthContext';
import { useTasks } from '../store/TaskContext';
import { api } from '../services/api';
import {
  Settings,
  User,
  Moon,
  Sun,
  RotateCcw,
  Download,
  ShieldCheck,
  CheckCircle2,
  Database,
  History,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme, allTasks, addToast, refreshTasks } = useTasks();
  const [resetting, setResetting] = useState(false);

  const handleResetData = async () => {
    if (!window.confirm('Reset demo data to initial sample tasks and historical audit logs?')) {
      return;
    }

    setResetting(true);
    try {
      await api.resetDemoData();
      await refreshTasks();
      addToast('Demo Data Reset', 'Sample tasks and activity audit logs restored successfully', 'success');
    } catch (err: any) {
      addToast('Reset Failed', err.message, 'error');
    } finally {
      setResetting(false);
    }
  };

  const handleExportJSON = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(allTasks, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `dayflow-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('Data Exported', 'Task records downloaded as JSON', 'info');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Settings & Preferences</h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Account details, appearance, backup, and historical event persistence controls
        </p>
      </div>

      {/* Account Info */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 flex items-center justify-center font-bold text-sm">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{user?.name || 'DayFlow User'}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email || 'demo@dayflow.app'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-3 border-t border-slate-100 dark:border-slate-800 font-mono tabular-nums">
          <div>
            <span className="text-slate-400">Account ID:</span>
            <p className="text-slate-700 dark:text-slate-300 font-medium truncate mt-0.5">{user?.id || 'usr_demo'}</p>
          </div>
          <div>
            <span className="text-slate-400">Active Tasks In Vault:</span>
            <p className="text-slate-700 dark:text-slate-300 font-medium mt-0.5">{allTasks.length} tasks</p>
          </div>
        </div>
      </div>

      {/* Appearance Theme */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Interface Theme</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Choose between daylight clarity and low-glare dark mode
            </p>
          </div>

          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:border-indigo-500 transition-colors"
          >
            {theme === 'dark' ? (
              <>
                <Moon className="w-4 h-4 text-indigo-400" />
                <span>Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Light Mode</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Data Operations */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Data & Historical Audit Controls</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your productivity dataset or export JSON snapshots
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleExportJSON}
            className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-800 dark:text-slate-200 transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Tasks (JSON)</span>
          </button>

          <button
            disabled={resetting}
            onClick={handleResetData}
            className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-800 dark:text-slate-200 disabled:opacity-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-amber-500" />
            <span>{resetting ? 'Resetting Data...' : 'Reset Demo Sample Data'}</span>
          </button>
        </div>
      </div>

      {/* Architectural Guarantee Box */}
      <div className="p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 text-xs">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-indigo-900 dark:text-indigo-200">
              Immutable Event Logging Guarantee
            </h4>
            <p className="text-indigo-800/80 dark:text-indigo-300/80 mt-1 leading-relaxed">
              DayFlow is engineered with an immutable event sourcing log. Unlike typical To-Do apps that overwrite tasks or permanently delete them, DayFlow tracks every title change, priority shift, completion timestamp, and deletion event in a dedicated <code className="font-mono">task_activities</code> SQLite log table. You never lose historical insight into what happened.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
