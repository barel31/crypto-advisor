'use client';

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'cyan' | 'gray';
}

export function LoadingDots({ size = 'md', color = 'blue' }: LoadingDotsProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const colorClasses = {
    blue: 'bg-blue-500',
    cyan: 'bg-cyan-400',
    gray: 'bg-gray-400'
  };

  return (
    <div className={`spinner-dots ${sizeClasses[size]} mx-auto`}>
      <div className={colorClasses[color]}></div>
      <div className={colorClasses[color]}></div>
      <div className={colorClasses[color]}></div>
      <div className={colorClasses[color]}></div>
    </div>
  );
}

interface ProgressBarProps {
  className?: string;
}

export function ProgressBar({ className = '' }: ProgressBarProps) {
  return (
    <div className={`progress-bar ${className}`}>
      <div className="progress-bar-fill"></div>
    </div>
  );
}

interface LoadingTextProps {
  text?: string;
  dots?: boolean;
}

export function LoadingText({ text = 'Loading', dots = true }: LoadingTextProps) {
  return (
    <div className="flex items-center justify-center space-x-2">
      <span className="text-gray-600 dark:text-gray-400">
        {text}
        {dots && <span className="animate-pulse">...</span>}
      </span>
    </div>
  );
}

interface ContentLoadingProps {
  children: React.ReactNode;
  isLoading: boolean;
}

export function ContentLoading({ children, isLoading }: ContentLoadingProps) {
  return (
    <div className={isLoading ? 'content-loading' : ''}>
      {children}
    </div>
  );
}
