import { WaveformType } from '../types/synth';

export const NUM_HARMONIC_PARTIALS = 16;
export const NUM_WAVE_SAMPLES = 64;

/**
 * Returns standard 16-harmonic Fourier partials for standard waveform types.
 */
export function getStandardPartials(type: WaveformType): number[] {
  const partials = new Array(NUM_HARMONIC_PARTIALS).fill(0);

  switch (type) {
    case 'sine':
      partials[0] = 1.0;
      break;

    case 'square':
      // Odd harmonics with 1/n amplitude
      for (let n = 1; n <= NUM_HARMONIC_PARTIALS; n++) {
        if (n % 2 !== 0) {
          partials[n - 1] = Number((1.0 / n).toFixed(3));
        }
      }
      break;

    case 'sawtooth':
      // All harmonics with 1/n amplitude (alternating phase)
      for (let n = 1; n <= NUM_HARMONIC_PARTIALS; n++) {
        partials[n - 1] = Number(((1.0 / n) * (n % 2 === 0 ? -1 : 1)).toFixed(3));
      }
      break;

    case 'triangle':
      // Odd harmonics with 1/(n^2) amplitude and alternating sign
      for (let n = 1; n <= NUM_HARMONIC_PARTIALS; n++) {
        if (n % 2 !== 0) {
          const sign = ((n - 1) / 2) % 2 === 0 ? 1 : -1;
          partials[n - 1] = Number(((1.0 / (n * n)) * sign).toFixed(3));
        }
      }
      break;

    case 'custom':
    default:
      // Default to warm analog-style rich partials
      partials[0] = 1.0;
      partials[1] = 0.5;
      partials[2] = 0.25;
      partials[3] = 0.12;
      break;
  }

  return partials;
}

/**
 * Converts a 16-harmonic partials array into a single-cycle time-domain waveform
 * using Fourier synthesis: y(t) = sum(a_k * sin(k * t))
 * Returns an array of normalized values in [-1.0, 1.0].
 */
export function partialsToSamples(partials: number[], numSamples = NUM_WAVE_SAMPLES): number[] {
  const safePartials = clampPartials(partials);
  const samples = new Array(numSamples).fill(0);
  let maxAmp = 0;

  for (let i = 0; i < numSamples; i++) {
    const t = (2 * Math.PI * i) / numSamples;
    let sum = 0;
    for (let k = 0; k < safePartials.length; k++) {
      const harmonic = k + 1;
      const amp = safePartials[k];
      if (amp !== 0) {
        sum += amp * Math.sin(harmonic * t);
      }
    }
    samples[i] = sum;
    if (Math.abs(sum) > maxAmp) {
      maxAmp = Math.abs(sum);
    }
  }

  // Normalize to [-1.0, 1.0] if there is non-zero amplitude
  if (maxAmp > 0.001) {
    for (let i = 0; i < numSamples; i++) {
      samples[i] = Number((samples[i] / maxAmp).toFixed(4));
    }
  } else {
    // Fallback to pure sine if sum was zero
    for (let i = 0; i < numSamples; i++) {
      samples[i] = Number(Math.sin((2 * Math.PI * i) / numSamples).toFixed(4));
    }
  }

  return samples;
}

/**
 * Converts a drawn single-cycle time-domain curve into 16 harmonic Fourier partials
 * using Discrete Fourier Transform (DFT sine coefficients):
 * a_k = (2 / N) * sum(y(i) * sin(k * t))
 */
export function samplesToPartials(samples: number[], numHarmonics = NUM_HARMONIC_PARTIALS): number[] {
  if (!Array.isArray(samples) || samples.length === 0) {
    return getStandardPartials('sine');
  }

  const N = samples.length;
  const partials = new Array(numHarmonics).fill(0);
  let maxAmp = 0;

  for (let k = 0; k < numHarmonics; k++) {
    const harmonic = k + 1;
    let sum = 0;
    for (let i = 0; i < N; i++) {
      const t = (2 * Math.PI * i) / N;
      sum += samples[i] * Math.sin(harmonic * t);
    }
    const coeff = (2 / N) * sum;
    partials[k] = coeff;
    if (Math.abs(coeff) > maxAmp) {
      maxAmp = Math.abs(coeff);
    }
  }

  // Normalize partials so dominant harmonic is 1.0 or -1.0
  if (maxAmp > 0.001) {
    for (let k = 0; k < numHarmonics; k++) {
      partials[k] = Number((partials[k] / maxAmp).toFixed(3));
    }
  } else {
    return getStandardPartials('sine');
  }

  return partials;
}

/**
 * Validates and clamps an arbitrary partials array to 16 numbers in [-1.0, 1.0].
 */
export function clampPartials(partials: unknown, fallbackType: WaveformType = 'sine'): number[] {
  if (!Array.isArray(partials) || partials.length === 0) {
    return getStandardPartials(fallbackType);
  }

  const result = new Array(NUM_HARMONIC_PARTIALS).fill(0);
  let hasNonZero = false;

  for (let i = 0; i < NUM_HARMONIC_PARTIALS; i++) {
    const val = partials[i];
    if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
      const clamped = Math.max(-1.0, Math.min(1.0, val));
      result[i] = Number(clamped.toFixed(3));
      if (Math.abs(result[i]) > 0.01) {
        hasNonZero = true;
      }
    } else {
      result[i] = 0;
    }
  }

  if (!hasNonZero) {
    return getStandardPartials(fallbackType);
  }

  return result;
}
