'use client';

import { Card, Title, LineChart } from '@tremor/react';
import { useState, useEffect } from 'react';
import axios from 'axios';

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
      <Card>
        <Title>Loading...</Title>
      </Card>
    );
  }

  const chartData = historicalData.map((dataPoint) => ({
    date: new Date(dataPoint.timestamp).toLocaleDateString(),
    Price: dataPoint.price,
    Volume: showVolume ? dataPoint.volume / 1000000 : undefined,
  }));

  return (
    <Card>
      <Title>{symbol} Price History</Title>
      <LineChart
        className={`mt-4 ${height}`}
        data={chartData}
        index="date"
        categories={showVolume ? ["Price", "Volume"] : ["Price"]}
        colors={["blue", "gray"]}
        valueFormatter={(value) => showVolume ? 
          (value > 1000 ? `$${value.toLocaleString()}M` : `$${value.toLocaleString()}`) :
          `$${value.toLocaleString()}`
        }
        yAxisWidth={60}
      />
    </Card>
  );
}
