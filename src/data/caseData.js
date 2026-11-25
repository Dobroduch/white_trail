// The case-solving data: questions, the short clues (key statements) the notebook shows, deductions (each the
// answer to a question Silas asks himself, formed from an authored pair of clues, most with two plausible readings),
// and the conclusions those readings can add up to. All of it is conditional on explicit story state; the rules
// live in systems/caseSystem.js.
//
// The flow, after the Sherlock Holmes games, kept deliberately small on the page:
//   evidence (journal records) ─► clues (one short entry per discovery, merged, per question)
//   a clue raises a question (`ask`: an open thread on the Deductions board) ─► connect the clue that answers it
//   ─► deduction: an established fact ─► choose one of its readings (interpretations; some appear only once the
//   evidence that suggests them has been found: reading.if) ─► the readings add up to a conclusion ─► commit to one.
// Evidence that does not make a clue of its own is filed under the clue it belongs to (`also`) and read there.
// The same deductions support several conclusions; small details in dialogue and the scenes (listed as `details`)
// bear on which reading holds. Nothing in the UI says which conclusion is true while the player is deciding:
// `truth` is read only after commitment, by the aftermath.

// ---------------- questions ----------------
// `case` marks a question that can be closed by committing to a conclusion. Questions without one stay open (their
// statements and deductions are still worked on the same page) until a later chapter extends them.
export const QUESTIONS = [
  { id: 'Q_HALE', case: 'HALE', title: 'What happened to Sheriff Hale?', short: 'The sheriff', if: { flag: 'foundSheriffBody' } },
  // Room 4 is worked on from the first night, but it is settled (a case) only on the third day (caseIf)
  { id: 'Q_ROOM4', case: 'ROOM4', caseIf: { flag: 'ch3Started' }, title: 'Whose blood was scrubbed from Room 4?', short: 'Room 4', if: { evidence: 'HOTEL_ROOM4_BOARDS' } },
  // Chapter 2, the second day
  { id: 'Q_ORDER', case: 'ORDER', title: 'What is the Pale Order doing now?', short: 'The Order, now', if: { flag: 'ch2Started' } },
  // Chapter 3, the third night (open: carried into the next chapter)
  { id: 'Q_COFFEE', title: 'Who put me to sleep, and why?', short: 'The coffee', if: { flag: 'woke3' } },
  // Chapter 4, the fourth day
  { id: 'Q_KILLER', case: 'KILLER', title: 'Who came up the stair after Hale?', short: 'The killer', if: { flag: 'ch4Started' } },
  { id: 'Q_TELEGRAM', title: 'Who sent for me?', short: 'The telegram', if: { flag: 'ch4Started' } },
];

// ---------------- key statements ----------------
// A statement is known when its `if` holds, or (without `if`) when any of its `sources` has been recorded. `sources`
// are the journal records it was drawn from (overlapping records are merged into one statement); `variants` give the
// first text whose condition holds. `label` is the short list name.
export const STATEMENTS = {
  // --- Q_HALE ---
  S_MISSING: { q: 'Q_HALE', label: 'Gone three nights', text: 'Hale went out after dark three nights ago and did not come back.', sources: ['T_FINCH_HALE', 'ROAD_NOTICE', 'T_GABLE_HALE'], also: ['T_FINCH_PAPERS', 'T_FINCH_LATE'] },
  S_LITTLE_BLOOD: { q: 'Q_HALE', label: 'Little blood beneath him', text: 'The snow under the body is nearly clean: a few dark spots, no more.', sources: ['SAWMILL_BODY'] },
  S_OLD_BLOOD: { q: 'Q_HALE', label: 'Old, frozen blood', text: 'The blood on his coat froze long before tonight, and his hands are frozen hard as wood.', sources: ['SAWMILL_BODY'], if: { examined: 'SAWMILL_BODY' } },
  S_HOISTED: { q: 'Q_HALE', label: 'Hauled up by hand', text: 'He was hauled up over the beam on new rope and tied off at the post.', sources: ['SAWMILL_ROPE'] },
  S_FROM_CREEK: { q: 'Q_HALE', label: 'Dragged to the wheel', sources: ['SAWMILL_DRAG', 'SAWMILL_WATCH'], variants: [
    { if: { examined: 'SAWMILL_DRAG' }, text: 'A furrow with heel-drag marks runs to the wheel along the ground, out from under the frame.' },
    { if: { evidence: 'SAWMILL_DRAG' }, text: 'A furrow runs up from the creek bank toward the wheel, along the ground.' },
    { if: {}, text: 'His broken watch lay between the body and the creek.' },
  ] },
  S_MARKS: { q: 'Q_HALE', qs: ['Q_HALE', 'Q_ROOM4'], label: 'Marks cut in the post', text: 'Fresh tally marks, cut at eye height and facing the path.', sources: ['SAWMILL_MARKS'] },
  S_LEDGER: { q: 'Q_HALE', label: 'The Pale Order ledger', text: 'The Pale Order\'s old accounts, thrown on a dead fire and left half-burned.', sources: ['SAWMILL_LEDGER'] },
  S_SCREAM: { q: 'Q_HALE', label: 'The scream at 02:15', text: 'A scream from the mill at 02:15. Mrs. Gable knew at once where it came from.', sources: ['T_GABLE_NIGHT'], also: ['T_GABLE_VOICE'], if: { flag: 'heardScream' } },
  S_TRACKS: { q: 'Q_HALE', label: 'Fresh tracks to the mill', text: 'One set of prints went down the creek path fast tonight, before me.', sources: ['CREEK_TRACKS'] },
  // the lantern on the ridge: one sighting, carried from the first night's question to the second day's
  S_RIDGE: { q: 'Q_HALE', qs: ['Q_ORDER', 'Q_HALE'], label: 'A watcher on the ridge', sources: [], also: ['T_FINCH_RIDGE'], if: { flag: 'ridgeLightSeen' }, variants: [
    { if: { flag: 'ch2Started' }, text: 'The night I found Hale, a lantern on the ridge watched me, swung once, and went dark.' },
    { if: {}, text: 'A lantern on the ridge watched me find him, then went dark.' },
  ] },
  S_PIT: { q: 'Q_HALE', label: 'The hollow in the pit', text: 'Something man-sized lay in the wheel pit, on the ice, before it was dragged out.', sources: ['PIT_HOLLOW'], also: ['T_GABLE_PIT'] },
  // --- Q_ROOM4 ---
  S_BOARDS: { q: 'Q_ROOM4', label: 'Blood scrubbed out', sources: ['HOTEL_ROOM4_BOARDS', 'ROOM4_RUG'], if: { examined: 'HOTEL_ROOM4_BOARDS' }, variants: [
    { if: { evidence: 'ROOM4_RUG' }, text: 'Someone scrubbed blood out of the floor of Room 4 with lye, then scrubbed it again and covered it while I was out.' },
    { if: {}, text: 'Someone scrubbed blood out of the floor of Room 4 with lye.' },
  ] },
  S_GABLE_GUEST: { q: 'Q_ROOM4', label: 'Gable: a sick guest', sources: ['T_GABLE_ROOM4', 'T_GABLE_REGISTER'], variants: [
    { if: { evidence: 'T_GABLE_REGISTER' }, text: 'Mrs. Gable says a guest took ill in Room 4, and paid to be kept out of the book.' },
    { if: {}, text: 'Mrs. Gable says a guest took ill in Room 4.' },
  ] },
  // --- Q_ROOM4 on the third day ---
  S3_COAT: { q: 'Q_ROOM4', label: 'A button gone from his coat', text: 'Hale\'s coat is short one brass button, torn from the cloth, not cut.', sources: ['EV3_COAT'], also: ['EV3_SHELF'] },
  S3_LYE: { q: 'Q_ROOM4', label: 'Lye on his sleeve', text: 'Hale\'s right cuff is bleached and rotted in a ring. Lye, and there was none at the mill.', sources: ['EV3_COAT'], if: { examined: 'EV3_COAT' } },
  S3_BUTTON: { q: 'Q_ROOM4', label: 'A button under the bed', sources: ['EV3_BUTTON'], variants: [
    { if: { examined: 'EV3_BUTTON' }, text: 'A sheriff\'s brass button under the Room 4 bed: threads torn in the shank, something dark dried on the rim.' },
    { if: {}, text: 'A brass button with a star struck in it, far under the bed in Room 4.' },
  ] },
  S3_STAIR: { q: 'Q_ROOM4', label: 'A stair behind the wardrobe', sources: ['EV3_PANEL'], also: ['EV3_GLOVE'], variants: [
    { if: { examined: 'EV3_PANEL' }, text: 'Behind the wardrobe a servants\' stair goes down to the kitchen yard. The rail is rope-scored and the treads are heel-dragged.' },
    { if: {}, text: 'The back of the wardrobe in Room 4 lets in a draught and a smell of cold stone.' },
  ] },
  S3_HEARD: { q: 'Q_ROOM4', qs: ['Q_ROOM4', 'Q_KILLER'], label: 'What Mrs. Gable heard', text: 'Mrs. Gable heard Hale come up the back stair to her guest, a heavier tread after him, and then nothing for a long while.', sources: ['T3_GABLE_STAIR'] },
  S3_NOTE: { q: 'Q_ROOM4', qs: ['Q_ROOM4', 'Q_KILLER'], label: 'A note under her door', text: 'In the morning a note under Mrs. Gable\'s door: clean it, say a guest took ill, or the Ram burns. Five strokes under it, the last struck through.', sources: ['EV3_NOTE'] },
  // --- Q_COFFEE (the third night) ---
  S3_DRUGGED: { q: 'Q_COFFEE', label: 'Laudanum in my cup', sources: ['EV3_CUP'], variants: [
    { if: { examined: 'EV3_CUP' }, text: 'Laudanum in the coffee: enough to put me under for an hour or two, not to kill me.' },
    { if: {}, text: 'A bitter brown crust in my cup, and a smell like cloves.' },
  ] },
  S3_SEARCHED: { q: 'Q_COFFEE', label: 'The note taken from my coat', text: 'While I was under, someone turned out my pockets and took the note Mrs. Gable gave me. Nothing else.', sources: [], if: { flag: 'woke3' } },
  S3_TIN: { q: 'Q_COFFEE', label: 'A new tin from Rusk\'s', text: 'The coffee was from a new tin, opened today, with Rusk\'s label on the lid.', sources: ['EV3_TIN'] },
  // --- Chapter 4: the coffee, closed ---
  S4_REGISTER: { q: 'Q_COFFEE', label: 'A page cut from his register', text: 'A page cut from Rusk\'s poison register. Pressed into the leaf under it: "Laud", and the date my coffee came up.', sources: ['EV4_REGISTER'], if: { examined: 'EV4_REGISTER' } },
  S4_RUSK: { q: 'Q_COFFEE', label: 'Rusk\'s own word', text: 'Rusk put laudanum in the grounds on Mr. Mercer\'s order. He was told it would only make me sleep.', sources: ['T4_RUSK_CONFESS'] },
  // --- Q_KILLER (Chapter 4) ---
  S4_NAME: { q: 'Q_KILLER', label: 'Rusk names Cutler', sources: ['T4_RUSK_CONFESS', 'T4_RUSK_CUTLER'], variants: [
    { if: { evidence: 'T4_RUSK_CONFESS' }, text: 'Rusk: Wade Cutler, Mercer\'s foreman, scraped the freight book and fetched the powder after dark.' },
    { if: {}, text: 'Rusk, cornered, gave me a name: Wade Cutler, Mr. Mercer\'s foreman.' },
  ] },
  S4_KNIFE: { q: 'Q_KILLER', label: 'Cutler\'s knife', text: 'Wade Cutler wears a long knife: narrow, single-edged, the sheath worn pale. He took me for a Pinkerton.', sources: ['T4_CUTLER'] },
  S4_ASHES: { q: 'Q_KILLER', label: 'The note in his stove', sources: ['EV4_ASHES'], variants: [
    { if: { examined: 'EV4_ASHES' }, text: 'Mrs. Gable\'s note, half-burned in Cutler\'s stove, folded the way she kept it. The note taken from my coat.' },
    { if: {}, text: 'A half-burned paper on the ash in Cutler\'s stove.' },
  ] },
  S4_HAND: { q: 'Q_KILLER', label: 'Block capitals in his book', sources: ['EV4_TALLY'], also: ['EV4_KIT'], variants: [
    { if: { examined: 'EV4_TALLY' }, text: 'Cutler writes in block capitals, and keeps six men\'s shares in five strokes at the back of his book. A new line: N.H., struck.' },
    { if: {}, text: 'Cutler\'s tally book: hours, feed and powder, every entry in block capitals.' },
  ] },
  S4_ORDER: { q: 'Q_KILLER', label: 'On Mr. Mercer\'s word', sources: ['T4_RUSK_CONFESS', 'T4_VALE_MONEY'], variants: [
    { if: { evidence: 'T4_RUSK_CONFESS' }, text: 'Rusk drugged me because Mr. Mercer told him to, and Cutler is Mercer\'s man.' },
    { if: {}, text: 'Vale: Mercer told him the Order\'s money lies behind the fall, and asked him to keep the town off the ridge.' },
  ] },
  S4_HEEL: { q: 'Q_KILLER', label: 'Mercer\'s riding boots', text: 'Mercer stood at Hale\'s grave in cavalry boots: the heel that stood under the mill roof and by the opened grave.', sources: ['EV3_HEEL'] },
  S4_WATCH: { q: 'Q_KILLER', label: 'The watch, set by hand', text: 'Hale\'s watch ran down days before the mill. Somebody pushed the hands to twenty past two and broke the glass.', sources: ['EV4_WATCH'] },
  // --- Q_TELEGRAM (Chapter 4) ---
  S4_BOOK: { q: 'Q_TELEGRAM', label: 'Ada\'s book', sources: ['EV4_ADA_BOOK'], variants: [
    { if: { examined: 'EV4_ADA_BOOK' }, text: 'Ada Bell\'s book: form 41, "handed in by Miss C. Mercer. Hooded." Two days before I came.' },
    { if: {}, text: 'My telegram is in Ada Bell\'s receiving book, on form 41.' },
  ] },
  S4_PAD: { q: 'Q_TELEGRAM', label: 'Form 41, torn out', text: 'Finch\'s pad of telegraph forms, every one signed in advance. Number 41 is torn out.', sources: ['EV3_PAD'], also: ['T3_FINCH_FORMS'], if: { examined: 'EV3_PAD' } },
  S4_FINCH: { q: 'Q_TELEGRAM', label: 'Finch guessed', text: 'Finch knew the telegram for Clara\'s the night I came, and kept quiet so her father would not hear it.', sources: ['T4_FINCH_CONFESS'] },
  S4_CLARA: { q: 'Q_TELEGRAM', label: 'Mrs. Gable\'s guest', text: 'Mrs. Gable: Clara Mercer was the guest in Room 4. She got out down the back stair and went to her mother\'s cabin on the ridge.', sources: ['T4_GABLE_CLARA'], also: ['EV3_GLOVE'] },
  S_REGISTER: { q: 'Q_ROOM4', label: 'No one in the register', text: 'The register shows no guest in Room 4 for a fortnight.', sources: ['HOTEL_REGISTER'] },
  // --- Q_ORDER (Chapter 2) ---
  S2_FREIGHT: { q: 'Q_ORDER', label: 'The scraped freight entry', sources: ['STORE_LEDGER'], also: ['STORE_OIL'], variants: [
    { if: { examined: 'STORE_LEDGER' }, text: 'Forty pounds came up on Rusk\'s last freight, and the book was scraped to say lamp oil. Under it: "Powd—".' },
    { if: {}, text: 'Rusk\'s last freight came up from the railhead nine days ago.' },
  ] },
  S2_COIN: { q: 'Q_ORDER', label: 'Paid in coin, fetched at night', sources: ['T_RUSK_FREIGHT'], also: ['T_RUSK_SCRAPED'], variants: [
    { if: { evidence: 'T_RUSK_SCRAPED' }, text: 'Rusk: the freight was paid in coin and fetched after dark, no name on it; the page "came to him like that".' },
    { if: {}, text: 'Rusk: the freight was paid in coin and fetched after dark, no name on it.' },
  ] },
  S2_CRATE: { q: 'Q_ORDER', label: 'An empty powder crate', sources: ['STORE_CRATE'], variants: [
    { if: { examined: 'STORE_CRATE' }, text: 'An empty GIANT POWDER crate in Rusk\'s back corner, a paper band in the sawdust dated this autumn.' },
    { if: {}, text: 'A long crate in Rusk\'s back corner, packed with sawdust, empty.' },
  ] },
  S2_CACHE: { q: 'Q_ORDER', label: 'Powder in a miner\'s grave', text: 'Dynamite, fuse and caps buried in Amos Pell\'s grave, wrapped in an old cavalry jacket.', sources: ['GRAVE_DISTURBED'], also: ['GRAVE_CACHE', 'GRAVE_STONE', 'T_VALE_ORDER', 'T_VALE_PELL'], if: { examined: 'GRAVE_DISTURBED' } },
  S2_HEELS: { q: 'Q_ORDER', label: 'Riding boots at the grave', text: 'Riding-boot prints around the opened grave: a narrow heel, a long straight sole.', sources: ['GRAVE_PRINTS'], also: ['T_FINCH_BOOTS', 'STORE_BOOTS'] },
  // One discovery, one entry: the boot prints under the mill roof belong to the sheriff's question on the first night
  // and carry over to the Order's question on the second day (`qs`: listed under the first of them shown).
  S2_MILL_HEELS: { q: 'Q_ORDER', qs: ['Q_ORDER', 'Q_HALE'], label: 'Riding boots at the mill', sources: ['SAWMILL_BOOTPRINTS'], variants: [
    { if: { flag: 'ch2Started' }, text: 'The same narrow heel stood under the mill roof, the night Hale was hung.' },
    { if: {}, text: 'Someone in riding boots stood under the mill roof, sheltered, facing the wheel.' },
  ] },
  S2_WIRE: { q: 'Q_ORDER', label: 'The wire was cut', text: 'The telegraph wire was cut clean, and the end bent back to look torn.', sources: ['TOWER_WIRE'], if: { examined: 'TOWER_WIRE' } },
  S2_LINE_DEAD: { q: 'Q_ORDER', label: 'Dead since I came', text: 'Ada Bell: the line went dead at six the evening I arrived; the next mile is cut too.', sources: ['T_ADA_LINE'], also: ['T_ADA_MEND', 'T_CONDUCTOR_PASS'] },
  S2_SOOT: { q: 'Q_ORDER', label: 'A lantern kept at the tower', text: 'Fresh soot over a lantern hook on the tower platform, which looks straight down on the mill.', sources: ['TOWER_SOOT'], also: ['TOWER_VIEW'] },
  S2_FIGURE: { q: 'Q_ORDER', label: 'Vale\'s Pale Figure', text: 'Vale: the Pale Figure carries a lamp on the ridge, and those who follow it to the old workings do not come down.', sources: ['T_VALE_FIGURE'], also: ['T_GABLE_VALE'] },
  S2_HALE_ASKED: { q: 'Q_ORDER', label: 'Hale asked about the freight', sources: ['T_RUSK_HALE', 'T_FINCH_FREIGHT'], variants: [
    { if: { evidence: 'T_RUSK_HALE' }, text: 'Hale read Rusk\'s freight book "like scripture" a fortnight before he died, and asked about that freight.' },
    { if: {}, text: 'Hale went out the last night with one of Rusk\'s freight bills folded in his coat.' },
  ] },
};

// ---------------- deductions ----------------
// pairs:    authored pairs of statements that form it (alternative routes)
// readings: two plausible interpretations; the player chooses one (state.readings[id])
// details:  journal records that bear on which reading holds (shown once recorded; never ranked)
// ask:      the question its first clue raises (an open thread on the board until it is answered)
// raisedBy: (optional) the clues that raise it; by default any clue of its pairs
// links:    other deductions it bears on (drawn as edges on the board)
// map:      position on the question's board, in 0..1 of the board area
// IDs kept from the first version (D_SCENE_ARRANGED, D_SAME_COUNTING, D_UNWRITTEN_GUEST) so existing saves keep them.
export const DEDUCTIONS = {
  D_SCENE_ARRANGED: {
    q: 'Q_HALE', title: 'He did not bleed here',
    ask: 'Did he die where he hangs?',
    pairs: [['S_LITTLE_BLOOD', 'S_HOISTED'], ['S_LITTLE_BLOOD', 'S_FROM_CREEK']],
    text: 'Too little blood beneath him for where he hangs, and the rest of the scene shows labour: a rope hauled over a beam and tied off, a body brought along the ground. Hands made this display.',
    limits: 'Who did it, and why they wanted him seen this way, the evidence does not yet say.',
    readings: {
      DRAINED: { label: 'Drained', text: 'He was bled out before he was strung up, the way the town will tell it.' },
      MOVED: { label: 'Moved', text: 'He bled somewhere else, and was brought here afterwards.' },
    },
    details: ['SAWMILL_DRAG', 'SAWMILL_ROPE', 'T_FINCH_RIDGE'],
    links: ['D_LONG_DEAD', 'D_SAME_COUNTING'],
    map: { x: 0.2, y: 0.22 },
  },
  D_LONG_DEAD: {
    q: 'Q_HALE', title: 'Old blood, three nights gone',
    ask: 'When did he die?',
    raisedBy: ['S_OLD_BLOOD', 'S_MISSING'],
    pairs: [['S_OLD_BLOOD', 'S_MISSING']],
    text: 'The blood on his coat froze long before tonight, and nobody has seen him since he went out three nights ago.',
    limits: 'Where he was in between, the body alone cannot tell me.',
    readings: {
      THAT_NIGHT: { label: 'Died that night', text: 'He was wounded the night he went missing, and died of it then.' },
      KEPT_ALIVE: { label: 'Held until tonight', text: 'He was wounded that night, but kept alive somewhere until tonight.' },
    },
    details: ['SAWMILL_BODY', 'PIT_HOLLOW', 'T_GABLE_HALE'],
    links: ['D_THE_SCREAM'],
    map: { x: 0.0, y: 0.72 },
  },
  D_SAME_COUNTING: {
    q: 'Q_HALE', title: 'The same counting',
    ask: 'What do the marks on the post count?',
    pairs: [['S_MARKS', 'S_LEDGER']],
    text: 'The strokes cut into the post are grouped the way the tallies run down the burned ledger\'s columns. Whoever carved them knew those books, or wanted the finder to think of them.',
    limits: 'What the marks count, I cannot yet read.',
    readings: {
      CLAIM: { label: 'A claim', text: 'The Order\'s own mark: whoever killed him is putting the Order\'s name to it.' },
      DRESSING: { label: 'Set dressing', text: 'Left to be found: someone wants the finder to think of the Order.', if: { examined: 'SAWMILL_MARKS' } },
    },
    details: ['SAWMILL_MARKS', 'SAWMILL_LEDGER', 'T_FINCH_RIDGE'],
    links: [],
    map: { x: 0.8, y: 0.22 },
  },
  D_THE_SCREAM: {
    q: 'Q_HALE', title: 'A scream, and someone abroad',
    ask: 'Whose scream was it?',
    pairs: [['S_SCREAM', 'S_TRACKS'], ['S_SCREAM', 'S_RIDGE']],
    text: 'A scream from the mill at 02:15, and someone else out by the creek tonight: fresh prints going down, a lantern on the ridge.',
    limits: 'Whose voice it was, or whose lantern, I have not seen.',
    readings: {
      DEATH: { label: 'His death', text: 'The scream was Hale\'s: he was killed at the mill at 02:15.' },
      SUMMONS: { label: 'A summons', text: 'The scream was meant to be heard: someone wanted him found tonight.', if: { any: [{ evidence: 'T_GABLE_VOICE' }, { deduction: 'D_LONG_DEAD' }] } },
    },
    details: ['T_GABLE_VOICE', 'CREEK_TRACKS', 'T_GABLE_NIGHT'],
    links: [],
    map: { x: 1.0, y: 0.72 },
  },
  D_WHERE_KEPT: { // only from the optional wheel pit
    q: 'Q_HALE', title: 'Kept in the cold',
    ask: 'Where was he, those three nights?',
    raisedBy: ['S_PIT'], // only the optional wheel pit raises this one
    pairs: [['S_PIT', 'S_FROM_CREEK'], ['S_PIT', 'S_OLD_BLOOD']],
    text: 'The furrow comes out from the wheel pit, where something the size of a man lay frozen long enough for the frost to grow over it, before it was hauled up to the wheel.',
    limits: 'Who put him there, and who hauled him out tonight, it does not say.',
    details: ['PIT_HOLLOW'],
    links: ['D_LONG_DEAD', 'D_SCENE_ARRANGED'],
    map: { x: 0.5, y: 0.5 },
  },
  D_UNWRITTEN_GUEST: {
    q: 'Q_ROOM4', title: 'An unwritten guest',
    ask: 'Who stayed in Room 4?',
    pairs: [['S_GABLE_GUEST', 'S_REGISTER']],
    text: 'Mrs. Gable says a guest took ill in Room 4. Her own register shows no one in Room 4 for a fortnight. Either the guest was kept off the books, or there was no guest at all.',
    limits: 'Whose blood was scrubbed from the floor, and why it was hidden, remains open.',
    readings: {
      REAL: { label: 'A guest, off the book', text: 'Someone did stay in Room 4, paying not to be written down.', if: { any: [{ evidence: 'T_GABLE_REGISTER' }, { evidence: 'T3_GABLE_STAIR' }, { evidence: 'EV3_GLOVE' }] } },
      NONE: { label: 'No guest at all', text: 'There was no guest. "A guest took ill" covers something that happened in that room.' },
    },
    details: ['HOTEL_ROOM4_BOARDS', 'T_GABLE_REGISTER'],
    links: [],
    map: { x: 0.5, y: 0.5 },
  },
};

// --- Q_ORDER (Chapter 2) ---
Object.assign(DEDUCTIONS, {
  D2_BOUGHT_QUIET: {
    q: 'Q_ORDER', title: 'Bought quietly',
    ask: 'What came up on Rusk\'s last freight?',
    raisedBy: ['S2_FREIGHT'],
    pairs: [['S2_FREIGHT', 'S2_COIN'], ['S2_FREIGHT', 'S2_CRATE']],
    text: 'Powder came up on Rusk\'s freight this autumn, paid for in coin, collected in the dark, and entered in the book as lamp oil.',
    limits: 'Who paid, Rusk says he never asked. Whether he scraped the page himself, I cannot tell.',
    details: ['STORE_OIL', 'T_RUSK_SCRAPED'],
    links: ['D2_GRAVE_POWDER', 'D2_HALE_KNEW'],
    map: { x: 0.12, y: 0.3 },
  },
  D2_GRAVE_POWDER: {
    q: 'Q_ORDER', title: 'Powder in the ground',
    ask: 'What became of the powder?',
    pairs: [['S2_CACHE', 'S2_CRATE'], ['S2_CACHE', 'S2_FREIGHT']],
    text: 'There is dynamite in Amos Pell\'s grave, and a crate that held dynamite stands empty in Rusk\'s store.',
    limits: 'Who buried it, and what for, the grave does not say.',
    readings: {
      OLD: { label: 'Left from the war', text: 'An old military cache, wrapped in a dead trooper\'s jacket and kept in the ground for thirty years.' },
      NEW: { label: 'This winter\'s freight', text: 'New powder, bought this autumn and hidden in the grave. The old jacket is only a wrapping.', if: { any: [{ examined: 'GRAVE_CACHE' }, { examined: 'STORE_CRATE' }] } },
    },
    details: ['GRAVE_CACHE', 'STORE_CRATE'],
    links: ['D2_SAME_HEELS'],
    map: { x: 0.48, y: 0.3 },
  },
  D2_SAME_HEELS: {
    q: 'Q_ORDER', title: 'The same boots',
    ask: 'Whose riding boots?',
    pairs: [['S2_HEELS', 'S2_MILL_HEELS']],
    text: 'The riding boots that stood under the mill roof the night Hale was hung have stood by the opened grave too.',
    limits: 'Old troopers keep their boots, Finch says. That is a good many men.',
    details: ['T_FINCH_BOOTS', 'STORE_BOOTS'],
    links: [],
    map: { x: 0.88, y: 0.3 },
  },
  D2_CUT_OFF: {
    q: 'Q_ORDER', title: 'Cut off on purpose',
    ask: 'Why is the telegraph dead?',
    pairs: [['S2_WIRE', 'S2_LINE_DEAD']],
    text: 'The line did not fail in the storm. It was cut, the evening I came, and a mile more of it along the ridge.',
    limits: 'Whose hand held the cutters, there is nothing up there to say.',
    readings: {
      OUT: { label: 'To keep word in', text: 'Cut so that no word of Hale\'s death could go out of the valley.' },
      IN: { label: 'To keep help out', text: 'Cut so that nobody can be sent for, until something here is done.', if: { any: [{ evidence: 'T_ADA_MEND' }, { evidence: 'T_CONDUCTOR_PASS' }] } },
    },
    details: ['T_ADA_LINE', 'T_CONDUCTOR_PASS', 'T_ADA_MEND'],
    links: [],
    map: { x: 0.12, y: 0.85 },
  },
  D2_TOWER_LIGHT: {
    q: 'Q_ORDER', title: 'The light on the ridge',
    ask: 'Whose is the light on the ridge?',
    pairs: [['S2_SOOT', 'S_RIDGE'], ['S2_SOOT', 'S2_FIGURE']],
    text: 'Somebody keeps a lantern at the telegraph tower, where the whole valley can be seen. A lantern on the ridge is what the town calls the Pale Figure.',
    limits: 'Who holds the lantern, I have not seen.',
    readings: {
      FIGURE: { label: 'The Pale Figure\'s lamp', text: 'The thing the Reverend preaches walks the ridge with its lamp, as the town says.', if: { any: [{ evidence: 'T_VALE_FIGURE' }, { evidence: 'T_GABLE_VALE' }] } },
      SIGNAL: { label: 'A man, signalling', text: 'A man stands up there with a lantern to watch, and to signal down into the valley.', if: { any: [{ evidence: 'TOWER_VIEW' }, { flag: 'ridgeLightSeen' }] } },
    },
    details: ['TOWER_SOOT', 'TOWER_VIEW', 'T_VALE_FIGURE'],
    links: ['D2_CUT_OFF'],
    map: { x: 0.82, y: 0.85 },
  },
  D2_HALE_KNEW: {
    q: 'Q_ORDER', title: 'Hale was on the same trail',
    ask: 'What was Hale asking about, before he died?',
    raisedBy: ['S2_HALE_ASKED'],
    pairs: [['S2_HALE_ASKED', 'S2_FREIGHT'], ['S2_HALE_ASKED', 'S2_COIN']],
    text: 'A fortnight before he died, Sheriff Hale was asking about the same freight I am asking about now.',
    limits: 'That he died for asking, I believe. I cannot prove it.',
    details: ['T_RUSK_HALE', 'T_FINCH_FREIGHT'],
    links: ['D2_BOUGHT_QUIET'],
    map: { x: 0.62, y: 0.55 },
  },
});

// --- Q_ROOM4 on the third day (Chapter 3) ---
Object.assign(DEDUCTIONS, {
  D3_HALE_HERE: {
    q: 'Q_ROOM4', title: 'Hale was in Room 4',
    ask: 'Whose button was under the bed?',
    raisedBy: ['S3_BUTTON'],
    pairs: [['S3_BUTTON', 'S3_COAT']],
    text: 'The button under the bed is off Hale\'s coat: the same brass, the same star, and the coat is short by one.',
    limits: 'When he was in that room, and whether he was alive, the button alone cannot say.',
    readings: {
      STRUGGLE: { label: 'Torn off fighting', text: 'He tore it off himself, struggling, there on the floor.', if: { examined: 'EV3_BUTTON' } },
      LATER: { label: 'Dropped afterwards', text: 'He was dead before it came off: whoever carried his coat through the room lost it.' },
    },
    details: ['EV3_BUTTON', 'EV3_COAT'],
    links: ['D3_LYE', 'D_UNWRITTEN_GUEST'],
    map: { x: 0.15, y: 0.62 },
  },
  D3_LYE: {
    q: 'Q_ROOM4', title: 'The same lye',
    ask: 'Where did the lye on his sleeve come from?',
    raisedBy: ['S3_LYE'],
    pairs: [['S3_LYE', 'S_BOARDS']],
    text: 'The lye that rotted his cuff is the lye that scrubbed the boards of Room 4. His sleeve lay in that blood, or in that bucket.',
    limits: 'Whose blood the boards held, the lye cannot say on its own.',
    details: ['EV3_COAT', 'HOTEL_ROOM4_BOARDS'],
    links: ['D3_HALE_HERE'],
    map: { x: 0.5, y: 0.82 },
  },
  D3_STAIR: {
    q: 'Q_ROOM4', title: 'The back way',
    ask: 'Where does the back of the wardrobe lead?',
    raisedBy: ['S3_STAIR'],
    pairs: [['S3_STAIR', 'S3_HEARD'], ['S3_STAIR', 'S_BOARDS']],
    text: 'A stair runs from Room 4 down to the kitchen yard, out of sight of the parlor. Whatever happened in that room could leave it without passing Mrs. Gable\'s desk.',
    limits: 'Who went down it, the stair keeps to itself.',
    readings: {
      CARRIED: { label: 'Carried down', text: 'He was carried down that stair, by men who knew it was there.', if: { examined: 'EV3_PANEL' } },
      FLED: { label: 'The guest fled', text: 'The guest went down it in a hurry, and the trouble went with her.' },
    },
    details: ['EV3_PANEL', 'EV3_GLOVE', 'T3_GABLE_STAIR'],
    links: ['D3_HALE_HERE'],
    map: { x: 0.85, y: 0.62 },
  },
  D3_THREAT: {
    q: 'Q_ROOM4', title: 'The same counting, again',
    ask: 'Who wrote the note under her door?',
    raisedBy: ['S3_NOTE'],
    pairs: [['S3_NOTE', 'S_MARKS']],
    text: 'Five strokes, the last struck through the others: the count cut into the mill post. Whoever made Mrs. Gable clean that room signed it as the Order\'s business.',
    limits: 'Whose hand wrote it, I have nothing yet to match it against.',
    details: ['EV3_NOTE', 'SAWMILL_MARKS'],
    links: [],
    map: { x: 0.85, y: 0.15 },
  },
  // --- Q_COFFEE (open into the next chapter) ---
  D3_DRUGGED: {
    q: 'Q_COFFEE', title: 'Put to sleep for a note',
    ask: 'What was in my coffee?',
    raisedBy: ['S3_DRUGGED'],
    pairs: [['S3_DRUGGED', 'S3_SEARCHED'], ['S3_DRUGGED', 'S3_TIN']],
    text: 'Laudanum in the coffee, enough to put me under for an hour or two, and while I was under someone went through my coat and took back the note, and nothing else.',
    limits: 'Who dosed it, and who came for the note, the cup does not say.',
    details: ['EV3_CUP', 'EV3_TIN'],
    links: [],
    map: { x: 0.5, y: 0.4 },
  },
});

// --- Chapter 4: the killer, the telegram, the coffee closed ---
Object.assign(DEDUCTIONS, {
  D4_POISONER: {
    q: 'Q_COFFEE', title: 'Rusk\'s laudanum',
    ask: 'Where did the laudanum come from?',
    raisedBy: ['S4_REGISTER', 'S4_RUSK'], // (the tin is known from the third night: the thread opens with the fourth day's finds)
    pairs: [['S4_REGISTER', 'S3_TIN'], ['S4_RUSK', 'S3_TIN']],
    text: 'The laudanum came from Rusk\'s own shelf, the same day as the new tin with his label on it, and the page that would say so was cut out of his register.',
    limits: 'Whose hand went through my coat while I slept, the tin cannot say.',
    details: ['EV4_REGISTER', 'EV3_TIN', 'T4_RUSK_CONFESS'],
    links: ['D3_DRUGGED'],
    map: { x: 0.5, y: 0.85 },
  },
  D4_SAME_HAND: {
    q: 'Q_KILLER', title: 'The same hand',
    ask: 'Whose hand wrote the note under Mrs. Gable\'s door?',
    raisedBy: ['S4_ASHES', 'S4_HAND'],
    pairs: [['S4_HAND', 'S4_ASHES'], ['S4_HAND', 'S3_NOTE']],
    text: 'The note under Mrs. Gable\'s door is in Cutler\'s block capitals, signed with his count, and it ended in his stove the night it was taken from my coat.',
    limits: 'A man can write a threat and not strike the blow. The book does not say who held the knife.',
    details: ['EV4_TALLY', 'EV4_ASHES', 'EV3_NOTE'],
    links: ['D4_TREAD'],
    map: { x: 0.5, y: 0.1 },
  },
  D4_TREAD: {
    q: 'Q_KILLER', title: 'The heavier tread',
    ask: 'Who came up the back stair after Hale?',
    raisedBy: ['S4_KNIFE', 'S4_NAME'],
    pairs: [['S3_HEARD', 'S4_KNIFE'], ['S3_HEARD', 'S4_NAME']],
    text: 'A heavier man came up the back stair after Hale, and the man who does the Order\'s work in this town is Wade Cutler.',
    limits: 'Mrs. Gable heard a tread, not a face.',
    readings: {
      CUTLER: { label: 'Cutler, with that knife', text: 'Cutler went up after him, and the narrow knife at his belt did the rest.', if: { evidence: 'T4_CUTLER' } },
      MERCER: { label: 'Mercer, himself', text: 'Mercer went up the stair himself. A foreman fetches powder; a man like Mercer settles his own debts.' },
    },
    details: ['T3_GABLE_STAIR', 'T4_CUTLER', 'EV4_WATCH', 'EV3_BUTTON'],
    links: ['D4_WORD'],
    map: { x: 0.15, y: 0.6 },
  },
  D4_WORD: {
    q: 'Q_KILLER', title: 'On whose word',
    ask: 'Who gives Cutler his orders?',
    raisedBy: ['S4_NAME', 'S4_ORDER', 'S4_HAND'],
    pairs: [['S4_NAME', 'S4_ORDER'], ['S4_HAND', 'S4_ORDER'], ['S4_HAND', 'S4_HEEL'], ['S4_HAND', 'S4_NAME']],
    text: 'Cutler keeps the Pale Order\'s shares in his own book, with G.M. at the head of them, and the men he leans on are Mercer\'s debtors.',
    limits: 'Whether Mercer gave the word for Hale, or only for the powder, a tally book cannot swear to.',
    readings: {
      MERCER: { label: 'Mercer\'s order', text: 'Cutler is the hands. Mercer gave the word, for the powder, the coffee and the sheriff.', if: { any: [{ evidence: 'T4_RUSK_CONFESS' }, { evidence: 'T4_VALE_MONEY' }, { examined: 'EV4_TALLY' }] } },
      ALONE: { label: 'His own work', text: 'Cutler keeps his dead father\'s share and his own counsel. Mercer pays the wages and looks away.' },
    },
    details: ['EV4_TALLY', 'T4_RUSK_CONFESS', 'T4_VALE_MONEY', 'EV3_HEEL', 'EV4_KIT'],
    links: [],
    map: { x: 0.85, y: 0.6 },
  },
  D4_SENDER: {
    q: 'Q_TELEGRAM', title: 'Clara sent for me',
    ask: 'Who handed in form 41?',
    pairs: [['S4_BOOK', 'S4_PAD'], ['S4_BOOK', 'S4_FINCH'], ['S4_BOOK', 'S4_CLARA']],
    text: 'Clara Mercer tore form 41 from the pad Finch had signed for Hale, wrote my telegram on it, and handed it in at Blackwood herself, hooded, two days after Hale died.',
    limits: 'Where she is now, the book cannot tell me.',
    details: ['EV4_ADA_BOOK', 'EV3_PAD', 'T4_FINCH_CONFESS', 'T4_GABLE_CLARA'],
    links: [],
    map: { x: 0.5, y: 0.45 },
  },
});

export const DEDUCTION_REFUSAL = 'The evidence does not establish that.';

// ---------------- conclusions ----------------
// requires: deduction → reading. A conclusion is on the table once all its deductions are formed, and supported when
// the player's chosen readings match. `outcome` is what committing to it sets in motion (systems/caseSystem.js).
export const CONCLUSIONS = {
  C_RITE: {
    q: 'Q_HALE', title: 'Bled in the Order\'s name',
    requires: { D_SCENE_ARRANGED: 'DRAINED', D_SAME_COUNTING: 'CLAIM' },
    text: 'Hale was bled out and hung at the mill, and the marks on the post claim the killing for the Pale Order. Whoever the Order are now, they are not finished.',
    outcome: {
      aftermath: 'AFTER_RITE',
      do: [{ set: { townFrightened: true } }, { char: { finch: { trust: 'COLD' } } }, { log: 'Told Finch it was the Pale Order\'s work.' }],
      epilogue: 'By morning all of Crow\'s Hollow has it that the Pale Order took the sheriff, and that the stranger at the Black Ram said so himself. Doors that were shut to me are bolted now.',
    },
  },
  C_TONIGHT: {
    q: 'Q_HALE', title: 'Murdered at the mill tonight',
    requires: { D_SCENE_ARRANGED: 'MOVED', D_LONG_DEAD: 'KEPT_ALIVE', D_THE_SCREAM: 'DEATH' },
    text: 'Hale was held somewhere for three nights, wounded, and brought to the mill alive. He was killed there at 02:15 (the scream was his), and his killer went off along the creek and up the ridge.',
    outcome: {
      aftermath: 'AFTER_TONIGHT',
      do: [{ set: { millSearched: true } }, { log: 'Told Finch the killer was abroad at 02:15. He raised a search.' }],
      epilogue: 'Finch had six men out at first light, along the creek and up the ridge after a killer. They found no one. By noon the mill yard and the creek path were trodden flat, and whatever else the snow was keeping went under their boots.',
    },
  },
  C_STAGED: {
    q: 'Q_HALE', title: 'Dead three nights, hung for show', truth: true,
    requires: { D_SCENE_ARRANGED: 'MOVED', D_LONG_DEAD: 'THAT_NIGHT', D_THE_SCREAM: 'SUMMONS', D_SAME_COUNTING: 'DRESSING' },
    text: 'Hale died the night he went missing. Someone kept his body in the cold, and tonight hauled it to the wheel and hung it there, cut the marks and left the Order\'s ledger to be found. The scream was not his. It was meant to bring someone down to find him.',
    outcome: {
      aftermath: 'AFTER_STAGED',
      do: [{ set: { millKeptClosed: true } }, { char: { finch: { trust: 'STEADY' } } }, { log: 'Told Finch: Hale was three nights dead, and hung for show.' }],
      epilogue: 'Finch keeps the mill shut and the sheriff under canvas, and gives the town nothing to build a ghost story on. Whoever dressed that scene wanted fear. They will have to find it somewhere else.',
    },
  },
};

// Chapter 2: what the Order is doing now. Exactly one is true; the readings of the three exclude each other. The
// single-reading deductions (bought quietly, the same boots, Hale on the same trail) support the picture without
// being required by any account.
Object.assign(CONCLUSIONS, {
  C2_BLAST: {
    q: 'Q_ORDER', title: 'Someone means to blast the old workings', truth: true,
    requires: { D2_GRAVE_POWDER: 'NEW', D2_CUT_OFF: 'IN', D2_TOWER_LIGHT: 'SIGNAL' },
    text: 'Powder was bought quietly this autumn and hidden in a miner\'s grave, an old jacket round it so it would pass for war stores. The wire was cut to keep the valley shut until the work is done, and a man keeps watch from the tower with a lantern. Somebody means to open the old Pale workings, and soon.',
    outcome: {
      aftermath: 'AFTER2_BLAST',
      do: [{ set: { watchGrave: true } }, { log: 'Told Finch: someone means to blast the old workings. We left the grave as it was.' }],
      epilogue: 'I put the boards back the way I found them. Whoever buried that powder will come back for it, and when they do, I mean to be in the dark by the chapel wall.',
    },
  },
  C2_WAR: {
    q: 'Q_ORDER', title: 'Old soldiers, guarding old stores',
    requires: { D2_GRAVE_POWDER: 'OLD', D2_CUT_OFF: 'OUT' },
    text: 'The powder is a war cache, buried long ago in a dead trooper\'s jacket. Whoever wears the riding boots guards it still, and cut the wire so no word of Hale\'s death would get out of the valley.',
    outcome: {
      aftermath: 'AFTER2_WAR',
      do: [{ set: { powderMoved: true } }, { log: 'Told Finch it was an old war cache. He had it dug out and carried to the jail.' }],
      epilogue: 'Finch had the grave dug out and the powder carried to the jail as war stores. By dark every soul in Crow\'s Hollow knew where it was kept, and the grave had nothing more to tell me.',
    },
  },
  C2_RITE: {
    q: 'Q_ORDER', title: 'The Order keeps its rites',
    requires: { D2_TOWER_LIGHT: 'FIGURE', D2_GRAVE_POWDER: 'NEW' },
    text: 'The Pale Order lives again. Its people buy powder for whatever they mean to do in the Figure\'s name, and the Figure\'s lamp watches over them from the ridge.',
    outcome: {
      aftermath: 'AFTER2_RITE',
      do: [{ set: { valeEmboldened: true } }, { log: 'Told Finch the Order keeps its rites on the ridge. By evening the Reverend had heard it.' }],
      epilogue: 'Vale rang the bell at dusk and preached the Pale Figure to a full chapel. I had given him his text.',
    },
  },
});

// Chapter 3: whose blood was scrubbed from Room 4. Exactly one is true; the readings of the three exclude each other.
Object.assign(CONCLUSIONS, {
  C3_HALE: {
    q: 'Q_ROOM4', title: 'Hale died in Room 4', truth: true,
    requires: { D3_HALE_HERE: 'STRUGGLE', D3_STAIR: 'CARRIED', D_UNWRITTEN_GUEST: 'REAL' },
    text: 'Hale came up the back stair to a guest kept off the book. He was killed on the floor of Room 4, fighting, and carried down the same stair. Mrs. Gable was made to scrub it and tell me a guest took ill.',
    outcome: {
      aftermath: 'AFTER3_HALE',
      do: [{ set: { gableConfides: true } }, { char: { gable: { cooperation: 'OPEN' } } }, { log: 'Told Finch: Hale died in Room 4, and went down the back stair.' }],
      epilogue: 'Mrs. Gable bolted the kitchen passage herself tonight, and showed me she had. Finch knows now where his sheriff died. He does not yet know who he went there to see, and neither, quite, do I.',
    },
  },
  C3_GUEST: {
    q: 'Q_ROOM4', title: 'The guest\'s trouble',
    requires: { D3_HALE_HERE: 'LATER', D3_STAIR: 'FLED', D_UNWRITTEN_GUEST: 'REAL' },
    text: 'The blood in Room 4 is the guest\'s. She was hurt there and fled down the back stair; Hale came after, looking for her, and brought the button and the lye with him.',
    outcome: {
      aftermath: 'AFTER3_GUEST',
      do: [{ set: { huntForGuest: true } }, { log: 'Told Finch the blood was the guest\'s. He has gone to find her.' }],
      epilogue: 'Finch went out into the snow to find a hurt woman nobody has seen. Whoever else is looking for her will hear that he is looking, and where.',
    },
  },
  C3_GABLE: {
    q: 'Q_ROOM4', title: 'Mrs. Gable\'s own work',
    requires: { D_UNWRITTEN_GUEST: 'NONE', D3_HALE_HERE: 'STRUGGLE' },
    text: 'There was no guest. Hale died fighting in Room 4, and the woman who scrubbed the floor and wrote the story is the woman who owns the room.',
    outcome: {
      aftermath: 'AFTER3_GABLE',
      do: [{ set: { gableAccused: true } }, { char: { gable: { cooperation: 'COLD' } } }, { log: 'Told Finch it was Mrs. Gable\'s own work. He took her keys.' }],
      epilogue: 'Finch has Mrs. Gable\'s keys in his coat and her silence for good. The Black Ram\'s doors are locked by the law tonight, which suits whoever has a key of their own.',
    },
  },
});

// Chapter 4: who came up the stair after Hale, and on whose word. Exactly one is true; the readings exclude each other.
Object.assign(CONCLUSIONS, {
  C4_CUTLER: {
    q: 'Q_KILLER', title: 'Cutler\'s knife, Mercer\'s word', truth: true,
    requires: { D4_TREAD: 'CUTLER', D4_WORD: 'MERCER' },
    text: 'Wade Cutler followed Hale up the back stair and killed him on the floor of Room 4 with that narrow knife. He wrote Mrs. Gable\'s note, took it back from my coat and burned it. He does the work; Gideon Mercer gives the word.',
    outcome: {
      aftermath: 'AFTER4_CUTLER',
      do: [{ set: { killerKnown: true } }, { log: 'Settled it: Cutler killed Hale, on Mercer\'s word.' }],
      epilogue: 'I know who, and I know on whose word. Knowing is not proof. The proof is up on the ridge with Cutler and his powder, and with a girl who saw it happen.',
    },
  },
  C4_ALONE: {
    q: 'Q_KILLER', title: 'Cutler, on his own account',
    requires: { D4_TREAD: 'CUTLER', D4_WORD: 'ALONE' },
    text: 'Wade Cutler killed Hale, for his dead father\'s share of whatever the Order buried. Mercer pays his wages and has not asked what he does with his nights.',
    outcome: {
      aftermath: 'AFTER4_ALONE',
      do: [{ set: { cutlerAlone: true } }, { log: 'Settled it: Cutler killed Hale on his own account.' }],
      epilogue: 'Word went up the street that the foreman did it alone. Gideon Mercer sent his regrets to the Black Ram, and a bottle, and a man to ask whether I would be leaving when the pass opens.',
    },
  },
  C4_MERCER: {
    q: 'Q_KILLER', title: 'Mercer\'s own hand',
    requires: { D4_TREAD: 'MERCER' },
    text: 'Gideon Mercer climbed the back stair himself and killed the sheriff who would not leave old things alone. His foreman only cleaned up after him.',
    outcome: {
      aftermath: 'AFTER4_MERCER',
      do: [{ set: { mercerAccused: true } }, { log: 'Settled it: Mercer killed Hale with his own hand.' }],
      epilogue: 'I named Gideon Mercer. By dusk the whole street had it, and so had Mercer, and so had the man who actually holds his knife.',
    },
  },
});

// The aftermath when Silas leaves a case without committing to anything (per case).
export const OPEN_OUTCOMES = {
  HALE: {
    aftermath: 'AFTER_OPEN',
    do: [{ log: 'Left the mill without a conclusion.' }],
    epilogue: 'I told Finch what I had seen, and nothing of what I made of it. He cut the sheriff down at first light, because somebody had to. The question stays open in my notebook.',
  },
  ROOM4: {
    aftermath: 'AFTER3_OPEN',
    do: [{ log: 'Kept what I made of Room 4 to myself.' }],
    epilogue: 'I told Finch about the stair and nothing about what I made of it. He went home looking at every door he passed.',
  },
  ORDER: {
    aftermath: 'AFTER2_OPEN',
    do: [{ log: 'Kept what I found today to myself.' }],
    epilogue: 'I kept what I had found to myself: a scraped ledger, a dead wire, a grave somebody visits. Tomorrow I will know more, or someone will make sure I don\'t.',
  },
  KILLER: {
    aftermath: 'AFTER4_OPEN',
    do: [{ log: 'Kept to myself who came up the stair after Hale.' }],
    epilogue: 'I said no name at supper. Whoever came up that stair is still a step ahead of me, and tonight the step goes up the ridge.',
  },
};
export const OPEN_OUTCOME = OPEN_OUTCOMES.HALE; // (the first chapter's name for it)

// Board positions of the clues (0..1 of the board area), around the deductions they support (a clue shared by two
// questions may give a position per question). Deduction positions are on the deductions themselves (`map`). Only
// the current question's threads and the clues joined to them are drawn.
export const STATEMENT_MAP = {
  S_LITTLE_BLOOD: { x: 0.0, y: 0.0 }, S_HOISTED: { x: 0.33, y: 0.0 }, S_FROM_CREEK: { x: 0.0, y: 0.5 },
  S_LEDGER: { x: 1.0, y: 0.0 },
  S_OLD_BLOOD: { x: 0.0, y: 1.0 }, S_MISSING: { x: 0.33, y: 1.0 },
  S_SCREAM: { x: 0.67, y: 1.0 }, S_TRACKS: { x: 1.0, y: 1.0 }, S_RIDGE: { x: 1.0, y: 0.5, Q_ORDER: { x: 1.0, y: 1.0 } },
  S_PIT: { x: 0.5, y: 0.5 },
  S_GABLE_GUEST: { x: 0.0, y: 0.0 }, S_REGISTER: { x: 0.33, y: 0.0 }, S_BOARDS: { x: 0.5, y: 1.0 },
  S3_COAT: { x: 0.0, y: 0.38 }, S3_BUTTON: { x: 0.0, y: 0.9 }, S3_LYE: { x: 0.2, y: 1.0 }, S3_STAIR: { x: 1.0, y: 0.38 }, S3_HEARD: { x: 1.0, y: 0.92 },
  S3_NOTE: { x: 0.62, y: 0.0 }, S_MARKS: { x: 0.67, y: 0.0, Q_ROOM4: { x: 1.0, y: 0.0 } },
  S3_DRUGGED: { x: 0.5, y: 0.0 }, S3_SEARCHED: { x: 0.0, y: 0.9 }, S3_TIN: { x: 1.0, y: 0.9 },
  S4_REGISTER: { x: 0.2, y: 1.0 }, S4_RUSK: { x: 0.8, y: 1.0 },
  S4_NAME: { x: 0.5, y: 0.75 }, S4_KNIFE: { x: 0.0, y: 1.0 }, S4_ASHES: { x: 0.2, y: 0.0 }, S4_HAND: { x: 0.8, y: 0.0 },
  S4_ORDER: { x: 1.0, y: 1.0 }, S4_HEEL: { x: 1.0, y: 0.3 }, S4_WATCH: { x: 0.0, y: 0.3 },
  S4_BOOK: { x: 0.5, y: 0.0 }, S4_PAD: { x: 0.0, y: 0.9 }, S4_FINCH: { x: 0.5, y: 1.0 }, S4_CLARA: { x: 1.0, y: 0.9 },
  S2_FREIGHT: { x: 0.0, y: 0.0 }, S2_CRATE: { x: 0.3, y: 0.0 }, S2_CACHE: { x: 0.58, y: 0.0 }, S2_HEELS: { x: 1.0, y: 0.0 },
  S2_COIN: { x: 0.0, y: 0.46 }, S2_HALE_ASKED: { x: 0.3, y: 0.6 }, S2_MILL_HEELS: { x: 1.0, y: 0.48 },  S2_FIGURE: { x: 1.0, y: 0.66 },
  S2_WIRE: { x: 0.0, y: 1.0 }, S2_LINE_DEAD: { x: 0.33, y: 1.0 }, S2_SOOT: { x: 0.64, y: 1.0 },
};
