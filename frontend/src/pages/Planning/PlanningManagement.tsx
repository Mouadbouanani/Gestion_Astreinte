// Simplified PlanningManagement Component
import React, { useEffect, useMemo, useState } from 'react';
// import Card from '@/components/ui/Card';
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
    (async () => {
      const data = await weekendHolidayService.getWeekendHolidayPlanning(
          periode.startDate,
          periode.endDate,
          secteurId
      );
      setPlannings(data);

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

    (async () => {
      const s = await rotationEquitableService.getStatistiquesRotation(secteurId || '', serviceId, periode);
      if (s) setStats(s);
    })();

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
    if (stats?.repartitionParUtilisateur) {
      const entries = Object.entries(stats.repartitionParUtilisateur);
      const knownIds = new Set(rotationOrder);
      const sortedKnown = [...rotationOrder].sort((a, b) => {
        const ca = stats.repartitionParUtilisateur[a]?.nombreGardes ?? 0;
        const cb = stats.repartitionParUtilisateur[b]?.nombreGardes ?? 0;
        return ca - cb;
      });
      const rest = entries
          .map(([id]) => id)
          .filter((id) => !knownIds.has(id));
      setRotationOrder([...sortedKnown, ...rest]);
    }
  };

  const saveRotationOrder = async () => {
    setSaving(true);
    try {
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
      case 'faible': return 'text-green-700 bg-green-50';
      case 'moyenne': return 'text-yellow-700 bg-yellow-50';
      case 'haute': return 'text-orange-700 bg-orange-50';
      case 'critique': return 'text-red-700 bg-red-50';
      default: return 'text-gray-700 bg-gray-50';
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'declaree': return 'text-blue-700 bg-blue-50';
      case 'ouverte': return 'text-yellow-700 bg-yellow-50';
      case 'en_cours': return 'text-orange-700 bg-orange-50';
      case 'resolue': return 'text-green-700 bg-green-50';
      default: return 'text-gray-700 bg-gray-50';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'technique': return 'text-blue-700 bg-blue-50';
      case 'securite': return 'text-red-700 bg-red-50';
      case 'maintenance': return 'text-purple-700 bg-purple-50';
      case 'autre': return 'text-gray-700 bg-gray-50';
      default: return 'text-gray-700 bg-gray-50';
    }
  };

  return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestion du Planning</h1>
          <div className="flex gap-2">
            <Button onClick={moveCurrentWeekendGuardsToEnd}>
              Prochain weekend en fin
            </Button>
            <Button onClick={recreateRotationOrder}>
              Recréer rotation
            </Button>
            <Button onClick={saveRotationOrder} disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rotation */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-medium text-gray-900 mb-3">Ordre de rotation</h3>
            <div className="space-y-2">
              {rotationOrder.map((id, index) => (
                  <div key={id} className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">
                  {index + 1}. {userMap[id]?.name || id}
                </span>
                    <div className="flex gap-1">
                      <button
                          onClick={() => moveUserUp(id)}
                          className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
                      >
                        ↑
                      </button>
                      <button
                          onClick={() => moveUserDown(id)}
                          className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
              ))}
              {rotationOrder.length === 0 && (
                  <p className="text-sm text-gray-500">Aucune rotation</p>
              )}
            </div>
          </div>

          {/* Planning */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-medium text-gray-900 mb-3">Prochaines gardes</h3>
            <div className="space-y-2">
              {plannings.slice(0, 6).map((p) => (
                  <div key={`${p.id}-${p.date}`} className="p-2 border rounded">
                    <div className="text-sm font-medium">
                      {new Date(p.date).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="text-xs text-gray-600">
                      {p.garde.firstName} {p.garde.lastName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {p.type === 'holiday' ? 'Férié' : 'Weekend'}
                    </div>
                  </div>
              ))}
              {plannings.length === 0 && (
                  <p className="text-sm text-gray-500">Aucun planning</p>
              )}
            </div>
          </div>

          {/* Pannes */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-medium text-gray-900 mb-3">Pannes récentes</h3>
            <div className="space-y-2">
              {pannesRecentes.slice(0, 6).map((panne) => (
                  <div key={panne.id} className="p-2 border rounded">
                    <div className="text-sm font-medium">{panne.titre}</div>
                    <div className="text-xs text-gray-600 mb-1">
                      {new Date(panne.dateCreation).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="flex gap-1">
                  <span className={`px-2 py-0.5 text-xs rounded ${getTypeColor(panne.type)}`}>
                    {panne.type}
                  </span>
                      <span className={`px-2 py-0.5 text-xs rounded ${getUrgenceColor(panne.urgence)}`}>
                    {panne.urgence}
                  </span>
                      <span className={`px-2 py-0.5 text-xs rounded ${getStatutColor(panne.statut)}`}>
                    {panne.statut}
                  </span>
                    </div>
                  </div>
              ))}
              {pannesRecentes.length === 0 && (
                  <p className="text-sm text-gray-500">Aucune panne</p>
              )}
            </div>
          </div>
        </div>
      </div>
  );
};

export default PlanningManagement;