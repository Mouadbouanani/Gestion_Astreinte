// frontend/src/pages/Sites/SitesPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  BuildingOfficeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import apiService from '@/services/api';
import type { Site } from '@/types';

const SitesPage: React.FC = () => {
  const { user } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getSites();
      setSites(response.data || []);
    } catch (error) {
      console.error('Error loading sites:', error);
      setSites([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (site: Site) => {
    setSelectedSite(site);
    setShowEditModal(true);
  };

  const handleDelete = (site: Site) => {
    setSelectedSite(site);
    setShowDeleteModal(true);
  };

  const handleUpdateSite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSite) return;

    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const code = (form.elements.namedItem('code') as HTMLInputElement).value;
    const address = (form.elements.namedItem('address') as HTMLInputElement).value;

    try {
      await apiService.updateSite(selectedSite._id, { name, code, address });
      setShowEditModal(false);
      setSelectedSite(null);
      loadSites();
    } catch (err) {
      alert('Erreur lors de la mise à jour du site');
    }
  };

  const handleDeleteSite = async () => {
    if (!selectedSite) return;

    try {
      setIsDeleting(true);
      console.log('🗑️ Delete site request initiated');
      console.log('Current user:', user);
      console.log('User role:', user?.role);
      console.log('Selected site:', selectedSite);
      
      // Inspect token before making request
      apiService.inspectToken();
      
      await apiService.deleteSite(selectedSite._id);
      console.log('✅ Site deleted successfully');
      
      // Show success message
      alert(`Site "${selectedSite.name}" supprimé avec succès`);
      
      setShowDeleteModal(false);
      setSelectedSite(null);
      
      // Reload sites list
      await loadSites();
      
    } catch (err: any) {
      console.error('❌ Delete error details:', err.response?.data);
      console.error('❌ Full error object:', err);
      
      // Enhanced error handling with specific error codes
      const errorData = err.response?.data;
      let errorMessage = 'Erreur lors de la suppression du site';
      
      if (errorData?.code === 'INVALID_TOKEN') {
        errorMessage = 'Session expirée. Veuillez vous reconnecter.';
        console.log('🔄 Token invalid, redirecting to login...');
        // Redirect to login after a short delay
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (errorData?.code === 'INSUFFICIENT_PERMISSIONS') {
        errorMessage = `Accès refusé: ${errorData.message}`;
      } else if (errorData?.code === 'SITE_NOT_FOUND') {
        errorMessage = 'Site introuvable. Il a peut-être été supprimé.';
        loadSites(); // Refresh the list
      } else if (errorData?.code === 'DEPENDENCIES_EXIST') {
        errorMessage = errorData.message;
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      }
      
      // Show error with more details in development
      if (import.meta.env.DEV) {
        console.error('Full error response:', errorData);
        alert(`Erreur: ${errorMessage}\n\nCode: ${errorData?.code || 'UNKNOWN'}\nDétails: ${JSON.stringify(errorData?.details || {}, null, 2)}`);
      } else {
        alert(`Erreur: ${errorMessage}`);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Accès non autorisé</h2>
          <p className="text-gray-600 mt-2">Cette page est réservée aux administrateurs.</p>
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
      {/* Debug Info - Remove this later */}
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        <strong>Debug Info:</strong> Current user role: {user?.role || 'No role'} | User ID: {user?.id || 'No ID'}
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-ocp-primary to-ocp-accent rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">Gestion des Sites</h1>
        <p className="mt-2 opacity-90">
          Gérer les sites OCP et leurs informations
        </p>
      </div>

      {/* Sites List */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Sites</h3>
            <div className="flex space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={loadSites}
                disabled={isLoading}
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isLoading ? 'Chargement...' : 'Actualiser'}
              </Button>
              <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Nouveau Site
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sites.map((site) => (
              <div
                key={site._id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <BuildingOfficeIcon className="h-5 w-5 text-gray-500" />
                      <h4 className="text-lg font-medium text-gray-900">{site.name}</h4>
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600 flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {site.address}
                      </p>
                      <p className="text-sm text-gray-600">
                        {site.statistics?.totalSecteurs || 0} secteurs · {site.statistics?.totalUsers || 0} employés
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEdit(site)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600"
                      onClick={() => handleDelete(site)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* Add Site Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Ajouter un nouveau site</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const name = (form.elements.namedItem('name') as HTMLInputElement).value;
                const code = (form.elements.namedItem('code') as HTMLInputElement).value;
                const address = (form.elements.namedItem('address') as HTMLInputElement).value;
                try {
                  await apiService.createSite({ name, code, address });
                  setShowAddModal(false);
                  loadSites();
                } catch (err) {
                  alert('Erreur lors de la création du site');
                }
              }}
            >
              <input name="name" placeholder="Nom du site" className="border p-2 w-full mb-2" required />
              <input name="code" placeholder="Code du site" className="border p-2 w-full mb-2" required />
              <input name="address" placeholder="Adresse" className="border p-2 w-full mb-4" required />
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-200 rounded">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-ocp-primary text-white rounded">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Site Modal */}
      {showEditModal && selectedSite && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Modifier le site</h2>
            <form onSubmit={handleUpdateSite}>
              <input 
                name="name" 
                placeholder="Nom du site" 
                defaultValue={selectedSite.name}
                className="border p-2 w-full mb-2" 
                required 
              />
              <input 
                name="code" 
                placeholder="Code du site" 
                defaultValue={selectedSite.code}
                className="border p-2 w-full mb-2" 
                required 
              />
              <input 
                name="address" 
                placeholder="Adresse" 
                defaultValue={selectedSite.address}
                className="border p-2 w-full mb-4" 
                required 
              />
              <div className="flex justify-end space-x-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedSite(null);
                  }} 
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  Annuler
                </button>
                <button type="submit" className="px-4 py-2 bg-ocp-primary text-white rounded">
                  Mettre à jour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedSite && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4 text-red-600">Confirmer la suppression</h2>
            <p className="mb-4">
              Êtes-vous sûr de vouloir supprimer le site <strong>{selectedSite.name}</strong> ?
              Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedSite(null);
                }} 
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Annuler
              </button>
              <button 
                onClick={handleDeleteSite}
                disabled={isDeleting}
                className={`px-4 py-2 text-white rounded ${
                  isDeleting ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SitesPage;

