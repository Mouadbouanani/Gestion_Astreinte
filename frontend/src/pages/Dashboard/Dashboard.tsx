import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import PlanningCalendar from '@/components/planning/PlanningCalendar';
import PlanningFilters from '@/components/planning/PlanningFilters';
import apiService from '@/services/api';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  MapIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalSites: number;
  totalSecteurs: number;
  totalServices: number;
  totalUsers: number;
  activeUsers: number;
  usersByRole: Record<string, number>;
  recentActivity?: Array<{
    id: string;
    type: string;
    user: string;
    target: string;
    description: string;
    timestamp: string;
  }>;
}

interface DashboardPlanningFilters {
  siteId?: string;
  secteurId?: string;
  serviceId?: string;
  startDate: Date;
  endDate: Date;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [planningFilters, setPlanningFilters] = useState<DashboardPlanningFilters>({
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 jours
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
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      console.log('📊 Loading dashboard data...');
      console.log('📊 API Base URL:', import.meta.env.VITE_API_URL || 'http://localhost:5050/api');

      // Fetch real data from API
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

  // Dashboard public si pas d'utilisateur connecté
  if (!user) {
    return (
      <div className="space-y-6">
        {/* En-tête de bienvenue public */}
        <div className="bg-gradient-to-r from-ocp-primary to-ocp-accent rounded-xl p-6 text-white">
          <h1 className="text-2xl font-bold">Astreinte Weekends OCP</h1>
          <p className="mt-2 opacity-90">
            Planning des astreintes weekends (Samedi & Dimanche) du Groupe OCP
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filtres */}
          <div className="lg:col-span-1">
            <PlanningFilters
              filters={planningFilters}
              onFiltersChange={setPlanningFilters}
            />
          </div>

          {/* Calendrier */}
          <div className="lg:col-span-3">
            <PlanningCalendar
              filters={planningFilters}
              onFiltersChange={setPlanningFilters}
            />
          </div>
        </div>

        {/* Informations complémentaires */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <Card.Header>
              <h3 className="text-lg font-medium text-gray-900">Légende</h3>
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
                <div className="flex items-center space-x-2">
                  <span className="text-sm"></span>
                  <span className="text-sm text-gray-600">Astreinte weekend (24h)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm"></span>
                  <span className="text-sm text-gray-600">Samedi & Dimanche uniquement</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm"></span>
                  <span className="text-sm text-gray-600">Permanence 24h/24</span>
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
              title="Sites"
              value={stats?.totalSites || 0}
              icon={MapIcon}
              color="blue"
              href="/sites"
            />
            <StatCard
              title="Secteurs"
              value={stats?.totalSecteurs || 0}
              icon={BuildingOfficeIcon}
              color="green"
              href="/secteurs"
            />
            <StatCard
              title="Services"
              value={stats?.totalServices || 0}
              icon={WrenchScrewdriverIcon}
              color="yellow"
              href="/services"
            />
            <StatCard
              title="Utilisateurs"
              value={stats?.totalUsers || 0}
              icon={UserGroupIcon}
              color="purple"
              href="/users"
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
              href="/mon-secteur"
            />
            <StatCard
              title="Mes Services"
              value="6" // À calculer dynamiquement
              icon={WrenchScrewdriverIcon}
              color="green"
              href="/mes-services"
            />
            <StatCard
              title="Planning"
              value="Actuel"
              icon={CalendarDaysIcon}
              color="yellow"
              href="/planning"
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
              href="/mon-service"
            />
            <StatCard
              title="Mon Équipe"
              value="12" // À calculer dynamiquement
              icon={UserGroupIcon}
              color="green"
              href="/mon-service"
            />
            <StatCard
              title="Planning"
              value="Actuel"
              icon={CalendarDaysIcon}
              color="yellow"
              href="/planning"
            />
          </>
        );
      
      case 'ingenieur':
      case 'collaborateur':
        return (
          <>
            <StatCard
              title="Mes Gardes"
              value="3" // À calculer dynamiquement
              icon={CalendarDaysIcon}
              color="blue"
              href="/mes-gardes"
            />
            <StatCard
              title="Planning"
              value="Consulter"
              icon={ChartBarIcon}
              color="green"
              href="/planning"
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

      {/* Planning d'Astreinte - Composant Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filtres */}
        <div className="lg:col-span-1">
          <PlanningFilters
            filters={planningFilters}
            onFiltersChange={setPlanningFilters}
          />
        </div>

        {/* Calendrier */}
        <div className="lg:col-span-3">
          <PlanningCalendar
            filters={planningFilters}
            onFiltersChange={setPlanningFilters}
          />
        </div>
      </div>

      {/* Statistiques et Actions Rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getRoleSpecificCards()}
      </div>

              {/* Informations détaillées */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

          {/* Activité récente */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-medium text-gray-900">Activité Récente</h3>
            </Card.Header>
            <Card.Body>
              {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentActivity.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{activity.description}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.timestamp).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">Aucune activité récente</p>
                </div>
              )}
            </Card.Body>
          </Card>

        {/* Actions rapides */}
        <Card>
          <Card.Header>
            <h3 className="text-lg font-medium text-gray-900">Actions Rapides</h3>
          </Card.Header>
          <Card.Body>
            <div className="space-y-3">
              <Button variant="primary" className="w-full justify-start">
                <CalendarDaysIcon className="h-5 w-5 mr-2" />
                Consulter le Planning
              </Button>
              
              {(user.role === 'chef_secteur' || user.role === 'chef_service') && (
                <Button variant="secondary" className="w-full justify-start">
                  <UserGroupIcon className="h-5 w-5 mr-2" />
                  Gérer mon Équipe
                </Button>
              )}
              
              {user.role === 'admin' && (
                <Button variant="secondary" className="w-full justify-start">
                  <ChartBarIcon className="h-5 w-5 mr-2" />
                  Voir les Rapports
                </Button>
              )}
              
              <Button variant="ghost" className="w-full justify-start">
                <UserGroupIcon className="h-5 w-5 mr-2" />
                Modifier mon Profil
              </Button>
            </div>
          </Card.Body>
        </Card>
      </div>
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

// Composant PublicStatCard pour le dashboard public
interface PublicStatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: 'blue' | 'green' | 'yellow' | 'purple';
}

const PublicStatCard: React.FC<PublicStatCardProps> = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
  };

  return (
    <Card>
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
};

export default Dashboard;
