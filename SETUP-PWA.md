# Tangible — PWA setup, scoping & install guide

The **admin panel** is now an installable **Progressive Web App** named **Tangible**.
The admin (your girlfriend) can add it to her iPhone/Android home screen and it
launches **full-screen (standalone)** — no browser address bar — straight into the
panel.

**It is intentionally admin-only.** The public booking page that clients open from
the Instagram link does **not** advertise the app and shows **no install prompt** —
clients just use the website normally.

Production domain: **https://studiotangible.com.mx** (already set as
`NEXT_PUBLIC_APP_URL`).

---

## 1. How the admin-only scoping works

The "installable app" tags (manifest link, Apple standalone tags, iOS splash) are
attached **only** to `/login` and `/admin/**` — never to the public landing page.

| File | Role |
|------|------|
| `public/manifest.webmanifest` | The Web App Manifest (static file). `start_url: /admin`, name `Tangible`, `display: standalone`, brand colors, icons. Served at `/manifest.webmanifest`. |
| `src/lib/pwa-metadata.ts` | Exports `adminPwaMetadata` (manifest link + Apple tags + iOS splash links). |
| `src/app/admin/layout.tsx` | `export const metadata = adminPwaMetadata` → panel pages are installable. |
| `src/app/login/layout.tsx` | Same metadata → the admin can install from the login screen. |
| `src/app/layout.tsx` (root) | Only **global** metadata (title, favicons, `theme-color`). **No** manifest/Apple tags, so the public page is not installable. |

> Why a static `public/manifest.webmanifest` instead of `app/manifest.ts`? Next's
> file-based `app/manifest.ts` auto-injects the manifest `<link>` on **every** page,
> which would expose the install prompt to clients. A static file is only linked
> where we explicitly add it (admin + login).

`start_url` is `/admin`, so the installed app opens the panel directly. If there's
no active session, `/admin` redirects to `/login`; `scope` is `/` so that redirect
stays inside the app.

**No service worker** is included (no offline mode). It isn't needed for iOS
standalone, and avoids any risk of showing stale appointment data. iPhone install is
fully supported; on Android the app installs from the browser menu (see below).

---

## 2. Icons & splash (already generated)

Everything is generated from `public/logo-tangible.png` (2048×2048) into:

- `public/icons/` — `icon-192/512`, `icon-maskable-192/512`, `apple-touch-icon` (180), favicons.
- `public/splash/` — iOS launch images for the common iPhones (portrait).

**Commit both folders.** You only regenerate when the logo changes:

```bash
npm install -D sharp          # dev-only, not a runtime dependency
node scripts/generate-pwa-icons.mjs
```

> The logo file was renamed `logo-tangible.PNG` → `logo-tangible.png` (lowercase) so
> asset paths match on case-sensitive hosting; the old casing 404'd the landing logo.

---

## 3. Deploy checklist (Hostinger)

1. **Commit** `public/icons/`, `public/splash/`, `public/manifest.webmanifest`,
   `public/logo-tangible.png`, `scripts/`, `src/lib/pwa-metadata.ts`, and the modified
   files.
2. Confirm `NEXT_PUBLIC_APP_URL=https://studiotangible.com.mx` in the server env.
3. Serve over **HTTPS** (required for install — your domain already has SSL).
4. Build & run the Node app: `npm run build` then `npm start`.

---

## 4. Instrucciones para instalar la app (para la administradora)

> La app es **solo para ti** (panel de administración). Las clientas siguen usando
> el link normal de Instagram, ellas no instalan nada.

### En iPhone (Safari) — recomendado
1. Abre **Safari** (tiene que ser Safari, no Chrome).
2. Entra a **studiotangible.com.mx/login**
3. Toca el botón **Compartir** (el cuadro con la flecha hacia arriba ⬆️, abajo en el centro).
4. Desliza y toca **"Agregar a inicio"** (Add to Home Screen).
5. Verás el nombre **Tangible** y el logo → toca **"Agregar"**.
6. Cierra Safari y abre el ícono **Tangible** desde tu pantalla de inicio.
7. La **primera vez**, inicia sesión con tu correo y contraseña dentro de la app.
   Después se queda guardada y abre directo en el panel, en pantalla completa. ✅

### En Android (Chrome)
1. Abre **Chrome** y entra a **studiotangible.com.mx/login**
2. Toca el menú **⋮** (arriba a la derecha) → **"Instalar aplicación"** / **"Agregar a pantalla principal"**.
3. Confirma. El ícono **Tangible** aparece en tu pantalla de inicio y abre como app.

### Importante
- Instálala desde **/login** (o el panel), **no** desde el link público de reservas.
- En iPhone debe ser **Safari**.
- Si algún día te pide iniciar sesión otra vez, solo vuelve a entrar; es normal.

---

## 5. iOS limitations (technical)

- Install works **only from Safari**, and is **manual** (Share → Add to Home Screen).
  iOS shows no automatic prompt — by design this is fine since only the admin installs.
- iOS splash uses **one image per device**; common modern iPhones are covered. An
  unlisted device falls back to a clean cream screen.
- The installed app may keep a **separate login session** from Safari, so the admin
  logs in once inside the app the first time.
- Changing the icon later requires removing and re-adding the app (iOS caches it).

---

## 6. Adding a new device splash size

Edit the `SPLASHES` array in `scripts/generate-pwa-icons.mjs` **and** the
`startupImage` list in `src/lib/pwa-metadata.ts` (matching CSS width/height + DPR),
then re-run the generator.
