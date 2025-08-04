// Types pour l'application OCP Astreinte

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  site?: Site;
  secteur?: Secteur;
  service?: Service;
  address?: string;
  phone?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'admin' | 'chef_secteur' | 'chef_service' | 'ingenieur' | 'collaborateur';

export interface Site {
  _id: string;
  name: string;
  code: string;
  address: string;
  timezone: string;
  isActive: boolean;
  configuration: SiteConfiguration;
  statistics: SiteStatistics;
  createdAt: string;
  updatedAt: string;
}

export interface SiteConfiguration {
  escaladeTimeouts: {
    niveau1ToNiveau2: number;
    niveau2ToNiveau3: number;
  };
  notifications: {
    smsEnabled: boolean;
    emailEnabled: boolean;
    pushEnabled: boolean;
  };
  planning: {
    generateInAdvance: number;
    minPersonnelPerService: number;
  };
}

export interface SiteStatistics {
  totalUsers: number;
  totalSecteurs: number;
  totalServices: number;
}

export interface Secteur {
  _id: string;
  name: string;
  code: string;
  description?: string;
  site: string | Site;
  isActive: boolean;
  chefSecteur?: string | User;
  statistics?: {
    servicesCount: number;
    usersCount: number;
    usersByRole: {
      chefSecteur: number;
      ingenieurs: number;
      chefsService: number;
      collaborateurs: number;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  _id: string;
  name: string;
  code: string;
  description?: string;
  secteur: string | Secteur;
  isActive: boolean;
  chefService?: string | User;
  minPersonnel: number;
  statistics?: {
    totalPersonnel: number;
    dernierePlanning?: string;
    derniereGarde?: string;
    tauxParticipation: number;
    tempsReponseEscalade: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
    permissions: UserPermissions;
    expiresIn: string;
  };
}

export interface UserPermissions {
  sites: PermissionSet;
  secteurs: PermissionSet;
  services: PermissionSet;
  users: PermissionSet;
  plannings: PermissionSet;
  scope: 'global' | 'secteur' | 'service' | 'secteur_readonly' | 'service_readonly';
}

export interface PermissionSet {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  code?: string;
  pagination?: PaginationInfo;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface DashboardStats {
  totalSites: number;
  totalSecteurs: number;
  totalServices: number;
  totalUsers: number;
  activeUsers: number;
  usersByRole: Record<UserRole, number>;
  recentActivity?: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'login' | 'create' | 'update' | 'delete';
  user: string;
  target: string;
  description: string;
  timestamp: string;
}

export interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  current: boolean;
  badge?: string | number;
  children?: NavigationItem[];
}

export interface BreadcrumbItem {
  name: string;
  href?: string;
  current: boolean;
}

// Types pour les formulaires
export interface CreateSiteForm {
  name: string;
  code: string;
  address: string;
  timezone?: string;
}

export interface CreateSecteurForm {
  name: string;
  code: string;
  description?: string;
  site: string;
  chefSecteur?: string;
}

export interface CreateServiceForm {
  name: string;
  code: string;
  description?: string;
  secteur: string;
  chefService?: string;
  minPersonnel: number;
}

export interface CreateUserForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  site: string;
  secteur?: string;
  service?: string;
  address?: string;
}

export interface UpdateUserForm {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  site?: string;
  secteur?: string;
  service?: string;
  address?: string;
  phone?: string;
  isActive: boolean;
}

// Types pour les notifications
export interface NotificationConfig {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Types pour les filtres et recherche
export interface FilterOptions {
  search?: string;
  role?: UserRole;
  site?: string;
  secteur?: string;
  service?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
