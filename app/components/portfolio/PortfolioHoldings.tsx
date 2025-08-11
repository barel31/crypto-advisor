'use client';

import { Card, Badge } from '@tremor/react';
import type { PortfolioItem, TradingSuggestion } from '../../types/portfolio';

interface PortfolioHoldingsProps {
  portfolio: PortfolioItem[];
  tradingSuggestions: Record<string, TradingSuggestion>;
}

export default function PortfolioHoldings({
  portfolio,
  tradingSuggestions,
}: PortfolioHoldingsProps) {
  return (
    <Card className="crypto-card glass-effect">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider bg-gray-800/50">Asset</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider bg-gray-800/50">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider bg-gray-800/50">Buy Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider bg-gray-800/50">Current Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider bg-gray-800/50">Profit/Loss</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider bg-gray-800/50">Suggestion</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-primary-dark divide-y divide-gray-200">
            {portfolio.map((item) => (
              <tr key={item.id} className="dark:bg-primary-dark">
                <td className="px-6 py-4 whitespace-nowrap text-primary-dark dark:text-white">{item.symbol}</td>
                <td className="px-6 py-4 whitespace-nowrap text-primary-dark dark:text-white">{item.amount}</td>
                <td className="px-6 py-4 whitespace-nowrap text-primary-dark dark:text-white">${item.buyPrice.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-primary-dark dark:text-white">${(item.currentPrice || 0).toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={
                    (item.profitLoss || 0) >= 0
                      ? 'text-green-500 dark:text-green-400'
                      : 'text-red-500 dark:text-red-400'
                  }>
                    {(item.profitLoss || 0) >= 0 ? '+' : ''}{(item.profitLoss || 0).toLocaleString()} USD
                    <span className="ml-1 text-sm">
                      ({(item.profitLossPercentage || 0).toFixed(2)}%)
                    </span>
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge
                    color={
                      tradingSuggestions[item.symbol]?.action === 'BUY' ? 'green' :
                      tradingSuggestions[item.symbol]?.action === 'SELL' ? 'red' :
                      'yellow'
                    }
                  >
                    {tradingSuggestions[item.symbol]?.action || 'ANALYZING'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
