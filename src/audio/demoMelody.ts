import * as Tone from 'tone';
import { synthEngine } from './synthEngine';

// Default catchy synthwave/8-bit demo arpeggio
export const DEFAULT_DEMO_MELODY = 'C3 E3 G3 B3 C4 B3 G3 E3 D3 F#3 A3 C#4 D4 C#4 A3 F#3';

class DemoMelodyManager {
  private sequence: Tone.Sequence | null = null;
  private isPlaying = false;
  private currentMelodyString = DEFAULT_DEMO_MELODY;

  constructor() {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem('synthlm_custom_melody');
        if (saved && saved.trim()) {
          this.currentMelodyString = saved.trim();
        }
      } catch (e) {
        console.warn('Could not read localStorage in DemoMelodyManager:', e);
      }
    }
  }

  public parseMelody(input: string): string[] {
    const rawNotes = input.trim().split(/\s+/);
    // Filter valid musical notes
    const validNotes: string[] = [];
    for (const n of rawNotes) {
      if (/^[A-Ga-g][#b]?[0-8]$/.test(n)) {
        // Normalize capitalization
        const normalized = n.charAt(0).toUpperCase() + n.slice(1);
        validNotes.push(normalized);
      }
    }
    return validNotes.length > 0 ? validNotes : ['C3', 'E3', 'G3', 'B3'];
  }

  public getMelodyString(): string {
    return this.currentMelodyString;
  }

  public setMelodyString(melody: string): void {
    this.currentMelodyString = melody;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('synthlm_custom_melody', melody);
      } catch (e) {
        console.warn('Could not write localStorage in DemoMelodyManager:', e);
      }
    }
    if (this.isPlaying) {
      // Rebuild sequence with new notes
      this.stop();
      this.start(Tone.Transport.bpm.value);
    }
  }

  public async start(bpm = 110, onStep?: (note: string) => void): Promise<boolean> {
    await synthEngine.init();
    this.stop();

    Tone.Transport.bpm.value = bpm;
    const notes = this.parseMelody(this.currentMelodyString);

    let stepIndex = 0;
    this.sequence = new Tone.Sequence(
      (time, note) => {
        synthEngine.noteOn(note, 0.75);
        // Note duration: eighth note (8n)
        Tone.Draw.schedule(() => {
          if (onStep) onStep(note);
        }, time);

        // Schedule note off
        Tone.Transport.scheduleOnce(() => {
          synthEngine.noteOff(note);
        }, `+8n`);

        stepIndex = (stepIndex + 1) % notes.length;
      },
      notes,
      '8n'
    );

    this.sequence.start(0);
    Tone.Transport.start();
    this.isPlaying = true;
    return true;
  }

  public stop(): void {
    if (this.sequence) {
      this.sequence.stop();
      this.sequence.dispose();
      this.sequence = null;
    }
    Tone.Transport.stop();
    synthEngine.releaseAll();
    this.isPlaying = false;
  }

  public setBpm(bpm: number): void {
    Tone.Transport.bpm.value = bpm;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const demoMelodyManager = new DemoMelodyManager();
