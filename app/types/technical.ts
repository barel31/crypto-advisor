export interface TechnicalIndicators {
  price: number;
  rsi: number;
  stochRSI: number;
  macd: number;
  signal: number;
  histogram: number;
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  volumeRatio: number;
  patterns: {
    supportLevel: number;
    resistanceLevel: number;
    trendStrength: number;
  };
  volatility: number;
}
