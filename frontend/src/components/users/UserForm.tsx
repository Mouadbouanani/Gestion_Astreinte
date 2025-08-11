import React, { useState, useEffect } from 'react';
import type { User } from '@/types';
import type { CreateUserForm, UpdateUserForm, Site, Secteur, Service } from '@/types';
import { apiService } from '@/services/api';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface UserFormProps {
  user?: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({
  user,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [sites, setSites] = useState<Site[]>([]);
  const [secteurs, setSecteurs] = useState<Secteur[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [formData, setFormData] = useState<any>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'collaborateur',
    site: '',
    secteur: '',
    service: '',
    address: ''
  });

  // Helper function to safely get string value
  const getSafeValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value._id) return value._id;
    return String(value);
  };

  const isEditing = !!user;

  useEffect(() => {
    if (isOpen) {
      fetchSites();
      if (user) {
        // Handle the case where backend returns 'name' instead of firstName/lastName
        const firstName = user.firstName || (user.name ? user.name.split(' ')[0] : '');
        const lastName = user.lastName || (user.name ? user.name.split(' ').slice(1).join(' ') : '');

        // Extract IDs from user object - backend currently returns strings (site names) instead of objects
        // For now, we'll use the string values directly and let the backend handle the conversion
        const siteId = (user.site && typeof user.site === 'object') ? user.site._id : user.site || '';
        const secteurId = (user.secteur && typeof user.secteur === 'object') ? user.secteur._id : user.secteur || '';
        const serviceId = (user.service && typeof user.service === 'object') ? user.service._id : user.service || '';



        setFormData({
          firstName: getSafeValue(firstName),
          lastName: getSafeValue(lastName),
          email: getSafeValue(user.email),
          phone: getSafeValue(user.phone),
          role: getSafeValue(user.role) || 'collaborateur',
          site: getSafeValue(siteId),
          secteur: getSafeValue(secteurId),
          service: getSafeValue(serviceId),
          address: getSafeValue(user.address),
          isActive: user.isActive
        } as UpdateUserForm);

        // Load secteurs if we have a site
        if (siteId) {
          fetchSecteurs(siteId);
        }

        // Load services if we have a secteur
        if (secteurId) {
          fetchServices(secteurId);
        }
      } else {
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          password: '',
          role: 'collaborateur',
          site: '',
          secteur: '',
          service: '',
          address: ''
        });
      }
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (formData.site) {
      fetchSecteurs(formData.site);
    } else {
      setSecteurs([]);
      setServices([]);
    }
  }, [formData.site]);

  useEffect(() => {
    if (formData.secteur) {
      fetchServices(formData.secteur);
    } else {
      setServices([]);
    }
  }, [formData.secteur]);

  const fetchSites = async () => {
    try {
      const response = await apiService.getSites();
      if (response.success && response.data) {
        setSites(response.data);
      }
    } catch (error) {
      console.error('Error fetching sites:', error);
    }
  };

  const fetchSecteurs = async (siteId: string) => {
    try {
      // Make sure we're using the site ID, not name
      const actualSiteId = typeof siteId === 'object' && (siteId as any)._id ? (siteId as any)._id : siteId;


      const response = await apiService.getSecteurs(actualSiteId);
      if (response.success && response.data) {
        setSecteurs(response.data);
      }
    } catch (error) {
      console.error('Error fetching secteurs:', error);
    }
  };

  const fetchServices = async (secteurId: string) => {
    try {
      // Make sure we're using the secteur ID, not name
      const actualSecteurId = typeof secteurId === 'object' && (secteurId as any)._id ? (secteurId as any)._id : secteurId;



      // Use the legacy method that accepts secteurId only
      const response = await apiService.getServicesBySecteur(actualSecteurId);
      if (response.success && response.data) {
        setServices(response.data);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));

    // Reset dependent fields when parent changes
    if (field === 'site') {
      setFormData((prev: any) => ({
        ...prev,
        secteur: '',
        service: ''
      }));
    } else if (field === 'secteur') {
      setFormData((prev: any) => ({
        ...prev,
        service: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      toast.error('Le prénom est requis');
      return false;
    }
    if (!formData.lastName.trim()) {
      toast.error('Le nom est requis');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('L\'email est requis');
      return false;
    }
    if (!formData.phone || !formData.phone.trim()) {
      toast.error('Le téléphone est requis');
      return false;
    }
    if (!isEditing && !formData.password) {
      toast.error('Le mot de passe est requis');
      return false;
    }
    if (!formData.site) {
      toast.error('Le site est requis');
      return false;
    }
    if (formData.role !== 'admin' && !formData.secteur) {
      toast.error('Le secteur est requis pour ce rôle');
      return false;
    }
    if (['chef_service', 'collaborateur'].includes(formData.role) && !formData.service) {
      toast.error('Le service est requis pour ce rôle');
      return false;
    }
    if (['ingenieur', 'collaborateur'].includes(formData.role) && !formData.address?.trim()) {
      toast.error('L\'adresse est requise pour ce rôle');
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
      if (isEditing && user) {
        const updateData = { ...formData } as UpdateUserForm;
        delete (updateData as any).password; // Don't send password in updates

        // Clean up empty string values for MongoDB ObjectId fields
        if (!updateData.site || updateData.site === '') {
          delete (updateData as any).site;
        }
        if (!updateData.secteur || updateData.secteur === '') {
          delete (updateData as any).secteur;
        }
        if (!updateData.service || updateData.service === '') {
          delete (updateData as any).service;
        }

        const userId = user._id || user.id;
        if (!userId) {
          throw new Error('ID utilisateur manquant');
        }
        const response = await apiService.updateUser(userId, updateData);
        if (response.success) {
          toast.success('Utilisateur mis à jour avec succès');
          onSuccess();
          onClose();
        }
      } else {
        const createData = { ...formData } as CreateUserForm;

        // Clean up empty string values for MongoDB ObjectId fields
        if (!createData.site || createData.site === '') {
          delete (createData as any).site;
        }
        if (!createData.secteur || createData.secteur === '') {
          delete (createData as any).secteur;
        }
        if (!createData.service || createData.service === '') {
          delete (createData as any).service;
        }

        const response = await apiService.createUser(createData);
        if (response.success) {
          toast.success('Utilisateur créé avec succès');
          onSuccess();
          onClose();
        }
      }
    } catch (error: any) {
      console.error('Error saving user:', error);
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
            {isEditing ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
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
                Prénom *
              </label>
              <Input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom *
              </label>
              <Input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone *
            </label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+212 6XX XXX XXX"
              required
            />
          </div>

          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe *
              </label>
              <Input
                type="password"
                value={formData.password || ''}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rôle *
              </label>
              <select
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocp-primary"
                required
              >
                <option key="admin" value="admin">Administrateur</option>
                <option key="chef_secteur" value="chef_secteur">Chef Secteur</option>
                <option key="chef_service" value="chef_service">Chef Service</option>
                <option key="ingenieur" value="ingenieur">Ingénieur</option>
                <option key="collaborateur" value="collaborateur">Collaborateur</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site *
              </label>
              <select
                value={formData.site}
                onChange={(e) => handleInputChange('site', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocp-primary"
                required
              >
                <option value="">Sélectionner un site</option>
                {sites.map((site, index) => (
                  <option key={site._id || index} value={site._id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {formData.role !== 'admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Secteur *
              </label>
              <select
                value={formData.secteur}
                onChange={(e) => handleInputChange('secteur', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocp-primary"
                required
                disabled={!formData.site}
              >
                <option value="">Sélectionner un secteur</option>
                {secteurs.map((secteur, index) => (
                  <option key={secteur._id || index} value={secteur._id}>
                    {secteur.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {['chef_service', 'collaborateur'].includes(formData.role) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service *
              </label>
              <select
                value={formData.service}
                onChange={(e) => handleInputChange('service', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocp-primary"
                required
                disabled={!formData.secteur}
              >
                <option value="">Sélectionner un service</option>
                {services.map((service, index) => (
                  <option key={service._id || index} value={service._id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {['ingenieur', 'collaborateur'].includes(formData.role) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse *
              </label>
              <Input
                type="text"
                value={formData.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                required
              />
            </div>
          )}

          {isEditing && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={(formData as UpdateUserForm).isActive || false}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="h-4 w-4 text-ocp-primary focus:ring-ocp-primary border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Utilisateur actif
              </label>
            </div>
          )}

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
