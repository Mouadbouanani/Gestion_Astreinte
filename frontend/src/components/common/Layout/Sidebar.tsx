import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Badge from '@/components/ui/Badge';
import { clsx } from 'clsx';
import {
  HomeIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  CogIcon,
  MapIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Si pas d'utilisateur, afficher une sidebar simplifiée
  if (!user) {
    return (
      <div className="flex flex-col w-64 bg-white border-r border-gray-200 h-full">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-ocp-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">OCP</span>
            </div>
            <span className="text-lg font-semibold text-gray-900">Astreinte</span>
          </div>
        </div>

        {/* Navigation publique */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <NavLink
            to="/dashboard"
            className={clsx(
              'nav-link',
              location.pathname === '/dashboard' ? 'nav-link-active' : 'nav-link-inactive'
            )}
          >
            <HomeIcon className="h-5 w-5 mr-3" />
            Dashboard
          </NavLink>

          <NavLink
            to="/login"
            className="nav-link nav-link-inactive"
          >
            <UserGroupIcon className="h-5 w-5 mr-3" />
            Se connecter
          </NavLink>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            Version 1.0.0
          </div>
        </div>
      </div>
    );
  }

  // Navigation basée sur le rôle
  const getNavigationItems = () => {
    const baseItems = [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: HomeIcon,
        roles: ['admin', 'chef_secteur', 'chef_service', 'ingenieur', 'collaborateur'],
      },
    ];

    const adminItems = [
      {
        name: 'Sites',
        href: '/sites',
        icon: MapIcon,
        roles: ['admin'],
      },
      {
        name: 'Utilisateurs',
        href: '/users',
        icon: UserGroupIcon,
        roles: ['admin'],
      },
    ];

    const secteurItems = [
      {
        name: 'Secteurs',
        href: '/secteurs',
        icon: BuildingOfficeIcon,
        roles: ['admin'],
      },
      {
        name: 'Services',
        href: '/services',
        icon: WrenchScrewdriverIcon,
        roles: ['admin'],
      },
    ];

    const managementItems = [
      {
        name: 'Mon Secteur',
        href: '/mon-secteur',
        icon: BuildingOfficeIcon,
        roles: ['chef_secteur'],
      },
      {
        name: 'Mes Ingénieurs',
        href: '/mes-ingenieurs',
        icon: UserGroupIcon,
        roles: ['chef_secteur'],
      },
      {
        name: 'Mon Service',
        href: '/mon-service',
        icon: WrenchScrewdriverIcon,
        roles: ['chef_service'],
      },
      {
        name: 'Mon Équipe',
        href: '/mon-equipe',
        icon: UserGroupIcon,
        roles: ['chef_service'],
      },
    ];

    const planningItems = [
      {
        name: 'Planning Astreinte',
        href: '/planning',
        icon: CalendarDaysIcon,
        roles: ['admin', 'chef_secteur', 'chef_service', 'ingenieur', 'collaborateur'],
      },
      {
        name: 'Gestion Planning',
        href: '/planning-management',
        icon: CalendarDaysIcon,
        roles: ['admin', 'chef_secteur', 'chef_service'],
      },
      {
        name: 'Mes Gardes',
        href: '/mes-gardes',
        icon: CalendarDaysIcon,
        roles: ['ingenieur', 'collaborateur'],
      },
      {
        name: 'Mes indisponibilités',
        href: '/indisponibilites/my',
        icon: CalendarDaysIcon,
        roles: ['ingenieur', 'collaborateur', 'chef_service', 'chef_secteur', 'admin'],
      },
      {
        name: 'Valider indisponibilités',
        href: '/indisponibilites/review',
        icon: CalendarDaysIcon,
        roles: ['chef_service', 'chef_secteur', 'admin'],
      },
    ];

    const reportItems = [
      {
        name: 'Rapports',
        href: '/rapports',
        icon: ChartBarIcon,
        roles: ['admin', 'chef_secteur', 'chef_service'],
      },
    ];

    const settingsItems = [
      {
        name: 'Paramètres',
        href: '/parametres',
        icon: CogIcon,
        roles: ['admin'],
      },
    ];

    return [
      ...baseItems,
      ...adminItems,
      ...secteurItems,
      ...managementItems,
      ...planningItems,
      ...reportItems,
      ...settingsItems,
    ].filter(item => item.roles.includes(user.role));
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200 h-full">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-ocp-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">OCP</span>
          </div>
          <span className="text-lg font-semibold text-gray-900">Astreinte</span>
        </div>
      </div>

      {/* Informations utilisateur */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-ocp-primary rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {user.firstName[0]}{user.lastName[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.firstName} {user.lastName}
            </p>
            <Badge role={user.role} size="sm" />
          </div>
        </div>
        
        {/* Informations de périmètre */}
        <div className="mt-3 text-xs text-gray-500 space-y-1">
          {user.site && (
            <div>📍 {user.site.name}</div>
          )}
          {user.secteur && (
            <div>🏢 {user.secteur.name}</div>
          )}
          {user.service && (
            <div>⚙️ {user.service.name}</div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.href;
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={clsx(
                'nav-link',
                isActive ? 'nav-link-active' : 'nav-link-inactive'
              )}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          Version 1.0.0
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
