import React, { useState } from 'react';
import { Building2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { RegistrationWizard } from './RegistrationWizard';

export function AuthForm() {
  const [showRegistration, setShowRegistration] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await signIn(formData.email, formData.password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Email ou mot de passe incorrect');
        } else {
          setError(error.message);
        }
      }
    } catch (err: any) {
      setError('Une erreur est survenue: ' + (err.message || 'Erreur inconnue'));
    } finally {
      setLoading(false);
    }
  };

  // Afficher le wizard d'inscription
  if (showRegistration) {
    return (
      <RegistrationWizard 
        onCancel={() => setShowRegistration(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="flex justify-center mb-4">
            <img src="/logo Equerre.png" alt="Equerre" className="h-12 w-auto" />
          </div>
          <p className="text-gray-600">Gestion d'entreprise simplifiée</p>
        </div>

        {/* Formulaire de connexion */}
        <form onSubmit={handleSubmit} className="space-y-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="votre@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <div className="relative mb-8">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Bouton de connexion */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            {loading && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
            Se connecter
          </button>
        </form>
        {/* Aide pour les tests */}
      </div>
    </div>
  );
}