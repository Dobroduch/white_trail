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
  { id: 'L_WORKINGS', chapter: 2, variants: [
    { if: { flag: 'chapter3Complete' }, text: 'What is the lantern climbing to, up at the old workings?' },
    { if: { evidence: 'T_VALE_FIGURE' }, text: 'What is up at the old Pale workings, that a lamp keeps watch over?' },
  ] },
  // Chapter 3 (the third day and night)
  { id: 'L3_KILLER', chapter: 3, variants: [{ if: { evidence: 'T3_GABLE_STAIR' }, text: 'Who came up the back stair after Hale?' }] },
  { id: 'L3_GUEST', chapter: 3, variants: [
    { if: { evidence: 'EV3_GLOVE' }, text: 'Whose glove was on the service stair? A "C" on the back.' },
    { if: { evidence: 'T3_GABLE_STAIR' }, text: 'Who was the woman in Room 4, off the book?' },
  ] },
  { id: 'L3_FORM', chapter: 3, variants: [{ if: { examined: 'EV3_PAD' }, text: 'Who tore form 41 from Finch\'s signed pad?' }] },
  { id: 'L3_COFFEE', chapter: 3, variants: [{ if: { flag: 'woke3' }, text: 'Who put me to sleep, and who came for the note?' }] },
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
      { if: { evidence: 'T3_MERCER' }, text: 'Her father: "She has a temper and a good horse. She will come home."' },
      { if: { evidence: 'EV3_GLOVE' }, text: 'A grey kid glove on the service stair behind Room 4, a "C" on the back. Not proof of anything. Not nothing.' },
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
      { if: { flag: 'adaKnowsSender' }, text: 'Ada Bell writes down who hands in every telegram. She would not tell me it was him.' },
      { if: { seen: 'FINCH_OFFICE.watch' }, text: 'It was him at the cabin window, the night I came. His office.' },
      { if: { evidence: 'T3_FINCH_FORMS' }, text: 'Signed a whole pad of telegraph forms in advance, for Hale.' },
      { if: { flag: 'finchForm41' }, text: 'Form 41 is gone from the pad. He knew, and did not let himself wonder who.' },
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
      { if: { all: [{ evidence: 'T_GABLE_ROOM4' }, { evidence: 'HOTEL_REGISTER' }] }, text: 'Her own register has nobody in Room 4 for a fortnight.' },
      { if: { evidence: 'T_GABLE_REGISTER' }, text: 'Some guests, she says, pay to be kept out of her book.' },
      { if: { evidence: 'T_GABLE_NIGHT' }, text: 'Knew at once that the scream came from the mill.' },
      { if: { evidence: 'T_GABLE_PIT' }, text: 'Knows the old mill: the race, the wheel pit.' },
      { if: { evidence: 'T3_GABLE_STAIR' }, text: 'Kept a woman in Room 4, off the book. "She paid in more than money."' },
      { if: { evidence: 'EV3_NOTE' }, text: 'Was told by a note under her door to clean the room and say a guest took ill.' },
      { if: { flag: 'gableGlove' }, text: '"Put that away. Please." Frightened, and not for herself.' },
      { if: { evidence: 'ROOM4_RUG' }, text: 'While I was out, somebody laid a rug over the scrubbed boards in my room.' },
      { if: { flag: 'askedGableRug' }, text: '"The floors are cold in the mornings." She did not look up from her book.' },
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
      { if: { evidence: 'EV3_TIN' }, text: 'Sold the Black Ram a new tin of coffee the afternoon I was put to sleep.' },
    ] },
  { id: 'VALE', name: 'Reverend Elias Vale', role: 'Keeps the chapel', if: { flag: 'graveyardEntered' },
    portrait: { sprite: 'vale_idle', crop: [3, 0, 18, 18] },
    variants: [
      { if: { flag: 'valeEmboldened' }, text: 'Preached the Pale Figure to a full chapel at dusk, with my words for his text.' },
      { if: {}, text: 'Keeps the chapel and the burying ground. Preaches the Pale Figure every winter.' },
    ],
    notes: [
      { if: { evidence: 'T_GABLE_VALE' }, text: 'Preaches the Pale Figure every winter, Mrs. Gable says, "and it fills his pews".' },
      { if: { evidence: 'T_VALE_FIGURE' }, text: 'The Figure carries a lamp on the ridge; those who follow it to the old workings do not come down.' },
      { if: { evidence: 'T_VALE_ORDER' }, text: 'Says the Order paid for Amos Pell\'s stone, "and for a great many things, then".' },
      { if: { evidence: 'T_VALE_PELL' }, text: 'Blamed the opened grave on dogs. Never once looked at it.' },
      { if: { flag: 'burialDone' }, text: 'Lost his place at Hale\'s graveside, and found it again, lower.' },
    ] },
  { id: 'ADA', name: 'Ada Bell', role: 'Telegraph operator, Blackwood Station', if: { any: [{ flag: 'towerEntered' }, { flag: 'knowsAda' }] },
    portrait: { sprite: 'ada_idle', crop: [3, 0, 18, 18], if: { flag: 'towerEntered' } },
    variants: [
      { if: { flag: 'towerEntered' }, text: 'Keeps the telegraph. Went up the line herself to see why it was dead.' },
      { if: {}, text: 'Keeps the telegraph at the station, Finch says.' },
    ],
    notes: [
      { if: { evidence: 'T_ADA_LINE' }, text: 'The line died at six the evening I came, and a mile of it is cut.' },
      { if: { evidence: 'T_ADA_TELEGRAM' }, text: '"I write down who hands it in." She would not say who handed in mine.' },
      { if: { flag: 'adaWarned' }, text: 'I told her to go home. "Neither is the station" safe, she said.' },
    ] },
  // Chapter 3
  { id: 'MERCER', name: 'Gideon Mercer', role: 'Clara\'s father; the town\'s money', if: { flag: 'burialDone' },
    portrait: { sprite: 'mercer_idle', crop: [3, 0, 18, 18] },
    variants: [
      { if: { evidence: 'T3_MERCER' }, text: 'Pays for the sheriff\'s stone and most other things. Courteous, and watching.' },
      { if: {}, text: 'Clara\'s father. Stood apart at Hale\'s grave and watched me, not the coffin.' },
    ],
    notes: [
      { if: { evidence: 'T3_MERCER' }, text: 'Speaks of Clara as if she were late for supper.' },
      { if: { seen: 'MERCER.hale' }, text: 'Hale "didn\'t know when to leave old things alone."' },
      { if: { seen: 'MERCER.order' }, text: 'The Order was "a mining company. I lost money in it like everyone else."' },
      { if: { seen: 'MERCER.bye' }, text: '"Find anything else, and you\'ll find this a small town."' },
      { if: { evidence: 'EV3_HEEL' }, text: 'Wears riding boots: a narrow heel, a long straight sole.' },
    ] },
];

// The Case page's opening lines: what the mystery is, as Silas would put it now. First matching variant is shown.
export const CASE_SUMMARY = [
  { if: { flag: 'chapter3Complete' }, text: 'Three nights in. I think I know where Hale died. Somebody put me to sleep to take a note back, and a lantern is climbing to the old workings.' },
  { if: { flag: 'ch3Night' }, text: 'The third night. The note is in my coat, the fire is down, and I am sitting up with the stair behind Room 4.' },
  { if: { flag: 'ch3Started' }, text: 'The third day. Hale is buried at noon. Whatever happened in Room 4 happened under this roof, and somebody here knows exactly what.' },
  { if: { flag: 'chapter2Complete' }, text: 'Two days in. Hale is dead, Clara Mercer is still missing, and the valley is shut in with whoever is behind it.' },
  { if: { flag: 'ch2Started' }, text: 'The second day. The pass is shut and the telegraph is dead. Somebody in Crow\'s Hollow is still busy with the Pale Order\'s old business.' },
  { if: { flag: 'sliceComplete' }, text: 'The first night is over. Sheriff Hale is dead. Clara Mercer is still missing, and nobody will say her name.' },
  { if: { flag: 'foundSheriffBody' }, text: 'Sheriff Hale is dead, hung by his ankles from the old mill wheel. The town will have a story for it by morning. I need my own first.' },
  { if: {}, text: 'A telegram brought me up the line to Crow\'s Hollow: the sheriff gone three nights, and a girl gone with him that nobody will name.' },
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
  BUTTON: { name: 'Brass button', text: 'A sheriff\'s-pattern coat button, a star struck in the brass. Threads torn, not cut, still in the shank. It was under the bed in Room 4.', icon: 'assets/export/items/inventory/brass_button_inventory.png' },
  GABLE_NOTE: { name: 'Note in block capitals', text: '"CLEAN IT. A GUEST TOOK ILL. OR THE RAM BURNS." Under it, five strokes struck through. Pushed under Mrs. Gable\'s door the morning after.', icon: 'assets/export/items/inventory/gable_note_inventory.png' },
  GLOVE: { name: 'Grey kid glove', text: 'A woman\'s glove, soft grey kid, a small hand. A "C" worked on the back in grey silk. It was on the service stair behind Room 4.', icon: 'assets/export/items/inventory/grey_glove_inventory.png' },
  LEDGER: { name: 'Half-burned ledger', text: '"THE PALE ORDER — ACCTS." Old figures, initials, tally strokes in fives.', icon: 'assets/export/items/inventory/ledger_inventory.png' },
};
