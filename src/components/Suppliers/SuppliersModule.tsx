import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Building, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase, Supplier } from '../../lib/supabase';
import { SupplierCard } from './SupplierCard';
import { SupplierForm } from './SupplierForm';

export function SuppliersModule() {
  const { profile } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (profile) {
      loadSuppliers();
    }
  }, [profile]);

  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('company_id', profile?.company_id)
        .order('name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      alert('Erreur lors de la suppression du fournisseur.');
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingSupplier(null);
    loadSuppliers();
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = 
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.contact_person && supplier.contact_person.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = !statusFilter || 
      (statusFilter === 'active' && supplier.is_active) ||
      (statusFilter === 'inactive' && !supplier.is_active);
    
    return matchesSearch && matchesStatus;
  });

  const activeSuppliers = suppliers.filter(s => s.is_active).length;
  const inactiveSuppliers = suppliers.filter(s => !s.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Building className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fournisseurs</h1>
            <p className="text-gray-500">
              {filteredSuppliers.length} fournisseur(s) • {activeSuppliers} actif(s) • {inactiveSuppliers} inactif(s)
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Nouveau fournisseur</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total fournisseurs</p>
              <p className="text-2xl font-bold text-gray-900">{suppliers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Fournisseurs actifs</p>
              <p className="text-2xl font-bold text-gray-900">{activeSuppliers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <Users className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Fournisseurs inactifs</p>
              <p className="text-2xl font-bold text-gray-900">{inactiveSuppliers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Rechercher par nom, contact ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="lg:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </select>
          </div>
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="bg-gray-50 rounded-lg p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="text-center py-12">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter ? 'Aucun fournisseur trouvé' : 'Aucun fournisseur enregistré'}
            </p>
            {!searchTerm && !statusFilter && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Créer le premier fournisseur
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSuppliers.map((supplier) => (
              <SupplierCard
                key={supplier.id}
                supplier={supplier}
                onEdit={(supplier) => {
                  setEditingSupplier(supplier);
                  setShowForm(true);
                }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Supplier Form Modal */}
      {showForm && (
        <SupplierForm
          supplier={editingSupplier}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingSupplier(null);
          }}
        />
      )}
    </div>
  );
}