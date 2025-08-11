import React, { useState, useEffect } from 'react';
import type { User, FilterOptions, PaginationInfo, Site, Secteur, Service } from '@/types';
import { apiService } from '@/services/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

interface UserListProps {
  onEditUser: (user: User) => void;
  onViewUser: (user: User) => void;
}



export const UserList: React.FC<UserListProps> = ({
  onEditUser,
  onViewUser
}) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
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
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    // preload sites
    apiService.getSites().then(res => { if (res.success && res.data) setSites(res.data); });
  }, []);

  useEffect(() => {
    // when site filter changes, load secteurs and reset lower filters
    if (filters.site) {
      apiService.getSecteurs(String(filters.site)).then(res => { if (res.success && res.data) setSecteurs(res.data); });
    } else {
      setSecteurs([]);
    }
    setFilters(prev => ({ ...prev, secteur: undefined, service: undefined }));
  }, [filters.site]);

  useEffect(() => {
    // when secteur filter changes, load services and reset service
    if (filters.secteur) {
      apiService.getServicesBySecteur(String(filters.secteur)).then(res => { if (res.success && res.data) setServices(res.data); });
    } else {
      setServices([]);
    }
    setFilters(prev => ({ ...prev, service: undefined }));
  }, [filters.secteur]);

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const response = await apiService.getUsers({
        ...filters,
        page: page,
        limit: pagination.limit
      });

      if (response.success && response.data) {
        setUsers(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters.search, filters.role, filters.isActive]);

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleRoleFilter = (role: string) => {
    setFilters(prev => ({ 
      ...prev, 
      role: role === 'all' ? undefined : role as any 
    }));
  };

  const handleDeleteUser = async (userId: string) => {
    if (!userId) {
      toast.error('ID utilisateur manquant');
      return;
    }

    if (!window.confirm('Êtes-vous sûr de vouloir désactiver cet utilisateur ?')) {
      return;
    }

    try {

      const response = await apiService.deleteUser(userId);
      if (response.success) {
        toast.success('Utilisateur désactivé avec succès');
        fetchUsers(pagination.page);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Erreur lors de la désactivation de l\'utilisateur');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      chef_secteur: 'bg-blue-100 text-blue-800',
      chef_service: 'bg-green-100 text-green-800',
      ingenieur: 'bg-yellow-100 text-yellow-800',
      collaborateur: 'bg-gray-100 text-gray-800'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: 'Administrateur',
      chef_secteur: 'Chef Secteur',
      chef_service: 'Chef Service',
      ingenieur: 'Ingénieur',
      collaborateur: 'Collaborateur'
    };
    return labels[role as keyof typeof labels] || role;
  };

  const canManageUsers = currentUser?.role === 'admin';

  return (
    <div className="space-y-6">


      {/* Filters */}
      <Card>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rechercher
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Nom, email..."
                  value={filters.search || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rôle
              </label>
              <select
                value={filters.role || 'all'}
                onChange={(e) => handleRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocp-primary"
              >
                <option value="all">Tous les rôles</option>
                <option value="admin">Administrateur</option>
                <option value="chef_secteur">Chef Secteur</option>
                <option value="chef_service">Chef Service</option>
                <option value="ingenieur">Ingénieur</option>
                <option value="collaborateur">Collaborateur</option>
              </select>
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
                Service
              </label>
              <select
                value={filters.service || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, service: e.target.value || undefined }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocp-primary"
                disabled={!filters.secteur}
              >
                <option value="">Tous les services</option>
                {services.map((srv) => (
                  <option key={srv._id} value={srv._id}>{srv.name}</option>
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

      {/* Users List */}
      <Card>
        <Card.Body>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocp-primary"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucun utilisateur trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rôle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organisation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-ocp-primary flex items-center justify-center">
                              <span className="text-white font-medium">
                                {(() => {
                                  const displayName = user.fullName || user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim();
                                  const nameParts = displayName.split(' ');
                                  if (nameParts.length >= 2) {
                                    return nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0);
                                  }
                                  return displayName.charAt(0) || '?';
                                })()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.fullName || user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Nom non défini'}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <EnvelopeIcon className="h-4 w-4 mr-1" />
                              {user.email || 'Email non défini'}
                            </div>
                            {user.phone && (
                              <div className="text-sm text-gray-500 flex items-center">
                                <PhoneIcon className="h-4 w-4 mr-1" />
                                {user.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="space-y-1 text-sm">
                          {user.site && (
                            <div className="flex items-center text-gray-600">
                              <MapPinIcon className="h-4 w-4 mr-1 text-gray-400" />
                              <span className="font-medium">Site:</span>
                              <span className="ml-1">{typeof user.site === 'object' ? user.site.name : user.site}</span>
                            </div>
                          )}
                          {user.secteur && (user.role === 'chef_secteur' || user.role === 'chef_service' || user.role === 'collaborateur') && (
                            <div className="flex items-center text-gray-600">
                              <span className="text-blue-500 mr-1">🏢</span>
                              <span className="font-medium">Secteur:</span>
                              <span className="ml-1">{typeof user.secteur === 'object' ? user.secteur.name : user.secteur}</span>
                            </div>
                          )}
                          {user.service && (user.role === 'chef_service' || user.role === 'collaborateur') && (
                            <div className="flex items-center text-gray-600">
                              <span className="text-green-500 mr-1">⚙️</span>
                              <span className="font-medium">Service:</span>
                              <span className="ml-1">{typeof user.service === 'object' ? user.service.name : user.service}</span>
                            </div>
                          )}
                          {!user.site && !user.secteur && !user.service && (
                            <span className="text-gray-400 italic">Organisation non définie</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={user.isActive ? 'success' : 'error'}>
                          {user.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewUser(user)}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          {canManageUsers && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEditUser(user)}
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUser(user._id || user.id || '')}
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

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-700">
            Affichage de {((pagination.page - 1) * pagination.limit) + 1} à{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} sur{' '}
            {pagination.total} utilisateurs
          </div>
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => fetchUsers(pagination.page - 1)}
            >
              Précédent
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => fetchUsers(pagination.page + 1)}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
