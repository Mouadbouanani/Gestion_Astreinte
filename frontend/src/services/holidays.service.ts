// Service pour la gestion des jours fériés marocains

export interface Holiday {
  id: string;
  name: string;
  date: string; // Format YYYY-MM-DD
  type: 'fixed' | 'lunar' | 'calculated';
  description?: string;
  isNational: boolean;
}

class HolidaysService {
  // Jours fériés fixes (calendrier grégorien)
  private getFixedHolidays(year: number): Holiday[] {
    return [
      {
        id: 'new-year',
        name: 'Nouvel An',
        date: `${year}-01-01`,
        type: 'fixed',
        description: 'Jour de l\'An',
        isNational: true
      },
      {
        id: 'independence-manifesto',
        name: 'Fête de l\'Indépendance',
        date: `${year}-01-11`,
        type: 'fixed',
        description: 'Présentation du Manifeste de l\'Indépendance',
        isNational: true
      },
      {
        id: 'labor-day',
        name: 'Fête du Travail',
        date: `${year}-05-01`,
        type: 'fixed',
        description: 'Fête internationale du Travail',
        isNational: true
      },
      {
        id: 'throne-day',
        name: 'Fête du Trône',
        date: `${year}-07-30`,
        type: 'fixed',
        description: 'Fête du Trône de Sa Majesté le Roi',
        isNational: true
      },
      {
        id: 'oued-eddahab',
        name: 'Fête Oued Ed-Dahab',
        date: `${year}-08-14`,
        type: 'fixed',
        description: 'Récupération de la province d\'Oued Ed-Dahab',
        isNational: true
      },
      {
        id: 'revolution-day',
        name: 'Révolution du Roi et du Peuple',
        date: `${year}-08-20`,
        type: 'fixed',
        description: 'Révolution du Roi et du Peuple',
        isNational: true
      },
      {
        id: 'youth-day',
        name: 'Fête de la Jeunesse',
        date: `${year}-08-21`,
        type: 'fixed',
        description: 'Anniversaire de Sa Majesté le Roi',
        isNational: true
      },
      {
        id: 'green-march',
        name: 'Marche Verte',
        date: `${year}-11-06`,
        type: 'fixed',
        description: 'Anniversaire de la Marche Verte',
        isNational: true
      },
      {
        id: 'independence-day',
        name: 'Fête de l\'Indépendance',
        date: `${year}-11-18`,
        type: 'fixed',
        description: 'Fête de l\'Indépendance',
        isNational: true
      }
    ];
  }

  // Jours fériés religieux (approximatifs - calendrier lunaire)
  private getReligiousHolidays(year: number): Holiday[] {
    // Note: Les dates exactes dépendent de l'observation lunaire
    // Ces dates sont approximatives et doivent être ajustées chaque année
    const holidays: Holiday[] = [];

    // Dates approximatives pour 2024-2025
    if (year === 2024) {
      holidays.push(
        {
          id: 'mawlid-2024',
          name: 'Mawlid Ennabawi',
          date: '2024-09-16',
          type: 'lunar',
          description: 'Anniversaire du Prophète Mohammed',
          isNational: true
        },
        {
          id: 'eid-fitr-2024',
          name: 'Aïd Al-Fitr',
          date: '2024-04-10',
          type: 'lunar',
          description: 'Fête de la rupture du jeûne',
          isNational: true
        },
        {
          id: 'eid-adha-2024',
          name: 'Aïd Al-Adha',
          date: '2024-06-17',
          type: 'lunar',
          description: 'Fête du sacrifice',
          isNational: true
        }
      );
    } else if (year === 2025) {
      holidays.push(
        {
          id: 'mawlid-2025',
          name: 'Mawlid Ennabawi',
          date: '2025-09-05',
          type: 'lunar',
          description: 'Anniversaire du Prophète Mohammed',
          isNational: true
        },
        {
          id: 'eid-fitr-2025',
          name: 'Aïd Al-Fitr',
          date: '2025-03-31',
          type: 'lunar',
          description: 'Fête de la rupture du jeûne',
          isNational: true
        },
        {
          id: 'eid-adha-2025',
          name: 'Aïd Al-Adha',
          date: '2025-06-07',
          type: 'lunar',
          description: 'Fête du sacrifice',
          isNational: true
        }
      );
    }

    return holidays;
  }

  // Obtenir tous les jours fériés pour une année
  getHolidaysForYear(year: number): Holiday[] {
    return [
      ...this.getFixedHolidays(year),
      ...this.getReligiousHolidays(year)
    ].sort((a, b) => a.date.localeCompare(b.date));
  }

  // Vérifier si une date est un jour férié
  isHoliday(date: Date): Holiday | null {
    const dateStr = date.toISOString().split('T')[0];
    const year = date.getFullYear();
    const holidays = this.getHolidaysForYear(year);
    
    return holidays.find(holiday => holiday.date === dateStr) || null;
  }

  // Obtenir les jours fériés pour une période
  getHolidaysInRange(startDate: Date, endDate: Date): Holiday[] {
    const holidays: Holiday[] = [];
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    for (let year = startYear; year <= endYear; year++) {
      holidays.push(...this.getHolidaysForYear(year));
    }

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    return holidays.filter(holiday => 
      holiday.date >= startStr && holiday.date <= endStr
    );
  }

  // Obtenir le prochain jour férié
  getNextHoliday(): Holiday | null {
    const today = new Date();
    const currentYear = today.getFullYear();
    const nextYear = currentYear + 1;
    
    const holidays = [
      ...this.getHolidaysForYear(currentYear),
      ...this.getHolidaysForYear(nextYear)
    ];

    const todayStr = today.toISOString().split('T')[0];
    
    return holidays.find(holiday => holiday.date > todayStr) || null;
  }
}

export const holidaysService = new HolidaysService();
export default holidaysService;
