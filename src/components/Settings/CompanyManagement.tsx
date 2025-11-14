import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Building, Mail, Phone, MapPin, CreditCard, Upload, Camera } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase, Company } from '../../lib/supabase';

interface CompanyManagementProps {
  onBack: () => void;
}

export function CompanyManagement({ onBack }: CompanyManagementProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    tax_number: ''
  });

  useEffect(() => {
    if (profile?.company) {
      setCompany(profile.company);
      setFormData({
        name: profile.company.name || '',
        address: profile.company.address || '',
        phone: profile.company.phone || '',
        email: profile.company.email || '',
        tax_number: profile.company.tax_number || ''
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const companyId = profile?.company_id;
      console.log("DEBUG: tenter update company id =", companyId);
      if (!companyId) {
        alert("ID de l'entreprise absent dans le profil (profile.company_id undefined).");
        return;
      }

      // 1) Vérifier d'abord qu'une ligne existe
      const { data: found, error: errFind } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId);

      console.log("DEBUG: résultat recherche company :", { found, errFind });

      if (errFind) {
        console.error("Erreur lors de la recherche company:", errFind);
        alert("Erreur lors de la vérification de l'entreprise : " + errFind.message);
        return;
      }

      if (!found || found.length === 0) {
        alert("⚠️ Aucune ligne trouvée avec cet id dans la table companies. L'entreprise n'existe pas.");
        return;
      }

      // 2) Maintenant faire l'update
      const { data, error } = await supabase
        .from("companies")
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq("id", companyId)
        .select();

      console.log("DEBUG: résultat update :", { data, error });

      if (error) {
        // Cas RLS/permission ou autre
        throw error;
      }

      if (!data || data.length === 0) {
        alert("⚠️ Aucune ligne mise à jour. L'entreprise n'existe pas (après update).");
        return;
      }

      // Met à jour l'état local pour refléter la DB
      setCompany(data[0]);
      setFormData({
        name: data[0].name || '',
        address: data[0].address || '',
        phone: data[0].phone || '',
        email: data[0].email || '',
        tax_number: data[0].tax_number || ''
      });

      alert("Informations mises à jour avec succès !");
    } catch (error: any) {
      console.error("Error updating company:", error);
      // Cas fréquent : RLS -> "permission denied for relation companies" ou message similaire
      alert("Erreur lors de la mise à jour: " + (error.message || JSON.stringify(error)));
    } finally {
      setLoading(false);
    }
  };

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setLoading(true);

  //   try {
  //     const { data, error } = await supabase
  //       .from("companies")
  //       .update(formData)
  //       .eq("id", profile?.company_id)   // <-- très important
  //       .select();                       // pas single()

  //     if (error) throw error;

  //     console.log("Update result:", data);

  //     if (!data || data.length === 0) {
  //       alert("⚠️ Aucune ligne mise à jour. L'entreprise n'existe pas.");
  //       return;
  //     }

  //     alert("Informations mises à jour avec succès !");
  //   } catch (error: any) {
  //     console.error("Error updating company:", error);
  //     alert("Erreur lors de la mise à jour: " + error.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setLoading(true);

  //   try {
  //     const { error } = await supabase
  //       .from('companies')
  //       .update(formData)
  //       .eq("id", profile?.company?.id)
  //       // .eq('id', profile?.company_id);

  //     if (error) throw error;

  //     alert('Informations de l\'entreprise mises à jour avec succès');
  //   } catch (error: any) {
  //     console.error('Error updating company:', error);
  //     alert('Erreur lors de la mise à jour: ' + error.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex items-center space-x-3">
            <Building className="h-8 w-8 text-orange-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Paramètres de l'entreprise</h1>
              <p className="text-gray-500">Gérez les informations de votre entreprise</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Logo */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Logo de l'entreprise</h3>

            <div className="text-center">
              <div className="mx-auto h-32 w-32 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <Building className="h-16 w-16 text-gray-400" />
              </div>

              <div className="space-y-2">
                <button className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center justify-center space-x-2 transition-colors">
                  <Upload className="h-4 w-4" />
                  <span>Télécharger un logo</span>
                </button>

                <button className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-center space-x-2 transition-colors">
                  <Camera className="h-4 w-4" />
                  <span>Prendre une photo</span>
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-2">
                Formats acceptés: JPG, PNG, SVG<br />
                Taille recommandée: 200x200px
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Statistiques</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Utilisateurs:</span>
                <span className="font-medium">12</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Activités:</span>
                <span className="font-medium">3</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Produits:</span>
                <span className="font-medium">156</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Clients:</span>
                <span className="font-medium">89</span>
              </div>
            </div>
          </div>
        </div>

        {/* Company Information Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informations générales</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l'entreprise *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Nom de votre entreprise"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Adresse complète de l'entreprise"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Coordonnées</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="+33 1 23 45 67 89"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="contact@entreprise.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Legal Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informations légales</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro fiscal / SIRET
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    value={formData.tax_number}
                    onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Ex: 12345678901234"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onBack}
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
                <span>Sauvegarder</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-yellow-900 mb-2">Note de sécurité</h4>
        <p className="text-sm text-yellow-800">
          Les modifications des informations de l'entreprise sont réservées aux propriétaires et administrateurs.
          Toutes les modifications sont enregistrées et tracées pour des raisons de sécurité.
        </p>
      </div>
    </div>
  );
}