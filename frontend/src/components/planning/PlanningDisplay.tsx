import React, { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import {
  CalendarDaysIcon,
  UserGroupIcon,
  MapPinIcon,
  ClockIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

interface PlanningEntry {
  id: string;
  date: string;
  weekend: boolean;
  holiday: boolean;
  holidayName?: string;
  assignedUsers: string[];
  site: string;
  secteur: string;
  service: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  site: string;
  secteur: string;
  service: string;
}

const PlanningDisplay: React.FC = () => {
  const [planning, setPlanning] = useState<PlanningEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Mock data - replace with API calls
  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = () => {
    // Mock planning data
    const mockPlanning: PlanningEntry[] = [
      {
        id: '1',
        date: '2024-01-20',
        weekend: true,
        holiday: false,
        assignedUsers: ['user1', 'user2'],
        site: 'Khouribga',
        secteur: 'Production',
        service: 'Maintenance Électrique',
      },
      {
        id: '2',
        date: '2024-01-21',
        weekend: true,
        holiday: false,
        assignedUsers: ['user1', 'user2'],
        site: 'Khouribga',
        secteur: 'Production',
        service: 'Maintenance Électrique',
      },
      {
        id: '3',
        date: '2024-01-27',
        weekend: true,
        holiday: false,
        assignedUsers: ['user3', 'user4'],
        site: 'Safi',
        secteur: 'Chimie',
        service: 'Maintenance Mécanique',
      },
      {
        id: '4',
        date: '2024-01-28',
        weekend: true,
        holiday: false,
        assignedUsers: ['user3', 'user4'],
        site: 'Safi',
        secteur: 'Chimie',
        service: 'Maintenance Mécanique',
      },
      {
        id: '5',
        date: '2024-02-03',
        weekend: true,
        holiday: false,
        assignedUsers: ['user5', 'user6'],
        site: 'Jorf Lasfar',
        secteur: 'Engrais',
        service: 'Maintenance Instrumentation',
      },
      {
        id: '6',
        date: '2024-02-04',
        weekend: true,
        holiday: false,
        assignedUsers: ['user5', 'user6'],
        site: 'Jorf Lasfar',
        secteur: 'Engrais',
        service: 'Maintenance Instrumentation',
      },
    ];

    // Mock users data
    const mockUsers: User[] = [
      {
        id: 'user1',
        firstName: 'Ahmed',
        lastName: 'Benali',
        role: 'ingenieur',
        site: 'Khouribga',
        secteur: 'Production',
        service: 'Maintenance Électrique',
      },
      {
        id: 'user2',
        firstName: 'Fatima',
        lastName: 'Zahra',
        role: 'collaborateur',
        site: 'Khouribga',
        secteur: 'Production',
        service: 'Maintenance Électrique',
      },
      {
        id: 'user3',
        firstName: 'Mohammed',
        lastName: 'Alaoui',
        role: 'ingenieur',
        site: 'Safi',
        secteur: 'Chimie',
        service: 'Maintenance Mécanique',
      },
      {
        id: 'user4',
        firstName: 'Amina',
        lastName: 'Tazi',
        role: 'collaborateur',
        site: 'Safi',
        secteur: 'Chimie',
        service: 'Maintenance Mécanique',
      },
      {
        id: 'user5',
        firstName: 'Hassan',
        lastName: 'El Fassi',
        role: 'ingenieur',
        site: 'Jorf Lasfar',
        secteur: 'Engrais',
        service: 'Maintenance Instrumentation',
      },
      {
        id: 'user6',
        firstName: 'Khadija',
        lastName: 'Bennani',
        role: 'collaborateur',
        site: 'Jorf Lasfar',
        secteur: 'Engrais',
        service: 'Maintenance Instrumentation',
      },
    ];

    setPlanning(mockPlanning);
    setUsers(mockUsers);
    setIsLoading(false);
  };

  const isWeekend = (date: string): boolean => {
    const day = new Date(date).getDay();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  };

  const isHoliday = (date: string): boolean => {
    // Mock holidays - replace with actual holiday API
    const holidays = [
      '2024-01-01', // Nouvel An
      '2024-01-11', // Manifeste de l'Indépendance
      '2024-05-01', // Fête du Travail
      '2024-07-30', // Fête du Trône
      '2024-08-14', // Oued Ed-Dahab
      '2024-08-20', // Révolution du Roi et du Peuple
      '2024-08-21', // Fête de la Jeunesse
      '2024-11-06', // Marche Verte
      '2024-11-18', // Fête de l'Indépendance
    ];
    return holidays.includes(date);
  };

  const getHolidayName = (date: string): string => {
    const holidayNames: Record<string, string> = {
      '2024-01-01': 'Nouvel An',
      '2024-01-11': 'Manifeste de l\'Indépendance',
      '2024-05-01': 'Fête du Travail',
      '2024-07-30': 'Fête du Trône',
      '2024-08-14': 'Oued Ed-Dahab',
      '2024-08-20': 'Révolution du Roi et du Peuple',
      '2024-08-21': 'Fête de la Jeunesse',
      '2024-11-06': 'Marche Verte',
      '2024-11-18': 'Fête de l\'Indépendance',
    };
    return holidayNames[date] || '';
  };

  const getUserName = (userId: string): string => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Utilisateur inconnu';
  };

  const getUserRole = (userId: string): string => {
    const user = users.find(u => u.id === userId);
    return user ? user.role : '';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString('fr-FR', options);
  };

  const formatShortDate = (dateString: string): string => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    };
    return date.toLocaleDateString('fr-FR', options);
  };

  const getMonthName = (month: number): string => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[month];
  };

  const filteredPlanning = planning.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate.getMonth() === selectedMonth && entryDate.getFullYear() === selectedYear;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocp-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Planning Astreinte</h1>
            <p className="text-gray-600 mt-2">
              Weekends et jours fériés marocains - Permanence 24h/24
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Mois:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocp-primary"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>{getMonthName(i)}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Année:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocp-primary"
              >
                {Array.from({ length: 3 }, (_, i) => (
                  <option key={i} value={new Date().getFullYear() + i}>
                    {new Date().getFullYear() + i}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <Card>
        <Card.Header>
          <h3 className="text-lg font-medium text-gray-900">Légende</h3>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
              <span className="text-sm text-gray-600">Ingénieurs de garde</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
              <span className="text-sm text-gray-600">Collaborateurs de garde</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
              <span className="text-sm text-gray-600">Jours fériés marocains</span>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-500">
            <p>• Astreinte weekend (Samedi & Dimanche) - 24h/24</p>
            <p>• Jours fériés marocains - 24h/24</p>
            <p>• Permanence technique continue</p>
          </div>
        </Card.Body>
      </Card>

      {/* Planning Grid */}
      {filteredPlanning.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPlanning.map((entry) => (
            <Card key={entry.id} className="hover:shadow-lg transition-shadow">
              <Card.Header>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CalendarDaysIcon className="h-5 w-5 text-ocp-primary" />
                    <h3 className="text-lg font-medium text-gray-900">
                      {formatShortDate(entry.date)}
                    </h3>
                  </div>
                  <div className="flex space-x-2">
                    {entry.weekend && (
                      <Badge variant="info" className="text-xs">
                        Weekend
                      </Badge>
                    )}
                    {entry.holiday && (
                      <Badge variant="warning" className="text-xs">
                        {entry.holidayName || 'Férié'}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 mt-2 text-sm text-gray-500">
                  <MapPinIcon className="h-4 w-4" />
                  <span>{entry.site} • {entry.secteur}</span>
                </div>
                <div className="flex items-center space-x-2 mt-1 text-sm text-gray-500">
                  <WrenchScrewdriverIcon className="h-4 w-4" />
                  <span>{entry.service}</span>
                </div>
              </Card.Header>
              <Card.Body>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Équipe de garde:</span>
                    <div className="flex items-center space-x-2">
                      <ClockIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-500">24h/24</span>
                    </div>
                  </div>
                  
                  {entry.assignedUsers.map((userId) => {
                    const user = users.find(u => u.id === userId);
                    const isIngenieur = user?.role === 'ingenieur';
                    
                    return (
                      <div 
                        key={userId} 
                        className={`flex items-center space-x-3 p-3 rounded-lg ${
                          isIngenieur ? 'bg-blue-50 border border-blue-200' : 'bg-green-50 border border-green-200'
                        }`}
                      >
                        <UserGroupIcon className={`h-4 w-4 ${
                          isIngenieur ? 'text-blue-500' : 'text-green-500'
                        }`} />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">
                            {getUserName(userId)}
                          </span>
                          <Badge role={getUserRole(userId)} className="ml-2 text-xs" />
                        </div>
                      </div>
                    );
                  })}
                  
                  {entry.assignedUsers.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">Aucun utilisateur assigné</p>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <Card.Body>
            <div className="text-center py-8">
              <CalendarDaysIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                Aucun planning d'astreinte pour {getMonthName(selectedMonth)} {selectedYear}
              </p>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Summary */}
      <Card>
        <Card.Header>
          <h3 className="text-lg font-medium text-gray-900">Résumé du mois</h3>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {filteredPlanning.filter(entry => entry.weekend && !entry.holiday).length}
              </div>
              <div className="text-sm text-gray-500">Weekends</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {filteredPlanning.filter(entry => entry.holiday).length}
              </div>
              <div className="text-sm text-gray-500">Jours fériés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredPlanning.length}
              </div>
              <div className="text-sm text-gray-500">Total astreintes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {filteredPlanning.reduce((acc, entry) => acc + entry.assignedUsers.length, 0)}
              </div>
              <div className="text-sm text-gray-500">Assignations</div>
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default PlanningDisplay;