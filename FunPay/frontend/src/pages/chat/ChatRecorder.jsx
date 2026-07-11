import { useEffect, useRef } from "react";
import { Camera, LoaderCircle, RotateCcw, Send, Square, X } from "lucide-react";
import { CHAT_RECORDING_LIMIT_MS, formatRecordingDuration } from "./useChatRecorder";

export function VoiceRecordingBar({ recorder, t }) {
  const isStarting = recorder.status === "requesting";
  const hasError = recorder.status === "error";
  const errorMessage = t(recorder.error === "permission" ? "chatCapture.permissionDenied" : "chatCapture.recordingFailed");

  return (
    <div className="chat-recording-preview" data-status={recorder.status} role="status" aria-live="polite">
      {isStarting ? <LoaderCircle className="is-spinning chat-recording-preview__loader" size={17} /> : <i aria-hidden="true" />}
      {isStarting || hasError ? <strong>{hasError ? errorMessage : t("chatCapture.openingMicrophone")}</strong> : <time>{formatRecordingDuration(recorder.elapsedMs)}</time>}
      {hasError ? (
        <button className="chat-recording-preview__retry" onClick={() => void recorder.start("voice")} type="button"><RotateCcw size={14} />{t("profile.page.retry")}</button>
      ) : isStarting ? <span className="chat-recording-preview__spacer" /> : (
        <span className="chat-voice-wave" aria-hidden="true">
          {recorder.levels.map((level, index) => <i key={index} style={{ height: `${Math.round(4 + level * 20)}px` }} />)}
        </span>
      )}
      <button className="chat-recording-preview__cancel" onClick={() => void recorder.cancel()} type="button" aria-label={t("chatUi.record.cancel")}><X size={17} /></button>
      {!hasError ? <button className="chat-recording-preview__send" disabled={isStarting} onClick={() => void recorder.stop(true)} type="button" aria-label={t("chatCapture.finishVoice")}><Send size={16} /></button> : null}
    </div>
  );
}

export function VideoNoteRecorder({ recorder, t }) {
  const videoRef = useRef(null);
  const isStarting = recorder.status === "requesting";
  const hasError = recorder.status === "error";
  const progress = Math.min(recorder.elapsedMs / CHAT_RECORDING_LIMIT_MS, 1);
  const circumference = 2 * Math.PI * 134;

  useEffect(() => {
    if (!videoRef.current) {
      return;
    }
    videoRef.current.srcObject = recorder.stream;
    if (recorder.stream) {
      void videoRef.current.play().catch(() => undefined);
    }
  }, [recorder.stream]);

  if (hasError) {
    return (
      <div className="chat-video-recorder-backdrop chat-video-recorder-backdrop--error" role="presentation">
        <section className="chat-video-recorder-error" role="alertdialog" aria-modal="true" aria-label={t("chatUi.record.video")}>
          <button className="chat-video-recorder-error__close" onClick={() => void recorder.cancel()} type="button" aria-label={t("chatUi.record.cancel")}><X size={18} /></button>
          <span className="chat-video-recorder-error__icon"><Camera size={22} /></span>
          <div><strong>{t(recorder.error === "permission" ? "chatCapture.cameraBlockedTitle" : "chatCapture.recordingFailed")}</strong><p>{t(recorder.error === "permission" ? "chatCapture.cameraBlockedHint" : "chatCapture.cameraPermissionHint")}</p></div>
          <button className="chat-video-recorder-error__retry" onClick={() => void recorder.start("video", recorder.facingMode)} type="button"><RotateCcw size={15} />{t("profile.page.retry")}</button>
        </section>
      </div>
    );
  }

  return (
    <div className="chat-video-recorder-backdrop" role="presentation">
      <section className="chat-video-recorder" role="dialog" aria-modal="true" aria-label={t("chatUi.record.video")}>
        <header>
          <span><i aria-hidden="true" />{isStarting ? t("chatCapture.openingCamera") : t("chatCapture.recordingVideo")}</span>
          <time>{formatRecordingDuration(recorder.elapsedMs)} <small>/ 05:00</small></time>
        </header>

        <div className="chat-video-recorder__circle" style={{ "--voice-level": recorder.levels.at(-1) ?? 0.08 }}>
          <svg aria-hidden="true" viewBox="0 0 280 280">
            <circle className="chat-video-recorder__track" cx="140" cy="140" r="134" />
            <circle className="chat-video-recorder__progress" cx="140" cy="140" r="134" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress)} />
          </svg>
          {recorder.stream ? <video autoPlay muted playsInline disablePictureInPicture ref={videoRef} /> : <span className="chat-video-recorder__loading"><LoaderCircle className="is-spinning" size={30} /><small>{t("chatCapture.cameraPermissionHint")}</small></span>}
          {recorder.canSwitchCamera ? <button className="chat-video-recorder__switch" disabled={isStarting || recorder.isSwitchingCamera} onClick={() => void recorder.switchCamera()} type="button" aria-label={t("chatCapture.switchCamera")}><RotateCcw className={recorder.isSwitchingCamera ? "is-spinning" : ""} size={18} /></button> : null}
        </div>

        <footer>
          <button className="chat-video-recorder__cancel" onClick={() => void recorder.cancel()} type="button" aria-label={t("chatUi.record.cancel")}><X size={21} /></button>
          {recorder.cameraLabel ? <span><Camera size={14} />{recorder.cameraLabel}</span> : null}
          <button className="chat-video-recorder__finish" disabled={isStarting} onClick={() => void recorder.stop(true)} type="button" aria-label={t("chatCapture.finishVideo")}><Square size={17} /></button>
        </footer>
      </section>
    </div>
  );
}
