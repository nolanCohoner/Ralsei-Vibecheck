// Constantes de l'application et de configuration

export interface Mood {
  id: string;
  name: string;
  emoji: string;
  color: string; // Couleur principale pour le morphing
  textColor: string;
  description: string;
  genres: number[]; // Liste des IDs de genres musicaux Deezer
}

export const MOODS: Mood[] = [
  {
    id: 'joyeux',
    name: 'Joyeux',
    emoji: '☀️',
    color: '#F6C56B', // Jaune soleil chaleureux
    textColor: '#2D3B2D',
    description: 'Une playlist solaire pour illuminer votre journée.',
    genres: [132, 116] // Pop, Dance
  },
  {
    id: 'nostalgique',
    name: 'Nostalgique',
    emoji: '🍂',
    color: '#C2885A', // Brun doux automnal
    textColor: '#F1F1D3',
    description: 'Un voyage musical dans vos plus beaux souvenirs.',
    genres: [113, 464] // Rock, Folk
  },
  {
    id: 'energique',
    name: 'Energique',
    emoji: '⚡',
    color: '#E07A5F', // Rouge brique énergique
    textColor: '#F1F1D3',
    description: 'Des rythmes puissants pour faire le plein d\'énergie.',
    genres: [116, 152] // Dance/Electro, Metal
  },
  {
    id: 'melancolique',
    name: 'Melancolique',
    emoji: '🌧️',
    color: '#7DA3C4', // Bleu pluie apaisant
    textColor: '#F1F1D3',
    description: 'Des mélodies douces pour accompagner vos pensées.',
    genres: [129, 153, 98] // Jazz, Blues, Classical
  },
  {
    id: 'concentre',
    name: 'Concentre',
    emoji: '🧠',
    color: '#7DC2A5', // Teal naturel — couleur principale palette
    textColor: '#2D3B2D',
    description: 'Un fond sonore propice à la réflexion et au travail.',
    genres: [98, 173, 129] // Classical, Soundtracks, Jazz (lofi)
  },
  {
    id: 'festif',
    name: 'Festif',
    emoji: '🥳',
    color: '#B594C8', // Lavande festive
    textColor: '#F1F1D3',
    description: 'Le meilleur de la musique pour célébrer et danser.',
    genres: [116, 132, 144] // Dance, Pop, Reggae
  },
  {
    id: 'amoureux',
    name: 'Amoureux',
    emoji: '❤️',
    color: '#E83F6F',
    textColor: '#F1F1D3',
    description: 'Des mélodies romantiques pour les cœurs tendres.',
    genres: [132, 129]
  },
  {
    id: 'colerique',
    name: 'Colérique',
    emoji: '😡',
    color: '#D81159',
    textColor: '#F1F1D3',
    description: 'Des morceaux intenses pour exprimer votre colère.',
    genres: [152, 113]
  },
  {
    id: 'fatigue',
    name: 'Fatigué',
    emoji: '💤',
    color: '#4F5D75',
    textColor: '#F1F1D3',
    description: 'Un son doux et calme pour vous aider à vous reposer.',
    genres: [98, 129, 173] // Classical, Jazz (lofi), Soundtracks
  },
  {
    id: 'tobyfox',
    name: 'Vibe Toby Fox',
    emoji: '🐱',
    color: '#FFFFFF', // Blanc — thème Undertale
    textColor: '#000000',
    description: 'Musiques d\'Undertale et Deltarune uniquement.',
    genres: [173] // Soundtracks
  }
];

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  previewUrl: string;
  duration: number; // en secondes
}

export interface MoodHistoryEntry {
  id: string;
  mood: string;
  createdAt: string;
}

export interface TrackPlayEntry {
  id: string;
  trackId: string;
  title: string;
  artist: string;
  coverUrl: string;
  mood: string; // Humeur active quand la chanson a été écoutée
  playedAt: string;
}
