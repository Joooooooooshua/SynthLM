import { useState, useEffect, useCallback, useRef } from 'react';
import { SynthPatch, WaveformType, FilterType, ChatMessage, GeminiModelId } from './types/synth';
import { INIT_SINE, clampPatch } from './audio/presets';
import { synthEngine } from './audio/synthEngine';
import { midiManager } from './audio/midiManager';
import { demoMelodyManager } from './audio/demoMelody';
import { requestAISoundDesign } from './services/geminiSoundDesigner';
import { TopBar } from './components/TopBar';
import { SynthRack } from './components/SynthRack';
import { PianoKeyboard } from './components/PianoKeyboard';
import { AISidebar } from './components/AISidebar';
import { ApiKeyModal } from './components/ApiKeyModal';
import { MelodyModal } from './components/MelodyModal';

export function App() {
  // Synthesizer State
  const [currentPatch, setCurrentPatch] = useState<SynthPatch>(() => {
    const saved = localStorage.getItem('synthlm_current_patch');
    if (saved) {
      try {
        return clampPatch(JSON.parse(saved));
      } catch (e) {
        console.warn('Failed to parse saved patch:', e);
      }
    }
    return { ...INIT_SINE };
  });

  // Dual Comparison States: AI Alpha / Beta
  const [alphaPatch, setAlphaPatch] = useState<SynthPatch | null>(null);
  const [betaPatch, setBetaPatch] = useState<SynthPatch | null>(null);
  const [activeAiSlot, setActiveAiSlot] = useState<'alpha' | 'beta' | null>(null);

  // Dual Comparison States: Manual A / B Slots
  const [slotAPatch, setSlotAPatch] = useState<SynthPatch>(() => ({ ...INIT_SINE, name: 'Slot A' }));
  const [slotBPatch, setSlotBPatch] = useState<SynthPatch>(() => ({ ...INIT_SINE, name: 'Slot B' }));
  const [activeManualSlot, setActiveManualSlot] = useState<'A' | 'B' | null>(null);

  // Saved Custom Presets / Snapshots
  const [savedSnapshots, setSavedSnapshots] = useState<SynthPatch[]>(() => {
    const saved = localStorage.getItem('synthlm_saved_snapshots');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse saved snapshots:', e);
      }
    }
    return [];
  });

  // Persistent Highlighted Parameters (cleared on direct knob interaction)
  const [highlightedParams, setHighlightedParams] = useState<Set<keyof SynthPatch>>(new Set());

  // Performance & Live State
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const [isLoopPlaying, setIsLoopPlaying] = useState(false);
  const [loopBpm, setLoopBpm] = useState(110);
  const [midiDeviceName, setMidiDeviceName] = useState<string | null>(null);
  const [isAudioLive, setIsAudioLive] = useState(false);

  // AI State
  const [selectedModel, setSelectedModel] = useState<GeminiModelId>('gemini-4-argon');
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('synthlm_gemini_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
  });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('synthlm_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse chat history:', e);
      }
    }
    return [];
  });
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Modals
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isMelodyModalOpen, setIsMelodyModalOpen] = useState(false);

  // Unsaved changes tracker
  const isDirtyRef = useRef(false);

  // Sync patch to Tone.js audio engine on change
  const updatePatch = useCallback((newPatch: SynthPatch) => {
    setCurrentPatch(newPatch);
    synthEngine.applyPatch(newPatch);
    localStorage.setItem('synthlm_current_patch', JSON.stringify(newPatch));
    isDirtyRef.current = true;
  }, []);

  // Handle single parameter change
  const handleParamChange = useCallback((key: string, value: number) => {
    setCurrentPatch((prev) => {
      const next = { ...prev, [key]: value };
      synthEngine.applyPatch(next);
      localStorage.setItem('synthlm_current_patch', JSON.stringify(next));
      isDirtyRef.current = true;
      return next;
    });
  }, []);

  // Handle waveform type change
  const handleWaveformChange = useCallback((osc: 'osc1Type' | 'osc2Type', type: WaveformType) => {
    setCurrentPatch((prev) => {
      const next = { ...prev, [osc]: type };
      synthEngine.applyPatch(next);
      localStorage.setItem('synthlm_current_patch', JSON.stringify(next));
      isDirtyRef.current = true;
      return next;
    });
  }, []);

  // Handle filter type change
  const handleFilterTypeChange = useCallback((type: FilterType) => {
    setCurrentPatch((prev) => {
      const next = { ...prev, filterType: type };
      synthEngine.applyPatch(next);
      localStorage.setItem('synthlm_current_patch', JSON.stringify(next));
      isDirtyRef.current = true;
      return next;
    });
  }, []);

  // Clear specific knob highlight when user interacts with it
  const handleClearHighlight = useCallback((key: string) => {
    setHighlightedParams((prev) => {
      if (!prev.has(key as keyof SynthPatch)) return prev;
      const next = new Set(prev);
      next.delete(key as keyof SynthPatch);
      return next;
    });
  }, []);

  // Initialize MIDI on mount
  useEffect(() => {
    midiManager.init(
      (note, isOn) => {
        setIsAudioLive(true);
        setActiveNotes((prev) => {
          const next = new Set(prev);
          if (isOn) next.add(note);
          else next.delete(note);
          return next;
        });
      },
      (device) => {
        setMidiDeviceName(device);
      }
    );
  }, []);

  // Beforeunload warning prompt if changes were made
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes to your synthesizer patch. Save a snapshot before leaving?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Preset Selection
  const handleSelectPreset = useCallback((preset: SynthPatch) => {
    updatePatch({ ...preset });
    setHighlightedParams(new Set());
    setActiveAiSlot(null);
    setActiveManualSlot(null);
  }, [updatePatch]);

  // Save Preset Snapshot
  const handleSaveSnapshot = useCallback((name: string) => {
    const snapshot: SynthPatch = { ...currentPatch, name };
    setSavedSnapshots((prev) => {
      const filtered = prev.filter((p) => p.name !== name);
      const updated = [snapshot, ...filtered];
      localStorage.setItem('synthlm_saved_snapshots', JSON.stringify(updated));
      return updated;
    });
    isDirtyRef.current = false;
  }, [currentPatch]);

  // Manual A / B Slot Controls
  const handleManualSaveSlot = useCallback((slot: 'A' | 'B') => {
    if (slot === 'A') {
      setSlotAPatch({ ...currentPatch, name: `${currentPatch.name} (Slot A)` });
      setActiveManualSlot('A');
    } else {
      setSlotBPatch({ ...currentPatch, name: `${currentPatch.name} (Slot B)` });
      setActiveManualSlot('B');
    }
  }, [currentPatch]);

  const handleManualSlotToggle = useCallback((slot: 'A' | 'B') => {
    if (slot === 'A') {
      updatePatch({ ...slotAPatch });
      setActiveManualSlot('A');
    } else {
      updatePatch({ ...slotBPatch });
      setActiveManualSlot('B');
    }
    setActiveAiSlot(null);
  }, [slotAPatch, slotBPatch, updatePatch]);

  // AI Alpha / Beta Toggle
  const handleAiSlotToggle = useCallback(() => {
    if (!alphaPatch || !betaPatch) return;

    if (activeAiSlot === 'beta') {
      // Switch back to Alpha (pre-AI)
      updatePatch({ ...alphaPatch });
      setActiveAiSlot('alpha');
    } else {
      // Switch forward to Beta (post-AI)
      updatePatch({ ...betaPatch });
      setActiveAiSlot('beta');
    }
  }, [alphaPatch, betaPatch, activeAiSlot, updatePatch]);

  // Demo Loop Toggle
  const handleToggleLoop = useCallback(async () => {
    if (isLoopPlaying) {
      demoMelodyManager.stop();
      setIsLoopPlaying(false);
      setIsAudioLive(false);
      setActiveNotes(new Set());
    } else {
      setIsLoopPlaying(true);
      setIsAudioLive(true);
      await demoMelodyManager.start(loopBpm, (note) => {
        setActiveNotes(new Set([note]));
      });
    }
  }, [isLoopPlaying, loopBpm]);

  const handleBpmChange = useCallback((bpm: number) => {
    setLoopBpm(bpm);
    demoMelodyManager.setBpm(bpm);
  }, []);

  // Reset to Init Sine
  const handleReset = useCallback(() => {
    synthEngine.releaseAll();
    updatePatch({ ...INIT_SINE });
    setHighlightedParams(new Set());
    setAlphaPatch(null);
    setBetaPatch(null);
    setActiveAiSlot(null);
    setActiveManualSlot(null);
    isDirtyRef.current = false;
  }, [updatePatch]);

  // AI Sound Designer Request
  const handleSendMessage = useCallback(async (prompt: string) => {
    setIsLoadingAI(true);
    setAiError(null);

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: Date.now(),
    };

    setChatMessages((prev) => {
      const updated = [...prev, userMsg];
      localStorage.setItem('synthlm_chat_history', JSON.stringify(updated));
      return updated;
    });

    try {
      // 1. Snapshot current patch into Alpha
      const preAiSnapshot = { ...currentPatch };
      setAlphaPatch(preAiSnapshot);

      // 2. Request AI sound design
      const aiResponse = await requestAISoundDesign(prompt, currentPatch, apiKey, selectedModel);

      // 3. Load new patch into Beta and active current
      setBetaPatch(aiResponse.updatedPatch);
      setActiveAiSlot('beta');
      updatePatch(aiResponse.updatedPatch);

      // 4. Highlight changed knobs
      const changedKeys = new Set(aiResponse.changes.map((c) => c.paramKey));
      setHighlightedParams(changedKeys);

      // 5. Append AI message to chat history
      const assistantMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: aiResponse.summary,
        timestamp: Date.now(),
        aiResponse: aiResponse,
      };

      setChatMessages((prev) => {
        const updated = [...prev, assistantMsg];
        localStorage.setItem('synthlm_chat_history', JSON.stringify(updated));
        return updated;
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setAiError(errMsg);
      console.error('AI Sound Design Error:', err);
    } finally {
      setIsLoadingAI(false);
    }
  }, [currentPatch, apiKey, selectedModel, updatePatch]);

  const handleSaveApiKey = useCallback((newKey: string) => {
    setApiKey(newKey);
    localStorage.setItem('synthlm_gemini_key', newKey);
  }, []);

  const handleSaveMelody = useCallback((newMelody: string) => {
    demoMelodyManager.setMelodyString(newMelody);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0e0707] text-[#fde047] overflow-hidden select-none">
      {/* Top Utility & Preset Bar */}
      <TopBar
        currentPatch={currentPatch}
        savedSnapshots={savedSnapshots}
        activeManualSlot={activeManualSlot}
        activeAiSlot={activeAiSlot}
        hasAlphaBeta={alphaPatch !== null && betaPatch !== null}
        isLoopPlaying={isLoopPlaying}
        loopBpm={loopBpm}
        midiDeviceName={midiDeviceName}
        apiKeySet={apiKey.trim().length > 0}
        onSelectPreset={handleSelectPreset}
        onSaveSnapshot={handleSaveSnapshot}
        onManualSlotToggle={handleManualSlotToggle}
        onManualSaveSlot={handleManualSaveSlot}
        onAiSlotToggle={handleAiSlotToggle}
        onToggleLoop={handleToggleLoop}
        onBpmChange={handleBpmChange}
        onReset={handleReset}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onOpenMelodyModal={() => setIsMelodyModalOpen(true)}
      />

      {/* Main Studio Viewport (Split Workstation) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Side: Modular Synthesizer Workstation (70%) */}
        <main className="flex-1 flex flex-col h-full overflow-hidden p-2 bg-[#0c0505]">
          {/* Modular Synth Bay */}
          <SynthRack
            patch={currentPatch}
            highlightedParams={highlightedParams}
            isPlaying={isAudioLive || isLoopPlaying}
            onParamChange={handleParamChange}
            onWaveformChange={handleWaveformChange}
            onFilterTypeChange={handleFilterTypeChange}
            onClearHighlight={handleClearHighlight}
          />

          {/* Bottom Virtual Piano Keyboard */}
          <div className="mt-2">
            <PianoKeyboard
              activeNotes={activeNotes}
              onNoteTrigger={(_note, isOn) => {
                setIsAudioLive(isOn);
              }}
            />
          </div>
        </main>

        {/* Right Side: AI Sound Designer Copilot Sidebar (30%) */}
        <AISidebar
          chatMessages={chatMessages}
          currentPatch={currentPatch}
          selectedModel={selectedModel}
          isLoading={isLoadingAI}
          error={aiError}
          onModelChange={setSelectedModel}
          onSendMessage={handleSendMessage}
          onSelectPromptChip={(prompt) => handleSendMessage(prompt)}
          onKnobFlash={(key) => handleClearHighlight(key)}
        />
      </div>

      {/* Modals */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        currentKey={apiKey}
        onSave={handleSaveApiKey}
        onClose={() => setIsApiKeyModalOpen(false)}
      />

      <MelodyModal
        isOpen={isMelodyModalOpen}
        currentMelody={demoMelodyManager.getMelodyString()}
        onSave={handleSaveMelody}
        onClose={() => setIsMelodyModalOpen(false)}
      />
    </div>
  );
}

export default App;
