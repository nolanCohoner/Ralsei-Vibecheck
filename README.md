# 🎵 VibeCheck — Découvre ta musique selon ton humeur

Projet réalisé dans le cadre de l'Évaluation Finale du module **React Native M1** — SUP de VINCI.

## 📝 Description du projet
VibeCheck est une application mobile musicale innovante qui permet à l'utilisateur de choisir son humeur actuelle parmi 6 états émotionnels pour générer instantanément une playlist personnalisée de 20 morceaux via l'API Deezer, d'écouter des extraits audios intégrés, de sauvegarder ses titres préférés et de suivre l'historique de ses humeurs des 30 derniers jours.

---

## 👥 Composition de l'équipe
- **Nolan Cohoner** : Développeur unique (projet réalisé en solo).
  - *Parties traitées* : Intégration de l'API Deezer, Authentification Supabase, Navigation (Tabs/Stacks), Système d'écoute audio, Animations de morphing (Reanimated 2), Sauvegarde des favoris, Historique graphique des humeurs, et Partage de playlist.

---

## 🚀 Instructions d'installation et de lancement

### 1. Cloner le projet
Clonez le dépôt Git sur votre machine locale et naviguez dans le dossier du projet :
```bash
git clone https://github.com/nolanCohoner/Ralsei-Vibecheck.git
cd Ralsei-Vibecheck
```

### 2. Installer les dépendances
Installez les packages Node modules requis par Expo et l'application :
```bash
npm install
```

### 3. Configurer l'environnement (Facultatif mais recommandé)
Copiez le fichier d'exemple pour créer votre fichier de configuration d'environnement :
```bash
cp .env.example .env
```
Éditez ensuite le fichier `.env` pour y renseigner vos clés d'accès Supabase réelles :
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

> [!NOTE]  
> **Mode Simulation (Fallback Mock) :** Si les clés ne sont pas renseignées dans le fichier `.env` (ou conservent leurs valeurs par défaut), l'application bascule automatiquement sur un mode de simulation local. Ce mode permet d'utiliser toutes les fonctionnalités (connexion/inscription, favoris, historique, lecteur audio, playlists) de manière fluide et persistante, garantissant un démarrage **sans aucune erreur** sur n'importe quel ordinateur !

### 4. Démarrer l'application
Lancez le serveur de développement Expo Go :
```bash
npx expo start
```
Vous pouvez ensuite scanner le QR code affiché avec votre application **Expo Go** (sur iOS ou Android) ou utiliser un émulateur.

---

## 📚 Librairies utilisées et justifications des choix

1. **Navigation : `@react-navigation/native` (+ Stack & Bottom Tabs)**
   - *Justification* : Standard de l'industrie pour la navigation React Native. Permet de séparer proprement le flux d'authentification et le menu principal avec onglets tout en conservant une fluidité maximale lors des transitions.
2. **Gestion de l'Audio : `expo-av`**
   - *Justification* : Bibliothèque officielle d'Expo pour la lecture audio. Utilisée pour charger, jouer et contrôler les extraits de 30 secondes (previews) renvoyés par l'API Deezer.
3. **Animations : `react-native-reanimated`**
   - *Justification* : Utilisée pour animer l'arrière-plan du sélecteur d'humeurs (morphing de couleur fluide) selon l'humeur active, pour une expérience utilisateur premium (Bonus 1 validé).
4. **Base de données / Auth : `@supabase/supabase-js`**
   - *Justification* : Outil imposé et extrêmement puissant pour gérer l'inscription, la connexion et synchroniser en temps réel les favoris et l'historique d'humeurs de l'utilisateur.
5. **Sauvegarde locale : `@react-native-async-storage/async-storage`**
   - *Justification* : Utilisé pour la persistance locale de la session Supabase ainsi que pour le stockage des données locales dans le Mode Simulation.
6. **Partage : `expo-sharing` et `expo-file-system`**
   - *Justification* : Utilisé pour générer un fichier texte structuré de la playlist générée et le partager via les fonctionnalités natives du smartphone (SMS, WhatsApp, Mail, etc.) (Bonus 2 validé).
7. **Icônes : `lucide-react-native`**
   - *Justification* : Set d'icônes SVG modernes, légers et élégants parfaitement adaptés au thème sombre ultra-premium de l'application.

---

## ⚙️ Exigences du Cahier des Charges Remplies

- **Authentification** : Connexion et inscription opérationnelles via Supabase Auth.
- **Sélecteur d'humeur** : Interface animée et interactive mappant 6 humeurs vers des genres musicaux.
- **Génération de playlist** : Appel direct à l'API Deezer (top tracks par genre) pour générer 20 morceaux.
- **Lecteur audio intégré** : Lecture des previews avec Play/Pause/Suivant/Précédent et barre de progression dynamique.
- **Favoris** : Sauvegarde et suppression persistantes des morceaux favoris dans Supabase, consultables dans un écran dédié.
- **Historique d'humeur** : Grille graphique des 30 derniers jours (type GitHub contribution chart) et statistiques de répartition des humeurs.
- **Bonus 1 (Animations Reanimated)** : Morphing de couleur de fond très fluide.
- **Bonus 2 (Partage de playlist)** : Export et partage de la playlist générée via `expo-sharing`.
- **Qualité du code** : Code TypeScript structuré en sous-dossiers (`src/components`, `screens`, `hooks`, `services`, `utils`), sans aucun `console.log` en production et typages complets.
