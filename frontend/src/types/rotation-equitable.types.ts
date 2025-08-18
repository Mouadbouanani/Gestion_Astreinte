// Types pour la rotation équitable

export interface RotationEquitableConfig {
  id: string;
  secteurId: string;
  serviceId?: string;
  algorithme: 'round_robin' | 'weighted' | 'preference_based';
  parametres: {
    respecterPreferences: boolean;
    equilibrerCharge: boolean;
    minimiserConflits: boolean;
    poidsParRole: {
      [role: string]: number;
    };
  };
  contraintes: {
    maxGardesConsecutives: number;
    minReposEntreGardes: number; // en heures
    respecterIndisponibilites: boolean;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GardeRotation {
  id: string;
  date: string;
  utilisateur: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    phone?: string;
    email: string;
    address?: string;
  };
  type: 'weekend' | 'ferie' | 'remplacement';
  secteur: string;
  service?: string;
  heureDebut: string;
  heureFin: string;
  statut: 'planifie' | 'confirme' | 'refuse' | 'complete';
  priorite: number; // 0 = normale, 1 = haute, 2 = critique
}

export interface StatistiquesRotation {
  secteurId: string;
  serviceId?: string;
  periode: {
    debut: string;
    fin: string;
  };
  totalGardes: number;
  moyenneGardes: number;
  utilisateursSousCharge: string[];
  utilisateursSurCharge: string[];
  repartitionParUtilisateur: {
    [userId: string]: {
      nom: string;
      nombreGardes: number;
      pourcentageCharge: number;
    };
  };
  equiteScore: number; // 0-100, 100 = parfaitement équitable
}

export interface PreferenceUtilisateur {
  id: string;
  utilisateurId: string;
  typePreference: 'disponibilite' | 'indisponibilite' | 'preference_horaire';
  dateDebut: string;
  dateFin: string;
  joursSemaine?: number[]; // 0 = dimanche, 1 = lundi, etc.
  heureDebut?: string;
  heureFin?: string;
  priorite: 'basse' | 'moyenne' | 'haute';
  raison?: string;
  statut: 'en_attente' | 'approuve' | 'refuse';
  createdAt: string;
}

export interface ConflitRotation {
  id: string;
  type: 'double_assignation' | 'indisponibilite' | 'surcharge' | 'sous_charge';
  description: string;
  utilisateursImpactes: string[];
  dateImpactee: string;
  severite: 'faible' | 'moyenne' | 'haute' | 'critique';
  suggestions: string[];
  resolu: boolean;
  createdAt: string;
}

export interface OptimisationResult {
  success: boolean;
  message: string;
  rotationOptimisee: GardeRotation[];
  conflitsResolus: ConflitRotation[];
  conflitsRestants: ConflitRotation[];
  ameliorationEquite: {
    avant: number;
    apres: number;
    amelioration: number;
  };
}