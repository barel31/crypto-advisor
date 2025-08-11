import { Redis } from '@upstash/redis';
import { RateLimitInfo } from '../types/api';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const RATE_LIMIT_REQUESTS = 150; // Adjust based on your API plan
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

// Initialize Redis client
let redis: Redis;

try {
  if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL is not defined');
  }

  redis = new Redis({
    url: process.env.REDIS_URL,
    token: process.env.VERCEL_OIDC_TOKEN || undefined,
  });
} catch (error) {
  console.error('Failed to initialize Redis:', error);
  // Initialize a fallback in-memory cache
  const cache = new Map<string, unknown>();
  redis = {
    get: async <T>(key: string) => cache.get(key) as T | null,
    set: async (key: string, value: unknown, options?: { ex?: number }) => {
      cache.set(key, value);
      if (options?.ex) {
        setTimeout(() => cache.delete(key), options.ex * 1000);
      }
      return 'OK';
    },
    incr: async (key: string) => {
      const value = ((cache.get(key) as number) || 0) + 1;
      cache.set(key, value);
      return value;
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
  const key = getRateLimitKey(ip);
  const now = Date.now();
  
  const [requestsStr, resetTimeStr] = await Promise.all([
    redis.get<string>(`${key}:requests`),
    redis.get<string>(`${key}:reset`)
  ]);
  
  const requests = requestsStr ? parseInt(requestsStr, 10) : 0;
  const resetTime = resetTimeStr ? parseInt(resetTimeStr, 10) : 0;
  
  if (!resetTime || resetTime < now) {
    // Reset counter if window expired
    await Promise.all([
      redis.set(`${key}:requests`, '1'),
      redis.set(`${key}:reset`, (now + RATE_LIMIT_WINDOW).toString())
    ]);
    
    return {
      remaining: RATE_LIMIT_REQUESTS - 1,
      reset: now + RATE_LIMIT_WINDOW,
      total: RATE_LIMIT_REQUESTS
    };
  }

  if (requests >= RATE_LIMIT_REQUESTS) {
    throw new RateLimitError(resetTime);
  }

  // Increment request counter
  await redis.incr(`${key}:requests`);
  
  return {
    remaining: RATE_LIMIT_REQUESTS - (requests + 1),
    reset: resetTime,
    total: RATE_LIMIT_REQUESTS
  };
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
