import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'text' | 'card' | 'circle' | 'button' | 'chart';
  lines?: number;
}

export function SkeletonLoader({ className = '', variant = 'text', lines = 1 }: SkeletonLoaderProps) {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700 rounded loading-shimmer';

  if (variant === 'text') {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} h-4 ${
              index === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'
            }`}
          />
        ))}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`${baseClasses} p-3 xs:p-4 space-y-3 xs:space-y-4 ${className} animate-slide-up`}>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 xs:w-10 xs:h-10 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 animate-pulse" />
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2 animate-pulse" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-5/6 animate-pulse" />
        </div>
      </div>
    );
  }

  if (variant === 'circle') {
    return (
      <div className={`${baseClasses} rounded-full ${className}`} />
    );
  }

  if (variant === 'button') {
    return (
      <div className={`${baseClasses} h-8 xs:h-10 w-20 xs:w-24 ${className}`} />
    );
  }

  if (variant === 'chart') {
    return (
      <div className={`${baseClasses} ${className} animate-fade-in`}>
        <div className="p-3 xs:p-4 sm:p-6 space-y-3 xs:space-y-4">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3 animate-pulse" />
          <div className="h-48 xs:h-56 sm:h-64 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
          <div className="flex justify-center space-x-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-3 xs:h-4 w-12 xs:w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <div className={`${baseClasses} ${className}`} />;
}

export function WorkoutCardSkeleton() {
  return (
    <div className="card animate-pulse animate-slide-up">
      <div className="flex items-center justify-between mb-3 xs:mb-4">
        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3" />
        <div className="flex gap-2">
          <div className="w-6 h-6 xs:w-8 xs:h-8 bg-gray-300 dark:bg-gray-600 rounded-full" />
          <div className="w-6 h-6 xs:w-8 xs:h-8 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between p-2 xs:p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
            <div className="space-y-1">
              <div className="h-3 xs:h-4 bg-gray-300 dark:bg-gray-600 rounded w-20 xs:w-24" />
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16" />
            </div>
            <div className="w-4 h-4 xs:w-5 xs:h-5 bg-gray-300 dark:bg-gray-600 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ExerciseCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm p-3 xs:p-4 animate-pulse animate-slide-up">
      <div className="flex items-start justify-between mb-2 xs:mb-3">
        <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-2/3" />
        <div className="h-5 xs:h-6 w-12 xs:w-16 bg-gray-300 dark:bg-gray-600 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center">
          <div className="h-3 xs:h-4 bg-gray-300 dark:bg-gray-600 rounded w-12 xs:w-16 mr-2" />
          <div className="h-3 xs:h-4 bg-gray-300 dark:bg-gray-600 rounded w-16 xs:w-20" />
        </div>
      </div>
    </div>
  );
}

export function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'w-3 h-3 xs:w-4 xs:h-4',
    md: 'w-5 h-5 xs:w-6 xs:h-6',
    lg: 'w-6 h-6 xs:w-8 xs:h-8'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <div className="animate-spin rounded-full border-2 border-gray-300 dark:border-gray-600 border-t-primary shadow-soft"></div>
    </div>
  );
}