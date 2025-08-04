import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type {
  ApiResponse,
  AuthResponse,
  LoginCredentials,
  User,
  Site,
  Secteur,
  Service,
  DashboardStats,
  FilterOptions,
  CreateSiteForm,
  CreateSecteurForm,
  CreateServiceForm,
  CreateUserForm,
  UpdateUserForm
} from '@/types';
import {id} from "zod/v4/locales";

// Configuration de base d'Axios
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Intercepteur pour ajouter le token automatiquement
    this.api.interceptors.request.use(
      async (config) => {
        // Check if token needs refresh before making request
        await this.checkAndRefreshTokenIfNeeded();
        
        const token = this.getToken();
        console.log('🔍 Request interceptor - Token:', token ? `${token.substring(0, 20)}...` : 'No token');
        console.log('🔍 Request URL:', config.url);
        console.log('🔍 Request method:', config.method);
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('🔍 Authorization header set:', `Bearer ${token.substring(0, 20)}...`);
        } else {
          console.warn('⚠️ No token found in localStorage');
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Intercepteur pour gérer les réponses et erreurs
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const originalRequest = error.config;
        
        console.log('🚨 Response interceptor - Error status:', error.response?.status);
        console.log('🚨 Response interceptor - Error data:', error.response?.data);
        console.log('🚨 Response interceptor - Error config:', {
          url: originalRequest?.url,
          method: originalRequest?.method,
          headers: originalRequest?.headers
        });
        
        // Handle 401 errors (unauthorized)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          // Check if it's a token-related error
          const errorData = error.response?.data;
          if (errorData?.code === 'INVALID_TOKEN' || errorData?.code === 'TOKEN_EXPIRED') {
            console.log('🔄 Token expired, attempting refresh...');
            
            try {
              // Try to refresh the token
              await this.refreshToken();
              
              // Retry the original request with new token
              const newToken = this.getToken();
              if (newToken) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                console.log('🔄 Retrying request with new token');
                return this.api(originalRequest);
              }
            } catch (refreshError) {
              console.error('❌ Token refresh failed:', refreshError);
              // If refresh fails, clear auth and redirect to login
              this.clearAuth();
              window.location.href = '/login';
              return Promise.reject(refreshError);
            }
          } else {
            // Other 401 errors (not token-related)
            console.log('❌ Other 401 error, clearing auth');
            this.clearAuth();
            window.location.href = '/login';
          }
        }
        
        // Handle 403 errors (forbidden) - might be token-related too
        if (error.response?.status === 403) {
          const errorData = error.response?.data;
          console.log('🚫 403 Forbidden error:', errorData);
          
          if (errorData?.code === 'INVALID_TOKEN') {
            console.log('🔄 403 with INVALID_TOKEN, attempting refresh...');
            try {
              await this.refreshToken();
              const newToken = this.getToken();
              if (newToken && !originalRequest._retry) {
                originalRequest._retry = true;
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                console.log('🔄 Retrying 403 request with new token');
                return this.api(originalRequest);
              }
            } catch (refreshError) {
              console.error('❌ Token refresh failed for 403:', refreshError);
              this.clearAuth();
              window.location.href = '/login';
              return Promise.reject(refreshError);
            }
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Gestion du token
  private getToken(): string | null {
    return localStorage.getItem('ocp_token');
  }

  private setToken(token: string): void {
    localStorage.setItem('ocp_token', token);
  }

  private clearAuth(): void {
    localStorage.removeItem('ocp_token');
    localStorage.removeItem('ocp_user');
  }

  // Méthodes d'authentification
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/login', credentials);

    if (response.data.success) {
      this.setToken(response.data.data.token);
      localStorage.setItem('ocp_user', JSON.stringify(response.data.data.user));
    }

    return response.data;
  }

  // Méthode loginDev supprimée - mode développement retiré

  async logout(): Promise<void> {
    // Pas d'endpoint logout côté serveur, on nettoie juste le côté client
    this.clearAuth();
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    const response = await this.api.get<ApiResponse<{ user: User }>>('/auth/me');
    return response.data;
  }

  async refreshToken(): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth-jwt/refresh');
    
    if (response.data.success) {
      this.setToken(response.data.data.token);
      localStorage.setItem('ocp_user', JSON.stringify(response.data.data.user));
    }
    
    return response.data;
  }

  // Check if token needs refresh (proactive refresh)
  private async checkAndRefreshTokenIfNeeded(): Promise<void> {
    const token = this.getToken();
    if (!token) return;

    try {
      // Decode token to check expiration (without verification)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiry = expirationTime - currentTime;
      
      console.log('🔍 Token inspection:', {
        exp: new Date(expirationTime).toISOString(),
        currentTime: new Date(currentTime).toISOString(),
        timeUntilExpiry: Math.floor(timeUntilExpiry / 1000 / 60) + ' minutes',
        payload: {
          id: payload.id,
          email: payload.email,
          role: payload.role,
          iat: new Date(payload.iat * 1000).toISOString(),
          exp: new Date(payload.exp * 1000).toISOString()
        }
      });
      
      // If token expires in less than 5 minutes, refresh it
      if (timeUntilExpiry < 5 * 60 * 1000) {
        console.log('🔄 Token expires soon, refreshing proactively...');
        await this.refreshToken();
      }
    } catch (error) {
      console.error('❌ Error checking token expiration:', error);
    }
  }

  // Debug method to inspect token
  public inspectToken(): void {
    const token = this.getToken();
    if (!token) {
      console.log('❌ No token found');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('🔍 Token inspection:', {
        header: JSON.parse(atob(token.split('.')[0])),
        payload: {
          id: payload.id,
          email: payload.email,
          role: payload.role,
          firstName: payload.firstName,
          lastName: payload.lastName,
          iat: new Date(payload.iat * 1000).toISOString(),
          exp: new Date(payload.exp * 1000).toISOString(),
          isExpired: payload.exp < Math.floor(Date.now() / 1000)
        },
        signature: token.split('.')[2].substring(0, 10) + '...'
      });
    } catch (error) {
      console.error('❌ Error decoding token:', error);
    }
  }

  // Méthodes pour les sites
  async getSites(): Promise<ApiResponse<Site[]>> {
    const response = await this.api.get<ApiResponse<Site[]>>('/org/sites');
    return response.data;
  }

  async getSiteById(id: string): Promise<ApiResponse<Site>> {
    const response = await this.api.get<ApiResponse<Site>>(`/org/sites/${id}`);
    return response.data;
  }

  async createSite(data: CreateSiteForm): Promise<ApiResponse<Site>> {
    const response = await this.api.post<ApiResponse<Site>>('/org/sites', data);
    return response.data;
  }

  async updateSite(id: string, data: Partial<CreateSiteForm>): Promise<ApiResponse<Site>> {
    const response = await this.api.put<ApiResponse<Site>>(`/org/sites/${id}`, data);
    return response.data;
  }

  async deleteSite(id: string): Promise<ApiResponse> {
    const response = await this.api.delete<ApiResponse>(`/org/sites/${id}`);
    return response.data;
  }

  // Méthodes pour les secteurs
  async getAllSecteurs(siteId?: string): Promise<ApiResponse<Secteur[]>> {
    const params = siteId ? `?siteId=${siteId}` : '';
    const response = await this.api.get<ApiResponse<Secteur[]>>(`/org/secteurs${params}`);
    return response.data;
  }

  async getSecteurs(siteId: string): Promise<ApiResponse<Secteur[]>> {
    const response = await this.api.get<ApiResponse<Secteur[]>>(`/org/sites/${siteId}/secteurs`);
    return response.data;
  }

  async getSecteurById(id: string): Promise<ApiResponse<Secteur>> {
    const response = await this.api.get<ApiResponse<Secteur>>(`/org/secteurs/${id}`);
    return response.data;
  }

  // async createSecteur(data: CreateSecteurForm): Promise<ApiResponse<Secteur>> {
  //   const response = await this.api.post<ApiResponse<Secteur>>(`/org/sites/${data.site}/secteurs`, data);
  //   return response.data;
  // }

  // async updateSecteur(id: string, data: Partial<CreateSecteurForm>): Promise<ApiResponse<Secteur>> {
  //   const response = await this.api.put<ApiResponse<Secteur>>(`/org/secteurs/${id}`, data);
  //   return response.data;
  // }

  // async deleteSecteur(siteId: string, id: string): Promise<ApiResponse> {
  //   const response = await this.api.delete<ApiResponse>(`/org/sites/${siteId}/secteurs/${id}`);
  //   return response.data;
  // }

  // Méthodes pour les services
  async getServices(params?: { siteId?: string; secteurId?: string }): Promise<ApiResponse<Service[]>> {
    let url = '/org/services';
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.siteId) queryParams.append('siteId', params.siteId);
      if (params.secteurId) queryParams.append('secteurId', params.secteurId);
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
    }
    const response = await this.api.get<ApiResponse<Service[]>>(url);
    return response.data;
  }

  // Admin methods for secteurs
  async createSecteur(data: any): Promise<ApiResponse<Secteur>> {
    const response = await this.api.post<ApiResponse<Secteur>>('/org/secteurs', data);
    return response.data;
  }

  async updateSecteur(id: string, data: any): Promise<ApiResponse<Secteur>> {
    const response = await this.api.put<ApiResponse<Secteur>>(`/org/secteurs/${id}`, data);
    return response.data;
  }

  async deleteSecteur(id: string): Promise<ApiResponse<void>> {
    const response = await this.api.delete<ApiResponse<void>>(`/org/secteurs/${id}`);
    return response.data;
  }

  // Admin methods for services
  // async createService(data: any): Promise<ApiResponse<Service>> {
  //   const response = await this.api.post<ApiResponse<Service>>('/org/services', data);
  //   return response.data;
  // }

  // async updateService(id: string, data: any): Promise<ApiResponse<Service>> {
  //   const response = await this.api.put<ApiResponse<Service>>(`/org/services/${id}`, data);
  //   return response.data;
  // }

  // async deleteService(id: string): Promise<ApiResponse<void>> {
  //   const response = await this.api.delete<ApiResponse<void>>(`/org/services/${id}`);
  //   return response.data;
  // }

  async getServicesBySecteur(secteurId: string): Promise<ApiResponse<Service[]>> {
    const response = await this.api.get<ApiResponse<Service[]>>(`/org/secteurs/${secteurId}/services`);
    // Return the services array directly from the nested data structure
    return {
      success: response.data.success,
      message: response.data.message,
      data: response.data.data || []
    };
  }

  async getServicesWithFilters(filters?: { siteId?: string; secteurId?: string }): Promise<ApiResponse<Service[]>> {
    const params = new URLSearchParams();
    if (filters?.siteId) params.append('siteId', filters.siteId);
    if (filters?.secteurId) params.append('secteurId', filters.secteurId);
    
    const response = await this.api.get<ApiResponse<Service[]>>(`/org/services?${params.toString()}`);
    return {
      success: response.data.success,
      message: response.data.message,
      data: response.data.data || []
    };
  }

  async getServiceById(id: string): Promise<ApiResponse<Service>> {
    const response = await this.api.get<ApiResponse<Service>>(`/org/services/${id}`);
    return response.data;
  }

  async createService(data: CreateServiceForm): Promise<ApiResponse<Service>> {
    const response = await this.api.post<ApiResponse<Service>>('/org/services', data);
    return response.data;
  }

  async updateService(id: string, data: Partial<CreateServiceForm>): Promise<ApiResponse<Service>> {
    const response = await this.api.put<ApiResponse<Service>>(`/org/services/${id}`, data);
    return response.data;
  }

  async deleteService(id: string): Promise<ApiResponse> {
    const response = await this.api.delete<ApiResponse>(`/org/services/${id}`);
    return response.data;
  }

  // Méthodes pour les utilisateurs
  async getUsers(filters?: FilterOptions): Promise<ApiResponse<User[]>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    
    const response = await this.api.get<ApiResponse<User[]>>(`/users?${params.toString()}`);
    return response.data;
  }

  async getUserById(id: string): Promise<ApiResponse<User>> {
    const response = await this.api.get<ApiResponse<User>>(`/users/${id}`);
    return response.data;
  }

  async createUser(data: CreateUserForm): Promise<ApiResponse<User>> {
    const response = await this.api.post<ApiResponse<User>>('/users', data);
    return response.data;
  }

  async updateUser(id: string, data: Partial<UpdateUserForm>): Promise<ApiResponse<User>> {
    const response = await this.api.put<ApiResponse<User>>(`/users/${id}`, data);
    return response.data;
  }

  async deleteUser(id: string): Promise<ApiResponse> {
    const response = await this.api.delete<ApiResponse>(`/users/${id}`);
    return response.data;
  }

  async getUsersBySecteur(secteurId: string, role?: string): Promise<ApiResponse<User[]>> {
    const params = new URLSearchParams();
    params.append('secteur', secteurId);
    if (role) params.append('role', role);

    const response = await this.api.get<ApiResponse<User[]>>(`/users?${params.toString()}`);
    return response.data;
  }

  async getUsersByService(serviceId: string, role?: string): Promise<ApiResponse<User[]>> {
    const params = new URLSearchParams();
    params.append('service', serviceId);
    if (role) params.append('role', role);

    const response = await this.api.get<ApiResponse<User[]>>(`/users?${params.toString()}`);
    return response.data;
  }

  // Méthodes pour le dashboard
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    const response = await this.api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    return response.data;
  }

  // Méthodes utilitaires
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUserFromStorage(): User | null {
    const userStr = localStorage.getItem('ocp_user');
    return userStr ? JSON.parse(userStr) : null;
  }
}

// Instance singleton
export const apiService = new ApiService();
export default apiService;

export class getSites {
    constructor() {}
    async execute(): Promise<ApiResponse<Site[]>> {
        return apiService.getSites();
    }

}
export class createSite {
}
export class updateSite {

}
export class deleteSite {
}