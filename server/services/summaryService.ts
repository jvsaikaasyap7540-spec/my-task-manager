import { query, queryOne, execute } from '../db/database.ts';
import { DailySummaryRecord } from '../types/index.ts';

export async function recalculateDailySummary(userId: string, date: string): Promise<DailySummaryRecord> {
  // We count active tasks (not soft-deleted) for total, completed, pending for that due date
  const counts = await queryOne<{ total: number; completed: number; pending: number }>(
    `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status != 'COMPLETED' THEN 1 ELSE 0 END) as pending
     FROM tasks 
     WHERE userId = ? AND dueDate = ? AND deletedAt IS NULL`,
    [userId, date]
  );

  const total = Number(counts?.total || 0);
  const completed = Number(counts?.completed || 0);
  const pending = Number(counts?.pending || 0);
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const existing = await queryOne<{ id: string }>(
    `SELECT id FROM daily_summaries WHERE userId = ? AND date = ?`,
    [userId, date]
  );

  const now = new Date().toISOString();
  if (existing) {
    await execute(
      `UPDATE daily_summaries 
       SET totalTasks = ?, completedTasks = ?, pendingTasks = ?, completionRate = ?
       WHERE id = ?`,
      [total, completed, pending, completionRate, existing.id]
    );
    return {
      id: existing.id,
      userId,
      date,
      totalTasks: total,
      completedTasks: completed,
      pendingTasks: pending,
      completionRate,
      createdAt: now,
    };
  } else {
    const newId = `sum_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    await execute(
      `INSERT INTO daily_summaries (id, userId, date, totalTasks, completedTasks, pendingTasks, completionRate, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [newId, userId, date, total, completed, pending, completionRate, now]
    );
    return {
      id: newId,
      userId,
      date,
      totalTasks: total,
      completedTasks: completed,
      pendingTasks: pending,
      completionRate,
      createdAt: now,
    };
  }
}
