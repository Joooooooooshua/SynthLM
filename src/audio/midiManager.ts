import { synthEngine } from './synthEngine';

// Converts MIDI note number (0..127) to scientific pitch notation (e.g. 60 -> C4)
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function midiNumberToNote(midiNum: number): string {
  const noteName = NOTE_NAMES[midiNum % 12];
  const octave = Math.floor(midiNum / 12) - 1;
  return `${noteName}${octave}`;
}

type NoteCallback = (note: string, isOn: boolean) => void;
type DeviceChangeCallback = (deviceName: string | null) => void;

interface MidiMessageEventLike {
  data: Uint8Array | number[];
}

interface MidiPortLike {
  name?: string;
  onmidimessage?: ((event: MidiMessageEventLike) => void) | null;
}

interface MidiAccessLike {
  inputs: {
    values: () => IterableIterator<MidiPortLike>;
  };
  onstatechange?: (() => void) | null;
}

class MidiManager {
  private midiAccess: MidiAccessLike | null = null;
  private onNoteCallback: NoteCallback | null = null;
  private onDeviceCallback: DeviceChangeCallback | null = null;
  private activeDeviceName: string | null = null;

  public async init(onNote: NoteCallback, onDeviceChange: DeviceChangeCallback): Promise<boolean> {
    this.onNoteCallback = onNote;
    this.onDeviceCallback = onDeviceChange;

    const nav = navigator as unknown as { requestMIDIAccess?: (options: { sysex: boolean }) => Promise<MidiAccessLike> };
    if (!nav.requestMIDIAccess) {
      console.warn('Web MIDI API is not supported in this browser.');
      this.onDeviceCallback(null);
      return false;
    }

    try {
      this.midiAccess = await nav.requestMIDIAccess({ sysex: false });
      this.updateInputs();

      this.midiAccess.onstatechange = () => {
        this.updateInputs();
      };
      return true;
    } catch (err) {
      console.warn('Could not access Web MIDI devices:', err);
      this.onDeviceCallback(null);
      return false;
    }
  }

  private updateInputs(): void {
    if (!this.midiAccess) return;

    let firstDeviceName: string | null = null;
    const inputs = this.midiAccess.inputs.values();

    for (const input of inputs) {
      if (!firstDeviceName && input.name) {
        firstDeviceName = input.name;
      }
      input.onmidimessage = (event: MidiMessageEventLike) => this.handleMidiMessage(event);
    }

    this.activeDeviceName = firstDeviceName;
    if (this.onDeviceCallback) {
      this.onDeviceCallback(firstDeviceName);
    }
  }

  private handleMidiMessage(event: MidiMessageEventLike): void {
    const data = event.data;
    if (!data || data.length < 2) return;

    const status = data[0] & 0xf0;
    const noteNumber = data[1];
    const velocity = data.length > 2 ? data[2] / 127 : 0.8;

    const note = midiNumberToNote(noteNumber);

    // Note On (0x90) with velocity > 0
    if (status === 0x90 && velocity > 0) {
      synthEngine.noteOn(note, velocity);
      if (this.onNoteCallback) this.onNoteCallback(note, true);
    }
    // Note Off (0x80) or Note On with velocity == 0
    else if (status === 0x80 || (status === 0x90 && velocity === 0)) {
      synthEngine.noteOff(note);
      if (this.onNoteCallback) this.onNoteCallback(note, false);
    }
    // All Notes Off / Reset (0xB0 CC 120 or 123)
    else if (status === 0xb0 && (noteNumber === 120 || noteNumber === 123)) {
      synthEngine.releaseAll();
      if (this.onNoteCallback) this.onNoteCallback(note, false);
    }
  }

  public getActiveDevice(): string | null {
    return this.activeDeviceName;
  }
}

export const midiManager = new MidiManager();
