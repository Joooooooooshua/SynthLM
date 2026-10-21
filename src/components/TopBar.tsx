import React, { useState } from 'react';
import { SynthPatch } from '../types/synth';
import { FOUNDATIONAL_PRESETS } from '../audio/presets';
import { Play, Square, Save, RotateCcw, Sliders, Music, Key } from 'lucide-react';

interface TopBarProps {
  currentPatch: SynthPatch;
  savedSnapshots: SynthPatch[];
  activeManualSlot: 'A' | 'B' | null;
  activeAiSlot: 'alpha' | 'beta' | null;
  hasAlphaBeta: boolean;
  isLoopPlaying: boolean;
  loopBpm: number;
  midiDeviceName: string | null;
  apiKeySet: boolean;
  onSelectPreset: (preset: SynthPatch) => void;
  onSaveSnapshot: (name: string) => void;
  onManualSlotToggle: (slot: 'A' | 'B') => void;
  onManualSaveSlot: (slot: 'A' | 'B') => void;
  onAiSlotToggle: () => void;
  onToggleLoop: () => void;
  onBpmChange: (bpm: number) => void;
  onReset: () => void;
  onOpenApiKeyModal: () => void;
  onOpenMelodyModal: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentPatch,
  savedSnapshots,
  activeManualSlot,
  activeAiSlot,
  hasAlphaBeta,
  isLoopPlaying,
  loopBpm,
  midiDeviceName,
  apiKeySet,
  onSelectPreset,
  onSaveSnapshot,
  onManualSlotToggle,
  onManualSaveSlot,
  onAiSlotToggle,
  onToggleLoop,
  onBpmChange,
  onReset,
  onOpenApiKeyModal,
  onOpenMelodyModal,
}) => {
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (snapshotName.trim()) {
      onSaveSnapshot(snapshotName.trim());
      setSnapshotName('');
      setShowSaveInput(false);
    }
  };

  return (
    <header className="w-full bg-[#170a0a] border-b-2 border-[#522222] px-3 py-2 flex flex-wrap items-center justify-between gap-2 shadow-lg">
      {/* Brand Logo & Title */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-gradient-to-br from-red-600 to-yellow-500 border border-yellow-300 flex items-center justify-center font-pixel text-black text-[10px] font-bold shadow-[0_0_8px_#ef4444]">
          LM
        </div>
        <div>
          <h1 className="font-pixel text-xs sm:text-sm text-yellow-400 tracking-wider flex items-center gap-1.5">
            SynthLM
            <span className="text-[7px] font-silkscreen text-red-400 border border-red-700/60 px-1 py-0.2 rounded">
              v1.0
            </span>
          </h1>
          <p className="text-[8px] font-vt323 text-yellow-600/80 tracking-widest hidden sm:block">
            AI-POWERED NATURAL LANGUAGE SYNTHESIZER
          </p>
        </div>
      </div>

      {/* Preset Selector & Save Snapshot */}
      <div className="flex items-center gap-1.5 bg-[#1f0d0d] px-2 py-1 rounded border border-[#3d1717]">
        <span className="text-[8px] font-pixel text-yellow-600 hidden md:inline">PRESET:</span>
        <select
          value={currentPatch.name}
          onChange={(e) => {
            const all = [...FOUNDATIONAL_PRESETS, ...savedSnapshots];
            const found = all.find((p) => p.name === e.target.value);
            if (found) onSelectPreset(found);
          }}
          className="bg-[#120606] text-yellow-300 font-pixel text-[9px] px-2 py-1 rounded border border-[#4d1d1d] focus:outline-none focus:border-yellow-400"
        >
          <optgroup label="Foundational Waves">
            {FOUNDATIONAL_PRESETS.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </optgroup>
          {savedSnapshots.length > 0 && (
            <optgroup label="Custom Snapshots">
              {savedSnapshots.map((p) => (
                <option key={p.name} value={p.name}>
                  ★ {p.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>

        {showSaveInput ? (
          <form onSubmit={handleSaveSubmit} className="flex items-center gap-1">
            <input
              type="text"
              placeholder="Snapshot name..."
              value={snapshotName}
              onChange={(e) => setSnapshotName(e.target.value)}
              className="bg-[#0c0404] text-yellow-300 font-pixel text-[8px] px-1.5 py-1 rounded border border-yellow-500/60 w-24 focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-pixel text-[8px] px-1.5 py-1 rounded"
            >
              OK
            </button>
            <button
              type="button"
              onClick={() => setShowSaveInput(false)}
              className="text-red-400 text-xs px-1"
            >
              ✕
            </button>
          </form>
        ) : (
          <button
            onClick={() => setShowSaveInput(true)}
            className="flex items-center gap-1 bg-[#2e1212] hover:bg-[#421a1a] text-yellow-300 text-[8px] font-pixel px-1.5 py-1 rounded border border-[#522222] transition-colors"
            title="Save current patch snapshot"
          >
            <Save size={10} />
            <span className="hidden sm:inline">SAVE</span>
          </button>
        )}
      </div>

      {/* Comparison Sections: AI Alpha/Beta & Manual A/B */}
      <div className="flex items-center gap-2">
        {/* AI Alpha / Beta Toggle */}
        <div className="flex items-center bg-[#1f0d0d] p-0.5 rounded border border-[#3d1717]">
          <button
            onClick={onAiSlotToggle}
            disabled={!hasAlphaBeta}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[8px] font-pixel transition-all ${
              !hasAlphaBeta
                ? 'opacity-40 cursor-not-allowed text-neutral-500'
                : activeAiSlot === 'beta'
                ? 'bg-gradient-to-r from-red-600 to-yellow-500 text-black font-bold shadow-[0_0_8px_#facc15]'
                : 'bg-yellow-950/60 text-yellow-300 border border-yellow-700/50'
            }`}
            title="Toggle between Pre-AI (Alpha) and Post-AI (Beta) sound"
          >
            <span>{activeAiSlot === 'beta' ? 'β BETA (AI)' : 'α ALPHA'}</span>
          </button>
        </div>

        {/* Manual A / B Comparison Bank */}
        <div className="flex items-center gap-0.5 bg-[#1f0d0d] p-0.5 rounded border border-[#3d1717] font-pixel text-[8px]">
          <button
            onClick={() => onManualSlotToggle('A')}
            className={`px-1.5 py-1 rounded transition-colors ${
              activeManualSlot === 'A'
                ? 'bg-yellow-500 text-black font-bold'
                : 'text-yellow-600 hover:text-yellow-300'
            }`}
            title="Switch to Manual Slot A"
          >
            A
          </button>
          <button
            onClick={() => onManualSaveSlot('A')}
            className="text-[7px] text-red-400 hover:text-red-300 px-0.5"
            title="Save current patch into Slot A"
          >
            [SAVE A]
          </button>
          <span className="text-[#3d1717]">|</span>
          <button
            onClick={() => onManualSlotToggle('B')}
            className={`px-1.5 py-1 rounded transition-colors ${
              activeManualSlot === 'B'
                ? 'bg-yellow-500 text-black font-bold'
                : 'text-yellow-600 hover:text-yellow-300'
            }`}
            title="Switch to Manual Slot B"
          >
            B
          </button>
          <button
            onClick={() => onManualSaveSlot('B')}
            className="text-[7px] text-red-400 hover:text-red-300 px-0.5"
            title="Save current patch into Slot B"
          >
            [SAVE B]
          </button>
        </div>
      </div>

      {/* Demo Loop & Performance Controls */}
      <div className="flex items-center gap-1.5 bg-[#1f0d0d] px-2 py-1 rounded border border-[#3d1717]">
        <button
          onClick={onToggleLoop}
          className={`flex items-center gap-1 text-[8px] font-pixel px-2 py-1 rounded transition-all ${
            isLoopPlaying
              ? 'bg-red-600 text-yellow-200 border border-yellow-400 shadow-[0_0_8px_#ef4444] animate-pulse'
              : 'bg-[#2a1111] hover:bg-[#3d1818] text-yellow-400 border border-[#522222]'
          }`}
          title="Play/Stop Demo Loop for hands-free audio while prompting AI"
        >
          {isLoopPlaying ? <Square size={10} /> : <Play size={10} />}
          <span>LOOP</span>
        </button>

        {/* BPM Selector */}
        <div className="flex items-center gap-1 font-vt323 text-xs text-yellow-400">
          <span className="hidden sm:inline">BPM:</span>
          <input
            type="range"
            min={60}
            max={160}
            value={loopBpm}
            onChange={(e) => onBpmChange(Number(e.target.value))}
            className="w-14 sm:w-16 accent-yellow-400 cursor-pointer"
          />
          <span className="w-6 text-right font-bold">{loopBpm}</span>
        </div>

        {/* Melody Edit Button */}
        <button
          onClick={onOpenMelodyModal}
          className="text-yellow-500/80 hover:text-yellow-300 p-1"
          title="Custom Demo Loop Melody Editor"
        >
          <Music size={12} />
        </button>
      </div>

      {/* Right Controls: MIDI status, API Key, Reset */}
      <div className="flex items-center gap-1.5">
        {/* MIDI Badge */}
        <div
          className={`flex items-center gap-1 px-1.5 py-1 rounded text-[7px] font-pixel border ${
            midiDeviceName
              ? 'bg-red-950/80 border-red-600 text-yellow-300 shadow-[0_0_6px_#ef4444]'
              : 'bg-[#170a0a] border-[#381616] text-yellow-600/50'
          }`}
          title={midiDeviceName ? `Connected MIDI: ${midiDeviceName}` : 'No Web MIDI device detected'}
        >
          <Sliders size={9} />
          <span className="hidden sm:inline">{midiDeviceName ? midiDeviceName.slice(0, 10) : 'NO MIDI'}</span>
        </div>

        {/* API Key Modal Button */}
        <button
          onClick={onOpenApiKeyModal}
          className={`flex items-center gap-1 px-1.5 py-1 rounded text-[7px] font-pixel border transition-colors ${
            apiKeySet
              ? 'bg-yellow-950/70 border-yellow-600 text-yellow-300'
              : 'bg-red-900/60 border-red-500 text-red-200 animate-pulse'
          }`}
          title="Configure Gemini API Key"
        >
          <Key size={9} />
          <span className="hidden sm:inline">{apiKeySet ? 'KEY SET' : 'ADD KEY'}</span>
        </button>

        {/* Reset Patch Button */}
        <button
          onClick={onReset}
          className="text-yellow-600 hover:text-red-400 p-1 transition-colors"
          title="Reset to Init Sine"
        >
          <RotateCcw size={12} />
        </button>
      </div>
    </header>
  );
};
