// MOTU mixer channel numbers this app controls, and their human-readable labels.
// Both controller profiles map their physical fader/button index (0-based) onto
// this array's order, so index N here corresponds to physical control N.
export const MOTU_CHANNELS = [1, 2, 4, 10, 12, 18, 20];

export const CHANNEL_LABELS: Record<number, string> = {
  1: 'MIC',
  2: 'INST',
  4: 'CAST',
  10: 'TV',
  12: 'WORK',
  18: 'OS',
  20: 'DAW',
};
