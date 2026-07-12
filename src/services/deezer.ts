/**
 * Service de musique VibeCheck
 *
 * Stratégie audio (par priorité) :
 *  1. API Deezer  — requise par le sujet, previews 30s réels
 *  2. API iTunes  — fallback fiable (Apple CDN, rarement bloqué), previews 30s réels
 *  3. Fichiers OGG Undertale sur GitHub — mode Undertale uniquement
 *  4. Local mock  — dernier recours (aucun réseau disponible)
 */

import { Track, MOODS } from '../utils/constants';

const DEEZER_BASE = 'https://api.deezer.com';
const ITUNES_BASE = 'https://itunes.apple.com';

// Vraies musiques Undertale hébergées sur GitHub (raw OGG)
const UDR = 'https://raw.githubusercontent.com/perguto/Undertale-Siivagunner-Mod/master';

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300';

// ─── UTILITAIRES ─────────────────────────────────────────────────────────────

const shuffleArray = <T>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/** Fetch avec AbortController — abandonne après `ms` millisecondes */
const fetchWithTimeout = async (url: string, ms = 3000): Promise<Response> => {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    clearTimeout(id);
    return r;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
};

// ─── MAPPERS ──────────────────────────────────────────────────────────────────

const mapDeezerTrack = (t: any): Track => ({
  id: `dz-${t.id}`,
  title: t.title_short || t.title,
  artist: t.artist?.name || 'Artiste inconnu',
  album: t.album?.title || 'Album inconnu',
  coverUrl: t.album?.cover_medium || FALLBACK_COVER,
  previewUrl: t.preview || '',
  duration: t.duration || 30,
});

const mapItunesTrack = (t: any): Track => ({
  id: `it-${t.trackId}`,
  title: t.trackName || 'Titre inconnu',
  artist: t.artistName || 'Artiste inconnu',
  album: t.collectionName || 'Album inconnu',
  // artwork : agrandir la miniature iTunes (100→300px)
  coverUrl: t.artworkUrl100
    ? t.artworkUrl100.replace('100x100bb', '300x300bb').replace('100x100', '300x300')
    : FALLBACK_COVER,
  previewUrl: t.previewUrl || '',
  duration: 30,
});

// ─── DEEZER ──────────────────────────────────────────────────────────────────

const fetchDeezer = async (path: string): Promise<any> => {
  try {
    const r = await fetchWithTimeout(`${DEEZER_BASE}${path}`, 3000);
    if (r.ok) return r.json();
  } catch (_) {}
  return null;
};

const deezerSearch = async (q: string, limit = 20): Promise<Track[]> => {
  const json = await fetchDeezer(`/search?q=${encodeURIComponent(q)}&limit=${limit}`);
  if (!json?.data) return [];
  return json.data.filter((t: any) => t.preview).map(mapDeezerTrack);
};

const deezerChart = async (genreId: number): Promise<Track[]> => {
  const json = await fetchDeezer(`/chart/${genreId}/tracks`);
  if (!json?.data) return [];
  return json.data.filter((t: any) => t.preview).map(mapDeezerTrack);
};

const deezerRadio = async (genreId: number): Promise<Track[]> => {
  const json = await fetchDeezer(`/radio/${genreId}/tracks`);
  if (!json?.data) return [];
  return json.data.filter((t: any) => t.preview).map(mapDeezerTrack);
};

// ─── ITUNES ──────────────────────────────────────────────────────────────────
// Utilisé comme fallback quand Deezer est inaccessible (firewall scolaire, etc.)
// L'API iTunes ne nécessite aucune clé et son CDN (apple.com) est rarement bloqué.

/** Requêtes iTunes spécifiques à chaque humeur */
const ITUNES_MOOD_QUERIES: Record<string, string[]> = {
  joyeux: [
    'happy pharrell williams',
    'uptown funk mark ronson',
    'good as hell lizzo',
    'dynamite bts',
    'levitating dua lipa',
  ],
  nostalgique: [
    'africa toto',
    'take on me aha',
    'dont you forget about me simple minds',
    'bohemian rhapsody queen',
    'sweet child o mine guns roses',
  ],
  energique: [
    'lose yourself eminem',
    'eye of the tiger survivor',
    'thunderstruck acdc',
    'believer imagine dragons',
    'warriors imagine dragons',
  ],
  melancolique: [
    'sound of silence simon garfunkel',
    'hurt johnny cash',
    'someone like you adele',
    'fix you coldplay',
    'the night we met lord huron',
  ],
  concentre: [
    'lofi hip hop study beats',
    'chillhop music study',
    'lofi beats to study',
    'jazz lofi instrumental',
    'ambient focus music',
    'lofi chill background',
    'piano study music',
    'experience ludovico einaudi',
    'river flows in you yiruma',
    'time hans zimmer instrumental',
  ],
  festif: [
    'dancing queen abba',
    'staying alive bee gees',
    'i will survive gloria gaynor',
    'wake me up avicii',
    'levels avicii',
  ],
  amoureux: [
    'perfect ed sheeran',
    'all of me john legend',
    'a thousand years christina perri',
    'thinking out loud ed sheeran',
    'cant help falling in love elvis',
  ],
  colerique: [
    'killing in the name rage against machine',
    'in the end linkin park',
    'break stuff limp bizkit',
    'numb linkin park',
    'chop suey system of a down',
  ],
  fatigue: [
    'lofi sleep music calm',
    'ambient sleep relaxing',
    'weightless marconi union',
    'lofi chill beats rain',
    'slow jazz relaxing night',
    'breathe pink floyd',
    'soft ambient music calm',
    'chillhop sleepy beats',
  ],
  tobyfox: [
    'undertale soundtrack toby fox',
    'deltarune chapter 2 music',
    'megalovania undertale',
    'hopes and dreams undertale',
    'sans undertale music',
    'undertale ruins theme',
    'deltarune a cyber world',
    'undertale save the world',
    'deltarune ralsei music',
    'berdly deltarune music',
    'undertale waterfall theme',
    'undertale snowdin theme',
    'undertale fallen down',
    'deltarune big shot',
    'undertale spider dance',
    'toby fox music game',
  ],
};

const itunesSearch = async (term: string, limit = 20): Promise<Track[]> => {
  try {
    const url = `${ITUNES_BASE}/search?term=${encodeURIComponent(term)}&media=music&limit=${limit}&country=fr`;
    const r = await fetchWithTimeout(url, 3000);
    if (!r.ok) return [];
    const json = await r.json();
    if (!json?.results) return [];
    return json.results
      .filter((t: any) => t.previewUrl && t.trackId)
      .map(mapItunesTrack);
  } catch (_) {
    return [];
  }
};

/** Fetch iTunes pour plusieurs requêtes en parallèle et retourne les résultats fusionnés */
const itunesMultiSearch = async (queries: string[], perQuery = 5): Promise<Track[]> => {
  const results = await Promise.all(queries.map(q => itunesSearch(q, perQuery)));
  const seen = new Set<string>();
  const merged: Track[] = [];
  for (const tracks of results) {
    for (const t of tracks) {
      const key = `${t.title.toLowerCase()}-${t.artist.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(t);
      }
    }
  }
  return merged;
};

// ─── FALLBACK LOCAL (dernier recours) ────────────────────────────────────────
// Utilisé uniquement si Deezer ET iTunes sont inaccessibles.
// Covers Unsplash variées
const COV = [
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300',
  'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=300',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300',
  'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=300',
  'https://images.unsplash.com/photo-1526218626217-dc65a29bb444?w=300',
  'https://images.unsplash.com/photo-1487180142328-0c4e37023af5?w=300',
  'https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?w=300',
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300',
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300',
  'https://images.unsplash.com/photo-1437419764061-2473afe69fc2?w=300',
  'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300',
  'https://images.unsplash.com/photo-1445251836269-d158e0071760?w=300',
  'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=300',
  'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=300',
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300',
  'https://images.unsplash.com/photo-1481110403429-74d47c412617?w=300',
  'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=300',
  'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300',
];

// Sons SoundHelix — 16 fichiers distincts, utilisés en dernier recours
const SH = (n: number) =>
  `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${Math.max(1, Math.min(16, n))}.mp3`;

const LOCAL_FALLBACK: Record<string, Omit<Track, 'id'>[]> = {
  joyeux: [
    { title: 'Happy', artist: 'Pharrell Williams', album: 'Despicable Me 2 OST', coverUrl: COV[0], previewUrl: SH(1), duration: 30 },
    { title: "Can't Stop the Feeling!", artist: 'Justin Timberlake', album: 'Trolls OST', coverUrl: COV[1], previewUrl: SH(2), duration: 30 },
    { title: 'Shake It Off', artist: 'Taylor Swift', album: '1989', coverUrl: COV[2], previewUrl: SH(3), duration: 30 },
    { title: 'Uptown Funk', artist: 'Mark Ronson ft. Bruno Mars', album: 'Uptown Special', coverUrl: COV[3], previewUrl: SH(4), duration: 30 },
    { title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', coverUrl: COV[4], previewUrl: SH(5), duration: 30 },
    { title: 'Levitating', artist: 'Dua Lipa', album: 'Future Nostalgia', coverUrl: COV[5], previewUrl: SH(6), duration: 30 },
    { title: 'Good as Hell', artist: 'Lizzo', album: 'Cuz I Love You', coverUrl: COV[6], previewUrl: SH(7), duration: 30 },
    { title: 'Dynamite', artist: 'BTS', album: 'Dynamite', coverUrl: COV[7], previewUrl: SH(8), duration: 30 },
    { title: 'Watermelon Sugar', artist: 'Harry Styles', album: 'Fine Line', coverUrl: COV[8], previewUrl: SH(9), duration: 30 },
    { title: 'Sunflower', artist: 'Post Malone & Swae Lee', album: 'Spider-Man OST', coverUrl: COV[9], previewUrl: SH(10), duration: 30 },
    { title: 'Golden Hour', artist: 'JVKE', album: 'this is what falling in love feels like', coverUrl: COV[10], previewUrl: SH(11), duration: 30 },
    { title: 'Flowers', artist: 'Miley Cyrus', album: 'Endless Summer Vacation', coverUrl: COV[11], previewUrl: SH(12), duration: 30 },
    { title: 'Anti-Hero', artist: 'Taylor Swift', album: 'Midnights', coverUrl: COV[12], previewUrl: SH(13), duration: 30 },
    { title: 'As It Was', artist: 'Harry Styles', album: "Harry's House", coverUrl: COV[13], previewUrl: SH(14), duration: 30 },
    { title: 'Cruel Summer', artist: 'Taylor Swift', album: 'Lover', coverUrl: COV[14], previewUrl: SH(15), duration: 30 },
    { title: 'Espresso', artist: 'Sabrina Carpenter', album: "Short n' Sweet", coverUrl: COV[15], previewUrl: SH(16), duration: 30 },
    { title: 'Paint The Town Red', artist: 'Doja Cat', album: 'Scarlet', coverUrl: COV[16], previewUrl: SH(1), duration: 30 },
    { title: 'Vampire', artist: 'Olivia Rodrigo', album: 'GUTS', coverUrl: COV[17], previewUrl: SH(2), duration: 30 },
    { title: 'Die For You', artist: 'The Weeknd', album: 'Starboy', coverUrl: COV[18], previewUrl: SH(3), duration: 30 },
    { title: 'Peaches', artist: 'Justin Bieber', album: 'Justice', coverUrl: COV[19], previewUrl: SH(4), duration: 30 },
  ],
  nostalgique: [
    { title: 'Take On Me', artist: 'A-ha', album: 'Hunting High and Low', coverUrl: COV[4], previewUrl: SH(5), duration: 30 },
    { title: "Don't You (Forget About Me)", artist: 'Simple Minds', album: 'The Breakfast Club OST', coverUrl: COV[5], previewUrl: SH(6), duration: 30 },
    { title: 'Africa', artist: 'Toto', album: 'Toto IV', coverUrl: COV[6], previewUrl: SH(7), duration: 30 },
    { title: 'Everybody Wants to Rule the World', artist: 'Tears for Fears', album: 'Songs from the Big Chair', coverUrl: COV[7], previewUrl: SH(8), duration: 30 },
    { title: "Sweet Child O' Mine", artist: "Guns N' Roses", album: 'Appetite for Destruction', coverUrl: COV[8], previewUrl: SH(9), duration: 30 },
    { title: 'Every Breath You Take', artist: 'The Police', album: 'Synchronicity', coverUrl: COV[9], previewUrl: SH(10), duration: 30 },
    { title: "Don't Stop Believin'", artist: 'Journey', album: 'Escape', coverUrl: COV[10], previewUrl: SH(11), duration: 30 },
    { title: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera', coverUrl: COV[11], previewUrl: SH(12), duration: 30 },
    { title: 'Hotel California', artist: 'Eagles', album: 'Hotel California', coverUrl: COV[12], previewUrl: SH(13), duration: 30 },
    { title: 'With or Without You', artist: 'U2', album: 'The Joshua Tree', coverUrl: COV[13], previewUrl: SH(14), duration: 30 },
    { title: 'Purple Rain', artist: 'Prince', album: 'Purple Rain', coverUrl: COV[14], previewUrl: SH(15), duration: 30 },
    { title: 'Time After Time', artist: 'Cyndi Lauper', album: "She's So Unusual", coverUrl: COV[15], previewUrl: SH(16), duration: 30 },
    { title: 'Here Comes the Sun', artist: 'The Beatles', album: 'Abbey Road', coverUrl: COV[16], previewUrl: SH(1), duration: 30 },
    { title: 'Let It Be', artist: 'The Beatles', album: 'Let It Be', coverUrl: COV[17], previewUrl: SH(2), duration: 30 },
    { title: 'Wish You Were Here', artist: 'Pink Floyd', album: 'Wish You Were Here', coverUrl: COV[18], previewUrl: SH(3), duration: 30 },
    { title: 'Come On Eileen', artist: 'Dexys Midnight Runners', album: 'Too-Rye-Ay', coverUrl: COV[19], previewUrl: SH(4), duration: 30 },
    { title: 'Girls Just Want to Have Fun', artist: 'Cyndi Lauper', album: "She's So Unusual", coverUrl: COV[0], previewUrl: SH(5), duration: 30 },
    { title: 'Dancing in the Dark', artist: 'Bruce Springsteen', album: 'Born in the U.S.A.', coverUrl: COV[1], previewUrl: SH(6), duration: 30 },
    { title: 'Stairway to Heaven', artist: 'Led Zeppelin', album: 'Led Zeppelin IV', coverUrl: COV[2], previewUrl: SH(7), duration: 30 },
    { title: 'Eye of the Tiger', artist: 'Survivor', album: 'Eye of the Tiger', coverUrl: COV[3], previewUrl: SH(8), duration: 30 },
  ],
  energique: [
    { title: 'Lose Yourself', artist: 'Eminem', album: '8 Mile OST', coverUrl: COV[8], previewUrl: SH(9), duration: 30 },
    { title: 'Eye of the Tiger', artist: 'Survivor', album: 'Eye of the Tiger', coverUrl: COV[9], previewUrl: SH(10), duration: 30 },
    { title: 'Thunderstruck', artist: 'AC/DC', album: 'The Razors Edge', coverUrl: COV[10], previewUrl: SH(11), duration: 30 },
    { title: 'We Will Rock You', artist: 'Queen', album: 'News of the World', coverUrl: COV[11], previewUrl: SH(12), duration: 30 },
    { title: 'Welcome to the Jungle', artist: "Guns N' Roses", album: 'Appetite for Destruction', coverUrl: COV[12], previewUrl: SH(13), duration: 30 },
    { title: 'Master of Puppets', artist: 'Metallica', album: 'Master of Puppets', coverUrl: COV[13], previewUrl: SH(14), duration: 30 },
    { title: 'Till I Collapse', artist: 'Eminem', album: 'The Eminem Show', coverUrl: COV[14], previewUrl: SH(15), duration: 30 },
    { title: 'Power', artist: 'Kanye West', album: 'My Beautiful Dark Twisted Fantasy', coverUrl: COV[15], previewUrl: SH(16), duration: 30 },
    { title: 'Radioactive', artist: 'Imagine Dragons', album: 'Night Visions', coverUrl: COV[16], previewUrl: SH(1), duration: 30 },
    { title: 'Warriors', artist: 'Imagine Dragons', album: 'League of Legends OST', coverUrl: COV[17], previewUrl: SH(2), duration: 30 },
    { title: 'Believer', artist: 'Imagine Dragons', album: 'Evolve', coverUrl: COV[18], previewUrl: SH(3), duration: 30 },
    { title: 'Run Boy Run', artist: 'Woodkid', album: 'The Golden Age', coverUrl: COV[19], previewUrl: SH(4), duration: 30 },
    { title: 'HUMBLE.', artist: 'Kendrick Lamar', album: 'DAMN.', coverUrl: COV[0], previewUrl: SH(5), duration: 30 },
    { title: 'Pump It', artist: 'The Black Eyed Peas', album: 'Monkey Business', coverUrl: COV[1], previewUrl: SH(6), duration: 30 },
    { title: 'Stronger', artist: 'Kanye West', album: 'Graduation', coverUrl: COV[2], previewUrl: SH(7), duration: 30 },
    { title: "Can't Hold Us", artist: 'Macklemore & Ryan Lewis', album: 'The Heist', coverUrl: COV[3], previewUrl: SH(8), duration: 30 },
    { title: 'Faded', artist: 'Alan Walker', album: 'Different World', coverUrl: COV[4], previewUrl: SH(9), duration: 30 },
    { title: 'Without Me', artist: 'Halsey', album: 'Manic', coverUrl: COV[5], previewUrl: SH(10), duration: 30 },
    { title: 'Jump', artist: 'Van Halen', album: '1984', coverUrl: COV[6], previewUrl: SH(11), duration: 30 },
    { title: 'Killing in the Name', artist: 'Rage Against the Machine', album: 'Rage Against the Machine', coverUrl: COV[7], previewUrl: SH(12), duration: 30 },
  ],
  melancolique: [
    { title: 'The Sound of Silence', artist: 'Simon & Garfunkel', album: 'Wednesday Morning, 3 A.M.', coverUrl: COV[12], previewUrl: SH(13), duration: 30 },
    { title: 'Hurt', artist: 'Johnny Cash', album: 'American IV', coverUrl: COV[13], previewUrl: SH(14), duration: 30 },
    { title: 'Mad World', artist: 'Gary Jules', album: 'Donnie Darko OST', coverUrl: COV[14], previewUrl: SH(15), duration: 30 },
    { title: 'Someone Like You', artist: 'Adele', album: '21', coverUrl: COV[15], previewUrl: SH(16), duration: 30 },
    { title: 'Fix You', artist: 'Coldplay', album: 'X&Y', coverUrl: COV[16], previewUrl: SH(1), duration: 30 },
    { title: 'Let Her Go', artist: 'Passenger', album: 'All the Little Lights', coverUrl: COV[17], previewUrl: SH(2), duration: 30 },
    { title: 'Creep', artist: 'Radiohead', album: 'Pablo Honey', coverUrl: COV[18], previewUrl: SH(3), duration: 30 },
    { title: 'Everybody Hurts', artist: 'R.E.M.', album: 'Automatic for the People', coverUrl: COV[19], previewUrl: SH(4), duration: 30 },
    { title: 'Hallelujah', artist: 'Jeff Buckley', album: 'Grace', coverUrl: COV[0], previewUrl: SH(5), duration: 30 },
    { title: 'The Night We Met', artist: 'Lord Huron', album: 'Strange Trails', coverUrl: COV[1], previewUrl: SH(6), duration: 30 },
    { title: 'Wicked Game', artist: 'Chris Isaak', album: 'Heart Shaped World', coverUrl: COV[2], previewUrl: SH(7), duration: 30 },
    { title: 'Tears in Heaven', artist: 'Eric Clapton', album: 'Rush OST', coverUrl: COV[3], previewUrl: SH(8), duration: 30 },
    { title: 'Skinny Love', artist: 'Bon Iver', album: 'For Emma, Forever Ago', coverUrl: COV[4], previewUrl: SH(9), duration: 30 },
    { title: 'Yesterday', artist: 'The Beatles', album: 'Help!', coverUrl: COV[5], previewUrl: SH(10), duration: 30 },
    { title: 'The Scientist', artist: 'Coldplay', album: 'A Rush of Blood to the Head', coverUrl: COV[6], previewUrl: SH(11), duration: 30 },
    { title: 'Losing My Religion', artist: 'R.E.M.', album: 'Out of Time', coverUrl: COV[7], previewUrl: SH(12), duration: 30 },
    { title: 'Black', artist: 'Pearl Jam', album: 'Ten', coverUrl: COV[8], previewUrl: SH(13), duration: 30 },
    { title: 'Nothing Compares 2 U', artist: "Sinead O'Connor", album: "I Do Not Want What I Haven't Got", coverUrl: COV[9], previewUrl: SH(14), duration: 30 },
    { title: 'Breathe (2 AM)', artist: 'Anna Nalick', album: 'Wreck of the Day', coverUrl: COV[10], previewUrl: SH(15), duration: 30 },
    { title: 'Skinny', artist: 'Billie Eilish', album: 'Hit Me Hard and Soft', coverUrl: COV[11], previewUrl: SH(16), duration: 30 },
  ],
  concentre: [
    { title: 'Weightless', artist: 'Marconi Union', album: 'Weightless', coverUrl: COV[16], previewUrl: SH(1), duration: 30 },
    { title: 'Experience', artist: 'Ludovico Einaudi', album: 'In a Time Lapse', coverUrl: COV[17], previewUrl: SH(2), duration: 30 },
    { title: 'Nuvole Bianche', artist: 'Ludovico Einaudi', album: 'Una Mattina', coverUrl: COV[18], previewUrl: SH(3), duration: 30 },
    { title: 'Gymnopédie No. 1', artist: 'Erik Satie', album: 'Gymnopédies', coverUrl: COV[19], previewUrl: SH(4), duration: 30 },
    { title: 'Time', artist: 'Hans Zimmer', album: 'Inception OST', coverUrl: COV[0], previewUrl: SH(5), duration: 30 },
    { title: 'Interstellar Main Theme', artist: 'Hans Zimmer', album: 'Interstellar OST', coverUrl: COV[1], previewUrl: SH(6), duration: 30 },
    { title: 'River Flows in You', artist: 'Yiruma', album: 'First Love', coverUrl: COV[2], previewUrl: SH(7), duration: 30 },
    { title: "Comptine d'un autre été", artist: 'Yann Tiersen', album: 'Amélie OST', coverUrl: COV[3], previewUrl: SH(8), duration: 30 },
    { title: 'Lofi Hip Hop Study Mix', artist: 'Lo-Fi Beats', album: 'Study Session Vol.1', coverUrl: COV[4], previewUrl: SH(9), duration: 30 },
    { title: 'Brain Food', artist: 'Chillhop Music', album: 'Chillhop Essentials', coverUrl: COV[5], previewUrl: SH(10), duration: 30 },
    { title: 'Snowfall', artist: 'Øneheart & reidenshi', album: 'Snowfall', coverUrl: COV[6], previewUrl: SH(11), duration: 30 },
    { title: 'Midnight City', artist: 'M83', album: "Hurry Up, We're Dreaming", coverUrl: COV[7], previewUrl: SH(12), duration: 30 },
    { title: 'Clair de Lune', artist: 'Claude Debussy', album: 'Suite bergamasque', coverUrl: COV[8], previewUrl: SH(13), duration: 30 },
    { title: 'The Rain', artist: 'Yiruma', album: 'From the Yellow Room', coverUrl: COV[9], previewUrl: SH(14), duration: 30 },
    { title: 'Electric Feel', artist: 'MGMT', album: 'Oracular Spectacular', coverUrl: COV[10], previewUrl: SH(15), duration: 30 },
    { title: 'Night Jazz Study', artist: 'Study Jazz', album: 'Midnight Focus', coverUrl: COV[11], previewUrl: SH(16), duration: 30 },
    { title: 'Dreamy', artist: 'Idealism', album: 'Lofi Chill', coverUrl: COV[12], previewUrl: SH(1), duration: 30 },
    { title: 'Oblivion', artist: 'Grimes', album: 'Visions', coverUrl: COV[13], previewUrl: SH(2), duration: 30 },
    { title: 'Autumn Jazz', artist: 'Coffee Shop Jazz', album: 'Rainy Day Study', coverUrl: COV[14], previewUrl: SH(3), duration: 30 },
    { title: 'Focus (instrumental)', artist: 'Study Beats', album: 'Deep Work', coverUrl: COV[15], previewUrl: SH(4), duration: 30 },
  ],
  festif: [
    { title: 'Dancing Queen', artist: 'ABBA', album: 'Arrival', coverUrl: COV[0], previewUrl: SH(5), duration: 30 },
    { title: "Stayin' Alive", artist: 'Bee Gees', album: 'Saturday Night Fever OST', coverUrl: COV[1], previewUrl: SH(6), duration: 30 },
    { title: 'I Will Survive', artist: 'Gloria Gaynor', album: 'Love Tracks', coverUrl: COV[2], previewUrl: SH(7), duration: 30 },
    { title: 'Party Rock Anthem', artist: 'LMFAO', album: 'Sorry for Party Rocking', coverUrl: COV[3], previewUrl: SH(8), duration: 30 },
    { title: 'We Found Love', artist: 'Rihanna ft. Calvin Harris', album: 'Talk That Talk', coverUrl: COV[4], previewUrl: SH(9), duration: 30 },
    { title: "Don't Stop the Music", artist: 'Rihanna', album: 'Good Girl Gone Bad', coverUrl: COV[5], previewUrl: SH(10), duration: 30 },
    { title: 'Titanium', artist: 'David Guetta ft. Sia', album: 'Nothing but the Beat', coverUrl: COV[6], previewUrl: SH(11), duration: 30 },
    { title: 'Lean On', artist: 'Major Lazer & DJ Snake ft. MØ', album: 'Peace Is the Mission', coverUrl: COV[7], previewUrl: SH(12), duration: 30 },
    { title: 'Wake Me Up', artist: 'Avicii', album: 'True', coverUrl: COV[8], previewUrl: SH(13), duration: 30 },
    { title: 'Levels', artist: 'Avicii', album: 'True (Avicii by Avicii)', coverUrl: COV[9], previewUrl: SH(14), duration: 30 },
    { title: 'Turn Down for What', artist: 'DJ Snake & Lil Jon', album: 'Turn Down for What', coverUrl: COV[10], previewUrl: SH(15), duration: 30 },
    { title: 'Silence', artist: 'Marshmello ft. Khalid', album: 'Silence', coverUrl: COV[11], previewUrl: SH(16), duration: 30 },
    { title: 'Mr. Brightside', artist: 'The Killers', album: 'Hot Fuss', coverUrl: COV[12], previewUrl: SH(1), duration: 30 },
    { title: "Livin' on a Prayer", artist: 'Bon Jovi', album: 'Slippery When Wet', coverUrl: COV[13], previewUrl: SH(2), duration: 30 },
    { title: 'Sandstorm', artist: 'Darude', album: 'Before the Storm', coverUrl: COV[14], previewUrl: SH(3), duration: 30 },
    { title: 'Jump Around', artist: 'House of Pain', album: 'House of Pain', coverUrl: COV[15], previewUrl: SH(4), duration: 30 },
    { title: 'Thunder', artist: 'Imagine Dragons', album: 'Evolve', coverUrl: COV[16], previewUrl: SH(5), duration: 30 },
    { title: 'Drag Me Down', artist: 'One Direction', album: 'Made in the A.M.', coverUrl: COV[17], previewUrl: SH(6), duration: 30 },
    { title: 'Born to Run', artist: 'Bruce Springsteen', album: 'Born to Run', coverUrl: COV[18], previewUrl: SH(7), duration: 30 },
    { title: 'Take On Me', artist: 'A-ha', album: 'Hunting High and Low', coverUrl: COV[19], previewUrl: SH(8), duration: 30 },
  ],
  amoureux: [
    { title: 'Perfect', artist: 'Ed Sheeran', album: 'Divide', coverUrl: COV[1], previewUrl: SH(9), duration: 30 },
    { title: 'All of Me', artist: 'John Legend', album: 'Love in the Future', coverUrl: COV[2], previewUrl: SH(10), duration: 30 },
    { title: 'Thinking Out Loud', artist: 'Ed Sheeran', album: 'X', coverUrl: COV[3], previewUrl: SH(11), duration: 30 },
    { title: 'A Thousand Years', artist: 'Christina Perri', album: 'The Twilight Saga: Breaking Dawn OST', coverUrl: COV[4], previewUrl: SH(12), duration: 30 },
    { title: "Can't Help Falling in Love", artist: 'Elvis Presley', album: 'Blue Hawaii OST', coverUrl: COV[5], previewUrl: SH(13), duration: 30 },
    { title: 'Make You Feel My Love', artist: 'Adele', album: '19', coverUrl: COV[6], previewUrl: SH(14), duration: 30 },
    { title: 'Unchained Melody', artist: 'The Righteous Brothers', album: 'Just Once in My Life', coverUrl: COV[7], previewUrl: SH(15), duration: 30 },
    { title: 'My Heart Will Go On', artist: 'Celine Dion', album: 'Titanic OST', coverUrl: COV[8], previewUrl: SH(16), duration: 30 },
    { title: 'La Vie en Rose', artist: 'Edith Piaf', album: 'La Vie en Rose', coverUrl: COV[9], previewUrl: SH(1), duration: 30 },
    { title: 'I Will Always Love You', artist: 'Whitney Houston', album: 'The Bodyguard OST', coverUrl: COV[10], previewUrl: SH(2), duration: 30 },
    { title: 'You Are the Reason', artist: 'Calum Scott', album: 'Only Human', coverUrl: COV[11], previewUrl: SH(3), duration: 30 },
    { title: 'Lover', artist: 'Taylor Swift', album: 'Lover', coverUrl: COV[12], previewUrl: SH(4), duration: 30 },
    { title: 'Falling', artist: 'Harry Styles', album: 'Fine Line', coverUrl: COV[13], previewUrl: SH(5), duration: 30 },
    { title: 'Kiss Me', artist: 'Ed Sheeran', album: '+', coverUrl: COV[14], previewUrl: SH(6), duration: 30 },
    { title: 'From the Start', artist: 'Laufey', album: 'Bewitched', coverUrl: COV[15], previewUrl: SH(7), duration: 30 },
    { title: 'Hold Me While You Wait', artist: 'Lewis Capaldi', album: 'Divinely Uninspired to a Hellish Extent', coverUrl: COV[16], previewUrl: SH(8), duration: 30 },
    { title: 'Bloom', artist: 'The Paper Kites', album: 'twelvefour', coverUrl: COV[17], previewUrl: SH(9), duration: 30 },
    { title: 'Endless Love', artist: 'Diana Ross & Lionel Richie', album: 'Endless Love OST', coverUrl: COV[18], previewUrl: SH(10), duration: 30 },
    { title: 'Golden Hour', artist: 'JVKE', album: 'this is what falling in love feels like', coverUrl: COV[19], previewUrl: SH(11), duration: 30 },
    { title: 'Die For You', artist: 'The Weeknd', album: 'Starboy', coverUrl: COV[0], previewUrl: SH(12), duration: 30 },
  ],
  colerique: [
    { title: 'Killing in the Name', artist: 'Rage Against the Machine', album: 'Rage Against the Machine', coverUrl: COV[7], previewUrl: SH(13), duration: 30 },
    { title: 'Break Stuff', artist: 'Limp Bizkit', album: 'Significant Other', coverUrl: COV[8], previewUrl: SH(14), duration: 30 },
    { title: 'Last Resort', artist: 'Papa Roach', album: 'Infest', coverUrl: COV[9], previewUrl: SH(15), duration: 30 },
    { title: 'In the End', artist: 'Linkin Park', album: 'Hybrid Theory', coverUrl: COV[10], previewUrl: SH(16), duration: 30 },
    { title: 'Chop Suey!', artist: 'System of a Down', album: 'Toxicity', coverUrl: COV[11], previewUrl: SH(1), duration: 30 },
    { title: 'Bodies', artist: 'Drowning Pool', album: 'Sinner', coverUrl: COV[12], previewUrl: SH(2), duration: 30 },
    { title: 'Down with the Sickness', artist: 'Disturbed', album: 'The Sickness', coverUrl: COV[13], previewUrl: SH(3), duration: 30 },
    { title: 'Numb', artist: 'Linkin Park', album: 'Meteora', coverUrl: COV[14], previewUrl: SH(4), duration: 30 },
    { title: 'One Step Closer', artist: 'Linkin Park', album: 'Hybrid Theory', coverUrl: COV[15], previewUrl: SH(5), duration: 30 },
    { title: 'Given Up', artist: 'Linkin Park', album: 'Minutes to Midnight', coverUrl: COV[16], previewUrl: SH(6), duration: 30 },
    { title: 'American Idiot', artist: 'Green Day', album: 'American Idiot', coverUrl: COV[17], previewUrl: SH(7), duration: 30 },
    { title: 'Walk', artist: 'Pantera', album: 'Vulgar Display of Power', coverUrl: COV[18], previewUrl: SH(8), duration: 30 },
    { title: 'Schism', artist: 'Tool', album: 'Lateralus', coverUrl: COV[19], previewUrl: SH(9), duration: 30 },
    { title: 'Freak on a Leash', artist: 'Korn', album: 'Follow the Leader', coverUrl: COV[0], previewUrl: SH(10), duration: 30 },
    { title: 'Crawling', artist: 'Linkin Park', album: 'Hybrid Theory', coverUrl: COV[1], previewUrl: SH(11), duration: 30 },
    { title: 'My Own Summer (Shove It)', artist: 'Deftones', album: 'Around the Fur', coverUrl: COV[2], previewUrl: SH(12), duration: 30 },
    { title: 'Master of Puppets', artist: 'Metallica', album: 'Master of Puppets', coverUrl: COV[3], previewUrl: SH(13), duration: 30 },
    { title: 'Run to the Hills', artist: 'Iron Maiden', album: 'The Number of the Beast', coverUrl: COV[4], previewUrl: SH(14), duration: 30 },
    { title: 'Pretty Fly (For a White Guy)', artist: 'The Offspring', album: 'Americana', coverUrl: COV[5], previewUrl: SH(15), duration: 30 },
    { title: 'Holiday', artist: 'Green Day', album: 'American Idiot', coverUrl: COV[6], previewUrl: SH(16), duration: 30 },
  ],
  fatigue: [
    { title: 'Breathe', artist: 'Pink Floyd', album: 'The Dark Side of the Moon', coverUrl: COV[11], previewUrl: SH(1), duration: 30 },
    { title: 'Landslide', artist: 'Fleetwood Mac', album: 'Fleetwood Mac', coverUrl: COV[12], previewUrl: SH(2), duration: 30 },
    { title: 'Fast Car', artist: 'Tracy Chapman', album: 'Tracy Chapman', coverUrl: COV[13], previewUrl: SH(3), duration: 30 },
    { title: 'The Sound of Silence', artist: 'Simon & Garfunkel', album: 'Wednesday Morning, 3 A.M.', coverUrl: COV[14], previewUrl: SH(4), duration: 30 },
    { title: "California Dreamin'", artist: 'The Mamas & the Papas', album: 'If You Can Believe Your Eyes and Ears', coverUrl: COV[15], previewUrl: SH(5), duration: 30 },
    { title: 'Comfortably Numb', artist: 'Pink Floyd', album: 'The Wall', coverUrl: COV[16], previewUrl: SH(6), duration: 30 },
    { title: "Bridge Over Troubled Water", artist: 'Simon & Garfunkel', album: 'Bridge Over Troubled Water', coverUrl: COV[17], previewUrl: SH(7), duration: 30 },
    { title: 'Let Her Go', artist: 'Passenger', album: 'All the Little Lights', coverUrl: COV[18], previewUrl: SH(8), duration: 30 },
    { title: 'Lost Boy', artist: 'Ruth B.', album: 'The Intro', coverUrl: COV[19], previewUrl: SH(9), duration: 30 },
    { title: 'All I Want', artist: 'Kodaline', album: 'In a Perfect World', coverUrl: COV[0], previewUrl: SH(10), duration: 30 },
    { title: 'Falling Slowly', artist: 'Glen Hansard & Markéta Irglová', album: 'Once OST', coverUrl: COV[1], previewUrl: SH(11), duration: 30 },
    { title: 'Morning Has Broken', artist: 'Cat Stevens', album: 'Teaser and the Firecat', coverUrl: COV[2], previewUrl: SH(12), duration: 30 },
    { title: 'Asleep', artist: 'The Smiths', album: 'The Queen Is Dead', coverUrl: COV[3], previewUrl: SH(13), duration: 30 },
    { title: 'Grow Old with Me', artist: 'John Lennon', album: 'Milk and Honey', coverUrl: COV[4], previewUrl: SH(14), duration: 30 },
    { title: 'Banana Pancakes', artist: 'Jack Johnson', album: 'In Between Dreams', coverUrl: COV[5], previewUrl: SH(15), duration: 30 },
    { title: "Turn! Turn! Turn!", artist: 'The Byrds', album: "Turn! Turn! Turn!", coverUrl: COV[6], previewUrl: SH(16), duration: 30 },
    { title: 'Lullaby', artist: 'Sigala & James Arthur', album: 'Brighter Days', coverUrl: COV[7], previewUrl: SH(1), duration: 30 },
    { title: '1000 Years', artist: 'Christina Perri', album: 'The Twilight Saga: Breaking Dawn OST', coverUrl: COV[8], previewUrl: SH(2), duration: 30 },
    { title: 'Weightless', artist: 'Marconi Union', album: 'Weightless', coverUrl: COV[9], previewUrl: SH(3), duration: 30 },
    { title: 'Wish You Were Here', artist: 'Pink Floyd', album: 'Wish You Were Here', coverUrl: COV[10], previewUrl: SH(4), duration: 30 },
  ],
};

// ─── CATALOGUE UNDERTALE / DELTARUNE ─────────────────────────────────────────
const UNDERTALE_TRACKS: Record<string, Omit<Track, 'id'>[]> = {
  joyeux: [
    { title: 'Hopes and Dreams', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[0], previewUrl: `${UDR}/mus_reunited.ogg`, duration: 180 },
    { title: 'Field of Hopes and Dreams', artist: 'Toby Fox', album: 'Deltarune OST', coverUrl: COV[1], previewUrl: `${UDR}/mus_town.ogg`, duration: 161 },
    { title: 'Dogsong', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[2], previewUrl: `${UDR}/mus_dogsong.ogg`, duration: 37 },
    { title: 'Temmie Village', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[3], previewUrl: `${UDR}/mus_temvillage.ogg`, duration: 57 },
    { title: 'Dating Start!', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[4], previewUrl: `${UDR}/mus_date.ogg`, duration: 116 },
    { title: 'sans.', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[5], previewUrl: `${UDR}/mus_sansdate.ogg`, duration: 50 },
    { title: 'Shop Theme', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[6], previewUrl: `${UDR}/mus_shop.ogg`, duration: 60 },
    { title: 'Snowy', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[7], previewUrl: `${UDR}/mus_snowy.ogg`, duration: 104 },
    { title: 'Happy Town', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[8], previewUrl: `${UDR}/mus_happytown.ogg`, duration: 115 },
    { title: 'Bird That Carries You Over River', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[9], previewUrl: `${UDR}/mus_birdnoise.ogg`, duration: 44 },
    { title: 'Hotel', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[10], previewUrl: `${UDR}/mus_hotel.ogg`, duration: 130 },
    { title: 'Reunited', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[11], previewUrl: `${UDR}/mus_reunited.ogg`, duration: 284 },
    { title: 'Dating Fight!', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[12], previewUrl: `${UDR}/mus_date_fight.ogg`, duration: 120 },
    { title: 'Chill', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[13], previewUrl: `${UDR}/mus_birdsong.ogg`, duration: 56 },
    { title: 'Hip Shop', artist: 'Toby Fox', album: 'Deltarune OST', coverUrl: COV[14], previewUrl: `${UDR}/mus_coolbeat.ogg`, duration: 155 },
    { title: 'Dance of Dog', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[15], previewUrl: `${UDR}/mus_dance_of_dog.ogg`, duration: 45 },
    { title: 'Dogmeander', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[16], previewUrl: `${UDR}/mus_dogmeander.ogg`, duration: 55 },
    { title: 'Ooo', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[17], previewUrl: `${UDR}/mus_birdnoise.ogg`, duration: 14 },
    { title: 'Core Approach', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[18], previewUrl: `${UDR}/mus_coretransition.ogg`, duration: 120 },
    { title: 'A Town Called Hometown', artist: 'Toby Fox', album: 'Deltarune OST', coverUrl: COV[19], previewUrl: `${UDR}/mus_town.ogg`, duration: 110 },
  ],
  nostalgique: [
    { title: 'Once Upon a Time', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[4], previewUrl: `${UDR}/mus_story.ogg`, duration: 88 },
    { title: 'Memory', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[5], previewUrl: `${UDR}/mus_musicbox.ogg`, duration: 75 },
    { title: 'Home', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[6], previewUrl: `${UDR}/mus_house1.ogg`, duration: 123 },
    { title: 'Quiet Water', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[7], previewUrl: `${UDR}/mus_waterquiet.ogg`, duration: 122 },
    { title: 'Lost Girl', artist: 'Toby Fox', album: 'Deltarune OST', coverUrl: COV[8], previewUrl: `${UDR}/mus_ruinspiano.ogg`, duration: 110 },
    { title: 'Fallen Down (Reprise)', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[9], previewUrl: `${UDR}/mus_fallendown2.ogg`, duration: 150 },
    { title: 'Snowdin Town', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[10], previewUrl: `${UDR}/mus_town.ogg`, duration: 136 },
    { title: 'Ruins', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[11], previewUrl: `${UDR}/mus_ruins.ogg`, duration: 92 },
    { title: 'Undertale', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[12], previewUrl: `${UDR}/mus_story.ogg`, duration: 381 },
    { title: 'My Castle Town', artist: 'Toby Fox', album: 'Deltarune OST', coverUrl: COV[13], previewUrl: `${UDR}/mus_town.ogg`, duration: 130 },
    { title: 'Here We Are', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[14], previewUrl: `${UDR}/mus_hereweare.ogg`, duration: 126 },
    { title: 'Respite', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[15], previewUrl: `${UDR}/mus_fallendown2.ogg`, duration: 140 },
    { title: 'Small Shock', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[16], previewUrl: `${UDR}/mus_smallshock.ogg`, duration: 14 },
    { title: "She's Playing Piano", artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[17], previewUrl: `${UDR}/mus_piano.ogg`, duration: 42 },
    { title: 'Waterfall', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[18], previewUrl: `${UDR}/mus_waterfall.ogg`, duration: 126 },
    { title: 'Home (Ambiance)', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[19], previewUrl: `${UDR}/mus_house2.ogg`, duration: 172 },
    { title: 'Before the Story', artist: 'Toby Fox', album: 'Deltarune OST', coverUrl: COV[0], previewUrl: `${UDR}/mus_story.ogg`, duration: 88 },
    { title: 'You Might Even Hear A Heartbeat', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[1], previewUrl: `${UDR}/mus_waterquiet.ogg`, duration: 49 },
    { title: 'Good Night', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[2], previewUrl: `${UDR}/mus_fallendown2.ogg`, duration: 31 },
    { title: "It's Raining Somewhere Else", artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[3], previewUrl: `${UDR}/mus_sansdate.ogg`, duration: 170 },
  ],
  energique: [
    { title: 'Megalovania', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[8], previewUrl: `${UDR}/mus_zz_megalovania.ogg`, duration: 156 },
    { title: 'Rude Buster', artist: 'Toby Fox', album: 'Deltarune OST', coverUrl: COV[9], previewUrl: `${UDR}/mus_battle2.ogg`, duration: 75 },
    { title: 'Battle Against a True Hero', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[10], previewUrl: `${UDR}/mus_undyneboss.ogg`, duration: 156 },
    { title: 'Spear of Justice', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[11], previewUrl: `${UDR}/mus_undynetheme.ogg`, duration: 115 },
    { title: 'Spider Dance', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[12], previewUrl: `${UDR}/mus_spider.ogg`, duration: 106 },
    { title: 'Death by Glamour', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[13], previewUrl: `${UDR}/mus_mettaton_ex.ogg`, duration: 134 },
    { title: 'Dummy!', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[14], previewUrl: `${UDR}/mus_dummybattle.ogg`, duration: 145 },
    { title: 'ASGORE', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[15], previewUrl: `${UDR}/mus_vsasgore.ogg`, duration: 156 },
    { title: 'Chaos King', artist: 'Toby Fox', album: 'Deltarune OST', coverUrl: COV[16], previewUrl: `${UDR}/mus_undynefast.ogg`, duration: 106 },
    { title: 'Bonetrousle', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[17], previewUrl: `${UDR}/mus_papyrusboss.ogg`, duration: 57 },
    { title: 'Heartache', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[18], previewUrl: `${UDR}/mus_toriel.ogg`, duration: 108 },
    { title: 'Checker Dance', artist: 'Toby Fox', album: 'Deltarune OST', coverUrl: COV[19], previewUrl: `${UDR}/mus_race.ogg`, duration: 78 },
    { title: 'BIG SHOT', artist: 'Toby Fox', album: 'Deltarune OST', coverUrl: COV[0], previewUrl: `${UDR}/mus_mettaton_ex.ogg`, duration: 142 },
    { title: 'Metal Crusher', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[1], previewUrl: `${UDR}/mus_mettatonbattle.ogg`, duration: 123 },
    { title: 'Pandora Palace', artist: 'Toby Fox', album: 'Deltarune OST', coverUrl: COV[2], previewUrl: `${UDR}/mus_anothermedium.ogg`, duration: 100 },
    { title: 'Finale', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[3], previewUrl: `${UDR}/mus_f_finale_1.ogg`, duration: 112 },
    { title: 'Burn in Despair!', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[4], previewUrl: `${UDR}/mus_toomuch.ogg`, duration: 21 },
    { title: 'But the Earth Refused to Die', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[5], previewUrl: `${UDR}/mus_undynefast.ogg`, duration: 34 },
    { title: 'Smart Race', artist: 'Toby Fox', album: 'Deltarune OST', coverUrl: COV[6], previewUrl: `${UDR}/mus_race.ogg`, duration: 66 },
    { title: 'Your Best Nightmare', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[7], previewUrl: `${UDR}/mus_f_part3.ogg`, duration: 240 },
  ],
  melancolique: [
    { title: 'Fallen Down', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[12], previewUrl: `${UDR}/mus_fallendown2.ogg`, duration: 57 },
    { title: 'His Theme', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[13], previewUrl: `${UDR}/mus_musicbox.ogg`, duration: 125 },
    { title: 'An Ending', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[14], previewUrl: `${UDR}/mus_gameover.ogg`, duration: 208 },
    { title: "Don't Forget", artist: 'Toby Fox & Laura Shigihara', album: 'Deltarune OST', coverUrl: COV[15], previewUrl: `${UDR}/mus_reunited.ogg`, duration: 51 },
    { title: "It's Raining Somewhere Else", artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[16], previewUrl: `${UDR}/mus_sansdate.ogg`, duration: 170 },
    { title: 'Waterfall', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[17], previewUrl: `${UDR}/mus_waterfall.ogg`, duration: 126 },
    { title: 'Reunited', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[18], previewUrl: `${UDR}/mus_reunited.ogg`, duration: 284 },
    { title: 'Quiet Water', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[19], previewUrl: `${UDR}/mus_waterquiet.ogg`, duration: 122 },
    { title: 'Memory', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[0], previewUrl: `${UDR}/mus_musicbox.ogg`, duration: 75 },
    { title: 'Here We Are', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[1], previewUrl: `${UDR}/mus_hereweare.ogg`, duration: 126 },
    { title: 'Amalgam', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[2], previewUrl: `${UDR}/mus_amalgam.ogg`, duration: 80 },
    { title: 'Sad Song', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[3], previewUrl: `${UDR}/mus_toomuch.ogg`, duration: 42 },
    { title: 'Good Night', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[4], previewUrl: `${UDR}/mus_fallendown2.ogg`, duration: 31 },
    { title: 'Ruins', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[5], previewUrl: `${UDR}/mus_ruins.ogg`, duration: 92 },
    { title: 'Home', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[6], previewUrl: `${UDR}/mus_house1.ogg`, duration: 123 },
    { title: 'Undertale', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[7], previewUrl: `${UDR}/mus_story.ogg`, duration: 381 },
    { title: 'Respite', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[8], previewUrl: `${UDR}/mus_fallendown2.ogg`, duration: 140 },
    { title: 'Small Shock', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[9], previewUrl: `${UDR}/mus_smallshock.ogg`, duration: 14 },
    { title: 'Fallen Down (Reprise)', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[10], previewUrl: `${UDR}/mus_fallendown2.ogg`, duration: 150 },
    { title: 'Core Approach', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[11], previewUrl: `${UDR}/mus_coretransition.ogg`, duration: 12 },
  ],
  concentre: [
    { title: "It's Raining Somewhere Else", artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[16], previewUrl: `${UDR}/mus_sansdate.ogg`, duration: 170 },
    { title: 'School', artist: 'Toby Fox', album: 'Deltarune OST', coverUrl: COV[17], previewUrl: `${UDR}/mus_lab.ogg`, duration: 120 },
    { title: 'Quiet Water', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[18], previewUrl: `${UDR}/mus_waterquiet.ogg`, duration: 122 },
    { title: 'Chill', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[19], previewUrl: `${UDR}/mus_birdsong.ogg`, duration: 56 },
    { title: 'Hotel', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[0], previewUrl: `${UDR}/mus_hotel.ogg`, duration: 130 },
    { title: 'Waterfall', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[1], previewUrl: `${UDR}/mus_waterfall.ogg`, duration: 126 },
    { title: 'Temmie Village', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[2], previewUrl: `${UDR}/mus_temvillage.ogg`, duration: 57 },
    { title: 'sans.', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[3], previewUrl: `${UDR}/mus_sansdate.ogg`, duration: 50 },
    { title: 'Mysterious Place', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[4], previewUrl: `${UDR}/mus_mysteriousroom2.ogg`, duration: 44 },
    { title: 'Spooktune', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[5], previewUrl: `${UDR}/mus_spoopy.ogg`, duration: 24 },
    { title: 'Snowdin Town', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[6], previewUrl: `${UDR}/mus_town.ogg`, duration: 136 },
    { title: 'Ruins', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[7], previewUrl: `${UDR}/mus_ruins.ogg`, duration: 92 },
    { title: 'Uwa!! So Temperate', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[8], previewUrl: `${UDR}/mus_options_fall.ogg`, duration: 56 },
    { title: 'Bird That Carries You Over River', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[9], previewUrl: `${UDR}/mus_birdnoise.ogg`, duration: 44 },
    { title: 'Gaster Theme', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[10], previewUrl: `${UDR}/mus_st_him.ogg`, duration: 15 },
    { title: "It's Pronounced Rules", artist: 'Toby Fox', album: 'Deltarune OST', coverUrl: COV[11], previewUrl: `${UDR}/mus_battle1.ogg`, duration: 62 },
    { title: 'Home (Ambiance)', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[12], previewUrl: `${UDR}/mus_house2.ogg`, duration: 172 },
    { title: 'Uwa!! So Holiday', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[13], previewUrl: `${UDR}/mus_options_summer.ogg`, duration: 120 },
    { title: 'Memory', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[14], previewUrl: `${UDR}/mus_musicbox.ogg`, duration: 75 },
    { title: 'A Town Called Hometown', artist: 'Toby Fox', album: 'Deltarune OST', coverUrl: COV[15], previewUrl: `${UDR}/mus_town.ogg`, duration: 110 },
  ],
  festif: [
    { title: 'Checker Dance', artist: 'Toby Fox', album: 'Deltarune OST', coverUrl: COV[0], previewUrl: `${UDR}/mus_race.ogg`, duration: 78 },
    { title: 'Death by Glamour', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[1], previewUrl: `${UDR}/mus_mettaton_ex.ogg`, duration: 134 },
    { title: 'Pandora Palace', artist: 'Toby Fox', album: 'Deltarune OST', coverUrl: COV[2], previewUrl: `${UDR}/mus_anothermedium.ogg`, duration: 100 },
    { title: 'Hip Shop', artist: 'Toby Fox', album: 'Deltarune OST', coverUrl: COV[3], previewUrl: `${UDR}/mus_coolbeat.ogg`, duration: 155 },
    { title: 'Metal Crusher', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[4], previewUrl: `${UDR}/mus_mettatonbattle.ogg`, duration: 123 },
    { title: 'Dummy!', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[5], previewUrl: `${UDR}/mus_dummybattle.ogg`, duration: 145 },
    { title: 'Spider Dance', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[6], previewUrl: `${UDR}/mus_spider.ogg`, duration: 106 },
    { title: 'BIG SHOT', artist: 'Toby Fox', album: 'Deltarune OST', coverUrl: COV[7], previewUrl: `${UDR}/mus_mettaton_ex.ogg`, duration: 142 },
    { title: 'Happy Town', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[8], previewUrl: `${UDR}/mus_happytown.ogg`, duration: 115 },
    { title: 'Dogsong', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[9], previewUrl: `${UDR}/mus_dogsong.ogg`, duration: 37 },
    { title: 'Megalovania', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[10], previewUrl: `${UDR}/mus_zz_megalovania.ogg`, duration: 156 },
    { title: 'Dating Start!', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[11], previewUrl: `${UDR}/mus_date.ogg`, duration: 116 },
    { title: 'Rude Buster', artist: 'Toby Fox', album: 'Deltarune OST', coverUrl: COV[12], previewUrl: `${UDR}/mus_battle2.ogg`, duration: 75 },
    { title: 'Bonetrousle', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[13], previewUrl: `${UDR}/mus_papyrusboss.ogg`, duration: 57 },
    { title: 'Giga Size', artist: 'Toby Fox', album: 'Deltarune OST', coverUrl: COV[14], previewUrl: `${UDR}/mus_mettaton_neo.ogg`, duration: 110 },
    { title: 'Attack of the Killer Queen', artist: 'Toby Fox', album: 'Deltarune OST', coverUrl: COV[15], previewUrl: `${UDR}/mus_mettaton_ex.ogg`, duration: 120 },
    { title: 'Hopes and Dreams', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[16], previewUrl: `${UDR}/mus_reunited.ogg`, duration: 180 },
    { title: 'Smart Race', artist: 'Toby Fox', album: 'Deltarune OST', coverUrl: COV[17], previewUrl: `${UDR}/mus_race.ogg`, duration: 66 },
    { title: 'Reunited', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[18], previewUrl: `${UDR}/mus_reunited.ogg`, duration: 284 },
    { title: 'Field of Hopes and Dreams', artist: 'Toby Fox', album: 'Deltarune OST', coverUrl: COV[19], previewUrl: `${UDR}/mus_town.ogg`, duration: 161 },
  ],
  amoureux: [
    { title: 'Memory', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[1], previewUrl: `${UDR}/mus_musicbox.ogg`, duration: 75 },
    { title: 'His Theme', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[2], previewUrl: `${UDR}/mus_musicbox.ogg`, duration: 125 },
    { title: "Don't Forget", artist: 'Toby Fox & Laura Shigihara', album: 'Deltarune OST', coverUrl: COV[3], previewUrl: `${UDR}/mus_reunited.ogg`, duration: 51 },
    { title: "She's Playing Piano", artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[4], previewUrl: `${UDR}/mus_piano.ogg`, duration: 42 },
    { title: 'Quiet Water', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[5], previewUrl: `${UDR}/mus_waterquiet.ogg`, duration: 122 },
    { title: 'Fallen Down', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[6], previewUrl: `${UDR}/mus_fallendown2.ogg`, duration: 57 },
    { title: 'Waterfall', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[7], previewUrl: `${UDR}/mus_waterfall.ogg`, duration: 126 },
    { title: 'Dating Start!', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[8], previewUrl: `${UDR}/mus_date.ogg`, duration: 116 },
    { title: 'Reunited', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[9], previewUrl: `${UDR}/mus_reunited.ogg`, duration: 284 },
    { title: 'Home', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[10], previewUrl: `${UDR}/mus_house1.ogg`, duration: 123 },
    { title: 'Lost Girl', artist: 'Toby Fox', album: 'Deltarune OST', coverUrl: COV[11], previewUrl: `${UDR}/mus_ruinspiano.ogg`, duration: 110 },
    { title: "It's Raining Somewhere Else", artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[12], previewUrl: `${UDR}/mus_sansdate.ogg`, duration: 170 },
    { title: 'Dating Fight!', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[13], previewUrl: `${UDR}/mus_date_fight.ogg`, duration: 120 },
    { title: 'Chill', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[14], previewUrl: `${UDR}/mus_birdsong.ogg`, duration: 56 },
    { title: 'Undertale', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[15], previewUrl: `${UDR}/mus_story.ogg`, duration: 381 },
    { title: 'Here We Are', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[16], previewUrl: `${UDR}/mus_hereweare.ogg`, duration: 126 },
    { title: 'Snowy', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[17], previewUrl: `${UDR}/mus_snowy.ogg`, duration: 104 },
    { title: 'Once Upon a Time', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[18], previewUrl: `${UDR}/mus_story.ogg`, duration: 88 },
    { title: 'Good Night', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[19], previewUrl: `${UDR}/mus_fallendown2.ogg`, duration: 31 },
    { title: 'My Castle Town', artist: 'Toby Fox', album: 'Deltarune OST', coverUrl: COV[0], previewUrl: `${UDR}/mus_town.ogg`, duration: 120 },
  ],
  colerique: [
    { title: 'Megalovania', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[7], previewUrl: `${UDR}/mus_zz_megalovania.ogg`, duration: 156 },
    { title: 'Rude Buster', artist: 'Toby Fox', album: 'Deltarune OST', coverUrl: COV[8], previewUrl: `${UDR}/mus_battle2.ogg`, duration: 75 },
    { title: 'Chaos King', artist: 'Toby Fox', album: 'Deltarune OST', coverUrl: COV[9], previewUrl: `${UDR}/mus_undynefast.ogg`, duration: 106 },
    { title: 'Dummy!', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[10], previewUrl: `${UDR}/mus_dummybattle.ogg`, duration: 145 },
    { title: 'Your Best Nightmare', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[11], previewUrl: `${UDR}/mus_f_part3.ogg`, duration: 240 },
    { title: 'Battle Against a True Hero', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[12], previewUrl: `${UDR}/mus_undyneboss.ogg`, duration: 156 },
    { title: 'Spear of Justice', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[13], previewUrl: `${UDR}/mus_undynetheme.ogg`, duration: 115 },
    { title: 'ASGORE', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[14], previewUrl: `${UDR}/mus_vsasgore.ogg`, duration: 156 },
    { title: 'Burn in Despair!', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[15], previewUrl: `${UDR}/mus_toomuch.ogg`, duration: 21 },
    { title: 'Amalgam', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[16], previewUrl: `${UDR}/mus_amalgam.ogg`, duration: 80 },
    { title: 'Finale', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[17], previewUrl: `${UDR}/mus_f_finale_1.ogg`, duration: 112 },
    { title: 'Heartache', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[18], previewUrl: `${UDR}/mus_toriel.ogg`, duration: 108 },
    { title: 'Bonetrousle', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[19], previewUrl: `${UDR}/mus_papyrusboss.ogg`, duration: 57 },
    { title: 'But the Earth Refused to Die', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[0], previewUrl: `${UDR}/mus_undynefast.ogg`, duration: 34 },
    { title: 'Death by Glamour', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[1], previewUrl: `${UDR}/mus_mettaton_ex.ogg`, duration: 134 },
    { title: 'Spider Dance', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[2], previewUrl: `${UDR}/mus_spider.ogg`, duration: 106 },
    { title: 'Metal Crusher', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[3], previewUrl: `${UDR}/mus_mettatonbattle.ogg`, duration: 123 },
    { title: 'BIG SHOT', artist: 'Toby Fox', album: 'Deltarune OST', coverUrl: COV[4], previewUrl: `${UDR}/mus_mettaton_ex.ogg`, duration: 142 },
    { title: 'Sad Song', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[5], previewUrl: `${UDR}/mus_toomuch.ogg`, duration: 42 },
    { title: 'Checker Dance', artist: 'Toby Fox', album: 'Deltarune OST', coverUrl: COV[6], previewUrl: `${UDR}/mus_race.ogg`, duration: 78 },
  ],
  fatigue: [
    { title: 'Quiet Water', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[11], previewUrl: `${UDR}/mus_waterquiet.ogg`, duration: 122 },
    { title: 'Home', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[12], previewUrl: `${UDR}/mus_house1.ogg`, duration: 123 },
    { title: 'Fallen Down', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[13], previewUrl: `${UDR}/mus_fallendown2.ogg`, duration: 57 },
    { title: 'Good Night', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[14], previewUrl: `${UDR}/mus_fallendown2.ogg`, duration: 31 },
    { title: 'Chill', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[15], previewUrl: `${UDR}/mus_birdsong.ogg`, duration: 56 },
    { title: 'Memory', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[16], previewUrl: `${UDR}/mus_musicbox.ogg`, duration: 75 },
    { title: 'Waterfall', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[17], previewUrl: `${UDR}/mus_waterfall.ogg`, duration: 126 },
    { title: 'Ooo', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[18], previewUrl: `${UDR}/mus_birdnoise.ogg`, duration: 14 },
    { title: 'Memory (Piano)', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[19], previewUrl: `${UDR}/mus_ruinspiano.ogg`, duration: 90 },
    { title: 'Lost Girl', artist: 'Toby Fox', album: 'Deltarune OST', coverUrl: COV[0], previewUrl: `${UDR}/mus_ruinspiano.ogg`, duration: 110 },
    { title: 'Fallen Down (Reprise)', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[1], previewUrl: `${UDR}/mus_fallendown2.ogg`, duration: 145 },
    { title: 'Small Shock', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[2], previewUrl: `${UDR}/mus_smallshock.ogg`, duration: 14 },
    { title: 'His Theme', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[3], previewUrl: `${UDR}/mus_musicbox.ogg`, duration: 125 },
    { title: 'Ruins', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[4], previewUrl: `${UDR}/mus_ruins.ogg`, duration: 92 },
    { title: 'Waterfall (Ambiance)', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[5], previewUrl: `${UDR}/mus_waterfall.ogg`, duration: 180 },
    { title: "She's Playing Piano", artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[6], previewUrl: `${UDR}/mus_piano.ogg`, duration: 60 },
    { title: 'Home (Ambiance)', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[7], previewUrl: `${UDR}/mus_house2.ogg`, duration: 172 },
    { title: 'Respite', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[8], previewUrl: `${UDR}/mus_fallendown2.ogg`, duration: 140 },
    { title: 'You Might Even Hear A Heartbeat', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[9], previewUrl: `${UDR}/mus_waterquiet.ogg`, duration: 49 },
    { title: 'Main Theme (Slow)', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[10], previewUrl: `${UDR}/mus_musicbox.ogg`, duration: 120 },
  ],
  // Vibe Toby Fox : mix iconique Undertale + Deltarune au hasard
  tobyfox: [
    { title: 'Megalovania', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[0], previewUrl: `${UDR}/mus_zz_megalovania.ogg`, duration: 156 },
    { title: 'Hopes and Dreams', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[1], previewUrl: `${UDR}/mus_reunited.ogg`, duration: 180 },
    { title: 'Field of Hopes and Dreams', artist: 'Toby Fox', album: 'Deltarune OST', coverUrl: COV[2], previewUrl: `${UDR}/mus_town.ogg`, duration: 161 },
    { title: 'Rude Buster', artist: 'Toby Fox', album: 'Deltarune OST', coverUrl: COV[3], previewUrl: `${UDR}/mus_battle2.ogg`, duration: 75 },
    { title: 'Undertale', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[4], previewUrl: `${UDR}/mus_story.ogg`, duration: 381 },
    { title: 'sans.', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[5], previewUrl: `${UDR}/mus_sansdate.ogg`, duration: 50 },
    { title: 'Waterfall', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[6], previewUrl: `${UDR}/mus_waterfall.ogg`, duration: 126 },
    { title: 'Spider Dance', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[7], previewUrl: `${UDR}/mus_spider.ogg`, duration: 106 },
    { title: 'Death by Glamour', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[8], previewUrl: `${UDR}/mus_mettaton_ex.ogg`, duration: 134 },
    { title: 'Bonetrousle', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[9], previewUrl: `${UDR}/mus_papyrusboss.ogg`, duration: 57 },
    { title: 'BIG SHOT', artist: 'Toby Fox', album: 'Deltarune OST', coverUrl: COV[10], previewUrl: `${UDR}/mus_mettaton_ex.ogg`, duration: 142 },
    { title: "Don't Forget", artist: 'Toby Fox & Laura Shigihara', album: 'Deltarune OST', coverUrl: COV[11], previewUrl: `${UDR}/mus_reunited.ogg`, duration: 51 },
    { title: 'His Theme', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[12], previewUrl: `${UDR}/mus_musicbox.ogg`, duration: 125 },
    { title: 'Battle Against a True Hero', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[13], previewUrl: `${UDR}/mus_undyneboss.ogg`, duration: 156 },
    { title: 'Dogsong', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[14], previewUrl: `${UDR}/mus_dogsong.ogg`, duration: 37 },
    { title: 'ASGORE', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[15], previewUrl: `${UDR}/mus_vsasgore.ogg`, duration: 156 },
    { title: 'Chaos King', artist: 'Toby Fox', album: 'Deltarune OST', coverUrl: COV[16], previewUrl: `${UDR}/mus_undynefast.ogg`, duration: 106 },
    { title: 'Memory', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[17], previewUrl: `${UDR}/mus_musicbox.ogg`, duration: 75 },
    { title: 'It\'s Raining Somewhere Else', artist: 'Toby Fox', album: 'Undertale OST', coverUrl: COV[18], previewUrl: `${UDR}/mus_sansdate.ogg`, duration: 170 },
    { title: 'Hip Shop', artist: 'Toby Fox', album: 'Deltarune OST', coverUrl: COV[19], previewUrl: `${UDR}/mus_coolbeat.ogg`, duration: 155 },
  ],
};

// ─── GÉNÉRATION FALLBACK LOCALE ───────────────────────────────────────────────

const localFallback = (moodId: string, count: number, undertaleOnly: boolean): Track[] => {
  const pool = undertaleOnly
    ? (UNDERTALE_TRACKS[moodId] || UNDERTALE_TRACKS.joyeux)
    : (LOCAL_FALLBACK[moodId] || LOCAL_FALLBACK.joyeux);

  const shuffled = shuffleArray([...pool]);
  const result: Track[] = [];
  for (let i = 0; i < count; i++) {
    const t = shuffled[i % shuffled.length];
    result.push({
      id: `local-${moodId}-${i}-${Math.random().toString(36).substr(2, 6)}`,
      title: t.title,
      artist: t.artist,
      album: t.album,
      coverUrl: t.coverUrl,
      previewUrl: t.previewUrl,
      duration: t.duration,
    });
  }
  return shuffleArray(result);
};

// ─── DÉDUPLICATION ────────────────────────────────────────────────────────────

const dedup = (tracks: Track[]): Track[] => {
  const seen = new Set<string>();
  return tracks.filter(t => {
    const key = `${t.title.toLowerCase()}-${t.artist.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// ─── FONCTION PRINCIPALE ──────────────────────────────────────────────────────

export const getPlaylistForMood = async (
  moodId: string,
  undertaleOnly = false
): Promise<Track[]> => {

  // ── Mode Toby Fox : Undertale + Deltarune exclusivement ──────────────────
  if (moodId === 'tobyfox') {
    // Toujours iTunes avec les requêtes Undertale/Deltarune, shuffled
    try {
      const queries = ITUNES_MOOD_QUERIES.tobyfox;
      const shuffledQ = shuffleArray([...queries]);
      const picked = shuffledQ.slice(0, 6); // 6 requêtes aléatoires parmi 16
      const tracks = await itunesMultiSearch(picked, 5);
      if (tracks.length > 0) {
        const shuffled = shuffleArray(tracks);
        return shuffled.slice(0, 20);
      }
    } catch (_) {}
    // Fallback local undertale
    return localFallback('tobyfox', 20, true);
  }

  if (undertaleOnly) {
    if (moodId.startsWith('search-')) {
      const q = moodId.substring(7).toLowerCase();
      const exact: Omit<Track, 'id'>[] = [];
      const partial: Omit<Track, 'id'>[] = [];
      const seen = new Set<string>();
      Object.values(UNDERTALE_TRACKS).flat().forEach(t => {
        const key = `${t.title.toLowerCase()}-${t.artist.toLowerCase()}`;
        if (seen.has(key)) return;
        if (!t.title.toLowerCase().includes(q) && !t.artist.toLowerCase().includes(q)) return;
        seen.add(key);
        if (t.title.toLowerCase().startsWith(q)) exact.push(t);
        else partial.push(t);
      });
      const matched = [...exact, ...partial];
      if (matched.length > 0) {
        return matched.slice(0, 20).map((t, i) => ({
          id: `src-u-${i}-${Math.random().toString(36).substr(2, 6)}`,
          ...t,
        }));
      }
      return localFallback(moodId.replace('search-', '') || 'joyeux', 20, true);
    }
    return localFallback(moodId, 20, true);
  }

  // ── Mode Recherche normale ────────────────────────────────────────────────
  if (moodId.startsWith('search-')) {
    const q = moodId.substring(7);

    // 1. Essai Deezer
    const deezerResults = await deezerSearch(q, 20);
    if (deezerResults.length > 0) {
      const u = dedup(deezerResults);
      if (u.length >= 20) return u.slice(0, 20);
      return [...u, ...localFallback('joyeux', 20 - u.length, false)];
    }

    // 2. Essai iTunes
    const itunesResults = await itunesSearch(q, 20);
    if (itunesResults.length > 0) {
      const u = dedup(itunesResults);
      if (u.length >= 20) return u.slice(0, 20);
      return [...u, ...localFallback('joyeux', 20 - u.length, false)];
    }

    // 3. Fallback local par pertinence (sans hasard)
    const exact: Omit<Track, 'id'>[] = [];
    const partial: Omit<Track, 'id'>[] = [];
    const seen = new Set<string>();
    Object.values(LOCAL_FALLBACK).flat().forEach(t => {
      const key = `${t.title.toLowerCase()}-${t.artist.toLowerCase()}`;
      if (seen.has(key)) return;
      if (!t.title.toLowerCase().includes(q.toLowerCase()) && !t.artist.toLowerCase().includes(q.toLowerCase())) return;
      seen.add(key);
      if (t.title.toLowerCase().startsWith(q.toLowerCase())) exact.push(t);
      else partial.push(t);
    });
    const matched = [...exact, ...partial];
    if (matched.length > 0) {
      return matched.slice(0, 20).map((t, i) => ({
        id: `src-l-${i}-${Math.random().toString(36).substr(2, 6)}`,
        ...t,
      }));
    }
    return localFallback('joyeux', 20, false);
  }

  // ── Mode Humeur ───────────────────────────────────────────────────────────
  const mood = MOODS.find(m => m.id === moodId);
  if (!mood) return localFallback(moodId, 20, false);

  // On lance Deezer ET iTunes en parallèle avec un timeout global de 2s
  const delay = (ms: number) => new Promise<null>(resolve => setTimeout(() => resolve(null), ms));

  const deezerCall = async (): Promise<Track[] | null> => {
    try {
      const [chart, radio] = await Promise.all([
        deezerChart(mood.genres[0]),
        deezerRadio(mood.genres[1] || mood.genres[0]),
      ]);
      const merged = dedup([...chart, ...radio]);
      return merged.length > 0 ? merged : null;
    } catch (_) {
      return null;
    }
  };

  const itunesCall = async (): Promise<Track[] | null> => {
    try {
      const queries = ITUNES_MOOD_QUERIES[moodId] || ITUNES_MOOD_QUERIES.joyeux;
      const tracks = await itunesMultiSearch(queries, 5);
      return tracks.length > 0 ? tracks : null;
    } catch (_) {
      return null;
    }
  };

  // Race : Deezer OU iTunes OU timeout 2s
  const result = await Promise.race([
    // Résoudre dès qu'une des deux APIs retourne quelque chose
    new Promise<Track[] | null>(resolve => {
      deezerCall().then(r => { if (r) resolve(r); });
      itunesCall().then(r => { if (r) resolve(r); });
    }),
    delay(2000),
  ]);

  if (result && result.length > 0) {
    const shuffled = shuffleArray(result);
    if (shuffled.length >= 20) return shuffled.slice(0, 20);
    const needed = 20 - shuffled.length;
    return [...shuffled, ...localFallback(moodId, needed, false)];
  }

  // Repli total sur le local
  return localFallback(moodId, 20, false);
};
