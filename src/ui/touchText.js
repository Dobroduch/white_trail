// Tutorial and hint text names keyboard keys ("F — lantern", "Notebook (N)"). With the touch controls on,
// the same sentences name the on-screen buttons instead. Only presentation changes; the data stays as written.
const EXACT = {
  'A / D or arrows — walk.   E — examine, speak.   N — notebook.   M — map.':
    'Hold ◀ ▶ to walk, or tap the ground.   The hand button examines and speaks.   Notebook and map: top right.',
};
const RULES = [
  [/F — light the lantern\./g, 'Tap the lantern button.'],
  [/F — lantern\./g, 'The lantern button.'],
  [/\b(N|n)otebook \(N\)/g, (m, n) => `${n}otebook (top right)`],
  [/\(walk up to him and press E\)/g, '(walk up to him and tap the hand button)'],
  [/press E\b/g, 'tap the hand button'],
  [/In the notebook press C/g, 'In the notebook tap Review case'],
  [/press C\b/g, 'tap Review case'],
  [/E on it to choose/g, 'tap it again to choose'],
  [/E to choose/g, 'Tap it again to choose'],
  [/\bH — /g, ''],
  [/E \(or C anywhere in the notebook\) to review the case and decide\./g, 'Tap it again (or Review case, below) to review the case and decide.'],
  [/C reviews the case/g, 'Review case (below) reviews it'],
];
export function touchify(s) {
  if (typeof s !== 'string') return s;
  if (EXACT[s]) return EXACT[s];
  let out = s;
  for (const [re, to] of RULES) out = out.replace(re, to);
  return out;
}
