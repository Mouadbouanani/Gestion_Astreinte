import React, { useEffect, useMemo, useState } from 'react';
import { apiService } from '@/services/api';
import type { Indisponibilite, IndispoMotif, IndispoStatut } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const motifs: { value: IndispoMotif; label: string }[] = [
  { value: 'conge_annuel', label: 'Congé annuel' },
  { value: 'conge_maladie', label: 'Congé maladie' },
  { value: 'conge_maternite', label: 'Congé maternité' },
  { value: 'conge_paternite', label: 'Congé paternité' },
  { value: 'formation', label: 'Formation' },
  { value: 'mission', label: 'Mission' },
  { value: 'urgence_familiale', label: 'Urgence familiale' },
  { value: 'autre', label: 'Autre' },
];

export default function MyIndisponibilites() {
  const [items, setItems] = useState<Indisponibilite[]>([]);
  const [loading, setLoading] = useState(false);
  const [statut, setStatut] = useState<IndispoStatut | ''>('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiService.getMesIndisponibilites(statut ? { statut } : undefined);
      setItems((res.data as any) || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statut]);

  return (
    <div className="space-y-6">
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Mes indisponibilités</h2>
              <p className="text-sm text-gray-500">Déclarez et gérez vos indisponibilités</p>
            </div>
            <CreateIndispo onCreated={load} />
          </div>
        </Card.Header>
        <Card.Body>
          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm text-gray-600">Filtrer par statut</label>
            <select value={statut} onChange={e => setStatut(e.target.value as any)} className="input-ocp w-48">
              <option value="">Tous</option>
              <option value="en_attente">En attente</option>
              <option value="approuve">Approuvées</option>
              <option value="refuse">Refusées</option>
              <option value="annule">Annulées</option>
            </select>
          </div>

          {loading ? (
            <div className="text-sm text-gray-500">Chargement des indisponibilités... Merci de patienter.</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-gray-500">Aucune indisponibilité.</div>
          ) : (
            <div className="space-y-3">
              {items.map(ind => (
                <div key={ind._id} className="p-4 border rounded-lg flex items-center justify-between bg-white">
                  <div>
                    <div className="font-medium">{new Date(ind.dateDebut).toLocaleDateString()} → {new Date(ind.dateFin).toLocaleDateString()}</div>
                    <div className="text-sm text-gray-500 capitalize">{ind.motif.replace('_',' ')}</div>
                    <div className="text-xs text-gray-500">Statut: {ind.statut}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {ind.statut !== 'annule' && (
                      <Button variant="secondary" onClick={async () => { await apiService.cancelIndisponibilite(ind._id); load(); }}>Annuler</Button>
                    )}
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

function CreateIndispo({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [motif, setMotif] = useState<IndispoMotif>('conge_annuel');
  const [description, setDescription] = useState('');
  const [priorite, setPriorite] = useState<'normale'|'urgente'|'critique'>('normale');
  const [saving, setSaving] = useState(false);

  const canSave = dateDebut && dateFin && motif && (motif !== 'autre' || description.trim().length > 0);

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await apiService.createIndisponibilite({ dateDebut, dateFin, motif, description: description || undefined, priorite });
      setOpen(false);
      setDateDebut(''); setDateFin(''); setMotif('conge_annuel'); setDescription(''); setPriorite('normale');
      onCreated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Button onClick={() => setOpen(true)}>+ Nouvelle indispo</Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Déclarer une indisponibilité</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Date début</label>
                <input type="date" className="input-ocp" value={dateDebut} onChange={e=>setDateDebut(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm mb-1">Date fin</label>
                <input type="date" className="input-ocp" value={dateFin} onChange={e=>setDateFin(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm mb-1">Motif</label>
                <select className="input-ocp" value={motif} onChange={e=>setMotif(e.target.value as IndispoMotif)}>
                  {motifs.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              {motif === 'autre' && (
                <div>
                  <label className="block text-sm mb-1">Description</label>
                  <textarea className="input-ocp" value={description} onChange={e=>setDescription(e.target.value)} rows={3}/>
                </div>
              )}
              <div>
                <label className="block text-sm mb-1">Priorité</label>
                <select className="input-ocp" value={priorite} onChange={e=>setPriorite(e.target.value as any)}>
                  <option value="normale">Normale</option>
                  <option value="urgente">Urgente</option>
                  <option value="critique">Critique</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={()=>setOpen(false)}>Fermer</Button>
              <Button onClick={save} disabled={!canSave || saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

