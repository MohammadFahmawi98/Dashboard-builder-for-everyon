import { createClient } from 'redis';

/**
 * Redis client instance for connecting and interacting with the Redis database.
 */
const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

client.on('error', (err) => console.error('[redis] error', err));
client.on('connect', () => console.log('[redis] connected'));

let connected = false;

/**
 * Connects to the Redis database.
 * Logs a warning if REDIS_URL is not set and catches connection errors.
 * @returns {Promise<void>}
 */
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

/**
 * Retrieves a value from the Redis cache by key.
 * @param {string} key - The key for the value to retrieve.
 * @returns {Promise<string | null>} - The value associated with the key or null if not found or not connected.
 */
export async function get(key: string): Promise<string | null> {
  if (!connected) return null;
  try {
    const val = await client.get(key);
    return val ? (typeof val === 'string' ? val : val.toString()) : null;
  } catch { return null; }
}

/**
 * Sets a value in the Redis cache with an optional time-to-live.
 * @param {string} key - The key for the value to set.
 * @param {string} value - The value to store.
 * @param {number} [ttlSeconds=300] - The time-to-live for the cached value in seconds.
 * @returns {Promise<void>}
 */
export async function set(key: string, value: string, ttlSeconds = 300): Promise<void> {
  if (!connected) return;
  try { await client.set(key, value, { EX: ttlSeconds }); } catch (err) { console.error('[redis] set error:', err); }
}

/**
 * Deletes a value from the Redis cache by key.
 * @param {string} key - The key for the value to delete.
 * @returns {Promise<void>}
 */
export async function del(key: string): Promise<void> {
  if (!connected) return;
  try { await client.del(key); } catch (err) { console.error('[redis] del error:', err); }
}

/**
 * Checks if a key exists in the Redis cache.
 * @param {string} key - The key to check for existence.
 * @returns {Promise<boolean>} - True if the key exists, false otherwise.
 */
export async function exists(key: string): Promise<boolean> {
  if (!connected) return false;
  try { return (await client.exists(key)) === 1; } catch { return false; }
}

/**
 * Clears all keys in the current Redis database.
 * @returns {Promise<void>}
 */
export async function clear(): Promise<void> {
  if (!connected) return;
  try { await client.flushDb(); } catch (err) { console.error('[redis] clear error:', err); }
}

export default client;