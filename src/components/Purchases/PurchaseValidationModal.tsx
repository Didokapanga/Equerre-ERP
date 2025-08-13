import React, { useState } from 'react';
import { Save, X, Package, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase, Purchase } from '../../lib/supabase';

interface PurchaseValidationModalProps {
  purchase: Purchase;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PurchaseValidationModal({ purchase, onSuccess, onCancel }: PurchaseValidationModalProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState(
    purchase.purchase_items?.map(item => ({
      ...item,
      received_quantity: item.received_quantity || 0
    })) || []
  );

  const handleItemChange = (index: number, receivedQuantity: number) => {
    const newItems = [...items];
    newItems[index].received_quantity = Math.max(0, receivedQuantity);
    setItems(newItems);
  };

  const getTotalReceived = () => {
    return items.reduce((sum, item) => sum + item.received_quantity, 0);
  };

  const getTotalOrdered = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const isPartialDelivery = () => {
    return items.some(item => item.received_quantity < item.quantity);
  };

  const isOverDelivery = () => {
    return items.some(item => item.received_quantity > item.quantity);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Vérifier que l'utilisateur a les permissions
      if (!profile?.company_id || !profile?.activity_id) {
        throw new Error('Informations utilisateur manquantes');
      }

      // Vérifier que l'achat appartient à la bonne entreprise
      if (purchase.company_id !== profile.company_id) {
        throw new Error('Accès non autorisé à cet achat');
      }

      console.log('Début de la validation de l\'achat:', purchase.id);
      console.log('Items à traiter:', items);

      // Mettre à jour les quantités reçues pour chaque article
      for (const item of items) {
        console.log('Mise à jour de l\'item:', item.id, 'quantité reçue:', item.received_quantity);

        const { error: itemError } = await supabase
          .from('purchase_items')
          .update({ received_quantity: item.received_quantity })
          .eq('id', item.id);

        if (itemError) {
          console.error('Erreur lors de la mise à jour de l\'item:', itemError);
          throw itemError;
        }
      }

      console.log('Mise à jour du statut de l\'achat vers "recu"');

      // Mettre à jour le statut de l'achat vers 'recu'
      // Ceci déclenchera automatiquement la fonction de mise à jour du stock
      const { error: purchaseError } = await supabase
        .from('purchases')
        .update({ status: 'recu' })
        .eq('id', purchase.id);

      if (purchaseError) {
        console.error('Erreur lors de la mise à jour du statut:', purchaseError);
        throw purchaseError;
      }

      console.log('Validation terminée avec succès');
      onSuccess();
    } catch (error: any) {
      console.error('Erreur lors de la validation:', error);
      setError(error.message || 'Erreur lors de la validation de la réception');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Validation de réception</h2>
                <p className="text-gray-500">Achat {purchase.purchase_number}</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="text-red-800 font-medium">Erreur</span>
              </div>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          )}

          {/* Purchase Info */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Fournisseur</p>
                <p className="font-medium">{purchase.supplier?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date d'achat</p>
                <p className="font-medium">{new Date(purchase.purchase_date).toLocaleDateString('fr-FR')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Montant total</p>
                <p className="font-medium">{purchase.total_amount.toLocaleString()} €</p>
              </div>
            </div>
          </div>

          {/* Status Alerts */}
          {isPartialDelivery() && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span className="text-orange-800 font-medium">Livraison partielle détectée</span>
              </div>
            </div>
          )}

          {isOverDelivery() && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <span className="text-blue-800 font-medium">Livraison excédentaire détectée</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Items Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Articles à réceptionner</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Produit
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Qté commandée
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Qté reçue
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Prix unitaire
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Total
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.map((item, index) => {
                      const isComplete = item.received_quantity === item.quantity;
                      const isPartial = item.received_quantity > 0 && item.received_quantity < item.quantity;
                      const isOver = item.received_quantity > item.quantity;

                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {item.product?.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                Code: {item.product?.code}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {item.quantity} {item.product?.unit}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              min="0"
                              value={item.received_quantity}
                              onChange={(e) => handleItemChange(index, parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <span className="ml-1 text-sm text-gray-500">{item.product?.unit}</span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {item.unit_price.toFixed(2)} CDF
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {(item.received_quantity * item.unit_price).toFixed(2)} CDF
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {isComplete && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Complet
                              </span>
                            )}
                            {isPartial && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                                Partiel
                              </span>
                            )}
                            {isOver && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                Excédent
                              </span>
                            )}
                            {item.received_quantity === 0 && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                Non reçu
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-blue-600">Total commandé</p>
                  <p className="text-2xl font-bold text-blue-900">{getTotalOrdered()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-blue-600">Total reçu</p>
                  <p className="text-2xl font-bold text-blue-900">{getTotalReceived()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-blue-600">Taux de réception</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {getTotalOrdered() > 0 ? Math.round((getTotalReceived() / getTotalOrdered()) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading || getTotalReceived() === 0}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <span>Valider la réception</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}