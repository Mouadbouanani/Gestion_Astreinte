import React from 'react';
import Button from '@/components/ui/Button';

interface FloatingActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  tooltip?: string;
  badge?: React.ReactNode;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  icon,
  position = 'bottom-right',
  variant = 'primary',
  size = 'lg',
  className = '',
  tooltip,
  badge
}) => {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14',
    lg: 'w-16 h-16'
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <div className="relative">
        <Button
          variant={variant}
          onClick={onClick}
          className={`${sizeClasses[size]} rounded-full shadow-lg hover:shadow-xl 
            transform transition-all duration-200 hover:scale-110 active:scale-95 
            flex items-center justify-center ${className}`}
          title={tooltip}
        >
          {icon}
        </Button>
        
        {badge && (
          <div className="absolute -top-2 -right-2">
            {badge}
          </div>
        )}
      </div>
    </div>
  );
};

export default FloatingActionButton;