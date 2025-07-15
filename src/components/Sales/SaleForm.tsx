import React, { useState, useEffect } from 'react';
import { Plus, Minus, Save, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase, Sale, Customer, Product, testSupabaseConnection } from '../../lib/supabase';
import { ThermalReceipt } from './ThermalReceipt';

interface SaleFormProps {
  sale?: Sale | null;
  customers: Customer[];
  onSuccess: () => void;
  onCancel: () => void;
}

interface SaleItemForm {
  id?: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product?: Product;
}

export function SaleForm({ sale, customers, onSuccess, onCancel }: SaleFormProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [stockError, setStockError] = useState<string | null>(null);
  const [showThermalReceipt, setShowThermalReceipt] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [saleActivity, setSaleActivity] = useState<any>(null);
  const [formData, setFormData] = useState({
    customer_id: sale?.customer_id || '',
    sale_date: sale?.sale_date || new Date().toISOString().split('T')[0],
    due_date: sale?.due_date || '',
    status: sale?.status || 'en_cours',
    notes: sale?.notes || ''
  });
  const [items, setItems] = useState<SaleItemForm[]>(
    sale?.sale_items?.map(item => ({
      id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      product: item.product
    })) || [{ product_id: '', quantity: 1, unit_price: 0, total_price: 0 }]
  );

  useEffect(() => {
    if (profile?.company_id) {
      loadProducts();
    }
  }, [profile?.company_id]);

  // Charger les informations de l'activité pour le reçu thermique
  useEffect(() => {
    if (completedSale?.activity_id) {
      loadSaleActivity(completedSale.activity_id);
    }
  }, [completedSale]);

  const loadProducts = async () => {
    if (!profile?.company_id) {
      console.error('Company ID is not available');
      setConnectionError('ID de l\'entreprise non disponible');
      return;
    }

    try {
      setConnectionError(null);
      setStockError(null);

      // Test connection first
      console.log('🔍 Testing Supabase connection before loading products...');
      const connectionTest = await testSupabaseConnection();

      if (!connectionTest.success) {
        console.error('❌ Connection test failed:', connectionTest.error);
        setConnectionError(`Erreur de connexion: ${connectionTest.error}`);
        return;
      }

      console.log('✅ Connection test passed, loading products...');

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('❌ Supabase query error:', error);
        throw error;
      }

      console.log('✅ Products loaded successfully:', data?.length || 0, 'products');
      setProducts(data || []);

    } catch (error: any) {
      console.error('🛑 Error loading products:', error);

      // Provide more specific error messages
      let errorMessage = 'Erreur inconnue';

      if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'Impossible de se connecter à la base de données. Vérifiez votre connexion internet et la configuration Supabase.';
      } else if (error.message?.includes('CORS')) {
        errorMessage = 'Erreur CORS: Vérifiez la configuration des origines web dans votre projet Supabase.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Timeout de connexion: La base de données met trop de temps à répondre.';
      } else if (error.code) {
        errorMessage = `Erreur base de données (${error.code}): ${error.message}`;
      } else {
        errorMessage = error.message || 'Erreur lors du chargement des produits';
      }

      setConnectionError(errorMessage);
    }
  };

  // const loadSaleActivity = async (activityId: string) => {
  //   try {
  //     const { data, error } = await supabase
  //       .from('activities')
  //       .select('name, address, phone')
  //       .eq('id', activityId)
  //       .single();

  //     if (error) {
  //       console.error('Erreur chargement activité de la vente:', error);
  //       setSaleActivity(null);
  //     } else {
  //       setSaleActivity(data);
  //     }
  //   } catch (error) {
  //     console.error('Exception chargement activité:', error);
  //     setSaleActivity(null);
  //   }
  // };

  const handleItemChange = (index: number, field: keyof SaleItemForm, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].unit_price = product.sale_price;
        newItems[index].product = product;
      }
    }

    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total_price = newItems[index].quantity * newItems[index].unit_price;
    }

    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { product_id: '', quantity: 1, unit_price: 0, total_price: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const getTotalAmount = () => {
    return items.reduce((sum, item) => sum + item.total_price, 0);
  };

  async function loadSaleActivity(activity_id: string) {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('id', activity_id)
        .single();

      if (error) throw error;
      setSaleActivity(data);
    } catch (error) {
      console.error('Erreur chargement activité:', error);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.company_id || !profile?.activity_id) {
      alert('Erreur: Informations de l\'entreprise non disponibles');
      return;
    }

    setLoading(true);
    setStockError(null);

    try {
      // 1. Générer numéro de vente si nécessaire
      let saleNumber = sale?.sale_number;
      if (!saleNumber) {
        const { data: numberData, error } = await supabase
          .rpc('generate_sale_number', { company_uuid: profile.company_id });
        if (error) throw error;
        saleNumber = numberData;
      }

      // 2. Vérifier les stocks
      const insufficientStockItems = [];

      for (const item of items) {
        if (!item.product_id || item.quantity <= 0) continue;

        const { data: stockData, error: stockError } = await supabase
          .from('stocks')
          .select('id, quantity, reserved_quantity')
          .eq('product_id', item.product_id)
          .eq('activity_id', profile.activity_id)
          .eq('company_id', profile.company_id)
          .single();

        if (stockError || !stockData) {
          insufficientStockItems.push({
            name: item.product?.name || 'Produit inconnu',
            code: item.product?.code || '',
            required: item.quantity,
            available: 0
          });
          continue;
        }

        const availableQuantity = stockData.quantity - stockData.reserved_quantity;
        if (availableQuantity < item.quantity) {
          insufficientStockItems.push({
            name: item.product?.name || 'Produit inconnu',
            code: item.product?.code || '',
            required: item.quantity,
            available: availableQuantity
          });
        }
      }

      if (insufficientStockItems.length > 0) {
        const errorMessage = insufficientStockItems.map(item =>
          `• ${item.name} (${item.code}) - Stock disponible: ${item.available}, Demandé: ${item.required}`
        ).join('\n');

        setStockError(`Stock insuffisant pour les produits suivants:\n${errorMessage}`);
        setLoading(false);
        return;
      }

      // 3. Préparer les données de la vente
      const saleData = {
        ...formData,
        customer_id: formData.customer_id || null,
        company_id: profile.company_id,
        activity_id: profile.activity_id,
        sale_number: saleNumber,
        total_amount: getTotalAmount(),
        created_by: profile.id
      };

      let saleId: string;

      if (sale) {
        const { error } = await supabase
          .from('sales')
          .update(saleData)
          .eq('id', sale.id);

        if (error) throw error;
        saleId = sale.id;

        await supabase
          .from('sale_items')
          .delete()
          .eq('sale_id', sale.id);
      } else {
        const { data, error } = await supabase
          .from('sales')
          .insert([saleData])
          .select()
          .single();

        if (error) throw error;
        saleId = data.id;
      }

      // 4. Insérer les sale_items
      const itemsToInsert = items
        .filter(item => item.product_id && item.quantity > 0)
        .map(item => ({
          sale_id: saleId,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        }));

      if (itemsToInsert.length > 0) {
        const { error: itemsError } = await supabase
          .from('sale_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      // 5. Mettre à jour les stocks
      for (const item of itemsToInsert) {
        const { product_id, quantity } = item;

        const { data: stockData, error: stockError } = await supabase
          .from('stocks')
          .select('id, quantity')
          .eq('product_id', product_id)
          .eq('activity_id', profile.activity_id)
          .eq('company_id', profile.company_id)
          .single();

        if (stockError || !stockData) {
          console.error(`❌ Erreur récupération stock ${product_id}`, stockError);
          continue;
        }

        const newQuantity = stockData.quantity - quantity;

        const { error: updateError } = await supabase
          .from('stocks')
          .update({ quantity: newQuantity })
          .eq('id', stockData.id);

        if (updateError) {
          console.error(`❌ Erreur mise à jour stock ${product_id}`, updateError);
        }
      }

      // ✅ 5B. Générer l'écriture CMV (coût des marchandises vendues)
      await supabase.rpc('insert_cmv_entry', { p_sale_id: saleId });

      // 6. Générer l'écriture comptable
      const { data: comptes, error: comptesError } = await supabase
        .from('accounts')
        .select('id, code')
        .in('code', ['571000', '700000']); //700000=Vente 371000=Marchandises, 571000=caisse

      if (comptesError) {
        console.error('Erreur chargement comptes comptables :', comptesError);
      } else {
        const compteCaisse = comptes.find(c => c.code === '571000');
        const compteMarchandises = comptes.find(c => c.code === '700000');

        if (!compteCaisse || !compteMarchandises) {
          console.error('Comptes caisse ou marchandises introuvables');
        } else {
          await supabase.rpc('insert_vente_entry', {
            p_company_id: profile.company_id,
            p_activity_id: profile.activity_id,
            p_entry_date: saleData.sale_date,
            p_reference: saleNumber,
            p_total: getTotalAmount(),
            p_account_caisse: compteCaisse.id,
            p_account_marchandises: compteMarchandises.id
          });
        }
      }

      // 7. Charger la vente complète pour l'impression
      const { data: completeSale, error: loadError } = await supabase
        .from('sales')
        .select(`
          *,
          customer:customers(*),
          sale_items(
            *,
            product:products(*)
          )
        `)
        .eq('id', saleId)
        .single();

      if (loadError) {
        console.error('Erreur chargement vente complète:', loadError);
      } else {
        setCompletedSale(completeSale);
        setShowThermalReceipt(true);

        if (completeSale.activity_id) {
          loadSaleActivity(completeSale.activity_id);
        }
      }
      // } else {
      //   setCompletedSale(completeSale);
      //   setShowThermalReceipt(true);
      // }

      // 8. Succès
      // onSuccess();

    } catch (error) {
      console.error('🛑 Erreur lors de la sauvegarde de la vente :', error);
      alert('Erreur lors de la sauvegarde de la vente : ' + (error?.message || 'inconnue'));
    } finally {
      setLoading(false);
    }
  };

  const handleCloseThermalReceipt = () => {
    setShowThermalReceipt(false);
    setCompletedSale(null);
    setSaleActivity(null);
    onSuccess();
  };

  // Show loading if profile is not ready
  if (!profile?.company_id) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show thermal receipt if needed
  if (showThermalReceipt && completedSale) {
    return (
      <ThermalReceipt
        sale={completedSale}
        companyInfo={{
          name: profile.company?.name || 'Entreprise',
          address: profile.company?.address,
          phone: profile.company?.phone,
          email: profile.company?.email,
          tax_number: profile.company?.tax_number
        }}
        activity={saleActivity}
        onClose={handleCloseThermalReceipt}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {sale ? 'Modifier la vente' : 'Nouvelle vente'}
        </h1>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Connection Error Alert */}
      {connectionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 mb-1">
                Erreur de connexion à la base de données
              </h3>
              <p className="text-sm text-red-700 mb-3">
                {connectionError}
              </p>
              <div className="text-xs text-red-600">
                <p className="mb-1"><strong>Solutions possibles :</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Vérifiez votre connexion internet</li>
                  <li>Vérifiez la configuration Supabase dans le fichier .env</li>
                  <li>Assurez-vous que l'URL localhost:5173 est ajoutée dans les origines CORS de votre projet Supabase</li>
                  <li>Consultez la console du navigateur pour plus de détails</li>
                </ul>
              </div>
              <button
                onClick={loadProducts}
                className="mt-3 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Error Alert */}
      {stockError && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 shadow-md">
          <div className="flex items-start">
            <AlertCircle className="h-6 w-6 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-base font-semibold text-red-800 mb-2">
                Vente impossible - Stock insuffisant
              </h3>
              <pre className="text-sm text-red-700 bg-red-100 p-3 rounded border border-red-200 whitespace-pre-wrap font-mono">
                {stockError}
              </pre>
              <div className="mt-3 flex justify-between items-center">
                <p className="text-xs text-red-600">
                  Veuillez ajuster les quantités ou réapprovisionner le stock avant de continuer.
                </p>
                <button
                  onClick={() => setStockError(null)}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sale Info */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Informations de la vente</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client
              </label>
              <select
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Client anonyme</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de vente
              </label>
              <input
                type="date"
                required
                value={formData.sale_date}
                onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date d'échéance
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="en_cours">En cours</option>
                <option value="livre">Livré</option>
                <option value="paye">Payé</option>
                <option value="annule">Annulé</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Sale Items */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Articles</h3>
            <button
              type="button"
              onClick={addItem}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center space-x-1"
              disabled={connectionError !== null}
            >
              <Plus className="h-4 w-4" />
              <span>Ajouter</span>
            </button>
          </div>

          {connectionError && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Impossible de charger les produits. Veuillez résoudre l'erreur de connexion ci-dessus.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <select
                    value={item.product_id}
                    onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={connectionError !== null}
                  >
                    <option value="">
                      {connectionError ? 'Erreur de chargement des produits' : 'Sélectionner un produit'}
                    </option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.code} - {product.name} ({product.unit}) - {product.sale_price.toFixed(2)}$
                      </option>
                    ))}
                  </select>
                  {item.product && (
                    <div className="text-xs text-gray-500 mt-1">
                      Catégorie: {item.product.category || 'Non définie'} |
                      Prix d'achat: {item.product.purchase_price?.toFixed(2) || '0.00'}$ |
                      Stock min: {item.product.min_stock_level}
                    </div>
                  )}
                </div>

                <div className="w-full md:w-24">
                  <label className="block text-xs text-gray-500 mb-1">Qté</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Qté"
                    required
                  />
                </div>

                <div className="w-full md:w-32">
                  <label className="block text-xs text-gray-500 mb-1">Prix unitaire</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Prix unitaire"
                    required
                  />
                </div>

                <div className="w-full md:w-32">
                  <label className="block text-xs text-gray-500 mb-1">Total</label>
                  <input
                    type="number"
                    step="0.01"
                    value={item.total_price.toFixed(2)}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 font-medium"
                    placeholder="Total"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-red-600 hover:text-red-800 p-1"
                  disabled={items.length === 1}
                  title="Supprimer cette ligne"
                >
                  <Minus className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-end">
              <div className="text-xl font-bold">
                Total: {getTotalAmount().toLocaleString('fr-FR', { minimumFractionDigits: 2 })} $
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading || connectionError !== null || stockError !== null}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{sale ? 'Modifier' : 'Créer'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}