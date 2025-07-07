import React, { useState } from 'react';
import { ArrowLeft, Plus, Shield, Edit, Trash2, Users, Check, X } from 'lucide-react';

interface ProfilesManagementProps {
  onBack: () => void;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  isSystem: boolean;
}

export function ProfilesManagement({ onBack }: ProfilesManagementProps) {
  const [roles, setRoles] = useState<Role[]>([
    {
      id: '1',
      name: 'Propriétaire',
      description: 'Accès complet à toutes les fonctionnalités',
      permissions: ['all'],
      userCount: 1,
      isSystem: true
    },
    {
      id: '2',
      name: 'Administrateur',
      description: 'Gestion complète sauf paramètres entreprise',
      permissions: ['users.read', 'users.write', 'sales.all', 'purchases.all', 'stock.all'],
      userCount: 2,
      isSystem: true
    },
    {
      id: '3',
      name: 'Vendeur',
      description: 'Accès aux ventes et clients',
      permissions: ['sales.read', 'sales.write', 'customers.read', 'customers.write'],
      userCount: 5,
      isSystem: true
    },
    {
      id: '4',
      name: 'Comptable',
      description: 'Accès à la comptabilité et finances',
      permissions: ['accounting.all', 'expenses.all', 'sales.read', 'purchases.read'],
      userCount: 1,
      isSystem: true
    },
    {
      id: '5',
      name: 'Gestionnaire Stock',
      description: 'Gestion des stocks et achats',
      permissions: ['stock.all', 'purchases.all', 'products.all'],
      userCount: 2,
      isSystem: true
    }
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const permissions: Permission[] = [
    // Ventes
    { id: 'sales.read', name: 'Consulter les ventes', description: 'Voir les ventes et rapports', category: 'Ventes' },
    { id: 'sales.write', name: 'Gérer les ventes', description: 'Créer et modifier les ventes', category: 'Ventes' },
    { id: 'sales.delete', name: 'Supprimer les ventes', description: 'Supprimer les ventes', category: 'Ventes' },
    
    // Achats
    { id: 'purchases.read', name: 'Consulter les achats', description: 'Voir les achats et commandes', category: 'Achats' },
    { id: 'purchases.write', name: 'Gérer les achats', description: 'Créer et modifier les achats', category: 'Achats' },
    { id: 'purchases.delete', name: 'Supprimer les achats', description: 'Supprimer les achats', category: 'Achats' },
    
    // Stock
    { id: 'stock.read', name: 'Consulter le stock', description: 'Voir les niveaux de stock', category: 'Stock' },
    { id: 'stock.write', name: 'Gérer le stock', description: 'Ajuster les quantités en stock', category: 'Stock' },
    { id: 'stock.movements', name: 'Mouvements de stock', description: 'Créer des mouvements de stock', category: 'Stock' },
    
    // Produits
    { id: 'products.read', name: 'Consulter les produits', description: 'Voir le catalogue produits', category: 'Produits' },
    { id: 'products.write', name: 'Gérer les produits', description: 'Créer et modifier les produits', category: 'Produits' },
    { id: 'products.delete', name: 'Supprimer les produits', description: 'Supprimer les produits', category: 'Produits' },
    
    // Clients
    { id: 'customers.read', name: 'Consulter les clients', description: 'Voir la liste des clients', category: 'CRM' },
    { id: 'customers.write', name: 'Gérer les clients', description: 'Créer et modifier les clients', category: 'CRM' },
    { id: 'customers.delete', name: 'Supprimer les clients', description: 'Supprimer les clients', category: 'CRM' },
    
    // Comptabilité
    { id: 'accounting.read', name: 'Consulter la comptabilité', description: 'Voir les écritures comptables', category: 'Comptabilité' },
    { id: 'accounting.write', name: 'Gérer la comptabilité', description: 'Créer des écritures comptables', category: 'Comptabilité' },
    
    // Dépenses
    { id: 'expenses.read', name: 'Consulter les dépenses', description: 'Voir les dépenses', category: 'Dépenses' },
    { id: 'expenses.write', name: 'Gérer les dépenses', description: 'Créer et modifier les dépenses', category: 'Dépenses' },
    
    // Utilisateurs
    { id: 'users.read', name: 'Consulter les utilisateurs', description: 'Voir la liste des utilisateurs', category: 'Administration' },
    { id: 'users.write', name: 'Gérer les utilisateurs', description: 'Créer et modifier les utilisateurs', category: 'Administration' },
    { id: 'users.delete', name: 'Supprimer les utilisateurs', description: 'Supprimer les utilisateurs', category: 'Administration' },
    
    // Paramètres
    { id: 'settings.company', name: 'Paramètres entreprise', description: 'Modifier les informations de l\'entreprise', category: 'Administration' },
    { id: 'settings.activities', name: 'Gérer les activités', description: 'Créer et modifier les activités', category: 'Administration' }
  ];

  const getPermissionsByCategory = () => {
    const categories: { [key: string]: Permission[] } = {};
    permissions.forEach(permission => {
      if (!categories[permission.category]) {
        categories[permission.category] = [];
      }
      categories[permission.category].push(permission);
    });
    return categories;
  };

  const handleDelete = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role?.isSystem) {
      alert('Impossible de supprimer un rôle système');
      return;
    }
    if (role?.userCount > 0) {
      alert('Impossible de supprimer un rôle assigné à des utilisateurs');
      return;
    }
    if (confirm('Êtes-vous sûr de vouloir supprimer ce rôle ?')) {
      setRoles(roles.filter(r => r.id !== roleId));
    }
  };

  const getRoleColor = (role: Role) => {
    if (role.name === 'Propriétaire') return 'bg-purple-100 text-purple-800 border-purple-200';
    if (role.name === 'Administrateur') return 'bg-red-100 text-red-800 border-red-200';
    if (role.name === 'Vendeur') return 'bg-blue-100 text-blue-800 border-blue-200';
    if (role.name === 'Comptable') return 'bg-green-100 text-green-800 border-green-200';
    if (role.name === 'Gestionnaire Stock') return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

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
            <Shield className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestion des profils et rôles</h1>
              <p className="text-gray-500">{roles.length} rôle(s) configuré(s)</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Nouveau rôle</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rôles configurés</p>
              <p className="text-2xl font-bold text-gray-900">{roles.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Utilisateurs assignés</p>
              <p className="text-2xl font-bold text-gray-900">
                {roles.reduce((sum, role) => sum + role.userCount, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Check className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Permissions disponibles</p>
              <p className="text-2xl font-bold text-gray-900">{permissions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <div key={role.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(role)}`}>
                {role.name}
              </div>
              {!role.isSystem && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setEditingRole(role);
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 p-1"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(role.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <h3 className="font-semibold text-gray-900 mb-2">{role.name}</h3>
            <p className="text-sm text-gray-600 mb-4">{role.description}</p>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Utilisateurs assignés:</span>
                <span className="font-medium text-gray-900">{role.userCount}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Permissions:</span>
                <span className="font-medium text-gray-900">
                  {role.permissions.includes('all') ? 'Toutes' : role.permissions.length}
                </span>
              </div>

              {role.isSystem && (
                <div className="flex items-center text-xs text-gray-500">
                  <Shield className="h-3 w-3 mr-1" />
                  Rôle système
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex flex-wrap gap-1">
                {role.permissions.slice(0, 3).map((permission) => (
                  <span key={permission} className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">
                    {permission === 'all' ? 'Toutes' : permission.split('.')[0]}
                  </span>
                ))}
                {role.permissions.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">
                    +{role.permissions.length - 3}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Permissions Reference */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Référence des permissions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(getPermissionsByCategory()).map(([category, categoryPermissions]) => (
            <div key={category} className="space-y-3">
              <h4 className="font-medium text-gray-900 border-b border-gray-200 pb-2">
                {category}
              </h4>
              <div className="space-y-2">
                {categoryPermissions.map((permission) => (
                  <div key={permission.id} className="text-sm">
                    <div className="font-medium text-gray-700">{permission.name}</div>
                    <div className="text-gray-500 text-xs">{permission.description}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}