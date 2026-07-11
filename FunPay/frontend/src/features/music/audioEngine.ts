type FadeComplete = () => void;

const fallbackStepMs = 40;
const audioContextResumeLimitMs = 800;

function clampVolume(value: number) {
  return Math.min(1, Math.max(0, value));
}

export class MusicAudioEngine {
  private audio: HTMLAudioElement | null = null;
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private completionTimer: number | null = null;
  private fallbackTimer: number | null = null;

  async activate(audio: HTMLAudioElement) {
    audio.volume = 0;

    if (!this.context && typeof AudioContext !== "undefined") {
      const context = new AudioContext();

      try {
        await this.resumeContext(context);
        const source = context.createMediaElementSource(audio);
        const gain = context.createGain();

        source.connect(gain);
        gain.connect(context.destination);
        gain.gain.setValueAtTime(0, context.currentTime);
        audio.volume = 1;
        this.audio = audio;
        this.context = context;
        this.gain = gain;
      } catch {
        void context.close().catch(() => null);
        this.audio = audio;
        this.context = null;
        this.gain = null;
      }
    } else if (!this.audio) {
      this.audio = audio;
    }

    if (this.context?.state === "suspended") {
      await this.resumeContext(this.context);
    }

    if (this.context && this.gain) {
      const now = this.context.currentTime;
      this.gain.gain.cancelScheduledValues(now);
      this.gain.gain.setValueAtTime(0, now);
      audio.volume = 1;
    }
  }

  fadeTo(targetVolume: number, durationMs: number, onComplete?: FadeComplete) {
    const target = clampVolume(targetVolume);
    const duration = Math.max(0, durationMs);
    this.cancelFade();

    if (this.context && this.gain) {
      const now = this.context.currentTime;
      const gainParam = this.gain.gain;

      if (typeof gainParam.cancelAndHoldAtTime === "function") {
        gainParam.cancelAndHoldAtTime(now);
      } else {
        gainParam.cancelScheduledValues(now);
        gainParam.setValueAtTime(gainParam.value, now);
      }

      if (duration === 0) {
        gainParam.setValueAtTime(target, now);
        onComplete?.();
        return;
      }

      // NOTE: Web Audio продолжает эту кривую даже когда браузер замораживает кадры скрытой вкладки.
      gainParam.linearRampToValueAtTime(target, now + duration / 1000);
      this.completionTimer = window.setTimeout(() => {
        this.completionTimer = null;
        onComplete?.();
      }, duration);
      return;
    }

    this.fadeElementVolume(target, duration, onComplete);
  }

  cancelFade() {
    if (this.completionTimer !== null) {
      window.clearTimeout(this.completionTimer);
      this.completionTimer = null;
    }

    if (this.fallbackTimer !== null) {
      window.clearInterval(this.fallbackTimer);
      this.fallbackTimer = null;
    }

    if (this.context && this.gain) {
      const now = this.context.currentTime;
      const gainParam = this.gain.gain;

      if (typeof gainParam.cancelAndHoldAtTime === "function") {
        gainParam.cancelAndHoldAtTime(now);
      } else {
        gainParam.cancelScheduledValues(now);
        gainParam.setValueAtTime(gainParam.value, now);
      }
    }
  }

  private async resumeContext(context: AudioContext) {
    if (context.state !== "suspended") {
      return;
    }

    let timeoutId: number | null = null;

    try {
      await Promise.race([
        context.resume(),
        new Promise<never>((_, reject) => {
          timeoutId = window.setTimeout(
            () => reject(new Error("AudioContext resume timeout")),
            audioContextResumeLimitMs
          );
        })
      ]);
    } finally {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    }
  }

  private fadeElementVolume(target: number, durationMs: number, onComplete?: FadeComplete) {
    const audio = this.audio;

    if (!audio || durationMs === 0) {
      if (audio) {
        audio.volume = target;
      }

      onComplete?.();
      return;
    }

    const startedAt = performance.now();
    const startVolume = audio.volume;
    this.fallbackTimer = window.setInterval(() => {
      const progress = Math.min(1, (performance.now() - startedAt) / durationMs);
      audio.volume = clampVolume(startVolume + (target - startVolume) * progress);

      if (progress < 1) {
        return;
      }

      if (this.fallbackTimer !== null) {
        window.clearInterval(this.fallbackTimer);
        this.fallbackTimer = null;
      }

      onComplete?.();
    }, fallbackStepMs);
  }
}
