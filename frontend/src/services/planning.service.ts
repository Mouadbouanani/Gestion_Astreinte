// Service de planning spécialisé
import apiService from './api';
import type { UserRole } from '@/types';

export interface PlanningEntry {
  _id?: string;
  date: string;
  type: 'ingenieur' | 'collaborateur';
  userId: string;
  siteId: string;
  secteurId: string;
  serviceId?: string;
  shift: 'day' | 'night' | 'weekend';
  statut: 'propose' | 'valide' | 'conflit';
  validation?: {
    validePar: string;
    valideLe: string;
  };
}

export interface GeneratePlanningOptions {
  startDate: Date;
  endDate: Date;
  secteurId: string;
  serviceId?: string;
  users?: string[]; // Optional: specific users to include in rotation
}

export class PlanningService {
  async getPlannings(
    startDate: Date,
    endDate: Date,
    secteurId?: string,
    serviceId?: string,
    userId?: string
  ): Promise<PlanningEntry[]> {
    try {
      const response = await apiService.client.get('/plannings', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          secteurId,
          serviceId,
          userId,
        },
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Erreur récupération plannings:', error);
      return [];
    }
  }

  async createPlanning(planningEntry: PlanningEntry): Promise<PlanningEntry | null> {
    try {
      const response = await apiService.client.post('/plannings', planningEntry);
      return response.data.data;
    } catch (error) {
      console.error('Erreur création planning:', error);
      return null;
    }
  }

  async generatePlanning(options: GeneratePlanningOptions): Promise<PlanningEntry[]> {
    try {
      const response = await apiService.client.post('/plannings/generate', {
        startDate: options.startDate.toISOString(),
        endDate: options.endDate.toISOString(),
        secteurId: options.secteurId,
        serviceId: options.serviceId,
        users: options.users,
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Erreur génération planning:', error);
      return [];
    }
  }

  async validatePlanning(planningId: string): Promise<boolean> {
    try {
      const response = await apiService.client.put(`/plannings/${planningId}/validate`);
      return response.data.success;
    } catch (error) {
      console.error('Erreur validation planning:', error);
      return false;
    }
  }

  // You can add more methods here as needed, e.g., for deleting or updating specific planning entries.
}

export const planningService = new PlanningService();
export default planningService;
