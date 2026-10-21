import React, { useState } from 'react';
import { Key, X, Check } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  currentKey: string;
  onSave: (key: string) => void;
  onClose: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  currentKey,
  onSave,
  onClose,
}) => {
  const [keyInput, setKeyInput] = useState(currentKey);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(keyInput.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#170a0a] border-2 border-yellow-500/80 rounded-lg max-w-md w-full p-4 shadow-2xl pixel-box">
        <div className="flex items-center justify-between border-b border-[#3b1717] pb-2 mb-3">
          <div className="flex items-center gap-2">
            <Key size={16} className="text-yellow-400" />
            <h3 className="font-pixel text-xs text-yellow-300">GEMINI API KEY CONFIG</h3>
          </div>
          <button onClick={onClose} className="text-yellow-600 hover:text-red-400">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-[11px] font-mono text-yellow-200/80 leading-relaxed">
            SynthLM connects to Google's flagship Gemini models (<code className="text-yellow-400">gemini-4-argon</code> & <code className="text-yellow-400">gemini-3.8-flash</code>) for synesthetic acoustics.
          </p>

          <div>
            <label className="block text-[9px] font-pixel text-yellow-500 mb-1">
              API KEY:
            </label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-[#0c0404] border border-[#4a1818] rounded px-3 py-2 text-xs font-mono text-yellow-200 focus:outline-none focus:border-yellow-400"
            />
          </div>

          <p className="text-[9px] font-mono text-yellow-600/70">
            Tip: You can also set <code className="text-yellow-500">VITE_GEMINI_API_KEY</code> in <code className="text-yellow-500">.env</code>. Keys entered here are stored in your browser's private <code className="text-yellow-500">localStorage</code>.
          </p>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#3b1717]">
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
              SAVE KEY
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
