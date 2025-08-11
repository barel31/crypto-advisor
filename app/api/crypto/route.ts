import { NextResponse } from 'next/server';
import axios from 'axios';
import type { AxiosError } from 'axios';
// Simple in-memory cache for price data
type PriceData = Record<string, {
  usd: number;
  usd_24h_change?: number;
  usd_market_cap?: number;
}>;
const priceCache: Record<string, { data: PriceData; timestamp: number }> = {};
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// You'll need to sign up for a free API key at CoinGecko or similar service
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  try {
    if (!symbol) {
      // Get top 100 cryptocurrencies
      const response = await axios.get(`${COINGECKO_API}/coins/markets`, {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 100,
          page: 1,
          sparkline: false
        }
      });
      return NextResponse.json(response.data);
    }

    // Support batching: allow comma-separated symbols
    const symbols = symbol.split(',').map(s => s.trim()).filter(Boolean);
    const cacheKey = symbols.join(',');
    const now = Date.now();
    if (priceCache[cacheKey] && now - priceCache[cacheKey].timestamp < CACHE_TTL) {
      return NextResponse.json(priceCache[cacheKey].data);
    }
    const response = await axios.get(`${COINGECKO_API}/simple/price`, {
      params: {
        ids: symbols.join(','),
        vs_currencies: 'usd',
        include_24hr_change: true,
        include_market_cap: true
      }
    });
    priceCache[cacheKey] = { data: response.data, timestamp: now };
    return NextResponse.json(response.data);
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response && axiosError.response.status === 429) {
      console.error('CoinGecko rate limit exceeded:', error);
      return NextResponse.json({ error: 'CoinGecko API rate limit exceeded. Please try again later.' }, { status: 429 });
    }
    console.error('Error fetching crypto data:', error);
    return NextResponse.json({ error: 'Failed to fetch crypto data' }, { status: 500 });
  }
}
