import { query, queryOne } from '../db/database.ts';
import { TaskRecord, TaskActivityRecord, DailySummaryRecord } from '../types/index.ts';

export interface DayHistoryResult {
  date: string;
  summary: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    completionRate: number;
    createdCount: number;
    completedCount: number;
    editedCount: number;
    deletedCount: number;
  };
  tasks: TaskRecord[];
  timeline: TaskActivityRecord[];
}

export async function getHistoryByDate(userId: string, date: string): Promise<DayHistoryResult> {
  // Tasks whose dueDate is this date (including soft-deleted for historical audit)
  const tasks = await query<TaskRecord>(
    `SELECT * FROM tasks 
     WHERE userId = ? AND dueDate = ? 
     ORDER BY createdAt ASC`,
    [userId, date]
  );

  // Timeline activities that either occurred on this date (substr(createdAt, 1, 10) = date)
  // OR belong to tasks assigned to this date
  const timeline = await query<TaskActivityRecord>(
    `SELECT ta.*, t.title as taskTitle
     FROM task_activities ta
     LEFT JOIN tasks t ON ta.taskId = t.id
     WHERE ta.userId = ? AND (substr(ta.createdAt, 1, 10) = ? OR t.dueDate = ?)
     ORDER BY ta.createdAt DESC`,
    [userId, date, date]
  );

  // Calculate stats
  const activeTasks = tasks.filter(t => !t.deletedAt);
  const totalTasks = activeTasks.length;
  const completedTasks = activeTasks.filter(t => t.status === 'COMPLETED').length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Breakdown of activities on that date
  const dayActivities = timeline.filter(a => a.createdAt.startsWith(date));
  const createdCount = dayActivities.filter(a => a.action === 'CREATED').length;
  const completedCount = dayActivities.filter(a => a.action === 'COMPLETED').length;
  const editedCount = dayActivities.filter(a => ['UPDATED', 'PRIORITY_CHANGED', 'STATUS_CHANGED'].includes(a.action)).length;
  const deletedCount = dayActivities.filter(a => a.action === 'DELETED').length;

  return {
    date,
    summary: {
      totalTasks,
      completedTasks,
      pendingTasks,
      completionRate,
      createdCount,
      completedCount,
      editedCount,
      deletedCount,
    },
    tasks,
    timeline,
  };
}

export async function getHistoryDays(userId: string): Promise<Array<{ date: string; total: number; completed: number; rate: number }>> {
  const rows = await query<{ date: string; total: number; completed: number; rate: number }>(
    `SELECT 
      date,
      totalTasks as total,
      completedTasks as completed,
      completionRate as rate
     FROM daily_summaries
     WHERE userId = ?
     ORDER BY date DESC`,
    [userId]
  );
  return rows;
}

export async function getCalendarMonthData(userId: string, yearMonth: string): Promise<Array<{ date: string; totalTasks: number; completedTasks: number; pendingTasks: number; completionRate: number }>> {
  // e.g. yearMonth = '2026-09'
  const rows = await query<{
    date: string;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    completionRate: number;
  }>(
    `SELECT 
      dueDate as date,
      COUNT(CASE WHEN deletedAt IS NULL THEN 1 END) as totalTasks,
      SUM(CASE WHEN status = 'COMPLETED' AND deletedAt IS NULL THEN 1 ELSE 0 END) as completedTasks,
      SUM(CASE WHEN status != 'COMPLETED' AND deletedAt IS NULL THEN 1 ELSE 0 END) as pendingTasks
     FROM tasks
     WHERE userId = ? AND substr(dueDate, 1, 7) = ?
     GROUP BY dueDate
     ORDER BY dueDate ASC`,
    [userId, yearMonth]
  );

  return rows.map(r => {
    const total = Number(r.totalTasks || 0);
    const completed = Number(r.completedTasks || 0);
    const pending = Number(r.pendingTasks || 0);
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      date: r.date,
      totalTasks: total,
      completedTasks: completed,
      pendingTasks: pending,
      completionRate,
    };
  });
}

export async function getAnalyticsData(userId: string) {
  // Overall metrics
  const totals = await queryOne<{ total: number; completed: number; pending: number }>(
    `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status != 'COMPLETED' THEN 1 ELSE 0 END) as pending
     FROM tasks 
     WHERE userId = ? AND deletedAt IS NULL`,
    [userId]
  );

  const totalTasks = Number(totals?.total || 0);
  const completedTasks = Number(totals?.completed || 0);
  const pendingTasks = Number(totals?.pending || 0);
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Streak calculation based on days with completed tasks
  const completedDatesRows = await query<{ date: string }>(
    `SELECT DISTINCT dueDate as date 
     FROM tasks 
     WHERE userId = ? AND status = 'COMPLETED' AND deletedAt IS NULL
     ORDER BY dueDate DESC`,
    [userId]
  );

  const completedDates = new Set(completedDatesRows.map(r => r.date));
  
  // Calculate streaks
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Let's inspect last 60 days
  const today = new Date();
  let checkDate = new Date(today);
  let streakBroken = false;

  for (let i = 0; i < 90; i++) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (completedDates.has(dateStr)) {
      tempStreak++;
      if (!streakBroken) {
        currentStreak++;
      }
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else {
      if (i > 0) { // allow today if not yet completed
        streakBroken = true;
      }
      tempStreak = 0;
    }
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Daily productivity (last 14 days)
  const dailyProductivity: Array<{ date: string; displayDate: string; completed: number; created: number }> = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const compRow = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM tasks 
       WHERE userId = ? AND status = 'COMPLETED' AND dueDate = ? AND deletedAt IS NULL`,
      [userId, dateStr]
    );

    const crtRow = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM tasks 
       WHERE userId = ? AND dueDate = ? AND deletedAt IS NULL`,
      [userId, dateStr]
    );

    dailyProductivity.push({
      date: dateStr,
      displayDate,
      completed: Number(compRow?.count || 0),
      created: Number(crtRow?.count || 0),
    });
  }

  // Weekly productivity (past 4 weeks)
  const weeklyProductivity: Array<{ week: string; completed: number; total: number; rate: number }> = [];
  for (let w = 3; w >= 0; w--) {
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - (w * 7 + 6));
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() - (w * 7));

    const startStr = weekStart.toISOString().split('T')[0];
    const endStr = weekEnd.toISOString().split('T')[0];

    const weekRow = await queryOne<{ total: number; completed: number }>(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed
       FROM tasks
       WHERE userId = ? AND dueDate BETWEEN ? AND ? AND deletedAt IS NULL`,
      [userId, startStr, endStr]
    );

    const wTotal = Number(weekRow?.total || 0);
    const wComp = Number(weekRow?.completed || 0);
    const rate = wTotal > 0 ? Math.round((wComp / wTotal) * 100) : 0;
    const label = `Week ${4 - w}`;

    weeklyProductivity.push({
      week: label,
      total: wTotal,
      completed: wComp,
      rate,
    });
  }

  // Category breakdown
  const categoryRows = await query<{ category: string; count: number }>(
    `SELECT category, COUNT(*) as count
     FROM tasks
     WHERE userId = ? AND deletedAt IS NULL
     GROUP BY category
     ORDER BY count DESC`,
    [userId]
  );

  // Priority breakdown
  const priorityRows = await query<{ priority: string; count: number }>(
    `SELECT priority, COUNT(*) as count
     FROM tasks
     WHERE userId = ? AND deletedAt IS NULL
     GROUP BY priority`,
    [userId]
  );

  return {
    totalTasks,
    completedTasks,
    pendingTasks,
    completionRate,
    currentStreak,
    longestStreak,
    dailyProductivity,
    weeklyProductivity,
    categoryBreakdown: categoryRows.map(r => ({ name: r.category, value: Number(r.count) })),
    priorityBreakdown: priorityRows.map(r => ({ name: r.priority, value: Number(r.count) })),
  };
}
