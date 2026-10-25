import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, GeminiModelId, SynthPatch } from '../types/synth';
import { Sparkles, Send, Bot, User, ArrowRight, Music, Lightbulb, AlertCircle, Trash2 } from 'lucide-react';

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
}

const PROMPT_CHIPS = [
  '1980s Japanese City Pop Electric Piano (Rhodes EP)',
  'Solitary Icelandic Aurora Borealis (Ambient Pad)',
  'Blade Runner Cyberpunk Rainstorm Brass (CS-80)',
  'Warm Punchy Analog Synth Bass (Moog)',
];

const AISidebarComponent: React.FC<AISidebarProps> = ({
  chatMessages,
  selectedModel,
  isLoading,
  error,
  onModelChange,
  onSendMessage,
  onSelectPromptChip,
  onClearHistory,
  onKnobFlash,
}) => {
  const [inputText, setInputText] = useState('');
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
            className="bg-[#240c0c] text-yellow-300 text-[8px] font-pixel px-1.5 py-1 rounded border border-[#522222] focus:outline-none"
          >
            <option value="gemini-4-argon">⚡ 4 Argon (Deep Synesthetic)</option>
            <option value="gemini-3.8-flash">⚡ 3.8 Flash (Fast Studio)</option>
            <option value="gemini-3.5-flash-lite">🚀 3.5 Flash-Lite (Speed)</option>
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

      {/* Quick Suggestion Chips */}
      <div className="px-3 py-2 bg-[#190a0a] border-b border-[#301010] flex flex-wrap gap-1.5">
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
              Describe any timbre in natural language or poetic metaphor!
            </p>
            <p className="text-[8px] font-vt323 text-yellow-600/50 mt-1">
              "Solitary winter aurora pad" or "Make this bass fatter"
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
                        <span className="text-[7px] font-silkscreen bg-red-950 text-red-300 px-1 py-0.2 rounded border border-red-800">
                          AI SCULPTED
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
                          <div>• <strong className="text-red-400">Timbre:</strong> {msg.aiResponse.synestheticBridge.timbreAndWaveforms}</div>
                          <div>• <strong className="text-yellow-400">Filter:</strong> {msg.aiResponse.synestheticBridge.filterAndBrightness}</div>
                          <div>• <strong className="text-red-300">Envelope:</strong> {msg.aiResponse.synestheticBridge.envelopeAndMotion}</div>
                          <div>• <strong className="text-yellow-300">Space & FX:</strong> {msg.aiResponse.synestheticBridge.spaceAndEffects}</div>
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
                    <div className="font-mono text-xs text-yellow-200">
                      {msg.content}
                    </div>
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
