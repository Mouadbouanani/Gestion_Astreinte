import React, { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import rotationEquitableService from '@/services/rotation-equitable.service';
import type { StatistiquesRotation } from '@/types/rotation-equitable.types';
import {
  ChartBarIcon,
  UserGroupIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

interface RotationEquitableStatsProps {
  secteurId: string;
  serviceId?: string;
  periode?: { startDate: Date; endDate: Date };
}

const RotationEquitableStats: React.FC<RotationEquitableStatsProps> = ({
  secteurId,
  serviceId,
  periode
}) => {
  const [statistiques, setStatistiques] = useState<StatistiquesRotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [recommandations, setRecommandations] = useState<string[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadStatistiques();
  }, [secteurId, serviceId, periode]);

  const loadStatistiques = async () => {
    setLoading(true);
    try {
      // Données de test temporaires en attendant l'API
      const testStats: StatistiquesRotation = {
        totalGardes: 12,
        gardesParUtilisateur: {
          'user1': 3,
          'user2': 2,
          'user3': 4,
          'user4': 3
        },
        moyenneGardes: 3.0,
        utilisateursSousCharge: ['user2'],
        utilisateursSurCharge: ['user3'],
        prochaineRotation: ['user1', 'user4']
      };
      
      setStatistiques(testStats);
      setRecommandations([
        'Attribuer plus de gardes aux utilisateurs: user2',
        'Réduire les gardes pour: user3'
      ]);
      
      // TODO: Remplacer par l'appel API réel
      // const stats = await rotationEquitableService.getStatistiquesRotation(
      //   secteurId,
      //   serviceId,
      //   periode
      // );
      // setStatistiques(stats);
      // 
      // if (stats) {
      //   const recs = await rotationEquitableService.genererRecommandations(secteurId, serviceId);
      //   setRecommandations(recs);
      // }
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const optimiserRotation = async () => {
    try {
      await rotationEquitableService.optimiserRotation(secteurId, serviceId);
      await loadStatistiques(); // Recharger les statistiques
    } catch (error) {
      console.error('Erreur optimisation rotation:', error);
    }
  };

  const getEquiteStatus = () => {
    if (!statistiques) return { equitable: false, color: 'text-gray-500', icon: InformationCircleIcon };
    
    const { utilisateursSousCharge, utilisateursSurCharge } = statistiques;
    
    if (utilisateursSousCharge.length === 0 && utilisateursSurCharge.length === 0) {
      return { equitable: true, color: 'text-green-600', icon: CheckCircleIcon };
    } else {
      return { equitable: false, color: 'text-orange-600', icon: ExclamationTriangleIcon };
    }
  };

  const getUtilisateurColor = (gardes: number) => {
    if (!statistiques) return 'text-gray-600';
    
    const moyenne = statistiques.moyenneGardes;
    const tolerance = moyenne * 0.2; // 20% de tolérance
    
    if (gardes < moyenne - tolerance) return 'text-blue-600';
    if (gardes > moyenne + tolerance) return 'text-red-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <Card>
        <Card.Body>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Chargement des statistiques...</span>
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (!statistiques) {
    return (
      <Card>
        <Card.Body>
          <div className="text-center py-8 text-gray-500">
            <InformationCircleIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Aucune donnée de rotation disponible</p>
          </div>
        </Card.Body>
      </Card>
    );
  }

  const equiteStatus = getEquiteStatus();
  const IconComponent = equiteStatus.icon;

  return (
    <div className="space-y-4">
      {/* En-tête avec statut d'équité */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900">
                Statistiques de Rotation Équitable
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <IconComponent className={`h-5 w-5 ${equiteStatus.color}`} />
              <span className={`text-sm font-medium ${equiteStatus.color}`}>
                {equiteStatus.equitable ? 'Rotation Équitable' : 'Optimisation Nécessaire'}
              </span>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {statistiques.totalGardes}
              </div>
              <div className="text-sm text-gray-600">Total Gardes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {statistiques.moyenneGardes.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Moyenne par Personne</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {statistiques.utilisateursSousCharge.length}
              </div>
              <div className="text-sm text-gray-600">Sous-chargés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {statistiques.utilisateursSurCharge.length}
              </div>
              <div className="text-sm text-gray-600">Sur-chargés</div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Détails par utilisateur */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium text-gray-900">
              Répartition par Utilisateur
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Masquer' : 'Afficher'} détails
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {showDetails ? (
            <div className="space-y-3">
              {Object.entries(statistiques.gardesParUtilisateur).map(([userId, gardes]) => (
                <div key={userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <UserGroupIcon className="h-5 w-5 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      Utilisateur {userId.slice(-4)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`font-semibold ${getUtilisateurColor(gardes)}`}>
                      {gardes} gardes
                    </span>
                    {gardes < statistiques.moyenneGardes * 0.8 && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Sous-chargé
                      </span>
                    )}
                    {gardes > statistiques.moyenneGardes * 1.2 && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                        Sur-chargé
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <UserGroupIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>Cliquez pour voir la répartition détaillée</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Recommandations */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium text-gray-900">
              Recommandations d'Optimisation
            </h4>
            <Button
              variant="primary"
              size="sm"
              onClick={optimiserRotation}
              className="flex items-center space-x-2"
            >
              <ArrowPathIcon className="h-4 w-4" />
              <span>Optimiser</span>
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {recommandations.length > 0 ? (
            <div className="space-y-2">
              {recommandations.map((recommandation, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-blue-800">{recommandation}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <CheckCircleIcon className="h-8 w-8 mx-auto mb-2 text-green-300" />
              <p>Aucune recommandation nécessaire</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Prochaine rotation suggérée */}
      {statistiques.prochaineRotation.length > 0 && (
        <Card>
          <Card.Header>
            <h4 className="text-md font-medium text-gray-900">
              Prochaine Rotation Suggérée
            </h4>
          </Card.Header>
          <Card.Body>
            <div className="flex flex-wrap gap-2">
              {statistiques.prochaineRotation.map((utilisateur, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                >
                  {utilisateur}
                </span>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default RotationEquitableStats;
