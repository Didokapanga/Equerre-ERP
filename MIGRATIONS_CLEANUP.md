# 🧹 Analyse des migrations - Fichiers à nettoyer

## ✅ Migrations ESSENTIELLES à conserver :

1. **`20250609194622_holy_block.sql`** ✅
   - Schéma ERP complet (tables, types, politiques RLS de base)
   - **CRITIQUE** - Base de l'application

2. **`20250609211038_orange_bush.sql`** ✅
   - Fonctions de gestion automatique des stocks
   - **CRITIQUE** - Gestion stock

3. **`20250609221847_spring_sky.sql`** ✅
   - Triggers pour gestion stock des achats
   - **CRITIQUE** - Automatisation stock achats

4. **`20250609222301_green_coral.sql`** ✅
   - Table `stock_movements` pour traçabilité
   - **CRITIQUE** - Historique des mouvements

5. **`20250609222308_mellow_surf.sql`** ✅
   - Fonctions de mise à jour stock achats
   - **CRITIQUE** - Logique métier stock

6. **`20250609224903_summer_manor.sql`** ✅
   - Gestion du stock pour les ventes
   - **CRITIQUE** - Déduction stock ventes

7. **`20250609231429_nameless_canyon.sql`** ✅
   - Correction déduction stock ventes
   - **CRITIQUE** - Correction bugs stock

8. **`20250610160125_ancient_stream.sql`** ✅
   - Correction des références auth.users manquantes
   - **CRITIQUE** - Correction technique importante

9. **`20250610160136_light_wildflower.sql`** ✅
   - Correction des fonctions de gestion du stock
   - **CRITIQUE** - Correction bugs stock

10. **`20250611030928_square_sunset.sql`** ✅
    - Ajout colonne activity_id aux produits
    - **IMPORTANT** - Fonctionnalité produits par activité

## ❌ Migrations INUTILES à supprimer :

### 1. **`20250611032912_odd_bread.sql`** ❌
- **Raison** : Politique RLS complexe qui a été remplacée
- **Remplacée par** : `20250611040920_emerald_salad.sql`

### 2. **`20250611034255_navy_delta.sql`** ❌
- **Raison** : Tentative de politique RLS qui a échoué
- **Remplacée par** : `20250611040920_emerald_salad.sql`

### 3. **`20250611034453_muddy_shore.sql`** ❌
- **Raison** : Politique RLS temporaire
- **Remplacée par** : `20250611040920_emerald_salad.sql`

### 4. **`20250611035912_wispy_butterfly.sql`** ❌
- **Raison** : Politique RLS complexe abandonnée
- **Remplacée par** : `20250611040920_emerald_salad.sql`

## 🎯 Action recommandée :

Supprimer les 4 fichiers de migration inutiles qui ne font que créer de la confusion et des conflits dans les politiques RLS.

## 📊 Résumé :
- **10 migrations essentielles** à conserver ✅
- **4 migrations inutiles** à supprimer ❌
- **Gain** : Simplification et clarté du schéma de base