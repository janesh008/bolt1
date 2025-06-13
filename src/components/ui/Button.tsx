import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={isLoading || props.disabled}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
          {
            'bg-gold-400 hover:bg-gold-500 text-white focus:ring-gold-400': variant === 'primary',
            'bg-charcoal-800 hover:bg-charcoal-700 text-white focus:ring-charcoal-800': variant === 'secondary',
            'border border-charcoal-800 bg-transparent hover:bg-charcoal-800/5 text-charcoal-800 focus:ring-charcoal-800': variant === 'outline',
            'bg-transparent hover:bg-charcoal-800/5 text-charcoal-800 focus:ring-charcoal-800': variant === 'ghost',
            'py-1.5 px-3 text-sm': size === 'sm',
            'py-2 px-4 text-base': size === 'md',
            'py-3 px-6 text-lg': size === 'lg',
            'opacity-70 cursor-not-allowed': isLoading || props.disabled,
          },
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;