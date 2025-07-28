import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Filter, Warehouse, AlertTriangle, TrendingUp, TrendingDown, Eye, History, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { StockAdjustmentModal } from './StockAdjustmentModal';
import { StockHistoryModal } from './StockHistoryModal';

interface Stock {
  id: string;
  company_id: string;
  activity_id: string;
  product_id: string;
  quantity: number;
  reserved_quantity: number;
  last_updated: string;
  product?: {
    id: string;
    code: string;
    name: string;
    unit: string;
    min_stock_level: number;
    sale_price: number;
    purchase_price: number;
    category?: string;
  };
}

interface StockMovement {
  id: string;
  movement_type: string;
  quantity: number;
  reference: string;
  notes?: string;
  created_at: string;
}

export function StockModule() {
  const { profile } = useAuth();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activityFilter, setActivityFilter] = useState('');
  const [adjustingStock, setAdjustingStock] = useState<Stock | null>(null);
  const [viewingHistory, setViewingHistory] = useState<Stock | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (profile) {
      loadStocks();
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

  const loadStocks = async () => {
    try {
      let query = supabase
        .from('stocks')
        .select(`
          *,
          product:products(*)
        `)
        .eq('company_id', profile?.company_id);

      // Filtrer par activité selon le rôle et le filtre sélectionné
      if (profile?.role === 'proprietaire' && activityFilter) {
        query = query.eq('activity_id', activityFilter);
      } else if (profile?.role !== 'proprietaire' && profile?.role !== 'admin' && profile?.activity_id) {
        query = query.eq('activity_id', profile.activity_id);
      }

      const { data, error } = await query.order('last_updated', { ascending: false });

      if (error) throw error;
      setStocks(data || []);
    } catch (error) {
      console.error('Error loading stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Recharger les stocks quand le filtre d'activité change
  useEffect(() => {
    if (profile && profile.role === 'proprietaire') {
      loadStocks();
    }
  }, [activityFilter]);

  const loadStockHistory = async (stockId: string) => {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('stock_id', stockId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setMovements(data || []);
    } catch (error) {
      console.error('Error loading stock movements:', error);
      setMovements([]);
    }
  };

  const handleViewHistory = async (stock: Stock) => {
    setViewingHistory(stock);
    await loadStockHistory(stock.id);
  };

  const handleAdjustmentSuccess = () => {
    setAdjustingStock(null);
    loadStocks();
  };

  const getStockStatus = (stock: Stock) => {
    const available = stock.quantity - stock.reserved_quantity;
    const minLevel = stock.product?.min_stock_level || 0;

    if (available <= 0) return { status: 'rupture', color: 'text-red-600', bgColor: 'bg-red-100' };
    if (available <= minLevel) return { status: 'faible', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    return { status: 'normal', color: 'text-green-600', bgColor: 'bg-green-100' };
  };

  const getUniqueCategories = () => {
    const categories = stocks
      .map(stock => stock.product?.category)
      .filter(category => category && category.trim() !== '')
      .filter((category, index, array) => array.indexOf(category) === index);
    return categories.sort();
  };

  const filteredStocks = stocks.filter(stock => {
    const matchesSearch =
      stock.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.product?.code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = !categoryFilter || stock.product?.category === categoryFilter;

    let matchesStatus = true;
    if (statusFilter) {
      const { status } = getStockStatus(stock);
      matchesStatus = status === statusFilter;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredStocks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStocks = filteredStocks.slice(startIndex, startIndex + itemsPerPage);

  // Statistiques
  const totalProducts = stocks.length;
  const lowStockItems = stocks.filter(stock => {
    const available = stock.quantity - stock.reserved_quantity;
    return available <= (stock.product?.min_stock_level || 0);
  }).length;
  const outOfStockItems = stocks.filter(stock =>
    (stock.quantity - stock.reserved_quantity) <= 0
  ).length;
  const totalValue = stocks.reduce((sum, stock) =>
    sum + (stock.quantity * (stock.product?.purchase_price || 0)), 0
  );

  const canManageStock = () => {
    return ['proprietaire', 'admin'].includes(profile?.role || '');
    // return ['proprietaire', 'admin', 'gestionnaire_stock'].includes(profile?.role || '');
  };

  const getSelectedActivityName = () => {
    if (!activityFilter) return 'Toutes les activités';
    const activity = activities.find(a => a.id === activityFilter);
    return activity?.name || 'Activité inconnue';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Warehouse className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Stocks</h1>
            <p className="text-gray-500">
              {filteredStocks.length} produit(s) en stock
              {profile?.role === 'proprietaire' && activityFilter && (
                <span className="text-purple-600"> • {getSelectedActivityName()}</span>
              )}
            </p>
          </div>
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
              <Warehouse className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Produits en stock</p>
              <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Stock faible</p>
              <p className="text-2xl font-bold text-orange-600">{lowStockItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rupture de stock</p>
              <p className="text-2xl font-bold text-red-600">{outOfStockItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Valeur totale</p>
              <p className="text-2xl font-bold text-green-600">{totalValue.toLocaleString()} $</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Rechercher par nom ou code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Toutes les catégories</option>
              {getUniqueCategories().map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Tous les statuts</option>
              <option value="normal">Stock normal</option>
              <option value="faible">Stock faible</option>
              <option value="rupture">Rupture de stock</option>
            </select>
          </div>

          <div>
            <button
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('');
                setStatusFilter('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : filteredStocks.length === 0 ? (
          <div className="text-center py-12">
            <Warehouse className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              {searchTerm || categoryFilter || statusFilter
                ? 'Aucun stock trouvé avec ces critères'
                : 'Aucun stock disponible'
              }
            </p>
            <p className="text-sm text-gray-400">
              Les stocks sont créés automatiquement lors des achats et ventes
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock actuel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Réservé
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Disponible
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock min.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valeur
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
                  {paginatedStocks.map((stock) => {
                    const available = stock.quantity - stock.reserved_quantity;
                    const { status, color, bgColor } = getStockStatus(stock);
                    const value = stock.quantity * (stock.product?.purchase_price || 0);

                    return (
                      <tr key={stock.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {stock.product?.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              Code: {stock.product?.code}
                            </div>
                            {stock.product?.category && (
                              <div className="text-xs text-gray-400">
                                {stock.product.category}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {stock.quantity} {stock.product?.unit}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-orange-600">
                            {stock.reserved_quantity} {stock.product?.unit}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${color}`}>
                            {available} {stock.product?.unit}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {stock.product?.min_stock_level || 0} {stock.product?.unit}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {value.toFixed(2)} CDF
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${bgColor} ${color}`}>
                            {status === 'normal' ? 'Normal' :
                              status === 'faible' ? 'Stock faible' : 'Rupture'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleViewHistory(stock)}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="Voir l'historique"
                            >
                              <History className="h-4 w-4" />
                            </button>

                            {/* Filtre spécial propriétaire et admin */}
                            {canManageStock() && (
                              <button
                                onClick={() => setAdjustingStock(stock)}
                                className="text-orange-600 hover:text-orange-900 p-1"
                                title="Ajuster le stock"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredStocks.length)} sur {filteredStocks.length} résultats
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

      {/* Stock Adjustment Modal */}
      {adjustingStock && (
        <StockAdjustmentModal
          stock={adjustingStock}
          onSuccess={handleAdjustmentSuccess}
          onCancel={() => setAdjustingStock(null)}
        />
      )}

      {/* Stock History Modal */}
      {viewingHistory && (
        <StockHistoryModal
          stock={viewingHistory}
          movements={movements}
          onClose={() => setViewingHistory(null)}
        />
      )}
    </div>
  );
}