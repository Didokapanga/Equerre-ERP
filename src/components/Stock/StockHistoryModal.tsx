import React from 'react';
import { X, TrendingUp, TrendingDown, Edit, Calendar, User, FileText } from 'lucide-react';

interface StockHistoryModalProps {
  stock: any;
  movements: any[];
  onClose: () => void;
}

export function StockHistoryModal({ stock, movements, onClose }: StockHistoryModalProps) {
  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'out':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'adjustment':
        return <Edit className="h-4 w-4 text-orange-600" />;
      default:
        return <Edit className="h-4 w-4 text-gray-600" />;
    }
  };

  const getMovementLabel = (type: string) => {
    switch (type) {
      case 'in':
        return 'Entrée';
      case 'out':
        return 'Sortie';
      case 'adjustment':
        return 'Ajustement';
      default:
        return type;
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'in':
        return 'bg-green-100 text-green-800';
      case 'out':
        return 'bg-red-100 text-red-800';
      case 'adjustment':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Historique du stock</h2>
              <p className="text-gray-500">{stock.product?.name} - Code: {stock.product?.code}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Current Stock Info */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Stock actuel</p>
                <p className="text-2xl font-bold text-gray-900">{stock.quantity}</p>
                <p className="text-xs text-gray-500">{stock.product?.unit}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Réservé</p>
                <p className="text-2xl font-bold text-orange-600">{stock.reserved_quantity}</p>
                <p className="text-xs text-gray-500">{stock.product?.unit}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Disponible</p>
                <p className="text-2xl font-bold text-green-600">{stock.quantity - stock.reserved_quantity}</p>
                <p className="text-xs text-gray-500">{stock.product?.unit}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Stock minimum</p>
                <p className="text-2xl font-bold text-red-600">{stock.product?.min_stock_level || 0}</p>
                <p className="text-xs text-gray-500">{stock.product?.unit}</p>
              </div>
            </div>
          </div>

          {/* Movements History */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Mouvements récents
            </h3>

            {movements.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun mouvement enregistré</p>
              </div>
            ) : (
              <div className="space-y-3">
                {movements.map((movement, index) => (
                  <div key={movement.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          {getMovementIcon(movement.movement_type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMovementColor(movement.movement_type)}`}>
                              {getMovementLabel(movement.movement_type)}
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {movement.movement_type === 'in' ? '+' : '-'}{movement.quantity} {stock.product?.unit}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            Référence: {movement.reference}
                          </p>
                          {movement.notes && (
                            <p className="text-sm text-gray-500 italic">
                              {movement.notes}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(movement.created_at).toLocaleDateString('fr-FR')}</span>
                              <span>{new Date(movement.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>Utilisateur</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-6 border-t border-gray-200 mt-6">
            <button
              onClick={onClose}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}