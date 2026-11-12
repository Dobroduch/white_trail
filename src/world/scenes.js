// Scene definitions: geometry, exits, characters, interactables, lights, weather, and story events.
// Phase-specific overrides live under `night` and are merged when state.phase === 'NIGHT'.

export const SCENES = {
  // Every scene is authored in Tiled (assets/levels/*.tmj), registered in tiled/levelList.js.

};

// Global events checked in any scene.
export const GLOBAL_EVENTS = [
  { id: 'DEDUCTION_HINT', if: { all: [{ notFlag: 'deductionHintShown' }, { any: [
    { all: [{ evidence: 'SAWMILL_BODY' }, { evidence: 'SAWMILL_DRAG' }] },
    { all: [{ evidence: 'SAWMILL_BODY' }, { evidence: 'SAWMILL_ROPE' }] },
    { all: [{ evidence: 'SAWMILL_MARKS' }, { evidence: 'SAWMILL_LEDGER' }] },
    { all: [{ evidence: 'T_GABLE_ROOM4' }, { evidence: 'HOTEL_REGISTER' }] },
  ] }, { noDeductions: true }] }, delay: 2.5, script: 'DEDUCTION_HINT' },
];
