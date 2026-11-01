import { mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"

const outDir = path.resolve("apps/storefront/public/images/seed")
mkdirSync(outDir, { recursive: true })

const items = [
  { key: "lehenga-emerald", base: "#145c4a", light: "#2d8a70", accent: "#c99a2e", kind: "lehenga" },
  { key: "lehenga-rosewood", base: "#6d1f31", light: "#a84358", accent: "#d8b26a", kind: "lehenga" },
  { key: "lehenga-ivory", base: "#b9a88f", light: "#e6dccb", accent: "#a67c2e", kind: "lehenga" },
  { key: "lehenga-maroon", base: "#4a1620", light: "#7d2f3d", accent: "#c99a2e", kind: "lehenga" },
  { key: "sherwani-ivory", base: "#9c8b70", light: "#e3d8c4", accent: "#7a5a24", kind: "sherwani" },
  { key: "sherwani-blue", base: "#1c2f4a", light: "#3f5d80", accent: "#c9b06a", kind: "sherwani" },
  { key: "kurta-sage", base: "#4c5a45", light: "#87947c", accent: "#d8c48a", kind: "kurta" },
  { key: "jewelry-kundan", base: "#3a2416", light: "#6b4a2c", accent: "#e3c35a", kind: "jewelry" },
]

function garment(kind, accent) {
  if (kind === "lehenga") {
    return `
      <path d="M400 235 C 350 255 330 300 330 350 L 350 430 L 300 760 L 500 760 L 450 430 L 470 350 C 470 300 450 255 400 235 Z" fill="#000" fill-opacity=".18"/>
      <path d="M330 350 C 370 370 430 370 470 350" fill="none" stroke="${accent}" stroke-opacity=".8" stroke-width="4"/>
      <path d="M310 700 C 360 680 440 680 490 700" fill="none" stroke="${accent}" stroke-opacity=".55" stroke-width="3"/>
      <path d="M270 300 C 200 360 190 520 230 650" fill="none" stroke="${accent}" stroke-opacity=".45" stroke-width="3"/>
      <circle cx="400" cy="390" r="10" fill="${accent}" fill-opacity=".7"/>
    `
  }

  if (kind === "sherwani") {
    return `
      <path d="M350 230 L 400 260 L 450 230 L 500 300 L 480 760 L 320 760 L 300 300 Z" fill="#000" fill-opacity=".2"/>
      <path d="M400 260 L 400 740" stroke="${accent}" stroke-opacity=".75" stroke-width="3"/>
      <circle cx="400" cy="320" r="6" fill="${accent}"/>
      <circle cx="400" cy="380" r="6" fill="${accent}"/>
      <circle cx="400" cy="440" r="6" fill="${accent}"/>
      <path d="M340 230 C 370 210 430 210 460 230" fill="none" stroke="${accent}" stroke-opacity=".8" stroke-width="4"/>
    `
  }

  if (kind === "kurta") {
    return `
      <path d="M345 250 L 400 285 L 455 250 L 510 320 L 470 430 L 455 760 L 345 760 L 330 430 L 290 320 Z" fill="#000" fill-opacity=".18"/>
      <path d="M400 285 L 400 560" stroke="${accent}" stroke-opacity=".7" stroke-width="3"/>
      <path d="M330 430 L 470 430" stroke="${accent}" stroke-opacity=".5" stroke-width="3"/>
      <circle cx="400" cy="320" r="5" fill="${accent}"/>
      <circle cx="400" cy="360" r="5" fill="${accent}"/>
    `
  }

  return `
    <circle cx="400" cy="420" r="170" fill="none" stroke="${accent}" stroke-opacity=".7" stroke-width="6"/>
    <circle cx="400" cy="440" r="120" fill="none" stroke="${accent}" stroke-opacity=".5" stroke-width="4"/>
    <circle cx="400" cy="420" r="30" fill="${accent}" fill-opacity=".7"/>
    <path d="M400 590 L 400 720" stroke="${accent}" stroke-opacity=".7" stroke-width="6"/>
    <circle cx="400" cy="760" r="18" fill="${accent}" fill-opacity=".6"/>
  `
}

for (const item of items) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" role="img" aria-label="Illustrated garment placeholder">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="${item.light}"/>
      <stop offset="1" stop-color="${item.base}"/>
    </linearGradient>
    <pattern id="zari" width="70" height="70" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <path d="M0 0 L35 35 L70 0" fill="none" stroke="${item.accent}" stroke-opacity=".18" stroke-width="2"/>
      <circle cx="35" cy="35" r="2.5" fill="${item.accent}" fill-opacity=".22"/>
    </pattern>
    <radialGradient id="glow" cx="50%" cy="30%" r="70%">
      <stop offset="0" stop-color="#ffffff" stop-opacity=".18"/>
      <stop offset="1" stop-color="#000000" stop-opacity=".12"/>
    </radialGradient>
  </defs>
  <rect width="800" height="1000" fill="url(#bg)"/>
  <rect width="800" height="1000" fill="url(#zari)"/>
  <rect width="800" height="1000" fill="url(#glow)"/>
  <rect x="48" y="48" width="704" height="904" fill="none" stroke="${item.accent}" stroke-opacity=".45" stroke-width="3"/>
  <rect x="66" y="66" width="668" height="868" fill="none" stroke="${item.accent}" stroke-opacity=".2" stroke-width="1"/>
  ${garment(item.kind, item.accent)}
</svg>
`

  writeFileSync(path.join(outDir, `${item.key}.svg`), svg)
}

console.log(`Wrote ${items.length} seed images to ${outDir}`)
