import { SynthPatch, ParameterMeta, WaveformType, FilterType, LfoTarget } from '../types/synth';
import { getStandardPartials, clampPartials } from './waveMath';

export const PARAMETER_METAS: Record<string, ParameterMeta> = {
  // Dual Oscillators
  osc1Octave: { key: 'osc1Octave', label: 'OCTAVE', module: 'OSC 1', min: -2, max: 2, step: 1, unit: 'oct', defaultValue: 0 },
  osc1Detune: { key: 'osc1Detune', label: 'DETUNE', module: 'OSC 1', min: -100, max: 100, step: 1, unit: 'cents', defaultValue: 0 },
  osc1Mix: { key: 'osc1Mix', label: 'LEVEL', module: 'OSC 1', min: 0.0, max: 1.0, step: 0.01, unit: '%', defaultValue: 0.8 },

  osc2Octave: { key: 'osc2Octave', label: 'OCTAVE', module: 'OSC 2', min: -2, max: 2, step: 1, unit: 'oct', defaultValue: 0 },
  osc2Detune: { key: 'osc2Detune', label: 'DETUNE', module: 'OSC 2', min: -100, max: 100, step: 1, unit: 'cents', defaultValue: 7 },
  osc2Mix: { key: 'osc2Mix', label: 'LEVEL', module: 'OSC 2', min: 0.0, max: 1.0, step: 0.01, unit: '%', defaultValue: 0.0 },

  // Filter
  filterCutoff: { key: 'filterCutoff', label: 'CUTOFF', module: 'FILTER', min: 20, max: 18000, step: 10, unit: 'Hz', defaultValue: 2500 },
  filterResonance: { key: 'filterResonance', label: 'RESO', module: 'FILTER', min: 0.1, max: 18.0, step: 0.1, unit: 'Q', defaultValue: 1.5 },
  filterEnvAmount: { key: 'filterEnvAmount', label: 'FLT ENV', module: 'FILTER', min: -6000, max: 8000, step: 50, unit: 'Hz', defaultValue: 0 },

  // LFO
  lfoRate: { key: 'lfoRate', label: 'LFO RATE', module: 'LFO', min: 0.1, max: 12.0, step: 0.1, unit: 'Hz', defaultValue: 1.5 },
  lfoDepth: { key: 'lfoDepth', label: 'LFO DEPTH', module: 'LFO', min: 0.0, max: 1.0, step: 0.01, unit: '%', defaultValue: 0.0 },

  // ADSR Envelope
  attack: { key: 'attack', label: 'ATTACK', module: 'ENVELOPE', min: 0.005, max: 3.0, step: 0.005, unit: 's', defaultValue: 0.02 },
  decay: { key: 'decay', label: 'DECAY', module: 'ENVELOPE', min: 0.01, max: 3.0, step: 0.01, unit: 's', defaultValue: 0.3 },
  sustain: { key: 'sustain', label: 'SUSTAIN', module: 'ENVELOPE', min: 0.0, max: 1.0, step: 0.01, unit: '%', defaultValue: 0.6 },
  release: { key: 'release', label: 'RELEASE', module: 'ENVELOPE', min: 0.01, max: 5.0, step: 0.01, unit: 's', defaultValue: 0.4 },

  // FX Rack
  distortion: { key: 'distortion', label: 'DRIVE', module: 'FX', min: 0.0, max: 1.0, step: 0.01, unit: '%', defaultValue: 0.0 },
  chorusWet: { key: 'chorusWet', label: 'CHORUS', module: 'FX', min: 0.0, max: 1.0, step: 0.01, unit: '%', defaultValue: 0.0 },
  delayTime: { key: 'delayTime', label: 'DLY TIME', module: 'FX', min: 0.05, max: 1.0, step: 0.01, unit: 's', defaultValue: 0.25 },
  delayWet: { key: 'delayWet', label: 'DLY MIX', module: 'FX', min: 0.0, max: 1.0, step: 0.01, unit: '%', defaultValue: 0.0 },
  reverbDecay: { key: 'reverbDecay', label: 'REV SIZE', module: 'FX', min: 0.5, max: 8.0, step: 0.1, unit: 's', defaultValue: 2.0 },
  reverbWet: { key: 'reverbWet', label: 'REV MIX', module: 'FX', min: 0.0, max: 1.0, step: 0.01, unit: '%', defaultValue: 0.15 },

  // Master
  masterVolume: { key: 'masterVolume', label: 'VOLUME', module: 'MASTER', min: -24, max: 0, step: 0.5, unit: 'dB', defaultValue: -6 },
};

export const INIT_SINE: SynthPatch = {
  name: 'Init Sine',
  osc1Type: 'sine',
  osc1Octave: 0,
  osc1Detune: 0,
  osc1Mix: 0.85,
  osc1Partials: getStandardPartials('sine'),
  osc2Type: 'sine',
  osc2Octave: 0,
  osc2Detune: 0,
  osc2Mix: 0.0,
  osc2Partials: getStandardPartials('sine'),
  filterType: 'lowpass',
  filterCutoff: 12000,
  filterResonance: 1.0,
  filterEnvAmount: 0,
  lfoRate: 1.5,
  lfoDepth: 0.0,
  lfoTarget: 'filter',
  attack: 0.03,
  decay: 0.3,
  sustain: 0.7,
  release: 0.3,
  distortion: 0.0,
  chorusWet: 0.0,
  delayTime: 0.25,
  delayWet: 0.0,
  reverbDecay: 1.8,
  reverbWet: 0.1,
  masterVolume: -6,
};

export const INIT_SQUARE: SynthPatch = {
  name: 'Init Square',
  osc1Type: 'square',
  osc1Octave: 0,
  osc1Detune: 0,
  osc1Mix: 0.8,
  osc1Partials: getStandardPartials('square'),
  osc2Type: 'square',
  osc2Octave: 0,
  osc2Detune: 5,
  osc2Mix: 0.0,
  osc2Partials: getStandardPartials('square'),
  filterType: 'lowpass',
  filterCutoff: 6500,
  filterResonance: 1.5,
  filterEnvAmount: 0,
  lfoRate: 2.0,
  lfoDepth: 0.0,
  lfoTarget: 'filter',
  attack: 0.02,
  decay: 0.25,
  sustain: 0.65,
  release: 0.25,
  distortion: 0.0,
  chorusWet: 0.0,
  delayTime: 0.25,
  delayWet: 0.0,
  reverbDecay: 1.5,
  reverbWet: 0.1,
  masterVolume: -6,
};

export const INIT_TRIANGLE: SynthPatch = {
  name: 'Init Triangle',
  osc1Type: 'triangle',
  osc1Octave: 0,
  osc1Detune: 0,
  osc1Mix: 0.85,
  osc1Partials: getStandardPartials('triangle'),
  osc2Type: 'triangle',
  osc2Octave: 0,
  osc2Detune: 3,
  osc2Mix: 0.0,
  osc2Partials: getStandardPartials('triangle'),
  filterType: 'lowpass',
  filterCutoff: 8000,
  filterResonance: 1.2,
  filterEnvAmount: 0,
  lfoRate: 1.0,
  lfoDepth: 0.0,
  lfoTarget: 'pitch',
  attack: 0.04,
  decay: 0.35,
  sustain: 0.7,
  release: 0.4,
  distortion: 0.0,
  chorusWet: 0.0,
  delayTime: 0.3,
  delayWet: 0.0,
  reverbDecay: 2.0,
  reverbWet: 0.15,
  masterVolume: -6,
};

export const INIT_SAW: SynthPatch = {
  name: 'Init Saw',
  osc1Type: 'sawtooth',
  osc1Octave: 0,
  osc1Detune: 0,
  osc1Mix: 0.8,
  osc1Partials: getStandardPartials('sawtooth'),
  osc2Type: 'sawtooth',
  osc2Octave: 0,
  osc2Detune: 8,
  osc2Mix: 0.4,
  osc2Partials: getStandardPartials('sawtooth'),
  filterType: 'lowpass',
  filterCutoff: 4500,
  filterResonance: 2.0,
  filterEnvAmount: 0,
  lfoRate: 1.5,
  lfoDepth: 0.0,
  lfoTarget: 'filter',
  attack: 0.015,
  decay: 0.3,
  sustain: 0.6,
  release: 0.3,
  distortion: 0.05,
  chorusWet: 0.1,
  delayTime: 0.25,
  delayWet: 0.05,
  reverbDecay: 2.2,
  reverbWet: 0.2,
  masterVolume: -6,
};

export const FOUNDATIONAL_PRESETS: SynthPatch[] = [
  INIT_SINE,
  INIT_SQUARE,
  INIT_TRIANGLE,
  INIT_SAW,
];

const VALID_WAVEFORMS: WaveformType[] = ['sine', 'square', 'triangle', 'sawtooth', 'custom'];
const VALID_FILTERS: FilterType[] = ['lowpass', 'highpass', 'bandpass'];
const VALID_LFO_TARGETS: LfoTarget[] = ['filter', 'pitch', 'tremolo'];

export function clampValue(val: number | undefined, min: number, max: number, fallback: number): number {
  if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) return fallback;
  return Math.min(Math.max(val, min), max);
}

export function clampPatch(patch: Partial<SynthPatch>, fallback: SynthPatch = INIT_SINE): SynthPatch {
  const osc1Type = VALID_WAVEFORMS.includes(patch.osc1Type as WaveformType) ? (patch.osc1Type as WaveformType) : fallback.osc1Type;
  const osc2Type = VALID_WAVEFORMS.includes(patch.osc2Type as WaveformType) ? (patch.osc2Type as WaveformType) : fallback.osc2Type;
  const lfoTarget = VALID_LFO_TARGETS.includes(patch.lfoTarget as LfoTarget) ? (patch.lfoTarget as LfoTarget) : fallback.lfoTarget;

  const result: SynthPatch = {
    name: typeof patch.name === 'string' && patch.name.trim() ? patch.name.trim() : fallback.name,
    osc1Type,
    osc1Octave: clampValue(patch.osc1Octave, -2, 2, fallback.osc1Octave),
    osc1Detune: clampValue(patch.osc1Detune, -100, 100, fallback.osc1Detune),
    osc1Mix: clampValue(patch.osc1Mix, 0, 1, fallback.osc1Mix),
    osc1Partials: clampPartials(patch.osc1Partials ?? fallback.osc1Partials, osc1Type),
    osc2Type,
    osc2Octave: clampValue(patch.osc2Octave, -2, 2, fallback.osc2Octave),
    osc2Detune: clampValue(patch.osc2Detune, -100, 100, fallback.osc2Detune),
    osc2Mix: clampValue(patch.osc2Mix, 0, 1, fallback.osc2Mix),
    osc2Partials: clampPartials(patch.osc2Partials ?? fallback.osc2Partials, osc2Type),
    filterType: VALID_FILTERS.includes(patch.filterType as FilterType) ? (patch.filterType as FilterType) : fallback.filterType,
    filterCutoff: clampValue(patch.filterCutoff, 20, 18000, fallback.filterCutoff),
    filterResonance: clampValue(patch.filterResonance, 0.1, 18, fallback.filterResonance),
    filterEnvAmount: clampValue(patch.filterEnvAmount, -6000, 8000, fallback.filterEnvAmount ?? 0),
    lfoRate: clampValue(patch.lfoRate, 0.1, 12, fallback.lfoRate ?? 1.5),
    lfoDepth: clampValue(patch.lfoDepth, 0, 1, fallback.lfoDepth ?? 0),
    lfoTarget,
    attack: clampValue(patch.attack, 0.005, 3.0, fallback.attack),
    decay: clampValue(patch.decay, 0.01, 3.0, fallback.decay),
    sustain: clampValue(patch.sustain, 0.0, 1.0, fallback.sustain),
    release: clampValue(patch.release, 0.01, 5.0, fallback.release),
    distortion: clampValue(patch.distortion, 0.0, 1.0, fallback.distortion),
    chorusWet: clampValue(patch.chorusWet, 0.0, 1.0, fallback.chorusWet),
    delayTime: clampValue(patch.delayTime, 0.05, 1.0, fallback.delayTime),
    delayWet: clampValue(patch.delayWet, 0.0, 1.0, fallback.delayWet),
    reverbDecay: clampValue(patch.reverbDecay, 0.5, 8.0, fallback.reverbDecay),
    reverbWet: clampValue(patch.reverbWet, 0.0, 1.0, fallback.reverbWet),
    masterVolume: clampValue(patch.masterVolume, -24, 0, fallback.masterVolume),
  };
  return result;
}
