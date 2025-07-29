import React, { useState, useEffect } from 'react';
import { Plus, Minus, Save, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase, Purchase, Supplier, Product } from '../../lib/supabase';

interface PurchaseFormProps {
  purchase?: Purchase | null;
  suppliers: Supplier[];
  onSuccess: () => void;
  onCancel: () => void;
}

interface PurchaseItemForm {
  id?: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  received_quantity: number;
  product?: Product;
}

export function PurchaseForm({ purchase, suppliers, onSuccess, onCancel }: PurchaseFormProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    supplier_id: purchase?.supplier_id || '',
    purchase_date: purchase?.purchase_date || new Date().toISOString().split('T')[0],
    // due_date: purchase?.due_date || '',
    status: purchase?.status || 'recu',
    notes: purchase?.notes || ''
  });
  const [items, setItems] = useState<PurchaseItemForm[]>(
    purchase?.purchase_items?.map(item => ({
      id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      received_quantity: item.received_quantity,
      product: item.product
    })) || [{ product_id: '', quantity: 1, unit_price: 0, total_price: 0, received_quantity: 0 }]
  );

  useEffect(() => {
    if (profile?.company_id) {
      loadProducts();
    }
  }, [profile?.company_id]);

  const loadProducts = async () => {
    if (!profile?.company_id) {
      console.error('Company ID is not available');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleItemChange = (index: number, field: keyof PurchaseItemForm, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].unit_price = product.purchase_price || 0;
        newItems[index].product = product;
      }
    }

    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total_price = newItems[index].quantity * newItems[index].unit_price;
    }

    // Par défaut, la quantité reçue est égale à la quantité commandée
    if (field === 'quantity') {
      newItems[index].received_quantity = newItems[index].quantity;
    }

    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { product_id: '', quantity: 1, unit_price: 0, total_price: 0, received_quantity: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const getTotalAmount = () => {
    return items.reduce((sum, item) => sum + item.total_price, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.company_id) {
      alert('Erreur: Informations de l\'entreprise non disponibles');
      return;
    }

    setLoading(true);

    try {
      // Generate purchase number if creating new purchase
      let purchaseNumber = purchase?.purchase_number;
      if (!purchaseNumber) {
        const { data: numberData } = await supabase
          .rpc('generate_purchase_number', { company_uuid: profile.company_id });
        purchaseNumber = numberData;
      }

      const purchaseData = {
        ...formData,
        company_id: profile.company_id,
        activity_id: profile.activity_id,
        purchase_number: purchaseNumber,
        total_amount: getTotalAmount(),
        created_by: profile.id
      };

      let purchaseId: string;

      if (purchase) {
        // Update existing purchase
        const { error } = await supabase
          .from('purchases')
          .update(purchaseData)
          .eq('id', purchase.id);

        if (error) throw error;
        purchaseId = purchase.id;

        // Delete existing items
        await supabase
          .from('purchase_items')
          .delete()
          .eq('purchase_id', purchase.id);
      } else {
        // Create new purchase
        const { data, error } = await supabase
          .from('purchases')
          .insert([purchaseData])
          .select()
          .single();

        if (error) throw error;
        purchaseId = data.id;
      }

      // Insert purchase items
      const itemsData = items
        .filter(item => item.product_id && item.quantity > 0)
        .map(item => ({
          purchase_id: purchaseId,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          received_quantity: item.received_quantity
        }));

      if (itemsData.length > 0) {
        const { error: itemsError } = await supabase
          .from('purchase_items')
          .insert(itemsData);

        if (itemsError) throw itemsError;
      }

      // Récupérer les comptes comptables nécessaires
      try {
        const { data: comptes, error: comptesError } = await supabase
          .from('accounts')
          .select('id, code')
          .in('code', ['371000', '571000']) // 371000 = Marchandises, 571000 = Caisse
          .eq('company_id', profile.company_id);

        if (comptesError) {
          console.error('Erreur chargement comptes comptables:', comptesError);
        } else if (comptes && comptes.length >= 2) {
          const compteMarchandises = comptes.find(c => c.code === '371000');
          const compteCaisse = comptes.find(c => c.code === '571000');

          if (compteMarchandises && compteCaisse) {
            // Appel de la fonction d'écriture comptable
            const { error: comptaError } = await supabase.rpc('insert_achat_entry', {
              p_company_id: profile.company_id,
              p_activity_id: profile.activity_id,
              p_entry_date: purchaseData.purchase_date,
              p_reference: purchaseNumber,
              p_total: getTotalAmount(),
              p_debit_account: compteMarchandises.id,     // 371000 : Marchandises
              p_credit_account: compteCaisse.id,          // 571000 : Caisse - Fixed: use .id instead of the whole object
            });

            if (comptaError) {
              console.error('Erreur écriture comptable achat:', comptaError);
              // Ne pas bloquer la sauvegarde de l'achat si l'écriture comptable échoue
            } else {
              console.log("✅ Écriture comptable créée avec succès");
            }
          } else {
            console.warn("⚠️ Comptes comptables requis non trouvés (601000, 401000)");
          }
        } else {
          console.warn("⚠️ Comptes comptables insuffisants:", comptes?.length);
        }
      } catch (comptaError) {
        console.error('Exception lors de la création de l\'écriture comptable:', comptaError);
        // Ne pas bloquer la sauvegarde de l'achat si l'écriture comptable échoue
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving purchase:', error);
      alert('Erreur lors de la sauvegarde de l\'achat' + (error?.message || 'inconnue'));
    } finally {
      setLoading(false);
    }
  };

  // Show loading if profile is not ready
  if (!profile?.company_id) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {purchase ? 'Modifier l\'achat' : 'Nouvel achat'}
        </h1>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Purchase Info */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Informations de l'achat</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fournisseur *
              </label>
              <select
                // required
                value={formData.supplier_id}
                onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {/* <option value="">Sélectionner un fournisseur</option> */}
                <option value="">Fournisseur anonyme</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date d'achat
              </label>
              <input
                type="date"
                required
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date d'échéance
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div> */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="recu">Reçu</option>
              </select>
            </div>
          </div>

          {/* <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div> */}
        </div>

        {/* Purchase Items */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Articles</h3>
            <button
              type="button"
              onClick={addItem}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center space-x-1"
            >
              <Plus className="h-4 w-4" />
              <span>Ajouter</span>
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <select
                    value={item.product_id}
                    onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Sélectionner un produit</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.code} - {product.name} ({product.unit}) - {product.purchase_price?.toFixed(2) || '0.00'}CDF
                      </option>
                    ))}
                  </select>
                  {item.product && (
                    <div className="text-xs text-gray-500 mt-1">
                      Catégorie: {item.product.category || 'Non définie'} |
                      Prix de vente: {item.product.sale_price.toFixed(2)}CDF
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

                <div className="w-full md:w-24">
                  <label className="block text-xs text-gray-500 mb-1">Reçu</label>
                  <input
                    type="number"
                    min="0"
                    max={item.quantity}
                    value={item.received_quantity}
                    onChange={(e) => handleItemChange(index, 'received_quantity', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Reçu"
                    title="Quantité reçue"
                  />
                </div>

                <div className="w-full md:w-24">
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
                Total: {getTotalAmount().toLocaleString('fr-FR', { minimumFractionDigits: 2 })} CDF
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
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{purchase ? 'Modifier' : 'Créer'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}