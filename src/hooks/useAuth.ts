import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

// Clé pour le cache localStorage
const PROFILE_CACHE_KEY = 'user_profile';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  // Fonction pour sauvegarder le profil en cache
  const saveProfileToCache = (profileData: Profile) => {
    try {
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profileData));
      console.log('✅ Profil sauvegardé en cache');
    } catch (error) {
      console.warn('⚠️ Erreur sauvegarde cache:', error);
    }
  };

  // Fonction pour charger le profil depuis le cache
  const loadProfileFromCache = (): Profile | undefined => {
    try {
      const cached = localStorage.getItem(PROFILE_CACHE_KEY);
      if (cached) {
        const profileData = JSON.parse(cached);
        console.log('📦 Profil chargé depuis le cache');
        return profileData;
      }
    } catch (error) {
      console.warn('⚠️ Erreur lecture cache:', error);
      localStorage.removeItem(PROFILE_CACHE_KEY);
    }
    return undefined;
  };

  // Fonction pour nettoyer le cache
  const clearProfileCache = () => {
    localStorage.removeItem(PROFILE_CACHE_KEY);
    console.log('🧹 Cache profil nettoyé');
  };

  // Fonction pour charger le profil depuis Supabase
  const loadProfileFromDatabase = async (userId: string): Promise<Profile | undefined> => {
    try {
      console.log('🔍 Chargement profil depuis Supabase pour:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          company:companies(*),
          activity:activities(*)
        `)
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('ℹ️ Aucun profil trouvé pour cet utilisateur');
          return undefined;
        }
        throw error;
      }

      console.log('✅ Profil chargé depuis Supabase');
      return data;
    } catch (error) {
      console.error('❌ Erreur chargement profil:', error);
      return undefined;
    }
  };

  // Fonction pour vérifier si l'entreprise est active
  const checkCompanyActivation = (profile: Profile): boolean => {
    return profile.company?.is_active === true;
  };

  // Fonction pour rafraîchir le profil (force le rechargement depuis Supabase)
  const reloadProfile = async () => {
    if (!user) return;

    setLoading(true);
    setIsReady(false);
    
    try {
      const profileData = await loadProfileFromDatabase(user.id);
      setProfile(profileData);
      
      if (profileData) {
        saveProfileToCache(profileData);
      } else {
        clearProfileCache();
      }
    } catch (error) {
      console.error('❌ Erreur rafraîchissement profil:', error);
    } finally {
      setIsReady(true);
      setLoading(false);
    }
  };

  // Fonction de connexion
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('🔐 Tentative de connexion pour:', email);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('❌ Erreur de connexion:', error);
      } else {
        console.log('✅ Connexion réussie');
      }
      
      return { error };
    } catch (error: any) {
      console.error('💥 Exception lors de la connexion:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Fonction d'inscription complète (4 étapes)
  const signUp = async (registrationData: {
    // Étape 1: Authentification
    email: string;
    password: string;
    
    // Étape 2: Entreprise
    companyData: {
      name: string;
      address?: string;
      phone?: string;
      email?: string;
      tax_number?: string;
      is_active?: boolean;
    };
    
    // Étape 3: Activité
    activityData: {
      name: string;
      address?: string;
      phone?: string;
      manager_name: string;
    };
    
    // Étape 4: Profil
    profileData: {
      first_name: string;
      last_name: string;
      phone?: string;
      role: string;
    };
  }) => {
    try {
      setLoading(true);
      setIsReady(false);
      console.log('🚀 Début inscription complète...');

      // Étape 1: Créer le compte utilisateur
      console.log('👤 Étape 1: Création du compte utilisateur');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registrationData.email,
        password: registrationData.password,
      });

      if (authError) {
        console.error('❌ Erreur création compte:', authError);
        return { error: authError };
      }

      if (!authData.user) {
        return { error: { message: 'Erreur lors de la création du compte' } };
      }

      console.log('✅ Compte utilisateur créé:', authData.user.id);

      // Attendre que l'utilisateur soit bien créé
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Étape 2: Créer l'entreprise (INACTIVE par défaut)
      console.log('🏢 Étape 2: Création de l\'entreprise (inactive)');
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert([{
          name: registrationData.companyData.name,
          address: registrationData.companyData.address,
          phone: registrationData.companyData.phone,
          email: registrationData.companyData.email,
          tax_number: registrationData.companyData.tax_number,
          is_active: false // IMPORTANT: Entreprise créée comme inactive
        }])
        .select()
        .single();

      if (companyError) {
        console.error('❌ Erreur création entreprise:', companyError);
        return { error: companyError };
      }

      console.log('✅ Entreprise créée (inactive):', companyData.id);

      // Étape 3: Créer l'activité
      console.log('🏭 Étape 3: Création de l\'activité');
      const { data: activityData, error: activityError } = await supabase
        .from('activities')
        .insert([{
          company_id: companyData.id,
          name: registrationData.activityData.name,
          address: registrationData.activityData.address,
          phone: registrationData.activityData.phone,
          manager_name: registrationData.activityData.manager_name
        }])
        .select()
        .single();

      if (activityError) {
        console.error('❌ Erreur création activité:', activityError);
        return { error: activityError };
      }

      console.log('✅ Activité créée:', activityData.id);

      // Étape 4: Créer le profil utilisateur
      console.log('👤 Étape 4: Création du profil utilisateur');
      const profileData = {
        id: authData.user.id,
        company_id: companyData.id,
        activity_id: activityData.id,
        first_name: registrationData.profileData.first_name,
        last_name: registrationData.profileData.last_name,
        phone: registrationData.profileData.phone,
        role: registrationData.profileData.role
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([profileData]);

      if (profileError) {
        console.error('❌ Erreur création profil:', profileError);
        return { error: profileError };
      }

      console.log('✅ Profil utilisateur créé');
      console.log('🎉 Inscription complète terminée !');

      return { data: authData, error: null };
    } catch (error: any) {
      console.error('💥 Exception lors de l\'inscription:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Fonction de déconnexion
  const logout = async () => {
    try {
      setLoading(true);
      setIsReady(false);
      console.log('🚪 Déconnexion en cours...');
      
      // Nettoyer le cache local
      clearProfileCache();
      
      // Déconnecter de Supabase
      const { error } = await supabase.auth.signOut();
      
      // Nettoyer les états locaux
      setUser(null);
      setProfile(undefined);
      
      console.log('✅ Déconnexion terminée');
      return { error };
    } catch (error: any) {
      console.error('❌ Erreur déconnexion:', error);
      return { error };
    } finally {
      setLoading(false);
      setIsReady(true);
    }
  };

  // Fonction pour vérifier les permissions
  const hasPermission = (requiredRoles: string[]) => {
    if (!profile) return false;
    return requiredRoles.includes(profile.role);
  };

  // Fonction pour vérifier l'accès aux modules
  const canAccessModule = (module: string) => {
    if (!profile) return false;
    
    const permissions = {
      dashboard: ['proprietaire', 'admin', 'vendeur', 'comptable', 'gestionnaire_stock'],
      sales: ['proprietaire', 'admin', 'vendeur', 'comptable'],
      purchases: ['proprietaire', 'admin', 'comptable', 'gestionnaire_stock'],
      stock: ['proprietaire', 'admin', 'gestionnaire_stock'],
      products: ['proprietaire', 'admin', 'gestionnaire_stock', 'vendeur'],
      crm: ['proprietaire', 'admin', 'vendeur'],
      accounting: ['proprietaire', 'admin', 'comptable'],
      expenses: ['proprietaire', 'admin', 'comptable'],
      settings: ['proprietaire', 'admin'],
    };

    return permissions[module as keyof typeof permissions]?.includes(profile.role) || false;
  };

  // Fonction pour charger le profil
  const fetchProfile = async (userId: string) => {
    console.log('🔄 Chargement du profil pour:', userId);
    
    // D'abord essayer de charger depuis le cache
    const cachedProfile = loadProfileFromCache();
    if (cachedProfile) {
      setProfile(cachedProfile);
      setIsReady(true);
      console.log('📦 Profil chargé depuis le cache');
      return;
    }

    // Si pas de cache, charger depuis Supabase
    try {
      const profileData = await loadProfileFromDatabase(userId);
      setProfile(profileData);
      
      if (profileData) {
        saveProfileToCache(profileData);
        console.log('✅ Profil chargé depuis Supabase et mis en cache');
      } else {
        console.log('ℹ️ Aucun profil trouvé');
      }
    } catch (error) {
      console.error('❌ Erreur chargement profil:', error);
    } finally {
      setIsReady(true);
    }
  };

  // Initialisation et gestion des changements d'état d'authentification
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      console.log('🚀 Initialisation de l\'authentification...');
      
      try {
        // Récupérer la session actuelle
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Erreur session:', error);
          if (mounted) {
            setUser(null);
            setProfile(undefined);
            setLoading(false);
            setIsReady(true);
          }
          return;
        }

        if (mounted) {
          setUser(session?.user ?? null);
          
          if (session?.user) {
            console.log('👤 Session utilisateur trouvée');
            await fetchProfile(session.user.id);
          } else {
            console.log('👻 Aucune session utilisateur');
            setProfile(undefined);
            setIsReady(true);
          }
          
          setLoading(false);
        }
      } catch (error: any) {
        console.error('💥 Erreur initialisation:', error);
        if (mounted) {
          setUser(null);
          setProfile(undefined);
          setLoading(false);
          setIsReady(true);
        }
      }
    };

    // Initialiser l'authentification
    initializeAuth();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Changement d\'état auth:', event, !!session?.user);
        
        if (mounted) {
          setUser(session?.user ?? null);
          
          if (session?.user) {
            // Utilisateur connecté
            if (event === 'SIGNED_IN') {
              console.log('✅ Utilisateur connecté, chargement du profil...');
              setLoading(true);
              setIsReady(false);
              
              await fetchProfile(session.user.id);
              setLoading(false);
            }
          } else {
            // Utilisateur déconnecté
            console.log('👻 Utilisateur déconnecté');
            setProfile(undefined);
            clearProfileCache();
            setIsReady(true);
            setLoading(false);
          }
        }
      }
    );

    return () => {
      console.log('🧹 Nettoyage du hook useAuth');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    profile,
    loading,
    isReady,
    signIn,
    signUp,
    logout,
    reloadProfile,
    hasPermission,
    canAccessModule,
    isCompanyActive: profile ? checkCompanyActivation(profile) : false,
  };
}