/**
 * Lock Screen Manager (Media Session API + Lock Screen Notification)
 * Enables displaying the current exercise, set progress, and rest countdown
 * directly on the device's lock screen media widget and notification tray.
 */

export interface LockScreenState {
  exerciseName: string;
  setInfo: string; // e.g., "Série 2/4 • 10-12 reps (70kg)"
  planName: string; // e.g., "Treino A - Peitoral"
  artworkUrl?: string;
  isResting: boolean;
  restSecondsRemaining: number;
  restTotalSeconds: number;
  isPaused: boolean;
}

export interface LockScreenActionCallbacks {
  onPlay?: () => void;
  onPause?: () => void;
  onAddSeconds?: (seconds: number) => void;
  onSubtractSeconds?: (seconds: number) => void;
  onRestart?: () => void;
  onNextSet?: () => void;
}

// 1-second silent stereo WAV encoded in base64 to keep media session active in lock screen
const SILENT_AUDIO_URI = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';

class LockScreenManager {
  private audioElement: HTMLAudioElement | null = null;
  private isAudioPlaying: boolean = false;
  private callbacks: LockScreenActionCallbacks = {};
  private hasInitialized: boolean = false;

  constructor() {
    // Lazy init on first user gesture
  }

  private initAudio() {
    if (this.hasInitialized || typeof window === 'undefined') return;
    try {
      this.audioElement = new Audio(SILENT_AUDIO_URI);
      this.audioElement.loop = true;
      this.audioElement.volume = 0.01; // nearly silent, keeps OS media pipeline open
      this.hasInitialized = true;
    } catch {
      // Audio element creation fallback
    }
  }

  public setActionCallbacks(callbacks: LockScreenActionCallbacks) {
    this.callbacks = callbacks;
    this.setupMediaSessionHandlers();
  }

  private setupMediaSessionHandlers() {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.setActionHandler('play', () => {
        this.callbacks.onPlay?.();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        this.callbacks.onPause?.();
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        if (this.callbacks.onAddSeconds) {
          this.callbacks.onAddSeconds(30);
        } else {
          this.callbacks.onNextSet?.();
        }
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        if (this.callbacks.onSubtractSeconds) {
          this.callbacks.onSubtractSeconds(15);
        } else {
          this.callbacks.onRestart?.();
        }
      });

      // Seek actions for granular +15s / -15s
      try {
        navigator.mediaSession.setActionHandler('seekforward', (details) => {
          const delta = details.seekOffset || 15;
          this.callbacks.onAddSeconds?.(delta);
        });
        navigator.mediaSession.setActionHandler('seekbackward', (details) => {
          const delta = details.seekOffset || 15;
          this.callbacks.onSubtractSeconds?.(delta);
        });
      } catch {
        // Seek handlers not supported in some engines
      }
    } catch {
      // MediaSession error handling
    }
  }

  private formatTime(sec: number): string {
    if (isNaN(sec) || sec < 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  /**
   * Request Notification permission from the student
   */
  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return 'denied';
    }
  }

  public getNotificationPermission(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Updates Lock Screen Media Widget with current workout and countdown state
   */
  public updateLockScreen(state: LockScreenState) {
    this.initAudio();

    // Start silent audio to claim lock screen audio session
    if (this.audioElement && (state.isResting || !state.isPaused)) {
      if (!this.isAudioPlaying) {
        this.audioElement.play().then(() => {
          this.isAudioPlaying = true;
        }).catch(() => {
          // Autoplay policy might require gesture
        });
      }
    }

    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      const timeDisplay = this.formatTime(state.restSecondsRemaining);
      const title = state.isResting
        ? `⏱️ Descanso: ${timeDisplay} • ${state.exerciseName}`
        : `🏋️ ${state.exerciseName}`;

      const artist = state.isResting
        ? `${state.setInfo} (Aguarde ${timeDisplay})`
        : state.setInfo;

      const album = `${state.planName} • TrainerPro`;

      const artwork = [];
      if (state.artworkUrl) {
        artwork.push(
          { src: state.artworkUrl, sizes: '96x96', type: 'image/gif' },
          { src: state.artworkUrl, sizes: '128x128', type: 'image/gif' },
          { src: state.artworkUrl, sizes: '192x192', type: 'image/gif' },
          { src: state.artworkUrl, sizes: '512x512', type: 'image/gif' }
        );
      } else {
        artwork.push(
          { src: '/icon.svg', sizes: '192x192', type: 'image/svg+xml' }
        );
      }

      navigator.mediaSession.metadata = new MediaMetadata({
        title,
        artist,
        album,
        artwork,
      });

      navigator.mediaSession.playbackState = state.isPaused ? 'paused' : 'playing';

      // Set position state for lock screen scrubber/progress ring if available
      if ('setPositionState' in navigator.mediaSession && state.isResting && state.restTotalSeconds > 0) {
        try {
          const position = Math.max(0, state.restTotalSeconds - state.restSecondsRemaining);
          navigator.mediaSession.setPositionState({
            duration: state.restTotalSeconds,
            playbackRate: state.isPaused ? 0 : 1,
            position: Math.min(position, state.restTotalSeconds),
          });
        } catch {
          // Ignore unsupported position state bounds
        }
      }
    } catch {
      // Ignore media session errors
    }
  }

  /**
   * Dispatches a lock screen notification when the rest timer concludes
   */
  public notifyRestCompleted(exerciseName: string, nextSetInfo: string) {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    try {
      const title = '⚡ Descanso Concluído! Hora da Série';
      const options = {
        body: `${exerciseName}\n${nextSetInfo} • Mantenha o foco e execute com boa técnica!`,
        icon: '/icon.svg',
        badge: '/icon.svg',
        tag: 'trainerpro-rest-timer',
        renotify: true,
        requireInteraction: false,
        vibrate: [200, 100, 200, 100, 300],
      } as unknown as NotificationOptions;

      new Notification(title, options);
    } catch {
      // Notification fallback
    }
  }

  /**
   * Resets and clears the lock screen session when workout finishes or is idle
   */
  public clearLockScreen() {
    if (this.audioElement && this.isAudioPlaying) {
      try {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
        this.isAudioPlaying = false;
      } catch {
        // Ignore
      }
    }

    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = 'none';
      } catch {
        // Ignore
      }
    }
  }
}

export const lockScreenManager = new LockScreenManager();
