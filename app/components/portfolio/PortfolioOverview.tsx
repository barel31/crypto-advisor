'use client';

import { Card, Title, BarChart, Badge, Color } from '@tremor/react';
import type { PortfolioItem, TradingSuggestion } from '../../types/portfolio';

interface PortfolioOverviewProps {
  portfolio: PortfolioItem[];
  tradingSuggestions: Record<string, TradingSuggestion>;
  totalValue: number;
  totalProfitLoss: number;
  isLoading: boolean;
  error: string | null;
}

export default function PortfolioOverview({
  portfolio,
  tradingSuggestions,
  totalValue,
  totalProfitLoss,
  isLoading,
  error
}: PortfolioOverviewProps) {
  const chartData = portfolio.map((item) => ({
    name: item.symbol,
    'Current Value': (item.currentPrice || 0) * item.amount,
  }));

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {error ? (
          <Card className="crypto-card glass-effect text-center">
            <Title className="text-yellow-700">Crypto Data Unavailable</Title>
            <p className="text-yellow-500">Due to rate limits, live data is temporarily unavailable. Please try again later.</p>
            <div className="mt-4 text-yellow-800">Your portfolio and suggestions will update automatically when data is available.</div>
          </Card>
        ) : (
          <Card className="crypto-card glass-effect">
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-6 w-1/2 bg-gray-700 rounded"></div>
                <div className="h-10 w-3/4 bg-gray-700 rounded"></div>
              </div>
            ) : (
              <>
                <Title className="text-gray-300">Total Portfolio Value</Title>
                <div className="mt-4">
                  <span className="text-3xl font-bold gradient-text">${totalValue.toLocaleString()}</span>
                  <span className={`ml-2 text-sm ${
                    totalProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'
                  } pulsing-element`}>
                    {totalProfitLoss >= 0 ? '+' : ''}{totalProfitLoss.toLocaleString()} USD
                  </span>
                </div>
              </>
            )}
          </Card>
        )}

        <Card>
          <Title>24h Change</Title>
          <div className="mt-4">
            <span className="text-2xl font-bold">
              {(portfolio.reduce((acc, item) => {
                const suggestion = tradingSuggestions[item.symbol];
                return acc + (suggestion?.dayChange || 0);
              }, 0) / portfolio.length).toFixed(2)}%
            </span>
          </div>
        </Card>

        <Card>
          <Title>Risk Level</Title>
          <div className="mt-4">
            <Badge color="yellow">Moderate</Badge>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              Based on portfolio diversity and market volatility
            </p>
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Card className="mt-6">
          <Title>Portfolio Distribution</Title>
          <BarChart 
            className="mt-4 h-72"
            data={chartData}
            index="name"
            categories={['Current Value']}
            colors={['blue']}
            valueFormatter={(value: number) => `$${value.toLocaleString()}`}
            showLegend={false}
            showGridLines={true}
            startEndOnly={true}
            showXAxis={true}
            showYAxis={true}
          />
        </Card>
      </div>
    </>
  );
}
