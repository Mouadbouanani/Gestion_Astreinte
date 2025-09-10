import React, { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ContactInfo from './ContactInfo';
import holidaysService from '@/services/holidays.service';
// import type { Holiday } from '@/services/holidays.service';
import type { UserRole } from '@/types';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  // UserIcon,
  // BuildingOfficeIcon,
  // WrenchScrewdriverIcon,
  // MapIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface PlanningFilters {
  siteId?: string;
  secteurId?: string;
  serviceId?: string;
  startDate: Date;
  endDate: Date;
}

interface GuardAssignment {
  id: string;
  date: string;
  type: 'ingenieur' | 'collaborateur';
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    role: UserRole;
  };
  site: {
    id: string;
    name: string;
  };
  secteur: {
    id: string;
    name: string;
  };
  service: {
    id: string;
    name: string;
  };
  shift: 'day' | 'night' | 'weekend';
  hasPanne?: boolean;
  panneDetails?: {
    type: string;
    description: string;
    urgence: string;
  };
}

interface PlanningCalendarProps {
  filters: PlanningFilters;
  onFiltersChange: (filters: PlanningFilters) => void;
  selectedServiceId?: string;
  showOnlyWithPanne?: boolean;
}

const PlanningCalendar: React.FC<PlanningCalendarProps> = ({ 
  filters, 
  // onFiltersChange, 
  selectedServiceId,
  showOnlyWithPanne = false 
}) => {
  const [assignments, setAssignments] = useState<GuardAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedAssignment, setSelectedAssignment] = useState<GuardAssignment | null>(null);

  useEffect(() => {
    loadPlanningData();
  }, [filters, selectedServiceId, showOnlyWithPanne]);

  const loadPlanningData = async () => {
    setIsLoading(true);
    try {
      // Simulation de données d'astreinte - WEEKENDS UNIQUEMENT
      const today = new Date();
      const getNextWeekend = (startDate: Date) => {
        const dates = [];
        const current = new Date(startDate);

        // Trouver les prochains weekends (samedi et dimanche)
        for (let i = 0; i < 14; i++) { // 2 semaines
          const date = new Date(current.getTime() + i * 24 * 60 * 60 * 1000);
          const dayOfWeek = date.getDay();
          if (dayOfWeek === 0 || dayOfWeek === 6) { // Dimanche (0) ou Samedi (6)
            dates.push(date);
          }
        }
        return dates;
      };

      const weekendDates = getNextWeekend(today);
      const mockAssignments: GuardAssignment[] = [];

      // Astreintes pour chaque weekend
      weekendDates.forEach((date, index) => {
        const isEvenWeekend = Math.floor(index / 2) % 2 === 0;

        if (date.getDay() === 6) { // Samedi
          mockAssignments.push({
            id: `weekend-${index}-ing`,
            date: formatDate(date),
            type: 'ingenieur',
            user: {
              id: `ing-${index}`,
              firstName: isEvenWeekend ? 'Ahmed' : 'Mohamed',
              lastName: isEvenWeekend ? 'Benali' : 'Tazi',
              email: isEvenWeekend ? 'a.benali@ocp.ma' : 'm.tazi@ocp.ma',
              phone: isEvenWeekend ? '+212 6 12 34 56 78' : '+212 6 87 65 43 21',
              address: isEvenWeekend ? '123 Rue Hassan II, Khouribga' : '456 Avenue Mohammed V, Safi',
              role: 'ingenieur' as UserRole
            },
            site: {
              id: isEvenWeekend ? '1' : '2',
              name: isEvenWeekend ? 'Khouribga' : 'Safi'
            },
            secteur: {
              id: isEvenWeekend ? '1' : '4',
              name: isEvenWeekend ? 'Production' : 'Chimie'
            },
            service: {
              id: isEvenWeekend ? '1' : '7',
              name: isEvenWeekend ? 'Extraction' : 'Réacteurs'
            },
            shift: 'weekend',
            hasPanne: !isEvenWeekend && index < 2, // Réacteurs a une panne
            panneDetails: !isEvenWeekend && index < 2 ? {
              type: 'technique',
              description: 'Panne système de refroidissement',
              urgence: 'haute'
            } : undefined
          });

          mockAssignments.push({
            id: `weekend-${index}-collab`,
            date: formatDate(date),
            type: 'collaborateur',
            user: {
              id: `collab-${index}`,
              firstName: isEvenWeekend ? 'Fatima' : 'Rachid',
              lastName: isEvenWeekend ? 'Alami' : 'Amrani',
              email: isEvenWeekend ? 'f.alami@ocp.ma' : 'r.amrani@ocp.ma',
              phone: isEvenWeekend ? '+212 6 11 22 33 44' : '+212 6 55 66 77 88',
              address: isEvenWeekend ? '789 Boulevard Zerktouni, Khouribga' : '321 Rue Ibn Sina, Safi',
              role: 'collaborateur' as UserRole
            },
            site: {
              id: isEvenWeekend ? '1' : '2',
              name: isEvenWeekend ? 'Khouribga' : 'Safi'
            },
            secteur: {
              id: isEvenWeekend ? '2' : '5',
              name: isEvenWeekend ? 'Maintenance' : 'Utilités'
            },
            service: {
              id: isEvenWeekend ? '4' : '8',
              name: isEvenWeekend ? 'Électricité' : 'Purification'
            },
            shift: 'weekend'
          });
        }

        if (date.getDay() === 0) { // Dimanche
          mockAssignments.push({
            id: `weekend-${index}-ing-dim`,
            date: formatDate(date),
            type: 'ingenieur',
            user: {
              id: `ing-dim-${index}`,
              firstName: isEvenWeekend ? 'Youssef' : 'Hassan',
              lastName: isEvenWeekend ? 'Bennani' : 'Lahlou',
              email: isEvenWeekend ? 'y.bennani@ocp.ma' : 'h.lahlou@ocp.ma',
              phone: isEvenWeekend ? '+212 6 99 88 77 66' : '+212 6 44 33 22 11',
              address: isEvenWeekend ? '147 Avenue des FAR, El Jadida' : '258 Rue Al Massira, Benguerir',
              role: 'ingenieur' as UserRole
            },
            site: {
              id: isEvenWeekend ? '3' : '4',
              name: isEvenWeekend ? 'Jorf Lasfar' : 'Benguerir'
            },
            secteur: {
              id: isEvenWeekend ? '7' : '1',
              name: isEvenWeekend ? 'Phosphorique' : 'Production'
            },
            service: {
              id: isEvenWeekend ? '9' : '1',
              name: isEvenWeekend ? 'Engrais' : 'Extraction'
            },
            shift: 'weekend'
          });

          mockAssignments.push({
            id: `weekend-${index}-collab-dim`,
            date: formatDate(date),
            type: 'collaborateur',
            user: {
              id: `collab-dim-${index}`,
              firstName: isEvenWeekend ? 'Aicha' : 'Khadija',
              lastName: isEvenWeekend ? 'Idrissi' : 'Berrada',
              email: isEvenWeekend ? 'a.idrissi@ocp.ma' : 'k.berrada@ocp.ma',
              phone: isEvenWeekend ? '+212 6 77 88 99 00' : '+212 6 33 44 55 66',
              address: isEvenWeekend ? '369 Quartier Industriel, Khouribga' : '741 Centre Ville, Youssoufia',
              role: 'collaborateur' as UserRole
            },
            site: {
              id: isEvenWeekend ? '1' : '5',
              name: isEvenWeekend ? 'Khouribga' : 'Youssoufia'
            },
            secteur: {
              id: isEvenWeekend ? '3' : '1',
              name: isEvenWeekend ? 'Logistique' : 'Production'
            },
            service: {
              id: isEvenWeekend ? '3' : '2',
              name: isEvenWeekend ? 'Qualité' : 'Traitement'
            },
            shift: 'weekend'
          });
        }
      });

      // Filtrer selon les critères
      let filteredAssignments = mockAssignments;
      
      if (filters.siteId) {
        filteredAssignments = filteredAssignments.filter(a => a.site.id === filters.siteId);
      }
      
      if (filters.secteurId) {
        filteredAssignments = filteredAssignments.filter(a => a.secteur.id === filters.secteurId);
      }
      
      if (filters.serviceId) {
        filteredAssignments = filteredAssignments.filter(a => a.service.id === filters.serviceId);
      }

      // Filtrer par service sélectionné
      if (selectedServiceId) {
        filteredAssignments = filteredAssignments.filter(a => a.service.id === selectedServiceId);
      }

      // Filtrer par pannes
      if (showOnlyWithPanne) {
        filteredAssignments = filteredAssignments.filter(a => a.hasPanne);
      }

      setAssignments(filteredAssignments);
    } catch (error) {
      console.error('Erreur chargement planning:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Premier jour du mois
    const firstDay = new Date(year, month, 1);
    // Dernier jour du mois
    // const lastDay = new Date(year, month + 1, 0);
    
    // Premier lundi de la grille (peut être du mois précédent)
    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Lundi = 0
    startDate.setDate(firstDay.getDate() - daysToSubtract);
    
    // Générer 42 jours (6 semaines)
    const days = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      days.push(day);
    }
    
    return days;
  };

  const formatDate = (date: Date) => {
    // Use a more reliable date formatting method that avoids timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getAssignmentsForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return assignments.filter(a => a.date === dateStr);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentMonth(newDate);
  };

  const monthDays = getMonthDays(currentMonth);
  // const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const shortDayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const currentMonthName = currentMonth.toLocaleDateString('fr-FR', { 
    month: 'long', 
    year: 'numeric' 
  });

  if (isLoading) {
    return (
      <Card>
        <Card.Body>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocp-primary"></div>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CalendarDaysIcon className="h-6 w-6 text-ocp-primary" />
            <h3 className="text-lg font-medium text-gray-900">Astreinte Weekends</h3>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">Samedi & Dimanche</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            
            <span className="text-lg font-medium text-gray-700 px-4 capitalize">
              {currentMonthName}
            </span>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card.Header>
      
      <Card.Body>
        <div className="grid grid-cols-7 gap-1">
          {/* En-têtes des jours */}
          {shortDayNames.map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 border-b bg-gray-50">
              {day}
            </div>
          ))}
          
          {/* Jours du mois */}
          {monthDays.map((date, index) => {
            const dayAssignments = getAssignmentsForDate(date);
            const isToday = formatDate(date) === formatDate(new Date());
            const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
            const isWeekend = date.getDay() === 0 || date.getDay() === 6; // Dimanche ou Samedi
            const hasAstreinte = dayAssignments.length > 0;
            const hasPanne = dayAssignments.some(a => a.hasPanne);
            const holiday = holidaysService.isHoliday(date);

            return (
              <div
                key={index}
                className={`min-h-32 p-2 border-r border-b relative ${
                  !isCurrentMonth ? 'bg-gray-100 text-gray-400' :
                  isToday ? 'bg-ocp-primary/10 ring-2 ring-ocp-primary' :
                  holiday ? 'bg-red-50' :
                  isWeekend ? (hasAstreinte ? 'bg-orange-50' : 'bg-gray-50') :
                  'bg-white'
                } ${hasPanne ? 'ring-2 ring-red-400' : ''}`}
              >
                {hasPanne && (
                  <div className="absolute top-1 right-1">
                    <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
                  </div>
                )}
                
                <div className={`text-sm font-medium mb-2 ${
                  !isCurrentMonth ? 'text-gray-400' :
                  isToday ? 'text-ocp-primary font-bold' :
                  holiday ? 'text-red-600 font-medium' :
                  isWeekend ? 'text-orange-600 font-medium' :
                  'text-gray-900'
                }`}>
                  {date.getDate()}
                  {holiday && isCurrentMonth && (
                    <div className="text-xs text-red-500 mt-1 font-medium">
                      🇲🇦 {holiday.name.length > 15 ? holiday.name.substring(0, 15) + '...' : holiday.name}
                    </div>
                  )}
                  {(isWeekend || holiday) && !hasAstreinte && isCurrentMonth && (
                    <div className="text-xs text-gray-400 mt-1">Pas d'astreinte</div>
                  )}
                </div>
                
                <div className="space-y-1">
                  {dayAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      onClick={() => setSelectedAssignment(assignment)}
                      className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity ${
                        assignment.type === 'ingenieur'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-green-100 text-green-800 border border-green-200'
                      } ${assignment.hasPanne ? 'ring-1 ring-red-400' : ''}`}
                    >
                      {assignment.hasPanne && (
                        <div className="flex items-center mb-1">
                          <span className="text-red-600 text-xs font-bold">🚨</span>
                        </div>
                      )}
                      
                      <div className="font-medium">
                        {assignment.user.firstName} {assignment.user.lastName}
                      </div>
                      
                      {assignment.user.phone && (
                        <div className="text-xs opacity-75 flex items-center">
                          📞 {assignment.user.phone}
                        </div>
                      )}
                      
                      <div className="text-xs opacity-75">
                        {assignment.secteur.name} - {assignment.service.name}
                      </div>
                      
                      <div className="text-xs opacity-75">
                        {assignment.shift === 'day' ? '🌅 Jour' : 
                         assignment.shift === 'night' ? '🌙 Nuit' : '🏖️ Weekend'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card.Body>
      
      {/* Modal de détails du contact */}
      {selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Détails du personnel de garde
              </h3>
              <button
                onClick={() => setSelectedAssignment(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-4">
              <ContactInfo
                user={selectedAssignment.user}
                site={selectedAssignment.site}
                secteur={selectedAssignment.secteur}
                service={selectedAssignment.service}
                type={selectedAssignment.type}
                shift={selectedAssignment.shift}
                hasPanne={selectedAssignment.hasPanne}
                panneDetails={selectedAssignment.panneDetails}
                compact={false}
              />
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  <div><strong>Date de garde:</strong> {new Date(selectedAssignment.date).toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default PlanningCalendar;