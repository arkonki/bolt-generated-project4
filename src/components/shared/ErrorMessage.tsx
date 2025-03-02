import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  className?: string;
}

export function ErrorMessage({ message, className = '' }: ErrorMessageProps) {
  return (
    <div className={`flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg ${className}`} role="alert">
      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
      <div>
        <h4 className="font-medium text-red-800">Error</h4>
        <p className="text-sm text-red-700">{message}</p>
      </div>
    </div>
  );
}
