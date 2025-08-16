interface PatternPoint {
  price: number;
  volume: number;
  timestamp: number;
}

interface CandlePattern {
  pattern: string;
  strength: number;
  probability: number;
  significance: 'major' | 'minor';
  type: 'reversal' | 'continuation';
  timeframe: 'short' | 'medium' | 'long';
}

interface FibonacciLevels {
  retracement: {
    level_0: number;   // 0%
    level_236: number; // 23.6%
    level_382: number; // 38.2%
    level_500: number; // 50%
    level_618: number; // 61.8%
    level_786: number; // 78.6%
    level_100: number; // 100%
  };
  extension: {
    level_1618: number; // 161.8%
    level_2618: number; // 261.8%
    level_4236: number; // 423.6%
  };
  pivots: {
    r3: number;      // Resistance 3
    r2: number;      // Resistance 2
    r1: number;      // Resistance 1
    pivot: number;   // Pivot Point
    s1: number;      // Support 1
    s2: number;      // Support 2
    s3: number;      // Support 3
  };
}

interface DoublePattern {
  pattern: string;
  strength: number;
  probability: number;
  significance: 'major' | 'minor';
  type: 'reversal' | 'continuation';
  timeframe: 'short' | 'medium' | 'long';
  confirmationLevel: number;
  invalidationLevel: number;
}

interface PriceAction {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

function getPriceAction(data: PatternPoint[], index: number): PriceAction {
  const slice = data.slice(index - 1, index + 1);
  return {
    open: slice[0].price,
    high: Math.max(...slice.map(p => p.price)),
    low: Math.min(...slice.map(p => p.price)),
    close: slice[slice.length - 1].price,
    volume: slice[slice.length - 1].volume
  };
}

export function detectCandlePatterns(data: PatternPoint[]): CandlePattern[] {
  const patterns: CandlePattern[] = [];
  const prices = data.map(d => d.price);
  
  // Analyze last 20 candles for patterns
  for (let i = 20; i < data.length; i++) {
    const currentCandle = getPriceAction(data, i);
    const prevCandle = getPriceAction(data, i - 1);
    const prev2Candle = getPriceAction(data, i - 2);
    
    // Doji Pattern
    if (isDoji(currentCandle)) {
      patterns.push({
        pattern: 'Doji',
        strength: 0.6,
        probability: calculatePatternProbability(data, 'Doji', i),
        significance: 'minor',
        type: 'reversal',
        timeframe: 'short'
      });
    }
    
    // Hammer Pattern
    if (isHammer(currentCandle)) {
      patterns.push({
        pattern: 'Hammer',
        strength: 0.7,
        probability: calculatePatternProbability(data, 'Hammer', i),
        significance: 'major',
        type: 'reversal',
        timeframe: 'medium'
      });
    }
    
    // Shooting Star
    if (isShootingStar(currentCandle)) {
      patterns.push({
        pattern: 'Shooting Star',
        strength: 0.65,
        probability: calculatePatternProbability(data, 'Shooting Star', i),
        significance: 'major',
        type: 'reversal',
        timeframe: 'short'
      });
    }
    
    // Engulfing Pattern
    if (isEngulfing(currentCandle, prevCandle)) {
      const patternType = currentCandle.close > currentCandle.open ? 'Bullish' : 'Bearish';
      patterns.push({
        pattern: `${patternType} Engulfing`,
        strength: 0.8,
        probability: calculatePatternProbability(data, `${patternType} Engulfing`, i),
        significance: 'major',
        type: 'reversal',
        timeframe: 'medium'
      });
    }
    
    // Morning/Evening Star
    if (isMorningEveningStar(currentCandle, prevCandle, prev2Candle)) {
      const patternType = currentCandle.close > prev2Candle.open ? 'Morning' : 'Evening';
      patterns.push({
        pattern: `${patternType} Star`,
        strength: 0.85,
        probability: calculatePatternProbability(data, `${patternType} Star`, i),
        significance: 'major',
        type: 'reversal',
        timeframe: 'long'
      });
    }
    
    // Three White Soldiers / Black Crows
    if (isThreeSoldiersCrows(data.slice(i - 2, i + 1))) {
      const patternType = currentCandle.close > currentCandle.open ? 'White Soldiers' : 'Black Crows';
      patterns.push({
        pattern: `Three ${patternType}`,
        strength: 0.9,
        probability: calculatePatternProbability(data, `Three ${patternType}`, i),
        significance: 'major',
        type: 'continuation',
        timeframe: 'long'
      });
    }
    
    // Double Top/Bottom (requires looking back further)
    if (i > 30) {
      const doublePattern = findDoublePattern(data.slice(i - 30, i + 1));
      if (doublePattern) {
        patterns.push({
          ...doublePattern,
          significance: 'major',
          type: 'reversal',
          timeframe: 'long'
        });
      }
    }
  }
  
  return patterns;
}

export function calculateFibonacciLevels(high: number, low: number): FibonacciLevels {
  const diff = high - low;
  const levels = {
    retracement: {
      level_0: high,
      level_236: high - (diff * 0.236),
      level_382: high - (diff * 0.382),
      level_500: high - (diff * 0.5),
      level_618: high - (diff * 0.618),
      level_786: high - (diff * 0.786),
      level_100: low
    },
    extension: {
      level_1618: high + (diff * 1.618),
      level_2618: high + (diff * 2.618),
      level_4236: high + (diff * 4.236)
    }
  };

  // Add pivot points
  const pivot = (high + low + levels.retracement.level_500) / 3;
  return {
    ...levels,
    pivots: {
      r3: pivot + (high - low) * 2,
      r2: pivot + (high - low),
      r1: pivot * 2 - low,
      pivot,
      s1: pivot * 2 - high,
      s2: pivot - (high - low),
      s3: pivot - (high - low) * 2
    }
  };
}

export function detectDivergence(
  prices: number[],
  rsi: number[],
  lastNPeriods: number = 10
): { type: 'bullish' | 'bearish' | null; strength: number } {
  const recentPrices = prices.slice(-lastNPeriods);
  const recentRSI = rsi.slice(-lastNPeriods);
  
  const pricesTrend = calculateTrendDirection(recentPrices);
  const rsiTrend = calculateTrendDirection(recentRSI);
  
  if (pricesTrend === 'down' && rsiTrend === 'up') {
    return { type: 'bullish', strength: calculateDivergenceStrength(recentPrices, recentRSI) };
  }
  
  if (pricesTrend === 'up' && rsiTrend === 'down') {
    return { type: 'bearish', strength: calculateDivergenceStrength(recentPrices, recentRSI) };
  }
  
  return { type: null, strength: 0 };
}

import {
  isDoji,
  isHammer,
  isShootingStar,
  isEngulfing,
  isMorningEveningStar,
  isThreeSoldiersCrows,
  findDoublePattern,
  calculatePatternProbability
} from './pattern-analysis';

// Now imported from pattern-analysis.ts

function calculateTrendDirection(values: number[]): 'up' | 'down' | 'sideways' {
  const changes = values.map((val, i) => i > 0 ? val - values[i-1] : 0).slice(1);
  const averageChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;
  
  if (Math.abs(averageChange) < 0.0001) return 'sideways';
  return averageChange > 0 ? 'up' : 'down';
}

function calculateDivergenceStrength(prices: number[], indicator: number[]): number {
  const priceChange = (prices[prices.length - 1] - prices[0]) / prices[0];
  const indicatorChange = (indicator[indicator.length - 1] - indicator[0]) / indicator[0];
  return Math.min(Math.abs(priceChange - indicatorChange), 1);
}
