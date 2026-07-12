import { Audio } from 'expo-av';

// ─── MAP DE TOUS LES SONS DISPONIBLES ────────────────────────────────────────

const SFX_MAP: Record<string, any> = {
  select:        require('../assets/sounds/select.wav'),
  move:          require('../assets/sounds/move.wav'),
  save:          require('../assets/sounds/save.wav'),
  damage:        require('../assets/sounds/damage.wav'),
  usefountain:   require('../assets/sounds/usefountain.ogg'),
  item:          require('../assets/sounds/item.wav'),
  text:          require('../assets/sounds/text.wav'),
  battleenter:   require('../assets/sounds/battleenter.wav'),
  locker:        require('../assets/sounds/locker.wav'),
  closet_impact: require('../assets/sounds/closet_impact.ogg'),
  snd_bluh:      require('../assets/sounds/snd_bluh.wav'),
};

export type SFXName = keyof typeof SFX_MAP;

// ─── GROUPES THÉMATIQUES POUR MODES ALÉATOIRES CIBLÉS ────────────────────────

export const SFX_GROUPS = {
  // Sons légers et fun (Ralsei Wave, easter eggs)
  fun:      ['select', 'move', 'item', 'snd_bluh'] as SFXName[],
  // Navigation (onglets, listes, humeurs)
  navigate: ['move', 'select'] as SFXName[],
  // Action forte (lecture, vibe check)
  action:   ['battleenter', 'select', 'item'] as SFXName[],
  // Erreur / feedback négatif
  error:    ['damage'] as SFXName[],
  // Ouverture de modales / menus
  open:     ['locker', 'battleenter'] as SFXName[],
  // Confirmation / sauvegarde
  confirm:  ['select', 'save'] as SFXName[],
  // Tous les sons
  all:      Object.keys(SFX_MAP) as SFXName[],
};

// ─── JOUER UN SON PRÉCIS ──────────────────────────────────────────────────────

export const playSFX = async (sfxName: SFXName): Promise<void> => {
  try {
    const source = SFX_MAP[sfxName];
    if (!source) return;

    const { sound } = await Audio.Sound.createAsync(
      source,
      { shouldPlay: true, volume: 0.8 }
    );

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (_err) {
    // Échouer silencieusement si l'audio n'est pas disponible
  }
};

// ─── JOUER UN SON ALÉATOIRE DANS UN GROUPE ───────────────────────────────────

export const playRandomSFX = async (
  group: keyof typeof SFX_GROUPS = 'all'
): Promise<void> => {
  const keys = SFX_GROUPS[group];
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  await playSFX(randomKey);
};

