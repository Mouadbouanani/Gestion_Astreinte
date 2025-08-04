import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User, UserPermissions, LoginCredentials } from '@/types';
import apiService from '@/services/api';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  permissions: UserPermissions | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && apiService.isAuthenticated();

  // Initialisation au chargement
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      if (apiService.isAuthenticated()) {
        const storedUser = apiService.getCurrentUserFromStorage();
        if (storedUser) {
          setUser(storedUser);
          // Vérifier que le token est toujours valide en arrière-plan
          // Ne pas bloquer l'interface si ça échoue
          try {
            await refreshUser();
          } catch (error) {
            console.warn('Token expiré, utilisateur déconnecté silencieusement');
            apiService.logout();
            setUser(null);
          }
        }
      }
    } catch (error) {
      console.error('Erreur initialisation auth:', error);
      // Ne pas faire de logout automatique, laisser l'utilisateur sur le dashboard public
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await apiService.login(credentials);
      
      if (response.success) {
        setUser(response.data.user);
        setPermissions(response.data.permissions);
        
        toast.success(`Bienvenue ${response.data.user.firstName} !`);
        return true;
      } else {
        toast.error(response.message || 'Erreur de connexion');
        return false;
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erreur de connexion';
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Méthode loginDev supprimée - mode développement retiré

  const logout = async (): Promise<void> => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      setUser(null);
      setPermissions(null);
      toast.success('Déconnexion réussie');
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const response = await apiService.getCurrentUser();
      
      if (response.success && response.data) {
        setUser(response.data.user);
        // Les permissions sont incluses dans la réponse du token
      } else {
        throw new Error('Impossible de récupérer les informations utilisateur');
      }
    } catch (error) {
      console.error('Erreur refresh user:', error);
      await logout();
    }
  };

  const value: AuthContextType = {
    user,
    permissions,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
