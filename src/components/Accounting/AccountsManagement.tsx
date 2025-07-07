import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Filter, FileText, Eye, ToggleLeft, ToggleRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { AccountForm } from './AccountForm';

interface Account {
  id: string;
  company_id: string;
  code: string;
  name: string;
  account_type: 'actif' | 'passif' | 'produit' | 'charge';
  parent_id?: string;
  is_active: boolean;
  created_at: string;
}

export function AccountsManagement() {
  const { profile } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    if (profile) {
      loadAccounts();
    }
  }, [profile]);

  const loadAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('company_id', profile?.company_id)
        .order('code');

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (accountId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('accounts')
        .update({ is_active: !currentStatus })
        .eq('id', accountId);

      if (error) throw error;
      loadAccounts();
    } catch (error) {
      console.error('Error updating account status:', error);
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce compte ?')) return;

    try {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;
      loadAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingAccount(null);
    loadAccounts();
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = 
      account.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !typeFilter || account.account_type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAccounts = filteredAccounts.slice(startIndex, startIndex + itemsPerPage);

  const getTypeColor = (type: string) => {
    const colors = {
      actif: 'bg-blue-100 text-blue-800',
      passif: 'bg-red-100 text-red-800',
      produit: 'bg-green-100 text-green-800',
      charge: 'bg-orange-100 text-orange-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      actif: 'Actif',
      passif: 'Passif',
      produit: 'Produit',
      charge: 'Charge'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getAccountsByType = () => {
    const grouped = paginatedAccounts.reduce((acc, account) => {
      if (!acc[account.account_type]) {
        acc[account.account_type] = [];
      }
      acc[account.account_type].push(account);
      return acc;
    }, {} as Record<string, Account[]>);

    return grouped;
  };

  if (showForm) {
    return (
      <AccountForm
        account={editingAccount}
        onSuccess={handleFormSuccess}
        onCancel={() => {
          setShowForm(false);
          setEditingAccount(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileText className="h-8 w-8 text-green-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Plan comptable</h2>
            <p className="text-gray-500">{filteredAccounts.length} compte(s)</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Nouveau compte</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {['actif', 'passif', 'produit', 'charge'].map((type) => {
          const count = accounts.filter(a => a.account_type === type && a.is_active).length;
          return (
            <div key={type} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${getTypeColor(type).replace('text-', 'text-').replace('bg-', 'bg-')}`}>
                  <FileText className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{getTypeLabel(type)}</p>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Rechercher par code ou nom..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="lg:w-48">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Tous les types</option>
              <option value="actif">Actif</option>
              <option value="passif">Passif</option>
              <option value="produit">Produit</option>
              <option value="charge">Charge</option>
            </select>
          </div>
        </div>
      </div>

      {/* Accounts by Type */}
      <div className="space-y-6">
        {Object.entries(getAccountsByType()).map(([type, typeAccounts]) => (
          <div key={type} className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full mr-3 ${getTypeColor(type)}`}>
                  {getTypeLabel(type)}
                </span>
                {typeAccounts.length} compte(s)
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom du compte
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Créé le
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {typeAccounts.map((account) => (
                    <tr key={account.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono font-medium text-gray-900">
                          {account.code}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {account.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(account.id, account.is_active)}
                          className="flex items-center space-x-2 text-sm"
                        >
                          {account.is_active ? (
                            <>
                              <ToggleRight className="h-5 w-5 text-green-600" />
                              <span className="text-green-600 font-medium">Actif</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="h-5 w-5 text-gray-400" />
                              <span className="text-gray-400">Inactif</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(account.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setEditingAccount(account);
                              setShowForm(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(account.id)}
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
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredAccounts.length)} sur {filteredAccounts.length} comptes
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

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      )}

      {!loading && filteredAccounts.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">
            {searchTerm || typeFilter ? 'Aucun compte trouvé' : 'Aucun compte configuré'}
          </p>
          {!searchTerm && !typeFilter && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Créer le premier compte
            </button>
          )}
        </div>
      )}
    </div>
  );
}