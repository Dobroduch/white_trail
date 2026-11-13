// The case-solving data: questions, the short key statements the deduction page works with, deductions (each formed
// from an authored pair of statements, most with two plausible readings), and the conclusions those readings can
// add up to. All of it is conditional on explicit story state; the rules live in systems/caseSystem.js.
//
// The flow, after the Sherlock Holmes games:
//   evidence (journal) ─► key statements (short, merged, per question) ─► pair two ─► deduction
//   deduction ─► choose one of its readings ─► the chosen readings add up to a conclusion ─► commit to one.
// The same deductions support several conclusions; small details in dialogue and the scenes (listed as `details`)
// bear on which reading holds. Nothing in the UI says which conclusion is true while the player is deciding:
// `truth` is read only after commitment, by the aftermath.

// ---------------- questions ----------------
// `case` marks a question that can be closed by committing to a conclusion. Questions without one stay open (their
// statements and deductions are still worked on the same page) until a later chapter extends them.
export const QUESTIONS = [
  { id: 'Q_HALE', case: 'HALE', title: 'What happened to Sheriff Hale?', short: 'The sheriff', if: { flag: 'foundSheriffBody' } },
  { id: 'Q_ROOM4', title: 'Whose blood was scrubbed from Room 4?', short: 'Room 4', if: { evidence: 'HOTEL_ROOM4_BOARDS' } },
  // Chapter 2, the second day
  { id: 'Q_ORDER', case: 'ORDER', title: 'What is the Pale Order doing now?', short: 'The Order, now', if: { flag: 'ch2Started' } },
];

// ---------------- key statements ----------------
// A statement is known when its `if` holds, or (without `if`) when any of its `sources` has been recorded. `sources`
// are the journal records it was drawn from (overlapping records are merged into one statement); `variants` give the
// first text whose condition holds. `label` is the short list name.
export const STATEMENTS = {
  // --- Q_HALE ---
  S_MISSING: { q: 'Q_HALE', label: 'Gone three nights', text: 'Hale went out after dark three nights ago and did not come back.', sources: ['T_FINCH_HALE', 'ROAD_NOTICE', 'T_GABLE_HALE'] },
  S_LITTLE_BLOOD: { q: 'Q_HALE', label: 'Little blood beneath him', text: 'The snow under the body is nearly clean: a few dark spots, no more.', sources: ['SAWMILL_BODY'] },
  S_OLD_BLOOD: { q: 'Q_HALE', label: 'Old, frozen blood', text: 'The blood on his coat froze long before tonight, and his hands are frozen hard as wood.', sources: ['SAWMILL_BODY'], if: { examined: 'SAWMILL_BODY' } },
  S_HOISTED: { q: 'Q_HALE', label: 'Hauled up by hand', text: 'He was hauled up over the beam on new rope and tied off at the post.', sources: ['SAWMILL_ROPE'] },
  S_FROM_CREEK: { q: 'Q_HALE', label: 'Dragged to the wheel', sources: ['SAWMILL_DRAG', 'SAWMILL_WATCH'], variants: [
    { if: { examined: 'SAWMILL_DRAG' }, text: 'A furrow with heel-drag marks runs to the wheel along the ground, out from under the frame.' },
    { if: { evidence: 'SAWMILL_DRAG' }, text: 'A furrow runs up from the creek bank toward the wheel, along the ground.' },
    { if: {}, text: 'His broken watch lay between the body and the creek.' },
  ] },
  S_MARKS: { q: 'Q_HALE', label: 'Marks cut in the post', text: 'Fresh tally marks, cut at eye height and facing the path.', sources: ['SAWMILL_MARKS'] },
  S_LEDGER: { q: 'Q_HALE', label: 'The Pale Order ledger', text: 'The Pale Order\'s old accounts, thrown on a dead fire and left half-burned.', sources: ['SAWMILL_LEDGER'] },
  S_SCREAM: { q: 'Q_HALE', label: 'The scream at 02:15', text: 'A scream from the mill at 02:15. Mrs. Gable knew at once where it came from.', sources: ['T_GABLE_NIGHT'], if: { flag: 'heardScream' } },
  S_TRACKS: { q: 'Q_HALE', label: 'Fresh tracks to the mill', text: 'One set of prints went down the creek path fast tonight, before me.', sources: ['CREEK_TRACKS'] },
  S_RIDGE: { q: 'Q_HALE', label: 'A watcher on the ridge', text: 'A lantern on the ridge watched me find him, then went dark.', sources: [], if: { flag: 'ridgeLightSeen' } },
  S_PIT: { q: 'Q_HALE', label: 'The hollow in the pit', text: 'Something man-sized lay in the wheel pit, on the ice, before it was dragged out.', sources: ['PIT_HOLLOW'] },
  // --- Q_ROOM4 ---
  S_BOARDS: { q: 'Q_ROOM4', label: 'Blood scrubbed out', text: 'Someone scrubbed blood out of the floor of Room 4 with lye.', sources: ['HOTEL_ROOM4_BOARDS'], if: { examined: 'HOTEL_ROOM4_BOARDS' } },
  S_GABLE_GUEST: { q: 'Q_ROOM4', label: 'Gable: a sick guest', sources: ['T_GABLE_ROOM4', 'T_GABLE_REGISTER'], variants: [
    { if: { evidence: 'T_GABLE_REGISTER' }, text: 'Mrs. Gable says a guest took ill in Room 4, and paid to be kept out of the book.' },
    { if: {}, text: 'Mrs. Gable says a guest took ill in Room 4.' },
  ] },
  S_REGISTER: { q: 'Q_ROOM4', label: 'No one in the register', text: 'The register shows no guest in Room 4 for a fortnight.', sources: ['HOTEL_REGISTER'] },
  // --- Q_ORDER (Chapter 2) ---
  S2_FREIGHT: { q: 'Q_ORDER', label: 'The scraped freight entry', sources: ['STORE_LEDGER'], variants: [
    { if: { examined: 'STORE_LEDGER' }, text: 'Forty pounds came up on Rusk\'s last freight, and the book was scraped to say lamp oil. Under it: "Powd—".' },
    { if: {}, text: 'Rusk\'s last freight came up from the railhead nine days ago.' },
  ] },
  S2_COIN: { q: 'Q_ORDER', label: 'Paid in coin, fetched at night', sources: ['T_RUSK_FREIGHT'], variants: [
    { if: { evidence: 'T_RUSK_SCRAPED' }, text: 'Rusk: the freight was paid in coin and fetched after dark, no name on it; the page "came to him like that".' },
    { if: {}, text: 'Rusk: the freight was paid in coin and fetched after dark, no name on it.' },
  ] },
  S2_CRATE: { q: 'Q_ORDER', label: 'An empty powder crate', sources: ['STORE_CRATE'], variants: [
    { if: { examined: 'STORE_CRATE' }, text: 'An empty GIANT POWDER crate in Rusk\'s back corner, a paper band in the sawdust dated this autumn.' },
    { if: {}, text: 'A long crate in Rusk\'s back corner, packed with sawdust, empty.' },
  ] },
  S2_CACHE: { q: 'Q_ORDER', label: 'Powder in a miner\'s grave', text: 'Dynamite, fuse and caps buried in Amos Pell\'s grave, wrapped in an old cavalry jacket.', sources: ['GRAVE_DISTURBED'], if: { examined: 'GRAVE_DISTURBED' } },
  S2_HEELS: { q: 'Q_ORDER', label: 'Riding boots at the grave', text: 'Riding-boot prints around the opened grave: a narrow heel, a long straight sole.', sources: ['GRAVE_PRINTS'] },
  S2_MILL_HEELS: { q: 'Q_ORDER', label: 'Riding boots at the mill', text: 'The same narrow heel under the mill roof, the night Hale was hung.', sources: ['SAWMILL_BOOTPRINTS'], if: { all: [{ flag: 'ch2Started' }, { evidence: 'SAWMILL_BOOTPRINTS' }] } },
  S2_WIRE: { q: 'Q_ORDER', label: 'The wire was cut', text: 'The telegraph wire was cut clean, and the end bent back to look torn.', sources: ['TOWER_WIRE'], if: { examined: 'TOWER_WIRE' } },
  S2_LINE_DEAD: { q: 'Q_ORDER', label: 'Dead since I came', text: 'Ada Bell: the line went dead at six the evening I arrived; the next mile is cut too.', sources: ['T_ADA_LINE'] },
  S2_SOOT: { q: 'Q_ORDER', label: 'A lantern kept at the tower', text: 'Fresh soot over a lantern hook on the tower platform, which looks straight down on the mill.', sources: ['TOWER_SOOT'] },
  S2_FIGURE: { q: 'Q_ORDER', label: 'Vale\'s Pale Figure', text: 'Vale: the Pale Figure carries a lamp on the ridge, and those who follow it to the old workings do not come down.', sources: ['T_VALE_FIGURE'] },
  S2_WATCHER: { q: 'Q_ORDER', label: 'The watcher on the ridge', text: 'Last night a lantern on the ridge watched me find Hale, swung once, and went dark.', sources: [], if: { all: [{ flag: 'ch2Started' }, { flag: 'ridgeLightSeen' }] } },
  S2_HALE_ASKED: { q: 'Q_ORDER', label: 'Hale asked about the freight', sources: ['T_RUSK_HALE', 'T_FINCH_FREIGHT'], variants: [
    { if: { evidence: 'T_RUSK_HALE' }, text: 'Hale read Rusk\'s freight book "like scripture" a fortnight before he died, and asked about that freight.' },
    { if: {}, text: 'Hale went out the last night with one of Rusk\'s freight bills folded in his coat.' },
  ] },
};

// ---------------- deductions ----------------
// pairs:    authored pairs of statements that form it (alternative routes)
// readings: two plausible interpretations; the player chooses one (state.readings[id])
// details:  journal records that bear on which reading holds (shown once recorded; never ranked)
// links:    other deductions it bears on (drawn as edges on the mind map)
// map:      position on the question's mind map, in 0..1 of the map area
// IDs kept from the first version (D_SCENE_ARRANGED, D_SAME_COUNTING, D_UNWRITTEN_GUEST) so existing saves keep them.
export const DEDUCTIONS = {
  D_SCENE_ARRANGED: {
    q: 'Q_HALE', title: 'He did not bleed here',
    pairs: [['S_LITTLE_BLOOD', 'S_HOISTED'], ['S_LITTLE_BLOOD', 'S_FROM_CREEK']],
    text: 'Too little blood beneath him for where he hangs, and the rest of the scene shows labour: a rope hauled over a beam and tied off, a body brought along the ground. Hands made this display.',
    limits: 'Who did it, and why they wanted him seen this way, the evidence does not yet say.',
    readings: {
      DRAINED: { label: 'Drained', text: 'He was bled out before he was strung up, the way the town will tell it.' },
      MOVED: { label: 'Moved', text: 'He bled somewhere else, and was brought here afterwards.' },
    },
    details: ['SAWMILL_DRAG', 'SAWMILL_ROPE', 'T_FINCH_RIDGE'],
    links: ['D_LONG_DEAD', 'D_SAME_COUNTING'],
    map: { x: 0.2, y: 0.25 },
  },
  D_LONG_DEAD: {
    q: 'Q_HALE', title: 'Old blood, three nights gone',
    pairs: [['S_OLD_BLOOD', 'S_MISSING']],
    text: 'The blood on his coat froze long before tonight, and nobody has seen him since he went out three nights ago.',
    limits: 'Where he was in between, the body alone cannot tell me.',
    readings: {
      THAT_NIGHT: { label: 'Died that night', text: 'He was wounded the night he went missing, and died of it then.' },
      KEPT_ALIVE: { label: 'Held until tonight', text: 'He was wounded that night, but kept alive somewhere until tonight.' },
    },
    details: ['SAWMILL_BODY', 'PIT_HOLLOW', 'T_GABLE_HALE'],
    links: ['D_THE_SCREAM'],
    map: { x: 0.2, y: 0.75 },
  },
  D_SAME_COUNTING: {
    q: 'Q_HALE', title: 'The same counting',
    pairs: [['S_MARKS', 'S_LEDGER']],
    text: 'The strokes cut into the post are grouped the way the tallies run down the burned ledger\'s columns. Whoever carved them knew those books, or wanted the finder to think of them.',
    limits: 'What the marks count, I cannot yet read.',
    readings: {
      CLAIM: { label: 'A claim', text: 'The Order\'s own mark: whoever killed him is putting the Order\'s name to it.' },
      DRESSING: { label: 'Set dressing', text: 'Left to be found: someone wants the finder to think of the Order.' },
    },
    details: ['SAWMILL_MARKS', 'SAWMILL_LEDGER', 'T_FINCH_RIDGE'],
    links: [],
    map: { x: 0.82, y: 0.25 },
  },
  D_THE_SCREAM: {
    q: 'Q_HALE', title: 'A scream, and someone abroad',
    pairs: [['S_SCREAM', 'S_TRACKS'], ['S_SCREAM', 'S_RIDGE']],
    text: 'A scream from the mill at 02:15, and someone else out by the creek tonight: fresh prints going down, a lantern on the ridge.',
    limits: 'Whose voice it was, or whose lantern, I have not seen.',
    readings: {
      DEATH: { label: 'His death', text: 'The scream was Hale\'s: he was killed at the mill at 02:15.' },
      SUMMONS: { label: 'A summons', text: 'The scream was meant to be heard: someone wanted him found tonight.' },
    },
    details: ['T_GABLE_VOICE', 'CREEK_TRACKS', 'T_GABLE_NIGHT'],
    links: [],
    map: { x: 0.82, y: 0.75 },
  },
  D_WHERE_KEPT: { // only from the optional wheel pit
    q: 'Q_HALE', title: 'Kept in the cold',
    pairs: [['S_PIT', 'S_FROM_CREEK'], ['S_PIT', 'S_OLD_BLOOD']],
    text: 'The furrow comes out from the wheel pit, where something the size of a man lay frozen long enough for the frost to grow over it, before it was hauled up to the wheel.',
    limits: 'Who put him there, and who hauled him out tonight, it does not say.',
    details: ['PIT_HOLLOW'],
    links: ['D_LONG_DEAD', 'D_SCENE_ARRANGED'],
    map: { x: 0.5, y: 0.75 },
  },
  D_UNWRITTEN_GUEST: {
    q: 'Q_ROOM4', title: 'An unwritten guest',
    pairs: [['S_GABLE_GUEST', 'S_REGISTER']],
    text: 'Mrs. Gable says a guest took ill in Room 4. Her own register shows no one in Room 4 for a fortnight. Either the guest was kept off the books, or there was no guest at all.',
    limits: 'Whose blood was scrubbed from the floor, and why it was hidden, remains open.',
    details: ['HOTEL_ROOM4_BOARDS', 'T_GABLE_REGISTER'],
    links: [],
    map: { x: 0.5, y: 0.5 },
  },
};

// --- Q_ORDER (Chapter 2) ---
Object.assign(DEDUCTIONS, {
  D2_BOUGHT_QUIET: {
    q: 'Q_ORDER', title: 'Bought quietly',
    pairs: [['S2_FREIGHT', 'S2_COIN'], ['S2_FREIGHT', 'S2_CRATE']],
    text: 'Powder came up on Rusk\'s freight this autumn, paid for in coin, collected in the dark, and entered in the book as lamp oil.',
    limits: 'Who paid, Rusk says he never asked. Whether he scraped the page himself, I cannot tell.',
    details: ['STORE_OIL', 'T_RUSK_SCRAPED'],
    links: ['D2_GRAVE_POWDER', 'D2_HALE_KNEW'],
    map: { x: 0.12, y: 0.3 },
  },
  D2_GRAVE_POWDER: {
    q: 'Q_ORDER', title: 'Powder in the ground',
    pairs: [['S2_CACHE', 'S2_CRATE'], ['S2_CACHE', 'S2_FREIGHT']],
    text: 'There is dynamite in Amos Pell\'s grave, and a crate that held dynamite stands empty in Rusk\'s store.',
    limits: 'Who buried it, and what for, the grave does not say.',
    readings: {
      OLD: { label: 'Left from the war', text: 'An old military cache, wrapped in a dead trooper\'s jacket and kept in the ground for thirty years.' },
      NEW: { label: 'This winter\'s freight', text: 'New powder, bought this autumn and hidden in the grave. The old jacket is only a wrapping.' },
    },
    details: ['GRAVE_CACHE', 'STORE_CRATE'],
    links: ['D2_SAME_HEELS'],
    map: { x: 0.48, y: 0.3 },
  },
  D2_SAME_HEELS: {
    q: 'Q_ORDER', title: 'The same boots',
    pairs: [['S2_HEELS', 'S2_MILL_HEELS']],
    text: 'The riding boots that stood under the mill roof the night Hale was hung have stood by the opened grave too.',
    limits: 'Old troopers keep their boots, Finch says. That is a good many men.',
    details: ['T_FINCH_BOOTS', 'STORE_BOOTS'],
    links: [],
    map: { x: 0.88, y: 0.3 },
  },
  D2_CUT_OFF: {
    q: 'Q_ORDER', title: 'Cut off on purpose',
    pairs: [['S2_WIRE', 'S2_LINE_DEAD']],
    text: 'The line did not fail in the storm. It was cut, the evening I came, and a mile more of it along the ridge.',
    limits: 'Whose hand held the cutters, there is nothing up there to say.',
    readings: {
      OUT: { label: 'To keep word in', text: 'Cut so that no word of Hale\'s death could go out of the valley.' },
      IN: { label: 'To keep help out', text: 'Cut so that nobody can be sent for, until something here is done.' },
    },
    details: ['T_ADA_LINE', 'T_CONDUCTOR_PASS', 'T_ADA_MEND'],
    links: [],
    map: { x: 0.12, y: 0.85 },
  },
  D2_TOWER_LIGHT: {
    q: 'Q_ORDER', title: 'The light on the ridge',
    pairs: [['S2_SOOT', 'S2_WATCHER'], ['S2_SOOT', 'S2_FIGURE']],
    text: 'Somebody keeps a lantern at the telegraph tower, where the whole valley can be seen. A lantern on the ridge is what the town calls the Pale Figure.',
    limits: 'Who holds the lantern, I have not seen.',
    readings: {
      FIGURE: { label: 'The Pale Figure\'s lamp', text: 'The thing the Reverend preaches walks the ridge with its lamp, as the town says.' },
      SIGNAL: { label: 'A man, signalling', text: 'A man stands up there with a lantern to watch, and to signal down into the valley.' },
    },
    details: ['TOWER_SOOT', 'TOWER_VIEW', 'T_VALE_FIGURE'],
    links: ['D2_CUT_OFF'],
    map: { x: 0.82, y: 0.85 },
  },
  D2_HALE_KNEW: {
    q: 'Q_ORDER', title: 'Hale was on the same trail',
    pairs: [['S2_HALE_ASKED', 'S2_FREIGHT'], ['S2_HALE_ASKED', 'S2_COIN']],
    text: 'A fortnight before he died, Sheriff Hale was asking about the same freight I am asking about now.',
    limits: 'That he died for asking, I believe. I cannot prove it.',
    details: ['T_RUSK_HALE', 'T_FINCH_FREIGHT'],
    links: ['D2_BOUGHT_QUIET'],
    map: { x: 0.62, y: 0.55 },
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

// The aftermath when Silas leaves a case without committing to anything (per case).
export const OPEN_OUTCOMES = {
  HALE: {
    aftermath: 'AFTER_OPEN',
    do: [{ log: 'Left the mill without a conclusion.' }],
    epilogue: 'I told Finch what I had seen, and nothing of what I made of it. He cut the sheriff down at first light, because somebody had to. The question stays open in my notebook.',
  },
  ORDER: {
    aftermath: 'AFTER2_OPEN',
    do: [{ log: 'Kept what I found today to myself.' }],
    epilogue: 'I kept what I had found to myself: a scraped ledger, a dead wire, a grave somebody visits. Tomorrow I will know more, or someone will make sure I don\'t.',
  },
};
export const OPEN_OUTCOME = OPEN_OUTCOMES.HALE; // (the first chapter's name for it)

// Mind-map positions of the key statements (0..1 of the map area), around the deductions they support. Deduction
// positions are on the deductions themselves (`map`). Only formed deductions and their supporting statements are drawn.
export const STATEMENT_MAP = {
  S_LITTLE_BLOOD: { x: 0.0, y: 0.0 }, S_HOISTED: { x: 0.33, y: 0.0 }, S_FROM_CREEK: { x: 0.0, y: 0.5 },
  S_MARKS: { x: 0.67, y: 0.0 }, S_LEDGER: { x: 1.0, y: 0.0 },
  S_OLD_BLOOD: { x: 0.0, y: 1.0 }, S_MISSING: { x: 0.33, y: 1.0 },
  S_SCREAM: { x: 0.67, y: 1.0 }, S_TRACKS: { x: 1.0, y: 1.0 }, S_RIDGE: { x: 1.0, y: 0.5 },
  S_PIT: { x: 0.5, y: 0.5 },
  S_GABLE_GUEST: { x: 0.1, y: 0.15 }, S_REGISTER: { x: 0.9, y: 0.15 }, S_BOARDS: { x: 0.5, y: 0.95 },
  S2_FREIGHT: { x: 0.0, y: 0.0 }, S2_CRATE: { x: 0.3, y: 0.0 }, S2_CACHE: { x: 0.58, y: 0.0 }, S2_HEELS: { x: 1.0, y: 0.0 },
  S2_COIN: { x: 0.0, y: 0.46 }, S2_HALE_ASKED: { x: 0.3, y: 0.6 }, S2_MILL_HEELS: { x: 1.0, y: 0.48 }, S2_FIGURE: { x: 1.0, y: 0.66 },
  S2_WIRE: { x: 0.0, y: 1.0 }, S2_LINE_DEAD: { x: 0.33, y: 1.0 }, S2_SOOT: { x: 0.64, y: 1.0 }, S2_WATCHER: { x: 1.0, y: 1.0 },
};
