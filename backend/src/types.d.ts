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
