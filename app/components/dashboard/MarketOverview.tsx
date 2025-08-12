'use client';

import { Card, Title, AreaChart, Badge } from '@tremor/react';
import { MarketChartData, MarketSentiment } from '@/app/types/crypto';

interface MarketOverviewProps {
  marketChartData: MarketChartData[];
  marketSentiment: MarketSentiment;
}

export function MarketOverview({ marketChartData, marketSentiment }: MarketOverviewProps) {
  return (
    <Card className="bg-gray-50 dark:bg-[#23263a] p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <Title className="text-xl font-bold text-primary-dark dark:text-accent-cyan">Market Overview</Title>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Top 5 cryptocurrencies by market cap
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge color={marketSentiment.trend === 'bullish' ? 'green' : marketSentiment.trend === 'bearish' ? 'red' : 'yellow'}>
            {marketSentiment.trend.toUpperCase()}
          </Badge>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <AreaChart
          className="h-72"
          data={marketChartData}
          index="name"
          categories={["Market Cap"]}
          colors={["cyan"]}
          valueFormatter={(number) => `$${number.toFixed(2)}B`}
          showAnimation={true}
          showLegend={false}
          showGridLines={false}
        />
        <AreaChart
          className="h-72"
          data={marketChartData}
          index="name"
          categories={["Volume"]}
          colors={["blue"]}
          valueFormatter={(number) => `$${number.toFixed(2)}B`}
          showAnimation={true}
          showLegend={false}
          showGridLines={false}
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {marketChartData.map((crypto) => (
          <div 
            key={crypto.symbol}
            className={`p-3 rounded-lg ${
              crypto.change24h >= 0 
                ? 'bg-green-100 dark:bg-green-900' 
                : 'bg-red-100 dark:bg-red-900'
            }`}
          >
            <div className="flex flex-col">
              <span className="text-sm font-medium dark:text-white">{crypto.symbol}</span>
              <span className="text-xs text-gray-600 dark:text-gray-300">
                {crypto['Market Share'].toFixed(1)}% Share
              </span>
              <span className={`text-sm mt-1 ${
                crypto.change24h >= 0 
                  ? 'text-green-700 dark:text-green-300' 
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {crypto.change24h >= 0 ? '+' : ''}{crypto.change24h.toFixed(2)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
