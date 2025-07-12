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
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // const handlePrint = () => {
  //   // Open new window for printing
  //   // const printWindow = window.open('', '_blank', 'width=300,height=600');

  //   // if (!printWindow) {
  //   //   alert('Veuillez autoriser les pop-ups pour imprimer le ticket');
  //   //   return;
  //   // }

  //   // const receiptContent = generateReceiptHTML();

  //   // printWindow.document.write(receiptContent);
  //   printWindow.document.close();

  //   // Wait for content to load then print
  //   printWindow.onload = () => {
  //     // printWindow.print();
  //     printWindow.close();
  //   };
  // };

  const generateReceiptHTML = () => {
    const currentDate = new Date().toLocaleString('fr-FR');
    const saleDate = new Date(sale.sale_date).toLocaleDateString('fr-FR');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Ticket de caisse - ${sale.sale_number}</title>
        <style>
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
            }
          }
          
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.2;
            margin: 0;
            padding: 8px;
            width: 72mm;
            background: white;
            color: black;
          }
          
          .header {
            text-align: center;
            border-bottom: 1px dashed #000;
            padding-bottom: 8px;
            margin-bottom: 8px;
          }
          
          .company-name {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 4px;
          }
          
          .company-info {
            font-size: 10px;
            line-height: 1.1;
          }
          
          .sale-info {
            margin: 8px 0;
            font-size: 11px;
          }
          
          .items {
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            padding: 8px 0;
            margin: 8px 0;
          }
          
          .item {
            margin-bottom: 4px;
          }
          
          .item-name {
            font-weight: bold;
          }
          
          .item-details {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
          }
          
          .totals {
            margin-top: 8px;
          }
          
          .total-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
          }
          
          .total-final {
            font-weight: bold;
            font-size: 14px;
            border-top: 1px dashed #000;
            padding-top: 4px;
            margin-top: 4px;
          }
          
          .footer {
            text-align: center;
            margin-top: 12px;
            font-size: 10px;
            border-top: 1px dashed #000;
            padding-top: 8px;
          }
          
          .activity-info {
            margin-top: 8px;
            padding-top: 6px;
            border-top: 1px dashed #000;
            font-size: 9px;
            text-align: center;
          }
          
          .center {
            text-align: center;
          }
          
          .right {
            text-align: right;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">${companyInfo.name}</div>
          ${companyInfo.address ? `<div class="company-info">${companyInfo.address}</div>` : ''}
          ${companyInfo.phone ? `<div class="company-info">Tél: ${companyInfo.phone}</div>` : ''}
          ${companyInfo.email ? `<div class="company-info">${companyInfo.email}</div>` : ''}
          ${companyInfo.tax_number ? `<div class="company-info">N° Fiscal: ${companyInfo.tax_number}</div>` : ''}
        </div>
        
        <div class="sale-info">
          <div><strong>Ticket N°:</strong> ${sale.sale_number}</div>
          <div><strong>Date:</strong> ${saleDate}</div>
          <div><strong>Heure:</strong> ${currentDate.split(' ')[1]}</div>
          ${sale.customer ? `<div><strong>Client:</strong> ${sale.customer.name}</div>` : '<div><strong>Client:</strong> Anonyme</div>'}
        </div>
        
        <div class="items">
          ${sale.sale_items?.map(item => `
            <div class="item">
              <div class="item-name">${item.product?.name || 'Produit'}</div>
              <div class="item-details">
                <span>${item.quantity} x ${item.unit_price.toFixed(2)}$</span>
                <span>${item.total_price.toFixed(2)}$</span>
              </div>
            </div>
          `).join('') || ''}
        </div>
        
        <div class="totals">
          <div class="total-line">
            <span>Sous-total:</span>
            <span>${sale.total_amount.toFixed(2)}$</span>
          </div>
          <div class="total-line">
            <span>TVA (0%):</span>
            <span>0.00€</span>
          </div>
          <div class="total-line total-final">
            <span>TOTAL:</span>
            <span>${sale.total_amount.toFixed(2)}$</span>
          </div>
        </div>
        
        <div class="footer">
          <div>Merci de votre visite !</div>
          <div>À bientôt</div>
          
          ${activity ? `
            <div class="activity-info">
              <div><strong>Point de vente:</strong> ${activity.name || 'Non spécifié'}</div>
              ${activity.address ? `<div>${activity.address}</div>` : ''}
              ${activity.phone ? `<div>Tél: ${activity.phone}</div>` : ''}
            </div>
          ` : ''}
          
          <div style="font-size: 9px; margin-top: 8px;">
            Imprimé le ${currentDate}
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const generateRawText = () => {
    const currentDate = new Date().toLocaleString('fr-FR');
    const saleDate = new Date(sale.sale_date).toLocaleDateString('fr-FR');

    const lineWidth = 32; // Max chars per line (RawBT supporte 32 à 42 souvent)

    const padRight = (text = '', width = lineWidth) => text.padEnd(width);
    const padLeft = (text = '', width = lineWidth) => text.padStart(width);
    const center = (text = '') =>
      text.padStart((lineWidth + text.length) / 2).padEnd(lineWidth);

    let text = '';
    text += center(companyInfo.name) + '\n';
    if (companyInfo.address) text += center(companyInfo.address) + '\n';
    if (companyInfo.phone) text += center(`Phone: ${companyInfo.phone}`) + '\n';
    text += '-'.repeat(lineWidth) + '\n';

    text += `Ticket N°: ${sale.sale_number}\n`;
    text += `Date: ${saleDate} - ${currentDate.split(' ')[1]}\n`;
    text += `Client: ${sale.customer?.name || 'Anonyme'}\n`;

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
      if (activity.name) text += center(activity.name) + '\n';
      if (activity.address) text += center(activity.address) + '\n';
      if (activity.phone) text += center(`Tél: ${activity.phone}`) + '\n';
    }

    text += '\n'.repeat(4); // important pour forcer le feed papier
    return text;
  };

  const handleRawPrint = () => {
    const rawText = generateRawText();

    // On ajoute "\uFEFF" (BOM UTF-8) pour forcer l'encodage correct
    const encoded = encodeURIComponent('\uFEFF' + rawText);

    // RawBT: méthode pour imprimer du texte brut encodé
    // window.location.href = `rawbt://print?text=${encoded}&encoding=utf8`;
    window.location.href = `rawbt://print?text=${encoded}&encoding=utf8`;
  };

  // const handleRawPrint = () => {
  //   const rawText = generateRawText();
  //   window.location.href = 'rawbt://' + encodeURIComponent(rawText);
  // };

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

            {/* <button
              onClick={handlePrint}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2 transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>HTML</span>
            </button> */}

            <button
              onClick={handleRawPrint}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Thermique</span>
            </button>
          </div>
          {/* Actions
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Fermer
            </button>
            <button
              onClick={handlePrint}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimer</span>
            </button>
          </div> */}
        </div>
      </div>
    </div>
  );
}