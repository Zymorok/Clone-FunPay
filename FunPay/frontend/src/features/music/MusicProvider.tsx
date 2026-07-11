import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import { MusicAudioEngine } from "./audioEngine";
import { musicCatalog, musicTrackById, type MusicTrack } from "./catalog";

type MusicPreferences = {
  enabled: boolean;
  favoriteTrackIds: string[];
  pauseWhenHidden: boolean;
  queueIds: string[];
  trackIdsInQueue: string[];
  volume: number;
};

type MusicContextValue = {
  canUseFavorites: boolean;
  currentTime: number;
  currentTrack: MusicTrack | null;
  duration: number;
  error: string | null;
  favoriteTracks: MusicTrack[];
  hasStarted: boolean;
  isPlaying: boolean;
  isSuspended: boolean;
  pauseWhenHidden: boolean;
  queue: MusicTrack[];
  trackIdsInQueue: string[];
  volume: number;
  moveTrack: (trackId: string, direction: -1 | 1) => void;
  playNext: () => void;
  playPrevious: () => void;
  playTrack: (trackId: string) => void;
  seek: (seconds: number) => void;
  setPauseWhenHidden: (value: boolean) => void;
  setVolume: (value: number) => void;
  toggleFavorite: (trackId: string) => void;
  togglePlayback: () => void;
  toggleTrackInQueue: (trackId: string) => void;
};

type StoredMusicPreferences = MusicPreferences & { version: 3 };

const MusicContext = createContext<MusicContextValue | null>(null);
const storagePrefix = "funpay-music-preferences";
const fadeOutMs = 520;
const fadeInMs = 720;

const defaultPreferences: MusicPreferences = {
  enabled: true,
  favoriteTrackIds: [],
  pauseWhenHidden: true,
  queueIds: musicCatalog.map((track) => track.id),
  trackIdsInQueue: musicCatalog.map((track) => track.id),
  volume: 0.56
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function uniqueKnownTrackIds(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item, index, list): item is string =>
      typeof item === "string"
      && musicTrackById.has(item)
      && list.indexOf(item) === index
  );
}

function readPreferences(ownerKey: string, canUseFavorites: boolean): MusicPreferences {
  try {
    const raw = localStorage.getItem(`${storagePrefix}:${ownerKey}`);

    if (!raw) {
      return defaultPreferences;
    }

    const stored = JSON.parse(raw) as Partial<StoredMusicPreferences>;
    const savedQueue = uniqueKnownTrackIds(stored.queueIds);
    const newlyDiscoveredTrackIds = musicCatalog
      .map((track) => track.id)
      .filter((id) => !savedQueue.includes(id));
    const queueIds = [
      ...savedQueue,
      ...newlyDiscoveredTrackIds
    ];
    const trackIdsInQueue = stored.version === 3
      ? [...uniqueKnownTrackIds(stored.trackIdsInQueue), ...newlyDiscoveredTrackIds]
      : queueIds;

    return {
      enabled: stored.enabled !== false,
      favoriteTrackIds: canUseFavorites ? uniqueKnownTrackIds(stored.favoriteTrackIds) : [],
      pauseWhenHidden: stored.pauseWhenHidden !== false,
      queueIds,
      trackIdsInQueue,
      volume: typeof stored.volume === "number" ? clamp(stored.volume, 0, 1) : defaultPreferences.volume
    };
  } catch {
    return defaultPreferences;
  }
}

function savePreferences(ownerKey: string, preferences: MusicPreferences) {
  const stored: StoredMusicPreferences = { version: 3, ...preferences };
  localStorage.setItem(`${storagePrefix}:${ownerKey}`, JSON.stringify(stored));
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getPlaybackErrorKey(error: unknown) {
  return error instanceof DOMException && error.name === "NotAllowedError"
    ? "playbackBlocked"
    : "loadFailed";
}

export function MusicProvider({ children, ownerKey, canUseFavorites }: { children: ReactNode; ownerKey: string; canUseFavorites: boolean }) {
  const [preferences, setPreferences] = useState<MusicPreferences>(() => readPreferences(ownerKey, canUseFavorites));
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(() => {
    return readPreferences(ownerKey, canUseFavorites).trackIdsInQueue[0] ?? null;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioEngineRef = useRef<MusicAudioEngine | null>(null);
  const loadedTrackIdRef = useRef<string | null>(null);
  const playbackAttemptRef = useRef(0);
  const startedFromTrackClickRef = useRef<string | null>(null);
  const resumeAfterVisibilityRef = useRef(false);
  const currentTrack = currentTrackId ? musicTrackById.get(currentTrackId) ?? null : null;

  if (!audioEngineRef.current) {
    audioEngineRef.current = new MusicAudioEngine();
  }

  const queue = useMemo(() => {
    return preferences.queueIds.flatMap((id) => {
      const track = musicTrackById.get(id);
      return track ? [track] : [];
    });
  }, [preferences.queueIds]);

  const playableQueue = useMemo(() => {
    const enabledIds = new Set(preferences.trackIdsInQueue);
    return queue.filter((track) => enabledIds.has(track.id));
  }, [preferences.trackIdsInQueue, queue]);

  const favoriteTracks = useMemo(() => {
    if (!canUseFavorites) {
      return [];
    }

    const favoriteIds = new Set(preferences.favoriteTrackIds);
    return musicCatalog.filter((track) => favoriteIds.has(track.id));
  }, [canUseFavorites, preferences.favoriteTrackIds]);

  useEffect(() => {
    savePreferences(ownerKey, preferences);
  }, [ownerKey, preferences]);

  const cancelFade = useCallback(() => {
    audioEngineRef.current?.cancelFade();
  }, []);

  const fadeTo = useCallback((targetVolume: number, durationMs: number, onComplete?: () => void) => {
    audioEngineRef.current?.fadeTo(
      clamp(targetVolume, 0, 1),
      prefersReducedMotion() ? 0 : durationMs,
      onComplete
    );
  }, []);

  const loadTrack = useCallback((audio: HTMLAudioElement, track: MusicTrack) => {
    if (loadedTrackIdRef.current === track.id) {
      return;
    }

    loadedTrackIdRef.current = track.id;
    setCurrentTime(0);
    setDuration(0);
    setError(null);
    audio.src = track.src;
    audio.load();
  }, []);

  const syncDuration = useCallback((audio: HTMLAudioElement) => {
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      setDuration(audio.duration);
    }
  }, []);

  const startPlayback = useCallback(async (requestedTrack?: MusicTrack) => {
    const audio = audioRef.current;
    const firstPlayableTrack = playableQueue[0] ?? null;
    const trackToPlay = requestedTrack ?? currentTrack;

    if (!audio || !firstPlayableTrack) {
      setError("emptyQueue");
      setIsPlaying(false);
      return;
    }

    if (!trackToPlay || !preferences.trackIdsInQueue.includes(trackToPlay.id)) {
      setCurrentTrackId(firstPlayableTrack.id);
      return;
    }

    const playbackAttempt = ++playbackAttemptRef.current;
    loadTrack(audio, trackToPlay);

    cancelFade();
    setError(null);
    setHasStarted(true);
    setPreferences((current) => ({ ...current, enabled: true }));

    try {
      // NOTE: Оба вызова начинаются прямо внутри клика, чтобы браузер не принял выбор трека за автозапуск.
      const activation = audioEngineRef.current?.activate(audio);
      const playback = audio.play();
      await Promise.all([activation, playback]);

      if (playbackAttempt !== playbackAttemptRef.current) {
        return;
      }

      setIsPlaying(true);
      setIsSuspended(false);
      fadeTo(preferences.volume, fadeInMs);
    } catch (playbackError) {
      if (playbackAttempt !== playbackAttemptRef.current) {
        return;
      }

      setIsPlaying(false);
      setError(getPlaybackErrorKey(playbackError));
    }
  }, [cancelFade, currentTrack, fadeTo, loadTrack, playableQueue, preferences.trackIdsInQueue, preferences.volume]);

  const pausePlayback = useCallback((rememberChoice = true) => {
    playbackAttemptRef.current += 1;
    resumeAfterVisibilityRef.current = false;
    fadeTo(0, fadeOutMs, () => {
      audioRef.current?.pause();
      setIsPlaying(false);
      setIsSuspended(false);
    });

    if (rememberChoice) {
      setPreferences((current) => ({ ...current, enabled: false }));
    }
  }, [fadeTo]);

  const togglePlayback = useCallback(() => {
    if (isPlaying || isSuspended) {
      pausePlayback();
      return;
    }

    void startPlayback();
  }, [isPlaying, isSuspended, pausePlayback, startPlayback]);

  const playTrack = useCallback((trackId: string) => {
    const track = musicTrackById.get(trackId);

    if (!preferences.trackIdsInQueue.includes(trackId) || !track) {
      return;
    }

    startedFromTrackClickRef.current = trackId;
    setCurrentTrackId(trackId);
    setPreferences((current) => ({ ...current, enabled: true }));
    setHasStarted(true);
    setCurrentTime(0);
    setDuration(0);
    setError(null);
    void startPlayback(track);
  }, [preferences.trackIdsInQueue, startPlayback]);

  const moveToAdjacentTrack = useCallback((direction: -1 | 1) => {
    if (!playableQueue.length) {
      setCurrentTrackId(null);
      setIsPlaying(false);
      setError("emptyQueue");
      return;
    }

    const currentIndex = currentTrackId
      ? playableQueue.findIndex((track) => track.id === currentTrackId)
      : -1;
    const nextIndex = currentIndex === -1
      ? 0
      : (currentIndex + direction + playableQueue.length) % playableQueue.length;
    setCurrentTrackId(playableQueue[nextIndex].id);
    setError(null);
  }, [currentTrackId, playableQueue]);

  const playNext = useCallback(() => moveToAdjacentTrack(1), [moveToAdjacentTrack]);
  const playPrevious = useCallback(() => moveToAdjacentTrack(-1), [moveToAdjacentTrack]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !currentTrack) {
      return;
    }

    if (startedFromTrackClickRef.current === currentTrack.id) {
      startedFromTrackClickRef.current = null;
      return;
    }

    loadTrack(audio, currentTrack);

    if (!hasStarted || !preferences.enabled) {
      return;
    }

    void startPlayback();
  }, [currentTrack?.id]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const audio = audioRef.current;

      if (!audio || !preferences.pauseWhenHidden) {
        return;
      }

      if (document.hidden) {
        if (!isPlaying || !preferences.enabled) {
          return;
        }

        resumeAfterVisibilityRef.current = true;
        setIsSuspended(true);
        fadeTo(0, fadeOutMs, () => {
          audio.pause();
        });
        return;
      }

      if (!resumeAfterVisibilityRef.current) {
        return;
      }

      resumeAfterVisibilityRef.current = false;
      cancelFade();

      if (!preferences.enabled) {
        audio.pause();
        setIsPlaying(false);
        setIsSuspended(false);
        return;
      }

      const activation = audioEngineRef.current?.activate(audio);
      const playback = audio.play();

      void Promise.all([activation, playback])
        .then(() => {
          setIsSuspended(false);
          setIsPlaying(true);
          fadeTo(preferences.volume, fadeInMs);
        })
        .catch((playbackError: unknown) => {
          setIsPlaying(false);
          setIsSuspended(false);
          setError(getPlaybackErrorKey(playbackError));
        });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [cancelFade, fadeTo, isPlaying, preferences.enabled, preferences.pauseWhenHidden, preferences.volume]);

  useEffect(() => {
    return cancelFade;
  }, [cancelFade]);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;

    if (!audio || !Number.isFinite(seconds)) {
      return;
    }

    audio.currentTime = clamp(seconds, 0, Number.isFinite(audio.duration) ? audio.duration : 0);
    setCurrentTime(audio.currentTime);
  }, []);

  const setVolume = useCallback((value: number) => {
    const nextVolume = clamp(value, 0, 1);
    setPreferences((current) => ({ ...current, volume: nextVolume }));

    if (isPlaying && !isSuspended) {
      fadeTo(nextVolume, 180);
    }
  }, [fadeTo, isPlaying, isSuspended]);

  const setPauseWhenHidden = useCallback((value: boolean) => {
    setPreferences((current) => ({ ...current, pauseWhenHidden: value }));
  }, []);

  const toggleFavorite = useCallback((trackId: string) => {
    if (!canUseFavorites || !musicTrackById.has(trackId)) {
      return;
    }

    setPreferences((current) => ({
      ...current,
      favoriteTrackIds: current.favoriteTrackIds.includes(trackId)
        ? current.favoriteTrackIds.filter((id) => id !== trackId)
        : [...current.favoriteTrackIds, trackId]
    }));
  }, [canUseFavorites]);

  const toggleTrackInQueue = useCallback((trackId: string) => {
    if (!musicTrackById.has(trackId)) {
      return;
    }

    setPreferences((current) => ({
      ...current,
      trackIdsInQueue: current.trackIdsInQueue.includes(trackId)
        ? current.trackIdsInQueue.filter((id) => id !== trackId)
        : [...current.trackIdsInQueue, trackId]
    }));
  }, []);

  const moveTrack = useCallback((trackId: string, direction: -1 | 1) => {
    setPreferences((current) => {
      const currentIndex = current.queueIds.indexOf(trackId);
      const nextIndex = currentIndex + direction;

      if (currentIndex === -1 || nextIndex < 0 || nextIndex >= current.queueIds.length) {
        return current;
      }

      const nextQueue = [...current.queueIds];
      [nextQueue[currentIndex], nextQueue[nextIndex]] = [nextQueue[nextIndex], nextQueue[currentIndex]];
      return { ...current, queueIds: nextQueue };
    });
  }, []);

  useEffect(() => {
    if (!currentTrackId) {
      const firstPlayableTrack = playableQueue[0];

      if (firstPlayableTrack) {
        setCurrentTrackId(firstPlayableTrack.id);
        setError(null);
      }

      return;
    }

    if (preferences.trackIdsInQueue.includes(currentTrackId)) {
      return;
    }

    const nextTrack = playableQueue[0] ?? null;
    setCurrentTrackId(nextTrack?.id ?? null);

    if (!nextTrack) {
      audioRef.current?.pause();
      setIsPlaying(false);
      setError("emptyQueue");
    }
  }, [currentTrackId, playableQueue, preferences.trackIdsInQueue]);

  const value = useMemo<MusicContextValue>(() => ({
    canUseFavorites,
    currentTime,
    currentTrack,
    duration,
    error,
    favoriteTracks,
    hasStarted,
    isPlaying,
    isSuspended,
    moveTrack,
    pauseWhenHidden: preferences.pauseWhenHidden,
    playNext,
    playPrevious,
    playTrack,
    queue,
    seek,
    setPauseWhenHidden,
    setVolume,
    toggleFavorite,
    togglePlayback,
    toggleTrackInQueue,
    trackIdsInQueue: preferences.trackIdsInQueue,
    volume: preferences.volume
  }), [
    canUseFavorites,
    currentTime,
    currentTrack,
    duration,
    error,
    favoriteTracks,
    hasStarted,
    isPlaying,
    isSuspended,
    moveTrack,
    playNext,
    playPrevious,
    playTrack,
    preferences.pauseWhenHidden,
    preferences.trackIdsInQueue,
    preferences.volume,
    queue,
    seek,
    setPauseWhenHidden,
    setVolume,
    toggleFavorite,
    togglePlayback,
    toggleTrackInQueue
  ]);

  return (
    <MusicContext.Provider value={value}>
      {children}
      <audio
        onCanPlay={(event) => syncDuration(event.currentTarget)}
        onDurationChange={(event) => syncDuration(event.currentTarget)}
        onEnded={playNext}
        onError={() => {
          loadedTrackIdRef.current = null;
          setError("loadFailed");
        }}
        onLoadedMetadata={(event) => syncDuration(event.currentTarget)}
        onTimeUpdate={(event) => {
          setCurrentTime(event.currentTarget.currentTime);
          syncDuration(event.currentTarget);
        }}
        preload="metadata"
        ref={audioRef}
      />
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);

  if (!context) {
    throw new Error("useMusic must be used inside MusicProvider");
  }

  return context;
}
