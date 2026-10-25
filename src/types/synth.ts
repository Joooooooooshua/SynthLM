export type WaveformType = 'sine' | 'square' | 'triangle' | 'sawtooth' | 'custom';
export type FilterType = 'lowpass' | 'highpass' | 'bandpass';
export type LfoTarget = 'filter' | 'pitch' | 'tremolo';

export interface SynthPatch {
  name: string;
  // Dual Oscillators
  osc1Type: WaveformType;
  osc1Octave: number;       // -2 to +2
  osc1Detune: number;       // -100 to +100 cents
  osc1Mix: number;          // 0.0 to 1.0
  osc1Partials?: number[];  // 16 harmonic Fourier coefficients [-1.0 to 1.0]
  osc2Type: WaveformType;
  osc2Octave: number;       // -2 to +2
  osc2Detune: number;       // -100 to +100 cents
  osc2Mix: number;          // 0.0 to 1.0
  osc2Partials?: number[];  // 16 harmonic Fourier coefficients [-1.0 to 1.0]
  // Filter & Filter Envelope
  filterType: FilterType;
  filterCutoff: number;     // 20 to 18000 Hz
  filterResonance: number;  // 0.1 to 18.0 Q
  filterEnvAmount: number;  // -6000 to +8000 Hz dynamic envelope sweep
  // LFO (Low Frequency Oscillator)
  lfoRate: number;          // 0.1 to 12.0 Hz
  lfoDepth: number;         // 0.0 to 1.0 amount
  lfoTarget: LfoTarget;     // 'filter' | 'pitch' | 'tremolo'
  // Amplitude Envelope (ADSR)
  attack: number;           // 0.005 to 3.0 seconds
  decay: number;            // 0.01 to 3.0 seconds
  sustain: number;          // 0.0 to 1.0 level
  release: number;          // 0.01 to 5.0 seconds
  // Effects Rack
  distortion: number;       // 0.0 to 1.0 amount
  chorusWet: number;        // 0.0 to 1.0 mix
  delayTime: number;        // 0.05 to 1.0 seconds
  delayWet: number;         // 0.0 to 1.0 mix
  reverbDecay: number;      // 0.5 to 8.0 seconds
  reverbWet: number;        // 0.0 to 1.0 mix
  masterVolume: number;     // -24 to 0 dB
}

export type SynthModule = 'OSC 1' | 'OSC 2' | 'FILTER' | 'LFO' | 'ENVELOPE' | 'FX' | 'MASTER';

export interface ParameterMeta {
  key: keyof SynthPatch;
  label: string;
  module: SynthModule;
  min: number;
  max: number;
  step: number;
  unit: string;
  defaultValue: number;
}

export interface ParameterChangeExplanation {
  paramKey: keyof SynthPatch;
  paramLabel: string;
  oldValue: string | number;
  newValue: string | number;
  reason: string;           // 1-sentence acoustic explanation
}

export interface AISoundDesignResponse {
  patchName: string;
  summary: string;
  synestheticBridge: {
    timbreAndWaveforms: string;
    filterAndBrightness: string;
    envelopeAndMotion: string;
    spaceAndEffects: string;
  };
  updatedPatch: SynthPatch;
  changes: ParameterChangeExplanation[];
  coachingTip: string;
  engineSource?: 'nebius-nemotron' | 'gemini' | 'synthnet-neural';
}

export type GeminiModelId =
  | 'nebius-nemotron-super'
  | 'nebius-nemotron-ultra'
  | 'nebius-nemotron-nano'
  | 'nebius-synthlm-lora'
  | 'gemini-4-argon'
  | 'gemini-3.8-flash'
  | 'gemini-3.5-flash-lite';

export type AIModelId = GeminiModelId;

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  aiResponse?: AISoundDesignResponse;
}
