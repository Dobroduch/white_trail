// Scene definitions: geometry, exits, characters, interactables, lights, weather, and story events.
// Phase-specific overrides live under `night` and are merged when state.phase === 'NIGHT'.
import { ROAD_GROUND, CREEK_GROUND } from './painters.js';

const FLAT = [[0, 150], [2000, 150]];

export const SCENES = {
  // STATION, VILLAGE, BLACK_RAM_EXTERIOR and SAWMILL are authored in Tiled (assets/levels/*.tmj), registered in
  // tiled/levelList.js. Station and Sawmill keep their painters for the art until Pass 2.

  ROAD: {
    name: "THE ROAD TO CROW'S HOLLOW", travel: 7, width: 800, exterior: true, ground: ROAD_GROUND, bounds: [4, 796],
    spawns: { fromStation: { x: 14, facing: 1 }, fromVillage: { x: 786, facing: -1 } },
    exits: [
      { side: 'left', to: 'STATION', spawn: 'fromRoad' },
      { side: 'right', to: 'VILLAGE', spawn: 'fromRoad' },
    ],
    interactables: [
      { id: 'rd_sign', x: 150, y: 124, label: 'Signpost', lines: ['A hand-lettered signpost: CROW\'S HOLLOW. The paint is newer than the post.'] },
      { id: 'rd_orecar', x: 362, y: 140, label: 'Ore car', lines: ['An ore car, rusted to its rail and half under the drift. The silver gave out here a long time ago. Nobody troubled to haul the car away.'] },
      { id: 'rd_notice', x: 728, y: 124, label: 'Notice board', evidence: 'ROAD_NOTICE', important: true },
    ],
    weather: { snow: 0.8, wind: 0.75, fog: 0.35 }, darkness: 0.74, ambience: 'road',
    events: [{ id: 'ROAD_ENTER', if: { all: [{ notFlag: 'lanternOn' }, { phase: 'EVENING' }] }, script: 'ROAD_ENTER' }],
  },

  // VILLAGE (Crow's Hollow Main Street) and BLACK_RAM_EXTERIOR (the hotel forecourt) are authored in Tiled:
  // assets/levels/main_street.tmj and black_ram_exterior.tmj, registered in tiled/levelList.js.

  PARLOR: {
    name: 'THE BLACK RAM HOTEL', travel: 1, width: 400, exterior: false, ground: FLAT, bounds: [32, 352],
    spawns: { fromStreet: { x: 40, facing: 1 }, fromStairs: { x: 342, facing: -1 } },
    exits: [],
    doors: [
      { id: 'pl_front', x: 18, label: 'Front door', verb: 'Go out', to: 'BLACK_RAM_EXTERIOR', spawn: 'fromHotel',
        if: { any: [{ phase: 'EVENING' }, { flag: 'gableUnbolted' }] }, blockedLines: ['Bolted. Mrs. Gable keeps the key.'] },
      { id: 'pl_stairs', x: 342, label: 'Stairs to the rooms', verb: 'Go up', to: 'ROOM4', spawn: 'fromStairs',
        if: { flag: 'hasRoom4Key' }, blockedLines: ['The rooms are upstairs. I\'ll need a key from Mrs. Gable first.'] },
    ],
    npcs: [
      { id: 'gable', sprite: 'gable_idle', x: 276, facing: -1, z: 2, if: { phase: 'EVENING' }, dialogue: 'GABLE', name: 'Mrs. Gable' },
      { id: 'finch', sprite: 'finch_idle', x: 122, facing: 1, if: { all: [{ phase: 'EVENING' }, { flag: 'metFinch' }] }, dialogue: 'FINCH_PARLOR', name: 'Constable Finch' },
    ],
    interactables: [
      { id: 'pl_register', x: 303, y: 128, label: 'Guest register', evidence: 'HOTEL_REGISTER', important: true },
      { id: 'pl_photo', x: 161, y: 70, label: 'Photograph', lines: ['A photograph of a mine crew — twenty-odd men squinting at the camera in front of an adit. The brass plate beneath it is too tarnished to read.'] },
      { id: 'pl_fire', x: 84, y: 130, label: 'Fireplace', warm: true, variants: [
        { if: { phase: 'NIGHT' }, lines: ['Embers. The room has gone cold around them.'] },
        { if: {}, lines: ['Pine logs, burning well. The first warm air I\'ve breathed since the train.'] },
      ] },
      { id: 'pl_patrons', x: 168, y: 128, label: 'Corner table', if: { phase: 'EVENING' }, lines: ['Three men at the corner table. They stopped talking when I came in. One of them hasn\'t touched his drink since.'],
        again: ['They are not looking at me now. In a room this size, that takes some effort.'] },
    ],
    props: [
      { type: 'fire', args: [84, 148], if: { phase: 'EVENING' } },
      { type: 'embers', args: [84, 148], if: { phase: 'NIGHT' } },
      { type: 'patrons', if: { phase: 'EVENING' } },
      { type: 'deskFront' },
      { type: 'windowSnow', args: [10, 99, 14, 16] },
    ],
    lights: [
      { x: 122, y: 94, r: 46, warm: 0.16 }, { x: 222, y: 90, r: 46, warm: 0.16 }, { x: 322, y: 94, r: 46, warm: 0.16 }, { x: 253, y: 104, r: 38, warm: 0.12 },
    ],
    weather: null, darkness: 0.28, ambient: 'warm', ambience: 'parlor',
    events: [
      { id: 'PARLOR_ENTER', if: { all: [{ notFlag: 'parlorEntered' }, { phase: 'EVENING' }] }, script: 'PARLOR_ENTER' },
      { id: 'GABLE_NIGHT', if: { all: [{ phase: 'NIGHT' }, { notFlag: 'gableNightTalk' }] }, script: 'GABLE_NIGHT' },
    ],
    night: {
      npcs: [
        { id: 'gable', sprite: 'gable_idle', x: 300, facing: -1, if: {}, dialogue: 'GABLE_NIGHT_AGAIN', name: 'Mrs. Gable', candle: true },
      ],
      lights: [], darkness: 0.8, ambience: 'parlor_night',
    },
  },

  ROOM4: {
    name: 'ROOM 4', travel: 1, width: 320, exterior: false, ground: FLAT, bounds: [24, 298],
    spawns: { fromStairs: { x: 36, facing: 1 } },
    exits: [],
    doors: [{ id: 'r4_door', x: 20, label: 'Door', verb: 'Go down', to: 'PARLOR', spawn: 'fromStairs' }],
    interactables: [
      { id: 'r4_floor', x: 187, y: 152, label: 'Floorboards', evidence: 'HOTEL_ROOM4_BOARDS' },
      { id: 'r4_bed', x: 244, y: 130, label: 'Bed', dialogue: 'BED', verb: 'Use' },
      { id: 'r4_window', x: 156, y: 86, label: 'Window', variants: [
        { if: { phase: 'NIGHT' }, lines: ['Snow and dark. Nothing moving out there that I can see.'] },
        { if: {}, lines: ['Snow, driven sideways. Past the roofs the land drops toward the creek; I can just make out the line of it, and the dark shape of the mill beyond.'] },
      ] },
      { id: 'r4_wash', x: 108, y: 124, label: 'Washstand', lines: ['Basin and jug. The basin has been scoured so hard the glaze has gone dull.'] },
      { id: 'r4_wardrobe', x: 61, y: 116, label: 'Wardrobe', lines: ['Empty. It smells of lye and cedar.'] },
    ],
    props: [{ type: 'windowSnow', args: [141, 65, 30, 40] }],
    lights: [{ x: 116, y: 118, r: 74, warm: 0.24 }, { x: 156, y: 86, r: 30, warm: 0 }],
    weather: null, darkness: 0.4, ambient: 'warm', ambience: 'room4',
    events: [{ id: 'ROOM4_ENTER', if: { notFlag: 'enteredRoom4' }, do: [{ set: { enteredRoom4: true } }], bark: 'Room 4. Clean. Very clean.' }],
    night: { lights: [{ x: 116, y: 119, r: 34, warm: 0.14 }, { x: 156, y: 86, r: 30, warm: 0 }], darkness: 0.7 },
  },

  CREEK: {
    name: 'THE CREEK PATH', travel: 6, width: 760, exterior: true, ground: CREEK_GROUND, bounds: [4, 686],
    spawns: { fromVillage: { x: 12, facing: 1 }, fromSawmill: { x: 648, facing: -1 } },
    exits: [{ side: 'left', to: 'BLACK_RAM_EXTERIOR', spawn: 'fromCreek' }],
    doors: [{ id: 'ck_bridge', x: 648, label: 'Footbridge', verb: 'Cross', to: 'SAWMILL', spawn: 'fromCreek', minutes: 6 }],
    interactables: [
      { id: 'ck_tracks', x: 116, y: 152, label: 'Tracks', evidence: 'CREEK_TRACKS', important: true },
      { id: 'ck_ice', x: 330, y: 166, label: 'Creek', lines: ['The creek is iced at the edges. In the middle the water still moves, black and quick.'] },
      { id: 'ck_deadfall', x: 680, y: 140, label: 'Deadfall', lines: ['Two pines down across the bank path. No getting through. The prints turn off before it, onto the footbridge.'] },
    ],
    weather: { snow: 0.85, wind: 0.9, fog: 0.45 }, darkness: 0.8, ambience: 'creek',
    events: [{ id: 'CREEK_ENTER', if: {}, script: 'CREEK_ENTER' }],
  },

};

// Global events checked in any scene.
export const GLOBAL_EVENTS = [
  { id: 'DEDUCTION_HINT', if: { all: [{ notFlag: 'deductionHintShown' }, { any: [
    { all: [{ evidence: 'SAWMILL_BODY' }, { evidence: 'SAWMILL_DRAG' }] },
    { all: [{ evidence: 'SAWMILL_BODY' }, { evidence: 'SAWMILL_ROPE' }] },
    { all: [{ evidence: 'SAWMILL_MARKS' }, { evidence: 'SAWMILL_LEDGER' }] },
    { all: [{ evidence: 'T_GABLE_ROOM4' }, { evidence: 'HOTEL_REGISTER' }] },
  ] }, { noDeductions: true }] }, delay: 2.5, script: 'DEDUCTION_HINT' },
];
