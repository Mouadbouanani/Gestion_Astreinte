// Service d'escalade spécialisé
import { apiService } from './api';
import type { 
  Escalade, 
  CreateEscaladeForm, 
  EscaladeFilters,
  // EscaladeNiveau,
  ApiResponse,
  User
} from '@/types';

export interface EscalationServiceInterface {
  // CRUD Operations
  create(data: CreateEscaladeForm): Promise<ApiResponse<Escalade>>;
  getAll(filters?: EscaladeFilters): Promise<ApiResponse<Escalade[]>>;
  getById(id: string): Promise<ApiResponse<Escalade>>;
  update(id: string, data: Partial<Escalade>): Promise<ApiResponse<Escalade>>;
  delete(id: string): Promise<ApiResponse<void>>;
  
  // Escalation Workflow
  startEscalation(id: string): Promise<ApiResponse<Escalade>>;
  escalateToNextLevel(id: string): Promise<ApiResponse<Escalade>>;
  respondToEscalation(id: string, niveau: number, commentaire?: string): Promise<ApiResponse<Escalade>>;
  resolveEscalation(id: string, resolution: any): Promise<ApiResponse<Escalade>>;
  cancelEscalation(id: string, reason?: string): Promise<ApiResponse<Escalade>>;
  
  // Contact Methods
  sendSMS(id: string, niveau: number, message: string): Promise<ApiResponse<any>>;
  makeCall(id: string, niveau: number): Promise<ApiResponse<any>>;
  sendEmail(id: string, niveau: number, subject: string, body: string): Promise<ApiResponse<any>>;
  sendPushNotification(id: string, niveau: number, message: string): Promise<ApiResponse<any>>;
  
  // Utility Methods
  getCurrentOnDuty(siteId: string, secteurId: string, serviceId?: string): Promise<ApiResponse<User[]>>;
  getEscalationChain(siteId: string, secteurId: string, serviceId?: string): Promise<ApiResponse<User[]>>;
  calculateResponseTime(escalade: Escalade, niveau: number): number;
  getActiveEscalations(): Promise<ApiResponse<Escalade[]>>;
  
  // Statistics and Reports
  getStats(filters?: any): Promise<ApiResponse<any>>;
  getResponseTimeStats(filters?: any): Promise<ApiResponse<any>>;
  getEscalationTrends(period: 'day' | 'week' | 'month'): Promise<ApiResponse<any>>;
}

export class EscalationServiceImpl implements EscalationServiceInterface {
  
  // CRUD Operations
  async create(data: CreateEscaladeForm): Promise<ApiResponse<Escalade>> {
    try {
      const response = await apiService.apiClient.post<ApiResponse<Escalade>>('/escalades', data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la création de l\'escalade',
        error: error.message
      };
    }
  }

  async getAll(filters?: EscaladeFilters): Promise<ApiResponse<Escalade[]>> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
      }
      
      const response = await apiService.apiClient.get<ApiResponse<Escalade[]>>(`/escalades?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la récupération des escalades',
        error: error.message
      };
    }
  }

  async getById(id: string): Promise<ApiResponse<Escalade>> {
    try {
      const response = await apiService.apiClient.get<ApiResponse<Escalade>>(`/escalades/${id}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la récupération de l\'escalade',
        error: error.message
      };
    }
  }

  async update(id: string, data: Partial<Escalade>): Promise<ApiResponse<Escalade>> {
    try {
      const response = await apiService.apiClient.put<ApiResponse<Escalade>>(`/escalades/${id}`, data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la mise à jour de l\'escalade',
        error: error.message
      };
    }
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiService.apiClient.delete<ApiResponse<void>>(`/escalades/${id}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la suppression de l\'escalade',
        error: error.message
      };
    }
  }

  // Escalation Workflow
  async startEscalation(id: string): Promise<ApiResponse<Escalade>> {
    try {
      const response = await apiService.apiClient.post<ApiResponse<Escalade>>(`/escalades/${id}/start`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors du démarrage de l\'escalade',
        error: error.message
      };
    }
  }

  async escalateToNextLevel(id: string): Promise<ApiResponse<Escalade>> {
    try {
      const response = await apiService.apiClient.post<ApiResponse<Escalade>>(`/escalades/${id}/escalate`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de l\'escalade au niveau suivant',
        error: error.message
      };
    }
  }

  async respondToEscalation(id: string, niveau: number, commentaire?: string): Promise<ApiResponse<Escalade>> {
    try {
      const response = await apiService.apiClient.post<ApiResponse<Escalade>>(`/escalades/${id}/respond`, {
        niveau,
        commentaire
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la réponse à l\'escalade',
        error: error.message
      };
    }
  }

  async resolveEscalation(id: string, resolution: any): Promise<ApiResponse<Escalade>> {
    try {
      const response = await apiService.apiClient.post<ApiResponse<Escalade>>(`/escalades/${id}/resolve`, resolution);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la résolution de l\'escalade',
        error: error.message
      };
    }
  }

  async cancelEscalation(id: string, reason?: string): Promise<ApiResponse<Escalade>> {
    try {
      const response = await apiService.apiClient.post<ApiResponse<Escalade>>(`/escalades/${id}/cancel`, { reason });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de l\'annulation de l\'escalade',
        error: error.message
      };
    }
  }

  // Contact Methods
  async sendSMS(id: string, niveau: number, message: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiService.apiClient.post<ApiResponse<any>>(`/escalades/${id}/contact/sms`, {
        niveau,
        message
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de l\'envoi du SMS',
        error: error.message
      };
    }
  }

  async makeCall(id: string, niveau: number): Promise<ApiResponse<any>> {
    try {
      const response = await apiService.apiClient.post<ApiResponse<any>>(`/escalades/${id}/contact/call`, {
        niveau
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de l\'appel',
        error: error.message
      };
    }
  }

  async sendEmail(id: string, niveau: number, subject: string, body: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiService.apiClient.post<ApiResponse<any>>(`/escalades/${id}/contact/email`, {
        niveau,
        subject,
        body
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de l\'envoi de l\'email',
        error: error.message
      };
    }
  }

  async sendPushNotification(id: string, niveau: number, message: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiService.apiClient.post<ApiResponse<any>>(`/escalades/${id}/contact/push`, {
        niveau,
        message
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de l\'envoi de la notification push',
        error: error.message
      };
    }
  }

  // Utility Methods
  async getCurrentOnDuty(siteId: string, secteurId: string, serviceId?: string): Promise<ApiResponse<User[]>> {
    try {
      const params = new URLSearchParams({
        siteId,
        secteurId,
        ...(serviceId && { serviceId })
      });
      
      const response = await apiService.apiClient.get<ApiResponse<User[]>>(`/escalades/on-duty?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la récupération des personnes de garde',
        error: error.message
      };
    }
  }

  async getEscalationChain(siteId: string, secteurId: string, serviceId?: string): Promise<ApiResponse<User[]>> {
    try {
      const params = new URLSearchParams({
        siteId,
        secteurId,
        ...(serviceId && { serviceId })
      });
      
      const response = await apiService.apiClient.get<ApiResponse<User[]>>(`/escalades/chain?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la récupération de la chaîne d\'escalade',
        error: error.message
      };
    }
  }

  calculateResponseTime(escalade: Escalade, niveau: number): number {
    const niveauData = escalade.niveaux.find(n => n.niveau === niveau);
    if (!niveauData || !niveauData.endTime) {
      return 0;
    }

    const contactTime = new Date(niveauData.startTime).getTime();
    const responseTime = new Date(niveauData.endTime).getTime();
    
    return Math.round((responseTime - contactTime) / (1000 * 60)); // en minutes
  }

  async getActiveEscalations(): Promise<ApiResponse<Escalade[]>> {
    return this.getAll({ status: 'in_progress' });
  }

  // Statistics and Reports
  async getStats(filters?: any): Promise<ApiResponse<any>> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
      }
      
      const response = await apiService.apiClient.get<ApiResponse<any>>(`/escalades/stats?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la récupération des statistiques',
        error: error.message
      };
    }
  }

  async getResponseTimeStats(filters?: any): Promise<ApiResponse<any>> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
      }
      
      const response = await apiService.apiClient.get<ApiResponse<any>>(`/escalades/response-time-stats?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la récupération des statistiques de temps de réponse',
        error: error.message
      };
    }
  }

  async getEscalationTrends(period: 'day' | 'week' | 'month'): Promise<ApiResponse<any>> {
    try {
      const response = await apiService.apiClient.get<ApiResponse<any>>(`/escalades/trends?period=${period}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la récupération des tendances d\'escalade',
        error: error.message
      };
    }
  }
}

export const escalationService = new EscalationServiceImpl();
export default escalationService;
