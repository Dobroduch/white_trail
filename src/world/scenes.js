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
  // (the investigation hints the player can ask for with H are in data/hints.js; this one is the notebook tutorial)
  // Chapter 2: once the day's core finds are made (the ledger, the grave, the wire), the light starts to go
  // Chapter 3: the coat looked at, Hale buried, Mrs. Gable's note in hand: the light goes
  // Chapter 4: Cutler's book read and Ada's book seen: the storm comes on
  { id: 'CH4_DUSK', if: { all: [{ flag: 'ch4Started' }, { notFlag: 'ch4DuskReady' }, { examined: 'EV4_TALLY' }, { evidence: 'EV4_ADA_BOOK' }] }, delay: 2, script: 'CH4_DUSK' },
  { id: 'CH3_DUSK', if: { all: [{ flag: 'ch3Started' }, { notFlag: 'ch3DuskReady' }, { examined: 'EV3_COAT' }, { flag: 'burialDone' }, { evidence: 'EV3_NOTE' }] }, delay: 2, script: 'CH3_DUSK' },
  { id: 'CH2_DUSK', if: { all: [{ flag: 'ch2Started' }, { notFlag: 'ch2DuskReady' }, { evidence: 'STORE_LEDGER' }, { examined: 'GRAVE_DISTURBED' }, { examined: 'TOWER_WIRE' }] }, delay: 2, script: 'CH2_DUSK' },
];
