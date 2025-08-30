import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, isLoading, disabled, children, variant='primary', size='md', ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center rounded-2xl transition duration-200 focus:outline-none focus:ring-2 focus:ring-brand-red/60 disabled:opacity-50 disabled:cursor-not-allowed';
    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-3 text-base'
    }[size];

    const variants = {
      primary: 'bg-brand-red hover:bg-brand-redHover text-white shadow-card',
      secondary: 'bg-brand-card hover:bg-neutral-800 text-neutral-100 border border-brand-line',
      ghost: 'bg-transparent hover:bg-white/5 text-neutral-100'
    }[variant];

    return (
      <button
        ref={ref}
        className={cn(base, sizes, variants, className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
