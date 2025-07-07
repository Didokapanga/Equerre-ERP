import React, { useState } from 'react';
import { Save, X, Building, User, Phone, MapPin } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase, Activity } from '../../lib/supabase';

interface ActivityFormProps {
  activity?: Activity | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ActivityForm({ activity, onSuccess, onCancel }: ActivityFormProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: activity?.name || '',
    address: activity?.address || '',
    phone: activity?.phone || '',
    manager_name: activity?.manager_name || '',
    is_active: activity?.is_active ?? true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const activityData = {
        ...formData,
        company_id: profile?.company_id
      };

      if (activity) {
        // Update existing activity
        const { error } = await supabase
          .from('activities')
          .update(activityData)
          .eq('id', activity.id);

        if (error) throw error;
      } else {
        // Create new activity
        const { error } = await supabase
          .from('activities')
          .insert([activityData]);

        if (error) throw error;
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving activity:', error);
      alert('Erreur lors de la sauvegarde: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Building className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {activity ? 'Modifier l\'activité' : 'Nouvelle activité'}
            </h1>
            <p className="text-gray-500">
              {activity ? 'Modifiez les informations de l\'activité' : 'Créez une nouvelle activité ou succursale'}
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Informations générales
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'activité *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Ex: Siège social, Succursale Nord, Restaurant..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Responsable
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={formData.manager_name}
                  onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Nom du responsable"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="+33 1 23 45 67 89"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Adresse complète de l'activité"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                Activité active
              </label>
            </div>
          </div>
        </div>

        {/* Information Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">À propos des activités</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• Les activités représentent vos différents points de vente, succursales ou services</p>
            <p>• Chaque utilisateur peut être assigné à une activité spécifique</p>
            <p>• Les stocks, ventes et achats sont gérés par activité</p>
            <p>• Les propriétaires et administrateurs ont accès à toutes les activités</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center space-x-2 transition-colors"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{activity ? 'Modifier' : 'Créer'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}