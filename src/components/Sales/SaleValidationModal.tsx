import React, { useState, useEffect } from 'react';
import { Save, X, Package, AlertTriangle, CheckCircle, Truck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase, Sale } from '../../lib/supabase';

interface SaleValidationModalProps {
  sale: Sale;
  onSuccess: () => void;
  onCancel: () => void;
}

interface StockValidation {
  product_id: string;
  product_name: string;
  required_quantity: number;
  available_quantity: number;
  is_sufficient: boolean;
}

export function SaleValidationModal({ sale, onSuccess, onCancel }: SaleValidationModalProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stockValidation, setStockValidation] = useState<StockValidation[]>([]);
  const [validationLoading, setValidationLoading] = useState(true);

  useEffect(() => {
    validateStock();
  }, []);

  const validateStock = async () => {
    try {
      console.log('Validation du stock pour la vente:', sale.id);

      const { data, error } = await supabase
        .rpc('validate_sale_stock', { p_sale_id: sale.id });

      if (error) {
        console.error('Erreur lors de la validation du stock:', error);
        throw error;
      }

      console.log('Résultat de la validation du stock:', data);
      setStockValidation(data || []);
    } catch (error) {
      console.error('Error validating stock:', error);
      setError('Erreur lors de la vérification du stock');
    } finally {
      setValidationLoading(false);
    }
  };

  const hasInsufficientStock = () => {
    return stockValidation.some(item => !item.is_sufficient);
  };

  const getInsufficientProducts = () => {
    return stockValidation.filter(item => !item.is_sufficient);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (hasInsufficientStock()) {
      const insufficientProducts = getInsufficientProducts();
      const errorMessage = 'Stock insuffisant pour les produits suivants:\n' +
        insufficientProducts.map(item =>
          `• ${item.product_name} - Stock: ${item.available_quantity}, Demandé: ${item.required_quantity}`
        ).join('\n');

      setError(errorMessage);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Vérifier les permissions
      if (!profile?.company_id || !profile?.activity_id) {
        throw new Error('Informations utilisateur manquantes');
      }

      if (sale.company_id !== profile.company_id) {
        throw new Error('Accès non autorisé à cette vente');
      }

      console.log('Début de la validation de la vente:', sale.id);
      console.log('Statut actuel:', sale.status);

      // Mettre à jour le statut de la vente vers 'livre'
      // Ceci déclenchera automatiquement la fonction de mise à jour du stock
      const { error: saleError } = await supabase
        .from('sales')
        .update({ status: 'livre' })
        .eq('id', sale.id);

      if (saleError) {
        console.error('Erreur lors de la mise à jour du statut:', saleError);

        // Vérifier si c'est une erreur de stock insuffisant
        if (saleError.message && saleError.message.includes('Stock insuffisant')) {
          setError(saleError.message);
          return;
        }

        throw saleError;
      }

      console.log('Statut de la vente mis à jour vers "livre"');
      console.log('Le trigger a déduit le stock automatiquement');

      onSuccess();
    } catch (error: any) {
      console.error('Erreur lors de la validation:', error);

      // Afficher le message d'erreur approprié
      if (error.message && error.message.includes('Stock insuffisant')) {
        setError(error.message);
      } else {
        setError(error.message || 'Erreur lors de la validation de la livraison');
      }
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
              <div className="p-3 bg-blue-100 rounded-lg">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Validation de livraison</h2>
                <p className="text-gray-500">Vente {sale.sale_number}</p>
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
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-red-800 font-medium">Erreur</span>
                  <pre className="text-red-700 mt-1 whitespace-pre-wrap text-sm">{error}</pre>
                </div>
              </div>
            </div>
          )}

          {/* Sale Info */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Client</p>
                <p className="font-medium">{sale.customer?.name || 'Client anonyme'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date de vente</p>
                <p className="font-medium">{new Date(sale.sale_date).toLocaleDateString('fr-FR')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Montant total</p>
                <p className="font-medium">{sale.total_amount.toLocaleString()} CDF</p>
              </div>
            </div>
          </div>

          {/* Stock Validation */}
          {validationLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Status Alert */}
              {hasInsufficientStock() ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span className="text-red-800 font-medium">Stock insuffisant détecté</span>
                  </div>
                  <p className="text-red-700 text-sm mt-1">
                    Certains produits n'ont pas suffisamment de stock pour cette vente.
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-800 font-medium">Stock suffisant</span>
                  </div>
                  <p className="text-green-700 text-sm mt-1">
                    Tous les produits sont disponibles en stock.
                  </p>
                </div>
              )}

              {/* Stock Details */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Vérification du stock</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Produit
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Qté demandée
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Stock disponible
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Statut
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {stockValidation.map((item, index) => (
                        <tr key={index} className={`hover:bg-gray-50 ${!item.is_sufficient ? 'bg-red-50' : ''}`}>
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {item.product_name}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {item.required_quantity}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${item.available_quantity >= item.required_quantity
                              ? 'text-green-600'
                              : 'text-red-600'
                              }`}>
                              {item.available_quantity}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {item.is_sufficient ? (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Disponible
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                Insuffisant
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

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
              onClick={handleSubmit}
              disabled={loading || hasInsufficientStock() || validationLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              <span>Valider la livraison</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}