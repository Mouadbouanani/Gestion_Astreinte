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
  UpdateUserForm
} from '@/types';

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
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Intercepteur pour gérer les réponses et erreurs
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearAuth();
          window.location.href = '/login';
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
  async getSecteurs(): Promise<ApiResponse<Secteur[]>> {
    const response = await this.api.get<ApiResponse<Secteur[]>>('/org/secteurs');
    return response.data;
  }

  async getSecteurById(id: string): Promise<ApiResponse<Secteur>> {
    const response = await this.api.get<ApiResponse<Secteur>>(`/org/secteurs/${id}`);
    return response.data;
  }

  async createSecteur(data: CreateSecteurForm): Promise<ApiResponse<Secteur>> {
    const response = await this.api.post<ApiResponse<Secteur>>('/org/secteurs', data);
    return response.data;
  }

  async updateSecteur(id: string, data: Partial<CreateSecteurForm>): Promise<ApiResponse<Secteur>> {
    const response = await this.api.put<ApiResponse<Secteur>>(`/org/secteurs/${id}`, data);
    return response.data;
  }

  async deleteSecteur(id: string): Promise<ApiResponse> {
    const response = await this.api.delete<ApiResponse>(`/org/secteurs/${id}`);
    return response.data;
  }

  // Méthodes pour les services
  async getServices(): Promise<ApiResponse<Service[]>> {
    const response = await this.api.get<ApiResponse<Service[]>>('/org/services');
    return response.data;
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

  async updateUser(id: string, data: Partial<UpdateUserForm>): Promise<ApiResponse<User>> {
    const response = await this.api.put<ApiResponse<User>>(`/users/${id}`, data);
    return response.data;
  }

  async deleteUser(id: string): Promise<ApiResponse> {
    const response = await this.api.delete<ApiResponse>(`/users/${id}`);
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
