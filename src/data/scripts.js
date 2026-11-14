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
    { aftermath: 'HALE' }, // what that decision sets in motion, at first light
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
    { set: { ch2Started: true } },
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
    { hint: 'Some of what you have seen may connect. Notebook (N) → Deductions: mark two statements that bear on each other.', dur: 9 },
  ],
};
