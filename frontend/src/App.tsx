
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Layout } from '@/components/common/Layout';
import Login from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import MonSecteur from '@/pages/MonSecteur/MonSecteur';
import MonService from '@/pages/MonService/MonService';
import PlanningAstreinte from '@/pages/Planning/PlanningAstreinte';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Route publique */}
            <Route path="/login" element={<Login />} />

            {/* Dashboard accessible sans authentification */}
            <Route path="/" element={<Layout />}>
              {/* Redirection par défaut vers dashboard */}
              <Route index element={<Navigate to="/dashboard" replace />} />

              {/* Dashboard accessible à tous */}
              <Route path="dashboard" element={<Dashboard />} />
            </Route>

            {/* Routes protégées nécessitant une authentification */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              {/* Planning d'astreinte - accessible à tous les utilisateurs connectés */}
              <Route path="planning" element={<PlanningAstreinte />} />

              {/* Mon Secteur - chef secteur uniquement */}
              <Route path="mon-secteur" element={
                <ProtectedRoute requiredRoles={['chef_secteur']}>
                  <MonSecteur />
                </ProtectedRoute>
              } />

              {/* Mon Service - chef service uniquement */}
              <Route path="mon-service" element={
                <ProtectedRoute requiredRoles={['chef_service']}>
                  <MonService />
                </ProtectedRoute>
              } />

              {/* Routes admin uniquement */}
              <Route path="sites" element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Gestion des Sites</h1>
                    <p className="text-gray-600 mt-2">Page en cours de développement...</p>
                  </div>
                </ProtectedRoute>
              } />

              <Route path="secteurs" element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Gestion des Secteurs</h1>
                    <p className="text-gray-600 mt-2">Page en cours de développement...</p>
                  </div>
                </ProtectedRoute>
              } />

              <Route path="services" element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Gestion des Services</h1>
                    <p className="text-gray-600 mt-2">Page en cours de développement...</p>
                  </div>
                </ProtectedRoute>
              } />

              <Route path="users" element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Gestion des Utilisateurs</h1>
                    <p className="text-gray-600 mt-2">Page en cours de développement...</p>
                  </div>
                </ProtectedRoute>
              } />

              {/* Routes chef secteur */}
              <Route path="mon-secteur" element={
                <ProtectedRoute requiredRoles={['chef_secteur']}>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Mon Secteur</h1>
                    <p className="text-gray-600 mt-2">Page en cours de développement...</p>
                  </div>
                </ProtectedRoute>
              } />

              <Route path="mes-services" element={
                <ProtectedRoute requiredRoles={['chef_secteur']}>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Mes Services</h1>
                    <p className="text-gray-600 mt-2">Page en cours de développement...</p>
                  </div>
                </ProtectedRoute>
              } />

              {/* Routes chef service */}
              <Route path="mon-service" element={
                <ProtectedRoute requiredRoles={['chef_service']}>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Mon Service</h1>
                    <p className="text-gray-600 mt-2">Page en cours de développement...</p>
                  </div>
                </ProtectedRoute>
              } />

              {/* Routes planning */}
              <Route path="planning" element={
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Planning d'Astreinte</h1>
                  <p className="text-gray-600 mt-2">Page en cours de développement...</p>
                </div>
              } />

              <Route path="mes-gardes" element={
                <ProtectedRoute requiredRoles={['ingenieur', 'collaborateur']}>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Mes Gardes</h1>
                    <p className="text-gray-600 mt-2">Page en cours de développement...</p>
                  </div>
                </ProtectedRoute>
              } />

              {/* Routes rapports */}
              <Route path="rapports" element={
                <ProtectedRoute requiredRoles={['admin', 'chef_secteur', 'chef_service']}>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Rapports</h1>
                    <p className="text-gray-600 mt-2">Page en cours de développement...</p>
                  </div>
                </ProtectedRoute>
              } />

              {/* Routes paramètres */}
              <Route path="parametres" element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Paramètres</h1>
                    <p className="text-gray-600 mt-2">Page en cours de développement...</p>
                  </div>
                </ProtectedRoute>
              } />
            </Route>

            {/* Route 404 */}
            <Route path="*" element={
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900">404</h1>
                  <p className="text-gray-600 mt-2">Page non trouvée</p>
                  <a href="/dashboard" className="btn-primary mt-4 inline-block">
                    Retour au Dashboard
                  </a>
                </div>
              </div>
            } />
          </Routes>

          {/* Notifications toast */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#374151',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;