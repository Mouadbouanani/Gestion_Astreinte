import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';
import type { User } from '@/types';
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
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface PlanningAssignment {
  id: string;
  date: string;
  collaborateur: User;
  type: 'weekend' | 'holiday';
  shift: 'day' | 'night';
  status: 'planned' | 'confirmed' | 'absent' | 'replaced';
  replacement?: User;
}

const MonEquipe: React.FC = () => {
  const { user } = useAuth();
  const [collaborateurs, setCollaborateurs] = useState<User[]>([]);
  const [planning, setPlanning] = useState<PlanningAssignment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [showPlanningModal, setShowPlanningModal] = useState(false);

  useEffect(() => {
    if (user?.role === 'chef_service' && user.service?._id) {
      loadData();
    } else if (user?.role === 'chef_service' && !user.service) {
      setIsLoading(false);
    }
  }, [user?.role, user?.service?._id, selectedMonth]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load collaborators in this service
      if (user?.service?._id) {
        try {
          const collaborateurResponse = await apiService.getUsersByService(user.service._id, 'collaborateur');
          setCollaborateurs(collaborateurResponse.data || []);
        } catch (collaborateurError) {
          console.log('Collaborators not loaded:', collaborateurError);
          setCollaborateurs([]);
        }
      }

      // Load planning assignments for the selected month
      await loadPlanningAssignments();

    } catch (error) {
      console.error('Error loading data:', error);
      // Don't show error toast, just log it
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlanningAssignments = async () => {
    try {
      // Generate mock planning assignments for weekends and holidays
      const assignments: PlanningAssignment[] = [];
      const startDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      const endDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
      
      // Get weekends in the month
      const weekends = getWeekendsInMonth(startDate, endDate);
      const holidays = getHolidaysInMonth(startDate, endDate);
      
      // Assign collaborators to weekends and holidays (both day and night shifts)
      let collaborateurIndex = 0;
      
      [...weekends, ...holidays].forEach((date) => {
        if (collaborateurs.length > 0) {
          // Day shift
          const dayCollaborateur = collaborateurs[collaborateurIndex % collaborateurs.length];
          assignments.push({
            id: `planning-day-${date.toISOString()}-${dayCollaborateur._id}`,
            date: date.toISOString().split('T')[0],
            collaborateur: dayCollaborateur,
            type: holidays.some(h => h.toDateString() === date.toDateString()) ? 'holiday' : 'weekend',
            shift: 'day',
            status: 'planned'
          });
          
          // Night shift
          const nightCollaborateur = collaborateurs[(collaborateurIndex + 1) % collaborateurs.length];
          assignments.push({
            id: `planning-night-${date.toISOString()}-${nightCollaborateur._id}`,
            date: date.toISOString().split('T')[0],
            collaborateur: nightCollaborateur,
            type: holidays.some(h => h.toDateString() === date.toDateString()) ? 'holiday' : 'weekend',
            shift: 'night',
            status: 'planned'
          });
          
          collaborateurIndex += 2;
        }
      });
      
      setPlanning(assignments);
    } catch (error) {
      console.error('Error loading planning assignments:', error);
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

  const filteredCollaborateurs = collaborateurs.filter(collab =>
    `${collab.firstName} ${collab.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collab.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreatePlanning = () => {
    setShowPlanningModal(true);
  };

  const handleAssignPlanning = (collaborateurId: string, date: string, shift: 'day' | 'night') => {
    // Implementation for assigning planning
    toast.success('Planning assigné avec succès');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planned':
        return <Badge variant="info">Planifié</Badge>;
      case 'confirmed':
        return <Badge variant="success">Confirmé</Badge>;
      case 'absent':
        return <Badge variant="error">Absent</Badge>;
      case 'replaced':
        return <Badge variant="warning">Remplacé</Badge>;
      default:
        return <Badge variant="info">Planifié</Badge>;
    }
  };

  const getShiftBadge = (shift: string) => {
    return (
      <Badge variant={shift === 'day' ? 'info' : 'secondary'}>
        {shift === 'day' ? 'Jour' : 'Nuit'}
      </Badge>
    );
  };

  if (!user || user.role !== 'chef_service') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h2>
          <p className="text-gray-600">
            Cette page est réservée aux chefs de service.
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
          <h1 className="text-2xl font-bold text-gray-900">Mon Équipe</h1>
          <p className="text-gray-600">Gestion de votre équipe et de leur planning d'astreinte</p>
        </div>
        <Button onClick={handleCreatePlanning} className="flex items-center space-x-2">
          <PlusIcon className="h-5 w-5" />
          <span>Planifier Astreinte</span>
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
                  placeholder="Rechercher un collaborateur..."
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
        {/* Collaborateurs List */}
        <Card>
          <Card.Header>
            <div className="flex items-center space-x-3">
              <UserGroupIcon className="h-6 w-6 text-ocp-primary" />
              <h2 className="text-xl font-semibold text-gray-900">Collaborateurs</h2>
              <Badge variant="info">{filteredCollaborateurs.length}</Badge>
            </div>
          </Card.Header>
          <Card.Body>
            {filteredCollaborateurs.length === 0 ? (
              <div className="text-center py-8">
                <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun collaborateur trouvé</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCollaborateurs.map((collaborateur) => (
                  <div key={collaborateur._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-ocp-primary flex items-center justify-center">
                          <span className="text-white font-medium">
                            {collaborateur.firstName?.[0]}{collaborateur.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {collaborateur.firstName} {collaborateur.lastName}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <EnvelopeIcon className="h-4 w-4" />
                              <span>{collaborateur.email}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <PhoneIcon className="h-4 w-4" />
                              <span>{collaborateur.phone}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={collaborateur.isActive ? 'success' : 'error'}>
                          {collaborateur.isActive ? 'Actif' : 'Inactif'}
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

        {/* Planning */}
        <Card>
          <Card.Header>
            <div className="flex items-center space-x-3">
              <CalendarDaysIcon className="h-6 w-6 text-ocp-primary" />
              <h2 className="text-xl font-semibold text-gray-900">Planning Astreinte</h2>
              <Badge variant="info">{planning.length}</Badge>
            </div>
          </Card.Header>
          <Card.Body>
            {planning.length === 0 ? (
              <div className="text-center py-8">
                <CalendarDaysIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun planning ce mois</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {planning.map((plan) => (
                  <div key={plan.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {new Date(plan.date).toLocaleDateString('fr-FR', { 
                              weekday: 'short', 
                              day: 'numeric', 
                              month: 'short' 
                            })}
                          </span>
                          {getShiftBadge(plan.shift)}
                          <Badge variant={plan.type === 'holiday' ? 'warning' : 'info'}>
                            {plan.type === 'holiday' ? 'Férié' : 'Weekend'}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>{plan.collaborateur.firstName} {plan.collaborateur.lastName}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(plan.status)}
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

export default MonEquipe;
