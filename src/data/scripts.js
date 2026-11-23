// Authored sequences (cutscenes / story beats). Each step is a small command run in order by
// systems/cutscene.js. One-time beats are guarded by story flags so reloads never replay them.
import { COACH_DOOR_OFFSET } from '../world/props.js';

const COACH_DOOR = -10 + COACH_DOOR_OFFSET; // world x of the coach door when the train has stopped

export const SCRIPTS = {
  INTRO: [
    { control: false },
    { player: { hide: true, x: COACH_DOOR, face: 1 } },
    { npc: { id: 'conductor', hide: true } },
    { fade: { to: 1, dur: 0 } },
    { ambience: 'station' },
    { cameraAt: { x: 170 } },
    { wait: 0.8 },
    { sfx: 'whistle' },
    { train: 'arrive', nowait: true },
    { fade: { to: 0, dur: 3.0 }, nowait: true },
    { wait: 1.4 },
    { title: true },
    { trainWait: true },
    { label: true },
    { wait: 0.8 },
    { sfx: 'door' },
    { npc: { id: 'conductor', show: true, x: COACH_DOOR + 4 } },
    { npc: { id: 'conductor', walkTo: 232, speed: 30 } },
    { npc: { id: 'conductor', face: -1 } },
    { wait: 0.5 },
    { player: { show: true } },
    { player: { walkTo: COACH_DOOR + 12 } },
    { wait: 0.5 },
    { doc: 'TELEGRAM' },
    { set: { introDone: true } },
    { log: 'Arrived at Blackwood Station in the snow.' },
    { checkpoint: true },
    { control: true },
    { hint: 'A / D or arrows — walk.   E — examine, speak.   N — notebook.   M — map.', dur: 9 },
  ],

  STATION_BLOCK: [
    { control: false },
    { line: { who: 'conductor', text: 'Mister! A word, before you go off into that.' } },
    { player: { walkTo: -40, relative: true } },
    { control: true },
  ],

  CONDUCTOR_DEPART: [
    { control: false },
    { npc: { id: 'conductor', walkTo: COACH_DOOR, speed: 34 } },
    { npc: { id: 'conductor', hide: true } },
    { sfx: 'door' },
    { wait: 0.9 },
    { sfx: 'whistle' },
    { wait: 1.2 },
    { train: 'depart', nowait: true },
    { set: { trainDeparted: true } },
    { log: 'The train went back down the line. The pass is closing.' },
    { wait: 2.5 },
    { control: true },
    { checkpoint: true },
    { bark: 'And then it is only the wind.' },
  ],

  ROAD_ENTER: [
    { ambient: true },
    { wait: 1.2 },
    { hint: 'It is dark past the station lamps. F — light the lantern.', dur: 8 },
  ],

  VILLAGE_WATCHER: [
    { ambient: true },
    { wait: 0.5 },
    { set: { curtainDrawn: true } },
    { sfx: 'curtain' },
    { bark: 'A face at the window. Then the lamp goes out.' },
  ],

  FINCH_MEET: [
    { control: false },
    { player: { face: 1 } },
    { npc: { id: 'finch', approachPlayer: 20, speed: 38 } },
    { say: 'FINCH_MEET' },
    { npc: { id: 'finch', walkTo: 474, speed: 30 } },
    { npc: { id: 'finch', hide: true } },
    { set: { metFinch: true } },
    { log: 'Met Constable Finch outside the Black Ram.' },
    { checkpoint: true },
    { control: true },
  ],

  PARLOR_ENTER: [
    { ambient: true },
    { set: { parlorEntered: true } },
    { markParlor: true },
    { murmur: 'stop' },
    { wait: 0.8 },
    { bark: 'The talk at the corner table stops when I come in.' },
  ],

  NIGHT_0215: [
    { control: false },
    { fade: { to: 1, dur: 1.8 } },
    { ambience: 'silence' },
    { wait: 0.8 },
    { card: { lines: ['Later.'], dur: 1.8 } },
    { phase: 'NIGHT', time: [2, 15] },
    { wait: 0.6 },
    { card: { lines: ['02:15'], hold: true } },
    { wait: 1.0 },
    { sfx: 'scream' },
    { wait: 3.6 },
    { card: null },
    { set: { heardScream: true } },
    { log: 'A scream, from the direction of the creek.' },
    { ambience: 'room4' },
    { checkpoint: true },
    { fade: { to: 0, dur: 1.6 } },
    { line: { who: 'note', text: 'A scream. Outside, and not far — down toward the creek.' } },
    { control: true },
    { hint: 'The front door is downstairs.', dur: 6 },
  ],

  GABLE_NIGHT: [
    { control: false },
    { wait: 0.5 },
    { say: 'GABLE_NIGHT' },
    { set: { gableNightTalk: true } },
    { checkpoint: true },
    { control: true },
  ],

  CREEK_ENTER: [
    { ambient: true },
    { wait: 0.8 },
    { bark: 'The bank path drops toward the water. I can hear it moving under the ice.' },
    { ifLanternOff: true, hint: 'Hard to see the path. F — lantern.', dur: 7 },
  ],

  SAWMILL_BODY: [
    { control: false },
    { music: 'sting' },
    { camera: { x: 380, y: 116, zoom: 1.24 } },
    { wait: 2.0 },
    { line: { who: 'note', text: 'A man, hung by his ankles from the wheel frame. A star on his coat.' } },
    { line: { who: 'silas', text: '...Sheriff.' } },
    { camera: null },
    { set: { foundSheriffBody: true } },
    { log: 'Found Sheriff Hale at the old sawmill.' },
    { char: { hale: { found: true } } },
    { checkpoint: true },
    { control: true },
    { hint: 'Look carefully. Each thing you examine is written into your notebook (N).', dur: 9 },
  ],

  RIDGE_LIGHT: [
    { control: false },
    { wait: 0.4 },
    { wind: 0.3 },
    { set: { ridgeLightStart: true } },
    { ridge: 'show' },
    { camera: { x: 400, y: 112, zoom: 1.1 } },
    { wait: 2.6 },
    { line: { who: 'note', text: 'A light, up on the ridge. Still. Then it swings, once — the way a lantern swings in a hand.' } },
    { ridge: 'hide' },
    { wait: 1.4 },
    { wind: null },
    { line: { who: 'silas', text: 'Somebody watched me find him.' } },
    { camera: null },
    { set: { ridgeLightSeen: true } },
    { log: 'A lantern on the ridge, watching. Then dark.' },
    { checkpoint: true },
    { control: true },
    { hint: 'Record what you can. Leave by the footbridge when you are ready.', dur: 8 },
  ],

  SLICE_END: [
    { control: false },
    { casePrompt: 'HALE' }, // decide (or leave open) what happened to Hale before going back up
    { fade: { to: 1, dur: 2.0 } },
    // first light on the hotel forecourt, at the top of the creek path: Finch waiting there, the hotel's windows grey
    // with the dawn. The "First light." card, then the forecourt fades in under the conversation.
    { phase: 'DAY', time: [6, 40] },
    { set: { firstLightFinch: true } },
    { scene: { id: 'BLACK_RAM_EXTERIOR', spawn: 'fromCreek' } },
    { aftermath: 'HALE', reveal: true }, // what that decision sets in motion
    { set: { sliceComplete: true } },
    { checkpoint: true },
    { endCard: true },
  ],

  // ======================= Chapter 2: the second day =======================
  // Straight on from the first night's end card: the chapter title over black, then first light on the hotel forecourt,
  // where the aftermath with Finch (at the top of the creek path) has just ended.
  CH2_OPEN: [
    { control: false },
    { fade: { to: 1, dur: 0 } },
    { card: { lines: ['II', 'DECEIT AND ISOLATION'], dur: 3.6 } },
    { phase: 'DAY', time: [7, 50], day: 2 },
    { set: { ch2Started: true, firstLightFinch: false } }, // Finch has gone off up the street
    { scene: { id: 'BLACK_RAM_EXTERIOR', spawn: 'fromCreek' } },
    { fade: { to: 0, dur: 2.0 } },
    { label: true },
    { say: 'CH2_OPEN' },
    { log: 'The second day. The storm has not let up, and the pass is still shut.' },
    { checkpoint: true },
    { control: true },
    { hint: 'The second day. Rusk\'s store is back along Main Street, to the west.', dur: 8 },
  ],

  STORE_ENTER: [
    { ambient: true },
    { set: { storeEntered: true } },
    { wait: 0.6 },
    { bark: 'Warm in here. Tins and sacks, and a man by the counter watching me the way a man watches weather.' },
  ],

  GRAVEYARD_ENTER: [
    { ambient: true },
    { set: { graveyardEntered: true } },
    { wait: 0.8 },
    { bark: 'The chapel, and the town\'s dead in rows behind it. One grave by the fence is darker than the rest.' },
  ],

  // the closer look at the disturbed grave opens it (onExamine); shown once the examination text has been read
  GRAVE_OPENED: [
    { afterDialogue: true },
    { control: false },
    { reload: true },
    { wait: 0.4 },
    { line: { who: 'silas', text: 'Somebody means to come back for this.' } },
    { log: 'Found dynamite, fuse and caps buried in Amos Pell\'s grave.' },
    { checkpoint: true },
    { control: true },
  ],

  TOWER_ENTER: [
    { ambient: true },
    { set: { towerEntered: true } },
    { wait: 0.8 },
    { bark: 'Wind straight off the snowfields. The wire sings on the poles, all but one span.' },
    { wait: 4.2 },
    { ifFlag: 'millSearched', bark: 'The snow up here is trodden all over: Finch\'s search party came this way in the night.' },
  ],

  // the day's core finds made: the light starts to go (global event)
  CH2_DUSK: [
    { ambient: true },
    { set: { ch2DuskReady: true } },
    { clock: [16, 40] },
    { wait: 1.2 },
    { bark: 'The light is going. Finch will be at the Black Ram by now, and so should I.' },
    { hint: 'Go back to the Black Ram before dark. Going in ends the day.', dur: 8 },
  ],

  // at the hotel door at dusk: settle (or not) what the day adds up to, then supper with Finch, then the chapter's end
  CH2_END: [
    { control: false },
    { casePrompt: 'ORDER', prompt: 'CASE_PROMPT_ORDER' },
    { fade: { to: 1, dur: 1.6 } },
    { clock: [17, 40] },
    { set: { ch2Supper: true } }, // Finch at the fire, the fire lit (black_ram_parlor.tmj)
    { scene: { id: 'PARLOR', spawn: 'fromStreet' } },
    { player: { x: 152, face: -1 } },
    // the "Dusk." card, then the parlor fades in under the conversation: supper is seen, not told over black
    { aftermath: 'ORDER', cardText: ['Dusk.'], reveal: true },
    { set: { chapter2Complete: true } },
    { log: 'The second day ended at the Black Ram, with Finch.' },
    { checkpoint: true },
    { endCard: 2 },
  ],

  DEDUCTION_HINT: [
    { ambient: true },
    { set: { deductionHintShown: true } },
    { hint: 'Something you found raises a question. Notebook (N) → Deductions: pick the question, then the clue that answers it.', dur: 9 },
  ],

  // ======================= Chapter 3: the third day and night =======================
  // Straight on from the second day's end card (or from the hotel door, if Silas stayed out walking): the chapter title
  // over black, then morning in Room 4.
  CH3_OPEN: [
    { control: false },
    { fade: { to: 1, dur: 0 } },
    { card: { lines: ['III', 'WHAT THE SNOW KEEPS'], dur: 3.6 } },
    { phase: 'DAY', time: [7, 30], day: 3 },
    { set: { ch3Started: true, ch2Supper: false, firstLightFinch: false } },
    { scene: { id: 'ROOM4', spawn: 'fromStairs' } },
    { fade: { to: 0, dur: 2.0 } },
    { label: true },
    { say: 'CH3_OPEN' },
    { log: 'The third day. Hale is to be buried at noon.' },
    { checkpoint: true },
    { control: true },
  ],

  OFFICE_ENTER: [
    { ambient: true },
    { set: { officeEntered: true } },
    { wait: 0.6 },
    { bark: 'A stove, a desk, a cell, and the sheriff on a bench under canvas.' },
  ],

  // at the chapel, once Silas has seen Hale: the burial (noon), and Gideon Mercer
  BURIAL: [
    { control: false },
    { set: { burialOn: true } },
    { clock: [12, 0] },
    { reload: true },
    { wait: 0.8 },
    { line: { who: 'vale', text: 'We commit Nathaniel Hale to the ground he kept, in the sure and certain hope...' } },
    { line: { who: 'note', text: 'The Reverend\'s voice goes on, and then stops, as though he has lost his place. He finds it again, lower.' } },
    { line: { who: 'vale', text: '...The Lord gives. The mountain takes. Amen.' } },
    { line: { who: 'note', text: 'A man in a grey greatcoat stands a little apart, hat in his hands, white whiskers. He watches me, not the grave.' } },
    { set: { burialDone: true } },
    { log: 'Hale was buried at noon, by the chapel. Gideon Mercer was there.' },
    { checkpoint: true },
    { control: true },
  ],

  // the day's work done (the coat looked at, the burial, Mrs. Gable's note): the light goes (global event)
  CH3_DUSK: [
    { ambient: true },
    { set: { ch3DuskReady: true } },
    { clock: [16, 40] },
    { wait: 1.2 },
    { bark: 'The light goes early under the ridge. Supper at the Black Ram, and then a long night by the stair.' },
    { hint: 'Go back to the Black Ram. Going in ends the day.', dur: 8 },
  ],

  // at the hotel door at dusk: settle (or not) Room 4, supper with Finch, then the third night in the parlor
  CH3_EVENING: [
    { control: false },
    { casePrompt: 'ROOM4', prompt: 'CASE_PROMPT_ROOM4' },
    { fade: { to: 1, dur: 1.6 } },
    { clock: [18, 0] },
    { set: { ch3Supper: true } },
    { scene: { id: 'PARLOR', spawn: 'fromStreet' } },
    { player: { x: 152, face: -1 } },
    { aftermath: 'ROOM4', cardText: ['Evening.'], reveal: true },
    { fade: { to: 1, dur: 1.2 } },
    { set: { ch3Supper: false, ch3Night: true } },
    { phase: 'NIGHT', time: [22, 40] },
    { player: { x: 200, face: -1 } },
    { fade: { to: 0, dur: 1.6 } },
    { say: 'CH3_NIGHT' },
    { checkpoint: true },
    { control: true },
  ],

  // the poisoned coffee (GDD §14): the only perceptual distortion in the game, short and authored
  CH3_DRUGGED: [
    { control: false },
    { set: { drankCoffee: true } },
    { line: { who: 'note', text: 'Bitter, and strong enough to stand a spoon in. I drink it anyway.' } },
    { wait: 1.4 },
    { distort: true },
    { wait: 1.6 },
    { line: { who: 'gable', text: 'Mister Vance.' } },
    { line: { who: 'note', text: 'Her voice, from the stair behind me. The stair is in front of me.' } },
    { wait: 1.0 },
    { bark: 'The fire ticks. The fire ticks. The fire ticks.' },
    { wait: 2.6 },
    { line: { who: 'note', text: 'The room is longer than it was, and the lamp is on the wrong side of the shadows.' } },
    { fade: { to: 1, dur: 2.0 } },
    { distort: false },
    { do: [{ removeItem: 'GABLE_NOTE' }, { set: { woke3: true } }] },
    { phase: 'NIGHT', time: [3, 10] },
    { player: { x: 160, face: 1 } },
    { wait: 1.2 },
    { fade: { to: 0, dur: 2.4 } },
    { line: { who: 'note', text: 'The floor. The fire is out. My coat is open, and every pocket has been turned out.' } },
    { line: { who: 'note', text: 'The note Mrs. Gable gave me is gone. Nothing else is.' } },
    { log: 'Drank the coffee by the hob and woke on the floor at 03:10. Mrs. Gable\'s note was gone from my coat.' },
    { checkpoint: true },
    { control: true },
  ],

  // the closer look at the cup: the third night closes on the ridge
  CH3_CLOSE: [
    { afterDialogue: true },
    { control: false },
    { wait: 0.6 },
    { line: { who: 'note', text: 'Through the window, high on the ridge: a lantern. Not watching this time. Climbing, toward the old workings.' } },
    { set: { chapter3Complete: true } },
    { log: 'A lantern on the ridge at a quarter past three, climbing toward the old workings.' },
    { checkpoint: true },
    { endCard: 3 },
  ],
};
