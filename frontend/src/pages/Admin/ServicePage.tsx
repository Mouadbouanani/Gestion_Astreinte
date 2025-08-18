// frontend/src/pages/Admin/ServicePage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  WrenchScrewdriverIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BuildingOfficeIcon,
  EyeIcon,
  UserGroupIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import apiService from '@/services/api';
import type { Service, Secteur, Site } from '@/types';

// Valid service names from backend (examples)
const VALID_SERVICES = [
  'Production U1', 'Production U2', 'Production U3',
  'Contrôle Qualité', 'Laboratoire', 'Certification',
  'Mines', 'Transport', 'Géologie',
  'Électricité', 'Mécanique', 'Instrumentation',
  'Approvisionnement', 'Expédition', 'Logistique',
  'Maintenance Préventive', 'Maintenance Corrective',
  'Sécurité', 'Environnement', 'HSE'
];

const ServicePage: React.FC = () => {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [secteurs, setSecteurs] = useState<Secteur[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [selectedSecteur, setSelectedSecteur] = useState<Secteur | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>('');
  const [selectedSecteurFilter, setSelectedSecteurFilter] = useState<string>('');

  // Check user permissions
  const canManageAllServices = user?.role === 'admin';
  const canManageSecteurServices = user?.role === 'chef_secteur';
  const canManageOwnService = user?.role === 'chef_service';
  const canViewServices = canManageAllServices || canManageSecteurServices || canManageOwnService;

  useEffect(() => {
    if (canViewServices) {
      loadSites();
      loadSecteurs();
      loadServices();
    }
  }, [canViewServices]);

  // Filter services based on search term and selected filters
  const filteredServices = services.filter(service => {
    // First filter by site if a site is selected
    const serviceSite = typeof service.secteur === 'object' && typeof service.secteur.site === 'object'
      ? service.secteur.site._id
      : typeof service.secteur === 'object' && typeof service.secteur.site === 'string'
      ? service.secteur.site
      : null;
    const matchesSite = !selectedSiteFilter || serviceSite === selectedSiteFilter;

    // Then filter by secteur if a secteur is selected
    const serviceSecteurId = typeof service.secteur === 'string' ? service.secteur : service.secteur._id;
    const matchesSecteur = !selectedSecteurFilter || serviceSecteurId === selectedSecteurFilter;

    // Then filter by search term
    const matchesSearch = !searchTerm || (
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (typeof service.secteur === 'object' && service.secteur.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return matchesSite && matchesSecteur && matchesSearch;
  });

  const loadSites = async () => {
    try {
      const response = await apiService.getSites();
      setSites(response.data || []);
    } catch (error) {
      console.error('Error loading sites:', error);
    }
  };

  const loadSecteurs = async () => {
    try {
      const response = await apiService.getAllSecteurs();
      setSecteurs(response.data || []);
    } catch (error) {
      console.error('Error loading secteurs:', error);
    }
  };

  const loadSecteurInfo = async () => {
    try {
      if (currentSecteurId) {
        const secteurId = typeof currentSecteurId === 'string' ? currentSecteurId : currentSecteurId._id;
        // Fallback: get secteur info from all secteurs and pick the one
        const response = await apiService.getAllSecteurs();
        const secteur = (response.data || []).find((s: Secteur) => s._id === secteurId);
        if (response.data) {
          // Update the secteur in the list without changing selectedSecteur
          setSecteurs(prev => prev.map(s => s._id === secteurId ? (secteur as Secteur) : s));

          // Get site info
          if (secteur?.site && typeof secteur.site === 'object') {
            const siteResponse = await apiService.getSiteById(secteur.site._id);
            setSite(siteResponse.data || null);
          }
        }
      }
    } catch (error) {
      console.error('Error loading secteur info:', error);
    }
  };

  const loadServices = async () => {
    try {
      setIsLoading(true);

      if (canManageAllServices) {
        // Admin can see all services from all sites and secteurs
        const response = await apiService.getAllServices();
        setServices(response.data || []);
      } else if (canManageSecteurServices && user?.secteur) {
        // Chef secteur can see all services in their secteur
        const secteurId = typeof user.secteur === 'string' ? user.secteur : user.secteur._id;
        const allSecteursResp = await apiService.getAllSecteurs();
        const secteur = (allSecteursResp.data || []).find((s: Secteur) => s._id === secteurId);
        if (secteur && secteur.site) {
          const siteId = typeof secteur.site === 'string'
            ? secteur.site
            : secteur.site._id;
          const response = await apiService.getServices(siteId, secteurId);
          setServices(response.data || []);
        }
      } else if (canManageOwnService && user?.service) {
        // Chef service can only see their own service
        const response = await apiService.getServiceById(user.service._id);
        if (response.data) {
          setServices([response.data]);
        }
      }
    } catch (error) {
      console.error('❌ Error loading services:', error);
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSiteChange = (siteId: string) => {
    // Only admin can change sites
    if (!canManageAllServices) return;
    
    const site = sites.find(s => s._id === siteId);
    setSelectedSite(site || null);
    setSelectedSecteur(null); // Reset secteur when site changes
  };

  const handleSecteurChange = (secteurId: string) => {
    // Only admin can change secteurs
    if (!canManageAllServices) return;
    
    const secteur = secteurs.find(s => s._id === secteurId);
    setSelectedSecteur(secteur || null);
  };

  const handleAdd = () => {
    // Only admin and chef_secteur can add services
    if (!canManageAllServices && !canManageSecteurServices) return;
    setShowAddModal(true);
  };

  const handleView = (service: Service) => {
    setSelectedService(service);
    setShowDetailsModal(true);
  };

  const handleEdit = (service: Service) => {
    // Admin can edit any service, chef_secteur can edit services in their secteur, chef_service can only edit their own
    const canEdit = canManageAllServices || 
                   (canManageSecteurServices && user?.secteur?._id === service.secteur) ||
                   (canManageOwnService && user?.service?._id === service._id);
    
    if (canEdit) {
      setSelectedService(service);
      setShowEditModal(true);
    }
  };

  const handleDelete = (service: Service) => {
    // Only admin and chef_secteur can delete services
    if (!canManageAllServices && !canManageSecteurServices) return;
    setSelectedService(service);
    setShowDeleteModal(true);
  };

  const handleUpdateService = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const minPersonnelValue = parseInt(formData.get('minPersonnel') as string) || 1;

      // Validate minPersonnel doesn't exceed 10
      if (minPersonnelValue > 10) {
        alert('Le nombre minimum de personnel ne peut pas dépasser 10 personnes.');
        return;
      }

      const updateData = {
        name: formData.get('name') as string,
        code: formData.get('code') as string,
        description: formData.get('description') as string,
        minPersonnel: minPersonnelValue,
      };

      if (selectedService) {
        // Get the site and secteur IDs from the service object
        const secteurId = typeof selectedService.secteur === 'string'
          ? selectedService.secteur
          : selectedService.secteur._id;

        // Find the secteur to get the site ID
        const secteur = secteurs.find(s => s._id === secteurId);
        if (!secteur) {
          throw new Error('Secteur not found');
        }

        const siteId = typeof secteur.site === 'string'
          ? secteur.site
          : secteur.site._id;

        console.log('✏️ Updating service:', selectedService._id, 'from secteur:', secteurId, 'site:', siteId);

        await apiService.updateService(siteId, secteurId, selectedService._id, updateData);
        setShowEditModal(false);
        setSelectedService(null);
        loadServices();

        // Show success message
        alert(`Service "${updateData.name}" mis à jour avec succès!`);
      }
    } catch (error: any) {
      console.error('Error updating service:', error);

      // Show user-friendly error message
      const errorMessage = error.response?.data?.message || 'Erreur lors de la mise à jour du service';
      alert(`Erreur: ${errorMessage}`);
    }
  };

  const handleDeleteService = async () => {
    if (!selectedService) return;

    try {
      setIsDeleting(true);

      // Get the site and secteur IDs from the service object
      const secteurId = typeof selectedService.secteur === 'string'
        ? selectedService.secteur
        : selectedService.secteur._id;

      // Find the secteur to get the site ID
      const secteur = secteurs.find(s => s._id === secteurId);
      if (!secteur) {
        throw new Error('Secteur not found');
      }

      const siteId = typeof secteur.site === 'string'
        ? secteur.site
        : secteur.site._id;

      console.log('🗑️ Deleting service:', selectedService._id, 'from secteur:', secteurId, 'site:', siteId);

      await apiService.deleteService(siteId, secteurId, selectedService._id);
      setShowDeleteModal(false);
      setSelectedService(null);
      loadServices();

      // Show success message
      alert(`Service "${selectedService.name}" supprimé avec succès!`);
    } catch (error: any) {
      console.error('Error deleting service:', error);

      // Show user-friendly error message
      const errorMessage = error.response?.data?.message || 'Erreur lors de la suppression du service';
      alert(`Erreur: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };



  // Check permissions - only admin, chef_secteur, and chef_service can view this page
  if (!canViewServices) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Accès non autorisé</h2>
          <p className="text-gray-600 mt-2">Cette page est réservée aux administrateurs, chefs de secteur et chefs de service.</p>
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
      {/* Header */}
      <div className="bg-gradient-to-r from-ocp-primary to-ocp-accent rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">Gestion des Services</h1>
        <p className="mt-2 opacity-90">
          {canManageAllServices
            ? 'Administration de tous les services'
            : canManageSecteurServices
            ? `Services de mon secteur - ${user?.secteur?.name || 'Secteur'}`
            : `Mon Service - ${user?.service?.name || 'Service'}`
          }
        </p>
        <div className="mt-2 flex items-center space-x-4 text-sm opacity-90">
          <span>📊 {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''}</span>
          {(searchTerm || selectedSiteFilter || selectedSecteurFilter) && (
            <span>• Filtré{filteredServices.length !== 1 ? 's' : ''} sur {services.length}</span>
          )}
        </div>
      </div>

      {/* Services List */}

      {/* Services List */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {canManageAllServices ? 'Services' : canManageSecteurServices ? 'Services du Secteur' : 'Mon Service'}
            </h3>
            <div className="flex items-center space-x-4">
              {/* Site Filter - Only for admins */}
              {canManageAllServices && (
                <div className="relative">
                  <select
                    value={selectedSiteFilter}
                    onChange={(e) => setSelectedSiteFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocp-primary focus:border-transparent bg-white"
                  >
                    <option value="">Tous les sites</option>
                    {sites.map((site) => (
                      <option key={site._id} value={site._id}>
                        {site.name} ({site.code})
                      </option>
                    ))}
                  </select>
                  <BuildingOfficeIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              )}

              {/* Secteur Filter - Only for admins */}
              {canManageAllServices && (
                <div className="relative">
                  <select
                    value={selectedSecteurFilter}
                    onChange={(e) => setSelectedSecteurFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocp-primary focus:border-transparent bg-white"
                  >
                    <option value="">Tous les secteurs</option>
                    {secteurs
                      .filter(secteur => {
                        if (!selectedSiteFilter) return true;
                        const siteId = typeof secteur.site === 'string' ? secteur.site : secteur.site._id;
                        return siteId === selectedSiteFilter;
                      })
                      .map((secteur) => (
                        <option key={secteur._id} value={secteur._id}>
                          {secteur.name} ({secteur.code})
                        </option>
                      ))}
                  </select>
                  <WrenchScrewdriverIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              )}

              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher un service..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocp-primary focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''}
              {(searchTerm || selectedSiteFilter || selectedSecteurFilter) && ` (filtré${filteredServices.length !== 1 ? 's' : ''} sur ${services.length})`}
              {selectedSiteFilter && (
                <span className="ml-2 text-ocp-primary">
                  • Site: {sites.find(s => s._id === selectedSiteFilter)?.name}
                </span>
              )}
              {selectedSecteurFilter && (
                <span className="ml-2 text-ocp-primary">
                  • Secteur: {secteurs.find(s => s._id === selectedSecteurFilter)?.name}
                </span>
              )}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadServices}
                disabled={isLoading}
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isLoading ? 'Chargement...' : 'Actualiser'}
              </Button>
              {(canManageAllServices || canManageSecteurServices) && secteurs.length > 0 && (
                <Button variant="primary" size="sm" onClick={handleAdd}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Nouveau Service
                </Button>
              )}
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          {filteredServices.length === 0 ? (
            <div className="text-center py-8">
              <WrenchScrewdriverIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {(searchTerm || selectedSiteFilter || selectedSecteurFilter)
                  ? 'Aucun service trouvé'
                  : canManageAllServices ? 'Aucun service trouvé' : canManageSecteurServices ? 'Aucun service dans ce secteur' : 'Aucun service assigné'
                }
              </h3>
              <p className="text-gray-600">
                {(searchTerm || selectedSiteFilter || selectedSecteurFilter)
                  ? `Aucun service ne correspond aux critères${searchTerm ? ` "${searchTerm}"` : ''}${selectedSiteFilter ? ` pour le site sélectionné` : ''}${selectedSecteurFilter ? ` pour le secteur sélectionné` : ''}`
                  : canManageAllServices
                    ? 'Créez le premier service pour un secteur.'
                    : canManageSecteurServices
                    ? 'Créez le premier service pour votre secteur.'
                    : 'Contactez votre chef de secteur pour être assigné à un service.'
                }
              </p>
              {(searchTerm || selectedSiteFilter || selectedSecteurFilter) && (
                <div className="mt-2 space-x-2">
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchTerm('')}
                    >
                      Effacer la recherche
                    </Button>
                  )}
                  {selectedSiteFilter && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedSiteFilter('')}
                    >
                      Tous les sites
                    </Button>
                  )}
                  {selectedSecteurFilter && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedSecteurFilter('')}
                    >
                      Tous les secteurs
                    </Button>
                  )}
                  {(searchTerm && (selectedSiteFilter || selectedSecteurFilter)) && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedSiteFilter('');
                        setSelectedSecteurFilter('');
                      }}
                    >
                      Effacer tous les filtres
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredServices.map((service) => (
                <div
                  key={service._id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  {/* Service Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <WrenchScrewdriverIcon className="h-5 w-5 text-gray-500" />
                        <h4 className="text-lg font-medium text-gray-900">{service.name}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {service.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </div>

                      {/* Service Code */}
                      <p className="text-sm text-gray-500 mb-2">Code: <span className="font-mono">{service.code}</span></p>

                      {/* Description */}
                      {service.description && (
                        <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                      )}

                      {/* Hierarchy Information */}
                      <div className="space-y-2 mb-4">
                        {/* Site Information */}
                        {typeof service.secteur === 'object' && service.secteur.site && (
                          <div className="flex items-center space-x-2 text-sm">
                            <BuildingOfficeIcon className="h-4 w-4 text-blue-500" />
                            <span className="text-gray-600">Site:</span>
                            <span className="font-medium text-blue-600">
                              {typeof service.secteur.site === 'object'
                                ? `${service.secteur.site.name} (${service.secteur.site.code})`
                                : service.secteur.site
                              }
                            </span>
                          </div>
                        )}

                        {/* Secteur Information */}
                        {typeof service.secteur === 'object' && (
                          <div className="flex items-center space-x-2 text-sm">
                            <WrenchScrewdriverIcon className="h-4 w-4 text-green-500" />
                            <span className="text-gray-600">Secteur:</span>
                            <span className="font-medium text-green-600">
                              {service.secteur.name} ({service.secteur.code})
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Personnel Information */}
                      <div className="space-y-2 mb-4">
                        {/* Chef Service */}
                        {service.chefService && (
                          <div className="flex items-center space-x-2 text-sm">
                            <UserGroupIcon className="h-4 w-4 text-purple-500" />
                            <span className="text-gray-600">Chef Service:</span>
                            <span className="font-medium text-purple-600">
                              {typeof service.chefService === 'object'
                                ? service.chefService.name
                                : service.chefService
                              }
                            </span>
                          </div>
                        )}

                        {/* Collaborators List */}
                        {service.users && service.users.length > 0 && (
                          <div className="mb-3">
                            <div className="flex items-center space-x-2 text-sm mb-2">
                              <UserGroupIcon className="h-4 w-4 text-indigo-500" />
                              <span className="text-gray-600 font-medium">Équipe ({service.users.length}):</span>
                            </div>
                            <div className="space-y-1">
                              {service.users.slice(0, 3).map((user, index) => (
                                <div key={index} className="flex items-center space-x-2 text-xs">
                                  <div className={`w-2 h-2 rounded-full ${
                                    user.role === 'chef_service' ? 'bg-purple-500' : 'bg-blue-500'
                                  }`}></div>
                                  <span className="text-gray-700">{user.name}</span>
                                  <span className={`px-1 py-0.5 rounded text-xs ${
                                    user.role === 'chef_service'
                                      ? 'bg-purple-100 text-purple-700'
                                      : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {user.role === 'chef_service' ? 'Chef' : 'Collab.'}
                                  </span>
                                </div>
                              ))}
                              {service.users.length > 3 && (
                                <div className="text-xs text-gray-500 ml-4">
                                  +{service.users.length - 3} autres...
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Personnel Statistics */}
                        {service.statistics && (
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="text-center p-2 bg-blue-50 rounded">
                              <div className="font-semibold text-blue-600">{service.statistics.totalPersonnel || service.users?.length || 0}</div>
                              <div className="text-gray-600">Personnel</div>
                            </div>
                            <div className="text-center p-2 bg-green-50 rounded">
                              <div className="font-semibold text-green-600">{service.minPersonnel}</div>
                              <div className="text-gray-600">Min. Requis</div>
                            </div>
                            <div className="text-center p-2 bg-orange-50 rounded">
                              <div className="font-semibold text-orange-600">
                                {service.statistics.tauxParticipation || 0}%
                              </div>
                              <div className="text-gray-600">Participation</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 pt-4 border-t border-gray-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleView(service)}
                    >
                      <EyeIcon className="h-4 w-4 mr-2" />
                      Voir
                    </Button>
                    {(canManageAllServices || 
                      (canManageSecteurServices && user?.secteur?._id === service.secteur) ||
                      (canManageOwnService && user?.service?._id === service._id)) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleEdit(service)}
                      >
                        <PencilIcon className="h-4 w-4 mr-2" />
                        Modifier
                      </Button>
                    )}
                    {(canManageAllServices || canManageSecteurServices) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex-1 text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(service)}
                      >
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Supprimer
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Add Service Modal - Only for admin and chef_secteur */}
      {showAddModal && (canManageAllServices || canManageSecteurServices) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Nouveau Service</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (isCreating) return; // Prevent double submission

              const formData = new FormData(e.currentTarget);

              try {
                setIsCreating(true);
                const selectedSiteId = formData.get('site') as string;
                const selectedSecteurId = formData.get('secteur') as string;

                const minPersonnelValue = parseInt(formData.get('minPersonnel') as string) || 1;

                // Validate minPersonnel doesn't exceed 10
                if (minPersonnelValue > 10) {
                  alert('Le nombre minimum de personnel ne peut pas dépasser 10 personnes.');
                  return;
                }

                const newService = {
                  name: formData.get('name') as string,
                  code: formData.get('code') as string,
                  description: formData.get('description') as string,
                  minPersonnel: minPersonnelValue,
                  // Note: chefService will be handled by backend - can be assigned later
                  chefService: null // Optional for now, can be assigned after creation
                };

                console.log('🏗️ Creating service:', newService, 'for site:', selectedSiteId, 'secteur:', selectedSecteurId);

                await apiService.createService(selectedSiteId, selectedSecteurId, newService);
                setShowAddModal(false);
                loadServices();

                // Show success message
                const siteName = sites.find(s => s._id === selectedSiteId)?.name;
                const secteurName = secteurs.find(s => s._id === selectedSecteurId)?.name;
                alert(`Service "${newService.name}" créé avec succès pour ${secteurName} (${siteName})!`);
              } catch (error: any) {
                console.error('Error creating service:', error);

                // Show user-friendly error message
                const errorMessage = error.response?.data?.message || 'Erreur lors de la création du service';
                alert(`Erreur: ${errorMessage}`);
              } finally {
                setIsCreating(false);
              }
            }}>
              <div className="space-y-4">
                {/* Site Selection - Only for admin */}
                {canManageAllServices && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Site *
                    </label>
                    <select
                      name="site"
                      required
                      defaultValue={selectedSiteFilter || ''}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ocp-primary"
                      onChange={(e) => {
                        // Update secteur options when site changes
                        const siteId = e.target.value;
                        setSelectedSiteFilter(siteId);
                      }}
                    >
                      <option value="">Sélectionner un site</option>
                      {sites.map((site) => (
                        <option key={site._id} value={site._id}>
                          {site.name} ({site.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Secteur Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Secteur *
                  </label>
                  <select
                    name="secteur"
                    required
                    defaultValue={selectedSecteurFilter || (canManageSecteurServices && user?.secteur ? (typeof user.secteur === 'string' ? user.secteur : user.secteur._id) : '')}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ocp-primary"
                  >
                    <option value="">Sélectionner un secteur</option>
                    {secteurs
                      .filter(secteur => {
                        // For admin: filter by selected site if any
                        if (canManageAllServices && selectedSiteFilter) {
                          const siteId = typeof secteur.site === 'string' ? secteur.site : secteur.site._id;
                          return siteId === selectedSiteFilter;
                        }
                        // For chef_secteur: only show their secteur
                        if (canManageSecteurServices && user?.secteur) {
                          const userSecteurId = typeof user.secteur === 'string' ? user.secteur : user.secteur._id;
                          return secteur._id === userSecteurId;
                        }
                        return true;
                      })
                      .map((secteur) => (
                        <option key={secteur._id} value={secteur._id}>
                          {secteur.name} ({secteur.code})
                          {typeof secteur.site === 'object' && ` - ${secteur.site.name}`}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du service *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ocp-primary"
                    placeholder="Ex: Production U1, Contrôle Qualité..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code *
                  </label>
                  <input
                    type="text"
                    name="code"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ocp-primary"
                    placeholder="Ex: PROD_U1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Personnel minimum *
                  </label>
                  <input
                    type="number"
                    name="minPersonnel"
                    min="1"
                    max="10"
                    defaultValue="1"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ocp-primary"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum 10 personnes par service</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ocp-primary"
                    placeholder="Description du service..."
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  disabled={isCreating}
                >
                  {isCreating ? 'Création...' : 'Créer'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setShowAddModal(false)}
                  disabled={isCreating}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {showEditModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Modifier le Service</h3>
            <form onSubmit={handleUpdateService}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du service
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={selectedService.name}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ocp-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code
                  </label>
                  <input
                    type="text"
                    name="code"
                    defaultValue={selectedService.code}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ocp-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Personnel minimum
                  </label>
                  <input
                    type="number"
                    name="minPersonnel"
                    min="1"
                    max="10"
                    defaultValue={selectedService.minPersonnel || 1}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ocp-primary"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum 10 personnes par service</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    defaultValue={selectedService.description}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ocp-primary"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <Button type="submit" variant="primary" className="flex-1">
                  Mettre à jour
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="flex-1"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedService(null);
                  }}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmer la suppression</h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer le service "{selectedService.name}" ? 
              Cette action est irréversible.
            </p>
            
            <div className="flex space-x-3">
              <Button 
                variant="error" 
                className="flex-1"
                onClick={handleDeleteService}
                disabled={isDeleting}
              >
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </Button>
              <Button 
                variant="ghost" 
                className="flex-1"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedService(null);
                }}
              >
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Service Details Modal */}
      {showDetailsModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium text-gray-900">Détails du Service</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedService(null);
                }}
              >
                ✕
              </Button>
            </div>

            <div className="space-y-6">
              {/* Service Information */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <WrenchScrewdriverIcon className="h-5 w-5 mr-2 text-gray-500" />
                  Informations du Service
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Nom:</span>
                      <p className="text-gray-900">{selectedService.name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Code:</span>
                      <p className="text-gray-900 font-mono">{selectedService.code}</p>
                    </div>
                  </div>
                  {selectedService.description && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Description:</span>
                      <p className="text-gray-900">{selectedService.description}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Personnel minimum:</span>
                      <p className="text-gray-900">{selectedService.minPersonnel}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Statut:</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        selectedService.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedService.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hierarchy Information */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <BuildingOfficeIcon className="h-5 w-5 mr-2 text-gray-500" />
                  Hiérarchie Organisationnelle
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {/* Site */}
                  {typeof selectedService.secteur === 'object' && selectedService.secteur.site && (
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <BuildingOfficeIcon className="h-6 w-6 text-blue-500" />
                      <div>
                        <p className="font-medium text-blue-900">
                          {typeof selectedService.secteur.site === 'object'
                            ? selectedService.secteur.site.name
                            : selectedService.secteur.site}
                        </p>
                        <p className="text-sm text-blue-600">
                          Code: {typeof selectedService.secteur.site === 'object'
                            ? selectedService.secteur.site.code
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Secteur */}
                  {typeof selectedService.secteur === 'object' && (
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <WrenchScrewdriverIcon className="h-6 w-6 text-green-500" />
                      <div>
                        <p className="font-medium text-green-900">{selectedService.secteur.name}</p>
                        <p className="text-sm text-green-600">Code: {selectedService.secteur.code}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Team Information */}
              {selectedService.users && selectedService.users.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                    <UserGroupIcon className="h-5 w-5 mr-2 text-gray-500" />
                    Équipe ({selectedService.users.length} membres)
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-3">
                      {selectedService.users.map((user, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${
                              user.role === 'chef_service' ? 'bg-purple-500' : 'bg-blue-500'
                            }`}></div>
                            <div>
                              <p className="font-medium text-gray-900">{user.name}</p>
                              <p className="text-sm text-gray-600">{user.email}</p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            user.role === 'chef_service'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {user.role === 'chef_service' ? 'Chef de Service' : 'Collaborateur'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Statistics */}
              {selectedService.statistics && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                    <ChartBarIcon className="h-5 w-5 mr-2 text-gray-500" />
                    Statistiques
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {selectedService.statistics.totalPersonnel || selectedService.users?.length || 0}
                        </div>
                        <div className="text-sm text-blue-600">Personnel Total</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{selectedService.minPersonnel}</div>
                        <div className="text-sm text-green-600">Minimum Requis</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {selectedService.statistics.tauxParticipation || 0}%
                        </div>
                        <div className="text-sm text-orange-600">Taux Participation</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {selectedService.statistics.tempsReponseEscalade || 0}
                        </div>
                        <div className="text-sm text-purple-600">Temps Réponse (min)</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedService(null);
                }}
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicePage; 