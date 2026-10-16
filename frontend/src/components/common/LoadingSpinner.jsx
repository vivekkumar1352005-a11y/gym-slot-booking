import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 gap-3" role="status">
      <Loader2 className={`${sizeClasses[size] || sizeClasses.md} animate-spin text-emerald-500`} />
      {text && <p className="text-sm text-slate-400 font-medium">{text}</p>}
      <span className="sr-only">Loading</span>
    </div>
  );
};

export const CardSkeleton = () => (
  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 animate-pulse space-y-4">
    <div className="flex justify-between items-center">
      <div className="h-6 bg-slate-800 rounded w-1/3"></div>
      <div className="h-6 bg-slate-800 rounded-full w-20"></div>
    </div>
    <div className="h-4 bg-slate-800 rounded w-1/2"></div>
    <div className="h-2.5 bg-slate-800 rounded-full w-full"></div>
    <div className="h-10 bg-slate-800 rounded-xl w-full"></div>
  </div>
);
