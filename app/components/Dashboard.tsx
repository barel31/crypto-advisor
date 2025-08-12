'use client';

import { Title, Subtitle } from '@tremor/react';
import { useState } from 'react';
import { CryptoData } from '@/app/types/crypto';
import { MarketStats } from './dashboard/MarketStats';
import { MarketOverview } from './dashboard/MarketOverview';
import { CryptoList } from './dashboard/CryptoList';
import { useCryptoData } from '@/app/hooks/useCryptoData';
import { useFavorites } from '@/app/hooks/useFavorites';
import { useFavoritesMigration } from '@/app/hooks/useFavoritesMigration';
import Notification from './Notification';
import DashboardLoading from './ui/DashboardLoading';
import { MarketStatsSkeleton } from './ui/Skeleton';

export default function Dashboard() {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const { cryptoData, marketSentiment, isLoading, error } = useCryptoData();
  const { favorites, toggleFavorite, isLoading: favoritesLoading, error: favoritesError } = useFavorites();
  const { migrationStatus, migrateFromLocalStorage } = useFavoritesMigration();

  // Show full loading state when initially loading crypto data
  if (isLoading && cryptoData.length === 0) {
    return <DashboardLoading />;
  }

  const marketChartData = cryptoData.slice(0, 5).map((crypto: CryptoData) => {
    const marketCapB = crypto.market_cap / 1e9;
    const volumeB = crypto.total_volume / 1e9;
    return {
      name: crypto.name,
      symbol: crypto.symbol.toUpperCase(),
      'Market Cap': marketCapB,
      'Volume': volumeB,
      'Market Share': (crypto.market_cap / marketSentiment.totalMarketCap) * 100,
      change24h: crypto.price_change_percentage_24h,
    };
  });

  return (
    <main className="p-4 md:p-10 mx-auto max-w-7xl dark:bg-primary-dark text-primary-dark dark:text-white">
      {error && (
        <Notification message={error.message} type={error.type} onClose={() => null} />
      )}
      {favoritesError && (
        <Notification message="Failed to load favorites" type="error" onClose={() => null} />
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
            {favoritesLoading && <span className="text-gray-500">Loading favorites...</span>}
            {migrationStatus === 'idle' && typeof window !== 'undefined' && localStorage.getItem('favorites') && (
              <button
                onClick={migrateFromLocalStorage}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                Migrate Local Favorites
              </button>
            )}
            {migrationStatus === 'migrating' && <span className="text-yellow-500">Migrating favorites...</span>}
            {migrationStatus === 'completed' && <span className="text-green-500">Migration completed!</span>}
            {favorites.length > 0 && <span className="font-semibold">Favorites:</span>}
            {favorites.map((fav) => (
              <span key={fav.symbol} className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs">
                {fav.name} ({fav.symbol})
              </span>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <MarketStatsSkeleton />
      ) : (
        <MarketStats marketSentiment={marketSentiment} />
      )}

      <CryptoList 
        cryptoData={cryptoData} 
        favorites={favorites}
        toggleFavorite={toggleFavorite}
        search={search}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        itemsPerPage={itemsPerPage}
        isLoading={isLoading}
      />

      <div className="mt-6">
        <MarketOverview marketChartData={marketChartData} marketSentiment={marketSentiment} />
      </div>
    </main>
  );
}
