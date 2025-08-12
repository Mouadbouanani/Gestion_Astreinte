import React, { useEffect, useState } from 'react';
import { apiService } from '@/services/api';
import type { Indisponibilite, User } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function ReviewIndisponibilites() {
  const [items, setItems] = useState<Indisponibilite[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<{ statut?: string }>({ statut: 'en_attente' });
  const [suggestions, setSuggestions] = useState<Record<string, User[]>>({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiService.getIndisponibilites(filters);
      const list = (res.data as any) || [];
      setItems(list);
      // Preload suggestions for pending items
      const entries = await Promise.all(list.map(async (ind: Indisponibilite) => {
        if (ind.statut !== 'en_attente') return [ind._id, []];
        try {
          const s = await apiService.getIndispoRemplacants(ind._id);
          return [ind._id, (s.data as any) || []];
        } catch { return [ind._id, []]; }
      }));
      const map: Record<string, User[]> = {};
      entries.forEach(([id, users]: any) => { map[id] = users; });
      setSuggestions(map);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [JSON.stringify(filters)]);

  const approve = async (id: string) => { await apiService.approveIndisponibilite(id); load(); };
  const reject = async (id: string) => { await apiService.rejectIndisponibilite(id, 'Non valide'); load(); };

  return (
    <div className="space-y-6">
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Validation des indisponibilités</h2>
              <p className="text-sm text-gray-500">Chef de service / Chef de secteur selon rôle</p>
            </div>
            <div className="flex items-center gap-3">
              <select value={filters.statut || ''} onChange={e => setFilters(f => ({...f, statut: e.target.value || undefined}))} className="input-ocp w-48">
                <option value="">Tous</option>
                <option value="en_attente">En attente</option>
                <option value="approuve">Approuvées</option>
                <option value="refuse">Refusées</option>
              </select>
              <Button variant="secondary" onClick={load}>Rafraîchir</Button>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-sm text-gray-500">Chargement des demandes d'indisponibilités... Merci de patienter.</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-gray-500">Aucune demande.</div>
          ) : (
            <div className="space-y-3">
              {items.map(ind => (
                <div key={ind._id} className="p-4 border rounded-lg bg-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{new Date(ind.dateDebut).toLocaleDateString()} → {new Date(ind.dateFin).toLocaleDateString()}</div>
                      <div className="text-sm text-gray-500">{(ind.utilisateur as any)?.firstName || ''} {(ind.utilisateur as any)?.lastName || ''} — {ind.motif}</div>
                      <div className="text-xs text-gray-500">Statut: {ind.statut}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {ind.statut === 'en_attente' && (
                        <>
                          <Button onClick={() => approve(ind._id)}>Approuver</Button>
                          <Button variant="error" onClick={() => reject(ind._id)}>Refuser</Button>
                        </>
                      )}
                    </div>
                  </div>
                  {ind.statut === 'en_attente' && (
                    <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                      <div className="mb-1">Remplaçants possibles:</div>
                      {suggestions[ind._id]?.length ? (
                        <ul className="list-disc pl-5 space-y-1">
                          {suggestions[ind._id].map(u => (
                            <li key={(u as any)._id}>{(u as any).firstName} {(u as any).lastName} — {(u as any).role}</li>
                          ))}
                        </ul>
                      ) : (
                        <div>Aucune suggestion disponible</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

