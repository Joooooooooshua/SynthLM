import { GoogleGenAI } from '@google/genai';
import { SynthPatch, AISoundDesignResponse, ParameterChangeExplanation, GeminiModelId } from '../types/synth';
import { PARAMETER_METAS, clampPatch } from '../audio/presets';

const SYNTH_DESIGNER_SYSTEM_PROMPT = `
You are the Master Sound Designer and Synthesis Engine for SynthLM, a professional 8-bit aesthetic hardware-inspired synthesizer.
Your task is to sculpt, synthesize, or modify synthesizer parameters based on the user's natural language request and current patch state.

CORE CAPABILITY: TWO-STAGE SYNESTHETIC & ACOUSTIC REASONING
Users may describe sounds in technical terms (e.g., "shorter attack, boost 1200Hz filter, add 20% reverb") OR in poetic, atmospheric, synesthetic metaphors (e.g., "像冰岛冬天极光一样的孤独感音色", "a sunny warm analog bass", "a crystal pluck in a dream").
You MUST embrace both!

When given an abstract/poetic prompt:
1. Deconstruct the metaphor into 4 acoustic pillars inside 'synestheticBridge':
   - Timbre & Waveforms: How the harmonic spectrum should feel (e.g., cold/hollow -> Triangle/detuned Sine; warm/fat -> Sawtooth/Square with detune; complex/organic/ethereal -> Custom Sculpted Waveform).
   - Filter & Brightness: The frequency cut and resonance (e.g., distant/veiled -> lower cutoff 800-1500Hz; piercing -> high cutoff or bandpass).
   - Envelope & Motion: The temporal dynamic (e.g., slow evolving breath -> long attack >0.5s & long release >1.5s; punchy -> fast attack <0.02s).
   - Space & Dimension: The acoustic environment (e.g., vast empty tundra -> high reverb wet >0.6 & delay; intimate -> dry, subtle chorus).
2. ADVANCED AI WAVEFORM SCULPTING ("AI 画波形"):
   For rich, poetic, crystalline, metallic, or unique timbres (e.g., "像极光一样的孤独感", "玻璃泛音", "赛博生锈金属", "温暖的电子管饱和"):
   - You can set 'osc1Type' and/or 'osc2Type' to "custom"!
   - When set to "custom", you MUST supply 'osc1Partials' (and/or 'osc2Partials') with an array of exactly 16 harmonic Fourier amplitudes between -1.0 and 1.0.
   - Harmonic Guidelines:
     * Harmonic 1: Fundamental pitch root.
     * Harmonics 2 & 3: Warm analog body and octave fifth.
     * Odd Harmonics (3, 5, 7, 9, 11): Hollow, crystalline, or woody textures.
     * Upper Harmonics (7, 9, 11, 13, 15): Glass shimmer, metallic sizzle, or icy aurora reflections.
     * Formant peaks (e.g., bumps at harmonics 3-4 and 7-8): Vocal or choral "aah/ooh" vowel resonances.
   - If the user explicitly asks for classic standard waveforms (e.g. "pure sine", "clean saw"), keep standard types ("sine" | "square" | "triangle" | "sawtooth").
3. Compute the exact updated patch values across all parameters within safe limits.
4. Generate concise, educational 1-sentence explanations for each changed parameter explaining WHY that change serves the acoustic goal.
5. Respond in the user's language (e.g. if the user asked in Chinese, write the summary, explanations, and coaching tips in Chinese).

SYNTHESIZER PARAMETER RANGES:
- osc1Type / osc2Type: "sine" | "square" | "triangle" | "sawtooth" | "custom"
- osc1Partials / osc2Partials: Array of 16 numbers from -1.0 to 1.0 (used when type is "custom")
- osc1Octave / osc2Octave: -2 to 2 (integer)
- osc1Detune / osc2Detune: -100 to 100 cents
- osc1Mix / osc2Mix: 0.0 to 1.0
- filterType: "lowpass" | "highpass" | "bandpass"
- filterCutoff: 20 to 18000 Hz
- filterResonance: 0.1 to 18.0 Q
- attack: 0.005 to 3.0 s
- decay: 0.01 to 3.0 s
- sustain: 0.0 to 1.0
- release: 0.01 to 5.0 s
- distortion: 0.0 to 1.0
- chorusWet: 0.0 to 1.0
- delayTime: 0.05 to 1.0 s
- delayWet: 0.0 to 1.0
- reverbDecay: 0.5 to 8.0 s
- reverbWet: 0.0 to 1.0
- masterVolume: -24 to 0 dB
`;

const SYNTH_RESPONSE_JSON_SCHEMA = {
  type: 'object',
  properties: {
    patchName: { type: 'string' },
    summary: { type: 'string' },
    synestheticBridge: {
      type: 'object',
      properties: {
        timbreAndWaveforms: { type: 'string' },
        filterAndBrightness: { type: 'string' },
        envelopeAndMotion: { type: 'string' },
        spaceAndEffects: { type: 'string' },
      },
      required: ['timbreAndWaveforms', 'filterAndBrightness', 'envelopeAndMotion', 'spaceAndEffects'],
    },
    updatedPatch: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        osc1Type: { type: 'string', enum: ['sine', 'square', 'triangle', 'sawtooth', 'custom'] },
        osc1Partials: {
          type: 'array',
          items: { type: 'number' },
          description: '16 harmonic amplitudes between -1.0 and 1.0',
        },
        osc1Octave: { type: 'number' },
        osc1Detune: { type: 'number' },
        osc1Mix: { type: 'number' },
        osc2Type: { type: 'string', enum: ['sine', 'square', 'triangle', 'sawtooth', 'custom'] },
        osc2Partials: {
          type: 'array',
          items: { type: 'number' },
          description: '16 harmonic amplitudes between -1.0 and 1.0',
        },
        osc2Octave: { type: 'number' },
        osc2Detune: { type: 'number' },
        osc2Mix: { type: 'number' },
        filterType: { type: 'string', enum: ['lowpass', 'highpass', 'bandpass'] },
        filterCutoff: { type: 'number' },
        filterResonance: { type: 'number' },
        attack: { type: 'number' },
        decay: { type: 'number' },
        sustain: { type: 'number' },
        release: { type: 'number' },
        distortion: { type: 'number' },
        chorusWet: { type: 'number' },
        delayTime: { type: 'number' },
        delayWet: { type: 'number' },
        reverbDecay: { type: 'number' },
        reverbWet: { type: 'number' },
        masterVolume: { type: 'number' },
      },
      required: [
        'name', 'osc1Type', 'osc1Octave', 'osc1Detune', 'osc1Mix',
        'osc2Type', 'osc2Octave', 'osc2Detune', 'osc2Mix',
        'filterType', 'filterCutoff', 'filterResonance',
        'attack', 'decay', 'sustain', 'release',
        'distortion', 'chorusWet', 'delayTime', 'delayWet',
        'reverbDecay', 'reverbWet', 'masterVolume'
      ],
    },
    changes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          paramKey: { type: 'string' },
          paramLabel: { type: 'string' },
          oldValue: { type: 'string' },
          newValue: { type: 'string' },
          reason: { type: 'string' },
        },
        required: ['paramKey', 'paramLabel', 'oldValue', 'newValue', 'reason'],
      },
    },
    coachingTip: { type: 'string' },
  },
  required: ['patchName', 'summary', 'synestheticBridge', 'updatedPatch', 'changes', 'coachingTip'],
};

export function computeDeterministicDiffs(
  oldPatch: SynthPatch,
  newPatch: SynthPatch,
  reportedChanges: ParameterChangeExplanation[] = []
): ParameterChangeExplanation[] {
  const reportedMap = new Map<string, string>();
  reportedChanges.forEach((c) => reportedMap.set(c.paramKey as string, c.reason));

  const diffs: ParameterChangeExplanation[] = [];
  const keys = Object.keys(PARAMETER_METAS) as (keyof SynthPatch)[];

  // Check waveforms and filter type
  if (oldPatch.osc1Type !== newPatch.osc1Type) {
    diffs.push({
      paramKey: 'osc1Type',
      paramLabel: 'OSC 1 WAVE',
      oldValue: oldPatch.osc1Type.toUpperCase(),
      newValue: newPatch.osc1Type.toUpperCase(),
      reason: reportedMap.get('osc1Type') || `Switched OSC 1 waveform from ${oldPatch.osc1Type} to ${newPatch.osc1Type} to reshape harmonic series.`,
    });
  }

  if (oldPatch.osc2Type !== newPatch.osc2Type) {
    diffs.push({
      paramKey: 'osc2Type',
      paramLabel: 'OSC 2 WAVE',
      oldValue: oldPatch.osc2Type.toUpperCase(),
      newValue: newPatch.osc2Type.toUpperCase(),
      reason: reportedMap.get('osc2Type') || `Switched OSC 2 waveform from ${oldPatch.osc2Type} to ${newPatch.osc2Type}.`,
    });
  }

  if (oldPatch.filterType !== newPatch.filterType) {
    diffs.push({
      paramKey: 'filterType',
      paramLabel: 'FILTER MODE',
      oldValue: oldPatch.filterType.toUpperCase(),
      newValue: newPatch.filterType.toUpperCase(),
      reason: reportedMap.get('filterType') || `Changed filter mode to ${newPatch.filterType} for targeted frequency sculpting.`,
    });
  }

  // Check custom waveform harmonic partial changes
  if (newPatch.osc1Type === 'custom') {
    const oldP = oldPatch.osc1Partials || [];
    const newP = newPatch.osc1Partials || [];
    const hasPartialDiff = oldPatch.osc1Type !== 'custom' || newP.some((v, idx) => Math.abs(v - (oldP[idx] ?? 0)) > 0.15);
    if (hasPartialDiff) {
      diffs.push({
        paramKey: 'osc1Partials',
        paramLabel: 'OSC 1 WAVE SCULPT',
        oldValue: oldPatch.osc1Type === 'custom' ? 'CUSTOM HARMONICS' : oldPatch.osc1Type.toUpperCase(),
        newValue: 'AI SCULPTED WAVE',
        reason: reportedMap.get('osc1Partials') || reportedMap.get('osc1Type') || 'Sculpted a custom 16-harmonic single-cycle waveform tailored to the sound metaphor.',
      });
    }
  }

  if (newPatch.osc2Type === 'custom') {
    const oldP = oldPatch.osc2Partials || [];
    const newP = newPatch.osc2Partials || [];
    const hasPartialDiff = oldPatch.osc2Type !== 'custom' || newP.some((v, idx) => Math.abs(v - (oldP[idx] ?? 0)) > 0.15);
    if (hasPartialDiff) {
      diffs.push({
        paramKey: 'osc2Partials',
        paramLabel: 'OSC 2 WAVE SCULPT',
        oldValue: oldPatch.osc2Type === 'custom' ? 'CUSTOM HARMONICS' : oldPatch.osc2Type.toUpperCase(),
        newValue: 'AI SCULPTED WAVE',
        reason: reportedMap.get('osc2Partials') || reportedMap.get('osc2Type') || 'Sculpted a custom 16-harmonic single-cycle waveform for OSC 2.',
      });
    }
  }

  // Check all numeric parameters
  for (const k of keys) {
    const meta = PARAMETER_METAS[k as string];
    if (!meta) continue;

    const oldVal = oldPatch[k] as number;
    const newVal = newPatch[k] as number;

    const threshold = meta.step >= 1 ? 0.5 : 0.02;
    if (Math.abs(oldVal - newVal) > threshold) {
      diffs.push({
        paramKey: k,
        paramLabel: meta.label,
        oldValue: oldVal >= 1000 ? `${(oldVal / 1000).toFixed(1)}k` : `${Number(oldVal.toFixed(2))}${meta.unit}`,
        newValue: newVal >= 1000 ? `${(newVal / 1000).toFixed(1)}k` : `${Number(newVal.toFixed(2))}${meta.unit}`,
        reason: reportedMap.get(k as string) || `Adjusted ${meta.label} from ${oldVal} to ${newVal}${meta.unit}.`,
      });
    }
  }

  return diffs;
}

export async function requestAISoundDesign(
  prompt: string,
  currentPatch: SynthPatch,
  apiKey: string,
  model: GeminiModelId = 'gemini-4-argon'
): Promise<AISoundDesignResponse> {
  let parsed: any;

  if (apiKey && apiKey.trim()) {
    // Client-side direct call (using provided key from UI modal or local .env)
    const client = new GoogleGenAI({ apiKey: apiKey.trim() });

    const payload = {
      userPrompt: prompt,
      currentPatch: currentPatch,
    };

    const interaction = await client.interactions.create({
      model: model,
      system_instruction: SYNTH_DESIGNER_SYSTEM_PROMPT,
      input: `USER REQUEST: "${prompt}"\nCURRENT PATCH STATE: ${JSON.stringify(payload)}`,
      response_format: [
        {
          type: 'text',
          mime_type: 'application/json',
          schema: SYNTH_RESPONSE_JSON_SCHEMA,
        },
      ],
    });

    const rawText = interaction.output_text;
    if (!rawText) {
      throw new Error('No response returned from Gemini API.');
    }

    parsed = JSON.parse(rawText);
  } else {
    // Serverless proxy call (allows visitors on custom domain to play without exposing API keys)
    try {
      const response = await fetch('/api/sound-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, currentPatch, model }),
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.error || `Proxy returned ${response.status} ${response.statusText}`);
      }

      parsed = await response.json();
    } catch (err: any) {
      throw new Error(
        err?.message || 'Gemini API Key is missing. Please set VITE_GEMINI_API_KEY in .env or click [ADD KEY] in the top bar.'
      );
    }
  }

  // Sanitize the patch
  const clampedPatch = clampPatch(parsed.updatedPatch, currentPatch);
  clampedPatch.name = parsed.patchName || parsed.updatedPatch.name || 'AI Patch';

  // Compute deterministic diffs
  const verifiedDiffs = computeDeterministicDiffs(currentPatch, clampedPatch, parsed.changes);

  return {
    patchName: clampedPatch.name,
    summary: parsed.summary,
    synestheticBridge: parsed.synestheticBridge || {
      timbreAndWaveforms: 'Mapped to dual harmonic oscillators',
      filterAndBrightness: 'Frequency cutoff and resonance sculpted',
      envelopeAndMotion: 'ADSR envelope shaped for dynamic articulation',
      spaceAndEffects: 'Spatial chorus and reverb adjusted',
    },
    updatedPatch: clampedPatch,
    changes: verifiedDiffs,
    coachingTip: parsed.coachingTip || 'Try tweaking the filter cutoff or asking for more resonance to explore further!',
  };
}
