import { apiService } from './api';
import type { RotationEquitableConfig, GardeRotation, StatistiquesRotation } from '@/types/rotation-equitable.types';

class RotationEquitableService {
  /**
   * Génère une rotation équitable pour une période donnée
   */
  async genererRotationEquitable(
    startDate: Date,
    endDate: Date,
    secteurId: string,
    serviceId?: string
  ): Promise<GardeRotation[]> {
    try {
      const response = await apiService.client.post('/plannings/generer-rotation-equitable', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        secteurId,
        serviceId
      });

      if (response.data.success) {
        return response.data.data.map((rotation: any) => ({
          id: rotation._id,
          date: rotation.date,
          utilisateur: {
            id: rotation.utilisateur._id,
            firstName: rotation.utilisateur.firstName,
            lastName: rotation.utilisateur.lastName,
            role: rotation.utilisateur.role,
            phone: rotation.utilisateur.phone,
            email: rotation.utilisateur.email,
            address: rotation.utilisateur.address
          },
          type: rotation.type,
          secteur: rotation.secteur.name,
          service: rotation.service?.name,
          heureDebut: rotation.heureDebut || '18:00',
          heureFin: rotation.heureFin || '08:00',
          statut: rotation.statut,
          priorite: rotation.priorite || 0
        }));
      }
      return [];
    } catch (error) {
      console.error('Erreur génération rotation équitable:', error);
      return [];
    }
  }

  /**
   * Ré-ordonne explicitement la rotation (stub simple; retourne true si 2xx)
   */
  async reorderRotation(
    secteurId: string,
    serviceId: string | undefined,
    orderedUserIds: string[]
  ): Promise<boolean> {
    try {
      const response = await apiService.client.post('/plannings/reorder-rotation', {
        secteurId,
        serviceId,
        orderedUserIds,
      });
      return !!response.data?.success;
    } catch (error) {
      console.warn('Reorder rotation endpoint not available or failed', error);
      return false;
    }
  }

  /**
   * Récupère les statistiques de rotation équitable
   */
  async getStatistiquesRotation(
    secteurId: string,
    serviceId?: string,
    periode?: { startDate: Date; endDate: Date }
  ): Promise<StatistiquesRotation | null> {
    try {
      const params: any = { secteurId };
      if (serviceId) params.serviceId = serviceId;
      if (periode) {
        params.startDate = periode.startDate.toISOString().split('T')[0];
        params.endDate = periode.endDate.toISOString().split('T')[0];
      }

      const response = await apiService.client.get('/plannings/statistiques-rotation', { params });

      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Erreur récupération statistiques rotation:', error);
      return null;
    }
  }

  /**
   * Optimise la rotation pour équilibrer la charge
   */
  async optimiserRotation(
    secteurId: string,
    serviceId?: string
  ): Promise<GardeRotation[]> {
    try {
      const response = await apiService.client.post('/plannings/optimiser-rotation', {
        secteurId,
        serviceId
      });

      if (response.data.success) {
        return response.data.data.map((rotation: any) => ({
          id: rotation._id,
          date: rotation.date,
          utilisateur: {
            id: rotation.utilisateur._id,
            firstName: rotation.utilisateur.firstName,
            lastName: rotation.utilisateur.lastName,
            role: rotation.utilisateur.role,
            phone: rotation.utilisateur.phone,
            email: rotation.utilisateur.email,
            address: rotation.utilisateur.address
          },
          type: rotation.type,
          secteur: rotation.secteur.name,
          service: rotation.service?.name,
          heureDebut: rotation.heureDebut || '18:00',
          heureFin: rotation.heureFin || '08:00',
          statut: rotation.statut,
          priorite: rotation.priorite || 0
        }));
      }
      return [];
    } catch (error) {
      console.error('Erreur optimisation rotation:', error);
      return [];
    }
  }

  /**
   * Récupère la configuration de rotation pour un secteur/service
   */
  async getConfigurationRotation(
    secteurId: string,
    serviceId?: string
  ): Promise<RotationEquitableConfig | null> {
    try {
      const params: any = { secteurId };
      if (serviceId) params.serviceId = serviceId;

      const response = await apiService.client.get('/plannings/configuration-rotation', { params });

      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Erreur récupération configuration rotation:', error);
      return null;
    }
  }

  /**
   * Met à jour la configuration de rotation
   */
  async updateConfigurationRotation(
    secteurId: string,
    configuration: Partial<RotationEquitableConfig>,
    serviceId?: string
  ): Promise<boolean> {
    try {
      const response = await apiService.client.put('/plannings/configuration-rotation', {
        secteurId,
        serviceId,
        ...configuration
      });

      return response.data.success;
    } catch (error) {
      console.error('Erreur mise à jour configuration rotation:', error);
      return false;
    }
  }

  /**
   * Vérifie l'équité de la rotation actuelle
   */
  async verifierEquiteRotation(
    secteurId: string,
    serviceId?: string
  ): Promise<{
    equitable: boolean;
    details: {
      utilisateursSousCharge: string[];
      utilisateursSurCharge: string[];
      recommandations: string[];
    };
  } | null> {
    try {
      const params: any = { secteurId };
      if (serviceId) params.serviceId = serviceId;

      const response = await apiService.client.get('/plannings/verifier-equite', { params });

      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Erreur vérification équité rotation:', error);
      return null;
    }
  }

  /**
   * Récupère l'historique des gardes d'un utilisateur
   */
  async getHistoriqueGardes(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<GardeRotation[]> {
    try {
      const params: any = { userId };
      if (startDate) params.startDate = startDate.toISOString().split('T')[0];
      if (endDate) params.endDate = endDate.toISOString().split('T')[0];

      const response = await apiService.client.get('/plannings/historique-gardes', { params });

      if (response.data.success) {
        return response.data.data.map((garde: any) => ({
          id: garde._id,
          date: garde.date,
          utilisateur: {
            id: garde.utilisateur._id,
            firstName: garde.utilisateur.firstName,
            lastName: garde.utilisateur.lastName,
            role: garde.utilisateur.role,
            phone: garde.utilisateur.phone,
            email: garde.utilisateur.email,
            address: garde.utilisateur.address
          },
          type: garde.type,
          secteur: garde.secteur.name,
          service: garde.service?.name,
          heureDebut: garde.heureDebut || '18:00',
          heureFin: garde.heureFin || '08:00',
          statut: garde.statut,
          priorite: garde.priorite || 0
        }));
      }
      return [];
    } catch (error) {
      console.error('Erreur récupération historique gardes:', error);
      return [];
    }
  }

  /**
   * Calcule la charge de travail équitable
   */
  calculerChargeEquitable(
    totalGardes: number,
    nombreUtilisateurs: number,
    poidsParRole: { [role: string]: number } = {}
  ): number {
    // Poids par défaut selon le rôle
    const poidsDefaut = {
      'collaborateur': 1,
      'chef_service': 1.2, // Le chef de service participe aussi
      'ingenieur': 1.5, // Les ingénieurs ont plus de responsabilités
      'chef_secteur': 0.8 // Moins de gardes car plus de supervision
    };

    // const poids = { ...poidsDefaut, ...poidsParRole };
    
    // Calcul de la charge équitable pondérée
    let chargeEquitable = totalGardes / nombreUtilisateurs;
    
    return Math.round(chargeEquitable * 100) / 100;
  }

  /**
   * Génère des recommandations pour équilibrer la rotation
   */
  async genererRecommandations(
    secteurId: string,
    serviceId?: string
  ): Promise<string[]> {
    try {
      const statistiques = await this.getStatistiquesRotation(secteurId, serviceId);
      if (!statistiques) return [];

      const recommandations: string[] = [];
      // const moyenne = statistiques.moyenneGardes;

      // Vérifier les utilisateurs sous-chargés
      if (statistiques.utilisateursSousCharge.length > 0) {
        recommandations.push(
          `Attribuer plus de gardes aux utilisateurs: ${statistiques.utilisateursSousCharge.join(', ')}`
        );
      }

      // Vérifier les utilisateurs sur-chargés
      if (statistiques.utilisateursSurCharge.length > 0) {
        recommandations.push(
          `Réduire les gardes pour: ${statistiques.utilisateursSurCharge.join(', ')}`
        );
      }

      // Recommandations générales
      if (statistiques.totalGardes === 0) {
        recommandations.push('Aucune garde planifiée pour cette période');
      } else if (statistiques.utilisateursSousCharge.length === 0 && 
                 statistiques.utilisateursSurCharge.length === 0) {
        recommandations.push('La rotation est équitable pour cette période');
      }

      return recommandations;
    } catch (error) {
      console.error('Erreur génération recommandations:', error);
      return ['Erreur lors de l\'analyse de la rotation'];
    }
  }
}

const rotationEquitableService = new RotationEquitableService();
export default rotationEquitableService;
