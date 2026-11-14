/**
 * Draws the static shield icons for the manifest as PNG files, with no image library:
 * a blue shield with a white check mark, sampled 3x3 per pixel for smooth edges.
 */
const zlib = require('zlib');

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(width, height, rgba) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  const rows = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    rows[y * (width * 4 + 1)] = 0; // filter: none
    rgba.copy(rows, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(rows)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function insideShield(u, v) {
  if (v < 0.06 || v > 0.95) return false;
  if (v <= 0.5) return Math.abs(u - 0.5) <= 0.42;
  const ratio = (v - 0.5) / 0.45;
  return Math.abs(u - 0.5) <= 0.42 * Math.sqrt(Math.max(0, 1 - ratio * ratio));
}

function distanceToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function insideCheck(u, v) {
  const thickness = 0.065;
  return (
    distanceToSegment(u, v, 0.3, 0.52, 0.45, 0.67) <= thickness ||
    distanceToSegment(u, v, 0.45, 0.67, 0.72, 0.36) <= thickness
  );
}

function renderIcon(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const samples = 3;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let shield = 0;
      let check = 0;
      for (let sy = 0; sy < samples; sy += 1) {
        for (let sx = 0; sx < samples; sx += 1) {
          const u = (x + (sx + 0.5) / samples) / size;
          const v = (y + (sy + 0.5) / samples) / size;
          if (insideShield(u, v)) {
            shield += 1;
            if (insideCheck(u, v)) check += 1;
          }
        }
      }
      const total = samples * samples;
      const offset = (y * size + x) * 4;
      const whiteShare = shield === 0 ? 0 : check / shield;
      rgba[offset] = Math.round(11 + (255 - 11) * whiteShare);
      rgba[offset + 1] = Math.round(87 + (255 - 87) * whiteShare);
      rgba[offset + 2] = Math.round(208 + (255 - 208) * whiteShare);
      rgba[offset + 3] = Math.round((shield / total) * 255);
    }
  }
  return encodePng(size, size, rgba);
}

module.exports = { renderIcon, encodePng, crc32 };
