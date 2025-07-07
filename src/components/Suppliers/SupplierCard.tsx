import React from 'react';
import { Edit, Trash2, Phone, Mail, MapPin, CreditCard, User, Building } from 'lucide-react';
import { Supplier } from '../../lib/supabase';

interface SupplierCardProps {
  supplier: Supplier;
  onEdit: (supplier: Supplier) => void;
  onDelete: (id: string) => void;
}

export function SupplierCard({ supplier, onEdit, onDelete }: SupplierCardProps) {
  const handleDelete = () => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le fournisseur "${supplier.name}" ?`)) {
      onDelete(supplier.id);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Building className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{supplier.name}</h3>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                supplier.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {supplier.is_active ? 'Actif' : 'Inactif'}
              </span>
              {supplier.payment_terms && (
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                  {supplier.payment_terms} jours
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(supplier)}
            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            title="Modifier"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
            title="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-3">
        {supplier.contact_person && (
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <User className="h-4 w-4 text-gray-400" />
            <span>Contact: {supplier.contact_person}</span>
          </div>
        )}
        
        {supplier.email && (
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <Mail className="h-4 w-4 text-gray-400" />
            <a 
              href={`mailto:${supplier.email}`}
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              {supplier.email}
            </a>
          </div>
        )}
        
        {supplier.phone && (
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <Phone className="h-4 w-4 text-gray-400" />
            <a 
              href={`tel:${supplier.phone}`}
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              {supplier.phone}
            </a>
          </div>
        )}
        
        {supplier.address && (
          <div className="flex items-start space-x-3 text-sm text-gray-600">
            <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
            <span className="leading-relaxed">{supplier.address}</span>
          </div>
        )}
        
        {supplier.tax_number && (
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <CreditCard className="h-4 w-4 text-gray-400" />
            <span>N° fiscal: {supplier.tax_number}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Créé le {new Date(supplier.created_at).toLocaleDateString('fr-FR')}</span>
          {supplier.payment_terms && (
            <div className="flex items-center space-x-1">
              <CreditCard className="h-3 w-3" />
              <span>Paiement à {supplier.payment_terms} jours</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}