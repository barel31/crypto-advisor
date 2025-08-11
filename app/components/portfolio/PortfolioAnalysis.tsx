'use client';

import { Card, Title, Badge } from '@tremor/react';
import type { PortfolioItem, TradingSuggestion } from '../../types/portfolio';

interface PortfolioAnalysisProps {
  portfolio: PortfolioItem[];
  tradingSuggestions: Record<string, TradingSuggestion>;
}

export default function PortfolioAnalysis({
  portfolio,
  tradingSuggestions,
}: PortfolioAnalysisProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {portfolio.map((item) => {
        const suggestion = tradingSuggestions[item.symbol];
        return (
          <Card key={item.id}>
            <Title>{item.symbol} Analysis</Title>
            <div className="mt-4">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Recommendation</p>
                  <div className="flex items-center space-x-2">
                    <Badge
                      color={
                        suggestion?.action === 'BUY' ? 'green' :
                        suggestion?.action === 'SELL' ? 'red' :
                        'yellow'
                      }
                    >
                      {suggestion?.action || 'ANALYZING'}
                    </Badge>
                    <span className="text-sm">
                      Confidence: {((suggestion?.confidence || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Target Price</p>
                  <p className="font-medium">${suggestion?.target_price?.toLocaleString() || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Stop Loss</p>
                  <p className="font-medium">${suggestion?.stop_loss?.toLocaleString() || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Analysis</p>
                  <p className="text-sm mt-1">{suggestion?.reason || 'Analyzing market conditions...'}</p>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
