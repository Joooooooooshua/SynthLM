import React, { useRef, useEffect, useState, useCallback } from 'react';
import { WaveformType } from '../types/synth';
import { partialsToSamples, samplesToPartials, getStandardPartials, NUM_WAVE_SAMPLES } from '../audio/waveMath';

interface WaveSculptorCanvasProps {
  oscLabel: 'OSC 1' | 'OSC 2';
  waveformType: WaveformType;
  partials?: number[];
  isHighlighted?: boolean;
  onPartialsChange: (partials: number[]) => void;
  onInteract?: () => void;
}

export const WaveSculptorCanvas: React.FC<WaveSculptorCanvasProps> = ({
  oscLabel,
  waveformType,
  partials,
  isHighlighted,
  onPartialsChange,
  onInteract,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const samplesRef = useRef<number[]>([]);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Compute samples whenever partials or waveformType changes
  useEffect(() => {
    if (isDrawing) return; // don't overwrite during active drawing

    const activePartials = waveformType === 'custom' && partials && partials.length > 0
      ? partials
      : getStandardPartials(waveformType);

    samplesRef.current = partialsToSamples(activePartials, NUM_WAVE_SAMPLES);
    drawWaveform();
  }, [waveformType, partials, isDrawing]);

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const samples = samplesRef.current;

    // Background
    ctx.fillStyle = '#0f0606';
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = '#260e0e';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);

    for (let x = width / 4; x < width; x += width / 4) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Center Zero Line
    ctx.strokeStyle = '#3d1616';
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    if (!samples || samples.length === 0) return;

    // Draw Subtle Harmonic Bars in background
    if (partials && partials.length > 0) {
      const barWidth = width / 16;
      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
      for (let i = 0; i < 16; i++) {
        const amp = Math.abs(partials[i] || 0);
        const barHeight = amp * (height * 0.45);
        ctx.fillRect(i * barWidth + 1, height - barHeight, barWidth - 2, barHeight);
      }
    }

    // Draw Waveform Curve
    ctx.beginPath();
    const sliceWidth = width / (samples.length - 1);

    for (let i = 0; i < samples.length; i++) {
      const val = samples[i]; // range [-1.0, 1.0]
      // Invert y because canvas top is 0
      const y = (1.0 - val) * 0.5 * (height - 6) + 3;
      const x = i * sliceWidth;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    // Glow and stroke
    ctx.strokeStyle = waveformType === 'custom' ? '#facc15' : '#eab308';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }, [partials, waveformType]);

  // Handle Mouse & Touch Drawing
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    onInteract?.();

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    lastPointRef.current = { x, y };
    updateSampleAtPosition(x, y, rect.width, rect.height);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    // Linear interpolation between last point and current point to prevent gaps
    if (lastPointRef.current) {
      const lastX = lastPointRef.current.x;
      const lastY = lastPointRef.current.y;
      const dist = Math.hypot(x - lastX, y - lastY);
      const steps = Math.max(1, Math.floor(dist / 2));

      for (let s = 1; s <= steps; s++) {
        const interX = lastX + ((x - lastX) * s) / steps;
        const interY = lastY + ((y - lastY) * s) / steps;
        updateSampleAtPosition(interX, interY, rect.width, rect.height);
      }
    }

    lastPointRef.current = { x, y };
    drawWaveform();
  };

  const updateSampleAtPosition = (px: number, py: number, width: number, height: number) => {
    const samples = samplesRef.current;
    if (samples.length === 0) return;

    const normX = Math.max(0, Math.min(1, px / width));
    const sampleIdx = Math.round(normX * (samples.length - 1));

    // Convert pixel y to amplitude in [-1.0, 1.0] (invert y)
    const normY = 1.0 - (py / height) * 2.0;
    samples[sampleIdx] = Math.max(-1.0, Math.min(1.0, normY));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setIsDrawing(false);
    lastPointRef.current = null;

    // Convert hand-drawn time domain curve to 16 harmonic partials via DFT
    const newPartials = samplesToPartials(samplesRef.current, 16);
    // Reconstruct clean band-limited samples
    samplesRef.current = partialsToSamples(newPartials, NUM_WAVE_SAMPLES);
    drawWaveform();
    onPartialsChange(newPartials);
  };

  return (
    <div
      className={`relative w-full rounded border transition-all ${
        isHighlighted
          ? 'border-yellow-400 shadow-[0_0_10px_#facc15] bg-[#291305]'
          : 'border-[#3d1818] bg-[#140808] hover:border-[#5c2424]'
      }`}
      onClick={() => onInteract?.()}
    >
      {/* Canvas Header */}
      <div className="flex items-center justify-between px-2 py-0.5 border-b border-[#2b0f0f] bg-[#1a0a0a]">
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] font-pixel text-yellow-400">{oscLabel} SINGLE CYCLE</span>
          {waveformType === 'custom' && (
            <span className="text-[7px] font-silkscreen px-1 py-0.2 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
              AI / CUSTOM
            </span>
          )}
        </div>
        <span className="text-[7px] font-silkscreen text-yellow-600/80">
          DRAG TO DRAW WAVE
        </span>
      </div>

      {/* Drawing Canvas */}
      <div className="relative w-full h-[58px] cursor-crosshair overflow-hidden">
        <canvas
          ref={canvasRef}
          width={240}
          height={58}
          className="w-full h-full block"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />

        {/* Highlight notification badge */}
        {isHighlighted && (
          <div className="absolute top-1 right-1 pointer-events-none text-[7px] font-pixel bg-yellow-400 text-black px-1 rounded shadow animate-pulse">
            NEW WAVE
          </div>
        )}
      </div>
    </div>
  );
};

