// components/LoadingSpinner.tsx
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export default function LoadingSpinner({ 
  size = 'medium', 
  color = '#3b82f6' 
}: LoadingSpinnerProps) {
  const sizeMap = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const spinnerSize = sizeMap[size];

  return (
    <div className="flex justify-center items-center">
      <div 
        className={`${spinnerSize} border-4 border-t-transparent rounded-full animate-spin`}
        style={{ borderColor: `transparent ${color} ${color} ${color}` }}
      ></div>
    </div>
  );
}