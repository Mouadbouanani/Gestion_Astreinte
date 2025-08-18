import React, { useEffect, useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { apiService } from '@/services/api';
import rotationEquitableService from '@/services/rotation-equitable.service';

interface PlanningManagerProps {
  secteurId?: string;
  serviceId?: string;
  startDate: Date;
  endDate: Date;
  currentUserRole: 'admin' | 'chef_secteur' | 'chef_service' | string;
}

interface SimpleUser {
  _id: string;
  firstName: string;
  lastName: string;
  role: string;
}

const PlanningManager: React.FC<PlanningManagerProps> = ({
  secteurId,
  serviceId,
  startDate,
  endDate,
  currentUserRole
}) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [saving, setSaving] = useState(false);

  // Who can manage whom
  const managedRole: 'ingenieur' | 'collaborateur' | null = useMemo(() => {
    if (currentUserRole === 'chef_secteur') return 'ingenieur';
    if (currentUserRole === 'chef_service') return 'collaborateur';
    if (currentUserRole === 'admin') return 'collaborateur';
    return null;
  }, [currentUserRole]);

  useEffect(() => {
    const loadUsers = async () => {
      if (!secteurId && !serviceId) return;
      setLoading(true);
      try {
        let resp;
        if (serviceId) {
          resp = await apiService.getUsersByService(serviceId, managedRole || undefined);
        } else if (secteurId) {
          resp = await apiService.getUsersBySecteur(secteurId, managedRole || undefined);
        }
        const list = (resp?.data || []) as any[];
        setUsers(list.map((u) => ({ _id: u._id || u.id, firstName: u.firstName, lastName: u.lastName, role: u.role })));
      } catch (e) {
        console.error('Erreur chargement utilisateurs pour la rotation:', e);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, [secteurId, serviceId, managedRole]);

  const moveUser = (index: number, direction: 'up' | 'down') => {
    setUsers((prev) => {
      const next = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      const tmp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = tmp;
      return next;
    });
  };

  const sendToEnd = (index: number) => {
    setUsers((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.push(item);
      return next;
    });
  };

  const saveOrder = async () => {
    if (!secteurId && !serviceId) return;
    setSaving(true);
    try {
      const ok = await rotationEquitableService.reorderRotation(
        secteurId as string,
        serviceId,
        users.map((u) => u._id)
      );
      if (ok) {
        // no toast component here, use alert minimal
        alert('Rotation enregistrée');
      } else {
        alert("Échec de l'enregistrement");
      }
    } catch (e) {
      console.error('Erreur sauvegarde ordre rotation:', e);
      alert('Erreur pendant la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const generateEquitable = async () => {
    if (!secteurId) return;
    setSaving(true);
    try {
      await rotationEquitableService.genererRotationEquitable(startDate, endDate, secteurId, serviceId);
      alert('Rotation équitable générée');
    } catch (e) {
      console.error('Erreur génération rotation:', e);
      alert('Erreur génération rotation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Gestion simple de la rotation</h3>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={generateEquitable} disabled={saving || loading}>
              Générer équitable
            </Button>
            <Button variant="primary" size="sm" onClick={saveOrder} disabled={saving || loading}>
              Enregistrer l'ordre
            </Button>
          </div>
        </div>
      </Card.Header>
      <Card.Body>
        <div className="text-sm text-gray-600 mb-3">
          - Chef secteur gère les ingénieurs. Chef service gère les collaborateurs. Samedi 18:00 → Dimanche 08:00. Jours fériés: 24h.
        </div>
        {loading ? (
          <div className="py-6 text-center text-gray-500">Chargement...</div>
        ) : (
          <div className="space-y-2">
            {users.map((u, idx) => (
              <div key={u._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="font-medium text-gray-900">
                  {idx + 1}. {u.firstName} {u.lastName} <span className="text-xs text-gray-500">({u.role})</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => moveUser(idx, 'up')}>↑</Button>
                  <Button variant="ghost" size="sm" onClick={() => moveUser(idx, 'down')}>↓</Button>
                  <Button variant="secondary" size="sm" onClick={() => sendToEnd(idx)}>Envoyer en fin</Button>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <div className="py-6 text-center text-gray-500">Aucun utilisateur à gérer</div>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default PlanningManager;




