import React, { useState, useEffect } from 'react';
import type { Service, FilterOptions, PaginationInfo, Site, Secteur, User } from '@/types';
import { apiService } from '@/services/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  WrenchScrewdriverIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  Squares2X2Icon,
  TableCellsIcon
} from '@heroicons/react/24/outline';
import { ServiceCard } from './ServiceCard';

interface ServiceListProps {
  onEditService: (service: Service) => void;
  onViewService: (service: Service) => void;
  canManageServices?: boolean;
  secteurId?: string; // For chef secteur to filter by their secteur
}

export const ServiceList: React.FC<ServiceListProps> = ({
  onEditService,
  onViewService,
  canManageServices = false,
  secteurId
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
    hasNext: false,
    hasPrev: false
  });
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    role: undefined,
    site: undefined,
    secteur: undefined,
    service: undefined,
    isActive: undefined
  });

  // Cascading lists
  const [sites, setSites] = useState<Site[]>([]);
  const [secteurs, setSecteurs] = useState<Secteur[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');

  useEffect(() => {
    // Preload sites
    apiService.getSites().then(res => { 
      if (res.success && res.data) setSites(res.data); 
    });
  }, []);

  useEffect(() => {
    // When site filter changes, load secteurs and reset lower filters
    if (filters.site) {
      apiService.getSecteurs(String(filters.site)).then(res => { 
        if (res.success && res.data) setSecteurs(res.data); 
      });
    } else {
      setSecteurs([]);
    }
    setFilters(prev => ({ ...prev, secteur: undefined }));
  }, [filters.site]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      
      let response;
      if (secteurId) {
        // For chef secteur, only get services from their secteur
        response = await apiService.getServicesBySecteur(secteurId);
        if (response.success && response.data) {
          setServices(response.data);
          setPagination({
            page: 1,
            totalPages: 1,
            total: response.data.length,
            limit: response.data.length,
            hasNext: false,
            hasPrev: false
          });
        }
      } else {
        // For admin, get all services with filters
        response = await apiService.getAllServices();

        if (response.success && response.data) {
          setServices(response.data);
          if (response.pagination) {
            setPagination(response.pagination);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Erreur lors du chargement des services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [filters.search, filters.site, filters.secteur, secteurId]);

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!serviceId) {
      toast.error('ID service manquant');
      return;
    }

    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) {
      return;
    }

    try {
      // Find the service to get its secteur and site info
      const service = services.find(s => s._id === serviceId);
      if (!service) {
        toast.error('Service non trouvé');
        return;
      }

      const siteId = typeof service.secteur === 'object' && service.secteur.site 
        ? (typeof service.secteur.site === 'object' ? service.secteur.site._id : service.secteur.site)
        : '';
      const secteurId = typeof service.secteur === 'object' ? service.secteur._id : service.secteur;

      const response = await apiService.deleteService(siteId, secteurId, serviceId);
      if (response.success) {
        toast.success('Service supprimé avec succès');
        fetchServices();
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Erreur lors de la suppression du service');
    }
  };

  const getChefServiceName = (chefService: string | User | undefined): string => {
    if (!chefService) return 'Non assigné';
    if (typeof chefService === 'string') return chefService;
    return `${chefService.firstName || ''} ${chefService.lastName || ''}`.trim() || 'Non assigné';
  };

  const getSecteurName = (secteur: string | Secteur | undefined): string => {
    if (!secteur) return 'N/A';
    if (typeof secteur === 'string') return secteur;
    return secteur.name;
  };

  const getSiteName = (site: string | Site | undefined): string => {
    if (!site) return 'N/A';
    if (typeof site === 'string') return site;
    return site.name;
  };

  // Filter services based on search term
  const filteredServices = services.filter(service => {
    if (!filters.search) return true;
    const searchLower = filters.search.toLowerCase();
    return (
      service.name.toLowerCase().includes(searchLower) ||
      service.code.toLowerCase().includes(searchLower) ||
      (service.description && service.description.toLowerCase().includes(searchLower)) ||
      getChefServiceName(service.chefService).toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      {/* Filters - Only show for admin */}
      {!secteurId && (
        <Card>
          <Card.Body>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rechercher
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Nom, code, description..."
                    value={filters.search || ''}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site
                </label>
                <select
                  value={filters.site || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, site: e.target.value || undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocp-primary"
                >
                  <option value="">Tous les sites</option>
                  {sites.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secteur
                </label>
                <select
                  value={filters.secteur || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, secteur: e.target.value || undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocp-primary"
                  disabled={!filters.site}
                >
                  <option value="">Tous les secteurs</option>
                  {secteurs.map((sec) => (
                    <option key={sec._id} value={sec._id}>{sec.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <select
                  value={filters.isActive === undefined ? 'all' : filters.isActive.toString()}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    isActive: e.target.value === 'all' ? undefined : e.target.value === 'true'
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocp-primary"
                >
                  <option value="all">Tous</option>
                  <option value="true">Actifs</option>
                  <option value="false">Inactifs</option>
                </select>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* View Toggle and Services List */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Services ({filteredServices.length})
            </h3>
            <div className="flex space-x-2">
              <Button
                variant={viewMode === 'cards' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="flex items-center space-x-1"
              >
                <Squares2X2Icon className="h-4 w-4" />
                <span>Cartes</span>
              </Button>
              <Button
                variant={viewMode === 'table' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="flex items-center space-x-1"
              >
                <TableCellsIcon className="h-4 w-4" />
                <span>Tableau</span>
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocp-primary"></div>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-8">
              <WrenchScrewdriverIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucun service trouvé</p>
            </div>
          ) : viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <ServiceCard
                  key={service._id}
                  service={service}
                  onEditService={onEditService}
                  onViewService={onViewService}
                  onDeleteService={handleDeleteService}
                  canManageServices={canManageServices}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Secteur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chef Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredServices.map((service) => (
                    <tr key={service._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                              <WrenchScrewdriverIcon className="h-5 w-5 text-green-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{service.name}</div>
                            <div className="text-sm text-gray-500">{service.code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="space-y-1">
                          <div className="flex items-center text-gray-600">
                            <BuildingOfficeIcon className="h-4 w-4 mr-1 text-gray-400" />
                            <span className="font-medium">Secteur:</span>
                            <span className="ml-1">{getSecteurName(service.secteur)}</span>
                          </div>
                          {typeof service.secteur === 'object' && service.secteur.site && (
                            <div className="flex items-center text-gray-600">
                              <MapPinIcon className="h-4 w-4 mr-1 text-gray-400" />
                              <span className="font-medium">Site:</span>
                              <span className="ml-1">{getSiteName(service.secteur.site)}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getChefServiceName(service.chefService)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {service.description || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewService(service)}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          {canManageServices && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEditService(service)}
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteService(service._id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Pagination - Only for admin */}
      {!secteurId && pagination.totalPages > 1 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-700">
            Affichage de {((pagination.page - 1) * pagination.limit) + 1} à{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} sur{' '}
            {pagination.total} services
          </div>
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => fetchServices()}
            >
              Précédent
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => fetchServices()}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
