import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultOpen = true,
  icon,
  badge,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <Button
        variant="ghost"
        onClick={toggleOpen}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 border-none rounded-none"
      >
        <div className="flex items-center space-x-2">
          {icon && <span className="text-gray-500">{icon}</span>}
          <span className="font-medium text-gray-900">{title}</span>
          {badge && badge}
        </div>
        
        <div className="flex items-center">
          {isOpen ? (
            <ChevronDownIcon className="h-4 w-4 text-gray-500 transition-transform duration-200" />
          ) : (
            <ChevronRightIcon className="h-4 w-4 text-gray-500 transition-transform duration-200" />
          )}
        </div>
      </Button>

      {/* Content */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          {children}
        </div>
      </div>
    </div>
  );
};

export default CollapsibleSection;