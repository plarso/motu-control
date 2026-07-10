import midi from 'easymidi';
import { createMotuClient } from './motu-client';
import { MOTU_CHANNELS, CHANNEL_LABELS } from './channels';
import { detectControllerProfile } from './controllers';
import { retryUntilSuccess } from './retry';

async function main() {
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

  // Retries with backoff instead of exiting, so starting at login before the
  // controller is plugged in/enumerated doesn't just crash the process.
  const { profile, ports } = await retryUntilSuccess(() => {
    const detected = detectControllerProfile();
    if (!detected) {
      throw new Error(
        `No supported MIDI controller found (looked for Axiom 61 and APC40 mkII). ` +
          `Available inputs: ${JSON.stringify(midi.getInputs())}, outputs: ${JSON.stringify(midi.getOutputs())}`
      );
    }
    return detected;
  }, { label: 'Controller detection' });

  console.log(
    `Detected controller: ${profile.displayName} (input: "${ports.input}"` +
      (ports.output ? `, output: "${ports.output}")` : ')')
  );

  const input = new midi.Input(ports.input);
  const output = ports.output ? new midi.Output(ports.output) : null;

  profile.attach({ input, output, client });
}

main();
