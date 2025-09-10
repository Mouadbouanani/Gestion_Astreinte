import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { Service } from '@/types';
import { ServiceList, ServiceForm, ServiceDetails } from '@/components/services';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { PlusIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ServiceManagement: React.FC = () => {
  const { user } = useAuth();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);

  // Check if current user can manage services
  const canManageServices = user?.role === 'admin';

  const handleCreateService = () => {
    setSelectedService(null);
    setIsFormOpen(true);
  };

  const handleEditService = (service: Service) => {
    setSelectedService(service);
    setIsFormOpen(true);
  };

  const handleViewService = (service: Service) => {
    console.log('🔍 handleViewService called with:', service);
    setSelectedService(service);
    setIsDetailsOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedService(null);
  };

  const handleDetailsClose = () => {
    setIsDetailsOpen(false);
    setSelectedService(null);
  };

  const handleFormSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleEditFromDetails = () => {
    setIsDetailsOpen(false);
    setIsFormOpen(true);
  };

  // If user doesn't have permission to view services, show access denied
  if (!canManageServices) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h2>
          <p className="text-gray-600">
            Vous n'avez pas les permissions nécessaires pour accéder à la gestion des services.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <WrenchScrewdriverIcon className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Services</h1>
            <p className="text-gray-600">Gérer tous les services du système OCP Astreinte</p>
          </div>
        </div>
        {canManageServices && (
          <Button
            onClick={handleCreateService}
            className="flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Nouveau Service</span>
          </Button>
        )}
      </div>

      {/* Service List */}
      <ServiceList
        key={refreshKey}
        onEditService={handleEditService}
        onViewService={handleViewService}
        canManageServices={canManageServices}
      />

      {/* Service Form Modal */}
      <ServiceForm
        service={selectedService}
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />

      {/* Service Details Modal */}
      <ServiceDetails
        service={selectedService}
        isOpen={isDetailsOpen}
        onClose={handleDetailsClose}
        onEdit={handleEditFromDetails}
        canEdit={canManageServices}
      />
    </div>
  );
};

export default ServiceManagement;




