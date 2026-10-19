// Web Audio API procedural sound generator (Rain & Soft White Noise)
class AmbientSoundManager {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;
  private currentType: 'rain' | 'library' = 'rain';

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public play(type: 'rain' | 'library' = 'rain') {
    this.stop();
    this.initContext();
    if (!this.ctx) return;

    this.currentType = type;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate pink noise / gentle filtered noise
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
      b6 = white * 0.115926;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // Filter configuration
    const filter = this.ctx.createBiquadFilter();
    if (type === 'rain') {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.2, this.ctx.currentTime);
    } else {
      // Library cozy warm ambient
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450, this.ctx.currentTime);
      filter.Q.setValueAtTime(0.8, this.ctx.currentTime);
    }

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(0.12, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);

    noise.start(0);
    this.noiseNode = noise;
    this.isPlaying = true;
  }

  public stop() {
    if (this.noiseNode) {
      try {
        (this.noiseNode as AudioBufferSourceNode).stop();
        this.noiseNode.disconnect();
      } catch (e) {
        // ignore
      }
      this.noiseNode = null;
    }
    this.isPlaying = false;
  }

  public toggle(type: 'rain' | 'library' = 'rain'): boolean {
    if (this.isPlaying && this.currentType === type) {
      this.stop();
      return false;
    } else {
      this.play(type);
      return true;
    }
  }

  public getStatus(): { isPlaying: boolean; type: 'rain' | 'library' } {
    return { isPlaying: this.isPlaying, type: this.currentType };
  }
}

export const ambientSound = new AmbientSoundManager();

// Speech Synthesis
export function speakKoreanText(text: string, onEnd?: () => void): boolean {
  if (!('speechSynthesis' in window)) return false;

  window.speechSynthesis.cancel();
  // Strip Markdown characters for clean speech
  const clean = text
    .replace(/[#*_`~[\]()>-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.lang = 'ko-KR';
  utterance.rate = 0.95; // Warm, comfortable pacing
  utterance.pitch = 1.0;

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
