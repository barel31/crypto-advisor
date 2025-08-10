'use client';

import { Card, Title, LineChart, Subtitle, Select, SelectItem } from '@tremor/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Decimal from 'decimal.js';

interface CryptoData {
  timestamp: string;
  price: number;
  volume: number;
}

interface Analysis {
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  reasoning: string;
  support: number;
  resistance: number;
}

export default function AnalysisPage() {
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [timeframe, setTimeframe] = useState('24h');
  const [historicalData, setHistoricalData] = useState<CryptoData[]>([]);
  const [analysis, setAnalysis] = useState<Analysis>({
    trend: 'NEUTRAL',
    confidence: 0.5,
    reasoning: 'Analyzing market data...',
    support: 0,
    resistance: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // In a real app, you would fetch historical data from your API
        // For now, we'll generate some sample data
        const now = new Date();
        const data: CryptoData[] = Array.from({ length: 24 }, (_, i) => ({
          timestamp: new Date(now.getTime() - (23 - i) * 3600000).toISOString(),
          price: 45000 + Math.random() * 1000 - 500,
          volume: 1000000 + Math.random() * 500000,
        }));

        setHistoricalData(data);

        // Perform basic technical analysis
        const prices = data.map(d => new Decimal(d.price));
        const avg = prices.reduce((a, b) => a.plus(b)).dividedBy(prices.length);
        const lastPrice = prices[prices.length - 1];
        
        const trend = lastPrice.greaterThan(avg) ? 'BULLISH' : 'BEARISH';
        const distance = lastPrice.minus(avg).abs().dividedBy(avg).times(100);
        const confidence = Math.min(distance.toNumber() / 10, 1);

        // Calculate support and resistance
        const sorted = prices.sort((a, b) => a.minus(b).toNumber());
        const support = sorted[Math.floor(sorted.length * 0.25)].toNumber();
        const resistance = sorted[Math.floor(sorted.length * 0.75)].toNumber();

        setAnalysis({
          trend,
          confidence,
          reasoning: `Price is ${trend.toLowerCase()} based on comparison with 24h moving average. ` +
                    `Current price is ${distance.toFixed(2)}% away from the average.`,
          support,
          resistance,
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [selectedCrypto, timeframe]);

  const chartData = historicalData.map((data) => ({
    date: new Date(data.timestamp).toLocaleTimeString(),
    Price: data.price,
    Volume: data.volume,
  }));

  return (
    <main className="p-4 md:p-10 mx-auto max-w-7xl">
      <div className="flex justify-between items-center">
        <div>
          <Title>Market Analysis</Title>
          <Subtitle>Technical analysis and price predictions</Subtitle>
        </div>
        <div className="flex space-x-4">
          <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
            <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
            <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
            <SelectItem value="SOL">Solana (SOL)</SelectItem>
          </Select>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectItem value="24h">24 Hours</SelectItem>
            <SelectItem value="7d">7 Days</SelectItem>
            <SelectItem value="30d">30 Days</SelectItem>
          </Select>
        </div>
      </div>

      <div className="mt-6">
        <Card>
          <Title>Price Chart</Title>
          <LineChart
            className="mt-4 h-72"
            data={chartData}
            index="date"
            categories={["Price"]}
            colors={["blue"]}
            yAxisWidth={60}
          />
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <Title>Technical Analysis</Title>
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">Trend</span>
              <span className={`px-3 py-1 rounded-full text-sm ${
                analysis.trend === 'BULLISH' ? 'bg-green-100 text-green-800' :
                analysis.trend === 'BEARISH' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {analysis.trend}
              </span>
            </div>
            <div className="mt-4">
              <span className="text-lg font-medium">Confidence</span>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${analysis.confidence * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-lg font-medium">Analysis</span>
              <p className="mt-2 text-gray-600">{analysis.reasoning}</p>
            </div>
          </div>
        </Card>

        <Card>
          <Title>Key Levels</Title>
          <div className="mt-4 space-y-4">
            <div>
              <span className="text-lg font-medium">Resistance</span>
              <p className="text-2xl font-bold">${analysis.resistance.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-lg font-medium">Support</span>
              <p className="text-2xl font-bold">${analysis.support.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
