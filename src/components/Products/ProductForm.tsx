import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase, Product, Activity } from '../../lib/supabase';

interface ProductFormProps {
  product?: Product | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [formData, setFormData] = useState({
    code: product?.code || '',
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category || '',
    unit: product?.unit || 'pièce',
    purchase_price: product?.purchase_price || 0,
    sale_price: product?.sale_price || 0,
    min_stock_level: product?.min_stock_level || 0,
    activity_id: product?.activity_id || profile?.activity_id || '',
    is_active: product?.is_active ?? true
  });

  useEffect(() => {
    if (profile?.company_id) {
      loadActivities();
    }
  }, [profile?.company_id]);

  const loadActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('company_id', profile?.company_id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        ...formData,
        company_id: profile?.company_id
      };

      if (product) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id);

        if (error) throw error;
      } else {
        // Create new product
        const { error } = await supabase
          .from('products')
          .insert([productData]);

        if (error) throw error;
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving product:', error);
      if (error.code === '23505') {
        alert('Ce code produit existe déjà dans votre entreprise.');
      } else {
        alert('Erreur lors de la sauvegarde du produit.' + (error?.message || 'inconnue'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Vérifier si l'utilisateur peut sélectionner l'activité
  const canSelectActivity = () => {
    return profile?.role === 'proprietaire';
  };

  // Si l'utilisateur n'est pas propriétaire, on affecte automatiquement son activité à formData
  useEffect(() => {
  if (!canSelectActivity() && profile?.activity?.id) {
    setFormData((prev) => ({
      ...prev,
      activity_id: profile.activity.id
    }));
  }
}, [profile]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {product ? 'Modifier le produit' : 'Nouveau produit'}
        </h1>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Informations du produit</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code produit *
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: PROD001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du produit *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nom du produit"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Description du produit"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Électronique, Vêtements..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unité
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pièce">Pièce</option>
                <option value="kg">Kilogramme</option>
                <option value="g">Gramme</option>
                <option value="l">Litre</option>
                <option value="ml">Millilitre</option>
                <option value="m">Mètre</option>
                <option value="cm">Centimètre</option>
                <option value="m²">Mètre carré</option>
                <option value="m³">Mètre cube</option>
                <option value="lot">Lot</option>
                <option value="boîte">Boîte</option>
                <option value="carton">Carton</option>
              </select>
            </div>

            {/* Sélection d'activité (seulement pour les propriétaires) */}
            {canSelectActivity() && activities.length > 0 && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activité *
                </label>
                <select
                  required
                  value={formData.activity_id}
                  onChange={(e) => setFormData({ ...formData, activity_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sélectionner une activité</option>
                  {activities.map((activity) => (
                    <option key={activity.id} value={activity.id}>
                      {activity.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  En tant que propriétaire, vous pouvez assigner ce produit à n'importe quelle activité
                </p>
              </div>
            )}

            {/* Info pour les non-propriétaires */}
            {!canSelectActivity() && (
              <div className="md:col-span-2">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Activité assignée:</strong> {profile?.activity?.name || 'Non définie'}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Ce produit sera automatiquement assigné à votre activité
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prix d'achat ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prix de vente ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.sale_price}
                onChange={(e) => setFormData({ ...formData, sale_price: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seuil de stock minimum
              </label>
              <input
                type="number"
                min="0"
                value={formData.min_stock_level}
                onChange={(e) => setFormData({ ...formData, min_stock_level: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                Produit actif
              </label>
            </div>
          </div>

          {formData.purchase_price > 0 && formData.sale_price > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Marge:</strong> {((formData.sale_price - formData.purchase_price) / formData.purchase_price * 100).toFixed(1)}%
                ({(formData.sale_price - formData.purchase_price).toFixed(2)}$)
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{product ? 'Modifier' : 'Créer'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}