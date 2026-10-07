# Livraison du 7 octobre (après-midi)

Ce que ça ajoute :
- **Publicités** : l'admin choisit maintenant le format (bannière, plein écran, carré) en créant/modifiant une publicité.
- **Cours** : les cours approuvés par un admin s'affichent enfin aux élèves (`/dashboard/cours`).
- **Notifications** : une cloche dans le header prévient l'élève quand il reçoit un duel, quand un duel se termine, et quand son signalement a une réponse.
- **Analytics** : `/admin/analytics` — rétention, matière la plus jouée, taux de décrochage.
- **Test de fumée** : `supabase/tests/smoke.sql`, à lancer avant un déploiement pour vérifier que les parcours élève critiques fonctionnent.

## Installation

```bash
cd ~/Téléchargements   # ou où tu as dézippé
./install.sh ~/Documents/examplay-web
```

Ça copie les fichiers et lance `supabase db push` (4 nouvelles migrations : `20261017` à `20261020`).

Sans le CLI Supabase : colle `EXECUTER-DANS-SUPABASE.sql` dans Supabase > SQL Editor et exécute-le.

## Après la migration

```bash
cd ~/Documents/examplay-web
npm run build     # vérifie que tout compile
git add -A
git commit -m "Ajout formats de pub, page de cours, notifications, analytics"
git push
```

## Avant chaque déploiement, à partir de maintenant

Colle `supabase/tests/smoke.sql` dans le SQL Editor et exécute-le. "RÉUSSI" partout = OK. Une ligne rouge "ERROR" = quelque chose est cassé pour un élève, ne déploie pas. Rien n'est modifié en base (tout est annulé à la fin).

## Déjà testé de mon côté

Toutes les requêtes SQL (migrations + test de fumée) ont été exécutées sur un Postgres local avant livraison : lecture des questions par un élève, tirage `pick_questions`, demande contributeur, notifications de duel (reçues par le bon élève, invisibles pour les autres), et les calculs d'analytics. Tout TypeScript compile (`npx tsc --noEmit`) et passe le linter (`npx eslint`) sans erreur. Je n'ai pas pu tester contre ton vrai projet Supabase ni dans un navigateur réel.
