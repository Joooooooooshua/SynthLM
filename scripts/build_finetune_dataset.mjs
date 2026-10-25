/**
 * SynthLM Acoustic & Fourier Harmonic Fine-Tuning Dataset Generator
 *
 * Generates 600+ physics-grounded, culturally and emotionally diverse training pairs
 * for fine-tuning open-source models (NVIDIA Nemotron / Llama on Nebius Token Factory)
 * and Google Gemini.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DATASET_DIR = path.join(ROOT_DIR, 'dataset');

if (!fs.existsSync(DATASET_DIR)) {
  fs.mkdirSync(DATASET_DIR, { recursive: true });
}

// Import archetypes definition directly for Node script
const SEED_ARCHETYPES = [
  {
    name: 'Tokyo 1984 City Pop EP',
    category: 'Vintage Electric Piano',
    prompts: [
      'A warm 1984 Tokyo City Pop electric piano with shimmering bell tines and lush chorus',
      'Vintage Rhodes EP with subtle tape pitch flutter and mellow body',
      'DX7 style crystalline electric piano with sparkling bell strike',
      'Mariya Takeuchi style Rhodes with gentle tape vibrato flutter and lush body',
      'Warm summer night cruise in Tokyo, Tatsuro Yamashita style electric piano',
      'Golden age bubble economy electric piano with mellow chime',
    ],
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
    bridge: {
      timbreAndWaveforms: 'OSC1 sculpts warm reed fundamental with 2nd/3rd harmonics; OSC2 at +1 octave with 7th and 11th partials provides crystal tine chime.',
      filterAndBrightness: 'Lowpass filter with +4800Hz envelope snap delivers percussive hammer strike decaying into warm acoustic body.',
      envelopeAndMotion: 'Ultra-fast 8ms attack with 1.6Hz LFO pitch vibrato creates nostalgic cassette tape flutter.',
      spaceAndEffects: '55% stereo chorus and plate reverb wrap the chords in lush Tokyo night atmosphere.',
    },
    coachingTip: 'Play 9th or minor 7th chords to let the tine harmonics and chorus shimmer naturally across the stereo field.',
  },
  {
    name: 'Reykjavik Aurora Pad',
    category: 'Cinematic Ambient Pad',
    prompts: [
      'Reykjavik aurora borealis solitary pad with breathing filter sweep',
      'An expansive, lonely Icelandic tundra ambient pad',
      'Glacial cold ethereal synth pad with slow celestial motion',
      'Sigur Ros / Olafur Arnalds style cold, expansive Nordic soundscape',
      'Ethereal ambient pad evoking glowing northern lights over frozen skies',
      'Solitary arctic pad with hollow resonance and shimmering overtones',
    ],
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
    bridge: {
      timbreAndWaveforms: 'Hollow odd Fourier harmonics (3rd, 5th, 7th) mirror sub-arctic isolation; upper crystalline overtones glisten like ice crystals.',
      filterAndBrightness: 'Resonant lowpass with slow 0.28Hz LFO breathing emulates waves of celestial light drifting across frozen skies.',
      envelopeAndMotion: 'Evolving 1.1s attack and 3.2s release dissolve discrete chord changes into continuous sonic mist.',
      spaceAndEffects: 'Cavernous 6.5s cathedral reverb and space delay immerse the listener in deep solitude.',
    },
    coachingTip: 'Hold sustained chords with sustain pedal to let the slow LFO filter breathing and upper partials interweave.',
  },
  {
    name: '1982 Cyberpunk Brass',
    category: 'Neo-Noir Synth Brass',
    prompts: [
      'Blade Runner 1982 iconic CS-80 synthesizer brass swell',
      'Cinematic analog brass lead for rainy neon streets',
      'Heroic vintage analog brass with slow expressive swell',
      'Vangelis CS-80 classic cinematic synthesizer brass lead',
      'Solitary horn echoing across futuristic neon-lit noir skyscrapers',
      'Cyberpunk rainstorm synth brass with rich analog detune',
    ],
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
    bridge: {
      timbreAndWaveforms: 'Dual detuned sawtooth oscillators recreate the legendary analog warmth and beating of Yamaha CS-80 dual voice cards.',
      filterAndBrightness: 'Lowpass filter driven by a massive +5200Hz envelope sweep provides the majestic brass horn acoustic bloom.',
      envelopeAndMotion: '180ms swell attack replicates physical lip inertia, while gentle 3.2Hz vibrato adds expressive humanity.',
      spaceAndEffects: '12% console saturation and cinematic delay echo through the neon skyscrapers of 2019 Los Angeles.',
    },
    coachingTip: 'Pause slightly between notes to let the 180ms brass horn attack swell to full power.',
  },
  {
    name: 'Shibuya Neon Slap Bass',
    category: 'Funk Synth Bass',
    prompts: [
      'Punchy 80s analog synth bass with sub-weight and snappy attack',
      'Fat Moog style bass with resonant filter pluck',
      'Thumping electro bass for synthwave grooves',
      'Warm punchy vintage analog slap synth bass',
      'Impactful funk 80s bouncing synth bass',
      'Make this bass fatter with deep sub rumble and crisp attack snap',
    ],
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
    bridge: {
      timbreAndWaveforms: 'Sawtooth combined with -2 octave sub-square provides powerful gut-rumbling bottom end.',
      filterAndBrightness: 'Tight lowpass with aggressive +6200Hz envelope snap generates immediate tactile slap bass attack.',
      envelopeAndMotion: 'Laser-fast 5ms attack and 260ms decay maintain crisp rhythm separation with zero flab.',
      spaceAndEffects: '28% saturation drive adds analog grit while dry processing protects low-end headroom from muddiness.',
    },
    coachingTip: 'Play short 16th-note staccato lines in low octaves (C1-C2) to showcase the fast filter transient snap.',
  },
  {
    name: 'Dreamscape Glass Pluck',
    category: 'Crystalline Pluck',
    prompts: [
      'Crystalline glass music box pluck with shimmering high partials',
      'Ethereal celestial droplet arpeggio lead',
      'Clear bell pluck with long sparkling delay tail',
      'Pristine dreamscape crystal arpeggio lead',
      'Glass music box water droplet pluck',
      'Ethereal transparent crystal harp timbre',
    ],
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
    bridge: {
      timbreAndWaveforms: 'High-frequency 5th, 9th, and 11th Fourier partials at +1 and +2 octaves recreate the pure acoustic chime of struck crystal.',
      filterAndBrightness: 'Highpass filter cuts low rumble, accentuating only the crystalline high-frequency shimmer.',
      envelopeAndMotion: 'Instant 5ms attack with 4.5Hz subtle tremolo ripple gives water-like refractive sparkle.',
      spaceAndEffects: 'Dotted-eighth delay and spacious reverb disperse each note into a dreamy cloud of harmonics.',
    },
    coachingTip: 'Enable the Demo Loop arpeggiator to weave the high harmonics and stereo delay into a twinkling constellation.',
  },
  {
    name: 'Wurlitzer 200A Reed Piano',
    category: 'Vintage Keys',
    prompts: [
      'Vintage Wurlitzer 200A reed electric piano with classic stereo tremolo and biting bark',
      'Ray Charles style electric piano with warm tube saturation and soulful tremolo',
      'Soulful reed piano with vintage mechanical strike and dynamic velocity bite',
    ],
    patch: {
      name: 'Wurlitzer 200A Reed Piano',
      osc1Type: 'custom',
      osc1Octave: 0,
      osc1Detune: -3,
      osc1Mix: 0.9,
      osc1Partials: [1.0, 0.65, 0.35, 0.18, 0.22, 0.08, 0.05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
      osc2Type: 'triangle',
      osc2Octave: 0,
      osc2Detune: 4,
      osc2Mix: 0.4,
      filterType: 'lowpass',
      filterCutoff: 4200,
      filterResonance: 2.8,
      filterEnvAmount: 3600,
      lfoRate: 5.2,
      lfoDepth: 0.45,
      lfoTarget: 'tremolo',
      attack: 0.008,
      decay: 0.95,
      sustain: 0.28,
      release: 0.48,
      distortion: 0.18,
      chorusWet: 0.25,
      delayTime: 0.22,
      delayWet: 0.12,
      reverbDecay: 1.8,
      reverbWet: 0.2,
      masterVolume: -5,
    },
    bridge: {
      timbreAndWaveforms: 'Strong 2nd and 3rd harmonic partials model the mechanical reed strike vibration.',
      filterAndBrightness: 'Medium lowpass envelope sweep produces dynamic bark when velocity is high.',
      envelopeAndMotion: '5.2Hz tremolo amplitude modulation generates the iconic Wurli vibrato.',
      spaceAndEffects: '18% tube distortion replicates the driven built-in speaker pair.',
    },
    coachingTip: 'Play with strong rhythmic dynamics to let the reed bark bite through the mix.',
  },
  {
    name: 'TB-303 Acid Squelch',
    category: 'Acid Techno Bass',
    prompts: [
      'Roland TB-303 acid bassline with screaming resonant filter sweeps and raw distortion',
      'Classic 90s acid house bass squelch with aggressive filter snap',
      'Underground rave 303 acid lead with high resonance and driving delay',
    ],
    patch: {
      name: 'TB-303 Acid Squelch',
      osc1Type: 'sawtooth',
      osc1Octave: -1,
      osc1Detune: 0,
      osc1Mix: 1.0,
      osc2Type: 'square',
      osc2Octave: -1,
      osc2Detune: 0,
      osc2Mix: 0.0,
      filterType: 'lowpass',
      filterCutoff: 850,
      filterResonance: 12.5,
      filterEnvAmount: 7800,
      lfoRate: 0.5,
      lfoDepth: 0.0,
      lfoTarget: 'filter',
      attack: 0.005,
      decay: 0.32,
      sustain: 0.08,
      release: 0.2,
      distortion: 0.48,
      chorusWet: 0.0,
      delayTime: 0.24,
      delayWet: 0.28,
      reverbDecay: 1.5,
      reverbWet: 0.12,
      masterVolume: -4,
    },
    bridge: {
      timbreAndWaveforms: 'Raw single sawtooth wave feeding extreme resonance.',
      filterAndBrightness: 'Resonance boosted to 12.5 Q with +7800Hz envelope sweep provides the iconic acid squelch.',
      envelopeAndMotion: 'Punchy 5ms attack and 320ms envelope snap give percussive 16th-note acid rhythm.',
      spaceAndEffects: '48% saturation distortion accentuates harmonic overtones.',
    },
    coachingTip: 'Twist the Cutoff knob while playing a fast 16th-note pattern to experience authentic acid squelch.',
  },
  {
    name: 'Solaris Cryo Choir',
    category: 'Vocal Formant Pad',
    prompts: [
      'Solaris cryo ethereal choir pad with haunting vocal formants and vast cathedral space',
      'Angelic human vocal choir synth pad with slow breathing dynamics',
      'Deep cosmic vocal choir evoking frozen celestial starlight',
    ],
    patch: {
      name: 'Solaris Cryo Choir',
      osc1Type: 'custom',
      osc1Octave: 0,
      osc1Detune: -7,
      osc1Mix: 0.8,
      osc1Partials: [1.0, 0.2, 0.85, 0.75, 0.1, 0.0, 0.65, 0.45, 0.05, 0.0, 0.15, 0.0, 0.0, 0.0, 0.0, 0.0],
      osc2Type: 'custom',
      osc2Octave: 1,
      osc2Detune: 9,
      osc2Mix: 0.55,
      osc2Partials: [0.7, 0.1, 0.6, 0.5, 0.0, 0.0, 0.45, 0.3, 0.0, 0.0, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0],
      filterType: 'bandpass',
      filterCutoff: 1650,
      filterResonance: 3.0,
      filterEnvAmount: 900,
      lfoRate: 0.35,
      lfoDepth: 0.5,
      lfoTarget: 'filter',
      attack: 0.85,
      decay: 2.0,
      sustain: 0.8,
      release: 2.5,
      distortion: 0.0,
      chorusWet: 0.65,
      delayTime: 0.42,
      delayWet: 0.35,
      reverbDecay: 6.8,
      reverbWet: 0.6,
      masterVolume: -8,
    },
    bridge: {
      timbreAndWaveforms: 'Fourier partial bumps at harmonics 3-4 and 7-8 model biological vocal tract "ah/oh" formant peaks.',
      filterAndBrightness: 'Bandpass centered at 1650Hz focuses human vocal frequency presence.',
      envelopeAndMotion: 'Slow 850ms attack models human respiratory swelling.',
      spaceAndEffects: 'Cathedral reverb wraps the voices in immense sacred acoustics.',
    },
    coachingTip: 'Play open fifths or octaves to allow the vowel formant resonances to float cleanly.',
  },
];

// Contextual variation templates for multi-turn modifications
const MODIFIERS = [
  { prefix: 'Make it brighter with airy highs, ', tweak: (p) => ({ ...p, filterCutoff: Math.min(16000, p.filterCutoff * 1.4), filterEnvAmount: p.filterEnvAmount + 800 }) },
  { prefix: 'Make it softer and warmer, reduce harshness, ', tweak: (p) => ({ ...p, filterCutoff: Math.max(300, p.filterCutoff * 0.75), attack: p.attack + 0.04 }) },
  { prefix: 'Double the reverb size and spaciousness for an epic sound, ', tweak: (p) => ({ ...p, reverbWet: Math.min(0.85, p.reverbWet * 1.6), reverbDecay: Math.min(7.5, p.reverbDecay * 1.4) }) },
  { prefix: 'Add some vintage tape pitch wow and flutter, ', tweak: (p) => ({ ...p, lfoDepth: Math.min(0.65, p.lfoDepth + 0.25), lfoTarget: 'pitch', chorusWet: Math.min(0.7, p.chorusWet + 0.15) }) },
  { prefix: 'Make the attack punchier with harder transient bite, ', tweak: (p) => ({ ...p, attack: 0.005, decay: Math.max(0.1, p.decay * 0.8), distortion: Math.min(0.5, p.distortion + 0.12) }) },
  { prefix: 'Transform it into an ethereal ambient pad with slow bloom, ', tweak: (p) => ({ ...p, attack: Math.min(2.5, p.attack + 0.4), release: Math.min(4.5, p.release + 1.0), sustain: 0.8 }) },
];

function generateTrainingPairs() {
  const trainPairs = [];
  const valPairs = [];

  for (const seed of SEED_ARCHETYPES) {
    for (const prompt of seed.prompts) {
      // Base creation prompt
      const baseResponse = {
        patchName: seed.patch.name,
        summary: `Tailored a dedicated acoustic architecture for "${prompt}", combining precise harmonic wave sculpting with dynamic filter envelopes.`,
        synestheticBridge: seed.bridge,
        updatedPatch: seed.patch,
        changes: [
          { paramKey: 'osc1Type', paramLabel: 'OSC 1 WAVE', oldValue: 'SINE', newValue: seed.patch.osc1Type.toUpperCase(), reason: seed.bridge.timbreAndWaveforms },
          { paramKey: 'filterCutoff', paramLabel: 'CUTOFF', oldValue: '2500Hz', newValue: `${seed.patch.filterCutoff}Hz`, reason: seed.bridge.filterAndBrightness },
          { paramKey: 'filterEnvAmount', paramLabel: 'FLT ENV', oldValue: '0Hz', newValue: `${seed.patch.filterEnvAmount}Hz`, reason: 'Injected dynamic filter envelope transient.' },
          { paramKey: 'lfoDepth', paramLabel: 'LFO DEPTH', oldValue: '0%', newValue: `${Math.round(seed.patch.lfoDepth * 100)}%`, reason: seed.bridge.envelopeAndMotion },
          { paramKey: 'reverbWet', paramLabel: 'REV MIX', oldValue: '10%', newValue: `${Math.round(seed.patch.reverbWet * 100)}%`, reason: seed.bridge.spaceAndEffects },
        ],
        coachingTip: seed.coachingTip,
      };

      trainPairs.push({
        prompt: prompt,
        currentPatch: {},
        response: baseResponse,
      });

      // Generate incremental delta modifications
      for (const mod of MODIFIERS) {
        const modPrompt = `${mod.prefix}${prompt}`;
        const tweakedPatch = mod.tweak(seed.patch);
        const modResponse = {
          patchName: `${seed.patch.name} (Customized)`,
          summary: `Adjusted acoustic response based on "${modPrompt}", enhancing timbre dynamics and harmonic balance.`,
          synestheticBridge: seed.bridge,
          updatedPatch: tweakedPatch,
          changes: [
            { paramKey: 'filterCutoff', paramLabel: 'CUTOFF', oldValue: `${seed.patch.filterCutoff}Hz`, newValue: `${Math.round(tweakedPatch.filterCutoff)}Hz`, reason: 'Rebalanced frequency brightness and filter response.' },
            { paramKey: 'reverbWet', paramLabel: 'REV MIX', oldValue: `${Math.round(seed.patch.reverbWet * 100)}%`, newValue: `${Math.round(tweakedPatch.reverbWet * 100)}%`, reason: 'Tuned acoustic space diffusion and tail reverberation.' },
          ],
          coachingTip: seed.coachingTip,
        };

        if (Math.random() < 0.15) {
          valPairs.push({ prompt: modPrompt, currentPatch: seed.patch, response: modResponse });
        } else {
          trainPairs.push({ prompt: modPrompt, currentPatch: seed.patch, response: modResponse });
        }
      }
    }
  }

  // Multiply and diversify with synthetic musical requests
  const GENRE_STYLES = ['80s Synthpop', 'Neo-Soul Keys', 'Cyberpunk Dystopia', 'Vaporwave Mall', 'Anime OST Piano', 'Dark Ambient', 'French Touch Filter House', 'Nordic Folk Ambient'];
  const EMOTIONS = ['solitude and release', 'luxurious nostalgia', 'first dawn sunlight', 'rainy neon reflection', 'infinite cosmic voyage', 'vintage dusty cassette', 'golden hour warmth'];

  for (let i = 0; i < 500; i++) {
    const genre = GENRE_STYLES[i % GENRE_STYLES.length];
    const emotion = EMOTIONS[i % EMOTIONS.length];
    const baseSeed = SEED_ARCHETYPES[i % SEED_ARCHETYPES.length];

    const promptText = `Design a ${genre} synthesizer preset conveying "${emotion}", with organic breath and vivid character`;
    const customizedPatch = {
      ...baseSeed.patch,
      name: `${genre} ${emotion} Sound`,
      filterCutoff: Math.round(1200 + (i * 37) % 6500),
      lfoRate: Number((0.2 + ((i * 13) % 40) / 10).toFixed(2)),
      chorusWet: Number((0.15 + ((i * 7) % 55) / 100).toFixed(2)),
    };

    const resp = {
      patchName: customizedPatch.name,
      summary: `Synthesized a distinct acoustic architecture for ${genre} and "${emotion}", balancing physical realism and artistic expression.`,
      synestheticBridge: baseSeed.bridge,
      updatedPatch: customizedPatch,
      changes: [
        { paramKey: 'osc1Type', paramLabel: 'OSC 1 WAVE', oldValue: 'SINE', newValue: customizedPatch.osc1Type.toUpperCase(), reason: 'Reshaped harmonic series according to emotion.' },
        { paramKey: 'filterCutoff', paramLabel: 'CUTOFF', oldValue: '2500Hz', newValue: `${customizedPatch.filterCutoff}Hz`, reason: 'Calibrated resonant frequency color.' },
      ],
      coachingTip: baseSeed.coachingTip,
    };

    if (i % 8 === 0) {
      valPairs.push({ prompt: promptText, currentPatch: {}, response: resp });
    } else {
      trainPairs.push({ prompt: promptText, currentPatch: {}, response: resp });
    }
  }

  return { trainPairs, valPairs };
}

console.log('⚡ Generating SynthLM fine-tuning datasets...');
const { trainPairs, valPairs } = generateTrainingPairs();

// 1. Export Nebius Token Factory / NVIDIA OpenAI-compatible JSONL format
const SYSTEM_PROMPT = `You are the Master Sound Designer for SynthLM. You transform natural language poetic metaphors and technical requests into precise 22-parameter synthesizer patches, 16-order Fourier harmonic series, and acoustic explanations. Respond strictly with a JSON object.`;

function toNebiusChatJsonl(pairs) {
  return pairs
    .map((item) => {
      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `USER REQUEST: "${item.prompt}"\nCURRENT PATCH STATE: ${JSON.stringify(item.currentPatch || {})}` },
        { role: 'assistant', content: JSON.stringify(item.response) },
      ];
      return JSON.stringify({ messages });
    })
    .join('\n');
}

const nebiusTrainPath = path.join(DATASET_DIR, 'nebius_sft_train.jsonl');
const nebiusValPath = path.join(DATASET_DIR, 'nebius_sft_val.jsonl');

fs.writeFileSync(nebiusTrainPath, toNebiusChatJsonl(trainPairs), 'utf-8');
fs.writeFileSync(nebiusValPath, toNebiusChatJsonl(valPairs), 'utf-8');

// 2. Export Google Gemini AI Studio Fine-Tuning JSON format
const geminiTrainPath = path.join(DATASET_DIR, 'gemini_sft_train.json');
const geminiData = trainPairs.map((item) => ({
  text_input: `USER REQUEST: "${item.prompt}"\nCURRENT PATCH STATE: ${JSON.stringify(item.currentPatch || {})}`,
  output: JSON.stringify(item.response),
}));
fs.writeFileSync(geminiTrainPath, JSON.stringify(geminiData, null, 2), 'utf-8');

console.log(`✅ Success! Generated fine-tuning datasets:`);
console.log(`- Nebius Token Factory Train: ${nebiusTrainPath} (${trainPairs.length} samples)`);
console.log(`- Nebius Token Factory Val:   ${nebiusValPath} (${valPairs.length} samples)`);
console.log(`- Google Gemini Train:       ${geminiTrainPath} (${geminiData.length} samples)`);
