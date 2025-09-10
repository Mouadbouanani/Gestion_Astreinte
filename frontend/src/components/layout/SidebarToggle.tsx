import React from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';

interface SidebarToggleProps {
  isOpen: boolean;
  onToggle: () => void;
  position?: 'left' | 'right';
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const SidebarToggle: React.FC<SidebarToggleProps> = ({
  isOpen,
  onToggle,
  // position = 'left',
  variant = 'ghost',
  size = 'md',
  className = '',
  label
}) => {
  const Icon = isOpen ? XMarkIcon : Bars3Icon;
  const ariaLabel = label || (isOpen ? 'Fermer le menu' : 'Ouvrir le menu');

  return (
    <Button
      variant={variant}
      size={size}
      onClick={onToggle}
      className={`transition-transform duration-200 hover:scale-105 ${className}`}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <Icon className={`h-5 w-5 transition-transform duration-200 ${
        isOpen ? 'rotate-90' : 'rotate-0'
      }`} />
      {label && <span className="ml-2">{label}</span>}
    </Button>
  );
};

export default SidebarToggle;