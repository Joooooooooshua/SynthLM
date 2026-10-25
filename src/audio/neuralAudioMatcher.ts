import { SynthPatch } from '../types/synth';
import rawWeights from './neuralSpectralWeights.json';

// Types for neural model weights
interface SynthNetWeights {
  'input_layer.0.weight': number[][];
  'input_layer.0.bias': number[];
  'input_layer.1.weight': number[];
  'input_layer.1.bias': number[];
  'res_block.0.weight': number[][];
  'res_block.0.bias': number[];
  'res_block.1.weight': number[];
  'res_block.1.bias': number[];
  'res_block.3.weight': number[][];
  'res_block.3.bias': number[];
  'res_block.4.weight': number[];
  'res_block.4.bias': number[];
  'bottleneck.0.weight': number[][];
  'bottleneck.0.bias': number[];
  'bottleneck.1.weight': number[];
  'bottleneck.1.bias': number[];
  'head_harmonics.0.weight': number[][];
  'head_harmonics.0.bias': number[];
  'head_params.0.weight': number[][];
  'head_params.0.bias': number[];
}

const weights = rawWeights as unknown as SynthNetWeights;

// Math primitives for browser neural forward-pass (< 2ms)
function matMulVec(W: number[][], x: number[], b: number[]): number[] {
  const out = new Array(W.length);
  for (let i = 0; i < W.length; i++) {
    let sum = b[i];
    const row = W[i];
    for (let j = 0; j < row.length; j++) {
      sum += row[j] * x[j];
    }
    out[i] = sum;
  }
  return out;
}

function layerNorm(x: number[], gamma: number[], beta: number[], eps = 1e-5): number[] {
  let mean = 0;
  for (let i = 0; i < x.length; i++) mean += x[i];
  mean /= x.length;

  let variance = 0;
  for (let i = 0; i < x.length; i++) {
    const diff = x[i] - mean;
    variance += diff * diff;
  }
  variance /= x.length;
  const std = Math.sqrt(variance + eps);

  const out = new Array(x.length);
  for (let i = 0; i < x.length; i++) {
    out[i] = ((x[i] - mean) / std) * gamma[i] + beta[i];
  }
  return out;
}

function silu(x: number[]): number[] {
  return x.map((v) => v / (1 + Math.exp(-Math.max(-20, Math.min(20, v)))));
}

function tanhAct(x: number[]): number[] {
  return x.map((v) => Math.tanh(v));
}

function sigmoidAct(x: number[]): number[] {
  return x.map((v) => 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, v)))));
}

// Forward pass through trained PyTorch SynthNet-16H
export function runSynthNetInference(features36: number[]): {
  predictedHarmonics: number[];
  predictedParams: {
    filterCutoff: number;
    filterResonance: number;
    filterEnvAmount: number;
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
} {
  // Input Layer: Linear -> LayerNorm -> SiLU
  let h = matMulVec(weights['input_layer.0.weight'], features36, weights['input_layer.0.bias']);
  h = layerNorm(h, weights['input_layer.1.weight'], weights['input_layer.1.bias']);
  h = silu(h);

  // Residual Block: Linear -> LayerNorm -> SiLU -> Linear -> LayerNorm
  let res = matMulVec(weights['res_block.0.weight'], h, weights['res_block.0.bias']);
  res = layerNorm(res, weights['res_block.1.weight'], weights['res_block.1.bias']);
  res = silu(res);
  res = matMulVec(weights['res_block.3.weight'], res, weights['res_block.3.bias']);
  res = layerNorm(res, weights['res_block.4.weight'], weights['res_block.4.bias']);

  // Residual sum + SiLU
  for (let i = 0; i < h.length; i++) {
    h[i] = h[i] + res[i];
  }
  h = silu(h);

  // Bottleneck: Linear -> LayerNorm -> SiLU
  let b = matMulVec(weights['bottleneck.0.weight'], h, weights['bottleneck.0.bias']);
  b = layerNorm(b, weights['bottleneck.1.weight'], weights['bottleneck.1.bias']);
  b = silu(b);

  // Dual Prediction Heads
  const rawHarmonics = matMulVec(weights['head_harmonics.0.weight'], b, weights['head_harmonics.0.bias']);
  const predictedHarmonics = tanhAct(rawHarmonics);

  const rawParams = matMulVec(weights['head_params.0.weight'], b, weights['head_params.0.bias']);
  const normParams = sigmoidAct(rawParams);

  // Denormalize into physical synthesizer ranges
  const filterCutoff = Math.round(20 + Math.pow(normParams[0], 2) * (18000 - 20));
  const filterResonance = Number((0.1 + normParams[1] * 17.9).toFixed(1));
  const filterEnvAmount = Math.round(-6000 + normParams[2] * 14000);
  const attack = Number((0.005 + Math.pow(normParams[3], 2) * 2.995).toFixed(3));
  const decay = Number((0.01 + Math.pow(normParams[4], 1.5) * 2.99).toFixed(2));
  const sustain = Number(normParams[5].toFixed(2));
  const release = Number((0.01 + Math.pow(normParams[6], 1.5) * 4.99).toFixed(2));

  return {
    predictedHarmonics,
    predictedParams: {
      filterCutoff,
      filterResonance,
      filterEnvAmount,
      attack,
      decay,
      sustain,
      release,
    },
  };
}

// 36-dimensional feature extraction from WebAudio AudioBuffer
export function extractAcousticFeatures(audioBuffer: AudioBuffer): number[] {
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const numSamples = channelData.length;

  // 1. Compute 16-harmonic peak overtone amplitudes using windowed Discrete Fourier Analysis
  const fftSize = 4096;
  const analysisLen = Math.min(numSamples, fftSize);
  const real = new Float32Array(analysisLen);
  const imag = new Float32Array(analysisLen);

  // Apply Hann window
  for (let i = 0; i < analysisLen; i++) {
    const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (analysisLen - 1)));
    real[i] = channelData[i] * w;
    imag[i] = 0;
  }

  // Rough fundamental frequency estimation via auto-correlation
  let bestOffset = -1;
  let maxCorr = 0;
  const minPeriod = Math.floor(sampleRate / 800); // 800 Hz
  const maxPeriod = Math.floor(sampleRate / 60);  // 60 Hz

  for (let offset = minPeriod; offset < maxPeriod; offset++) {
    let corr = 0;
    for (let i = 0; i < analysisLen - offset; i++) {
      corr += real[i] * real[i + offset];
    }
    if (corr > maxCorr) {
      maxCorr = corr;
      bestOffset = offset;
    }
  }

  const fundamentalFreq = bestOffset > 0 ? sampleRate / bestOffset : 220; // Default A3
  const harmonicBins: number[] = new Array(16).fill(0);

  // Measure amplitude at first 16 harmonic multiples
  for (let h = 1; h <= 16; h++) {
    const targetFreq = fundamentalFreq * h;
    if (targetFreq >= sampleRate / 2) break;

    // Direct Fourier coefficient at target harmonic frequency
    let sumR = 0;
    let sumI = 0;
    const omega = (2 * Math.PI * targetFreq) / sampleRate;

    for (let n = 0; n < analysisLen; n++) {
      sumR += real[n] * Math.cos(omega * n);
      sumI -= real[n] * Math.sin(omega * n);
    }
    const mag = Math.sqrt(sumR * sumR + sumI * sumI) / analysisLen;
    harmonicBins[h - 1] = mag;
  }

  // Normalize harmonic peaks relative to fundamental
  const maxMag = Math.max(...harmonicBins, 1e-4);
  const specBins = harmonicBins.map((m) => Number((m / maxMag).toFixed(3)));

  // 2. Global Spectral Descriptors (4 features)
  let weightedFreqSum = 0;
  let magSum = 0;
  let zeroCrossCount = 0;

  for (let i = 0; i < 16; i++) {
    weightedFreqSum += (i + 1) * specBins[i];
    magSum += specBins[i];
  }
  const spectralCentroid = magSum > 0 ? (weightedFreqSum / magSum) / 16 : 0.25;
  const spectralRolloff = spectralCentroid * 1.2;
  const spectralFlatness = magSum > 0 ? (magSum / 16) / Math.max(...specBins) : 0.1;

  for (let i = 1; i < analysisLen; i++) {
    if ((channelData[i] >= 0 && channelData[i - 1] < 0) || (channelData[i] < 0 && channelData[i - 1] >= 0)) {
      zeroCrossCount++;
    }
  }
  const zeroCrossings = Math.min(1.0, zeroCrossCount / (analysisLen / 2));

  // 3. 16-frame Temporal Envelope Contour (16 features)
  const envFrames: number[] = new Array(16).fill(0);
  const frameSize = Math.floor(numSamples / 16);
  let maxRms = 1e-4;

  for (let f = 0; f < 16; f++) {
    const start = f * frameSize;
    let sumSq = 0;
    for (let s = 0; s < frameSize; s++) {
      const val = channelData[start + s] || 0;
      sumSq += val * val;
    }
    const rms = Math.sqrt(sumSq / frameSize);
    envFrames[f] = rms;
    if (rms > maxRms) maxRms = rms;
  }
  const normEnv = envFrames.map((v) => Number((v / maxRms).toFixed(3)));

  // Assemble 36 features
  return [
    ...specBins,
    Number(spectralCentroid.toFixed(3)),
    Number(spectralRolloff.toFixed(3)),
    Number(spectralFlatness.toFixed(3)),
    Number(zeroCrossings.toFixed(3)),
    ...normEnv,
  ];
}

// Helper: Record 2-second audio from user microphone
export async function recordMicrophoneAudio(durationSec = 2): Promise<AudioBuffer> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

  return new Promise((resolve, reject) => {
    const mediaRecorder = new MediaRecorder(stream);
    const audioChunks: Blob[] = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      // Stop all tracks to release mic hardware
      stream.getTracks().forEach((track) => track.stop());

      try {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const arrayBuffer = await audioBlob.arrayBuffer();
        const decoded = await audioCtx.decodeAudioData(arrayBuffer);
        resolve(decoded);
      } catch (err) {
        reject(err);
      }
    };

    mediaRecorder.start();
    setTimeout(() => {
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
    }, durationSec * 1000);
  });
}

// Built-in clean acoustic demo references for 1-click testing
export function generateDemoAcousticSample(type: 'flute' | 'bell' | 'brass' | 'bass' = 'flute'): AudioBuffer {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 44100 });
  const duration = 2.0;
  const numSamples = Math.floor(audioCtx.sampleRate * duration);
  const buffer = audioCtx.createBuffer(1, numSamples, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);

  const freq = type === 'bass' ? 110 : type === 'bell' ? 880 : 440;

  for (let i = 0; i < numSamples; i++) {
    const t = i / audioCtx.sampleRate;
    let sample = 0;

    if (type === 'flute') {
      // Breath + fundamental + 3rd harmonic
      sample = Math.sin(2 * Math.PI * freq * t) + 0.3 * Math.sin(2 * Math.PI * 3 * freq * t);
      const env = Math.min(1.0, t / 0.1) * Math.exp(-t / 1.5);
      sample *= env;
    } else if (type === 'bell') {
      // Crystalline bell: 1st, 5th, 9th, 11th partials
      sample =
        Math.sin(2 * Math.PI * freq * t) +
        0.5 * Math.sin(2 * Math.PI * 2.75 * freq * t) +
        0.3 * Math.sin(2 * Math.PI * 5.4 * freq * t);
      const env = Math.exp(-t / 0.7);
      sample *= env;
    } else if (type === 'brass') {
      // Sawtooth-like brass swell
      sample = 0;
      for (let k = 1; k <= 8; k++) {
        sample += (1 / k) * Math.sin(2 * Math.PI * k * freq * t);
      }
      const env = Math.min(1.0, t / 0.25) * Math.exp(-t / 2.0);
      sample *= env;
    } else {
      // Bass: fundamental + sub-octave
      sample = Math.sin(2 * Math.PI * freq * t) + 0.8 * Math.sin(2 * Math.PI * (freq / 2) * t);
      const env = Math.exp(-t / 0.4);
      sample *= env;
    }

    data[i] = sample * 0.7;
  }

  return buffer;
}

// Main helper: Inverse Match target audio to SynthLM Patch
export function matchAudioBufferToPatch(audioBuffer: AudioBuffer, currentPatch: SynthPatch): SynthPatch {
  const features = extractAcousticFeatures(audioBuffer);
  const { predictedHarmonics, predictedParams } = runSynthNetInference(features);

  return {
    ...currentPatch,
    name: 'Neural Match (SynthNet-16H)',
    osc1Type: 'custom',
    osc1Partials: predictedHarmonics,
    filterCutoff: predictedParams.filterCutoff,
    filterResonance: predictedParams.filterResonance,
    filterEnvAmount: predictedParams.filterEnvAmount,
    attack: predictedParams.attack,
    decay: predictedParams.decay,
    sustain: predictedParams.sustain,
    release: predictedParams.release,
  };
}
