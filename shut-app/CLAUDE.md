# SHUT — app mobile de streaming live de DJ sets

Client : Selim Douib (SHUT Diffusion). Freelance : Nathan Kiss. Repo GitHub `nathk68/SHUT` (cette app est dans `shut-app/`, le site dans `../scroll-stop/` qui a son propre `AGENTS.md`).

## Stack
React Native + Expo (TypeScript), React Navigation, i18next (FR/EN), notifications push, expo-video (lecture HLS), `react-native-nodemediaclient` (diffusion depuis le téléphone, patché dans `patches/`).
Backend : Firebase (Auth, Firestore, Cloud Functions dans `functions/`). Vidéo : Mux. Dons : Stripe. E-mails : Resend.

## Rôles
Viewer, Broadcaster (DJ), Admin (impersonation possible pour tester les autres rôles). Contexte : `src/contexts/RoleContext.tsx`.

## Commandes
- Lancer : `npm start` (Expo), `npm run ios`, `npm run android`, `npm run web`
- Tests : `npm test` (Jest), `npm run test:coverage`. Pas de script de typecheck : utiliser `npx tsc --noEmit`.
- Functions : `cd functions && npm run build`, `npm run serve` (émulateur), `npm run lint`. `npm run deploy` = déploiement réel : **demander avant**.
- Test de charge HLS : `load-test/` (`load-test.mjs`, `simulate-hls.sh`).

## Environnements (EAS, `eas.json`)
`development` → `EXPO_PUBLIC_FIREBASE_ENV=dev`. `preview` et `production` → `preprod` (⚠ la production pointe encore sur preprod : à confirmer avant toute publication).

## Structure
- `src/screens/` : `admin/`, `auth/`, `broadcaster/`, `viewer/`, `onboarding/`, `settings/`, `legal/` + écrans racine (Go Live, profils, favoris…)
- `src/navigation/` : RootNavigator, AuthStack, MainTabs, BroadcasterTabs
- `src/contexts/`, `src/hooks/`, `src/services/` (events, streaming Mux), `src/i18n/locales/{fr,en}.json`, `src/types/`
- `functions/src/index.ts` : toutes les Cloud Functions (live/Mux, admin, notifications, dons). Fichier long (~2 650 lignes).
- Règles Firestore : `firestore.rules`, index : `firestore.indexes.json`
- Specs et plans : `docs/superpowers/` ; références : `docs/references/official/` ; `docs/ADR/` est vide.

## Règles de travail
- Branche courante `dev` ; ne jamais pousser sur `main` sans demande explicite. Faire les changements sur une branche dédiée.
- Ne jamais lancer `firebase deploy`, `eas submit`, ni publier sur les stores sans validation.
- Toute chaîne visible par l'utilisateur doit exister en FR **et** EN (`src/i18n/locales/`).
- Ne pas committer de secrets (clés Mux, Stripe, Firebase, `.env`). Ne jamais toucher aux fichiers de logs de debug.
- Toute modification des règles Firestore ou des webhooks Mux/Stripe s'accompagne d'un test.
- Les dossiers `ios/` et `android/` sont générés par Expo : ne les modifier que si nécessaire (config plugin sinon).
