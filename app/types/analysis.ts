export interface HistoricalDataPoint {
  price: number;
  volume: number;
  timestamp?: string;
}

export interface BollingerBands {
  upper: number;
  middle: number;
  lower: number;
}

export interface PricePatterns {
  supportLevel: number;
  resistanceLevel: number;
  trendStrength: number;
}

export interface TechnicalIndicators {
  price: number;
  rsi: number;
  stochRSI: number;
  macd: number;
  signal: number;
  histogram: number;
  bollingerBands: BollingerBands;
  patterns: PricePatterns;
  volatility: number;
  volumeRatio: number;
}

export interface TradingSignal {
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reason: string[];
  indicators: TechnicalIndicators;
  target_price: number;
  stop_loss: number;
  timestamp: string;
  timeframe: string;
}

export interface MarketCondition {
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  strength: number;
  volatility: number;
  volume: number;
}

export interface RiskAssessment {
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  score: number;
  factors: string[];
}

export interface TradingSuggestion {
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasons: string[];
  target_price: number;
  stop_loss: number;
  risk: RiskAssessment;
  market: MarketCondition;
  indicators: TechnicalIndicators;
  validUntil: string;
}
