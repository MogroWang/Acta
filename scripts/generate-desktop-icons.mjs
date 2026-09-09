#!/usr/bin/env node
// Regenerates the desktop icon set in src-tauri/icons from the 1024x1024
// source app-icon.png:
//   - macOS (icon.icns + the generic 32/128 PNGs + the Rust fallback
//     icons/icon.png): full-bleed artwork per the macOS 26+ convention -
//     the system applies the squircle mask itself, so the source must have
//     no baked-in margins or corner transparency.
//   - Windows (icon.ico + Square*/StoreLogo): the same artwork with an
//     18%-radius rounded-corner alpha mask baked in, because Windows shells
//     never mask icons. The radius matches renderSquareAppIcon() in
//     src/interface.js so packaged and runtime-switched icons agree.
// No image dependencies: the script only decodes the source PNG, multiplies
// the alpha channel by an anti-aliased rounded-rect coverage mask (PNG
// codec + zlib come from the Node standard library), and then delegates all
// resizing and icns/ico packing to the local Tauri CLI (`tauri icon`), run
// once per platform style into scratch dirs under build/ (gitignored).
// Usage: node scripts/generate-desktop-icons.mjs
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = join(root, 'app-icon.png');
const iconsDir = join(root, 'src-tauri', 'icons');
const scratchDir = join(root, 'build', 'desktop-icons');
const macOutDir = join(scratchDir, 'macos');
const winOutDir = join(scratchDir, 'windows');
const ROUNDED_OUTPUT = join(scratchDir, 'app-icon-rounded.png');
const CORNER_RADIUS_PERCENT = 0.18;

const main = () => {
  const source = decodePNG(readFileSync(sourcePath));
  if (source.width !== source.height) throw new Error(`Icon source must be square, got ${source.width}x${source.height}`);
  const rounded = applyRoundedCorners(source, CORNER_RADIUS_PERCENT);
  rmSync(scratchDir, { recursive: true, force: true });
  mkdirSync(winOutDir, { recursive: true });
  writeFileSync(ROUNDED_OUTPUT, encodePNG(rounded));

  const cli = join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'tauri.cmd' : 'tauri');
  if (!existsSync(cli)) throw new Error('Tauri CLI not found; run `npm install` first.');
  runIcon(cli, sourcePath, macOutDir);
  runIcon(cli, ROUNDED_OUTPUT, winOutDir);

  const fromMac = ['icon.icns', 'icon.png', '32x32.png', '128x128.png', '128x128@2x.png'];
  const fromWin = ['icon.ico', 'StoreLogo.png', ...readdirSync(winOutDir).filter(name => name.startsWith('Square') && name.endsWith('.png'))];
  for (const name of fromMac) copyFileSync(join(macOutDir, name), join(iconsDir, name));
  for (const name of fromWin) copyFileSync(join(winOutDir, name), join(iconsDir, name));

  // Refresh the default app-icon preset source as well: the previous
  // src/icons/icon-512.png carried a semi-transparent halo at its edges
  // (alpha ~221), which would show as fringing once the macOS 26+ squircle
  // mask crops a full-bleed icon. Downscale the fully opaque source instead.
  const presetSource = join(root, 'src', 'icons', 'icon-512.png');
  writeFileSync(presetSource, encodePNG(downscale2x(source)));
  console.log(`Default preset source: ${presetSource} (opaque 512px)`);
  console.log(`macOS (full-bleed): ${fromMac.join(', ')}`);
  console.log(`Windows (rounded ${Math.round(CORNER_RADIUS_PERCENT * 100)}%): ${fromWin.join(', ')}`);
  console.log(`Written to ${iconsDir}`);
};

function runIcon(cli, input, output) {
  const result = spawnSync(cli, ['icon', input, '-o', output], { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`tauri icon failed for ${input}`);
}

// --- Minimal PNG codec (8-bit, non-interlaced, RGB/RGBA only) ---

function decodePNG(buffer) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!buffer.subarray(0, 8).equals(signature)) throw new Error('Not a PNG file');
  let offset = 8;
  let header = null;
  const idat = [];
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') header = { width: data.readUInt32BE(0), height: data.readUInt32BE(4), bitDepth: data[8], colorType: data[9], interlace: data[12] };
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    offset += 12 + length;
  }
  if (!header) throw new Error('PNG header missing');
  const { width, height, bitDepth, colorType, interlace } = header;
  if (bitDepth !== 8 || (colorType !== 6 && colorType !== 2) || interlace !== 0) {
    throw new Error(`Unsupported PNG (bitDepth=${bitDepth}, colorType=${colorType}, interlace=${interlace}); re-export as 8-bit RGBA`);
  }
  const channels = colorType === 6 ? 4 : 3;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(height * stride);
  let pos = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[pos++];
    const row = out.subarray(y * stride, (y + 1) * stride);
    raw.copy(row, 0, pos, pos + stride);
    pos += stride;
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const left = x >= channels ? row[x - channels] : 0;
      const up = prev ? prev[x] : 0;
      const upLeft = prev && x >= channels ? prev[x - channels] : 0;
      if (filter === 1) row[x] = (row[x] + left) & 0xff;
      else if (filter === 2) row[x] = (row[x] + up) & 0xff;
      else if (filter === 3) row[x] = (row[x] + ((left + up) >> 1)) & 0xff;
      else if (filter === 4) row[x] = (row[x] + paeth(left, up, upLeft)) & 0xff;
    }
  }
  return { width, height, channels, data: out };
}

const paeth = (left, up, upLeft) => {
  const p = left + up - upLeft;
  const pLeft = Math.abs(p - left);
  const pUp = Math.abs(p - up);
  const pUpLeft = Math.abs(p - upLeft);
  return pLeft <= pUp && pLeft <= pUpLeft ? left : pUp <= pUpLeft ? up : upLeft;
};

function encodePNG({ width, height, data }) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    data.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // color type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    makeChunk('IHDR', header),
    makeChunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function makeChunk(type, data) {
  const out = Buffer.alloc(data.length + 12);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  let crc = -1;
  for (const byte of out.subarray(4, 8 + data.length)) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  out.writeUInt32BE((crc ^ -1) >>> 0, 8 + data.length);
  return out;
}

// --- Rounded-corner alpha mask ---

function downscale2x(image) {
  // Exact 2x2 box-filter average (the 1024 source halves cleanly); output is
  // always RGBA so the result can be written without further conversion.
  const rgba = image.channels === 4 ? image.data : toRGBA(image);
  const outW = image.width >> 1;
  const outH = image.height >> 1;
  const out = Buffer.alloc(outW * outH * 4);
  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      for (let c = 0; c < 4; c++) {
        const i00 = ((y * 2) * image.width + x * 2) * 4 + c;
        const i10 = i00 + 4;
        const i01 = i00 + image.width * 4;
        const i11 = i01 + 4;
        out[(y * outW + x) * 4 + c] = (rgba[i00] + rgba[i10] + rgba[i01] + rgba[i11]) >> 2;
      }
    }
  }
  return { width: outW, height: outH, channels: 4, data: out };
}

function applyRoundedCorners(image, radiusPercent) {
  const { width, height } = image;
  const data = image.channels === 4 ? image.data : toRGBA(image);
  const radius = Math.round(width * radiusPercent);
  const radiusSq = radius * radius;
  // Points outside the rounded rect are exactly those inside a corner square
  // AND outside its quarter-circle; a 4x4 supersample anti-aliases the arc.
  const outside = (fx, fy) => {
    const nearLeft = fx < radius;
    const nearRight = fx >= width - radius;
    const nearTop = fy < radius;
    const nearBottom = fy >= height - radius;
    if (!((nearLeft || nearRight) && (nearTop || nearBottom))) return false;
    const cx = nearLeft ? radius : width - radius;
    const cy = nearTop ? radius : height - radius;
    const dx = fx - cx;
    const dy = fy - cy;
    return dx * dx + dy * dy > radiusSq;
  };
  const supersample = 4;
  const samples = supersample * supersample;
  for (let y = 0; y < height; y++) {
    if (!(y < radius || y >= height - radius)) continue; // middle rows are fully inside
    for (let x = 0; x < width; x++) {
      if (x >= radius && x < width - radius) continue; // middle columns are fully inside
      let hit = 0;
      for (let sy = 0; sy < supersample; sy++) {
        for (let sx = 0; sx < supersample; sx++) {
          if (!outside(x + (sx + 0.5) / supersample, y + (sy + 0.5) / supersample)) hit++;
        }
      }
      const coverage = Math.round((hit / samples) * 255);
      const alphaIndex = (y * width + x) * 4 + 3;
      data[alphaIndex] = Math.round((data[alphaIndex] * coverage) / 255);
    }
  }
  return { width, height, channels: 4, data };
}

function toRGBA(image) {
  const { width, height, channels, data } = image;
  const out = Buffer.alloc(width * height * 4);
  for (let i = 0, j = 0; i < width * height; i++, j += 4) {
    out[j] = data[i * channels];
    out[j + 1] = data[i * channels + 1];
    out[j + 2] = data[i * channels + 2];
    out[j + 3] = channels === 4 ? data[i * channels + 3] : 255;
  }
  return out;
}

main();
