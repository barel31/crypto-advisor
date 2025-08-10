import { NextResponse } from 'next/server';
import axios from 'axios';
// Simple in-memory cache for historical data
const historicalCache: Record<string, { data: HistoricalDataPoint[]; timestamp: number }> = {};
const HISTORICAL_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

interface HistoricalDataPoint {
  timestamp: number;
  price: number;
  volume: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    // Map ticker to CoinGecko ID
    const symbolMap: Record<string, string> = {
      BTC: 'bitcoin',
      ETH: 'ethereum',
      ADA: 'cardano',
      BNB: 'binancecoin',
      SOL: 'solana',
      DOGE: 'dogecoin',
      XRP: 'ripple',
      DOT: 'polkadot',
      LTC: 'litecoin',
      MATIC: 'matic-network',
      AVAX: 'avalanche-2',
      // Add more as needed
    };
    const symbol = searchParams.get('symbol');
    const days = searchParams.get('days') || '30';
    const coinId = symbolMap[symbol?.toUpperCase() || ''] || symbol;

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    // Use cache key based on coinId and days
    const cacheKey = `${coinId}_${days}`;
    const now = Date.now();
    if (historicalCache[cacheKey] && now - historicalCache[cacheKey].timestamp < HISTORICAL_CACHE_TTL) {
      return NextResponse.json(historicalCache[cacheKey].data);
    }

    let response;
    try {
      response = await axios.get(
        `${COINGECKO_API}/coins/${coinId}/market_chart`,
        {
          params: {
            vs_currency: 'usd',
            days,
            interval: 'hourly',
          },
        }
      );
    } catch (err) {
      if (typeof err === 'object' && err !== null && 'response' in err && err.response?.status === 429) {
        // CoinGecko rate limit exceeded
        return NextResponse.json(
          { error: 'CoinGecko API rate limit exceeded. Please try again in a few minutes.' },
          { status: 429 }
        );
      }
      if (typeof err === 'object' && err !== null && 'response' in err) {
        console.error('CoinGecko error:', {
          status: err.response.status,
          data: err.response.data,
          url: err.config.url,
          params: err.config.params,
        });
      } else {
        console.error('Unknown error from CoinGecko:', err);
      }
      return NextResponse.json(
        { error: 'Failed to fetch historical data from CoinGecko' },
        { status: 500 }
      );
    }

    // Transform the data into a more usable format
    const { prices, total_volumes } = response.data || {};

    if (!prices || !Array.isArray(prices) || prices.length === 0) {
      return NextResponse.json(
        { error: 'No historical data available for this symbol.' },
        { status: 404 }
      );
    }

    const historicalData: HistoricalDataPoint[] = prices.map(
      (price: [number, number], index: number) => ({
        timestamp: price[0],
        price: price[1],
        volume: total_volumes && total_volumes[index]?.[1] ? total_volumes[index][1] : 0,
      })
    );

    historicalCache[cacheKey] = { data: historicalData, timestamp: now };
    return NextResponse.json(historicalData);
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch historical data' },
      { status: 500 }
    );
  }
}
