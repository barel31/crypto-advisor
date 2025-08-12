import { Redis } from '@upstash/redis';
import { RateLimitInfo } from '../types/api';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const RATE_LIMIT_REQUESTS = 50; // Further reduced to 50 requests per 30 seconds
const RATE_LIMIT_WINDOW = 30 * 1000; // 30 seconds window
const MIN_REQUEST_DELAY = 500; // Minimum 500ms between requests
const MAX_QUEUE_SIZE = 100; // Maximum number of requests in queue

// Request queue implementation
class RequestQueue {
  private queue: Array<{
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
    task: () => Promise<unknown>;
  }> = [];
  private processing = false;

  async add<T>(task: () => Promise<T>): Promise<T> {
    if (this.queue.length >= MAX_QUEUE_SIZE) {
      throw new Error('Request queue is full');
    }

    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        resolve: (value) => resolve(value as T),
        reject,
        task: task as () => Promise<unknown>
      });
      if (!this.processing) {
        void this.process();
      }
    });
  }

  private async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift()!;
      try {
        const result = await request.task();
        await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_DELAY));
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }
    }

    this.processing = false;
  }
}

const requestQueue = new RequestQueue();

// Initialize Redis client
let redis: Redis;

try {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('Redis environment variables not configured');
  }

  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN
  });
} catch (error) {
  console.error('Failed to initialize Redis:', error);
  // Initialize a fallback in-memory cache with TTL support
  const cache = new Map<string, { value: unknown; expires?: number }>();
  
  // Cleanup expired items periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, item] of cache.entries()) {
      if (item.expires && item.expires <= now) {
        cache.delete(key);
      }
    }
  }, 60000); // Clean up every minute

  redis = {
    get: async <T>(key: string) => {
      const item = cache.get(key);
      if (!item) return null;
      if (item.expires && item.expires <= Date.now()) {
        cache.delete(key);
        return null;
      }
      return item.value as T;
    },
    set: async (key: string, value: unknown, options?: { ex?: number }) => {
      const expires = options?.ex ? Date.now() + (options.ex * 1000) : undefined;
      cache.set(key, { value, expires });
      return 'OK';
    },
    incr: async (key: string) => {
      const item = cache.get(key);
      const currentValue = (item?.value as number) || 0;
      const newValue = currentValue + 1;
      cache.set(key, { value: newValue, expires: item?.expires });
      return newValue;
    }
  } as Redis;
}

export { redis };

export class RateLimitError extends Error {
  constructor(resetTime: number) {
    super('Rate limit exceeded');
    this.name = 'RateLimitError';
    this.resetTime = resetTime;
  }
  resetTime: number;
}

export const getRateLimitKey = (ip: string) => `ratelimit:${ip}`;
export const getCacheKey = (endpoint: string, params: string) => `cache:${endpoint}:${params}`;

export async function checkRateLimit(ip: string): Promise<RateLimitInfo> {
  return requestQueue.add(async () => {
    const key = getRateLimitKey(ip);
    const now = Date.now();
    
    const [requestsStr, resetTimeStr, lastRequestStr] = await Promise.all([
      redis.get<string>(`${key}:requests`),
      redis.get<string>(`${key}:reset`),
      redis.get<string>(`${key}:lastRequest`)
    ]);
    
    const requests = requestsStr ? parseInt(requestsStr, 10) : 0;
    const resetTime = resetTimeStr ? parseInt(resetTimeStr, 10) : 0;
    const lastRequest = lastRequestStr ? parseInt(lastRequestStr, 10) : 0;
    
    // Add extended delay between requests
    if (lastRequest && now - lastRequest < MIN_REQUEST_DELAY) {
      await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_DELAY));
    }
    
    if (!resetTime || resetTime < now) {
      // Reset counter if window expired
      await Promise.all([
        redis.set(`${key}:requests`, '1'),
        redis.set(`${key}:reset`, (now + RATE_LIMIT_WINDOW).toString()),
        redis.set(`${key}:lastRequest`, now.toString())
      ]);
      
      return {
        remaining: RATE_LIMIT_REQUESTS - 1,
        reset: now + RATE_LIMIT_WINDOW,
        total: RATE_LIMIT_REQUESTS
      };
    }

    if (requests >= RATE_LIMIT_REQUESTS) {
      const waitTime = resetTime - now;
      if (waitTime <= 5000) { // If reset is within 5 seconds, wait for it
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return checkRateLimit(ip); // Retry after waiting
      }
      throw new RateLimitError(resetTime);
    }

    // Increment request counter
    await redis.incr(`${key}:requests`);
    await redis.set(`${key}:lastRequest`, now.toString());
    
    return {
      remaining: RATE_LIMIT_REQUESTS - (requests + 1),
      reset: resetTime,
      total: RATE_LIMIT_REQUESTS
    };
  });
}

export function getHeaders(rateLimit: RateLimitInfo): Headers {
  return new Headers({
    'X-RateLimit-Limit': rateLimit.total.toString(),
    'X-RateLimit-Remaining': rateLimit.remaining.toString(),
    'X-RateLimit-Reset': new Date(rateLimit.reset).toUTCString()
  });
}

export const COINGECKO_ENDPOINTS = {
  markets: `${COINGECKO_API}/coins/markets`,
  prices: `${COINGECKO_API}/simple/price`
} as const;
