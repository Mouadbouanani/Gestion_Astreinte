import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ArrowLeftIcon, PlusIcon, TrashIcon, UserIcon } from '@heroicons/react/24/outline';

interface Planning {
  _id: string;
  type: 'service' | 'secteur';
  periode: { debut: string; fin: string };
  site: { _id: string; name: string };
  secteur: { _id: string; name: string };
  service?: { _id: string; name: string };
  statut: 'brouillon' | 'en_validation' | 'valide' | 'publie';
  gardes: Array<{
    _id: string;
    date: string;
    utilisateur: { _id: string; firstName: string; lastName: string; role: string };
    heureDebut?: string;
    heureFin?: string;
    commentaire?: string;
    statut?: string;
    remplacant?: { _id: string; firstName: string; lastName: string };
  }>;
  validation?: {
    demandePar?: string;
    demandeLe?: string;
    validePar?: string;
    valideLe?: string;
    commentaireValidation?: string;
    rejete?: boolean;
    motifRejet?: string;
  };
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  role: string;
}

export default function PlanningDetail() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [planning, setPlanning] = useState<Planning | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddGarde, setShowAddGarde] = useState(false);
  const [newGarde, setNewGarde] = useState({
    date: '',
    utilisateur: '',
    heureDebut: '08:00',
    heureFin: '18:00',
    commentaire: ''
  });

  useEffect(() => {
    if (id) {
      loadPlanning();
      loadUsers();
    }
  }, [id]);

  const loadPlanning = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await apiService.getPlanning(id);
      setPlanning(res.data as any);
    } catch (error) {
      console.error('Erreur chargement planning:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await apiService.getUsers();
      setUsers((res.data as any) || []);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    }
  };

  const addGarde = async () => {
    if (!id || !newGarde.date || !newGarde.utilisateur) return;
    try {
      await apiService.addGarde(id, newGarde);
      setShowAddGarde(false);
      setNewGarde({ date: '', utilisateur: '', heureDebut: '08:00', heureFin: '18:00', commentaire: '' });
      loadPlanning();
    } catch (error) {
      console.error('Erreur ajout garde:', error);
    }
  };

  const deleteGarde = async (gardeId: string) => {
    if (!id || !confirm('Supprimer cette garde ?')) return;
    try {
      await apiService.deleteGarde(id, gardeId);
      loadPlanning();
    } catch (error) {
      console.error('Erreur suppression garde:', error);
    }
  };

  const submitPlanning = async () => {
    if (!id || !confirm('Soumettre ce planning pour validation ?')) return;
    try {
      await apiService.submitPlanning(id);
      loadPlanning();
    } catch (error) {
      console.error('Erreur soumission planning:', error);
    }
  };

  const approvePlanning = async () => {
    if (!id || !confirm('Approuver ce planning ?')) return;
    try {
      await apiService.approvePlanning(id, 'Validé');
      loadPlanning();
    } catch (error) {
      console.error('Erreur approbation planning:', error);
    }
  };

  const rejectPlanning = async () => {
    const motif = prompt('Motif de rejet :');
    if (!id || !motif) return;
    try {
      await apiService.rejectPlanning(id, motif);
      loadPlanning();
    } catch (error) {
      console.error('Erreur rejet planning:', error);
    }
  };

  const publishPlanning = async () => {
    if (!id || !confirm('Publier ce planning ?')) return;
    try {
      await apiService.publishPlanning(id);
      loadPlanning();
    } catch (error) {
      console.error('Erreur publication planning:', error);
    }
  };

  if (loading && !planning) {
    return <div className="text-sm text-gray-500">Chargement du planning... Merci de patienter.</div>;
  }

  if (!planning) {
    return <div className="text-sm text-red-500">Planning introuvable.</div>;
  }

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'brouillon': return 'bg-gray-100 text-gray-700';
      case 'en_validation': return 'bg-yellow-100 text-yellow-700';
      case 'valide': return 'bg-green-100 text-green-700';
      case 'publie': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Check if user can manage this planning
  const canManagePlanning = () => {
    if (!planning || !user) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'chef_secteur') {
      return planning.secteur._id === user.secteur?._id;
    }
    if (user.role === 'chef_service') {
      return planning.type === 'service' && planning.service?._id === user.service?._id;
    }
    return false;
  };

  const eligibleUsers = users.filter(u => {
    if (planning.type === 'secteur') {
      // For secteur planning: engineers from the same secteur
      return u.role === 'ingenieur' && u.secteur === planning.secteur._id;
    } else {
      // For service planning: collaborators and chef_service from the same service
      return ['collaborateur', 'chef_service'].includes(u.role) && u.service === planning.service?._id;
    }
  });

  const getAccessMessage = () => {
    if (!canManagePlanning()) {
      if (user?.role === 'chef_secteur') {
        return 'Vous ne pouvez gérer que les plannings de votre secteur.';
      }
      if (user?.role === 'chef_service') {
        return 'Vous ne pouvez gérer que les plannings de service de votre service.';
      }
      return 'Vous n\'avez pas les droits pour gérer ce planning.';
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/planning-management')}>
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <h1 className="text-xl font-semibold">Planning {planning.type}</h1>
        <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(planning.statut)}`}>
          {planning.statut}
        </span>
      </div>

      {getAccessMessage() && (
        <Card>
          <Card.Body>
            <div className="text-center py-4">
              <div className="text-yellow-600 font-medium">{getAccessMessage()}</div>
              <div className="text-sm text-gray-500 mt-2">
                Vous pouvez consulter ce planning mais pas le modifier.
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                {new Date(planning.periode.debut).toLocaleDateString()} → {new Date(planning.periode.fin).toLocaleDateString()}
              </h2>
              <p className="text-sm text-gray-500">
                {planning.site.name} • {planning.secteur.name}
                {planning.service && ` • ${planning.service.name}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {canManagePlanning() && planning.statut === 'brouillon' && (
                <>
                  <Button variant="secondary" onClick={() => setShowAddGarde(true)}>
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Ajouter garde
                  </Button>
                  <Button onClick={submitPlanning}>Soumettre</Button>
                </>
              )}
              {canManagePlanning() && planning.statut === 'en_validation' && (
                <>
                  <Button variant="error" onClick={rejectPlanning}>Rejeter</Button>
                  <Button onClick={approvePlanning}>Approuver</Button>
                </>
              )}
              {canManagePlanning() && planning.statut === 'valide' && (
                <Button onClick={publishPlanning}>Publier</Button>
              )}
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          {canManagePlanning() && showAddGarde && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium mb-4">Ajouter une garde</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={newGarde.date}
                    onChange={e => setNewGarde(g => ({ ...g, date: e.target.value }))}
                    className="input-ocp w-full"
                    min={planning.periode.debut.split('T')[0]}
                    max={planning.periode.fin.split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Utilisateur</label>
                  <select
                    value={newGarde.utilisateur}
                    onChange={e => setNewGarde(g => ({ ...g, utilisateur: e.target.value }))}
                    className="input-ocp w-full"
                  >
                    <option value="">Sélectionner</option>
                    {eligibleUsers.map(user => (
                      <option key={user._id} value={user._id}>
                        {user.firstName} {user.lastName} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Heure début</label>
                  <input
                    type="time"
                    value={newGarde.heureDebut}
                    onChange={e => setNewGarde(g => ({ ...g, heureDebut: e.target.value }))}
                    className="input-ocp w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Heure fin</label>
                  <input
                    type="time"
                    value={newGarde.heureFin}
                    onChange={e => setNewGarde(g => ({ ...g, heureFin: e.target.value }))}
                    className="input-ocp w-full"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="secondary" onClick={() => setShowAddGarde(false)}>Annuler</Button>
                <Button onClick={addGarde} disabled={!newGarde.date || !newGarde.utilisateur}>
                  Ajouter
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {planning.gardes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucune garde assignée.
              </div>
            ) : (
              planning.gardes
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map(garde => (
                  <div key={garde._id} className="p-4 border rounded-lg bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="font-medium">
                          {new Date(garde.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-gray-400" />
                          <span>{garde.utilisateur.firstName} {garde.utilisateur.lastName}</span>
                          <span className="text-xs text-gray-500">({garde.utilisateur.role})</span>
                        </div>
                        {garde.heureDebut && garde.heureFin && (
                          <div className="text-sm text-gray-500">
                            {garde.heureDebut} - {garde.heureFin}
                          </div>
                        )}
                        {garde.remplacant && (
                          <div className="text-sm text-orange-600">
                            Remplacé par {garde.remplacant.firstName} {garde.remplacant.lastName}
                          </div>
                        )}
                      </div>
                      {canManagePlanning() && planning.statut === 'brouillon' && (
                        <Button
                          variant="error"
                          size="sm"
                          onClick={() => deleteGarde(garde._id)}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {garde.commentaire && (
                      <div className="mt-2 text-sm text-gray-600">{garde.commentaire}</div>
                    )}
                  </div>
                ))
            )}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
