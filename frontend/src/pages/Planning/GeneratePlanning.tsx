import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ArrowLeftIcon, SparklesIcon } from '@heroicons/react/24/outline';

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

export default function GeneratePlanning() {
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
    dateFin: '',
    includeWeekdays: false
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

  // Role-based filtering (same as CreatePlanning)
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

  const canGenerate = form.type && form.site && form.secteur && form.dateDebut && form.dateFin &&
    (form.type === 'secteur' || form.service);

  const generate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    try {
      const data = {
        type: form.type,
        site: form.site,
        secteur: form.secteur,
        service: form.type === 'service' ? form.service : undefined,
        from: form.dateDebut,
        to: form.dateFin,
        includeWeekdays: form.includeWeekdays
      };
      const res = await apiService.generatePlanning(data);
      const planningId = (res.data as any)?._id;
      if (planningId) {
        navigate(`/planning-management/${planningId}`);
      } else {
        navigate('/planning-management');
      }
    } catch (error) {
      console.error('Erreur génération planning:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysCount = () => {
    if (!form.dateDebut || !form.dateFin) return 0;
    const start = new Date(form.dateDebut);
    const end = new Date(form.dateFin);
    let count = 0;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      if (isWeekend || form.includeWeekdays) count++;
    }
    return count;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/planning-management')}>
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <h1 className="text-xl font-semibold">Génération automatique</h1>
      </div>

      <Card>
        <Card.Header>
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Paramètres de génération</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            L'algorithme génère automatiquement les gardes en respectant les indisponibilités et en équilibrant la charge.
          </p>
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
              <p className="text-xs text-gray-500 mt-1">
                {form.type === 'secteur'
                  ? 'Génère des gardes pour les ingénieurs du secteur'
                  : 'Génère des gardes pour les collaborateurs du service'
                }
                {user?.role === 'chef_service' && ' (Type prédéfini selon votre rôle)'}
              </p>
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

            <div className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.includeWeekdays}
                  onChange={e => setForm(f => ({ ...f, includeWeekdays: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium">Inclure les jours de semaine</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Par défaut, seuls les weekends sont inclus. Cochez pour inclure aussi les jours de semaine.
              </p>
            </div>
          </div>

          {form.dateDebut && form.dateFin && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Aperçu de la génération</h3>
              <div className="text-sm text-blue-700">
                <div>Période: {new Date(form.dateDebut).toLocaleDateString()} → {new Date(form.dateFin).toLocaleDateString()}</div>
                <div>Jours à assigner: {getDaysCount()}</div>
                <div>Type: {form.includeWeekdays ? 'Weekends + jours de semaine' : 'Weekends uniquement'}</div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => navigate('/planning-management')}>
              Annuler
            </Button>
            <Button onClick={generate} disabled={!canGenerate || loading}>
              <SparklesIcon className="w-4 h-4 mr-2" />
              {loading ? 'Génération...' : 'Générer le planning'}
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
