import React, { useState, useEffect } from 'react';
import { Plus, Minus, Save, Calculator, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface Account {
  id: string;
  code: string;
  name: string;
  account_type: string;
}

interface EntryLine {
  account_id: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
}

export function ManualEntry() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [formData, setFormData] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    description: '',
    reference: ''
  });
  const [lines, setLines] = useState<EntryLine[]>([
    { account_id: '', description: '', debit_amount: 0, credit_amount: 0 },
    { account_id: '', description: '', debit_amount: 0, credit_amount: 0 }
  ]);
  const [error, setError] = useState<string | null>(null);

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
        .eq('is_active', true)
        .order('code');

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const addLine = () => {
    setLines([...lines, { account_id: '', description: '', debit_amount: 0, credit_amount: 0 }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 2) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, field: keyof EntryLine, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };

    // Logique corrigée : ne pas forcer à 0 automatiquement
    // L'utilisateur peut saisir librement, la validation se fera à la soumission
    if (field === 'debit_amount') {
      const debitValue = parseFloat(value) || 0;
      newLines[index].debit_amount = debitValue;
      // Ne pas forcer le crédit à 0, laisser l'utilisateur décider
    } else if (field === 'credit_amount') {
      const creditValue = parseFloat(value) || 0;
      newLines[index].credit_amount = creditValue;
      // Ne pas forcer le débit à 0, laisser l'utilisateur décider
    }

    setLines(newLines);
  };

  const getTotalDebit = () => {
    return lines.reduce((sum, line) => sum + (parseFloat(line.debit_amount.toString()) || 0), 0);
  };

  const getTotalCredit = () => {
    return lines.reduce((sum, line) => sum + (parseFloat(line.credit_amount.toString()) || 0), 0);
  };

  const isBalanced = () => {
    const debit = getTotalDebit();
    const credit = getTotalCredit();
    return Math.abs(debit - credit) < 0.01 && debit > 0;
  };

  const validateLines = () => {
    // Vérifier que chaque ligne a soit un débit soit un crédit (mais pas les deux)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.account_id) continue;
      
      const hasDebit = parseFloat(line.debit_amount.toString()) > 0;
      const hasCredit = parseFloat(line.credit_amount.toString()) > 0;
      
      if (hasDebit && hasCredit) {
        setError(`Ligne ${i + 1}: Une ligne ne peut pas avoir à la fois un débit ET un crédit. Veuillez saisir soit l'un soit l'autre.`);
        return false;
      }
      
      if (!hasDebit && !hasCredit) {
        setError(`Ligne ${i + 1}: Veuillez saisir soit un montant au débit soit au crédit.`);
        return false;
      }
    }
    return true;
  };

  const generateEntryNumber = async () => {
    try {
      const { data, error } = await supabase
        .rpc('generate_journal_entry_number', { company_uuid: profile?.company_id });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating entry number:', error);
      // Fallback: générer un numéro simple
      const timestamp = Date.now();
      return `ECR-${timestamp}`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!isBalanced()) {
      setError('L\'écriture doit être équilibrée (débit = crédit)');
      return;
    }

    if (!validateLines()) {
      return;
    }

    const validLines = lines.filter(line => 
      line.account_id && (parseFloat(line.debit_amount.toString()) > 0 || parseFloat(line.credit_amount.toString()) > 0)
    );

    if (validLines.length < 2) {
      setError('Une écriture doit contenir au moins 2 lignes');
      return;
    }

    setLoading(true);

    try {
      // Générer le numéro d'écriture
      const entryNumber = await generateEntryNumber();

      // Créer l'écriture comptable
      const { data: entryData, error: entryError } = await supabase
        .from('journal_entries')
        .insert([{
          company_id: profile?.company_id,
          activity_id: profile?.activity_id,
          entry_number: entryNumber,
          entry_date: formData.entry_date,
          description: formData.description,
          reference: formData.reference || null,
          total_debit: getTotalDebit(),
          total_credit: getTotalCredit(),
          created_by: profile?.id
        }])
        .select()
        .single();

      if (entryError) throw entryError;

      // Créer les lignes d'écriture
      const linesData = validLines.map(line => ({
        journal_entry_id: entryData.id,
        account_id: line.account_id,
        description: line.description || null,
        debit_amount: parseFloat(line.debit_amount.toString()) || 0,
        credit_amount: parseFloat(line.credit_amount.toString()) || 0
      }));

      const { error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert(linesData);

      if (linesError) throw linesError;

      // Réinitialiser le formulaire
      setFormData({
        entry_date: new Date().toISOString().split('T')[0],
        description: '',
        reference: ''
      });
      setLines([
        { account_id: '', description: '', debit_amount: 0, credit_amount: 0 },
        { account_id: '', description: '', debit_amount: 0, credit_amount: 0 }
      ]);

      // alert('Écriture comptable créée avec succès !');
    } catch (error: any) {
      console.error('Error creating journal entry:', error);
      setError(`Erreur lors de la création de l'écriture: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Calculator className="h-8 w-8 text-green-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Saisie manuelle d'écriture</h2>
          <p className="text-gray-500">Créez une écriture comptable en partie double</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-red-800 font-medium">{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Entry Header */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Informations de l'écriture</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                required
                value={formData.entry_date}
                onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Référence
              </label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ex: FACT-001, VIREMENT-123"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <input
                type="text"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Description de l'opération"
              />
            </div>
          </div>
        </div>

        {/* Entry Lines */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Lignes d'écriture</h3>
            <button
              type="button"
              onClick={addLine}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center space-x-1"
            >
              <Plus className="h-4 w-4" />
              <span>Ajouter une ligne</span>
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Instructions :</strong> Pour chaque ligne, saisissez soit un montant au débit soit au crédit (pas les deux). 
              Le total des débits doit être égal au total des crédits.
            </p>
          </div>

          <div className="space-y-4">
            {lines.map((line, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Compte *</label>
                  <select
                    value={line.account_id}
                    onChange={(e) => updateLine(index, 'account_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    required
                  >
                    <option value="">Sélectionner un compte</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Description</label>
                  <input
                    type="text"
                    value={line.description}
                    onChange={(e) => updateLine(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    placeholder="Libellé"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Débit</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={line.debit_amount || ''}
                    onChange={(e) => updateLine(index, 'debit_amount', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Crédit</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={line.credit_amount || ''}
                    onChange={(e) => updateLine(index, 'credit_amount', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    placeholder="0.00"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeLine(index)}
                    disabled={lines.length <= 2}
                    className="text-red-600 hover:text-red-800 p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Supprimer cette ligne"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600 mb-1">Total Débit</div>
                <div className="text-xl font-bold text-blue-900">
                  {getTotalDebit().toLocaleString()} $
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-purple-600 mb-1">Total Crédit</div>
                <div className="text-xl font-bold text-purple-900">
                  {getTotalCredit().toLocaleString()} $
                </div>
              </div>

              <div className={`p-4 rounded-lg ${
                isBalanced() ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <div className={`text-sm mb-1 ${
                  isBalanced() ? 'text-green-600' : 'text-red-600'
                }`}>
                  Équilibre
                </div>
                <div className={`text-xl font-bold flex items-center ${
                  isBalanced() ? 'text-green-900' : 'text-red-900'
                }`}>
                  {isBalanced() ? (
                    <>
                      <Calculator className="h-5 w-5 mr-2" />
                      Équilibrée
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      Différence: {Math.abs(getTotalDebit() - getTotalCredit()).toLocaleString()} $
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => {
              setFormData({
                entry_date: new Date().toISOString().split('T')[0],
                description: '',
                reference: ''
              });
              setLines([
                { account_id: '', description: '', debit_amount: 0, credit_amount: 0 },
                { account_id: '', description: '', debit_amount: 0, credit_amount: 0 }
              ]);
              setError(null);
            }}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Réinitialiser
          </button>
          <button
            type="submit"
            disabled={loading || !isBalanced()}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>Enregistrer l'écriture</span>
          </button>
        </div>
      </form>
    </div>
  );
}