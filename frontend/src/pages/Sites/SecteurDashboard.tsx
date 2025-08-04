// frontend/src/pages/Sites/SecteurDashboard.tsx
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
  EyeIcon,
  PencilIcon,
  MapPinIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import apiService from '@/services/api';
import type { Secteur, Service, Site, User } from '@/types';

interface SecteurDashboardProps {
  siteId?: string;
}

interface SecteurWithStats extends Secteur {
  statistics: {
    servicesCount: number;
    usersCount: number;
    usersByRole: {
      chefSecteur: number;
      ingenieurs: number;
      chefsService: number;
      collaborateurs: number;
    };
    servicesActifs: number;
    servicesInactifs: number;
  };
  services: Service[];
  users: User[];
}

interface DashboardStats {
  totalSecteurs: number;
  totalServices: number;
  totalUsers: number;
  secteursActifs: number;
  secteursInactifs: number;
  servicesActifs: number;
  servicesInactifs: number;
  usersByRole: {
    admin: number;
    chefSecteur: number;
    chefService: number;
    ingenieur: number;
    collaborateur: number;
  };
}

const SecteurDashboard: React.FC<SecteurDashboardProps> = ({ siteId }) => {
  const { user } = useAuth();
  const [secteurs, setSecteurs] = useState<SecteurWithStats[]>([]);
  const [site, setSite] = useState<Site | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSecteur, setSelectedSecteur] = useState<SecteurWithStats | null>(null);

  // Get siteId from props or user's site
  const currentSiteId = siteId || user?.site?._id || user?.site;

  useEffect(() => {
    if (currentSiteId) {
      loadDashboardData();
    }
  }, [currentSiteId]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load site info
      if (typeof currentSiteId === 'string') {
        const siteResponse = await apiService.getSiteById(currentSiteId);
        setSite(siteResponse.data);
      }

      // Load secteurs with statistics
      if (typeof currentSiteId === 'string') {
        const secteursResponse = await apiService.getSecteurs(currentSiteId);
        const secteursWithStats = await Promise.all(
          (secteursResponse.data || []).map(async (secteur: Secteur) => {
            try {
              const secteurDetailResponse = await apiService.getSecteurById(secteur._id);
              return secteurDetailResponse.data as SecteurWithStats;
            } catch (error) {
              console.error(`Error loading secteur ${secteur._id}:`, error);
              return {
                ...secteur,
                statistics: {
                  servicesCount: 0,
                  usersCount: 0,
                  usersByRole: {
                    chefSecteur: 0,
                    ingenieurs: 0,
                    chefsService: 0,
                    collaborateurs: 0
                  },
                  servicesActifs: 0,
                  servicesInactifs: 0
                },
                services: [],
                users: []
              } as SecteurWithStats;
            }
          })
        );

        setSecteurs(secteursWithStats);

        // Calculate overall statistics
        const calculatedStats: DashboardStats = {
          totalSecteurs: secteursWithStats.length,
          totalServices: secteursWithStats.reduce((sum, s) => sum + s.statistics.servicesCount, 0),
          totalUsers: secteursWithStats.reduce((sum, s) => sum + s.statistics.usersCount, 0),
          secteursActifs: secteursWithStats.filter(s => s.isActive).length,
          secteursInactifs: secteursWithStats.filter(s => !s.isActive).length,
          servicesActifs: secteursWithStats.reduce((sum, s) => sum + s.statistics.servicesActifs, 0),
          servicesInactifs: secteursWithStats.reduce((sum, s) => sum + s.statistics.servicesInactifs, 0),
          usersByRole: {
            admin: 0,
            chefSecteur: secteursWithStats.reduce((sum, s) => sum + s.statistics.usersByRole.chefSecteur, 0),
            chefService: secteursWithStats.reduce((sum, s) => sum + s.statistics.usersByRole.chefsService, 0),
            ingenieur: secteursWithStats.reduce((sum, s) => sum + s.statistics.usersByRole.ingenieurs, 0),
            collaborateur: secteursWithStats.reduce((sum, s) => sum + s.statistics.usersByRole.collaborateurs, 0)
          }
        };

        setStats(calculatedStats);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Fallback to mock data
      loadMockData();
    } finally {
      setIsLoading(false);
    }
  };

  const loadMockData = () => {
    // Mock data as fallback
    const mockSecteurs: SecteurWithStats[] = [
      {
        _id: '1',
        name: 'Traitement',
        code: 'TRA',
        description: 'Secteur de traitement et purification',
        site: currentSiteId as string,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        statistics: {
          servicesCount: 3,
          usersCount: 45,
          usersByRole: {
            chefSecteur: 1,
            ingenieurs: 8,
            chefsService: 3,
            collaborateurs: 33
          },
          servicesActifs: 3,
          servicesInactifs: 0
        },
        services: [],
        users: []
      },
      {
        _id: '2',
        name: 'Extraction',
        code: 'EXT',
        description: 'Secteur d\'extraction et de traitement primaire',
        site: currentSiteId as string,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        statistics: {
          servicesCount: 2,
          usersCount: 32,
          usersByRole: {
            chefSecteur: 1,
            ingenieurs: 6,
            chefsService: 2,
            collaborateurs: 23
          },
          servicesActifs: 2,
          servicesInactifs: 0
        },
        services: [],
        users: []
      }
    ];

    setSecteurs(mockSecteurs);

    const mockStats: DashboardStats = {
      totalSecteurs: mockSecteurs.length,
      totalServices: mockSecteurs.reduce((sum, s) => sum + s.statistics.servicesCount, 0),
      totalUsers: mockSecteurs.reduce((sum, s) => sum + s.statistics.usersCount, 0),
      secteursActifs: mockSecteurs.filter(s => s.isActive).length,
      secteursInactifs: mockSecteurs.filter(s => !s.isActive).length,
      servicesActifs: mockSecteurs.reduce((sum, s) => sum + s.statistics.servicesActifs, 0),
      servicesInactifs: mockSecteurs.reduce((sum, s) => sum + s.statistics.servicesInactifs, 0),
      usersByRole: {
        admin: 0,
        chefSecteur: mockSecteurs.reduce((sum, s) => sum + s.statistics.usersByRole.chefSecteur, 0),
        chefService: mockSecteurs.reduce((sum, s) => sum + s.statistics.usersByRole.chefsService, 0),
        ingenieur: mockSecteurs.reduce((sum, s) => sum + s.statistics.usersByRole.ingenieurs, 0),
        collaborateur: mockSecteurs.reduce((sum, s) => sum + s.statistics.usersByRole.collaborateurs, 0)
      }
    };

    setStats(mockStats);
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? CheckCircleIcon : XCircleIcon;
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'Actif' : 'Inactif';
  };

  // Check permissions - only admin and chef_secteur can view dashboard
  if (!user || (user.role !== 'admin' && user.role !== 'chef_secteur')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Accès non autorisé</h2>
          <p className="text-gray-600 mt-2">Cette page est réservée aux administrateurs et chefs de secteur.</p>
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
      {/* Debug Info - Remove this later */}
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        <strong>Debug Info:</strong> Current user role: {user?.role || 'No role'} | Site ID: {currentSiteId || 'No site'} | Site: {site?.name || 'No site'}
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-ocp-primary to-ocp-accent rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">Tableau de Bord - Secteurs</h1>
        <p className="mt-2 opacity-90">
          Vue d'ensemble des secteurs du site {site?.name || 'Site'}
        </p>
        {site && (
          <div className="mt-2 flex items-center space-x-4 text-sm opacity-90">
            <span>🏢 {site.name}</span>
            <span>📍 {site.address}</span>
            <span>📊 {stats?.totalSecteurs || 0} secteurs</span>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <Card.Body>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-500">
                <BuildingOfficeIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Secteurs</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.totalSecteurs}</p>
                <p className="text-xs text-gray-500">{stats?.secteursActifs} actifs</p>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-500">
                <WrenchScrewdriverIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Services</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.totalServices}</p>
                <p className="text-xs text-gray-500">{stats?.servicesActifs} actifs</p>
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
                <p className="text-sm font-medium text-gray-500">Utilisateurs</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.totalUsers}</p>
                <p className="text-xs text-gray-500">Total personnel</p>
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
                <p className="text-sm font-medium text-gray-500">Chefs Service</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.usersByRole.chefService}</p>
                <p className="text-xs text-gray-500">Responsables</p>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* User Role Distribution */}
      <Card>
        <Card.Header>
          <h3 className="text-lg font-medium text-gray-900">Répartition par Rôle</h3>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats?.usersByRole.chefSecteur || 0}</div>
              <div className="text-sm text-gray-600">Chefs Secteur</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats?.usersByRole.chefService || 0}</div>
              <div className="text-sm text-gray-600">Chefs Service</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats?.usersByRole.ingenieur || 0}</div>
              <div className="text-sm text-gray-600">Ingénieurs</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{stats?.usersByRole.collaborateur || 0}</div>
              <div className="text-sm text-gray-600">Collaborateurs</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{stats?.usersByRole.admin || 0}</div>
              <div className="text-sm text-gray-600">Administrateurs</div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Secteurs List */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Secteurs</h3>
            <div className="flex space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={loadDashboardData}
                disabled={isLoading}
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isLoading ? 'Chargement...' : 'Actualiser'}
              </Button>
              <Button variant="primary" size="sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                Nouveau Secteur
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {secteurs.map((secteur) => {
              const StatusIcon = getStatusIcon(secteur.isActive);
              return (
                <div
                  key={secteur._id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-lg font-medium text-gray-900">{secteur.name}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(secteur.isActive)}`}>
                          {getStatusText(secteur.isActive)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{secteur.description}</p>
                      <p className="text-sm text-gray-500 mt-1">Code: {secteur.code}</p>
                    </div>
                    <StatusIcon className="h-5 w-5 text-gray-400" />
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-semibold text-blue-600">{secteur.statistics.servicesCount}</div>
                      <div className="text-xs text-gray-600">Services</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-semibold text-green-600">{secteur.statistics.usersCount}</div>
                      <div className="text-xs text-gray-600">Utilisateurs</div>
                    </div>
                  </div>

                  {/* User breakdown */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Chefs Service:</span>
                      <span className="font-medium">{secteur.statistics.usersByRole.chefsService}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Ingénieurs:</span>
                      <span className="font-medium">{secteur.statistics.usersByRole.ingenieurs}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Collaborateurs:</span>
                      <span className="font-medium">{secteur.statistics.usersByRole.collaborateurs}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 pt-4 border-t border-gray-100">
                    <Button variant="ghost" size="sm" className="flex-1">
                      <EyeIcon className="h-4 w-4 mr-2" />
                      Voir
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1">
                      <PencilIcon className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card.Body>
      </Card>

      {/* Quick Actions */}
      <Card>
        <Card.Header>
          <h3 className="text-lg font-medium text-gray-900">Actions Rapides</h3>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
              <PlusIcon className="h-6 w-6 mb-2" />
              <span>Nouveau Secteur</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
              <UserGroupIcon className="h-6 w-6 mb-2" />
              <span>Gérer Utilisateurs</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
              <ChartBarIcon className="h-6 w-6 mb-2" />
              <span>Rapports</span>
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default SecteurDashboard; 