import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import toast from 'react-hot-toast';
import type { Service, User } from '@/types';
import {
  WrenchScrewdriverIcon,
  UserGroupIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  BuildingOfficeIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

const MonService: React.FC = () => {
  const { user } = useAuth();
  const [service, setService] = useState<Service | null>(null);
  const [collaborateurs, setCollaborateurs] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'chef_service' && user.service?._id) {
      loadServiceData();
    } else if (user?.role === 'chef_service' && !user.service) {
      // User is chef_service but has no service assigned
      setIsLoading(false);
    }
  }, [user?.role, user?.service?._id]);

  const loadServiceData = async () => {
    try {
      setIsLoading(true);

      // Set service from user data directly
      if (user?.service) {
        setService(user.service);
      }

      // Load collaborators in this service
      if (user?.service?._id) {
        try {
          const collaborateurResponse = await apiService.getUsersByService(user.service._id, 'collaborateur');
          setCollaborateurs(collaborateurResponse.data || []);
        } catch (collaborateurError) {
          console.log('Collaborators not loaded:', collaborateurError);
          setCollaborateurs([]);
        }
      }

    } catch (error) {
      console.error('Error loading service data:', error);
      // Don't show error toast, just log it
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.role !== 'chef_service') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h2>
          <p className="text-gray-600">
            Cette page est réservée aux chefs de service.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocp-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user?.service) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucun service assigné</h2>
          <p className="text-gray-600">
            Vous n'avez pas de service assigné. Contactez l'administrateur.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mon Service</h1>
          <p className="text-gray-600">Gestion de votre service et de votre équipe</p>
        </div>
      </div>

      {/* Service Info */}
      {service && (
        <Card>
          <Card.Header>
            <div className="flex items-center space-x-3">
              <WrenchScrewdriverIcon className="h-6 w-6 text-ocp-primary" />
              <h2 className="text-xl font-semibold text-gray-900">{service.name}</h2>
              <Badge variant="success">Actif</Badge>
            </div>
          </Card.Header>
          <Card.Body>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Informations générales</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Code:</span>
                    <span className="text-sm text-gray-900">{service.code}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Secteur:</span>
                    <span className="text-sm text-gray-900">{service.secteur?.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Site:</span>
                    <span className="text-sm text-gray-900">{service.secteur?.site?.name}</span>
                  </div>
                  {service.description && (
                    <div className="flex items-start space-x-2">
                      <span className="text-sm font-medium text-gray-700">Description:</span>
                      <span className="text-sm text-gray-900">{service.description}</span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Contact</h3>
                <div className="space-y-2">
                  {/* Contact information removed as it's not in the Service interface */}
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <Card.Body>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-8 w-8 text-ocp-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Collaborateurs</p>
                <p className="text-2xl font-semibold text-gray-900">{collaborateurs.length}</p>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarDaysIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Gardes ce mois</p>
                <p className="text-2xl font-semibold text-gray-900">8</p>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Taux de couverture</p>
                <p className="text-2xl font-semibold text-gray-900">100%</p>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Collaborateurs */}
      <Card>
        <Card.Header>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <UserGroupIcon className="h-6 w-6 text-ocp-primary" />
              <h2 className="text-xl font-semibold text-gray-900">Mon Équipe</h2>
              <Badge variant="info">{collaborateurs.length}</Badge>
            </div>
            <Button variant="primary" size="sm" className="flex items-center space-x-2">
              <CalendarDaysIcon className="h-4 w-4" />
              <span>Gérer Planning</span>
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {collaborateurs.length === 0 ? (
            <div className="text-center py-8">
              <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucun collaborateur trouvé dans ce service</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {collaborateurs.map((collaborateur) => (
                <div key={collaborateur._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-ocp-primary flex items-center justify-center">
                      <span className="text-white font-medium">
                        {collaborateur.firstName?.[0]}{collaborateur.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {collaborateur.firstName} {collaborateur.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">Collaborateur</p>
                    </div>
                  </div>
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <EnvelopeIcon className="h-4 w-4" />
                      <span>{collaborateur.email}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <PhoneIcon className="h-4 w-4" />
                      <span>{collaborateur.phone}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <Badge variant={collaborateur.isActive ? 'success' : 'error'}>
                      {collaborateur.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm">
                        <CalendarDaysIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Quick Actions */}
      <Card>
        <Card.Header>
          <h2 className="text-xl font-semibold text-gray-900">Actions Rapides</h2>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="primary" className="flex items-center justify-center space-x-2 py-4">
              <CalendarDaysIcon className="h-5 w-5" />
              <span>Planifier Garde</span>
            </Button>
            <Button variant="secondary" className="flex items-center justify-center space-x-2 py-4">
              <UserGroupIcon className="h-5 w-5" />
              <span>Gérer Équipe</span>
            </Button>
            <Button variant="secondary" className="flex items-center justify-center space-x-2 py-4">
              <PencilIcon className="h-5 w-5" />
              <span>Modifier Service</span>
            </Button>
            <Button variant="secondary" className="flex items-center justify-center space-x-2 py-4">
              <EyeIcon className="h-5 w-5" />
              <span>Voir Rapports</span>
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default MonService;
