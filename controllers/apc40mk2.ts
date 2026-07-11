import midi from 'easymidi';
import { MOTU_CHANNELS, CHANNEL_LABELS } from '../channels';
import type { ControllerProfile } from './types';
import type { MotuClient } from '../motu-client';

// ─── APC40 mkII MIDI constants ───────────────────────────────────────────────
// Per-strip controls, one MIDI channel (0-6) per physical track strip:
const STRIP_FADER_CC = 7;
const STRIP_SOLO_NOTE = 49;
const STRIP_MUTE_NOTE = 50;

// Master and per-channel controls on MIDI channel 0:
const MASTER_FADER_CC = 14;
const SEND_A_BASE_CC = 48;   // Send A knobs → CCs 48–54, ch 0
const PAN_BASE_CC = 64;      // Pan knobs (when in pan bank) → CCs 64–70, ch 0
const SHIFT_NOTE = 98;       // Shift button, ch 0

// Scene launch buttons (right column), ch 0:
const SCENE_COUNT = 5;
const SCENE_BASE_NOTE = 82;  // Notes 82–86, ch 0

// ─── Grid layout ─────────────────────────────────────────────────────────────
// 5 rows × 8 cols = notes 0-39 on ch 0
// Row 0 (top) = notes 0-7, row 4 (bottom) = notes 32-39
const GRID_ROWS = 5;
const GRID_COLS = 8;
// note(row, col) where row 0 = top row of grid
const gridNote = (row: number, col: number) => row * GRID_COLS + col;

// APC40 mkII velocity → LED color (mode-dependent; these are best-effort for
// generic MIDI mode 0 and may render as brightness steps rather than distinct
// hues. Swap these constants if testing reveals better values.)
const V_OFF = 0;
const V_GREEN_DIM = 1;
const V_GREEN = 5;
const V_YELLOW = 13;
const V_ORANGE = 9;
const V_RED = 7;
const V_LEVELER = 3;    // gain-reduction column — using a different value to
                        // visually distinguish from fader meters

// ─── Fader math ──────────────────────────────────────────────────────────────
// MOTU fader: 0-4 linear (1.0 = unity gain = 0 dB)
// Physical knob: 0-127 CC. Max CC → MOTU fader 1.0 (unity), not 4 (max+12 dB)
const faderToLinear = (cc: number) => Math.pow(cc / 127, 4);
const linearToFader = (v: number) => Math.round(Math.pow(v, 0.25) * 127);

// MOTU pan: -1 (L) to 1 (R), center = 0
// CC: 0-127, center = 64
const ccToPan = (cc: number) => (cc / 127) * 2 - 1;
const panToCc = (pan: number) => Math.round(((pan + 1) / 2) * 127);

// ─── Grid display ─────────────────────────────────────────────────────────────
// The 5×8 pad grid shows a live level-meter for each channel column plus a
// leveler gain-reduction indicator in the rightmost column (col 7).
// Rows fill from the bottom; thresholds are in MOTU fader-linear units (0-4,
// but faders stay ≤1.0 at normal physical range, so thresholds reflect that).
const FADER_THRESHOLDS = [0.001, 0.25, 0.5, 0.75, 0.95]; // rows 4→0 (bottom to top)
const FADER_COLORS     = [V_GREEN_DIM, V_GREEN, V_YELLOW, V_ORANGE, V_RED];
const LEVELER_THRESHOLDS = [5, 20, 40, 65, 85]; // % gain reduction, rows 4→0

function createGridDisplay(output: midi.Output, numChannels: number) {
  // Per-column override: when a control is moved, briefly brighten the column.
  const columnOverride = new Map<number, ReturnType<typeof setTimeout>>();

  const sendNote = (row: number, col: number, velocity: number) =>
    output.send('noteon', { note: gridNote(row, col), velocity, channel: 0 });

  const renderColumn = (col: number, faderValue: number, overrideVel?: number) => {
    for (let row = 0; row < GRID_ROWS; row++) {
      const threshold = FADER_THRESHOLDS[GRID_ROWS - 1 - row];
      const vel = overrideVel ?? (faderValue >= threshold ? FADER_COLORS[GRID_ROWS - 1 - row] : V_OFF);
      sendNote(row, col, vel);
    }
  };

  const renderLevelerColumn = (reductionPct: number) => {
    const col = GRID_COLS - 1;
    for (let row = 0; row < GRID_ROWS; row++) {
      const threshold = LEVELER_THRESHOLDS[GRID_ROWS - 1 - row];
      sendNote(row, col, reductionPct >= threshold ? V_LEVELER : V_OFF);
    }
  };

  return {
    // Called ~200ms from the poll loop with latest MOTU state.
    update(faders: number[], levelerReduction: number) {
      for (let col = 0; col < numChannels; col++) {
        if (!columnOverride.has(col)) {
          renderColumn(col, faders[col]);
        }
      }
      renderLevelerColumn(levelerReduction);
    },

    // Flash a column on control change, then let the meter resume after 1.5s.
    flashColumn(col: number, faderValue: number) {
      if (col < 0 || col >= numChannels) return;
      const existing = columnOverride.get(col);
      if (existing) clearTimeout(existing);

      renderColumn(col, faderValue, V_GREEN);  // full-brightness pulse

      const timer = setTimeout(() => {
        columnOverride.delete(col);
        renderColumn(col, faderValue);
      }, 1500);
      columnOverride.set(col, timer);
    },

    // Briefly flash all columns (used for scene recall feedback).
    flashAll(velocity: number, durationMs = 150) {
      for (let note = 0; note < GRID_ROWS * GRID_COLS; note++) {
        output.send('noteon', { note, velocity, channel: 0 });
      }
      setTimeout(() => {
        // Restore will happen on next update() call — just clear overrides.
        columnOverride.clear();
      }, durationMs);
    },

    clearAll() {
      for (let note = 0; note < GRID_ROWS * GRID_COLS; note++) {
        output.send('noteon', { note, velocity: V_OFF, channel: 0 });
      }
    },
  };
}

// ─── Mute/solo LED helpers ────────────────────────────────────────────────────
function setSoloLed(output: midi.Output, stripIndex: number, on: boolean) {
  const msg = { note: STRIP_SOLO_NOTE, velocity: 127, channel: stripIndex as midi.Channel };
  on ? output.send('noteon', msg) : output.send('noteoff', msg);
}

function setMuteLed(output: midi.Output, stripIndex: number, on: boolean) {
  const msg = { note: STRIP_MUTE_NOTE, velocity: 127, channel: stripIndex as midi.Channel };
  on ? output.send('noteon', msg) : output.send('noteoff', msg);
}

// ─── Scene storage ─────────────────────────────────────────────────────────
type SceneSnapshot = {
  faders: number[];
  pans: number[];
  mutes: boolean[];
  solos: boolean[];
  auxSends: number[];
};

function createSceneManager(
  client: MotuClient,
  mutes: boolean[],
  solos: boolean[],
  output: midi.Output | null,
) {
  const scenes: Array<SceneSnapshot | null> = new Array(SCENE_COUNT).fill(null);
  const pressTimers = new Map<number, ReturnType<typeof setTimeout>>();

  const saveScene = async (slot: number) => {
    const mix = await client.get('mix') as Record<string, number>;
    scenes[slot] = {
      faders:   MOTU_CHANNELS.map(ch => mix[`/chan/${ch}/matrix/fader`] ?? 0),
      pans:     MOTU_CHANNELS.map(ch => mix[`/chan/${ch}/matrix/pan`] ?? 0),
      mutes:    [...mutes],
      solos:    [...solos],
      auxSends: MOTU_CHANNELS.map(ch => mix[`/chan/${ch}/matrix/aux/0/send`] ?? 0),
    };
    console.log(`Scene ${slot + 1} saved`);
  };

  const recallScene = async (
    slot: number,
    grid: ReturnType<typeof createGridDisplay>,
    onFaderChanged: (col: number, val: number) => void,
    onMuteChanged: (col: number, on: boolean) => void,
    onSoloChanged: (col: number, on: boolean) => void,
    onAuxChanged: (col: number, val: number) => void,
  ) => {
    const scene = scenes[slot];
    if (!scene) { console.log(`Scene ${slot + 1} is empty`); return; }

    for (let i = 0; i < MOTU_CHANNELS.length; i++) {
      const ch = MOTU_CHANNELS[i];
      client.set(`mix/chan/${ch}/matrix/fader`, scene.faders[i]);
      client.set(`mix/chan/${ch}/matrix/pan`, scene.pans[i]);
      client.set(`mix/chan/${ch}/matrix/mute`, scene.mutes[i] ? 1 : 0);
      client.set(`mix/chan/${ch}/matrix/solo`, scene.solos[i] ? 1 : 0);
      client.set(`mix/chan/${ch}/matrix/aux/0/send`, scene.auxSends[i]);

      onFaderChanged(i, scene.faders[i]);
      onMuteChanged(i, scene.mutes[i]);
      onSoloChanged(i, scene.solos[i]);
      onAuxChanged(i, scene.auxSends[i]);

      if (output) {
        setMuteLed(output, i, scene.mutes[i]);
        setSoloLed(output, i, scene.solos[i]);
        output.send('cc', { controller: SEND_A_BASE_CC + i, value: linearToFader(scene.auxSends[i]), channel: 0 });
        output.send('cc', { controller: PAN_BASE_CC + i,    value: panToCc(scene.pans[i]), channel: 0 });
      }
    }

    grid.flashAll(V_GREEN);
    console.log(`Scene ${slot + 1} recalled`);
  };

  // Long-press (≥500ms) = save; short-press = recall.
  const onPress = (note: number) => {
    const slot = note - SCENE_BASE_NOTE;
    const timer = setTimeout(() => {
      pressTimers.delete(note);
      saveScene(slot);
      // Brief grid flash to confirm save
    }, 500);
    pressTimers.set(note, timer);
  };

  const onRelease = (
    note: number,
    grid: ReturnType<typeof createGridDisplay>,
    onFaderChanged: (col: number, val: number) => void,
    onMuteChanged: (col: number, on: boolean) => void,
    onSoloChanged: (col: number, on: boolean) => void,
    onAuxChanged: (col: number, val: number) => void,
  ) => {
    const slot = note - SCENE_BASE_NOTE;
    const timer = pressTimers.get(note);
    if (timer !== undefined) {
      clearTimeout(timer);
      pressTimers.delete(note);
      // Short press → recall
      recallScene(slot, grid, onFaderChanged, onMuteChanged, onSoloChanged, onAuxChanged);
    }
    // If no timer, the 500ms already elapsed → save already happened
  };

  return { onPress, onRelease };
}

// ─── Profile ──────────────────────────────────────────────────────────────────
export const apc40Mk2Profile: ControllerProfile = {
  id: 'apc40mk2',
  displayName: 'APC40 mkII',

  detect(inputs, outputs) {
    const input = inputs.find((name) => name.includes('APC40'));
    if (!input) return null;
    const output = outputs.find((name) => name.includes('APC40')) ?? null;
    return { input, output };
  },

  attach({ input, output, client }) {
    if (!output) {
      console.warn('APC40 mkII: no output port – all LED/grid feedback disabled');
    }

    const N = MOTU_CHANNELS.length;  // 7 channels

    // ── Local state ────────────────────────────────────────────────────────
    const mutes  = new Array<boolean>(N).fill(false);
    const solos  = new Array<boolean>(N).fill(false);
    const faders = new Array<number>(N).fill(0);
    const auxSends = new Array<number>(N).fill(0);
    let shiftHeld = false;

    // ── Grid display ───────────────────────────────────────────────────────
    const grid = output ? createGridDisplay(output, N) : null;

    // ── Scene manager ──────────────────────────────────────────────────────
    const scenes = output
      ? createSceneManager(
          client, mutes, solos, output,
        )
      : null;

    // ── Startup sync from MOTU ─────────────────────────────────────────────
    client.get('mix').then((mix) => {
      const m = mix as Record<string, number>;
      MOTU_CHANNELS.forEach((ch, i) => {
        mutes[i]    = !!m[`/chan/${ch}/matrix/mute`];
        solos[i]    = !!m[`/chan/${ch}/matrix/solo`];
        faders[i]   = m[`/chan/${ch}/matrix/fader`] ?? 0;
        auxSends[i] = m[`/chan/${ch}/matrix/aux/0/send`] ?? 0;

        if (!output) return;
        setMuteLed(output, i, mutes[i]);
        setSoloLed(output, i, solos[i]);
        // Restore knob positions to match current MOTU state
        output.send('cc', { controller: SEND_A_BASE_CC + i, value: linearToFader(auxSends[i]), channel: 0 });
        output.send('cc', { controller: PAN_BASE_CC + i,    value: panToCc(m[`/chan/${ch}/matrix/pan`] ?? 0), channel: 0 });
      });
    });

    // ── Live grid meter ────────────────────────────────────────────────────
    // Poll the cached client state every 200ms and refresh the grid.
    // client.get() is synchronous against the local cache – no extra HTTP.
    if (grid) {
      setInterval(async () => {
        const mix = await client.get('mix') as Record<string, number>;
        const liveFaders = MOTU_CHANNELS.map(ch => mix[`/chan/${ch}/matrix/fader`] ?? 0);
        // mix keys are relative to 'mix/', so leveler key is '/main/0/leveler/reduction'
        const levelerReduction = mix['/main/0/leveler/reduction'] ?? 0;
        grid.update(liveFaders, levelerReduction);
      }, 200);
    }

    // ── MIDI input handlers ────────────────────────────────────────────────
    input.on('cc', (msg) => {
      const ch0 = msg.channel === 0;

      // Channel faders
      if (msg.controller === STRIP_FADER_CC && msg.channel < N) {
        const i = msg.channel;
        faders[i] = faderToLinear(msg.value);
        client.set(`mix/chan/${MOTU_CHANNELS[i]}/matrix/fader`, faders[i]);
        grid?.flashColumn(i, faders[i]);
        return;
      }

      // Phones fader (8th strip, beyond our N channels)
      if (msg.controller === STRIP_FADER_CC && msg.channel === N) {
        client.set('mix/monitor/0/matrix/fader', faderToLinear(msg.value));
        return;
      }

      // Master fader
      if (ch0 && msg.controller === MASTER_FADER_CC) {
        client.set('mix/main/0/matrix/fader', faderToLinear(msg.value));
        return;
      }

      // Send A knobs (CCs 48–54, ch 0).
      // While Shift is held → pan control; otherwise → aux 0 send.
      if (ch0 && msg.controller >= SEND_A_BASE_CC && msg.controller < SEND_A_BASE_CC + N) {
        const i = msg.controller - SEND_A_BASE_CC;
        if (shiftHeld) {
          const pan = ccToPan(msg.value);
          client.set(`mix/chan/${MOTU_CHANNELS[i]}/matrix/pan`, pan);
          console.log(`${CHANNEL_LABELS[MOTU_CHANNELS[i]]} pan: ${Math.round(pan * 100)}%`);
        } else {
          auxSends[i] = faderToLinear(msg.value);
          client.set(`mix/chan/${MOTU_CHANNELS[i]}/matrix/aux/0/send`, auxSends[i]);
          grid?.flashColumn(i, faders[i]);
        }
        return;
      }

      // Pan knobs natively (CCs 64–70, ch 0) — active when APC is in pan bank.
      if (ch0 && msg.controller >= PAN_BASE_CC && msg.controller < PAN_BASE_CC + N) {
        const i = msg.controller - PAN_BASE_CC;
        const pan = ccToPan(msg.value);
        client.set(`mix/chan/${MOTU_CHANNELS[i]}/matrix/pan`, pan);
        console.log(`${CHANNEL_LABELS[MOTU_CHANNELS[i]]} pan: ${Math.round(pan * 100)}%`);
        return;
      }
    });

    input.on('noteon', (msg) => {
      const ch0 = msg.channel === 0;

      // Shift held
      if (ch0 && msg.note === SHIFT_NOTE) {
        shiftHeld = true;
        return;
      }

      // Scene launch buttons (short/long-press logic in sceneManager)
      if (ch0 && msg.note >= SCENE_BASE_NOTE && msg.note < SCENE_BASE_NOTE + SCENE_COUNT) {
        scenes?.onPress(msg.note);
        return;
      }

      // Solo toggle (per-strip)
      if (msg.note === STRIP_SOLO_NOTE && msg.channel < N) {
        const i = msg.channel;
        solos[i] = !solos[i];
        client.set(`mix/chan/${MOTU_CHANNELS[i]}/matrix/solo`, solos[i] ? 1 : 0);
        if (output) setSoloLed(output, i, solos[i]);
        return;
      }

      // Mute toggle (per-strip)
      if (msg.note === STRIP_MUTE_NOTE && msg.channel < N) {
        const i = msg.channel;
        mutes[i] = !mutes[i];
        client.set(`mix/chan/${MOTU_CHANNELS[i]}/matrix/mute`, mutes[i] ? 1 : 0);
        if (output) setMuteLed(output, i, mutes[i]);
        return;
      }
    });

    input.on('noteoff', (msg) => {
      const ch0 = msg.channel === 0;

      // Shift released
      if (ch0 && msg.note === SHIFT_NOTE) {
        shiftHeld = false;
        return;
      }

      // Scene button release → recall (if short-press) or no-op (if long-press already saved)
      if (ch0 && msg.note >= SCENE_BASE_NOTE && msg.note < SCENE_BASE_NOTE + SCENE_COUNT) {
        scenes?.onRelease(
          msg.note,
          grid!,
          (col, val) => { faders[col] = val; },
          (col, on)  => { mutes[col]  = on;  },
          (col, on)  => { solos[col]  = on;  },
          (col, val) => { auxSends[col] = val; },
        );
        return;
      }

      // Solo/mute are now toggles — no action needed on release.
    });
  },
};
