'use client';

import { Card, Title, AreaChart, Subtitle, Tab, TabGroup, TabList, TabPanel, TabPanels } from '@tremor/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import type { AxiosError } from 'axios';
import CryptoCard from './CryptoCard';
import Notification from './Notification';

interface CryptoData {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_24h: number;
  sparkline_in_7d?: { price: number[] };
}

interface MarketSentiment {
  totalMarketCap: number;
  volume24h: number;
  btcDominance: number;
  trend: 'bullish' | 'bearish' | 'neutral';
}

interface Favorite {
  symbol: string;
  name: string;
}

export default function Dashboard() {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [marketSentiment, setMarketSentiment] = useState<MarketSentiment>({
    totalMarketCap: 0,
    volume24h: 0,
    btcDominance: 0,
    trend: 'neutral',
  });
  const [notification, setNotification] = useState<{ message: string; type: 'error' | 'info' | 'success' | 'warning' } | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const filteredCryptoData = cryptoData.filter(
    (crypto) =>
      crypto.name.toLowerCase().includes(search.toLowerCase()) ||
      crypto.symbol.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCryptoData.length / itemsPerPage);

  const paginatedData = filteredCryptoData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Toggle favorite
  const toggleFavorite = (symbol: string, name: string) => {
    setFavorites((prev) => {
      const exists = prev.some((fav) => fav.symbol === symbol);
      return exists ? prev.filter((fav) => fav.symbol !== symbol) : [...prev, { symbol, name }];
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
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
          setNotification({
            message: 'CoinGecko API rate limit exceeded. Please try again later.',
            type: 'error',
          });
        } else {
          console.error('Error fetching data:', error);
        }
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const marketChartData = cryptoData.slice(0, 5).map((crypto) => ({
    name: crypto.symbol.toUpperCase(),
    'Market Cap': crypto.market_cap / 1e9,
  }));

  // Pagination UI
  const PaginationControls = () => (
    <div className="flex justify-center mt-6 gap-2 flex-wrap">
      <button
        disabled={currentPage === 1}
        onClick={() => setCurrentPage((prev) => prev - 1)}
        className="px-3 py-1 rounded border disabled:opacity-50"
      >
        Prev
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => setCurrentPage(page)}
          className={`px-3 py-1 rounded border ${
            currentPage === page ? 'bg-blue-500 text-white' : ''
          }`}
        >
          {page}
        </button>
      ))}
      <button
        disabled={currentPage === totalPages}
        onClick={() => setCurrentPage((prev) => prev + 1)}
        className="px-3 py-1 rounded border disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );

  return (
    <main className="p-4 md:p-10 mx-auto max-w-7xl dark:bg-primary-dark text-primary-dark dark:text-white">
      {notification && (
        <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
      )}
      <div className="mb-8">
        <Title className="text-3xl font-bold text-primary-dark dark:text-accent-cyan">Cryptocurrency Market Overview</Title>
        <Subtitle className="text-lg text-gray-700 dark:text-gray-200">Real-time market data and analysis</Subtitle>
        <div className="mt-4 flex flex-col md:flex-row md:items-center gap-4">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Search for a cryptocurrency..."
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#23263a] text-primary-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex flex-wrap gap-2">
            {favorites.length > 0 && <span className="font-semibold">Favorites:</span>}
            {favorites.map((fav) => (
              <span key={fav.symbol} className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs">
                {fav.name} ({fav.symbol})
              </span>
            ))}
          </div>
        </div>
      </div>

      <Card className="mb-6 bg-gray-50 dark:bg-[#23263a]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg shadow-sm bg-gray-50 dark:bg-[#23263a]">
            <p className="text-base font-semibold text-primary-dark dark:text-accent-cyan">Total Market Cap</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">${(marketSentiment.totalMarketCap / 1e12).toFixed(2)}T</p>
          </div>
          <div className="p-4 rounded-lg shadow-sm bg-gray-50 dark:bg-[#23263a]">
            <p className="text-base font-semibold text-primary-dark dark:text-accent-cyan">24h Volume</p>
            <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">${(marketSentiment.volume24h / 1e9).toFixed(2)}B</p>
          </div>
          <div className="p-4 rounded-lg shadow-sm bg-gray-50 dark:bg-[#23263a]">
            <p className="text-base font-semibold text-primary-dark dark:text-accent-cyan">BTC Dominance</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{marketSentiment.btcDominance.toFixed(2)}%</p>
          </div>
        </div>
      </Card>

      <TabGroup className="mt-6">
        <TabList>
          <Tab>Top Cryptocurrencies</Tab>
          <Tab>All Coins</Tab>
          <Tab>Market Overview</Tab>
          <Tab>Trending</Tab>
        </TabList>
        <TabPanels>
          {/* Top Cryptos */}
          <TabPanel>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {paginatedData.map((crypto) => (
                <div key={crypto.id} className="relative">
                  <CryptoCard
                    symbol={crypto.symbol}
                    name={crypto.name}
                    price={crypto.current_price}
                    change24h={crypto.price_change_percentage_24h}
                    marketCap={crypto.market_cap}
                    volume24h={crypto.total_volume}
                    onClick={() => window.open(`https://www.coingecko.com/en/coins/${crypto.id}`, '_blank')}
                  />
                  <button
                    className={`absolute top-0 right-1 text-xl ${favorites.some(fav => fav.symbol === crypto.symbol) ? 'text-yellow-400' : 'text-gray-400'} hover:text-yellow-500`}
                    onClick={() => toggleFavorite(crypto.symbol, crypto.name)}
                  >
                    ★
                  </button>
                </div>
              ))}
            </div>
            <PaginationControls />
          </TabPanel>

          {/* All Coins */}
          <TabPanel>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {paginatedData.sort((a, b) => a.name.localeCompare(b.name)).map((crypto) => (
                <div key={crypto.id} className="relative">
                  <CryptoCard
                    symbol={crypto.symbol}
                    name={crypto.name}
                    price={crypto.current_price}
                    change24h={crypto.price_change_percentage_24h}
                    marketCap={crypto.market_cap}
                    volume24h={crypto.total_volume}
                    onClick={() => window.open(`https://www.coingecko.com/en/coins/${crypto.id}`, '_blank')}
                  />
                  <button
                    className={`absolute top-0 right-1 text-xl ${favorites.some(fav => fav.symbol === crypto.symbol) ? 'text-yellow-400' : 'text-gray-400'} hover:text-yellow-500`}
                    onClick={() => toggleFavorite(crypto.symbol, crypto.name)}
                  >
                    ★
                  </button>
                </div>
              ))}
            </div>
            <PaginationControls />
          </TabPanel>

          {/* Market Overview */}
          <TabPanel>
            <div className="mt-6">
              <Card className="bg-gray-50 dark:bg-[#23263a]">
                <Title className="text-xl font-bold text-primary-dark dark:text-accent-cyan">Market Cap Distribution</Title>
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

          {/* Trending */}
          <TabPanel>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {paginatedData
                .sort((a, b) => Math.abs(b.price_change_percentage_24h) - Math.abs(a.price_change_percentage_24h))
                .map((crypto) => (
                  <CryptoCard
                    key={crypto.id}
                    symbol={crypto.symbol}
                    name={crypto.name}
                    price={crypto.current_price}
                    change24h={crypto.price_change_percentage_24h}
                    marketCap={crypto.market_cap}
                    volume24h={crypto.total_volume}
                    onClick={() => window.open(`https://www.coingecko.com/en/coins/${crypto.id}`, '_blank')}
                  />
                ))}
            </div>
            <PaginationControls />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </main>
  );
}
