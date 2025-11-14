import React, { useState, useEffect } from 'react';
import { Save, X, User, Phone } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

// Props du formulaire
interface ProfileFormProps {
    profileData?: any | null; // Profil existant pour modifier
    userId?: string;          // Id provenant de auth.users
    onSuccess: () => void;
    onCancel: () => void;
}

// Type pour le select des activités
interface ActivityOption {
    id: string;
    name: string;
}

// Type pour le formulaire
interface FormData {
    id?: string;              // 🔹 Le champ id pour auth.users
    first_name: string;
    last_name: string;
    phone: string;
    role: string;
    activity_id: string | null;
    is_active: boolean;
}

export function ProfileForm({ profileData, userId, onSuccess, onCancel }: ProfileFormProps) {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [activities, setActivities] = useState<ActivityOption[]>([]);
    const [formData, setFormData] = useState<FormData>({
        id: profileData?.id || userId || '', // 🔹 Utilisation du userId reçu
        first_name: profileData?.first_name || '',
        last_name: profileData?.last_name || '',
        phone: profileData?.phone || '',
        role: profileData?.role || 'vendeur',
        activity_id: profileData?.activity_id || null,
        is_active: profileData?.is_active ?? true,
    });

    // Charger les activités
    useEffect(() => {
        const loadActivities = async () => {
            if (!profile) return;
            try {
                const { data, error } = await supabase
                    .from('activities')
                    .select('id, name')
                    .eq('company_id', profile.company_id)
                    .order('name');
                if (error) throw error;
                setActivities((data || []) as ActivityOption[]);
            } catch (error) {
                console.error('Error loading activities:', error);
            }
        };
        loadActivities();
    }, [profile]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!profile) throw new Error('Profil non chargé');
            if (!formData.id) throw new Error('L’id du profil est obligatoire');

            const profilePayload = {
                ...formData,
                company_id: profile.company_id,
            };

            if (profileData) {
                // Modifier un profil existant
                const { error } = await supabase
                    .from('profiles')
                    .update(profilePayload)
                    .eq('id', profileData.id);
                if (error) throw error;
            } else {
                // Créer un nouveau profil avec l'id
                const { error } = await supabase
                    .from('profiles')
                    .insert([profilePayload]);
                if (error) throw error;
            }

            onSuccess();
        } catch (error: any) {
            console.error('Error saving profile:', error);
            alert('Erreur lors de la sauvegarde: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <User className="h-8 w-8 text-purple-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {profileData ? 'Modifier l’utilisateur' : 'Nouvel utilisateur'}
                        </h1>
                        <p className="text-gray-500">
                            {profileData
                                ? 'Modifiez les informations du profil'
                                : 'Créez un nouveau profil pour votre activité'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onCancel}
                    className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg"
                >
                    <X className="h-6 w-6" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Champ ID visible */}
                {!profileData && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">ID utilisateur *</label>
                        <input
                            type="text"
                            required
                            placeholder="Collez l'ID reçu depuis auth.users"
                            value={formData.id}
                            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>
                )}

                {/* Informations générales */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <User className="h-5 w-5 mr-2" />
                        Informations générales
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Prénom *</label>
                            <input
                                type="text"
                                required
                                value={formData.first_name}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                            <input
                                type="text"
                                required
                                value={formData.last_name}
                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="+33 1 23 45 67 89"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Rôle *</label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="vendeur">Vendeur</option>
                                <option value="admin">Administrateur</option>
                                <option value="propriétaire">Propriétaire</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Activité</label>
                            <select
                                value={formData.activity_id || ''}
                                onChange={(e) => setFormData({ ...formData, activity_id: e.target.value || null })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="">Aucune</option>
                                {activities.map((a) => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center mt-2">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            />
                            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">Profil actif</label>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center space-x-2 transition-colors"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        <span>{profileData ? 'Modifier' : 'Créer'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}