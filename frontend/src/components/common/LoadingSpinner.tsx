import React from 'react';

export const LoadingSpinner: React.FC<{ message?: string; size?: 'sm' | 'md' | 'lg' }> = ({
  message = 'Loading...',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }[size];

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3">
      <div
        className={`${sizeClasses} border-gray-300 border-t-primary-600 rounded-full animate-spin`}
        role="status"
        aria-label="loading"
      />
      {message && <p className="text-sm text-gray-500 font-medium">{message}</p>}
    </div>
  );
};
