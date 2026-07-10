import midi from 'easymidi';
import type { MotuClient } from '../motu-client';

export interface DetectedPorts {
  input: string;
  output: string | null;
}

export interface ControllerContext {
  input: midi.Input;
  output: midi.Output | null;
  client: MotuClient;
}

export interface ControllerProfile {
  id: string;
  displayName: string;
  // Given the raw MIDI port names currently visible on the system, return the
  // ports this profile should use, or null if this profile's hardware isn't connected.
  detect(inputs: string[], outputs: string[]): DetectedPorts | null;
  // Wire up MIDI <-> MOTU handling for this controller once its ports are open.
  attach(ctx: ControllerContext): void;
}
