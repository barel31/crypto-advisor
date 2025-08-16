export interface PriceAction {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PatternPoint {
  price: number;
  volume: number;
  timestamp: number;
}

export interface CandlePattern {
  pattern: string;
  strength: number;
  probability: number;
  significance: 'major' | 'minor';
  type: 'reversal' | 'continuation';
  timeframe: 'short' | 'medium' | 'long';
}

export interface DoublePattern extends CandlePattern {
  confirmationLevel: number;
  invalidationLevel: number;
}

export interface FibonacciLevels {
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
