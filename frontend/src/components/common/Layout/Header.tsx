import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  BellIcon,
  UserCircleIcon,
  PowerIcon,
  Cog6ToothIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';

interface HeaderProps {
  sidebarOpen?: boolean;
  onSidebarToggle?: () => void;
}

const Header: React.FC<HeaderProps> = ({ sidebarOpen, onSidebarToggle }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Si pas d'utilisateur, afficher un header simplifié
  if (!user) {
    return (
      <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
        {/* Mobile sidebar toggle + Titre */}
        <div className="flex items-center space-x-4">
          {onSidebarToggle && (
            <button
              onClick={onSidebarToggle}
              className="lg:hidden flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          )}
          <h1 className="text-xl font-semibold text-gray-900">
            Gestion d'Astreinte OCP
          </h1>
        </div>

        {/* Bouton de connexion */}
        <div className="flex items-center space-x-4">
          <a
            href="/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-ocp-primary hover:bg-ocp-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ocp-primary transition-colors"
          >
            Se connecter
          </a>
        </div>
      </header>
    );
  }

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
      {/* Mobile sidebar toggle + Titre */}
      <div className="flex items-center space-x-4">
        {onSidebarToggle && (
          <button
            onClick={onSidebarToggle}
            className="lg:hidden flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        )}
        
        {/* Titre - masqué sur desktop quand sidebar ouverte, toujours visible sur mobile */}
        <h1 className={`text-xl font-semibold text-gray-900 ${
          sidebarOpen !== undefined 
            ? 'lg:hidden xl:block' 
            : ''
        }`}>
          Gestion d'Astreinte OCP
        </h1>
        
        {/* Titre alternatif pour desktop quand sidebar fermée */}
        {sidebarOpen === false && (
          <h1 className="hidden lg:block xl:hidden text-xl font-semibold text-gray-900">
            OCP Astreinte
          </h1>
        )}
      </div>

      {/* Actions utilisateur */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
          <BellIcon className="h-6 w-6" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Menu utilisateur */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="h-8 w-8 bg-ocp-primary rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {user.firstName?.[0] || ''}{user.lastName?.[0] || ''}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-900">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </button>

          {/* Dropdown menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <div className="px-4 py-2 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              
              <button
                onClick={() => setShowUserMenu(false)}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <UserCircleIcon className="h-4 w-4 mr-3" />
                Mon Profil
              </button>
              
              <button
                onClick={() => setShowUserMenu(false)}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Cog6ToothIcon className="h-4 w-4 mr-3" />
                Paramètres
              </button>
              
              <div className="border-t border-gray-200 my-1"></div>
              
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <PowerIcon className="h-4 w-4 mr-3" />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Overlay pour fermer le menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        ></div>
      )}
    </header>
  );
};

export default Header;