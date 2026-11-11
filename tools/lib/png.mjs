// Minimal, dependency-free PNG reader/writer for the asset tools (Node only).
// Reads 8-bit, non-interlaced PNGs of colour type 2 (RGB), 3 (indexed), 6 (RGBA) and 0/4 (grey) —
// which covers everything Pixelorama, Aseprite and Tiled export. Writes 8-bit RGBA.
import { inflateSync, deflateSync } from 'node:zlib';

const SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const CRC = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
function crc32(buf) {
  let c = -1;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

/** @returns {{ width:number, height:number, data:Uint8Array }} RGBA pixels */
export function decodePNG(buf) {
  if (!buf.subarray(0, 8).equals(SIG)) throw new Error('not a PNG');
  let off = 8, width = 0, height = 0, depth = 0, type = 0, interlace = 0, plte = null, trns = null;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const kind = buf.toString('latin1', off + 4, off + 8);
    const body = buf.subarray(off + 8, off + 8 + len);
    off += 12 + len;
    if (kind === 'IHDR') {
      width = body.readUInt32BE(0); height = body.readUInt32BE(4);
      depth = body[8]; type = body[9]; interlace = body[12];
    } else if (kind === 'PLTE') plte = body;
    else if (kind === 'tRNS') trns = body;
    else if (kind === 'IDAT') idat.push(body);
    else if (kind === 'IEND') break;
  }
  if (depth !== 8) throw new Error(`unsupported bit depth ${depth} (export 8-bit PNGs)`);
  if (interlace) throw new Error('interlaced PNGs are not supported (turn interlacing off on export)');
  const ch = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type];
  if (!ch) throw new Error(`unsupported colour type ${type}`);
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * ch;
  const px = new Uint8Array(height * stride);
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)];
    const src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const row = px.subarray(y * stride, (y + 1) * stride);
    const prev = y ? px.subarray((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? row[i - ch] : 0, b = prev ? prev[i] : 0, c = prev && i >= ch ? prev[i - ch] : 0;
      let v = src[i];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      row[i] = v & 255;
    }
  }
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const s = i * ch, d = i * 4;
    if (type === 6) { data.set(px.subarray(s, s + 4), d); }
    else if (type === 2) { data[d] = px[s]; data[d + 1] = px[s + 1]; data[d + 2] = px[s + 2]; data[d + 3] = 255; }
    else if (type === 3) {
      const k = px[s];
      data[d] = plte[k * 3]; data[d + 1] = plte[k * 3 + 1]; data[d + 2] = plte[k * 3 + 2];
      data[d + 3] = trns && k < trns.length ? trns[k] : 255;
    } else if (type === 0) { data[d] = data[d + 1] = data[d + 2] = px[s]; data[d + 3] = 255; }
    else { data[d] = data[d + 1] = data[d + 2] = px[s]; data[d + 3] = px[s + 1]; }
  }
  return { width, height, data };
}

/** Encode RGBA pixels as a PNG Buffer. */
export function encodePNG(width, height, data) {
  const raw = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    Buffer.from(data.buffer, data.byteOffset + y * width * 4, width * 4).copy(raw, y * (width * 4 + 1) + 1);
  }
  const chunk = (kind, body) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(body.length);
    const kb = Buffer.concat([Buffer.from(kind, 'latin1'), body]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(kb));
    return Buffer.concat([len, kb, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([SIG, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

export const hex = (r, g, b) => '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
