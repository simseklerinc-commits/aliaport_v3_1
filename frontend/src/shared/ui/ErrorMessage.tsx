import React from "react";

interface Props {
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<Props> = ({ message, onRetry }) => {
  return (
    <div className="p-3 border border-red-300 bg-red-50 text-red-700 text-sm rounded flex items-center justify-between gap-4" role="alert">
      <span>{message}</span>
      {onRetry && (
        <button
          className="px-2 py-1 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700"
          onClick={onRetry}
        >
          Tekrar Dene
        </button>
      )}
    </div>
  );
};
