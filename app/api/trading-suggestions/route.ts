import { NextResponse } from 'next/server';
import axios from 'axios';
import type { AxiosError } from 'axios';
import { prisma } from '@/lib/prisma';

// Types
import {
  HistoricalDataPoint,
  TradingSuggestion,
  RiskAssessment,
  MarketCondition
} from '@/app/types/analysis';
import { TechnicalIndicators } from '@/app/types/technical';

// Analysis utilities
import {
  analyzeTechnicalIndicators,
  calculateConfidenceScore
} from '@/app/lib/technical-analysis';
import { 
  detectCandlePatterns, 
  calculateFibonacciLevels, 
  detectDivergence 
} from '@/app/lib/pattern-recognition';
import { analyzeMarketSentiment } from '@/app/lib/market-sentiment';

async function analyzeTrend(symbol: string, historicalData: HistoricalDataPoint[]): Promise<TradingSuggestion> {
  // Get technical indicators
  const indicators = analyzeTechnicalIndicators(historicalData);
  const currentPrice = indicators.price;
  const prices = historicalData.map(d => d.price);
  const volumes = historicalData.map(d => d.volume);
  
  // Transform data for pattern detection
  const patternData = historicalData.map(d => ({
    price: d.price,
    volume: d.volume,
    timestamp: typeof d.timestamp === 'string' ? new Date(d.timestamp).getTime() : d.timestamp
  }));
  
  // Detect patterns
  const candlePatterns = detectCandlePatterns(patternData);
  
  // Analyze market sentiment
  const sentiment = analyzeMarketSentiment(
    prices,
    volumes,
    indicators.rsi,
    indicators.histogram,
    candlePatterns
  );
  
  // Calculate Fibonacci levels
  const high = Math.max(...prices);
  const low = Math.min(...prices);
  const fibLevels = calculateFibonacciLevels(high, low);
  
  // Detect divergences
  const divergence = detectDivergence(prices, [indicators.rsi]);
  
  // Decision making
  let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
  let reasons: string[] = [];
  
  // Pattern-based signals
  candlePatterns.forEach(pattern => {
    if (pattern.probability > 0.7) {
      if (pattern.pattern.includes('Bullish')) {
        action = 'BUY';
        reasons.push(`Strong ${pattern.pattern} pattern detected (${(pattern.probability * 100).toFixed(1)}% confidence)`);
      } else if (pattern.pattern.includes('Bearish')) {
        action = 'SELL';
        reasons.push(`Strong ${pattern.pattern} pattern detected (${(pattern.probability * 100).toFixed(1)}% confidence)`);
      }
    }
  });
  
  // Divergence signals
  if (divergence.type === 'bullish' && divergence.strength > 0.7) {
    action = 'BUY';
    reasons.push(`Bullish divergence detected (strength: ${(divergence.strength * 100).toFixed(1)}%)`);
  } else if (divergence.type === 'bearish' && divergence.strength > 0.7) {
    action = 'SELL';
    reasons.push(`Bearish divergence detected (strength: ${(divergence.strength * 100).toFixed(1)}%)`);
  }
  
  // Technical indicator signals
  if (indicators.histogram > 0 && indicators.macd > 0) {
    if (action !== 'SELL') action = 'BUY';
    reasons.push('MACD indicates bullish momentum');
  } else if (indicators.histogram < 0 && indicators.macd < 0) {
    if (action !== 'BUY') action = 'SELL';
    reasons.push('MACD indicates bearish momentum');
  }
  
  // RSI analysis with market sentiment context
  if (indicators.rsi < 30 && sentiment.sentiment !== 'BEARISH') {
    if (action !== 'SELL') action = 'BUY';
    reasons.push('RSI indicates oversold conditions with supportive market sentiment');
  } else if (indicators.rsi > 70 && sentiment.sentiment !== 'BULLISH') {
    if (action !== 'BUY') action = 'SELL';
    reasons.push('RSI indicates overbought conditions with weak market sentiment');
  }
  
  // Fibonacci level analysis
  if (action === 'BUY') {
    if (currentPrice <= fibLevels.retracement.level_382) {
      reasons.push('Price at strong Fibonacci support level (38.2%)');
    } else if (currentPrice <= fibLevels.retracement.level_618) {
      reasons.push('Price at key Fibonacci support level (61.8%)');
    }
  } else if (action === 'SELL') {
    if (currentPrice >= fibLevels.extension.level_1618) {
      reasons.push('Price reached Fibonacci extension target (161.8%)');
    }
  }
  
  // Volume and sentiment confirmation
  if (indicators.volumeRatio > 1.5) {
    reasons.push(`Strong volume confirmation (${indicators.volumeRatio.toFixed(2)}x average)`);
  }
  reasons.push(...sentiment.factors);

  // Calculate confidence score based on multiple factors
  const confidence = (
    calculateConfidenceScore(indicators) * 0.4 +
    sentiment.strength * 0.3 +
    (candlePatterns.reduce((acc, p) => acc + p.probability, 0) / candlePatterns.length) * 0.2 +
    (divergence.strength || 0) * 0.1
  );

  // Risk Assessment with sentiment analysis
  const riskLevel = sentiment.volatilityRegime;
  const risk: RiskAssessment = {
    level: riskLevel,
    score: indicators.volatility,
    factors: [
      `Market Sentiment: ${sentiment.sentiment}`,
      `Volatility Regime: ${sentiment.volatilityRegime}`,
      `Momentum Score: ${sentiment.momentumScore.toFixed(2)}`,
      `Pattern Reliability: ${(candlePatterns.reduce((acc, p) => acc + p.probability, 0) / candlePatterns.length * 100).toFixed(1)}%`
    ]
  };

  // Market Condition
  const market: MarketCondition = {
    trend: sentiment.sentiment,
    strength: sentiment.strength,
    volatility: indicators.volatility,
    volume: indicators.volumeRatio
  };

  // If no strong signals or conflicting signals, set to HOLD
  if (reasons.length === 0 || 
      (action === 'BUY' && sentiment.sentiment === 'BEARISH') || 
      (action === 'SELL' && sentiment.sentiment === 'BULLISH')) {
    action = 'HOLD';
    reasons.push('Mixed or unclear market signals');
  }

  // Dynamic target and stop loss based on Fibonacci levels and volatility
  let targetPrice, stopLoss;
  
  if (action === 'BUY') {
    targetPrice = Math.max(
      currentPrice * (1 + indicators.volatility * (2 + sentiment.strength)),
      fibLevels.extension.level_1618
    );
    stopLoss = Math.max(
      currentPrice * (1 - indicators.volatility * 1.5),
      fibLevels.retracement.level_786
    );
  } else if (action === 'SELL') {
    targetPrice = Math.min(
      currentPrice * (1 - indicators.volatility * (2 + sentiment.strength)),
      fibLevels.retracement.level_786
    );
    stopLoss = Math.min(
      currentPrice * (1 + indicators.volatility * 1.5),
      fibLevels.extension.level_1618
    );
  } else {
    targetPrice = currentPrice;
    stopLoss = currentPrice;
  }

  return {
    symbol,
    action,
    confidence,
    reasons,
    target_price: parseFloat(targetPrice.toFixed(2)),
    stop_loss: parseFloat(stopLoss.toFixed(2)),
    risk,
    market,
    indicators,
    validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
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

    // Store the suggestion in the database for tracking
    try {
      await prisma.marketAnalysis.create({
        data: {
          symbol: suggestion.symbol,
          trend: suggestion.market.trend,
          confidence: suggestion.confidence,
          analysis: suggestion.reasons.join('. '),
          risk_level: suggestion.risk.level,
          risk_score: suggestion.risk.score,
          market_strength: suggestion.market.strength,
          target_price: suggestion.target_price,
          stop_loss: suggestion.stop_loss,
          technical_indicators: JSON.stringify(suggestion.indicators),
          validUntil: new Date(suggestion.validUntil),
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
