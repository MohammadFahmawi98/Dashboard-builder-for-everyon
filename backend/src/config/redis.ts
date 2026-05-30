import { createClient } from 'redis';

/**
 * This module provides a Redis client for caching purposes.
 * It exports functions to connect to the Redis server and perform operations
 * such as getting, setting, deleting, and checking the existence of keys.
 */

const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

client.on('error', (err) => console.error('[redis] error', err));
client.on('connect', () => console.log('[redis] connected'));

let connected = false;

/**
 * Connect to the Redis server. This function initializes the connection
 * by utilizing the REDIS_URL environment variable, or defaults to localhost.
 * It should be called before any other operations are performed on the Redis client.
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
 * Retrieve a value from the Redis cache by its key.
 * @param {string} key - The key of the value to retrieve.
 * @returns {Promise<string | null>} - The value associated with the key, or null if not found or not connected.
 */
export async function get(key: string): Promise<string | null> {
  if (!connected) return null;
  try {
    const val = await client.get(key);
    return val ? (typeof val === 'string' ? val : val.toString()) : null;
  } catch { return null; }
}

/**
 * Set a value in the Redis cache with an optional time-to-live.
 * @param {string} key - The key to set the value for.
 * @param {string} value - The value to cache.
 * @param {number} ttlSeconds - The time-to-live in seconds (default is 300 seconds).
 * @returns {Promise<void>}
 */
export async function set(key: string, value: string, ttlSeconds = 300): Promise<void> {
  if (!connected) return;
  try { await client.set(key, value, { EX: ttlSeconds }); } catch {}
}

/**
 * Delete a key from the Redis cache.
 * @param {string} key - The key to delete.
 * @returns {Promise<void>}
 */
export async function del(key: string): Promise<void> {
  if (!connected) return;
  try { await client.del(key); } catch {}
}

/**
 * Check if a key exists in the Redis cache.
 * @param {string} key - The key to check.
 * @returns {Promise<boolean>} - True if the key exists, otherwise false.
 */
export async function exists(key: string): Promise<boolean> {
  if (!connected) return false;
  try { return (await client.exists(key)) === 1; } catch { return false; }
}

/**
 * Clear the entire Redis database.
 * @returns {Promise<void>}
 */
export async function clear(): Promise<void> {
  if (!connected) return;
  try { await client.flushDb(); } catch {}
}

export default client;