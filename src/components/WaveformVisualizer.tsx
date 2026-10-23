import React, { useRef, useEffect } from 'react';
import { synthEngine } from '../audio/synthEngine';
import { SynthPatch } from '../types/synth';

interface WaveformVisualizerProps {
  patch: SynthPatch;
  isPlaying?: boolean;
}

const WaveformVisualizerComponent: React.FC<WaveformVisualizerProps> = ({ patch, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      animId = requestAnimationFrame(render);

      const width = canvas.width;
      const height = canvas.height;

      // Dark background
      ctx.fillStyle = '#100707';
      ctx.fillRect(0, 0, width, height);

      // Draw Retro Grid lines
      ctx.strokeStyle = '#230f0f';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);

      const gridSpacingX = width / 8;
      for (let x = gridSpacingX; x < width; x += gridSpacingX) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      const gridSpacingY = height / 4;
      for (let y = gridSpacingY; y < height; y += gridSpacingY) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Center crosshair line
      ctx.strokeStyle = '#381616';
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      const waveform = synthEngine.getWaveformData();
      const fft = synthEngine.getFrequencyData();

      // Draw Background Frequency Bars (FFT)
      if (fft) {
        const barWidth = width / 48;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        for (let i = 0; i < 48; i++) {
          // fft values are in dB (-100 to 0)
          const val = (fft[i] + 100) / 100; // normalize roughly 0..1
          if (val > 0.05) {
            const barHeight = Math.max(2, val * height * 0.7);
            ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
          }
        }
      }

      // Draw Golden-Yellow Waveform Trace (High-performance multi-pass glow without costly CPU shadowBlur)
      if (waveform) {
        const sliceWidth = width / waveform.length;

        // Construct path once
        const path = new Path2D();
        let x = 0;
        for (let i = 0; i < waveform.length; i++) {
          const v = waveform[i]; // range -1 to 1
          const y = (v * 0.5 + 0.5) * height;

          if (i === 0) {
            path.moveTo(x, y);
          } else {
            path.lineTo(x, y);
          }
          x += sliceWidth;
        }

        // Pass 1: Neon Red Glow Underneath (Fast GPU stroke, zero Gaussian CPU blur)
        ctx.lineWidth = 5.5;
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.stroke(path);

        // Pass 2: Sharp Crisp Golden-Yellow Core Line
        ctx.lineWidth = 2.0;
        ctx.strokeStyle = '#facc15';
        ctx.stroke(path);
      } else {
        // Idle line
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#856a1e';
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="relative pixel-box p-3 flex flex-col items-center justify-between h-full bg-[#120707] border-2 border-[#522222]">
      {/* Visualizer Header */}
      <div className="w-full flex items-center justify-between border-b border-[#3b1717] pb-1.5 mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-pixel text-yellow-400 tracking-wider">
            OSCILLOSCOPE // FFT
          </span>
        </div>
        <div className="text-[9px] font-vt323 text-yellow-500/80">
          CUTOFF: {Math.round(patch.filterCutoff)}Hz | Q: {patch.filterResonance.toFixed(1)}
        </div>
      </div>

      {/* Canvas */}
      <div className="relative w-full flex-1 min-h-[140px] rounded border border-[#381616] overflow-hidden bg-[#0c0505]">
        <canvas
          ref={canvasRef}
          width={400}
          height={160}
          className="w-full h-full block"
        />

        {/* Overlay Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5 pointer-events-none">
          <span className="text-[8px] font-silkscreen bg-red-950/80 text-red-300 border border-red-800/60 px-1 py-0.5 rounded">
            OSC1: {patch.osc1Type.toUpperCase()}
          </span>
          {patch.osc2Mix > 0.05 && (
            <span className="text-[8px] font-silkscreen bg-yellow-950/80 text-yellow-300 border border-yellow-800/60 px-1 py-0.5 rounded">
              OSC2: {patch.osc2Type.toUpperCase()}
            </span>
          )}
        </div>

        {isPlaying && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-[8px] font-pixel px-1.5 py-0.5 rounded animate-pulse">
            LIVE AUDIO
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="w-full flex items-center justify-between text-[8px] font-pixel text-yellow-600/70 mt-1.5 pt-1 border-t border-[#260e0e]">
        <span>FILTER: {patch.filterType.toUpperCase()}</span>
        <span>RATE: 44.1kHz</span>
      </div>
    </div>
  );
};

export const WaveformVisualizer = React.memo(WaveformVisualizerComponent);
