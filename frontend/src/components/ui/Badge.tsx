import React from 'react';
import { clsx } from 'clsx';
import type { UserRole } from '@/types';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'secondary';
  role?: UserRole;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default', 
  role,
  size = 'md',
  className 
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full';
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-200 text-gray-700',
  };

  const roleClasses = {
    admin: 'badge-admin',
    chef_secteur: 'badge-chef-secteur',
    chef_service: 'badge-chef-service',
    ingenieur: 'badge-ingenieur',
    collaborateur: 'badge-collaborateur',
  };

  const roleLabels = {
    admin: 'Administrateur',
    chef_secteur: 'Chef Secteur',
    chef_service: 'Chef Service',
    ingenieur: 'Ingénieur',
    collaborateur: 'Collaborateur',
  };

  if (role) {
    return (
      <span className={clsx(roleClasses[role], className)}>
        {roleLabels[role]}
      </span>
    );
  }

  return (
    <span className={clsx(
      baseClasses,
      sizeClasses[size],
      variantClasses[variant],
      className
    )}>
      {children}
    </span>
  );
};

export default Badge;
