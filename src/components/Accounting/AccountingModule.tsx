import React, { useState, useEffect } from 'react';
import { Calculator, FileText, TrendingUp, BarChart3, PlusCircle, Eye } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { AccountsManagement } from './AccountsManagement';
import { JournalEntries } from './JournalEntries';
import { Reports } from './Reports';
import { ManualEntry } from './ManualEntry';

export function AccountingModule() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('accounts');
  const [stats, setStats] = useState({
    totalAccounts: 0,
    monthlyEntries: 0,
    totalRevenue: 0,
    netResult: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      loadAccountingStats();
    }
  }, [profile]);

  const loadAccountingStats = async () => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);

      // Comptes actifs
      const { count: accountsCount, error: accountsError } = await supabase
        .from('accounts')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', profile?.company_id)
        .eq('is_active', true);

      if (accountsError) {
        console.error('Erreur chargement comptes:', accountsError);
      }

      // Écritures ce mois
      const { count: entriesCount, error: entriesError } = await supabase
        .from('journal_entries')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', profile?.company_id)
        .gte('entry_date', `${currentMonth}-01`);

      if (entriesError) {
        console.error('Erreur chargement écritures:', entriesError);
      }

      // Chargement des données de la balance générale
      const { data: balanceData, error: balanceError } = await supabase
        .from('balance_generale')
        .select('*')
        .eq('company_id', profile?.company_id);

      if (balanceError) {
        console.error('Erreur chargement balance:', balanceError);
      }

      // Calcul du chiffre d'affaires et du résultat net
      let totalRevenue = 0;
      let totalCharges = 0;

      if (balanceData && balanceData.length > 0) {
        // Calculer à partir des données de la balance
        totalRevenue = balanceData
          .filter(account => account.account_type === 'produit')
          .reduce((sum, account) => sum + Math.abs(account.balance || 0), 0);

        totalCharges = balanceData
          .filter(account => account.account_type === 'charge')
          .reduce((sum, account) => sum + Math.abs(account.balance || 0), 0);
      } else {
        // Fallback: essayer de calculer à partir des écritures
        const { data: revenueData, error: revenueError } = await supabase
          .from('journal_entry_lines')
          .select(`
            credit_amount,
            journal_entry:journal_entries!inner(company_id),
            account:accounts!inner(account_type)
          `)
          .eq('journal_entry.company_id', profile?.company_id)
          .eq('account.account_type', 'produit');

        if (!revenueError && revenueData) {
          totalRevenue = revenueData.reduce((sum, line) => sum + (line.credit_amount || 0), 0);
        }

        const { data: chargesData, error: chargesError } = await supabase
          .from('journal_entry_lines')
          .select(`
            debit_amount,
            journal_entry:journal_entries!inner(company_id),
            account:accounts!inner(account_type)
          `)
          .eq('journal_entry.company_id', profile?.company_id)
          .eq('account.account_type', 'charge');

        if (!chargesError && chargesData) {
          totalCharges = chargesData.reduce((sum, line) => sum + (line.debit_amount || 0), 0);
        }
      }

      setStats({
        totalAccounts: accountsCount || 0,
        monthlyEntries: entriesCount || 0,
        totalRevenue,
        netResult: totalRevenue - totalCharges
      });
    } catch (error) {
      console.error('Error loading accounting stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'accounts', name: 'Plan comptable', icon: FileText },
    { id: 'entries', name: 'Écritures', icon: Calculator },
    { id: 'manual', name: 'Saisie manuelle', icon: PlusCircle },
    { id: 'reports', name: 'Rapports', icon: BarChart3 }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'accounts':
        return <AccountsManagement />;
      case 'entries':
        return <JournalEntries />;
      case 'manual':
        return <ManualEntry />;
      case 'reports':
        return <Reports />;
      default:
        return <AccountsManagement />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-green-100 rounded-xl">
          <Calculator className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Comptabilité</h1>
          <p className="text-gray-600 mt-1">
            Gestion comptable complète avec écritures automatiques
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {renderContent()}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Comptes actifs</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : stats.totalAccounts}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Calculator className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Écritures ce mois</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : stats.monthlyEntries}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Chiffre d'affaires</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : `${stats.totalRevenue.toLocaleString()} $`}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Résultat net</p>
              <p className={`text-2xl font-bold ${stats.netResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {loading ? '...' : `${stats.netResult >= 0 ? '+' : ''}${stats.netResult.toLocaleString()} $`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}