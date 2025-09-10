import React, { useState, useEffect } from 'react';
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
  Bars3Icon,
  // XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
  variant?: 'desktop' | 'mobile';
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen: controlledIsOpen, 
  onToggle, 
  // variant = 'desktop' 
}) => {
  const { user } = useAuth();
  const location = useLocation();
  const [internalIsOpen, setInternalIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = onToggle || setInternalIsOpen;

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && isOpen) {
        const sidebar = document.getElementById('sidebar');
        const toggleButton = document.getElementById('sidebar-toggle');
        
        if (sidebar && !sidebar.contains(event.target as Node) && 
            toggleButton && !toggleButton.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, isOpen, setIsOpen]);

  // Si pas d'utilisateur, afficher une sidebar simplifiée
  if (!user) {
    return (
      <>
        {/* Mobile Overlay */}
        {isMobile && isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" />
        )}
        
        <div 
          id="sidebar"
          className={clsx(
            'flex flex-col bg-white border-r border-gray-200 h-full transition-all duration-300 ease-in-out z-50',
            isMobile 
              ? clsx(
                  'fixed top-0 left-0 transform',
                  isOpen ? 'translate-x-0' : '-translate-x-full',
                  'w-64'
                )
              : clsx(
                  'relative',
                  isOpen ? 'w-64' : 'w-16'
                )
          )}
        >
          {/* Toggle Button */}
          <div className="absolute -right-3 top-6 z-10">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center justify-center w-6 h-6 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-gray-50 transition-colors"
            >
              {isOpen ? (
                <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 text-gray-600" />
              )}
            </button>
          </div>

          {/* Logo */}
          <div className={clsx(
            'flex items-center h-16 px-4 border-b border-gray-200',
            isOpen ? 'justify-center' : 'justify-center'
          )}>
            {isOpen ? (
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-ocp-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">OCP</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">Astreinte</span>
              </div>
            ) : (
              <div className="h-8 w-8 bg-ocp-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">OCP</span>
              </div>
            )}
          </div>

          {/* Navigation publique */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            <NavLink
              to="/dashboard"
              className={clsx(
                'nav-link',
                location.pathname === '/dashboard' ? 'nav-link-active' : 'nav-link-inactive',
                !isOpen && 'justify-center px-2'
              )}
              title={!isOpen ? 'Dashboard' : ''}
            >
              <HomeIcon className="h-5 w-5 flex-shrink-0" />
              {isOpen && <span className="ml-3">Dashboard</span>}
            </NavLink>

            <NavLink
              to="/login"
              className={clsx(
                'nav-link nav-link-inactive',
                !isOpen && 'justify-center px-2'
              )}
              title={!isOpen ? 'Se connecter' : ''}
            >
              <UserGroupIcon className="h-5 w-5 flex-shrink-0" />
              {isOpen && <span className="ml-3">Se connecter</span>}
            </NavLink>
          </nav>

          {/* Footer */}
          {isOpen && (
            <div className="p-4 border-t border-gray-200">
              <div className="text-xs text-gray-500 text-center">
                Version 1.0.0
              </div>
            </div>
          )}
        </div>
      </>
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
        name: 'Mes Gardes',
        href: '/mes-gardes',
        icon: CalendarDaysIcon,
        roles: ['ingenieur', 'collaborateur'],
      },
      {
        name: 'Demande Indisponibilité',
        href: '/indisponibilite',
        icon: CalendarDaysIcon,
        roles: ['ingenieur', 'collaborateur'],
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
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" />
      )}
      
      <div 
        id="sidebar"
        className={clsx(
          'flex flex-col bg-white border-r border-gray-200 h-full transition-all duration-300 ease-in-out z-50',
          isMobile 
            ? clsx(
                'fixed top-0 left-0 transform',
                isOpen ? 'translate-x-0' : '-translate-x-full',
                'w-64'
              )
            : clsx(
                'relative',
                isOpen ? 'w-64' : 'w-16'
              )
        )}
      >
        {/* Toggle Button - Only show on desktop */}
        {!isMobile && (
          <div className="absolute -right-3 top-6 z-10">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center justify-center w-6 h-6 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-gray-50 transition-colors"
            >
              {isOpen ? (
                <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 text-gray-600" />
              )}
            </button>
          </div>
        )}

        {/* Logo */}
        <div className={clsx(
          'flex items-center h-16 px-4 border-b border-gray-200',
          isOpen ? 'justify-center' : 'justify-center'
        )}>
          {isOpen ? (
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-ocp-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">OCP</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">Astreinte</span>
            </div>
          ) : (
            <div className="h-8 w-8 bg-ocp-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">OCP</span>
            </div>
          )}
        </div>

        {/* Informations utilisateur */}
        {isOpen && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-ocp-primary rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user.firstName?.[0] || ''}{user.lastName?.[0] || ''}
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
                <div>📍 {typeof user.site === 'object' ? user.site.name : user.site}</div>
              )}
              {user.secteur && (
                <div>🏢 {typeof user.secteur === 'object' ? user.secteur.name : user.secteur}</div>
              )}
              {user.service && (
                <div>⚙️ {typeof user.service === 'object' ? user.service.name : user.service}</div>
              )}
            </div>
          </div>
        )}

        {/* Collapsed User Info */}
        {!isOpen && (
          <div className="p-2 border-b border-gray-200 flex justify-center">
            <div className="h-10 w-10 bg-ocp-primary rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {user.firstName?.[0] || ''}{user.lastName?.[0] || ''}
              </span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.href;
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={clsx(
                  'nav-link',
                  isActive ? 'nav-link-active' : 'nav-link-inactive',
                  !isOpen && 'justify-center px-2'
                )}
                title={!isOpen ? item.name : ''}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {isOpen && <span className="ml-3">{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        {isOpen && (
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              Version 1.0.0
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// Mobile Toggle Button Component (to be used in your header/navbar)
export const SidebarToggle: React.FC<{ 
  onClick: () => void;
  className?: string;
}> = ({ onClick, className }) => {
  return (
    <button
      id="sidebar-toggle"
      onClick={onClick}
      className={clsx(
        'lg:hidden flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors',
        className
      )}
    >
      <Bars3Icon className="h-6 w-6" />
    </button>
  );
};

export default Sidebar;