import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';
import type { User, Planning } from '@/types';
import {
  UserGroupIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon,
  EnvelopeIcon,
  PhoneIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface GardeAssignment {
  id: string;
  date: string;
  ingenieur: User;
  type: 'weekend' | 'holiday';
  status: 'planned' | 'confirmed' | 'absent' | 'replaced';
  replacement?: User;
}

const MesIngenieurs: React.FC = () => {
  const { user } = useAuth();
  const [ingenieurs, setIngenieurs] = useState<User[]>([]);
  const [gardes, setGardes] = useState<GardeAssignment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [showGardeModal, setShowGardeModal] = useState(false);

  useEffect(() => {
    if (user?.role === 'chef_secteur' && user.secteur?._id) {
      loadData();
    } else if (user?.role === 'chef_secteur' && !user.secteur) {
      setIsLoading(false);
    }
  }, [user?.role, user?.secteur?._id, selectedMonth]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load engineers in this secteur
      if (user?.secteur?._id) {
        try {
          const ingenieurResponse = await apiService.getUsersBySecteur(user.secteur._id, 'ingenieur');
          setIngenieurs(ingenieurResponse.data || []);
        } catch (ingenieurError) {
          console.log('Engineers not loaded:', ingenieurError);
          setIngenieurs([]);
        }
      }

      // Load garde assignments for the selected month
      await loadGardeAssignments();

    } catch (error) {
      console.error('Error loading data:', error);
      // Don't show error toast, just log it
    } finally {
      setIsLoading(false);
    }
  };

  const loadGardeAssignments = async () => {
    try {
      // Generate mock garde assignments for weekends and holidays
      const assignments: GardeAssignment[] = [];
      const startDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      const endDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
      
      // Get weekends in the month
      const weekends = getWeekendsInMonth(startDate, endDate);
      const holidays = getHolidaysInMonth(startDate, endDate);
      
      // Assign engineers to weekends and holidays
      let engineerIndex = 0;
      
      [...weekends, ...holidays].forEach((date, index) => {
        if (ingenieurs.length > 0) {
          const engineer = ingenieurs[engineerIndex % ingenieurs.length];
          assignments.push({
            id: `garde-${date.toISOString()}-${engineer._id}`,
            date: date.toISOString().split('T')[0],
            ingenieur: engineer,
            type: holidays.some(h => h.toDateString() === date.toDateString()) ? 'holiday' : 'weekend',
            status: 'planned'
          });
          engineerIndex++;
        }
      });
      
      setGardes(assignments);
    } catch (error) {
      console.error('Error loading garde assignments:', error);
    }
  };

  const getWeekendsInMonth = (startDate: Date, endDate: Date): Date[] => {
    const weekends: Date[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
        weekends.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    }
    
    return weekends;
  };

  const getHolidaysInMonth = (startDate: Date, endDate: Date): Date[] => {
    // Mock holidays - in real implementation, this would come from a holidays service
    const holidays: Date[] = [];
    const year = startDate.getFullYear();
    const month = startDate.getMonth();
    
    // Add some mock holidays
    if (month === 0) { // January
      holidays.push(new Date(year, 0, 1)); // New Year
    }
    if (month === 4) { // May
      holidays.push(new Date(year, 4, 1)); // Labor Day
    }
    if (month === 6) { // July
      holidays.push(new Date(year, 6, 30)); // Throne Day
    }
    
    return holidays.filter(h => h >= startDate && h <= endDate);
  };

  const filteredIngenieurs = ingenieurs.filter(ing =>
    `${ing.firstName} ${ing.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ing.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateGarde = () => {
    setShowGardeModal(true);
  };

  const handleAssignGarde = (ingenieurId: string, date: string) => {
    // Implementation for assigning garde
    toast.success('Garde assignée avec succès');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planned':
        return <Badge variant="info">Planifiée</Badge>;
      case 'confirmed':
        return <Badge variant="success">Confirmée</Badge>;
      case 'absent':
        return <Badge variant="error">Absent</Badge>;
      case 'replaced':
        return <Badge variant="warning">Remplacée</Badge>;
      default:
        return <Badge variant="info">Planifiée</Badge>;
    }
  };

  if (!user || user.role !== 'chef_secteur') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h2>
          <p className="text-gray-600">
            Cette page est réservée aux chefs de secteur.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocp-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes Ingénieurs</h1>
          <p className="text-gray-600">Gestion des ingénieurs et de leurs gardes d'astreinte</p>
        </div>
        <Button onClick={handleCreateGarde} className="flex items-center space-x-2">
          <PlusIcon className="h-5 w-5" />
          <span>Planifier Garde</span>
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <Card.Body>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Rechercher un ingénieur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <input
                type="month"
                value={`${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`}
                onChange={(e) => {
                  const [year, month] = e.target.value.split('-');
                  setSelectedMonth(new Date(parseInt(year), parseInt(month) - 1));
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocp-primary focus:border-transparent"
              />
            </div>
          </div>
        </Card.Body>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingénieurs List */}
        <Card>
          <Card.Header>
            <div className="flex items-center space-x-3">
              <UserGroupIcon className="h-6 w-6 text-ocp-primary" />
              <h2 className="text-xl font-semibold text-gray-900">Ingénieurs</h2>
              <Badge variant="info">{filteredIngenieurs.length}</Badge>
            </div>
          </Card.Header>
          <Card.Body>
            {filteredIngenieurs.length === 0 ? (
              <div className="text-center py-8">
                <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun ingénieur trouvé</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredIngenieurs.map((ingenieur) => (
                  <div key={ingenieur._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-ocp-primary flex items-center justify-center">
                          <span className="text-white font-medium">
                            {ingenieur.firstName?.[0]}{ingenieur.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {ingenieur.firstName} {ingenieur.lastName}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <EnvelopeIcon className="h-4 w-4" />
                              <span>{ingenieur.email}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <PhoneIcon className="h-4 w-4" />
                              <span>{ingenieur.phone}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={ingenieur.isActive ? 'success' : 'error'}>
                          {ingenieur.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <CalendarDaysIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Gardes Planning */}
        <Card>
          <Card.Header>
            <div className="flex items-center space-x-3">
              <CalendarDaysIcon className="h-6 w-6 text-ocp-primary" />
              <h2 className="text-xl font-semibold text-gray-900">Planning des Gardes</h2>
              <Badge variant="info">{gardes.length}</Badge>
            </div>
          </Card.Header>
          <Card.Body>
            {gardes.length === 0 ? (
              <div className="text-center py-8">
                <CalendarDaysIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune garde planifiée ce mois</p>
              </div>
            ) : (
              <div className="space-y-3">
                {gardes.map((garde) => (
                  <div key={garde.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {new Date(garde.date).toLocaleDateString('fr-FR', { 
                              weekday: 'long', 
                              day: 'numeric', 
                              month: 'short' 
                            })}
                          </span>
                          <Badge variant={garde.type === 'holiday' ? 'warning' : 'info'}>
                            {garde.type === 'holiday' ? 'Jour férié' : 'Weekend'}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>{garde.ingenieur.firstName} {garde.ingenieur.lastName}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(garde.status)}
                        <Button variant="ghost" size="sm">
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default MesIngenieurs;
