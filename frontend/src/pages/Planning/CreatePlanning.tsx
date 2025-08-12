import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

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

export default function CreatePlanning() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sites, setSites] = useState<Site[]>([]);
  const [secteurs, setSecteurs] = useState<Secteur[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState({
    type: getDefaultType(),
    site: user?.site?._id || '',
    secteur: user?.secteur?._id || '',
    service: user?.service?._id || '',
    dateDebut: '',
    dateFin: ''
  });

  function getDefaultType(): 'service' | 'secteur' {
    if (user?.role === 'chef_service') return 'service';
    return 'secteur';
  }

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sitesRes, secteursRes, servicesRes] = await Promise.all([
        apiService.getSites(),
        apiService.getSecteurs(),
        apiService.getServices()
      ]);
      setSites((sitesRes.data as any) || []);
      setSecteurs((secteursRes.data as any) || []);
      setServices((servicesRes.data as any) || []);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    }
  };

  // Role-based filtering
  const getAvailableSites = () => {
    if (user?.role === 'admin') return sites;
    return sites.filter(s => s._id === user?.site?._id);
  };

  const getAvailableSecteurs = () => {
    const filtered = secteurs.filter(s => !form.site || s.site === form.site);
    if (user?.role === 'admin') return filtered;
    return filtered.filter(s => s._id === user?.secteur?._id);
  };

  const getAvailableServices = () => {
    const filtered = services.filter(s => !form.secteur || s.secteur === form.secteur);
    if (user?.role === 'admin') return filtered;
    if (user?.role === 'chef_secteur') return filtered.filter(s => s.secteur === user?.secteur?._id);
    return filtered.filter(s => s._id === user?.service?._id);
  };

  const getAvailableTypes = () => {
    if (user?.role === 'admin') return ['secteur', 'service'];
    if (user?.role === 'chef_secteur') return ['secteur', 'service'];
    if (user?.role === 'chef_service') return ['service'];
    return [];
  };

  const canSave = form.type && form.site && form.secteur && form.dateDebut && form.dateFin &&
    (form.type === 'secteur' || form.service);

  const save = async () => {
    if (!canSave) return;
    setLoading(true);
    try {
      const data = {
        type: form.type,
        site: form.site,
        secteur: form.secteur,
        service: form.type === 'service' ? form.service : undefined,
        periode: {
          debut: form.dateDebut,
          fin: form.dateFin
        }
      };
      const res = await apiService.createPlanning(data);
      const planningId = (res.data as any)?._id;
      if (planningId) {
        navigate(`/planning-management/${planningId}`);
      } else {
        navigate('/planning-management');
      }
    } catch (error) {
      console.error('Erreur création planning:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/planning-management')}>
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <h1 className="text-xl font-semibold">Nouveau planning</h1>
      </div>

      <Card>
        <Card.Header>
          <h2 className="text-lg font-semibold">Informations générales</h2>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Type de planning</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as 'service' | 'secteur' }))}
                className="input-ocp w-full"
                disabled={getAvailableTypes().length === 1}
              >
                {getAvailableTypes().includes('secteur') && <option value="secteur">Secteur (Ingénieurs)</option>}
                {getAvailableTypes().includes('service') && <option value="service">Service (Collaborateurs)</option>}
              </select>
              {user?.role === 'chef_service' && (
                <p className="text-xs text-gray-500 mt-1">En tant que chef de service, vous ne pouvez créer que des plannings de service.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Site</label>
              <select
                value={form.site}
                onChange={e => setForm(f => ({ ...f, site: e.target.value, secteur: '', service: '' }))}
                className="input-ocp w-full"
                disabled={user?.role !== 'admin'}
              >
                <option value="">Sélectionner un site</option>
                {getAvailableSites().map(site => (
                  <option key={site._id} value={site._id}>{site.name}</option>
                ))}
              </select>
              {user?.role !== 'admin' && (
                <p className="text-xs text-gray-500 mt-1">Site prédéfini selon votre rôle.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Secteur</label>
              <select
                value={form.secteur}
                onChange={e => setForm(f => ({ ...f, secteur: e.target.value, service: '' }))}
                className="input-ocp w-full"
                disabled={!form.site || user?.role === 'chef_service'}
              >
                <option value="">Sélectionner un secteur</option>
                {getAvailableSecteurs().map(secteur => (
                  <option key={secteur._id} value={secteur._id}>{secteur.name}</option>
                ))}
              </select>
              {(user?.role === 'chef_secteur' || user?.role === 'chef_service') && (
                <p className="text-xs text-gray-500 mt-1">Secteur prédéfini selon votre rôle.</p>
              )}
            </div>

            {form.type === 'service' && (
              <div>
                <label className="block text-sm font-medium mb-2">Service</label>
                <select
                  value={form.service}
                  onChange={e => setForm(f => ({ ...f, service: e.target.value }))}
                  className="input-ocp w-full"
                  disabled={!form.secteur || user?.role === 'chef_service'}
                >
                  <option value="">Sélectionner un service</option>
                  {getAvailableServices().map(service => (
                    <option key={service._id} value={service._id}>{service.name}</option>
                  ))}
                </select>
                {user?.role === 'chef_service' && (
                  <p className="text-xs text-gray-500 mt-1">Service prédéfini selon votre rôle.</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Date de début</label>
              <input
                type="date"
                value={form.dateDebut}
                onChange={e => setForm(f => ({ ...f, dateDebut: e.target.value }))}
                className="input-ocp w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Date de fin</label>
              <input
                type="date"
                value={form.dateFin}
                onChange={e => setForm(f => ({ ...f, dateFin: e.target.value }))}
                className="input-ocp w-full"
                min={form.dateDebut}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => navigate('/planning-management')}>
              Annuler
            </Button>
            <Button onClick={save} disabled={!canSave || loading}>
              {loading ? 'Création...' : 'Créer le planning'}
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
