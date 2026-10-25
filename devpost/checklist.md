---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast

## Slices

- [x] **1. Playable 8-bit synthesizer rack with dual oscillators, filter, ADSR, FX, and live center waveform visualizer**
  Becomes usable: A running synthesizer workstation in the 8-bit Red/Gold/Yellow hardware theme where selecting foundational presets (`Init Sine`, `Init Square`, `Init Triangle`, `Init Saw`), dragging any of the 20 rotary knobs across Dual Oscillators, Filter, Envelope (ADSR), and 4 FX (Distortion, Chorus, Delay, Reverb), and clicking piano keys produces real-time polyphonic audio and drives the central oscilloscope/spectrum visualizer.
  Why now: Bootstraps the Vite + React + TypeScript project, creates the MIT `LICENSE`, and proves the core `Tone.js` audio signal chain and visual workstation layout end to end on the first step.
  PRD ref: `prd.md > Screens and Layout`, `prd.md > Look and Feel`, `prd.md > 1. Real-Time Synthesizer Engine & Modular Controls`
  Spec ref: `spec.md > Stack`, `spec.md > Look and Feel`, `spec.md > 2. Polyphonic Web Audio Synthesizer Engine`, `spec.md > 3. Modular Synth Rack & Rotary Knobs`, `spec.md > 4. Center Real-Time Waveform & Spectrum Visualizer`, `spec.md > File Structure`
  Build: Scaffold the Vite + React + TypeScript + Tailwind CSS project, add `LICENSE` (MIT) and `.env.example`, implement `src/types/synth.ts`, `src/audio/presets.ts` (including `clampPatch` safety bounds), `src/audio/synthEngine.ts`, `src/components/RotaryKnob.tsx`, `src/components/WaveformVisualizer.tsx`, `src/components/SynthRack.tsx`, and initial `TopBar.tsx` and `PianoKeyboard.tsx`, plus automated Vitest unit tests for parameter bounds and presets.
  Verify (mechanical): Run `npm test -- --run` and `npm run build` and confirm both exit with code 0 and zero TypeScript or test errors; start the dev server and verify the main rack and visualizer render cleanly.
  Learner check: Open `http://localhost:5173`, click several keys on the bottom piano keyboard, switch between `Init Sine` and `Init Saw`, drag the Filter Cutoff and Reverb knobs, and confirm you hear the sound change in real time and see the red/gold/yellow waveform moving in the center.
  Commit: `Add core Tone.js dual-oscillator synth rack and center waveform visualizer`

- [x] **2. Deep synesthetic AI Sound Designer sidebar, automatic Alpha/Beta comparison, and persistent knob highlights**
  Becomes usable: Submitting a poetic/synesthetic or technical prompt in the right-hand AI Copilot sidebar (e.g., *"Give me a lonely sound like a winter aurora in Iceland"* or *"Make this bass fatter"*) calls `@google/genai` (`client.interactions.create` with `gemini-4-argon` default, `gemini-3.8-flash`, or `gemini-3.5-flash-lite`), snapshots the prior patch into `Alpha`, loads the new patch into `Beta`, highlights every modified knob in bright golden-yellow until the user touches that knob, and displays the 4-pillar synesthetic breakdown plus `Old → New` parameter explanation cards.
  Why now: Delivers `scope.md > The Unique Kernel` early and verifies the Gemini Interactions API structured JSON schema, parameter diff computation, and persistent highlight clearing logic.
  PRD ref: `prd.md > 3. Sidebar AI Sound Designer, Synesthetic Guidance & Persistent Highlights`, `prd.md > 4. Dual Version Comparison: AI Alpha / Beta & Manual A / B`, `prd.md > States and Boundaries`
  Spec ref: `spec.md > 6. Sidebar AI Sound Designer & Synesthetic Reasoner`, `spec.md > Data Model`, `spec.md > External Services and Dependencies`, `spec.md > Important Failure Modes`
  Build: Implement `src/services/geminiSoundDesigner.ts` using `@google/genai` `client.interactions.create` and strict JSON `response_format` schema, build `src/components/AISidebar.tsx` with model selector (`gemini-4-argon`, `gemini-3.8-flash`, `gemini-3.5-flash-lite`), API key popover, synesthetic breakdown cards, and parameter diff list, wire automatic `Alpha / Beta` state snapshots and persistent `highlightedParams` clearing on knob click/drag, and add unit tests for diff calculation, `Alpha/Beta` state switching, and highlight clearing.
  Verify (mechanical): Run `npm test -- --run` and `npm run build` and confirm all unit tests for `Alpha/Beta` state transitions, parameter diffing, and persistent highlight clearing pass with zero errors.
  Learner check: Type a synesthetic prompt like *"solitary Icelandic winter aurora borealis pad"* in the right sidebar, watch the modified knobs light up in yellow/gold and read the acoustic explanations, toggle `Alpha / Beta` in the top bar to compare before and after, then click one highlighted knob to confirm its highlight clears.
  Commit: `Add Gemini synesthetic AI sound designer sidebar, Alpha/Beta toggle, and persistent knob highlights`

- [x] **3. Multi-input performance (Web MIDI, typing keyboard, custom Demo Loop) and manual A/B + preset snapshots**
  Becomes usable: The synthesizer can be played via external MIDI controllers or DAW virtual MIDI routing (`Web MIDI API`), computer typing keyboard (`A W S E D F...`), or the hands-free **Demo Loop** (with an inline custom melody note editor), and users can manually save/compare `A / B` slots, save named **Preset Snapshots** (with `.json` export and `localStorage` persistence), and get a browser confirmation prompt before refreshing with unsaved changes.
  Why now: Completes the full producer workflow so the synth can sit inside an existing DAW arrangement or play a custom melody loop hands-free while prompting the AI.
  PRD ref: `prd.md > The Core Journey`, `prd.md > 2. Multi-Input MIDI & Custom Demo Loop Triggering`, `prd.md > 4. Dual Version Comparison: AI Alpha / Beta & Manual A / B`
  Spec ref: `spec.md > 1. Top Utility, Preset & Comparison Bar`, `spec.md > 5. Multi-Input MIDI, Typing Keyboard & Virtual Piano`, `spec.md > Data Model`
  Build: Implement `src/audio/midiManager.ts` (Web MIDI API input discovery and note handling), `src/audio/demoMelody.ts` (customizable Demo Loop sequencer and note parser), computer keyboard listener in `src/components/PianoKeyboard.tsx`, manual `A / B` save/toggle slots, `Save Preset / Snapshot` modal/dropdown with `localStorage` persistence and `.json` export in `src/components/TopBar.tsx`, and the `beforeunload` unsaved-changes guard in `src/App.tsx`, plus unit tests for the melody parser and manual `A/B` + snapshot persistence.
  Verify (mechanical): Run `npm test -- --run` and `npm run build` and confirm all tests (including melody parsing, manual `A/B` independence from `Alpha/Beta`, and snapshot serialization) pass and the production bundle builds cleanly.
  Learner check: Toggle on **Demo Loop** (or play via computer keyboard / MIDI), test editing the Demo Loop melody notes, save two manual variations into `A` and `B` and toggle between them, save a named Preset Snapshot, and verify it appears in the preset selector.
  Commit: `Add Web MIDI, typing keyboard, customizable Demo Loop, manual A/B slots, and preset snapshots`

## Hands-on Checkpoints

- [x] Early usable behavior explored — after Slice 2 (core synth rack + Gemini synesthetic AI sidebar and `Alpha/Beta` comparison working together)
- [x] Final kick-the-tires exploration and feedback completed (tested core synth rack, AI synesthetic design, and custom waveform sculpting)

## Final Review

- [x] AI Custom Waveform Sculpting ("AI Wave Sculpting") implemented and verified with unit tests & production build
- [x] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [x] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [x] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [x] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: Connected learner's core learning goal (understanding synthesizer and audio plugin architecture under the hood) to the Web Audio signal chain in synthEngine.ts, the 16-harmonic Fourier series & real-time DFT in waveMath.ts, and schema-constrained synesthetic reasoning in geminiSoundDesigner.ts. Verified with 15 automated Vitest unit tests and live playback.
Route and stops: 3-stop architecture tour documented in devpost/app-map.html (Stop 1: Tone.js Audio Graph in synthEngine.ts; Stop 2: Synesthetic Reasoner & Wave Sculptor in geminiSoundDesigner.ts & waveMath.ts; Stop 3: Central State & Highlight Lifecycle in App.tsx).
Edit outcome: Hand-drawn wave canvas & AI wave sculpting implemented, tested, and verified during final review.
Reflection: Offered
Activity mode: focused alternative (grounded in audio DSP architecture and verified implementation)

## Revisions

- **AI Custom Waveform Sculpting ("AI Wave Sculpting") & Interactive Single-Cycle Canvas:** Added `custom` waveform type with 16 Fourier harmonic partials (`src/audio/waveMath.ts`, `src/components/WaveSculptorCanvas.tsx`). Allows Gemini (`gemini-4-argon` / `gemini-3.8-flash`) to generate bespoke single-cycle waveforms for poetic/synesthetic prompts, and enables users to hand-draw custom waves directly on the oscillator canvas with real-time DFT harmonic synthesis.
