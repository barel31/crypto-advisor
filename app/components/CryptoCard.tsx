'use client';

import { Card } from '@tremor/react';

interface CryptoCardProps {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  onClick?: () => void;
}

export default function CryptoCard({
  symbol,
  name,
  price,
  change24h,
  marketCap,
  volume24h,
  onClick,
}: CryptoCardProps) {
  return (
    <Card className="p-4 px-5 hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-[#23263a] text-primary-dark dark:text-white" onClick={onClick}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-primary-dark dark:text-accent-cyan truncate max-w-[16rem]" title={name}>{name}</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">{symbol.toUpperCase()}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">${price.toLocaleString()}</p>
          <p className={`text-sm font-semibold ${change24h >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
            title="24h Price Change">
            {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-700 dark:text-gray-300">Market Cap</p>
          <p className="font-medium text-primary-dark dark:text-white">${(marketCap / 1e9).toFixed(2)}B</p>
        </div>
        <div className="text-right">
          <p className="text-gray-700 dark:text-gray-300">24h Volume</p>
          <p className="font-medium text-primary-dark dark:text-white">${(volume24h / 1e6).toFixed(2)}M</p>
        </div>
      </div>
    </Card>
  );
}
