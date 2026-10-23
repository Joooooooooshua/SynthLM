import * as Tone from 'tone';
import { SynthPatch } from '../types/synth';
import { INIT_SINE, clampPatch } from './presets';

class SynthEngine {
  private isInitialized = false;
  private currentPatch: SynthPatch = { ...INIT_SINE };

  // Synths
  private osc1Synth: Tone.PolySynth | null = null;
  private osc2Synth: Tone.PolySynth | null = null;

  // Mix gains
  private osc1Gain: Tone.Gain | null = null;
  private osc2Gain: Tone.Gain | null = null;

  // Effects & Modulators
  private filter: Tone.Filter | null = null;
  private distortion: Tone.Distortion | null = null;
  private chorus: Tone.Chorus | null = null;
  private vibrato: Tone.Vibrato | null = null;
  private delay: Tone.FeedbackDelay | null = null;
  private reverb: Tone.Reverb | null = null;
  private volume: Tone.Volume | null = null;
  private limiter: Tone.Limiter | null = null;

  // LFO
  private lfo: Tone.LFO | null = null;
  private lfoTargetGain: Tone.Gain | null = null;

  // Analysers
  private waveformAnalyser: Tone.Analyser | null = null;
  private fftAnalyser: Tone.Analyser | null = null;

  // Oscillator Caching to avoid synchronous periodic wave recalculations
  private cachedOsc1Key = '';
  private cachedOsc2Key = '';

  // Active notes tracking
  private activeNotes = new Map<string, { osc1Note: string; osc2Note: string }>();

  public async init(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      await Tone.start();

      // Configure low-latency interactive audio context
      Tone.getContext().lookAhead = 0;

      // Create Analysers
      this.waveformAnalyser = new Tone.Analyser('waveform', 512);
      this.fftAnalyser = new Tone.Analyser('fft', 128);

      // Create Master & Limiter
      this.limiter = new Tone.Limiter(-1).toDestination();
      this.volume = new Tone.Volume(this.currentPatch.masterVolume);

      // Create Effects
      this.reverb = new Tone.Reverb({
        decay: this.currentPatch.reverbDecay,
        wet: this.currentPatch.reverbWet,
      });
      // Generate reverb impulse
      await this.reverb.generate();

      this.delay = new Tone.FeedbackDelay({
        delayTime: this.currentPatch.delayTime,
        feedback: 0.35,
        wet: this.currentPatch.delayWet,
      });

      this.chorus = new Tone.Chorus({
        frequency: 2.5,
        delayTime: 3.5,
        depth: 0.7,
        wet: this.currentPatch.chorusWet,
      }).start();

      this.vibrato = new Tone.Vibrato({
        frequency: this.currentPatch.lfoRate,
        depth: this.currentPatch.lfoTarget === 'pitch' ? this.currentPatch.lfoDepth * 0.4 : 0,
      });

      this.distortion = new Tone.Distortion({
        distortion: this.currentPatch.distortion,
        wet: this.currentPatch.distortion > 0 ? 0.8 : 0.0,
      });

      this.filter = new Tone.Filter({
        type: this.currentPatch.filterType,
        frequency: this.currentPatch.filterCutoff,
        Q: this.currentPatch.filterResonance,
        rolloff: -24,
      });

      // LFO Setup
      this.lfoTargetGain = new Tone.Gain(0);
      this.lfo = new Tone.LFO({
        frequency: this.currentPatch.lfoRate,
        min: -1,
        max: 1,
      }).start();
      this.lfo.connect(this.lfoTargetGain);
      this.setupLfoRouting();

      // Gains
      this.osc1Gain = new Tone.Gain(this.currentPatch.osc1Mix);
      this.osc2Gain = new Tone.Gain(this.currentPatch.osc2Mix);

      // Synths
      const osc1InitOptions = this.currentPatch.osc1Type === 'custom'
        ? { type: 'custom' as const, partials: this.currentPatch.osc1Partials || [1] }
        : { type: this.currentPatch.osc1Type };

      this.osc1Synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: osc1InitOptions as any,
        envelope: {
          attack: this.currentPatch.attack,
          decay: this.currentPatch.decay,
          sustain: this.currentPatch.sustain,
          release: this.currentPatch.release,
        },
      });
      this.osc1Synth.set({ detune: this.currentPatch.osc1Detune });
      this.cachedOsc1Key = `${this.currentPatch.osc1Type}:${(this.currentPatch.osc1Partials || []).join(',')}`;

      const osc2InitOptions = this.currentPatch.osc2Type === 'custom'
        ? { type: 'custom' as const, partials: this.currentPatch.osc2Partials || [1] }
        : { type: this.currentPatch.osc2Type };

      this.osc2Synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: osc2InitOptions as any,
        envelope: {
          attack: this.currentPatch.attack,
          decay: this.currentPatch.decay,
          sustain: this.currentPatch.sustain,
          release: this.currentPatch.release,
        },
      });
      this.osc2Synth.set({ detune: this.currentPatch.osc2Detune });
      this.cachedOsc2Key = `${this.currentPatch.osc2Type}:${(this.currentPatch.osc2Partials || []).join(',')}`;

      // Connect Signal Graph:
      // osc1 -> osc1Gain ──┐
      //                    ├─> filter -> distortion -> chorus -> vibrato -> delay -> reverb -> volume -> analysers -> limiter -> destination
      // osc2 -> osc2Gain ──┘
      this.osc1Synth.connect(this.osc1Gain);
      this.osc2Synth.connect(this.osc2Gain);

      this.osc1Gain.connect(this.filter);
      this.osc2Gain.connect(this.filter);

      this.filter.chain(
        this.distortion,
        this.chorus,
        this.vibrato,
        this.delay,
        this.reverb,
        this.volume,
        this.waveformAnalyser,
        this.fftAnalyser,
        this.limiter
      );

      this.isInitialized = true;
      return true;
    } catch (err) {
      console.error('Failed to initialize Tone.js audio engine:', err);
      return false;
    }
  }

  private setupLfoRouting(): void {
    if (!this.lfo || !this.lfoTargetGain) return;

    try {
      this.lfoTargetGain.disconnect();

      const depth = this.currentPatch.lfoDepth;
      const target = this.currentPatch.lfoTarget;

      // Pitch vibrato via dedicated modulated delay node
      if (this.vibrato) {
        if (target === 'pitch' && depth > 0.005) {
          this.vibrato.frequency.value = this.currentPatch.lfoRate;
          this.vibrato.depth.value = depth * 0.45;
        } else {
          this.vibrato.depth.value = 0;
        }
      }

      if (depth < 0.005) {
        this.lfoTargetGain.gain.value = 0;
        return;
      }

      if (target === 'filter' && this.filter) {
        // Modulate filter cutoff: up to +/- 2400 Hz sweep
        const sweepRange = Math.min(3500, Math.max(100, this.currentPatch.filterCutoff * 0.75));
        this.lfoTargetGain.gain.rampTo(depth * sweepRange, 0.05);
        this.lfoTargetGain.connect(this.filter.frequency);
      } else if (target === 'tremolo' && this.volume) {
        // Modulate volume: subtle pulse up to +/- 6 dB
        this.lfoTargetGain.gain.rampTo(depth * 6, 0.05);
        this.lfoTargetGain.connect(this.volume.volume);
      }
    } catch (e) {
      console.warn('setupLfoRouting error:', e);
    }
  }

  public getInitialized(): boolean {
    return this.isInitialized;
  }

  public applyPatch(newPatch: Partial<SynthPatch>): SynthPatch {
    const clamped = clampPatch(newPatch, this.currentPatch);
    this.currentPatch = { ...clamped };

    if (!this.isInitialized) return this.currentPatch;

    try {
      // 1. Oscillators: Only regenerate wavetables when type or partials actually change!
      const newOsc1Key = `${clamped.osc1Type}:${(clamped.osc1Partials || []).join(',')}`;
      if (newOsc1Key !== this.cachedOsc1Key) {
        const osc1OscOptions = clamped.osc1Type === 'custom'
          ? { type: 'custom' as const, partials: clamped.osc1Partials || [1] }
          : { type: clamped.osc1Type };
        this.osc1Synth?.set({ oscillator: osc1OscOptions as any });
        this.cachedOsc1Key = newOsc1Key;
      }

      this.osc1Synth?.set({
        detune: clamped.osc1Detune,
        envelope: {
          attack: clamped.attack,
          decay: clamped.decay,
          sustain: clamped.sustain,
          release: clamped.release,
        },
      });

      const newOsc2Key = `${clamped.osc2Type}:${(clamped.osc2Partials || []).join(',')}`;
      if (newOsc2Key !== this.cachedOsc2Key) {
        const osc2OscOptions = clamped.osc2Type === 'custom'
          ? { type: 'custom' as const, partials: clamped.osc2Partials || [1] }
          : { type: clamped.osc2Type };
        this.osc2Synth?.set({ oscillator: osc2OscOptions as any });
        this.cachedOsc2Key = newOsc2Key;
      }

      this.osc2Synth?.set({
        detune: clamped.osc2Detune,
        envelope: {
          attack: clamped.attack,
          decay: clamped.decay,
          sustain: clamped.sustain,
          release: clamped.release,
        },
      });

      // 2. Gains
      if (this.osc1Gain) this.osc1Gain.gain.rampTo(clamped.osc1Mix, 0.05);
      if (this.osc2Gain) this.osc2Gain.gain.rampTo(clamped.osc2Mix, 0.05);

      // 3. Filter
      if (this.filter) {
        this.filter.type = clamped.filterType;
        this.filter.frequency.rampTo(clamped.filterCutoff, 0.05);
        this.filter.Q.rampTo(clamped.filterResonance, 0.05);
      }

      // 4. LFO
      if (this.lfo) {
        this.lfo.frequency.rampTo(clamped.lfoRate, 0.05);
      }
      this.setupLfoRouting();

      // 5. Effects
      if (this.distortion) {
        this.distortion.distortion = clamped.distortion;
        this.distortion.wet.rampTo(clamped.distortion > 0 ? 0.8 : 0.0, 0.05);
      }

      if (this.chorus) {
        this.chorus.wet.rampTo(clamped.chorusWet, 0.05);
      }

      if (this.delay) {
        this.delay.delayTime.rampTo(clamped.delayTime, 0.05);
        this.delay.wet.rampTo(clamped.delayWet, 0.05);
      }

      if (this.reverb) {
        this.reverb.wet.rampTo(clamped.reverbWet, 0.05);
      }

      if (this.volume) {
        this.volume.volume.rampTo(clamped.masterVolume, 0.05);
      }
    } catch (e) {
      console.warn('Error applying patch to audio nodes:', e);
    }

    return this.currentPatch;
  }

  public setParam<K extends keyof SynthPatch>(key: K, value: SynthPatch[K]): SynthPatch {
    return this.applyPatch({ [key]: value });
  }

  public getPatch(): SynthPatch {
    return { ...this.currentPatch };
  }

  private calculateShiftedNote(baseNote: string, octaveOffset: number): string {
    if (octaveOffset === 0) return baseNote;
    try {
      const freq = Tone.Frequency(baseNote).transpose(octaveOffset * 12);
      return freq.toNote();
    } catch {
      return baseNote;
    }
  }

  public noteOn(note: string, velocity = 0.8): void {
    if (!this.isInitialized) {
      this.init().then(() => this.noteOn(note, velocity));
      return;
    }

    const osc1Note = this.calculateShiftedNote(note, this.currentPatch.osc1Octave);
    const osc2Note = this.calculateShiftedNote(note, this.currentPatch.osc2Octave);
    const now = Tone.immediate();

    try {
      if (this.currentPatch.osc1Mix > 0.01 && this.osc1Synth) {
        this.osc1Synth.triggerAttack(osc1Note, now, velocity);
      }
      if (this.currentPatch.osc2Mix > 0.01 && this.osc2Synth) {
        this.osc2Synth.triggerAttack(osc2Note, now, velocity);
      }
      this.activeNotes.set(note, { osc1Note, osc2Note });

      // Trigger dynamic Filter Envelope sweep (e.g., Electric Piano attack bite / Brass swell)
      if (this.filter && Math.abs(this.currentPatch.filterEnvAmount) > 10) {
        const baseCutoff = this.currentPatch.filterCutoff;
        const envPeak = Math.max(20, Math.min(18000, baseCutoff + this.currentPatch.filterEnvAmount * velocity));
        const attackTime = Math.max(0.005, this.currentPatch.attack);
        const decayTime = Math.max(0.01, this.currentPatch.decay);

        this.filter.frequency.cancelScheduledValues(now);
        this.filter.frequency.setValueAtTime(baseCutoff, now);
        this.filter.frequency.linearRampToValueAtTime(envPeak, now + attackTime);
        this.filter.frequency.exponentialRampToValueAtTime(Math.max(20, baseCutoff), now + attackTime + decayTime);
      }
    } catch (e) {
      console.warn('noteOn error:', e);
    }
  }

  public noteOff(note: string): void {
    if (!this.isInitialized) return;

    const notes = this.activeNotes.get(note);
    const now = Tone.immediate();

    try {
      if (notes) {
        if (this.osc1Synth) this.osc1Synth.triggerRelease(notes.osc1Note, now);
        if (this.osc2Synth) this.osc2Synth.triggerRelease(notes.osc2Note, now);
        this.activeNotes.delete(note);
      } else {
        // Fallback release
        const osc1Note = this.calculateShiftedNote(note, this.currentPatch.osc1Octave);
        const osc2Note = this.calculateShiftedNote(note, this.currentPatch.osc2Octave);
        this.osc1Synth?.triggerRelease(osc1Note, now);
        this.osc2Synth?.triggerRelease(osc2Note, now);
      }
    } catch (e) {
      console.warn('noteOff error:', e);
    }
  }

  public releaseAll(): void {
    if (!this.isInitialized) return;
    try {
      this.osc1Synth?.releaseAll();
      this.osc2Synth?.releaseAll();
      this.activeNotes.clear();
    } catch (e) {
      console.warn('releaseAll error:', e);
    }
  }

  public getWaveformData(): Float32Array | null {
    if (!this.waveformAnalyser) return null;
    return this.waveformAnalyser.getValue() as Float32Array;
  }

  public getFrequencyData(): Float32Array | null {
    if (!this.fftAnalyser) return null;
    return this.fftAnalyser.getValue() as Float32Array;
  }
}

export const synthEngine = new SynthEngine();
