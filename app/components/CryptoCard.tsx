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
    <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">{name}</h3>
          <p className="text-sm text-gray-500">{symbol.toUpperCase()}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold">${price.toLocaleString()}</p>
          <p className={`text-sm ${change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-500">
        <div>
          <p>Market Cap</p>
          <p className="font-medium">${(marketCap / 1e9).toFixed(2)}B</p>
        </div>
        <div className="text-right">
          <p>24h Volume</p>
          <p className="font-medium">${(volume24h / 1e6).toFixed(2)}M</p>
        </div>
      </div>
    </Card>
  );
}
