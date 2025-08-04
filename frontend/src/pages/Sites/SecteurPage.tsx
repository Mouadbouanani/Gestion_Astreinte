// frontend/src/pages/Sites/SecteurPage.tsx
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
  EyeIcon
} from '@heroicons/react/24/outline';
import apiService from '@/services/api';
import type { Secteur, Site } from '@/types';

interface SecteurPageProps {
  siteId?: string;
}

// Valid secteur names from backend
const VALID_SECTEURS = [
  'Traitement',
  'Extraction', 
  'Maintenance',
  'Logistique',
  'Qualité'
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
  const [selectedSecteur, setSelectedSecteur] = useState<Secteur | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get siteId from props or user's site
  const currentSiteId = siteId || user?.site?._id || user?.site;

  // Check user permissions
  const canManageAllSecteurs = user?.role === 'admin';
  const canManageOwnSecteur = user?.role === 'chef_secteur';
  const canViewSecteurs = canManageAllSecteurs || canManageOwnSecteur;

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
        // Chef secteur can only see their own secteur
        const response = await apiService.getSecteurById(user.secteur._id);
        if (response.data) {
          setSecteurs([response.data]);
        }
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
        await apiService.updateSecteur(selectedSecteur._id, updateData);
        setShowEditModal(false);
        setSelectedSecteur(null);
        loadSecteurs();
      }
    } catch (error) {
      console.error('Error updating secteur:', error);
    }
  };

  const handleDeleteSecteur = async () => {
    if (!selectedSecteur || !selectedSite) return;
    
    try {
      setIsDeleting(true);
      await apiService.deleteSecteur(selectedSite._id, selectedSecteur._id);
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
      {canManageAllSecteurs && sites.length > 1 && (
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
      )}

      {/* Secteurs List */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {canManageAllSecteurs ? 'Secteurs' : 'Mon Secteur'}
            </h3>
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
              {canManageAllSecteurs && selectedSite && (
                <Button variant="primary" size="sm" onClick={handleAdd}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Nouveau Secteur
                </Button>
              )}
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          {secteurs.length === 0 ? (
            <div className="text-center py-8">
              <BuildingOfficeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {canManageAllSecteurs ? 'Aucun secteur trouvé' : 'Aucun secteur assigné'}
              </h3>
              <p className="text-gray-600">
                {canManageAllSecteurs 
                  ? 'Créez le premier secteur pour ce site.'
                  : 'Contactez votre administrateur pour être assigné à un secteur.'
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {secteurs.map((secteur) => (
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
                    <Button variant="ghost" size="sm" className="flex-1">
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
      {showAddModal && canManageAllSecteurs && selectedSite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Nouveau Secteur</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              
              try {
                const newSecteur = {
                  name: formData.get('name') as string,
                  code: formData.get('code') as string,
                  description: formData.get('description') as string,
                  site: selectedSite._id
                };
                
                await apiService.createSecteur(newSecteur);
                setShowAddModal(false);
                loadSecteurs();
              } catch (error) {
                console.error('Error creating secteur:', error);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du secteur *
                  </label>
                  <select
                    name="name"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ocp-primary"
                  >
                    <option value="">Sélectionnez un secteur</option>
                    {getAvailableSecteurNames().map((name) => (
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

      {/* Edit Secteur Modal */}
      {showEditModal && selectedSecteur && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Modifier le Secteur</h3>
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
    </div>
  );
};

export default SecteurPage; 