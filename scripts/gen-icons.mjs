/**
 * Generates PWA icon files using sharp (Next.js transitive dep).
 * Run: node scripts/gen-icons.mjs
 */
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT  = resolve(ROOT, 'public');
mkdirSync(OUT, { recursive: true });

// ─── Icon SVG ─────────────────────────────────────────────────────────────────
// Film-reel cinema icon — adapts the CineLogo from login screen

const SVG = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <!-- Rounded dark background -->
  <rect width="512" height="512" rx="110" fill="#0A0A0A"/>

  <!-- Green rounded square (icon area, 60% of canvas) -->
  <rect x="76" y="76" width="360" height="360" rx="72" fill="#22C55E"/>

  <!-- Film strip — left -->
  <rect x="76" y="130" width="52" height="252" rx="10" fill="#000" opacity="0.80"/>
  <rect x="85" y="152" width="34" height="34" rx="7" fill="#22C55E"/>
  <rect x="85" y="203" width="34" height="34" rx="7" fill="#22C55E"/>
  <rect x="85" y="254" width="34" height="34" rx="7" fill="#22C55E"/>
  <rect x="85" y="305" width="34" height="34" rx="7" fill="#22C55E"/>

  <!-- Film strip — right -->
  <rect x="384" y="130" width="52" height="252" rx="10" fill="#000" opacity="0.80"/>
  <rect x="393" y="152" width="34" height="34" rx="7" fill="#22C55E"/>
  <rect x="393" y="203" width="34" height="34" rx="7" fill="#22C55E"/>
  <rect x="393" y="254" width="34" height="34" rx="7" fill="#22C55E"/>
  <rect x="393" y="305" width="34" height="34" rx="7" fill="#22C55E"/>

  <!-- Center screen -->
  <rect x="140" y="130" width="232" height="252" rx="18" fill="#000" opacity="0.55"/>

  <!-- Play button triangle (white) -->
  <path d="M220 200 L330 256 L220 312 Z" fill="#FFFFFF"/>
</svg>`;

// ─── Helper: build ICO from one PNG buffer ───────────────────────────────────
function buildIco(pngBuffer) {
  const size = 32;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0,    0); // reserved
  header.writeUInt16LE(1,    2); // type: ICO
  header.writeUInt16LE(1,    4); // count: 1 image

  const dataOffset = 6 + 16; // header + one directory entry
  const entry = Buffer.alloc(16);
  entry[0] = size; // width
  entry[1] = size; // height
  entry[2] = 0;    // colour count
  entry[3] = 0;    // reserved
  entry.writeUInt16LE(1,  4); // colour planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(pngBuffer.length, 8);
  entry.writeUInt32LE(dataOffset,        12);

  return Buffer.concat([header, entry, pngBuffer]);
}

// ─── Generate icons ───────────────────────────────────────────────────────────
const svgBuffer = Buffer.from(SVG);

async function run() {
  console.log('Generating PWA icons…');

  // icon-512.png
  await sharp(svgBuffer).resize(512, 512).png({ compressionLevel: 9 }).toFile(resolve(OUT, 'icon-512.png'));
  console.log('  ✓ icon-512.png');

  // icon-192.png
  await sharp(svgBuffer).resize(192, 192).png({ compressionLevel: 9 }).toFile(resolve(OUT, 'icon-192.png'));
  console.log('  ✓ icon-192.png');

  // apple-touch-icon.png (180x180)
  await sharp(svgBuffer).resize(180, 180).png({ compressionLevel: 9 }).toFile(resolve(OUT, 'apple-touch-icon.png'));
  console.log('  ✓ apple-touch-icon.png');

  // favicon.ico (32x32 PNG wrapped in ICO container)
  const favPng = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  writeFileSync(resolve(OUT, 'favicon.ico'), buildIco(favPng));
  console.log('  ✓ favicon.ico');

  console.log('Done.');
}

run().catch((e) => { console.error(e); process.exit(1); });
