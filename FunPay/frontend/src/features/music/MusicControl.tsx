import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  ChevronUp,
  Disc3,
  Heart,
  ListMusic,
  Music2,
  Pause,
  Play,
  Settings2,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
  X
} from "lucide-react";
import { useLanguage } from "../../i18n";
import { useMusic } from "./MusicProvider";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const wholeSeconds = Math.floor(seconds);
  return `${Math.floor(wholeSeconds / 60)}:${String(wholeSeconds % 60).padStart(2, "0")}`;
}

export function MusicControl() {
  const { t } = useLanguage();
  const {
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
    pauseWhenHidden,
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
    trackIdsInQueue,
    volume
  } = useMusic();
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [playerPosition, setPlayerPosition] = useState({ right: 10, top: 80, width: 370 });
  const rootRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<HTMLElement | null>(null);
  const currentIsFavorite = currentTrack ? favoriteTracks.some((track) => track.id === currentTrack.id) : false;
  const isActive = isPlaying && !isSuspended;
  const quickLabel = !hasStarted
    ? t("music.start")
    : isActive
      ? t("music.pause")
      : t("music.resume");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (
        event.target instanceof Node
        && !rootRef.current?.contains(event.target)
        && !playerRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    const updatePosition = () => {
      const launcher = rootRef.current?.getBoundingClientRect();

      if (!launcher) {
        return;
      }

      const viewportWidth = document.documentElement.clientWidth;
      const playerWidth = Math.min(370, viewportWidth - 20);
      const maximumRight = Math.max(10, viewportWidth - playerWidth - 10);
      const desiredRight = viewportWidth - launcher.right;
      setPlayerPosition({
        right: Math.min(maximumRight, Math.max(10, desiredRight)),
        top: launcher.bottom + 10,
        width: playerWidth
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, { passive: true });
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [isOpen]);

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.55 ? Volume1 : Volume2;

  return (
    <div className="music-control" ref={rootRef}>
      <div className={`music-launcher${isActive ? " music-launcher--playing" : ""}`}>
        <button
          aria-label={quickLabel}
          className="music-launcher__quick"
          onClick={togglePlayback}
          title={quickLabel}
          type="button"
        >
          <span className="music-launcher__icon" aria-hidden="true">
            {isActive ? <MusicBars /> : <Music2 size={17} />}
          </span>
          <span className="music-launcher__copy">
            <strong>{currentTrack?.title ?? t("music.title")}</strong>
            <small>{isSuspended ? t("music.tabPaused") : quickLabel}</small>
          </span>
        </button>
        <button
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-label={t("music.openPlayer")}
          className="music-launcher__expand"
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          <ChevronDown className={isOpen ? "music-launcher__chevron--open" : ""} size={15} />
        </button>
      </div>

      {isOpen ? createPortal((
        <section
          aria-label={t("music.player")}
          className="music-player"
          ref={playerRef}
          role="dialog"
          style={{ right: playerPosition.right, top: playerPosition.top, width: playerPosition.width }}
        >
          <header className="music-player__header">
            <div>
              <Music2 size={17} aria-hidden="true" />
              <strong>{t("music.title")}</strong>
            </div>
            <div className="music-player__header-actions">
              <button
                aria-label={t("music.settings")}
                className={showSettings ? "is-active" : ""}
                onClick={() => setShowSettings((current) => !current)}
                type="button"
              >
                <Settings2 size={17} />
              </button>
              <button aria-label={t("music.close")} onClick={() => setIsOpen(false)} type="button">
                <X size={18} />
              </button>
            </div>
          </header>

          {showSettings ? (
            <div className="music-settings">
              <div className="music-settings__intro">
                <strong>{t("music.settings")}</strong>
                <span>{t("music.settingsHint")}</span>
              </div>
              <label className="music-settings__row">
                <span>
                  <strong>{t("music.pauseInactive")}</strong>
                  <small>{t("music.pauseInactiveHint")}</small>
                </span>
                <input
                  checked={pauseWhenHidden}
                  onChange={(event) => setPauseWhenHidden(event.target.checked)}
                  type="checkbox"
                />
              </label>
              <div className="music-settings__note">
                <Music2 size={16} aria-hidden="true" />
                <span>{t("music.officialOnly")}</span>
              </div>
            </div>
          ) : (
            <>
              <div className="music-now-playing">
                <div className={`music-cover${isActive ? " music-cover--playing" : ""}`}>
                  <Disc3 size={34} strokeWidth={1.6} aria-hidden="true" />
                  <span />
                </div>
                <div className="music-now-playing__copy">
                  <small>{isSuspended ? t("music.tabPaused") : t("music.nowPlaying")}</small>
                  <strong>{currentTrack?.title ?? t("music.noTracks")}</strong>
                  <span>{currentTrack?.artist ?? t("music.officialOnly")}</span>
                </div>
                {canUseFavorites ? (
                  <button
                    aria-label={currentIsFavorite ? t("music.removeFavorite") : t("music.addFavorite")}
                    className={`music-favorite-button${currentIsFavorite ? " is-favorite" : ""}`}
                    disabled={!currentTrack}
                    onClick={() => currentTrack && toggleFavorite(currentTrack.id)}
                    title={currentIsFavorite ? t("music.removeFavorite") : t("music.addFavorite")}
                    type="button"
                  >
                    <Heart fill={currentIsFavorite ? "currentColor" : "none"} size={18} />
                  </button>
                ) : null}
              </div>

              <div className="music-progress">
                <input
                  aria-label={t("music.seek")}
                  max={duration || 0}
                  min="0"
                  onChange={(event) => seek(Number(event.target.value))}
                  step="0.1"
                  style={{ "--music-progress": `${duration ? (currentTime / duration) * 100 : 0}%` } as CSSProperties}
                  type="range"
                  value={Math.min(currentTime, duration || 0)}
                />
                <div><span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span></div>
              </div>

              {error ? <p className="music-player__error" role="status">{t(`music.errors.${error}`)}</p> : null}

              <div className="music-playback-controls">
                <button aria-label={t("music.previous")} disabled={!trackIdsInQueue.length} onClick={playPrevious} type="button">
                  <SkipBack size={19} fill="currentColor" />
                </button>
                <button
                  aria-label={isActive ? t("music.pause") : t("music.resume")}
                  className="music-playback-controls__main"
                  disabled={!trackIdsInQueue.length}
                  onClick={togglePlayback}
                  type="button"
                >
                  {isActive ? <Pause fill="currentColor" size={19} /> : <Play fill="currentColor" size={19} />}
                </button>
                <button aria-label={t("music.next")} disabled={!trackIdsInQueue.length} onClick={playNext} type="button">
                  <SkipForward size={19} fill="currentColor" />
                </button>
                <label className="music-volume">
                  <VolumeIcon size={17} aria-hidden="true" />
                  <span className="sr-only">{t("music.volume")}</span>
                  <input
                    aria-label={t("music.volume")}
                    max="1"
                    min="0"
                    onChange={(event) => setVolume(Number(event.target.value))}
                    step="0.01"
                    type="range"
                    value={volume}
                  />
                </label>
              </div>

              <div className="music-queue">
                <div className="music-queue__heading">
                  <span><ListMusic size={16} aria-hidden="true" /> {t("music.queue")}</span>
                  <small>{t("music.queueCount", { count: trackIdsInQueue.length })}</small>
                </div>
                <div className="music-queue__list">
                  {queue.map((track, index) => {
                    const isEnabled = trackIdsInQueue.includes(track.id);
                    const isCurrent = track.id === currentTrack?.id;
                    const isFavorite = favoriteTracks.some((favorite) => favorite.id === track.id);

                    return (
                      <div className={`music-queue-row${canUseFavorites ? "" : " music-queue-row--without-favorite"}${isCurrent ? " is-current" : ""}${!isEnabled ? " is-disabled" : ""}`} key={track.id}>
                        <label className="music-queue-row__check">
                          <input
                            aria-label={isEnabled ? t("music.removeFromQueue") : t("music.addToQueue")}
                            checked={isEnabled}
                            onChange={() => toggleTrackInQueue(track.id)}
                            type="checkbox"
                          />
                        </label>
                        <button
                          className="music-queue-row__track"
                          disabled={!isEnabled}
                          onClick={() => playTrack(track.id)}
                          type="button"
                        >
                          <span>{isCurrent && isActive ? <MusicBars /> : <Music2 size={15} />}</span>
                          <span><strong>{track.title}</strong><small>{track.artist}</small></span>
                        </button>
                        {canUseFavorites ? (
                          <button
                            aria-label={isFavorite ? t("music.removeFavorite") : t("music.addFavorite")}
                            className={`music-queue-row__favorite${isFavorite ? " is-favorite" : ""}`}
                            onClick={() => toggleFavorite(track.id)}
                            type="button"
                          >
                            <Heart fill={isFavorite ? "currentColor" : "none"} size={15} />
                          </button>
                        ) : null}
                        <span className="music-queue-row__move">
                          <button aria-label={t("music.moveUp")} disabled={index === 0} onClick={() => moveTrack(track.id, -1)} type="button"><ChevronUp size={14} /></button>
                          <button aria-label={t("music.moveDown")} disabled={index === queue.length - 1} onClick={() => moveTrack(track.id, 1)} type="button"><ChevronDown size={14} /></button>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </section>
      ), document.body) : null}
    </div>
  );
}

function MusicBars() {
  return <span className="music-bars"><i /><i /><i /></span>;
}
