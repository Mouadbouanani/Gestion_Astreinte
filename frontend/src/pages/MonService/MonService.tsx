import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import {
  WrenchScrewdriverIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon,
  PhoneIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'ingenieur' | 'collaborateur';
  status: 'active' | 'congé' | 'formation' | 'indisponible';
  joinDate: string;
  specialties: string[];
}

interface ServiceStats {
  totalMembers: number;
  ingenieurs: number;
  collaborateurs: number;
  membersActive: number;
  astreintesCeMois: number;
}

const MonService: React.FC = () => {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState<ServiceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadServiceData();
  }, []);

  const loadServiceData = async () => {
    try {
      // Simulation de données
      const mockTeamMembers: TeamMember[] = [
        {
          id: '1',
          firstName: 'Ahmed',
          lastName: 'Benali',
          email: 'a.benali@ocp.ma',
          phone: '+212 6 12 34 56 78',
          role: 'ingenieur',
          status: 'active',
          joinDate: '2020-03-15',
          specialties: ['Maintenance préventive', 'Diagnostic']
        },
        {
          id: '2',
          firstName: 'Fatima',
          lastName: 'Alami',
          email: 'f.alami@ocp.ma',
          phone: '+212 6 87 65 43 21',
          role: 'collaborateur',
          status: 'active',
          joinDate: '2021-06-10',
          specialties: ['Électricité', 'Automatisme']
        },
        {
          id: '3',
          firstName: 'Mohamed',
          lastName: 'Tazi',
          email: 'm.tazi@ocp.ma',
          role: 'collaborateur',
          status: 'formation',
          joinDate: '2022-01-20',
          specialties: ['Mécanique', 'Hydraulique']
        },
        {
          id: '4',
          firstName: 'Aicha',
          lastName: 'Idrissi',
          email: 'a.idrissi@ocp.ma',
          phone: '+212 6 11 22 33 44',
          role: 'ingenieur',
          status: 'congé',
          joinDate: '2019-09-05',
          specialties: ['Gestion projet', 'Qualité']
        }
      ];

      const mockStats: ServiceStats = {
        totalMembers: mockTeamMembers.length,
        ingenieurs: mockTeamMembers.filter(m => m.role === 'ingenieur').length,
        collaborateurs: mockTeamMembers.filter(m => m.role === 'collaborateur').length,
        membersActive: mockTeamMembers.filter(m => m.status === 'active').length,
        astreintesCeMois: 8
      };

      setTeamMembers(mockTeamMembers);
      setStats(mockStats);
    } catch (error) {
      console.error('Erreur chargement service:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'congé': return 'bg-blue-100 text-blue-800';
      case 'formation': return 'bg-yellow-100 text-yellow-800';
      case 'indisponible': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'congé': return 'En congé';
      case 'formation': return 'Formation';
      case 'indisponible': return 'Indisponible';
      default: return 'Inconnu';
    }
  };

  if (!user || user.role !== 'chef_service') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Accès non autorisé</h2>
          <p className="text-gray-600 mt-2">Cette page est réservée aux chefs de service.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocp-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-ocp-primary to-ocp-accent rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">Mon Service</h1>
        <p className="mt-2 opacity-90">
          Gestion du service {user.service?.name} - {user.secteur?.name}
        </p>
        <div className="mt-4 flex items-center space-x-4">
          <Badge role={user.role} />
          <span className="text-sm opacity-90">⚙️ {user.service?.name}</span>
          <span className="text-sm opacity-90">🏢 {user.secteur?.name}</span>
          <span className="text-sm opacity-90">📍 {user.site?.name}</span>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <Card.Body>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-500">
                <UserGroupIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Équipe</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.totalMembers}</p>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-500">
                <UserGroupIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Ingénieurs</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.ingenieurs}</p>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-500">
                <UserGroupIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Collaborateurs</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.collaborateurs}</p>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-500">
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Actifs</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.membersActive}</p>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-orange-500">
                <CalendarDaysIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Astreintes</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.astreintesCeMois}</p>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Équipe */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Mon Équipe</h3>
            <Button variant="primary" size="sm">
              <PlusIcon className="h-4 w-4 mr-2" />
              Ajouter Membre
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-ocp-primary rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {member.firstName[0]}{member.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">
                          {member.firstName} {member.lastName}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <Badge role={member.role} size="sm" />
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(member.status)}`}>
                            {getStatusText(member.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <EnvelopeIcon className="h-4 w-4 mr-2" />
                        {member.email}
                      </div>
                      {member.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <PhoneIcon className="h-4 w-4 mr-2" />
                          {member.phone}
                        </div>
                      )}
                      <div className="text-sm text-gray-500">
                        Depuis: {new Date(member.joinDate).toLocaleDateString('fr-FR')}
                      </div>
                      {member.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {member.specialties.map((specialty, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                            >
                              {specialty}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default MonService;
