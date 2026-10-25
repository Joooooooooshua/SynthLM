import { SynthPatch } from '../types/synth';

export interface AcousticArchetype {
  id: string;
  name: string;
  keywords: string[];
  description: string;
  patch: SynthPatch;
  acousticRationale: {
    timbreAndWaveforms: string;
    filterAndBrightness: string;
    envelopeAndMotion: string;
    spaceAndEffects: string;
  };
}

export const ACOUSTIC_ARCHETYPES: AcousticArchetype[] = [
  {
    id: 'tokyo-1984-city-pop-rhodes',
    name: 'Tokyo 1984 City Pop EP',
    keywords: [
      'city pop', 'rhodes', 'dx7', 'tatsuro yamashita', 'mariya takeuchi',
      '80s ep', 'electric piano', 'vintage ep', 'bubble economy', 'golden age'
    ],
    description: '1980s Japanese City Pop electric piano featuring crystalline tine hammer strike, warm body harmonics, lush chorus, and subtle tape pitch vibrato.',
    patch: {
      name: 'Tokyo 1984 City Pop EP',
      osc1Type: 'custom',
      osc1Octave: 0,
      osc1Detune: -4,
      osc1Mix: 0.85,
      osc1Partials: [1.0, 0.42, 0.28, 0.05, 0.0, 0.0, 0.35, 0.0, 0.0, 0.0, 0.22, 0.0, 0.12, 0.0, 0.0, 0.0],
      osc2Type: 'custom',
      osc2Octave: 1,
      osc2Detune: 6,
      osc2Mix: 0.38,
      osc2Partials: [0.8, 0.15, 0.0, 0.0, 0.0, 0.0, 0.45, 0.0, 0.0, 0.0, 0.28, 0.0, 0.0, 0.0, 0.0, 0.0],
      filterType: 'lowpass',
      filterCutoff: 3400,
      filterResonance: 2.2,
      filterEnvAmount: 4800,
      lfoRate: 1.6,
      lfoDepth: 0.25,
      lfoTarget: 'pitch',
      attack: 0.008,
      decay: 1.1,
      sustain: 0.25,
      release: 0.65,
      distortion: 0.02,
      chorusWet: 0.55,
      delayTime: 0.28,
      delayWet: 0.15,
      reverbDecay: 2.4,
      reverbWet: 0.25,
      masterVolume: -6,
    },
    acousticRationale: {
      timbreAndWaveforms: 'OSC1 sculpts warm reed fundamental with 2nd/3rd harmonics; OSC2 is tuned +1 octave with high 7th and 11th partials to emulate the bright crystal chime of electric piano tines.',
      filterAndBrightness: 'Lowpass filter with +4800Hz envelope sweep provides the crisp hammer attack bite that rapidly decays into mellow acoustic body.',
      envelopeAndMotion: 'Ultra-fast 8ms attack delivers immediate percussive transient; subtle LFO pitch modulation (1.6Hz) creates the signature nostalgic tape flutter.',
      spaceAndEffects: 'Lush 55% chorus width and warm plate reverb paint the luxurious, neon-lit Tokyo skyline ambiance.',
    },
  },
  {
    id: 'icelandic-aurora-borealis-pad',
    name: 'Reykjavik Aurora Borealis Pad',
    keywords: [
      'aurora', 'borealis', 'iceland', 'ambient', 'sigur ros',
      'olafur arnalds', 'arctic', 'solitary', 'northern lights', 'pad', 'ethereal', 'expansive', 'solitude'
    ],
    description: 'Vast, solitary Icelandic ambient pad with hollow odd harmonics, shimmering icy overtones, slow filter LFO breathing, and immense cathedral reverb.',
    patch: {
      name: 'Reykjavik Aurora Pad',
      osc1Type: 'custom',
      osc1Octave: 0,
      osc1Detune: -8,
      osc1Mix: 0.75,
      osc1Partials: [1.0, 0.0, 0.72, 0.0, 0.54, 0.0, 0.38, 0.0, 0.28, 0.0, 0.18, 0.0, 0.12, 0.0, 0.08, 0.04],
      osc2Type: 'custom',
      osc2Octave: 1,
      osc2Detune: 8,
      osc2Mix: 0.6,
      osc2Partials: [0.6, 0.0, 0.45, 0.0, 0.32, 0.0, 0.25, 0.0, 0.35, 0.0, 0.28, 0.0, 0.22, 0.0, 0.15, 0.1],
      filterType: 'lowpass',
      filterCutoff: 1850,
      filterResonance: 3.2,
      filterEnvAmount: 1400,
      lfoRate: 0.28,
      lfoDepth: 0.65,
      lfoTarget: 'filter',
      attack: 1.1,
      decay: 2.2,
      sustain: 0.85,
      release: 3.2,
      distortion: 0.0,
      chorusWet: 0.6,
      delayTime: 0.45,
      delayWet: 0.35,
      reverbDecay: 6.5,
      reverbWet: 0.65,
      masterVolume: -8,
    },
    acousticRationale: {
      timbreAndWaveforms: 'Hollow odd harmonics (3rd, 5th, 7th) evoke glacial emptiness, while upper high partials shimmer like dancing aurora lights across the Arctic night.',
      filterAndBrightness: 'Resonant lowpass with ultra-slow LFO sweep (0.28Hz) mimics the slow, undulating glow of geomagnetic curtains across the sky.',
      envelopeAndMotion: 'Evolving 1.1s attack and massive 3.2s release dissolve all boundaries between consecutive notes into an endless frozen sea.',
      spaceAndEffects: 'Deep 6.5s cathedral reverb and stereo ping-pong delay immerse the listener in solitary sub-arctic space.',
    },
  },
  {
    id: 'blade-runner-1982-cs80-brass',
    name: '1982 Cyberpunk CS-80 Brass',
    keywords: [
      'blade runner', 'cs-80', 'vangelis', 'cyberpunk', 'rainy night', 'synth brass',
      'brass', 'nostalgic brass', 'rainy neo-noir', 'sci-fi horn'
    ],
    description: 'Iconic Vangelis CS-80 synthesizer brass lead with detuned rich saws, dynamic filter envelope swell, and cinematic tape delay.',
    patch: {
      name: '1982 Cyberpunk Brass',
      osc1Type: 'sawtooth',
      osc1Octave: 0,
      osc1Detune: -9,
      osc1Mix: 0.85,
      osc2Type: 'sawtooth',
      osc2Octave: 0,
      osc2Detune: 11,
      osc2Mix: 0.8,
      filterType: 'lowpass',
      filterCutoff: 2100,
      filterResonance: 3.8,
      filterEnvAmount: 5200,
      lfoRate: 3.2,
      lfoDepth: 0.22,
      lfoTarget: 'pitch',
      attack: 0.18,
      decay: 0.85,
      sustain: 0.68,
      release: 1.4,
      distortion: 0.12,
      chorusWet: 0.4,
      delayTime: 0.38,
      delayWet: 0.32,
      reverbDecay: 4.8,
      reverbWet: 0.45,
      masterVolume: -6,
    },
    acousticRationale: {
      timbreAndWaveforms: 'Dual richly detuned sawtooth oscillators generate the massive, analog chorusing warmth of Yamaha CS-80 dual voice cards.',
      filterAndBrightness: 'Steep lowpass with huge +5200Hz envelope sweep creates the heroic brass horn swell upon key strike.',
      envelopeAndMotion: 'Measured 180ms attack models the acoustic inertia of a brass horn, paired with subtle expressive vibrato.',
      spaceAndEffects: 'Distortion gives analog console drive, while tape delay and cavernous reverb paint the neon-washed rain in 2019 Los Angeles.',
    },
  },
  {
    id: 'shibuya-neon-slap-bass',
    name: 'Shibuya Neon Slap Bass',
    keywords: [
      'funk bass', 'synth bass', 'moog bass', 'slap bass', 'fat bass',
      'punchy bass', '80s bass', 'acid bass', 'sub bass'
    ],
    description: 'Aggressive, punchy analog synth bass with sub-octave weight, snappy resonant lowpass envelope snap, and driven saturation.',
    patch: {
      name: 'Shibuya Neon Bass',
      osc1Type: 'sawtooth',
      osc1Octave: -1,
      osc1Detune: 0,
      osc1Mix: 0.9,
      osc2Type: 'square',
      osc2Octave: -2,
      osc2Detune: 4,
      osc2Mix: 0.75,
      filterType: 'lowpass',
      filterCutoff: 1400,
      filterResonance: 4.5,
      filterEnvAmount: 6200,
      lfoRate: 4.0,
      lfoDepth: 0.0,
      lfoTarget: 'filter',
      attack: 0.005,
      decay: 0.26,
      sustain: 0.12,
      release: 0.18,
      distortion: 0.28,
      chorusWet: 0.0,
      delayTime: 0.15,
      delayWet: 0.0,
      reverbDecay: 1.2,
      reverbWet: 0.08,
      masterVolume: -4,
    },
    acousticRationale: {
      timbreAndWaveforms: 'Sawtooth lead paired with sub-square oscillator (-2 octaves) delivers chest-thumping low-end weight.',
      filterAndBrightness: 'Resonant lowpass with ultra-fast +6200Hz envelope snap produces instant slap-bass percussive punch.',
      envelopeAndMotion: 'Lightning-fast 5ms attack and 260ms decay tightly control dynamics to keep the groove razor-sharp.',
      spaceAndEffects: '28% saturation drive adds analog tape grit; dry reverb preserves low-frequency headroom without mud.',
    },
  },
  {
    id: 'lofi-dusty-vinyl-keys',
    name: 'Lofi Dusty Vinyl Keys',
    keywords: [
      'lofi', 'lo-fi', 'vinyl', 'nujabes', 'dusty', 'vintage keys', 'cassette',
      'tape warble', 'chillhop', 'nostalgia', 'mellow keys'
    ],
    description: 'Warm, mellow electric keys filtered through dusty vinyl warmth with fluttery pitch wow/flutter and bandpass focus.',
    patch: {
      name: 'Lofi Dusty Vinyl Keys',
      osc1Type: 'triangle',
      osc1Octave: 0,
      osc1Detune: -6,
      osc1Mix: 0.85,
      osc2Type: 'sine',
      osc2Octave: 1,
      osc2Detune: 8,
      osc2Mix: 0.4,
      filterType: 'bandpass',
      filterCutoff: 2200,
      filterResonance: 1.4,
      filterEnvAmount: 800,
      lfoRate: 1.2,
      lfoDepth: 0.32,
      lfoTarget: 'pitch',
      attack: 0.02,
      decay: 0.85,
      sustain: 0.35,
      release: 0.45,
      distortion: 0.16,
      chorusWet: 0.35,
      delayTime: 0.32,
      delayWet: 0.2,
      reverbDecay: 2.5,
      reverbWet: 0.28,
      masterVolume: -6,
    },
    acousticRationale: {
      timbreAndWaveforms: 'Warm triangle and gentle sine waveforms eliminate harsh digital edges.',
      filterAndBrightness: 'Bandpass filter emulates vintage telephone / vinyl record frequency bandwidth.',
      envelopeAndMotion: 'LFO pitch wow-and-flutter (1.2Hz) introduces authentic warble of worn cassette tape.',
      spaceAndEffects: '16% warm saturation and soft chamber reverb create an intimate bedroom studio feel.',
    },
  },
  {
    id: 'glassy-crystal-celesta-pluck',
    name: 'Dreamscape Glassy Pluck',
    keywords: [
      'crystal', 'glass', 'music box', 'pluck',
      'celesta', 'harp', 'dreamscape', 'ethereal pluck', 'bell', 'pristine'
    ],
    description: 'Crystalline music box and glass celesta pluck with pure high partials, delicate attack transient, and shimmering reverb tails.',
    patch: {
      name: 'Dreamscape Glass Pluck',
      osc1Type: 'custom',
      osc1Octave: 1,
      osc1Detune: 0,
      osc1Mix: 0.85,
      osc1Partials: [1.0, 0.0, 0.15, 0.0, 0.45, 0.0, 0.25, 0.0, 0.55, 0.0, 0.35, 0.0, 0.2, 0.0, 0.12, 0.05],
      osc2Type: 'custom',
      osc2Octave: 2,
      osc2Detune: 5,
      osc2Mix: 0.45,
      osc2Partials: [0.7, 0.0, 0.0, 0.0, 0.35, 0.0, 0.0, 0.0, 0.65, 0.0, 0.0, 0.0, 0.3, 0.0, 0.15, 0.0],
      filterType: 'highpass',
      filterCutoff: 450,
      filterResonance: 1.8,
      filterEnvAmount: 2200,
      lfoRate: 4.5,
      lfoDepth: 0.2,
      lfoTarget: 'tremolo',
      attack: 0.005,
      decay: 0.55,
      sustain: 0.05,
      release: 0.85,
      distortion: 0.0,
      chorusWet: 0.45,
      delayTime: 0.33,
      delayWet: 0.3,
      reverbDecay: 4.2,
      reverbWet: 0.5,
      masterVolume: -6,
    },
    acousticRationale: {
      timbreAndWaveforms: 'Odd high Fourier partials (5th, 9th, 11th) tuned at +1 and +2 octaves recreate pure strike resonance of tuned crystal glass.',
      filterAndBrightness: 'Highpass cut keeps bottom clear, leaving only pristine ringing highs.',
      envelopeAndMotion: 'Instant 5ms pluck attack decaying in 550ms, with subtle tremolo shimmer.',
      spaceAndEffects: 'Shimmering stereo delay and deep reverb disperse each droplet into an ethereal dream.',
    },
  },
];

export function findClosestArchetype(prompt: string): AcousticArchetype | null {
  if (!prompt || typeof prompt !== 'string') return null;

  const lower = prompt.toLowerCase();
  let bestMatch: AcousticArchetype | null = null;
  let highestScore = 0;

  for (const arc of ACOUSTIC_ARCHETYPES) {
    let score = 0;
    for (const kw of arc.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        score += kw.length; // weight longer specific keywords higher
      }
    }
    if (score > highestScore) {
      highestScore = score;
      bestMatch = arc;
    }
  }

  // Minimum threshold
  return highestScore >= 2 ? bestMatch : null;
}

