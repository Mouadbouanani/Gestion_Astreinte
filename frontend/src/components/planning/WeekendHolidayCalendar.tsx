import React, { useState, useEffect, useRef } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import weekendHolidayService from '@/services/weekend-holiday.service';
import type { WeekendHolidayPlanning } from '@/services/weekend-holiday.service';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  InformationCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

interface WeekendHolidayCalendarProps {
  secteurId?: string;
  startDate?: Date;
  endDate?: Date;
}

const WeekendHolidayCalendar: React.FC<WeekendHolidayCalendarProps> = ({
  secteurId,
  startDate,
  endDate
}) => {
  const [plannings, setPlannings] = useState<WeekendHolidayPlanning[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Stabiliser les bornes de période pour éviter des re-renders infinis
  const stableStartRef = useRef<Date>(startDate ?? new Date());
  const stableEndRef = useRef<Date>(
    endDate ?? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
  );

  useEffect(() => {
    // Éviter les appels si aucun secteur n'est fourni (préviens boucles)
    if (!secteurId) return;
    loadWeekendHolidayPlanning();
    // Ne dépendre que de l'identifiant secteur pour éviter la recréation
  }, [secteurId]);

  const loadWeekendHolidayPlanning = async () => {
    setLoading(true);
    try {
      // Données de test temporaires en attendant l'API
      const testData: WeekendHolidayPlanning[] = [
        {
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
        },
        {
          id: '2',
          date: '2024-01-27',
          type: 'weekend',
          garde: {
            id: '2',
            firstName: 'Fatima',
            lastName: 'Zahra',
            phone: '+212 6 98 76 54 32',
            email: 'fatima.zahra@ocp.ma',
            role: 'collaborateur',
            address: '456 Avenue Mohammed V, Rabat'
          },
          secteur: 'Secteur Production',
          heureDebut: '18:00',
          heureFin: '08:00',
          statut: 'planifie'
        }
      ];
      
      setPlannings(testData);
      
      // TODO: Remplacer par l'appel API réel
      // const data = await weekendHolidayService.getWeekendHolidayPlanning(
      //   stableStartRef.current,
      //   stableEndRef.current,
      //   secteurId
      // );
      // setPlannings(data);
    } catch (error) {
      console.error('Erreur chargement planning weekend/férié:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    // Ajouter les jours du mois précédent pour remplir la première semaine
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month, -i));
    }

    // Ajouter tous les jours du mois
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    // Ajouter les jours du mois suivant pour remplir la dernière semaine
    const lastDayOfWeek = lastDay.getDay();
    for (let i = 1; i <= 6 - lastDayOfWeek; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  };

  const getPlanningForDate = (date: Date): WeekendHolidayPlanning | null => {
    const dateString = date.toISOString().split('T')[0];
    return plannings.find(p => p.date === dateString) || null;
  };

  const isWeekend = (date: Date): boolean => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const isHoliday = (date: Date): boolean => {
    return weekendHolidayService.isHoliday(date);
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentMonth.getMonth() && 
           date.getFullYear() === currentMonth.getFullYear();
  };

  const getDateClass = (date: Date): string => {
    let classes = 'p-2 text-center cursor-pointer hover:bg-gray-100 transition-colors';
    
    if (!isCurrentMonth(date)) {
      classes += ' text-gray-400';
    } else if (isToday(date)) {
      classes += ' bg-blue-100 text-blue-800 font-bold';
    } else if (isHoliday(date)) {
      classes += ' bg-red-100 text-red-800 font-semibold';
    } else if (isWeekend(date)) {
      classes += ' bg-orange-100 text-orange-800 font-semibold';
    }

    const planning = getPlanningForDate(date);
    if (planning) {
      classes += ' border-2 border-green-500';
    }

    return classes;
  };

  const getDateLabel = (date: Date): string => {
    if (isHoliday(date)) {
      return '🎉';
    } else if (isWeekend(date)) {
      return '🏠';
    }
    return '';
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const contacterGarde = (planning: WeekendHolidayPlanning, methode: 'phone' | 'email' | 'address') => {
    switch (methode) {
      case 'phone':
        window.open(`tel:${planning.garde.phone}`);
        break;
      case 'email':
        window.open(`mailto:${planning.garde.email}`);
        break;
      case 'address':
        if (planning.garde.address) {
          const adresse = encodeURIComponent(planning.garde.address);
          window.open(`https://www.google.com/maps/search/?api=1&query=${adresse}`);
        }
        break;
    }
  };

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  if (loading) {
    return (
      <Card>
        <Card.Body>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Chargement du planning...</span>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête du calendrier */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigateMonth('prev')}
          className="p-2"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Button>
        
        <h3 className="text-lg font-semibold text-gray-900">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        
        <Button
          variant="ghost"
          onClick={() => navigateMonth('next')}
          className="p-2"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </Button>
      </div>

      {/* Légende */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-orange-100 border border-orange-300"></div>
          <span>Weekend</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-100 border border-red-300"></div>
          <span>Jour Férié</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-100 border-2 border-green-500"></div>
          <span>Garde Planifiée</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-100 border border-blue-300"></div>
          <span>Aujourd'hui</span>
        </div>
      </div>

      {/* Calendrier */}
      <Card>
        <Card.Body>
          <div className="grid grid-cols-7 gap-1">
            {/* En-têtes des jours */}
            {weekDays.map(day => (
              <div key={day} className="p-2 text-center font-semibold text-gray-700 bg-gray-50">
                {day}
              </div>
            ))}

            {/* Jours du mois */}
            {getMonthDays(currentMonth).map((date, index) => {
              const planning = getPlanningForDate(date);
              
              return (
                <div
                  key={index}
                  className={getDateClass(date)}
                  onClick={() => setSelectedDate(date)}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-sm">{date.getDate()}</span>
                    <span className="text-xs">{getDateLabel(date)}</span>
                    {planning && (
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-1"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card.Body>
      </Card>

      {/* Détails de la date sélectionnée */}
      {selectedDate && (
        <Card>
          <Card.Header>
            <h4 className="text-lg font-medium text-gray-900">
              Détails pour le {selectedDate.toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </h4>
          </Card.Header>
          <Card.Body>
            {(() => {
              const planning = getPlanningForDate(selectedDate);
              
              if (!planning) {
                return (
                  <div className="text-center py-4 text-gray-500">
                    {isWeekend(selectedDate) || isHoliday(selectedDate) ? (
                      <div>
                        <p>Aucune garde planifiée pour cette date</p>
                        <p className="text-sm mt-2">
                          {isHoliday(selectedDate) ? 'Jour férié' : 'Weekend'}
                        </p>
                      </div>
                    ) : (
                      <p>Date normale (pas de garde nécessaire)</p>
                    )}
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <UserIcon className="h-8 w-8 text-green-600" />
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900">
                          {planning.garde.firstName} {planning.garde.lastName}
                        </h5>
                        <p className="text-sm text-gray-600 capitalize">
                          {planning.garde.role} • {planning.secteur}
                        </p>
                        <p className="text-sm text-gray-500">
                          {planning.heureDebut} - {planning.heureFin}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Button
                      variant="primary"
                      className="w-full justify-start"
                      onClick={() => contacterGarde(planning, 'phone')}
                    >
                      <PhoneIcon className="h-4 w-4 mr-2" />
                      Appeler
                    </Button>
                    
                    <Button
                      variant="secondary"
                      className="w-full justify-start"
                      onClick={() => contacterGarde(planning, 'email')}
                    >
                      <EnvelopeIcon className="h-4 w-4 mr-2" />
                      Email
                    </Button>
                    
                    {planning.garde.address && (
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => contacterGarde(planning, 'address')}
                      >
                        <InformationCircleIcon className="h-4 w-4 mr-2" />
                        Adresse
                      </Button>
                    )}
                  </div>

                  {planning.garde.address && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600">
                        <strong>Adresse :</strong> {planning.garde.address}
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default WeekendHolidayCalendar;
