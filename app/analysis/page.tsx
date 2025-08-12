'use client';

import { Card, Title, LineChart, Subtitle, Select, SelectItem } from '@tremor/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Decimal from 'decimal.js';
import { ChartSkeleton } from '@/app/components/ui/Skeleton';

interface HistoricalDataPoint {
  timestamp: number;
  price: number;
  volume: number;
}

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
  rsi: number;
  macd: {
    value: number;
    signal: number;
    histogram: number;
  };
  movingAverages: {
    sma20: number;
    ema50: number;
  };
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
    rsi: 50,
    macd: {
      value: 0,
      signal: 0,
      histogram: 0
    },
    movingAverages: {
      sma20: 0,
      ema50: 0
    }
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setError(null);
      setIsLoading(true);
      try {
        const days = timeframe === '24h' ? '1' : timeframe === '7d' ? '7' : '30';
        const response = await axios.get(`/api/crypto/historical?symbol=${selectedCrypto}&days=${days}`);
        
        if (!response.data || response.data.error) {
          throw new Error(response.data?.error || 'Failed to fetch data');
        }

        const data: CryptoData[] = response.data.map((d: HistoricalDataPoint) => ({
          timestamp: new Date(d.timestamp).toISOString(),
          price: d.price,
          volume: d.volume,
        }));

        setHistoricalData(data);

        // Perform technical analysis
        const prices = data.map(d => new Decimal(d.price));
        const volumes = data.map(d => new Decimal(d.volume));
        
        // Calculate moving averages
        const sma20 = prices.slice(-20).reduce((a, b) => a.plus(b)).dividedBy(20).toNumber();
        const ema50Weight = new Decimal(2).dividedBy(51);
        let ema50 = prices.slice(0, 50).reduce((a, b) => a.plus(b)).dividedBy(50);
        for (let i = 50; i < prices.length; i++) {
          ema50 = prices[i].minus(ema50).times(ema50Weight).plus(ema50);
        }

        // Calculate RSI
        const changes = prices.slice(1).map((price, i) => price.minus(prices[i]));
        const gains = changes.filter(c => c.greaterThan(0));
        const losses = changes.filter(c => c.lessThan(0)).map(c => c.abs());
        const avgGain = gains.reduce((a, b) => a.plus(b), new Decimal(0)).dividedBy(14);
        const avgLoss = losses.reduce((a, b) => a.plus(b), new Decimal(0)).dividedBy(14);
        const rs = avgGain.dividedBy(avgLoss);
        const rsi = new Decimal(100).minus(new Decimal(100).dividedBy(rs.plus(1))).toNumber();

        // Calculate MACD
        const ema12Weight = new Decimal(2).dividedBy(13);
        const ema26Weight = new Decimal(2).dividedBy(27);
        let ema12 = prices.slice(0, 12).reduce((a, b) => a.plus(b)).dividedBy(12);
        let ema26 = prices.slice(0, 26).reduce((a, b) => a.plus(b)).dividedBy(26);
        for (let i = 26; i < prices.length; i++) {
          ema12 = prices[i].minus(ema12).times(ema12Weight).plus(ema12);
          ema26 = prices[i].minus(ema26).times(ema26Weight).plus(ema26);
        }
        const macdLine = ema12.minus(ema26);
        const signalLine = macdLine.times(new Decimal(0.2));
        const histogram = macdLine.minus(signalLine);

        // Calculate trend and confidence
        const lastPrice = prices[prices.length - 1];
        const trend = lastPrice.greaterThan(ema50) && macdLine.greaterThan(0) ? 'BULLISH' :
                     lastPrice.lessThan(ema50) && macdLine.lessThan(0) ? 'BEARISH' : 'NEUTRAL';
        
        const volAvg = volumes.reduce((a, b) => a.plus(b)).dividedBy(volumes.length);
        const lastVol = volumes[volumes.length - 1];
        const volRatio = lastVol.dividedBy(volAvg);
        const confidence = Math.min(volRatio.times(Math.abs(rsi - 50) / 50).toNumber(), 1);

        // Calculate support and resistance
        const sorted = prices.sort((a, b) => a.minus(b).toNumber());
        const support = sorted[Math.floor(sorted.length * 0.25)].toNumber();
        const resistance = sorted[Math.floor(sorted.length * 0.75)].toNumber();

        setAnalysis({
          trend,
          confidence,
          reasoning: `${trend} trend based on MACD and EMA crossovers. ` +
                    `RSI at ${rsi.toFixed(2)} indicates ${rsi > 70 ? 'overbought' : rsi < 30 ? 'oversold' : 'neutral'} conditions. ` +
                    `Volume is ${volRatio.greaterThan(1) ? 'above' : 'below'} average.`,
          support,
          resistance,
          rsi,
          macd: {
            value: macdLine.toNumber(),
            signal: signalLine.toNumber(),
            histogram: histogram.toNumber()
          },
          movingAverages: {
            sma20: sma20,
            ema50: ema50.toNumber()
          }
        });
      } catch (err) {
        console.error('Error fetching data:', err);
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.error || err.message);
        } else {
          setError('An unexpected error occurred');
        }
        // Reset data on error
        setHistoricalData([]);
      } finally {
        setIsLoading(false);
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
          {error && (
            <div className="mt-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}
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
          {isLoading ? (
            <ChartSkeleton />
          ) : chartData.length > 0 ? (
            <LineChart
              className="mt-4 h-72"
              data={chartData}
              index="date"
              categories={["Price"]}
              colors={["blue"]}
              yAxisWidth={60}
            />
          ) : (
            <div className="h-72 flex items-center justify-center">
              <div className="text-gray-500">No data available</div>
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <Title>Technical Analysis</Title>
          {isLoading ? (
            <div className="mt-4 space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-6 w-32 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 space-y-4">
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
              <div>
                <span className="text-lg font-medium">Signal Strength</span>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${
                      analysis.trend === 'BULLISH' ? 'bg-green-600' :
                      analysis.trend === 'BEARISH' ? 'bg-red-600' :
                      'bg-blue-600'
                    }`}
                    style={{ width: `${analysis.confidence * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <span className="text-lg font-medium">RSI</span>
                <div className="mt-2 flex items-center space-x-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        analysis.rsi > 70 ? 'bg-red-600' :
                        analysis.rsi < 30 ? 'bg-green-600' :
                        'bg-yellow-600'
                      }`}
                      style={{ width: `${analysis.rsi}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{analysis.rsi.toFixed(1)}</span>
                </div>
              </div>
              <div>
                <span className="text-lg font-medium">Analysis</span>
                <p className="mt-2 text-gray-600">{analysis.reasoning}</p>
              </div>
            </div>
          )}
        </Card>

        <Card>
          <Title>Technical Indicators</Title>
          {isLoading ? (
            <div className="mt-4 space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className="h-4 w-32 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="space-y-1">
                    <div className="h-3 w-full bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-3 w-3/4 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div>
                <span className="text-lg font-medium">Moving Averages</span>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between">
                    <span>SMA (20)</span>
                    <span className="font-medium">${analysis.movingAverages.sma20.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>EMA (50)</span>
                    <span className="font-medium">${analysis.movingAverages.ema50.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                  </div>
                </div>
              </div>
              <div>
                <span className="text-lg font-medium">MACD</span>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between">
                    <span>Signal Line</span>
                    <span className={`font-medium ${analysis.macd.signal > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {analysis.macd.signal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Histogram</span>
                    <span className={`font-medium ${analysis.macd.histogram > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {analysis.macd.histogram.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <span className="text-lg font-medium">Key Levels</span>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between">
                    <span>Resistance</span>
                    <span className="font-medium text-red-600">${analysis.resistance.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Support</span>
                    <span className="font-medium text-green-600">${analysis.support.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
      
      <div className="mt-6">
        <Card>
          <Title>Volume Analysis</Title>
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <LineChart
              className="mt-4 h-48"
              data={chartData}
              index="date"
              categories={["Volume"]} 
              colors={["purple"]}
              yAxisWidth={100}
            />
          )}
        </Card>
      </div>
    </main>
  );
}
