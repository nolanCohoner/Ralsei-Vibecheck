import { Audio } from 'expo-av';

const SFX_MAP: Record<string, any> = {
  select: require('../assets/sounds/select.wav'),
  move: require('../assets/sounds/move.wav'),
  save: require('../assets/sounds/save.wav'),
  damage: require('../assets/sounds/damage.wav'),
  usefountain: require('../assets/sounds/usefountain.ogg'),
  item: require('../assets/sounds/item.wav'),
  text: require('../assets/sounds/text.wav'),
  battleenter: require('../assets/sounds/battleenter.wav'),
  locker: require('../assets/sounds/locker.wav'),
  closet_impact: require('../assets/sounds/closet_impact.ogg'),
};

export const playSFX = async (
  sfxName:
    | 'select'
    | 'move'
    | 'save'
    | 'damage'
    | 'usefountain'
    | 'item'
    | 'text'
    | 'battleenter'
    | 'locker'
    | 'closet_impact'
) => {
  try {
    const source = SFX_MAP[sfxName];
    if (!source) return;

    const { sound } = await Audio.Sound.createAsync(
      source,
      { shouldPlay: true }
    );

    // Décharger automatiquement après la lecture
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (_err) {
    // Échouer silencieusement si l'audio n'est pas dispo
  }
};
