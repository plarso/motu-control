import midi from 'easymidi'
import { createMotuClient } from "./motu-client";
import { isJsxAttribute } from 'typescript';


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
const MIDI_INPUT = 'APC40 mkII'; // Axiom 61 Axiom USB In';
const MIDI_OUTPUT = 'APC40 mkII'; // Axiom 61 Axiom USB Out';
//const FADER_CC_ARRAY = [16, 17, 18, 19, 3, 61, 47, 107, 7]
const MOTU_CHANNELS = [1, 2, 4, 10, 12, 18, 20];
const AKAI_CHANNELS = [0, 1, 2, 3, 4, 5, 6];
const AUX_CONTROLLER_MAP = {
  1: 48,
  2: 49,
  4: 50,
  10: 51,
  12: 52,
  18: 53,
  20: 54
};
const CHANNEL_FADER_CONTROLLER_VALUE = 7;
const MAIN_FADER_CONTROLLER_VALUE = 14;
const output = new midi.Output(MIDI_OUTPUT);

let digitalReadoutTimeout: NodeJS.Timeout | null = null;

function updateDigitalReadout(output: any, volPercent: number) {
  // Clear the timeout to prevent turning off the notes if the function is called again
  if (digitalReadoutTimeout) {
    clearTimeout(digitalReadoutTimeout);
  }

  // Clear the digital readout by setting the velocity to 0 for all notes
  for (let i = 0; i < 40; i++) {
    output.send('noteon', {
      note: i,
      velocity: 0,
      channel: 0
    });
  }

  // If volPercent is 100, light up all notes
  if (volPercent === 100) {
    for (let i = 0; i < 40; i++) {
      output.send('noteon', {
        note: i,
        velocity: 95,
        channel: 0
      });
    }
  } else {
    // Create maps for the first and second digits
    const digitMap = {
      0: [0, 1, 2, 8, 10, 16, 18, 24, 26, 32, 33, 34],
      1: [2, 10, 18, 26, 34],
      2: [0, 1, 2, 8, 16, 17, 18, 26, 32, 33, 34],
      3: [0, 1, 2, 10, 17, 18, 26, 32, 33, 34],
      4: [2, 10, 16, 17, 18, 24, 26, 32, 34],
      5: [0, 1, 2, 10, 16, 17, 18, 24, 32, 33, 34],
      6: [0, 1, 2, 8, 10, 16, 17, 18, 24, 32, 33, 34],
      7: [1, 9, 17, 26, 32, 33, 34],
      8: [0, 1, 2, 8, 10, 16, 17, 18, 24, 26, 32, 33, 34],
      9: [0, 1, 2, 10, 16, 17, 18, 24, 26, 32, 33, 34]
    };

    const secondDigitMap = {
      0: [4, 5, 6, 12, 14, 20, 22, 28, 30, 36, 37, 38],
      1: [4, 12, 20, 28, 36],
      2: [4, 5, 6, 12, 20, 21, 22, 30, 36, 37, 38],
      3: [4, 5, 6, 14, 21, 22, 30, 36, 37, 38],
      4: [6, 14, 20, 21, 22, 28, 30, 36, 38],
      5: [4, 5, 6, 14, 20, 21, 22, 28, 36, 37, 38],
      6: [4, 5, 6, 12, 14, 20, 21, 22, 28, 36, 37, 38],
      7: [5, 13, 21, 30, 36, 37, 38],
      8: [4, 5, 6, 12, 14, 20, 21, 22, 28, 30, 36, 37, 38],
      9: [4, 5, 6, 14, 20, 21, 22, 28, 30, 36, 37, 38]
    };

    // Calculate the first and second digits
    const firstDigit = Math.floor(volPercent / 10);
    const secondDigit = volPercent % 10;

    // Set the first digit
    const firstDigitNotes = digitMap[firstDigit as keyof typeof digitMap];
    firstDigitNotes.forEach((note) => {
      output.send('noteon', {
        note: note,
        velocity: 95,
        channel: 0
      });
    });

    // Set the second digit
    const secondDigitNotes = secondDigitMap[secondDigit as keyof typeof secondDigitMap];
    secondDigitNotes.forEach((note) => {
      output.send('noteon', {
        note: note,
        velocity: 95,
        channel: 0
      });
    });
  }

  // Set a timeout to turn off all notes after 3 seconds of inactivity
  digitalReadoutTimeout = setTimeout(() => {
    for (let i = 0; i < 40; i++) {
      output.send('noteon', {
        note: i,
        velocity: 0,
        channel: 0
      });
    }
    console.log('Digital readout turned off due to inactivity.');
  }, 2000);
}

console.log('MIDI inputs:', midi.getInputs())
client.get('uid').then((uid) => {
  console.log('UID:', uid);
});
// client.get(`avb/${uid}/current_configuration`).then((current_config) => {
//   console.log('CurrentConfig:', current_config);
// });
client.get(`mix`).then((current_config) => {
  console.log('CurrentConfig:', current_config);
  MOTU_CHANNELS.forEach((MOTU_CHANNEL, index) => {
    const soloValue = (current_config as Record<string, any>)[`/chan/${MOTU_CHANNEL}/matrix/solo`];
    const muteValue = (current_config as Record<string, any>)[`/chan/${MOTU_CHANNEL}/matrix/mute`];
    const aux0Value = (current_config as Record<string, any>)[`/chan/${MOTU_CHANNEL}/matrix/aux/0/send`];
    console.log(`Channel ${MOTU_CHANNEL} Solo Value:`, soloValue);
    if (soloValue === 1) {
      console.log(`Channel ${MOTU_CHANNEL} is soloed`);
      output.send('noteon', {
        note: 49,
        velocity: 127,
        channel: index as midi.Channel
      });
    } else if (soloValue === 0) {
      console.log(`Channel ${MOTU_CHANNEL} is not soloed`);
      output.send('noteoff', {
        note: 49,
        velocity: 127,
        channel: index as midi.Channel
      });
    }

    // same as above but for mute
    console.log(`Channel ${MOTU_CHANNEL} Mute Value:`, muteValue);
    if (muteValue === 1) {
      console.log(`Channel ${MOTU_CHANNEL} is muted`);
      output.send('noteon', {
        note: 50,
        velocity: 127,
        channel: index as midi.Channel
      });
    } else if (muteValue === 0) {
      console.log(`Channel ${MOTU_CHANNEL} is not muted`);
      output.send('noteoff', {
        note: 50,
        velocity: 127,
        channel: index as midi.Channel
      });
    }

    console.log(`Channel ${MOTU_CHANNEL} Aux 0 Value:`, aux0Value);
    output.send('cc', {
      controller: AUX_CONTROLLER_MAP[MOTU_CHANNEL as keyof typeof AUX_CONTROLLER_MAP],
      value: Math.pow(aux0Value, .25) * 127,
      channel: 0
    });
  });

  // const soloValue = (current_config as Record<string, any>)['/chan/1/matrix/solo'];
  // console.log('Channel 1 Solo Value:', soloValue);
  // if (soloValue === 1) {
  //   console.log('MIC is soloed');
  //   output.send('noteon',  {
  //     // Log all MIDI events
  //     note: 49,
  //     velocity: 127,
  //     channel: 0
  //   });
  // }
});

// console.log('Mix config:', mix_config);




const input = new midi.Input(MIDI_INPUT);
// input.on('cc', (msg) => {
//   // Log all MIDI events
//   console.log(`Received MIDI Event - ${JSON.stringify(msg)}`);
//   if (msg.controller === CHANNEL_FADER_CONTROLLER_VALUE) {
//     // MIC
//     client.set('mix/chan/1/matrix/fader', Math.pow(msg.value / 127, 4));
//   } else if (msg.controller === MAIN_FADER_CONTROLLER_VALUE) {
//     // INST
//     client.set('mix/chan/2/matrix/fader', Math.pow(msg.value / 127, 4));
//   } else if (msg.controller === FADER_CC_ARRAY[2]) {
//     // CAST
//     client.set('mix/chan/4/matrix/fader', Math.pow(msg.value / 127, 4));
//   } else if (msg.controller === FADER_CC_ARRAY[3]) {
//     // TV
//     client.set('mix/chan/10/matrix/fader', Math.pow(msg.value / 127, 4));
//   } else if (msg.controller === FADER_CC_ARRAY[4]) {
//     // WORK
//     client.set('mix/chan/12/matrix/fader', Math.pow(msg.value / 127, 4));
//   } else if (msg.controller === FADER_CC_ARRAY[5]) {
//     // OS
//     client.set('mix/chan/18/matrix/fader', Math.pow(msg.value / 127, 4));
//   } else if (msg.controller === FADER_CC_ARRAY[6]) {
//     // DAW
//     client.set('mix/chan/20/matrix/fader', Math.pow(msg.value / 127, 4));
//   } else if (msg.controller === FADER_CC_ARRAY[7]) {
//     // PHONES
//     client.set('mix/monitor/0/matrix/fader', Math.pow(msg.value / 127, 4));
//   } else if (msg.controller === FADER_CC_ARRAY[8]) {
//     // MAIN
//     client.set('mix/main/0/matrix/fader', Math.pow(msg.value / 127, 4));
//   }
// });

input.on('cc', (msg) => {
  // Log all MIDI events
  console.log(`Received cc Event - ${JSON.stringify(msg)}`);
  if (msg.channel === 0 && msg.controller === CHANNEL_FADER_CONTROLLER_VALUE) {
    // MIC
    client.set('mix/chan/1/matrix/fader', Math.pow(msg.value / 127, 4));
    const volPercent = Math.round((msg.value / 127) * 100);
    console.log(`Fader Value: ${volPercent}%`);
    updateDigitalReadout(output, volPercent);
    // // print the fader volPercent value to the rgb button array as a digital readout where the channel is always 0, velocity is the color (we can use 95 for now), and the note is the array index
    // // first digit array is like the following:
    // // [32,33,34]
    // // [24,25,26]
    // // [16,17,18]
    // // [8,9,10]
    // // [0,1,2]
    // // second digit array is like the following:
    // // [36,37,38]
    // // [28,29,30]
    // // [20,21,22]
    // // [12,13,14]
    // // [4,5,6]
    // // first clear the digital readout by setting the velocity to 0 for all notes
    // for (let i = 0; i < 40; i++) {
    //   output.send('noteon', {
    //     note: i,
    //     velocity: 0,
    //     channel: 0
    //   });
    // }
    // // set the first digit
    // const firstDigit = Math.floor(volPercent / 10);
    // const secondDigit = volPercent % 10;
    // // set the first digit
    // // now send the noteon messages for the first digit where the first digit is visually represented on the RGB button array
    // // to represent 0, we need to light up the 0, 1, 2, 8, 10, 16, 18, 24, 26, 32, 33, 34 notes
    // // to represent 1, we need to light up the 2, 10, 18, 26, 34 notes
    // // to represent 2, we need to light up the 0, 1, 2, 8, 16, 17, 18, 26, 32, 33, 34 notes
    // // to represent 3, we need to light up the 0, 1, 2, 10, 17, 18, 26, 32, 33, 34 notes
    // // to represent 4, we need to light up the 2, 10, 16, 17, 18, 24, 26, 32, 34 notes
    // // to represent 5, we need to light up the 0, 1, 2, 10, 16, 17, 18, 24, 32, 33, 34 notes
    // // to represent 6, we need to light up the 0, 1, 2, 8, 10, 16, 17, 18, 24, 32, 33, 34 notes
    // // to represent 7, we need to light up the 1, 9, 17, 26, 32, 33, 34 notes
    // // to represent 8, we need to light up the 0, 1, 2, 8, 10, 16, 17, 18, 24, 26, 32, 33, 34 notes
    // // to represent 9, we need to light up the 0, 1, 2, 10, 16, 17, 18, 24, 26, 32, 33, 34 notes
    // // create a map of the digits to the notes
    // const digitMap = {
    //   0: [0, 1, 2, 8, 10, 16, 18, 24, 26, 32, 33, 34],
    //   1: [2, 10, 18, 26, 34],
    //   2: [0, 1, 2, 8, 16, 17, 18, 26, 32, 33, 34],
    //   3: [0, 1, 2, 10, 17, 18, 26, 32, 33, 34],
    //   4: [2, 10, 16, 17, 18, 24, 26, 32, 34],
    //   5: [0, 1, 2, 10, 16, 17, 18, 24, 32, 33, 34],
    //   6: [0, 1, 2, 8, 10, 16, 17, 18, 24, 32, 33, 34],
    //   7: [1, 9, 17, 26, 32, 33, 34],
    //   8: [0, 1, 2, 8, 10, 16, 17, 18, 24, 26, 32, 33, 34],
    //   9: [0, 1, 2, 10, 16, 17, 18, 24, 26, 32, 33, 34]
    // };
    // // set the first digit
    // const firstDigitNotes = digitMap[firstDigit as keyof typeof digitMap];
    // firstDigitNotes.forEach((note) => {
    //   output.send('noteon', {
    //     note: note,
    //     velocity: 95,
    //     channel: 0
    //   });
    // });
    // //create a map of the second digit to the notes
    // const secondDigitMap = {
    //   0: [4, 5, 6, 12, 14, 20, 22, 28, 30, 36, 37, 38],
    //   1: [4, 12, 20, 28, 36],
    //   2: [4, 5, 6, 12, 20, 21, 22, 30, 36, 37, 38],
    //   3: [4, 5, 6, 14, 21, 22, 30, 36, 37, 38],
    //   4: [6, 14, 20, 21, 22, 28, 30, 36, 38],
    //   5: [4, 5, 6, 14, 20, 21, 22, 28, 36, 37, 38],
    //   6: [4, 5, 6, 12, 14, 20, 21, 22, 28, 36, 37, 38],
    //   7: [5, 13, 21, 30, 36, 37, 38],
    //   8: [4, 5, 6, 12, 14, 20, 21, 22, 28, 30, 36, 37, 38],
    //   9: [4, 5, 6, 14, 20, 21, 22, 28, 30, 36, 37, 38]
    // };
    // // set the second digit
    // const secondDigitNotes = secondDigitMap[secondDigit as keyof typeof secondDigitMap];
    // secondDigitNotes.forEach((note) => {
    //   output.send('noteon', {
    //     note: note,
    //     velocity: 95,
    //     channel: 0
    //   });
    // });

  } else if (msg.channel === 1 && msg.controller === CHANNEL_FADER_CONTROLLER_VALUE) {
    // INST
    client.set('mix/chan/2/matrix/fader', Math.pow(msg.value / 127, 4));
    const volPercent = Math.round((msg.value / 127) * 100);
    console.log(`Fader Value: ${volPercent}%`);
    updateDigitalReadout(output, volPercent);
  } else if (msg.channel === 2 && msg.controller === CHANNEL_FADER_CONTROLLER_VALUE) {
    // CAST
    client.set('mix/chan/4/matrix/fader', Math.pow(msg.value / 127, 4));
    const volPercent = Math.round((msg.value / 127) * 100);
    console.log(`Fader Value: ${volPercent}%`);
    updateDigitalReadout(output, volPercent);
  } else if (msg.channel === 3 && msg.controller === CHANNEL_FADER_CONTROLLER_VALUE) {
    // TV
    client.set('mix/chan/10/matrix/fader', Math.pow(msg.value / 127, 4));
    const volPercent = Math.round((msg.value / 127) * 100);
    console.log(`Fader Value: ${volPercent}%`);
    updateDigitalReadout(output, volPercent);
  } else if (msg.channel === 4 && msg.controller === CHANNEL_FADER_CONTROLLER_VALUE) {
    // WORK
    client.set('mix/chan/12/matrix/fader', Math.pow(msg.value / 127, 4));
    const volPercent = Math.round((msg.value / 127) * 100);
    console.log(`Fader Value: ${volPercent}%`);
    updateDigitalReadout(output, volPercent);
  } else if (msg.channel === 5 && msg.controller === CHANNEL_FADER_CONTROLLER_VALUE) {
    // OS
    client.set('mix/chan/18/matrix/fader', Math.pow(msg.value / 127, 4));
    const volPercent = Math.round((msg.value / 127) * 100);
    console.log(`Fader Value: ${volPercent}%`);
    updateDigitalReadout(output, volPercent);
  } else if (msg.channel === 6 && msg.controller === CHANNEL_FADER_CONTROLLER_VALUE) {
    // DAW
    client.set('mix/chan/20/matrix/fader', Math.pow(msg.value / 127, 4));
    const volPercent = Math.round((msg.value / 127) * 100);
    console.log(`Fader Value: ${volPercent}%`);
    updateDigitalReadout(output, volPercent);
  } else if (msg.channel === 7 && msg.controller === CHANNEL_FADER_CONTROLLER_VALUE) {
    // PHONES
    client.set('mix/monitor/0/matrix/fader', Math.pow(msg.value / 127, 4));
    const volPercent = Math.round((msg.value / 127) * 100);
    console.log(`Fader Value: ${volPercent}%`);
    updateDigitalReadout(output, volPercent);
  } else if (msg.channel === 0 && msg.controller === MAIN_FADER_CONTROLLER_VALUE) {
    // MAIN
    client.set('mix/main/0/matrix/fader', Math.pow(msg.value / 127, 4));
    const volPercent = Math.round((msg.value / 127) * 100);
    console.log(`Fader Value: ${volPercent}%`);
    updateDigitalReadout(output, volPercent);
  //aux 1-2 levels
  } else if (msg.channel === 0 && msg.controller === 48) {
    // MIC
    client.set('mix/chan/1/matrix/aux/0/send', Math.pow(msg.value / 127, 4));
    const volPercent = Math.round((msg.value / 127) * 100);
    console.log(`Aux Pot Value: ${volPercent}%`);
    updateDigitalReadout(output, volPercent);
  } else if (msg.channel === 0 && msg.controller === 49) {
    // INST
    client.set('mix/chan/2/matrix/aux/0/send', Math.pow(msg.value / 127, 4));
    const volPercent = Math.round((msg.value / 127) * 100);
    console.log(`Aux Pot Value: ${volPercent}%`);
    updateDigitalReadout(output, volPercent);
  } else if (msg.channel === 0 && msg.controller === 50) {
    // CAST
    client.set('mix/chan/4/matrix/aux/0/send', Math.pow(msg.value / 127, 4));
    const volPercent = Math.round((msg.value / 127) * 100);
    console.log(`Aux Pot Value: ${volPercent}%`);
    updateDigitalReadout(output, volPercent);
  } else if (msg.channel === 0 && msg.controller === 51) {
    // TV
    client.set('mix/chan/10/matrix/aux/0/send', Math.pow(msg.value / 127, 4));
    const volPercent = Math.round((msg.value / 127) * 100);
    console.log(`Aux Pot Value: ${volPercent}%`);
    updateDigitalReadout(output, volPercent);
  } else if (msg.channel === 0 && msg.controller === 52) {
    // WORK
    client.set('mix/chan/12/matrix/aux/0/send', Math.pow(msg.value / 127, 4));
    const volPercent = Math.round((msg.value / 127) * 100);
    console.log(`Aux Pot Value: ${volPercent}%`);
    updateDigitalReadout(output, volPercent);
  } else if (msg.channel === 0 && msg.controller === 53) {
    // OS
    client.set('mix/chan/18/matrix/aux/0/send', Math.pow(msg.value / 127, 4));
    const volPercent = Math.round((msg.value / 127) * 100);
    console.log(`Aux Pot Value: ${volPercent}%`);
    updateDigitalReadout(output, volPercent);
  } else if (msg.channel === 0 && msg.controller === 54) {
    // DAW
    client.set('mix/chan/20/matrix/aux/0/send', Math.pow(msg.value / 127, 4));
    const volPercent = Math.round((msg.value / 127) * 100);
    console.log(`Aux Pot Value: ${volPercent}%`);
    updateDigitalReadout(output, volPercent);
  }
});


// noteon actions
input.on('noteon', (msg) => {
  // Log all MIDI events
  console.log(`Received noteon Event - ${JSON.stringify(msg)}`);
  // solo actions
  if (msg.channel === 0 && msg.note === 49) {
    // MIC
    client.set('mix/chan/1/matrix/solo', 1);
  } else if (msg.channel === 1 && msg.note === 49) {
    // INST
    client.set('mix/chan/2/matrix/solo', 1);
  } else if (msg.channel === 2 && msg.note === 49) {
    // CAST
    client.set('mix/chan/4/matrix/solo', 1);
  } else if (msg.channel === 3 && msg.note === 49) {
    // TV
    client.set('mix/chan/10/matrix/solo', 1);
  } else if (msg.channel === 4 && msg.note === 49) {
    // WORK
    client.set('mix/chan/12/matrix/solo', 1);
  } else if (msg.channel === 5 && msg.note === 49) {
    // OS
    client.set('mix/chan/18/matrix/solo', 1);
  } else if (msg.channel === 6 && msg.note === 49) {
    // DAW
    client.set('mix/chan/20/matrix/solo', 1);
  // mute actions
  } else if (msg.channel === 0 && msg.note === 50) {
    // MIC
    client.set('mix/chan/1/matrix/mute', 1);
  } else if (msg.channel === 1 && msg.note === 50) {
    // INST
    client.set('mix/chan/2/matrix/mute', 1);
  } else if (msg.channel === 2 && msg.note === 50) {
    // CAST
    client.set('mix/chan/4/matrix/mute', 1);
  } else if (msg.channel === 3 && msg.note === 50) {
    // TV
    client.set('mix/chan/10/matrix/mute', 1);
  } else if (msg.channel === 4 && msg.note === 50) {
    // WORK
    client.set('mix/chan/12/matrix/mute', 1);
  } else if (msg.channel === 5 && msg.note === 50) {
    // OS
    client.set('mix/chan/18/matrix/mute', 1);
  } else if (msg.channel === 6 && msg.note === 50) {
    // DAW
    client.set('mix/chan/20/matrix/mute', 1);
  }
});

// Create a map to store note and velocity values for the RGB button playground
const RGBNoteVelocityMap = new Map<number, number>();

input.on('noteoff', (msg) => {
  // Log all MIDI events
  console.log(`Received noteoff Event - ${JSON.stringify(msg)}`);
  if (msg.channel === 0 && msg.note === 49) {
    // MIC
    client.set('mix/chan/1/matrix/solo', 0);
  } else if (msg.channel === 1 && msg.note === 49) {
    // INST
    client.set('mix/chan/2/matrix/solo', 0);
  } else if (msg.channel === 2 && msg.note === 49) {
    // CAST
    client.set('mix/chan/4/matrix/solo', 0);
  } else if (msg.channel === 3 && msg.note === 49) {
    // TV
    client.set('mix/chan/10/matrix/solo', 0);
  } else if (msg.channel === 4 && msg.note === 49) {
    // WORK
    client.set('mix/chan/12/matrix/solo', 0);
  } else if (msg.channel === 5 && msg.note === 49) {
    // OS
    client.set('mix/chan/18/matrix/solo', 0);
  } else if (msg.channel === 6 && msg.note === 49) {
    // DAW
    client.set('mix/chan/20/matrix/solo', 0);
  // mute actions
  } else if (msg.channel === 0 && msg.note === 50) {
    // MIC
    client.set('mix/chan/1/matrix/mute', 0);
  } else if (msg.channel === 1 && msg.note === 50) {
    // INST
    client.set('mix/chan/2/matrix/mute', 0);
  } else if (msg.channel === 2 && msg.note === 50) {
    // CAST
    client.set('mix/chan/4/matrix/mute', 0);
  } else if (msg.channel === 3 && msg.note === 50) {
    // TV
    client.set('mix/chan/10/matrix/mute', 0);
  } else if (msg.channel === 4 && msg.note === 50) {
    // WORK
    client.set('mix/chan/12/matrix/mute', 0);
  } else if (msg.channel === 5 && msg.note === 50) {
    // OS
    client.set('mix/chan/18/matrix/mute', 0);
  } else if (msg.channel === 6 && msg.note === 50) {
    // DAW
    client.set('mix/chan/20/matrix/mute', 0);
  }

  //RGB button pad playground
  if (msg.channel === 0 && msg.note >= 0 && msg.note <= 39) {
    const note = msg.note;

    // Get the current velocity for the note from the map, default to 0 if not present
    let velocity = RGBNoteVelocityMap.get(note) || 1;

    // Send the MIDI noteon message with the updated velocity
    output.send('noteon', {
      note: note,
      velocity: velocity,
      channel: 0
    });

    // Increment the velocity and wrap around if it exceeds 127
    velocity = velocity + 1;
    if (velocity > 127) {
      velocity = 0;
    }

    // Update the map with the new velocity value
    RGBNoteVelocityMap.set(note, velocity);
    // console.log(`Note ${note} velocity: ${velocity}`);
    // // Log the entire map
    // console.log('RGBNoteVelocityMap:', RGBNoteVelocityMap);
  }
});

input.on('poly aftertouch', (msg) => {
  // Log all MIDI events
  console.log(`Received poly aftertouch Event - ${JSON.stringify(msg)}`);
});

input.on('program', (msg) => {
  // Log all MIDI events
  console.log(`Received program Event - ${JSON.stringify(msg)}`);
});isJsxAttribute

input.on('channel aftertouch', (msg) => {
  // Log all MIDI events
  console.log(`Received channel aftertouch Event - ${JSON.stringify(msg)}`);
});

input.on('pitch', (msg) => {
  // Log all MIDI events
  console.log(`Received pitch Event - ${JSON.stringify(msg)}`);
});

input.on('position', (msg) => {
  // Log all MIDI events
  console.log(`Received position Event - ${JSON.stringify(msg)}`);
});

input.on('mtc', (msg) => {
  // Log all MIDI events
  console.log(`Received mtc Event - ${JSON.stringify(msg)}`);
});

input.on('select', (msg) => {
  // Log all MIDI events
  console.log(`Received select Event - ${JSON.stringify(msg)}`);
});

// input.on('clock', (msg) => {
//   // Log all MIDI events
//   console.log(`Received clock Event - ${JSON.stringify(msg)}`);
// });

// input.on('start', (msg) => {
//   // Log all MIDI events
//   console.log(`Received start Event - ${JSON.stringify(msg)}`);
// });

// input.on('continue', (msg) => {
//   // Log all MIDI events
//   console.log(`Received continue Event - ${JSON.stringify(msg)}`);
// });

// input.on('stop', (msg) => {
//   // Log all MIDI events
//   console.log(`Received stop Event - ${JSON.stringify(msg)}`);
// });

// input.on('activesense', (msg) => {
//   // Log all MIDI events
//   console.log(`Received activesense Event - ${JSON.stringify(msg)}`);
// });

// input.on('reset', (msg) => {
//   // Log all MIDI events
//   console.log(`Received reset Event - ${JSON.stringify(msg)}`);
// });

input.on('sysex', (msg) => {
  // Log all MIDI events
  console.log(`Received sysex Event - ${JSON.stringify(msg)}`);
});

// output.send('noteon',  {
//   // Log all MIDI events
//   note: 0,
//   velocity: 95,
//   channel: 0
// });

// output.send('noteon',  {
//   // Log all MIDI events
//   note: 8,
//   velocity: 96,
//   channel: 0
// });

// output.send('noteon',  {
//   // Log all MIDI events
//   note: 16,
//   velocity: 97,
//   channel: 0
// });

// output.send('noteon',  {
//   // Log all MIDI events
//   note: 24,
//   velocity: 98,
//   channel: 0
// });

// output.send('noteon',  {
//   // Log all MIDI events
//   note: 32,
//   velocity: 99,
//   channel: 0
// });

// output.send('noteon',  {
//   // Log all MIDI events
//   note: 17,
//   velocity: 100,
//   channel: 0
// });

// output.send('noteon',  {
//   // Log all MIDI events
//   note: 34,
//   velocity: 101,
//   channel: 0
// });

// output.send('noteon',  {
//   // Log all MIDI events
//   note: 26,
//   velocity: 102,
//   channel: 0
// });

// output.send('noteon',  {
//   // Log all MIDI events
//   note: 18,
//   velocity: 103,
//   channel: 0
// });

// output.send('noteon',  {
//   // Log all MIDI events
//   note: 10,
//   velocity: 104,
//   channel: 0
// });

// output.send('noteon',  {
//   // Log all MIDI events
//   note: 2,
//   velocity: 105,
//   channel: 0
// });

// output.send('noteon',  {
//   // Log all MIDI events
//   note: 36,
//   velocity: 106,
//   channel: 0
// });

// output.send('noteon',  {
//   // Log all MIDI events
//   note: 28,
//   velocity: 107,
//   channel: 0
// });

// output.send('noteon',  {
//   // Log all MIDI events
//   note: 20,
//   velocity: 108,
//   channel: 0
// });

// output.send('noteon',  {
//   // Log all MIDI events
//   note: 12,
//   velocity: 109,
//   channel: 0
// });

// output.send('noteon',  {
//   // Log all MIDI events
//   note: 4,
//   velocity: 110,
//   channel: 0
// });

// output.send('noteon',  {
//   // Log all MIDI events
//   note: 38,
//   velocity: 111,
//   channel: 0
// });

// output.send('noteon',  {
//   // Log all MIDI events
//   note: 30,
//   velocity: 112,
//   channel: 0
// });

// output.send('noteon',  {
//   // Log all MIDI events
//   note: 22,
//   velocity: 113,
//   channel: 0
// });

// output.send('noteon',  {
//   // Log all MIDI events
//   note: 6,
//   velocity: 114,
//   channel: 0
// });

