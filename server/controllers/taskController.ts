import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import * as taskService from '../services/taskService.ts';

function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function listTasks(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { date, status, priority, category, search, includeDeleted } = req.query;

    const tasks = await taskService.getTasks(userId, {
      date: date ? String(date) : undefined,
      status: status ? String(status) : undefined,
      priority: priority ? String(priority) : undefined,
      category: category ? String(category) : undefined,
      search: search ? String(search) : undefined,
      includeDeleted: includeDeleted === 'true',
    });

    res.json({
      success: true,
      tasks,
    });
  } catch (err: any) {
    console.error('List tasks error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve tasks' });
  }
}

export async function getTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const task = await taskService.getTaskById(userId, id, true);
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    res.json({ success: true, task });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve task' });
  }
}

export async function createTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { title, description, category, priority, startDate, dueDate, dueTime, status } = req.body;

    if (!title || !title.trim()) {
      res.status(422).json({ success: false, message: 'Task title is required' });
      return;
    }

    if (!isValidDate(startDate) || !isValidDate(dueDate)) {
      res.status(422).json({ success: false, message: 'Valid start and end dates are required (YYYY-MM-DD)' });
      return;
    }

    if (startDate > dueDate) {
      res.status(422).json({ success: false, message: 'Start date must be on or before end date' });
      return;
    }

    const task = await taskService.createTask(userId, {
      title,
      description,
      category: category || 'Work',
      priority: priority || 'MEDIUM',
      startDate,
      dueDate,
      dueTime,
      status: status || 'PENDING',
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task,
    });
  } catch (err: any) {
    console.error('Create task error:', err);
    res.status(500).json({ success: false, message: 'Failed to create task' });
  }
}

export async function updateTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { title, description, category, priority, status, startDate, dueDate, dueTime } = req.body;

    if (startDate !== undefined && !isValidDate(startDate)) {
      res.status(422).json({ success: false, message: 'Start date must use YYYY-MM-DD format' });
      return;
    }
    if (dueDate !== undefined && !isValidDate(dueDate)) {
      res.status(422).json({ success: false, message: 'End date must use YYYY-MM-DD format' });
      return;
    }

    const task = await taskService.updateTask(userId, id, {
      title,
      description,
      category,
      priority,
      status,
      startDate,
      dueDate,
      dueTime,
    });

    res.json({
      success: true,
      message: 'Task updated successfully',
      task,
    });
  } catch (err: any) {
    if (err.message === 'Task not found') {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }
    console.error('Update task error:', err);
    res.status(500).json({ success: false, message: 'Failed to update task' });
  }
}

export async function deleteTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const task = await taskService.deleteTask(userId, id);

    res.json({
      success: true,
      message: 'Task deleted successfully and archived in history',
      task,
    });
  } catch (err: any) {
    if (err.message === 'Task not found') {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }
    console.error('Delete task error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete task' });
  }
}

export async function completeTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const task = await taskService.completeTask(userId, id);
    res.json({
      success: true,
      message: 'Task completed',
      task,
    });
  } catch (err: any) {
    if (err.message === 'Task not found') {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to complete task' });
  }
}

export async function reopenTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const task = await taskService.reopenTask(userId, id);
    res.json({
      success: true,
      message: 'Task reopened',
      task,
    });
  } catch (err: any) {
    if (err.message === 'Task not found') {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to reopen task' });
  }
}

export async function getTaskHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const activities = await taskService.getTaskActivities(userId, id);
    res.json({
      success: true,
      activities,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch task history' });
  }
}
