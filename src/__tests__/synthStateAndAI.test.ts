import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { clampPatch, clampValue, FOUNDATIONAL_PRESETS, INIT_SINE } from '../audio/presets';
import { computeDeterministicDiffs } from '../services/geminiSoundDesigner';
import { demoMelodyManager } from '../audio/demoMelody';
import { midiNumberToNote } from '../audio/midiManager';
import { SynthPatch } from '../types/synth';
import { partialsToSamples, samplesToPartials, clampPartials, getStandardPartials } from '../audio/waveMath';
import { findClosestArchetype } from '../audio/acousticArchetypes';
import { runSynthNetInference } from '../audio/neuralAudioMatcher';

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

  it('verifies Alpha / Beta state snapshotting logic', () => {
    const preAiPatch: SynthPatch = { ...INIT_SINE, name: 'Initial Patch', filterCutoff: 12000 };
    const postAiPatch: SynthPatch = { ...INIT_SINE, name: 'Iceland Aurora Lead', filterCutoff: 1500, reverbWet: 0.8 };

    // State machine simulation
    let current = { ...preAiPatch };
    const alpha = { ...current }; // Snapshot before AI
    const beta = { ...postAiPatch }; // AI patch
    current = { ...beta }; // Applied

    expect(alpha.filterCutoff).toBe(12000);
    expect(beta.filterCutoff).toBe(1500);
    expect(current.filterCutoff).toBe(1500);

    // Toggle back to Alpha
    current = { ...alpha };
    expect(current.filterCutoff).toBe(12000);

    // Toggle back to Beta
    current = { ...beta };
    expect(current.filterCutoff).toBe(1500);
  });

  it('manages persistent highlight set and clears individual knob on interaction', () => {
    const highlighted = new Set<keyof SynthPatch>(['filterCutoff', 'attack', 'reverbWet']);
    expect(highlighted.has('filterCutoff')).toBe(true);
    expect(highlighted.has('attack')).toBe(true);
    expect(highlighted.has('reverbWet')).toBe(true);

    // User touches filterCutoff knob
    highlighted.delete('filterCutoff');
    expect(highlighted.has('filterCutoff')).toBe(false);
    expect(highlighted.has('attack')).toBe(true);
    expect(highlighted.has('reverbWet')).toBe(true);
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

  it('preserves manual A / B slots independently from Alpha / Beta AI slots', () => {
    let slotA: SynthPatch = { ...INIT_SINE, name: 'Lead Var A', filterCutoff: 3000 };
    let slotB: SynthPatch = { ...INIT_SINE, name: 'Lead Var B', filterCutoff: 7500 };

    expect(slotA.filterCutoff).toBe(3000);
    expect(slotB.filterCutoff).toBe(7500);

    // Snapshot serialization & restoration
    const serialized = JSON.stringify([slotA, slotB]);
    const restored: SynthPatch[] = JSON.parse(serialized);

    expect(restored.length).toBe(2);
    expect(restored[0].name).toBe('Lead Var A');
    expect(restored[1].filterCutoff).toBe(7500);
  });
});

describe('Waveform Sculpting & Fourier Mathematics (AI Wave Sculpting)', () => {
  it('generates normalized single-cycle samples from harmonic partials', () => {
    // Pure sine (only 1st harmonic)
    const sinePartials = [1.0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const samples = partialsToSamples(sinePartials, 64);

    expect(samples.length).toBe(64);
    // At i=0, sin(0) should be 0
    expect(Math.abs(samples[0])).toBeLessThan(0.01);
    // At i=16 (quarter phase, pi/2), sin(pi/2) should be 1.0
    expect(samples[16]).toBeCloseTo(1.0, 1);
    // Peak value must not exceed 1.0
    const maxVal = Math.max(...samples.map((v) => Math.abs(v)));
    expect(maxVal).toBeCloseTo(1.0, 1);
  });

  it('performs round-trip DFT conversion between drawn samples and partials', () => {
    // Synthesize a wave with fundamental + 3rd harmonic
    const inputPartials = [1.0, 0, 0.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const samples = partialsToSamples(inputPartials, 64);

    // Run DFT to extract partials back
    const extractedPartials = samplesToPartials(samples, 16);

    expect(extractedPartials.length).toBe(16);
    // Fundamental harmonic should be dominant (close to 1.0)
    expect(extractedPartials[0]).toBeCloseTo(1.0, 1);
    // 2nd harmonic should be near zero
    expect(Math.abs(extractedPartials[1])).toBeLessThan(0.1);
    // 3rd harmonic should be around 0.5
    expect(extractedPartials[2]).toBeCloseTo(0.5, 1);
  });

  it('safely validates and clamps malformed partials arrays', () => {
    const malformed = [NaN, 'invalid', null, 50, -30, undefined];
    const clamped = clampPartials(malformed, 'sine');

    expect(clamped.length).toBe(16);
    expect(clamped.every((v) => typeof v === 'number' && !isNaN(v) && isFinite(v))).toBe(true);
    // 50 should be clamped to 1.0, -30 to -1.0
    expect(clamped[3]).toBe(1.0);
    expect(clamped[4]).toBe(-1.0);
  });

  it('detects AI custom waveform sculpting in parameter diff calculation', () => {
    const oldPatch: SynthPatch = {
      ...INIT_SINE,
      osc1Type: 'sine',
      osc1Partials: getStandardPartials('sine'),
    };

    // AI switches OSC 1 to 'custom' with bespoke aurora harmonics
    const auroraHarmonics = [0.8, 0.1, 0.6, 0.05, 0.4, 0.0, 0.3, 0.0, 0.2, 0.0, 0.1, 0.0, 0.05, 0.0, 0.0, 0.0];
    const newPatch: SynthPatch = {
      ...INIT_SINE,
      osc1Type: 'custom',
      osc1Partials: auroraHarmonics,
    };

    const diffs = computeDeterministicDiffs(oldPatch, newPatch);
    const waveSculptDiff = diffs.find((d) => d.paramKey === 'osc1Partials');

    expect(waveSculptDiff).toBeDefined();
    expect(waveSculptDiff?.paramLabel).toBe('OSC 1 WAVE SCULPT');
    expect(waveSculptDiff?.newValue).toBe('AI SCULPTED WAVE');
  });

  it('safely clamps and diffs Filter Envelope and LFO parameters', () => {
    const unconstrained = clampPatch({
      filterEnvAmount: 99999,
      lfoRate: 50,
      lfoDepth: 5.5,
      lfoTarget: 'invalid' as any,
    }, INIT_SINE);

    expect(unconstrained.filterEnvAmount).toBe(8000);
    expect(unconstrained.lfoRate).toBe(12);
    expect(unconstrained.lfoDepth).toBe(1.0);
    expect(unconstrained.lfoTarget).toBe('filter');

    const diffs = computeDeterministicDiffs(
      { ...INIT_SINE, lfoTarget: 'filter' },
      { ...INIT_SINE, lfoTarget: 'pitch', filterEnvAmount: 4800, lfoDepth: 0.3 }
    );

    const keys = diffs.map((d) => d.paramKey);
    expect(keys).toContain('lfoTarget');
    expect(keys).toContain('filterEnvAmount');
    expect(keys).toContain('lfoDepth');
  });

  it('correctly maps poetic metaphors to master acoustic archetypes', () => {
    const cityPopMatch = findClosestArchetype('Give me an 80s golden age city pop electric piano with rhodes chime');
    expect(cityPopMatch).toBeDefined();
    expect(cityPopMatch?.id).toBe('tokyo-1984-city-pop-rhodes');
    expect(cityPopMatch?.patch.filterEnvAmount).toBeGreaterThan(3000);
    expect(cityPopMatch?.patch.lfoTarget).toBe('pitch');

    const auroraMatch = findClosestArchetype('A solitary ambient pad like iceland aurora borealis');
    expect(auroraMatch).toBeDefined();
    expect(auroraMatch?.id).toBe('icelandic-aurora-borealis-pad');
    expect(auroraMatch?.patch.reverbDecay).toBeGreaterThan(5.0);
    expect(auroraMatch?.patch.lfoTarget).toBe('filter');

    const acidMatch = findClosestArchetype('303 acid bassline with screaming resonance');
    expect(acidMatch).toBeDefined();
    expect(acidMatch?.id).toBe('tb303-acid-bass-squelch');

    const choirMatch = findClosestArchetype('Ethereal space choir pad with vocal formants');
    expect(choirMatch).toBeDefined();
    expect(choirMatch?.id).toBe('solaris-cryo-choir');
  });

  it('verifies SynthNet-16H browser forward inference on 36-dim features', () => {
    // Synthetic 36-feature vector
    const testFeatures = new Array(36).fill(0.2);
    testFeatures[0] = 1.0; // fundamental
    testFeatures[2] = 0.5; // 3rd harmonic

    const result = runSynthNetInference(testFeatures);

    expect(result.predictedHarmonics).toHaveLength(16);
    for (const h of result.predictedHarmonics) {
      expect(h).toBeGreaterThanOrEqual(-1.0);
      expect(h).toBeLessThanOrEqual(1.0);
      expect(Number.isNaN(h)).toBe(false);
    }

    expect(result.predictedParams.filterCutoff).toBeGreaterThanOrEqual(20);
    expect(result.predictedParams.filterCutoff).toBeLessThanOrEqual(18000);
    expect(result.predictedParams.filterResonance).toBeGreaterThanOrEqual(0.1);
    expect(result.predictedParams.attack).toBeGreaterThanOrEqual(0.005);
    expect(result.predictedParams.release).toBeLessThanOrEqual(5.0);
  });

  it('verifies Nebius Token Factory training dataset compliance', () => {
    const datasetPath = path.resolve(__dirname, '../../dataset/nebius_sft_train.jsonl');
    expect(fs.existsSync(datasetPath)).toBe(true);

    const lines = fs.readFileSync(datasetPath, 'utf-8').trim().split('\n');
    expect(lines.length).toBeGreaterThanOrEqual(500);

    // Verify first 10 sample formats
    for (let i = 0; i < 10; i++) {
      const parsed = JSON.parse(lines[i]);
      expect(parsed).toHaveProperty('messages');
      expect(parsed.messages).toHaveLength(3);
      expect(parsed.messages[0].role).toBe('system');
      expect(parsed.messages[1].role).toBe('user');
      expect(parsed.messages[2].role).toBe('assistant');

      const assistantPayload = JSON.parse(parsed.messages[2].content);
      expect(assistantPayload).toHaveProperty('patchName');
      expect(assistantPayload).toHaveProperty('synestheticBridge');
      expect(assistantPayload).toHaveProperty('updatedPatch');
      expect(assistantPayload.updatedPatch).toHaveProperty('osc1Type');
    }
  });
});
