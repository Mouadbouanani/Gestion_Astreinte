  import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import PlanningCalendar from '@/components/planning/PlanningCalendar';
import PlanningFilters from '@/components/planning/PlanningFilters';
import ServiceFilter from '@/components/planning/ServiceFilter';
import ContactInfo from '@/components/planning/ContactInfo';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { CalendarDaysIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface DashboardPlanningFilters {
  siteId?: string;
  secteurId?: string;
  serviceId?: string;
  startDate: Date;
  endDate: Date;
}

const PlanningDemo: React.FC = () => {
  const [planningFilters, setPlanningFilters] = useState<DashboardPlanningFilters>({
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
  });
  
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [showOnlyWithPanne, setShowOnlyWithPanne] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'contact'>('calendar');

  // Mock contact data for demonstration
  const mockContact = {
    user: {
      id: '1',
      firstName: 'Ahmed',
      lastName: 'Benali',
      email: 'a.benali@ocp.ma',
      phone: '+212 6 12 34 56 78',
      address: '123 Rue Hassan II, Khouribga 25000',
      role: 'ingenieur' as const
    },
    site: {
      id: '1',
      name: 'Khouribga'
    },
    secteur: {
      id: '1',
      name: 'Production'
    },
    service: {
      id: '1',
      name: 'Extraction'
    },
    type: 'ingenieur' as const,
    shift: 'weekend' as const,
    hasPanne: true,
    panneDetails: {
      type: 'technique',
      description: 'Panne système de refroidissement principal',
      urgence: 'haute'
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-ocp-primary to-ocp-accent p-6 text-white">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">
            Gestion d'Astreinte OCP - Démo Planning Amélioré
          </h1>
          <p className="text-lg opacity-90">
            Planning des astreintes weekends avec contacts et gestion des pannes
          </p>
          <div className="mt-4 flex items-center space-x-4">
            <Badge role="admin" />
            <span className="text-sm opacity-90">
              📊 8 Sites • 40 Secteurs • 112 Services • 18 Collaborateurs
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Navigation */}
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CalendarDaysIcon className="h-6 w-6 text-ocp-primary" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Planning d'Astreinte Weekends & Jours Fériés
                </h2>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant={viewMode === 'calendar' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                >
                  📅 Calendrier
                </Button>
                <Button
                  variant={viewMode === 'contact' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setViewMode('contact')}
                >
                  👤 Exemple Contact
                </Button>
              </div>
            </div>
          </Card.Header>
        </Card>

        {/* Alertes pannes critiques */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
            <span className="font-medium text-red-800">
              2 pannes critiques en cours - Personnel de garde contactable directement
            </span>
          </div>
        </div>

        {viewMode === 'calendar' ? (
          /* Vue Calendrier */
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-1">
              <div className="space-y-4">
                <PlanningFilters
                  filters={planningFilters}
                  onFiltersChange={setPlanningFilters}
                />
                <ServiceFilter
                  onServiceSelect={setSelectedServiceId}
                  onPanneFilter={setShowOnlyWithPanne}
                  selectedServiceId={selectedServiceId || undefined}
                  showOnlyWithPanne={showOnlyWithPanne}
                />
              </div>
            </div>
            
            <div className="lg:col-span-4">
              <PlanningCalendar
                filters={planningFilters}
                onFiltersChange={setPlanningFilters}
                selectedServiceId={selectedServiceId || undefined}
                showOnlyWithPanne={showOnlyWithPanne}
              />
            </div>
          </div>
        ) : (
          /* Vue Contact Demo */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Card>
                <Card.Header>
                  <h3 className="text-lg font-medium text-gray-900">
                    Contact Compact (Vue Calendrier)
                  </h3>
                </Card.Header>
                <Card.Body>
                  <ContactInfo
                    {...mockContact}
                    compact={true}
                  />
                </Card.Body>
              </Card>
            </div>
            
            <div>
              <Card>
                <Card.Header>
                  <h3 className="text-lg font-medium text-gray-900">
                    Contact Détaillé (Vue Modal)
                  </h3>
                </Card.Header>
                <Card.Body>
                  <ContactInfo
                    {...mockContact}
                    compact={false}
                  />
                </Card.Body>
              </Card>
            </div>
          </div>
        )}

        {/* Fonctionnalités */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <Card.Header>
              <h3 className="text-lg font-medium text-gray-900">✅ Corrections Apportées</h3>
            </Card.Header>
            <Card.Body>
              <div className="space-y-2 text-sm text-gray-600">
                <div>• ✅ Noms des jours corrigés (Lundi, Mardi, etc.)</div>
                <div>• ✅ Numéros de jours corrects (14 = Jeudi)</div>
                <div>• ✅ Vue mensuelle au lieu de hebdomadaire</div>
                <div>• ✅ Contacts avec téléphones et adresses</div>
                <div>• ✅ Filtre par service et pannes</div>
                <div>• ✅ Indicateurs visuels des pannes</div>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h3 className="text-lg font-medium text-gray-900">📞 Gestion des Contacts</h3>
            </Card.Header>
            <Card.Body>
              <div className="space-y-2 text-sm text-gray-600">
                <div>• Téléphones cliquables pour appel direct</div>
                <div>• Adresses complètes affichées</div>
                <div>• Emails cliquables</div>
                <div>• Vue compacte dans le calendrier</div>
                <div>• Vue détaillée en modal</div>
                <div>• Badges de rôles colorés</div>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h3 className="text-lg font-medium text-gray-900">🚨 Gestion des Pannes</h3>
            </Card.Header>
            <Card.Body>
              <div className="space-y-2 text-sm text-gray-600">
                <div>• Filtre services avec pannes</div>
                <div>• Indicateurs visuels d'urgence</div>
                <div>• Contact direct du personnel de garde</div>
                <div>• Détails des pannes affichés</div>
                <div>• Alertes critiques en haut de page</div>
                <div>• Codes couleur par niveau d'urgence</div>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Notifications toast */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#374151',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
};

export default PlanningDemo;