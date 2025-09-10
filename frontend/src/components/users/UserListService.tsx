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

interface UserListServiceProps {
  onEditUser: (user: User) => void;
  onViewUser: (user: User) => void;
  serviceId: string; // Required for chef service
}

export const UserListService: React.FC<UserListServiceProps> = ({
  onEditUser,
  onViewUser,
  serviceId
}) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (serviceId) {
      fetchUsers();
    }
  }, [serviceId]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get all users in the service
      const response = await apiService.getUsersByService(serviceId);
      if (response.success && response.data) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
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
        fetchUsers();
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

  const canManageUsers = currentUser?.role === 'chef_service';

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const fullName = user.fullName || user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return (
      fullName.toLowerCase().includes(searchLower) ||
      (user.email && user.email.toLowerCase().includes(searchLower)) ||
      (user.phone && user.phone.toLowerCase().includes(searchLower)) ||
      getRoleLabel(user.role).toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      {/* Search Filter */}
      <Card>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rechercher
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Nom, email, téléphone..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocp-primary"
                disabled
              >
                <option value="all">Tous les utilisateurs du service</option>
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
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucun utilisateur trouvé dans ce service</p>
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
                  {filteredUsers.map((user) => (
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
                          {user.secteur && (
                            <div className="flex items-center text-gray-600">
                              <span className="text-blue-500 mr-1">🏢</span>
                              <span className="font-medium">Secteur:</span>
                              <span className="ml-1">{typeof user.secteur === 'object' ? user.secteur.name : user.secteur}</span>
                            </div>
                          )}
                          {user.service && (
                            <div className="flex items-center text-gray-600">
                              <span className="text-green-500 mr-1">⚙️</span>
                              <span className="font-medium">Service:</span>
                              <span className="ml-1">{typeof user.service === 'object' ? user.service.name : user.service}</span>
                            </div>
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

      {/* Summary */}
      <div className="text-sm text-gray-700">
        Affichage de {filteredUsers.length} utilisateur(s) dans ce service
      </div>
    </div>
  );
};




