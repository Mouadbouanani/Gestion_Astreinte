import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { PlusIcon, CalendarDaysIcon, EyeIcon, PencilIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface Planning {
  _id: string;
  type: 'service' | 'secteur';
  periode: { debut: string; fin: string };
  site: { _id: string; name: string };
  secteur: { _id: string; name: string };
  service?: { _id: string; name: string };
  statut: 'brouillon' | 'en_validation' | 'valide' | 'publie';
  gardes: any[];
  createdAt: string;
}

interface Site {
  _id: string;
  name: string;
  code: string;
}

interface Secteur {
  _id: string;
  name: string;
  code: string;
  site: string;
}

interface Service {
  _id: string;
  name: string;
  code: string;
  secteur: string;
}

export default function PlanningList() {
  const { user } = useAuth();
  const [plannings, setPlannings] = useState<Planning[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [secteurs, setSecteurs] = useState<Secteur[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<{ statut?: string; type?: string; siteId?: string; secteurId?: string; serviceId?: string }>({});

  const loadData = async () => {
    setLoading(true);
    try {
      // Load plannings with current filters
      const planningsRes = await apiService.listPlannings(filters);
      setPlannings((planningsRes.data as any) || []);

      // Load organizational data for filters (only for admin)
      if (user?.role === 'admin') {
        const [sitesRes, secteursRes, servicesRes] = await Promise.all([
          apiService.getSites(),
          apiService.getSecteurs(),
          apiService.getServices()
        ]);
        setSites((sitesRes.data as any) || []);
        setSecteurs((secteursRes.data as any) || []);
        setServices((servicesRes.data as any) || []);
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [JSON.stringify(filters), user?.role]);

  // Get available planning types based on user role
  const getAvailableTypes = () => {
    if (user?.role === 'admin') return ['secteur', 'service'];
    if (user?.role === 'chef_secteur') return ['secteur', 'service'];
    if (user?.role === 'chef_service') return ['service'];
    return [];
  };

  // Filter organizational data based on user role
  const getFilteredSites = () => {
    if (user?.role === 'admin') return sites;
    if (user?.role === 'chef_secteur') return sites.filter(s => s._id === user.site?._id);
    if (user?.role === 'chef_service') return sites.filter(s => s._id === user.site?._id);
    return [];
  };

  const getFilteredSecteurs = () => {
    if (user?.role === 'admin') return secteurs.filter(s => !filters.siteId || s.site === filters.siteId);
    if (user?.role === 'chef_secteur') return secteurs.filter(s => s._id === user.secteur?._id);
    if (user?.role === 'chef_service') return secteurs.filter(s => s._id === user.secteur?._id);
    return [];
  };

  const getFilteredServices = () => {
    if (user?.role === 'admin') return services.filter(s => !filters.secteurId || s.secteur === filters.secteurId);
    if (user?.role === 'chef_secteur') return services.filter(s => s.secteur === user.secteur?._id);
    if (user?.role === 'chef_service') return services.filter(s => s._id === user.service?._id);
    return [];
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'brouillon': return 'text-gray-500';
      case 'en_validation': return 'text-yellow-600';
      case 'valide': return 'text-green-600';
      case 'publie': return 'text-blue-600';
      default: return 'text-gray-500';
    }
  };

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case 'brouillon': return 'Brouillon';
      case 'en_validation': return 'En validation';
      case 'valide': return 'Validé';
      case 'publie': return 'Publié';
      default: return statut;
    }
  };

  const getRoleBasedTitle = () => {
    if (user?.role === 'admin') return 'Gestion des plannings - Tous sites/secteurs/services';
    if (user?.role === 'chef_secteur') return `Gestion des plannings - Secteur ${user.secteur?.name}`;
    if (user?.role === 'chef_service') return `Gestion des plannings - Service ${user.service?.name}`;
    return 'Gestion des plannings';
  };

  const getRoleBasedDescription = () => {
    if (user?.role === 'admin') return 'Créer et gérer tous les plannings d\'astreinte (ingénieurs et collaborateurs)';
    if (user?.role === 'chef_secteur') return 'Créer et gérer les plannings de votre secteur (ingénieurs et collaborateurs)';
    if (user?.role === 'chef_service') return 'Créer et gérer les plannings de votre service (collaborateurs uniquement)';
    return 'Créer et gérer les plannings d\'astreinte';
  };

  return (
    <div className="space-y-6">
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{getRoleBasedTitle()}</h2>
              <p className="text-sm text-gray-500">{getRoleBasedDescription()}</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Organizational filters - only for admin */}
              {user?.role === 'admin' && (
                <>
                  <select
                    value={filters.siteId || ''}
                    onChange={e => setFilters(f => ({...f, siteId: e.target.value || undefined, secteurId: undefined, serviceId: undefined}))}
                    className="input-ocp w-40"
                  >
                    <option value="">Tous sites</option>
                    {getFilteredSites().map(site => (
                      <option key={site._id} value={site._id}>{site.name}</option>
                    ))}
                  </select>
                  <select
                    value={filters.secteurId || ''}
                    onChange={e => setFilters(f => ({...f, secteurId: e.target.value || undefined, serviceId: undefined}))}
                    className="input-ocp w-40"
                  >
                    <option value="">Tous secteurs</option>
                    {getFilteredSecteurs().map(secteur => (
                      <option key={secteur._id} value={secteur._id}>{secteur.name}</option>
                    ))}
                  </select>
                  <select
                    value={filters.serviceId || ''}
                    onChange={e => setFilters(f => ({...f, serviceId: e.target.value || undefined}))}
                    className="input-ocp w-40"
                  >
                    <option value="">Tous services</option>
                    {getFilteredServices().map(service => (
                      <option key={service._id} value={service._id}>{service.name}</option>
                    ))}
                  </select>
                </>
              )}

              <select
                value={filters.statut || ''}
                onChange={e => setFilters(f => ({...f, statut: e.target.value || undefined}))}
                className="input-ocp w-40"
              >
                <option value="">Tous statuts</option>
                <option value="brouillon">Brouillon</option>
                <option value="en_validation">En validation</option>
                <option value="valide">Validé</option>
                <option value="publie">Publié</option>
              </select>

              {getAvailableTypes().length > 1 && (
                <select
                  value={filters.type || ''}
                  onChange={e => setFilters(f => ({...f, type: e.target.value || undefined}))}
                  className="input-ocp w-32"
                >
                  <option value="">Tous types</option>
                  {getAvailableTypes().includes('secteur') && <option value="secteur">Secteur</option>}
                  {getAvailableTypes().includes('service') && <option value="service">Service</option>}
                </select>
              )}

              <Button variant="secondary" onClick={loadData}>Rafraîchir</Button>
              </select>
              <Link to="/planning-management/generate">
                <Button variant="secondary">
                  <SparklesIcon className="w-4 h-4 mr-2" />
                  Générer
                </Button>
              </Link>
              <Link to="/planning-management/create">
                <Button>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Nouveau planning
                </Button>
              </Link>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-sm text-gray-500">Chargement des plannings... Merci de patienter.</div>
          ) : plannings.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDaysIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <div className="text-sm text-gray-500">Aucun planning trouvé.</div>
              <div className="flex gap-3 mt-4 justify-center">
                <Link to="/planning-management/generate">
                  <Button variant="secondary">
                    <SparklesIcon className="w-4 h-4 mr-2" />
                    Générer automatiquement
                  </Button>
                </Link>
                <Link to="/planning-management/create">
                  <Button>Créer manuellement</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {plannings.map(planning => (
                <div key={planning._id} className="p-4 border rounded-lg bg-white">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="font-medium">
                          {new Date(planning.periode.debut).toLocaleDateString()} → {new Date(planning.periode.fin).toLocaleDateString()}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full bg-gray-100 ${getStatusColor(planning.statut)}`}>
                          {getStatusLabel(planning.statut)}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                          {planning.type === 'secteur' ? 'Secteur' : 'Service'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>{planning.site?.name} • {planning.secteur?.name}</div>
                        {planning.service && <div>Service: {planning.service.name}</div>}
                        <div className="mt-1">
                          {planning.gardes?.length || 0} garde(s) assignée(s)
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link to={`/planning-management/${planning._id}`}>
                        <Button variant="secondary" size="sm">
                          <EyeIcon className="w-4 h-4 mr-1" />
                          Voir
                        </Button>
                      </Link>
                      {planning.statut === 'brouillon' && (
                        <Link to={`/planning-management/${planning._id}`}>
                          <Button variant="secondary" size="sm">
                            <PencilIcon className="w-4 h-4 mr-1" />
                            Modifier
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
