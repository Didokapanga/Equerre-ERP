import React, { useState, useEffect } from 'react';
import { Plus, Edit, Eye, Trash2, Search, Filter, Truck, CheckCircle, Users, Receipt, ChevronLeft, ChevronRight, MapPin, Calendar, DollarSign } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase, Sale, Customer } from '../../lib/supabase';
import { SaleForm } from './SaleForm';
import { SaleDetail } from './SaleDetail';
import { SaleValidationModal } from './SaleValidationModal';
import { ThermalReceipt } from './ThermalReceipt';
import { CustomersModule } from '../Customers/CustomersModule';

export function SalesModule() {
  const { profile } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCustomers, setShowCustomers] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [validatingSale, setValidatingSale] = useState<Sale | null>(null);
  const [showThermalReceipt, setShowThermalReceipt] = useState(false);
  const [thermalReceiptSale, setThermalReceiptSale] = useState<Sale | null>(null);
  const [saleActivity, setSaleActivity] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activityFilter, setActivityFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (profile) {
      loadSales();
      loadCustomers();
      if (profile.role === 'proprietaire') {
        loadActivities();
      }
    }
  }, [profile]);

  useEffect(() => {
    if (thermalReceiptSale?.activity_id) {
      loadSaleActivity(thermalReceiptSale.activity_id);
    }
  }, [thermalReceiptSale]);

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

  const loadSales = async () => {
    try {
      let query = supabase
        .from('sales')
        .select(`
          *,
          customer:customers(*),
          sale_items(
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
      setSales(data || []);
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setLoading(false);
    }
  };

  // Recharger les ventes quand le filtre d'activité change
  useEffect(() => {
    if (profile && profile.role === 'proprietaire') {
      loadSales();
    }
  }, [activityFilter]);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('company_id', profile?.company_id)
        .eq('is_active', true);

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadSaleActivity = async (activityId: string) => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('name, address, phone')
        .eq('id', activityId)
        .single();

      if (error) {
        console.error('Erreur chargement activité de la vente:', error);
        setSaleActivity(null);
      } else {
        setSaleActivity(data);
      }
    } catch (error) {
      console.error('Exception chargement activité:', error);
      setSaleActivity(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette vente ?')) return;

    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadSales();
    } catch (error) {
      console.error('Error deleting sale:', error);
      alert('Erreur lors de la suppression de la vente.');
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingSale(null);
    loadSales();
  };

  const handleValidationSuccess = () => {
    setValidatingSale(null);
    loadSales();
  };

  const handleThermalReceipt = (sale: Sale) => {
    setThermalReceiptSale(sale);
    setShowThermalReceipt(true);
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.sale_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      '';
    const matchesStatus = !statusFilter || sale.status === statusFilter;
    const matchesDate = !dateFilter || sale.sale_date.startsWith(dateFilter);
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSales = filteredSales.slice(startIndex, startIndex + itemsPerPage);

  // Calculs des totaux
  const getTotalValue = () => {
    return filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0);
  };

  const getCurrentMonthTotal = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return sales
      .filter(sale => sale.sale_date.startsWith(currentMonth))
      .reduce((sum, sale) => sum + sale.total_amount, 0);
  };

  const getTodayTotal = () => {
    //Récupèrer la date du jour au format YYYY/MM/DD
    const today = new Date().toISOString().slice(0, 10);

    return sales
      .filter(sale => sale.sale_date.startsWith(today))
      .reduce((sum, sale) => sum + sale.total_amount, 0);
  }

  const getThisYearTotal = () => {
    const currentYear = new Date().getFullYear().toString();
    return sales
      .filter(sale => sale.sale_date.startsWith(currentYear))
      .reduce((sum, sale) => sum + sale.total_amount, 0);
  };

  const canManagePermission = () => {
    return ['proprietaire', 'admin'].includes(profile?.role || '');
    // return ['proprietaire', 'admin', 'gestionnaire_stock'].includes(profile?.role || '');
  };

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

  //Validation de vente
  const canValidateDelivery = (sale: Sale) => {
    const hasRole = ['proprietaire', 'admin'].includes(profile?.role || '');
    const isSaleValid = sale.status === 'paye' && sale.sale_items && sale.sale_items.length > 0;

    return hasRole && isSaleValid;
  };
  // const canValidateDelivery = (sale: Sale) => {
  //   return sale.status === 'paye' && sale.sale_items && sale.sale_items.length > 0;
  // };

  const getSelectedActivityName = () => {
    if (!activityFilter) return 'Toutes les activités';
    const activity = activities.find(a => a.id === activityFilter);
    return activity?.name || 'Activité inconnue';
  };

  if (showCustomers) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowCustomers(false)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Retour aux ventes
          </button>
        </div>
        <CustomersModule />
      </div>
    );
  }

  if (showForm) {
    return (
      <SaleForm
        sale={editingSale}
        customers={customers}
        onSuccess={handleFormSuccess}
        onCancel={() => {
          setShowForm(false);
          setEditingSale(null);
        }}
      />
    );
  }

  if (showThermalReceipt && thermalReceiptSale) {
    return (
      <ThermalReceipt
        sale={thermalReceiptSale}
        companyInfo={{
          name: profile?.company?.name || 'Entreprise',
          address: profile?.company?.address,
          phone: profile?.company?.phone,
          email: profile?.company?.email,
          tax_number: profile?.company?.tax_number
        }}
        activity={saleActivity}
        onClose={() => {
          setShowThermalReceipt(false);
          setThermalReceiptSale(null);
          setSaleActivity(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <Truck className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Ventes</h1>
            <p className="text-sm text-gray-500">
              {filteredSales.length} vente(s) • Total: {getTotalValue().toLocaleString()} CDF
              {profile?.role === 'proprietaire' && activityFilter && (
                <span className="text-blue-600"> • {getSelectedActivityName()}</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={() => setShowCustomers(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2 transition-colors"
          >
            <Users className="h-4 w-4" />
            <span>Clients</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nouvelle vente</span>
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
              <Truck className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total ventes</p>
              <p className="text-2xl font-bold text-gray-900">{sales.length}</p>
            </div>
          </div>
        </div>
        {/* Filtre spécial propriétaire */}
        {/* {profile?.role === 'proprietaire' && activities.length > 0 && ( */}
        {canManagePermission() && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ce mois</p>
                <p className="text-2xl font-bold text-gray-900">{getCurrentMonthTotal().toLocaleString()} CDF</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aujourd'hui</p>
              <p className="text-2xl font-bold text-gray-900">{getTodayTotal().toLocaleString()} CDF</p>
            </div>
          </div>
        </div>

        {/* Filtre spécial propriétaire */}
        {/* {profile?.role === 'proprietaire' && activities.length > 0 && ( */}
        {canManagePermission() && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Cette année</p>
                <p className="text-2xl font-bold text-gray-900">{getThisYearTotal().toLocaleString()} CDF</p>
              </div>
            </div>
          </div>
        )}
        {/* )} */}

        {/* Filtre spécial propriétaire et admin */}
        {/* {profile?.role === 'proprietaire' && activities.length > 0 && ( */}
        {canManagePermission() && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Valeur filtrée</p>
                <p className="text-2xl font-bold text-orange-600">{getTotalValue().toLocaleString()} CDF</p>
              </div>
            </div>
          </div>
        )}

      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Rechercher par numéro ou client..."
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
              <option value="en_cours">En cours</option>
              <option value="livre">Livré</option>
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
          <div className="sm:w-48">
            <input
              type="date"
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
        ) : filteredSales.length === 0 ? (
          <div className="text-center py-12">
            <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucune vente trouvée</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Créer la première vente
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Numéro
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {sale.sale_number}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 truncate max-w-32 sm:max-w-none">
                          {sale.customer?.name || 'Client anonyme'}
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(sale.sale_date).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {sale.total_amount.toLocaleString()} CDF
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(sale.status)}`}>
                          {getStatusLabel(sale.status)}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-1 sm:space-x-2">
                          {canValidateDelivery(sale) && (
                            <button
                              onClick={() => setValidatingSale(sale)}
                              className="text-green-600 hover:text-green-900 p-1"
                              title="Valider la livraison"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleThermalReceipt(sale)}
                            className="text-purple-600 hover:text-purple-900 p-1"
                            title="Aperçu ticket thermique"
                          >
                            <Receipt className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => setViewingSale(sale)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Voir détails"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingSale(sale);
                              setShowForm(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(sale.id)}
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
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredSales.length)} sur {filteredSales.length} résultats
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

      {viewingSale && (
        <SaleDetail
          sale={viewingSale}
          onClose={() => setViewingSale(null)}
        />
      )}

      {validatingSale && (
        <SaleValidationModal
          sale={validatingSale}
          onSuccess={handleValidationSuccess}
          onCancel={() => setValidatingSale(null)}
        />
      )}
    </div>
  );
}