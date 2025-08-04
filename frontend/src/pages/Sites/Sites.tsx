// frontend/src/pages/Sites/SitesViewPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import {
  BuildingOfficeIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import apiService from '@/services/api';
import Badge from '@/components/ui/Badge';

interface Site {
  id: string;
  name: string;
  location: string;
  address: string;
  status: 'active' | 'inactive';
  secteurs: number;
  employees: number;
  code: string;
}

const SitesViewPage: React.FC = () => {
  const { user } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getSites();
      setSites(response.data);
    } catch (error) {
      console.error('Error loading sites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocp-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-ocp-primary to-ocp-accent rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">Sites OCP</h1>
        <p className="mt-2 opacity-90">
          Liste des sites du groupe OCP
        </p>
      </div>

      {/* Sites List */}
      <Card>
        <Card.Header>
          <h3 className="text-lg font-medium text-gray-900">
            {user?.site?.name ? `Site: ${user.site.name}` : 'Tous les sites'}
          </h3>
        </Card.Header>
        <Card.Body>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sites.map((site) => (
              <div
                key={site.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <BuildingOfficeIcon className="h-5 w-5 text-gray-500" />
                        <h4 className="text-lg font-medium text-gray-900">
                          {site.name}
                          {user?.site?.id === site.id && (
                            <span className="ml-2 text-xs text-ocp-primary">(Votre site)</span>
                          )}
                        </h4>
                      </div>
                      <Badge variant={site.status === 'active' ? 'success' : 'warning'}>
                        {site.status === 'active' ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600 flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {site.location}
                      </p>
                      <p className="text-sm text-gray-600">
                        Code: <span className="font-mono">{site.code}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        {site.secteurs} secteurs • {site.employees} employés
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default SitesViewPage;