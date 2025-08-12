import React, { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import holidaysService from '@/services/holidays.service';
import type { Holiday } from '@/services/holidays.service';
import { apiService } from '@/services/api';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  UserIcon,
  BuildingOfficeIcon,
  WrenchScrewdriverIcon,
  MapIcon
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
}

interface PlanningCalendarProps {
  filters: PlanningFilters;
  onFiltersChange: (filters: PlanningFilters) => void;
}

const PlanningCalendar: React.FC<PlanningCalendarProps> = ({ filters, onFiltersChange }) => {
  const [assignments, setAssignments] = useState<GuardAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());

  useEffect(() => {
    loadPlanningData();
  }, [filters]);

  const loadPlanningData = async () => {
    setIsLoading(true);
    try {
      // Fetch assignments from backend instead of using mock data
      const params = {
        siteId: filters.siteId,
        secteurId: filters.secteurId,
        serviceId: filters.serviceId,
        from: filters.startDate.toISOString().split('T')[0],
        to: filters.endDate.toISOString().split('T')[0]
      };
      const res = await apiService.getPlanningAssignments(params as any);
      const data = (res.data as any[]) || [];

      // Map backend records (already aligned) into state
      const backendAssignments: GuardAssignment[] = data.map((a: any) => ({
        id: a.id || a._id || a.gardeId,
        date: a.date,
        type: a.type,
        user: {
          id: a.user?.id || a.user?._id || a.utilisateur?._id,
          firstName: a.user?.firstName || a.utilisateur?.firstName,
          lastName: a.user?.lastName || a.utilisateur?.lastName,
          email: a.user?.email || a.utilisateur?.email
        },
        site: { id: a.site?.id || a.site?._id || a.site, name: a.site?.name },
        secteur: { id: a.secteur?.id || a.secteur?._id || a.secteur, name: a.secteur?.name },
        service: { id: a.service?.id || a.service?._id || a.service, name: a.service?.name },
        shift: a.shift || 'weekend'
      }));

      // Apply client-side filters as a safeguard
      let filtered = backendAssignments;
      if (filters.siteId) filtered = filtered.filter(a => String(a.site.id) === String(filters.siteId));
      if (filters.secteurId) filtered = filtered.filter(a => String(a.secteur.id) === String(filters.secteurId));
      if (filters.serviceId) filtered = filtered.filter(a => String(a.service.id) === String(filters.serviceId));

      setAssignments(filtered);
    } catch (error) {
      console.error('Erreur chargement planning:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getWeekDays = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay() + 1); // Lundi

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getAssignmentsForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return assignments.filter(a => a.date === dateStr);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newDate);
  };

  const weekDays = getWeekDays(currentWeek);
  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

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
              onClick={() => navigateWeek('prev')}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>

            <span className="text-sm font-medium text-gray-700 px-3">
              {weekDays[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - {' '}
              {weekDays[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateWeek('next')}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card.Header>

      <Card.Body>
        <div className="grid grid-cols-7 gap-1">
          {/* En-têtes des jours */}
          {dayNames.map((day, index) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 border-b">
              {day}
            </div>
          ))}

          {/* Jours de la semaine */}
          {weekDays.map((date, index) => {
            const dayAssignments = getAssignmentsForDate(date);
            const isToday = formatDate(date) === formatDate(new Date());
            const isWeekend = date.getDay() === 0 || date.getDay() === 6; // Dimanche ou Samedi
            const hasAstreinte = dayAssignments.length > 0;
            const holiday = holidaysService.isHoliday(date);

            return (
              <div
                key={index}
                className={`min-h-32 p-2 border-r border-b ${
                  isToday ? 'bg-ocp-primary/10' :
                  holiday ? 'bg-red-50' :
                  isWeekend ? (hasAstreinte ? 'bg-orange-50' : 'bg-gray-50') :
                  'bg-white'
                }`}
              >
                <div className={`text-sm font-medium mb-2 ${
                  isToday ? 'text-ocp-primary font-bold' :
                  holiday ? 'text-red-600 font-medium' :
                  isWeekend ? 'text-orange-600 font-medium' :
                  'text-gray-900'
                }`}>
                  {date.getDate()}
                  {holiday && (
                    <div className="text-xs text-red-500 mt-1 font-medium">
                      🇲🇦 {holiday.name}
                    </div>
                  )}
                  {isWeekend && !hasAstreinte && !holiday && (
                    <div className="text-xs text-gray-400 mt-1">Pas d'astreinte</div>
                  )}
                </div>

                <div className="space-y-1">
                  {dayAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className={`text-xs p-1 rounded ${
                        assignment.type === 'ingenieur'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      <div className="font-medium">
                        {assignment.user.firstName} {assignment.user.lastName}
                      </div>
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
    </Card>
  );
};

export default PlanningCalendar;
