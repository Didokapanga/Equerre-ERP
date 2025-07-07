import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Configuration Supabase:', {
  url: supabaseUrl,
  keyLength: supabaseAnonKey?.length,
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey
});

// Vérifier que les variables d'environnement sont définies
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Configuration Supabase manquante:', {
    url: supabaseUrl,
    key: supabaseAnonKey ? 'présente' : 'manquante'
  });
  throw new Error('Configuration Supabase manquante. Vérifiez vos variables d\'environnement.');
}

// Valider le format de l'URL Supabase
try {
  new URL(supabaseUrl);
} catch (error) {
  console.error('❌ URL Supabase invalide:', supabaseUrl);
  throw new Error('URL Supabase invalide. Vérifiez votre VITE_SUPABASE_URL.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Fonction pour tester la connectivité Supabase
export const testSupabaseConnection = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🧪 Test de connectivité Supabase...');
    
    // Test simple avec un timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes timeout
    
    const { data, error } = await supabase
      .from('companies')
      .select('id')
      .limit(1)
      .abortSignal(controller.signal);
    
    clearTimeout(timeoutId);
    
    if (error) {
      console.error('❌ Erreur test connectivité:', error);
      return { 
        success: false, 
        error: `Erreur de connexion: ${error.message}` 
      };
    }
    
    console.log('✅ Connectivité Supabase OK');
    return { success: true };
    
  } catch (error: any) {
    console.error('💥 Exception test connectivité:', error);
    
    if (error.name === 'AbortError') {
      return { 
        success: false, 
        error: 'Timeout de connexion - Vérifiez votre URL Supabase et votre connexion internet' 
      };
    }
    
    if (error.message?.includes('Failed to fetch')) {
      return { 
        success: false, 
        error: 'Impossible de se connecter à Supabase - Vérifiez votre URL et la configuration CORS' 
      };
    }
    
    return { 
      success: false, 
      error: `Erreur de connexion: ${error.message || 'Erreur inconnue'}` 
    };
  }
};

// Test de connexion au démarrage avec gestion d'erreur améliorée
testSupabaseConnection().then(({ success, error }) => {
  if (success) {
    console.log('🎉 Supabase connecté avec succès');
  } else {
    console.error('🚨 Problème de connexion Supabase:', error);
  }
}).catch(err => {
  console.error('💥 Erreur critique test connexion:', err);
});

// Types pour TypeScript
export interface Profile {
  id: string;
  company_id: string;
  activity_id?: string;
  role: 'proprietaire' | 'admin' | 'vendeur' | 'comptable' | 'gestionnaire_stock';
  first_name: string;
  last_name: string;
  phone?: string;
  is_active: boolean;
  company?: Company;
  activity?: Activity;
}

export interface Company {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  tax_number?: string;
  is_active: boolean;
}

export interface Activity {
  id: string;
  company_id: string;
  name: string;
  address?: string;
  phone?: string;
  manager_name?: string;
  is_active: boolean;
}

export interface Product {
  id: string;
  company_id: string;
  activity_id?: string;
  code: string;
  name: string;
  description?: string;
  category?: string;
  unit: string;
  purchase_price: number;
  sale_price: number;
  min_stock_level: number;
  is_active: boolean;
}

export interface Customer {
  id: string;
  company_id: string;
  activity_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_number?: string;
  credit_limit: number;
  current_balance: number;
  is_active: boolean;
}

export interface Supplier {
  id: string;
  company_id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_number?: string;
  payment_terms: number;
  is_active: boolean;
  created_at: string;
}

export interface Sale {
  id: string;
  company_id: string;
  activity_id: string;
  customer_id?: string;
  sale_number: string;
  sale_date: string;
  due_date?: string;
  total_amount: number;
  paid_amount: number;
  status: 'en_cours' | 'livre' | 'paye' | 'annule';
  notes?: string;
  customer?: Customer;
  sale_items?: SaleItem[];
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product?: Product;
}

export interface Purchase {
  id: string;
  company_id: string;
  activity_id: string;
  supplier_id: string;
  purchase_number: string;
  purchase_date: string;
  due_date?: string;
  total_amount: number;
  paid_amount: number;
  status: 'en_attente' | 'recu' | 'paye' | 'annule';
  notes?: string;
  supplier?: Supplier;
  purchase_items?: PurchaseItem[];
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  received_quantity: number;
  product?: Product;
}

export interface Stock {
  id: string;
  company_id: string;
  activity_id: string;
  product_id: string;
  quantity: number;
  reserved_quantity: number;
  last_updated: string;
  product?: Product;
}

export interface Expense {
  id: string;
  company_id: string;
  activity_id: string;
  title: string;
  description?: string;
  category: 'impot' | 'taxe' | 'cnss' | 'dgi' | 'patente' | 'electricite' | 'eau' | 'internet' | 'telephone' | 'transport' | 'carburant' | 'manutention' | 'location_vehicule' | 'fournitures_bureau' | 'nettoyage' | 'reparation_materiel' | 'formation_personnel' | 'recrutement' | 'uniformes' | 'primes' | 'salaires' | 'divers' | 'hospitalite' | 'deplacements' | 'repas' | 'imprevus';
  amount: number;
  expense_date: string;
  receipt_url?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

// Nouveaux types pour la comptabilité
export interface Account {
  id: string;
  company_id: string;
  code: string;
  name: string;
  account_type: 'actif' | 'passif' | 'produit' | 'charge';
  parent_id?: string;
  is_active: boolean;
  created_at: string;
}

export interface JournalEntry {
  id: string;
  company_id: string;
  activity_id: string;
  entry_number: string;
  entry_date: string;
  description: string;
  reference?: string;
  total_debit: number;
  total_credit: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  journal_entry_lines?: JournalEntryLine[];
}

export interface JournalEntryLine {
  id: string;
  journal_entry_id: string;
  account_id: string;
  description?: string;
  debit_amount: number;
  credit_amount: number;
  account?: Account;
}