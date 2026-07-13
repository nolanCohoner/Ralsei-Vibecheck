# VibeCheck — Découvre ta musique selon ton humeur

Projet réalisé par **Nolan Cohoner** (M1 Développeur Full Stack) dans le cadre de l'Évaluation Finale du module **React Native M1** — SUP de VINCI.

---

## Description du projet
**VibeCheck** est une application mobile musicale innovante construite autour de l'univers visuel et sonore rétro de *Deltarune / Undertale*. L'application permet à l'utilisateur de choisir son humeur parmi plusieurs états émotionnels pour générer instantanément une playlist de 20 morceaux via l'API Deezer, d'écouter les extraits audio, de sauvegarder ses favoris et d'enregistrer l'historique de ses humeurs.

### Direction Artistique & UI/UX
L'application adopte une charte **pixel art vert naturel** centrée sur le personnage de *Ralsei* et le thème de la *Fontaine Sombre* :
- **Arrière-plan animé en plein écran** : Reproduction de la *Dark Fountain* avec une brume verte qui s'élève de manière fluide.
- **Cadres RPG rétro** : Double bordure blanche et verte style boîte de dialogue Deltarune.
- **Ralsei interactif** : Un sprite animé de Ralsei en bas à gauche de la page de connexion qui salue l'utilisateur (*Ralsei World Wave*).
- **Icônes pixelisées faites maison** : Des grilles de pixels 8x8 dessinées de manière programmatique pour les icônes d'inputs (clé, enveloppe, œil de mot de passe, etc.).
- **Effets sonores retro interactifs** : Intégration des vrais sons de Deltarune à chaque interaction de bouton (navigation, sélection, sauvegarde, erreur, et un son rigolo aléatoire quand on clique sur Ralsei).

---

## Composition de l'équipe
- **Nolan Cohoner** (M1 Dev Full Stack) : Développeur unique (Projet réalisé en **solo**).
  - *Parties traitées* : Création et structure du projet, intégration de l'API Deezer, authentification et base de données Supabase, navigation, lecteur audio global (`expo-av`), intégration et gestion des effets sonores interactifs (SFX), design et composants pixel art natifs, historique d'humeurs graphiques, et export de playlists.

---

## Application Fonctionnelle & APK
* **APK Android** : L'application a été compilée avec succès dans le cloud Expo via **EAS Build**.
* **Téléchargement** :
  - **Lien de téléchargement direct** : [Télécharger l'APK VibeCheck sur Expo](https://expo.dev/accounts/nolancohoner/projects/vibecheck/builds/eff606fb-145a-4763-9f51-b79ada9b4b67) (disponible également en scannant le QR code d'installation sur la page de build).
  - **Envoi Direct** : Le fichier `.apk` sera également directement transmis via **Microsoft Teams** lors du rendu.

---

## Instructions d'installation et de lancement (Local)

### 1. Cloner le projet
```bash
git clone https://github.com/nolanCohoner/Ralsei-Vibecheck.git
cd Ralsei-Vibecheck
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer l'environnement
Copiez le fichier d'exemple pour créer votre fichier `.env` :
```bash
cp .env.example .env
```
Renseignez vos clés d'accès Supabase réelles dans le fichier `.env` :
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

> [!NOTE]  
> **Mode Simulation (Fallback Mock) :** Si les clés d'API ne sont pas renseignées dans le fichier `.env`, l'application bascule automatiquement sur un mode de simulation local (AsyncStorage). Ce mode permet de tester l'application immédiatement sans configuration complexe et sans aucune erreur.

### 4. Démarrer l'application
```bash
npx expo start
```
Scannez le QR code affiché avec votre application **Expo Go** (sur iOS ou Android) ou lancez un émulateur.

---

## Librairies utilisées et justifications

1. **Navigation : `@react-navigation/native` (+ Stack & Bottom Tabs)**
   - *Justification* : Standard officiel de React Native pour gérer proprement le routing, la pile d'écrans (Stack) et le menu principal (Tab Navigator).
2. **Audio : `expo-av`**
   - *Justification* : Gère le lecteur audio des previews 30s de Deezer et le moteur d'effets sonores de l'application (SFX interactifs).
3. **Persistance & Base de données : `@supabase/supabase-js`**
   - *Justification* : Outil requis pour l'authentification sécurisée des utilisateurs (inscription/connexion) et la persistance des données dans le cloud (favoris et historique).
4. **Stockage Local : `@react-native-async-storage/async-storage`**
   - *Justification* : Persistance de la session utilisateur et support du mode simulation en local.
5. **Partage : `expo-sharing` et `expo-file-system`**
   - *Justification* : Permet de générer un fichier `.txt` récapitulant la playlist générée et d'utiliser la feuille de partage native du smartphone (SMS, WhatsApp, Mail, etc.).
6. **Polices : `@expo-google-fonts/press-start-2p` et `expo-font`**
   - *Justification* : Chargement de la police rétro pixelisée *Press Start 2P* pour coller à la direction artistique Deltarune.
7. **Dégradés : `expo-linear-gradient`**
   - *Justification* : Utilisé pour les barres de progression, les boutons et les bordures dans l'esprit rétro.

---

## Exigences du Cahier des Charges Remplies

* **Authentification** : Inscription, connexion et déconnexion via Supabase Auth (email + mot de passe) (100% complet).
* **Sélecteur d'humeur** : Carrousel 3D interactif et animé pour choisir parmi 6 humeurs obligatoires (Joyeux, Nostalgique, Énergique, Mélancolique, Concentré, Festif) + d'autres humeurs bonus (Colérique, Amoureux, Fatigué) (100% complet).
* **Génération de playlist** : Récupération dynamique de 20 titres depuis l'API Deezer mappés selon les genres de l'humeur (100% complet).
* **Lecteur audio intégré** : Lecture des extraits de 30 secondes avec barre de progression interactive, play/pause, suivant et précédent (100% complet).
* **Favoris** : Enregistrement, chargement et suppression des morceaux favoris synchronisés sur Supabase (100% complet).
* **Historique d'humeurs** : Calendrier rétro des humeurs sur les 30 derniers jours avec statistiques de répartition des humeurs (100% complet).
* **Bonus 1 (Animations Reanimated / Animated)** : Transition et morphing de couleurs, rotation 3D des cartes d'humeurs.
* **Bonus 2 (Partage de playlist)** : Bouton d'exportation et de partage natif via `expo-sharing`.
* **Qualité de code** : Code TypeScript entièrement typé, structuré proprement sous `/src` (components, screens, hooks, services, utils), aucun `console.log` persistant, et gestion propre des états de chargement (`ActivityIndicator`).
