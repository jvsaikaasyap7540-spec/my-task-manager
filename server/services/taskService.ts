import { query, queryOne, execute } from '../db/database.ts';
import { TaskRecord, TaskActivityRecord, TaskPriority, TaskCategory, TaskStatus } from '../types/index.ts';
import { recalculateDailySummary } from './summaryService.ts';

export interface CreateTaskInput {
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  startDate: string;
  dueDate: string;
  dueTime?: string;
  status?: TaskStatus;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  category?: TaskCategory;
  priority?: TaskPriority;
  status?: TaskStatus;
  startDate?: string;
  dueDate?: string;
  dueTime?: string;
}

export interface TaskFilterOptions {
  date?: string;
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
  includeDeleted?: boolean;
}

export async function createTask(userId: string, input: CreateTaskInput): Promise<TaskRecord> {
  const id = `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date().toISOString();
  const status: TaskStatus = input.status || 'PENDING';
  const completedAt = status === 'COMPLETED' ? now : null;
  if (input.startDate > input.dueDate) {
    throw new Error('Start date must be on or before end date');
  }

  await execute(
    `INSERT INTO tasks (
      id, userId, title, description, category, priority, status, 
      startDate, dueDate, dueTime, createdAt, updatedAt, completedAt, deletedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    [
      id,
      userId,
      input.title.trim(),
      input.description ? input.description.trim() : null,
      input.category,
      input.priority,
      status,
      input.startDate,
      input.dueDate,
      input.dueTime || null,
      now,
      now,
      completedAt,
    ]
  );

  // Record initial activity: CREATED
  const actId = `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  await execute(
    `INSERT INTO task_activities (id, taskId, userId, action, field, oldValue, newValue, createdAt)
     VALUES (?, ?, ?, 'CREATED', 'task', NULL, ?, ?)`,
    [actId, id, userId, input.title.trim(), now]
  );

  // If status is completed upon creation
  if (status === 'COMPLETED') {
    const compActId = `act_${Date.now() + 1}_${Math.random().toString(36).substring(2, 9)}`;
    await execute(
      `INSERT INTO task_activities (id, taskId, userId, action, field, oldValue, newValue, createdAt)
       VALUES (?, ?, ?, 'COMPLETED', 'status', 'PENDING', 'COMPLETED', ?)`,
      [compActId, id, userId, now]
    );
  }

  // Recalculate summary for dueDate
  await recalculateDailySummary(userId, input.dueDate);

  const created = await getTaskById(userId, id);
  return created!;
}

export async function updateTask(userId: string, taskId: string, updates: UpdateTaskInput): Promise<TaskRecord> {
  const existing = await getTaskById(userId, taskId, true);
  if (!existing) {
    throw new Error('Task not found');
  }

  const now = new Date().toISOString();
  const activitiesToInsert: Array<{ action: string; field: string; oldValue: string | null; newValue: string | null }> = [];

  // Check title
  if (updates.title !== undefined && updates.title.trim() !== existing.title) {
    activitiesToInsert.push({
      action: 'UPDATED',
      field: 'title',
      oldValue: existing.title,
      newValue: updates.title.trim(),
    });
  }

  // Check description
  if (updates.description !== undefined && (updates.description?.trim() || null) !== existing.description) {
    activitiesToInsert.push({
      action: 'UPDATED',
      field: 'description',
      oldValue: existing.description,
      newValue: updates.description?.trim() || null,
    });
  }

  // Check category
  if (updates.category !== undefined && updates.category !== existing.category) {
    activitiesToInsert.push({
      action: 'UPDATED',
      field: 'category',
      oldValue: existing.category,
      newValue: updates.category,
    });
  }

  // Check priority
  if (updates.priority !== undefined && updates.priority !== existing.priority) {
    activitiesToInsert.push({
      action: 'PRIORITY_CHANGED',
      field: 'priority',
      oldValue: existing.priority,
      newValue: updates.priority,
    });
  }

  // Check dueDate
  if (updates.dueDate !== undefined && updates.dueDate !== existing.dueDate) {
    activitiesToInsert.push({
      action: 'UPDATED',
      field: 'dueDate',
      oldValue: existing.dueDate,
      newValue: updates.dueDate,
    });
  }

  if (updates.startDate !== undefined && updates.startDate !== existing.startDate) {
    activitiesToInsert.push({
      action: 'UPDATED',
      field: 'startDate',
      oldValue: existing.startDate,
      newValue: updates.startDate,
    });
  }

  // Check dueTime
  if (updates.dueTime !== undefined && (updates.dueTime || null) !== existing.dueTime) {
    activitiesToInsert.push({
      action: 'UPDATED',
      field: 'dueTime',
      oldValue: existing.dueTime,
      newValue: updates.dueTime || null,
    });
  }

  // Check status
  let newCompletedAt = existing.completedAt;
  if (updates.status !== undefined && updates.status !== existing.status) {
    if (updates.status === 'COMPLETED') {
      newCompletedAt = now;
      activitiesToInsert.push({
        action: 'COMPLETED',
        field: 'status',
        oldValue: existing.status,
        newValue: 'COMPLETED',
      });
    } else if (existing.status === 'COMPLETED') {
      newCompletedAt = null;
      activitiesToInsert.push({
        action: 'REOPENED',
        field: 'status',
        oldValue: 'COMPLETED',
        newValue: updates.status,
      });
    } else {
      activitiesToInsert.push({
        action: 'STATUS_CHANGED',
        field: 'status',
        oldValue: existing.status,
        newValue: updates.status,
      });
    }
  }

  // Perform updates
  const nextTitle = updates.title !== undefined ? updates.title.trim() : existing.title;
  const nextDesc = updates.description !== undefined ? (updates.description.trim() || null) : existing.description;
  const nextCat = updates.category !== undefined ? updates.category : existing.category;
  const nextPrio = updates.priority !== undefined ? updates.priority : existing.priority;
  const nextStatus = updates.status !== undefined ? updates.status : existing.status;
  const nextStartDate = updates.startDate !== undefined ? updates.startDate : existing.startDate;
  const nextDueDate = updates.dueDate !== undefined ? updates.dueDate : existing.dueDate;
  const nextDueTime = updates.dueTime !== undefined ? (updates.dueTime || null) : existing.dueTime;

  if (nextStartDate > nextDueDate) {
    throw new Error('Start date must be on or before end date');
  }

  const nextPendingAlertSentAt = existing.dueDate !== nextDueDate ? null : existing.pendingAlertSentAt;

  await execute(
    `UPDATE tasks SET 
      title = ?, description = ?, category = ?, priority = ?, status = ?,
      startDate = ?, dueDate = ?, dueTime = ?, updatedAt = ?, completedAt = ?, pendingAlertSentAt = ?
     WHERE id = ? AND userId = ?`,
    [
      nextTitle,
      nextDesc,
      nextCat,
      nextPrio,
      nextStatus,
      nextStartDate,
      nextDueDate,
      nextDueTime,
      now,
      newCompletedAt,
      nextPendingAlertSentAt,
      taskId,
      userId,
    ]
  );

  // Insert all activity changes
  for (const act of activitiesToInsert) {
    const actId = `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    await execute(
      `INSERT INTO task_activities (id, taskId, userId, action, field, oldValue, newValue, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [actId, taskId, userId, act.action, act.field, act.oldValue, act.newValue, now]
    );
  }

  // Recalculate daily summaries
  await recalculateDailySummary(userId, existing.dueDate);
  if (existing.dueDate !== nextDueDate) {
    await recalculateDailySummary(userId, nextDueDate);
  }

  const updated = await getTaskById(userId, taskId, true);
  return updated!;
}

export async function completeTask(userId: string, taskId: string): Promise<TaskRecord> {
  const existing = await getTaskById(userId, taskId);
  if (!existing) {
    throw new Error('Task not found');
  }

  if (existing.status === 'COMPLETED') {
    return existing;
  }

  const now = new Date().toISOString();
  await execute(
    `UPDATE tasks SET status = 'COMPLETED', completedAt = ?, updatedAt = ? WHERE id = ? AND userId = ?`,
    [now, now, taskId, userId]
  );

  const actId = `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  await execute(
    `INSERT INTO task_activities (id, taskId, userId, action, field, oldValue, newValue, createdAt)
     VALUES (?, ?, ?, 'COMPLETED', 'status', ?, 'COMPLETED', ?)`,
    [actId, taskId, userId, existing.status, now]
  );

  await recalculateDailySummary(userId, existing.dueDate);
  return (await getTaskById(userId, taskId))!;
}

export async function reopenTask(userId: string, taskId: string): Promise<TaskRecord> {
  const existing = await getTaskById(userId, taskId);
  if (!existing) {
    throw new Error('Task not found');
  }

  if (existing.status !== 'COMPLETED') {
    return existing;
  }

  const now = new Date().toISOString();
  await execute(
    `UPDATE tasks SET status = 'PENDING', completedAt = NULL, updatedAt = ? WHERE id = ? AND userId = ?`,
    [now, taskId, userId]
  );

  const actId = `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  await execute(
    `INSERT INTO task_activities (id, taskId, userId, action, field, oldValue, newValue, createdAt)
     VALUES (?, ?, ?, 'REOPENED', 'status', 'COMPLETED', 'PENDING', ?)`,
    [actId, taskId, userId, now]
  );

  await recalculateDailySummary(userId, existing.dueDate);
  return (await getTaskById(userId, taskId))!;
}

export async function deleteTask(userId: string, taskId: string): Promise<TaskRecord> {
  const existing = await getTaskById(userId, taskId);
  if (!existing) {
    throw new Error('Task not found');
  }

  const now = new Date().toISOString();
  // Soft deletion: set deletedAt
  await execute(
    `UPDATE tasks SET deletedAt = ?, updatedAt = ? WHERE id = ? AND userId = ?`,
    [now, now, taskId, userId]
  );

  // Record DELETED activity with task title
  const actId = `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  await execute(
    `INSERT INTO task_activities (id, taskId, userId, action, field, oldValue, newValue, createdAt)
     VALUES (?, ?, ?, 'DELETED', 'task', ?, 'DELETED', ?)`,
    [actId, taskId, userId, existing.title, now]
  );

  await recalculateDailySummary(userId, existing.dueDate);
  return (await getTaskById(userId, taskId, true))!;
}

export async function getTaskById(userId: string, taskId: string, includeDeleted = false): Promise<TaskRecord | null> {
  const sql = includeDeleted
    ? `SELECT * FROM tasks WHERE id = ? AND userId = ?`
    : `SELECT * FROM tasks WHERE id = ? AND userId = ? AND deletedAt IS NULL`;
  return await queryOne<TaskRecord>(sql, [taskId, userId]);
}

export async function getTasks(userId: string, filters: TaskFilterOptions = {}): Promise<TaskRecord[]> {
  let sql = `SELECT * FROM tasks WHERE userId = ?`;
  const params: any[] = [userId];

  if (!filters.includeDeleted) {
    sql += ` AND deletedAt IS NULL`;
  }

  if (filters.date) {
    sql += ` AND dueDate = ?`;
    params.push(filters.date);
  }

  if (filters.status) {
    sql += ` AND status = ?`;
    params.push(filters.status);
  }

  if (filters.priority) {
    sql += ` AND priority = ?`;
    params.push(filters.priority);
  }

  if (filters.category) {
    sql += ` AND category = ?`;
    params.push(filters.category);
  }

  if (filters.search) {
    sql += ` AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(category) LIKE ?)`;
    const searchPattern = `%${filters.search.toLowerCase().trim()}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  sql += ` ORDER BY 
    CASE 
      WHEN status = 'PENDING' THEN 1 
      WHEN status = 'IN_PROGRESS' THEN 2 
      ELSE 3 
    END ASC,
    CASE 
      WHEN priority = 'URGENT' THEN 1 
      WHEN priority = 'HIGH' THEN 2 
      WHEN priority = 'MEDIUM' THEN 3 
      ELSE 4 
    END ASC,
    dueTime ASC,
    createdAt DESC`;

  return await query<TaskRecord>(sql, params);
}

export async function getTaskActivities(userId: string, taskId: string): Promise<TaskActivityRecord[]> {
  const rows = await query<TaskActivityRecord>(
    `SELECT ta.*, t.title as taskTitle
     FROM task_activities ta
     JOIN tasks t ON ta.taskId = t.id
     WHERE ta.taskId = ? AND ta.userId = ?
     ORDER BY ta.createdAt DESC`,
    [taskId, userId]
  );
  return rows;
}
