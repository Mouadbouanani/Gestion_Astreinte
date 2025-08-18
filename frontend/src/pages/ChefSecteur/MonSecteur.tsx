import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import toast from 'react-hot-toast';
import type { Secteur, Service, User } from '@/types';
import {
  BuildingOfficeIcon,
  WrenchScrewdriverIcon,
  UserGroupIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const MonSecteur: React.FC = () => {
  const { user } = useAuth();
  const [secteur, setSecteur] = useState<Secteur | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [ingenieurs, setIngenieurs] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'chef_secteur' && user.secteur?._id) {
      loadSecteurData();
    } else if (user?.role === 'chef_secteur' && !user.secteur) {
      // User is chef_secteur but has no secteur assigned
      setIsLoading(false);
    }
  }, [user?.role, user?.secteur?._id]);

  const loadSecteurData = async () => {
    try {
      setIsLoading(true);

      // Set secteur from user data directly
      if (user?.secteur) {
        setSecteur(user.secteur);
      }

      // Load services of this secteur - use a simpler approach
      if (user?.secteur?._id) {
        try {
          const servicesResponse = await apiService.getServicesBySecteur(user.secteur._id);
          setServices(servicesResponse.data || []);
        } catch (serviceError) {
          console.log('Services not loaded:', serviceError);
          setServices([]);
        }

        // Load engineers in this secteur
        try {
          const ingenieurResponse = await apiService.getUsersBySecteur(user.secteur._id, 'ingenieur');
          setIngenieurs(ingenieurResponse.data || []);
        } catch (ingenieurError) {
          console.log('Engineers not loaded:', ingenieurError);
          setIngenieurs([]);
        }
      }

    } catch (error) {
      console.error('Error loading secteur data:', error);
      // Don't show error toast, just log it
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.role !== 'chef_secteur') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h2>
          <p className="text-gray-600">
            Cette page est réservée aux chefs de secteur.
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

  if (!user?.secteur) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucun secteur assigné</h2>
          <p className="text-gray-600">
            Vous n'avez pas de secteur assigné. Contactez l'administrateur.
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
          <h1 className="text-2xl font-bold text-gray-900">Mon Secteur</h1>
          <p className="text-gray-600">Gestion de votre secteur et de ses services</p>
        </div>
      </div>

      {/* Secteur Info */}
      {secteur && (
        <Card>
          <Card.Header>
            <div className="flex items-center space-x-3">
              <BuildingOfficeIcon className="h-6 w-6 text-ocp-primary" />
              <h2 className="text-xl font-semibold text-gray-900">{secteur.name}</h2>
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
                    <span className="text-sm text-gray-900">{secteur.code}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Site:</span>
                    <span className="text-sm text-gray-900">{secteur.site?.name}</span>
                  </div>
                  {secteur.description && (
                    <div className="flex items-start space-x-2">
                      <span className="text-sm font-medium text-gray-700">Description:</span>
                      <span className="text-sm text-gray-900">{secteur.description}</span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Contact</h3>
                <div className="space-y-2">
                  {secteur.contact?.email && (
                    <div className="flex items-center space-x-2">
                      <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{secteur.contact.email}</span>
                    </div>
                  )}
                  {secteur.contact?.phone && (
                    <div className="flex items-center space-x-2">
                      <PhoneIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{secteur.contact.phone}</span>
                    </div>
                  )}
                  {secteur.contact?.address && (
                    <div className="flex items-center space-x-2">
                      <MapPinIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{secteur.contact.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Services */}
      <Card>
        <Card.Header>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <WrenchScrewdriverIcon className="h-6 w-6 text-ocp-primary" />
              <h2 className="text-xl font-semibold text-gray-900">Services du Secteur</h2>
              <Badge variant="info">{services.length}</Badge>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          {services.length === 0 ? (
            <div className="text-center py-8">
              <WrenchScrewdriverIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucun service trouvé dans ce secteur</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service, idx) => (
                <div key={service._id || `${service.code}-${idx}`} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium text-gray-900">{service.name}</h3>
                    <Badge variant={service.isActive ? 'success' : 'error'}>
                      {service.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{service.code}</p>
                  {service.description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{service.description}</p>
                  )}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <UserGroupIcon className="h-4 w-4" />
                      <span>Chef: {service.chefService?.firstName} {service.chefService?.lastName}</span>
                    </div>
                    <Button variant="ghost" size="sm">
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Ingénieurs */}
      <Card>
        <Card.Header>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <UserGroupIcon className="h-6 w-6 text-ocp-primary" />
              <h2 className="text-xl font-semibold text-gray-900">Ingénieurs du Secteur</h2>
              <Badge variant="info">{ingenieurs.length}</Badge>
            </div>
            <Button variant="primary" size="sm" className="flex items-center space-x-2">
              <CalendarDaysIcon className="h-4 w-4" />
              <span>Gérer les Gardes</span>
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {ingenieurs.length === 0 ? (
            <div className="text-center py-8">
              <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucun ingénieur trouvé dans ce secteur</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ingenieurs.map((ingenieur, idx) => (
                <div key={ingenieur._id || `${ingenieur.email}-${idx}`} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-ocp-primary flex items-center justify-center">
                      <span className="text-white font-medium">
                        {ingenieur.firstName?.[0]}{ingenieur.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {ingenieur.firstName} {ingenieur.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">Ingénieur</p>
                    </div>
                  </div>
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <EnvelopeIcon className="h-4 w-4" />
                      <span>{ingenieur.email}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <PhoneIcon className="h-4 w-4" />
                      <span>{ingenieur.phone}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <Badge variant={ingenieur.isActive ? 'success' : 'error'}>
                      {ingenieur.isActive ? 'Actif' : 'Inactif'}
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
    </div>
  );
};

export default MonSecteur;
