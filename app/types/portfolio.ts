export interface PortfolioItem {
  id: string;
  symbol: string;
  amount: number;
  buyPrice: number;
  currentPrice?: number;
  profitLoss?: number;
  profitLossPercentage?: number;
}

export interface TradingSuggestion {
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reason: string;
  target_price?: number;
  stop_loss?: number;
  dayChange?: number;
}

export interface NotificationType {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}
