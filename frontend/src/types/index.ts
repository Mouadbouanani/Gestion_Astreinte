// Types pour l'application OCP Astreinte

export interface User {
  id?: string;
  _id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string; // Backend returns this field instead of firstName/lastName
  fullName?: string; // Virtual field from backend
  role: UserRole;
  isActive: boolean;
  site?: Site | string; // Backend returns string name, not object
  secteur?: Secteur | string; // Backend returns string name, not object
  service?: Service | string; // Backend returns string name, not object
  address?: string;
  phone?: string;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
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
  wasReactivated?: boolean; // Added for reactivation feedback
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
  // Remove the contact property since it's not defined in the interface
  // contact?: {
  //   email?: string;
  //   phone?: string;
  //   address?: string;
  // };
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
  collaborateurs?: (string | User)[]; // Array of collaborators
  users?: User[]; // Array of all users in the service (from API response)
  minPersonnel: number;
  wasReactivated?: boolean; // Added for reactivation feedback
  statistics?: {
    totalPersonnel: number;
    usersCount?: number;
    chefsService?: number;
    collaborateurs?: number;
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

// Planning types
export interface Planning {
  _id: string;
  user: string | User;
  date: string;
  shift: 'day' | 'night';
  type: 'astreinte' | 'garde' | 'planning';
  status: 'assigned' | 'available' | 'unavailable';
  secteur?: string | Secteur;
  service?: string | Service;
  createdAt: string;
  updatedAt: string;
}

// Escalade types
export interface Escalade {
  _id: string;
  niveau: EscaladeNiveau;
  panne: string;
  secteur: string | Secteur;
  service: string | Service;
  user: string | User;
  status: 'pending' | 'in_progress' | 'resolved' | 'cancelled';
  startTime: string;
  endTime?: string;
  responseTime?: number;
  resolution?: string;
  niveaux: EscaladeNiveauData[];
  createdAt: string;
  updatedAt: string;
}

export interface EscaladeNiveauData {
  niveau: EscaladeNiveau;
  user: string | User;
  startTime: string;
  endTime?: string;
  responseTime?: number;
  status: 'pending' | 'contacted' | 'responded' | 'escalated';
}

export type EscaladeNiveau = 1 | 2 | 3;

export interface CreateEscaladeForm {
  panne: string;
  secteur: string;
  service: string;
  niveau: EscaladeNiveau;
  description?: string;
}

export interface EscaladeFilters {
  niveau?: EscaladeNiveau;
  status?: string;
  secteur?: string;
  service?: string;
  user?: string;
  startDate?: string;
  endDate?: string;
}

// Panne types
export interface Panne {
  _id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  secteur: string | Secteur;
  service?: string | Service;
  reportedBy: string | User;
  assignedTo?: string | User;
  createdAt: string;
  updatedAt: string;
}

export interface NouvellePanne {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  secteur: string;
  service?: string;
}

// Weekend/Holiday types
export interface WeekendHolidayStats {
  totalWeekends: number;
  totalHolidays: number;
  assignedWeekends: number;
  assignedHolidays: number;
  availableWeekends: number;
  availableHolidays: number;
}

// Extended types for statistics
export interface SecteurWithStats extends Secteur {
  statistics: {
    servicesCount: number;
    usersCount: number;
    totalServices: number;
    totalUsers: number;
    activeServices: number;
    tauxParticipation: number;
    usersByRole: {
      chefSecteur: number;
      ingenieurs: number;
      chefsService: number;
      collaborateurs: number;
    };
  };
}