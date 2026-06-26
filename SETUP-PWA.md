# Tangible — PWA setup & testing guide

The app is now an installable **Progressive Web App**: it can be added to the home
screen on iPhone and Android and launches **full-screen (standalone)** — no browser
address bar — under the name **Tangible**, using the existing logo as the icon.

This document explains what was added, where the icons live, how to regenerate
them, how to test the install on each platform, and the known iOS limitations.

---

## 1. What was added

| File | Purpose |
|------|---------|
| `src/app/manifest.ts` | Web App Manifest. Next serves it at `/manifest.webmanifest` and injects the `<link rel="manifest">` automatically. Name, colors, icons, `display: standalone`. |
| `src/app/layout.tsx` | PWA metadata: `theme-color`, Apple meta tags (`apple-mobile-web-app-*`), apple-touch-icon, favicons, and the iOS splash-screen `<link>` tags. |
| `public/icons/` | All app icons (192/512 + maskable, apple-touch-icon 180, favicons). **Commit these.** |
| `public/splash/` | iOS launch (splash) images, one per iPhone resolution. **Commit these.** |
| `scripts/generate-pwa-icons.mjs` | Regenerates everything in `public/icons` and `public/splash` from the master logo. |

The master logo lives at `public/logo-tangible.png` (2048×2048). Everything is
generated from it, so the app icon **is** the existing logo, on the brand cream
background (`#FAF7F2`).

> Note: the logo file was renamed from `logo-tangible.PNG` → `logo-tangible.png`
> (lowercase). On Linux/Vercel and on `next start`, asset paths are
> case-sensitive, and the landing page references the lowercase path — the old
> casing returned a 404 for the logo. It now matches everywhere.

---

## 2. Where the icons are and how to regenerate them

You **do not** need to place any icons by hand — they are already generated and
committed. You only regenerate when **the logo changes**.

To regenerate:

```bash
# sharp is only needed to (re)generate images; it is NOT a runtime dependency
npm install -D sharp
node scripts/generate-pwa-icons.mjs
```

This overwrites `public/icons/*` and `public/splash/*`. Commit the result.

If you swap the logo, save the new file as `public/logo-tangible.png`
(square, ideally ≥ 1024×1024, transparent PNG) and re-run the command.

Generated icons:

- `icon-192.png`, `icon-512.png` — standard ("any") icons.
- `icon-maskable-192.png`, `icon-maskable-512.png` — Android adaptive icons (logo on a cream background with safe-zone padding so it isn't clipped inside Android's circle/squircle mask).
- `apple-touch-icon.png` (180×180) — iPhone home-screen icon (opaque background; iOS adds the rounded corners itself).
- `favicon-16.png`, `favicon-32.png` — browser tab icons.

---

## 3. Deployment checklist

1. **Commit the generated folders** — `public/icons/` and `public/splash/` (and the
   renamed `public/logo-tangible.png`). They are not git-ignored.
2. **Serve over HTTPS.** PWAs only install over HTTPS (your `iotangible.com.mx`
   domain already is). `localhost` also works for testing.
3. **Set `NEXT_PUBLIC_APP_URL`** in your environment to the production URL
   (e.g. `https://iotangible.com.mx`). It's used for `metadataBase` and the QR code.
4. Deploy as usual (`npm run build` → `npm start`, or your Vercel pipeline).

No `next.config.ts` changes were required: the existing Content-Security-Policy
(`default-src 'self'`, `img-src 'self'`) already allows the manifest and icons.

---

## 4. How to test

### Android (Chrome)
1. Open the site in Chrome.
2. You should get an **"Install app" / "Add to Home screen"** prompt, or use
   ⋮ menu → **Install app**.
3. Launch it from the home screen → it opens **full-screen, no address bar**, with
   the Tangible icon and a cream splash while loading.
4. To audit: Chrome DevTools → **Application → Manifest** (check name, icons, and
   "Installability"), and run **Lighthouse → PWA**.

### iPhone (Safari → Add to Home Screen)
1. Open the site in **Safari** (this does **not** work in Chrome/other browsers on
   iOS — see limitations).
2. Tap **Share** (□↑) → **Add to Home Screen** → **Add**.
3. The icon appears as **Tangible** with the logo.
4. Open it → it launches **full-screen (standalone)**, with the cream splash screen
   matching the device size while it loads.

### Quick local check
```bash
npm run build && npm start
# then open http://localhost:3000 and inspect the <head> /manifest.webmanifest
```

---

## 5. iOS limitations (important)

iOS PWAs are more restricted than Android. Known constraints:

- **Safari only.** "Add to Home Screen" producing a standalone app only works from
  **Safari**. Chrome/Firefox on iOS can't install PWAs (Apple restriction).
- **Manual install.** iOS shows **no automatic install prompt** — the user must use
  Share → Add to Home Screen. Consider telling clients/admin this once.
- **Splash screens are per-device images.** iOS doesn't generate a splash from the
  manifest; it needs an exact-size image per device. We ship portrait images for the
  common modern iPhones (SE → 16 Pro Max). On an unlisted device iOS falls back to a
  blank `theme-color` (cream) screen — still clean, just without the centered logo.
  **Only portrait** splash images are included (landscape would double the set; the
  app is portrait-oriented anyway).
- **No push notifications** unless installed to the Home Screen, and only iOS 16.4+.
  (Not used by this app today.)
- **Storage can be evicted** by iOS if the PWA is unused for a long time.
- **Updating the icon** requires the user to remove and re-add the app to the home
  screen — iOS caches the old icon otherwise.

Android (Chrome) has none of these limits: automatic install prompt, manifest-driven
splash, maskable adaptive icons, etc.

---

## 6. Regenerating splash sizes for a new device

Edit the `SPLASHES` array in `scripts/generate-pwa-icons.mjs` (device-pixel sizes)
**and** the `startupImage` list in `src/app/layout.tsx` (matching CSS width/height
and DPR), then re-run the generator. Both lists are commented with the device each
entry targets.
