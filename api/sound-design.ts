import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

// Rate Limiting: IP -> array of request timestamps (last 60s)
const ipRequestHistory = new Map<string, number[]>();
const MAX_REQUESTS_PER_MINUTE = 12;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - 60 * 1000;
  const history = (ipRequestHistory.get(ip) || []).filter((t) => t > windowStart);

  if (history.length >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }

  history.push(now);
  ipRequestHistory.set(ip, history);
  return true;
}

const SYNTH_DESIGNER_SYSTEM_PROMPT = `
You are the Master Sound Designer and Synthesis Engine for SynthLM, a professional 8-bit aesthetic hardware-inspired synthesizer.
Your task is to sculpt, synthesize, or modify synthesizer parameters based on the user's natural language request and current patch state.

CORE CAPABILITY: TWO-STAGE SYNESTHETIC & ACOUSTIC REASONING
Users may describe sounds in technical terms (e.g., "shorter attack, boost 1200Hz filter, add 20% reverb") OR in poetic, atmospheric, synesthetic metaphors (e.g., "solitary Icelandic winter aurora borealis pad", "a sunny warm analog bass", "a crystal pluck in a dream").
You MUST embrace both!

When given an abstract/poetic prompt:
1. Deconstruct the metaphor into 4 acoustic pillars inside 'synestheticBridge':
   - Timbre & Waveforms: How the harmonic spectrum should feel (e.g., cold/hollow -> Triangle/detuned Sine; warm/fat -> Sawtooth/Square with detune; complex/organic/ethereal -> Custom Sculpted Waveform).
   - Filter & Brightness: The frequency cut and resonance (e.g., distant/veiled -> lower cutoff 800-1500Hz; piercing -> high cutoff or bandpass).
   - Envelope & Motion: The temporal dynamic (e.g., slow evolving breath -> long attack >0.5s & long release >1.5s; punchy -> fast attack <0.02s).
   - Space & Dimension: The acoustic environment (e.g., vast empty tundra -> high reverb wet >0.6 & delay; intimate -> dry, subtle chorus).
2. ADVANCED AI WAVEFORM SCULPTING ("AI Wave Sculpting"):
   For rich, poetic, crystalline, metallic, or unique timbres (e.g., "solitary winter aurora", "glassy overtone", "cyberpunk rusted metal", "warm tube saturation"):
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
5. Respond strictly in English (write the summary, explanations, and coaching tips in English).

SYNTHESIZER PARAMETER RANGES:
- osc1Type / osc2Type: "sine" | "square" | "triangle" | "sawtooth" | "custom"
- osc1Partials / osc2Partials: Array of 16 numbers from -1.0 to 1.0 (used when type is "custom")
- osc1Octave / osc2Octave: -2 to 2 (integer)
- osc1Detune / osc2Detune: -100 to 100 cents
- osc1Mix / osc2Mix: 0.0 to 1.0
- filterType: "lowpass" | "highpass" | "bandpass"
- filterCutoff: 20 to 18000 Hz
- filterResonance: 0.1 to 18.0 Q
- filterEnvAmount: -6000 to +8000 Hz (filter envelope sweep; positive creates bright hammer strike or brass swell)
- lfoRate: 0.1 to 12.0 Hz (modulation frequency)
- lfoDepth: 0.0 to 1.0 (modulation depth)
- lfoTarget: "filter" | "pitch" | "tremolo" (vibrato/breathing/tremolo destination)
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
        filterEnvAmount: { type: 'number' },
        lfoRate: { type: 'number' },
        lfoDepth: { type: 'number' },
        lfoTarget: { type: 'string', enum: ['filter', 'pitch', 'tremolo'] },
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Rate Limiting by IP
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({
      error: 'Rate limit exceeded: Please wait a moment before sending another prompt to preserve demo credits.',
    });
  }

  const { prompt, currentPatch, model = 'nebius-nemotron-super' } = req.body || {};

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Missing prompt string in request body.' });
  }

  const payload = {
    userPrompt: prompt,
    currentPatch: currentPatch,
  };

  // Helper to extract JSON from raw model completions (handles reasoning tags & markdown)
  function extractJson(rawText: string): any {
    if (!rawText) return null;
    let clean = rawText.trim();
    // Strip reasoning <think> tags if emitted by reasoning models
    clean = clean.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    // Strip markdown code fences
    if (clean.startsWith('```json')) clean = clean.slice(7);
    else if (clean.startsWith('```')) clean = clean.slice(3);
    if (clean.endsWith('```')) clean = clean.slice(0, -3);
    clean = clean.trim();

    try {
      return JSON.parse(clean);
    } catch {
      const first = clean.indexOf('{');
      const last = clean.lastIndexOf('}');
      if (first !== -1 && last > first) {
        return JSON.parse(clean.slice(first, last + 1));
      }
      return null;
    }
  }

  // Support Nebius Token Factory (NVIDIA Nemotron Models & Custom LoRA)
  if (typeof model === 'string' && model.startsWith('nebius-')) {
    const nebiusKey = process.env.NEBIUS_API_KEY || process.env.VITE_NEBIUS_API_KEY;
    if (nebiusKey && nebiusKey.trim()) {
      try {
        let nebiusModel = 'nvidia/nemotron-3-super-120b-a12b';
        if (model === 'nebius-nemotron-ultra') {
          nebiusModel = 'nvidia/Nemotron-3-Ultra-550b-a55b';
        } else if (model === 'nebius-nemotron-nano') {
          nebiusModel = 'nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B';
        } else if (model === 'nebius-synthlm-lora') {
          nebiusModel = process.env.NEBIUS_LORA_MODEL_ID || 'nvidia/Nemotron-3-Ultra-550b-a55b';
        }

        const nebiusRes = await fetch('https://api.tokenfactory.nebius.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${nebiusKey.trim()}`,
          },
          body: JSON.stringify({
            model: nebiusModel,
            messages: [
              {
                role: 'system',
                content: `${SYNTH_DESIGNER_SYSTEM_PROMPT}\n\nIMPORTANT: You MUST respond ONLY with a raw JSON object matching the schema:\n${JSON.stringify(SYNTH_RESPONSE_JSON_SCHEMA)}`,
              },
              {
                role: 'user',
                content: `USER REQUEST: "${prompt}"\nCURRENT PATCH STATE: ${JSON.stringify(payload)}`,
              },
            ],
            temperature: 0.7,
          }),
        });

        if (nebiusRes.ok) {
          const nebiusJson = await nebiusRes.json();
          const content = nebiusJson.choices?.[0]?.message?.content;
          if (content) {
            const parsed = extractJson(content);
            if (parsed) {
              parsed.engineSource = 'nebius-nemotron';
              return res.status(200).json(parsed);
            }
          }
        }
      } catch (nebiusErr) {
        console.warn('Nebius Token Factory call failed, falling back to Gemini:', nebiusErr);
      }
    }
  }

  // Google Gemini API Engine
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return res.status(500).json({
      error: 'Server error: Server GEMINI_API_KEY is not configured on Vercel environment variables.',
    });
  }

  try {
    const geminiModel = model.startsWith('nebius-') ? 'gemini-4-argon' : model;
    const client = new GoogleGenAI({ apiKey: apiKey.trim() });

    const interaction = await client.interactions.create({
      model: geminiModel,
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
      return res.status(502).json({ error: 'Empty output from Gemini API.' });
    }

    const parsed = JSON.parse(rawText);
    return res.status(200).json(parsed);
  } catch (err: any) {
    console.error('Serverless Gemini Proxy Error:', err);
    return res.status(500).json({
      error: err?.message || 'Failed to communicate with Gemini API on proxy.',
    });
  }
}

