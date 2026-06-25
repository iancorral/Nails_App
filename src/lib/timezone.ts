// Chihuahua, México — sin horario de verano desde decreto 2022.
// UTC-6 fijo todo el año, alineado con CDMX.
export const CHIHUAHUA_UTC_OFFSET = 6;

export function chihuahuaToUTC(
  year: number, month: number, day: number,
  hour: number, minute: number
): Date {
  return new Date(Date.UTC(year, month - 1, day, hour + CHIHUAHUA_UTC_OFFSET, minute, 0));
}

export function minutesToTimeLabel(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Para compatibilidad con código existente
export const minutesToLabel = minutesToTimeLabel;

/** Convierte un Date UTC real → minutos del día en hora Chihuahua */
export function utcDateToChihuahuaMinutes(date: Date): number {
  const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes();
  return ((utcMinutes - CHIHUAHUA_UTC_OFFSET * 60) % 1440 + 1440) % 1440;
}

// ── Formato de fechas en hora de Chihuahua ──────────────────────────────────
// IMPORTANTE: nunca uses date-fns `format()` directamente sobre un Date UTC para
// mostrar/enviar horas: `format()` usa la zona horaria del runtime (UTC en
// Vercel), lo que desfasaba las horas 6 h en los recordatorios de WhatsApp.
// Estos helpers son la única fuente de verdad y son independientes del runtime.

const WEEKDAYS_ES = [
  "domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado",
];
const MONTHS_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const MONTHS_ES_SHORT = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

/**
 * Componentes de calendario en hora local de Chihuahua para un instante UTC.
 * Desplaza el instante por el offset fijo y lee con getters UTC, de modo que el
 * resultado no depende de la zona horaria del servidor ni del navegador.
 */
export function getChihuahuaParts(date: Date) {
  const wall = new Date(date.getTime() - CHIHUAHUA_UTC_OFFSET * 3600000);
  return {
    year: wall.getUTCFullYear(),
    month: wall.getUTCMonth() + 1, // 1-12
    day: wall.getUTCDate(),
    weekday: wall.getUTCDay(),     // 0 = domingo
    hour: wall.getUTCHours(),
    minute: wall.getUTCMinutes(),
  };
}

/** Clave de día `yyyy-mm-dd` en el calendario de Chihuahua. */
export function chihuahuaDateKey(date: Date): string {
  const p = getChihuahuaParts(date);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** "14:00" en hora de Chihuahua. */
export function formatChihuahuaTime(date: Date): string {
  return minutesToTimeLabel(utcDateToChihuahuaMinutes(date));
}

/** "lunes 24 de junio" en hora de Chihuahua. */
export function formatChihuahuaDate(date: Date): string {
  const p = getChihuahuaParts(date);
  return `${WEEKDAYS_ES[p.weekday]} ${p.day} de ${MONTHS_ES[p.month - 1]}`;
}

/** "jun" — mes corto en hora de Chihuahua. */
export function formatChihuahuaMonthShort(date: Date): string {
  return MONTHS_ES_SHORT[getChihuahuaParts(date).month - 1];
}