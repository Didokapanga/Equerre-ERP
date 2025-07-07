import React, { useState, useEffect } from 'react';
import { Plus, Eye, Search, Filter, Calculator, Calendar, User, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { JournalEntryDetail } from './JournalEntryDetail';

interface JournalEntry {
  id: string;
  company_id: string;
  activity_id: string;
  entry_number: string;
  entry_date: string;
  description: string;
  reference?: string;
  total_debit: number;
  total_credit: number;
  created_by?: string;
  created_at: string;
  journal_entry_lines?: JournalEntryLine[];
}

interface JournalEntryLine {
  id: string;
  journal_entry_id: string;
  account_id: string;
  description?: string;
  debit_amount: number;
  credit_amount: number;
  account?: {
    code: string;
    name: string;
    account_type: string;
  };
}

export function JournalEntries() {
  const { profile } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [referenceFilter, setReferenceFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (profile) {
      loadJournalEntries();
    }
  }, [profile]);

  const loadJournalEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select(`
          *,
          journal_entry_lines(
            *,
            account:accounts(code, name, account_type)
          )
        `)
        .eq('company_id', profile?.company_id)
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error loading journal entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = 
      entry.entry_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.reference && entry.reference.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDate = !dateFilter || entry.entry_date.startsWith(dateFilter);
    
    const matchesReference = !referenceFilter || 
      (entry.reference && entry.reference.toLowerCase().includes(referenceFilter.toLowerCase()));
    
    return matchesSearch && matchesDate && matchesReference;
  });

  // Pagination
  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEntries = filteredEntries.slice(startIndex, startIndex + itemsPerPage);

  const getTotalDebit = () => {
    return paginatedEntries.reduce((sum, entry) => sum + entry.total_debit, 0);
  };

  const getTotalCredit = () => {
    return paginatedEntries.reduce((sum, entry) => sum + entry.total_credit, 0);
  };

  const getCurrentMonthEntries = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return entries.filter(entry => entry.entry_date.startsWith(currentMonth)).length;
  };

  const getUnbalancedEntries = () => {
    return entries.filter(entry => entry.total_debit !== entry.total_credit).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calculator className="h-8 w-8 text-green-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Journal des écritures</h2>
            <p className="text-gray-500">{filteredEntries.length} écriture(s)</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Calculator className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total écritures</p>
              <p className="text-2xl font-bold text-gray-900">{entries.length}</p>
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
              <p className="text-2xl font-bold text-gray-900">{getCurrentMonthEntries()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total débit</p>
              <p className="text-2xl font-bold text-gray-900">{getTotalDebit().toLocaleString()} $</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${getUnbalancedEntries() > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
              <Calculator className={`h-6 w-6 ${getUnbalancedEntries() > 0 ? 'text-red-600' : 'text-green-600'}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Non équilibrées</p>
              <p className={`text-2xl font-bold ${getUnbalancedEntries() > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {getUnbalancedEntries()}
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
                placeholder="Rechercher par numéro, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <input
              type="month"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <input
              type="text"
              placeholder="Filtrer par référence..."
              value={referenceFilter}
              onChange={(e) => setReferenceFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <button
              onClick={() => {
                setSearchTerm('');
                setDateFilter('');
                setReferenceFilter('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Journal Entries Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              {searchTerm || dateFilter || referenceFilter 
                ? 'Aucune écriture trouvée avec ces critères' 
                : 'Aucune écriture comptable'
              }
            </p>
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
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Référence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Débit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Crédit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Équilibre
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedEntries.map((entry) => {
                    const isBalanced = entry.total_debit === entry.total_credit;
                    
                    return (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono font-medium text-gray-900">
                            {entry.entry_number}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(entry.entry_date).toLocaleDateString('fr-FR')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {entry.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {entry.reference || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {entry.total_debit.toLocaleString()} $
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {entry.total_credit.toLocaleString()} $
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            isBalanced 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {isBalanced ? 'Équilibrée' : 'Déséquilibrée'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => setViewingEntry(entry)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Voir détails"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={4} className="px-6 py-3 text-right font-medium text-gray-900">
                      Totaux:
                    </td>
                    <td className="px-6 py-3 font-bold text-gray-900">
                      {getTotalDebit().toLocaleString()} $
                    </td>
                    <td className="px-6 py-3 font-bold text-gray-900">
                      {getTotalCredit().toLocaleString()} $
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        getTotalDebit() === getTotalCredit()
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {getTotalDebit() === getTotalCredit() ? 'Équilibré' : 'Déséquilibré'}
                      </span>
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredEntries.length)} sur {filteredEntries.length} résultats
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

      {/* Journal Entry Detail Modal */}
      {viewingEntry && (
        <JournalEntryDetail
          entry={viewingEntry}
          onClose={() => setViewingEntry(null)}
        />
      )}
    </div>
  );
}