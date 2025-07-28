import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  ShoppingCart,
  AlertTriangle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface DashboardStats {
  totalSales: number;
  totalPurchases: number;
  totalProducts: number;
  totalCustomers: number;
  lowStockItems: number;
  pendingOrders: number;
  monthlySales: any[];
  topProducts: any[];
}

export function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalPurchases: 0,
    totalProducts: 0,
    totalCustomers: 0,
    lowStockItems: 0,
    pendingOrders: 0,
    monthlySales: [],
    topProducts: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      loadDashboardData();
    }
  }, [profile]);

  const loadDashboardData = async () => {
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.toISOString().slice(0, 7);

      // Ventes du mois
      const { data: salesData } = await supabase
        .from('sales')
        .select('total_amount')
        .gte('sale_date', `${currentMonth}-01`)
        .eq('company_id', profile?.company_id);

      // Achats du mois
      const { data: purchasesData } = await supabase
        .from('purchases')
        .select('total_amount')
        .gte('purchase_date', `${currentMonth}-01`)
        .eq('company_id', profile?.company_id);

      // Produits
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', profile?.company_id)
        .eq('is_active', true);

      // Clients
      const { count: customersCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', profile?.company_id)
        .eq('is_active', true);

      // Stock faible
      const { data: lowStockData } = await supabase
        .from('stocks')
        .select(`
          quantity,
          product:products(min_stock_level)
        `)
        .eq('company_id', profile?.company_id);

      // const lowStockCount = lowStockData?.filter(item =>
      //   item.quantity <= (item.product?.min_stock_level || 0)
      // ).length || 0;
      const lowStockCount = lowStockData?.filter(item =>
        item.quantity <= (item.product)
      ).length || 0;

      // Commandes en attente
      const { count: pendingCount } = await supabase
        .from('sales')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', profile?.company_id)
        .eq('status', 'en_cours');

      // Ventes des 6 derniers mois
      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStr = date.toISOString().slice(0, 7);

        const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
        const lastDayOfMonth = new Date(nextMonth.getTime() - 1).toISOString().slice(0, 10);

        const { data: monthlySales } = await supabase
          .from('sales')
          .select('total_amount')
          .gte('sale_date', `${monthStr}-01`)
          .lte('sale_date', lastDayOfMonth)
          .eq('company_id', profile?.company_id);

        monthlyData.push({
          month: date.toLocaleDateString('fr-FR', { month: 'short' }),
          sales: monthlySales?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0
        });
      }

      // Top 5 des produits les plus vendus
      const { data: topProductsData } = await supabase
        .from('sale_items')
        .select(`
          quantity,
          product:products(name)
        `)
        .limit(100);

      const productSales = topProductsData?.reduce((acc: any, item) => {
        const productName = item.quantity || 'Produit inconnu';
        acc[productName] = (acc[productName] || 0) + item.quantity;
        return acc;
      }, {}) || {};

      const topProducts = Object.entries(productSales)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([name, quantity]) => ({ name, quantity }));

      setStats({
        totalSales: salesData?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0,
        totalPurchases: purchasesData?.reduce((sum, purchase) => sum + purchase.total_amount, 0) || 0,
        totalProducts: productsCount || 0,
        totalCustomers: customersCount || 0,
        lowStockItems: lowStockCount,
        pendingOrders: pendingCount || 0,
        monthlySales: monthlyData,
        topProducts
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Ventes de ce mois',
      value: `${stats.totalSales.toLocaleString()} CDF`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Achats de ce mois',
      value: `${stats.totalPurchases.toLocaleString()} CDF`,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Produits actifs',
      value: stats.totalProducts.toString(),
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Clients',
      value: stats.totalCustomers.toString(),
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    }
  ];

  const alertCards = [
    {
      title: 'Stock faible',
      value: stats.lowStockItems.toString(),
      description: 'produits sous le seuil',
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Commandes en attente',
      value: stats.pendingOrders.toString(),
      description: 'à traiter',
      icon: TrendingUp,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  ];

  const canManagePermission = () => {
    return ['proprietaire', 'admin'].includes(profile?.role || '');
    // return ['proprietaire', 'admin', 'gestionnaire_stock'].includes(profile?.role || '');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500">
          {profile?.role === 'proprietaire' ? 'Vue globale' : profile?.activity?.name}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
              {/* Filtre spécial propriétaire et admin */}
              {canManagePermission() && (
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{stat.title}</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{stat.value}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {alertCards.map((alert, index) => {
          const Icon = alert.icon;
          return (
            <div key={index} className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${alert.bgColor}`}>
                  <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${alert.color}`} />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{alert.title}</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{alert.value}</p>
                  <p className="text-xs sm:text-sm text-gray-500">{alert.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Monthly Sales Chart */}
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Évolution des ventes</h3>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.monthlySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(value) => [`${value} CDF`, 'Ventes']} />
                <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products Chart */}
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Top produits vendus</h3>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topProducts} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={12} />
                <YAxis dataKey="name" type="category" width={80} fontSize={10} />
                <Tooltip />
                <Bar dataKey="quantity" fill="#16a34a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}