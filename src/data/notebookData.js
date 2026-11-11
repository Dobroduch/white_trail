// Deduction rules, open leads, case people and timeline. All conditional on explicit story state.

// A deduction forms only from an authored pair of records. Several pairs may support the same
// conclusion (alternative evidence routes). Wrong pairs get a restrained refusal.
export const DEDUCTIONS = {
  D_SCENE_ARRANGED: {
    title: 'The scene was arranged',
    pairs: [['SAWMILL_BODY', 'SAWMILL_DRAG'], ['SAWMILL_BODY', 'SAWMILL_ROPE']],
    text: 'Too little blood beneath him for where he hangs — and the rest of the scene shows labour: a body brought up from the creek along the ground, a rope hauled over a beam and tied off. Hale did not die where he hangs. Whatever the display is meant to say, hands made it.',
    limits: 'Who did this, and why they wanted him seen this way, the evidence does not yet say.',
  },
  D_SAME_COUNTING: {
    title: 'The same counting',
    pairs: [['SAWMILL_MARKS', 'SAWMILL_LEDGER']],
    text: 'The strokes cut into the post are grouped the way the tallies run down the burned ledger\'s columns. Whoever carved them knew those books — or wanted the finder to think of them.',
    limits: 'What the marks count, I cannot yet read.',
  },
  D_UNWRITTEN_GUEST: {
    title: 'An unwritten guest',
    pairs: [['T_GABLE_ROOM4', 'HOTEL_REGISTER']],
    text: 'Mrs. Gable says a guest took ill in Room 4. Her own register shows no one in Room 4 for a fortnight. Either the guest was kept off the books, or there was no guest at all.',
    limits: 'Whose blood was scrubbed from the floor, and why it was hidden, remains open.',
  },
};

export const DEDUCTION_REFUSAL = 'The evidence does not establish that.';

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
  { id: 'L_RIDGE', variants: [
    { if: { flag: 'ridgeLightSeen' }, text: 'Who carried the lantern on the ridge tonight?' },
    { if: { evidence: 'T_FINCH_RIDGE' }, text: 'Lights on the ridge — "old stories"?' },
  ] },
];

// People section of the case file.
export const PEOPLE = [
  { id: 'HALE', name: 'Sheriff Nathaniel Hale', variants: [
    { if: { flag: 'foundSheriffBody' }, text: 'Found dead at the old sawmill, hung from the wheel frame.' },
    { if: {}, text: 'Missing three nights, per the telegram.' },
  ] },
  { id: 'CLARA', name: 'Clara Mercer', variants: [{ if: {}, text: 'Missing, per the telegram. Of a family people here are careful about.' }] },
  { id: 'FINCH', name: 'Constable Edgar Finch', variants: [
    { if: { flag: 'metFinch' }, text: 'Nervous. Short on sleep. Tells it in pieces.' },
    { if: {}, text: 'Signed the telegram.' },
  ] },
  { id: 'GABLE', name: 'Mrs. Gable', if: { flag: 'hasRoom4Key' }, variants: [
    { if: { flag: 'confrontedGableRegister' }, text: 'Keeps the Black Ram. Answers exactly the question asked, and no more.' },
    { if: {}, text: 'Keeps the Black Ram Hotel. Watches everything.' },
  ] },
  { id: 'CONDUCTOR', name: 'The conductor', if: { flag: 'talkedConductor' }, variants: [{ if: {}, text: 'Gone back down the line. No return train promised.' }] },
];

export const TELEGRAM_TEXT = [
  'TO S. VANCE',
  'SHERIFF N. HALE MISSING STOP MISS CLARA MERCER ALSO MISSING STOP',
  'REQUIRE DISCREET ASSISTANCE STOP FEE ASSURED STOP',
  'COME CROWS HOLLOW VIA BLACKWOOD STATION STOP',
  'E. FINCH CONSTABLE',
];

export const ITEMS = {
  TELEGRAM: { name: 'Telegram', text: 'The summons that brought me here. Signed E. Finch, Constable.', doc: 'TELEGRAM' },
  LANTERN: { name: 'Kerosene lantern', text: 'Brass and glass and a good wick. Oil enough for a long night. (F to light or shutter it.)' },
  REVOLVER: { name: 'Revolver', text: 'Single-action. Six chambers; three cartridges loaded, and no more to be had up here. I would as soon bring all three home.', revolver: true },
  ROOM4_KEY: { name: 'Key to Room 4', text: 'Iron key on a brass tag stamped 4.' },
  WATCH: { name: "Hale's pocket watch", text: 'Crystal smashed, hands bent. Engraved N. HALE. The works may not be ruined.' },
  LEDGER: { name: 'Half-burned ledger', text: '"THE PALE ORDER — ACCTS." Old figures, initials, tally strokes in fives.' },
};
