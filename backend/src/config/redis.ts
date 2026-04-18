import { createClient } from 'redis';

const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

client.on('error', (err) => console.error('[redis] error', err));
client.on('connect', () => console.log('[redis] connected'));

let connected = false;

export async function connectRedis(): Promise<void> {
  if (connected) return;
  try {
    await client.connect();
    connected = true;
  } catch (err) {
    console.warn('[redis] unavailable — caching disabled:', (err as Error).message);
  }
}

export async function get(key: string): Promise<string | null> {
  if (!connected) return null;
  try {
    const val = await client.get(key);
    return val ? (typeof val === 'string' ? val : val.toString()) : null;
  } catch { return null; }
}

export async function set(key: string, value: string, ttlSeconds = 300): Promise<void> {
  if (!connected) return;
  try { await client.set(key, value, { EX: ttlSeconds }); } catch {}
}

export async function del(key: string): Promise<void> {
  if (!connected) return;
  try { await client.del(key); } catch {}
}

export async function exists(key: string): Promise<boolean> {
  if (!connected) return false;
  try { return (await client.exists(key)) === 1; } catch { return false; }
}

export async function clear(): Promise<void> {
  if (!connected) return;
  try { await client.flushDb(); } catch {}
}

export default client;
