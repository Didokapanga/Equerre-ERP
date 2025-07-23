import React from 'react';
import { X, Calculator, Calendar, FileText, User } from 'lucide-react';

interface JournalEntry {
  id: string;
  entry_number: string;
  entry_date: string;
  description: string;
  reference?: string;
  total_debit: number;
  total_credit: number;
  created_at: string;
  journal_entry_lines?: JournalEntryLine[];
}

interface JournalEntryLine {
  id: string;
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

interface JournalEntryDetailProps {
  entry: JournalEntry;
  onClose: () => void;
}

export function JournalEntryDetail({ entry, onClose }: JournalEntryDetailProps) {
  const isBalanced = entry.total_debit === entry.total_credit;

  const getAccountTypeColor = (type: string) => {
    const colors = {
      actif: 'text-blue-600',
      passif: 'text-red-600',
      produit: 'text-green-600',
      charge: 'text-orange-600'
    };
    return colors[type as keyof typeof colors] || 'text-gray-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Calculator className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Écriture {entry.entry_number}
                </h2>
                <p className="text-gray-500">Détails de l'écriture comptable</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Entry Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Informations générales
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Numéro:</span>
                  <span className="font-mono font-medium">{entry.entry_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">
                    {new Date(entry.entry_date).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Référence:</span>
                  <span className="font-medium">{entry.reference || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Créée le:</span>
                  <span className="font-medium">
                    {new Date(entry.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                Montants
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total débit:</span>
                  <span className="font-bold text-gray-900">
                    {entry.total_debit.toLocaleString()} CDF
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total crédit:</span>
                  <span className="font-bold text-gray-900">
                    {entry.total_credit.toLocaleString()} CDF
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Différence:</span>
                  <span className={`font-bold ${isBalanced ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {Math.abs(entry.total_debit - entry.total_credit).toLocaleString()} CDF
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Statut:</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${isBalanced
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                    }`}>
                    {isBalanced ? 'Équilibrée' : 'Déséquilibrée'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700">{entry.description}</p>
          </div>

          {/* Journal Entry Lines */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Lignes d'écriture</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Compte
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Débit
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Crédit
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {entry.journal_entry_lines?.map((line, index) => (
                    <tr key={line.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <div className="text-sm font-mono font-medium text-gray-900">
                            {line.account?.code}
                          </div>
                          <div className="text-sm text-gray-600">
                            {line.account?.name}
                          </div>
                          <div className={`text-xs font-medium ${getAccountTypeColor(line.account?.account_type || '')}`}>
                            {line.account?.account_type}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">
                          {line.description || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {line.debit_amount > 0 ? `${line.debit_amount.toLocaleString()} CDF` : '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {line.credit_amount > 0 ? `${line.credit_amount.toLocaleString()} CDF` : '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 text-right font-medium text-gray-900">
                      Totaux:
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      {entry.total_debit.toLocaleString()} CDF
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      {entry.total_credit.toLocaleString()} CDF
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-6 border-t border-gray-200 mt-6">
            <button
              onClick={onClose}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}