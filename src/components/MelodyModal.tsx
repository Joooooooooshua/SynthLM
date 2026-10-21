import React, { useState } from 'react';
import { Music, X, Check, RotateCcw } from 'lucide-react';
import { DEFAULT_DEMO_MELODY } from '../audio/demoMelody';

interface MelodyModalProps {
  isOpen: boolean;
  currentMelody: string;
  onSave: (melody: string) => void;
  onClose: () => void;
}

export const MelodyModal: React.FC<MelodyModalProps> = ({
  isOpen,
  currentMelody,
  onSave,
  onClose,
}) => {
  const [melodyInput, setMelodyInput] = useState(currentMelody);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (melodyInput.trim()) {
      onSave(melodyInput.trim());
      onClose();
    }
  };

  const handleResetDefault = () => {
    setMelodyInput(DEFAULT_DEMO_MELODY);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#170a0a] border-2 border-yellow-500/80 rounded-lg max-w-lg w-full p-4 shadow-2xl pixel-box">
        <div className="flex items-center justify-between border-b border-[#3b1717] pb-2 mb-3">
          <div className="flex items-center gap-2">
            <Music size={16} className="text-yellow-400" />
            <h3 className="font-pixel text-xs text-yellow-300">CUSTOM DEMO LOOP MELODY</h3>
          </div>
          <button onClick={onClose} className="text-yellow-600 hover:text-red-400">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-[11px] font-mono text-yellow-200/80 leading-relaxed">
            Enter space-separated note names (e.g. <code className="text-yellow-400">C3 E3 G3 B3 C4 B3 G3 E3</code>). The synth will loop through these notes synchronized to BPM!
          </p>

          <div>
            <textarea
              rows={3}
              value={melodyInput}
              onChange={(e) => setMelodyInput(e.target.value)}
              placeholder="C3 E3 G3 B3..."
              className="w-full bg-[#0c0404] border border-[#4a1818] rounded p-2 text-xs font-mono text-yellow-300 focus:outline-none focus:border-yellow-400"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#3b1717]">
            <button
              type="button"
              onClick={handleResetDefault}
              className="flex items-center gap-1 text-[8px] font-pixel text-yellow-600 hover:text-yellow-400"
            >
              <RotateCcw size={10} />
              RESET DEFAULT
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded border border-[#4a1818] text-yellow-600 font-pixel text-[8px] hover:bg-[#210c0c]"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-gradient-to-r from-red-600 to-yellow-500 text-black font-pixel text-[8px] font-bold flex items-center gap-1 shadow hover:scale-102 transition-transform"
              >
                <Check size={12} />
                APPLY MELODY
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
