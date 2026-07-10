import midi from 'easymidi';
import type { ControllerProfile, DetectedPorts } from './types';
import { axiom61Profile } from './axiom61';
import { apc40Mk2Profile } from './apc40mk2';

const PROFILES: ControllerProfile[] = [apc40Mk2Profile, axiom61Profile];

export function detectControllerProfile(): { profile: ControllerProfile; ports: DetectedPorts } | null {
  const inputs = midi.getInputs();
  const outputs = midi.getOutputs();

  console.log('Available MIDI inputs:', inputs);
  console.log('Available MIDI outputs:', outputs);

  for (const profile of PROFILES) {
    const ports = profile.detect(inputs, outputs);
    if (ports) return { profile, ports };
  }

  return null;
}

export { PROFILES };
export type { ControllerProfile, DetectedPorts };
