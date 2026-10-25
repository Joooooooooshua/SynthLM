# SynthLM 🎛️

> **An instrument-first web synthesizer powered by NVIDIA Nemotron-3 on Nebius Token Factory, PyTorch Neural Inverse Synthesis (SynthNet-16H), real-time 16-order Fourier harmonic wave sculpting, and Google Gemini dual-engine intelligence.**

Live Demo: **[https://synth.nlmmt093.top](https://synth.nlmmt093.top)**  
Demo Video: **[https://youtu.be/Z-xA8vuoRfM](https://youtu.be/Z-xA8vuoRfM)**

---

## Key AI & Neural Synthesis Capabilities

### 1. Multi-Tier NVIDIA Nemotron-3 Reasoning on Nebius Token Factory
- **`nvidia/Nemotron-3-Ultra-550b-a55b` (Deep Acoustic Reasoning):** 550B MoE model that deconstructs complex synesthetic metaphors (e.g., *"1984 Tokyo City Pop Rhodes"*, *"Solitary Icelandic aurora borealis pad"*) into 4 physical pillars (Timbre, Brightness, Dynamics, Space), 22 synthesizer parameters, and bespoke 16-order Fourier harmonic coefficients.
- **`nvidia/nemotron-3-super-120b-a12b` (Studio Balanced Production):** 120B MoE model balancing deep harmonic richness and sub-second generation speed.
- **`nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B` (Fast Interactive Tweaking):** 30B MoE model optimized for ultra-fast, real-time knob adjustments (< 800ms).
- **Custom LoRA SFT Pipeline:** Automated dataset generation (`scripts/build_finetune_dataset.mjs`) creating 750+ physics-grounded SFT pairs (`dataset/nebius_sft_train.jsonl`) and automated cloud fine-tuning scripts (`scripts/nebius_finetune.mjs`).
- **Benchmark & Evaluation Suite:** Real-time test harness (`scripts/evaluate_nemotron.mjs`) tracking parameter MAE and Fourier cosine similarity. Read the full evaluation report in [`docs/NEBIUS_NVIDIA_TRAINING_REPORT.md`](docs/NEBIUS_NVIDIA_TRAINING_REPORT.md).

### 2. PyTorch Neural Inverse Synthesizer (`SynthNet-16H`)
- **"Match My Sound" Microphone & Audio File Inversion:** Drop in any 1–2 second audio clip (`.wav`/`.mp3`) or click **"MIC (2S)"** to hum or whistle into your microphone.
- **Trained Deep Residual MLP:** Architecture with 36 input features (16 harmonic overtone peaks from windowed FFT + spectral centroid/rolloff/flatness + 16-frame temporal RMS envelope) trained on 12,000 synthetic audio signals (`training/train_synthnet.py`).
- **Zero-Dependency Browser Inference:** Compact FP32 neural weights (`src/audio/neuralSpectralWeights.json`) execute forward passes directly in WebAudio JavaScript in **< 2ms**, extracting 16 Fourier partials (`osc1Partials`) and ADSR envelope curves without external libraries.

### 3. Hardware-Grade Web Synthesizer Engine
- **Hardware-Level Low Latency (< 5ms):** Web Audio context configured with `lookAhead = 0` and `Tone.immediate()`, eliminating scheduler delay for responsive MIDI performance.
- **16-Order Fourier Wave Sculpting:** Draw single-cycle waveforms by hand on HTML5 canvas or let AI sculpt custom wavetables converted via Discrete Fourier Transform (DFT).
- **Dual Comparison Systems:**
  - **AI Alpha / Beta:** Instant pre-AI (`Alpha`) and post-AI (`Beta`) comparison with animated golden knob diff halos.
  - **Manual A / B:** Independent manual slot banks for storing and testing sound variations.
- **Center 60 FPS Oscilloscope:** Real-time waveform trace with zero CPU bogging.
- **Web MIDI Controller Support:** Plug-and-play USB/Bluetooth MIDI keyboard integration.

---

## Tech Stack

- **Cloud AI & Open Models:** Nebius Token Factory (`https://api.tokenfactory.nebius.com/v1/`), NVIDIA Nemotron-3 (Ultra, Super, Nano), Google Gemini API (`@google/genai`).
- **Deep Learning & Training:** PyTorch, MPS / CUDA, NumPy, `uv` package manager (`training/train_synthnet.py`).
- **Frontend & Audio:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Tone.js (`^15.0.4`), Web Audio API.
- **Testing:** Vitest (19 unit & neural regression tests passing).

---

## Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/Joshua090208/SynthLM.git
cd SynthLM
npm install
```

### 2. Configure API Keys
Copy the example environment file:
```bash
cp .env.example .env
```
Inside `.env`, configure your Nebius Token Factory API key and/or Google Gemini key:
```env
NEBIUS_API_KEY=your_nebius_api_key_here
VITE_NEBIUS_API_KEY=your_nebius_api_key_here
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in Google Chrome.

### 4. Run PyTorch Neural Training (Scheme B)
```bash
uv run --with torch --with numpy python3 training/train_synthnet.py
```

### 5. Run Nebius Token Factory Evaluation & Benchmark
```bash
npm run build:dataset
node scripts/evaluate_nemotron.mjs
```

### 6. Run Unit Tests & Production Build
```bash
npm test
npm run build
```

[MIT](LICENSE) © 2026 SynthLM Contributors

