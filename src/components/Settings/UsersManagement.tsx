import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, User, Phone, Edit, Trash2, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase, Profile } from '../../lib/supabase';
import { ProfileForm } from './ProfileForm';

interface UsersManagementProps {
    onBack: () => void;
}

export function UsersManagement({ onBack }: UsersManagementProps) {
    const { profile } = useAuth();
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState<Profile | null>(null);

    useEffect(() => {
        if (profile) {
            loadUsers();
        }
    }, [profile]);

    const loadUsers = async () => {
        try {
            // Charger uniquement les utilisateurs de la même entreprise
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('company_id', profile?.company_id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ is_active: !currentStatus })
                .eq('id', userId);

            if (error) throw error;
            loadUsers();
        } catch (error) {
            console.error('Error updating user status:', error);
            alert('Erreur lors de la mise à jour du statut');
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', userId);

            if (error) throw error;
            loadUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Erreur lors de la suppression');
        }
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setEditingUser(null);
        loadUsers();
    };

    if (showForm) {
        return (
            <ProfileForm
                profileData={editingUser} // ✅ renommer profile -> profileData
                onSuccess={handleFormSuccess}
                onCancel={() => {
                    setShowForm(false);
                    setEditingUser(null);
                }}
            />
        );
    }

    // if (showForm) {
    //     return (
    //         <ProfileForm
    //             profile={editingUser}
    //             onSuccess={handleFormSuccess}
    //             onCancel={() => {
    //                 setShowForm(false);
    //                 setEditingUser(null);
    //             }}
    //         />
    //     );
    // }

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
                        <Users className="h-8 w-8 text-purple-600" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
                            <p className="text-gray-500">{users.length} utilisateur(s)</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    <span>Nouvel utilisateur</span>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Users className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total utilisateurs</p>
                            <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <Users className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Utilisateurs actifs</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {users.filter(u => u.is_active).length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-3 bg-red-100 rounded-lg">
                            <Users className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Utilisateurs inactifs</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {users.filter(u => !u.is_active).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Users Grid */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-12">
                        <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">Aucun utilisateur configuré</p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            Créer le premier utilisateur
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                        {users.map((user) => (
                            <div key={user.id} className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow border border-gray-200">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className={`p-3 rounded-lg ${user.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                                            <User className={`h-6 w-6 ${user.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{user.first_name} {user.last_name}</h3>
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${user.is_active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {user.is_active ? 'Actif' : 'Inactif'}
                                            </span>
                                            <p className="text-sm text-gray-500">{user.role}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => {
                                                setEditingUser(user);
                                                setShowForm(true);
                                            }}
                                            className="text-blue-600 hover:text-blue-800 p-1"
                                            title="Modifier"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="text-red-600 hover:text-red-800 p-1"
                                            title="Supprimer"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {user.phone && (
                                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                                            <Phone className="h-4 w-4 text-gray-400" />
                                            <span>{user.phone}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={user.is_active}
                                                onChange={() => handleToggleStatus(user.id, user.is_active)}
                                                className="sr-only"
                                            />
                                            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${user.is_active ? 'bg-green-600' : 'bg-gray-200'
                                                }`}>
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${user.is_active ? 'translate-x-6' : 'translate-x-1'
                                                    }`} />
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}