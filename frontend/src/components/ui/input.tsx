import * as React from "react";

import { cn } from "./utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-gray-300 placeholder:text-gray-500 selection:bg-cyan-600 selection:text-white bg-gray-900 border border-gray-800 flex h-9 w-full min-w-0 rounded-md px-3 py-1 text-base text-gray-300 transition-all outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm hover:border-gray-700 focus-visible:border-cyan-500 focus-visible:ring-cyan-500/20 focus-visible:ring-1",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
