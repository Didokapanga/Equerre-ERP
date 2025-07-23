import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Receipt,
  Calendar,
  DollarSign,
  TrendingUp,
  Download,
  Eye,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  MapPin
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase, Expense } from '../../lib/supabase';
import { ExpenseForm } from './ExpenseForm';

export function ExpensesModule() {
  const { profile } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [activityFilter, setActivityFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (profile) {
      loadExpenses();
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

  const loadExpenses = async () => {
    try {
      let query = supabase
        .from('expenses')
        .select('*')
        .eq('company_id', profile?.company_id);

      // Filtrer par activité selon le rôle et le filtre sélectionné
      if (profile?.role === 'proprietaire' && activityFilter) {
        query = query.eq('activity_id', activityFilter);
      } else if (profile?.role !== 'proprietaire' && profile?.role !== 'admin' && profile?.activity_id) {
        query = query.eq('activity_id', profile.activity_id);
      }

      const { data, error } = await query.order('expense_date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Recharger les dépenses quand le filtre d'activité change
  useEffect(() => {
    if (profile && profile.role === 'proprietaire') {
      loadExpenses();
    }
  }, [activityFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Erreur lors de la suppression de la dépense.');
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingExpense(null);
    loadExpenses();
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'impot': 'Impôts',
      'taxe': 'Taxes',
      'cnss': 'CNSS',
      'dgi': 'DGI',
      'patente': 'Patente',
      'electricite': 'Électricité',
      'eau': 'Eau',
      'internet': 'Internet',
      'telephone': 'Téléphone',
      'transport': 'Transport',
      'carburant': 'Carburant',
      'manutention': 'Manutention',
      'location_vehicule': 'Location véhicule',
      'fournitures_bureau': 'Fournitures bureau',
      'nettoyage': 'Nettoyage',
      'reparation_materiel': 'Réparation matériel',
      'formation_personnel': 'Formation personnel',
      'recrutement': 'Recrutement',
      'uniforme': 'Uniforme',
      'primes': 'Primes',
      'salaires': 'Salaires',
      'divers': 'Divers',
      'hospitalite': 'Hospitalité',
      'deplacements': 'Déplacements',
      'repas': 'Repas',
      'imprevus': 'Imprévus'
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'impot': 'bg-red-100 text-red-800',
      'taxe': 'bg-red-100 text-red-800',
      'cnss': 'bg-red-100 text-red-800',
      'dgi': 'bg-red-100 text-red-800',
      'patente': 'bg-red-100 text-red-800',
      'electricite': 'bg-yellow-100 text-yellow-800',
      'eau': 'bg-blue-100 text-blue-800',
      'internet': 'bg-purple-100 text-purple-800',
      'telephone': 'bg-purple-100 text-purple-800',
      'transport': 'bg-green-100 text-green-800',
      'carburant': 'bg-green-100 text-green-800',
      'manutention': 'bg-green-100 text-green-800',
      'location_vehicule': 'bg-green-100 text-green-800',
      'fournitures_bureau': 'bg-indigo-100 text-indigo-800',
      'nettoyage': 'bg-indigo-100 text-indigo-800',
      'reparation_materiel': 'bg-indigo-100 text-indigo-800',
      'formation_personnel': 'bg-pink-100 text-pink-800',
      'recrutement': 'bg-pink-100 text-pink-800',
      'uniformes': 'bg-pink-100 text-pink-800',
      'primes': 'bg-pink-100 text-pink-800',
      'salaires': 'bg-pink-100 text-pink-800',
      'divers': 'bg-gray-100 text-gray-800',
      'hospitalite': 'bg-orange-100 text-orange-800',
      'deplacements': 'bg-orange-100 text-orange-800',
      'repas': 'bg-orange-100 text-orange-800',
      'imprevus': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getUniqueCategories = () => {
    const categories = expenses
      .map(expense => expense.category)
      .filter((category, index, array) => array.indexOf(category) === index);
    return categories.sort();
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch =
      expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (expense.description && expense.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = !categoryFilter || expense.category === categoryFilter;

    const matchesDate = !dateFilter || expense.expense_date.startsWith(dateFilter);

    return matchesSearch && matchesCategory && matchesDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExpenses = filteredExpenses.slice(startIndex, startIndex + itemsPerPage);

  const getTotalAmount = () => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getCurrentMonthTotal = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return expenses
      .filter(expense => expense.expense_date.startsWith(currentMonth))
      .reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getThisYearTotal = () => {
    const currentYear = new Date().getFullYear().toString();
    return expenses
      .filter(expense => expense.expense_date.startsWith(currentYear))
      .reduce((sum, expense) => sum + expense.amount, 0);
  };

  const canManageExpenses = () => {
    return ['proprietaire', 'admin', 'comptable'].includes(profile?.role || '');
  };

  const getSelectedActivityName = () => {
    if (!activityFilter) return 'Toutes les activités';
    const activity = activities.find(a => a.id === activityFilter);
    return activity?.name || 'Activité inconnue';
  };

  if (showForm) {
    return (
      <ExpenseForm
        expense={editingExpense}
        onSuccess={handleFormSuccess}
        onCancel={() => {
          setShowForm(false);
          setEditingExpense(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-x-3">
        <div className="flex items-center space-x-3">
          <Receipt className="h-8 w-8 text-orange-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Dépenses</h1>
            <p className="text-gray-500">
              {filteredExpenses.length} dépense(s) • Total: {getTotalAmount().toLocaleString()} CDF
              {profile?.role === 'proprietaire' && activityFilter && (
                <span className="text-orange-600"> • {getSelectedActivityName()}</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {/* <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors">
            <Download className="h-4 w-4" />
            <span>Exporter</span>
          </button> */}
          {canManageExpenses() && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Nouvelle dépense</span>
            </button>
          )}
        </div>
      </div>

      {/* Filtre spécial propriétaire */}
      {profile?.role === 'proprietaire' && activities.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <MapPin className="h-5 w-5 text-orange-600" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-orange-900">Filtre par activité (Propriétaire)</h4>
              <div className="mt-2">
                <select
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value)}
                  className="w-full sm:w-64 px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
            <div className="p-3 bg-orange-100 rounded-lg">
              <Receipt className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total dépenses</p>
              <p className="text-2xl font-bold text-gray-900">{expenses.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ce mois</p>
              <p className="text-2xl font-bold text-gray-900">{getCurrentMonthTotal().toLocaleString()} CDF</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cette année</p>
              <p className="text-2xl font-bold text-gray-900">{getThisYearTotal().toLocaleString()} CDF</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Moyenne mensuelle</p>
              <p className="text-2xl font-bold text-gray-900">
                {expenses.length > 0 ? Math.round(getThisYearTotal() / 12).toLocaleString() : 0} CDF
              </p>
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
                placeholder="Rechercher par titre ou description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Toutes les catégories</option>
              {getUniqueCategories().map((category) => (
                <option key={category} value={category}>
                  {getCategoryLabel(category)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <input
              type="month"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <button
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('');
                setDateFilter('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              {searchTerm || categoryFilter || dateFilter
                ? 'Aucune dépense trouvée avec ces critères'
                : 'Aucune dépense enregistrée'
              }
            </p>
            {canManageExpenses() && !searchTerm && !categoryFilter && !dateFilter && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Enregistrer la première dépense
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dépense
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Catégorie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Justificatif
                    </th>
                    {canManageExpenses() && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {expense.title}
                          </div>
                          {expense.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {expense.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(expense.category)}`}>
                          {getCategoryLabel(expense.category)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(expense.expense_date).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {expense.amount.toLocaleString()} CDF
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {expense.receipt_url ? (
                          <a
                            href={expense.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span className="text-sm">Voir</span>
                          </a>
                        ) : (
                          <span className="text-gray-400 text-sm">Aucun</span>
                        )}
                      </td>
                      {canManageExpenses() && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => {
                                setEditingExpense(expense);
                                setShowForm(true);
                              }}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="Modifier"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(expense.id)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={canManageExpenses() ? 6 : 5} className="px-6 py-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">
                          Total affiché: {filteredExpenses.length} dépense(s)
                        </span>
                        <span className="text-lg font-bold text-gray-900">
                          {getTotalAmount().toLocaleString()} CDF
                        </span>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredExpenses.length)} sur {filteredExpenses.length} résultats
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
    </div>
  );
}