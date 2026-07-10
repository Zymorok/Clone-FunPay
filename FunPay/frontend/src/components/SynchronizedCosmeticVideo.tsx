import { useEffect, useRef, useState } from "react";

const animationEpochMs = typeof performance === "undefined" ? 0 : performance.now();
const activeVideos = new Set<HTMLVideoElement>();
const correctionIntervalMs = 5000;
const driftToleranceSeconds = 0.12;
let correctionTimer: number | null = null;
let visibilityListenerAttached = false;

function getSynchronizedTime(duration: number) {
  if (!Number.isFinite(duration) || duration <= 0) {
    return 0;
  }

  return ((performance.now() - animationEpochMs) / 1000) % duration;
}

function getCircularDistance(currentTime: number, targetTime: number, duration: number) {
  const distance = Math.abs(currentTime - targetTime);
  return Math.min(distance, Math.max(0, duration - distance));
}

function synchronizeVideo(video: HTMLVideoElement, force = false) {
  if (!Number.isFinite(video.duration) || video.duration <= 0) {
    return false;
  }

  const targetTime = getSynchronizedTime(video.duration);

  if (force || getCircularDistance(video.currentTime, targetTime, video.duration) > driftToleranceSeconds) {
    video.currentTime = targetTime;
  }

  return true;
}

function stopCorrectionLoop() {
  if (correctionTimer !== null) {
    window.clearInterval(correctionTimer);
    correctionTimer = null;
  }
}

function correctActiveVideos() {
  if (document.hidden) {
    return;
  }

  for (const video of activeVideos) {
    if (video.isConnected && !video.paused) {
      synchronizeVideo(video);
    }
  }
}

function handleVisibilityChange() {
  if (document.hidden) {
    return;
  }

  for (const video of activeVideos) {
    if (video.isConnected && synchronizeVideo(video, true)) {
      void video.play().catch(() => null);
    }
  }
}

function registerActiveVideo(video: HTMLVideoElement) {
  activeVideos.add(video);

  if (correctionTimer === null) {
    correctionTimer = window.setInterval(correctActiveVideos, correctionIntervalMs);
  }

  if (!visibilityListenerAttached) {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    visibilityListenerAttached = true;
  }
}

function unregisterActiveVideo(video: HTMLVideoElement) {
  activeVideos.delete(video);

  if (activeVideos.size === 0) {
    stopCorrectionLoop();
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    visibilityListenerAttached = false;
  }
}

type SynchronizedCosmeticVideoProps = {
  className: string;
  poster: string;
  source: string;
};

export function SynchronizedCosmeticVideo({ className, poster, source }: SynchronizedCosmeticVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    let disposed = false;
    const revealAndPlay = async () => {
      if (disposed || !synchronizeVideo(video, true)) {
        return;
      }

      try {
        await video.play();
        if (!disposed) {
          synchronizeVideo(video);
          setIsReady(true);
        }
      } catch {
        if (!disposed) {
          setIsReady(false);
        }
      }
    };

    registerActiveVideo(video);

    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      void revealAndPlay();
    } else {
      video.addEventListener("loadedmetadata", revealAndPlay, { once: true });
    }

    return () => {
      disposed = true;
      video.removeEventListener("loadedmetadata", revealAndPlay);
      video.pause();
      unregisterActiveVideo(video);
    };
  }, [source]);

  return (
    <>
      <img className={`${className} cosmetic-synchronized-media__poster`} decoding="async" loading="lazy" src={poster} alt="" />
      <video
        aria-hidden="true"
        autoPlay
        className={`${className} cosmetic-synchronized-media__video`}
        data-ready={isReady}
        disablePictureInPicture
        disableRemotePlayback
        loop
        muted
        playsInline
        poster={poster}
        preload="metadata"
        ref={videoRef}
        src={source}
      />
    </>
  );
}
