# SynthLM 🎛️

> **An instrument-first web synthesizer with an Antigravity-style AI sound designer copilot, real-time Fourier waveform sculpting, 60fps oscilloscope visualizer, and dual comparison systems.**

Built for the **Build With AI: Basics** Hackathon.

---

## Features

- **Polyphonic Subtractive Engine:** Dual oscillators (`OSC 1` and `OSC 2`), 24dB resonant filter (Lowpass, Highpass, Bandpass), ADSR envelope, and 4-chain effects rack (Drive, Chorus, Feedback Delay, Reverb) powered by [Tone.js](https://tonejs.github.io/).
- **AI Custom Waveform Sculpting ("AI 画波形"):** Powered by Google's `gemini-4-argon` and `gemini-3.8-flash` via `@google/genai`. Deconstructs poetic, synesthetic metaphors into 16-harmonic Fourier series, sculpting bespoke single-cycle waveforms for each oscillator.
- **Interactive Hand-Drawn Waveforms:** Click and drag directly on the oscillator waveform canvas to hand-draw custom waves, converted in real time via Discrete Fourier Transform (DFT) into alias-free Web Audio `PeriodicWave` voices.
- **Center 60 FPS Visualizer:** Real-time time-domain oscilloscope wave trace with background frequency spectrum bars rendered on HTML5 canvas.
- **Dual Version Comparison:**
  - **AI Comparison (Alpha / Beta):** Automatic pre-AI (`Alpha`) and post-AI (`Beta`) state snapshots with persistent animated golden-yellow knob highlight halos that clear upon touch.
  - **Manual Comparison (A / B):** Independent manual slot banks for storing and comparing user-crafted variations.
- **Multi-Input Performance:**
  - Web MIDI controller support (`navigator.requestMIDIAccess`).
  - Two-row computer keyboard typing (`A`, `W`, `S`, `E`, `D`, `F`...).
  - Customizable Demo Loop sequencer with inline melody note editor.
- **Preset Snapshots:** Local browser storage persistence + `.json` preset export.

---

## Tech Stack

- **Frontend & Audio:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Tone.js (^15.0.4)
- **AI Engine:** Google Gemini Interactions API (`@google/genai` >= 2.29.1) with strict JSON Schema output (`gemini-4-argon`, `gemini-3.8-flash`, `gemini-3.5-flash-lite`)
- **Testing:** Vitest (15 unit tests covering parameter clamping, diffing, DFT wave math, and melody parsing)

---

## Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/<your-username>/synthlm.git
cd synthlm
npm install
```

### 2. Configure Environment (Optional)
Copy the example env file and add your Google Gemini API key:
```bash
cp .env.example .env
```
Inside `.env`:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```
*(You can also input or change your API key directly inside the SynthLM web UI at any time).*

### 3. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in Google Chrome.

### 4. Run Automated Tests
```bash
npm test -- --run
```

### 5. Build for Production
```bash
npm run build
```

---

## Architecture Guide

SynthLM includes a standalone offline architecture map and interactive code tour:
Open `devpost/app-map.html` in any web browser to view the complete audio signal flow and data lifecycle diagram.

---

## License

[MIT](LICENSE) © 2026 SynthLM Contributors

