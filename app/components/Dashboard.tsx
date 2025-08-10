'use client';

import { Card, Title, AreaChart, Subtitle, Tab, TabGroup, TabList, TabPanel, TabPanels } from '@tremor/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import CryptoCard from './CryptoCard';

interface CryptoData {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_24h: number;
  sparkline_in_7d?: {
    price: number[];
  };
}

interface MarketSentiment {
  totalMarketCap: number;
  volume24h: number;
  btcDominance: number;
  trend: 'bullish' | 'bearish' | 'neutral';
}

export default function Dashboard() {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [marketSentiment, setMarketSentiment] = useState<MarketSentiment>({
    totalMarketCap: 0,
    volume24h: 0,
    btcDominance: 0,
    trend: 'neutral',
  });
  const [selectedView, setSelectedView] = useState('overview');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/crypto');
        setCryptoData(response.data);

        // Calculate market sentiment
        const totalMarketCap = response.data.reduce((sum: number, crypto: CryptoData) => sum + crypto.market_cap, 0);
        const volume24h = response.data.reduce((sum: number, crypto: CryptoData) => sum + crypto.total_volume, 0);
        const btcMarketCap = response.data.find((crypto: CryptoData) => crypto.symbol === 'btc')?.market_cap || 0;
        const btcDominance = (btcMarketCap / totalMarketCap) * 100;

        // Simple trend calculation based on top coins' performance
        const topCoinsPerformance = response.data
          .slice(0, 10)
          .reduce((sum: number, crypto: CryptoData) => sum + crypto.price_change_percentage_24h, 0) / 10;

        setMarketSentiment({
          totalMarketCap,
          volume24h,
          btcDominance,
          trend: topCoinsPerformance > 2 ? 'bullish' : topCoinsPerformance < -2 ? 'bearish' : 'neutral',
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const marketChartData = cryptoData.slice(0, 5).map((crypto) => ({
    name: crypto.symbol.toUpperCase(),
    'Market Cap': crypto.market_cap / 1e9,
  }));

  return (
    <main className="p-4 md:p-10 mx-auto max-w-7xl">
      <div className="mb-8">
        <Title>Cryptocurrency Market Overview</Title>
        <Subtitle>Real-time market data and analysis</Subtitle>
      </div>

      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">Total Market Cap</p>
            <p className="text-tremor-metric font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
              ${(marketSentiment.totalMarketCap / 1e12).toFixed(2)}T
            </p>
          </div>
          <div>
            <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">24h Volume</p>
            <p className="text-tremor-metric font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
              ${(marketSentiment.volume24h / 1e9).toFixed(2)}B
            </p>
          </div>
          <div>
            <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">BTC Dominance</p>
            <p className="text-tremor-metric font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
              {marketSentiment.btcDominance.toFixed(2)}%
            </p>
          </div>
        </div>
      </Card>

      <TabGroup className="mt-6">
        <TabList>
          <Tab>Top Cryptocurrencies</Tab>
          <Tab>Market Overview</Tab>
          <Tab>Trending</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {cryptoData.slice(0, 6).map((crypto) => (
                <CryptoCard
                  key={crypto.id}
                  symbol={crypto.symbol}
                  name={crypto.name}
                  price={crypto.current_price}
                  change24h={crypto.price_change_percentage_24h}
                  marketCap={crypto.market_cap}
                  volume24h={crypto.total_volume}
                />
              ))}
            </div>
          </TabPanel>
          <TabPanel>
            <div className="mt-6">
              <Card>
                <Title>Market Cap Distribution</Title>
                <AreaChart
                  className="mt-4 h-72"
                  data={marketChartData}
                  index="name"
                  categories={["Market Cap"]}
                  colors={["blue"]}
                  valueFormatter={(number) => `$${number.toFixed(2)}B`}
                />
              </Card>
            </div>
          </TabPanel>
          <TabPanel>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {cryptoData
                .sort((a, b) => Math.abs(b.price_change_percentage_24h) - Math.abs(a.price_change_percentage_24h))
                .slice(0, 6)
                .map((crypto) => (
                  <CryptoCard
                    key={crypto.id}
                    symbol={crypto.symbol}
                    name={crypto.name}
                    price={crypto.current_price}
                    change24h={crypto.price_change_percentage_24h}
                    marketCap={crypto.market_cap}
                    volume24h={crypto.total_volume}
                  />
                ))}
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </main>
  );
}
