import { useCallback, useEffect, useRef, useState } from "react";

export const CHAT_RECORDING_LIMIT_MS = 5 * 60 * 1000;

const initialLevels = Array.from({ length: 28 }, () => 0.08);

function selectMimeType(mode) {
  const candidates = mode === "voice"
    ? ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"]
    : ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];

  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function stopTracks(stream) {
  stream?.getTracks().forEach((track) => track.stop());
}

function requestUserMedia(constraints) {
  if (navigator.mediaDevices?.getUserMedia) {
    return navigator.mediaDevices.getUserMedia(constraints);
  }

  const legacyGetUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
  if (!legacyGetUserMedia) {
    return null;
  }

  return new Promise((resolve, reject) => legacyGetUserMedia.call(navigator, constraints, resolve, reject));
}

function getAudioConstraints() {
  return { autoGainControl: true, echoCancellation: true, noiseSuppression: true };
}

function getVideoConstraints(facingMode) {
  return { facingMode: { ideal: facingMode }, width: { ideal: 720 }, height: { ideal: 720 } };
}

async function requestCaptureStream(mode, facingMode) {
  if (mode === "voice") {
    const request = requestUserMedia({ audio: getAudioConstraints() });
    if (!request) {
      return null;
    }
    return request;
  }

  const video = getVideoConstraints(facingMode);
  const combinedRequest = requestUserMedia({ audio: getAudioConstraints(), video });
  if (!combinedRequest) {
    return null;
  }

  try {
    return await combinedRequest;
  } catch (combinedError) {
    // NOTE: Если микрофон запрещён или отсутствует, видеокружок всё равно записывается без звука.
    const videoOnlyRequest = requestUserMedia({ audio: false, video });
    if (!videoOnlyRequest) {
      throw combinedError;
    }
    return videoOnlyRequest;
  }
}

async function listVideoInputs() {
  if (!navigator.mediaDevices?.enumerateDevices) {
    return [];
  }
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices
    .filter((device) => device.kind === "videoinput" && device.deviceId)
    .map((device) => ({ deviceId: device.deviceId, label: device.label.trim() }));
}

function paintCameraFrame(pipeline) {
  if (pipeline.stopped) {
    return;
  }

  const video = pipeline.sourceVideo;
  if (video?.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth && video.videoHeight) {
    const side = Math.min(video.videoWidth, video.videoHeight);
    const sourceX = (video.videoWidth - side) / 2;
    const sourceY = (video.videoHeight - side) / 2;
    pipeline.context.drawImage(video, sourceX, sourceY, side, side, 0, 0, pipeline.canvas.width, pipeline.canvas.height);
  }
  pipeline.animationFrameId = window.requestAnimationFrame(() => paintCameraFrame(pipeline));
}

async function createVideoPipeline(sourceStream) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: false });
  if (!context || typeof canvas.captureStream !== "function") {
    return null;
  }

  canvas.width = 720;
  canvas.height = 720;
  context.fillStyle = "#030a11";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const cameraStream = new MediaStream(sourceStream.getVideoTracks());
  const sourceVideo = document.createElement("video");
  sourceVideo.muted = true;
  sourceVideo.playsInline = true;
  sourceVideo.srcObject = cameraStream;
  await sourceVideo.play();

  const recordingStream = canvas.captureStream(30);
  sourceStream.getAudioTracks().forEach((track) => recordingStream.addTrack(track));
  const pipeline = {
    animationFrameId: 0,
    cameraStream,
    canvas,
    context,
    recordingStream,
    sourceVideo,
    stopped: false
  };
  paintCameraFrame(pipeline);
  return pipeline;
}

function disposeVideoPipeline(pipeline) {
  if (!pipeline) {
    return;
  }
  pipeline.stopped = true;
  window.cancelAnimationFrame(pipeline.animationFrameId);
  pipeline.sourceVideo?.pause();
  if (pipeline.sourceVideo) {
    pipeline.sourceVideo.srcObject = null;
  }
  stopTracks(pipeline.cameraStream);
  stopTracks(pipeline.recordingStream);
}

async function createCameraSource(deviceId) {
  const request = requestUserMedia({
    audio: false,
    video: { deviceId: { exact: deviceId }, width: { ideal: 720 }, height: { ideal: 720 } }
  });
  if (!request) {
    return null;
  }
  const stream = await request;
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.srcObject = stream;
  try {
    await video.play();
  } catch (error) {
    stopTracks(stream);
    throw error;
  }
  return { stream, video };
}

export function useChatRecorder({ onComplete }) {
  const [status, setStatus] = useState("idle");
  const [mode, setMode] = useState(null);
  const [stream, setStream] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [levels, setLevels] = useState(initialLevels);
  const [facingMode, setFacingMode] = useState("user");
  const [cameras, setCameras] = useState([]);
  const [currentCameraId, setCurrentCameraId] = useState(null);
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);
  const [supportsCameraSwitch, setSupportsCameraSwitch] = useState(false);
  const [error, setError] = useState(null);
  const captureRef = useRef(null);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const finishCapture = useCallback((capture) => {
    if (capture.finished) {
      return;
    }

    capture.finished = true;
    window.clearInterval(capture.timerId);
    window.cancelAnimationFrame(capture.animationFrameId);
    void capture.audioContext?.close().catch(() => undefined);
    if (capture.videoPipeline) {
      disposeVideoPipeline(capture.videoPipeline);
    } else {
      stopTracks(capture.stream);
    }

    const duration = Math.min(Date.now() - capture.startedAt, CHAT_RECORDING_LIMIT_MS);
    const blob = capture.chunks.length
      ? new Blob(capture.chunks, { type: capture.recorder.mimeType || capture.mimeType })
      : null;

    if (captureRef.current === capture) {
      captureRef.current = null;
      if (mountedRef.current) {
        setStream(null);
        setStatus("idle");
        setMode(null);
        setElapsedMs(0);
        setLevels(initialLevels);
        setCameras([]);
        setCurrentCameraId(null);
        setIsSwitchingCamera(false);
        setSupportsCameraSwitch(false);
      }
    }

    if (!capture.discard && blob?.size) {
      onCompleteRef.current?.({
        blob,
        duration,
        facingMode: capture.facingMode,
        mimeType: blob.type,
        mode: capture.mode
      });
    }

    capture.resolveStop?.();
  }, []);

  const stop = useCallback((save = true) => {
    const capture = captureRef.current;
    if (!capture) {
      return Promise.resolve();
    }

    capture.discard = !save;
    if (capture.stopPromise) {
      return capture.stopPromise;
    }

    capture.stopPromise = new Promise((resolve) => {
      capture.resolveStop = resolve;
    });

    if (capture.recorder.state === "inactive") {
      finishCapture(capture);
    } else {
      capture.recorder.stop();
    }

    return capture.stopPromise;
  }, [finishCapture]);

  const cancel = useCallback(() => {
    requestIdRef.current += 1;
    if (mountedRef.current) {
      setMode(null);
      setStream(null);
      setStatus("idle");
      setError(null);
      setElapsedMs(0);
      setLevels(initialLevels);
      setCameras([]);
      setCurrentCameraId(null);
      setIsSwitchingCamera(false);
      setSupportsCameraSwitch(false);
    }
    return stop(false);
  }, [stop]);

  const start = useCallback(async (nextMode, nextFacingMode = "user") => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    if (captureRef.current) {
      await stop(false);
    }

    if (!mountedRef.current || requestId !== requestIdRef.current) {
      return false;
    }

    setMode(nextMode);
    setFacingMode(nextFacingMode);
    setElapsedMs(0);
    setLevels(initialLevels);
    setCameras([]);
    setCurrentCameraId(null);
    setIsSwitchingCamera(false);
    setSupportsCameraSwitch(false);
    setError(null);
    setStatus("requesting");

    // NOTE: Сначала отрисовываем экран ожидания, затем браузер показывает системный запрос доступа.
    await new Promise((resolve) => window.requestAnimationFrame(resolve));
    if (!mountedRef.current || requestId !== requestIdRef.current) {
      return false;
    }

    let mediaStream;
    try {
      const permissionRequest = requestCaptureStream(nextMode, nextFacingMode);
      if (!permissionRequest) {
        setStatus("error");
        setError("unavailable");
        return false;
      }
      mediaStream = await permissionRequest;
      if (!mediaStream) {
        setStatus("error");
        setError("unavailable");
        return false;
      }
    } catch (captureError) {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setStatus("error");
        setError(["NotAllowedError", "PermissionDeniedError", "SecurityError"].includes(captureError?.name) ? "permission" : "unavailable");
      }
      return false;
    }

    if (!mountedRef.current || requestId !== requestIdRef.current) {
      stopTracks(mediaStream);
      return false;
    }

    if (typeof MediaRecorder === "undefined") {
      stopTracks(mediaStream);
      setStream(null);
      setStatus("error");
      setError("recording");
      return false;
    }

    let videoPipeline = null;
    try {
      let availableCameras = [];
      let selectedCameraId = null;
      if (nextMode === "video") {
        const cameraTrack = mediaStream.getVideoTracks()[0];
        selectedCameraId = cameraTrack?.getSettings().deviceId ?? null;
        availableCameras = await listVideoInputs();
        videoPipeline = await createVideoPipeline(mediaStream);
        if (videoPipeline) {
          mediaStream = videoPipeline.recordingStream;
        }
      }

      const mimeType = selectMimeType(nextMode);
      const recorder = new MediaRecorder(mediaStream, mimeType ? { mimeType } : undefined);
      const capture = {
        animationFrameId: 0,
        audioContext: null,
        chunks: [],
        discard: false,
        facingMode: nextFacingMode,
        finished: false,
        cameraDevices: availableCameras,
        currentCameraId: selectedCameraId,
        mimeType,
        mode: nextMode,
        recorder,
        resolveStop: null,
        startedAt: Date.now(),
        stopPromise: null,
        stream: mediaStream,
        timerId: 0,
        videoPipeline
      };

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size) {
          capture.chunks.push(event.data);
        }
      });
      recorder.addEventListener("stop", () => finishCapture(capture), { once: true });
      recorder.addEventListener("error", () => {
        capture.discard = true;
        if (mountedRef.current && captureRef.current === capture) {
          setError("recording");
          setStatus("error");
        }
        if (recorder.state === "inactive") {
          finishCapture(capture);
        } else {
          try {
            recorder.stop();
          } catch {
            finishCapture(capture);
          }
        }
      });

      captureRef.current = capture;
      setStream(mediaStream);
      setCameras(availableCameras);
      setCurrentCameraId(selectedCameraId);
      setSupportsCameraSwitch(Boolean(videoPipeline && selectedCameraId && availableCameras.some((camera) => camera.deviceId !== selectedCameraId)));
      setStatus("recording");
      recorder.start(250);

      capture.timerId = window.setInterval(() => {
        const nextElapsed = Math.min(Date.now() - capture.startedAt, CHAT_RECORDING_LIMIT_MS);
        if (mountedRef.current && captureRef.current === capture) {
          setElapsedMs(nextElapsed);
        }
        if (nextElapsed >= CHAT_RECORDING_LIMIT_MS) {
          void stop(true);
        }
      }, 100);

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        try {
          capture.audioContext = new AudioContextClass();
          const source = capture.audioContext.createMediaStreamSource(mediaStream);
          const analyser = capture.audioContext.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.72;
          source.connect(analyser);
          const samples = new Uint8Array(analyser.fftSize);
          let lastPaint = 0;

          const paintLevel = (timestamp) => {
            if (capture.finished) {
              return;
            }
            if (timestamp - lastPaint >= 55) {
              analyser.getByteTimeDomainData(samples);
              let energy = 0;
              for (const sample of samples) {
                const centered = (sample - 128) / 128;
                energy += centered * centered;
              }
              const level = Math.min(1, Math.max(0.08, Math.sqrt(energy / samples.length) * 4.6));
              if (mountedRef.current && captureRef.current === capture) {
                setLevels((current) => [...current.slice(-(initialLevels.length - 1)), level]);
              }
              lastPaint = timestamp;
            }
            capture.animationFrameId = window.requestAnimationFrame(paintLevel);
          };
          capture.animationFrameId = window.requestAnimationFrame(paintLevel);
        } catch {
          void capture.audioContext?.close().catch(() => undefined);
          capture.audioContext = null;
        }
      }

      return true;
    } catch {
      if (videoPipeline) {
        disposeVideoPipeline(videoPipeline);
      } else {
        stopTracks(mediaStream);
      }
      if (mountedRef.current) {
        setStream(null);
        setStatus("error");
        setError("recording");
      }
      return false;
    }
  }, [finishCapture, stop]);

  const switchCamera = useCallback(async () => {
    const capture = captureRef.current;
    if (!capture?.videoPipeline || capture.mode !== "video" || capture.recorder.state !== "recording" || capture.cameraDevices.length < 2 || isSwitchingCamera) {
      return false;
    }

    const currentIndex = capture.cameraDevices.findIndex((camera) => camera.deviceId === capture.currentCameraId);
    const nextCamera = capture.cameraDevices[(currentIndex + 1 + capture.cameraDevices.length) % capture.cameraDevices.length];
    if (!nextCamera?.deviceId || nextCamera.deviceId === capture.currentCameraId) {
      return false;
    }

    setIsSwitchingCamera(true);
    try {
      const nextSource = await createCameraSource(nextCamera.deviceId);
      if (!nextSource || captureRef.current !== capture || capture.finished) {
        stopTracks(nextSource?.stream);
        nextSource?.video.pause();
        return false;
      }

      const previousStream = capture.videoPipeline.cameraStream;
      const previousVideo = capture.videoPipeline.sourceVideo;
      capture.videoPipeline.cameraStream = nextSource.stream;
      capture.videoPipeline.sourceVideo = nextSource.video;
      capture.currentCameraId = nextCamera.deviceId;
      setCurrentCameraId(nextCamera.deviceId);

      previousVideo.pause();
      previousVideo.srcObject = null;
      stopTracks(previousStream);
      return true;
    } catch {
      return false;
    } finally {
      if (mountedRef.current) {
        setIsSwitchingCamera(false);
      }
    }
  }, [isSwitchingCamera]);

  useEffect(() => {
    // NOTE: React Strict Mode повторно подключает эффект в разработке — возвращаем рекордер в рабочее состояние.
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
      const capture = captureRef.current;
      if (capture) {
        capture.discard = true;
        if (capture.recorder.state === "inactive") {
          finishCapture(capture);
        } else {
          capture.recorder.stop();
        }
      }
    };
  }, [finishCapture]);

  const cameraLabel = cameras.find((camera) => camera.deviceId === currentCameraId)?.label || null;
  const canSwitchCamera = supportsCameraSwitch && cameras.length > 1;

  return {
    cameraLabel,
    cancel,
    canSwitchCamera,
    elapsedMs,
    error,
    facingMode,
    isSwitchingCamera,
    levels,
    mode,
    start,
    status,
    stop,
    stream,
    switchCamera
  };
}

export function formatRecordingDuration(durationMs) {
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
