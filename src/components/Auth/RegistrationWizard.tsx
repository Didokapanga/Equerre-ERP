import React, { useState } from 'react';
import { Building2, User, MapPin, Phone, Mail, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface RegistrationData {
  // Étape 1: Authentification
  email: string;
  password: string;
  confirmPassword: string;
  
  // Étape 2: Entreprise
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  taxNumber: string;
  
  // Étape 3: Activité
  activityName: string;
  activityAddress: string;
  activityPhone: string;
  managerName: string;
  
  // Étape 4: Profil
  firstName: string;
  lastName: string;
  userPhone: string;
  role: string;
}

interface RegistrationWizardProps {
  onCancel: () => void;
}

export function RegistrationWizard({ onCancel }: RegistrationWizardProps) {
  const { signUp } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  
  const [formData, setFormData] = useState<RegistrationData>({
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    taxNumber: '',
    activityName: 'Siège social',
    activityAddress: '',
    activityPhone: '',
    managerName: '',
    firstName: '',
    lastName: '',
    userPhone: '',
    role: 'proprietaire'
  });

  const updateFormData = (field: keyof RegistrationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.email || !formData.password || !formData.confirmPassword) {
          setError('Tous les champs sont obligatoires');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Les mots de passe ne correspondent pas');
          return false;
        }
        if (formData.password.length < 6) {
          setError('Le mot de passe doit contenir au moins 6 caractères');
          return false;
        }
        break;
      case 2:
        if (!formData.companyName) {
          setError('Le nom de l\'entreprise est obligatoire');
          return false;
        }
        break;
      case 3:
        if (!formData.activityName || !formData.managerName) {
          setError('Le nom de l\'activité et le responsable sont obligatoires');
          return false;
        }
        break;
      case 4:
        if (!formData.firstName || !formData.lastName) {
          setError('Le prénom et le nom sont obligatoires');
          return false;
        }
        break;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
    setError('');
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    
    setLoading(true);
    setError('');

    try {
      console.log('🚀 Début de l\'inscription avec les données:', {
        email: formData.email,
        companyName: formData.companyName,
        activityName: formData.activityName,
        firstName: formData.firstName,
        lastName: formData.lastName
      });

      // Créer le compte utilisateur et toutes les données associées
      const { error } = await signUp({
        email: formData.email,
        password: formData.password,
        companyData: {
          name: formData.companyName,
          address: formData.companyAddress,
          phone: formData.companyPhone,
          email: formData.companyEmail,
          tax_number: formData.taxNumber,
          is_active: false // IMPORTANT: L'entreprise est créée comme inactive
        },
        activityData: {
          name: formData.activityName,
          address: formData.activityAddress || formData.companyAddress,
          phone: formData.activityPhone || formData.companyPhone,
          manager_name: formData.managerName
        },
        profileData: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.userPhone,
          role: formData.role
        }
      });

      if (error) {
        console.error('❌ Erreur lors de l\'inscription:', error);
        setError(error.message || 'Erreur lors de l\'inscription');
      } else {
        console.log('✅ Inscription réussie !');
        setRegistrationComplete(true);
      }
    } catch (err: any) {
      console.error('💥 Exception lors de l\'inscription:', err);
      setError('Une erreur est survenue lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  // Écran de confirmation après inscription réussie
  if (registrationComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-green-100 rounded-full">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Inscription réussie !</h1>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <h3 className="text-sm font-medium text-yellow-800 mb-1">
                  Compte en attente d'activation
                </h3>
                <p className="text-sm text-yellow-700">
                  Votre compte a été créé avec succès, mais il doit être activé par notre équipe avant que vous puissiez accéder à l'application.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 text-sm text-gray-600">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Prochaines étapes :</h4>
              <ul className="space-y-2 text-left">
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 font-bold">1.</span>
                  <span>Notre équipe va examiner votre demande</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 font-bold">2.</span>
                  <span>Vous recevrez un email de confirmation une fois votre compte activé</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 font-bold">3.</span>
                  <span>Vous pourrez alors vous connecter et utiliser l'application</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <p className="text-sm text-gray-500">
              <strong>Entreprise :</strong> {formData.companyName}
            </p>
            <p className="text-sm text-gray-500">
              <strong>Email :</strong> {formData.email}
            </p>
          </div>

          <button
            onClick={onCancel}
            className="mt-6 w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  const steps = [
    { number: 1, title: 'Compte', icon: User },
    { number: 2, title: 'Entreprise', icon: Building2 },
    { number: 3, title: 'Activité', icon: MapPin },
    { number: 4, title: 'Profil', icon: CheckCircle }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-2xl">
        {/* Header avec progression */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Building2 className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Créer votre compte</h1>
          <p className="text-gray-600">Configurez votre entreprise en quelques étapes</p>
        </div>

        {/* Indicateur de progression */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;
            
            return (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  isCompleted 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : isActive 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'border-gray-300 text-gray-400'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <div className="ml-2 hidden sm:block">
                  <p className={`text-sm font-medium ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-4 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Contenu des étapes */}
        <div className="space-y-6">
          {/* Étape 1: Authentification */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de connexion</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="votre@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => updateFormData('password', e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le mot de passe *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Étape 2: Entreprise */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de l'entreprise</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'entreprise *
                </label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => updateFormData('companyName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ma Société SARL"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse
                </label>
                <textarea
                  value={formData.companyAddress}
                  onChange={(e) => updateFormData('companyAddress', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="123 Rue de l'Entreprise, 75001 Paris"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="tel"
                      value={formData.companyPhone}
                      onChange={(e) => updateFormData('companyPhone', e.target.value)}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+33 1 23 45 67 89"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email entreprise
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="email"
                      value={formData.companyEmail}
                      onChange={(e) => updateFormData('companyEmail', e.target.value)}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="contact@masociete.com"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro fiscal
                </label>
                <input
                  type="text"
                  value={formData.taxNumber}
                  onChange={(e) => updateFormData('taxNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="FR12345678901"
                />
              </div>
            </div>
          )}

          {/* Étape 3: Activité */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Activité principale</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'activité *
                </label>
                <input
                  type="text"
                  required
                  value={formData.activityName}
                  onChange={(e) => updateFormData('activityName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Siège social, Magasin principal..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Responsable de l'activité *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    required
                    value={formData.managerName}
                    onChange={(e) => updateFormData('managerName', e.target.value)}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nom du responsable"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse de l'activité
                </label>
                <textarea
                  value={formData.activityAddress}
                  onChange={(e) => updateFormData('activityAddress', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Laisser vide pour utiliser l'adresse de l'entreprise"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone de l'activité
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="tel"
                    value={formData.activityPhone}
                    onChange={(e) => updateFormData('activityPhone', e.target.value)}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Laisser vide pour utiliser le téléphone de l'entreprise"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Étape 4: Profil */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Votre profil</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => updateFormData('firstName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Votre prénom"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => updateFormData('lastName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Votre nom"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone personnel
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="tel"
                    value={formData.userPhone}
                    onChange={(e) => updateFormData('userPhone', e.target.value)}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rôle dans l'entreprise
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => updateFormData('role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="proprietaire">Propriétaire</option>
                  <option value="admin">Administrateur</option>
                  <option value="vendeur">Vendeur</option>
                  <option value="comptable">Comptable</option>
                  <option value="gestionnaire_stock">Gestionnaire Stock</option>
                </select>
              </div>

              {/* Récapitulatif */}
              <div className="bg-blue-50 p-4 rounded-lg mt-6">
                <h4 className="font-medium text-blue-900 mb-2">Récapitulatif</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><strong>Entreprise:</strong> {formData.companyName}</p>
                  <p><strong>Activité:</strong> {formData.activityName}</p>
                  <p><strong>Responsable:</strong> {formData.firstName} {formData.lastName}</p>
                  <p><strong>Email:</strong> {formData.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Messages d'erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Boutons de navigation */}
          <div className="flex justify-between pt-6">
            <div>
              {currentStep > 1 ? (
                <button
                  onClick={prevStep}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Précédent</span>
                </button>
              ) : (
                <button
                  onClick={onCancel}
                  disabled={loading}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
              )}
            </div>

            <div>
              {currentStep < 4 ? (
                <button
                  onClick={nextStep}
                  disabled={loading}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <span>Suivant</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center space-x-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Création en cours...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Créer mon compte</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}