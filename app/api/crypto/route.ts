import { NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';
import { 
  COINGECKO_ENDPOINTS,
  checkRateLimit,
  getCacheKey,
  getHeaders,
  RateLimitError,
  redis
} from '@/lib/api-utils';
import type { 
  CoinGeckoMarket,
  PriceData,
  APIError 
} from '@/types/api';

const CACHE_TTL = 10 * 60; // 10 minutes in seconds

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const ip = request.headers.get('x-forwarded-for') || 'unknown';

  try {
    // Check rate limit first
    const rateLimit = await checkRateLimit(ip);
    const headers = getHeaders(rateLimit);

    if (!symbol) {
      // Get top 100 cryptocurrencies
      const cacheKey = getCacheKey('markets', 'top100');
      const cached = await redis.get<CoinGeckoMarket[]>(cacheKey);

      if (cached) {
        return NextResponse.json(cached, { headers });
      }

      const response = await axios.get<CoinGeckoMarket[]>(COINGECKO_ENDPOINTS.markets, {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 100,
          page: 1,
          sparkline: false
        }
      });

      await redis.set(cacheKey, response.data, { ex: CACHE_TTL });
      return NextResponse.json(response.data, { headers });
    }

    // Support batching: allow comma-separated symbols
    const symbols = symbol.split(',').map(s => s.trim()).filter(Boolean);
    
    if (symbols.length === 0) {
      return NextResponse.json<APIError>(
        { message: 'Invalid symbols provided', status: 400 },
        { status: 400, headers }
      );
    }

    if (symbols.length > 50) {
      return NextResponse.json<APIError>(
        { message: 'Too many symbols. Maximum 50 allowed.', status: 400 },
        { status: 400, headers }
      );
    }

    const cacheKey = getCacheKey('prices', symbols.join(','));
    const cached = await redis.get<PriceData>(cacheKey);

    if (cached) {
      return NextResponse.json(cached, { headers });
    }

    const response = await axios.get<PriceData>(COINGECKO_ENDPOINTS.prices, {
      params: {
        ids: symbols.join(','),
        vs_currencies: 'usd',
        include_24hr_change: true,
        include_market_cap: true
      }
    });

    await redis.set(cacheKey, response.data, { ex: CACHE_TTL });
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error in /api/crypto:', error);
    
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: { 'Retry-After': Math.ceil((error.resetTime - Date.now()) / 1000).toString() } }
      );
    }

    const axiosError = error as AxiosError;
    if (axiosError.response?.status === 429) {
      return NextResponse.json(
        { error: 'CoinGecko API rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    if (axiosError.response?.status === 404) {
      return NextResponse.json(
        { error: 'Cryptocurrency not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
