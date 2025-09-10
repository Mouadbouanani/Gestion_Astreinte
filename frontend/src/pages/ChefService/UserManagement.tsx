import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { User } from '@/types';
import { UserListService, UserForm, UserDetails } from '@/components/users';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { PlusIcon, UsersIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);

  // Check if current user can manage users in their service
  const canManageUsers = user?.role === 'chef_service' && user?.service;
  const serviceId = user?.service && typeof user.service === 'object' ? user.service._id : user?.service;

  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsFormOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleViewUser = (user: User) => {
    console.log('🔍 handleViewUser called with:', user);
    setSelectedUser(user);
    setIsDetailsOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedUser(null);
  };

  const handleDetailsClose = () => {
    setIsDetailsOpen(false);
    setSelectedUser(null);
  };

  const handleFormSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleEditFromDetails = () => {
    setIsDetailsOpen(false);
    setIsFormOpen(true);
  };

  // If user doesn't have permission to view users, show access denied
  if (!canManageUsers) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h2>
          <p className="text-gray-600">
            Cette page est réservée aux chefs de service.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <UsersIcon className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
            <p className="text-gray-600">Gérer les utilisateurs de votre service</p>
          </div>
        </div>
        {canManageUsers && (
          <Button
            onClick={handleCreateUser}
            className="flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Nouvel Utilisateur</span>
          </Button>
        )}
      </div>

      {/* User List - Filtered by service */}
      <UserListService
        key={refreshKey}
        onEditUser={handleEditUser}
        onViewUser={handleViewUser}
        serviceId={serviceId}
      />

      {/* User Form Modal */}
      <UserForm
        user={selectedUser}
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />

      {/* User Details Modal */}
      <UserDetails
        user={selectedUser}
        isOpen={isDetailsOpen}
        onClose={handleDetailsClose}
        onEdit={handleEditFromDetails}
        canEdit={canManageUsers}
      />
    </div>
  );
};

export default UserManagement;




