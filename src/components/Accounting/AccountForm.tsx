import React, { useState } from 'react';
import { Save, X, FileText } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface Account {
  id: string;
  company_id: string;
  code: string;
  name: string;
  account_type: 'actif' | 'passif' | 'produit' | 'charge';
  parent_id?: string;
  is_active: boolean;
}

interface AccountFormProps {
  account?: Account | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AccountForm({ account, onSuccess, onCancel }: AccountFormProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: account?.code || '',
    name: account?.name || '',
    account_type: account?.account_type || 'actif' as 'actif' | 'passif' | 'produit' | 'charge',
    is_active: account?.is_active ?? true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const accountData = {
        ...formData,
        company_id: profile?.company_id
      };

      if (account) {
        // Update existing account
        const { error } = await supabase
          .from('accounts')
          .update(accountData)
          .eq('id', account.id);

        if (error) throw error;
      } else {
        // Create new account
        const { error } = await supabase
          .from('accounts')
          .insert([accountData]);

        if (error) throw error;
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving account:', error);
      if (error.code === '23505') {
        alert('Ce code de compte existe déjà dans votre entreprise.');
      } else {
        alert('Erreur lors de la sauvegarde du compte.');
      }
    } finally {
      setLoading(false);
    }
  };

  const accountTypes = [
    { value: 'actif', label: 'Actif', description: 'Biens et créances de l\'entreprise' },
    { value: 'passif', label: 'Passif', description: 'Dettes et capitaux propres' },
    { value: 'produit', label: 'Produit', description: 'Revenus et produits' },
    { value: 'charge', label: 'Charge', description: 'Coûts et dépenses' }
  ];

  const getCodePrefix = (type: string) => {
    const prefixes = {
      actif: '1-5',
      passif: '1-5',
      charge: '6',
      produit: '7'
    };
    return prefixes[type as keyof typeof prefixes] || '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileText className="h-8 w-8 text-green-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {account ? 'Modifier le compte' : 'Nouveau compte'}
            </h2>
            <p className="text-gray-500">
              {account ? 'Modifiez les informations du compte' : 'Créez un nouveau compte comptable'}
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Informations du compte</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code du compte *
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono"
                placeholder="Ex: 571000"
              />
              <p className="text-xs text-gray-500 mt-1">
                Préfixe recommandé pour {formData.account_type}: {getCodePrefix(formData.account_type)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de compte *
              </label>
              <select
                required
                value={formData.account_type}
                onChange={(e) => setFormData({ ...formData, account_type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {accountTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du compte *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ex: Caisse principale"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                Compte actif
              </label>
            </div>
          </div>
        </div>

        {/* Account Type Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            Type sélectionné: {accountTypes.find(t => t.value === formData.account_type)?.label}
          </h4>
          <p className="text-sm text-blue-800">
            {accountTypes.find(t => t.value === formData.account_type)?.description}
          </p>
        </div>

        {/* Examples */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Exemples de codes comptables</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600">
            <div>
              <strong>Actif:</strong>
              <ul className="mt-1 space-y-1">
                <li>• 571000 - Caisse</li>
                <li>• 512000 - Banque</li>
                <li>• 411000 - Clients</li>
              </ul>
            </div>
            <div>
              <strong>Passif:</strong>
              <ul className="mt-1 space-y-1">
                <li>• 401000 - Fournisseurs</li>
                <li>• 164000 - Emprunts</li>
                <li>• 101000 - Capital</li>
              </ul>
            </div>
            <div>
              <strong>Produits:</strong>
              <ul className="mt-1 space-y-1">
                <li>• 700000 - Ventes</li>
                <li>• 706000 - Prestations</li>
                <li>• 758000 - Produits divers</li>
              </ul>
            </div>
            <div>
              <strong>Charges:</strong>
              <ul className="mt-1 space-y-1">
                <li>• 613100 - Électricité</li>
                <li>• 615000 - Transport</li>
                <li>• 641000 - Salaires</li>
              </ul>
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
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2 transition-colors"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{account ? 'Modifier' : 'Créer'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}