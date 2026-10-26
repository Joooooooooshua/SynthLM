# Nebius x NVIDIA Global AI Hackathon — Devpost Submission Guide

## 1. Basic Project Info
- **Project Name**: `SynthLM — Neural Synthesizer & NVIDIA Nemotron AI Sound Designer`
- **Elevator Pitch** (1-line summary):  
  `A hardware-grade web synthesizer powered by NVIDIA Nemotron-3 on Nebius Token Factory and PyTorch SynthNet-16H neural inverse audio matching.`
- **Track Selection**: **Best Apps and Agents Track**
- **Public GitHub Repository URL**: `https://github.com/Joooooooooshua/SynthLM`
- **Working Demo URL**: `https://synth.nlmmt093.top`
- **Demo Video URL**: `https://youtu.be/Z-xA8vuoRfM`
- **Built With (Tags)**: `nebius-token-factory`, `nvidia-nemotron`, `pytorch`, `webaudio`, `react`, `typescript`, `tone.js`, `deep-learning`, `vite`

---

## 2. Project Story (Copy & Paste to Devpost)

### Inspiration
Sound design on modern synthesizers suffers from **parameter paralysis**: producers and musicians face dozens of cryptic knobs (cutoff, resonance, detune, ADSR, LFO matrices) that detach them from pure musical inspiration. Furthermore, when musicians want to recreate a sound they hear or feel—like *"a warm 1984 Tokyo City Pop electric piano"* or *"a solitary Icelandic aurora borealis pad"*—generic AI chatbots only output static text advice, not real acoustic waveforms.

We built **SynthLM** to bridge human poetic metaphors and real acoustic physics into an instrument-first, hardware-grade synthesizer driven by **NVIDIA Nemotron-3 models on Nebius Token Factory** and custom **PyTorch neural inverse synthesis**.

---

### What It Does
1. **Multi-Tier NVIDIA Nemotron-3 Reasoning via Nebius Token Factory**:
   - **`nvidia/Nemotron-3-Ultra-550b-a55b` (Deep Acoustic Reasoning)**: Deconstructs poetic and cultural metaphors into 4 acoustic pillars (Timbre, Brightness, Dynamics, Space), calculates 22 physical synthesizer parameters, and sculpts custom 16-order Fourier harmonic coefficients (`osc1Partials`).
   - **`nvidia/nemotron-3-super-120b-a12b` (Studio Balanced Production)**: The primary studio copilot balancing deep harmonic richness with sub-second response times.
   - **`nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B` (Fast Interactive Tweaking)**: Ultra-fast 30B MoE model (< 800ms) for real-time iterative knob tweaks.
2. **PyTorch Neural Inverse Synthesizer (`SynthNet-16H`)**:
   - **"Match My Sound" Audio Inversion**: Record 2 seconds of humming, singing, or whistling via microphone, or drop in any `.wav`/`.mp3` audio sample.
   - A custom-trained 4-layer Deep Residual MLP extracts 36 spectral and temporal features, executing browser-native forward passes in **< 2ms** to reconstruct the 16 Fourier harmonic series and matching ADSR envelopes.
3. **Hardware-Grade Web Synthesizer Engine**:
   - Sub-5ms latency with zero lookAhead scheduling delay for real-time MIDI keyboard performance.
   - Center 60 FPS oscilloscope and 16-order Fourier waveform sculpting canvas.
   - Dual comparison systems: **AI Comparison (Alpha / Beta)** with animated golden knob diff halos, and **Manual Comparison (A / B)**.

---

### How We Built It
- **Nebius Token Factory & NVIDIA Models**: We integrated Nebius Token Factory's OpenAI-compatible API (`https://api.tokenfactory.nebius.com/v1/chat/completions`) using multi-tier model routing.
- **Physics-Grounded SFT Dataset Pipeline**: We built [`scripts/build_finetune_dataset.mjs`](scripts/build_finetune_dataset.mjs), compiling 25 Master Acoustic Archetypes into 750+ English training and validation pairs (`dataset/nebius_sft_train.jsonl`) for LoRA fine-tuning on Nebius Token Factory.
- **PyTorch SynthNet-16H Training**: Using [`training/train_synthnet.py`](training/train_synthnet.py), we synthesized 12,000 harmonic audio signals and trained a Residual MLP with dual prediction heads on Apple Silicon MPS / NVIDIA GPU. We exported compact neural weights (`src/audio/neuralSpectralWeights.json`) for zero-dependency browser inference via WebAudio.
- **Frontend & DSP**: Built with React 19, TypeScript, Vite, Tailwind CSS, and Tone.js.

---

### Challenges We Ran Into
- **Synthesizer Latency**: Tone.js defaults to a 100ms scheduler lookAhead. We re-engineered the audio context initialization with `lookAhead = 0` and `Tone.immediate()`, dropping key-to-sound latency from ~110ms to under 5ms.
- **Constraining LLM Hallucinations**: Universal models often guess random parameters. We anchored outputs using a physical Master Acoustic Archetype library and strict JSON schemas, achieving 100% compliance on Nebius Token Factory benchmarks.
- **Client-Side Neural Inversion**: Running heavy neural models in the browser often causes audio stutter. We designed `SynthNet-16H` as a compact Residual MLP that executes forward passes in under 2ms directly on typed arrays.

---

### Accomplishments That We're Proud Of
- **Zero-Latency Feel**: A responsive, playable synthesizer in the browser with full Web MIDI support.
- **Real-Time Timbre Matching**: Whistling or humming into a microphone and watching the 16 Fourier harmonics sculpt instantly into a playable synthesizer patch.
- **Benchmarked NVIDIA Performance**: Quantitative benchmarking across Nemotron Ultra, Super, and Nano models on Nebius Token Factory with 100% schema validity and high Fourier harmonic cosine similarity.

---

### What We Learned
- How to design multi-tier LLM architectures (Ultra for deep synthesis, Super for studio work, Nano for fast knob tweaks) to maximize interactive responsiveness while staying strictly within compute budgets.
- How Fourier harmonic series relate to emotional and synesthetic perception (e.g., odd harmonics creating hollow Nordic pads, high partial clusters creating crystalline tines).

---

### What's Next for SynthLM
- **DAW Plugin Export**: Compiling the synthesis engine and neural matcher into VST3 / AU formats for Ableton Live, Logic Pro, and FL Studio.
- **Wavetable Export**: One-click export of AI-sculpted 16-harmonic waveforms to popular synthesizers like Serum, Vital, and Pigments.

---

## 3. Hackathon-Specific Question Answers

### Question 1: How does your project meet the main technology requirement?
> *All submissions must run on either Nebius Token Factory or Nebius AI Cloud and use at least one NVIDIA open source model.*

**Answer**:  
`SynthLM runs directly on Nebius Token Factory (https://api.tokenfactory.nebius.com/v1/) and leverages a multi-tier suite of NVIDIA open-source models: nvidia/Nemotron-3-Ultra-550b-a55b (for deep synesthetic acoustic reasoning), nvidia/nemotron-3-super-120b-a12b (for primary studio production), and nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B (for sub-second interactive knob tweaking). All model routing and structured JSON completions are processed through Nebius Token Factory serverless endpoints.`

---

### Question 2: Feedback on Nebius Token Factory and NVIDIA models
**Answer**:  
`Nebius Token Factory provided an exceptional developer experience: the OpenAI-compatible endpoints made integration seamless, and the token generation latency on NVIDIA Nemotron models was remarkably fast and consistent. The structured JSON reliability on Nemotron-3-Super and Nano was outstanding—zero parsing errors across hundreds of sound design trials. For future iterations, having built-in JSON mode enforcement flags on all models and real-time WebSocket token streaming would make real-time audio interaction even smoother.`

---

### Question 3: Explanation of updates during the submission period
> *If your project existed before the Submission Period, include a written explanation of what was significantly updated during the Submission Period.*

**Answer**:  
`During this hackathon submission period, SynthLM underwent a major architectural evolution specifically for Nebius and NVIDIA:
1. Integrated multi-tier NVIDIA Nemotron-3 models (Ultra, Super, and Nano) via Nebius Token Factory API.
2. Built an automated 750+ sample acoustic SFT dataset (dataset/nebius_sft_train.jsonl) and LoRA fine-tuning launchpad (scripts/nebius_finetune.mjs).
3. Trained a custom PyTorch Neural Inverse Synthesizer (SynthNet-16H) on 12,000 synthetic audio signals, enabling real-time microphone humming and audio file reverse-synthesis.
4. Expanded the physical acoustic archetype grounding system to 25 master genres and instruments.
5. Upgraded the entire UI with live NVIDIA engine badges, a dedicated Neural Audio Matcher panel, and verified benchmarks logged in docs/NEBIUS_NVIDIA_TRAINING_REPORT.md.`
