'use client';

import { ErrorBoundary } from 'react-error-boundary';
import { Suspense } from 'react';
import Dashboard from './components/Dashboard';
import { HOME_CONTENT } from './constants/homeContent';
import DashboardLoading from './components/ui/DashboardLoading';

function ErrorFallback() {
  return (
    <div role="alert" className="text-center p-4">
      <h2 className="text-xl font-semibold text-red-600 mb-2">Something went wrong</h2>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Try again
      </button>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen" role="main">
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4" tabIndex={0}>
              {HOME_CONTENT.title}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-12" tabIndex={0}>
              {HOME_CONTENT.description}
            </p>
          </div>
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={<DashboardLoading />}>
              <Dashboard />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </main>
  );
}
