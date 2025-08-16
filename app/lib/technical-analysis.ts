import { HistoricalDataPoint, TechnicalIndicators } from '../types/analysis';

export function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return 0;
  
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
}

export function calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macd = ema12 - ema26;
  const signal = calculateEMA([macd], 9);
  const histogram = macd - signal;
  
  return { macd, signal, histogram };
}

export function calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): {
  upper: number;
  middle: number;
  lower: number;
} {
  const sma = prices.slice(-period).reduce((a, b) => a + b, 0) / period;
  const squaredDiffs = prices.slice(-period).map(price => Math.pow(price - sma, 2));
  const standardDeviation = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / period);
  
  return {
    upper: sma + stdDev * standardDeviation,
    middle: sma,
    lower: sma - stdDev * standardDeviation
  };
}

export function calculateStochRSI(prices: number[], period: number = 14): number {
  const rsiValues = [];
  let minRSI = Infinity;
  let maxRSI = -Infinity;
  
  // Calculate RSI values for the period
  for (let i = period; i < prices.length; i++) {
    const periodPrices = prices.slice(i - period, i);
    const rsi = calculateRSI(periodPrices);
    rsiValues.push(rsi);
    minRSI = Math.min(minRSI, rsi);
    maxRSI = Math.max(maxRSI, rsi);
  }
  
  // Calculate Stochastic RSI
  const currentRSI = rsiValues[rsiValues.length - 1];
  return (currentRSI - minRSI) / (maxRSI - minRSI) * 100;
}

export function calculateRSI(prices: number[], period: number = 14): number {
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

export function calculateVolatility(prices: number[], period: number = 20): number {
  if (prices.length < period) return 0.02;

  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
  return Math.sqrt(variance);
}

export function detectPatterns(prices: number[]): {
  supportLevel: number;
  resistanceLevel: number;
  trendStrength: number;
} {
  const recentPrices = prices.slice(-50); // Look at last 50 data points
  const localMins: number[] = [];
  const localMaxs: number[] = [];

  // Find local minimums and maximums
  for (let i = 2; i < recentPrices.length - 2; i++) {
    if (recentPrices[i] < recentPrices[i - 1] && recentPrices[i] < recentPrices[i + 1]) {
      localMins.push(recentPrices[i]);
    }
    if (recentPrices[i] > recentPrices[i - 1] && recentPrices[i] > recentPrices[i + 1]) {
      localMaxs.push(recentPrices[i]);
    }
  }

  // Calculate support and resistance levels
  const supportLevel = localMins.length > 0 ? Math.min(...localMins) : prices[prices.length - 1] * 0.95;
  const resistanceLevel = localMaxs.length > 0 ? Math.max(...localMaxs) : prices[prices.length - 1] * 1.05;

  // Calculate trend strength (0-1)
  const priceChange = (prices[prices.length - 1] - prices[0]) / prices[0];
  const trendStrength = Math.min(Math.abs(priceChange), 1);

  return {
    supportLevel,
    resistanceLevel,
    trendStrength
  };
}

export function analyzeTechnicalIndicators(historicalData: HistoricalDataPoint[]): TechnicalIndicators {
  const prices = historicalData.map(d => d.price);
  const volumes = historicalData.map(d => d.volume);
  const currentPrice = prices[prices.length - 1];

  // Calculate all technical indicators
  const rsi = calculateRSI(prices);
  const stochRSI = calculateStochRSI(prices);
  const { macd, signal, histogram } = calculateMACD(prices);
  const bollingerBands = calculateBollingerBands(prices);
  const patterns = detectPatterns(prices);
  const volatility = calculateVolatility(prices);

  // Volume analysis
  const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  const recentVolume = volumes[volumes.length - 1];
  const volumeRatio = recentVolume / avgVolume;

  return {
    price: currentPrice,
    rsi,
    stochRSI,
    macd,
    signal,
    histogram,
    bollingerBands,
    patterns,
    volatility,
    volumeRatio
  };
}

export function calculateConfidenceScore(indicators: TechnicalIndicators): number {
  let score = 0.5; // Base score
  let signals = 0;

  // RSI signals
  if (indicators.rsi < 30) score += 0.1; // Oversold
  if (indicators.rsi > 70) score -= 0.1; // Overbought
  signals++;

  // Stochastic RSI signals
  if (indicators.stochRSI < 20) score += 0.1;
  if (indicators.stochRSI > 80) score -= 0.1;
  signals++;

  // MACD signals
  if (indicators.histogram > 0 && indicators.macd > 0) score += 0.15;
  if (indicators.histogram < 0 && indicators.macd < 0) score -= 0.15;
  signals++;

  // Bollinger Bands signals
  if (indicators.price < indicators.bollingerBands.lower) score += 0.1;
  if (indicators.price > indicators.bollingerBands.upper) score -= 0.1;
  signals++;

  // Volume analysis
  if (indicators.volumeRatio > 1.5) score += 0.1;
  signals++;

  // Trend strength impact
  score *= (1 + indicators.patterns.trendStrength);

  // Normalize score between 0 and 1
  return Math.max(0, Math.min(1, score));
}
