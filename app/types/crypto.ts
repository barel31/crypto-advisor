export interface CryptoData {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_24h: number;
  sparkline_in_7d?: { price: number[] };
}

export interface MarketSentiment {
  totalMarketCap: number;
  volume24h: number;
  btcDominance: number;
  trend: 'bullish' | 'bearish' | 'neutral';
}

export interface Favorite {
  symbol: string;
  name: string;
}

export interface MarketChartData {
  name: string;
  symbol: string;
  'Market Cap': number;
  'Volume': number;
  'Market Share': number;
  change24h: number;
}
