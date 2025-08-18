import React, { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import Textarea from '@/components/ui/Textarea';
import { useAuth } from '@/hooks/useAuth';
import planningService from '@/services/planning.service';
import astreinteService from '@/services/astreinte.service';
import apiService from '@/services/api';
import type { PlanningEntry } from '@/services/planning.service';
import type { User, Site, Secteur, Service } from '@/types';
import {
  CalendarIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  CogIcon
} from '@heroicons/react/24/outline';

interface GardeActuelle extends PlanningEntry {
  user: User;
  site: Site;
  secteur: Secteur;
  service?: Service;
}

interface PlanningFilters {
  dateDebut: string;
  dateFin: string;
  secteurId: string;
  serviceId: string;
  userId: string;
  statut: string;
  type: string;
}

const PlanningAstreinte: React.FC = () => {
  const { user } = useAuth();
  const [gardeActuelle, setGardeActuelle] = useState<GardeActuelle | null>(null);
  const [pannes, setPannes] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [secteurs, setSecteurs] = useState<Secteur[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [assignFormData, setAssignFormData] = useState({
    userId: '',
    secteurId: '',
    serviceId: '',
    dateDebut: '',
    dateFin: '',
    type: 'astreinte',
    description: ''
  });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showPanneModal, setShowPanneModal] = useState(false);
  const [panneFormData, setPanneFormData] = useState({
    titre: '',
    description: '',
    urgence: 'moyenne',
    secteurId: '',
    serviceId: ''
  });
  const [filters, setFilters] = useState<PlanningFilters>({
    dateDebut: '',
    dateFin: '',
    secteurId: '',
    serviceId: '',
    userId: '',
    statut: 'active',
    type: 'astreinte'
  });
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'grid'>('calendar');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGardeActuelle();
    loadPannes();
    loadUsers();
    loadSecteurs();
    loadServices();
  }, []);

  const loadGardeActuelle = async () => {
    try {
      setLoading(true);
      const response = await planningService.getPlannings(
        new Date(),
        new Date(Date.now() + 24 * 60 * 60 * 1000)
      );
      if (response && response.length > 0) {
        const planning = response[0];
        
        // Fetch full details for populated objects
        const [userData, siteData, secteurData, serviceData] = await Promise.all([
          apiService.getUserById(planning.userId),
          apiService.getSiteById(planning.siteId),
          apiService.getSecteurById(planning.siteId, planning.secteurId),
          planning.serviceId ? apiService.getServiceById(planning.serviceId) : null
        ]);

        if (userData.data && siteData.data && secteurData.data) {
          setGardeActuelle({
            ...planning,
            user: userData.data,
            site: siteData.data,
            secteur: secteurData.data,
            service: serviceData?.data
          });
        }
      }
    } catch (error) {
      console.error('Erreur chargement garde actuelle:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPannes = async () => {
    try {
      const response = await astreinteService.getPannesRecentes();
      setPannes(response || []);
    } catch (error) {
      console.error('Erreur chargement pannes:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await apiService.getUsers();
      setUsers(response.data || []);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    }
  };

  const loadSecteurs = async () => {
    try {
      // Using a default siteId for now - you might want to get this from user context
      const response = await apiService.getSecteurs('default-site-id');
      setSecteurs(response.data || []);
    } catch (error) {
      console.error('Erreur chargement secteurs:', error);
    }
  };

  const loadServices = async () => {
    try {
      // Using default siteId and secteurId for now - you might want to get these from user context
      const response = await apiService.getServices('default-site-id', 'default-secteur-id');
      setServices(response.data || []);
    } catch (error) {
      console.error('Erreur chargement services:', error);
    }
  };

  const declarerPanne = async () => {
    try {
      await astreinteService.declarerPanne({
        titre: panneFormData.titre,
        description: panneFormData.description,
        urgence: panneFormData.urgence as 'faible' | 'moyenne' | 'critique',
        secteurId: panneFormData.secteurId || undefined,
        serviceId: panneFormData.serviceId || undefined
      });
      setShowPanneModal(false);
      setPanneFormData({ titre: '', description: '', urgence: 'moyenne', secteurId: '', serviceId: '' });
      loadPannes();
    } catch (error) {
      console.error('Erreur déclaration panne:', error);
    }
  };

  const handleAssignSubmit = async () => {
    try {
      const planningEntry = {
        date: assignFormData.dateDebut,
        userId: assignFormData.userId,
        type: assignFormData.type === 'ingenieur' ? 'ingenieur' : 'collaborateur' as 'ingenieur' | 'collaborateur',
        siteId: assignFormData.secteurId, // Using secteurId as siteId for now
        secteurId: assignFormData.secteurId,
        serviceId: assignFormData.serviceId || undefined,
        shift: 'weekend' as 'day' | 'night' | 'weekend',
        statut: 'propose' as 'propose' | 'valide' | 'conflit'
      };
      
      await planningService.createPlanning(planningEntry);
      setShowAssignModal(false);
      setAssignFormData({
        userId: '',
        secteurId: '',
        serviceId: '',
        dateDebut: '',
        dateFin: '',
        type: 'astreinte',
        description: ''
      });
      loadGardeActuelle();
    } catch (error) {
      console.error('Erreur assignation astreinte:', error);
    }
  };

  const handleFilterChange = (key: keyof PlanningFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      dateDebut: '',
      dateFin: '',
      secteurId: '',
      serviceId: '',
      userId: '',
      statut: 'active',
      type: 'astreinte'
    });
  };

  const getUrgenceColor = (urgence: string) => {
    switch (urgence) {
      case 'critique': return 'text-red-600 bg-red-100';
      case 'moyenne': return 'text-yellow-600 bg-yellow-100';
      case 'faible': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'ouverte': return 'text-red-600 bg-red-100';
      case 'en_cours': return 'text-blue-600 bg-blue-100';
      case 'resolue': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header avec actions principales */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Planning des Astreintes</h1>
          <p className="text-gray-600 mt-2">Gestion des gardes et déclaration des pannes</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Assigner une Astreinte
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowPanneModal(true)}
            className="flex items-center gap-2"
          >
            <ExclamationTriangleIcon className="h-5 w-5" />
            Déclarer une Panne
          </Button>
        </div>
      </div>

      {/* Filtres avancés */}
      <Card>
        <Card.Header>
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5" />
            <h3 className="text-lg font-medium">Filtres de recherche</h3>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
              <Input
                type="date"
                value={filters.dateDebut}
                onChange={(e) => handleFilterChange('dateDebut', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
              <Input
                type="date"
                value={filters.dateFin}
                onChange={(e) => handleFilterChange('dateFin', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Secteur</label>
              <Select
                value={filters.secteurId}
                onChange={(e) => handleFilterChange('secteurId', e.target.value)}
              >
                <option value="">Tous les secteurs</option>
                {secteurs.map(secteur => (
                  <option key={secteur._id} value={secteur._id}>
                    {secteur.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
              <Select
                value={filters.serviceId}
                onChange={(e) => handleFilterChange('serviceId', e.target.value)}
              >
                <option value="">Tous les services</option>
                {services.map(service => (
                  <option key={service._id} value={service._id}>
                    {service.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Button variant="secondary" onClick={resetFilters}>
              Réinitialiser
            </Button>
            <Button variant="primary">
              <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
              Rechercher
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Vue d'ensemble */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Garde actuelle */}
        <Card>
          <Card.Header>
            <div className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-medium">Garde Actuelle</h3>
            </div>
          </Card.Header>
          <Card.Body>
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : gardeActuelle ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="h-5 w-5 text-gray-500" />
                  <span className="font-medium">
                    {gardeActuelle.user?.firstName} {gardeActuelle.user?.lastName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {gardeActuelle.site?.name} • {gardeActuelle.secteur?.name}
                  </span>
                </div>
                {gardeActuelle.service && (
                  <div className="flex items-center gap-2">
                    <CogIcon className="h-5 w-5 text-gray-500" />
                    <span className="text-sm text-gray-600">{gardeActuelle.service.name}</span>
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  {gardeActuelle.service ? 'Garde Service' : 'Garde Secteur'}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                Aucune garde actuellement assignée
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Pannes récentes */}
        <Card>
          <Card.Header>
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
              <h3 className="text-lg font-medium">Pannes Récentes</h3>
            </div>
          </Card.Header>
          <Card.Body>
            <div className="space-y-2">
              {pannes.slice(0, 3).map((panne) => (
                <div key={panne._id} className="border rounded p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{panne.titre}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgenceColor(panne.urgence)}`}>
                      {panne.urgence}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(panne.dateCreation).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              ))}
              {pannes.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  Aucune panne récente
                </div>
              )}
            </div>
          </Card.Body>
        </Card>

        {/* Statistiques rapides */}
        <Card>
          <Card.Header>
            <div className="flex items-center gap-2">
              <BuildingOfficeIcon className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-medium">Statistiques</h3>
            </div>
          </Card.Header>
          <Card.Body>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Gardes actives</span>
                <span className="font-medium">{gardeActuelle ? '1' : '0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Pannes ouvertes</span>
                <span className="font-medium text-red-600">
                  {pannes.filter(p => p.statut === 'ouverte').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Personnel disponible</span>
                <span className="font-medium">{users.length}</span>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Sélecteur de vue */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Vue :</span>
        <Button
          variant={viewMode === 'calendar' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setViewMode('calendar')}
        >
          Calendrier
        </Button>
        <Button
          variant={viewMode === 'list' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setViewMode('list')}
        >
          Liste
        </Button>
        <Button
          variant={viewMode === 'grid' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setViewMode('grid')}
        >
          Grille
        </Button>
      </div>

      {/* Contenu de la vue sélectionnée */}
      <Card>
        <Card.Header>
          <h3 className="text-lg font-medium">
            {viewMode === 'calendar' && 'Vue Calendrier'}
            {viewMode === 'list' && 'Vue Liste'}
            {viewMode === 'grid' && 'Vue Grille'}
          </h3>
        </Card.Header>
        <Card.Body>
          <div className="text-center py-8 text-gray-500">
            {viewMode === 'calendar' && 'Interface calendrier en cours de développement...'}
            {viewMode === 'list' && 'Interface liste en cours de développement...'}
            {viewMode === 'grid' && 'Interface grille en cours de développement...'}
          </div>
        </Card.Body>
      </Card>

      {/* Modal d'assignation d'astreinte */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assigner une Astreinte"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Personnel</label>
              <Select
                value={assignFormData.userId}
                onChange={(e) => setAssignFormData(prev => ({ ...prev, userId: e.target.value }))}
              >
                <option value="">Sélectionner un personnel</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.firstName} {user.lastName} - {user.role}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Secteur</label>
              <Select
                value={assignFormData.secteurId}
                onChange={(e) => setAssignFormData(prev => ({ ...prev, secteurId: e.target.value }))}
              >
                <option value="">Sélectionner un secteur</option>
                {secteurs.map(secteur => (
                  <option key={secteur._id} value={secteur._id}>
                    {secteur.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service (optionnel)</label>
              <Select
                value={assignFormData.serviceId}
                onChange={(e) => setAssignFormData(prev => ({ ...prev, serviceId: e.target.value }))}
              >
                <option value="">Aucun service spécifique</option>
                {services.map(service => (
                  <option key={service._id} value={service._id}>
                    {service.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <Select
                value={assignFormData.type}
                onChange={(e) => setAssignFormData(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="astreinte">Astreinte</option>
                <option value="garde">Garde</option>
                <option value="weekend">Weekend</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
              <Input
                type="datetime-local"
                value={assignFormData.dateDebut}
                onChange={(e) => setAssignFormData(prev => ({ ...prev, dateDebut: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
              <Input
                type="datetime-local"
                value={assignFormData.dateFin}
                onChange={(e) => setAssignFormData(prev => ({ ...prev, dateFin: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <Textarea
              value={assignFormData.description}
              onChange={(e) => setAssignFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description de l'astreinte..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowAssignModal(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleAssignSubmit}>
              Assigner
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de déclaration de panne */}
      <Modal
        isOpen={showPanneModal}
        onClose={() => setShowPanneModal(false)}
        title="Déclarer une Panne"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
            <Input
              value={panneFormData.titre}
              onChange={(e) => setPanneFormData(prev => ({ ...prev, titre: e.target.value }))}
              placeholder="Titre de la panne..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <Textarea
              value={panneFormData.description}
              onChange={(e) => setPanneFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description détaillée de la panne..."
              rows={4}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Niveau d'urgence</label>
              <Select
                value={panneFormData.urgence}
                onChange={(e) => setPanneFormData(prev => ({ ...prev, urgence: e.target.value }))}
              >
                <option value="faible">Faible</option>
                <option value="moyenne">Moyenne</option>
                <option value="critique">Critique</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Secteur concerné</label>
              <Select
                value={panneFormData.secteurId}
                onChange={(e) => setPanneFormData(prev => ({ ...prev, secteurId: e.target.value }))}
              >
                <option value="">Sélectionner un secteur</option>
                {secteurs.map(secteur => (
                  <option key={secteur._id} value={secteur._id}>
                    {secteur.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowPanneModal(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={declarerPanne}>
              Déclarer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PlanningAstreinte;
