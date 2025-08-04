import React, { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  FunnelIcon,
  XMarkIcon,
  MapIcon,
  BuildingOfficeIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';

interface Site {
  id: string;
  name: string;
  code: string;
}

interface Secteur {
  id: string;
  name: string;
  siteId: string;
}

interface Service {
  id: string;
  name: string;
  secteurId: string;
}

interface PlanningFilters {
  siteId?: string;
  secteurId?: string;
  serviceId?: string;
  startDate: Date;
  endDate: Date;
}

interface PlanningFiltersProps {
  filters: PlanningFilters;
  onFiltersChange: (filters: PlanningFilters) => void;
}

const PlanningFilters: React.FC<PlanningFiltersProps> = ({ filters, onFiltersChange }) => {
  const [sites, setSites] = useState<Site[]>([]);
  const [secteurs, setSecteurs] = useState<Secteur[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFilterData();
  }, []);

  useEffect(() => {
    // Charger les secteurs quand un site est sélectionné
    if (filters.siteId) {
      loadSecteurs(filters.siteId);
    } else {
      setSecteurs([]);
      setServices([]);
    }
  }, [filters.siteId]);

  useEffect(() => {
    // Charger les services quand un secteur est sélectionné
    if (filters.secteurId) {
      loadServices(filters.secteurId);
    } else {
      setServices([]);
    }
  }, [filters.secteurId]);

  const loadFilterData = async () => {
    try {
      // Simulation de données
      const mockSites: Site[] = [
        { id: '1', name: 'Khouribga', code: 'KHB' },
        { id: '2', name: 'Safi', code: 'SAF' },
        { id: '3', name: 'Jorf Lasfar', code: 'JLF' },
        { id: '4', name: 'Benguerir', code: 'BNG' },
        { id: '5', name: 'Youssoufia', code: 'YSF' },
      ];

      setSites(mockSites);
    } catch (error) {
      console.error('Erreur chargement sites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSecteurs = async (siteId: string) => {
    try {
      // Simulation de données secteurs par site
      const mockSecteurs: Record<string, Secteur[]> = {
        '1': [ // Khouribga
          { id: '1', name: 'Production', siteId: '1' },
          { id: '2', name: 'Maintenance', siteId: '1' },
          { id: '3', name: 'Logistique', siteId: '1' },
        ],
        '2': [ // Safi
          { id: '4', name: 'Chimie', siteId: '2' },
          { id: '5', name: 'Utilités', siteId: '2' },
          { id: '6', name: 'Expédition', siteId: '2' },
        ],
        '3': [ // Jorf Lasfar
          { id: '7', name: 'Phosphorique', siteId: '3' },
          { id: '8', name: 'Sulfurique', siteId: '3' },
          { id: '9', name: 'Engrais', siteId: '3' },
        ],
      };

      setSecteurs(mockSecteurs[siteId] || []);
    } catch (error) {
      console.error('Erreur chargement secteurs:', error);
    }
  };

  const loadServices = async (secteurId: string) => {
    try {
      // Simulation de données services par secteur
      const mockServices: Record<string, Service[]> = {
        '1': [ // Production
          { id: '1', name: 'Extraction', secteurId: '1' },
          { id: '2', name: 'Traitement', secteurId: '1' },
          { id: '3', name: 'Qualité', secteurId: '1' },
        ],
        '2': [ // Maintenance
          { id: '4', name: 'Mécanique', secteurId: '2' },
          { id: '5', name: 'Électricité', secteurId: '2' },
          { id: '6', name: 'Instrumentation', secteurId: '2' },
        ],
        '4': [ // Chimie
          { id: '7', name: 'Réacteurs', secteurId: '4' },
          { id: '8', name: 'Purification', secteurId: '4' },
          { id: '9', name: 'Contrôle Process', secteurId: '4' },
        ],
      };

      setServices(mockServices[secteurId] || []);
    } catch (error) {
      console.error('Erreur chargement services:', error);
    }
  };

  const handleFilterChange = (key: keyof PlanningFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    
    // Reset des filtres dépendants
    if (key === 'siteId') {
      newFilters.secteurId = undefined;
      newFilters.serviceId = undefined;
    } else if (key === 'secteurId') {
      newFilters.serviceId = undefined;
    }
    
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    onFiltersChange({
      startDate: filters.startDate,
      endDate: filters.endDate,
    });
  };

  const hasActiveFilters = filters.siteId || filters.secteurId || filters.serviceId;

  if (isLoading) {
    return (
      <Card>
        <Card.Body>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-ocp-primary" />
            <h3 className="text-lg font-medium text-gray-900">Filtres</h3>
          </div>
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-red-600 hover:text-red-700"
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              Effacer
            </Button>
          )}
        </div>
      </Card.Header>
      
      <Card.Body className="space-y-4">
        {/* Filtre Site */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapIcon className="h-4 w-4 inline mr-1" />
            Site
          </label>
          <select
            value={filters.siteId || ''}
            onChange={(e) => handleFilterChange('siteId', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocp-primary focus:border-transparent"
          >
            <option value="">Tous les sites</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name} ({site.code})
              </option>
            ))}
          </select>
        </div>

        {/* Filtre Secteur */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <BuildingOfficeIcon className="h-4 w-4 inline mr-1" />
            Secteur
          </label>
          <select
            value={filters.secteurId || ''}
            onChange={(e) => handleFilterChange('secteurId', e.target.value || undefined)}
            disabled={!filters.siteId}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocp-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Tous les secteurs</option>
            {secteurs.map((secteur) => (
              <option key={secteur.id} value={secteur.id}>
                {secteur.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filtre Service */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <WrenchScrewdriverIcon className="h-4 w-4 inline mr-1" />
            Service
          </label>
          <select
            value={filters.serviceId || ''}
            onChange={(e) => handleFilterChange('serviceId', e.target.value || undefined)}
            disabled={!filters.secteurId}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocp-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Tous les services</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </div>

        {/* Résumé des filtres actifs */}
        {hasActiveFilters && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Filtres actifs :</h4>
            <div className="space-y-1 text-sm text-gray-600">
              {filters.siteId && (
                <div>• Site : {sites.find(s => s.id === filters.siteId)?.name}</div>
              )}
              {filters.secteurId && (
                <div>• Secteur : {secteurs.find(s => s.id === filters.secteurId)?.name}</div>
              )}
              {filters.serviceId && (
                <div>• Service : {services.find(s => s.id === filters.serviceId)?.name}</div>
              )}
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default PlanningFilters;
