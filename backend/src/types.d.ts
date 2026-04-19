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

declare var console: {
  log(...args: any[]): void;
  error(...args: any[]): void;
  warn(...args: any[]): void;
  info(...args: any[]): void;
};

declare var Buffer: any;

declare module 'crypto' {
  export function createHash(algorithm: string): {
    update(data: string | Buffer): any;
    digest(encoding: string): string;
  };
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
declare function setInterval(cb: (...args: any[]) => void, ms: number, ...args: any[]): any;
declare function clearInterval(handle: any): void;
