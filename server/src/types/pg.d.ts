declare module "pg" {
  export interface QueryResult<R = any> {
    rows: R[];
  }

  export interface PoolClient {
    query: <R = any>(queryText: string, values?: any[]) => Promise<QueryResult<R>>;
    release: () => void;
  }

  export interface PoolConfig {
    connectionString?: string;
    max?: number;
    idleTimeoutMillis?: number;
  }

  export class Pool {
    constructor(config?: PoolConfig);
    query: <R = any>(queryText: string, values?: any[]) => Promise<QueryResult<R>>;
    connect: () => Promise<PoolClient>;
    end: () => Promise<void>;
    on: (event: "connect" | "error", listener: (...args: any[]) => void) => void;
  }
}

