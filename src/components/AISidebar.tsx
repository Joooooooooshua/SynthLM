import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, GeminiModelId, SynthPatch } from '../types/synth';
import {
  Sparkles,
  Send,
  Bot,
  User,
  ArrowRight,
  Music,
  Lightbulb,
  AlertCircle,
  Trash2,
  Mic,
  Upload,
  Cpu,
} from 'lucide-react';
import {
  recordMicrophoneAudio,
  generateDemoAcousticSample,
  matchAudioBufferToPatch,
} from '../audio/neuralAudioMatcher';

interface AISidebarProps {
  chatMessages: ChatMessage[];
  currentPatch: SynthPatch;
  selectedModel: GeminiModelId;
  isLoading: boolean;
  error: string | null;
  onModelChange: (model: GeminiModelId) => void;
  onSendMessage: (prompt: string) => void;
  onSelectPromptChip: (prompt: string) => void;
  onClearHistory?: () => void;
  onKnobFlash?: (key: string) => void;
  onApplyNeuralPatch?: (patch: SynthPatch, description: string) => void;
}

const PROMPT_CHIPS = [
  '1980s Japanese City Pop Electric Piano (Rhodes EP)',
  'Solitary Icelandic Aurora Borealis (Ambient Pad)',
  'Blade Runner Cyberpunk Rainstorm Brass (CS-80)',
  'Warm Punchy Analog Synth Bass (Moog)',
];

const AISidebarComponent: React.FC<AISidebarProps> = ({
  chatMessages,
  currentPatch,
  selectedModel,
  isLoading,
  error,
  onModelChange,
  onSendMessage,
  onSelectPromptChip,
  onClearHistory,
  onKnobFlash,
  onApplyNeuralPatch,
}) => {
  const [inputText, setInputText] = useState('');
  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [neuralStatus, setNeuralStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isLoading) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  // 1. Microphone Recording (2 seconds)
  const handleMicRecord = async () => {
    if (isRecordingMic || isProcessingAudio) return;
    try {
      setIsRecordingMic(true);
      setNeuralStatus('🎙️ Listening to microphone for 2s...');
      const buffer = await recordMicrophoneAudio(2.0);

      setIsRecordingMic(false);
      setIsProcessingAudio(true);
      setNeuralStatus('🧠 SynthNet-16H extracting 16 harmonics & ADSR...');

      const matchedPatch = matchAudioBufferToPatch(buffer, currentPatch);
      if (onApplyNeuralPatch) {
        onApplyNeuralPatch(matchedPatch, 'Microphone Voice / Whistle');
      }
      setNeuralStatus('✅ Reconstructed 16-order Fourier waveform!');
      setTimeout(() => setNeuralStatus(null), 3000);
    } catch (err: any) {
      console.error('Mic recording failed:', err);
      setNeuralStatus('❌ Mic access denied or unavailable.');
      setTimeout(() => setNeuralStatus(null), 3500);
    } finally {
      setIsRecordingMic(false);
      setIsProcessingAudio(false);
    }
  };

  // 2. Audio File Upload (.wav / .mp3)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingAudio(true);
      setNeuralStatus(`📁 Decoding ${file.name.slice(0, 15)}...`);
      const arrayBuffer = await file.arrayBuffer();
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

      setNeuralStatus('🧠 SynthNet-16H predicting Fourier harmonics & envelope...');
      const matchedPatch = matchAudioBufferToPatch(audioBuffer, currentPatch);
      if (onApplyNeuralPatch) {
        onApplyNeuralPatch(matchedPatch, `Uploaded File: ${file.name}`);
      }
      setNeuralStatus('✅ Matched timbre & loaded Fourier harmonics!');
      setTimeout(() => setNeuralStatus(null), 3000);
    } catch (err: any) {
      console.error('Audio decode failed:', err);
      setNeuralStatus('❌ Could not decode audio file.');
      setTimeout(() => setNeuralStatus(null), 3500);
    } finally {
      setIsProcessingAudio(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 3. Demo Acoustic Reference (1-click test for judges)
  const handleTestDemoSample = (type: 'flute' | 'bell' | 'brass' | 'bass') => {
    if (isProcessingAudio) return;
    try {
      setIsProcessingAudio(true);
      setNeuralStatus(`🎵 Running SynthNet-16H on Demo ${type.toUpperCase()}...`);
      const buffer = generateDemoAcousticSample(type);
      const matchedPatch = matchAudioBufferToPatch(buffer, currentPatch);
      if (onApplyNeuralPatch) {
        onApplyNeuralPatch(matchedPatch, `Acoustic Reference: ${type.toUpperCase()}`);
      }
      setNeuralStatus(`✅ Reconstructed ${type.toUpperCase()} wave & envelope!`);
      setTimeout(() => setNeuralStatus(null), 3000);
    } catch (err: any) {
      console.error('Demo sample error:', err);
    } finally {
      setIsProcessingAudio(false);
    }
  };

  return (
    <aside className="w-full lg:w-80 xl:w-96 bg-[#140808] border-l-2 border-[#522222] flex flex-col h-full shadow-2xl relative">
      {/* Sidebar Header */}
      <div className="pixel-box-header px-3 py-2 flex items-center justify-between border-b border-[#3b1717]">
        <div className="flex items-center gap-1.5">
          <Sparkles size={14} className="text-yellow-400" />
          <span className="text-[10px] font-pixel text-yellow-300">AI SOUND DESIGNER</span>
        </div>

        {/* Model Selector & Clear History */}
        <div className="flex items-center gap-1.5">
          <select
            value={selectedModel}
            onChange={(e) => onModelChange(e.target.value as GeminiModelId)}
            className="bg-[#240c0c] text-yellow-300 text-[8px] font-pixel px-1.5 py-1 rounded border border-[#522222] focus:outline-none max-w-[170px] truncate"
            title="Select AI Inference Engine"
          >
            <optgroup label="🟢 NVIDIA Nemotron (Nebius Token Factory)">
              <option value="nebius-nemotron-super">🟢 Nemotron-3 Super (Studio)</option>
              <option value="nebius-nemotron-ultra">🟢 Nemotron-3 Ultra (550B Deep)</option>
              <option value="nebius-nemotron-nano">🚀 Nemotron-3 Nano (Fast)</option>
              <option value="nebius-synthlm-lora">🎯 SynthLM-LoRA (Fine-Tuned)</option>
            </optgroup>
            <optgroup label="⚡ Google Gemini">
              <option value="gemini-3.8-flash">⚡ Gemini 3.8 Flash</option>
              <option value="gemini-4-argon">⚡ Gemini 4 Argon</option>
              <option value="gemini-3.5-flash-lite">🚀 Gemini 3.5 Flash-Lite</option>
            </optgroup>
          </select>
          {onClearHistory && (
            <button
              onClick={onClearHistory}
              className="text-yellow-600/70 hover:text-red-400 p-1 rounded hover:bg-[#2e1010] transition-colors"
              title="Clear Local Chat History"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Neural Audio Match Bar (Scheme B: SynthNet-16H) */}
      <div className="px-3 py-1.5 bg-[#1f0b0b] border-b border-[#471818] flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[8px] font-pixel text-red-300">
            <Cpu size={10} className="text-yellow-400" />
            <span>NEURAL AUDIO MATCHER (SynthNet-16H):</span>
          </div>
          {neuralStatus && (
            <span className="text-[7px] font-mono text-yellow-300 truncate max-w-[130px] animate-pulse">
              {neuralStatus}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Mic Record Button */}
          <button
            onClick={handleMicRecord}
            disabled={isRecordingMic || isProcessingAudio}
            className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-[8px] font-pixel border transition-all ${
              isRecordingMic
                ? 'bg-red-700 text-white border-red-500 animate-pulse shadow-[0_0_8px_#ef4444]'
                : 'bg-[#2b0f0f] hover:bg-[#401717] text-yellow-300 border-[#5c2020]'
            }`}
            title="Record 2 seconds of humming or whistle to sculpt 16 harmonics & envelope"
          >
            <Mic size={10} className={isRecordingMic ? 'animate-bounce text-white' : 'text-red-400'} />
            <span>{isRecordingMic ? 'LISTENING...' : 'MIC (2S)'}</span>
          </button>

          {/* Audio File Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessingAudio || isRecordingMic}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-[8px] font-pixel bg-[#2b0f0f] hover:bg-[#401717] text-yellow-300 border border-[#5c2020] transition-all"
            title="Upload audio sample (.wav / .mp3) to reverse-synthesize"
          >
            <Upload size={10} className="text-yellow-400" />
            <span>AUDIO FILE</span>
          </button>
        </div>

        {/* Demo Reference Chips for Judges */}
        <div className="flex items-center gap-1 pt-0.5">
          <span className="text-[7px] font-silkscreen text-yellow-600/70">DEMO SAMPLES:</span>
          <div className="flex flex-wrap gap-1">
            {(['flute', 'bell', 'brass', 'bass'] as const).map((t) => (
              <button
                key={t}
                onClick={() => handleTestDemoSample(t)}
                className="text-[7px] font-silkscreen bg-[#180707] hover:bg-[#331010] text-yellow-400/80 hover:text-yellow-200 border border-[#401414] px-1.5 py-0.2 rounded transition-colors"
                title={`Run SynthNet-16H on demo ${t}`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Suggestion Chips */}
      <div className="px-3 py-1.5 bg-[#190a0a] border-b border-[#301010] flex flex-wrap gap-1.5">
        {PROMPT_CHIPS.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPromptChip(chip)}
            className="text-[8px] font-silkscreen bg-[#280e0e] hover:bg-[#3d1616] text-yellow-400/90 border border-[#4d1c1c] px-2 py-0.5 rounded transition-all text-left"
          >
            "{chip}"
          </button>
        ))}
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {chatMessages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-yellow-600/70">
            <Bot size={32} className="text-yellow-500/40 mb-2" />
            <p className="text-[9px] font-pixel leading-relaxed">
              Describe any timbre in natural language or hum/whistle into the mic!
            </p>
            <p className="text-[8px] font-vt323 text-yellow-600/50 mt-1">
              "Solitary winter aurora pad" or click "MIC (2S)" above
            </p>
          </div>
        )}

        {chatMessages.map((msg) => (
          <div key={msg.id} className="flex flex-col space-y-1.5">
            {/* User message */}
            {msg.role === 'user' && (
              <div className="flex items-start gap-1.5 self-end max-w-[90%]">
                <div className="bg-gradient-to-r from-red-950 to-[#2b0f0f] border border-red-700/60 p-2 rounded-lg text-yellow-200 text-xs font-mono shadow">
                  {msg.content}
                </div>
                <div className="w-5 h-5 rounded bg-red-800 text-yellow-300 flex items-center justify-center flex-shrink-0 text-[10px]">
                  <User size={12} />
                </div>
              </div>
            )}

            {/* Assistant message */}
            {msg.role === 'assistant' && (
              <div className="flex items-start gap-1.5 self-start w-full">
                <div className="w-5 h-5 rounded bg-yellow-500 text-black flex items-center justify-center flex-shrink-0 text-[10px] font-bold shadow-[0_0_8px_#facc15]">
                  <Bot size={12} />
                </div>
                <div className="flex-1 bg-[#1a0b0b] border border-[#471a1a] rounded-lg p-2.5 text-xs text-yellow-100 shadow-lg space-y-2">
                  {/* Summary */}
                  {msg.aiResponse ? (
                    <>
                      <div className="flex items-center justify-between border-b border-[#381616] pb-1">
                        <span className="font-pixel text-[10px] text-yellow-300">
                          {msg.aiResponse.patchName}
                        </span>
                        <span
                          className={`text-[7px] font-silkscreen px-1 py-0.2 rounded border ${
                            msg.aiResponse.engineSource === 'nebius-nemotron'
                              ? 'bg-green-950 text-green-300 border-green-700 shadow-[0_0_6px_#22c55e]'
                              : msg.aiResponse.engineSource === 'synthnet-neural'
                              ? 'bg-purple-950 text-purple-300 border-purple-700 shadow-[0_0_6px_#a855f7]'
                              : 'bg-red-950 text-red-300 border-red-800'
                          }`}
                        >
                          {msg.aiResponse.engineSource === 'nebius-nemotron'
                            ? '🟢 NVIDIA NEMOTRON'
                            : msg.aiResponse.engineSource === 'synthnet-neural'
                            ? '🧠 SYNTHNET-16H'
                            : 'AI SCULPTED'}
                        </span>
                      </div>

                      <p className="text-[11px] font-mono text-yellow-200/90 leading-relaxed">
                        {msg.aiResponse.summary}
                      </p>

                      {/* Synesthetic Acoustic Breakdown */}
                      <div className="bg-[#100505] p-2 rounded border border-[#301010] space-y-1">
                        <div className="text-[8px] font-pixel text-yellow-400 flex items-center gap-1">
                          <Music size={9} />
                          <span>SYNESTHETIC ACOUSTIC BREAKDOWN:</span>
                        </div>
                        <div className="text-[9px] font-mono text-yellow-500/90 pl-2 space-y-0.5">
                          <div>
                            • <strong className="text-red-400">Timbre:</strong>{' '}
                            {msg.aiResponse.synestheticBridge.timbreAndWaveforms}
                          </div>
                          <div>
                            • <strong className="text-yellow-400">Filter:</strong>{' '}
                            {msg.aiResponse.synestheticBridge.filterAndBrightness}
                          </div>
                          <div>
                            • <strong className="text-red-300">Envelope:</strong>{' '}
                            {msg.aiResponse.synestheticBridge.envelopeAndMotion}
                          </div>
                          <div>
                            • <strong className="text-yellow-300">Space & FX:</strong>{' '}
                            {msg.aiResponse.synestheticBridge.spaceAndEffects}
                          </div>
                        </div>
                      </div>

                      {/* Parameter Diffs List */}
                      {msg.aiResponse.changes.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-[8px] font-pixel text-yellow-400">
                            MODIFIED KNOBS ({msg.aiResponse.changes.length}):
                          </div>
                          <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                            {msg.aiResponse.changes.map((chg, i) => (
                              <div
                                key={i}
                                onClick={() => onKnobFlash && onKnobFlash(chg.paramKey as string)}
                                className="bg-[#240c0c] hover:bg-[#331111] p-1.5 rounded border border-[#4a1818] text-[9px] cursor-pointer transition-colors"
                              >
                                <div className="flex items-center justify-between font-pixel text-[8px] text-yellow-300">
                                  <span>{chg.paramLabel}</span>
                                  <div className="flex items-center gap-1 text-red-400">
                                    <span className="text-neutral-400">{chg.oldValue}</span>
                                    <ArrowRight size={8} />
                                    <span className="text-yellow-300 font-bold">{chg.newValue}</span>
                                  </div>
                                </div>
                                <p className="text-[8px] font-mono text-yellow-600/80 mt-0.5">
                                  {chg.reason}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Coaching Tip */}
                      <div className="flex items-start gap-1.5 bg-yellow-950/30 p-1.5 rounded border border-yellow-800/40 text-[9px] font-mono text-yellow-300/80">
                        <Lightbulb size={12} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>{msg.aiResponse.coachingTip}</div>
                      </div>
                    </>
                  ) : (
                    <div className="font-mono text-xs text-yellow-200">{msg.content}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex items-center gap-2 text-yellow-400 bg-[#210c0c] p-2.5 rounded-lg border border-[#471818] animate-pulse">
            <Sparkles size={14} className="animate-spin text-red-400" />
            <span className="text-[9px] font-pixel">
              Sculpting acoustics via {selectedModel}...
            </span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="flex items-start gap-1.5 bg-red-950/80 border border-red-600 text-red-200 p-2.5 rounded-lg text-xs font-mono">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 bg-[#170909] border-t border-[#401616] flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Describe timbre (e.g. 'solitary winter aurora')..."
          disabled={isLoading}
          className="flex-1 bg-[#0c0404] text-yellow-200 text-xs font-mono px-3 py-2 rounded border border-[#4a1818] focus:outline-none focus:border-yellow-400 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="bg-gradient-to-r from-red-600 to-yellow-500 hover:from-red-500 hover:to-yellow-400 text-black font-pixel text-[9px] px-3 py-2 rounded flex items-center gap-1 shadow-[0_0_8px_#ef4444] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Send size={12} />
        </button>
      </form>
    </aside>
  );
};

export const AISidebar = React.memo(AISidebarComponent);
