'use client';

import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@tremor/react';
import { CryptoData, Favorite } from '@/app/types/crypto';
import CryptoCard from '../CryptoCard';
import { CryptoCardSkeleton } from '../ui/Skeleton';

interface CryptoListProps {
  cryptoData: CryptoData[];
  favorites: Favorite[];
  toggleFavorite: (symbol: string, name: string) => void;
  search: string;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  isLoading?: boolean;
}

export function CryptoList({
  cryptoData,
  favorites,
  toggleFavorite,
  search,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  isLoading = false
}: CryptoListProps) {
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

  const PaginationControls = () => (
    <div className="flex justify-center mt-6 gap-2 flex-wrap">
      <button
        disabled={currentPage === 1}
        onClick={() => setCurrentPage(currentPage - 1)}
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
        onClick={() => setCurrentPage(currentPage + 1)}
        className="px-3 py-1 rounded border disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );

  return (
    <TabGroup className="mt-6">
      <TabList>
        <Tab>Top Cryptocurrencies</Tab>
        <Tab>All Coins</Tab>
        <Tab>Trending</Tab>
      </TabList>
      <TabPanels>
        {/* Top Cryptos */}
        <TabPanel>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {isLoading && cryptoData.length === 0 ? (
              Array.from({ length: itemsPerPage }).map((_, index) => (
                <CryptoCardSkeleton key={index} />
              ))
            ) : (
              paginatedData.map((crypto) => (
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
              ))
            )}
          </div>
          <PaginationControls />
        </TabPanel>

        {/* All Coins */}
        <TabPanel>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {isLoading && cryptoData.length === 0 ? (
              Array.from({ length: itemsPerPage }).map((_, index) => (
                <CryptoCardSkeleton key={index} />
              ))
            ) : (
              paginatedData.sort((a, b) => a.name.localeCompare(b.name)).map((crypto) => (
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
              ))
            )}
          </div>
          <PaginationControls />
        </TabPanel>

        {/* Trending */}
        <TabPanel>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {isLoading && cryptoData.length === 0 ? (
              Array.from({ length: itemsPerPage }).map((_, index) => (
                <CryptoCardSkeleton key={index} />
              ))
            ) : (
              paginatedData
                .sort((a, b) => Math.abs(b.price_change_percentage_24h) - Math.abs(a.price_change_percentage_24h))
                .map((crypto) => (
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
                ))
            )}
          </div>
          <PaginationControls />
        </TabPanel>
      </TabPanels>
    </TabGroup>
  );
}
