export interface CoinGeckoPrice {
  usd: number;
  usd_24h_change?: number;
  usd_market_cap?: number;
}

export interface CoinGeckoMarket {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  total_volume: number;
  image: string;
}

export type PriceData = Record<string, CoinGeckoPrice>;

export interface APIError {
  message: string;
  status: number;
  code?: string;
}

export interface RateLimitInfo {
  remaining: number;
  reset: number;
  total: number;
}
