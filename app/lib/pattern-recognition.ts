interface PatternPoint {
  price: number;
  volume: number;
  timestamp: number;
}

interface CandlePattern {
  pattern: string;
  strength: number;
  probability: number;
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
}

export function detectCandlePatterns(data: PatternPoint[]): CandlePattern[] {
  const patterns: CandlePattern[] = [];
  const prices = data.map(d => d.price);
  
  // Doji pattern
  if (isDoji(prices.slice(-1)[0], prices.slice(-2)[0])) {
    patterns.push({
      pattern: 'Doji',
      strength: 0.6,
      probability: calculatePatternProbability(data, 'Doji')
    });
  }
  
  // Hammer pattern
  if (isHammer(prices.slice(-4))) {
    patterns.push({
      pattern: 'Hammer',
      strength: 0.7,
      probability: calculatePatternProbability(data, 'Hammer')
    });
  }
  
  // Engulfing pattern
  if (isEngulfing(prices.slice(-2))) {
    const patternType = prices.slice(-1)[0] > prices.slice(-2)[0] ? 'Bullish' : 'Bearish';
    patterns.push({
      pattern: `${patternType} Engulfing`,
      strength: 0.8,
      probability: calculatePatternProbability(data, `${patternType} Engulfing`)
    });
  }

  return patterns;
}

export function calculateFibonacciLevels(high: number, low: number): FibonacciLevels {
  const diff = high - low;
  
  return {
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

function isDoji(current: number, previous: number): boolean {
  const bodySize = Math.abs(current - previous);
  const averagePrice = (current + previous) / 2;
  return bodySize / averagePrice < 0.001; // 0.1% threshold
}

function isHammer(prices: number[]): boolean {
  const [open, high, low, close] = prices;
  const bodySize = Math.abs(close - open);
  const shadowSize = Math.abs(Math.min(open, close) - low);
  return shadowSize > bodySize * 2 && Math.abs(high - Math.max(open, close)) < bodySize * 0.5;
}

function isEngulfing(prices: number[]): boolean {
  const [previous, current] = prices;
  return Math.abs(current - previous) > Math.abs(previous - prices[2]) * 1.5;
}

function calculatePatternProbability(data: PatternPoint[], pattern: string): number {
  // Simplified probability calculation based on volume and recent price action
  const recentVolume = data.slice(-5).reduce((sum, point) => sum + point.volume, 0) / 5;
  const volumeStrength = data.slice(-1)[0].volume / recentVolume;
  
  // Base probability based on pattern type
  const baseProb = {
    'Doji': 0.55,
    'Hammer': 0.65,
    'Bullish Engulfing': 0.7,
    'Bearish Engulfing': 0.7
  }[pattern] || 0.5;
  
  return Math.min(baseProb * (1 + (volumeStrength - 1) * 0.3), 0.95);
}

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
