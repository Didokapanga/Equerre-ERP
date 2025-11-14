import React, { useState } from 'react';
import { Settings, Shield, Building, MapPin } from 'lucide-react';
import { ProfilesManagement } from './ProfilesManagement';
import { ActivitiesManagement } from './ActivitiesManagement';
import { CompanyManagement } from './CompanyManagement';
import { UsersManagement } from './UsersManagement';
import { BsPerson } from 'react-icons/bs';

export function SettingsModule() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const sections = [
    {
      id: 'profiles',
      title: 'Profils & Rôles',
      description: 'Configurer les rôles et permissions',
      icon: Shield,
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
      hoverColor: 'hover:bg-green-50'
    },
    {
      id: 'activities',
      title: 'Activités',
      description: 'Gérer les succursales et services',
      icon: MapPin,
      color: 'purple',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
      hoverColor: 'hover:bg-purple-50'
    },
    {
      id: 'users',
      title: 'Utilisateurs',
      description: 'Gérer les utilisateurs',
      icon: BsPerson,
      color: 'yellow',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-600',
      hoverColor: 'hover:bg-yellow-50'
    },
    {
      id: 'company',
      title: 'Entreprise',
      description: 'Informations et paramètres de l\'entreprise',
      icon: Building,
      color: 'orange',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-600',
      hoverColor: 'hover:bg-orange-50'
    }
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'profiles':
        return <ProfilesManagement onBack={() => setActiveSection(null)} />;
      case 'activities':
        return <ActivitiesManagement onBack={() => setActiveSection(null)} />;
      case 'users':
        return <UsersManagement onBack={() => setActiveSection(null)} />;
      case 'company':
        return <CompanyManagement onBack={() => setActiveSection(null)} />;
      default:
        return null;
    }
  };

  if (activeSection) {
    return renderSection();
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-gray-100 rounded-xl">
          <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-gray-600" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Gérez votre entreprise, utilisateurs et permissions
          </p>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 cursor-pointer transition-all duration-200 ${section.hoverColor} hover:shadow-md hover:scale-105 group`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${section.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${section.textColor}`} />
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                </div>
              </div>

              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                {section.title}
              </h3>

              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                {section.description}
              </p>

              <div className="mt-4 flex items-center text-sm font-medium text-gray-400 group-hover:text-gray-600 transition-colors">
                <span>Configurer</span>
                <svg className="ml-1 w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      {/* Examples */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Des codes comptables utiles</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600">
          <div>
            <strong>Actif:</strong>
            <ul className="mt-1 space-y-1">
              <li>• 571000 - Caisse</li>
              <li>• 512000 - Banque</li>
              <li>• 411000 - Clients</li>
              <li>• 213000 - Matériel</li>
              <li>• 215000 - Mobilier et équipements</li>
              <li>• 275000 - Dépôts et cautionnements versés</li>
              <li>• 486000 - Charges constatées d'avance</li>
            </ul>
          </div>
          <div>
            <strong>Passif:</strong>
            <ul className="mt-1 space-y-1">
              <li>• 401000 - Fournisseurs</li>
              <li>• 164000 - Emprunts</li>
              <li>• 101000 - Capital</li>
              <li>• 428000 - Personnel - Rémunérations dues</li>
              <li>• 512100 - Découverts bancaires</li>
              <li>• 445700 - TVA collectée</li>
              <li>• 487000 - Produits constatés d'avance</li>
            </ul>
          </div>
          <div>
            <strong>Produits:</strong>
            <ul className="mt-1 space-y-1">
              <li>• 700000 - Ventes de marchandises</li>
              <li>• 706000 - Prestations de services</li>
              <li>• 707000 - Ventes de produits finis</li>
              <li>• 758000 - Produits divers de gestion courante</li>
              <li>• 775000 - Produits financiers</li>
            </ul>
          </div>
          <div>
            <strong>Charges:</strong>
            <ul className="mt-1 space-y-1">
              <li>• 601000 - Achats de marchandises</li>
              <li>• 613100 - Électricité</li>
              <li>• 606100 - Achats d’eau</li>
              <li>• 615000 - Transport</li>
              <li>• 606300 - Fournitures de bureau</li>
              <li>• 641000 - Salaires</li>
              <li>• 645000 - Charges sociales</li>
              <li>• 626000 - Frais postaux et télécom</li>
              <li>• 627000 - Services bancaires</li>
              <li>• 681100 - Dotation aux amortissements</li>
            </ul>
          </div>
        </div>
      </div>


      {/* Quick Stats */}
      {/* <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 border border-blue-100">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Aperçu rapide</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-green-600">5</div>
            <div className="text-xs sm:text-sm text-gray-600">Rôles configurés</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-purple-600">3</div>
            <div className="text-xs sm:text-sm text-gray-600">Activités</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-orange-600">1</div>
            <div className="text-xs sm:text-sm text-gray-600">Entreprise</div>
          </div>
        </div>
      </div>
 */}
      {/* Recent Activity */}
      {/* <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Activité récente</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-gray-900 truncate">Nouvel utilisateur ajouté: Marie Dubois</p>
              <p className="text-xs text-gray-500">Il y a 2 heures</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-gray-900 truncate">Permissions mises à jour pour le rôle Comptable</p>
              <p className="text-xs text-gray-500">Hier</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-gray-900 truncate">Nouvelle activité créée: Succursale Nord</p>
              <p className="text-xs text-gray-500">Il y a 3 jours</p>
            </div>
          </div>
        </div>
      </div> */}
    </div>
  );
}