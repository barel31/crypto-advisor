'use client';

import { Card } from '@tremor/react';
import { MarketSentiment } from '@/app/types/crypto';

interface MarketStatsProps {
  marketSentiment: MarketSentiment;
}

export function MarketStats({ marketSentiment }: MarketStatsProps) {
  return (
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
  );
}
