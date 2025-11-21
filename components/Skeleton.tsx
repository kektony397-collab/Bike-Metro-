import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'text' }) => {
  const baseClasses = "animate-pulse bg-md-sys-color-surfaceVariant/50 overflow-hidden relative";
  
  let variantClasses = "";
  switch (variant) {
    case 'circular':
      variantClasses = "rounded-full";
      break;
    case 'rectangular':
      variantClasses = "rounded-xl";
      break;
    case 'text':
    default:
      variantClasses = "rounded h-4 w-full";
      break;
  }

  return (
    <div className={`${baseClasses} ${variantClasses} ${className}`}>
       {/* Wave animation overlay */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
    </div>
  );
};
