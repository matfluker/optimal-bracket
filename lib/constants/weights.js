// lib/constants/weights.js
//
// ─── DATA SIGNAL BLEND WEIGHTS ────────────────────────────────────────────────
//
// These control how much each prediction source contributes to the final
// "data signal" that gets compared against Yahoo public pick percentages.
//
// EvanMiya and KenPom are both strong analytical models, blended 50/50.
// Weights are automatically normalized in the algorithm — they don't need
// to sum to 1.0 but they do here for clarity.

export const DATA_WEIGHTS = {
  evanmiya: 0.50,
  kenpom:   0.50,
}
