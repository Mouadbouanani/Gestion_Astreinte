import React from 'react';
import type { Service } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import {
  WrenchScrewdriverIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  MapPinIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface ServiceCardProps {
  service: Service;
  onEditService: (service: Service) => void;
  onViewService: (service: Service) => void;
  onDeleteService: (serviceId: string) => void;
  canManageServices: boolean;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onEditService,
  onViewService,
  onDeleteService,
  canManageServices
}) => {
  const getChefServiceName = (chefService: string | any | undefined): string => {
    if (!chefService) return 'Non assigné';
    if (typeof chefService === 'string') return chefService;
    return `${chefService.firstName || ''} ${chefService.lastName || ''}`.trim() || 'Non assigné';
  };

  const getSecteurName = (secteur: string | any | undefined): string => {
    if (!secteur) return 'N/A';
    if (typeof secteur === 'string') return secteur;
    return secteur.name;
  };

  const getSiteName = (site: string | any | undefined): string => {
    if (!site) return 'N/A';
    if (typeof site === 'string') return site;
    return site.name;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <Card.Body>
        <div className="flex items-start justify-between">
          {/* Service Header */}
          <div className="flex items-center space-x-3 flex-1">
            <div className="flex-shrink-0 h-12 w-12">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <WrenchScrewdriverIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {service.name}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="info" className="text-xs">
                  {service.code}
                </Badge>
                <Badge variant="success" className="text-xs">
                  {service.minPersonnel} personnel min.
                </Badge>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewService(service)}
              title="Voir les détails"
            >
              <EyeIcon className="h-4 w-4" />
            </Button>
            {canManageServices && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditService(service)}
                  title="Modifier"
                >
                  <PencilIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteService(service._id)}
                  className="text-red-600 hover:text-red-800"
                  title="Supprimer"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Service Details */}
        <div className="mt-4 space-y-3">
          {/* Description */}
          {service.description && (
            <div>
              <p className="text-sm text-gray-600 line-clamp-2">
                {service.description}
              </p>
            </div>
          )}

          {/* Organization Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <BuildingOfficeIcon className="h-4 w-4 mr-2 text-gray-400" />
                <span className="font-medium">Secteur:</span>
                <span className="ml-1 text-gray-900">{getSecteurName(service.secteur)}</span>
              </div>
              
              {typeof service.secteur === 'object' && service.secteur.site && (
                <div className="flex items-center text-sm text-gray-600">
                  <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="font-medium">Site:</span>
                  <span className="ml-1 text-gray-900">{getSiteName(service.secteur.site)}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <UserGroupIcon className="h-4 w-4 mr-2 text-gray-400" />
                <span className="font-medium">Chef Service:</span>
                <span className="ml-1 text-gray-900">{getChefServiceName(service.chefService)}</span>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              {service.createdAt && (
                <div className="flex items-center">
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  <span>Créé le {formatDate(service.createdAt)}</span>
                </div>
              )}
              {service.updatedAt && service.updatedAt !== service.createdAt && (
                <div className="flex items-center">
                  <ClockIcon className="h-3 w-3 mr-1" />
                  <span>Modifié le {formatDate(service.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};




