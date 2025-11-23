import React from "react";

export const Loader: React.FC<{ label?: string }> = ({ label = "Yükleniyor" }) => {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 py-4" role="status">
      <svg className="animate-spin h-4 w-4 text-blue-600" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      <span>{label}...</span>
    </div>
  );
};
import React from "react";

export const Loader: React.FC<{ message?: string }> = ({ message = "Yükleniyor..." }) => {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300" role="status">
      <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
      <span>{message}</span>
    </div>
  );
};
