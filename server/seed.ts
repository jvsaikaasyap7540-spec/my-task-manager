import bcrypt from 'bcryptjs';
import { execute, query, queryOne } from './db/database.ts';
import { recalculateDailySummary } from './services/summaryService.ts';

const demoEmail = 'demo@dayflow.app';
const demoUserId = 'usr_demo_dayflow_alex';
const demoSeedTaskIds = [
  'task_playwright_practice',
  'task_update_resume',
  'task_learn_cybersecurity',
  'task_check_emails',
  'task_create_portfolio',
  'task_okr_review',
  'task_old_meeting',
  'task_y_0', 'task_y_1', 'task_y_2', 'task_y_3',
  'task_d2_0', 'task_d2_1', 'task_d2_2', 'task_d2_3',
  'task_d3_0', 'task_d3_1', 'task_d3_2', 'task_d3_3', 'task_d3_4',
  'task_tm_0', 'task_tm_1',
];

async function getOrCreateDemoUser(): Promise<string> {
  const existingUser = await queryOne<{ id: string }>(`SELECT id FROM users WHERE email = ?`, [demoEmail]);
  if (existingUser) return existingUser.id;

  const now = new Date().toISOString();
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);
  await execute(
    `INSERT INTO users (id, name, email, passwordHash, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [demoUserId, 'Alex Morgan', demoEmail, passwordHash, now, now]
  );
  return demoUserId;
}

export async function ensureDemoAccount(): Promise<void> {
  await getOrCreateDemoUser();
}

export async function removeDemoSeedTasks(): Promise<void> {
  const demoUser = await queryOne<{ id: string }>(`SELECT id FROM users WHERE email = ?`, [demoEmail]);
  if (!demoUser) return;

  const placeholders = demoSeedTaskIds.map(() => '?').join(', ');
  const seededTasks = await query<{ id: string; dueDate: string }>(
    `SELECT id, dueDate FROM tasks WHERE userId = ? AND id IN (${placeholders})`,
    [demoUser.id, ...demoSeedTaskIds]
  );
  if (seededTasks.length === 0) return;

  const seededIds = seededTasks.map((task) => task.id);
  const seededPlaceholders = seededIds.map(() => '?').join(', ');
  await execute(
    `DELETE FROM task_activities WHERE userId = ? AND taskId IN (${seededPlaceholders})`,
    [demoUser.id, ...seededIds]
  );
  await execute(
    `DELETE FROM tasks WHERE userId = ? AND id IN (${seededPlaceholders})`,
    [demoUser.id, ...seededIds]
  );

  for (const date of new Set(seededTasks.map((task) => task.dueDate))) {
    const summary = await recalculateDailySummary(demoUser.id, date);
    if (summary.totalTasks === 0) {
      await execute(`DELETE FROM daily_summaries WHERE userId = ? AND date = ?`, [demoUser.id, date]);
    }
  }
}

export async function seedDemoData(): Promise<void> {
  const userId = await getOrCreateDemoUser();
  const now = new Date().toISOString();

  // Reset is an explicit demo-data action; startup no longer calls this function.
  await execute(`DELETE FROM tasks WHERE userId = ?`, [userId]);
  await execute(`DELETE FROM task_activities WHERE userId = ?`, [userId]);
  await execute(`DELETE FROM daily_summaries WHERE userId = ?`, [userId]);

  // Today's date from environment/local time (2026-09-25)
  const todayStr = '2026-09-25';
  const yesterdayStr = '2026-09-24';
  const twoDaysAgoStr = '2026-09-23';
  const threeDaysAgoStr = '2026-09-22';
  const tomorrowStr = '2026-09-26';

  // Task 1: Complete Playwright Practice (Completed today)
  const t1Id = 'task_playwright_practice';
  await execute(
    `INSERT INTO tasks (id, userId, title, description, category, priority, status, dueDate, dueTime, createdAt, updatedAt, completedAt, deletedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    [
      t1Id,
      userId,
      'Complete Playwright practice',
      'End-to-end component testing scenarios and cross-browser automation suite',
      'Learning',
      'HIGH',
      'COMPLETED',
      todayStr,
      '11:00',
      `${todayStr}T09:10:00.000Z`,
      `${todayStr}T11:20:00.000Z`,
      `${todayStr}T10:30:00.000Z`,
    ]
  );
  // Activities for Task 1
  await execute(
    `INSERT INTO task_activities (id, taskId, userId, action, field, oldValue, newValue, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['act_1_1', t1Id, userId, 'CREATED', 'task', null, 'Complete Playwright practice', `${todayStr}T09:10:00.000Z`]
  );
  await execute(
    `INSERT INTO task_activities (id, taskId, userId, action, field, oldValue, newValue, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['act_1_2', t1Id, userId, 'COMPLETED', 'status', 'PENDING', 'COMPLETED', `${todayStr}T10:30:00.000Z`]
  );
  await execute(
    `INSERT INTO task_activities (id, taskId, userId, action, field, oldValue, newValue, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['act_1_3', t1Id, userId, 'PRIORITY_CHANGED', 'priority', 'MEDIUM', 'HIGH', `${todayStr}T11:20:00.000Z`]
  );

  // Task 2: Update resume (Completed today)
  const t2Id = 'task_update_resume';
  await execute(
    `INSERT INTO tasks (id, userId, title, description, category, priority, status, dueDate, dueTime, createdAt, updatedAt, completedAt, deletedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    [
      t2Id,
      userId,
      'Update resume',
      'Highlight system architecture and TypeScript backend integration work',
      'Career',
      'HIGH',
      'COMPLETED',
      todayStr,
      '14:00',
      `${todayStr}T08:30:00.000Z`,
      `${todayStr}T13:45:00.000Z`,
      `${todayStr}T13:45:00.000Z`,
    ]
  );
  await execute(
    `INSERT INTO task_activities (id, taskId, userId, action, field, oldValue, newValue, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['act_2_1', t2Id, userId, 'CREATED', 'task', null, 'Update resume', `${todayStr}T08:30:00.000Z`]
  );
  await execute(
    `INSERT INTO task_activities (id, taskId, userId, action, field, oldValue, newValue, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['act_2_2', t2Id, userId, 'COMPLETED', 'status', 'PENDING', 'COMPLETED', `${todayStr}T13:45:00.000Z`]
  );

  // Task 3: Learn cybersecurity (Pending / In Progress today)
  const t3Id = 'task_learn_cybersecurity';
  await execute(
    `INSERT INTO tasks (id, userId, title, description, category, priority, status, dueDate, dueTime, createdAt, updatedAt, completedAt, deletedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    [
      t3Id,
      userId,
      'Learn cybersecurity',
      'Explore OAuth 2.1 PKCE flows, OWASP Top 10 API security vulnerabilities, and rate limiting',
      'Learning',
      'MEDIUM',
      'IN_PROGRESS',
      todayStr,
      '17:30',
      `${todayStr}T09:45:00.000Z`,
      `${todayStr}T12:00:00.000Z`,
      null,
    ]
  );
  await execute(
    `INSERT INTO task_activities (id, taskId, userId, action, field, oldValue, newValue, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['act_3_1', t3Id, userId, 'CREATED', 'task', null, 'Learn cybersecurity', `${todayStr}T09:45:00.000Z`]
  );
  await execute(
    `INSERT INTO task_activities (id, taskId, userId, action, field, oldValue, newValue, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['act_3_2', t3Id, userId, 'STATUS_CHANGED', 'status', 'PENDING', 'IN_PROGRESS', `${todayStr}T12:00:00.000Z`]
  );

  // Task 4: Check emails & Slack triage (Completed today)
  const t4Id = 'task_check_emails';
  await execute(
    `INSERT INTO tasks (id, userId, title, description, category, priority, status, dueDate, dueTime, createdAt, updatedAt, completedAt, deletedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    [
      t4Id,
      userId,
      'Check emails',
      'Review pending team PR reviews and reply to client deployment inquiries',
      'Work',
      'LOW',
      'COMPLETED',
      todayStr,
      '10:00',
      `${todayStr}T08:00:00.000Z`,
      `${todayStr}T09:30:00.000Z`,
      `${todayStr}T09:30:00.000Z`,
    ]
  );
  await execute(
    `INSERT INTO task_activities (id, taskId, userId, action, field, oldValue, newValue, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['act_4_1', t4Id, userId, 'CREATED', 'task', null, 'Check emails', `${todayStr}T08:00:00.000Z`]
  );
  await execute(
    `INSERT INTO task_activities (id, taskId, userId, action, field, oldValue, newValue, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['act_4_2', t4Id, userId, 'COMPLETED', 'status', 'PENDING', 'COMPLETED', `${todayStr}T09:30:00.000Z`]
  );

  // Task 5: Create portfolio revamp (Pending today)
  const t5Id = 'task_create_portfolio';
  await execute(
    `INSERT INTO tasks (id, userId, title, description, category, priority, status, dueDate, dueTime, createdAt, updatedAt, completedAt, deletedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    [
      t5Id,
      userId,
      'Create Portfolio',
      'Deploy interactive case studies and live application demos with Tailwind styling',
      'Personal',
      'HIGH',
      'PENDING',
      todayStr,
      '19:00',
      `${todayStr}T09:00:00.000Z`,
      `${todayStr}T09:00:00.000Z`,
      null,
    ]
  );
  await execute(
    `INSERT INTO task_activities (id, taskId, userId, action, field, oldValue, newValue, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['act_5_1', t5Id, userId, 'CREATED', 'task', null, 'Create Portfolio', `${todayStr}T09:00:00.000Z`]
  );

  // Task 6: Prepare Quarterly OKR Review (Pending today)
  const t6Id = 'task_okr_review';
  await execute(
    `INSERT INTO tasks (id, userId, title, description, category, priority, status, dueDate, dueTime, createdAt, updatedAt, completedAt, deletedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    [
      t6Id,
      userId,
      'Prepare Quarterly OKR Review',
      'Aggregate sprint velocity, bug reduction rates, and customer delivery milestones',
      'Work',
      'URGENT',
      'PENDING',
      todayStr,
      '18:30',
      `${todayStr}T09:15:00.000Z`,
      `${todayStr}T09:15:00.000Z`,
      null,
    ]
  );
  await execute(
    `INSERT INTO task_activities (id, taskId, userId, action, field, oldValue, newValue, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['act_6_1', t6Id, userId, 'CREATED', 'task', null, 'Prepare Quarterly OKR Review', `${todayStr}T09:15:00.000Z`]
  );

  // Task 7: Soft-deleted task example: "Old meeting task" (deleted today at 18:40)
  const tDelId = 'task_old_meeting';
  await execute(
    `INSERT INTO tasks (id, userId, title, description, category, priority, status, dueDate, dueTime, createdAt, updatedAt, completedAt, deletedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      tDelId,
      userId,
      'Old meeting task',
      'Sync with external vendor about migration timeline',
      'Work',
      'MEDIUM',
      'PENDING',
      todayStr,
      '15:00',
      `${todayStr}T08:15:00.000Z`,
      `${todayStr}T18:40:00.000Z`,
      null,
      `${todayStr}T18:40:00.000Z`,
    ]
  );
  await execute(
    `INSERT INTO task_activities (id, taskId, userId, action, field, oldValue, newValue, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['act_del_1', tDelId, userId, 'CREATED', 'task', null, 'Old meeting task', `${todayStr}T08:15:00.000Z`]
  );
  await execute(
    `INSERT INTO task_activities (id, taskId, userId, action, field, oldValue, newValue, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['act_del_2', tDelId, userId, 'DELETED', 'task', 'Old meeting task', 'DELETED', `${todayStr}T18:40:00.000Z`]
  );

  // Yesterday's Tasks (2026-09-24) - 100% completion day!
  const yTasks = [
    { title: 'API Gateway refactoring', cat: 'Work', prio: 'HIGH', time: '11:30' },
    { title: 'Cardio workout 5km run', cat: 'Health', prio: 'MEDIUM', time: '07:30' },
    { title: 'Weekly grocery restock', cat: 'Shopping', prio: 'LOW', time: '18:00' },
    { title: 'Review database indexing strategy', cat: 'Learning', prio: 'URGENT', time: '15:00' },
  ];
  for (let i = 0; i < yTasks.length; i++) {
    const yt = yTasks[i];
    const yId = `task_y_${i}`;
    await execute(
      `INSERT INTO tasks (id, userId, title, description, category, priority, status, dueDate, dueTime, createdAt, updatedAt, completedAt, deletedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        yId,
        userId,
        yt.title,
        `Historical archived task completed on ${yesterdayStr}`,
        yt.cat,
        yt.prio,
        'COMPLETED',
        yesterdayStr,
        yt.time,
        `${yesterdayStr}T09:00:00.000Z`,
        `${yesterdayStr}T16:00:00.000Z`,
        `${yesterdayStr}T16:00:00.000Z`,
      ]
    );
    await execute(
      `INSERT INTO task_activities (id, taskId, userId, action, field, oldValue, newValue, createdAt)
       VALUES (?, ?, ?, 'CREATED', 'task', null, ?, ?)`,
      [`act_y_${i}_1`, yId, userId, yt.title, `${yesterdayStr}T09:00:00.000Z`]
    );
    await execute(
      `INSERT INTO task_activities (id, taskId, userId, action, field, oldValue, newValue, createdAt)
       VALUES (?, ?, ?, 'COMPLETED', 'status', 'PENDING', 'COMPLETED', ?)`,
      [`act_y_${i}_2`, yId, userId, `${yesterdayStr}T16:00:00.000Z`]
    );
  }

  // Two days ago (2026-09-23) - 75% completion day
  const d2Tasks = [
    { title: 'Docker containerization benchmark', cat: 'Work', prio: 'HIGH', status: 'COMPLETED', time: '10:00' },
    { title: 'Drink 3L water hydration goal', cat: 'Health', prio: 'MEDIUM', status: 'COMPLETED', time: '20:00' },
    { title: 'Read TypeScript 5.8 release notes', cat: 'Learning', prio: 'LOW', status: 'COMPLETED', time: '21:00' },
    { title: 'Clean and organize home workstation', cat: 'Personal', prio: 'LOW', status: 'PENDING', time: '19:00' },
  ];
  for (let i = 0; i < d2Tasks.length; i++) {
    const dt = d2Tasks[i];
    const dtId = `task_d2_${i}`;
    const compAt = dt.status === 'COMPLETED' ? `${twoDaysAgoStr}T15:30:00.000Z` : null;
    await execute(
      `INSERT INTO tasks (id, userId, title, description, category, priority, status, dueDate, dueTime, createdAt, updatedAt, completedAt, deletedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        dtId,
        userId,
        dt.title,
        `Task for ${twoDaysAgoStr}`,
        dt.cat,
        dt.prio,
        dt.status,
        twoDaysAgoStr,
        dt.time,
        `${twoDaysAgoStr}T08:30:00.000Z`,
        `${twoDaysAgoStr}T15:30:00.000Z`,
        compAt,
      ]
    );
    await execute(
      `INSERT INTO task_activities (id, taskId, userId, action, field, oldValue, newValue, createdAt)
       VALUES (?, ?, ?, 'CREATED', 'task', null, ?, ?)`,
      [`act_d2_${i}_1`, dtId, userId, dt.title, `${twoDaysAgoStr}T08:30:00.000Z`]
    );
    if (dt.status === 'COMPLETED') {
      await execute(
        `INSERT INTO task_activities (id, taskId, userId, action, field, oldValue, newValue, createdAt)
         VALUES (?, ?, ?, 'COMPLETED', 'status', 'PENDING', 'COMPLETED', ?)`,
        [`act_d2_${i}_2`, dtId, userId, `${twoDaysAgoStr}T15:30:00.000Z`]
      );
    }
  }

  // Three days ago (2026-09-22) - 80% completion day
  const d3Tasks = [
    { title: 'Security audit on JWT refresh mechanics', cat: 'Work', prio: 'URGENT', status: 'COMPLETED', time: '11:00' },
    { title: 'Dentist routine appointment', cat: 'Health', prio: 'HIGH', status: 'COMPLETED', time: '14:00' },
    { title: 'Review PRs for frontend redesign', cat: 'Work', prio: 'HIGH', status: 'COMPLETED', time: '16:00' },
    { title: 'Buy ergonomic mouse replacement', cat: 'Shopping', prio: 'MEDIUM', status: 'COMPLETED', time: '17:30' },
    { title: 'Draft monthly productivity retrospective', cat: 'Personal', prio: 'LOW', status: 'PENDING', time: '20:00' },
  ];
  for (let i = 0; i < d3Tasks.length; i++) {
    const dt = d3Tasks[i];
    const dtId = `task_d3_${i}`;
    const compAt = dt.status === 'COMPLETED' ? `${threeDaysAgoStr}T17:00:00.000Z` : null;
    await execute(
      `INSERT INTO tasks (id, userId, title, description, category, priority, status, dueDate, dueTime, createdAt, updatedAt, completedAt, deletedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        dtId,
        userId,
        dt.title,
        `Historical task on ${threeDaysAgoStr}`,
        dt.cat,
        dt.prio,
        dt.status,
        threeDaysAgoStr,
        dt.time,
        `${threeDaysAgoStr}T08:00:00.000Z`,
        `${threeDaysAgoStr}T17:00:00.000Z`,
        compAt,
      ]
    );
    await execute(
      `INSERT INTO task_activities (id, taskId, userId, action, field, oldValue, newValue, createdAt)
       VALUES (?, ?, ?, 'CREATED', 'task', null, ?, ?)`,
      [`act_d3_${i}_1`, dtId, userId, dt.title, `${threeDaysAgoStr}T08:00:00.000Z`]
    );
  }

  // Tomorrow's planned tasks (2026-09-26)
  const tmTasks = [
    { title: 'Ship DayFlow v1.0 Production Release', cat: 'Work', prio: 'URGENT', time: '10:00' },
    { title: 'Weekend hike trail planning', cat: 'Health', prio: 'MEDIUM', time: '16:00' },
  ];
  for (let i = 0; i < tmTasks.length; i++) {
    const tt = tmTasks[i];
    const tmId = `task_tm_${i}`;
    await execute(
      `INSERT INTO tasks (id, userId, title, description, category, priority, status, dueDate, dueTime, createdAt, updatedAt, completedAt, deletedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        tmId,
        userId,
        tt.title,
        `Planned task for ${tomorrowStr}`,
        tt.cat,
        tt.prio,
        'PENDING',
        tomorrowStr,
        tt.time,
        `${todayStr}T14:00:00.000Z`,
        `${todayStr}T14:00:00.000Z`,
        null,
      ]
    );
    await execute(
      `INSERT INTO task_activities (id, taskId, userId, action, field, oldValue, newValue, createdAt)
       VALUES (?, ?, ?, 'CREATED', 'task', null, ?, ?)`,
      [`act_tm_${i}_1`, tmId, userId, tt.title, `${todayStr}T14:00:00.000Z`]
    );
  }

  // Recalculate daily summaries for all seeded days
  await recalculateDailySummary(userId, todayStr);
  await recalculateDailySummary(userId, yesterdayStr);
  await recalculateDailySummary(userId, twoDaysAgoStr);
  await recalculateDailySummary(userId, threeDaysAgoStr);
  await recalculateDailySummary(userId, tomorrowStr);

  console.log('✅ Demo seed data initialized successfully for user Alex Morgan (demo@dayflow.app)');
}
