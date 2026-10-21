import { describe, it, expect } from 'vitest';
import { clampPatch, clampValue, FOUNDATIONAL_PRESETS, INIT_SINE } from '../audio/presets';
import { computeDeterministicDiffs } from '../services/geminiSoundDesigner';
import { demoMelodyManager } from '../audio/demoMelody';
import { midiNumberToNote } from '../audio/midiManager';
import { SynthPatch } from '../types/synth';

describe('SynthLM Parameter Bounds & Clamping Safety', () => {
  it('clamps out-of-bounds frequencies and envelopes safely', () => {
    const dangerousInput: Partial<SynthPatch> = {
      filterCutoff: 999999, // way above 18000 Hz
      filterResonance: -10,  // below 0.1 Q
      attack: -5,           // negative attack
      sustain: 2.5,         // sustain above 1.0
      masterVolume: 20,     // volume above 0 dB
    };

    const safe = clampPatch(dangerousInput, INIT_SINE);

    expect(safe.filterCutoff).toBe(18000);
    expect(safe.filterResonance).toBe(0.1);
    expect(safe.attack).toBe(0.005);
    expect(safe.sustain).toBe(1.0);
    expect(safe.masterVolume).toBe(0);
  });

  it('handles NaN and undefined values with fallback', () => {
    expect(clampValue(NaN, 20, 20000, 1000)).toBe(1000);
    expect(clampValue(undefined, 0, 1, 0.5)).toBe(0.5);
  });

  it('preserves valid waveforms and resets invalid ones', () => {
    const invalidWavePatch = clampPatch({
      osc1Type: 'superSaw' as any, // invalid
      osc2Type: 'sawtooth',
      filterType: 'notch' as any,  // invalid
    }, INIT_SINE);

    expect(invalidWavePatch.osc1Type).toBe('sine'); // fallback
    expect(invalidWavePatch.osc2Type).toBe('sawtooth');
    expect(invalidWavePatch.filterType).toBe('lowpass'); // fallback
  });

  it('validates all foundational presets are in bounds', () => {
    for (const preset of FOUNDATIONAL_PRESETS) {
      const clamped = clampPatch(preset);
      expect(clamped.filterCutoff).toBeGreaterThanOrEqual(20);
      expect(clamped.filterCutoff).toBeLessThanOrEqual(18000);
      expect(clamped.attack).toBeGreaterThanOrEqual(0.005);
      expect(clamped.release).toBeLessThanOrEqual(5.0);
    }
  });
});

describe('Deterministic Parameter Diffing & AI Explanations', () => {
  it('correctly identifies modified parameters between old and new patch', () => {
    const oldPatch: SynthPatch = { ...INIT_SINE, filterCutoff: 10000, attack: 0.05, reverbWet: 0.1 };
    const newPatch: SynthPatch = { ...INIT_SINE, filterCutoff: 800, attack: 0.01, reverbWet: 0.6 };

    const diffs = computeDeterministicDiffs(oldPatch, newPatch);
    const keys = diffs.map((d) => d.paramKey);

    expect(keys).toContain('filterCutoff');
    expect(keys).toContain('reverbWet');
  });

  it('detects waveform changes', () => {
    const oldPatch: SynthPatch = { ...INIT_SINE, osc1Type: 'sine' };
    const newPatch: SynthPatch = { ...INIT_SINE, osc1Type: 'sawtooth' };

    const diffs = computeDeterministicDiffs(oldPatch, newPatch);
    expect(diffs.some((d) => d.paramKey === 'osc1Type')).toBe(true);
  });
});

describe('Demo Melody Parser & Web MIDI Note Mapping', () => {
  it('parses valid musical notes from a string and filters out invalid ones', () => {
    const notes = demoMelodyManager.parseMelody('C3 E3 G3 B3 invalid 123 F#4');
    expect(notes).toEqual(['C3', 'E3', 'G3', 'B3', 'F#4']);
  });

  it('correctly converts MIDI note numbers to scientific pitch notation', () => {
    expect(midiNumberToNote(60)).toBe('C4');
    expect(midiNumberToNote(69)).toBe('A4');
    expect(midiNumberToNote(36)).toBe('C2');
    expect(midiNumberToNote(61)).toBe('C#4');
  });
});
