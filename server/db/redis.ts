// server/db/redis.ts — Redis cache layer with helpers
import pkg from 'ioredis';
const { default: Redis } = pkg as any;

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redis: any = null;
let isRedisConnected = false;

export const connectRedis = async (): Promise<void> => {
  try {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 1,
      retryStrategy(times: number) {
        if (times > 1) return null; // Stop retrying immediately
        return 500;
      },
      lazyConnect: true,
      enableOfflineQueue: false,
      reconnectOnError: () => false,
    });

    // Suppress unhandled error events (prevents crash when Redis is down)
    redis.on('error', () => {
      if (isRedisConnected) {
        console.warn('⚠️  Redis connection lost');
        isRedisConnected = false;
      }
    });

    redis.on('close', () => {
      isRedisConnected = false;
    });

    await redis.connect();
    isRedisConnected = true;
    console.log('✅ Redis connected');
  } catch (error) {
    console.warn('⚠️  Redis unavailable — running without cache (this is OK for dev)');
    redis = null;
    isRedisConnected = false;
  }
};

export const disconnectRedis = async (): Promise<void> => {
  if (redis) {
    await redis.quit();
    console.log('🔌 Redis disconnected');
  }
};

// ─── Cache Helpers (graceful fallback when Redis unavailable) ───

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  if (!redis || !isRedisConnected) return null;
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
};

export const cacheSet = async (key: string, value: any, ttlSeconds = 60): Promise<void> => {
  if (!redis || !isRedisConnected) return;
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch { /* silent */ }
};

export const cacheDelete = async (key: string): Promise<void> => {
  if (!redis || !isRedisConnected) return;
  try { await redis.del(key); } catch { /* silent */ }
};

export const cacheDeletePattern = async (pattern: string): Promise<void> => {
  if (!redis || !isRedisConnected) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  } catch { /* silent */ }
};

// ─── Session / Online Tracking ───

export const trackOnlineUser = async (userId: string, socketId: string): Promise<void> => {
  if (!redis || !isRedisConnected) return;
  try { await redis.setex(`online:${userId}`, 300, socketId); } catch { /* silent */ }
};

export const removeOnlineUser = async (userId: string): Promise<void> => {
  if (!redis || !isRedisConnected) return;
  try { await redis.del(`online:${userId}`); } catch { /* silent */ }
};

export const getOnlineUsers = async (): Promise<string[]> => {
  if (!redis || !isRedisConnected) return [];
  try {
    const keys = await redis.keys('online:*');
    return keys.map((k: string) => k.replace('online:', ''));
  } catch { return []; }
};

// ─── Token Blacklist (for logout) ───

export const blacklistToken = async (token: string, expiresInSec: number): Promise<void> => {
  if (!redis || !isRedisConnected) return;
  try { await redis.setex(`blacklist:${token}`, expiresInSec, '1'); } catch { /* silent */ }
};

export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  if (!redis || !isRedisConnected) return false;
  try { return (await redis.exists(`blacklist:${token}`)) === 1; } catch { return false; }
};

export const getRedisStatus = () => ({ isConnected: isRedisConnected });
export { redis };
