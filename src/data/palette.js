// THE WHITE TRAIL — the central colour palette (single source of truth).
//
// 64 colours in named ramps. The first block is the procedural painters' original `PAL` (paint.js
// re-exports it unchanged); the second block was sampled from the shipped Pixelorama exports
// (assets/export/**), which already sit on this palette: these 64 colours cover 99.2% of every
// exported art pixel within a small perceptual tolerance.
//
// New art should be drawn ONLY with these colours. Lighting that the engine applies at runtime
// (darkness, warm glow) is not part of the art — paint the surface colour, not the lit result,
// unless you are painting a baked light layer (light_evening.png etc.), which may also use them.
//
// Generated artefacts (do not edit by hand — run `npm run palette`):
//   assets/palette/the-white-trail.gpl   GIMP palette: Pixelorama (Palette ▸ Import), Lospec, Aseprite, GIMP
//   assets/palette/the-white-trail.hex   one hex per line: Lospec upload / palette list format
//   assets/palette/the-white-trail.png   1×64 swatch strip (Lospec "1x" image format)
// `npm run palette:check` reports exported PNGs that use colours outside this palette.

export const RAMPS = {
  // night sky and deep shadow
  night: { navy: '#090d16', navy2: '#0f1524', navy3: '#161e2e', ink: '#0b0d14', purple: '#171026', purple2: '#21183a', dusk: '#43304a' },
  // cold stone, cloud, weathered paint
  slate: { slate0: '#1c2434', slate1: '#232d3f', slate2: '#2b3649', slate: '#334155', slate4: '#475569', slate5: '#64748b', slate6: '#94a3b8', slate7: '#cbd5e1', bone: '#f1f5f9' },
  // moonlit blue haze on snow and distance
  haze: { haze0: '#39466a', haze1: '#4d5d7f', haze2: '#b1bfca' },
  // snow (shadow → highlight)
  snow: { snow0: '#5d6a80', snow1: '#7d8aa0', snow2: '#a3afc2', snow3: '#c8d1de', snow4: '#e4e9f0' },
  // timber, logs, floorboards
  wood: { wood0: '#1a120d', wood1: '#2a1c14', wood2: '#3b2a1e', wood3: '#4e3826', wood4: '#634832', wood5: '#7a5a3e' },
  // stone, iron, soot, chimney brick
  stone: { iron: '#24272e', iron2: '#3a3f4a', stone0: '#3d3834', stone1: '#565049', stone2: '#635c55', stone3: '#5a606d', stone4: '#8d8574', rust: '#5b3423' },
  // lamp light, fire, kerosene (only for emissive pixels and baked light)
  light: { ember: '#b45309', kerosene: '#d97706', amber: '#f59e0b', amberHi: '#fcd34d', flame0: '#a65c2c', flame1: '#b56e22', flame2: '#d68a3f', flame3: '#e0a04a', flame4: '#e6b66c', flame5: '#fcd36b', flame6: '#fff1c8' },
  // brass fittings, watch, lettering
  brass: { brass0: '#5e461c', brass1: '#8a6a2a', brass2: '#a07a3a' },
  // paper, telegram, ledger, cloth
  paper: { paperInk: '#2a2118', paperInkDim: '#5a4a38', paperRule: '#b3a27c', paper2: '#c4b694', paper: '#d8ccb0', linen0: '#b5ab92', linen1: '#c8bfa8', linen2: '#e4dcc4', linen3: '#f3eddc' },
  // blood and danger (use sparingly)
  blood: { crimson: '#991b1b', crimsonDark: '#4a1010', inkRed: '#7f1d1d' },
};

// Flat name -> hex map of all 64 colours.
export const PALETTE = Object.freeze(Object.assign({}, ...Object.values(RAMPS)));

// The procedural painters' original palette (unchanged values, used by src/world/paint.js).
export const PAL = Object.freeze({
  navy: '#090d16', navy2: '#0f1524', navy3: '#161e2e',
  slate0: '#1c2434', slate1: '#232d3f', slate2: '#2b3649', slate: '#334155', slate4: '#475569',
  slate5: '#64748b', slate6: '#94a3b8', slate7: '#cbd5e1', bone: '#f1f5f9',
  purple: '#171026', purple2: '#21183a',
  amber: '#f59e0b', kerosene: '#d97706', amberHi: '#fcd34d', ember: '#b45309',
  crimson: '#991b1b', crimsonDark: '#4a1010',
  wood0: '#1a120d', wood1: '#2a1c14', wood2: '#3b2a1e', wood3: '#4e3826', wood4: '#634832', wood5: '#7a5a3e',
  snow0: '#5d6a80', snow1: '#7d8aa0', snow2: '#a3afc2', snow3: '#c8d1de', snow4: '#e4e9f0',
  ink: '#0b0d14', iron: '#24272e', iron2: '#3a3f4a', rust: '#5b3423',
});

export const PALETTE_NAME = 'The White Trail';
