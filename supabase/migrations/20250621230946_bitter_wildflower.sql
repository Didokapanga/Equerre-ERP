/*
  # Ajout du système d'activation des entreprises

  1. Modifications
    - Ajouter le champ is_active à la table companies
    - Valeur par défaut FALSE pour les nouvelles entreprises
    - Seules les entreprises activées peuvent accéder à l'application

  2. Sécurité
    - Contrôle d'accès basé sur l'activation de l'entreprise
    - Seul le super administrateur peut activer les entreprises
*/

-- Ajouter le champ is_active à la table companies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE companies ADD COLUMN is_active boolean DEFAULT false;
  END IF;
END $$;

-- Créer un index pour les performances
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON companies(is_active);

-- Mettre à jour les entreprises existantes pour qu'elles soient actives par défaut
-- (pour ne pas bloquer les utilisateurs existants)
UPDATE companies SET is_active = true WHERE is_active IS NULL;

-- Fonction pour vérifier si une entreprise est active
CREATE OR REPLACE FUNCTION is_company_active(company_uuid uuid)
RETURNS boolean AS $$
DECLARE
  company_status boolean;
BEGIN
  SELECT is_active INTO company_status
  FROM companies
  WHERE id = company_uuid;
  
  RETURN COALESCE(company_status, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;