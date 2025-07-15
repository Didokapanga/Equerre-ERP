// import React, { useEffect } from 'react';
import { useEffect } from 'react';
import { X, Printer } from 'lucide-react';
import { Sale } from '../../lib/supabase';
// import { Sale, Customer } from '../../lib/supabase';

interface CompanyInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  tax_number?: string;
}

interface ActivityInfo {
  name?: string;
  address?: string;
  phone?: string;
}

interface ThermalReceiptProps {
  sale: Sale;
  companyInfo: CompanyInfo;
  activity?: ActivityInfo;
  onClose: () => void;
}

export function ThermalReceipt({ sale, companyInfo, activity, onClose }: ThermalReceiptProps) {
  useEffect(() => {
    // Auto-print when component mounts
    const timer = setTimeout(() => {
      // handlePrint();
      handleRawPrint(); // Appelle automatiquement l’impression thermique
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const generateRawText = () => {
    const currentDate = new Date().toLocaleString('fr-FR');
    const saleDate = new Date(sale.sale_date).toLocaleDateString('fr-FR');

    const lineWidth = 32; // Max chars per line (RawBT supporte 32 à 42 souvent)

    const padRight = (text = '', width = lineWidth) => text.padEnd(width);
    const padLeft = (text = '', width = lineWidth) => text.padStart(width);
    const center = (text = '') =>
      text.padStart((lineWidth + text.length) / 2).padEnd(lineWidth);

    // let text = '';
    let text = '\n'; // Ligne vide pour éviter l'écrasement
    text += center(companyInfo.name || 'ENTREPRISE') + '\n';

    // text += center(companyInfo.name) + '\n';
    if (companyInfo.address) text += center(companyInfo.address) + '\n';
    if (companyInfo.phone) text += center(`Tél: ${companyInfo.phone}`) + '\n';
    text += '-'.repeat(lineWidth) + '\n';

    text += `Ticket N° : ${sale.sale_number}\n`;
    text += `Date : ${saleDate} - ${currentDate.split(' ')[1]}\n`;
    text += `Client : ${sale.customer?.name || 'Anonyme'}\n`;

    text += '-'.repeat(lineWidth) + '\n';
    sale.sale_items?.forEach(item => {
      const name = item.product?.name || 'Produit';
      const qty = `${item.quantity} x ${item.unit_price.toFixed(2)}`;
      const total = item.total_price.toFixed(2);
      text += `${name}\n`;
      text += `${padRight(qty, 16)}${padLeft(total + '$', 16)}\n`;
    });

    text += '-'.repeat(lineWidth) + '\n';
    text += `${padRight('TOTAL:', 16)}${padLeft(sale.total_amount.toFixed(2) + '$', 16)}\n`;

    text += '-'.repeat(lineWidth) + '\n';
    text += center('Merci de votre visite !') + '\n';

    if (activity) {
      text += '\n';
      text += center('--- Point de vente ---') + '\n';
      text += center(activity.name || 'Nom non précisé') + '\n';
      text += center(activity.address || '') + '\n';
      text += center(activity.phone ? `Tél: ${activity.phone}` : '') + '\n';
    }
    // if (activity) {
    //   text += '\n';
    //   text += center('--- Point de vente ---') + '\n';
    //   if (activity.name) text += center(activity.name) + '\n';
    //   if (activity.address) text += center(activity.address) + '\n';
    //   if (activity.phone) text += center(`Tél: ${activity.phone}`) + '\n';
    // }

    text += '\n'.repeat(4); // important pour forcer le feed papier
    return text;
  };

  const handleRawPrint = () => {
    const rawText = '\uFEFF' + generateRawText(); // Ajoute BOM UTF-8 pour les caractères spéciaux
    const encoded = encodeURIComponent(rawText);  // Encodage URL
    setTimeout(() => {
      window.location.href = `rawbt://print?text=${encoded}`;
    }, 100); // petit délai pour éviter que le navigateur l'affiche comme texte
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Printer className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Impression du ticket</h2>
                <p className="text-gray-500">Vente {sale.sale_number}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="bg-white p-4 rounded border-2 border-dashed border-gray-300 font-mono text-xs">
              <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
                <div className="font-bold text-sm">{companyInfo.name}</div>
                {companyInfo.address && <div>{companyInfo.address}</div>}
                {companyInfo.phone && <div>Tél: {companyInfo.phone}</div>}
              </div>

              <div className="mb-2">
                <div><strong>Ticket:</strong> {sale.sale_number}</div>
                <div><strong>Date:</strong> {new Date(sale.sale_date).toLocaleDateString('fr-FR')}</div>
                <div><strong>Client:</strong> {sale.customer?.name || 'Anonyme'}</div>
              </div>

              <div className="border-t border-b border-dashed border-gray-400 py-2 my-2">
                {sale.sale_items?.map((item, index) => (
                  <div key={index} className="mb-1">
                    <div className="font-bold">{item.product?.name}</div>
                    <div className="flex justify-between">
                      <span>{item.quantity} x {item.unit_price.toFixed(2)}$</span>
                      <span>{item.total_price.toFixed(2)}$</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-right">
                <div className="font-bold text-sm border-t border-dashed border-gray-400 pt-1">
                  TOTAL: {sale.total_amount.toFixed(2)}$
                </div>
              </div>

              <div className="text-center mt-2 pt-2 border-t border-dashed border-gray-400">
                <div>Merci de votre visite !</div>

                {/* Aperçu des informations de l'activité */}
                {activity && (
                  <div className="mt-2 pt-2 border-t border-dashed border-gray-400 text-xs">
                    <div><strong>Point de vente:</strong> {activity.name || 'Non spécifié'}</div>
                    {activity.address && <div>{activity.address}</div>}
                    {activity.phone && <div>Tél: {activity.phone}</div>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Fermer
            </button>

            <button
              onClick={handleRawPrint}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Thermique</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}