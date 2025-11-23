import React from 'react';
import { FieldError } from 'react-hook-form';

interface FormFieldProps {
  label: string;
  name: string;
  error?: FieldError;
  required?: boolean;
  description?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({ label, name, error, required, description, children }) => {
  return (
    <div className="form-field flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-neutral-800">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {description && <p className="text-xs text-neutral-500 -mt-0.5">{description}</p>}
      {children}
      {error && <p className="text-xs text-red-600 mt-0.5">{error.message}</p>}
    </div>
  );
};

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: FieldError;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ error, className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`px-3 py-2 border rounded text-sm transition ${
          error ? 'border-red-400 focus:border-red-500' : 'border-neutral-300 focus:border-blue-500'
        } focus:outline-none focus:ring-1 ${error ? 'focus:ring-red-200' : 'focus:ring-blue-200'} ${className}`}
        {...props}
      />
    );
  }
);
TextInput.displayName = 'TextInput';

interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: FieldError;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export const SelectInput = React.forwardRef<HTMLSelectElement, SelectInputProps>(
  ({ error, options, placeholder, className = '', ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`px-3 py-2 border rounded text-sm transition ${
          error ? 'border-red-400 focus:border-red-500' : 'border-neutral-300 focus:border-blue-500'
        } focus:outline-none focus:ring-1 ${error ? 'focus:ring-red-200' : 'focus:ring-blue-200'} ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }
);
SelectInput.displayName = 'SelectInput';

interface TextAreaInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: FieldError;
}

export const TextAreaInput = React.forwardRef<HTMLTextAreaElement, TextAreaInputProps>(
  ({ error, className = '', ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`px-3 py-2 border rounded text-sm transition resize-y ${
          error ? 'border-red-400 focus:border-red-500' : 'border-neutral-300 focus:border-blue-500'
        } focus:outline-none focus:ring-1 ${error ? 'focus:ring-red-200' : 'focus:ring-blue-200'} ${className}`}
        {...props}
      />
    );
  }
);
TextAreaInput.displayName = 'TextAreaInput';
