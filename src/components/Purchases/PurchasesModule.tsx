import React, { useState, useEffect } from 'react';
import { Plus, Edit, Eye, Trash2, Search, Filter, Package, Building, CheckCircle, ChevronLeft, ChevronRight, MapPin, Calendar, DollarSign } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase, Purchase, Supplier } from '../../lib/supabase';
import { PurchaseForm } from './PurchaseForm';
import { PurchaseDetail } from './PurchaseDetail';
import { PurchaseValidationModal } from './PurchaseValidationModal';
import { SuppliersModule } from '../Suppliers/SuppliersModule';

export function PurchasesModule() {
  const { profile } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showSuppliers, setShowSuppliers] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);
  const [validatingPurchase, setValidatingPurchase] = useState<Purchase | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activityFilter, setActivityFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (profile) {
      loadPurchases();
      loadSuppliers();
      if (profile.role === 'proprietaire') {
        loadActivities();
      }
    }
  }, [profile]);

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

  const loadPurchases = async () => {
    try {
      let query = supabase
        .from('purchases')
        .select(`
          *,
          supplier:suppliers(*),
          purchase_items(
            *,
            product:products(*)
          )
        `)
        .eq('company_id', profile?.company_id);

      // Filtrer par activité selon le rôle et le filtre sélectionné
      if (profile?.role === 'proprietaire' && activityFilter) {
        query = query.eq('activity_id', activityFilter);
      } else if (profile?.role !== 'proprietaire' && profile?.activity_id) {
        query = query.eq('activity_id', profile.activity_id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setPurchases(data || []);
    } catch (error) {
      console.error('Error loading purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  // Recharger les achats quand le filtre d'activité change
  useEffect(() => {
    if (profile && profile.role === 'proprietaire') {
      loadPurchases();
    }
  }, [activityFilter]);

  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('company_id', profile?.company_id)
        .eq('is_active', true);

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet achat ?')) return;

    try {
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadPurchases();
    } catch (error) {
      console.error('Error deleting purchase:', error);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingPurchase(null);
    loadPurchases();
  };

  const handleValidationSuccess = () => {
    setValidatingPurchase(null);
    loadPurchases();
  };

  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch = purchase.purchase_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      '';
    const matchesStatus = !statusFilter || purchase.status === statusFilter;
    const matchesDate = !dateFilter || purchase.purchase_date.startsWith(dateFilter);
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPurchases = filteredPurchases.slice(startIndex, startIndex + itemsPerPage);

  // Calculs des totaux
  const getTotalValue = () => {
    return filteredPurchases.reduce((sum, purchase) => sum + purchase.total_amount, 0);
  };

  const getCurrentMonthTotal = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return purchases
      .filter(purchase => purchase.purchase_date.startsWith(currentMonth))
      .reduce((sum, purchase) => sum + purchase.total_amount, 0);
  };

  const getThisYearTotal = () => {
    const currentYear = new Date().getFullYear().toString();
    return purchases
      .filter(purchase => purchase.purchase_date.startsWith(currentYear))
      .reduce((sum, purchase) => sum + purchase.total_amount, 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en_attente':
        return 'bg-yellow-100 text-yellow-800';
      case 'recu':
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
      case 'en_attente':
        return 'En attente';
      case 'recu':
        return 'Reçu';
      case 'paye':
        return 'Payé';
      case 'annule':
        return 'Annulé';
      default:
        return status;
    }
  };

  const canValidateReception = (purchase: Purchase) => {
    return purchase.status === 'paye' && purchase.purchase_items && purchase.purchase_items.length > 0;
  };

  const getSelectedActivityName = () => {
    if (!activityFilter) return 'Toutes les activités';
    const activity = activities.find(a => a.id === activityFilter);
    return activity?.name || 'Activité inconnue';
  };

  if (showSuppliers) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowSuppliers(false)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Retour aux achats
          </button>
        </div>
        <SuppliersModule />
      </div>
    );
  }

  if (showForm) {
    return (
      <PurchaseForm
        purchase={editingPurchase}
        suppliers={suppliers}
        onSuccess={handleFormSuccess}
        onCancel={() => {
          setShowForm(false);
          setEditingPurchase(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Package className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Achats</h1>
            <p className="text-gray-500">
              {filteredPurchases.length} achat(s) • Total: {getTotalValue().toLocaleString()} $
              {profile?.role === 'proprietaire' && activityFilter && (
                <span className="text-blue-600"> • {getSelectedActivityName()}</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-x-3">
          <button
            onClick={() => setShowSuppliers(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors"
          >
            <Building className="h-4 w-4" />
            <span>Fournisseurs</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nouvel achat</span>
          </button>
        </div>
      </div>

      {/* Filtre spécial propriétaire */}
      {profile?.role === 'proprietaire' && activities.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <MapPin className="h-5 w-5 text-purple-600" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-purple-900">Filtre par activité (Propriétaire)</h4>
              <div className="mt-2">
                <select
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value)}
                  className="w-full sm:w-64 px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Toutes les activités</option>
                  {activities.map((activity) => (
                    <option key={activity.id} value={activity.id}>
                      {activity.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total achats</p>
              <p className="text-2xl font-bold text-gray-900">{purchases.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ce mois</p>
              <p className="text-2xl font-bold text-gray-900">{getCurrentMonthTotal().toLocaleString()} $</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cette année</p>
              <p className="text-2xl font-bold text-gray-900">{getThisYearTotal().toLocaleString()} $</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Valeur filtrée</p>
              <p className="text-2xl font-bold text-orange-600">{getTotalValue().toLocaleString()} $</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Rechercher par numéro ou fournisseur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="recu">Reçu</option>
              <option value="paye">Payé</option>
              <option value="annule">Annulé</option>
            </select>
          </div>
          <div className="sm:w-48">
            <input
              type="month"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="sm:w-32">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setDateFilter('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucun achat trouvé</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Créer le premier achat
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Numéro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fournisseur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedPurchases.map((purchase) => (
                    <tr key={purchase.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {purchase.purchase_number}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {purchase.supplier?.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(purchase.purchase_date).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {purchase.total_amount.toLocaleString()} $
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(purchase.status)}`}>
                          {getStatusLabel(purchase.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {canValidateReception(purchase) && (
                            <button
                              onClick={() => setValidatingPurchase(purchase)}
                              className="text-green-600 hover:text-green-900 p-1"
                              title="Valider la réception"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setViewingPurchase(purchase)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Voir détails"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingPurchase(purchase);
                              setShowForm(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(purchase.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-6 py-3 text-right font-medium text-gray-900">
                      Total:
                    </td>
                    <td colSpan={3} className="px-6 py-3 font-bold text-gray-900">
                      {getTotalValue().toLocaleString()} $
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredPurchases.length)} sur {filteredPurchases.length} résultats
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-3 py-1 text-sm font-medium">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {viewingPurchase && (
        <PurchaseDetail
          purchase={viewingPurchase}
          onClose={() => setViewingPurchase(null)}
        />
      )}

      {validatingPurchase && (
        <PurchaseValidationModal
          purchase={validatingPurchase}
          onSuccess={handleValidationSuccess}
          onCancel={() => setValidatingPurchase(null)}
        />
      )}
    </div>
  );
}