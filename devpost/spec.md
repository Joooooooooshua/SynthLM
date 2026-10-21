---
doc: spec
status: approved
---

# SynthLM — Technical Spec

## How This Works, In Plain Language

SynthLM is a browser-based synthesizer workstation built around two connected parts: a **Real-Time Audio Signal Chain** (the instrument on the left) and a **Synesthetic AI Sound Designer** (the copilot sidebar on the right).

1. **The Synthesizer Signal Chain (Left Workspace):**
   Just like hardware synths or plugins such as Serum, sound flows through a fixed pipeline of audio nodes powered by `Tone.js`:
   - ** Dual Oscillators (`OSC 1` & `OSC 2`)** generate the raw pitched waveforms (`sine`, `square`, `triangle`, `sawtooth`), with independent octave, detune (pitch spread for thickness), and volume mix.
   - **The Filter (`Filter`)** shapes the harmonic brightness by cutting high, low, or band frequencies at a specific `Cutoff` (Hz) and emphasizing the edge with `Resonance` (Q).
   - **The Envelope (`ADSR`)** controls how each note's volume and brightness evolve from the moment a key is pressed (`Attack` → `Decay` → `Sustain`) to when it is released (`Release`).
   - **The Effects Rack (`Distortion` → `Chorus` → `Delay` → `Reverb`)** adds grit, stereo width, rhythmic echoes, and spatial depth before sending the audio to the speakers and to a real-time **Waveform/Spectrum Analyser** in the center of the screen.

2. **The Patch State Dictionary (How Knobs, Presets, and AI Talk to the Synth):**
   Every knob on the synthesizer reads and writes to a single JavaScript object called the **Patch State** (around 20 numeric and enum parameters).
   - Turning a knob by hand changes that number in the Patch State and immediately updates the live `Tone.js` audio node.
   - Clicking **A / B** swaps between two user-saved manual Patch State snapshots.
   - Clicking **Alpha / Beta** swaps between the snapshot taken right before the last AI prompt (`Alpha`) and the AI's newly sculpted patch (`Beta`).

3. **The Deep Synesthetic AI Sound Designer (Right Sidebar):**
   When you type an abstract, atmospheric description like *"Give me a lonely sound like a winter aurora in Iceland"* or *"I want a sunny-feeling bass"*, SynthLM sends your prompt and the current Patch State to Google's flagship reasoning model (**`gemini-4-argon`** by default, with **`gemini-3.8-flash`** also selectable).
   Instead of guessing random numbers, the AI uses a structured **Two-Stage Synesthetic Reasoning Schema**:
   - **Stage 1 (Acoustic Deconstruction):** It explicitly translates the imagery/emotion into four musical pillars: *Timbre/Harmonics*, *Filter Brightness*, *Envelope Motion (ADSR)*, and *Spatial Dimension (FX)*.
   - **Stage 2 (Parameter Synthesis & Diff Explanation):** It outputs the exact validated knob values (clamped to safe acoustic ranges so it never clips or crashes) plus a one-sentence acoustic explanation for every knob it moved, illuminating those knobs on the rack until you touch them.

## The Core Journey Through the System
PRD ref: `prd.md > The Core Journey`.

1. **Startup & Init Load:** The user opens the app in Chrome. React loads the default `Init Sine` (or last saved `localStorage` session) into the central `PatchState` store and renders the Red/Gold/Yellow 8-bit synth rack.
2. **Audio Unlock & Triggering Notes:** The user presses a key on their computer keyboard, clicks the bottom virtual piano, plays an external MIDI controller / DAW virtual MIDI bus (`navigator.requestMIDIAccess()`), or clicks **Demo Loop**. On first interaction, `Tone.start()` unlocks the browser audio context and triggers polyphonic voices through `OSC 1 + OSC 2 → Filter → ADSR → FX → Analyser → Speakers`.
3. **Submitting a Synesthetic or Technical Prompt:** The user types *"Give me a lonely sound like a winter aurora in Iceland"* in the right sidebar and hits Send.
4. **Automatic `Alpha` Snapshot & Gemini API Call:**
   - The app copies the current `PatchState` into the **`Alpha`** slot.
   - The AI client calls the Gemini Interactions API (`client.interactions.create`) using **`gemini-4-argon`** (or the user's selected model) with a strict JSON `response_format` schema containing the current patch and the user's prompt.
5. **Applying `Beta`, Highlighting Knobs & Showing Explanations:**
   - Gemini returns the structured JSON response containing:
     1. `synestheticBridge`: How the poetic mood maps to timbre, envelope, filter, and space.
     2. `updatedPatch`: The new synthesizer parameter values.
     3. `parameterChanges`: Each modified parameter's `oldValue`, `newValue`, and a 1-sentence acoustic explanation.
     4. `coachingTip`: A friendly follow-up suggestion inviting the user to refine the sound further.
   - The app saves the new patch into **`Beta`**, smoothly updates the live `Tone.js` audio nodes, adds each changed parameter key to `highlightedParams` (rendering a bright gold/yellow ring around those knobs), and renders the explanation cards in the right sidebar.
6. **Comparing & Refining:**
   - Clicking **Alpha / Beta** in the top bar toggles the active synth engine and knob positions between `Alpha` (pre-AI) and `Beta` (post-AI).
   - Clicking `Save A` / `Save B` stores manual user variations into the traditional **A / B** slots.
   - Dragging any highlighted knob updates the live audio node and removes that parameter from `highlightedParams`.

## Stack

- **Runtime & Build Tool:** [Node.js](https://nodejs.org/) + [Vite](https://vite.dev/) + [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
  - *Rationale:* Instant hot-reload for rapid UI and audio iteration, strong typing for the 20+ synth parameters and Gemini JSON schema.
- **Audio Synthesis Engine:** [Tone.js (`tone` ^15.x)](https://tonejs.github.io/) + Browser Native [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) & [Web MIDI API](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API)
  - *Rationale:* Provides studio-grade polyphonic oscillators, filters, ADSR envelopes, effects (Distortion, Chorus, PingPong/Feedback Delay, Reverb), Transport loop scheduling, and FFT/Waveform analysis directly in the browser with zero native compilation.
  - *Accepted Tradeoff:* Runs as a web application rather than a compiled C++ `.vst3` binary, while still connecting to any DAW arrangement via Web MIDI (e.g., macOS IAC Driver).
- **AI SDK & Models:** [Google Gen AI SDK (`@google/genai` >= 2.29.1)](https://ai.google.dev/gemini-api/docs) using the **Interactions API (`client.interactions.create`)**
  - **Primary Model (Default for Deep Synesthetic Sound Design):** `gemini-4-argon` — highest reasoning capability for translating abstract, poetic, emotional, or atmospheric descriptions into cohesive multi-parameter synth patches.
  - **Secondary Selectable Models:** `gemini-3.8-flash` (fast balanced studio tweaking) and `gemini-3.5-flash-lite` (ultra-low-latency single-parameter adjustments).
  - *Rationale:* Native `response_format` JSON schema enforcement guarantees valid parameter numbers and structured explanations on every turn; user has Google AI Pro credits so using flagship models (`gemini-4-argon` / `gemini-3.8-flash`) has zero cost barrier.
- **Styling & Icons:** [Tailwind CSS](https://tailwindcss.com/) + Google Fonts (`Press Start 2P`, `Silkscreen`, `VT323`, `JetBrains Mono`) + [Lucide React](https://lucide.dev/)
  - *Rationale:* Fast implementation of the custom 8-bit Red/Gold/Yellow hardware rack aesthetic and custom SVG rotary knobs.

## Where It Runs and How Someone Tries It

- **Runtime Environment:** Runs locally in any modern Chromium-based desktop browser (Chrome / Edge / Brave recommended for full Web MIDI API support) backed by the Vite dev server.
- **Environment Requirements:**
  - Node.js 18+ installed.
  - `VITE_GEMINI_API_KEY` stored in `.env` (git-ignored, with `.env.example` committed to the repo). Users can also paste or switch their Gemini API key directly in the top-right settings popover of the UI.
- **Exact Start Commands:**
  ```bash
  npm install
  npm run dev
  ```
  Then open `http://localhost:5173` in Chrome.
- **Hackathon Submission & Demo Recording:**
  - Submission requires a 1–3 minute screen-recorded demo video (uploaded to YouTube/Vimeo) and a public GitHub repository with an MIT `LICENSE` and `devpost/scope.md`, `devpost/prd.md`, and `devpost/spec.md`.
  - Deployment to a public URL is optional; the app can be recorded running locally on `http://localhost:5173` (connected to the user's DAW via macOS IAC MIDI or playing the built-in custom Demo Loop).

## Look and Feel
Implements `prd.md > Look and Feel` and `scope.md > Inspiration & Identity`.

- **Color Palette (Red / Gold / Yellow Retro Hardware):**
  - Chassis Background: Deep warm obsidian/charcoal (`#110b0b` to `#1a1010`) with recessed module bays (`#221414`).
  - Borders & Hardware Trim: Metallic gold (`#d4af37`, `#f59e0b`) pixel-styled borders and corner screws/rivets.
  - Primary Accents: Crimson red (`#ef4444`, `#dc2626`) for module headers, active buttons, and oscillator badges; bright golden-yellow (`#facc15`, `#fde047`) for live waveform traces, active knob value arcs, and persistent AI-modified highlight rings.
- **Typography:**
  - 8-bit pixel headers and parameter readouts using `'Press Start 2P'` and `'VT323'` / `'Silkscreen'`, paired with high-legibility monospace/sans body text inside the AI explanation cards so multi-sentence acoustic explanations remain effortless to read.
- **Layout Density:** Crisp, zero-scroll single-screen studio workstation: Left 70% dedicated to the synthesizer rack (Top Bar + Modular Racks around the Center Visualizer + Bottom Piano Keyboard), Right 30% dedicated to the AI Sound Designer Copilot sidebar.

## Components

### 1. Top Utility, Preset & Comparison Bar (`src/components/TopBar.tsx`)
Implements `prd.md > Screens and Layout`, `prd.md > 2. Multi-Input MIDI & Custom Demo Loop Triggering`, and `prd.md > 4. Dual Version Comparison: AI Alpha / Beta & Manual A / B`.
- Renders the `SynthLM` 8-bit logo, Preset selector (`Init Sine`, `Init Square`, `Init Triangle`, `Init Saw`, plus user-saved custom presets/snapshots), **`Save Preset / Snapshot`** button (saving custom patches to `localStorage` and optionally downloading a `.json` patch snapshot), Manual **`A / B`** slot buttons (`A`, `B`, `Save A`, `Save B`), Automatic AI **`Alpha / Beta`** toggle button, **Demo Loop** play/stop toggle with BPM control, **MIDI Input** device selector badge, and a `Reset` button.
- Includes a `beforeunload` listener when the active patch has unsaved changes so refreshing the browser prompts the user before losing unsaved tweaks.

### 2. Polyphonic Web Audio Synthesizer Engine (`src/audio/synthEngine.ts`)
Implements `prd.md > 1. Real-Time Synthesizer Engine & Modular Controls`.
- Encapsulates a dual-oscillator `Tone.PolySynth` architecture (two synchronized polyphonic synth layers `osc1` and `osc2` mixed into a shared `Tone.Filter` → `Tone.Distortion` → `Tone.Chorus` → `Tone.FeedbackDelay` → `Tone.Reverb` → `Tone.Analyser` → `Tone.Destination`).
- Exposes methods: `applyPatch(patch: SynthPatch)`, `setParam(key, value)`, `noteOn(note, velocity)`, `noteOff(note)`, `startDemoLoop(melody)`, `stopDemoLoop()`, and `getWaveformData()`.

### 3. Modular Synth Rack, Rotary Knobs & Wave Sculptor (`src/components/SynthRack.tsx`, `src/components/RotaryKnob.tsx` & `src/components/WaveSculptorCanvas.tsx`)
Implements `prd.md > 1. Real-Time Synthesizer Engine & Modular Controls` and `prd.md > 3. Sidebar AI Sound Designer, Synesthetic Guidance & Persistent Highlights`.
- Surrounds the center visualizer with four distinct hardware modules: **OSC 1 & OSC 2**, **FILTER**, **ENVELOPE (ADSR)**, and **FX RACK (Distortion, Chorus, Delay, Reverb)**.
- Each `RotaryKnob` supports vertical drag to adjust values, double-click to reset, 8-bit value readout (`Hz`, `s`, `%`), and a pulsing golden-yellow highlight ring when its parameter key is present in `highlightedParams`. Interacting with the knob immediately clears its highlight state.
- **Wave Sculptor Canvases (`WaveSculptorCanvas.tsx` & `src/audio/waveMath.ts`):** Embedded in `OSC 1` and `OSC 2`, displaying the exact single-cycle waveform curve (whether standard or AI-sculpted) and allowing users to freehand draw custom waveforms with mouse dragging, which converts to 16 harmonic partials via real-time Discrete Fourier Transform (DFT). Displays the golden-yellow persistent highlight halo when newly sculpted by the AI.

### 4. Center Real-Time Waveform & Spectrum Visualizer (`src/components/WaveformVisualizer.tsx`)
Implements `prd.md > Screens and Layout` and `prd.md > 1. Real-Time Synthesizer Engine & Modular Controls`.
- Placed in the exact center of the synthesizer rack.
- Uses an HTML5 `<canvas>` running a `requestAnimationFrame` loop that reads time-domain waveform and frequency-domain FFT data from `synthEngine.getWaveformData()`, drawing a glowing Red/Gold/Yellow oscilloscope trace with an 8-bit grid backdrop.

### 5. Multi-Input MIDI, Typing Keyboard & Virtual Piano (`src/components/PianoKeyboard.tsx` & `src/audio/midiManager.ts`)
Implements `prd.md > 2. Multi-Input MIDI & Custom Demo Loop Triggering` and `prd.md > States and Boundaries`.
- Handles mouse click/drag on the bottom piano keys, two-row computer keyboard mapping (`A W S E D F T G Y H U J K...`), and Web MIDI API (`navigator.requestMIDIAccess()`) listener for external MIDI controllers or DAW virtual MIDI buses.
- Highlights active keys in red/gold in real time regardless of which input source triggered the note.

### 6. Sidebar AI Sound Designer & Synesthetic Reasoner (`src/components/AISidebar.tsx` & `src/services/geminiSoundDesigner.ts`)
Implements `prd.md > 3. Sidebar AI Sound Designer, Synesthetic Guidance & Persistent Highlights` and `prd.md > States and Boundaries`.
- Renders the right-hand copilot sidebar with a model selector (`gemini-4-argon` default, `gemini-3.8-flash`, `gemini-3.5-flash-lite`), API key status/override input, clickable starter prompt chips (including poetic/synesthetic examples like *"Lonely Iceland winter aurora lead"* and *"Sunny warm analog bass"*), conversation feed, and prompt input bar.
- Displays structured response cards showing:
  1. **Synesthetic Breakdown** (how the mood/imagery was translated into acoustics).
  2. **Parameter Diffs** (`Parameter Label`: `Old Value → New Value` + 1-sentence acoustic explanation).
  3. **Creative Coaching Tip** (guiding the user on what they can ask next).

## Data Model

All state lives in browser memory (React state) and is mirrored to `localStorage` (`synthlm_state_v1`) so accidental page refreshes during a demo never lose the user's patches or conversation history. A top-bar `Reset` button clears `localStorage` and restores clean initial defaults.

```typescript
export type WaveformType = 'sine' | 'square' | 'triangle' | 'sawtooth' | 'custom';
export type FilterType = 'lowpass' | 'highpass' | 'bandpass';

export interface SynthPatch {
  name: string;
  // Dual Oscillators
  osc1Type: WaveformType;
  osc1Octave: number;       // -2 to +2
  osc1Detune: number;       // -100 to +100 cents
  osc1Mix: number;          // 0.0 to 1.0
  osc1Partials?: number[];  // 16 harmonic Fourier coefficients [-1.0 to 1.0]
  osc2Type: WaveformType;
  osc2Octave: number;       // -2 to +2
  osc2Detune: number;       // -100 to +100 cents
  osc2Mix: number;          // 0.0 to 1.0
  osc2Partials?: number[];  // 16 harmonic Fourier coefficients [-1.0 to 1.0]
  // Filter
  filterType: FilterType;
  filterCutoff: number;     // 20 to 18000 Hz
  filterResonance: number;  // 0.1 to 18.0 Q
  // Amplitude Envelope (ADSR)
  attack: number;           // 0.005 to 3.0 seconds
  decay: number;            // 0.01 to 3.0 seconds
  sustain: number;          // 0.0 to 1.0 level
  release: number;          // 0.01 to 5.0 seconds
  // Effects Rack
  distortion: number;       // 0.0 to 1.0 amount
  chorusWet: number;        // 0.0 to 1.0 mix
  delayTime: number;        // 0.05 to 1.0 seconds
  delayWet: number;         // 0.0 to 1.0 mix
  reverbDecay: number;      // 0.5 to 8.0 seconds
  reverbWet: number;        // 0.0 to 1.0 mix
  masterVolume: number;     // -24 to 0 dB
}

export interface ParameterChangeExplanation {
  paramKey: keyof SynthPatch;
  paramLabel: string;
  oldValue: string | number;
  newValue: string | number;
  reason: string;           // 1-sentence acoustic explanation
}

export interface AISoundDesignResponse {
  patchName: string;
  summary: string;
  synestheticBridge: {
    timbreAndWaveforms: string;
    filterAndBrightness: string;
    envelopeAndMotion: string;
    spaceAndEffects: string;
  };
  updatedPatch: SynthPatch;
  changes: ParameterChangeExplanation[];
  coachingTip: string;
}
```

- **Version Slots & Saved Snapshots in App State:**
  - `currentPatch: SynthPatch` — currently audible and displayed patch.
  - `alphaPatch: SynthPatch | null` & `betaPatch: SynthPatch | null` — automatically populated on every AI update (`Alpha` = pre-AI, `Beta` = post-AI).
  - `slotAPatch: SynthPatch` & `slotBPatch: SynthPatch` — manual user comparison slots updated only when the user clicks `Save A` or `Save B`.
  - `savedSnapshots: SynthPatch[]` — user-saved custom presets/snapshots stored in `localStorage` and accessible in the top preset dropdown (plus `.json` snapshot export).
  - `hasUnsavedChanges: boolean` — triggers a browser `beforeunload` confirmation dialog if the user tries to refresh or close the page before saving their current patch/snapshot.
  - `highlightedParams: Set<keyof SynthPatch>` — populated with all keys in `changes` after an AI turn; individual keys are deleted when the user clicks/drags that knob.

## File Structure

```
synthlm/
├── devpost/
│   ├── learner-profile.md          # Personal learning context (git-ignored)
│   ├── scope.md                    # Approved project scope
│   ├── prd.md                      # Approved product requirements
│   ├── spec.md                     # This technical specification
│   └── checklist.md                # Created and tracked by 5-build
├── public/
│   └── favicon.svg
├── src/
│   ├── audio/
│   │   ├── synthEngine.ts          # Tone.js dual-oscillator + filter + ADSR + 4 FX + analyser graph
│   │   ├── presets.ts              # Init Sine, Init Square, Init Triangle, Init Saw & parameter bounds
│   │   ├── waveMath.ts             # Fourier synthesis, real-time DFT harmonic analysis & clamping
│   │   ├── demoMelody.ts           # Built-in Demo Loop melody sequence (ready for creator's custom notes)
│   │   └── midiManager.ts          # Web MIDI API device discovery and noteOn/noteOff listener
│   ├── components/
│   │   ├── TopBar.tsx              # Presets, Manual A/B, AI Alpha/Beta, Demo Loop, MIDI status, Reset
│   │   ├── SynthRack.tsx           # Modular hardware layout surrounding the center visualizer
│   │   ├── RotaryKnob.tsx          # 8-bit Red/Gold/Yellow SVG knob with drag & persistent AI highlight
│   │   ├── WaveformVisualizer.tsx  # Center real-time oscilloscope / FFT spectrum canvas
│   │   ├── WaveSculptorCanvas.tsx  # Interactive single-cycle wave canvas with mouse drawing & AI wave display
│   │   ├── PianoKeyboard.tsx       # Bottom virtual piano + computer keyboard listener
│   │   └── AISidebar.tsx           # Right-hand AI Copilot sidebar, model switcher & diff explanation cards
│   ├── services/
│   │   └── geminiSoundDesigner.ts  # @google/genai client.interactions.create with strict JSON schema
│   ├── types/
│   │   └── synth.ts                # TypeScript interfaces for SynthPatch, comparison slots, and AI responses
│   ├── App.tsx                     # Split-screen workspace state orchestration & localStorage persistence
│   ├── main.tsx                    # React entry point
│   └── index.css                   # 8-bit Google Fonts import & Red/Gold/Yellow retro hardware theme
├── .env.example                    # Template with VITE_GEMINI_API_KEY=your_api_key_here
├── .gitignore
├── index.html
├── LICENSE                         # MIT Open Source License (required by hackathon rules)
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## External Services and Dependencies

1. **Google Gemini API via `@google/genai` (`>= 2.29.1`)**
   - **Documentation:** [Gemini Interactions API](https://ai.google.dev/gemini-api/docs/interactions.md.txt) & [Structured Output](https://ai.google.dev/gemini-api/docs/structured-output.md.txt)
   - **Call Pattern:**
     ```typescript
     const client = new GoogleGenAI({ apiKey });
     const interaction = await client.interactions.create({
       model: selectedModel, // Default: 'gemini-4-argon', also 'gemini-3.8-flash' or 'gemini-3.5-flash-lite'
       system_instruction:SYNTH_DESIGNER_SYSTEM_PROMPT,
       input: JSON.stringify({ currentPatch, userPrompt }),
       response_format: [
         {
           type: 'text',
           mime_type: 'application/json',
           schema: SYNTH_RESPONSE_JSON_SCHEMA,
         }
       ],
     });
     const result = JSON.parse(interaction.output_text);
     ```
   - **Authentication:** `VITE_GEMINI_API_KEY` in `.env` or entered via the UI key popover.
   - **Cost & Rate Limits:** Covered by the user's Google AI Pro monthly credits.
2. **Google Fonts (`Press Start 2P`, `VT323`, `JetBrains Mono`)**
   - Loaded in `index.html` with standard system monospace fallback (`'Courier New', monospace`) if offline.

## Important Failure Modes
Implements `prd.md > States and Boundaries`.

- **Browser Blocks Audio Until First Click (Autoplay Policy):** → Clicking any piano key, knob, preset, or the Demo Loop button automatically calls `await Tone.start()` before triggering sound, plus a clear status badge indicates when the audio engine is active.
- **Out-of-Bounds Numbers from AI:** → Even with JSON Schema enforcement, every numeric field returned by the AI is passed through a deterministic `clampPatch(rawPatch)` sanitizer before touching `Tone.js` nodes so invalid frequencies (`<= 0 Hz` or `> 20000 Hz`) or NaN values can never crash the audio graph or cause speaker-damaging clipping.
- **Missing API Key or Network Error:** → If `VITE_GEMINI_API_KEY` is missing or the Gemini call fails, the sidebar displays a clear inline message with a button to enter an API key or retry, while the synthesizer itself remains 100% playable.
- **Web MIDI Not Supported (e.g., Safari/Firefox) or No Controller Plugged In:** → `midiManager.ts` catches `requestMIDIAccess` errors gracefully and shows `"No MIDI Device"` in the top bar while keeping computer typing keyboard, mouse piano, and Demo Loop active.

## What Was Simplified and Why

- **Browser-based Web Audio + Web MIDI instead of a native C++ VST3 plugin** — Building and debugging a cross-platform C++/JUCE VST3 binary with embedded HTTP/LLM calls takes weeks, whereas `Tone.js` + Web MIDI runs in seconds in Chrome and still receives live MIDI notes directly from a DAW arrangement (via macOS IAC Driver) or hardware MIDI keyboard.
- **Two-Stage Structured Prompting on `gemini-4-argon` instead of training a custom audio neural network** — Leveraging `gemini-4-argon`'s deep acoustic and synesthetic reasoning via strict JSON schemas achieves superior poetic-to-parameter translation immediately without dataset collection or GPU model training.
- **Browser `localStorage` instead of a backend database** — Persists patches, `A/B` slots, `Alpha/Beta` states, and chat history across page reloads with zero server setup.

## Decisions and Open Issues

- **Learner Decision — Flagship Model for Synesthetic Prompts:** Prioritized deep reasoning for abstract/poetic prompts (e.g., *"a lonely sound like a winter aurora in Iceland"*) by defaulting to **`gemini-4-argon`** with a two-stage synesthetic-to-acoustic JSON schema, while offering **`gemini-3.8-flash`** and **`gemini-3.5-flash-lite`** in the sidebar model selector.
- **Learner Decision — Dual Version Comparison (`Alpha/Beta` + `A/B`):** Separated automatic AI before/after comparison (`Alpha/Beta`) from traditional manual user-saved slots (`A/B`).
- **Learner Decision — 8-Bit Red/Gold/Yellow Hardware Aesthetic & Split Sidebar:** Adopted an 8-bit pixel font with a Crimson Red, Metallic Gold, and Bright Yellow palette, keeping the AI in an Antigravity-style right sidebar so it never obstructs the synth controls.
- **Learner Uncertainty Addressed (`1-start` Learning Goal — How Synthesizers Work Under the Hood):** Walked through how a synthesizer is structured as a directed audio signal graph (`Oscillators → Filter → ADSR Envelope → FX → Analyser`) controlled by a central `PatchState` dictionary, and designed `src/audio/synthEngine.ts` to keep that signal flow clean and inspectable during `5-build`.
- **Carry-Over Open Item for `5-build`:** The creator will supply their custom hand-written melody notes during the build to drop into `src/audio/demoMelody.ts` (a musical placeholder phrase will be used initially so the Demo Loop works from step one).

