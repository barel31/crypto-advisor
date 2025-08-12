import { useState, useEffect } from 'react';
import axios from 'axios';
import type { AxiosError } from 'axios';
import { CryptoData, MarketSentiment } from '@/app/types/crypto';

interface UseCryptoDataResult {
  cryptoData: CryptoData[];
  marketSentiment: MarketSentiment;
  isLoading: boolean;
  error: { message: string; type: 'error' | 'info' | 'success' | 'warning' } | null;
}

export function useCryptoData(): UseCryptoDataResult {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ message: string; type: 'error' | 'info' | 'success' | 'warning' } | null>(null);
  const [marketSentiment, setMarketSentiment] = useState<MarketSentiment>({
    totalMarketCap: 0,
    volume24h: 0,
    btcDominance: 0,
    trend: 'neutral',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await axios.get('/api/crypto');
        setCryptoData(response.data);

        const totalMarketCap = response.data.reduce((sum: number, crypto: CryptoData) => sum + crypto.market_cap, 0);
        const volume24h = response.data.reduce((sum: number, crypto: CryptoData) => sum + crypto.total_volume, 0);
        const btcMarketCap = response.data.find((crypto: CryptoData) => crypto.symbol === 'btc')?.market_cap || 0;
        const btcDominance = (btcMarketCap / totalMarketCap) * 100;

        const topCoinsPerformance =
          response.data.slice(0, 10).reduce((sum: number, crypto: CryptoData) => sum + crypto.price_change_percentage_24h, 0) / 10;

        setMarketSentiment({
          totalMarketCap,
          volume24h,
          btcDominance,
          trend: topCoinsPerformance > 2 ? 'bullish' : topCoinsPerformance < -2 ? 'bearish' : 'neutral',
        });
      } catch (error) {
        const axiosError = error as AxiosError;
        if (axiosError.response && axiosError.response.status === 429) {
          setError({
            message: 'CoinGecko API rate limit exceeded. Please try again later.',
            type: 'error',
          });
        } else {
          console.error('Error fetching data:', error);
          setError({
            message: 'Failed to fetch cryptocurrency data',
            type: 'error',
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  return { cryptoData, marketSentiment, isLoading, error };
}
