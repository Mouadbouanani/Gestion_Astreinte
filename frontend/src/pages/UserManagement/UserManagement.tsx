import React, { useState } from 'react';
import type { User } from '@/types';
import { UserList, UserForm, UserDetails } from '@/components/users';
import { useAuth } from '@/context/AuthContext';

export const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Check if current user can manage users
  const canManageUsers = currentUser?.role === 'admin';
  const canCreateUsers = currentUser?.role === 'admin';

  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsFormOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleViewUser = (user: User) => {
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
            Vous n'avez pas les permissions nécessaires pour accéder à la gestion des utilisateurs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <UserList
        key={refreshKey}
        onCreateUser={handleCreateUser}
        onEditUser={handleEditUser}
        onViewUser={handleViewUser}
      />

      <UserForm
        user={selectedUser}
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />

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
