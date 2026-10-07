# DayFlow - Daily Task & Activity History Management Platform

DayFlow is a daily productivity and task-history platform designed to ensure **you never lose historical records of what happened to a task**. Combining the speed of modern task management, the organizational depth of calendars, and the auditability of git-style immutable activity logs, DayFlow organizes tasks by date, preserves soft deletions, tracks field changes chronologically, and provides daily productivity analytics.

---

## 🌟 Key Features

1. **Daily Task Organization & Dynamic Flow**
   - Automatically organizes tasks by day. When the date changes, the dashboard shifts to the new day while keeping all historical days intact.
   - Dynamic greeting based on time of day (Morning, Afternoon, Evening, Night).
   - Daily progress bars, task counts, and completion percentages.

2. **Immutable Event Logging & Activity Audit**
   - Every task creation, title change, priority change, due time update, completion, reopening, or deletion creates a persistent `TaskActivity` record.
   - Activity drawer displays complete chronological change history showing `Previous Value → New Value` with timestamps.

3. **Soft Deletions Without Data Loss**
   - Deleted tasks are never permanently erased from historical logs.
   - Deleted tasks disappear from the active task view but remain accessible in historical reports and calendar retrospectives labeled with audit timestamps.

4. **Dedicated Daily History Explorer**
   - Select any date (e.g., September 25, September 24, etc.) to review tasks created, completed, edited, and deleted on that day.
   - Detailed activity timeline showing exact timestamps (e.g. `09:10 AM - Task created`, `10:30 AM - Task completed`, `11:20 AM - Task edited`, `06:40 PM - Task deleted`).

5. **Visual Productivity Calendar**
   - Interactive monthly calendar with productivity percentages and color-coded completion indicators.
   - Click any date to jump directly to that day's history and task list.

6. **Productivity Analytics & Streaks**
   - Total tasks, completed tasks, pending tasks, overall completion rate, current streak, and longest streak.
   - Velocity charts (Tasks created vs completed over last 14 days).
   - Weekly productivity trends and category/priority breakdown charts powered by Recharts.

7. **Search & Multi-Filter Matrix**
   - Instant search across task titles, descriptions, and categories.
   - Combine filters: Date + Priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) + Status (`PENDING`, `IN_PROGRESS`, `COMPLETED`) + Category (`Work`, `Personal`, `Learning`, `Shopping`, `Health`, `Other`).

8. **Design & Theming**
   - Dark mode & Light mode with persistent state.
   - Clean SaaS visual architecture following the anti-slop guidelines (zero-pill metadata with typographic separators, tabular numerals, 60-30-10 color balance).
   - Toast notification feedback for all state transitions.

---

## 🛠️ Technology Stack

- **Frontend**:
  - React 19 + TypeScript
  - Vite
  - Tailwind CSS v4
  - Lucide React Icons
  - Recharts for data visualization
- **Backend**:
  - Node.js + Express
  - TypeScript (executed seamlessly with `tsx`)
  - JWT Authentication + bcrypt password hashing
- **Database**:
  - SQLite with immutable event logging tables
  - Prisma Schema definition (`prisma/schema.prisma`)

---

## 📁 Project Structure

```
├── client / src
│   ├── components
│   │   ├── layout
│   │   │   ├── Sidebar.tsx           # SaaS sidebar navigation
│   │   │   └── TopNav.tsx            # Header with search, notifications, theme toggle
│   │   ├── tasks
│   │   │   ├── AddTaskModal.tsx      # Modal to schedule new tasks
│   │   │   ├── EditTaskModal.tsx     # Modal to modify tasks and record field changes
│   │   │   ├── DeleteConfirmModal.tsx# Soft-deletion confirmation
│   │   │   ├── TaskCard.tsx          # Task card with priorities and status toggle
│   │   │   └── TaskHistoryDrawer.tsx # Slide-in drawer with activity timeline
│   │   └── ui
│   │       └── Toast.tsx             # Toast notification system
│   ├── pages
│   │   ├── DashboardPage.tsx         # Main dashboard with greeting, progress, and filters
│   │   ├── TodayTasksPage.tsx        # Dedicated focused today's task workspace
│   │   ├── CalendarPage.tsx          # Monthly heatmap and productivity calendar
│   │   ├── HistoryPage.tsx           # Daily history browser and activity timeline
│   │   ├── AnalyticsPage.tsx         # Long-term velocity charts and category metrics
│   │   ├── SettingsPage.tsx          # Profile, theme, JSON export, and seed reset
│   │   └── AuthPage.tsx              # Login & registration with 1-click demo access
│   ├── services
│   │   └── api.ts                    # REST API client with JWT bearer tokens
│   ├── store
│   │   ├── AuthContext.tsx           # Authentication state & session management
│   │   └── TaskContext.tsx           # Global tasks state, filters, and theme
│   ├── types
│   │   └── index.ts                  # Shared TypeScript interfaces
│   ├── App.tsx                       # Main application shell
│   └── main.tsx                      # Vite React entry point
├── database
│   └── dayflow.sqlite                # Persistent SQLite database file
├── prisma
│   └── schema.prisma                 # Prisma schema definition
├── server
│   ├── controllers
│   │   ├── authController.ts         # User registration, login, profile
│   │   ├── taskController.ts         # CRUD, complete, reopen, delete, history
│   │   ├── historyController.ts      # Daily history and date summaries
│   │   ├── calendarController.ts     # Month-by-month productivity rates
│   │   └── analyticsController.ts    # Velocity charts and streak metrics
│   ├── db
│   │   └── database.ts               # SQLite engine, prepared queries, persistence
│   ├── middleware
│   │   └── auth.ts                   # JWT bearer token validation
│   ├── routes
│   │   ├── authRoutes.ts
│   │   ├── taskRoutes.ts
│   │   ├── historyRoutes.ts
│   │   ├── calendarRoutes.ts
│   │   ├── analyticsRoutes.ts
│   │   └── seedRoutes.ts
│   ├── services
│   │   ├── summaryService.ts         # Dynamic daily completion summary calculations
│   │   ├── taskService.ts            # Immutable event logging logic
│   │   └── historyService.ts         # Historical timeline and analytics aggregation
│   ├── types
│   │   └── index.ts                  # Backend TypeScript interfaces
│   └── seed.ts                       # Demo account setup and explicit sample-data reset
├── server.ts                         # Express server with Vite middleware integration
├── .env.example                      # Environment variables template
├── metadata.json                     # AI Studio application metadata
├── package.json                      # Scripts and dependencies
└── tsconfig.json                     # TypeScript compiler configuration
```

---

## 🗄️ Database Design

```prisma
model User {
  id           String         @id @default(uuid())
  name         String
  email        String         @unique
  passwordHash String
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
  tasks        Task[]
  activities   TaskActivity[]
  summaries    DailySummary[]
}

model Task {
  id          String         @id @default(uuid())
  userId      String
  title       String
  description String?
  category    String         @default("Work")
  priority    String         @default("MEDIUM")
  status      String         @default("PENDING")
  dueDate     String         // YYYY-MM-DD
  dueTime     String?        // HH:mm
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  completedAt DateTime?
  deletedAt   DateTime?      // Soft deletion timestamp
  activities  TaskActivity[]
}

model TaskActivity {
  id        String   @id @default(uuid())
  taskId    String
  userId    String
  action    String   // CREATED, UPDATED, STATUS_CHANGED, PRIORITY_CHANGED, COMPLETED, REOPENED, DELETED
  field     String?  // e.g. "title", "description", "priority", "status", "dueTime", "dueDate"
  oldValue  String?
  newValue  String?
  createdAt DateTime @default(now())
}

model DailySummary {
  id             String   @id @default(uuid())
  userId         String
  date           String   // YYYY-MM-DD
  totalTasks     Int      @default(0)
  completedTasks Int      @default(0)
  pendingTasks   Int      @default(0)
  completionRate Float    @default(0.0)
  createdAt      DateTime @default(now())
}
```

---

## 🚀 Getting Started

### 1. Installation

```bash
npm install
```

### 2. Environment Setup

Create `.env` based on `.env.example`:

```bash
cp .env.example .env
```

Ensure the following variables are defined:
```ini
DATABASE_PATH="./database/dayflow.sqlite"
JWT_SECRET="your_secure_jwt_secret"
PORT=3000
```

### 3. Prisma Commands (Reference)

```bash
npx prisma generate
npx prisma db push
```

### 4. Running the Development Server

The application runs full-stack with Express and Vite mounted together:

```bash
npm run dev
```

Open your browser at `http://localhost:3000`.

### 5. Production Build & Start

```bash
npm run build
npm run start
```

The start script sets `NODE_ENV=production` through a cross-platform launcher, so it works on Windows as well as Linux.

### Deploy the backend to Render

The Vercel deployment serves the frontend; it does not run this Express API. To deploy the API with durable SQLite storage:

1. In Render, create a Blueprint from this repository and use the included `render.yaml`. It creates a Node web service with a persistent disk mounted at `/var/data`.
2. In the Render service environment, set `FRONTEND_URL` to the Vercel site origin, such as `https://amma.vercel.app` (no trailing slash). Add any other frontend origins that need access as a comma-separated list.
3. Deploy the service and verify that `https://<render-service>.onrender.com/api/health` returns JSON with `"status":"ok"`.
4. In the Vercel project settings, set `VITE_API_BASE_URL` to `https://<render-service>.onrender.com/api`, then redeploy the frontend so the build picks up the variable. Without this setting, login and other API requests go to Vercel's frontend host and may return `NOT_FOUND`.

Login and registration validate email address syntax in both the browser and API. This confirms the address is properly formatted; it does not verify that the mailbox exists or belongs to the user.

Render generates the backend `JWT_SECRET` and stores SQLite data at `/var/data/dayflow.sqlite` on the attached persistent disk. Keep the generated secret stable across deployments; changing it invalidates existing login tokens.

---

## 🔑 Default Demo Account

For quick preview and testing without manual signup:
- **Email**: `demo@dayflow.app`
- **Password**: `password123`

### Google Sign-In

To enable Google sign-in, create an OAuth 2.0 Web application client in Google Cloud Console and add your local app origin (for example, `http://localhost:3000`) to its authorized JavaScript origins. Put the same Web Client ID in `VITE_GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_ID` in `.env`, then restart the server. The browser uses the client ID to obtain a Google ID token; the server verifies its signature, audience, and verified-email claim before issuing the app JWT. Existing accounts with the same verified email are linked.

The demo account is created with an empty task list. On startup, legacy sample tasks are removed from the demo account while user-created tasks are preserved. The optional `/api/seed/reset` endpoint restores the sample dataset for preview purposes.

### Task Dates and Team Lead Alerts

Tasks have a required start date and end date. Existing tasks are upgraded automatically; their previous due date is used as both dates. If an unfinished task remains after its end date, the server sends one email alert to `TEAM_LEAD_EMAIL`. Configure `TEAM_LEAD_EMAIL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, and optionally `SMTP_FROM` in `.env` to enable delivery. Alerts are checked on server startup and once per minute. Email alerts remain disabled until valid SMTP settings and a team-lead email are provided.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and obtain JWT token |
| `GET` | `/api/auth/me` | Fetch authenticated user profile |
| `GET` | `/api/tasks` | List tasks (supports `date`, `status`, `priority`, `category`, `search`, `includeDeleted`) |
| `POST` | `/api/tasks` | Create task and log `CREATED` event |
| `GET` | `/api/tasks/:id` | Fetch task by ID |
| `PUT` | `/api/tasks/:id` | Update task and log individual field diffs |
| `DELETE` | `/api/tasks/:id` | Soft delete task and log `DELETED` event |
| `PATCH` | `/api/tasks/:id/complete` | Mark task completed and log `COMPLETED` event |
| `PATCH` | `/api/tasks/:id/reopen` | Reopen task and log `REOPENED` event |
| `GET` | `/api/tasks/:id/history` | Retrieve chronological activity audit for a task |
| `GET` | `/api/history` | List days with recorded summaries |
| `GET` | `/api/history/:date` | Get all tasks and timeline events for a date |
| `GET` | `/api/calendar/:month` | Get completion rates and task counts for a month |
| `GET` | `/api/analytics` | Get productivity velocity, streaks, and breakdowns |
| `POST` | `/api/seed/reset` | Reseed demo dataset |
