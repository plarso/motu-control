import midi from 'easymidi'
import { createMotuClient } from "./motu-client";


const client = createMotuClient({
  labels: {
    'mix/chan/1/matrix/fader': 'MIC',
    'mix/chan/2/matrix/fader': 'INST',
    'mix/chan/4/matrix/fader': 'CAST',
    'mix/chan/10/matrix/fader': 'TV',
    'mix/chan/12/matrix/fader': 'WORK',
    'mix/chan/18/matrix/fader': 'OS',
    'mix/chan/20/matrix/fader': 'DAW',
    'mix/monitor/1/matrix/fader': 'PHONES',
    'mix/main/0/matrix/fader': 'MAIN',
  }
});

console.log('MIDI inputs:', midi.getInputs())
const MIDI_INPUT = 'Axiom 61 Axiom USB In';
const FADER_CC_ARRAY = [16, 17, 18, 19, 3, 61, 47, 107, 7]

const input = new midi.Input(MIDI_INPUT);
input.on('cc', (msg) => {
  if (msg.controller === FADER_CC_ARRAY[0]) {
    // MIC
    client.set('mix/chan/1/matrix/fader', Math.pow(msg.value / 127, 4));
  } else if (msg.controller === FADER_CC_ARRAY[1]) {
    // INST
    client.set('mix/chan/2/matrix/fader', Math.pow(msg.value / 127, 4));
  } else if (msg.controller === FADER_CC_ARRAY[2]) {
    // CAST
    client.set('mix/chan/4/matrix/fader', Math.pow(msg.value / 127, 4));
  } else if (msg.controller === FADER_CC_ARRAY[3]) {
    // TV
    client.set('mix/chan/10/matrix/fader', Math.pow(msg.value / 127, 4));
  } else if (msg.controller === FADER_CC_ARRAY[4]) {
    // WORK
    client.set('mix/chan/12/matrix/fader', Math.pow(msg.value / 127, 4));
  } else if (msg.controller === FADER_CC_ARRAY[5]) {
    // OS
    client.set('mix/chan/18/matrix/fader', Math.pow(msg.value / 127, 4));
  } else if (msg.controller === FADER_CC_ARRAY[6]) {
    // DAW
    client.set('mix/chan/20/matrix/fader', Math.pow(msg.value / 127, 4));
  } else if (msg.controller === FADER_CC_ARRAY[7]) {
    // PHONES
    client.set('mix/monitor/0/matrix/fader', Math.pow(msg.value / 127, 4));
  } else if (msg.controller === FADER_CC_ARRAY[8]) {
    // MAIN
    client.set('mix/main/0/matrix/fader', Math.pow(msg.value / 127, 4));
  }
});
