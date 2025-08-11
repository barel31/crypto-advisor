'use client';

import Dashboard from './components/Dashboard';

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">
              Crypto Advisor
            </h1>
            <p className="text-xl text-gray-600 mb-12">
              Make informed decisions with real-time cryptocurrency analysis and predictions
            </p>
          </div>
          <Dashboard />
        </div>
      </div>
    </main>
  );
}
