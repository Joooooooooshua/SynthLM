import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ParameterMeta } from '../types/synth';

interface RotaryKnobProps {
  meta: ParameterMeta;
  value: number;
  isHighlighted?: boolean;
  onChange: (key: string, value: number) => void;
  onInteract?: (key: string) => void;
}

const RotaryKnobComponent: React.FC<RotaryKnobProps> = ({
  meta,
  value,
  isHighlighted = false,
  onChange,
  onInteract,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef<number>(0);
  const startValue = useRef<number>(value);

  // Normalize value to 0..1 for angle calculation
  const fraction = Math.max(0, Math.min(1, (value - meta.min) / (meta.max - meta.min)));
  // Sweep angle: -135 deg to +135 deg (270 deg total)
  const angle = -135 + fraction * 270;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartY.current = e.clientY;
    startValue.current = value;

    if (onInteract) {
      onInteract(meta.key as string);
    }
  };

  const handleDoubleClick = () => {
    onChange(meta.key as string, meta.defaultValue);
    if (onInteract) {
      onInteract(meta.key as string);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const stepMultiplier = e.shiftKey ? 0.2 : 1.0;
    const delta = -Math.sign(e.deltaY) * meta.step * stepMultiplier;
    const nextVal = Math.min(meta.max, Math.max(meta.min, Number((value + delta).toFixed(4))));
    onChange(meta.key as string, nextVal);
    if (onInteract) {
      onInteract(meta.key as string);
    }
  };

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const dy = dragStartY.current - e.clientY;
    const range = meta.max - meta.min;
    const sensitivity = e.shiftKey ? 500 : 150; // pixels to travel full range
    const delta = (dy / sensitivity) * range;
    let nextVal = startValue.current + delta;

    // Snap to step
    const steps = Math.round((nextVal - meta.min) / meta.step);
    nextVal = meta.min + steps * meta.step;
    nextVal = Math.min(meta.max, Math.max(meta.min, Number(nextVal.toFixed(4))));

    onChange(meta.key as string, nextVal);
  }, [isDragging, meta, onChange]);

  const onMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, onMouseMove, onMouseUp]);

  // Display value formatting
  const formatDisplayValue = (v: number): string => {
    if (meta.unit === 'Hz') {
      return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${Math.round(v)}`;
    }
    if (meta.unit === 's') {
      return v < 0.1 ? `${Math.round(v * 1000)}ms` : `${v.toFixed(2)}s`;
    }
    if (meta.unit === '%') {
      return `${Math.round(v * 100)}%`;
    }
    if (meta.unit === 'cents') {
      return v > 0 ? `+${v}` : `${v}`;
    }
    if (meta.unit === 'oct') {
      return v > 0 ? `+${v}` : `${v}`;
    }
    return `${v}`;
  };

  return (
    <div 
      className="flex flex-col items-center select-none group relative"
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
    >
      {/* Parameter Label */}
      <span className="text-[9px] font-pixel text-yellow-500/80 tracking-wider mb-1 group-hover:text-yellow-400 transition-colors">
        {meta.label}
      </span>

      {/* Knob Dial Container */}
      <div 
        className={`relative w-12 h-12 rounded-full cursor-ns-resize flex items-center justify-center transition-all ${
          isHighlighted ? 'ai-highlight-ring scale-105' : 'hover:scale-102'
        }`}
        onMouseDown={handleMouseDown}
      >
        {/* Outer Circular SVG track & arc */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
          {/* Background Arc */}
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke="#2a1212"
            strokeWidth="3.5"
            strokeDasharray="84.82 28.27" // 3/4 circle
            strokeDashoffset="-14.13"
          />
          {/* Active Arc */}
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke={isHighlighted ? "#facc15" : "#ef4444"}
            strokeWidth="3.5"
            strokeDasharray={`${fraction * 84.82} 113.09`}
            strokeDashoffset="-14.13"
            strokeLinecap="round"
            className="transition-all duration-75"
          />
        </svg>

        {/* Inner Knob Cap */}
        <div 
          className="absolute w-8 h-8 rounded-full bg-gradient-to-b from-[#2a1313] to-[#120707] border border-[#522222] shadow-inner flex items-center justify-center"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          {/* Indicator Notch */}
          <div className={`w-0.5 h-3.5 rounded-full -translate-y-2 ${isHighlighted ? 'bg-yellow-300 shadow-[0_0_8px_#fde047]' : 'bg-red-400'}`} />
        </div>

        {/* AI Badge if highlighted */}
        {isHighlighted && (
          <span className="absolute -top-1.5 -right-1 text-[7px] font-pixel bg-yellow-400 text-black px-1 rounded shadow animate-bounce">
            AI
          </span>
        )}
      </div>

      {/* Numeric Readout */}
      <span className="text-[10px] font-vt323 text-yellow-300/90 tracking-widest mt-1 bg-[#1a0a0a] px-1.5 py-0.5 rounded border border-[#3b1717]">
        {formatDisplayValue(value)}
      </span>
    </div>
  );
};

export const RotaryKnob = React.memo(RotaryKnobComponent);
