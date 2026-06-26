# Fuentes autohospedadas

La app usa dos tipografías propias. Coloca aquí los archivos y se activarán
automáticamente en todos los dispositivos (incluidos los teléfonos de las clientas).

Archivos esperados (formato **.woff2**, mismo nombre exacto):

| Archivo                 | Uso                                              | Familia CSS       |
| ----------------------- | ------------------------------------------------ | ----------------- |
| `CenturyGothic.woff2`   | Toda la interfaz (texto, botones, formularios, títulos de sección) | `Century Gothic`  |
| `CenturyGothic-Bold.woff` | Negritas reales (`font-bold` / `font-black`)   | `Century Gothic` (700–900) |
| `BostonAngel.woff2`     | Marca + títulos principales de página (H1) y héroes display | `Boston Angel`    |

## Notas

- Mientras los archivos no existan, la app **no se rompe**: usa `local()` (la fuente
  instalada en el equipo, si la hay) y, si no, el fallback definido en
  `tailwind.config.js`. Por eso en móviles conviene tener los `.woff2` aquí.
- Si solo tienes el archivo en `.ttf`/`.otf`, conviértelo a `.woff2`
  (p. ej. con https://transfonter.org) para que pese menos y cargue más rápido.
- La declaración `@font-face` está en `src/app/globals.css`. Si cambias el nombre
  del archivo, actualízalo también allí.
