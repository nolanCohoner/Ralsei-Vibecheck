import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Track } from '../utils/constants';

interface AudioPlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  playlist: Track[];
  isRepeat: boolean;
  setIsRepeat: (v: boolean) => void;
  playTrack: (track: Track, newPlaylist?: Track[]) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  seek: (positionMs: number) => Promise<void>;
  stop: () => Promise<void>;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [position, setPosition] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);

  const soundRef = useRef<Audio.Sound | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const isRepeatRef = useRef<boolean>(false);
  // Token anti-race-condition : chaque appel à playTrack incrémente ce compteur.
  // Si le token change pendant le chargement async, on ignore le résultat obsolète.
  const playTokenRef = useRef<number>(0);

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: true,
    });

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Sync isRepeatRef avec l'état pour éviter stale closure dans le callback
  useEffect(() => { isRepeatRef.current = isRepeat; }, [isRepeat]);

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis || 30000);
      setIsPlaying(status.isPlaying);
      isPlayingRef.current = status.isPlaying;

      if (status.didJustFinish) {
        if (isRepeatRef.current) {
          // Remettre au début et rejouer
          soundRef.current?.setPositionAsync(0).then(() => {
            soundRef.current?.playAsync();
          });
        } else {
          handleNext();
        }
      }
    }
  };

  const playTrack = async (track: Track, newPlaylist?: Track[]) => {
    // Incrémenter le token AVANT tout await pour invalider les appels précédents
    const myToken = ++playTokenRef.current;

    try {
      if (newPlaylist) {
        setPlaylist(newPlaylist);
      }

      // Décharger le son précédent immédiatement
      const oldSound = soundRef.current;
      soundRef.current = null;
      if (oldSound) {
        try { await oldSound.unloadAsync(); } catch (_) {}
      }

      // Vérifier que cet appel est toujours valide (aucun appel plus récent)
      if (playTokenRef.current !== myToken) return;

      setIsPlaying(false);
      setPosition(0);

      // Charger le nouveau son
      const { sound } = await Audio.Sound.createAsync(
        { uri: track.previewUrl },
        { shouldPlay: true, progressUpdateIntervalMillis: 500 },
        onPlaybackStatusUpdate
      );

      // Vérifier à nouveau que cet appel est toujours le plus récent
      if (playTokenRef.current !== myToken) {
        // Un appel plus récent a pris le relais — on décharge ce son obsolète
        try { await sound.unloadAsync(); } catch (_) {}
        return;
      }

      // Tout est bon : mettre à jour l'état avec la bonne piste ET le bon son
      soundRef.current = sound;
      setCurrentTrack(track);
      setIsPlaying(true);
      isPlayingRef.current = true;
    } catch (_error) {
      if (playTokenRef.current === myToken) {
        setIsPlaying(false);
        isPlayingRef.current = false;
      }
    }
  };

  const pause = async () => {
    try {
      if (soundRef.current && isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
        isPlayingRef.current = false;
      }
    } catch (_err) {}
  };

  const resume = async () => {
    try {
      if (soundRef.current && !isPlaying) {
        await soundRef.current.playAsync();
        setIsPlaying(true);
        isPlayingRef.current = true;
      } else if (currentTrack) {
        await playTrack(currentTrack);
      }
    } catch (_err) {}
  };

  const handleNext = async () => {
    if (playlist.length === 0 || !currentTrack) return;
    const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + 1) % playlist.length;
    await playTrack(playlist[nextIndex]);
  };

  const handlePrevious = async () => {
    if (playlist.length === 0 || !currentTrack) return;
    const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
    if (currentIndex === -1) return;

    if (position > 3000) {
      await seek(0);
      return;
    }

    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    await playTrack(playlist[prevIndex]);
  };

  const seek = async (positionMs: number) => {
    try {
      if (soundRef.current) {
        await soundRef.current.setPositionAsync(positionMs);
        setPosition(positionMs);
      }
    } catch (_err) {}
  };

  const stop = async () => {
    try {
      playTokenRef.current++; // Invalider tout chargement en cours
      const oldSound = soundRef.current;
      soundRef.current = null;
      if (oldSound) {
        try { await oldSound.unloadAsync(); } catch (_) {}
      }
      setCurrentTrack(null);
      setIsPlaying(false);
      isPlayingRef.current = false;
      setPosition(0);
    } catch (_err) {}
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        position,
        duration,
        playlist,
        isRepeat,
        setIsRepeat,
        playTrack,
        pause,
        resume,
        next: handleNext,
        previous: handlePrevious,
        seek,
        stop,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};
