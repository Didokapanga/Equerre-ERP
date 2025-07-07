import React, { useState } from 'react';
import { Save, X, Edit, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface StockAdjustmentModalProps {
  stock: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function StockAdjustmentModal({ stock, onSuccess, onCancel }: StockAdjustmentModalProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    new_quantity: stock.quantity,
    reason: '',
    notes: ''
  });

  const getDifference = () => {
    return formData.new_quantity - stock.quantity;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const difference = getDifference();
      
      if (difference !== 0) {
        // Create stock movement for adjustment
        const { error: movementError } = await supabase
          .from('stock_movements')
          .insert([{
            company_id: profile?.company_id,
            activity_id: profile?.activity_id,
            stock_id: stock.id,
            product_id: stock.product_id,
            movement_type: 'adjustment',
            quantity: Math.abs(difference),
            reference: `AJUST-${Date.now()}`,
            notes: `${formData.reason}${formData.notes ? ` - ${formData.notes}` : ''}`,
            created_by: profile?.id
          }]);

        if (movementError) throw movementError;
      }

      // Update stock quantity
      const { error: stockError } = await supabase
        .from('stocks')
        .update({ 
          quantity: formData.new_quantity,
          last_updated: new Date().toISOString()
        })
        .eq('id', stock.id);

      if (stockError) throw stockError;

      onSuccess();
    } catch (error) {
      console.error('Error adjusting stock:', error);
      alert('Erreur lors de l\'ajustement du stock.');
    } finally {
      setLoading(false);
    }
  };

  const reasons = [
    'Inventaire physique',
    'Produit endommagé',
    'Produit périmé',
    'Erreur de saisie',
    'Vol/Perte',
    'Retour fournisseur',
    'Autre'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Edit className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Ajustement de stock</h2>
                <p className="text-gray-500 text-sm">{stock.product?.name}</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Warning */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-orange-800">Attention</h4>
                <p className="text-sm text-orange-700 mt-1">
                  Cette action modifiera directement la quantité en stock. Assurez-vous que l'ajustement est justifié.
                </p>
              </div>
            </div>
          </div>

          {/* Current Stock Info */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Stock actuel:</span>
              <span className="font-medium text-gray-900">{stock.quantity} {stock.product?.unit}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nouvelle quantité
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.new_quantity}
                onChange={(e) => setFormData({ ...formData, new_quantity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Difference Display */}
            {getDifference() !== 0 && (
              <div className={`p-3 rounded-lg ${
                getDifference() > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Différence:</span>
                  <span className={`font-bold ${
                    getDifference() > 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {getDifference() > 0 ? '+' : ''}{getDifference()} {stock.product?.unit}
                  </span>
                </div>
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raison de l'ajustement *
              </label>
              <select
                required
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sélectionner une raison</option>
                {reasons.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes complémentaires
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Détails supplémentaires sur cet ajustement..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading || !formData.reason}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center space-x-2 transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>Ajuster</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}