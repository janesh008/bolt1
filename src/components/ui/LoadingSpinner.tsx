import { cn } from '../../lib/utils';

interface LoadingSpinnerProps {
  className?: string;
}

const LoadingSpinner = ({ className }: LoadingSpinnerProps) => {
  return (
    <div className="flex items-center justify-center w-full h-60">
      <div className={cn("w-10 h-10 border-4 border-cream-200 border-t-gold-400 rounded-full animate-spin", className)} />
    </div>
  );
};

export default LoadingSpinner;