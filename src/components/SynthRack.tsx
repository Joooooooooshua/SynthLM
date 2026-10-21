import React from 'react';
import { SynthPatch, WaveformType, FilterType } from '../types/synth';
import { PARAMETER_METAS } from '../audio/presets';
import { RotaryKnob } from './RotaryKnob';
import { WaveformVisualizer } from './WaveformVisualizer';
import { WaveSculptorCanvas } from './WaveSculptorCanvas';

interface SynthRackProps {
  patch: SynthPatch;
  highlightedParams: Set<keyof SynthPatch>;
  isPlaying?: boolean;
  onParamChange: (key: string, value: number) => void;
  onWaveformChange: (osc: 'osc1Type' | 'osc2Type', type: WaveformType) => void;
  onPartialsChange: (osc: 'osc1Partials' | 'osc2Partials', partials: number[]) => void;
  onFilterTypeChange: (type: FilterType) => void;
  onClearHighlight: (key: string) => void;
}

const WAVEFORMS: { type: WaveformType; label: string; icon: string }[] = [
  { type: 'sine', label: 'SIN', icon: '∿' },
  { type: 'square', label: 'SQR', icon: '⊓' },
  { type: 'triangle', label: 'TRI', icon: '∧' },
  { type: 'sawtooth', label: 'SAW', icon: '⩘' },
  { type: 'custom', label: 'CST', icon: '✦' },
];

const FILTERS: { type: FilterType; label: string }[] = [
  { type: 'lowpass', label: 'LP' },
  { type: 'highpass', label: 'HP' },
  { type: 'bandpass', label: 'BP' },
];

export const SynthRack: React.FC<SynthRackProps> = ({
  patch,
  highlightedParams,
  isPlaying,
  onParamChange,
  onWaveformChange,
  onPartialsChange,
  onFilterTypeChange,
  onClearHighlight,
}) => {
  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-[#0d0606] rounded-lg border border-[#3b1717] overflow-y-auto">
      {/* 1. DUAL OSCILLATORS MODULE (Top-Left) */}
      <div className="pixel-box p-3 flex flex-col justify-between">
        <div className="pixel-box-header px-2 py-1 flex items-center justify-between mb-2">
          <span className="text-[10px] font-pixel text-red-400">OSC 1 & OSC 2</span>
          <span className="text-[8px] font-silkscreen text-yellow-500/80">DUAL ENGINE & WAVE SCULPT</span>
        </div>

        {/* OSC 1 */}
        <div className="border border-[#381616] p-2 rounded mb-2 bg-[#140808]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-pixel text-yellow-400">OSC 1</span>
            {/* Waveform Selector */}
            <div className="flex gap-1">
              {WAVEFORMS.map((wf) => (
                <button
                  key={wf.type}
                  onClick={() => onWaveformChange('osc1Type', wf.type)}
                  className={`text-[8px] font-silkscreen px-1.5 py-0.5 rounded border transition-colors ${
                    patch.osc1Type === wf.type
                      ? 'bg-red-600 text-yellow-200 border-yellow-400 shadow-[0_0_6px_#ef4444]'
                      : 'bg-[#210c0c] text-yellow-600 border-[#471818] hover:text-yellow-400'
                  }`}
                  title={wf.label}
                >
                  {wf.icon} {wf.label}
                </button>
              ))}
            </div>
          </div>

          {/* OSC 1 Single-Cycle Wave Canvas */}
          <div className="mb-2">
            <WaveSculptorCanvas
              oscLabel="OSC 1"
              waveformType={patch.osc1Type}
              partials={patch.osc1Partials}
              isHighlighted={highlightedParams.has('osc1Partials') || highlightedParams.has('osc1Type')}
              onPartialsChange={(newPartials) => onPartialsChange('osc1Partials', newPartials)}
              onInteract={() => {
                onClearHighlight('osc1Partials');
                onClearHighlight('osc1Type');
              }}
            />
          </div>

          <div className="flex justify-around">
            <RotaryKnob
              meta={PARAMETER_METAS.osc1Octave}
              value={patch.osc1Octave}
              isHighlighted={highlightedParams.has('osc1Octave')}
              onChange={onParamChange}
              onInteract={onClearHighlight}
            />
            <RotaryKnob
              meta={PARAMETER_METAS.osc1Detune}
              value={patch.osc1Detune}
              isHighlighted={highlightedParams.has('osc1Detune')}
              onChange={onParamChange}
              onInteract={onClearHighlight}
            />
            <RotaryKnob
              meta={PARAMETER_METAS.osc1Mix}
              value={patch.osc1Mix}
              isHighlighted={highlightedParams.has('osc1Mix')}
              onChange={onParamChange}
              onInteract={onClearHighlight}
            />
          </div>
        </div>

        {/* OSC 2 */}
        <div className="border border-[#381616] p-2 rounded bg-[#140808]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-pixel text-yellow-400">OSC 2</span>
            {/* Waveform Selector */}
            <div className="flex gap-1">
              {WAVEFORMS.map((wf) => (
                <button
                  key={wf.type}
                  onClick={() => onWaveformChange('osc2Type', wf.type)}
                  className={`text-[8px] font-silkscreen px-1.5 py-0.5 rounded border transition-colors ${
                    patch.osc2Type === wf.type
                      ? 'bg-red-600 text-yellow-200 border-yellow-400 shadow-[0_0_6px_#ef4444]'
                      : 'bg-[#210c0c] text-yellow-600 border-[#471818] hover:text-yellow-400'
                  }`}
                  title={wf.label}
                >
                  {wf.icon} {wf.label}
                </button>
              ))}
            </div>
          </div>

          {/* OSC 2 Single-Cycle Wave Canvas */}
          <div className="mb-2">
            <WaveSculptorCanvas
              oscLabel="OSC 2"
              waveformType={patch.osc2Type}
              partials={patch.osc2Partials}
              isHighlighted={highlightedParams.has('osc2Partials') || highlightedParams.has('osc2Type')}
              onPartialsChange={(newPartials) => onPartialsChange('osc2Partials', newPartials)}
              onInteract={() => {
                onClearHighlight('osc2Partials');
                onClearHighlight('osc2Type');
              }}
            />
          </div>

          <div className="flex justify-around">
            <RotaryKnob
              meta={PARAMETER_METAS.osc2Octave}
              value={patch.osc2Octave}
              isHighlighted={highlightedParams.has('osc2Octave')}
              onChange={onParamChange}
              onInteract={onClearHighlight}
            />
            <RotaryKnob
              meta={PARAMETER_METAS.osc2Detune}
              value={patch.osc2Detune}
              isHighlighted={highlightedParams.has('osc2Detune')}
              onChange={onParamChange}
              onInteract={onClearHighlight}
            />
            <RotaryKnob
              meta={PARAMETER_METAS.osc2Mix}
              value={patch.osc2Mix}
              isHighlighted={highlightedParams.has('osc2Mix')}
              onChange={onParamChange}
              onInteract={onClearHighlight}
            />
          </div>
        </div>
      </div>

      {/* 2. CENTER PIECE: REAL-TIME WAVEFORM & SPECTRUM VISUALIZER */}
      <div className="flex flex-col">
        <WaveformVisualizer patch={patch} isPlaying={isPlaying} />
      </div>

      {/* 3. FILTER & MASTER MODULE (Top-Right) */}
      <div className="pixel-box p-3 flex flex-col justify-between">
        <div className="pixel-box-header px-2 py-1 flex items-center justify-between mb-2">
          <span className="text-[10px] font-pixel text-red-400">FILTER & MASTER</span>
          <span className="text-[8px] font-silkscreen text-yellow-500/80">SHAPING</span>
        </div>

        {/* Filter Bay */}
        <div className="border border-[#381616] p-2 rounded mb-2 bg-[#140808]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-pixel text-yellow-400">MODE</span>
            <div className="flex gap-1">
              {FILTERS.map((f) => (
                <button
                  key={f.type}
                  onClick={() => onFilterTypeChange(f.type)}
                  className={`text-[8px] font-silkscreen px-2 py-0.5 rounded border transition-colors ${
                    patch.filterType === f.type
                      ? 'bg-yellow-500 text-black border-yellow-300 font-bold'
                      : 'bg-[#210c0c] text-yellow-600 border-[#471818] hover:text-yellow-400'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-around mt-1">
            <RotaryKnob
              meta={PARAMETER_METAS.filterCutoff}
              value={patch.filterCutoff}
              isHighlighted={highlightedParams.has('filterCutoff')}
              onChange={onParamChange}
              onInteract={onClearHighlight}
            />
            <RotaryKnob
              meta={PARAMETER_METAS.filterResonance}
              value={patch.filterResonance}
              isHighlighted={highlightedParams.has('filterResonance')}
              onChange={onParamChange}
              onInteract={onClearHighlight}
            />
          </div>
        </div>

        {/* Master Output */}
        <div className="border border-[#381616] p-2 rounded bg-[#140808] flex items-center justify-around">
          <RotaryKnob
            meta={PARAMETER_METAS.masterVolume}
            value={patch.masterVolume}
            isHighlighted={highlightedParams.has('masterVolume')}
            onChange={onParamChange}
            onInteract={onClearHighlight}
          />
          <div className="text-center font-vt323 text-xs text-yellow-500/80">
            <div className="text-red-400 font-pixel text-[8px] mb-1">LIMITER</div>
            <div className="bg-[#210c0c] px-2 py-1 rounded border border-[#3b1717]">
              -1.0 dB PEAK
            </div>
          </div>
        </div>
      </div>

      {/* 4. ADSR ENVELOPE MODULE (Bottom-Left) */}
      <div className="pixel-box p-3 md:col-span-1 flex flex-col justify-between">
        <div className="pixel-box-header px-2 py-1 flex items-center justify-between mb-2">
          <span className="text-[10px] font-pixel text-red-400">ENVELOPE (ADSR)</span>
          <span className="text-[8px] font-silkscreen text-yellow-500/80">AMPLITUDE</span>
        </div>

        {/* Dynamic SVG ADSR Curve Preview */}
        <div className="h-16 w-full bg-[#100707] border border-[#381616] rounded mb-2 overflow-hidden relative">
          <svg className="w-full h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
            {/* Compute SVG ADSR Path */}
            {(() => {
              // Normalize attack, decay, release proportions
              const aWidth = Math.max(10, (patch.attack / 3.0) * 50);
              const dWidth = Math.max(10, (patch.decay / 3.0) * 50);
              const sHeight = 60 - patch.sustain * 50; // SVG y coordinates are top-down
              const sWidth = 40;
              const rWidth = Math.max(10, (patch.release / 5.0) * 60);

              const path = `M 0 60 L ${aWidth} 10 L ${aWidth + dWidth} ${sHeight} L ${aWidth + dWidth + sWidth} ${sHeight} L ${aWidth + dWidth + sWidth + rWidth} 60`;
              return (
                <>
                  <path d={path} fill="rgba(239, 68, 68, 0.15)" />
                  <path d={path} fill="none" stroke="#facc15" strokeWidth="2" />
                </>
              );
            })()}
          </svg>
          <div className="absolute bottom-1 right-2 text-[8px] font-vt323 text-yellow-500/60">
            A:{Math.round(patch.attack * 1000)}ms | R:{Math.round(patch.release * 1000)}ms
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1">
          <RotaryKnob
            meta={PARAMETER_METAS.attack}
            value={patch.attack}
            isHighlighted={highlightedParams.has('attack')}
            onChange={onParamChange}
            onInteract={onClearHighlight}
          />
          <RotaryKnob
            meta={PARAMETER_METAS.decay}
            value={patch.decay}
            isHighlighted={highlightedParams.has('decay')}
            onChange={onParamChange}
            onInteract={onClearHighlight}
          />
          <RotaryKnob
            meta={PARAMETER_METAS.sustain}
            value={patch.sustain}
            isHighlighted={highlightedParams.has('sustain')}
            onChange={onParamChange}
            onInteract={onClearHighlight}
          />
          <RotaryKnob
            meta={PARAMETER_METAS.release}
            value={patch.release}
            isHighlighted={highlightedParams.has('release')}
            onChange={onParamChange}
            onInteract={onClearHighlight}
          />
        </div>
      </div>

      {/* 5. EFFECTS RACK MODULE (Bottom-Right, 2 cols on md) */}
      <div className="pixel-box p-3 md:col-span-2 flex flex-col justify-between">
        <div className="pixel-box-header px-2 py-1 flex items-center justify-between mb-2">
          <span className="text-[10px] font-pixel text-red-400">FX RACK // 4-CHAIN</span>
          <span className="text-[8px] font-silkscreen text-yellow-500/80">DRIVE • CHORUS • DELAY • REVERB</span>
        </div>

        <div className="grid grid-cols-6 gap-2">
          <RotaryKnob
            meta={PARAMETER_METAS.distortion}
            value={patch.distortion}
            isHighlighted={highlightedParams.has('distortion')}
            onChange={onParamChange}
            onInteract={onClearHighlight}
          />
          <RotaryKnob
            meta={PARAMETER_METAS.chorusWet}
            value={patch.chorusWet}
            isHighlighted={highlightedParams.has('chorusWet')}
            onChange={onParamChange}
            onInteract={onClearHighlight}
          />
          <RotaryKnob
            meta={PARAMETER_METAS.delayTime}
            value={patch.delayTime}
            isHighlighted={highlightedParams.has('delayTime')}
            onChange={onParamChange}
            onInteract={onClearHighlight}
          />
          <RotaryKnob
            meta={PARAMETER_METAS.delayWet}
            value={patch.delayWet}
            isHighlighted={highlightedParams.has('delayWet')}
            onChange={onParamChange}
            onInteract={onClearHighlight}
          />
          <RotaryKnob
            meta={PARAMETER_METAS.reverbDecay}
            value={patch.reverbDecay}
            isHighlighted={highlightedParams.has('reverbDecay')}
            onChange={onParamChange}
            onInteract={onClearHighlight}
          />
          <RotaryKnob
            meta={PARAMETER_METAS.reverbWet}
            value={patch.reverbWet}
            isHighlighted={highlightedParams.has('reverbWet')}
            onChange={onParamChange}
            onInteract={onClearHighlight}
          />
        </div>
      </div>
    </div>
  );
};
