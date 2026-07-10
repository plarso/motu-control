import midi from 'easymidi';
import { createMotuClient } from './motu-client';
import { MOTU_CHANNELS, CHANNEL_LABELS } from './channels';
import { detectControllerProfile } from './controllers';

const labels: Record<string, string> = {
  'mix/monitor/0/matrix/fader': 'PHONES',
  'mix/main/0/matrix/fader': 'MAIN',
};
MOTU_CHANNELS.forEach((motuChannel) => {
  labels[`mix/chan/${motuChannel}/matrix/fader`] = CHANNEL_LABELS[motuChannel];
});

const client = createMotuClient({ labels });

client.get('uid').then((uid) => {
  console.log('UID:', uid);
});

const detected = detectControllerProfile();
if (!detected) {
  console.error('No supported MIDI controller found (looked for Axiom 61 and APC40 mkII).');
  console.error('Available inputs:', midi.getInputs());
  console.error('Available outputs:', midi.getOutputs());
  process.exit(1);
}

const { profile, ports } = detected;
console.log(
  `Detected controller: ${profile.displayName} (input: "${ports.input}"` +
    (ports.output ? `, output: "${ports.output}")` : ')')
);

const input = new midi.Input(ports.input);
const output = ports.output ? new midi.Output(ports.output) : null;

profile.attach({ input, output, client });
