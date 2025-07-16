import React, { useState, useEffect } from 'react';
import { Save, X, Receipt, Calendar, DollarSign, FileText, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { supabase, Expense, Activity } from '../../lib/supabase';

interface ExpenseFormProps {
  expense?: Expense | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ExpenseForm({ expense, onSuccess, onCancel }: ExpenseFormProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [formData, setFormData] = useState({
    title: expense?.title || '',
    description: expense?.description || '',
    category: expense?.category || '',
    amount: expense?.amount || 0,
    expense_date: expense?.expense_date || new Date().toISOString().split('T')[0],
    activity_id: expense?.activity_id || profile?.activity_id || '',
    receipt_url: expense?.receipt_url || ''
  });

  useEffect(() => {
    if (profile?.company_id) {
      loadActivities();
    }
  }, [profile?.company_id]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const expenseData = {
        ...formData,
        company_id: profile?.company_id,
        created_by: profile?.id
      };

      if (expense) {
        // Update existing expense
        const { error } = await supabase
          .from('expenses')
          .update(expenseData)
          .eq('id', expense.id);

        if (error) throw error;
      } else {
        // Create new expense
        const { error } = await supabase
          .from('expenses')
          .insert([expenseData]);

        if (error) throw error;
      }

      const codeCategorie = expenseData.category; // par exemple: "electricite"

      // On suppose que le code du compte correspond directement à la catégorie
      const { data: comptes, error: comptesError } = await supabase
        .from('accounts')
        .select('id, name')
        .in('name', [codeCategorie, 'caisse']) // 571000 = caisse
        .eq('company_id', profile.company_id);

      const compteCharge = comptes?.find(c => c.name === codeCategorie);
      const compteCaisse = comptes?.find(c => c.name === 'caisse');

      if (!compteCharge || !compteCaisse) {
        throw new Error("❌ Comptes comptables introuvables pour la catégorie ou la caisse");
        return;
      }

      const { error: comptaError } = await supabase.rpc('insert_depense_entry', {
        p_company_id: profile.company_id,
        p_activity_id: profile.activity_id,
        p_depense_date: expenseData.expense_date,
        p_reference: expenseData.title,
        p_total: expenseData.amount,
        p_account_depense: compteCharge.id,
        p_account_tresorerie: compteCaisse.id
      });

      if (comptaError) {
        console.error('Erreur écriture comptable dépense :', comptaError);
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving expense:', error);
      alert('Erreur lors de la sauvegarde de la dépense :' + (error?.message || 'inconnue'));
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    // Charges fiscales et parafiscales
    { value: 'impot', label: 'Impôts', group: 'Charges fiscales' },
    { value: 'taxe', label: 'Taxes', group: 'Charges fiscales' },
    { value: 'cnss', label: 'CNSS', group: 'Charges fiscales' },
    { value: 'dgi', label: 'DGI', group: 'Charges fiscales' },
    { value: 'patente', label: 'Patente', group: 'Charges fiscales' },

    // Services publics
    { value: 'electricite', label: 'Électricité', group: 'Services publics' },
    { value: 'eau', label: 'Eau', group: 'Services publics' },
    { value: 'internet', label: 'Internet', group: 'Services publics' },
    { value: 'telephone', label: 'Téléphone', group: 'Services publics' },

    // Logistique et transport
    { value: 'transport', label: 'Transport', group: 'Logistique' },
    { value: 'carburant', label: 'Carburant', group: 'Logistique' },
    { value: 'manutention', label: 'Manutention', group: 'Logistique' },
    { value: 'location_vehicule', label: 'Location véhicule', group: 'Logistique' },

    // Fournitures et entretien
    { value: 'fournitures_bureau', label: 'Fournitures bureau', group: 'Fournitures' },
    { value: 'nettoyage', label: 'Nettoyage', group: 'Fournitures' },
    { value: 'reparation_materiel', label: 'Réparation matériel', group: 'Fournitures' },

    // Ressources humaines
    { value: 'formation_personnel', label: 'Formation personnel', group: 'RH' },
    { value: 'recrutement', label: 'Recrutement', group: 'RH' },
    { value: 'uniforme', label: 'Uniforme', group: 'RH' },
    { value: 'primes', label: 'Primes', group: 'RH' },
    { value: 'salaires', label: 'Salaires', group: 'RH' },

    // Gestion quotidienne
    { value: 'divers', label: 'Divers', group: 'Gestion' },
    { value: 'hospitalite', label: 'Hospitalité', group: 'Gestion' },
    { value: 'deplacements', label: 'Déplacements', group: 'Gestion' },
    { value: 'repas', label: 'Repas', group: 'Gestion' },
    { value: 'imprevus', label: 'Imprévus', group: 'Gestion' }
  ];

  const groupedCategories = categories.reduce((acc, category) => {
    if (!acc[category.group]) {
      acc[category.group] = [];
    }
    acc[category.group].push(category);
    return acc;
  }, {} as Record<string, typeof categories>);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Receipt className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {expense ? 'Modifier la dépense' : 'Nouvelle dépense'}
                </h2>
                <p className="text-gray-500">
                  {expense ? 'Modifiez les informations de la dépense' : 'Enregistrez une nouvelle dépense'}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Informations générales
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titre de la dépense *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Ex: Facture électricité janvier 2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {Object.entries(groupedCategories).map(([group, items]) => (
                      <optgroup key={group} label={group}>
                        {items.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Montant ($) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de la dépense *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="date"
                      required
                      value={formData.expense_date}
                      onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Activité concernée *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <select
                      required
                      value={formData.activity_id}
                      onChange={(e) => setFormData({ ...formData, activity_id: e.target.value })}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">Sélectionner une activité</option>
                      {activities.map((activity) => (
                        <option key={activity.id} value={activity.id}>
                          {activity.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Détails supplémentaires sur cette dépense..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL du reçu/facture
                  </label>
                  <input
                    type="url"
                    value={formData.receipt_url}
                    onChange={(e) => setFormData({ ...formData, receipt_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="https://exemple.com/facture.pdf"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Lien vers le document justificatif (optionnel)
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center space-x-2 transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{expense ? 'Modifier' : 'Enregistrer'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}