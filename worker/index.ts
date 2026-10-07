import type { Response as ExpressResponse } from 'express';
import * as analyticsController from '../server/controllers/analyticsController.ts';
import * as authController from '../server/controllers/authController.ts';
import * as calendarController from '../server/controllers/calendarController.ts';
import * as historyController from '../server/controllers/historyController.ts';
import * as taskController from '../server/controllers/taskController.ts';
import { AuthenticatedRequest } from '../server/middleware/auth.ts';
import { seedDemoData, ensureDemoAccount } from '../server/seed.ts';
import { createD1Adapter, D1Binding, queryOne, runWithDatabase } from '../server/db/database.ts';
import { verifyToken } from '../server/utils/jwt.ts';

interface WorkerEnvironment {
  DB: D1Binding;
  ASSETS: { fetch(request: Request): Promise<Response> };
  JWT_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  FRONTEND_URL?: string;
}

interface Route {
  method: string;
  path: string;
  authenticated?: boolean;
  handler: (request: AuthenticatedRequest, response: ExpressResponse) => Promise<void>;
}

const routes: Route[] = [
  { method: 'POST', path: '/auth/register', handler: authController.register },
  { method: 'POST', path: '/auth/login', handler: authController.login },
  { method: 'POST', path: '/auth/google', handler: authController.googleLogin },
  { method: 'GET', path: '/auth/me', authenticated: true, handler: authController.getMe },
  { method: 'GET', path: '/tasks', authenticated: true, handler: taskController.listTasks },
  { method: 'POST', path: '/tasks', authenticated: true, handler: taskController.createTask },
  { method: 'GET', path: '/tasks/:id', authenticated: true, handler: taskController.getTask },
  { method: 'PUT', path: '/tasks/:id', authenticated: true, handler: taskController.updateTask },
  { method: 'DELETE', path: '/tasks/:id', authenticated: true, handler: taskController.deleteTask },
  { method: 'PATCH', path: '/tasks/:id/complete', authenticated: true, handler: taskController.completeTask },
  { method: 'PATCH', path: '/tasks/:id/reopen', authenticated: true, handler: taskController.reopenTask },
  { method: 'GET', path: '/tasks/:id/history', authenticated: true, handler: taskController.getTaskHistory },
  { method: 'GET', path: '/history', authenticated: true, handler: historyController.getHistoryDays },
  { method: 'GET', path: '/history/:date', authenticated: true, handler: historyController.getHistoryByDate },
  { method: 'GET', path: '/calendar/:month', authenticated: true, handler: calendarController.getCalendarMonth },
  { method: 'GET', path: '/analytics', authenticated: true, handler: analyticsController.getAnalytics },
  { method: 'GET', path: '/analytics/daily', authenticated: true, handler: analyticsController.getAnalytics },
  { method: 'GET', path: '/analytics/weekly', authenticated: true, handler: analyticsController.getAnalytics },
  { method: 'GET', path: '/analytics/monthly', authenticated: true, handler: analyticsController.getAnalytics },
  {
    method: 'POST',
    path: '/seed/reset',
    handler: async (_request, response) => {
      response.json({ success: true });
    },
  },
];

function matchRoute(route: Route, pathname: string): Record<string, string> | null {
  const routeParts = route.path.split('/');
  const pathParts = pathname.split('/');
  if (routeParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};
  for (let index = 0; index < routeParts.length; index++) {
    const routePart = routeParts[index];
    const pathPart = pathParts[index];
    if (routePart.startsWith(':')) {
      try {
        params[routePart.slice(1)] = decodeURIComponent(pathPart);
      } catch {
        return null;
      }
    } else if (routePart !== pathPart) {
      return null;
    }
  }
  return params;
}

function json(body: unknown, status = 200, headers = new Headers()): Response {
  headers.set('Content-Type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(body), { status, headers });
}

function corsHeaders(request: Request, env: WorkerEnvironment): Headers {
  const headers = new Headers();
  const origin = request.headers.get('Origin');
  const allowedOrigins = (env.FRONTEND_URL ?? '')
    .split(',')
    .map((value) => value.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  if (origin && allowedOrigins.includes(origin.replace(/\/+$/, ''))) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Vary', 'Origin');
    headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  }
  return headers;
}

async function handleApi(request: Request, env: WorkerEnvironment): Promise<Response> {
  const headers = corsHeaders(request, env);
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  const pathname = new URL(request.url).pathname.replace(/^\/api/, '') || '/';
  const database = createD1Adapter(env.DB);
  return runWithDatabase(database, async () => {
    if (pathname === '/health' && request.method === 'GET') {
      await queryOne('SELECT 1 AS ready');
      return json({ status: 'ok', timestamp: new Date().toISOString(), service: 'DayFlow API' }, 200, headers);
    }

    const route = routes.find((candidate) => candidate.method === request.method && matchRoute(candidate, pathname) !== null);
    if (!route) {
      return json({ success: false, message: `API route not found: ${request.method} ${new URL(request.url).pathname}` }, 404, headers);
    }

    if (!env.JWT_SECRET) {
      return json({ success: false, message: 'JWT_SECRET is not configured for this Worker' }, 500, headers);
    }

    let user: AuthenticatedRequest['user'];
    if (route.authenticated) {
      const authorization = request.headers.get('Authorization');
      const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
      if (!token) {
        return json({ success: false, message: 'Authentication token required' }, 401, headers);
      }
      user = verifyToken(token, env.JWT_SECRET) ?? undefined;
      if (!user) {
        return json({ success: false, message: 'Invalid or expired session. Please log in again.' }, 401, headers);
      }
    }

    let body: Record<string, unknown> = {};
    if (['POST', 'PUT', 'PATCH'].includes(request.method) && request.body) {
      try {
        const rawBody = await request.text();
        if (rawBody.trim()) {
          const parsedBody: unknown = JSON.parse(rawBody);
          if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) {
            return json({ success: false, message: 'Request body must be a JSON object' }, 400, headers);
          }
          body = parsedBody as Record<string, unknown>;
        }
      } catch (error) {
        console.warn('Invalid JSON request body:', error);
        return json({ success: false, message: 'Request body must be valid JSON' }, 400, headers);
      }
    }

    const url = new URL(request.url);
    const req = {
      body,
      params: matchRoute(route, pathname) ?? {},
      query: Object.fromEntries(url.searchParams.entries()),
      headers: Object.fromEntries(request.headers.entries()),
      method: request.method,
      url: request.url,
      user,
      env,
    } as unknown as AuthenticatedRequest;

    let status = 200;
    let responseBody: unknown;
    const res = {
      status(code: number) {
        status = code;
        return this;
      },
      json(value: unknown) {
        responseBody = value;
        return this;
      },
    } as unknown as ExpressResponse;

    try {
      if (pathname === '/auth/login' && String(body.email ?? '').trim().toLowerCase() === 'demo@dayflow.app') {
        await ensureDemoAccount();
      }
      if (pathname === '/seed/reset' && request.method === 'POST') {
        await seedDemoData();
        responseBody = {
          success: true,
          message: 'Demo dataset reset successfully with rich tasks and immutable activity history',
        };
      } else {
        await route.handler(req, res);
      }
    } catch (error) {
      console.error('Worker API request failed:', error);
      return json({ success: false, message: 'An internal server error occurred' }, 500, headers);
    }
    if (responseBody === undefined) {
      return json({ success: false, message: 'API handler did not produce a response' }, 500, headers);
    }
    return json(responseBody, status, headers);
  });
}

export default {
  async fetch(request: Request, env: WorkerEnvironment): Promise<Response> {
    const pathname = new URL(request.url).pathname;
    if (pathname.startsWith('/api/')) {
      try {
        return await handleApi(request, env);
      } catch (error) {
        console.error('Worker API error:', error);
        return json({ success: false, message: 'An internal server error occurred' }, 500);
      }
    }
    return env.ASSETS.fetch(request);
  },
};
