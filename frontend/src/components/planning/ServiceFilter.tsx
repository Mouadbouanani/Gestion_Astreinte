import React, { useState, useEffect } from 'react';
import { 
  FunnelIcon, 
  XMarkIcon, 
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface ServiceWithStatus {
  id: string;
  name: string;
  secteurName: string;
  siteName: string;
  hasPanne: boolean;
  panneDetails?: {
    type: 'technique' | 'securite' | 'maintenance' | 'autre';
    description: string;
    urgence: 'basse' | 'moyenne' | 'haute' | 'critique';
    timestamp: string;
  };
  personnelOnDuty?: {
    ingenieurs: Array<{
      id: string;
      name: string;
      phone: string;
    }>;
    collaborateurs: Array<{
      id: string;
      name: string;
      phone: string;
    }>;
  };
}

interface ServiceFilterProps {
  onServiceSelect: (serviceId: string | null) => void;
  onPanneFilter: (showOnlyWithPanne: boolean) => void;
  selectedServiceId?: string;
  showOnlyWithPanne?: boolean;
}

const ServiceFilter: React.FC<ServiceFilterProps> = ({
  onServiceSelect,
  onPanneFilter,
  selectedServiceId,
  showOnlyWithPanne = false
}) => {
  const [services, setServices] = useState<ServiceWithStatus[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadServicesWithStatus();
  }, []);

  const loadServicesWithStatus = async () => {
    try {
      setIsLoading(true);
      
      // Mock data with panne status
      const mockServices: ServiceWithStatus[] = [
        {
          id: '1',
          name: 'Extraction',
          secteurName: 'Production',
          siteName: 'Khouribga',
          hasPanne: true,
          panneDetails: {
            type: 'technique',
            description: 'Panne système de refroidissement',
            urgence: 'haute',
            timestamp: new Date().toISOString()
          },
          personnelOnDuty: {
            ingenieurs: [
              { id: 'ing1', name: 'Ahmed Benali', phone: '+212 6 12 34 56 78' }
            ],
            collaborateurs: [
              { id: 'col1', name: 'Fatima Alami', phone: '+212 6 87 65 43 21' }
            ]
          }
        },
        {
          id: '2',
          name: 'Traitement',
          secteurName: 'Production',
          siteName: 'Khouribga',
          hasPanne: false,
          personnelOnDuty: {
            ingenieurs: [
              { id: 'ing2', name: 'Mohamed Tazi', phone: '+212 6 11 22 33 44' }
            ],
            collaborateurs: [
              { id: 'col2', name: 'Rachid Amrani', phone: '+212 6 55 66 77 88' }
            ]
          }
        },
        {
          id: '7',
          name: 'Réacteurs',
          secteurName: 'Chimie',
          siteName: 'Safi',
          hasPanne: true,
          panneDetails: {
            type: 'securite',
            description: 'Détection de fuite dans le circuit principal',
            urgence: 'critique',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          },
          personnelOnDuty: {
            ingenieurs: [
              { id: 'ing3', name: 'Youssef Bennani', phone: '+212 6 99 88 77 66' }
            ],
            collaborateurs: [
              { id: 'col3', name: 'Aicha Idrissi', phone: '+212 6 44 33 22 11' }
            ]
          }
        },
        {
          id: '4',
          name: 'Électricité',
          secteurName: 'Maintenance',
          siteName: 'Khouribga',
          hasPanne: false,
          personnelOnDuty: {
            ingenieurs: [
              { id: 'ing4', name: 'Hassan Lahlou', phone: '+212 6 77 88 99 00' }
            ],
            collaborateurs: [
              { id: 'col4', name: 'Khadija Berrada', phone: '+212 6 33 44 55 66' }
            ]
          }
        },
        {
          id: '9',
          name: 'Engrais',
          secteurName: 'Phosphorique',
          siteName: 'Jorf Lasfar',
          hasPanne: true,
          panneDetails: {
            type: 'maintenance',
            description: 'Maintenance préventive équipement critique',
            urgence: 'moyenne',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
          },
          personnelOnDuty: {
            ingenieurs: [
              { id: 'ing5', name: 'Omar Fassi', phone: '+212 6 22 33 44 55' }
            ],
            collaborateurs: [
              { id: 'col5', name: 'Salma Bennani', phone: '+212 6 66 77 88 99' }
            ]
          }
        }
      ];

      setServices(mockServices);
    } catch (error) {
      console.error('Erreur chargement services:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.secteurName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.siteName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPanneFilter = !showOnlyWithPanne || service.hasPanne;
    
    return matchesSearch && matchesPanneFilter;
  });

  const servicesWithPanne = services.filter(s => s.hasPanne);
  const criticalPannes = servicesWithPanne.filter(s => s.panneDetails?.urgence === 'critique');

  const getUrgenceColor = (urgence: string) => {
    switch (urgence) {
      case 'critique': return 'text-red-600 bg-red-100';
      case 'haute': return 'text-orange-600 bg-orange-100';
      case 'moyenne': return 'text-yellow-600 bg-yellow-100';
      case 'basse': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPanneTypeIcon = (type: string) => {
    switch (type) {
      case 'technique': return '⚙️';
      case 'securite': return '🛡️';
      case 'maintenance': return '🔧';
      case 'autre': return '❓';
      default: return '⚠️';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <Card.Body>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
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
            <h3 className="text-lg font-medium text-gray-900">Services</h3>
            {servicesWithPanne.length > 0 && (
              <Badge variant="error" size="sm">
                {servicesWithPanne.length} panne{servicesWithPanne.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          
          {(selectedServiceId || showOnlyWithPanne) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onServiceSelect(null);
                onPanneFilter(false);
                setSearchTerm('');
              }}
              className="text-red-600 hover:text-red-700"
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              Effacer
            </Button>
          )}
        </div>
      </Card.Header>
      
      <Card.Body className="space-y-4">
        {/* Alertes critiques */}
        {criticalPannes.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center mb-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
              <span className="font-medium text-red-800">
                {criticalPannes.length} panne{criticalPannes.length > 1 ? 's' : ''} critique{criticalPannes.length > 1 ? 's' : ''}
              </span>
            </div>
            {criticalPannes.map(service => (
              <div key={service.id} className="text-sm text-red-700 mb-1">
                • {service.name} ({service.siteName}) - {service.panneDetails?.description}
              </div>
            ))}
          </div>
        )}

        {/* Barre de recherche */}
        <div className="relative">
          <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocp-primary focus:border-transparent"
          />
        </div>

        {/* Filtre pannes */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="panne-filter"
            checked={showOnlyWithPanne}
            onChange={(e) => onPanneFilter(e.target.checked)}
            className="rounded border-gray-300 text-ocp-primary focus:ring-ocp-primary"
          />
          <label htmlFor="panne-filter" className="text-sm text-gray-700">
            Afficher uniquement les services avec pannes
          </label>
        </div>

        {/* Liste des services */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedServiceId === service.id
                  ? 'border-ocp-primary bg-ocp-primary/5'
                  : service.hasPanne
                  ? 'border-red-300 bg-red-50 hover:bg-red-100'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => onServiceSelect(service.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <WrenchScrewdriverIcon className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-900">
                      {service.name}
                    </span>
                    {service.hasPanne && (
                      <Badge 
                        variant="error" 
                        size="sm"
                        className={service.panneDetails ? getUrgenceColor(service.panneDetails.urgence) : ''}
                      >
                        {service.panneDetails ? service.panneDetails.urgence : 'Panne'}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 mt-1">
                    {service.siteName} • {service.secteurName}
                  </div>

                  {service.hasPanne && service.panneDetails && (
                    <div className="mt-2 p-2 bg-white rounded border">
                      <div className="flex items-center text-sm">
                        <span className="mr-1">
                          {getPanneTypeIcon(service.panneDetails.type)}
                        </span>
                        <span className="font-medium">
                          {service.panneDetails.type}:
                        </span>
                        <span className="ml-1">
                          {service.panneDetails.description}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(service.panneDetails.timestamp).toLocaleString('fr-FR')}
                      </div>
                    </div>
                  )}

                  {service.personnelOnDuty && (
                    <div className="mt-2 text-xs text-gray-600">
                      <div className="font-medium mb-1">Personnel de garde:</div>
                      {service.personnelOnDuty.ingenieurs.map(ing => (
                        <div key={ing.id} className="flex items-center justify-between">
                          <span>👨‍🔧 {ing.name}</span>
                          <a href={`tel:${ing.phone}`} className="text-ocp-primary hover:underline">
                            {ing.phone}
                          </a>
                        </div>
                      ))}
                      {service.personnelOnDuty.collaborateurs.map(col => (
                        <div key={col.id} className="flex items-center justify-between">
                          <span>👷 {col.name}</span>
                          <a href={`tel:${col.phone}`} className="text-ocp-primary hover:underline">
                            {col.phone}
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {filteredServices.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'Aucun service trouvé' : 'Aucun service disponible'}
            </div>
          )}
        </div>

        {/* Résumé */}
        <div className="pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Total services:</span>
              <span className="font-medium">{services.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Services avec pannes:</span>
              <span className="font-medium text-red-600">{servicesWithPanne.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Pannes critiques:</span>
              <span className="font-medium text-red-800">{criticalPannes.length}</span>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ServiceFilter;