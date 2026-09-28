// Renders the app icons in public/icons from one SVG design.
// Run with: npm run icons
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const OUT = "public/icons";

// An eight-pointed star (khatam) made of two overlapping squares.
function star(cx, cy, r, attrs) {
  const s = r * Math.SQRT1_2;
  const square = `M${cx - s},${cy - s} L${cx + s},${cy - s} L${cx + s},${cy + s} L${cx - s},${cy + s} Z`;
  return `<path d="${square}" ${attrs}/><path d="${square}" transform="rotate(45 ${cx} ${cy})" ${attrs}/>`;
}

function icon({ size = 512, inset = 0, rounded = true } = {}) {
  const c = size / 2;
  const r = (size / 2) * (1 - inset) * 0.62;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#12705c"/>
      <stop offset="1" stop-color="#0a4236"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ecd08f"/>
      <stop offset="1" stop-color="#c29346"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${rounded ? size * 0.22 : 0}" fill="url(#bg)"/>
  ${star(c, c, r, `fill="url(#gold)"`)}
  ${star(c, c, r * 0.72, `fill="#0c5245"`)}
  <circle cx="${c}" cy="${c}" r="${r * 0.2}" fill="url(#gold)"/>
</svg>`;
}

function badge(size = 96) {
  const c = size / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${star(c, c, size * 0.42, `fill="#fff"`)}
</svg>`;
}

await mkdir(OUT, { recursive: true });
const render = (svg, size, file) =>
  sharp(Buffer.from(svg)).resize(size, size).png().toFile(`${OUT}/${file}`);

await Promise.all([
  render(icon(), 192, "icon-192.png"),
  render(icon(), 512, "icon-512.png"),
  // Maskable: full-bleed background, artwork inside the safe zone.
  render(icon({ inset: 0.25, rounded: false }), 512, "icon-maskable-512.png"),
  // iOS applies its own corner mask.
  render(icon({ inset: 0.1, rounded: false }), 180, "apple-touch-icon.png"),
  render(badge(), 96, "badge-96.png"),
]);
console.log("Icons written to", OUT);
