/**
 * FormField - React Hook Form ile entegre temel form field wrapper
 * 
 * Kullanım:
 * <FormField
 *   name="email"
 *   label="E-posta"
 *   control={control}
 *   render={({ field }) => <Input {...field} />}
 * />
 */

import { ReactNode } from 'react';
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  useFormContext,
} from 'react-hook-form';
import { cn } from '@/lib/utils';

interface FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends Omit<ControllerProps<TFieldValues, TName>, 'render'> {
  label?: string;
  description?: string;
  required?: boolean;
  className?: string;
  render: (props: {
    field: ControllerProps<TFieldValues, TName>['render'] extends (props: infer P) => any
      ? P extends { field: infer F }
        ? F
        : never
      : never;
  }) => ReactNode;
}

export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  control,
  label,
  description,
  required,
  className,
  render,
  ...controllerProps
}: FormFieldProps<TFieldValues, TName>) {
  const formContext = useFormContext<TFieldValues>();
  const formControl = control || formContext?.control;
  const formState = formContext?.formState;
  
  const error = formState?.errors?.[name];
  const errorMessage = error?.message as string | undefined;

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label
          htmlFor={name}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}

      <Controller
        name={name}
        control={formControl}
        render={render}
        {...controllerProps}
      />

      {errorMessage && (
        <p className="text-sm font-medium text-red-500">{errorMessage}</p>
      )}
    </div>
  );
}

// FormItem, FormLabel, FormControl, FormDescription, FormMessage helpers
export function FormItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('space-y-2', className)} {...props} />;
}

export function FormLabel({
  className,
  required,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    >
      {props.children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

export function FormControl({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('', className)} {...props} />;
}

export function FormDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-gray-500', className)} {...props} />;
}

export function FormMessage({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  if (!children) return null;
  
  return (
    <p className={cn('text-sm font-medium text-red-500', className)} {...props}>
      {children}
    </p>
  );
}
