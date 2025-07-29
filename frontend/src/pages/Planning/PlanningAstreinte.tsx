import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import PlanningCalendar from '@/components/planning/PlanningCalendar';
import PlanningFilters from '@/components/planning/PlanningFilters';
import holidaysService from '@/services/holidays.service';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

interface PlanningFilters {
  siteId?: string;
  secteurId?: string;
  serviceId?: string;
  startDate: Date;
  endDate: Date;
}

const PlanningAstreinte: React.FC = () => {
  const { user } = useAuth();
  const [planningFilters, setPlanningFilters] = useState<PlanningFilters>({
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
  });
  const [nextHoliday, setNextHoliday] = useState<any>(null);

  useEffect(() => {
    loadNextHoliday();
  }, []);

  const loadNextHoliday = () => {
    const holiday = holidaysService.getNextHoliday();
    setNextHoliday(holiday);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-ocp-primary to-ocp-accent rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">Planning d'Astreinte</h1>
        <p className="mt-2 opacity-90">
          Gestion complète des astreintes weekends et jours fériés
        </p>
        {user && (
          <div className="mt-4 flex items-center space-x-4">
            <span className="text-sm opacity-90">👤 {user.firstName} {user.lastName}</span>
            {user.site && (
              <span className="text-sm opacity-90">📍 {user.site.name}</span>
            )}
            {user.secteur && (
              <span className="text-sm opacity-90">🏢 {user.secteur.name}</span>
            )}
          </div>
        )}
      </div>

      {/* Informations importantes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <Card.Body>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-500">
                <CalendarDaysIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Astreintes</p>
                <p className="text-lg font-semibold text-gray-900">Weekends uniquement</p>
                <p className="text-xs text-gray-500">Samedi & Dimanche</p>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-orange-500">
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Durée</p>
                <p className="text-lg font-semibold text-gray-900">24h/24</p>
                <p className="text-xs text-gray-500">Permanence continue</p>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-red-500">
                <ExclamationTriangleIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Prochain férié</p>
                {nextHoliday ? (
                  <>
                    <p className="text-lg font-semibold text-gray-900">{nextHoliday.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(nextHoliday.date).toLocaleDateString('fr-FR')}
                    </p>
                  </>
                ) : (
                  <p className="text-lg font-semibold text-gray-900">Aucun</p>
                )}
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Planning principal */}
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Règles d'astreinte */}
        <Card>
          <Card.Header>
            <h3 className="text-lg font-medium text-gray-900">Règles d'Astreinte</h3>
          </Card.Header>
          <Card.Body>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <InformationCircleIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Weekends uniquement</h4>
                  <p className="text-sm text-gray-600">
                    Les astreintes sont programmées uniquement les samedis et dimanches.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <InformationCircleIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Jours fériés</h4>
                  <p className="text-sm text-gray-600">
                    Les jours fériés marocains sont automatiquement identifiés et marqués.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <InformationCircleIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Rotation équitable</h4>
                  <p className="text-sm text-gray-600">
                    Alternance automatique entre les équipes A et B toutes les 2 semaines.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <InformationCircleIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Couverture complète</h4>
                  <p className="text-sm text-gray-600">
                    Chaque site dispose d'un ingénieur et d'un collaborateur de garde.
                  </p>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Actions rapides */}
        <Card>
          <Card.Header>
            <h3 className="text-lg font-medium text-gray-900">Actions Rapides</h3>
          </Card.Header>
          <Card.Body>
            <div className="space-y-3">
              {user && (user.role === 'admin' || user.role === 'chef_secteur') && (
                <>
                  <Button variant="primary" className="w-full justify-start">
                    <CalendarDaysIcon className="h-5 w-5 mr-2" />
                    Créer Nouvelle Astreinte
                  </Button>
                  
                  <Button variant="secondary" className="w-full justify-start">
                    <UserGroupIcon className="h-5 w-5 mr-2" />
                    Gérer les Équipes
                  </Button>
                </>
              )}
              
              {user && (user.role === 'ingenieur' || user.role === 'collaborateur') && (
                <Button variant="primary" className="w-full justify-start">
                  <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                  Demander Indisponibilité
                </Button>
              )}
              
              <Button variant="ghost" className="w-full justify-start">
                <CalendarDaysIcon className="h-5 w-5 mr-2" />
                Exporter Planning
              </Button>
              
              <Button variant="ghost" className="w-full justify-start">
                <InformationCircleIcon className="h-5 w-5 mr-2" />
                Guide d'Utilisation
              </Button>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Légende détaillée */}
      <Card>
        <Card.Header>
          <h3 className="text-lg font-medium text-gray-900">Légende du Planning</h3>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
              <span className="text-sm text-gray-600">Ingénieurs de garde</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
              <span className="text-sm text-gray-600">Collaborateurs de garde</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-50 border border-red-200 rounded"></div>
              <span className="text-sm text-gray-600">Jours fériés marocains</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-50 border border-orange-200 rounded"></div>
              <span className="text-sm text-gray-600">Weekends avec astreinte</span>
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default PlanningAstreinte;
