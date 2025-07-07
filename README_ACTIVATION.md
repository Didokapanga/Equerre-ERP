# 🔐 Système d'Activation des Entreprises

## 📋 Fonctionnement

Le système d'activation des entreprises permet de contrôler l'accès à l'application ERP. Voici comment il fonctionne :

1. **Inscription** : Lorsqu'un utilisateur s'inscrit, son entreprise est créée avec `is_active = false`
2. **Attente d'activation** : L'utilisateur voit un écran d'attente l'informant que son compte doit être activé
3. **Activation** : Un administrateur système doit activer l'entreprise en modifiant `is_active = true` dans la table `companies`
4. **Accès** : Une fois activée, l'utilisateur peut accéder normalement à l'application

## 🔧 Comment activer une entreprise

Pour activer une entreprise, un administrateur système doit exécuter la requête SQL suivante :

```sql
UPDATE companies
SET is_active = true
WHERE id = 'ID_DE_L_ENTREPRISE';
```

## 🔍 Vérifier le statut d'activation

Pour vérifier quelles entreprises sont en attente d'activation :

```sql
SELECT id, name, created_at, is_active
FROM companies
WHERE is_active = false
ORDER BY created_at DESC;
```

## 🛡️ Sécurité

- Seul un administrateur système avec accès direct à la base de données peut activer une entreprise
- Cette mesure de sécurité permet de vérifier l'identité des entreprises avant de leur donner accès
- Les utilisateurs ne peuvent pas contourner cette restriction

## 📱 Interface utilisateur

- Les utilisateurs dont l'entreprise n'est pas activée voient un écran d'attente clair
- L'écran affiche les informations de l'entreprise et de l'utilisateur
- Un bouton "Rafraîchir" permet de vérifier si l'activation a été effectuée

## 📧 Notifications

Dans une version future, le système enverra automatiquement :
- Un email à l'administrateur système lors d'une nouvelle inscription
- Un email à l'utilisateur lorsque son entreprise est activée