// frontend/src/pages/Admin/SecteurPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  BuildingOfficeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MapPinIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
  EyeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import apiService from '@/services/api';
import type { Secteur, Site, User } from '@/types';

interface SecteurPageProps {
  siteId?: string;
}

// Valid secteur names from backend (must match exactly)
const VALID_SECTEURS = [
  'Traitement',
  'Extraction',
  'Maintenance',
  'Logistique',
  'Qualité',
  'Production',
  'Sécurité',
  'Environnement'
];

const SecteurPage: React.FC<SecteurPageProps> = ({ siteId }) => {
  const { user } = useAuth();
  const [secteurs, setSecteurs] = useState<Secteur[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSecteur, setSelectedSecteur] = useState<Secteur | null>(null);
  const [selectedSecteurUsers, setSelectedSecteurUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>('');

  // Get siteId from props or user's site
  const currentSiteId = siteId || user?.site?._id || user?.site;

  // Check user permissions
  const canManageAllSecteurs = user?.role === 'admin';
  const canManageOwnSecteur = user?.role === 'chef_secteur';
  const canViewSecteurs = canManageAllSecteurs || canManageOwnSecteur;

  // Filter secteurs based on search term and selected site
  const filteredSecteurs = secteurs.filter(secteur => {
    // First filter by site if a site is selected
    const siteId = typeof secteur.site === 'string' ? secteur.site : secteur.site._id;
    const matchesSite = !selectedSiteFilter || siteId === selectedSiteFilter;

    // Then filter by search term
    const matchesSearch = !searchTerm || (
      secteur.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      secteur.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (secteur.description && secteur.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (typeof secteur.site === 'object' && secteur.site.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return matchesSite && matchesSearch;
  });

  useEffect(() => {
    if (canViewSecteurs) {
      loadSites();
    }
  }, [canViewSecteurs]);

  useEffect(() => {
    if (canViewSecteurs && (canManageAllSecteurs || currentSiteId)) {
      loadSecteurs();
      if (currentSiteId) {
        loadSiteInfo();
      }
    }
  }, [currentSiteId, canViewSecteurs, canManageAllSecteurs]);

  const loadSites = useCallback(async () => {
    try {
      const response = await apiService.getSites();
      setSites(response.data || []);
      
      // For admin: set selected site based on currentSiteId or first available site
      // For chef_secteur: only show their site
      if (canManageAllSecteurs) {
        if (currentSiteId && typeof currentSiteId === 'string') {
          const currentSite = response.data?.find((site: Site) => site._id === currentSiteId);
          setSelectedSite(currentSite || response.data?.[0] || null);
        } else {
          setSelectedSite(response.data?.[0] || null);
        }
      } else if (canManageOwnSecteur && user?.site?._id) {
        // Chef secteur can only see their own site
        const userSite = response.data?.find((site: Site) => site._id === user.site?._id);
        setSelectedSite(userSite || null);
      }
    } catch (error) {
      console.error('Error loading sites:', error);
    }
  }, []);

  const loadSiteInfo = async () => {
    try {
      if (currentSiteId) {
        const response = await apiService.getSiteById(currentSiteId);
        if (response.data) {
          // Update the site in the list without changing selectedSite
          setSites(prev => prev.map(s => s._id === currentSiteId ? response.data : s));
        }
      }
    } catch (error) {
      console.error('Error loading site info:', error);
    }
  };

  const loadSecteurs = useCallback(async () => {
    try {
      setIsLoading(true);

      if (canManageAllSecteurs) {
        // Admin can see all secteurs (optionally filtered by site)
        const response = await apiService.getAllSecteurs(selectedSite?._id);
        setSecteurs(response.data || []);
      } else if (canManageOwnSecteur && user?.secteur) {
        // Chef secteur: fetch all secteurs and keep only their own
        const allResponse = await apiService.getAllSecteurs();
        const own = (allResponse.data || []).find((s: Secteur) => s._id === user.secteur._id);
        setSecteurs(own ? [own] : []);
      }
    } catch (error) {
      console.error('Error loading secteurs:', error);
      setSecteurs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSiteChange = (siteId: string) => {
    // Only admin can change sites
    if (!canManageAllSecteurs) return;
    
    const site = sites.find(s => s._id === siteId);
    setSelectedSite(site || null);
    if (site) {
      loadSecteurs();
    }
  };

  const handleAdd = () => {
    // Only admin can add secteurs
    if (!canManageAllSecteurs) return;
    setShowAddModal(true);
  };

  const handleEdit = (secteur: Secteur) => {
    // Admin can edit any secteur, chef_secteur can only edit their own
    if (canManageAllSecteurs || (canManageOwnSecteur && user?.secteur?._id === secteur._id)) {
      setSelectedSecteur(secteur);
      setShowEditModal(true);
    }
  };

  const handleDelete = (secteur: Secteur) => {
    // Only admin can delete secteurs
    if (!canManageAllSecteurs) return;
    setSelectedSecteur(secteur);
    setShowDeleteModal(true);
  };

  const handleUpdateSecteur = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const updateData = {
        name: formData.get('name') as string,
        code: formData.get('code') as string,
        description: formData.get('description') as string,
      };

      if (selectedSecteur) {
        // Get the actual site ID from the secteur object
        const siteId = typeof selectedSecteur.site === 'string'
          ? selectedSecteur.site
          : selectedSecteur.site._id;

        console.log('✏️ Updating secteur:', selectedSecteur._id, 'from site:', siteId);

        await apiService.updateSecteur(siteId, selectedSecteur._id, updateData);
        setShowEditModal(false);
        setSelectedSecteur(null);
        loadSecteurs();
      }
    } catch (error) {
      console.error('Error updating secteur:', error);
    }
  };

  const handleDeleteSecteur = async () => {
    if (!selectedSecteur) return;

    try {
      setIsDeleting(true);

      // Get the actual site ID from the secteur object
      const siteId = typeof selectedSecteur.site === 'string'
        ? selectedSecteur.site
        : selectedSecteur.site._id;

      console.log('🗑️ Deleting secteur:', selectedSecteur._id, 'from site:', siteId);

      await apiService.deleteSecteur(siteId, selectedSecteur._id);
      setShowDeleteModal(false);
      setSelectedSecteur(null);
      loadSecteurs();
    } catch (error) {
      console.error('Error deleting secteur:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getAvailableSecteurNames = () => {
    const usedNames = secteurs.map(s => s.name);
    return VALID_SECTEURS.filter(name => !usedNames.includes(name));
  };

  const handleView = (secteur: Secteur) => {
    setSelectedSecteur(secteur);
    setShowDetailsModal(true);
    // Load real employees from DB for this secteur
    void loadUsersForSecteur(secteur._id);
  };

  const loadUsersForSecteur = async (secteurId: string) => {
    try {
      setIsLoadingUsers(true);
      const response = await apiService.getUsers({ secteur: secteurId, limit: 1000 });
      setSelectedSecteurUsers(response.data || []);
    } catch (error) {
      console.error('Error loading users for secteur:', error);
      setSelectedSecteurUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Check permissions - only admin and chef_secteur can view this page
  if (!canViewSecteurs) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Accès non autorisé</h2>
          <p className="text-gray-600 mt-2">Cette page est réservée aux administrateurs et chefs de secteur.</p>
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
        <h1 className="text-2xl font-bold">Gestion des Secteurs</h1>
        <p className="mt-2 opacity-90">
          {canManageAllSecteurs 
            ? `Administration des secteurs - Site: ${selectedSite?.name || 'Sélectionnez un site'}`
            : `Mon Secteur - ${user?.secteur?.name || 'Secteur'}`
          }
        </p>
        {selectedSite && canManageAllSecteurs && (
          <div className="mt-2 flex items-center space-x-4 text-sm opacity-90">
            <span>🏢 {selectedSite.name}</span>
            <span>📍 {selectedSite.address}</span>
            <span>📊 {secteurs.length} secteurs</span>
          </div>
        )}
      </div>

      {/* Site Selector - Only for admin */}
      {/* {canManageAllSecteurs && sites.length > 1 && (
        <Card>
          <Card.Body>
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Site:</label>
              <select
                value={selectedSite?._id || ''}
                onChange={(e) => handleSiteChange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ocp-primary"
              >
                {sites.map((site) => (
                  <option key={site._id} value={site._id}>
                    {site.name} ({site.code})
                  </option>
                ))}
              </select>
            </div>
          </Card.Body>
        </Card>
      )} */}

      {/* Secteurs List */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {canManageAllSecteurs ? 'Secteurs' : 'Mon Secteur'}
            </h3>
            <div className="flex items-center space-x-4">
              {/* Site Filter */}
              {canManageAllSecteurs && (
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

              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher un secteur..."
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
              {filteredSecteurs.length} secteur{filteredSecteurs.length !== 1 ? 's' : ''}
              {(searchTerm || selectedSiteFilter) && ` (filtré${filteredSecteurs.length !== 1 ? 's' : ''} sur ${secteurs.length})`}
              {selectedSiteFilter && (
                <span className="ml-2 text-ocp-primary">
                  • Site: {sites.find(s => s._id === selectedSiteFilter)?.name}
                </span>
              )}
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={loadSecteurs}
                disabled={isLoading}
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isLoading ? 'Chargement...' : 'Actualiser'}
              </Button>
              {canManageAllSecteurs && sites.length > 0 && (
                <Button variant="primary" size="sm" onClick={handleAdd}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Nouveau Secteur
                </Button>
              )}
            </div>
          </div>

          {/* Quick Site Filter Buttons - Only for admins */}
          {canManageAllSecteurs && sites.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedSiteFilter === '' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedSiteFilter('')}
                  className="text-xs"
                >
                  Tous ({secteurs.length})
                </Button>
                {sites.map((site) => {
                  const siteSecteursCount = secteurs.filter(s =>
                    (typeof s.site === 'string' ? s.site : s.site._id) === site._id
                  ).length;
                  return (
                    <Button
                      key={site._id}
                      variant={selectedSiteFilter === site._id ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setSelectedSiteFilter(site._id)}
                      className="text-xs"
                    >
                      {site.code} ({siteSecteursCount})
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </Card.Header>
        <Card.Body>
          {filteredSecteurs.length === 0 ? (
            <div className="text-center py-8">
              <BuildingOfficeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {(searchTerm || selectedSiteFilter)
                  ? 'Aucun secteur trouvé'
                  : canManageAllSecteurs ? 'Aucun secteur trouvé' : 'Aucun secteur assigné'
                }
              </h3>
              <p className="text-gray-600">
                {(searchTerm || selectedSiteFilter)
                  ? `Aucun secteur ne correspond aux critères${searchTerm ? ` "${searchTerm}"` : ''}${selectedSiteFilter ? ` pour le site sélectionné` : ''}`
                  : canManageAllSecteurs
                    ? 'Créez le premier secteur pour ce site.'
                    : 'Contactez votre administrateur pour être assigné à un secteur.'
                }
              </p>
              {(searchTerm || selectedSiteFilter) && (
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
                  {(searchTerm && selectedSiteFilter) && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedSiteFilter('');
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
              {filteredSecteurs.map((secteur) => (
                <div
                  key={secteur._id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-lg font-medium text-gray-900">{secteur.name}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          secteur.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {secteur.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{secteur.description}</p>
                      <p className="text-sm text-gray-500 mt-1">Code: {secteur.code}</p>
                      {secteur.statistics && (
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                          <div className="text-center p-2 bg-blue-50 rounded">
                            <div className="font-semibold text-blue-600">{secteur.statistics.servicesCount}</div>
                            <div className="text-gray-600">Services</div>
                          </div>
                          <div className="text-center p-2 bg-green-50 rounded">
                            <div className="font-semibold text-green-600">{secteur.statistics.usersCount}</div>
                            <div className="text-gray-600">Utilisateurs</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 pt-4 border-t border-gray-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleView(secteur)}
                    >
                      <EyeIcon className="h-4 w-4 mr-2" />
                      Voir
                    </Button>
                    {(canManageAllSecteurs || (canManageOwnSecteur && user?.secteur?._id === secteur._id)) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleEdit(secteur)}
                      >
                        <PencilIcon className="h-4 w-4 mr-2" />
                        Modifier
                      </Button>
                    )}
                    {canManageAllSecteurs && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex-1 text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(secteur)}
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

      {/* Add Secteur Modal - Only for admin */}
      {showAddModal && canManageAllSecteurs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Nouveau Secteur</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (isCreating) return; // Prevent double submission

              const formData = new FormData(e.currentTarget);

              try {
                setIsCreating(true);
                const selectedSiteId = formData.get('site') as string;
                const secteurName = formData.get('name') as string;

                // Validate secteur name against backend enum
                if (!VALID_SECTEURS.includes(secteurName)) {
                  alert(`❌ Nom de secteur invalide!\n\n✅ Valeurs acceptées:\n${VALID_SECTEURS.map(name => `• ${name}`).join('\n')}\n\n💡 Astuce: Utilisez la liste déroulante pour sélectionner automatiquement.`);
                  return;
                }

                const newSecteur = {
                  name: secteurName,
                  code: formData.get('code') as string,
                  description: formData.get('description') as string,
                  site: selectedSiteId
                };

                console.log('🏗️ Creating secteur:', newSecteur);

                await apiService.createSecteur(selectedSiteId, newSecteur);
                setShowAddModal(false);
                loadSecteurs();

                // Show success message
                alert(`Secteur "${newSecteur.name}" créé avec succès pour le site ${sites.find(s => s._id === selectedSiteId)?.name}!`);
              } catch (error: any) {
                console.error('Error creating secteur:', error);

                // Show user-friendly error message
                const errorMessage = error.response?.data?.message || 'Erreur lors de la création du secteur';
                alert(`Erreur: ${errorMessage}`);
              } finally {
                setIsCreating(false);
              }
            }}>
              <div className="space-y-4">
                {/* Site Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Site *
                  </label>
                  <select
                    name="site"
                    required
                    defaultValue={selectedSiteFilter || selectedSite?._id || ''}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ocp-primary"
                  >
                    <option value="">Sélectionner un site</option>
                    {sites.map((site) => (
                      <option key={site._id} value={site._id}>
                        {site.name} ({site.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du secteur *
                  </label>
                  <input
                    name="name"
                    required
                    list="secteur-names"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ocp-primary"
                    placeholder="Ex: Traitement, Extraction, Qualité..."
                  />
                  <datalist id="secteur-names">
                    {VALID_SECTEURS.map((name) => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                  <div className="mt-1 text-xs text-gray-500">
                    Valeurs acceptées: {VALID_SECTEURS.join(', ')}
                  </div>
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
                    placeholder="Ex: TRA"
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
                    placeholder="Description du secteur..."
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

      {/* Edit Secteur Modal */}
      {showEditModal && selectedSecteur && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Modifier le Secteur</h3>
            {/* Show which site this secteur belongs to */}
            <div className="mb-4 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-700">
                <strong>Site:</strong> {typeof selectedSecteur.site === 'string' ? selectedSecteur.site : selectedSecteur.site.name}
                ({typeof selectedSecteur.site === 'string' ? '' : selectedSecteur.site.code})
              </p>
            </div>
            <form onSubmit={handleUpdateSecteur}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du secteur
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={selectedSecteur.name}
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
                    defaultValue={selectedSecteur.code}
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
                    defaultValue={selectedSecteur.description}
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
                    setSelectedSecteur(null);
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
      {showDeleteModal && selectedSecteur && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmer la suppression</h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer le secteur "{selectedSecteur.name}" ? 
              Cette action est irréversible.
            </p>
            
            <div className="flex space-x-3">
                             <Button 
                 variant="error" 
                 className="flex-1"
                 onClick={handleDeleteSecteur}
                 disabled={isDeleting}
               >
                 {isDeleting ? 'Suppression...' : 'Supprimer'}
               </Button>
              <Button 
                variant="ghost" 
                className="flex-1"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedSecteur(null);
                }}
              >
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Secteur Details Modal */}
      {showDetailsModal && selectedSecteur && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium text-gray-900">Détails du Secteur</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedSecteur(null);
                }}
              >
                ✕
              </Button>
            </div>

            <div className="space-y-6">
              {/* Secteur Information */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <WrenchScrewdriverIcon className="h-5 w-5 mr-2 text-gray-500" />
                  Informations du Secteur
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Nom:</span>
                      <p className="text-gray-900 font-medium">{selectedSecteur.name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Code:</span>
                      <p className="text-gray-900 font-mono">{selectedSecteur.code}</p>
                    </div>
                  </div>
                  {selectedSecteur.description && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Description:</span>
                      <p className="text-gray-900">{selectedSecteur.description}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Statut:</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        selectedSecteur.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedSecteur.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Site:</span>
                      <p className="text-gray-900 flex items-center">
                        <BuildingOfficeIcon className="h-4 w-4 mr-1 text-blue-500" />
                        {typeof selectedSecteur.site === 'object'
                          ? `${selectedSecteur.site.name} (${selectedSecteur.site.code})`
                          : selectedSecteur.site
                        }
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Créé le:</span>
                      <p className="text-gray-900">
                        {new Date(selectedSecteur.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Modifié le:</span>
                      <p className="text-gray-900">
                        {new Date(selectedSecteur.updatedAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chef Secteur Information */}
              {selectedSecteur.chefSecteur && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                    <UserGroupIcon className="h-5 w-5 mr-2 text-gray-500" />
                    Chef de Secteur
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {typeof selectedSecteur.chefSecteur === 'object'
                            ? selectedSecteur.chefSecteur.name
                            : selectedSecteur.chefSecteur
                          }
                        </p>
                        {typeof selectedSecteur.chefSecteur === 'object' && selectedSecteur.chefSecteur.email && (
                          <p className="text-sm text-gray-600">{selectedSecteur.chefSecteur.email}</p>
                        )}
                      </div>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                        Chef de Secteur
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Statistics */}
              {selectedSecteur.statistics && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                    <ChartBarIcon className="h-5 w-5 mr-2 text-gray-500" />
                    Statistiques
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {selectedSecteur.statistics.totalServices || 0}
                        </div>
                        <div className="text-sm text-blue-600">Services</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {selectedSecteur.statistics.totalUsers || 0}
                        </div>
                        <div className="text-sm text-green-600">Employés</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {selectedSecteur.statistics.activeServices || 0}
                        </div>
                        <div className="text-sm text-orange-600">Services Actifs</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {selectedSecteur.statistics.tauxParticipation || 0}%
                        </div>
                        <div className="text-sm text-purple-600">Participation</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Employees list (real data from DB) */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <UserGroupIcon className="h-5 w-5 mr-2 text-gray-500" />
                  Employés du secteur
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  {isLoadingUsers ? (
                    <div className="text-sm text-gray-600">Chargement des employés…</div>
                  ) : selectedSecteurUsers.length === 0 ? (
                    <div className="text-sm text-gray-500">Aucun employé trouvé pour ce secteur.</div>
                  ) : (
                    <div className="space-y-2">
                      {selectedSecteurUsers.map((u) => (
                        <div key={u._id} className="flex items-center justify-between bg-white rounded-md border p-3">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-ocp-primary text-white flex items-center justify-center text-sm font-medium">
                              {u.firstName?.[0]}
                              {u.lastName?.[0]}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{u.firstName} {u.lastName}</div>
                              <div className="text-xs text-gray-500">{u.email}</div>
                            </div>
                          </div>
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 capitalize">
                            {u.role.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedSecteur(null);
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

export default SecteurPage; 