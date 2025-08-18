import React from 'react';
import { PhoneIcon, MapPinIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import Badge from '@/components/ui/Badge';
import type { UserRole } from '@/types';

interface ContactInfoProps {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    role: UserRole;
  };
  site: {
    id: string;
    name: string;
  };
  secteur: {
    id: string;
    name: string;
  };
  service: {
    id: string;
    name: string;
  };
  type: 'ingenieur' | 'collaborateur';
  shift: 'day' | 'night' | 'weekend';
  hasPanne?: boolean;
  panneDetails?: {
    type: string;
    description: string;
    urgence: string;
  };
  compact?: boolean;
}

const ContactInfo: React.FC<ContactInfoProps> = ({
  user,
  site,
  secteur,
  service,
  type,
  shift,
  hasPanne = false,
  panneDetails,
  compact = false
}) => {
  const getShiftIcon = () => {
    switch (shift) {
      case 'day': return '🌅';
      case 'night': return '🌙';
      case 'weekend': return '🏖️';
      default: return '⏰';
    }
  };

  const getShiftLabel = () => {
    switch (shift) {
      case 'day': return 'Jour';
      case 'night': return 'Nuit';
      case 'weekend': return 'Weekend';
      default: return 'Garde';
    }
  };

  if (compact) {
    return (
      <div className={`text-xs p-2 rounded-lg border ${
        type === 'ingenieur'
          ? 'bg-blue-50 border-blue-200 text-blue-900'
          : 'bg-green-50 border-green-200 text-green-900'
      } ${hasPanne ? 'ring-2 ring-red-400' : ''}`}>
        {hasPanne && (
          <div className="flex items-center mb-1">
            <span className="text-red-600 text-xs font-bold">🚨 PANNE</span>
            {panneDetails && (
              <span className="ml-1 text-xs text-red-600">
                ({panneDetails.urgence})
              </span>
            )}
          </div>
        )}
        
        <div className="font-medium mb-1">
          {user.firstName} {user.lastName}
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center text-xs opacity-75">
            <Badge role={user.role} size="sm" className="mr-1" />
            <span>{getShiftIcon()} {getShiftLabel()}</span>
          </div>
          
          {user.phone && (
            <div className="flex items-center text-xs">
              <PhoneIcon className="h-3 w-3 mr-1" />
              <a href={`tel:${user.phone}`} className="hover:underline">
                {user.phone}
              </a>
            </div>
          )}
          
          <div className="text-xs opacity-75">
            {site.name} • {secteur.name}
          </div>
          <div className="text-xs opacity-75">
            {service.name}
          </div>
          
          {user.address && (
            <div className="flex items-start text-xs opacity-75">
              <MapPinIcon className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{user.address}</span>
            </div>
          )}
        </div>
        
        {panneDetails && (
          <div className="mt-2 p-1 bg-red-100 rounded text-xs">
            <div className="font-medium text-red-800">
              {panneDetails.type}: {panneDetails.description}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg border ${
      type === 'ingenieur'
        ? 'bg-blue-50 border-blue-200'
        : 'bg-green-50 border-green-200'
    } ${hasPanne ? 'ring-2 ring-red-400' : ''}`}>
      {hasPanne && (
        <div className="flex items-center justify-between mb-3 p-2 bg-red-100 rounded-lg">
          <div className="flex items-center">
            <span className="text-red-600 font-bold">🚨 SERVICE EN PANNE</span>
            {panneDetails && (
              <Badge variant="error" size="sm" className="ml-2">
                {panneDetails.urgence}
              </Badge>
            )}
          </div>
        </div>
      )}
      
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900">
            {user.firstName} {user.lastName}
          </h4>
          <div className="flex items-center mt-1">
            <Badge role={user.role} size="sm" className="mr-2" />
            <span className="text-sm text-gray-600">
              {getShiftIcon()} {getShiftLabel()}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center text-sm text-gray-600">
          <EnvelopeIcon className="h-4 w-4 mr-2" />
          <a href={`mailto:${user.email}`} className="hover:underline">
            {user.email}
          </a>
        </div>
        
        {user.phone && (
          <div className="flex items-center text-sm text-gray-600">
            <PhoneIcon className="h-4 w-4 mr-2" />
            <a href={`tel:${user.phone}`} className="hover:underline font-medium">
              {user.phone}
            </a>
          </div>
        )}
        
        {user.address && (
          <div className="flex items-start text-sm text-gray-600">
            <MapPinIcon className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            <span>{user.address}</span>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          <div><strong>Site:</strong> {site.name}</div>
          <div><strong>Secteur:</strong> {secteur.name}</div>
          <div><strong>Service:</strong> {service.name}</div>
        </div>
      </div>

      {panneDetails && (
        <div className="mt-3 p-3 bg-red-100 rounded-lg">
          <div className="text-sm">
            <div className="font-medium text-red-800 mb-1">
              Détails de la panne:
            </div>
            <div className="text-red-700">
              <strong>Type:</strong> {panneDetails.type}
            </div>
            <div className="text-red-700">
              <strong>Description:</strong> {panneDetails.description}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactInfo;