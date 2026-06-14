declare var process: {
  env: {
    [key: string]: string | undefined;
    PORT?: string;
    JWT_SECRET?: string;
    JWT_EXPIRES_IN?: string;
    DATABASE_URL?: string;
    REDIS_URL?: string;
    FRONTEND_URL?: string;
    NODE_ENV?: string;
  };
};

process.env.JWT_SECRET = process.env.JWT_SECRET || 'your-secure-default-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
process.env.REDIS_URL = process.env.REDIS_URL || 'your-secure-redis-url';

declare var console: {
  log(...args: any[]): void;
  error(...args: any[]): void;
  warn(...args: any[]): void;
  info(...args: any[]): void;
};

declare var Buffer: Buffer;

interface Hash {
  update(data: string | Buffer): Hash;
  digest(encoding: string): string;
}

declare module 'crypto' {
  export function createHash(algorithm: string): Hash;
}

declare var fetch: (url: string, init?: any) => Promise<any>;
declare class AbortController {
  signal: any;
  abort(): void;
}
declare class URLSearchParams {
  constructor(init?: any);
  set(key: string, value: string): void;
  toString(): string;
}
declare function setTimeout(cb: (...args: any[]) => void, ms: number, ...args: any[]): any;
declare function clearTimeout(handle: any): void;
declare function setInterval(cb: (...args: any[]) => void, ms: number, ...args: any[]): void;
declare function clearInterval(handle: any): void;