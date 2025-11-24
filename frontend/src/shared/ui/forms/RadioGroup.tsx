/**
 * RadioGroup - Radio button group bileşeni
 * React Hook Form ile uyumlu, forwardRef destekli
 */

import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface RadioOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface RadioGroupProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  options: RadioOption[];
  error?: boolean;
}

export const RadioGroup = forwardRef<HTMLInputElement, RadioGroupProps>(
  ({ className, options, name, error, ...props }, ref) => {
    return (
      <div className={cn('space-y-2', className)}>
        {options.map((option, index) => {
          const inputId = `${name}-${option.value}`;
          
          return (
            <div key={option.value} className="flex items-center space-x-2">
              <input
                type="radio"
                id={inputId}
                name={name}
                value={option.value}
                disabled={option.disabled}
                className={cn(
                  'h-4 w-4 border-gray-300 text-blue-600',
                  'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  error && 'border-red-500'
                )}
                ref={index === 0 ? ref : undefined}
                {...props}
              />
              <label
                htmlFor={inputId}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {option.label}
              </label>
            </div>
          );
        })}
      </div>
    );
  }
);

RadioGroup.displayName = 'RadioGroup';
