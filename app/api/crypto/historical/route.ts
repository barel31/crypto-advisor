import { NextResponse } from 'next/server';
import axios from 'axios';
// Simple in-memory cache for historical data
const historicalCache: Record<string, { data: HistoricalDataPoint[]; timestamp: number }> = {};
const HISTORICAL_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

const COINGECKO_API = process.env.COINGECKO_PRO_API_URL || 'https://api.coingecko.com/api/v3';
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const COINGECKO_DEMO_API = 'https://api.coingecko.com/api/v3';

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
      // Determine interval based on days
      const interval = Number(days) <= 1 ? 'minute' : 
                      Number(days) <= 7 ? 'hourly' : 'daily';

      // Try authenticated API first if key is available
      if (COINGECKO_API_KEY) {
        try {
          response = await axios.get(
            `${COINGECKO_API}/coins/${coinId}/market_chart`,
            {
              params: {
                vs_currency: 'usd',
                days,
                interval,
              },
              headers: {
                'x-cg-pro-api-key': COINGECKO_API_KEY
              },
              timeout: 10000, // 10 second timeout
            }
          );
        } catch (err) {
          console.warn('Failed to fetch from pro API, falling back to demo:', err);
          // Let it fall through to demo API
        }
      }

      // If no API key or pro API failed, try demo API with reduced rate
      if (!response) {
        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        response = await axios.get(
          `${COINGECKO_DEMO_API}/coins/${coinId}/market_chart`,
          {
            params: {
              vs_currency: 'usd',
              days,
              interval,
            },
            timeout: 10000, // 10 second timeout
          }
        );
      }

      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid response from CoinGecko API');
      }
    } catch (err) {
      console.error('Error fetching from CoinGecko:', err);

      if (axios.isAxiosError(err)) {
        if (err.response?.status === 429) {
          return NextResponse.json(
            { error: 'Rate limit exceeded. Please try again in a few minutes.' },
            { status: 429 }
          );
        }
        if (err.response?.status === 401 || err.response?.status === 403) {
          console.error('Authentication error with CoinGecko API:', err.response?.data);
          return NextResponse.json(
            { error: 'Unable to authenticate with CoinGecko API. Please try again later.' },
            { status: err.response?.status }
          );
        }
        if (err.response?.status === 404) {
          return NextResponse.json(
            { error: `Cryptocurrency ${symbol} not found` },
            { status: 404 }
          );
        }
        if (err.code === 'ECONNABORTED') {
          return NextResponse.json(
            { error: 'Request timeout. Please try again.' },
            { status: 408 }
          );
        }
        
        return NextResponse.json(
          { error: `CoinGecko API error: ${err.response?.data?.error || 'Unknown error'}` },
          { status: err.response?.status || 500 }
        );
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

    if (!total_volumes || !Array.isArray(total_volumes) || total_volumes.length === 0) {
      console.warn(`No volume data available for ${coinId}`);
    }

    // Create a map of timestamps to volumes for efficient lookup
    const volumeMap = new Map(
      total_volumes?.map((vol: [number, number]) => [vol[0], vol[1]]) || []
    );

    // Transform and validate the data
    const historicalData: HistoricalDataPoint[] = prices
      .map((price: [number, number]) => {
        // Validate price data
        if (!Array.isArray(price) || price.length !== 2 || 
            typeof price[0] !== 'number' || typeof price[1] !== 'number') {
          console.warn(`Invalid price data point for ${coinId}:`, price);
          return null;
        }

        const timestamp = price[0];
        return {
          timestamp,
          price: price[1],
          volume: volumeMap.get(timestamp) || 0,
        };
      })
      .filter((point): point is HistoricalDataPoint => point !== null);

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
