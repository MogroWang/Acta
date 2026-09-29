#!/usr/bin/env node
// Generates the macOS 26+ dock-icon variants of the four preset icons into
// public/icons/macos26/:
//   default.png / positive.png / outline.png / original.png (512×512)
//   mask.png (512×512, white shape + alpha)
// macOS 26 masks app icons into its squircle only when they live in the app
// bundle; icons set at runtime (NSApplication.setApplicationIconImage, the
// setAppIcon path) are drawn as-is. Sending the full-bleed artwork that the
// system would mask therefore shows a raw square in the Dock. These variants
// bake the system shape in instead: the artwork is centred inside the squircle
// footprint and the outside becomes transparent, so a runtime-set icon looks
// exactly like a system-masked one.
// The shape source is scripts/assets/macos26-dock-mask.png — the alpha channel
// of a system-rendered app icon measured on macOS 26 (1024×1024 canvas, 824×824
// squircle, 100px margins, continuous-corner profile). It is the same mask the
// system applies to bundled icons, so bundled and runtime icons agree.
// No image dependencies: the PNG codec comes from generate-desktop-icons.mjs;
// resampling is a plain bilinear filter (sources are near the target size and
// the squircle edges come from the high-res mask, not from the artwork).
// Usage: node scripts/generate-macos26-icons.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { decodePNG, encodePNG, downscale2x, toRGBA } = await import('./generate-desktop-icons.mjs');

const OUT_DIR = join(root, 'public', 'icons', 'macos26');
const CANVAS = 1024; // mask native size; outputs are halved to 512
const PRESETS = {
  default: 'icon-512-square.png',
  positive: 'app-icon-positive-page.png',
  outline: 'app-icon-outlined-page.png',
  original: 'app-icon-original-simple.png'
};

const centerSquare = image => {
  const side = Math.min(image.width, image.height);
  const offsetX = Math.floor((image.width - side) / 2);
  const offsetY = Math.floor((image.height - side) / 2);
  const out = new Uint8ClampedArray(side * side * 4);
  for (let y = 0; y < side; y++) {
    const from = ((y + offsetY) * image.width + offsetX) * 4;
    out.set(image.data.subarray(from, from + side * 4), y * side * 4);
  }
  return { width: side, height: side, data: out };
};

const bilinearResize = (image, size) => {
  const { width, height, data } = image;
  const out = new Uint8ClampedArray(size * size * 4);
  // Sample at pixel centres; clamp at the edges.
  for (let y = 0; y < size; y++) {
    const sy = Math.min(height - 1, (y + 0.5) * height / size - 0.5);
    const y0 = Math.max(0, Math.floor(sy));
    const y1 = Math.min(height - 1, y0 + 1);
    const fy = sy - y0;
    for (let x = 0; x < size; x++) {
      const sx = Math.min(width - 1, (x + 0.5) * width / size - 0.5);
      const x0 = Math.max(0, Math.floor(sx));
      const x1 = Math.min(width - 1, x0 + 1);
      const fx = sx - x0;
      const i00 = (y0 * width + x0) * 4;
      const i10 = (y0 * width + x1) * 4;
      const i01 = (y1 * width + x0) * 4;
      const i11 = (y1 * width + x1) * 4;
      const o = (y * size + x) * 4;
      for (let c = 0; c < 4; c++) {
        const top = data[i00 + c] * (1 - fx) + data[i10 + c] * fx;
        const bottom = data[i01 + c] * (1 - fx) + data[i11 + c] * fx;
        out[o + c] = top * (1 - fy) + bottom * fy;
      }
    }
  }
  return { width: size, height: size, data: out };
};

// Centres the square artwork inside the mask footprint: the visible squircle
// spans 824/1024 of the canvas, so the artwork gets the same 100px margins a
// system icon has before the mask alpha is multiplied in.
const applyMacOS26Mask = (artwork, mask) => {
  const inner = Math.round(CANVAS * 824 / 1024);
  const margin = Math.round((CANVAS - inner) / 2);
  const out = new Uint8ClampedArray(CANVAS * CANVAS * 4);
  for (let y = 0; y < CANVAS; y++) {
    for (let x = 0; x < CANVAS; x++) {
      const o = (y * CANVAS + x) * 4;
      out[o] = 255; out[o + 1] = 255; out[o + 2] = 255;
      const inShapeX = x >= margin && x < margin + inner;
      const inShapeY = y >= margin && y < margin + inner;
      if (!inShapeX || !inShapeY) continue;
      const artworkX = Math.floor((x - margin) * artwork.width / inner);
      const artworkY = Math.floor((y - margin) * artwork.height / inner);
      const source = (artworkY * artwork.width + artworkX) * 4;
      out[o] = artwork.data[source];
      out[o + 1] = artwork.data[source + 1];
      out[o + 2] = artwork.data[source + 2];
      out[o + 3] = artwork.data[source + 3];
    }
  }
  // Multiply by the measured mask alpha (RGBA, white shape).
  for (let i = 3; i < CANVAS * CANVAS * 4; i += 4) {
    out[i] = Math.round(out[i] * mask[i] / 255);
  }
  return { width: CANVAS, height: CANVAS, data: out };
};

const main = () => {
  const maskSource = decodePNG(readFileSync(join(root, 'scripts', 'assets', 'macos26-dock-mask.png')));
  if (maskSource.width !== CANVAS || maskSource.height !== CANVAS) {
    throw new Error(`Mask must be ${CANVAS}x${CANVAS}, got ${maskSource.width}x${maskSource.height}`);
  }
  const maskRGBA = toRGBA(maskSource);
  mkdirSync(OUT_DIR, { recursive: true });
  for (const [preset, fileName] of Object.entries(PRESETS)) {
    const source = decodePNG(readFileSync(join(root, 'public', 'icons', fileName)));
    const square = centerSquare({ ...source, data: toRGBA(source) });
    const artwork = bilinearResize(square, 824);
    const masked = applyMacOS26Mask(artwork, maskRGBA);
    const output = encodePNG(downscale2x({ ...masked, channels: 4 }));
    writeFileSync(join(OUT_DIR, `${preset}.png`), output);
    console.log(`macOS 26 preset: ${preset}.png (512, squircle masked)`);
  }
  // Canvas-side mask for custom uploads: renderSquareAppIcon composites the
  // uploaded artwork with destination-in against this shape.
  writeFileSync(join(OUT_DIR, 'mask.png'), encodePNG(downscale2x({ width: CANVAS, height: CANVAS, channels: 4, data: maskRGBA })));
  console.log('macOS 26 mask: mask.png (512)');
};

main();
