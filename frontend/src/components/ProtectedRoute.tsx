import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types';
import { hasMinimumRole } from '@/utils/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  minimumRole?: UserRole; // Rôle minimum requis (utilise la hiérarchie)
  fallback?: React.ReactNode;
  requireSite?: boolean; // Nécessite qu'un utilisateur soit assigné à un site
  requireSecteur?: boolean; // Nécessite qu'un utilisateur soit assigné à un secteur
  requireService?: boolean; // Nécessite qu'un utilisateur soit assigné à un service
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  minimumRole,
  fallback,
  requireSite = false,
  requireSecteur = false,
  requireService = false
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // Affichage du loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocp-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Redirection vers login si non authentifié
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Vérification des rôles requis et des assignations organisationnelles
  if (user) {
    // Vérification des rôles (liste spécifique)
    if (requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.includes(user.role);
      if (!hasRequiredRole) {
        return renderAccessDenied(
          'Rôle insuffisant',
          'Vous n\'avez pas les permissions nécessaires pour accéder à cette page.',
          `Rôle requis: ${requiredRoles.join(', ')} | Votre rôle: ${user.role}`,
          fallback
        );
      }
    }

    // Vérification du rôle minimum (hiérarchique)
    if (minimumRole && !hasMinimumRole(user.role, minimumRole)) {
      return renderAccessDenied(
        'Niveau d\'autorisation insuffisant',
        'Votre niveau d\'autorisation ne permet pas d\'accéder à cette page.',
        `Niveau minimum requis: ${minimumRole} | Votre niveau: ${user.role}`,
        fallback
      );
    }

    // Vérification des assignations organisationnelles
    // Exception: Les admins ont accès global sans assignation spécifique
    if (user.role !== 'admin') {
      if (requireSite && !user.site) {
        return renderAccessDenied(
          'Site non assigné',
          'Vous devez être assigné à un site pour accéder à cette page.',
          'Contactez votre administrateur pour être assigné à un site.',
          fallback
        );
      }

      if (requireSecteur && !user.secteur) {
        return renderAccessDenied(
          'Secteur non assigné',
          'Vous devez être assigné à un secteur pour accéder à cette page.',
          'Contactez votre chef de secteur pour être assigné à un secteur.',
          fallback
        );
      }

      if (requireService && !user.service) {
        return renderAccessDenied(
          'Service non assigné',
          'Vous devez être assigné à un service pour accéder à cette page.',
          'Contactez votre chef de service pour être assigné à un service.',
          fallback
        );
      }
    }
  }

  // Fonction helper pour afficher les erreurs d'accès
  function renderAccessDenied(title: string, message: string, details: string, fallback?: React.ReactNode) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
          <p className="mt-1 text-sm text-gray-500">{message}</p>
          <p className="mt-1 text-xs text-gray-400">{details}</p>
          <div className="mt-6">
            <button
              onClick={() => window.history.back()}
              className="btn-secondary"
            >
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
