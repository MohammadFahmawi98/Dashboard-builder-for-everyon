import { createClient } from 'redis';

const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

client.on('error', (err) => console.error('[redis] error', err));
client.on('connect', () => console.log('[redis] connected'));

let connected = false;

export async function connectRedis(): Promise<void> {
  if (connected) return;
  if (!process.env.REDIS_URL) {
    console.warn('[redis] REDIS_URL not set — caching disabled');
    return;
  }
  try {
    await client.connect();
    connected = true;
  } catch (err) {
    console.warn('[redis] unavailable — caching disabled:', (err as Error).message);
    connected = false; // Resetting connected to false on error
  }
}

async function withRedisOperation<T>(operation: () => Promise<T>): Promise<T | null> {
  if (!connected) return null;
  try {
    return await operation();
  } catch {
    return null;
  }
}

export async function get(key: string): Promise<string | null> {
  return withRedisOperation(async () => {
    const val = await client.get(key);
    return val ? (typeof val === 'string' ? val : val.toString()) : null;
  });
}

export async function set(key: string, value: string, ttlSeconds = 300): Promise<void> {
  return withRedisOperation(async () => {
    await client.set(key, value, { EX: ttlSeconds });
  });
}

export async function del(key: string): Promise<void> {
  return withRedisOperation(async () => {
    await client.del(key);
  });
}

export async function exists(key: string): Promise<boolean> {
  return withRedisOperation(async () => {
    return (await client.exists(key)) === 1;
  });
}

export async function clear(): Promise<void> {
  return withRedisOperation(async () => {
    await client.flushDb();
  });
}

export default client;