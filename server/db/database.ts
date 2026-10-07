import { AsyncLocalStorage } from 'node:async_hooks';

export interface DatabaseAdapter {
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
  queryOne<T>(sql: string, params?: unknown[]): Promise<T | null>;
  execute(sql: string, params?: unknown[]): Promise<void>;
}

export interface D1Binding {
  prepare(sql: string): {
    bind(...values: unknown[]): {
      all<T>(): Promise<{ results: T[] }>;
      run(): Promise<unknown>;
    };
  };
}

const databaseContext = new AsyncLocalStorage<DatabaseAdapter>();

export function runWithDatabase<T>(database: DatabaseAdapter, callback: () => T): T {
  return databaseContext.run(database, callback);
}

function getDatabase(): DatabaseAdapter {
  const database = databaseContext.getStore();
  if (!database) {
    throw new Error('No database is available in the current request context');
  }
  return database;
}

export function createD1Adapter(binding: D1Binding): DatabaseAdapter {
  return {
    async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
      const result = await binding.prepare(sql).bind(...params).all<T>();
      return result.results;
    },
    async queryOne<T>(sql: string, params: unknown[] = []): Promise<T | null> {
      const result = await binding.prepare(sql).bind(...params).all<T>();
      return result.results[0] ?? null;
    },
    async execute(sql: string, params: unknown[] = []): Promise<void> {
      await binding.prepare(sql).bind(...params).run();
    },
  };
}

export async function query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  return getDatabase().query<T>(sql, params);
}

export async function queryOne<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T | null> {
  return getDatabase().queryOne<T>(sql, params);
}

export async function execute(sql: string, params: unknown[] = []): Promise<void> {
  return getDatabase().execute(sql, params);
}
