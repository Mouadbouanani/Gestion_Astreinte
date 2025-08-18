import React, { useEffect, useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import weekendHolidayService from '@/services/weekend-holiday.service';
import type { WeekendHolidayPlanning } from '@/services/weekend-holiday.service';
import rotationEquitableService from '@/services/rotation-equitable.service';
import type { StatistiquesRotation } from '@/types/rotation-equitable.types';
import astreinteService from '@/services/astreinte.service';
import type { Panne } from '@/services/astreinte.service';

const PlanningManagement: React.FC = () => {
  const { user } = useAuth();
  const secteurId = (typeof user?.secteur === 'object' ? user?.secteur?._id : user?.secteur) || '';
  const serviceId = (typeof user?.service === 'object' ? user?.service?._id : user?.service) || undefined;

  const [plannings, setPlannings] = useState<WeekendHolidayPlanning[]>([]);
  const [rotationOrder, setRotationOrder] = useState<string[]>([]);
  const [userMap, setUserMap] = useState<Record<string, { id: string; name: string }>>({});
  const [stats, setStats] = useState<StatistiquesRotation | null>(null);
  const [pannesRecentes, setPannesRecentes] = useState<Panne[]>([]);
  const [saving, setSaving] = useState(false);

  const periode = useMemo(() => ({
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  }), []);

  useEffect(() => {
    // Charger planning w/k + fériés (simple)
    (async () => {
      const data = await weekendHolidayService.getWeekendHolidayPlanning(
        periode.startDate,
        periode.endDate,
        secteurId
      );
      setPlannings(data);

      // Construire rotation initiale simple à partir des gardes planifiées (uniques, ordre d'apparition)
      const seen = new Set<string>();
      const order: string[] = [];
      const map: Record<string, { id: string; name: string }> = {};
      data.forEach((p) => {
        const uid = p.garde.id;
        if (!seen.has(uid)) {
          seen.add(uid);
          order.push(uid);
          map[uid] = { id: uid, name: `${p.garde.firstName} ${p.garde.lastName}` };
        }
      });
      setRotationOrder(order);
      setUserMap(map);
    })();

    // Charger statistiques rotation pour offrir un tri de réinitialisation simple
    (async () => {
      const s = await rotationEquitableService.getStatistiquesRotation(secteurId || '', serviceId, periode);
      if (s) setStats(s);
    })();

    // Charger pannes récentes (affichage seulement)
    (async () => {
      const p = await astreinteService.getPannesRecentes();
      setPannesRecentes(p);
    })();
  }, [secteurId, serviceId, periode]);

  const moveUserUp = (userId: string) => {
    setRotationOrder((prev) => {
      const idx = prev.indexOf(userId);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const moveUserDown = (userId: string) => {
    setRotationOrder((prev) => {
      const idx = prev.indexOf(userId);
      if (idx === -1 || idx === prev.length - 1) return prev;
      const next = [...prev];
      [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
      return next;
    });
  };

  const moveCurrentWeekendGuardsToEnd = () => {
    // Déterminer prochain weekend (samedi/dimanche à venir) et déplacer leurs gardes à la fin
    const today = new Date();
    const nextSaturday = new Date(today);
    nextSaturday.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7));
    const saturdayStr = nextSaturday.toISOString().split('T')[0];
    const sunday = new Date(nextSaturday);
    sunday.setDate(nextSaturday.getDate() + 1);
    const sundayStr = sunday.toISOString().split('T')[0];

    const weekendUserIds = new Set<string>();
    plannings.forEach((p) => {
      if (p.date === saturdayStr || p.date === sundayStr) {
        weekendUserIds.add(p.garde.id);
      }
    });

    if (weekendUserIds.size === 0) return;

    setRotationOrder((prev) => {
      const keep: string[] = [];
      const end: string[] = [];
      prev.forEach((id) => (weekendUserIds.has(id) ? end.push(id) : keep.push(id)));
      return [...keep, ...end];
    });
  };

  const recreateRotationOrder = () => {
    // Simple: trier par charge croissante si stats disponibles, sinon garder ordre actuel
    if (stats?.repartitionParUtilisateur) {
      const entries = Object.entries(stats.repartitionParUtilisateur);
      const knownIds = new Set(rotationOrder);
      const sortedKnown = [...rotationOrder].sort((a, b) => {
        const ca = stats.repartitionParUtilisateur[a]?.nombreGardes ?? 0;
        const cb = stats.repartitionParUtilisateur[b]?.nombreGardes ?? 0;
        return ca - cb;
      });
      // Ajouter tout utilisateur présent en stats mais pas encore listé
      const rest = entries
        .map(([id]) => id)
        .filter((id) => !knownIds.has(id));
      setRotationOrder([...sortedKnown, ...rest]);
    }
  };

  const saveRotationOrder = async () => {
    setSaving(true);
    try {
      // Essayer d'appeler un endpoint si dispo, sinon fallback silencieux
      const ok = await rotationEquitableService.reorderRotation(
        secteurId,
        serviceId,
        rotationOrder
      );
      if (!ok) {
        console.warn('Reorder endpoint not available, kept client-side only');
      }
    } finally {
      setSaving(false);
    }
  };

  const getUrgenceColor = (urgence: string) => {
    switch (urgence) {
      case 'faible': return 'bg-green-100 text-green-800';
      case 'moyenne': return 'bg-yellow-100 text-yellow-800';
      case 'haute': return 'bg-orange-100 text-orange-800';
      case 'critique': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'declaree': return 'bg-blue-100 text-blue-800';
      case 'ouverte': return 'bg-yellow-100 text-yellow-800';
      case 'en_cours': return 'bg-orange-100 text-orange-800';
      case 'resolue': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'technique': return 'bg-blue-100 text-blue-800';
      case 'securite': return 'bg-red-100 text-red-800';
      case 'maintenance': return 'bg-purple-100 text-purple-800';
      case 'autre': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestion du Planning (Weekends & Jours Fériés)</h1>
        <div className="space-x-2">
          <Button variant="secondary" onClick={moveCurrentWeekendGuardsToEnd}>
            Mettre les gardes du prochain weekend en fin de rotation
          </Button>
          <Button variant="secondary" onClick={recreateRotationOrder}>
            Recréer l'ordre de rotation
          </Button>
          <Button variant="primary" onClick={saveRotationOrder} disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer l\'ordre'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <Card.Header>
            <h3 className="text-lg font-medium text-gray-900">Rotation actuelle</h3>
            <p className="text-sm text-gray-600">Montez/descendez les utilisateurs pour ajuster l'ordre</p>
          </Card.Header>
          <Card.Body>
            <div className="space-y-2">
              {rotationOrder.map((id) => (
                <div key={id} className="flex items-center justify-between border rounded p-2">
                  <span className="text-sm font-medium">{userMap[id]?.name || id}</span>
                  <div className="space-x-2">
                    <Button size="sm" variant="ghost" onClick={() => moveUserUp(id)}>↑</Button>
                    <Button size="sm" variant="ghost" onClick={() => moveUserDown(id)}>↓</Button>
                  </div>
                </div>
              ))}
              {rotationOrder.length === 0 && (
                <div className="text-sm text-gray-500">Aucune donnée de rotation</div>
              )}
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <h3 className="text-lg font-medium text-gray-900">Prochains Weekends/Fériés</h3>
            <p className="text-sm text-gray-600">Affectations planifiées (aperçu)</p>
          </Card.Header>
          <Card.Body>
            <div className="space-y-3">
              {plannings.slice(0, 8).map((p) => (
                <div key={`${p.id}-${p.date}`} className="flex items-center justify-between border rounded p-2">
                  <div className="text-sm">
                    <div className="font-medium">{new Date(p.date).toLocaleDateString('fr-FR')}</div>
                    <div className="text-gray-600">{p.type === 'holiday' ? 'Jour férié' : 'Weekend'}</div>
                  </div>
                  <div className="text-sm font-medium">{p.garde.firstName} {p.garde.lastName}</div>
                </div>
              ))}
              {plannings.length === 0 && (
                <div className="text-sm text-gray-500">Aucun élément planifié</div>
              )}
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <h3 className="text-lg font-medium text-gray-900">Pannes récentes</h3>
            <p className="text-sm text-gray-600">Lecture seule. La déclaration se fait depuis le tableau de bord.</p>
          </Card.Header>
          <Card.Body>
            <div className="space-y-3">
              {pannesRecentes.slice(0, 8).map((panne) => (
                <div key={panne.id} className="border rounded p-2">
                  <div className="text-sm font-medium">{panne.titre}</div>
                  <div className="text-xs text-gray-600 mb-2">
                    {new Date(panne.dateCreation).toLocaleString('fr-FR')}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(panne.type)}`}>
                      {panne.type}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getUrgenceColor(panne.urgence)}`}>
                      {panne.urgence}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatutColor(panne.statut)}`}>
                      {panne.statut}
                    </span>
                  </div>
                  {panne.site && (
                    <div className="text-xs text-gray-500 mt-1">
                      Site: {panne.site.name}
                    </div>
                  )}
                </div>
              ))}
              {pannesRecentes.length === 0 && (
                <div className="text-sm text-gray-500">Aucune panne récente</div>
              )}
            </div>
          </Card.Body>
        </Card>
      </div>

      <div className="text-xs text-gray-500">
        Remarque: Ce module est limité aux weekends et jours fériés marocains. La déclaration de panne est disponible dans le tableau de bord principal.
      </div>
    </div>
  );
};

export default PlanningManagement;



