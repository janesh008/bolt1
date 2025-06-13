import { Gem } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LogoProps {
  className?: string;
}

const Logo = ({ className }: LogoProps) => {
  return (
    <div className={cn("flex items-center", className)}>
      <Gem className="h-6 w-6 text-gold-400 mr-2" />
      <span className="font-serif font-semibold text-xl tracking-wider">AXELS</span>
    </div>
  );
};

export default Logo;