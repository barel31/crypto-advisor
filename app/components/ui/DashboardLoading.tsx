'use client';

import { MarketStatsSkeleton, CryptoCardSkeleton, ChartSkeleton } from './Skeleton';

export default function DashboardLoading() {
  return (
    <main className="p-4 md:p-10 mx-auto max-w-7xl dark:bg-primary-dark text-primary-dark dark:text-white">
      {/* Header Skeleton */}
      <div className="mb-8 space-y-4">
        <div className="space-y-2">
          <div className="h-8 w-96 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-5 w-64 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="h-10 w-80 bg-gray-300 dark:bg-gray-700 rounded-lg animate-pulse" />
          <div className="flex gap-2">
            <div className="h-6 w-32 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-6 w-24 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Market Stats Skeleton */}
      <MarketStatsSkeleton />

      {/* Crypto List Skeleton */}
      <div className="mt-6">
        {/* Tab Headers */}
        <div className="flex space-x-1 mb-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-8 w-32 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
        
        {/* Grid of Crypto Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 12 }).map((_, index) => (
            <CryptoCardSkeleton key={index} />
          ))}
        </div>

        {/* Pagination Skeleton */}
        <div className="flex justify-center mt-6 gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-8 w-8 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </div>

      {/* Market Overview Chart Skeleton */}
      <div className="mt-6 crypto-card glass-effect p-6">
        <ChartSkeleton />
      </div>
    </main>
  );
}
