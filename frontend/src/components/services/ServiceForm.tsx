import React, { useState, useEffect } from 'react';
import type { Service, Secteur, User } from '@/types';
import { apiService } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ServiceFormProps {
  service?: Service | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  secteurId?: string; // For chef secteur to restrict to their secteur
}

export const ServiceForm: React.FC<ServiceFormProps> = ({
  service,
  isOpen,
  onClose,
  onSuccess,
  secteurId
}) => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [secteurs, setSecteurs] = useState<Secteur[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState<any>({
    name: '',
    code: '',
    description: '',
    secteur: '',
    chefService: '',
    minPersonnel: 1
  });

  // Helper function to safely get string value
  const getSafeValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value._id) return value._id;
    return String(value);
  };

  const isEditing = !!service;

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      if (service) {
        setFormData({
          name: service.name || '',
          code: service.code || '',
          description: service.description || '',
          secteur: getSafeValue(service.secteur),
          chefService: getSafeValue(service.chefService),
          minPersonnel: service.minPersonnel || 1
        });

        // Load secteurs if we have a secteur
        const secteurId = getSafeValue(service.secteur);
        if (secteurId) {
          fetchSecteurs(secteurId);
        }
      } else {
        setFormData({
          name: '',
          code: '',
          description: '',
          secteur: secteurId || '',
          chefService: '',
          minPersonnel: 1
        });

        // If we have a secteurId (chef secteur), load secteurs for that secteur
        if (secteurId) {
          fetchSecteurs(secteurId);
        }
      }
    }
  }, [isOpen, service, secteurId]);

  useEffect(() => {
    if (formData.secteur) {
      fetchSecteurs(formData.secteur);
    } else {
      setSecteurs([]);
    }
  }, [formData.secteur]);


  const fetchSecteurs = async (siteId: string) => {
    try {
      const actualSiteId = typeof siteId === 'object' && (siteId as any)._id ? (siteId as any)._id : siteId;
      const response = await apiService.getSecteurs(actualSiteId);
      if (response.success && response.data) {
        // If we have a secteurId (chef secteur), only show that secteur
        if (secteurId) {
          const filtered = response.data.filter((sec) => getSafeValue((sec as any)._id) === secteurId);
          setSecteurs(filtered);
        } else {
          // If the logged-in user is not admin, restrict to their secteur
          if (currentUser && currentUser.role !== 'admin' && currentUser.secteur) {
            const userSecteurObj = typeof currentUser.secteur === 'object' ? currentUser.secteur as any : undefined;
            if (userSecteurObj?._id) {
              const only = response.data.find((sec) => getSafeValue((sec as any)._id) === getSafeValue(userSecteurObj._id));
              setSecteurs(only ? [only] : response.data);
            } else {
              const secteurId = getSafeValue(currentUser.secteur as any);
              const found = response.data.find((sec) => getSafeValue((sec as any)._id) === secteurId);
              setSecteurs(found ? [found] : response.data);
            }
          } else {
            setSecteurs(response.data);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching secteurs:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await apiService.getUsers();
      if (response.success && response.data) {
        // Filter to only chef_service users
        const chefServices = response.data.filter((user: User) => user.role === 'chef_service');
        setUsers(chefServices);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error('Le nom du service est requis');
      return false;
    }
    if (!formData.code.trim()) {
      toast.error('Le code du service est requis');
      return false;
    }
    if (!formData.secteur) {
      toast.error('Le secteur est requis');
      return false;
    }
    if (formData.minPersonnel < 1) {
      toast.error('Le nombre minimum de personnel doit être au moins 1');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim(),
        secteur: formData.secteur,
        chefService: formData.chefService || undefined,
        minPersonnel: formData.minPersonnel
      };

      if (isEditing && service) {
        // For update, we need the site ID from the service's secteur
        const siteId = typeof service.secteur === 'object' && service.secteur.site 
          ? (typeof service.secteur.site === 'object' ? service.secteur.site._id : service.secteur.site)
          : '';
        const secteurId = typeof service.secteur === 'object' ? service.secteur._id : service.secteur;
        
        const response = await apiService.updateService(siteId, secteurId, service._id, payload);
        if (response.success) {
          toast.success('Service mis à jour avec succès');
          onSuccess();
          onClose();
        }
      } else {
        // For create, we need to get the site ID from the selected secteur
        const selectedSecteur = secteurs.find(s => s._id === formData.secteur);
        if (!selectedSecteur) {
          toast.error('Secteur non trouvé');
          return;
        }

        const siteId = typeof selectedSecteur.site === 'object' ? selectedSecteur.site._id : selectedSecteur.site;
        const response = await apiService.createService(siteId, formData.secteur, payload);
        if (response.success) {
          toast.success('Service créé avec succès');
          onSuccess();
          onClose();
        }
      }
    } catch (error: any) {
      console.error('Error saving service:', error);
      const message = error.response?.data?.message || 'Erreur lors de la sauvegarde';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">
            {isEditing ? 'Modifier le service' : 'Nouveau service'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du service *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code *
              </label>
              <Input
                type="text"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Secteur *
            </label>
            <select
              value={formData.secteur}
              onChange={(e) => handleInputChange('secteur', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocp-primary"
              required
              disabled={!!secteurId} // Disable if secteurId is provided (chef secteur)
            >
              <option value="">Sélectionner un secteur</option>
              {secteurs.map((secteur, index) => (
                <option key={secteur._id || index} value={secteur._id}>
                  {secteur.name} ({secteur.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chef de service
            </label>
            <select
              value={formData.chefService}
              onChange={(e) => handleInputChange('chefService', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocp-primary"
            >
              <option value="">Aucun chef assigné</option>
              {users.map((user, index) => (
                <option key={user._id || index} value={user._id}>
                  {user.firstName} {user.lastName} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre minimum de personnel
            </label>
            <Input
              type="number"
              min="1"
              value={formData.minPersonnel}
              onChange={(e) => handleInputChange('minPersonnel', parseInt(e.target.value) || 1)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocp-primary"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Sauvegarde...' : (isEditing ? 'Mettre à jour' : 'Créer')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
