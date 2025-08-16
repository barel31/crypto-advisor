import { PriceAction } from './types';

export function isDoji(candle: PriceAction): boolean {
  const bodySize = Math.abs(candle.close - candle.open);
  const totalRange = candle.high - candle.low;
  return bodySize / totalRange < 0.1; // Body is less than 10% of total range
}

export function isHammer(candle: PriceAction): boolean {
  const bodySize = Math.abs(candle.close - candle.open);
  const upperShadow = candle.high - Math.max(candle.open, candle.close);
  const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
  
  return (
    lowerShadow > bodySize * 2 && // Lower shadow at least 2x body
    upperShadow < bodySize * 0.5 && // Upper shadow less than half body
    bodySize > 0 // Ensure it's not a doji
  );
}

export function isShootingStar(candle: PriceAction): boolean {
  const bodySize = Math.abs(candle.close - candle.open);
  const upperShadow = candle.high - Math.max(candle.open, candle.close);
  const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
  
  return (
    upperShadow > bodySize * 2 && // Upper shadow at least 2x body
    lowerShadow < bodySize * 0.5 && // Lower shadow less than half body
    bodySize > 0 // Ensure it's not a doji
  );
}

export function isEngulfing(current: PriceAction, previous: PriceAction): boolean {
  const currentBodySize = Math.abs(current.close - current.open);
  const previousBodySize = Math.abs(previous.close - previous.open);
  const isBullish = current.close > current.open;
  const wasBearish = previous.close < previous.open;
  
  if (isBullish && wasBearish) {
    return (
      current.open < previous.close &&
      current.close > previous.open &&
      currentBodySize > previousBodySize * 1.1 // 10% bigger
    );
  }
  
  const isBearish = current.close < current.open;
  const wasBullish = previous.close > previous.open;
  
  if (isBearish && wasBullish) {
    return (
      current.open > previous.close &&
      current.close < previous.open &&
      currentBodySize > previousBodySize * 1.1
    );
  }
  
  return false;
}

export function isMorningEveningStar(
  current: PriceAction,
  middle: PriceAction,
  first: PriceAction
): boolean {
  const middleBodySize = Math.abs(middle.close - middle.open);
  const firstBodySize = Math.abs(first.close - first.open);
  const currentBodySize = Math.abs(current.close - current.open);
  
  // Check for small middle candle (star)
  const isStarSmall = middleBodySize < firstBodySize * 0.3;
  
  // Morning Star
  if (
    first.close < first.open && // First candle bearish
    current.close > current.open && // Last candle bullish
    isStarSmall &&
    middle.close < first.close && // Gap down
    current.close > middle.high && // Gap up
    current.close > (first.open + first.close) / 2 // Retraces more than 50%
  ) {
    return true;
  }
  
  // Evening Star
  if (
    first.close > first.open && // First candle bullish
    current.close < current.open && // Last candle bearish
    isStarSmall &&
    middle.open > first.close && // Gap up
    current.open < middle.low && // Gap down
    current.close < (first.open + first.close) / 2 // Retraces more than 50%
  ) {
    return true;
  }
  
  return false;
}

export function isThreeSoldiersCrows(candles: PriceAction[]): boolean {
  if (candles.length < 3) return false;
  
  const [first, second, third] = candles;
  const isBullish = third.close > third.open;
  
  // Check direction consistency
  if (isBullish) {
    if (
      first.close <= first.open ||
      second.close <= second.open ||
      third.close <= third.open
    ) {
      return false;
    }
  } else {
    if (
      first.close >= first.open ||
      second.close >= second.open ||
      third.close >= third.open
    ) {
      return false;
    }
  }
  
  // Check progressive closes
  if (isBullish) {
    return (
      third.close > second.close &&
      second.close > first.close &&
      third.open > second.open &&
      second.open > first.open
    );
  } else {
    return (
      third.close < second.close &&
      second.close < first.close &&
      third.open < second.open &&
      second.open < first.open
    );
  }
}

export function findDoublePattern(data: PatternPoint[]): DoublePattern | null {
  const prices = data.map(d => d.price);
  const tolerance = 0.02; // 2% tolerance for peak/trough matching
  
  // Find local maxima and minima
  const peaks: number[] = [];
  const troughs: number[] = [];
  
  for (let i = 1; i < prices.length - 1; i++) {
    if (prices[i] > prices[i - 1] && prices[i] > prices[i + 1]) {
      peaks.push(i);
    }
    if (prices[i] < prices[i - 1] && prices[i] < prices[i + 1]) {
      troughs.push(i);
    }
  }
  
  // Look for double tops
  for (let i = 0; i < peaks.length - 1; i++) {
    const firstPeak = prices[peaks[i]];
    const secondPeak = prices[peaks[i + 1]];
    const peakDiff = Math.abs(firstPeak - secondPeak) / firstPeak;
    
    if (peakDiff <= tolerance && peaks[i + 1] - peaks[i] >= 5) {
      // Find lowest point between peaks
      const valley = Math.min(
        ...prices.slice(peaks[i], peaks[i + 1])
      );
      
      return {
        pattern: 'Double Top',
        strength: 0.8,
        probability: 0.7,
        significance: 'major',
        type: 'reversal',
        timeframe: 'long',
        confirmationLevel: valley,
        invalidationLevel: Math.max(firstPeak, secondPeak)
      };
    }
  }
  
  // Look for double bottoms
  for (let i = 0; i < troughs.length - 1; i++) {
    const firstTrough = prices[troughs[i]];
    const secondTrough = prices[troughs[i + 1]];
    const troughDiff = Math.abs(firstTrough - secondTrough) / firstTrough;
    
    if (troughDiff <= tolerance && troughs[i + 1] - troughs[i] >= 5) {
      // Find highest point between troughs
      const peak = Math.max(
        ...prices.slice(troughs[i], troughs[i + 1])
      );
      
      return {
        pattern: 'Double Bottom',
        strength: 0.8,
        probability: 0.7,
        significance: 'major',
        type: 'reversal',
        timeframe: 'long',
        confirmationLevel: peak,
        invalidationLevel: Math.min(firstTrough, secondTrough)
      };
    }
  }
  
  return null;
}

export function calculatePatternProbability(
  data: PatternPoint[],
  pattern: string,
  index: number
): number {
  const recentData = data.slice(Math.max(0, index - 20), index + 1);
  const volumes = recentData.map(d => d.volume);
  const prices = recentData.map(d => d.price);
  
  // Volume factor (0-1)
  const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  const recentVolume = volumes[volumes.length - 1];
  const volumeFactor = Math.min(recentVolume / avgVolume, 2) / 2;
  
  // Trend factor (0-1)
  const trendFactor = calculateTrendStrength(prices);
  
  // Pattern-specific base probabilities
  const baseProb = {
    'Doji': 0.55,
    'Hammer': 0.65,
    'Shooting Star': 0.65,
    'Bullish Engulfing': 0.7,
    'Bearish Engulfing': 0.7,
    'Morning Star': 0.75,
    'Evening Star': 0.75,
    'Three White Soldiers': 0.8,
    'Three Black Crows': 0.8,
    'Double Top': 0.7,
    'Double Bottom': 0.7
  }[pattern] || 0.5;
  
  // Combine factors
  return Math.min(
    baseProb * (1 + volumeFactor * 0.3 + trendFactor * 0.2),
    0.95
  );
}

function calculateTrendStrength(prices: number[]): number {
  const changes = prices.map((p, i) => i > 0 ? (p - prices[i-1]) / prices[i-1] : 0);
  const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
  return Math.min(Math.abs(avgChange) * 100, 1);
}
