import holidaysService from './holidays.service';
import { apiService } from './api';

// Types
export interface WeekendHolidayPlanning {
  id: string;
  date: string;
  type: 'weekend' | 'holiday';
  garde: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    role: string;
    address?: string;
  };
  secteur: string;
  service?: string;
  heureDebut: string;
  heureFin: string;
  statut: 'planifie' | 'confirme' | 'en_cours' | 'termine';
}

export interface WeekendHolidayStats {
  totalWeekends: number;
  totalHolidays: number;
  gardesPlanifiees: number;
  gardesConfirmees: number;
  gardesEnCours: number;
  prochainWeekend?: WeekendHolidayPlanning;
  prochainFerie?: WeekendHolidayPlanning;
}

class WeekendHolidayService {
  /**
   * Récupère le planning des weekends et jours fériés
   */
  async getWeekendHolidayPlanning(
    startDate: Date,
    endDate: Date,
    secteurId?: string
  ): Promise<WeekendHolidayPlanning[]> {
    try {
      // Appel backend: récupérer plannings validés/publiés sur la période
      const response = await apiService.apiClient.get('/plannings', {
        params: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
          secteurId,
        },
      });

      const items: WeekendHolidayPlanning[] = [];
      if (response.data?.success && Array.isArray(response.data.data)) {
        for (const p of response.data.data) {
          const base = {
            secteur: p.secteur?.name || '',
            service: p.service?.name,
          };
          for (const g of p.gardes || []) {
            const d = new Date(g.date);
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
            const isHoliday = holidaysService.isHoliday(d) !== null;
            if (!isWeekend && !isHoliday) continue; // weekend/holiday only

            items.push({
              id: `${p._id}-${g._id}`,
              date: g.date,
              type: isHoliday ? 'holiday' : 'weekend',
              garde: {
                id: g.utilisateur?._id || g.utilisateur,
                firstName: g.utilisateur?.firstName || '',
                lastName: g.utilisateur?.lastName || '',
                phone: g.utilisateur?.phone || '',
                email: g.utilisateur?.email || '',
                role: g.utilisateur?.role || '',
                address: g.utilisateur?.address,
              },
              ...base,
              heureDebut: g.heureDebut || '18:00',
              heureFin: g.heureFin || '08:00',
              statut: g.statut || 'planifie',
            });
          }
        }
      }

      return items.sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Erreur récupération planning weekend/férié:', error);
      return [];
    }
  }

  /**
   * Récupère la personne de garde pour un weekend/jour férié spécifique
   */
  async getGardeForDate(date: Date, secteurId?: string): Promise<WeekendHolidayPlanning | null> {
    try {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      const list = await this.getWeekendHolidayPlanning(start, end, secteurId);
      return list[0] || null;
    } catch (error) {
      console.error('Erreur récupération garde pour date:', error);
      return null;
    }
  }

  /**
   * Récupère les statistiques des weekends et jours fériés
   */
  async getWeekendHolidayStats(_secteurId?: string): Promise<WeekendHolidayStats | null> {
    try {
      // Données de test temporaires
      const testStats: WeekendHolidayStats = {
        totalWeekends: 8,
        totalHolidays: 12,
        gardesPlanifiees: 15,
        gardesConfirmees: 12,
        gardesEnCours: 2,
        prochainWeekend: {
          id: '1',
          date: '2024-01-20',
          type: 'weekend',
          garde: {
            id: '1',
            firstName: 'Ahmed',
            lastName: 'Benali',
            phone: '+212 6 12 34 56 78',
            email: 'ahmed.benali@ocp.ma',
            role: 'ingenieur',
            address: '123 Rue Hassan II, Casablanca'
          },
          secteur: 'Secteur Production',
          heureDebut: '18:00',
          heureFin: '08:00',
          statut: 'confirme'
        }
      };
      
      return testStats;
    } catch (error) {
      console.error('Erreur récupération statistiques weekend/férié:', error);
      return null;
    }
  }

  /**
   * Vérifie si une date est un weekend
   */
  isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // Dimanche = 0, Samedi = 6
  }

  /**
   * Vérifie si une date est un jour férié (utilise le service holidays)
   */
  isHoliday(date: Date): boolean {
    return holidaysService.isHoliday(date) !== null;
  }

  /**
   * Génère les dates de weekends et jours fériés pour une période
   */
  generateWeekendHolidayDates(startDate: Date, endDate: Date): Date[] {
    const dates: Date[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      if (this.isWeekend(currentDate) || this.isHoliday(currentDate)) {
        dates.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }

  /**
   * Récupère le prochain weekend ou jour férié avec garde
   */
  async getNextWeekendHolidayWithGarde(secteurId?: string): Promise<WeekendHolidayPlanning | null> {
    try {
      const today = new Date();
      const in60d = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
      const list = await this.getWeekendHolidayPlanning(today, in60d, secteurId);
      return list[0] || null;
    } catch (error) {
      console.error('Erreur récupération prochain weekend/férié:', error);
      return null;
    }
  }
}

const weekendHolidayService = new WeekendHolidayService();
export default weekendHolidayService;
