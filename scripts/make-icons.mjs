#!/usr/bin/env node
// Generates simple solid-color rounded-square PNG icons for the extension.
// Pure Node (zlib + manual PNG) so we don't add a sharp/canvas dependency.

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'src', 'assets', 'icons');
mkdirSync(OUT_DIR, { recursive: true });

// Indigo brand color (matches Tailwind's indigo-500).
const ACCENT = [99, 102, 241];
const FG = [236, 238, 242];

function crc32(buf) {
  let c;
  const table = (crc32.table ||= (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })());
  c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function pngRGBA(width, height, pixels) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const raw = Buffer.alloc(width * height * 4 + height);
  let ri = 0;
  for (let y = 0; y < height; y++) {
    raw[ri++] = 0; // no filter
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      raw[ri++] = pixels[idx];
      raw[ri++] = pixels[idx + 1];
      raw[ri++] = pixels[idx + 2];
      raw[ri++] = pixels[idx + 3];
    }
  }
  const idat = zlib.deflateSync(raw);
  const iend = Buffer.alloc(0);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', iend)]);
}

function makeIcon(size) {
  const r = size * 0.22;
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dx = x < r ? r - x : x > size - r ? x - (size - r) : 0;
      const dy = y < r ? r - y : y > size - r ? y - (size - r) : 0;
      const inside = dx * dx + dy * dy <= r * r;
      const isCorner = (x < r || x > size - r) && (y < r || y > size - r);
      const visible = !isCorner || inside;
      if (visible) {
        pixels[idx] = ACCENT[0];
        pixels[idx + 1] = ACCENT[1];
        pixels[idx + 2] = ACCENT[2];
        pixels[idx + 3] = 255;
      } else {
        pixels[idx] = 0;
        pixels[idx + 1] = 0;
        pixels[idx + 2] = 0;
        pixels[idx + 3] = 0;
      }
    }
  }
  // Draw a small white "P" mark (simplified glyph: vertical bar + arc).
  const stroke = Math.max(1, Math.round(size * 0.08));
  const left = Math.round(size * 0.32);
  const top = Math.round(size * 0.26);
  const bottom = Math.round(size * 0.74);
  const right = Math.round(size * 0.62);
  const mid = Math.round((top + bottom) / 2);
  // Vertical bar
  for (let y = top; y <= bottom; y++) {
    for (let x = left; x < left + stroke; x++) {
      const idx = (y * size + x) * 4;
      pixels[idx] = FG[0];
      pixels[idx + 1] = FG[1];
      pixels[idx + 2] = FG[2];
      pixels[idx + 3] = 255;
    }
  }
  // Bowl: top and mid horizontals, right vertical.
  for (let x = left; x <= right; x++) {
    for (let dy = 0; dy < stroke; dy++) {
      [top + dy, mid + dy].forEach((y) => {
        const idx = (y * size + x) * 4;
        pixels[idx] = FG[0];
        pixels[idx + 1] = FG[1];
        pixels[idx + 2] = FG[2];
        pixels[idx + 3] = 255;
      });
    }
  }
  for (let y = top; y <= mid + stroke; y++) {
    for (let x = right - stroke; x <= right; x++) {
      const idx = (y * size + x) * 4;
      pixels[idx] = FG[0];
      pixels[idx + 1] = FG[1];
      pixels[idx + 2] = FG[2];
      pixels[idx + 3] = 255;
    }
  }
  return pngRGBA(size, size, pixels);
}

for (const size of [16, 32, 48, 128]) {
  const buf = makeIcon(size);
  writeFileSync(join(OUT_DIR, `icon-${size}.png`), buf);
  console.log(`wrote icon-${size}.png (${buf.length} bytes)`);
}
