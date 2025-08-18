import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import PlanningCalendar from '@/components/planning/PlanningCalendar';
import PlanningFilters from '@/components/planning/PlanningFilters';
import WeekendHolidayCalendar from '@/components/planning/WeekendHolidayCalendar';
import PlanningManager from '@/components/planning/PlanningManager';
import apiService from '@/services/api';
import astreinteService from '@/services/astreinte.service';
import type { Panne, NouvellePanne } from '@/services/astreinte.service';
import {
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalSites: number;
  totalSecteurs: number;
  totalServices: number;
  totalUsers: number;
  recentPannes?: Panne[];
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
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  const [showPanneModal, setShowPanneModal] = useState(false);
  const [newPanne, setNewPanne] = useState<NouvellePanne>({
    titre: '',
    description: '',
    type: 'technique',
    urgence: 'moyenne',
    priorite: 'normale'
  });
  const [viewMode, setViewMode] = useState<'view' | 'manage'>('view');
  const [isSubmittingPanne, setIsSubmittingPanne] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load dashboard stats
      const response = await apiService.getDashboardStats();
      
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        const mockStats: DashboardStats = {
          totalSites: 8,
          totalSecteurs: 40,
          totalServices: 112,
          totalUsers: 18,
          recentPannes: []
        };
        setStats(mockStats);
      }

      // Load recent pannes
      const pannes = await astreinteService.getPannesRecentes();
      if (pannes.length > 0) {
        setStats(prev => prev ? { ...prev, recentPannes: pannes } : null);
      }
    } catch (error) {
      console.error('❌ Erreur chargement dashboard:', error);
      const mockStats: DashboardStats = {
        totalSites: 8,
        totalSecteurs: 40,
        totalServices: 112,
        totalUsers: 18,
        recentPannes: []
      };
      setStats(mockStats);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeclarePanne = async () => {
    if (!newPanne.titre || !newPanne.description) {
      alert('Veuillez remplir le titre et la description de la panne');
      return;
    }

    try {
      setIsSubmittingPanne(true);
      
      // Add user's site, secteur, and service if available
      const panneData: NouvellePanne = {
        ...newPanne,
        site: typeof user?.site === 'object' ? user.site._id : user?.site,
        secteur: typeof user?.secteur === 'object' ? user.secteur._id : user?.secteur,
        service: typeof user?.service === 'object' ? user.service._id : user?.service,
      };

      const createdPanne = await astreinteService.declarerPanne(panneData);
      
      if (createdPanne) {
        console.log('🚨 Panne déclarée avec succès:', createdPanne);
        
        // Reset form and close modal
        setNewPanne({
          titre: '',
          description: '',
          type: 'technique',
          urgence: 'moyenne',
          priorite: 'normale'
        });
        setShowPanneModal(false);
        
        // Reload dashboard data to show the new panne
        await loadDashboardData();
        
        // Show success message
        alert('Panne déclarée avec succès !');
      }
    } catch (error) {
      console.error('❌ Erreur déclaration panne:', error);
      alert('Erreur lors de la déclaration de la panne. Veuillez réessayer.');
    } finally {
      setIsSubmittingPanne(false);
    }
  };

  const getUrgenceColor = (urgence: string) => {
    switch (urgence) {
      case 'faible': return 'bg-green-100 text-green-800';
      case 'moyenne': return 'bg-yellow-100 text-yellow-800';
      case 'haute': return 'bg-orange-100 text-orange-800';
      case 'critique': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'declaree': return 'bg-blue-100 text-blue-800';
      case 'ouverte': return 'bg-yellow-100 text-yellow-800';
      case 'en_cours': return 'bg-orange-100 text-orange-800';
      case 'resolue': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Public dashboard
  if (!user) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-ocp-primary to-ocp-accent rounded-xl p-6 text-white">
          <h1 className="text-2xl font-bold">Astreinte Weekends OCP</h1>
          <p className="mt-2 opacity-90">
            Planning des astreintes weekends (Samedi & Dimanche) et jours fériés marocains
          </p>
          <div className="mt-4 flex items-center space-x-4">
            <a href="/login" className="inline-flex items-center px-4 py-2 bg-white text-ocp-primary rounded-lg font-medium hover:bg-gray-100 transition-colors">
              Se connecter pour plus de fonctionnalités
            </a>
            <div className="text-sm opacity-90">
              📊 {stats?.totalSites || 8} Sites • {stats?.totalSecteurs || 40} Secteurs • {stats?.totalUsers || 18} Collaborateurs
            </div>
          </div>
        </div>
        <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <ExclamationTriangleIcon className="h-6 w-6 mr-2 text-red-500" />
              Déclaration de Pannes
            </h2>
            <Button 
              variant="primary" 
              onClick={() => setShowPanneModal(true)}
              className="bg-red-500 hover:bg-red-600"
            >
              Déclarer une Panne
            </Button>
          </div>
        </Card.Header>
      </Card>
      {showPanneModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Déclarer une Panne</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre de la Panne *
                </label>
                <input
                  type="text"
                  value={newPanne.titre}
                  onChange={(e) => setNewPanne({...newPanne, titre: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Titre de la panne..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={newPanne.description}
                  onChange={(e) => setNewPanne({...newPanne, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Décrivez la panne en détail..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={newPanne.type}
                    onChange={(e) => setNewPanne({...newPanne, type: e.target.value as any})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="technique">Technique</option>
                    <option value="securite">Sécurité</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Urgence
                  </label>
                  <select
                    value={newPanne.urgence}
                    onChange={(e) => setNewPanne({...newPanne, urgence: e.target.value as any})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="faible">Faible</option>
                    <option value="moyenne">Moyenne</option>
                    <option value="haute">Haute</option>
                    <option value="critique">Critique</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priorité
                </label>
                <select
                  value={newPanne.priorite}
                  onChange={(e) => setNewPanne({...newPanne, priorite: e.target.value as any})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="basse">Basse</option>
                  <option value="normale">Normale</option>
                  <option value="elevee">Élevée</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => setShowPanneModal(false)}
                className="flex-1"
                disabled={isSubmittingPanne}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleDeclarePanne}
                disabled={!newPanne.titre || !newPanne.description || isSubmittingPanne}
                className="flex-1 bg-red-500 hover:bg-red-600"
              >
                {isSubmittingPanne ? 'Déclaration...' : 'Déclarer'}
              </Button>
            </div>
          </div>
        </div>
      )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-1">
            <div className="space-y-4">
              <PlanningFilters
                filters={planningFilters}
                onFiltersChange={setPlanningFilters}
              />
            </div>
          </div>
          <div className="lg:col-span-4">
            <PlanningCalendar
              filters={planningFilters}
              onFiltersChange={setPlanningFilters}
            />
          </div>
        </div>

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
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
                  <span className="text-sm text-gray-600">Jours fériés marocains</span>
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Garde weekend:</strong> Samedi 18h00 - Dimanche 08h00
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Garde férié:</strong> 24h/24
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
                    <ExclamationTriangleIcon className="h-4 w-4 mr-2 text-ocp-primary" />
                    Déclaration de pannes
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocp-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-ocp-primary to-ocp-accent rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{getWelcomeMessage()}</h1>
            <p className="mt-2 opacity-90">
              {(() => {
                const siteLabel = user.site ? (typeof user.site === 'object' ? user.site.name : user.site) : 'Tous sites';
                return `Astreinte Weekends OCP - ${siteLabel}`;
              })()}
            </p>
            <div className="mt-4 flex items-center space-x-4">
              <Badge role={user.role} />
              {user.site && (
                <span className="text-sm opacity-90"> {typeof user.site === 'object' ? user.site.name : user.site}</span>
              )}
              {user.secteur && (
                <span className="text-sm opacity-90"> {typeof user.secteur === 'object' ? user.secteur.name : user.secteur}</span>
              )}
              {user.service && (
                <span className="text-sm opacity-90"> {typeof user.service === 'object' ? user.service.name : user.service}</span>
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

      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <ExclamationTriangleIcon className="h-6 w-6 mr-2 text-red-500" />
              Déclaration de Pannes
            </h2>
            <Button 
              variant="primary" 
              onClick={() => setShowPanneModal(true)}
              className="bg-red-500 hover:bg-red-600"
            >
              Déclarer une Panne
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {stats?.recentPannes?.filter(p => p.statut === 'declaree').length || 0}
              </div>
              <div className="text-sm text-gray-600">Nouvelles</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {stats?.recentPannes?.filter(p => p.statut === 'en_cours').length || 0}
              </div>
              <div className="text-sm text-gray-600">En cours</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {stats?.recentPannes?.filter(p => p.statut === 'resolue').length || 0}
              </div>
              <div className="text-sm text-gray-600">Résolues</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {stats?.recentPannes?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <CalendarDaysIcon className="h-6 w-6 mr-2 text-blue-500" />
              Planning d'Astreinte Weekends & Jours Fériés
            </h2>
            <div className="flex space-x-2">
              <Button
                variant={viewMode === 'view' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setViewMode('view')}
              >
                <ChartBarIcon className="h-4 w-4 mr-2" />
                Consulter
              </Button>
              {(user.role === 'admin' || user.role === 'chef_secteur' || user.role === 'chef_service') && (
                <Button
                  variant={viewMode === 'manage' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setViewMode('manage')}
                >
                  <WrenchScrewdriverIcon className="h-4 w-4 mr-2" />
                  Gérer
                </Button>
              )}
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          {viewMode === 'view' ? (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-1">
                <div className="space-y-4">
                  <PlanningFilters
                    filters={planningFilters}
                    onFiltersChange={setPlanningFilters}
                  />
                </div>
              </div>
              <div className="lg:col-span-4">
                <PlanningCalendar
                  filters={planningFilters}
                  onFiltersChange={setPlanningFilters}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Gestion des Astreintes</h3>
                <p className="text-sm text-blue-700">
                  Déplacez les collaborateurs entre weekends, réorganisez la rotation, 
                  et gérez les demandes d'indisponibilité.
                </p>
              </div>
              {/* Gestion simple: ordre de rotation + calendrier visuel */}
              <PlanningManager
                secteurId={typeof user.secteur === 'object' ? (user.secteur._id || (user.secteur as any).id) : (user.secteur as any)}
                serviceId={typeof user.service === 'object' ? (user.service?._id || (user.service as any)?.id) : (user.service as any)}
                startDate={planningFilters.startDate}
                endDate={planningFilters.endDate}
                currentUserRole={user.role}
              />
              <WeekendHolidayCalendar
                secteurId={typeof user.secteur === 'object' ? (user.secteur._id || (user.secteur as any).id) : (user.secteur as any)}
                startDate={planningFilters.startDate}
                endDate={planningFilters.endDate}
              />
            </div>
          )}
        </Card.Body>
      </Card>

      {stats?.recentPannes && stats.recentPannes.length > 0 && (
        <Card>
          <Card.Header>
            <h3 className="text-lg font-medium text-gray-900">Pannes Récentes</h3>
          </Card.Header>
          <Card.Body>
            <div className="space-y-3">
              {stats.recentPannes.slice(0, 5).map((panne) => (
                <div key={panne.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      panne.statut === 'declaree' ? 'bg-blue-500' :
                      panne.statut === 'en_cours' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
                    <div>
                      <p className="font-medium text-gray-900">{panne.titre}</p>
                      <p className="text-sm text-gray-500">
                        {panne.site?.name || 'Tous sites'} • {panne.secteur?.name || 'Tous secteurs'} • 
                        Déclarée par {panne.declaredBy ? `${panne.declaredBy.firstName} ${panne.declaredBy.lastName}` : 'Inconnu'}
                      </p>
                      <div className="flex space-x-2 mt-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(panne.type)}`}>
                          {panne.type}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getUrgenceColor(panne.urgence)}`}>
                          {panne.urgence}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatutColor(panne.statut)}`}>
                          {panne.statut}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">
                      {new Date(panne.dateCreation).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}

      {showPanneModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Déclarer une Panne</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre de la Panne *
                </label>
                <input
                  type="text"
                  value={newPanne.titre}
                  onChange={(e) => setNewPanne({...newPanne, titre: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Titre de la panne..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={newPanne.description}
                  onChange={(e) => setNewPanne({...newPanne, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Décrivez la panne en détail..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={newPanne.type}
                    onChange={(e) => setNewPanne({...newPanne, type: e.target.value as any})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="technique">Technique</option>
                    <option value="securite">Sécurité</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Urgence
                  </label>
                  <select
                    value={newPanne.urgence}
                    onChange={(e) => setNewPanne({...newPanne, urgence: e.target.value as any})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="faible">Faible</option>
                    <option value="moyenne">Moyenne</option>
                    <option value="haute">Haute</option>
                    <option value="critique">Critique</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priorité
                </label>
                <select
                  value={newPanne.priorite}
                  onChange={(e) => setNewPanne({...newPanne, priorite: e.target.value as any})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="basse">Basse</option>
                  <option value="normale">Normale</option>
                  <option value="elevee">Élevée</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => setShowPanneModal(false)}
                className="flex-1"
                disabled={isSubmittingPanne}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleDeclarePanne}
                disabled={!newPanne.titre || !newPanne.description || isSubmittingPanne}
                className="flex-1 bg-red-500 hover:bg-red-600"
              >
                {isSubmittingPanne ? 'Déclaration...' : 'Déclarer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function for type colors
const getTypeColor = (type: string) => {
  switch (type) {
    case 'technique': return 'bg-blue-100 text-blue-800';
    case 'securite': return 'bg-red-100 text-red-800';
    case 'maintenance': return 'bg-purple-100 text-purple-800';
    case 'autre': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default Dashboard;