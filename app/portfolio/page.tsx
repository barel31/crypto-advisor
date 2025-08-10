'use client';

import { Card, Title, BarChart, Subtitle, Button, Badge, TabGroup, TabList, Tab, TabPanels, TabPanel } from '@tremor/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Notification from '../components/Notification';

interface PortfolioItem {
  id: string;
  symbol: string;
  amount: number;
  buyPrice: number;
  currentPrice?: number;
  profitLoss?: number;
  profitLossPercentage?: number;
}

interface TradingSuggestion {
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reason: string;
  target_price?: number;
  stop_loss?: number;
  dayChange?: number;
}

export default function PortfolioPage() {
  // Type guard for AxiosError
  function isAxiosError(error: unknown): error is { response?: { status?: number } } {
    return (
      typeof error === 'object' && error !== null &&
      'response' in error &&
      typeof (error as { response?: unknown }).response === 'object'
    );
  }
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([
    { id: '1', symbol: 'BTC', amount: 0.5, buyPrice: 45000 },
    { id: '2', symbol: 'ETH', amount: 5, buyPrice: 3000 },
  ]);

  useEffect(() => {
    let isMounted = true;
    const fetchPrices = async (retryCount = 0) => {
      try {
        // Batch request for all symbols
        const symbols = portfolio.map((item) => item.symbol).join(',');
        const response = await axios.get(`/api/crypto?symbols=${symbols}`);
        const data = response.data;
        const updatedPortfolio = portfolio.map((item) => {
          const currentPrice = data[item.symbol.toLowerCase()]?.usd || 0;
          const profitLoss = (currentPrice - item.buyPrice) * item.amount;
          const profitLossPercentage = ((currentPrice - item.buyPrice) / item.buyPrice) * 100;
          return {
            ...item,
            currentPrice,
            profitLoss,
            profitLossPercentage,
          };
        });
        if (isMounted) setPortfolio(updatedPortfolio);
      } catch (error: unknown) {
        if (
          isAxiosError(error) &&
          error.response?.status === 429 && retryCount < 3
        ) {
          setTimeout(() => fetchPrices(retryCount + 1), 1000 * Math.pow(2, retryCount));
        } else {
          console.error('Error fetching prices:', error);
        }
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 300000); // Poll every 5 min
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [portfolio]);

  const totalValue = portfolio.reduce((acc, item) => {
    return acc + (item.currentPrice || 0) * item.amount;
  }, 0);

  const totalProfitLoss = portfolio.reduce((acc, item) => {
    return acc + (item.profitLoss || 0);
  }, 0);

  const chartData = portfolio.map((item) => ({
    name: item.symbol,
    'Current Value': (item.currentPrice || 0) * item.amount,
  }));

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const [tradingSuggestions, setTradingSuggestions] = useState<Record<string, TradingSuggestion>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);;

  useEffect(() => {
    let isMounted = true;
    const fetchTradingSuggestions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Throttle requests: 1500ms delay between each
        const suggestionsMap: Record<string, TradingSuggestion> = {};
        for (let i = 0; i < portfolio.length; i++) {
          const item = portfolio[i];
          try {
            await new Promise(res => setTimeout(res, 1500));
            const response = await axios.get(`/api/trading-suggestions?symbol=${item.symbol}`);
            if (response.status === 429 || response.data?.error?.includes('rate limit')) {
              setError('Crypto data is temporarily unavailable due to rate limits. Please try again later.');
              showNotification('Crypto data is temporarily unavailable due to rate limits. Please try again later.', 'warning');
              suggestionsMap[item.symbol] = {
                symbol: item.symbol,
                action: 'HOLD',
                confidence: 0,
                reason: 'Rate limit exceeded. Try again later.',
                dayChange: 0
              };
            } else {
              suggestionsMap[item.symbol] = {
                symbol: item.symbol,
                ...response.data
              };
            }
          } catch (error) {
            if (isAxiosError(error) && error.response?.status === 429) {
              setError('Crypto data is temporarily unavailable due to rate limits. Please try again later.');
              showNotification('Crypto data is temporarily unavailable due to rate limits. Please try again later.', 'warning');
              suggestionsMap[item.symbol] = {
                symbol: item.symbol,
                action: 'HOLD',
                confidence: 0,
                reason: 'Rate limit exceeded. Try again later.',
                dayChange: 0
              };
            } else {
              console.error(`Error fetching data for ${item.symbol}:`, error);
              suggestionsMap[item.symbol] = {
                symbol: item.symbol,
                action: 'HOLD',
                confidence: 0,
                reason: 'Unable to fetch data',
                dayChange: 0
              };
            }
          }
        }
        if (isMounted) setTradingSuggestions(suggestionsMap);
      } catch (error) {
        console.error('Error fetching trading suggestions:', error);
        setError('Unable to fetch trading suggestions. Please try again later.');
        showNotification('Error loading trading suggestions', 'error');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchTradingSuggestions();
    return () => { isMounted = false; };
  }, [portfolio]);

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setNotification({ message, type });
  };

  return (
    <main className="p-4 md:p-10 mx-auto max-w-7xl slide-up">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {error && (
        <div className="mb-6 p-4 bg-yellow-100 border border-yellow-300 rounded-lg text-yellow-800">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div className="floating-element">
          <Title className="gradient-text text-3xl">Portfolio Overview</Title>
          <Subtitle className="text-gray-400">Track your crypto investments and performance</Subtitle>
        </div>
        <Button 
          size="lg"
          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 
                     text-white font-semibold py-2 px-6 rounded-lg shadow-lg hover:shadow-xl 
                     transition-all duration-300 neon-border"
          onClick={() => showNotification('Coming soon: Add new transaction', 'info')}
        >
          Add Transaction
        </Button>
      </div>

      <TabGroup>
        <TabList>
          <Tab>Overview</Tab>
          <Tab>Holdings</Tab>
          <Tab>Analysis</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {error ? (
                <Card className="crypto-card glass-effect text-center">
                  <Title className="text-yellow-700">Crypto Data Unavailable</Title>
                  <Subtitle className="text-yellow-500">Due to rate limits, live data is temporarily unavailable. Please try again later.</Subtitle>
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
                  <p className="mt-2 text-sm text-gray-600">Based on portfolio diversity and market volatility</p>
                </div>
              </Card>
            </div>

            <div className="mt-6">
              <Card>
                <Title>Portfolio Distribution</Title>
                <BarChart
                  className="mt-4 h-72"
                  data={chartData}
                  index="name"
                  categories={['Current Value']}
                  colors={['blue']}
                  valueFormatter={(value) => `$${value.toLocaleString()}`}
                />
              </Card>
            </div>
          </TabPanel>

          <TabPanel>
            <div className="mt-6">
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
                    <tbody className="bg-white divide-y divide-gray-200">
                      {portfolio.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap">{item.symbol}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{item.amount}</td>
                          <td className="px-6 py-4 whitespace-nowrap">${item.buyPrice.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap">${(item.currentPrice || 0).toLocaleString()}</td>
                          <td className={`px-6 py-4 whitespace-nowrap ${(item.profitLoss || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {(item.profitLoss || 0) >= 0 ? '+' : ''}{(item.profitLoss || 0).toLocaleString()} USD
                            <span className="ml-1 text-sm">
                              ({(item.profitLossPercentage || 0).toFixed(2)}%)
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
            </div>
          </TabPanel>

          <TabPanel>
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
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
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </main>
  );
}
