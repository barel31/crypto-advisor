'use client';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export function Skeleton({ className = '', count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`animate-pulse bg-gray-300 dark:bg-gray-700 rounded ${className}`}
        />
      ))}
    </>
  );
}

export function CryptoCardSkeleton() {
  return (
    <div className="crypto-card glass-effect p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Skeleton className="h-3 w-16 mb-1" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div>
          <Skeleton className="h-3 w-12 mb-1" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}

export function MarketStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="crypto-card glass-effect p-6">
          <Skeleton className="h-4 w-24 mb-4" />
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse flex items-end justify-center space-x-2 p-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="bg-gray-300 dark:bg-gray-600 rounded-t"
            style={{
              width: '30px',
              height: `${100 + (index % 3) * 50}px`,
              animationDelay: `${index * 0.1}s`
            }}
          />
        ))}
      </div>
    </div>
  );
}
