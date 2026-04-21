/**
 * Type declarations for peer dependencies that users need to install.
 * These are not bundled with the package and must be installed separately.
 */

declare module 'better-sqlite3' {
  interface Database {
    exec(sql: string): void;
    prepare(sql: string): Statement;
    close(): void;
  }

  interface Statement {
    run(...params: unknown[]): RunResult;
    all(...params: unknown[]): unknown[];
    get(...params: unknown[]): unknown;
  }

  interface RunResult {
    changes: number;
    lastInsertRowid: number | bigint;
  }

  export = Database;
}

declare module 'mysql2/promise' {
  import { Pool, PoolConnection } from 'mysql2/promise';

  interface PoolOptions {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
    waitForConnections?: boolean;
    connectionLimit?: number;
    queueLimit?: number;
  }

  export interface MySql2 {
    createPool(options: PoolOptions): Pool;
    createPoolConnection(): Promise<PoolConnection>;
  }

  const mysql: {
    default: MySql2;
    createPool(options: PoolOptions): Pool;
    createPoolConnection(): Promise<PoolConnection>;
  };

  export default mysql;
}
