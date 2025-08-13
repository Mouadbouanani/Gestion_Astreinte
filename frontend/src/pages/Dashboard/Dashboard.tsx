import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import apiService from '@/services/api';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  MapIcon,
  WrenchScrewdriverIcon,
  ExclamationTriangleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalSites: number;
  totalSecteurs: number;
  totalServices: number;
  totalUsers: number;
  activeUsers: number;
  usersByRole: Record<string, number>;
}

interface Panne {
  id: string;
  description: string;
  site: string;
  secteur: string;
  service: string;
  declaredBy: string;
  timestamp: string;
  status: 'active' | 'resolved';
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pannes, setPannes] = useState<Panne[]>([]);
  const [showPanneForm, setShowPanneForm] = useState(false);
  const [newPanne, setNewPanne] = useState({
    description: '',
    site: '',
    secteur: '',
    service: '',
  });

  // Helper functions to safely access user properties
  const getSiteName = (site: any): string => {
    if (typeof site === 'string') return site;
    if (typeof site === 'object' && site?.name) return site.name;
    return 'N/A';
  };

  const getSecteurName = (secteur: any): string => {
    if (typeof secteur === 'string') return secteur;
    if (typeof secteur === 'object' && secteur?.name) return secteur.name;
    return 'N/A';
  };

  const getServiceName = (service: any): string => {
    if (typeof service === 'string') return service;
    if (typeof service === 'object' && service?.name) return service.name;
    return 'N/A';
  };

  useEffect(() => {
    loadDashboardData();
    loadPannes();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      console.log('📊 Loading dashboard data...');

      const response = await apiService.getDashboardStats();
      console.log('📊 Dashboard API response:', response);
      
      if (response.success && response.data) {
        console.log('📊 Setting real dashboard stats:', response.data);
        setStats(response.data);
      } else {
        console.error('❌ Erreur récupération données dashboard:', response.message);
        // Fallback to mock data if API fails
        const mockStats: DashboardStats = {
          totalSites: 8,
          totalSecteurs: 40,
          totalServices: 112,
          totalUsers: 18,
          activeUsers: 18,
          usersByRole: {
            admin: 1,
            chef_secteur: 4,
            chef_service: 4,
            ingenieur: 4,
            collaborateur: 5,
          },
        };
        console.log('📊 Using fallback mock stats');
        setStats(mockStats);
      }
    } catch (error) {
      console.error('❌ Erreur chargement dashboard:', error);
      // Fallback to mock data on error
      const mockStats: DashboardStats = {
        totalSites: 8,
        totalSecteurs: 40,
        totalServices: 112,
        totalUsers: 18,
        activeUsers: 18,
        usersByRole: {
          admin: 1,
          chef_secteur: 4,
          chef_service: 4,
          ingenieur: 4,
          collaborateur: 5,
        },
      };
      setStats(mockStats);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPannes = async () => {
    try {
      // Mock data for pannes - replace with actual API call
      const mockPannes: Panne[] = [
        {
          id: '1',
          description: 'Panne électrique secteur B',
          site: 'Khouribga',
          secteur: 'Production',
          service: 'Maintenance Électrique',
          declaredBy: 'Ahmed Benali',
          timestamp: new Date().toISOString(),
          status: 'active',
        },
        {
          id: '2',
          description: 'Défaillance pompe système',
          site: 'Safi',
          secteur: 'Chimie',
          service: 'Maintenance Mécanique',
          declaredBy: 'Fatima Zahra',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          status: 'resolved',
        },
      ];
      setPannes(mockPannes);
    } catch (error) {
      console.error('❌ Erreur chargement pannes:', error);
    }
  };

  const handleDeclarePanne = async () => {
    try {
      if (!newPanne.description || !newPanne.site || !newPanne.secteur || !newPanne.service) {
        alert('Veuillez remplir tous les champs');
        return;
      }

      const panne: Panne = {
        id: Date.now().toString(),
        description: newPanne.description,
        site: newPanne.site,
        secteur: newPanne.secteur,
        service: newPanne.service,
        declaredBy: user ? `${user.firstName} ${user.lastName}` : 'Utilisateur',
        timestamp: new Date().toISOString(),
        status: 'active',
      };

      // Add to local state (replace with API call)
      setPannes(prev => [panne, ...prev]);
      
      // Reset form
      setNewPanne({
        description: '',
        site: '',
        secteur: '',
        service: '',
      });
      setShowPanneForm(false);
      
      alert('Panne déclarée avec succès');
    } catch (error) {
      console.error('❌ Erreur déclaration panne:', error);
      alert('Erreur lors de la déclaration de la panne');
    }
  };

  // Dashboard public si pas d'utilisateur connecté
  if (!user) {
    return (
      <div className="space-y-6">
        {/* En-tête de bienvenue public */}
        <div className="bg-gradient-to-r from-ocp-primary to-ocp-accent rounded-xl p-6 text-white">
          <h1 className="text-2xl font-bold">Astreinte Weekends OCP</h1>
          <p className="mt-2 opacity-90">
            Planning des astreintes weekends (Samedi & Dimanche) et jours fériés marocains
          </p>
          <div className="mt-4 flex items-center space-x-4">
            <a
              href="/login"
              className="inline-flex items-center px-4 py-2 bg-white text-ocp-primary rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Se connecter pour plus de fonctionnalités
            </a>
            <div className="text-sm opacity-90">
              📊 {stats?.totalSites || 8} Sites • {stats?.totalSecteurs || 40} Secteurs • {stats?.totalUsers || 18} Collaborateurs
            </div>
          </div>
        </div>

        {/* Planning Principal - Accessible à tous */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <Card.Header>
                <h3 className="text-lg font-medium text-gray-900">Planning Astreinte - Weekends & Jours Fériés</h3>
              </Card.Header>
              <Card.Body>
                <div className="text-center py-8">
                  <CalendarDaysIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">
                    Le planning des astreintes est accessible à tous les collaborateurs OCP
                  </p>
                  <a
                    href="/planning"
                    className="inline-flex items-center px-4 py-2 bg-ocp-primary text-white rounded-lg font-medium hover:bg-ocp-primary-dark transition-colors"
                  >
                    Voir le Planning
                  </a>
                </div>
              </Card.Body>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card>
              <Card.Header>
                <h3 className="text-lg font-medium text-gray-900">Déclarer une Panne</h3>
              </Card.Header>
              <Card.Body>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Signalez une panne ou un problème technique
                  </p>
                  <Button 
                    variant="primary" 
                    className="w-full"
                    onClick={() => setShowPanneForm(true)}
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Déclarer une Panne
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>

        {/* Informations complémentaires */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <Card.Header>
              <h3 className="text-lg font-medium text-gray-900">Légende Astreinte</h3>
            </Card.Header>
            <Card.Body>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
                  <span className="text-sm text-gray-600">Ingénieurs de garde</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
                  <span className="text-sm text-gray-600">Collaborateurs de garde</span>
                </div>
                <div className="text-sm text-gray-600">
                  • Weekends (Samedi & Dimanche) - 24h/24
                </div>
                <div className="text-sm text-gray-600">
                  • Jours fériés marocains - 24h/24
                </div>
                <div className="text-sm text-gray-600">
                  • Permanence technique continue
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h3 className="text-lg font-medium text-gray-900">Sites OCP</h3>
            </Card.Header>
            <Card.Body>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Khouribga (KHB)</span>
                  <span className="font-medium">Production</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Safi (SAF)</span>
                  <span className="font-medium">Chimie</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Jorf Lasfar (JLF)</span>
                  <span className="font-medium">Engrais</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Benguerir (BNG)</span>
                  <span className="font-medium">Mine</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Youssoufia (YSF)</span>
                  <span className="font-medium">Mine</span>
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h3 className="text-lg font-medium text-gray-900">Accès Complet</h3>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Connectez-vous pour accéder aux fonctionnalités avancées :
                </p>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <CalendarDaysIcon className="h-4 w-4 mr-2 text-ocp-primary" />
                    Gestion des plannings
                  </div>
                  <div className="flex items-center">
                    <UserGroupIcon className="h-4 w-4 mr-2 text-ocp-primary" />
                    Demandes d'indisponibilité
                  </div>
                  <div className="flex items-center">
                    <ChartBarIcon className="h-4 w-4 mr-2 text-ocp-primary" />
                    Rapports détaillés
                  </div>
                </div>
                <Button variant="primary" className="w-full">
                  <a href="/login" className="flex-1">Se connecter</a>
                </Button>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    );
  }

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    let greeting = 'Bonjour';
    
    if (hour < 12) greeting = 'Bonjour';
    else if (hour < 18) greeting = 'Bon après-midi';
    else greeting = 'Bonsoir';
    
    return `${greeting}, ${user.firstName} !`;
  };

  const getRoleSpecificCards = () => {
    switch (user.role) {
      case 'admin':
        return (
          <>
            <StatCard
              title="Gestion Planning"
              value="Administrer"
              icon={CalendarDaysIcon}
              color="blue"
              href="/planning/management"
            />
            <StatCard
              title="Sites"
              value={stats?.totalSites || 0}
              icon={MapIcon}
              color="green"
              href="/admin/sites"
            />
            <StatCard
              title="Utilisateurs"
              value={stats?.totalUsers || 0}
              icon={UserGroupIcon}
              color="purple"
              href="/admin/users"
            />
            <StatCard
              title="Rapports"
              value="Voir"
              icon={ChartBarIcon}
              color="yellow"
              href="/admin/reports"
            />
          </>
        );
      
      case 'chef_secteur':
        return (
          <>
            <StatCard
              title="Mon Secteur"
              value={getSecteurName(user.secteur)}
              icon={BuildingOfficeIcon}
              color="blue"
              href="/chef-secteur/mon-secteur"
            />
            <StatCard
              title="Gestion Planning"
              value="Gérer"
              icon={CalendarDaysIcon}
              color="green"
              href="/planning/management"
            />
            <StatCard
              title="Mes Services"
              value="6"
              icon={WrenchScrewdriverIcon}
              color="yellow"
              href="/chef-secteur/mes-services"
            />
          </>
        );
      
      case 'chef_service':
        return (
          <>
            <StatCard
              title="Mon Service"
              value={getServiceName(user.service)}
              icon={WrenchScrewdriverIcon}
              color="blue"
              href="/chef-service/mon-service"
            />
            <StatCard
              title="Gestion Planning"
              value="Gérer"
              icon={CalendarDaysIcon}
              color="green"
              href="/planning/management"
            />
            <StatCard
              title="Mon Équipe"
              value="12"
              icon={UserGroupIcon}
              color="yellow"
              href="/chef-service/mon-equipe"
            />
          </>
        );
      
      case 'ingenieur':
      case 'collaborateur':
        return (
          <>
            <StatCard
              title="Planning"
              value="Consulter"
              icon={CalendarDaysIcon}
              color="blue"
              href="/planning"
            />
            <StatCard
              title="Mes Gardes"
              value="3"
              icon={ChartBarIcon}
              color="green"
              href="/planning/mes-gardes"
            />
            <StatCard
              title="Indisponibilités"
              value="Demander"
              icon={UserGroupIcon}
              color="yellow"
              href="/planning/indisponibilites"
            />
          </>
        );
      
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocp-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête de bienvenue */}
      <div className="bg-gradient-to-r from-ocp-primary to-ocp-accent rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{getWelcomeMessage()}</h1>
            <p className="mt-2 opacity-90">
              Astreinte Weekends OCP - {getSiteName(user.site) || 'Tous sites'}
            </p>
            <div className="mt-4 flex items-center space-x-4">
              <Badge role={user.role} />
              {user.site && (
                <span className="text-sm opacity-90"> {getSiteName(user.site)}</span>
              )}
              {user.secteur && (
                <span className="text-sm opacity-90"> {getSecteurName(user.secteur)}</span>
              )}
              {user.service && (
                <span className="text-sm opacity-90"> {getServiceName(user.service)}</span>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadDashboardData}
            disabled={isLoading}
            className="text-white hover:bg-white hover:text-ocp-primary"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isLoading ? 'Actualisation...' : 'Actualiser'}
          </Button>
        </div>
      </div>

      {/* Planning d'Astreinte - Accès Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <Card.Header>
              <h3 className="text-lg font-medium text-gray-900">Planning Astreinte - Weekends & Jours Fériés</h3>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Consultez le planning des astreintes pour les weekends (Samedi & Dimanche) et les jours fériés marocains.
                </p>
                <div className="flex space-x-3">
                  <Button variant="primary" className="flex-1">
                    <CalendarDaysIcon className="h-5 w-5 mr-2" />
                    Voir le Planning
                  </Button>
                  {(user.role === 'admin' || user.role === 'chef_secteur' || user.role === 'chef_service') && (
                    <Button variant="secondary" className="flex-1">
                      <WrenchScrewdriverIcon className="h-5 w-5 mr-2" />
                      Gérer le Planning
                    </Button>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <Card.Header>
              <h3 className="text-lg font-medium text-gray-900">Déclarer une Panne</h3>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Signalez une panne ou un problème technique
                </p>
                <Button 
                  variant="primary" 
                  className="w-full"
                  onClick={() => setShowPanneForm(true)}
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Déclarer une Panne
                </Button>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Statistiques et Actions Rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getRoleSpecificCards()}
      </div>

      {/* Pannes Récentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <h3 className="text-lg font-medium text-gray-900">Pannes Récentes</h3>
          </Card.Header>
          <Card.Body>
            {pannes.length > 0 ? (
              <div className="space-y-3">
                {pannes.slice(0, 5).map((panne) => (
                  <div key={panne.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <ExclamationTriangleIcon className={`h-5 w-5 ${
                      panne.status === 'active' ? 'text-red-500' : 'text-green-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{panne.description}</p>
                      <p className="text-xs text-gray-500">
                        {panne.site} • {panne.secteur} • {panne.service}
                      </p>
                      <p className="text-xs text-gray-400">
                        Déclaré par {panne.declaredBy} le {new Date(panne.timestamp).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <Badge 
                      role={panne.status === 'active' ? 'admin' : 'ingenieur'}
                      className="text-xs"
                    >
                      {panne.status === 'active' ? 'Active' : 'Résolue'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">Aucune panne récente</p>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Informations utilisateur */}
        <Card>
          <Card.Header>
            <h3 className="text-lg font-medium text-gray-900">Mes Informations</h3>
          </Card.Header>
          <Card.Body>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Nom complet</span>
                <span className="text-sm font-medium">{user.firstName} {user.lastName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Email</span>
                <span className="text-sm font-medium">{user.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Rôle</span>
                <Badge role={user.role} />
              </div>
              {user.site && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Site</span>
                  <span className="text-sm font-medium">{getSiteName(user.site)}</span>
                </div>
              )}
              {user.secteur && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Secteur</span>
                  <span className="text-sm font-medium">{getSecteurName(user.secteur)}</span>
                </div>
              )}
              {user.service && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Service</span>
                  <span className="text-sm font-medium">{getServiceName(user.service)}</span>
                </div>
              )}
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Modal Déclaration Panne */}
      {showPanneForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Déclarer une Panne</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description de la panne
                </label>
                <textarea
                  value={newPanne.description}
                  onChange={(e) => setNewPanne(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocp-primary"
                  rows={3}
                  placeholder="Décrivez la panne ou le problème technique..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
                <select
                  value={newPanne.site}
                  onChange={(e) => setNewPanne(prev => ({ ...prev, site: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocp-primary"
                >
                  <option value="">Sélectionner un site</option>
                  <option value="Khouribga">Khouribga (KHB)</option>
                  <option value="Safi">Safi (SAF)</option>
                  <option value="Jorf Lasfar">Jorf Lasfar (JLF)</option>
                  <option value="Benguerir">Benguerir (BNG)</option>
                  <option value="Youssoufia">Youssoufia (YSF)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secteur</label>
                <select
                  value={newPanne.secteur}
                  onChange={(e) => setNewPanne(prev => ({ ...prev, secteur: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocp-primary"
                >
                  <option value="">Sélectionner un secteur</option>
                  <option value="Production">Production</option>
                  <option value="Chimie">Chimie</option>
                  <option value="Engrais">Engrais</option>
                  <option value="Mine">Mine</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                <select
                  value={newPanne.service}
                  onChange={(e) => setNewPanne(prev => ({ ...prev, service: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocp-primary"
                >
                  <option value="">Sélectionner un service</option>
                  <option value="Maintenance Électrique">Maintenance Électrique</option>
                  <option value="Maintenance Mécanique">Maintenance Mécanique</option>
                  <option value="Maintenance Instrumentation">Maintenance Instrumentation</option>
                  <option value="Production">Production</option>
                  <option value="Chimie">Chimie</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => setShowPanneForm(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleDeclarePanne}
                className="flex-1"
              >
                Déclarer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Composant StatCard
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: 'blue' | 'green' | 'yellow' | 'purple';
  href?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, href }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
  };

  const content = (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <Card.Body>
        <div className="flex items-center">
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  if (href) {
    return <a href={href}>{content}</a>;
  }

  return content;
};

export default Dashboard;