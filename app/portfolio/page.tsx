'use client';

import { Title, Subtitle, Button, TabGroup, TabList, Tab, TabPanels, TabPanel } from '@tremor/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { cache } from '../lib/cache';
import Notification from '../components/Notification';
import PortfolioOverview from '../components/portfolio/PortfolioOverview';
import PortfolioHoldings from '../components/portfolio/PortfolioHoldings';
import PortfolioAnalysis from '../components/portfolio/PortfolioAnalysis';
import PortfolioLoading from '../components/ui/PortfolioLoading';
import type { PortfolioItem, TradingSuggestion } from '../types/portfolio';

export default function PortfolioPage() {
  // Type guard for AxiosError
  function isAxiosError(error: unknown): error is { response?: { status?: number } } {
    return (
      typeof error === 'object' && error !== null &&
      'response' in error &&
      typeof (error as { response?: unknown }).response === 'object'
    );
  }

  const [portfolio, setPortfolio] = useLocalStorage<PortfolioItem[]>('portfolio', [
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

{/* Moved calculations to render section */}

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const [tradingSuggestions, setTradingSuggestions] = useState<Record<string, TradingSuggestion>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchTradingSuggestions = async () => {
      if (!portfolio.length) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const suggestionsMap: Record<string, TradingSuggestion> = {};
        const fetchPromises = portfolio.map(async (item) => {
          // Check cache first
          const cachedSuggestion = cache.get<TradingSuggestion>(item.symbol);
          if (cachedSuggestion) {
            suggestionsMap[item.symbol] = cachedSuggestion;
            return;
          }

          try {
            const response = await axios.get(`/api/trading-suggestions?symbol=${item.symbol}`);
            if (response.status === 429 || response.data?.error?.includes('rate limit')) {
              throw new Error('Rate limit exceeded');
            }
            const suggestion = {
              symbol: item.symbol,
              ...response.data
            };
            suggestionsMap[item.symbol] = suggestion;
            cache.set(item.symbol, suggestion);
          } catch (error) {
            console.error(`Error fetching data for ${item.symbol}:`, error);
            suggestionsMap[item.symbol] = {
              symbol: item.symbol,
              action: 'HOLD',
              confidence: 0,
              reason: error instanceof Error && error.message === 'Rate limit exceeded' 
                ? 'Rate limit exceeded. Try again later.'
                : 'Unable to fetch data',
              dayChange: 0
            };
            if (error instanceof Error && error.message === 'Rate limit exceeded') {
              throw error; // Propagate rate limit error
            }
          }
        });

        // Execute all promises with a delay between each
        for (let i = 0; i < fetchPromises.length; i++) {
          try {
            await fetchPromises[i];
            if (i < fetchPromises.length - 1) {
              await new Promise(res => setTimeout(res, 1000)); // 1 second delay between requests
            }
          } catch (error) {
            if (error instanceof Error && error.message === 'Rate limit exceeded') {
              setError('Crypto data is temporarily unavailable due to rate limits. Please try again later.');
              showNotification('Crypto data is temporarily unavailable due to rate limits. Please try again later.', 'warning');
              break;
            }
          }
        }

        if (isMounted) setTradingSuggestions(suggestionsMap);
      } catch (error) {
        console.error('Error fetching trading suggestions:', error);
        setError('Unable to fetch trading suggestions. Please try again later.');
        showNotification('Error loading trading suggestions', 'error');
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setInitialLoading(false);
        }
      }
    };

    fetchTradingSuggestions();
    
    // Set up an interval to refresh data every 5 minutes
    const interval = setInterval(fetchTradingSuggestions, 5 * 60 * 1000);
    
    return () => { 
      isMounted = false;
      clearInterval(interval);
    };
  }, [portfolio]);

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setNotification({ message, type });
  };

  // System theme detection
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const totalValue = portfolio.reduce((acc: number, item: PortfolioItem) => {
    return acc + (item.currentPrice || 0) * item.amount;
  }, 0);

  const totalProfitLoss = portfolio.reduce((acc: number, item: PortfolioItem) => {
    return acc + (item.profitLoss || 0);
  }, 0);

  // Show full loading page on initial load
  if (initialLoading) {
    return <PortfolioLoading />;
  }

  return (
    <main className={`p-4 md:p-10 mx-auto max-w-7xl slide-up ${isDark ? 'bg-primary-dark text-white' : 'bg-gray-50 text-primary-dark'}`}> 
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
            <PortfolioOverview 
              portfolio={portfolio}
              tradingSuggestions={tradingSuggestions}
              totalValue={totalValue}
              totalProfitLoss={totalProfitLoss}
              isLoading={isLoading}
              error={error}
            />
          </TabPanel>

          <TabPanel>
            <div className="mt-6">
              <PortfolioHoldings 
                portfolio={portfolio}
                tradingSuggestions={tradingSuggestions}
              />
            </div>
          </TabPanel>

          <TabPanel>
            <div className="mt-6">
              <PortfolioAnalysis 
                portfolio={portfolio}
                tradingSuggestions={tradingSuggestions}
              />
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </main>
  );
}
