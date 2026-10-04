import React, { useState } from 'react';
import { AuthProvider, useAuth } from './store/AuthContext';
import { TaskProvider, useTasks } from './store/TaskContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopNav } from './components/layout/TopNav';
import { WorkDashboardPage } from './pages/WorkDashboardPage';
import { TodayTasksPage } from './pages/TodayTasksPage';
import { CalendarPage } from './pages/CalendarPage';
import { HistoryPage } from './pages/HistoryPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuthPage } from './pages/AuthPage';
import { AddTaskModal } from './components/tasks/AddTaskModal';
import { EditTaskModal } from './components/tasks/EditTaskModal';
import { DeleteConfirmModal } from './components/tasks/DeleteConfirmModal';
import { TaskHistoryDrawer } from './components/tasks/TaskHistoryDrawer';
import { ToastContainer } from './components/ui/Toast';
import { Sparkles } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeTab } = useTasks();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Sidebar for navigation */}
      <Sidebar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />

      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-2xs lg:hidden"
        />
      )}

      {/* Main viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && <WorkDashboardPage />}
          {activeTab === 'today' && <TodayTasksPage />}
          {activeTab === 'calendar' && <CalendarPage />}
          {activeTab === 'history' && <HistoryPage />}
          {activeTab === 'analytics' && <AnalyticsPage />}
          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Modals and Drawers */}
      <AddTaskModal />
      <EditTaskModal />
      <DeleteConfirmModal />
      <TaskHistoryDrawer />
      <ToastContainer />
    </div>
  );
};

const RootApp: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
        <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-3 shadow-lg shadow-indigo-500/30 animate-pulse">
          <Sparkles className="w-5 h-5" />
        </div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading DayFlow...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <TaskProvider>
      <MainLayout />
    </TaskProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <RootApp />
    </AuthProvider>
  );
}
