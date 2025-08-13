import React, { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import {
  CalendarDaysIcon,
  UserGroupIcon,
  ArrowRightIcon,
  RefreshIcon,
  PlusIcon,
  TrashIcon,
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
  indisponibilites: string[];
}

const PlanningManagement: React.FC = () => {
  const [planning, setPlanning] = useState<PlanningEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showUserSelector, setShowUserSelector] = useState(false);

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
        indisponibilites: ['2024-01-25', '2024-01-26'],
      },
      {
        id: 'user2',
        firstName: 'Fatima',
        lastName: 'Zahra',
        role: 'collaborateur',
        site: 'Khouribga',
        secteur: 'Production',
        service: 'Maintenance Électrique',
        indisponibilites: [],
      },
      {
        id: 'user3',
        firstName: 'Mohammed',
        lastName: 'Alaoui',
        role: 'ingenieur',
        site: 'Safi',
        secteur: 'Chimie',
        service: 'Maintenance Mécanique',
        indisponibilites: ['2024-01-30'],
      },
      {
        id: 'user4',
        firstName: 'Amina',
        lastName: 'Tazi',
        role: 'collaborateur',
        site: 'Safi',
        secteur: 'Chimie',
        service: 'Maintenance Mécanique',
        indisponibilites: [],
      },
    ];

    setPlanning(mockPlanning);
    setUsers(mockUsers);
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

  const moveUserToEndOfRotation = (userId: string, fromDate: string) => {
    setPlanning(prev => {
      const newPlanning = [...prev];
      
      // Find the current assignment
      const currentEntry = newPlanning.find(entry => 
        entry.assignedUsers.includes(userId) && entry.date >= fromDate
      );
      
      if (currentEntry) {
        // Remove user from current assignment
        currentEntry.assignedUsers = currentEntry.assignedUsers.filter(id => id !== userId);
        
        // Find the last weekend in the planning
        const lastWeekend = newPlanning
          .filter(entry => entry.weekend || entry.holiday)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        
        if (lastWeekend) {
          // Add user to the last weekend
          lastWeekend.assignedUsers.push(userId);
        }
      }
      
      return newPlanning;
    });
  };

  const recreateRotationOrder = () => {
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const newPlanning = [...planning];
      
      // Simple rotation algorithm - replace with actual business logic
      const availableUsers = users.filter(user => 
        !user.indisponibilites.some(indispo => 
          newPlanning.some(entry => entry.date === indispo)
        )
      );
      
      let userIndex = 0;
      newPlanning.forEach(entry => {
        if (entry.weekend || entry.holiday) {
          // Assign 2 users per weekend/holiday
          entry.assignedUsers = [];
          for (let i = 0; i < 2 && i < availableUsers.length; i++) {
            entry.assignedUsers.push(availableUsers[userIndex % availableUsers.length].id);
            userIndex++;
          }
        }
      });
      
      setPlanning(newPlanning);
      setIsLoading(false);
      alert('Rotation recréée avec succès');
    }, 1000);
  };

  const addUserToDate = (date: string, userId: string) => {
    setPlanning(prev => {
      const newPlanning = [...prev];
      const entry = newPlanning.find(e => e.date === date);
      
      if (entry && !entry.assignedUsers.includes(userId)) {
        entry.assignedUsers.push(userId);
      }
      
      return newPlanning;
    });
  };

  const removeUserFromDate = (date: string, userId: string) => {
    setPlanning(prev => {
      const newPlanning = [...prev];
      const entry = newPlanning.find(e => e.date === date);
      
      if (entry) {
        entry.assignedUsers = entry.assignedUsers.filter(id => id !== userId);
      }
      
      return newPlanning;
    });
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion Planning Astreinte</h1>
            <p className="text-gray-600 mt-2">
              Gestion des astreintes weekends et jours fériés marocains
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={recreateRotationOrder}
              disabled={isLoading}
            >
              <RefreshIcon className="h-5 w-5 mr-2" />
              {isLoading ? 'Recréation...' : 'Recréer Rotation'}
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowUserSelector(true)}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Ajouter Utilisateur
            </Button>
          </div>
        </div>
      </div>

      {/* Planning Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {planning.map((entry) => (
          <Card key={entry.id} className="hover:shadow-lg transition-shadow">
            <Card.Header>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {formatDate(entry.date)}
                </h3>
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
              <p className="text-sm text-gray-500 mt-1">
                {entry.site} • {entry.secteur} • {entry.service}
              </p>
            </Card.Header>
            <Card.Body>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Utilisateurs assignés:</span>
                  <span className="text-sm text-gray-500">
                    {entry.assignedUsers.length}/2
                  </span>
                </div>
                
                {entry.assignedUsers.map((userId) => (
                  <div key={userId} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <UserGroupIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {getUserName(userId)}
                      </span>
                      <Badge role={getUserRole(userId)} className="text-xs" />
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveUserToEndOfRotation(userId, entry.date)}
                        className="text-xs p-1"
                        title="Déplacer à la fin de rotation"
                      >
                        <ArrowRightIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUserFromDate(entry.date, userId)}
                        className="text-xs p-1 text-red-600 hover:text-red-700"
                        title="Retirer de cette date"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {entry.assignedUsers.length < 2 && (
                  <div className="text-center py-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedDate(entry.date);
                        setShowUserSelector(true);
                      }}
                      className="w-full"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Ajouter un utilisateur
                    </Button>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        ))}
      </div>

      {/* User Selector Modal */}
      {showUserSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Sélectionner des utilisateurs
              {selectedDate && ` pour le ${formatDate(selectedDate)}`}
            </h3>
            
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <UserGroupIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {user.site} • {user.secteur} • {user.service}
                      </p>
                      {user.indisponibilites.length > 0 && (
                        <p className="text-xs text-red-600">
                          Indisponible: {user.indisponibilites.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge role={user.role} />
                    {selectedDate && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          addUserToDate(selectedDate, user.id);
                          setShowUserSelector(false);
                          setSelectedDate('');
                        }}
                        disabled={user.indisponibilites.includes(selectedDate)}
                      >
                        {user.indisponibilites.includes(selectedDate) ? 'Indisponible' : 'Assigner'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end mt-6">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowUserSelector(false);
                  setSelectedDate('');
                }}
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanningManagement;