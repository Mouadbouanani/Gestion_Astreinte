import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import PlanningDisplay from '@/components/planning/PlanningDisplay';
import PlanningManagement from '@/components/planning/PlanningManagement';
import Button from '@/components/ui/Button';
import {
  CalendarDaysIcon,
  WrenchScrewdriverIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

const PlanningAstreinte: React.FC = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'display' | 'management'>('display');

  const canManagePlanning = user && (
    user.role === 'admin' || 
    user.role === 'chef_secteur' || 
    user.role === 'chef_service'
  );

  return (
    <div className="space-y-6">
      {/* Header with view toggle */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Planning Astreinte OCP</h1>
            <p className="text-gray-600 mt-2">
              Weekends (Samedi & Dimanche) et jours fériés marocains - Permanence 24h/24
            </p>
          </div>
          
          {canManagePlanning && (
            <div className="flex space-x-3">
              <Button
                variant={viewMode === 'display' ? 'primary' : 'secondary'}
                onClick={() => setViewMode('display')}
                className="flex items-center"
              >
                <EyeIcon className="h-5 w-5 mr-2" />
                Consulter
              </Button>
              <Button
                variant={viewMode === 'management' ? 'primary' : 'secondary'}
                onClick={() => setViewMode('management')}
                className="flex items-center"
              >
                <WrenchScrewdriverIcon className="h-5 w-5 mr-2" />
                Gérer
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* View Mode Selection Info */}
      {!canManagePlanning && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <CalendarDaysIcon className="h-5 w-5 text-blue-500 mr-2" />
            <div>
              <p className="text-sm font-medium text-blue-800">
                Mode consultation uniquement
              </p>
              <p className="text-sm text-blue-700">
                Seuls les administrateurs, chefs de secteur et chefs de service peuvent gérer le planning.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content based on view mode */}
      {viewMode === 'display' ? (
        <PlanningDisplay />
      ) : (
        <PlanningManagement />
      )}

      {/* Additional Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Informations importantes</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>Les astreintes couvrent les weekends et jours fériés marocains</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>Permanence technique continue 24h/24</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>Équipe mixte : 1 ingénieur + 1 collaborateur minimum</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Jours fériés marocains</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>1er Janvier</span>
              <span className="font-medium">Nouvel An</span>
            </div>
            <div className="flex justify-between">
              <span>11 Janvier</span>
              <span className="font-medium">Manifeste Indépendance</span>
            </div>
            <div className="flex justify-between">
              <span>1er Mai</span>
              <span className="font-medium">Fête du Travail</span>
            </div>
            <div className="flex justify-between">
              <span>30 Juillet</span>
              <span className="font-medium">Fête du Trône</span>
            </div>
            <div className="flex justify-between">
              <span>20 Août</span>
              <span className="font-medium">Révolution Roi et Peuple</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Contact urgence</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div>
              <p className="font-medium text-gray-900">Centre de contrôle</p>
              <p>+212 5 22 23 45 67</p>
            </div>
            <div>
              <p className="font-medium text-gray-900">Responsable astreinte</p>
              <p>+212 6 12 34 56 78</p>
            </div>
            <div>
              <p className="font-medium text-gray-900">Email</p>
              <p>astreinte@ocpgroup.ma</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanningAstreinte;