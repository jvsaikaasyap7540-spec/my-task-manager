import nodemailer from 'nodemailer';
import { execute, query } from '../db/database.ts';

interface PendingTaskAlertRecord {
  id: string;
  title: string;
  status: string;
  startDate: string | null;
  dueDate: string;
  userName: string;
  userEmail: string;
}

let missingConfigurationWarningLogged = false;

function getMailer() {
  const { SMTP_HOST, SMTP_USER, SMTP_PASSWORD, TEAM_LEAD_EMAIL } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD || !TEAM_LEAD_EMAIL) return null;

  const port = Number(process.env.SMTP_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('SMTP_PORT must be a valid TCP port');
  }

  return {
    recipient: TEAM_LEAD_EMAIL,
    transporter: nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    }),
    sender: process.env.SMTP_FROM || SMTP_USER,
  };
}

export async function sendPendingTaskAlerts(): Promise<void> {
  let mailer: ReturnType<typeof getMailer>;
  try {
    mailer = getMailer();
  } catch (error) {
    console.error('Pending-task email configuration is invalid:', error);
    return;
  }

  if (!mailer) {
    if (!missingConfigurationWarningLogged) {
      console.warn('Pending-task email alerts are disabled; configure TEAM_LEAD_EMAIL and SMTP settings to enable them.');
      missingConfigurationWarningLogged = true;
    }
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  let pendingTasks: PendingTaskAlertRecord[];
  try {
    pendingTasks = await query<PendingTaskAlertRecord>(
      `SELECT tasks.id, tasks.title, tasks.status, tasks.startDate, tasks.dueDate,
              users.name AS userName, users.email AS userEmail
       FROM tasks
       INNER JOIN users ON users.id = tasks.userId
       WHERE tasks.dueDate < ?
         AND tasks.status != 'COMPLETED'
         AND tasks.deletedAt IS NULL
         AND tasks.pendingAlertSentAt IS NULL
       ORDER BY tasks.dueDate ASC`,
      [today]
    );
  } catch (error) {
    console.error('Failed to retrieve overdue pending tasks for email alerts:', error);
    return;
  }

  for (const task of pendingTasks) {
    try {
      await mailer.transporter.sendMail({
        from: mailer.sender,
        to: mailer.recipient,
        subject: `Pending task past end date: ${task.title}`,
        text: [
          `The following task is still ${task.status.toLowerCase()} after its end date:`,
          '',
          `Task: ${task.title}`,
          `Owner: ${task.userName} (${task.userEmail})`,
          `Start date: ${task.startDate || task.dueDate}`,
          `End date: ${task.dueDate}`,
          `Status: ${task.status.replace('_', ' ').toLowerCase()}`,
        ].join('\n'),
      });

      await execute(
        `UPDATE tasks SET pendingAlertSentAt = ?
         WHERE id = ? AND status != 'COMPLETED' AND deletedAt IS NULL AND pendingAlertSentAt IS NULL`,
        [new Date().toISOString(), task.id]
      );
      console.info(`Sent pending-task alert for ${task.id} to configured team lead.`);
    } catch (error) {
      console.error(`Failed to send pending-task alert for ${task.id}:`, error);
    }
  }
}

export function startPendingTaskAlertScheduler(): void {
  void sendPendingTaskAlerts();
  const interval = setInterval(() => void sendPendingTaskAlerts(), 60_000);
  interval.unref();
}