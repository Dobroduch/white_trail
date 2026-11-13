// Open leads, the People page, the telegram and items. All conditional on explicit story state.
// Deductions, key statements and conclusions live in caseData.js (re-exported here for older imports).
export { DEDUCTIONS, DEDUCTION_REFUSAL } from './caseData.js';

// Leads: open questions, never answers. First matching variant is shown.
export const LEADS = [
  { id: 'L_HALE', variants: [
    { if: { flag: 'foundSheriffBody' }, text: 'Who killed Sheriff Hale — and why display him like this?' },
    { if: {}, text: 'Where is Sheriff Hale? Missing three nights.' },
  ] },
  { id: 'L_CLARA', variants: [{ if: {}, text: 'Where is Clara Mercer? Nobody wants to say her name.' }] },
  { id: 'L_TELEGRAM', variants: [{ if: { evidence: 'T_FINCH_TELEGRAM' }, text: 'Did Finch send the telegram? He would not say that he did.' }] },
  { id: 'L_ROOM4', variants: [{ if: { evidence: 'HOTEL_ROOM4_BOARDS' }, text: 'Whose blood was scrubbed from the floor of Room 4?' }] },
  { id: 'L_PAPERS', variants: [{ if: { any: [{ evidence: 'T_FINCH_PAPERS' }, { evidence: 'T_FINCH_LATE' }] }, text: 'What was Hale reading at the office, those late nights?' }] },
  { id: 'L_SCREAM', variants: [{ if: { flag: 'heardScream' }, text: 'Who screamed at 02:15?' }] },
  { id: 'L_TRACKS', variants: [{ if: { evidence: 'CREEK_TRACKS' }, text: 'Who went down to the mill tonight before me?' }] },
  { id: 'L_PALE', variants: [{ if: { evidence: 'SAWMILL_LEDGER' }, text: 'What was "The Pale Order"? Who kept its accounts?' }] },
  { id: 'L_WATCH', variants: [{ if: { examined: 'SAWMILL_WATCH' }, text: 'Could a watchmaker read anything from Hale\'s broken watch?' }] },
  { id: 'L_BOOTS', variants: [{ if: { examined: 'SAWMILL_BOOTPRINTS' }, text: 'Who in Crow\'s Hollow wears cavalry-pattern riding boots?' }] },
  { id: 'L_KEPT', variants: [
    { if: { evidence: 'PIT_HOLLOW' }, text: 'Who laid Hale in the wheel pit, and who hauled him out tonight?' },
    { if: { flag: 'millKeptClosed' }, text: 'Where was Hale\'s body kept, those three nights?' },
  ] },
  { id: 'L_RIDGE', variants: [
    { if: { evidence: 'TOWER_SOOT' }, text: 'Who keeps a lantern at the telegraph tower?' },
    { if: { all: [{ flag: 'ridgeLightSeen' }, { flag: 'ch2Started' }] }, text: 'Who carried the lantern on the ridge, the night I found Hale?' },
    { if: { flag: 'ridgeLightSeen' }, text: 'Who carried the lantern on the ridge tonight?' },
    { if: { evidence: 'T_FINCH_RIDGE' }, text: 'Lights on the ridge — "old stories"?' },
  ] },
  // Chapter 2 (the second day); `chapter: 2` leads are the ones its end card lists
  { id: 'L_POWDER', chapter: 2, variants: [{ if: { examined: 'STORE_LEDGER' }, text: 'Who paid coin for forty pounds of powder, and fetched it after dark?' }] },
  { id: 'L_GRAVE', chapter: 2, variants: [{ if: { examined: 'GRAVE_DISTURBED' }, text: 'Who comes back to Amos Pell\'s grave, and when?' }] },
  { id: 'L_WIRE', chapter: 2, variants: [{ if: { examined: 'TOWER_WIRE' }, text: 'Who walked the telegraph line with cutters?' }] },
  { id: 'L_SENDER', chapter: 2, variants: [{ if: { flag: 'adaKnowsSender' }, text: 'Ada Bell knows who handed in my telegram. She would not say it up there.' }] },
  { id: 'L_WORKINGS', chapter: 2, variants: [{ if: { evidence: 'T_VALE_FIGURE' }, text: 'What is up at the old Pale workings, that a lamp keeps watch over?' }] },
];

// The People page. An entry appears once its `if` holds; `variants` give Silas's current summary, and each of
// `notes` is added once its condition holds. `portrait` is cut from the character's own in-game sprite (sheet frame
// 0, native px crop [x, y, w, h]; flipV for Hale, who is only ever seen hanging by his ankles) and shown only once
// `portrait.if` holds, i.e. once Silas has actually seen the face. Until then the page shows an empty frame.
export const PEOPLE = [
  { id: 'HALE', name: 'Sheriff Nathaniel Hale', role: 'Sheriff of Crow\'s Hollow',
    portrait: { sprite: 'hale_body', crop: [1, 24, 16, 16], flipV: true, if: { flag: 'foundSheriffBody' } },
    variants: [
      { if: { flag: 'foundSheriffBody' }, text: 'Found dead at the old sawmill, hung from the wheel frame.' },
      { if: {}, text: 'Missing three nights, per the telegram.' },
    ],
    notes: [
      { if: { evidence: 'T_FINCH_HALE' }, text: 'Went out after dark three nights ago, and did not say where. "He didn\'t always say."' },
      { if: { evidence: 'T_GABLE_HALE' }, text: 'Took his supper at the Black Ram, some nights.' },
      { if: { any: [{ evidence: 'T_FINCH_PAPERS' }, { evidence: 'T_FINCH_LATE' }] }, text: 'Kept late hours at the office before he went, over old records.' },
      { if: { examined: 'SAWMILL_BODY' }, text: 'Wounded in the side. The blood froze long before he was found.' },
    ] },
  { id: 'CLARA', name: 'Clara Mercer', role: 'Missing',
    portrait: { none: 'I have never seen her.' },
    variants: [{ if: {}, text: 'Missing, per the telegram. Of a family people here are careful about.' }],
    notes: [
      { if: { evidence: 'T_FINCH_CLARA' }, text: 'Her father, Mr. Mercer, wants it kept out of the street.' },
      { if: { evidence: 'T_GABLE_CLARA' }, text: '"Miss Mercer is a Mercer." Mrs. Gable will not discuss the family.' },
    ] },
  { id: 'FINCH', name: 'Constable Edgar Finch', role: 'Constable',
    portrait: { sprite: 'finch_idle', crop: [3, 0, 18, 18], if: { flag: 'metFinch' } },
    variants: [
      { if: { flag: 'metFinch' }, text: 'Nervous. Short on sleep. Tells it in pieces.' },
      { if: {}, text: 'Signed the telegram.' },
    ],
    notes: [
      { if: { evidence: 'T_FINCH_TELEGRAM' }, text: 'Read the telegram for a long while, and did not say he sent it.' },
      { if: { evidence: 'T_FINCH_RIDGE' }, text: 'Laughed off the talk of lights on the ridge. The laugh didn\'t take.' },
      { if: { trust: { finch: 'STEADY' } }, text: 'He has begun to trust me, a little.' },
      { if: { any: [{ trust: { finch: 'GUARDED' } }, { trust: { finch: 'COLD' } }] }, text: 'He has stopped telling me things.' },
    ] },
  { id: 'GABLE', name: 'Mrs. Gable', role: 'Keeps the Black Ram Hotel', if: { flag: 'parlorEntered' },
    portrait: { sprite: 'gable_idle', crop: [3, 0, 18, 18] },
    variants: [
      { if: { flag: 'confrontedGableRegister' }, text: 'Keeps the Black Ram. Answers exactly the question asked, and no more.' },
      { if: {}, text: 'Keeps the Black Ram Hotel. Watches everything.' },
    ],
    notes: [
      { if: { evidence: 'T_GABLE_ROOM4' }, text: 'Says a guest took ill in Room 4.' },
      { if: { evidence: 'T_GABLE_REGISTER' }, text: 'Some guests, she says, pay to be kept out of her book.' },
      { if: { evidence: 'T_GABLE_NIGHT' }, text: 'Knew at once that the scream came from the mill.' },
      { if: { evidence: 'T_GABLE_PIT' }, text: 'Knows the old mill: the race, the wheel pit.' },
    ] },
  { id: 'CONDUCTOR', name: 'The conductor', role: 'Railway conductor', if: { flag: 'introDone' },
    portrait: { sprite: 'conductor_idle', crop: [2, 0, 18, 18] },
    variants: [
      { if: { flag: 'trainDeparted' }, text: 'Gone back down the line. No return train promised.' },
      { if: {}, text: 'Brought me up the line to Blackwood. Keen to be off again.' },
    ],
    notes: [{ if: { evidence: 'T_CONDUCTOR_PASS' }, text: 'If the pass closes: three days. Could be a week.' }] },
  // Chapter 2
  { id: 'RUSK', name: 'Jonah Rusk', role: 'Keeps the general store', if: { flag: 'storeEntered' },
    portrait: { sprite: 'rusk_idle', crop: [2, 0, 18, 18] },
    variants: [
      { if: { evidence: 'T_RUSK_SCRAPED' }, text: 'Keeps the store and its accounts. Says anybody can lean on a counter.' },
      { if: {}, text: 'Keeps the general store. Watches customers the way a man watches weather.' },
    ],
    notes: [
      { if: { evidence: 'T_RUSK_FREIGHT' }, text: 'His last freight was paid in coin and fetched after dark. He does not ask men their business.' },
      { if: { evidence: 'T_RUSK_HALE' }, text: 'Hale read his freight book a fortnight before he died.' },
      { if: { flag: 'townFrightened' }, text: 'Blames me for the town bolting its doors.' },
    ] },
  { id: 'VALE', name: 'Reverend Elias Vale', role: 'Keeps the chapel', if: { flag: 'graveyardEntered' },
    portrait: { sprite: 'vale_idle', crop: [3, 0, 18, 18] },
    variants: [
      { if: { flag: 'valeEmboldened' }, text: 'Preached the Pale Figure to a full chapel at dusk, with my words for his text.' },
      { if: {}, text: 'Keeps the chapel and the burying ground. Preaches the Pale Figure every winter.' },
    ],
    notes: [
      { if: { evidence: 'T_VALE_FIGURE' }, text: 'The Figure carries a lamp on the ridge; those who follow it to the old workings do not come down.' },
      { if: { evidence: 'T_VALE_ORDER' }, text: 'Says the Order paid for Amos Pell\'s stone, "and for a great many things, then".' },
      { if: { evidence: 'T_VALE_PELL' }, text: 'Blamed the opened grave on dogs. Never once looked at it.' },
    ] },
  { id: 'ADA', name: 'Ada Bell', role: 'Telegraph operator, Blackwood Station', if: { any: [{ flag: 'towerEntered' }, { flag: 'knowsAda' }] },
    portrait: { sprite: 'ada_idle', crop: [3, 0, 18, 18], if: { flag: 'towerEntered' } },
    variants: [
      { if: { flag: 'towerEntered' }, text: 'Keeps the telegraph. Went up the line herself to see why it was dead.' },
      { if: {}, text: 'Keeps the telegraph at the station, Finch says.' },
    ],
    notes: [
      { if: { evidence: 'T_ADA_LINE' }, text: 'The line died at six the evening I came, and a mile of it is cut.' },
      { if: { flag: 'adaKnowsSender' }, text: 'Knows who handed in my telegram. Would not say, up there.' },
      { if: { flag: 'adaWarned' }, text: 'I told her to go home. "Neither is the station" safe, she said.' },
    ] },
];

export const TELEGRAM_TEXT = [
  'TO S. VANCE',
  'SHERIFF N. HALE MISSING STOP MISS CLARA MERCER ALSO MISSING STOP',
  'REQUIRE DISCREET ASSISTANCE STOP FEE ASSURED STOP',
  'COME CROWS HOLLOW VIA BLACKWOOD STATION STOP',
  'E. FINCH CONSTABLE',
];

// Every item names its inventory illustration (`icon`, 48×48 PNG; Pixelorama sources in
// assets/source/pixelorama/items/). The same objects appear in the world: LANTERN is
// characters/lantern.png, WATCH / LEDGER the sawmill pick-ups in assets/export/items/world/.
export const ITEMS = {
  TELEGRAM: { name: 'Telegram', text: 'The summons that brought me here. Signed E. Finch, Constable.', doc: 'TELEGRAM', icon: 'assets/export/items/inventory/telegram_inventory.png' },
  LANTERN: { name: 'Kerosene lantern', text: 'Brass and glass and a good wick. Oil enough for a long night. (F to light or shutter it.)', icon: 'assets/export/items/inventory/lantern_inventory.png' },
  REVOLVER: { name: 'Revolver', text: 'Single-action. Six chambers; three cartridges loaded, and no more to be had up here. I would as soon bring all three home.', revolver: true, icon: 'assets/export/items/inventory/revolver_inventory.png' },
  ROOM4_KEY: { name: 'Key to Room 4', text: 'Iron key on a brass tag stamped 4.', icon: 'assets/export/items/inventory/room4_key_inventory.png' },
  WATCH: { name: "Hale's pocket watch", text: 'Crystal smashed, hands bent. Engraved N. HALE. The works may not be ruined.', icon: 'assets/export/items/inventory/pocket_watch_inventory.png' },
  LEDGER: { name: 'Half-burned ledger', text: '"THE PALE ORDER — ACCTS." Old figures, initials, tally strokes in fives.', icon: 'assets/export/items/inventory/ledger_inventory.png' },
};
