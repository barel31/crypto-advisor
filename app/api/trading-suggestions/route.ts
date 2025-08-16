import { NextResponse } from 'next/server';
import axios from 'axios';
import type { AxiosError } from 'axios';
import { prisma } from '@/lib/prisma';

interface TradingSuggestion {
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reason: string;
  target_price?: number;
  stop_loss?: number;
}

interface HistoricalDataPoint {
  price: number;
  volume: number;
}

async function analyzeTrend(symbol: string, historicalData: HistoricalDataPoint[]): Promise<TradingSuggestion> {
  // Simple moving averages
  const prices = historicalData.map(d => d.price);
  const sma20 = calculateSMA(prices, 20);
  const sma50 = calculateSMA(prices, 50);
  
  // RSI calculation
  const rsi = calculateRSI(prices);
  
  // Volume analysis
  const volumes = historicalData.map(d => d.volume);
  const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  const recentVolume = volumes[volumes.length - 1];

  // Current price
  const currentPrice = prices[prices.length - 1];
  
  // Decision making
  let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
  let confidence = 0.5;
  let reason = '';
  
  if (sma20 > sma50 && rsi < 70 && recentVolume > avgVolume * 1.2) {
    action = 'BUY';
    confidence = 0.7 + (recentVolume / avgVolume - 1) * 0.2;
    reason = 'Upward trend with strong volume support';
  } else if (sma20 < sma50 && rsi > 30 && recentVolume > avgVolume * 1.2) {
    action = 'SELL';
    confidence = 0.7 + (recentVolume / avgVolume - 1) * 0.2;
    reason = 'Downward trend with increasing volume';
  } else {
    confidence = 0.5;
    reason = 'No clear trend detected';
  }

  // Calculate target price and stop loss
  const volatility = calculateVolatility(prices);
  const targetPrice = action === 'BUY' ? 
    currentPrice * (1 + volatility * 2) : 
    currentPrice * (1 - volatility * 2);
  const stopLoss = action === 'BUY' ? 
    currentPrice * (1 - volatility) : 
    currentPrice * (1 + volatility);

  return {
    symbol,
    action,
    confidence,
    reason,
    target_price: parseFloat(targetPrice.toFixed(2)),
    stop_loss: parseFloat(stopLoss.toFixed(2))
  };
}

function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return 0;
  const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
  return sum / period;
}

function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;

  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  let gains = changes.map(change => change > 0 ? change : 0);
  let losses = changes.map(change => change < 0 ? -change : 0);

  const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;

  const rs = avgGain / (avgLoss || 1);
  return 100 - (100 / (1 + rs));
}

function calculateVolatility(prices: number[], period: number = 20): number {
  if (prices.length < period) return 0.02; // default volatility

  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
  return Math.sqrt(variance);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      console.error('Missing symbol parameter');
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    // Fetch historical data from your crypto API
    let historicalData: HistoricalDataPoint[];
    try {
      const origin = request.headers.get('origin') || 'http://localhost:3000';
      const url = `${origin}/api/crypto/historical?symbol=${symbol}`;
      const response = await axios.get(url);
      historicalData = response.data;
      if (!historicalData || !Array.isArray(historicalData) || historicalData.length === 0) {
        console.error('Historical data is empty or invalid:', historicalData);
        return NextResponse.json(
          { error: 'No historical data found for symbol' },
          { status: 404 }
        );
      }
    } catch (err) {
      const axiosErr = err as AxiosError;
      if (axiosErr.response && axiosErr.response.status === 404) {
        return NextResponse.json(
          { error: 'No historical data available for this symbol.' },
          { status: 404 }
        );
      }
      if (axiosErr.response && axiosErr.response.status === 429) {
        return NextResponse.json(
          { error: 'CoinGecko API rate limit exceeded. Please try again in a few minutes.' },
          { status: 429 }
        );
      }
      console.error('Error fetching historical data:', err);
      return NextResponse.json(
        { error: 'Failed to fetch historical data' },
        { status: 500 }
      );
    }

    // Analyze the data and generate trading suggestion
    let suggestion: TradingSuggestion;
    try {
      suggestion = await analyzeTrend(symbol, historicalData);
    } catch (err) {
      console.error('Error analyzing trend:', err);
      return NextResponse.json(
        { error: 'Failed to analyze trading trend' },
        { status: 500 }
      );
    }

    // Map action to trend for database
    let trend;
    if (suggestion.action === 'BUY') trend = 'BULLISH';
    else if (suggestion.action === 'SELL') trend = 'BEARISH';
    else trend = 'NEUTRAL';

    // Store the suggestion in the database for tracking
    try {
      await prisma.marketAnalysis.create({
        data: {
          symbol: suggestion.symbol,
          trend,
          confidence: suggestion.confidence,
          analysis: suggestion.reason,
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // valid for 24 hours
        },
      });
    } catch (err) {
      console.error('Error saving analysis to database:', err);
      return NextResponse.json(
        { error: 'Failed to save analysis to database' },
        { status: 500 }
      );
    }

    return NextResponse.json(suggestion);
  } catch (error) {
    console.error('Unknown error generating trading suggestion:', error);
    return NextResponse.json(
      { error: 'Failed to generate trading suggestion' },
      { status: 500 }
    );
  }
}
