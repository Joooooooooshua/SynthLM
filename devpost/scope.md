---
doc: scope
status: approved
---

# SynthLM

An instrument-first synthesizer inspired by Serum and Omnisphere that pairs tactile knob-level sound design with conversational AI parameter sculpting, acoustic explanations, and instant A/B comparison.

## The Unique Kernel
Unlike chat-first AI music wrappers or black-box audio generators, this looks and behaves like a real hardware/software synthesizer first. Veteran producers can dial in every knob manually, while newcomers can describe the sound they hear in their head ("make this bass fatter and warmer")—watching the knobs physically move to the new values, reading a concise explanation of *why* those specific parameters changed (e.g., shorter envelope attack, boosted low-mid filter), and flipping an A/B switch to hear the exact before-and-after difference in context.

## Who It's For
Bedroom music producers, beatmakers, and aspiring sound designers who already make music in a DAW and use synth presets, but hit a wall when trying to build a patch from an `Init` sound or tweak an existing preset to sit right in an arrangement because they don't yet know how acoustic adjectives map to synthesizer parameters.

## The Core Loop
1. Trigger notes live via MIDI (MIDI keyboard, DAW MIDI routing, computer typing keyboard, or on-screen piano/demo phrase) — either solo or alongside an existing musical arrangement.
2. Start from an `Init` patch or preset and describe a desired timbre or adjustment in natural language (or turn the synth knobs directly).
3. Watch the synthesizer controls animate to the updated patch, read the plain-language breakdown of which parameters moved and why, and toggle **A / B** while playing to compare the sound before and after the change.
4. Repeat—combining conversational prompts and manual fine-tuning until the patch fits the track.

## Inspiration & Identity
- **Visual & Functional References:** [Xfer Serum](https://xferrecords.com/products/serum) and [Spectrasonics Omnisphere](https://www.spectrasonics.net/products/omnisphere/) — dark, high-contrast studio instrument aesthetic where oscillators, filter curve, envelopes, effects, and live waveform visualizers are front and center, with an integrated AI sound-design strip rather than a generic chatbot page.

## Why This Matters to the Learner
As someone who makes music regularly and uses synthesizers and audio plugins in production, the goal is to demystify how synthesizers and audio plugins work under the hood—bridging musical intuition ("fatter bass") with the actual DSP signal chain and parameter logic.

## What "Working" Looks Like
Playing an existing musical arrangement alongside the synthesizer, starting from a raw `Init` patch (or an existing preset), and using natural language prompts in real time to sculpt a complete, mix-ready synth patch from scratch or refine its tone—toggling A/B to hear the transformation immediately inside the arrangement, and fine-tuning knobs by hand.

## The POC Boundary
- **Core Subtractive/FM Signal Chain:** Dual Oscillators (waveform selection, detune, mix) → Filter (Low-pass / High-pass / Band-pass, Cutoff, Resonance) → ADSR Amplitude/Filter Envelope → Core FX rack (Distortion/Drive, Chorus, Delay, Reverb) → Real-time Oscilloscope/Spectrum Visualizer.
- **Natural Language Sound Designer:** Prompt input that translates descriptive musical intent into full or incremental parameter updates, animates the knobs, and explains the parameter logic behind the change.
- **A/B State Toggle:** Instant non-destructive comparison between the previous state (A) and the AI/manually modified state (B).
- **Playability:** Web MIDI API input (supporting hardware MIDI controllers and virtual MIDI routing from a DAW arrangement), computer typing keyboard, on-screen virtual keyboard, and a built-in demo MIDI loop trigger for standalone testing.

## Later
- Custom wavetable drawing and import.
- Multi-LFO drag-and-drop modulation matrix.
- Exporting patches to native VST3/AU plugin formats.
- Preset library cloud sharing.

## Explicitly Cut
- **Full multi-track DAW timeline / audio recording engine:** Keeps the focus squarely on the synthesizer instrument itself rather than rebuilding a DAW; arrangement context is handled via MIDI input or lightweight backing playback.
- **Black-box raw audio wave generation (Suno/Udio style):** Defeats the core educational and tactile synthesizer kernel where every sound is synthesized live from inspectable, editable parameters.
- **Custom C++ VST compilation for the hackathon build:** Running via Web Audio + Web MIDI makes the synth zero-install for judges while still allowing live MIDI playback alongside an existing DAW arrangement.

