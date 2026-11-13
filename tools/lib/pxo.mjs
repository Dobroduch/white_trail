// Writes a Pixelorama project (.pxo, format 8 / Pixelorama v1.2.x) from RGBA images, so art painted by the Node tools
// has an editable Pixelorama source like the rest of assets/source/pixelorama/. One frame; one layer per image (all the
// same size), bottom first. A .pxo is a ZIP: data.json, mimetype, preview.png and image_data/frames/1/layer_N (raw
// RGBA8). Entries are deflated with node:zlib. Round trip: open in Pixelorama, export PNG, compare.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { deflateRawSync } from 'node:zlib';
import { encodePNG } from './png.mjs';

const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (buf) => { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };

function zip(entries) {
  const parts = [], central = [];
  let off = 0;
  for (const { name, data } of entries) {
    const nameB = Buffer.from(name, 'utf8'), raw = Buffer.from(data);
    const comp = raw.length ? deflateRawSync(raw) : Buffer.alloc(0);
    const method = raw.length ? 8 : 0;
    const crc = crc32(raw);
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0, 6); lh.writeUInt16LE(method, 8);
    lh.writeUInt16LE(0, 10); lh.writeUInt16LE(0x5b6d, 12); lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(comp.length, 18);
    lh.writeUInt32LE(raw.length, 22); lh.writeUInt16LE(nameB.length, 26); lh.writeUInt16LE(0, 28);
    parts.push(lh, nameB, comp);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0, 8); ch.writeUInt16LE(method, 10);
    ch.writeUInt16LE(0, 12); ch.writeUInt16LE(0x5b6d, 14); ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(comp.length, 20); ch.writeUInt32LE(raw.length, 24);
    ch.writeUInt16LE(nameB.length, 28); ch.writeUInt32LE(name.endsWith('/') ? 0x10 : 0, 38); ch.writeUInt32LE(off, 42);
    central.push(ch, nameB);
    off += 30 + nameB.length + comp.length;
  }
  const cd = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(off, 16);
  return Buffer.concat([...parts, cd, end]);
}

/**
 * writePxo(file, w, h, layers) — layers: [{ name, data: Uint8Array(w*h*4) }], bottom first.
 */
export function writePxo(file, w, h, layers) {
  const name = file.replace(/^.*[\\/]/, '').replace(/\.pxo$/, '');
  const layerDefs = layers.map((l) => ({
    animated_params: 'Dictionary[String, Dictionary]({\n"opacity": {}\n})', blend_mode: 0, clipping_mask: false, effects: [], locked: false,
    metadata: {}, name: l.name, new_cels_linked: false, opacity: 1.0, parent: -1, type: 0, ui_color: '(0.0, 0.0, 0.0, 0.0)',
    use_cel_image_for_effects: false, visible: true,
  }));
  const data = {
    author_company: '', author_contact: '', author_display_name: '', author_real_name: '', brushes: [], color_mode: 5,
    current_frame: 0, current_layer: layers.length - 1, export_profile: {}, fps: 6.0,
    frames: [{ cels: layers.map(() => ({ image_size: `Vector2i(${w}, ${h})`, metadata: {}, offset: '(0, 0)', opacity: 1.0, ui_color: '(0.0, 0.0, 0.0, 0.0)', z_index: 0 })), duration: 1.0, metadata: {} }],
    guides: [], include_blended_images: false, layers: layerDefs, license: '', metadata: {}, next_keyframe_id: 0, palettes: [],
    pixelorama_version: 'v1.2.4-stable', project_current_palette_name: '', pxo_version: 8, reference_images: [], size_x: w, size_y: h,
    symmetry_points: [w - 1, h - 1], tags: [], tile_mode_x_basis_x: w, tile_mode_x_basis_y: 0, tile_mode_y_basis_x: 0, tile_mode_y_basis_y: h,
    tilesets: [], user_data: '', vanishing_points: [],
  };
  // preview: the layers composited (alpha over), as Pixelorama shows the project in its file dialog
  const comp = new Uint8Array(w * h * 4);
  for (const l of layers) for (let i = 0; i < w * h; i++) if (l.data[i * 4 + 3]) comp.set(l.data.subarray(i * 4, i * 4 + 4), i * 4);
  const entries = [
    { name: 'data.json', data: Buffer.from(JSON.stringify(data)) },
    { name: 'mimetype', data: Buffer.from('application/x-pixelorama') },
    { name: 'preview.png', data: encodePNG(w, h, comp) },
    { name: 'image_data/frames/1/', data: Buffer.alloc(0) },
  ];
  layers.forEach((l, i) => {
    entries.push({ name: `image_data/frames/1/layer_${i + 1}`, data: Buffer.from(l.data) });
    entries.push({ name: `image_data/frames/1/indices_layer_${i + 1}`, data: Buffer.from([0]) });
  });
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, zip(entries));
  void name;
}
