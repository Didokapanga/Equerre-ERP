import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { AuthForm } from './components/Auth/AuthForm';
import { Layout } from './components/Layout/Layout';
import { Dashboard } from './components/Dashboard/Dashboard';
import { SalesModule } from './components/Sales/SalesModule';
import { ProductsModule } from './components/Products/ProductsModule';
import { PurchasesModule } from './components/Purchases/PurchasesModule';
import { StockModule } from './components/Stock/StockModule';
import { SettingsModule } from './components/Settings/SettingsModule';
import { CustomersModule } from './components/Customers/CustomersModule';
import { ExpensesModule } from './components/Expenses/ExpensesModule';
import { AccountingModule } from './components/Accounting/AccountingModule';
import { AlertTriangle, Clock } from 'lucide-react';

function App() {
  const { user, profile, loading, isReady, isCompanyActive, logout } = useAuth();
  const [currentModule, setCurrentModule] = useState('dashboard');
  const [profileCheckTimeout, setProfileCheckTimeout] = useState(false);

  console.log('🎯 État App:', { 
    user: user?.id, 
    profile: profile?.id, 
    loading,
    isReady,
    hasUser: !!user,
    hasProfile: !!profile,
    isCompanyActive,
    profileCheckTimeout
  });

  // Timeout pour éviter le chargement infini si le profil n'est pas trouvé
  useEffect(() => {
    if (user && isReady && !profile && !loading) {
      console.log('⏰ Démarrage du timeout pour profil manquant');
      const timer = setTimeout(() => {
        console.log('🚨 Timeout atteint - Profil non trouvé, déconnexion automatique');
        setProfileCheckTimeout(true);
        logout();
      }, 5000); // 5 secondes de timeout

      return () => {
        console.log('🧹 Nettoyage du timeout');
        clearTimeout(timer);
      };
    }
  }, [user, isReady, profile, loading, logout]);

  // Écran de chargement initial
  if (!isReady || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Chargement...</h2>
          <p className="text-gray-500">
            {!isReady ? 'Initialisation de la session...' : 'Vérification de votre profil...'}
          </p>
          <div className="mt-4 text-xs text-gray-400 space-y-1">
            <div>Utilisateur: {user ? '✅ Connecté' : '❌ Non connecté'}</div>
            <div>Profil: {profile ? '✅ Chargé' : '⏳ En cours...'}</div>
            <div>Prêt: {isReady ? '✅ Oui' : '⏳ Non'}</div>
          </div>
        </div>
      </div>
    );
  }

  // Si pas d'utilisateur connecté, afficher le formulaire d'authentification
  if (!user) {
    console.log('👻 Aucun utilisateur - Affichage AuthForm');
    return <AuthForm />;
  }

  // Si utilisateur connecté mais pas de profil après timeout, afficher erreur et déconnecter
  if (!profile) {
    console.log('❌ Utilisateur sans profil');
    
    if (profileCheckTimeout) {
      // Afficher un message d'erreur temporaire avant redirection
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-red-800 mb-2">Session expirée</h2>
            <p className="text-red-700 mb-4">
              Votre profil n'a pas pu être chargé. Vous allez être redirigé vers la page de connexion.
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-red-800 mb-2">Profil non trouvé</h2>
          <p className="text-red-700 mb-4">
            Votre compte existe mais aucun profil n'a été trouvé. Vérification en cours...
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-yellow-800 text-sm">
              Si ce problème persiste, vous serez automatiquement déconnecté dans quelques secondes.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors mb-2"
          >
            Réessayer
          </button>
          <button
            onClick={logout}
            className="w-full border border-red-300 text-red-700 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  // Si l'entreprise n'est pas active, afficher un message d'attente d'activation
  if (!isCompanyActive) {
    console.log('⏳ Entreprise non activée');
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
          <div className="bg-yellow-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Compte en attente d'activation</h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-yellow-700 text-sm">
                Votre compte a été créé avec succès, mais il doit être activé par notre équipe avant que vous puissiez accéder à l'application.
              </p>
            </div>
          </div>
          <div className="space-y-4 text-left">
            <div>
              <p className="text-sm text-gray-600 font-medium">Entreprise:</p>
              <p className="text-gray-800">{profile.company?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Utilisateur:</p>
              <p className="text-gray-800">{profile.first_name} {profile.last_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Email:</p>
              <p className="text-gray-800">{user.email}</p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <p className="text-sm text-gray-500">
              Vous recevrez un email dès que votre compte sera activé.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Rafraîchir
            </button>
            <button
              onClick={logout}
              className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  console.log('✅ Utilisateur et profil OK - Affichage Dashboard');

  const renderModule = () => {
    switch (currentModule) {
      case 'dashboard':
        return <Dashboard />;
      case 'sales':
        return <SalesModule />;
      case 'purchases':
        return <PurchasesModule />;
      case 'stock':
        return <StockModule />;
      case 'products':
        return <ProductsModule />;
      case 'crm':
        return <CustomersModule />;
      case 'accounting':
        return <AccountingModule />;
      case 'expenses':
        return <ExpensesModule />;
      case 'settings':
        return <SettingsModule />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Router>
      <Layout currentModule={currentModule} onModuleChange={setCurrentModule}>
        {renderModule()}
      </Layout>
    </Router>
  );
}

export default App;