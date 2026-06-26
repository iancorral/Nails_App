// scripts/generate-pwa-icons.mjs
//
// Genera todos los iconos PWA y splash screens de iOS a partir del logo maestro
// (public/logo-tangible.png, 2048×2048 RGBA).
//
// Requiere `sharp` (solo en build/dev): `npm i -D sharp` y luego:
//   node scripts/generate-pwa-icons.mjs
//
// Vuelve a ejecutarlo cada vez que cambie el logo. Los archivos generados se
// versionan en el repo (public/icons, public/splash) para no depender de sharp
// en producción.

import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
// El archivo se versiona en minúsculas (logo-tangible.png); referenciarlo así
// para que el script también funcione en sistemas sensibles a mayúsculas (Linux/CI).
const SRC = join(ROOT, "public", "logo-tangible.png");
const ICONS_DIR = join(ROOT, "public", "icons");
const SPLASH_DIR = join(ROOT, "public", "splash");

// Color de fondo de marca (salon-bg). Se usa para iconos opacos (Apple/maskable)
// y como lienzo de los splash screens.
const BG = { r: 250, g: 247, b: 242, alpha: 1 }; // #FAF7F2

await mkdir(ICONS_DIR, { recursive: true });
await mkdir(SPLASH_DIR, { recursive: true });

/** Redimensiona el logo conservando transparencia (icono "any"). */
async function transparentIcon(size, out) {
  await sharp(SRC)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(join(ICONS_DIR, out));
  console.log("icon  ", out, `${size}x${size}`);
}

/**
 * Icono opaco sobre fondo de marca. `inner` es la fracción del lienzo que ocupa
 * el logo (deja un margen de seguridad — imprescindible para `maskable`, que
 * Android recorta a un círculo del ~80%).
 */
async function paddedIcon(size, inner, out, dir = ICONS_DIR) {
  const logoSize = Math.round(size * inner);
  const logo = await sharp(SRC)
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(join(dir, out));
  console.log("icon  ", out, `${size}x${size}`);
}

/** Splash screen de iOS: logo centrado sobre el fondo de marca. */
async function splash(w, h, out) {
  const logoSize = Math.round(Math.min(w, h) * 0.38);
  const logo = await sharp(SRC)
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  await sharp({
    create: { width: w, height: h, channels: 4, background: BG },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(join(SPLASH_DIR, out));
  console.log("splash", out, `${w}x${h}`);
}

// ── Iconos ──────────────────────────────────────────────────────────────────
// Android / PWA "any" (transparentes, escalan sobre cualquier fondo)
await transparentIcon(192, "icon-192.png");
await transparentIcon(512, "icon-512.png");
// Android adaptativo "maskable" (fondo opaco + margen de seguridad)
await paddedIcon(192, 0.7, "icon-maskable-192.png");
await paddedIcon(512, 0.7, "icon-maskable-512.png");
// Apple touch icon (iOS no admite transparencia: fondo opaco, sin esquinas
// redondeadas — iOS las añade solo)
await paddedIcon(180, 0.82, "apple-touch-icon.png");
// Favicons
await transparentIcon(32, "favicon-32.png");
await transparentIcon(16, "favicon-16.png");

// ── Splash screens de iOS (retrato) ───────────────────────────────────────────
// width × height en píxeles de dispositivo (CSS px × DPR). Cubre los iPhone
// modernos más comunes. Ver SETUP-PWA.md para la lista de dispositivos.
const SPLASHES = [
  [640, 1136, "splash-640x1136.png"],   // iPhone SE 1ª gen
  [750, 1334, "splash-750x1334.png"],   // iPhone SE 2/3, 6/7/8
  [828, 1792, "splash-828x1792.png"],   // iPhone XR, 11
  [1125, 2436, "splash-1125x2436.png"], // iPhone X, XS, 11 Pro
  [1170, 2532, "splash-1170x2532.png"], // iPhone 12, 13, 14
  [1179, 2556, "splash-1179x2556.png"], // iPhone 14 Pro, 15, 16
  [1242, 2208, "splash-1242x2208.png"], // iPhone 6/7/8 Plus
  [1242, 2688, "splash-1242x2688.png"], // iPhone XS Max, 11 Pro Max
  [1284, 2778, "splash-1284x2778.png"], // iPhone 12/13 Pro Max, 14 Plus
  [1290, 2796, "splash-1290x2796.png"], // iPhone 14/15 Pro Max, 16 Plus
];
for (const [w, h, out] of SPLASHES) await splash(w, h, out);

console.log("\n✓ Iconos y splash screens generados.");
