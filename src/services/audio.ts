/**
 * Audio Synthesizer for Peace Day Gaming Arena using Web Audio API
 * No external audio files needed; guarantees 100% offline/projector reliability.
 */

class SoundService {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    // Check saved preference
    const saved = localStorage.getItem('peaceday_audio_muted');
    this.muted = saved === 'true';
  }

  private initContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    localStorage.setItem('peaceday_audio_muted', String(this.muted));
    return this.muted;
  }

  public setMute(mute: boolean) {
    this.muted = mute;
    localStorage.setItem('peaceday_audio_muted', String(this.muted));
  }

  /**
   * Sound played when buzzer opens / becomes live
   */
  public playBuzzerLive() {
    if (this.muted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Ascending game show chime (C5 -> E5 -> G5 -> C6)
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.001, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.3, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.3);
      });
    } catch (e) {
      console.warn('Audio play error', e);
    }
  }

  /**
   * Sound when participant presses buzzer
   */
  public playBuzzPressed() {
    if (this.muted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.2);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {
      console.warn('Audio play error', e);
    }
  }

  /**
   * Sound played on host monitor when first buzz is received
   */
  public playFirstBuzzAlert() {
    if (this.muted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Two-tone high energy alert
      const tones = [880, 1174.66, 880, 1174.66];
      tones.forEach((tone, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(tone, now + idx * 0.1);

        gain.gain.setValueAtTime(0.001, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.4, now + idx * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.16);
      });
    } catch (e) {
      console.warn('Audio play error', e);
    }
  }

  /**
   * Grand fanfare played during Winner Reveal Curtain opening
   */
  public playWinnerFanfare() {
    if (this.muted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Drumroll effect first
      const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.8, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBuffer.length; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, now);
      filter.frequency.exponentialRampToValueAtTime(1000, now + 0.7);

      const rollGain = ctx.createGain();
      rollGain.gain.setValueAtTime(0.01, now);
      rollGain.gain.linearRampToValueAtTime(0.2, now + 0.7);
      rollGain.gain.linearRampToValueAtTime(0.001, now + 0.8);

      whiteNoise.connect(filter);
      filter.connect(rollGain);
      rollGain.connect(ctx.destination);
      whiteNoise.start(now);

      // Brass triumphant chords right as curtains open at +0.75s
      const chordDelay = 0.75;
      const chord = [523.25, 659.25, 783.99, 1046.5, 1318.51];
      chord.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + chordDelay);

        gain.gain.setValueAtTime(0.001, now + chordDelay);
        gain.gain.exponentialRampToValueAtTime(0.35, now + chordDelay + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + chordDelay + 2.0);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + chordDelay);
        osc.stop(now + chordDelay + 2.1);
      });
    } catch (e) {
      console.warn('Audio play error', e);
    }
  }

  /**
   * Pleasant success chime
   */
  public playSuccessChime() {
    if (this.muted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      [587.33, 880].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0.001, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.25, now + idx * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.36);
      });
    } catch (e) {
      console.warn('Audio play error', e);
    }
  }
}

export const soundEffects = new SoundService();
