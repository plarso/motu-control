import { MOTU_CHANNELS } from '../channels';
import type { ControllerProfile } from './types';

// One CC number per physical fader, in the same order as MOTU_CHANNELS, followed
// by the phones (monitor) fader and the main fader.
const FADER_CC_ARRAY = [16, 17, 18, 19, 3, 61, 47, 107, 7];

export const axiom61Profile: ControllerProfile = {
  id: 'axiom61',
  displayName: 'Axiom 61',

  detect(inputs) {
    const input = inputs.find((name) => name.includes('Axiom 61'));
    return input ? { input, output: null } : null;
  },

  attach({ input, client }) {
    input.on('cc', (msg) => {
      const index = FADER_CC_ARRAY.indexOf(msg.controller);
      if (index === -1) return;

      const value = Math.pow(msg.value / 127, 4);
      if (index < MOTU_CHANNELS.length) {
        client.set(`mix/chan/${MOTU_CHANNELS[index]}/matrix/fader`, value);
      } else if (index === MOTU_CHANNELS.length) {
        client.set('mix/monitor/0/matrix/fader', value);
      } else {
        client.set('mix/main/0/matrix/fader', value);
      }
    });
  },
};
