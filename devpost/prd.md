---
doc: prd
status: approved
---

# SynthLM — Product Requirements

**SynthLM** is an instrument-first synthesizer workstation with an integrated AI sound-design copilot sidebar that lets music producers and newcomers sculpt patches via natural language (including mood and synesthetic descriptions), inspect acoustic parameter explanations, and compare versions using both manual `A/B` slots and automatic AI `Alpha/Beta` states.
Source: `scope.md > The Unique Kernel`, `scope.md > Who It's For`.

## The Core Journey
Source: `scope.md > The Core Loop`, `scope.md > What "Working" Looks Like`.

1. **Arrival & Init State:** The user opens SynthLM and sees a retro-styled synthesizer rack with 8-bit typography and a Red, Gold, and Yellow visual theme on the main canvas (loaded with a clean `Init Sine` or basic waveform preset) alongside a dedicated AI Copilot sidebar on the right.
2. **Triggering Sound:** The user plays notes immediately using their computer typing keyboard, the bottom on-screen piano keys, an external MIDI source (hardware MIDI keyboard or virtual MIDI routed from a DAW arrangement), or toggles on the **Demo Loop** (playing the creator's custom melody) in the top bar for hands-free listening.
3. **Natural Language Sculpting:** While hearing the sound (solo or inside an arrangement), the user types either concrete acoustic instructions or synesthetic/mood descriptions in the right-hand AI sidebar (e.g., *"I want a sunny-feeling bass"*, *"Give me a winter-feeling lead"*, or *"Make this bass fatter"*).
4. **Visual & Acoustic Feedback (`Alpha / Beta`):**
   - Prior to applying the AI update, the pre-AI patch is automatically saved into **Alpha**, and the newly generated AI patch becomes active in **Beta**.
   - Every synthesizer knob modified by the AI animates to its new value and displays a persistent highlight ring until the user manually clicks that specific knob.
   - The right sidebar displays a structured parameter diff (`Old Value → New Value`) paired with a concise one-sentence acoustic explanation for each changed control.
5. **Dual Version Comparison (`Alpha/Beta` & Manual `A/B`) and Refinement:**
   - The user toggles **Alpha / Beta** in the top bar to compare the exact pre-AI (`Alpha`) and post-AI (`Beta`) sound.
   - Whenever the user manually dials in knobs on the synth rack, they can explicitly save and compare their own manual snapshots using the traditional **A / B** bank buttons, just like on a standard hardware/software synthesizer.
   - Clicking or dragging an AI-highlighted knob clears its highlight ring as the user takes manual ownership of that parameter.

## Screens and Layout
Source: `scope.md > Inspiration & Identity`, `scope.md > The POC Boundary`.

SynthLM uses a single-viewport, split-workspace layout with no page reloads or modal popups obstructing the instrument:

1. **Top Utility & Preset Bar (Left/Main Header):**
   - App title (`SynthLM`).
   - **Preset Selector & Save Preset/Snapshot:** Basic foundational waveforms (`Init Sine`, `Init Square`, `Init Triangle`, `Init Saw`) plus a **`Save Preset / Snapshot`** button so users can save their sculpted patches into the preset list (and receive a browser confirmation warning if they try to refresh with unsaved tweaks).
   - **Alpha / Beta Toggle (AI Comparison):** Automatically snapshots the pre-AI state (`Alpha`) vs. post-AI state (`Beta`) whenever the AI modifies parameters.
   - **A / B Slots (Manual Comparison):** Traditional synthesizer manual comparison slots where the user can explicitly store (`Save A` / `Save B`) and toggle between their own hand-crafted versions.
   - **Demo Loop Toggle:** Starts/stops a built-in repeating custom MIDI melody so users can listen hands-free while typing prompts.
   - **MIDI Input Status & Selector:** Displays connected Web MIDI input devices (or a calm `"No MIDI Device"` indicator when none is connected).
2. **Main Synthesizer Rack (Left / Primary Canvas):**
   - Modular rack grid surrounding a central **Real-Time Waveform & Spectrum Visualizer** right in the middle of the synth workspace.
   - **Oscillator Module (OSC 1 & OSC 2):** Waveform selector (`sine`, `square`, `triangle`, `sawtooth`, `custom`), Octave, Detune, Mix level, and an **Interactive Single-Cycle Wave Sculptor Canvas** for each oscillator that renders AI-sculpted wave shapes and allows users to hand-draw custom waveforms with real-time DFT Fourier harmonic synthesis.
   - **Filter Module:** Filter type (`lowpass`, `highpass`, `bandpass`), Cutoff Frequency (Hz), and Resonance (Q).
   - **Envelope Module (ADSR):** Attack, Decay, Sustain, and Release controls.
   - **Effects Rack (FX):** Distortion/Drive, Chorus, Delay (time & wet mix), and Reverb (decay & wet mix).
3. **Bottom Performance Bar (Left/Main Footer):**
   - Interactive on-screen piano keyboard with visual key-down feedback for mouse clicks, computer typing keyboard notes, and incoming MIDI notes, plus master volume readout.
4. **Right Sidebar — AI Sound Designer Copilot:**
   - Persistent side panel inspired by the Antigravity IDE agent sidebar so natural language interaction never covers or interrupts manual synth operation.
   - Conversation history showing user prompts, creative guidance, and structured parameter change cards (`Parameter: Old → New` + 1-sentence acoustic explanation).
   - Prompt input box and submit button at the bottom of the sidebar.

## Look and Feel
Source: `scope.md > Inspiration & Identity`.

- **Typography:** **8-bit pixel font** aesthetic (e.g., `Press Start 2P` / `Silkscreen` / `VT323`) for headers, module labels, and numeric parameter readouts, giving the workstation a distinctive retro-digital hardware character.
- **Color Palette:** **Red, Gold, and Yellow** signature scheme — rich crimson/burgundy reds, metallic gold rack accents and borders, and bright golden-yellow active knob arcs, waveform traces, and AI-modified parameter highlight rings against a dark warm-charcoal chassis so the red/gold/yellow pops with high contrast.
- **Avoid:** Generic blue/purple SaaS templates, full-screen chat interfaces, or floating popups that cover synthesizer controls.

## Features and Behavior

### 1. Real-Time Synthesizer Engine & Modular Controls
Source: `scope.md > The POC Boundary`.

- Users can adjust any parameter across Dual Oscillators, Filter, ADSR Envelope, and 4 Effects (Distortion, Chorus, Delay, Reverb) in real time.
- The central visualizer renders the live audio output waveform/spectrum in the Red/Gold/Yellow palette whenever sound is playing.
- **Acceptance Criteria:**
  - [ ] Selecting any of the foundational presets (`Init Sine`, `Init Square`, `Init Triangle`, `Init Saw`) immediately resets the synth parameters and produces that pure waveform when played.
  - [ ] Dragging any knob updates its 8-bit numeric readout and audibly alters the live sound without page lag.
  - [ ] The central visualizer displays a moving waveform trace whenever notes are triggered.

### 2. Multi-Input MIDI & Custom Demo Loop Triggering
Source: `scope.md > The Core Loop`, `scope.md > The POC Boundary`.

- Users can play the synthesizer via:
  1. External MIDI input (hardware controller or DAW virtual MIDI bus via Web MIDI).
  2. Computer typing keyboard (standard two-row tracker/DAW piano layout).
  3. Mouse click/drag on the bottom virtual piano keyboard.
  4. Built-in **Demo Loop** toggle playing the creator's custom melody for continuous hands-free playback.
- **Acceptance Criteria:**
  - [ ] Pressing computer keyboard keys, clicking virtual piano keys, or sending MIDI notes illuminates the corresponding keys on the bottom keyboard and triggers polyphonic synth playback.
  - [ ] Toggling **Demo Loop** plays the repeating custom melody through the live synth engine so the user can type prompts and hear parameter changes hands-free.

### 3. Sidebar AI Sound Designer, Synesthetic Guidance & Persistent Highlights
Source: `scope.md > The Unique Kernel`.

- Submitting a natural-language prompt in the right sidebar—whether technical (*"make the bass fatter with shorter attack"*) or synesthetic/atmospheric (*"solitary Icelandic winter aurora borealis pad"*, *"a sunny-feeling bass"*, *"a winter-feeling lead"*)—translates the intent into updated parameter values, bespoke 16-harmonic custom waveform sculpting, and per-parameter acoustic explanations.
- Modified knobs and sculpted waveform canvases animate to their new positions and display a persistent gold/yellow highlight ring until the user manually clicks/interacts with that specific control.
- **Acceptance Criteria:**
  - [ ] Submitting a concrete or mood-based sound description updates the relevant synth parameters audibly and visually on the left rack without blocking manual playback.
  - [ ] For abstract/poetic timbres, the AI can sculpt custom single-cycle waveforms (`custom` type with 16 Fourier partials), rendering the wave curve in the oscillator canvas and illuminating it with the persistent golden highlight.
  - [ ] Users can also freehand draw on the oscillator single-cycle canvas with the mouse to create custom waveforms converted in real time via DFT into playable audio.
  - [ ] Every knob or wave canvas modified by the AI displays a distinct highlight state that remains visible until the user directly clicks, drags, or draws on that specific control.
  - [ ] The AI sidebar lists each modified parameter with its `Old Value → New Value` and a one-sentence acoustic explanation of why that change achieves the requested sound.

### 4. Dual Version Comparison: AI `Alpha / Beta` & Manual `A / B`
Source: `scope.md > The Unique Kernel`, `scope.md > The Core Loop`.

- **AI `Alpha / Beta`:** Whenever the AI modifies parameters, SynthLM automatically stores the pre-AI patch in **Alpha** and loads the AI-modified patch into **Beta** so users can toggle between them immediately.
- **Manual `A / B`:** Users have dedicated **A** and **B** slots that behave like a traditional synthesizer—manual edits are stored into `A` or `B` only when the user explicitly saves/assigns them, allowing independent comparison of manual sound design variations.
- **Acceptance Criteria:**
  - [ ] After an AI prompt updates the patch, clicking **Alpha / Beta** switches both the live audio engine and all visual knob positions between the pre-AI state (`Alpha`) and the post-AI state (`Beta`).
  - [ ] Users can manually save their current knob settings into Slot `A` or Slot `B` and toggle between `A` and `B` independently of the AI `Alpha / Beta` comparison.

## States and Boundaries

- **First Use / Audio Context Unlock:** Browser autoplay policy requires a user gesture before audio starts; clicking any key, knob, preset, or Demo Loop seamlessly initializes the Web Audio engine.
- **No MIDI Device Connected:** If no hardware/virtual MIDI device is detected or Web MIDI isn't supported, the top bar displays a calm `"No MIDI Device"` status without throwing errors; typing keyboard, on-screen piano, and Demo Loop work normally.
- **Vague or Conversational Prompts (Guided Coaching):** If a user enters a vague or non-technical prompt, the AI translates any mood/weather/emotional imagery (e.g., *"sunny"*, *"winter"*) into musical timbre choices and gently guides the user with helpful follow-up suggestions on how they can further describe the sound they want (e.g., warmth, brightness, pluckiness, or role like bass/lead/pad).
- **AI Request Loading / Error State:** While the AI is processing a prompt, the sidebar shows a compact loading indicator while the synth remains playable; if the API request fails, a clear retry message appears in the sidebar without resetting the current patch.

## Product Decisions
- **Split-Screen Sidebar Layout (Antigravity-style):** Placed the AI chat and parameter explanations in a dedicated right sidebar rather than a chat-first screen or modal overlay, so natural language tweaking never interrupts hands-on synthesizer playing.
- **Separate `Alpha/Beta` (AI) and `A/B` (Manual) Comparison Systems:** Kept `A/B` as user-saved manual slots (matching traditional synth workflow) while adding automatic `Alpha/Beta` state switching specifically for before/after AI changes.
- **Persistent Knob Highlights Until Touched:** AI-modified knobs stay highlighted until the user clicks each knob individually, giving learners time to inspect and test each parameter change at their own pace.
- **8-Bit Typography + Red/Gold/Yellow Aesthetic:** Chosen to give SynthLM a bold, retro-hardware visual identity that stands out from generic blue/purple AI interfaces.
- **Creative AI Guidance for Synesthetic Prompts:** Rather than rejecting metaphorical prompts like *"a sunny bass"* or *"a winter lead"*, the AI interprets mood imagery into synth parameters and coaches the user to express more musical detail when prompts are ambiguous.

## What We're Building
- Split-view web synthesizer workstation (`SynthLM`) with an 8-bit font and Red/Gold/Yellow retro hardware aesthetic, centered around a live waveform/spectrum visualizer.
- Real-time polyphonic synth engine with Dual Oscillators, Filter, ADSR Envelope, and 4 FX (Distortion, Chorus, Delay, Reverb).
- Top utility bar with basic waveform presets, automatic AI **Alpha / Beta** toggle, manual user-saved **A / B** comparison slots, custom **Demo Loop** player, and **Web MIDI** input selector/status.
- Bottom virtual piano keyboard supporting mouse, computer typing keys, and live MIDI input.
- Right-hand AI Sound Designer sidebar that interprets both technical and synesthetic prompts, guides users conversationally, updates synth knobs, highlights modified controls until clicked, and displays `Old → New` parameter diffs with 1-sentence acoustic explanations.

## Deferred From the POC
- **User accounts and cloud patch saving:** Out of scope for the hackathon proof of concept; users work interactively in the live session.
- **Custom audio backing-track file uploader:** Out of scope because live MIDI routing from a DAW + the built-in custom Demo Loop already cover both arrangement context and standalone testing.

## Possible Later Enhancements
- Local JSON patch export/import so users can save favorite patches to disk.
- Additional modulation sources (LFO routed to filter cutoff or pitch).

## Non-Goals
Source: `scope.md > Explicitly Cut`.
- **Multi-track DAW timeline or audio recording:** SynthLM is a focused synthesizer instrument, not a full DAW.
- **Black-box text-to-audio waveform generation:** Every sound must come from the real-time synthesizer parameter engine so users can inspect and tweak every knob.
- **Large factory preset banks:** Avoids scope bloat and copyright ambiguity.

## Open Questions
- Creator's custom melody notes for the built-in **Demo Loop** (to be provided during `5-build`; a placeholder melody works until dropped in).
