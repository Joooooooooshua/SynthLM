import React, { useState, useEffect, useCallback, useRef } from 'react';
import { synthEngine } from '../audio/synthEngine';

interface PianoKeyboardProps {
  activeNotes: Set<string>;
  onNoteTrigger?: (note: string, isOn: boolean) => void;
}

// 2 octaves base notes
const WHITE_KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const BLACK_KEY_OFFSETS: Record<number, string> = {
  0: 'C#',
  1: 'D#',
  3: 'F#',
  4: 'G#',
  5: 'A#',
};

// Computer typing keyboard keymap for base octave (e.g. Octave 3 & 4)
const TYPING_KEY_MAP: Record<string, { noteName: string; octaveOffset: number }> = {
  // Octave 0
  a: { noteName: 'C', octaveOffset: 0 },
  w: { noteName: 'C#', octaveOffset: 0 },
  s: { noteName: 'D', octaveOffset: 0 },
  e: { noteName: 'D#', octaveOffset: 0 },
  d: { noteName: 'E', octaveOffset: 0 },
  f: { noteName: 'F', octaveOffset: 0 },
  t: { noteName: 'F#', octaveOffset: 0 },
  g: { noteName: 'G', octaveOffset: 0 },
  y: { noteName: 'G#', octaveOffset: 0 },
  h: { noteName: 'A', octaveOffset: 0 },
  u: { noteName: 'A#', octaveOffset: 0 },
  j: { noteName: 'B', octaveOffset: 0 },
  // Octave +1
  k: { noteName: 'C', octaveOffset: 1 },
  o: { noteName: 'C#', octaveOffset: 1 },
  l: { noteName: 'D', octaveOffset: 1 },
  p: { noteName: 'D#', octaveOffset: 1 },
  ';': { noteName: 'E', octaveOffset: 1 },
  "'": { noteName: 'F', octaveOffset: 1 },
};

export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({ activeNotes, onNoteTrigger }) => {
  const [octaveShift, setOctaveShift] = useState(3); // base octave C3
  const isMouseDown = useRef(false);
  const pressedKeysRef = useRef(new Set<string>());

  const handleNoteOn = useCallback((note: string) => {
    synthEngine.noteOn(note);
    if (onNoteTrigger) onNoteTrigger(note, true);
  }, [onNoteTrigger]);

  const handleNoteOff = useCallback((note: string) => {
    synthEngine.noteOff(note);
    if (onNoteTrigger) onNoteTrigger(note, false);
  }, [onNoteTrigger]);

  // Global mouseup to release dragged keys
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isMouseDown.current = false;
      pressedKeysRef.current.forEach((n) => handleNoteOff(n));
      pressedKeysRef.current.clear();
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [handleNoteOff]);

  // Computer typing keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.repeat) return;

      const mapping = TYPING_KEY_MAP[e.key.toLowerCase()];
      if (mapping) {
        e.preventDefault();
        const fullNote = `${mapping.noteName}${octaveShift + mapping.octaveOffset}`;
        if (!pressedKeysRef.current.has(fullNote)) {
          pressedKeysRef.current.add(fullNote);
          handleNoteOn(fullNote);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      const mapping = TYPING_KEY_MAP[e.key.toLowerCase()];
      if (mapping) {
        const fullNote = `${mapping.noteName}${octaveShift + mapping.octaveOffset}`;
        pressedKeysRef.current.delete(fullNote);
        handleNoteOff(fullNote);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [octaveShift, handleNoteOn, handleNoteOff]);

  // Generate 2 Octaves of keys
  const renderedKeys = [];
  for (let oct = 0; oct < 2; oct++) {
    const currentOct = octaveShift + oct;
    for (let i = 0; i < WHITE_KEYS.length; i++) {
      const whiteNote = `${WHITE_KEYS[i]}${currentOct}`;
      const hasBlack = BLACK_KEY_OFFSETS[i] !== undefined;
      const blackNote = hasBlack ? `${BLACK_KEY_OFFSETS[i]}${currentOct}` : null;

      renderedKeys.push({
        whiteNote,
        blackNote,
        keyIndex: i,
        octave: currentOct,
      });
    }
  }

  // Include final top C
  const finalC = `C${octaveShift + 2}`;

  return (
    <div className="w-full bg-[#120707] border-t-2 border-[#522222] px-3 py-2 flex items-center justify-between select-none">
      {/* Octave Shift Controls */}
      <div className="flex items-center gap-1.5 font-pixel text-[9px]">
        <span className="text-yellow-600 mr-1 hidden sm:inline">OCTAVE:</span>
        <button
          onClick={() => {
            synthEngine.releaseAll();
            setOctaveShift((prev) => Math.max(1, prev - 1));
          }}
          className="bg-[#240e0e] hover:bg-[#381616] text-yellow-400 border border-[#4d1d1d] px-2 py-1 rounded"
        >
          -
        </button>
        <span className="text-yellow-300 font-bold px-1.5">C{octaveShift}</span>
        <button
          onClick={() => {
            synthEngine.releaseAll();
            setOctaveShift((prev) => Math.min(6, prev + 1));
          }}
          className="bg-[#240e0e] hover:bg-[#381616] text-yellow-400 border border-[#4d1d1d] px-2 py-1 rounded"
        >
          +
        </button>
      </div>

      {/* Piano Keys Container */}
      <div className="flex items-start justify-center h-24 overflow-x-auto px-2 relative">
        {renderedKeys.map(({ whiteNote, blackNote }) => {
          const isWhiteActive = activeNotes.has(whiteNote) || pressedKeysRef.current.has(whiteNote);
          const isBlackActive = blackNote ? (activeNotes.has(blackNote) || pressedKeysRef.current.has(blackNote)) : false;

          return (
            <div key={whiteNote} className="relative flex">
              {/* White Key */}
              <div
                className={`w-7 sm:w-8 h-22 rounded-b border border-[#471818] cursor-pointer transition-colors flex flex-col justify-end items-center pb-1 shadow-md ${
                  isWhiteActive
                    ? 'bg-gradient-to-t from-red-600 to-yellow-400 border-yellow-300 shadow-[0_0_12px_#ef4444]'
                    : 'bg-gradient-to-b from-[#e5d5be] to-[#b89f81] hover:bg-[#fff0db] active:bg-yellow-300'
                }`}
                onMouseDown={() => {
                  isMouseDown.current = true;
                  handleNoteOn(whiteNote);
                }}
                onMouseEnter={() => {
                  if (isMouseDown.current) handleNoteOn(whiteNote);
                }}
                onMouseLeave={() => {
                  if (isMouseDown.current) handleNoteOff(whiteNote);
                }}
                onMouseUp={() => {
                  handleNoteOff(whiteNote);
                }}
              >
                <span className={`text-[7px] font-pixel ${isWhiteActive ? 'text-black font-bold' : 'text-neutral-800'}`}>
                  {whiteNote}
                </span>
              </div>

              {/* Black Key */}
              {blackNote && (
                <div
                  className={`absolute top-0 -right-3 sm:-right-3.5 z-10 w-5 sm:w-6 h-14 rounded-b border border-[#2b0f0f] cursor-pointer transition-all flex flex-col justify-end items-center pb-1 shadow-lg ${
                    isBlackActive
                      ? 'bg-gradient-to-t from-red-600 to-yellow-400 border-yellow-300 shadow-[0_0_10px_#ef4444]'
                      : 'bg-gradient-to-b from-[#240e0e] to-[#0a0404] hover:bg-[#381616]'
                  }`}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    isMouseDown.current = true;
                    handleNoteOn(blackNote);
                  }}
                  onMouseEnter={() => {
                    if (isMouseDown.current) handleNoteOn(blackNote);
                  }}
                  onMouseLeave={() => {
                    if (isMouseDown.current) handleNoteOff(blackNote);
                  }}
                  onMouseUp={(e) => {
                    e.stopPropagation();
                    handleNoteOff(blackNote);
                  }}
                >
                  <span className={`text-[6px] font-pixel ${isBlackActive ? 'text-black font-bold' : 'text-yellow-600/70'}`}>
                    {blackNote}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* Final Top C Key */}
        <div
          className={`w-7 sm:w-8 h-22 rounded-b border border-[#471818] cursor-pointer transition-colors flex flex-col justify-end items-center pb-1 shadow-md ${
            activeNotes.has(finalC) || pressedKeysRef.current.has(finalC)
              ? 'bg-gradient-to-t from-red-600 to-yellow-400 border-yellow-300 shadow-[0_0_12px_#ef4444]'
              : 'bg-gradient-to-b from-[#e5d5be] to-[#b89f81] hover:bg-[#fff0db] active:bg-yellow-300'
          }`}
          onMouseDown={() => {
            isMouseDown.current = true;
            handleNoteOn(finalC);
          }}
          onMouseEnter={() => {
            if (isMouseDown.current) handleNoteOn(finalC);
          }}
          onMouseLeave={() => {
            if (isMouseDown.current) handleNoteOff(finalC);
          }}
          onMouseUp={() => {
            handleNoteOff(finalC);
          }}
        >
          <span className="text-[7px] font-pixel text-neutral-800">
            {finalC}
          </span>
        </div>
      </div>

      {/* Typing Keyboard Hint */}
      <div className="hidden lg:flex flex-col items-end text-[8px] font-pixel text-yellow-600/80">
        <div>KEYS: [A-L, W-P]</div>
        <div className="text-[7px] text-yellow-700/60 mt-0.5">CLICK / DRAG GLISSANDO</div>
      </div>
    </div>
  );
};
