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

  // Processing Chain
  private filter: Tone.Filter | null = null;
  private distortion: Tone.Distortion | null = null;
  private chorus: Tone.Chorus | null = null;
  private delay: Tone.FeedbackDelay | null = null;
  private reverb: Tone.Reverb | null = null;
  private volume: Tone.Volume | null = null;
  private limiter: Tone.Limiter | null = null;

  // Analysers
  private waveformAnalyser: Tone.Analyser | null = null;
  private fftAnalyser: Tone.Analyser | null = null;

  // Active notes tracking
  private activeNotes = new Map<string, { osc1Note: string; osc2Note: string }>();

  public async init(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      await Tone.start();

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

      // Connect Signal Graph:
      // osc1 -> osc1Gain ──┐
      //                    ├─> filter -> distortion -> chorus -> delay -> reverb -> volume -> analysers -> limiter -> destination
      // osc2 -> osc2Gain ──┘
      this.osc1Synth.connect(this.osc1Gain);
      this.osc2Synth.connect(this.osc2Gain);

      this.osc1Gain.connect(this.filter);
      this.osc2Gain.connect(this.filter);

      this.filter.chain(
        this.distortion,
        this.chorus,
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

  public getInitialized(): boolean {
    return this.isInitialized;
  }

  public applyPatch(newPatch: Partial<SynthPatch>): SynthPatch {
    const clamped = clampPatch(newPatch, this.currentPatch);
    this.currentPatch = { ...clamped };

    if (!this.isInitialized) return this.currentPatch;

    try {
      // Oscillators & Envelopes
      const osc1OscOptions = clamped.osc1Type === 'custom'
        ? { type: 'custom' as const, partials: clamped.osc1Partials || [1] }
        : { type: clamped.osc1Type };

      this.osc1Synth?.set({
        detune: clamped.osc1Detune,
        oscillator: osc1OscOptions as any,
        envelope: {
          attack: clamped.attack,
          decay: clamped.decay,
          sustain: clamped.sustain,
          release: clamped.release,
        },
      });

      const osc2OscOptions = clamped.osc2Type === 'custom'
        ? { type: 'custom' as const, partials: clamped.osc2Partials || [1] }
        : { type: clamped.osc2Type };

      this.osc2Synth?.set({
        detune: clamped.osc2Detune,
        oscillator: osc2OscOptions as any,
        envelope: {
          attack: clamped.attack,
          decay: clamped.decay,
          sustain: clamped.sustain,
          release: clamped.release,
        },
      });

      // Gains
      if (this.osc1Gain) this.osc1Gain.gain.rampTo(clamped.osc1Mix, 0.05);
      if (this.osc2Gain) this.osc2Gain.gain.rampTo(clamped.osc2Mix, 0.05);

      // Filter
      if (this.filter) {
        this.filter.type = clamped.filterType;
        this.filter.frequency.rampTo(clamped.filterCutoff, 0.05);
        this.filter.Q.rampTo(clamped.filterResonance, 0.05);
      }

      // Distortion
      if (this.distortion) {
        this.distortion.distortion = clamped.distortion;
        this.distortion.wet.rampTo(clamped.distortion > 0 ? 0.8 : 0.0, 0.05);
      }

      // Chorus
      if (this.chorus) {
        this.chorus.wet.rampTo(clamped.chorusWet, 0.05);
      }

      // Delay
      if (this.delay) {
        this.delay.delayTime.rampTo(clamped.delayTime, 0.05);
        this.delay.wet.rampTo(clamped.delayWet, 0.05);
      }

      // Reverb
      if (this.reverb) {
        this.reverb.wet.rampTo(clamped.reverbWet, 0.05);
      }

      // Master Volume
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

    try {
      if (this.currentPatch.osc1Mix > 0.01 && this.osc1Synth) {
        this.osc1Synth.triggerAttack(osc1Note, undefined, velocity);
      }
      if (this.currentPatch.osc2Mix > 0.01 && this.osc2Synth) {
        this.osc2Synth.triggerAttack(osc2Note, undefined, velocity);
      }
      this.activeNotes.set(note, { osc1Note, osc2Note });
    } catch (e) {
      console.warn('noteOn error:', e);
    }
  }

  public noteOff(note: string): void {
    if (!this.isInitialized) return;

    const notes = this.activeNotes.get(note);
    try {
      if (notes) {
        if (this.osc1Synth) this.osc1Synth.triggerRelease(notes.osc1Note);
        if (this.osc2Synth) this.osc2Synth.triggerRelease(notes.osc2Note);
        this.activeNotes.delete(note);
      } else {
        // Fallback release
        const osc1Note = this.calculateShiftedNote(note, this.currentPatch.osc1Octave);
        const osc2Note = this.calculateShiftedNote(note, this.currentPatch.osc2Octave);
        this.osc1Synth?.triggerRelease(osc1Note);
        this.osc2Synth?.triggerRelease(osc2Note);
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
