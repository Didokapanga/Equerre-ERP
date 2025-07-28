import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Filter, Package, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase, Product } from '../../lib/supabase';
import { ProductForm } from './ProductForm';

export function ProductsModule() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (profile) {
      loadProducts();
    }
  }, [profile]);

  const loadProducts = async () => {
    try {
      let query = supabase
        .from('products')
        .select('*')
        .eq('company_id', profile?.company_id);

      // Logique de visibilité selon le rôle
      if (profile?.role === 'proprietaire') {
        // Le propriétaire voit tous les produits de l'entreprise
        console.log('🏢 Propriétaire - Chargement de tous les produits de l\'entreprise');
      } else {
        // Les autres rôles ne voient que les produits de leur activité
        if (profile?.activity_id) {
          query = query.eq('activity_id', profile.activity_id);
          console.log('🏭 Utilisateur standard - Chargement des produits de l\'activité:', profile.activity_id);
        } else {
          // Si l'utilisateur n'a pas d'activité assignée, ne rien afficher
          console.log('⚠️ Utilisateur sans activité assignée - Aucun produit visible');
          setProducts([]);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await query.order('name');

      if (error) throw error;
      setProducts(data || []);

      console.log(`✅ ${data?.length || 0} produit(s) chargé(s) pour le rôle ${profile?.role}`);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Erreur lors de la suppression du produit.');
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingProduct(null);
    loadProducts();
  };

  const getUniqueCategories = () => {
    const categories = products
      .map(product => product.category)
      .filter(category => category && category.trim() !== '')
      .filter((category, index, array) => array.indexOf(category) === index);
    return categories.sort();
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    const matchesStatus = !statusFilter ||
      (statusFilter === 'active' && product.is_active) ||
      (statusFilter === 'inactive' && !product.is_active);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const getMargin = (product: Product) => {
    if (product.purchase_price <= 0) return null;
    return ((product.sale_price - product.purchase_price) / product.purchase_price * 100);
  };

  // Vérifier les permissions pour créer/modifier des produits
  const canManageProducts = () => {
    return ['proprietaire', 'admin', 'gestionnaire_stock'].includes(profile?.role || '');
  };

  if (showForm) {
    return (
      <ProductForm
        product={editingProduct}
        onSuccess={handleFormSuccess}
        onCancel={() => {
          setShowForm(false);
          setEditingProduct(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-x-3">
        <div className="flex items-center space-x-3">
          <Package className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Produits</h1>
            <p className="text-gray-500">
              {filteredProducts.length} produit(s)
              {profile?.role === 'proprietaire' ? ' (toute l\'entreprise)' : ` (${profile?.activity?.name || 'votre activité'})`}
            </p>
          </div>
        </div>
        {canManageProducts() && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nouveau produit</span>
          </button>
        )}
      </div>

      {/* Info sur la visibilité */}
      <div className={`p-4 rounded-lg border ${profile?.role === 'proprietaire'
        ? 'bg-purple-50 border-purple-200'
        : 'bg-blue-50 border-blue-200'
        }`}>
        <div className="flex items-start space-x-3">
          <Package className={`h-5 w-5 mt-0.5 ${profile?.role === 'proprietaire' ? 'text-purple-600' : 'text-blue-600'
            }`} />
          <div>
            <h4 className={`text-sm font-medium ${profile?.role === 'proprietaire' ? 'text-purple-900' : 'text-blue-900'
              }`}>
              {profile?.role === 'proprietaire' ? 'Vue Propriétaire' : 'Vue par Activité'}
            </h4>
            <p className={`text-sm mt-1 ${profile?.role === 'proprietaire' ? 'text-purple-700' : 'text-blue-700'
              }`}>
              {profile?.role === 'proprietaire'
                ? 'Vous voyez tous les produits de votre entreprise, toutes activités confondues.'
                : `Vous voyez uniquement les produits de votre activité : ${profile?.activity?.name || 'Non assignée'}`
              }
            </p>
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
                placeholder="Rechercher par nom, code ou description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="lg:w-48">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Toutes les catégories</option>
              {getUniqueCategories().map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
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

      {/* Products Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              {profile?.role === 'proprietaire'
                ? 'Aucun produit dans votre entreprise'
                : `Aucun produit dans l'activité ${profile?.activity?.name || 'assignée'}`
              }
            </p>
            {canManageProducts() && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Créer le premier produit
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
                      Produit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Catégorie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prix d'achat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prix de vente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marge
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock min.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    {canManageProducts() && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedProducts.map((product) => {
                    const margin = getMargin(product);
                    return (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                            {product.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {product.description}
                              </div>
                            )}
                            <div className="text-xs text-gray-400">
                              {product.unit}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-900">
                            {product.code}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {product.category || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {product.purchase_price > 0 ? `${product.purchase_price.toFixed(2)} CDF` : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {product.sale_price.toFixed(2)} CDF
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {margin !== null ? (
                            <div className={`text-sm font-medium ${margin > 30 ? 'text-green-600' :
                              margin > 10 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                              {margin.toFixed(1)}%
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400">-</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-900">
                              {product.min_stock_level}
                            </span>
                            {product.min_stock_level > 0 && (
                              <AlertTriangle className="h-4 w-4 text-orange-500 ml-1" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${product.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}>
                            {product.is_active ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        {canManageProducts() && (
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => {
                                  setEditingProduct(product);
                                  setShowForm(true);
                                }}
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="Modifier"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(product.id)}
                                className="text-red-600 hover:text-red-900 p-1"
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        )}
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
                  Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredProducts.length)} sur {filteredProducts.length} résultats
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