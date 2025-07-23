import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Download, Calendar, Filter, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface BalanceData {
  id: string;
  account_id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  company_id: string;
  activity_id?: string;
  debit: number;
  credit: number;
  total_debit: number;
  total_credit: number;
  balance: number;
  period_start?: string;
  period_end?: string;
  created_at: string;
}

export function Reports() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [balanceData, setBalanceData] = useState<BalanceData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');
  const [selectedReport, setSelectedReport] = useState('balance');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      loadBalanceData();
    }
  }, [profile, selectedPeriod]);

  const loadBalanceData = async () => {
    try {
      setError(null);
      setLoading(true);

      // Récupérer les données de la balance générale
      const { data: balanceData, error: balanceError } = await supabase
        .from('balance_generale')
        .select('*')
        .eq('company_id', profile?.company_id);

      if (balanceError) {
        console.error('Erreur chargement balance_generale:', balanceError);
        throw balanceError;
      }

      if (!balanceData || balanceData.length === 0) {
        console.log('Aucune donnée dans balance_generale, chargement des comptes...');

        // Si pas de données dans balance_generale, essayer de charger directement les comptes
        const { data: accountsData, error: accountsError } = await supabase
          .from('accounts')
          .select('*')
          .eq('company_id', profile?.company_id)
          .eq('is_active', true);

        if (accountsError) {
          console.error('Erreur chargement comptes:', accountsError);
          throw accountsError;
        }

        if (!accountsData || accountsData.length === 0) {
          setError('Aucun compte comptable trouvé. Veuillez créer des comptes dans le plan comptable.');
          setBalanceData([]);
        } else {
          // Créer des données de balance à partir des comptes (avec solde à 0)
          const emptyBalanceData = accountsData.map(account => ({
            id: account.id,
            account_id: account.id,
            account_code: account.code,
            account_name: account.name,
            account_type: account.account_type,
            company_id: account.company_id,
            activity_id: null,
            debit: 0,
            credit: 0,
            total_debit: 0,
            total_credit: 0,
            balance: 0,
            created_at: new Date().toISOString()
          }));

          setBalanceData(emptyBalanceData);
          console.log('Données de comptes chargées:', emptyBalanceData.length);
        }
      } else {
        setBalanceData(balanceData);
        console.log('Données balance_generale chargées:', balanceData.length);
      }
    } catch (error: any) {
      console.error('Erreur chargement données comptables:', error);
      setError(`Erreur de chargement des données: ${error.message}`);

      // Créer un jeu de données vide pour éviter les erreurs d'affichage
      setBalanceData([]);
    } finally {
      setLoading(false);
    }
  };

  const getAccountsByType = () => {
    return balanceData.reduce((acc, account) => {
      if (!acc[account.account_type]) {
        acc[account.account_type] = [];
      }
      acc[account.account_type].push(account);
      return acc;
    }, {} as Record<string, BalanceData[]>);
  };

  const getTypeTotal = (type: string) => {
    return balanceData
      .filter(account => account.account_type === type)
      .reduce((sum, account) => sum + (account.balance || 0), 0);
  };

  const getChartData = () => {
    const types = ['actif', 'passif', 'produit', 'charge'];
    const data = types.map(type => {
      const total = Math.abs(getTypeTotal(type));
      return {
        name: type.charAt(0).toUpperCase() + type.slice(1),
        value: total,
        color: {
          actif: '#3B82F6',
          passif: '#EF4444',
          produit: '#10B981',
          charge: '#F59E0B'
        }[type]
      };
    });

    // Filtrer les types avec valeur 0 pour éviter les problèmes d'affichage
    return data.filter(item => item.value > 0);
  };

  const getTopAccountsData = () => {
    return balanceData
      .filter(account => Math.abs(account.balance || 0) > 0)
      .sort((a, b) => Math.abs(b.balance || 0) - Math.abs(a.balance || 0))
      .slice(0, 10)
      .map(account => ({
        name: `${account.account_code} - ${account.account_name.substring(0, 20)}`,
        value: Math.abs(account.balance || 0)
      }));
  };

  const calculateFinancialRatios = () => {
    const totalActif = getTypeTotal('actif');
    const totalPassif = getTypeTotal('passif');
    const totalProduits = getTypeTotal('produit');
    const totalCharges = getTypeTotal('charge');

    return {
      resultat: totalProduits - totalCharges,
      chiffreAffaires: totalProduits,
      totalActif,
      totalPassif,
      equilibre: Math.abs(totalActif - totalPassif)
    };
  };

  const ratios = calculateFinancialRatios();

  const renderBalanceSheet = () => {
    const accountsByType = getAccountsByType();

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actif */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
            <h3 className="text-lg font-semibold text-blue-900">ACTIF</h3>
          </div>
          <div className="p-6">
            {accountsByType.actif?.length > 0 ? (
              accountsByType.actif.map((account) => (
                <div key={account.account_id} className="flex justify-between py-2 border-b border-gray-100">
                  <div>
                    <div className="font-medium text-gray-900">{account.account_code}</div>
                    <div className="text-sm text-gray-600">{account.account_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      {(account.balance || 0).toLocaleString()} CDF
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">Aucun compte actif</div>
            )}
            <div className="flex justify-between py-3 border-t-2 border-blue-200 mt-4">
              <div className="font-bold text-blue-900">TOTAL ACTIF</div>
              <div className="font-bold text-blue-900">
                {getTypeTotal('actif').toLocaleString()} CDF
              </div>
            </div>
          </div>
        </div>

        {/* Passif */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
            <h3 className="text-lg font-semibold text-red-900">PASSIF</h3>
          </div>
          <div className="p-6">
            {accountsByType.passif?.length > 0 ? (
              accountsByType.passif.map((account) => (
                <div key={account.account_id} className="flex justify-between py-2 border-b border-gray-100">
                  <div>
                    <div className="font-medium text-gray-900">{account.account_code}</div>
                    <div className="text-sm text-gray-600">{account.account_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      {(account.balance || 0).toLocaleString()} CDF
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">Aucun compte passif</div>
            )}
            <div className="flex justify-between py-3 border-t-2 border-red-200 mt-4">
              <div className="font-bold text-red-900">TOTAL PASSIF</div>
              <div className="font-bold text-red-900">
                {getTypeTotal('passif').toLocaleString()} CDF
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProfitLoss = () => {
    const accountsByType = getAccountsByType();

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produits */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
            <h3 className="text-lg font-semibold text-green-900">PRODUITS</h3>
          </div>
          <div className="p-6">
            {accountsByType.produit?.length > 0 ? (
              accountsByType.produit.map((account) => (
                <div key={account.account_id} className="flex justify-between py-2 border-b border-gray-100">
                  <div>
                    <div className="font-medium text-gray-900">{account.account_code}</div>
                    <div className="text-sm text-gray-600">{account.account_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      {(account.balance || 0).toLocaleString()} CDF
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">Aucun compte de produit</div>
            )}
            <div className="flex justify-between py-3 border-t-2 border-green-200 mt-4">
              <div className="font-bold text-green-900">TOTAL PRODUITS</div>
              <div className="font-bold text-green-900">
                {getTypeTotal('produit').toLocaleString()} CDF
              </div>
            </div>
          </div>
        </div>

        {/* Charges */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-orange-50">
            <h3 className="text-lg font-semibold text-orange-900">CHARGES</h3>
          </div>
          <div className="p-6">
            {accountsByType.charge?.length > 0 ? (
              accountsByType.charge.map((account) => (
                <div key={account.account_id} className="flex justify-between py-2 border-b border-gray-100">
                  <div>
                    <div className="font-medium text-gray-900">{account.account_code}</div>
                    <div className="text-sm text-gray-600">{account.account_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      {(account.balance || 0).toLocaleString()} CDF
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">Aucun compte de charge</div>
            )}
            <div className="flex justify-between py-3 border-t-2 border-orange-200 mt-4">
              <div className="font-bold text-orange-900">TOTAL CHARGES</div>
              <div className="font-bold text-orange-900">
                {getTypeTotal('charge').toLocaleString()} CDF
              </div>
            </div>
          </div>
        </div>

        {/* Résultat */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className={`px-6 py-4 border-b border-gray-200 ${ratios.resultat >= 0 ? 'bg-green-50' : 'bg-red-50'
              }`}>
              <h3 className={`text-lg font-semibold ${ratios.resultat >= 0 ? 'text-green-900' : 'text-red-900'
                }`}>
                RÉSULTAT NET
              </h3>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-center">
                <div className="text-lg text-gray-700">
                  Produits - Charges = Résultat
                </div>
                <div className={`text-2xl font-bold ${ratios.resultat >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                  {ratios.resultat >= 0 ? '+' : ''}{ratios.resultat.toLocaleString()} CDF
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BarChart3 className="h-8 w-8 text-green-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Rapports comptables</h2>
            <p className="text-gray-500">Bilan, compte de résultat et analyses</p>
          </div>
        </div>
        {/* <div className="flex items-center space-x-3">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Exporter PDF</span>
          </button>
        </div> */}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
          <div>
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="balance">Bilan comptable</option>
              <option value="profit-loss">Compte de résultat</option>
              <option value="charts">Graphiques</option>
            </select>
          </div>

          <div>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="current-month">Mois en cours</option>
              <option value="current-year">Année en cours</option>
              <option value="last-month">Mois dernier</option>
              <option value="last-year">Année dernière</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Chiffre d'affaires</p>
              <p className="text-2xl font-bold text-gray-900">
                {ratios.chiffreAffaires.toLocaleString()} CDF
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${ratios.resultat >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <BarChart3 className={`h-6 w-6 ${ratios.resultat >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Résultat net</p>
              <p className={`text-2xl font-bold ${ratios.resultat >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {ratios.resultat >= 0 ? '+' : ''}{ratios.resultat.toLocaleString()} CDF
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total actif</p>
              <p className="text-2xl font-bold text-gray-900">
                {ratios.totalActif.toLocaleString()} CDF
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${ratios.equilibre === 0 ? 'bg-green-100' : 'bg-orange-100'}`}>
              <BarChart3 className={`h-6 w-6 ${ratios.equilibre === 0 ? 'text-green-600' : 'text-orange-600'}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Équilibre</p>
              <p className={`text-2xl font-bold ${ratios.equilibre === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                {ratios.equilibre === 0 ? 'OK' : `${ratios.equilibre.toLocaleString()} CDF`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : error ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-6 w-6 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="text-lg font-medium text-yellow-800 mb-2">Données indisponibles</h3>
              <p className="text-yellow-700">{error}</p>
              <button
                onClick={loadBalanceData}
                className="mt-4 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {selectedReport === 'balance' && renderBalanceSheet()}
          {selectedReport === 'profit-loss' && renderProfitLoss()}
          {selectedReport === 'charts' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition par type</h3>
                <div className="h-80">
                  {getChartData().length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getChartData()}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value.toLocaleString()} CDF`}
                        >
                          {getChartData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${Number(value).toLocaleString()} CDF`} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-gray-500">Aucune donnée à afficher</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bar Chart */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 des comptes</h3>
                <div className="h-80">
                  {getTopAccountsData().length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getTopAccountsData()} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip formatter={(value) => `${Number(value).toLocaleString()} CDF`} />
                        <Bar dataKey="value" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-gray-500">Aucune donnée à afficher</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}