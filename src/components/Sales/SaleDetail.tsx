import React from 'react';
import { X, Truck, Calendar, User, FileText, Package } from 'lucide-react';
import { Sale } from '../../lib/supabase';

interface SaleDetailProps {
  sale: Sale;
  onClose: () => void;
}

export function SaleDetail({ sale, onClose }: SaleDetailProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en_cours':
        return 'bg-yellow-100 text-yellow-800';
      case 'livre':
        return 'bg-blue-100 text-blue-800';
      case 'paye':
        return 'bg-green-100 text-green-800';
      case 'annule':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'en_cours':
        return 'En cours';
      case 'livre':
        return 'Livré';
      case 'paye':
        return 'Payé';
      case 'annule':
        return 'Annulé';
      default:
        return status;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Truck className="h-8 w-8 text-blue-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Vente {sale.sale_number}
                </h2>
                <p className="text-gray-500">
                  Détails de la vente
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Sale Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Client
              </h3>
              <div className="space-y-2">
                <p className="font-medium">{sale.customer?.name || 'Client anonyme'}</p>
                {sale.customer?.email && (
                  <p className="text-sm text-gray-600">
                    Email: {sale.customer.email}
                  </p>
                )}
                {sale.customer?.phone && (
                  <p className="text-sm text-gray-600">
                    Tél: {sale.customer.phone}
                  </p>
                )}
                {sale.customer?.address && (
                  <p className="text-sm text-gray-600">
                    Adresse: {sale.customer.address}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Informations
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date de vente:</span>
                  <span className="font-medium">
                    {new Date(sale.sale_date).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                {sale.due_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Échéance:</span>
                    <span className="font-medium">
                      {new Date(sale.due_date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Statut:</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(sale.status)}`}>
                    {getStatusLabel(sale.status)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-bold text-lg">
                    {sale.total_amount.toLocaleString()} $
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payé:</span>
                  <span className="font-medium">
                    {sale.paid_amount.toLocaleString()} $
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Reste à payer:</span>
                  <span className="font-medium text-red-600">
                    {(sale.total_amount - sale.paid_amount).toLocaleString()} $
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {sale.notes && (
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Notes
              </h3>
              <p className="text-gray-700">{sale.notes}</p>
            </div>
          )}

          {/* Items */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Articles vendus
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produit
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantité
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prix unitaire
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sale.sale_items?.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
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
                        <div className="text-sm text-gray-900">
                          {item.unit_price.toFixed(2)} $
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.total_price.toFixed(2)} $
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right font-medium text-gray-900">
                      Total général:
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900">
                      {sale.total_amount.toFixed(2)} $
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}