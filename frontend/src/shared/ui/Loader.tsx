import React from "react";

export const Loader: React.FC<{ message?: string }> = ({ message = "Yükleniyor..." }) => {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300" role="status">
      <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
      <span>{message}</span>
    </div>
  );
};
