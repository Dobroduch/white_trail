// Optional, progressive investigation hints. Nothing here is shown unless the player asks (H, or the HUD cue).
//
// TUNING. Delays are seconds of ACTIVE play without progress on the current step: the timer runs only while the
// player is in the world (or reading the notebook / inventory / map), and stops while the game is paused, a cutscene
// holds control, or the tab is hidden. It resets whenever the step changes or the player records something new
// (evidence, a statement, a deduction, a reading, a commitment).
//   firstDelay     before the first nudge can be asked for
//   followUpDelay  further stuck time, after the nudge was read, before the specific follow-up can be asked for
// For playtesting, override both from the URL: ?hintDelay=20 (first) and optionally &hintFollowUp=10.
export const HINT_TIMING = { firstDelay: 150, followUpDelay: 75 };

// The investigation, step by step. The current step is the first whose `done` does not hold (and whose `if`, if any,
// does). `nudge` points toward a person, place or clue; `specific` says what to do.
export const HINT_STEPS = [
  { id: 'H_CONDUCTOR', done: { flag: 'talkedConductor' },
    nudge: 'The conductor is still on the platform. He will not wait for me long.',
    specific: 'Speak to the conductor by the train (walk up to him and press E). The road out of the station opens after that.' },
  { id: 'H_FINCH', done: { flag: 'metFinch' },
    nudge: 'Whoever signed that telegram is up the road, in Crow\'s Hollow.',
    specific: 'Follow the road east into town. Constable Finch is waiting near the Black Ram; hear him out, then say that will do for tonight.' },
  { id: 'H_ROOM', done: { flag: 'hasRoom4Key' },
    nudge: 'I need a bed for the night, and the Black Ram is the only hotel.',
    specific: 'Go into the Black Ram and speak to Mrs. Gable at the reception desk.' },
  { id: 'H_ROOM4', done: { examined: 'HOTEL_ROOM4_BOARDS' },
    nudge: 'Room 4 is mine now. Something about it was too clean.',
    specific: 'Go up the stairs to Room 4. Stand at the floorboards near the foot of the bed and look at them twice.' },
  { id: 'H_SLEEP', done: { flag: 'heardScream' },
    nudge: 'Nothing more tonight but questions. Perhaps it is time to sleep on them.',
    specific: 'Use the bed in Room 4 and turn in for the night.' },
  { id: 'H_OUT', done: { flag: 'gableUnbolted' },
    nudge: 'The scream came from outside. The way out is downstairs, and the door is bolted.',
    specific: 'Go down to the parlor and talk to Mrs. Gable. She will draw the bolt.' },
  { id: 'H_MILL', done: { flag: 'foundSheriffBody' },
    nudge: 'Mrs. Gable said the mill, down by the creek.',
    specific: 'From the hotel forecourt, walk east down to the creek path, then cross the footbridge to the mill.' },
  { id: 'H_SCENE', done: { flag: 'ridgeLightSeen' },
    nudge: 'The scene has more to tell me: the body, the rope, the post, the ground around them.',
    specific: 'Examine at least four things at the mill: the body, the rope, the post, the ash pit, the prints under the roof, the watch, the furrow. Look twice at each.' },
  { id: 'H_DEDUCE', done: { any: [{ deductionsIn: { q: 'Q_HALE', min: 3 } }, { caseCommitted: 'HALE' }] },
    nudge: 'Some of what I have seen belongs together. I should sit down with my notebook.',
    specific: 'Notebook (N), Deductions page: mark two statements. Try the little blood beneath him with the rope or the furrow; the marks with the ledger; the frozen blood with how long he was missing; the scream with the tracks or the ridge.' },
  { id: 'H_DECIDE', done: { caseCommitted: 'HALE' },
    nudge: 'Each thing I have worked out can be read two ways. Before I go back up, I have to decide what I believe.',
    specific: 'In the notebook press C to review the case: choose a reading for each deduction, then commit to the conclusion they support. A closer look at the body, Mrs. Gable at night, and the creek tracks all bear on the readings.' },
  { id: 'H_LEAVE', done: { flag: 'sliceComplete' },
    nudge: 'There is nothing more for me here tonight but the cold.',
    specific: 'Leave the mill by the footbridge, at the west edge.' },
  // ---- Chapter 2: the second day ----
  { id: 'H2_STORE', done: { evidence: 'STORE_LEDGER' }, if: { flag: 'ch2Started' },
    nudge: 'A store keeps accounts, and Rusk\'s is open by day.',
    specific: 'Walk west along Main Street to Rusk\'s store and go in. The account book is on the counter.' },
  { id: 'H2_SCRAPE', done: { examined: 'STORE_LEDGER' }, if: { flag: 'ch2Started' },
    nudge: 'The account book had more to show me than the sums.',
    specific: 'Look at Rusk\'s account book a second time, closely.' },
  { id: 'H2_CHAPEL', done: { evidence: 'GRAVE_DISTURBED' }, if: { flag: 'ch2Started' },
    nudge: 'The lane by the woodshed climbs to the chapel and the graves.',
    specific: 'On Main Street, walk up the chapel lane (past the street lamp, before the woodshed), then along the graves to the fence.' },
  { id: 'H2_GRAVE', done: { examined: 'GRAVE_DISTURBED' }, if: { flag: 'ch2Started' },
    nudge: 'That grave by the fence has been opened, and closed again.',
    specific: 'Look twice at the disturbed grave by the iron fence.' },
  { id: 'H2_TOWER', done: { examined: 'TOWER_WIRE' }, if: { flag: 'ch2Started' },
    nudge: 'The path past the graves follows the telegraph wire up the ridge. The line has been dead since I came.',
    specific: 'Walk east past the graves to the telegraph tower, and look twice at the hanging wire.' },
  { id: 'H2_DEDUCE', done: { any: [{ deductionsIn: { q: 'Q_ORDER', min: 3 } }, { caseCommitted: 'ORDER' }, { flag: 'chapter2Complete' }] }, if: { flag: 'ch2Started' },
    nudge: 'Today\'s finds belong together. Time for the notebook.',
    specific: 'Notebook, Deductions, Next question: "What is the Pale Order doing now?" Pair the grave with the crate or the ledger, the cut wire with what Ada said, the soot at the tower with Vale\'s Figure or the watcher on the ridge.' },
  { id: 'H2_HOME', done: { flag: 'chapter2Complete' }, if: { flag: 'ch2DuskReady' },
    nudge: 'The day is gone. Finch will be at the Black Ram.',
    specific: 'Go back to the Black Ram and go in at the front door.' },
];
