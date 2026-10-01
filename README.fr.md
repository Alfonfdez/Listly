# Listly

[English](README.md) · [Español](README.es.md) · [Català](README.ca.md) · [Galego](README.gl.md) · [Euskara](README.eu.md) · [Deutsch](README.de.md) · [Português](README.pt.md) · [Italiano](README.it.md)

**Listly** est un gestionnaire de listes local-first pour le quotidien. Créez autant de listes que nécessaire — courses, tâches, bagages, garde-manger — organisez-les en collections et cochez les éléments au fur et à mesure. Les listes peuvent être de simples listes de vérification ou des listes numériques qui enregistrent un montant et une quantité par élément avec un total cumulé.

Tout fonctionne **sur l'appareil** : vos données vivent dans une base de données SQLite locale (sql.js + IndexedDB sur le web), rien ne quitte votre téléphone, et aucun compte ni abonnement n'est requis.

| | |
|---|---|
| **Plateformes** | iOS, Android et Web |
| **Version** | 1.0.0 |
| **Langues** | Anglais, Espagnol, Catalan, Galicien, Basque, Français, Allemand, Portugais, Italien |
| **Données** | 100 % locales (SQLite en natif, sql.js + IndexedDB sur le web) |
| **Thèmes** | Sombre, Clair et Automatique (suit le système) |

## Fonctionnalités

- **Listes** — créez autant de listes que vous voulez, chacune avec son icône et sa couleur, et choisissez entre deux types de liste : **Standard** (liste de vérification) ou **Numérique**, avec un montant et une quantité par élément.
- **Éléments** — ajoutez des éléments rapidement depuis la barre inférieure, cochez-les et ouvrez un élément pour ajouter une **note** ou une **photo** (galerie sur toutes les plateformes, appareil photo sur iOS et Android).
- **Listes numériques** — attribuez à chaque élément un montant et une quantité ; l'en-tête de la liste affiche le **Total** et le sous-total **Fait**, et chaque élément affiche son total de ligne (montant × quantité).
- **Collections** — regroupez les listes en collections (dossiers) comme *Maison* ou *Travail*, et faites glisser une liste sur une collection pour la déplacer dedans.
- **Glisser-déposer** — réorganisez les listes et les éléments par appui long et glisser-déposer ; persisté via une colonne `position`.
- **Listes verrouillées** — protégez une liste par une phrase secrète ; ses éléments sont chiffrés **sur l'appareil** avec AES-256-GCM. Si vous oubliez la phrase secrète, aucune récupération n'est possible.
- **Dupliquer, copier et fusionner** — dupliquez une liste entière, copiez une liste avec ou sans ses notes, copiez les éléments sélectionnés dans une autre liste, ou fusionnez des éléments dans une autre liste.
- **Tri** — triez une liste manuellement, par nom ou par date d'ajout de chaque élément, de façon croissante ou décroissante.
- **Mode sélection** — entrez en mode sélection depuis l'en-tête pour sélectionner plusieurs éléments et les supprimer (ou sélectionner plusieurs listes à la fois) en une seule fois.
- **Recherche** — filtrez les listes et les éléments depuis la recherche de l'en-tête sur Accueil, Listes et à l'intérieur d'une liste.
- **Réglages** — thème, taille du texte, langue, dispositions par écran (grille ou lignes) et champs facultatifs par type de liste (notes et photos sur l'affichage de l'élément et l'écran d'édition).
- **Sauvegarde** — exportez toute votre base de données sous forme de fichier JSON et réimportez-la à tout moment, avec des actions protégées de suppression totale et de réinitialisation d'usine.

## Captures d'écran

![Écran d'accueil](images/screenshots/01-home-empty.png)<br>*Écran d'accueil avant qu'aucune collection ou liste n'existe.*<br><br>
![Accueil avec données](images/screenshots/02-home.png)<br>*Accueil avec une collection et des listes autonomes, dont une liste verrouillée.*<br><br>
![Menu latéral](images/screenshots/03-hamburger.png)<br>*Menu latéral avec Accueil, Collections, Listes et Réglages — et la version de l'app en bas.*<br><br>
![Créer une liste](images/screenshots/04-create-list.png)<br>*Créer une liste : nom, type (Standard ou Numérique), icône et couleur.*<br><br>
![Détail de liste](images/screenshots/05-list-detail.png)<br>*Une liste standard avec des éléments cochés, une note, le contrôle de tri et les actions groupées.*<br><br>
![Liste numérique](images/screenshots/06-numeric-list.png)<br>*Une liste numérique avec Total et Fait, les totaux de ligne et la ligne montant/quantité.*<br><br>
![Ajout d'élément déplié](images/screenshots/07-add-item-expanded.png)<br>*La barre d'ajout dépliée pour joindre une note et des photos au nouvel élément.*<br><br>
![Modifier un élément](images/screenshots/08-item-edit.png)<br>*Modifier un élément : nom, note et photos.*<br><br>
![Collections](images/screenshots/09b-collections.png)<br>*L'écran Collections.*<br><br>
![Listes](images/screenshots/09-lists.png)<br>*L'écran Listes, montrant l'appartenance aux collections et la progression par liste.*<br><br>
![Détail de collection](images/screenshots/10-collection-detail.png)<br>*Une collection avec ses listes membres.*<br><br>
![Verrouiller une liste](images/screenshots/12-lock-list.png)<br>*Verrouiller une liste par une phrase secrète.*<br><br>
![Liste verrouillée](images/screenshots/12b-locked-list.png)<br>*Une liste verrouillée, en attente de la phrase secrète.*<br><br>
![Mode sélection](images/screenshots/13-select-mode.png)<br>*Mode sélection avec la barre d'actions inférieure.*<br><br>
![Réglages](images/screenshots/14-settings.png)<br>*Réglages : Apparence, Régional, Personnalisation et Données.*<br><br>
![Réglages d'apparence](images/screenshots/15-settings-appearance.png)<br>*Apparence : thème et taille du texte.*<br><br>
![Sélecteur de langue](images/screenshots/16b-settings-language.png)<br>*Le sélecteur de langue avec les neuf langues et leurs drapeaux.*<br><br>
![Réglages régionaux](images/screenshots/16-settings-regional.png)<br>*Réglages régionaux : langue.*<br><br>
![Réglages de personnalisation](images/screenshots/17-settings-personalization.png)<br>*Personnalisation : dispositions par écran et champs facultatifs par type de liste.*<br><br>
![Réglages des données](images/screenshots/18-settings-data.png)<br>*Données : export/import et les actions protégées de suppression et de réinitialisation.*<br><br>

## Technologies

| Couche | Technologie |
|---|---|
| Framework | React Native avec Expo (SDK 57) |
| Langage | TypeScript |
| Navigation | React Navigation (Stack + Drawer) |
| Icônes | @expo/vector-icons (Ionicons) |
| Glisser-déposer | react-native-sortables |
| Sélecteur de couleur | reanimated-color-picker |
| Chiffrement | quick-crypto (AES-256-GCM pour les listes verrouillées) |
| Persistance | SQLite (expo-sqlite) en natif, sql.js (WASM) + IndexedDB sur le web |
| ORM | Drizzle ORM (query builder sur un `DatabaseHandle` partagé) |
| Validation | Schémas Zod comme source unique de vérité pour les lignes stockées |
| Web | react-native-web |
| État | Context API (AppContext + ConfigContext) |
| i18n | Système maison (en, es, ca, gl, eu, fr, de, pt, it) |

## Développement

Cette section est destinée aux contributeurs et à quiconque souhaite exécuter, forker ou étendre l'app.

### Prérequis

- Node.js 20+ (Node 24 recommandé)
- npm
- Un émulateur Android facultatif (le dossier `android/` est généré par CNG — voir ci-dessous)

### La première fois après le clone

```bash
cd ListlyApp
npm install
npx expo start
```

Cela démarre Metro Bundler. Ensuite :

| Pour voir sur… | Faites ceci |
|---|---|
| **Navigateur** | Ouvrez http://localhost:8081 ou exécutez `npx expo start --web` |
| **Android (émulateur)** | Exécutez `npx expo run:android` |
| **iOS (simulateur)** | Exécutez `npx expo run:ios` (macOS uniquement) |

> Remarque : les listes verrouillées et la feuille de partage dépendent de modules natifs, utilisez donc un build de développement ou de release plutôt qu'Expo Go.

### Commandes

| Commande | Description |
|---|---|
| `npm start` | Démarre Expo en mode développement |
| `npm run web` | Démarre et ouvre dans le navigateur |
| `npm run android` | Démarre sur l'émulateur Android |
| `npm run ios` | Démarre sur le simulateur iOS (macOS uniquement) |
| `npm run typecheck` | Vérification TypeScript (`tsc --noEmit`) |
| `npm run lint` | ESLint via `expo lint` |
| `npm test` | Lance la suite Vitest |
| `npm run test:watch` | Lance Vitest en mode watch |
| `npm run test:all` | typecheck + lint + tests (la porte locale complète) |

### Tests

- **Unitaires / d'intégration** — Vitest. La suite couvre les dépôts de la base de données sur les deux backends SQLite (natif + sql.js), les cycles de sauvegarde, le chiffrement et les composants rendus avec `@testing-library/react-native`.
- **Vérification web** — les critères d'acceptation de chaque fonctionnalité sont vérifiés dans un vrai navigateur à 375px avec Playwright.
- Le pipeline CI exécute la porte complète `npm run test:all` à chaque push et pull request vers `develop` et `main`.

> **Porte locale :** un changement n'est terminé que lorsque `npm run test:all` passe.

### Structure du projet

```
ListlyApp/
  src/
    components/    — composants d'UI réutilisables
    constants/     — thèmes, types, couleurs, icônes
    context/       — AppContext, ConfigContext (état global)
    database/      — moteurs SQLite/sql.js, dépôts, migrations, schéma Drizzle
    hooks/         — hooks maison
    i18n/          — traductions (en, es, ca, gl, eu, fr, de, pt, it)
    navigation/    — AppNavigator (Drawer + Stack)
    screens/       — composants d'écran (PascalCase)
    utils/         — formateurs, plateforme, langue
```

### Base de données

- Une seule interface de moteur (`DatabaseHandle`) sur toutes les plateformes : expo-sqlite en natif, sql.js (WASM) avec persistance IndexedDB sur le web.
- Le schéma est créé à partir d'un `createSchema` canonique et versionné avec `PRAGMA user_version` ; les migrations s'exécutent une fois, dans une transaction.
- Les dépôts sont écrits avec le query builder de Drizzle sur le handle partagé ; les lignes stockées sont validées par des schémas Zod.
- Sur le web, les octets SQLite exportés sont persistés dans IndexedDB, donc les mêmes données survivent aux rechargements.

### Construire un APK Android

Le dossier natif `android/` est généré par Expo CNG (`expo prebuild`) et n'est pas versionné :

```bash
cd ListlyApp
npx expo prebuild --platform android
cd android
./gradlew assembleRelease   # APK → app/build/outputs/apk/release/app-release.apk
```

Relancez `npx expo prebuild --platform android` chaque fois que `assets/` ou la config icône/splash dans `app.json` change, sinon l'APK conserve les anciennes icônes.

### Méthodologie

Ce projet utilise le **Specification-Driven Development (SDD)**. Les spécifications vivent dans `spec/` et sont la source unique de vérité — ce qu'il faut construire est d'abord défini dans des documents `1-spec.md`, puis implémenté, puis vérifié par rapport aux critères d'acceptation. La feuille de route est suivie dans `spec/constitution/3-roadmap.md`.

## Licence

Listly est distribué sous licence MIT — voir le fichier [LICENSE](LICENSE).
