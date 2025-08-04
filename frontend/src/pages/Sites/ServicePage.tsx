// frontend/src/pages/Sites/ServicePage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  WrenchScrewdriverIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import apiService from '@/services/api';
import type { Service, Secteur, Site } from '@/types';

interface ServicePageProps {
  secteurId?: string;
}

// Valid service names from backend
const VALID_SERVICES = [
  'Production U1', 'Production U2', 'Contrôle Qualité',
  'Mines', 'Transport', 'Géologie',
  'Électricité', 'Mécanique', 'Instrumentation',
  'Approvisionnement', 'Expédition',
  'Laboratoire', 'Contrôle Process', 'Certification'
];

const ServicePage: React.FC<ServicePageProps> = ({ secteurId }) => {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [secteurs, setSecteurs] = useState<Secteur[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSecteur, setSelectedSecteur] = useState<Secteur | null>(null);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [site, setSite] = useState<Site | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get secteurId from props or user's secteur
  const currentSecteurId = secteurId || user?.secteur?._id || user?.secteur;

  // Check user permissions
  const canManageAllServices = user?.role === 'admin';
  const canManageSecteurServices = user?.role === 'chef_secteur';
  const canManageOwnService = user?.role === 'chef_service';
  const canViewServices = canManageAllServices || canManageSecteurServices || canManageOwnService;

  useEffect(() => {
    if (canViewServices) {
      loadSites();
      loadSecteurs();
    }
  }, [canViewServices]);

  useEffect(() => {
    if (canViewServices && currentSecteurId) {
      loadSecteurInfo();
    }
  }, [currentSecteurId, canViewServices]);

  // Load services when we have the necessary data
  useEffect(() => {
    if (canViewServices && secteurs.length > 0) {
      loadServices();
    }
  }, [secteurs.length, canViewServices]);

    const loadSites = useCallback(async () => {
    try {
      if (canManageAllServices) {
        const response = await apiService.getSites();
        setSites(response.data || []);
        
        // Set selected site based on currentSecteurId or first available
        if (currentSecteurId && typeof currentSecteurId === 'string') {
          // Find the site that contains the current secteur
          const currentSecteur = secteurs.find(s => s._id === currentSecteurId);
          if (currentSecteur && currentSecteur.site) {
            const siteId = typeof currentSecteur.site === 'string' ? currentSecteur.site : currentSecteur.site._id;
            const currentSite = response.data?.find((site: Site) => site._id === siteId);
            setSelectedSite(currentSite || response.data?.[0] || null);
          } else {
            setSelectedSite(response.data?.[0] || null);
          }
        } else {
          setSelectedSite(response.data?.[0] || null);
        }
      } else if (canManageSecteurServices && user?.site) {
        // For chef_secteur, only show their site
        const sitesResponse = await apiService.getSites();
        const userSiteId = typeof user.site === 'string' ? user.site : user.site._id;
        const userSite = sitesResponse.data?.find((site: Site) => site._id === userSiteId);
        setSelectedSite(userSite || null);
      }
    } catch (error) {
      console.error('Error loading sites:', error);
    }
  }, []);

  const loadSecteurs = useCallback(async () => {
    try {
      if (canManageAllServices) {
        // For admin, load all secteurs from all sites
        const sitesResponse = await apiService.getSites();
        const allSecteurs: Secteur[] = [];
        
        for (const site of sitesResponse.data || []) {
          try {
            const secteursResponse = await apiService.getSecteurs(site._id);
            allSecteurs.push(...(secteursResponse.data || []));
          } catch (error) {
            console.error(`Error loading secteurs for site ${site.name}:`, error);
          }
        }
        
        setSecteurs(allSecteurs);
        
        // Set selected secteur based on currentSecteurId or first available
        if (currentSecteurId && typeof currentSecteurId === 'string') {
          const currentSecteur = allSecteurs.find(s => s._id === currentSecteurId);
          setSelectedSecteur(currentSecteur || allSecteurs[0] || null);
        } else {
          setSelectedSecteur(allSecteurs[0] || null);
        }
      } else if (canManageSecteurServices && user?.secteur) {
        // For chef_secteur, only load their secteur
        const response = await apiService.getSecteurById(user.secteur._id);
        if (response.data) {
          setSecteurs([response.data]);
          setSelectedSecteur(response.data);
        }
      } else if (canManageOwnService && user?.service) {
        // For chef_service, load their secteur to get their service
        if (typeof user.service.secteur === 'string') {
          const response = await apiService.getSecteurById(user.service.secteur);
          if (response.data) {
            setSecteurs([response.data]);
            setSelectedSecteur(response.data);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error loading secteurs:', error);
    }
  }, []);

  const loadSecteurInfo = async () => {
    try {
      if (currentSecteurId) {
        const secteurId = typeof currentSecteurId === 'string' ? currentSecteurId : currentSecteurId._id;
        const response = await apiService.getSecteurById(secteurId);
        if (response.data) {
          // Update the secteur in the list without changing selectedSecteur
          setSecteurs(prev => prev.map(s => s._id === secteurId ? response.data! : s));

          // Get site info
          if (response.data?.site && typeof response.data.site === 'object') {
            const siteResponse = await apiService.getSiteById(response.data.site._id);
            setSite(siteResponse.data || null);
          }
        }
      }
    } catch (error) {
      console.error('Error loading secteur info:', error);
    }
  };

    const loadServices = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Loading services with filters...');
      console.log('🔍 Selected site:', selectedSite?._id);
      console.log('🔍 Selected secteur:', selectedSecteur?._id);
      
      if (canManageAllServices) {
        // Admin can use flexible filtering
        const filters: { siteId?: string; secteurId?: string } = {};
        if (selectedSite) filters.siteId = selectedSite._id;
        if (selectedSecteur) filters.secteurId = selectedSecteur._id;
        
        console.log('🔍 Filters:', filters);
        const response = await apiService.getServicesWithFilters(filters);
        console.log('🔍 Services response:', response);
        setServices(response.data || []);
      } else if (canManageSecteurServices && user?.secteur?._id) {
        // Chef secteur can see all services in their secteur
        const response = await apiService.getServicesWithFilters({ secteurId: user.secteur._id });
        setServices(response.data || []);
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
  }, []);

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
      const updateData = {
        name: formData.get('name') as string,
        code: formData.get('code') as string,
        description: formData.get('description') as string,
        minPersonnel: parseInt(formData.get('minPersonnel') as string) || 1,
      };

      if (selectedService) {
        await apiService.updateService(selectedService._id, updateData);
        setShowEditModal(false);
        setSelectedService(null);
        loadServices();
      }
    } catch (error) {
      console.error('Error updating service:', error);
    }
  };

  const handleDeleteService = async () => {
    if (!selectedService) return;
    
    try {
      setIsDeleting(true);
      await apiService.deleteService(selectedService._id);
      setShowDeleteModal(false);
      setSelectedService(null);
      loadServices();
    } catch (error) {
      console.error('Error deleting service:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getAvailableServiceNames = () => {
    const usedNames = services.map(s => s.name);
    return VALID_SERVICES.filter(name => !usedNames.includes(name));
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
             ? `Administration des services${selectedSite ? ` - Site: ${selectedSite.name}` : ''}${selectedSecteur ? ` - Secteur: ${selectedSecteur.name}` : ''}`
             : canManageSecteurServices
             ? `Services de mon secteur - ${user?.secteur?.name || 'Secteur'}`
             : `Mon Service - ${user?.service?.name || 'Service'}`
           }
         </p>
        {selectedSecteur && site && (
          <div className="mt-2 flex items-center space-x-4 text-sm opacity-90">
            <span>🏢 {site.name}</span>
            <span>🏭 {selectedSecteur.name}</span>
            <span>📊 {services.length} services</span>
          </div>
        )}
      </div>

             {/* Filters - Only for admin */}
       {canManageAllServices && (
         <Card>
           <Card.Body>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* Site Selector */}
               <div className="flex items-center space-x-4">
                 <label className="text-sm font-medium text-gray-700">Site:</label>
                 <select
                   value={selectedSite?._id || ''}
                   onChange={(e) => handleSiteChange(e.target.value)}
                   className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ocp-primary flex-1"
                 >
                   <option value="">Tous les sites</option>
                   {sites.map((site) => (
                     <option key={site._id} value={site._id}>
                       {site.name} ({site.code})
                     </option>
                   ))}
                 </select>
               </div>
               
               {/* Secteur Selector */}
               <div className="flex items-center space-x-4">
                 <label className="text-sm font-medium text-gray-700">Secteur:</label>
                 <select
                   value={selectedSecteur?._id || ''}
                   onChange={(e) => handleSecteurChange(e.target.value)}
                   className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ocp-primary flex-1"
                 >
                   <option value="">Tous les secteurs</option>
                   {secteurs
                     .filter(secteur => !selectedSite || secteur.site === selectedSite._id || (typeof secteur.site === 'object' && secteur.site._id === selectedSite._id))
                     .map((secteur) => (
                       <option key={secteur._id} value={secteur._id}>
                         {secteur.name} ({secteur.code})
                       </option>
                     ))}
                 </select>
               </div>
             </div>
           </Card.Body>
         </Card>
       )}

      {/* Services List */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {canManageAllServices ? 'Services' : canManageSecteurServices ? 'Services du Secteur' : 'Mon Service'}
            </h3>
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
                             {(canManageAllServices || canManageSecteurServices) && (selectedSecteur || (canManageSecteurServices && user?.secteur)) && (
                 <Button variant="primary" size="sm" onClick={handleAdd}>
                   <PlusIcon className="h-4 w-4 mr-2" />
                   Nouveau Service
                 </Button>
               )}
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          {services.length === 0 ? (
            <div className="text-center py-8">
              <WrenchScrewdriverIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {canManageAllServices ? 'Aucun service trouvé' : canManageSecteurServices ? 'Aucun service dans ce secteur' : 'Aucun service assigné'}
              </h3>
              <p className="text-gray-600">
                {canManageAllServices 
                  ? 'Créez le premier service pour ce secteur.'
                  : canManageSecteurServices
                  ? 'Créez le premier service pour votre secteur.'
                  : 'Contactez votre chef de secteur pour être assigné à un service.'
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <div
                  key={service._id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-lg font-medium text-gray-900">{service.name}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {service.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                      <p className="text-sm text-gray-500 mt-1">Code: {service.code}</p>
                      {service.statistics && (
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                          <div className="text-center p-2 bg-blue-50 rounded">
                            <div className="font-semibold text-blue-600">{service.statistics.totalPersonnel}</div>
                            <div className="text-gray-600">Personnel</div>
                          </div>
                          <div className="text-center p-2 bg-green-50 rounded">
                            <div className="font-semibold text-green-600">{service.minPersonnel}</div>
                            <div className="text-gray-600">Min. Requis</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 pt-4 border-t border-gray-100">
                    <Button variant="ghost" size="sm" className="flex-1">
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
       {showAddModal && (canManageAllServices || canManageSecteurServices) && (selectedSecteur || (canManageSecteurServices && user?.secteur)) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Nouveau Service</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              
              try {
                                 const secteurId = selectedSecteur?._id || user?.secteur?._id;
                 if (!secteurId) {
                   throw new Error('Aucun secteur sélectionné');
                 }
                 const newService = {
                   name: formData.get('name') as string,
                   code: formData.get('code') as string,
                   description: formData.get('description') as string,
                   secteur: secteurId,
                   minPersonnel: parseInt(formData.get('minPersonnel') as string) || 1
                 };
                
                await apiService.createService(newService);
                setShowAddModal(false);
                loadServices();
              } catch (error) {
                console.error('Error creating service:', error);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du service *
                  </label>
                  <select
                    name="name"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ocp-primary"
                  >
                    <option value="">Sélectionnez un service</option>
                    {getAvailableServiceNames().map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
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
                    defaultValue="1"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ocp-primary"
                  />
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
                <Button type="submit" variant="primary" className="flex-1">
                  Créer
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="flex-1"
                  onClick={() => setShowAddModal(false)}
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
                    defaultValue={selectedService.minPersonnel || 1}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ocp-primary"
                  />
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
    </div>
  );
};

export default ServicePage; 