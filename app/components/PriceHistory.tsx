'use client';

import { Card, Title, LineChart } from '@tremor/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { ChartSkeleton } from './ui/Skeleton';

interface PriceHistoryProps {
  symbol: string;
  days?: number;
  showVolume?: boolean;
  height?: string;
}

interface HistoricalDataPoint {
  timestamp: number;
  price: number;
  volume: number;
}

export default function PriceHistory({ symbol, days = 7, showVolume = false, height = 'h-72' }: PriceHistoryProps) {
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        const response = await axios.get(`/api/crypto/historical?symbol=${symbol}&days=${days}`);
        setHistoricalData(response.data);
      } catch (error) {
        console.error('Error fetching historical data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistoricalData();
  }, [symbol, days]);

  if (isLoading) {
    return (
      <Card className="dark:bg-[#23263a] hover:shadow-lg transition-shadow duration-200">
        <ChartSkeleton />
      </Card>
    );
  }

  const chartData = historicalData.map((dataPoint) => ({
    date: new Date(dataPoint.timestamp).toLocaleDateString(),
    Price: dataPoint.price,
    Volume: showVolume ? dataPoint.volume / 1000000 : undefined,
  }));

  const maxPrice = Math.max(...historicalData.map(d => d.price));
  const minPrice = Math.min(...historicalData.map(d => d.price));
  const priceChange = ((historicalData[historicalData.length - 1]?.price - historicalData[0]?.price) / historicalData[0]?.price) * 100;

  return (
    <Card className="dark:bg-[#23263a] hover:shadow-lg transition-shadow duration-200">
      <div className="flex justify-between items-center mb-4">
        <div>
          <Title className="text-xl font-bold dark:text-accent-cyan">{symbol} Price History</Title>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Past {days} days
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            High: <span className="font-semibold text-green-500">${maxPrice.toLocaleString()}</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Low: <span className="font-semibold text-red-500">${minPrice.toLocaleString()}</span>
          </p>
        </div>
      </div>
      <div className={`relative ${height}`}>
        <LineChart
          className="h-full"
          data={chartData}
          index="date"
          categories={showVolume ? ["Price", "Volume"] : ["Price"]}
          colors={["cyan", "gray"]}
          valueFormatter={(value) => showVolume ? 
            (value > 1000 ? `$${value.toLocaleString()}M` : `$${value.toLocaleString()}`) :
            `$${value.toLocaleString()}`
          }
          yAxisWidth={60}
          showAnimation={true}
          showLegend={true}
          showGridLines={false}
          curveType="natural"
        />
        <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-sm font-medium ${
          priceChange >= 0 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }`}>
          {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
        </div>
      </div>
    </Card>
  );
}
