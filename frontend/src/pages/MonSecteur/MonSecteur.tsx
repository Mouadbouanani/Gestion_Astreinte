import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

interface Service {
  id: string;
  name: string;
  description: string;
  chef: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  collaborateurs: number;
  ingenieurs: number;
  status: 'active' | 'maintenance' | 'inactive';
}

interface SecteurStats {
  totalServices: number;
  totalCollaborateurs: number;
  totalIngenieurs: number;
  servicesActifs: number;
}

const MonSecteur: React.FC = () => {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [stats, setStats] = useState<SecteurStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSecteurData();
  }, []);

  const loadSecteurData = async () => {
    try {
      // Simulation de données
      const mockServices: Service[] = [
        {
          id: '1',
          name: 'Extraction',
          description: 'Service d\'extraction et de traitement primaire',
          chef: {
            id: '1',
            firstName: 'Ahmed',
            lastName: 'Benali',
            email: 'a.benali@ocp.ma'
          },
          collaborateurs: 15,
          ingenieurs: 3,
          status: 'active'
        },
        {
          id: '2',
          name: 'Traitement',
          description: 'Service de traitement et purification',
          chef: {
            id: '2',
            firstName: 'Fatima',
            lastName: 'Alami',
            email: 'f.alami@ocp.ma'
          },
          collaborateurs: 12,
          ingenieurs: 4,
          status: 'active'
        },
        {
          id: '3',
          name: 'Qualité',
          description: 'Contrôle qualité et laboratoire',
          chef: {
            id: '3',
            firstName: 'Mohamed',
            lastName: 'Tazi',
            email: 'm.tazi@ocp.ma'
          },
          collaborateurs: 8,
          ingenieurs: 2,
          status: 'maintenance'
        }
      ];

      const mockStats: SecteurStats = {
        totalServices: mockServices.length,
        totalCollaborateurs: mockServices.reduce((sum, s) => sum + s.collaborateurs, 0),
        totalIngenieurs: mockServices.reduce((sum, s) => sum + s.ingenieurs, 0),
        servicesActifs: mockServices.filter(s => s.status === 'active').length
      };

      setServices(mockServices);
      setStats(mockStats);
    } catch (error) {
      console.error('Erreur chargement secteur:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'maintenance': return 'Maintenance';
      case 'inactive': return 'Inactif';
      default: return 'Inconnu';
    }
  };

  if (!user || user.role !== 'chef_secteur') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Accès non autorisé</h2>
          <p className="text-gray-600 mt-2">Cette page est réservée aux chefs de secteur.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocp-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-ocp-primary to-ocp-accent rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">Mon Secteur</h1>
        <p className="mt-2 opacity-90">
          Gestion du secteur {user.secteur?.name} - {user.site?.name}
        </p>
        <div className="mt-4 flex items-center space-x-4">
          <Badge role={user.role} />
          <span className="text-sm opacity-90">🏢 {user.secteur?.name}</span>
          <span className="text-sm opacity-90">📍 {user.site?.name}</span>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <Card.Body>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-500">
                <WrenchScrewdriverIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Services</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.totalServices}</p>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-500">
                <UserGroupIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Collaborateurs</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.totalCollaborateurs}</p>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-500">
                <UserGroupIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Ingénieurs</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.totalIngenieurs}</p>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-500">
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Services Actifs</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.servicesActifs}</p>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Liste des services */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Mes Services</h3>
            <Button variant="primary" size="sm">
              <PlusIcon className="h-4 w-4 mr-2" />
              Nouveau Service
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="space-y-4">
            {services.map((service) => (
              <div
                key={service.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-lg font-medium text-gray-900">{service.name}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(service.status)}`}>
                        {getStatusText(service.status)}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-1">{service.description}</p>
                    <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                      <span>👤 Chef: {service.chef.firstName} {service.chef.lastName}</span>
                      <span>👥 {service.collaborateurs} collaborateurs</span>
                      <span>🎓 {service.ingenieurs} ingénieurs</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default MonSecteur;
