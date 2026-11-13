// The Tiled-authored levels (data only, so Node tools can read it without the browser renderer).
// Adding a level: save assets/levels/<name>.tmj in Tiled, add a line here, refresh the browser.
export const LEVELS = [
  // Opening-chapter exteriors authored in Tiled (west to east along the street).
  { id: 'STATION', url: 'assets/levels/blackwood_station.tmj' },
  { id: 'ROAD', url: 'assets/levels/road_to_crows_hollow.tmj' },
  { id: 'VILLAGE', url: 'assets/levels/main_street.tmj' },
  { id: 'BLACK_RAM_EXTERIOR', url: 'assets/levels/black_ram_exterior.tmj' },
  { id: 'CREEK', url: 'assets/levels/creek_path.tmj' },
  { id: 'PARLOR', url: 'assets/levels/black_ram_parlor.tmj' },
  { id: 'ROOM4', url: 'assets/levels/room_4.tmj' },
  { id: 'SAWMILL', url: 'assets/levels/old_sawmill.tmj' },
  // Optional hidden area under the waterwheel; its entrance appears only once Silas knows about it.
  { id: 'WHEEL_PIT', url: 'assets/levels/wheel_pit.tmj' },
];
