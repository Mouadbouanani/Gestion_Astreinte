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

