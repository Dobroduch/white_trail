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

// The aftermath when Silas leaves the mill without committing to anything.
export const OPEN_OUTCOME = {
  aftermath: 'AFTER_OPEN',
  do: [{ log: 'Left the mill without a conclusion.' }],
  epilogue: 'I told Finch what I had seen, and nothing of what I made of it. He cut the sheriff down at first light, because somebody had to. The question stays open in my notebook.',
};

// Mind-map positions of the key statements (0..1 of the map area), around the deductions they support. Deduction
// positions are on the deductions themselves (`map`). Only formed deductions and their supporting statements are drawn.
export const STATEMENT_MAP = {
  S_LITTLE_BLOOD: { x: 0.0, y: 0.0 }, S_HOISTED: { x: 0.33, y: 0.0 }, S_FROM_CREEK: { x: 0.0, y: 0.5 },
  S_MARKS: { x: 0.67, y: 0.0 }, S_LEDGER: { x: 1.0, y: 0.0 },
  S_OLD_BLOOD: { x: 0.0, y: 1.0 }, S_MISSING: { x: 0.33, y: 1.0 },
  S_SCREAM: { x: 0.67, y: 1.0 }, S_TRACKS: { x: 1.0, y: 1.0 }, S_RIDGE: { x: 1.0, y: 0.5 },
  S_PIT: { x: 0.5, y: 0.5 },
  S_GABLE_GUEST: { x: 0.1, y: 0.15 }, S_REGISTER: { x: 0.9, y: 0.15 }, S_BOARDS: { x: 0.5, y: 0.95 },
};
