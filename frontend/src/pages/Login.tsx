import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { EyeIcon, EyeSlashIcon, UserIcon, LockClosedIcon } from '@heroicons/react/24/outline';

const Login: React.FC = () => {
  const { login, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirection si déjà connecté
  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const success = await login({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
      });

      if (success) {
        const from = location.state?.from?.pathname || '/dashboard';
        window.location.href = from;
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Mode développement supprimé - connexion normale uniquement

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ocp-primary/10 to-ocp-accent/10 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo et titre */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-ocp-primary rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xl">OCP</span>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Gestion d'Astreinte
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Connectez-vous à votre compte
          </p>
        </div>

        {/* Formulaire de connexion */}
        <Card className="mt-8">
          <Card.Body>
            {/* Connexion simplifiée */}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <Input
                label="Adresse email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="votre.email@ocp.ma"
                leftIcon={<UserIcon className="h-5 w-5" />}
              />

              {/* Mot de passe */}
              <Input
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Votre mot de passe"
                leftIcon={<LockClosedIcon className="h-5 w-5" />}
                rightIcon={
                  <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  }
                />

              {/* Se souvenir de moi */}
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 text-ocp-primary focus:ring-ocp-primary border-gray-300 rounded"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
                  Se souvenir de moi
                </label>
              </div>

              {/* Bouton de connexion */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting || isLoading}
                className="w-full"
              >
                Se connecter
              </Button>
            </form>
          </Card.Body>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          © 2024 OCP Group. Tous droits réservés.
        </div>
      </div>
    </div>
  );
};

export default Login;
