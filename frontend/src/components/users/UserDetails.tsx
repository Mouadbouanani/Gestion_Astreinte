import React, { useState, useEffect } from 'react';
import type { User } from '@/types';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  XMarkIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface UserDetailsProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  canEdit?: boolean;
}

export const UserDetails: React.FC<UserDetailsProps> = ({
  user,
  isOpen,
  onClose,
  onEdit,
  canEdit = false
}) => {
  if (!isOpen || !user) {
    return null;
  }

  // Helper function to get user's display name
  const getUserDisplayName = (user: any) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.fullName) {
      return user.fullName;
    }
    if (user.name) {
      return user.name;
    }
    return user.email || 'Utilisateur';
  };

  // Helper function to get user initials
  const getUserInitials = (user: any) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
    }
    if (user.fullName) {
      const parts = user.fullName.split(' ');
      return parts.length >= 2
        ? `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`
        : user.fullName.charAt(0);
    }
    if (user.name) {
      const parts = user.name.split(' ');
      return parts.length >= 2
        ? `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`
        : user.name.charAt(0);
    }
    return user.email ? user.email.charAt(0).toUpperCase() : 'U';
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Détails de l'utilisateur</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* User Header */}
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 h-16 w-16">
              <div className="h-16 w-16 rounded-full bg-ocp-primary flex items-center justify-center">
                <span className="text-white font-medium text-xl">
                  {getUserInitials(user)}
                </span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900">
                {getUserDisplayName(user)}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                  {getRoleLabel(user.role)}
                </span>
                <Badge variant={user.isActive ? 'success' : 'error'}>
                  {user.isActive ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <Card>
            <Card.Header>
              <h4 className="text-lg font-medium flex items-center">
                <UserIcon className="h-5 w-5 mr-2" />
                Informations de contact
              </h4>
            </Card.Header>
            <Card.Body>
              <div className="space-y-3">
                <div className="flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                </div>
                
                {user.phone && (
                  <div className="flex items-center">
                    <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Téléphone</p>
                      <p className="text-gray-900">{user.phone}</p>
                    </div>
                  </div>
                )}

                {user.address && (
                  <div className="flex items-center">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Adresse</p>
                      <p className="text-gray-900">{user.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>

          {/* Organization Information */}
          <Card>
            <Card.Header>
              <h4 className="text-lg font-medium flex items-center">
                <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                Organisation
              </h4>
            </Card.Header>
            <Card.Body>
              <div className="space-y-3">
                {user.site && (
                  <div>
                    <p className="text-sm text-gray-500">Site</p>
                    <p className="text-gray-900 font-medium">{user.site.name}</p>
                    {user.site.code && (
                      <p className="text-sm text-gray-600">Code: {user.site.code}</p>
                    )}
                  </div>
                )}

                {user.secteur && (
                  <div>
                    <p className="text-sm text-gray-500">Secteur</p>
                    <p className="text-gray-900 font-medium">{user.secteur.name}</p>
                    {user.secteur.code && (
                      <p className="text-sm text-gray-600">Code: {user.secteur.code}</p>
                    )}
                  </div>
                )}

                {user.service && (
                  <div>
                    <p className="text-sm text-gray-500">Service</p>
                    <p className="text-gray-900 font-medium">{user.service.name}</p>
                    {user.service.code && (
                      <p className="text-sm text-gray-600">Code: {user.service.code}</p>
                    )}
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>

          {/* Activity Information */}
          <Card>
            <Card.Header>
              <h4 className="text-lg font-medium flex items-center">
                <ClockIcon className="h-5 w-5 mr-2" />
                Activité
              </h4>
            </Card.Header>
            <Card.Body>
              <div className="space-y-3">
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Créé le</p>
                    <p className="text-gray-900">{formatDate(user.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Dernière modification</p>
                    <p className="text-gray-900">{formatDate(user.updatedAt)}</p>
                  </div>
                </div>

                {user.lastLogin && (
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Dernière connexion</p>
                      <p className="text-gray-900">{formatDate(user.lastLogin)}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="secondary"
              onClick={onClose}
            >
              Fermer
            </Button>
            {canEdit && onEdit && (
              <Button
                onClick={onEdit}
              >
                Modifier
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
