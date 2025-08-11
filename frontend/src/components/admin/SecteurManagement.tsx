import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Building } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiService } from '../../services/api';
import { Site, Secteur, User } from '../../types';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

interface SecteurFormData {
  name: string;
  code: string;
  description: string;
  site: string;
  chefSecteur: string;
}

const SecteurManagement: React.FC = () => {
  const [secteurs, setSecteurs] = useState<Secteur[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSecteur, setEditingSecteur] = useState<Secteur | null>(null);
  const [formData, setFormData] = useState<SecteurFormData>({
    name: '',
    code: '',
    description: '',
    site: '',
    chefSecteur: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [secteursRes, sitesRes, usersRes] = await Promise.all([
        apiService.getSecteurs(),
        apiService.getSites(),
        apiService.getUsers()
      ]);

      if (secteursRes.success) setSecteurs(secteursRes.data || []);
      if (sitesRes.success) setSites(sitesRes.data || []);
      if (usersRes.success) setUsers(usersRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.code.trim() || !formData.site) {
      toast.error('Nom, code et site sont requis');
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim(),
        site: formData.site,
        chefSecteur: formData.chefSecteur || null
      };

      let response;
      if (editingSecteur) {
        // For update, we need the site ID from the secteur
        const siteId = editingSecteur.site?._id || editingSecteur.site;
        response = await apiService.updateSecteur(siteId, editingSecteur._id, payload);
      } else {
        // For create, site ID is in the payload
        response = await apiService.createSecteur(payload.site, payload);
      }

      if (response.success) {
        const message = editingSecteur ? 'Secteur mis à jour' :
                        response.data?.wasReactivated ? 'Secteur réactivé avec succès' : 'Secteur créé';
        toast.success(message);
        setShowModal(false);
        resetForm();
        fetchData();
      } else {
        toast.error(response.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error: any) {
      console.error('Error saving secteur:', error);
      const message = error.response?.data?.message || 'Erreur lors de la sauvegarde';
      toast.error(message);
    }
  };

  const handleEdit = (secteur: Secteur) => {
    setEditingSecteur(secteur);
    setFormData({
      name: secteur.name,
      code: secteur.code,
      description: secteur.description || '',
      site: typeof secteur.site === 'object' ? secteur.site._id : secteur.site,
      chefSecteur: typeof secteur.chefSecteur === 'object' ? secteur.chefSecteur._id : secteur.chefSecteur || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (secteur: Secteur) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le secteur "${secteur.name}" ?`)) {
      return;
    }

    try {
      // Get site ID from the secteur
      const siteId = secteur.site?._id || secteur.site;
      const response = await apiService.deleteSecteur(siteId, secteur._id);
      if (response.success) {
        toast.success('Secteur supprimé');
        fetchData();
      } else {
        toast.error(response.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting secteur:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      site: '',
      chefSecteur: ''
    });
    setEditingSecteur(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Building className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Secteurs</h1>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nouveau Secteur</span>
        </Button>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Secteur
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Site
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Chef Secteur
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {secteurs.map((secteur) => (
              <tr key={secteur._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{secteur.name}</div>
                    <div className="text-sm text-gray-500">{secteur.code}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {typeof secteur.site === 'object' ? secteur.site.name : secteur.site}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {secteur.chefSecteur && typeof secteur.chefSecteur === 'object' 
                      ? `${secteur.chefSecteur.firstName} ${secteur.chefSecteur.lastName}`
                      : 'Non assigné'
                    }
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate">
                    {secteur.description || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleEdit(secteur)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(secteur)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingSecteur ? 'Modifier le Secteur' : 'Nouveau Secteur'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du secteur *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code *
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Site *
            </label>
            <select
              value={formData.site}
              onChange={(e) => setFormData({ ...formData, site: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
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
              Chef de secteur
            </label>
            <select
              value={formData.chefSecteur}
              onChange={(e) => setFormData({ ...formData, chefSecteur: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Aucun chef assigné</option>
              {users.filter(user => user.role === 'chef_secteur').map((user) => (
                <option key={user._id} value={user._id}>
                  {user.firstName} {user.lastName} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseModal}
            >
              Annuler
            </Button>
            <Button type="submit">
              {editingSecteur ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SecteurManagement;
