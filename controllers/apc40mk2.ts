import midi from 'easymidi';
import { MOTU_CHANNELS } from '../channels';
import type { ControllerProfile } from './types';

// Each of the 8 channel strips sends its fader on this CC, one MIDI channel per strip
// (channel index 0-6 -> MOTU_CHANNELS, channel index 7 -> phones/monitor).
const CHANNEL_FADER_CONTROLLER_VALUE = 7;
// The master fader sends on MIDI channel 0 with this CC instead.
const MAIN_FADER_CONTROLLER_VALUE = 14;
// Per-channel-strip pan/send knob, one MIDI channel per strip, used here for aux send 0.
const AUX_CONTROLLER_VALUE = 48;
const SOLO_NOTE = 49;
const MUTE_NOTE = 50;

const faderToLinear = (value: number) => Math.pow(value / 127, 4);
const linearToFader = (value: number) => Math.pow(value, 0.25) * 127;

// Renders a 0-100 percentage as a two-digit readout across the 5x8 RGB pad grid
// (channel 0, notes 0-39), clearing itself after a couple of seconds of inactivity.
function createDigitalReadout(output: midi.Output) {
  const digitMap: Record<number, number[]> = {
    0: [0, 1, 2, 8, 10, 16, 18, 24, 26, 32, 33, 34],
    1: [2, 10, 18, 26, 34],
    2: [0, 1, 2, 8, 16, 17, 18, 26, 32, 33, 34],
    3: [0, 1, 2, 10, 17, 18, 26, 32, 33, 34],
    4: [2, 10, 16, 17, 18, 24, 26, 32, 34],
    5: [0, 1, 2, 10, 16, 17, 18, 24, 32, 33, 34],
    6: [0, 1, 2, 8, 10, 16, 17, 18, 24, 32, 33, 34],
    7: [1, 9, 17, 26, 32, 33, 34],
    8: [0, 1, 2, 8, 10, 16, 17, 18, 24, 26, 32, 33, 34],
    9: [0, 1, 2, 10, 16, 17, 18, 24, 26, 32, 33, 34],
  };
  const secondDigitMap: Record<number, number[]> = {
    0: [4, 5, 6, 12, 14, 20, 22, 28, 30, 36, 37, 38],
    1: [4, 12, 20, 28, 36],
    2: [4, 5, 6, 12, 20, 21, 22, 30, 36, 37, 38],
    3: [4, 5, 6, 14, 21, 22, 30, 36, 37, 38],
    4: [6, 14, 20, 21, 22, 28, 30, 36, 38],
    5: [4, 5, 6, 14, 20, 21, 22, 28, 36, 37, 38],
    6: [4, 5, 6, 12, 14, 20, 21, 22, 28, 36, 37, 38],
    7: [5, 13, 21, 30, 36, 37, 38],
    8: [4, 5, 6, 12, 14, 20, 21, 22, 28, 30, 36, 37, 38],
    9: [4, 5, 6, 14, 20, 21, 22, 28, 30, 36, 37, 38],
  };

  let clearTimer: NodeJS.Timeout | null = null;

  const setAll = (velocity: number) => {
    for (let note = 0; note < 40; note++) {
      output.send('noteon', { note, velocity, channel: 0 });
    }
  };

  return (volPercent: number) => {
    if (clearTimer) clearTimeout(clearTimer);

    setAll(0);

    if (volPercent === 100) {
      setAll(10);
    } else {
      const firstDigit = Math.floor(volPercent / 10);
      const secondDigit = volPercent % 10;
      digitMap[firstDigit]?.forEach((note) => output.send('noteon', { note, velocity: 1, channel: 0 }));
      secondDigitMap[secondDigit]?.forEach((note) => output.send('noteon', { note, velocity: 1, channel: 0 }));
    }

    clearTimer = setTimeout(() => setAll(0), 2000);
  };
}

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
      console.warn('APC40 mkII: no MIDI output port found - LED/digital-readout feedback disabled');
    }
    const updateDigitalReadout = output ? createDigitalReadout(output) : () => {};

    // Sync solo/mute LEDs and the aux-send knob position from the MOTU's current state.
    client.get('mix').then((mix) => {
      const mixRecord = mix as Record<string, any>;
      MOTU_CHANNELS.forEach((motuChannel, index) => {
        const soloValue = mixRecord[`/chan/${motuChannel}/matrix/solo`];
        const muteValue = mixRecord[`/chan/${motuChannel}/matrix/mute`];
        const auxValue = mixRecord[`/chan/${motuChannel}/matrix/aux/0/send`];

        if (!output) return;
        const soloMsg = { note: SOLO_NOTE, velocity: 127, channel: index as midi.Channel };
        const muteMsg = { note: MUTE_NOTE, velocity: 127, channel: index as midi.Channel };
        soloValue ? output.send('noteon', soloMsg) : output.send('noteoff', soloMsg);
        muteValue ? output.send('noteon', muteMsg) : output.send('noteoff', muteMsg);
        if (typeof auxValue === 'number') {
          output.send('cc', { controller: AUX_CONTROLLER_VALUE + index, value: linearToFader(auxValue), channel: 0 });
        }
      });
    });

    input.on('cc', (msg) => {
      const volPercent = Math.round((msg.value / 127) * 100);

      if (msg.controller === CHANNEL_FADER_CONTROLLER_VALUE && msg.channel < MOTU_CHANNELS.length) {
        client.set(`mix/chan/${MOTU_CHANNELS[msg.channel]}/matrix/fader`, faderToLinear(msg.value));
        updateDigitalReadout(volPercent);
      } else if (msg.controller === CHANNEL_FADER_CONTROLLER_VALUE && msg.channel === MOTU_CHANNELS.length) {
        // PHONES
        client.set('mix/monitor/0/matrix/fader', faderToLinear(msg.value));
        updateDigitalReadout(volPercent);
      } else if (msg.channel === 0 && msg.controller === MAIN_FADER_CONTROLLER_VALUE) {
        client.set('mix/main/0/matrix/fader', faderToLinear(msg.value));
        updateDigitalReadout(volPercent);
      } else if (
        msg.channel === 0 &&
        msg.controller >= AUX_CONTROLLER_VALUE &&
        msg.controller < AUX_CONTROLLER_VALUE + MOTU_CHANNELS.length
      ) {
        const motuChannel = MOTU_CHANNELS[msg.controller - AUX_CONTROLLER_VALUE];
        client.set(`mix/chan/${motuChannel}/matrix/aux/0/send`, faderToLinear(msg.value));
        updateDigitalReadout(volPercent);
      }
    });

    input.on('noteon', (msg) => {
      if (msg.channel >= MOTU_CHANNELS.length) return;
      const motuChannel = MOTU_CHANNELS[msg.channel];
      if (msg.note === SOLO_NOTE) client.set(`mix/chan/${motuChannel}/matrix/solo`, 1);
      else if (msg.note === MUTE_NOTE) client.set(`mix/chan/${motuChannel}/matrix/mute`, 1);
    });

    // Freely cycles the RGB pad grid's color on each press - a scratch pad for
    // exploring the grid, not tied to any MOTU state.
    const padVelocities = new Map<number, number>();

    input.on('noteoff', (msg) => {
      if (msg.channel < MOTU_CHANNELS.length) {
        const motuChannel = MOTU_CHANNELS[msg.channel];
        if (msg.note === SOLO_NOTE) client.set(`mix/chan/${motuChannel}/matrix/solo`, 0);
        else if (msg.note === MUTE_NOTE) client.set(`mix/chan/${motuChannel}/matrix/mute`, 0);
      }

      if (output && msg.channel === 0 && msg.note >= 0 && msg.note <= 39) {
        const velocity = padVelocities.get(msg.note) ?? 1;
        output.send('noteon', { note: msg.note, velocity, channel: 0 });
        padVelocities.set(msg.note, velocity + 1 > 127 ? 0 : velocity + 1);
      }
    });
  },
};
