import React from 'react';
import type { Service } from '@/types';
import { getSiteName, getSecteurName } from '@/utils/typeGuards';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  XMarkIcon,
  WrenchScrewdriverIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ClockIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface ServiceDetailsProps {
  service: Service | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  canEdit?: boolean;
}

export const ServiceDetails: React.FC<ServiceDetailsProps> = ({
  service,
  isOpen,
  onClose,
  onEdit,
  canEdit = false
}) => {
  if (!isOpen || !service) {
    return null;
  }

  // Helper function to get chef service name
  const getChefServiceName = (chefService: any): string => {
    if (!chefService) return 'Non assigné';
    if (typeof chefService === 'string') return chefService;
    return `${chefService.firstName || ''} ${chefService.lastName || ''}`.trim() || 'Non assigné';
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Détails du service</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Service Header */}
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 h-16 w-16">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <WrenchScrewdriverIcon className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900">
                {service.name}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="success">
                  {service.code}
                </Badge>
                <Badge variant="info">
                  {service.minPersonnel} personnel min.
                </Badge>
              </div>
            </div>
          </div>

          {/* Service Information */}
          <Card>
            <Card.Header>
              <h4 className="text-lg font-medium flex items-center">
                <InformationCircleIcon className="h-5 w-5 mr-2" />
                Informations du service
              </h4>
            </Card.Header>
            <Card.Body>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Nom</p>
                  <p className="text-gray-900 font-medium">{service.name}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Code</p>
                  <p className="text-gray-900 font-medium">{service.code}</p>
                </div>

                {service.description && (
                  <div>
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="text-gray-900">{service.description}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-500">Personnel minimum requis</p>
                  <p className="text-gray-900 font-medium">{service.minPersonnel} personne(s)</p>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Organization Information */}
          <Card>
            <Card.Header>
              <h4 className="text-lg font-medium flex items-center">
                <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                Organisation
              </h4>
            </Card.Header>
            <Card.Body>
              <div className="space-y-3">
                {service.secteur && (
                  <div>
                    <p className="text-sm text-gray-500">Secteur</p>
                    <p className="text-gray-900 font-medium">{getSecteurName(service.secteur)}</p>
                    {typeof service.secteur === 'object' && service.secteur.code && (
                      <p className="text-sm text-gray-600">Code: {service.secteur.code}</p>
                    )}
                  </div>
                )}

                {typeof service.secteur === 'object' && service.secteur.site && (
                  <div>
                    <p className="text-sm text-gray-500">Site</p>
                    <p className="text-gray-900 font-medium">{getSiteName(service.secteur.site)}</p>
                    {typeof service.secteur.site === 'object' && service.secteur.site.code && (
                      <p className="text-sm text-gray-600">Code: {service.secteur.site.code}</p>
                    )}
                  </div>
                )}

                {service.chefService && (
                  <div>
                    <p className="text-sm text-gray-500">Chef de service</p>
                    <p className="text-gray-900 font-medium">{getChefServiceName(service.chefService)}</p>
                    {typeof service.chefService === 'object' && service.chefService.email && (
                      <p className="text-sm text-gray-600">Email: {service.chefService.email}</p>
                    )}
                    {typeof service.chefService === 'object' && service.chefService.phone && (
                      <p className="text-sm text-gray-600">Téléphone: {service.chefService.phone}</p>
                    )}
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>

          {/* Activity Information */}
          <Card>
            <Card.Header>
              <h4 className="text-lg font-medium flex items-center">
                <ClockIcon className="h-5 w-5 mr-2" />
                Activité
              </h4>
            </Card.Header>
            <Card.Body>
              <div className="space-y-3">
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Créé le</p>
                    <p className="text-gray-900">{service.createdAt ? new Date(service.createdAt).toLocaleDateString('fr-FR') : 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Dernière modification</p>
                    <p className="text-gray-900">{service.updatedAt ? new Date(service.updatedAt).toLocaleDateString('fr-FR') : 'N/A'}</p>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="secondary"
              onClick={onClose}
            >
              Fermer
            </Button>
            {canEdit && onEdit && (
              <Button
                onClick={onEdit}
              >
                Modifier
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
