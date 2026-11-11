// Silas's hand-drawn exploration map: the location registry.
//
// The map is COMPOSED from discovered pieces — never a finished map with parts covered up. Every
// piece is its own transparent 300×168 PNG (assets/export/map/<art>.png, authored as one layer each
// in assets/source/pixelorama/map/silas_map.pxo) drawn at a fixed position on the parchment, so the
// geography never shifts as more is drawn in.
//
// Map coordinates are the parchment's own pixel grid (300×168, 0,0 top-left), independent of scene
// pixels. A location is visited when Silas enters one of its scenes (optionally only within an
// x-range of that scene). A path is drawn only after Silas has actually travelled it, i.e. completed
// a transition between its two scenes in either direction.
//
// Adding a place later: draw its piece as a new layer in silas_map.pxo at its map position, export
// it to assets/export/map/<art>.png, then add an entry below (and a PATHS entry for the way in).
// Only add places that exist in the game: the registry must never hint at unvisited or future areas.

export const MAP_W = 300;
export const MAP_H = 168;

export const LOCATIONS = [
  { id: 'station', name: 'Blackwood Station', scenes: ['STATION'], art: 'station', label: [41, 156] },
  { id: 'road', name: 'the road up', scenes: ['ROAD'], art: 'road', label: [120, 127], minor: true },
  { id: 'village', name: "Crow's Hollow", scenes: ['VILLAGE'], art: 'village', label: [170, 103] },
  // Rusk's store is noted once Silas has walked past its window.
  { id: 'store', name: "Rusk's", scenes: ['VILLAGE'], xMin: 140, xMax: 215, art: 'store', label: [158, 65], minor: true },
  { id: 'hotel', name: 'Black Ram', scenes: ['BLACK_RAM_EXTERIOR', 'PARLOR', 'ROOM4'], art: 'hotel', label: [208, 67] },
  { id: 'creek', name: 'the creek', scenes: ['CREEK'], art: 'creek', label: [212, 128], minor: true },
  { id: 'sawmill', name: 'old mill', scenes: ['SAWMILL'], art: 'sawmill', label: [271, 99] },
];

export const PATHS = [
  { id: 'path_station_road', between: ['STATION', 'ROAD'], art: 'path_station_road' },
  { id: 'path_road_village', between: ['ROAD', 'VILLAGE'], art: 'path_road_village' },
  { id: 'path_village_creek', between: ['BLACK_RAM_EXTERIOR', 'CREEK'], art: 'path_village_creek' },
  { id: 'path_creek_sawmill', between: ['CREEK', 'SAWMILL'], art: 'path_creek_sawmill' },
];

// Where Silas's pencil mark goes, per scene: a fixed point, or a line interpolated by his x
// position across the scene's walkable bounds (wide exterior scenes).
export const POSITION = {
  STATION: { from: [36, 136], to: [66, 136] },
  ROAD: { from: [76, 134], to: [138, 89] },
  VILLAGE: { from: [142, 86], to: [198, 86] },
  BLACK_RAM_EXTERIOR: { from: [196, 84], to: [214, 84] },
  PARLOR: { at: [177, 78] },
  ROOM4: { at: [177, 70] },
  CREEK: { from: [205, 97], to: [226, 101] },
  SAWMILL: { from: [244, 90], to: [282, 90] },
};
