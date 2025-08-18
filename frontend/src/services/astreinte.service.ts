import { apiService } from './api';

export interface GardeActuelle {
  id: string;
  date: string;
  utilisateur: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    role: string;
  };
  type: 'service' | 'secteur';
  service?: string;
  secteur: string;
  heureDebut: string;
  heureFin: string;
}

export interface Panne {
  id: string;
  titre: string;
  description: string;
  type: 'technique' | 'securite' | 'maintenance' | 'autre';
  urgence: 'faible' | 'moyenne' | 'haute' | 'critique';
  statut: 'declaree' | 'ouverte' | 'en_cours' | 'resolue';
  priorite: 'basse' | 'normale' | 'elevee' | 'urgente';
  dateCreation: string;
  dateResolution?: string;
  site?: {
    id: string;
    name: string;
    code: string;
  };
  secteur?: {
    id: string;
    name: string;
    code: string;
  };
  service?: {
    id: string;
    name: string;
    code: string;
  };
  declaredBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  commentaires?: Array<{
    id: string;
    texte: string;
    auteur: {
      id: string;
      firstName: string;
      lastName: string;
    };
    date: string;
  }>;
}

export interface NouvellePanne {
  titre: string;
  description: string;
  type?: 'technique' | 'securite' | 'maintenance' | 'autre';
  urgence?: 'faible' | 'moyenne' | 'haute' | 'critique';
  priorite?: 'basse' | 'normale' | 'elevee' | 'urgente';
  site?: string;
  secteur?: string;
  service?: string;
}

export interface PannesFilters {
  statut?: string;
  type?: string;
  urgence?: string;
  site?: string;
  secteur?: string;
  service?: string;
  page?: number;
  limit?: number;
}

export interface PannesResponse {
  success: boolean;
  data: Panne[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class AstreinteService {
  /**
   * Récupère la personne de garde actuelle
   */
  async getGardeActuelle(): Promise<GardeActuelle | null> {
    try {
      const aujourdhui = new Date();
      const response = await apiService.client.get('/plannings', {
        params: {
          date: aujourdhui.toISOString().split('T')[0],
          statut: 'valide,publie'
        }
      });

      if (response.data.success && response.data.data.length > 0) {
        const planning = response.data.data[0];
        const gardeAujourdhui = planning.gardes.find((garde: any) => {
          const gardeDate = new Date(garde.date);
          return gardeDate.toDateString() === aujourdhui.toDateString();
        });

        if (gardeAujourdhui) {
          return {
            id: gardeAujourdhui._id,
            date: gardeAujourdhui.date,
            utilisateur: {
              id: gardeAujourdhui.utilisateur._id,
              firstName: gardeAujourdhui.utilisateur.firstName,
              lastName: gardeAujourdhui.utilisateur.lastName,
              phone: gardeAujourdhui.utilisateur.phone,
              email: gardeAujourdhui.utilisateur.email,
              role: gardeAujourdhui.utilisateur.role
            },
            type: planning.type,
            service: planning.service?.name,
            secteur: planning.secteur.name,
            heureDebut: gardeAujourdhui.heureDebut || '18:00',
            heureFin: gardeAujourdhui.heureFin || '08:00'
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Erreur récupération garde actuelle:', error);
      return null;
    }
  }

  /**
   * Récupère les pannes récentes
   */
  async getPannesRecentes(): Promise<Panne[]> {
    try {
      const response = await apiService.client.get('/pannes/recentes', {
        params: {
          limit: 10
        }
      });

      if (response.data.success) {
        return response.data.data.map((panne: any) => this.mapPanneFromApi(panne));
      }
      return [];
    } catch (error) {
      console.error('Erreur récupération pannes récentes:', error);
      return [];
    }
  }

  /**
   * Récupère toutes les pannes avec filtres et pagination
   */
  async getAllPannes(filters: PannesFilters = {}): Promise<PannesResponse> {
    try {
      const response = await apiService.client.get('/pannes', { params: filters });
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data.map((panne: any) => this.mapPanneFromApi(panne)),
          pagination: response.data.pagination
        };
      }
      return { success: false, data: [] };
    } catch (error) {
      console.error('Erreur récupération toutes pannes:', error);
      return { success: false, data: [] };
    }
  }

  /**
   * Récupère une panne par ID
   */
  async getPanneById(panneId: string): Promise<Panne | null> {
    try {
      const response = await apiService.client.get(`/pannes/${panneId}`);
      
      if (response.data.success) {
        return this.mapPanneFromApi(response.data.data);
      }
      return null;
    } catch (error) {
      console.error('Erreur récupération panne par ID:', error);
      return null;
    }
  }

  /**
   * Déclare une nouvelle panne
   */
  async declarerPanne(panne: NouvellePanne): Promise<Panne | null> {
    try {
      const response = await apiService.client.post('/pannes', panne);
      
      if (response.data.success) {
        return this.mapPanneFromApi(response.data.data);
      }
      return null;
    } catch (error) {
      console.error('Erreur déclaration panne:', error);
      throw error;
    }
  }

  /**
   * Met à jour le statut d'une panne
   */
  async updateStatutPanne(
    panneId: string, 
    statut: 'declaree' | 'ouverte' | 'en_cours' | 'resolue',
    assignedTo?: string,
    commentaire?: string
  ): Promise<boolean> {
    try {
      const payload: any = { statut };
      if (assignedTo) payload.assignedTo = assignedTo;
      if (commentaire) payload.commentaire = commentaire;

      const response = await apiService.client.put(`/pannes/${panneId}/statut`, payload);
      return response.data.success;
    } catch (error) {
      console.error('Erreur mise à jour statut panne:', error);
      return false;
    }
  }

  /**
   * Ajoute un commentaire à une panne
   */
  async addCommentToPanne(panneId: string, commentaire: string): Promise<boolean> {
    try {
      const response = await apiService.client.post(`/pannes/${panneId}/commentaires`, {
        texte: commentaire
      });
      return response.data.success;
    } catch (error) {
      console.error('Erreur ajout commentaire:', error);
      return false;
    }
  }

  /**
   * Récupère les statistiques d'astreinte
   */
  async getStatistiquesAstreinte(): Promise<any> {
    try {
      const response = await apiService.client.get('/plannings/stats');
      return response.data.success ? response.data.data : null;
    } catch (error) {
      console.error('Erreur récupération statistiques:', error);
      return null;
    }
  }

  /**
   * Envoie une notification d'escalade
   */
  async envoyerEscalade(panneId: string, niveau: 1 | 2 | 3): Promise<boolean> {
    try {
      const response = await apiService.client.post(`/escalades`, {
        panneId,
        niveau
      });
      return response.data.success;
    } catch (error) {
      console.error('Erreur envoi escalade:', error);
      return false;
    }
  }

  /**
   * Mappe les données de l'API vers l'interface Panne
   */
  private mapPanneFromApi(panne: any): Panne {
    return {
      id: panne._id,
      titre: panne.titre,
      description: panne.description,
      type: panne.type,
      urgence: panne.urgence,
      statut: panne.statut,
      priorite: panne.priorite,
      dateCreation: panne.dateCreation,
      dateResolution: panne.dateResolution,
      site: panne.site ? {
        id: panne.site._id,
        name: panne.site.name,
        code: panne.site.code
      } : undefined,
      secteur: panne.secteur ? {
        id: panne.secteur._id,
        name: panne.secteur.name,
        code: panne.secteur.code
      } : undefined,
      service: panne.service ? {
        id: panne.service._id,
        name: panne.service.name,
        code: panne.service.code
      } : undefined,
      declaredBy: panne.declaredBy ? {
        id: panne.declaredBy._id,
        firstName: panne.declaredBy.firstName,
        lastName: panne.declaredBy.lastName
      } : undefined,
      assignedTo: panne.assignedTo ? {
        id: panne.assignedTo._id,
        firstName: panne.assignedTo.firstName,
        lastName: panne.assignedTo.lastName
      } : undefined,
      commentaires: panne.commentaires?.map((comment: any) => ({
        id: comment._id,
        texte: comment.texte,
        auteur: {
          id: comment.auteur._id,
          firstName: comment.auteur.firstName,
          lastName: comment.auteur.lastName
        },
        date: comment.date
      }))
    };
  }
}

const astreinteService = new AstreinteService();
export default astreinteService;

