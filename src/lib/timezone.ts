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

export const minutesToLabel = minutesToTimeLabel;
export function utcDateToChihuahuaMinutes(date: Date): number {
  const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes();
  return ((utcMinutes - CHIHUAHUA_UTC_OFFSET * 60) % 1440 + 1440) % 1440;
}

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


export function getChihuahuaParts(date: Date) {
  const wall = new Date(date.getTime() - CHIHUAHUA_UTC_OFFSET * 3600000);
  return {
    year: wall.getUTCFullYear(),
    month: wall.getUTCMonth() + 1, 
    day: wall.getUTCDate(),
    weekday: wall.getUTCDay(),    
    hour: wall.getUTCHours(),
    minute: wall.getUTCMinutes(),
  };
}

export function chihuahuaDateKey(date: Date): string {
  const p = getChihuahuaParts(date);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}


export function formatChihuahuaTime(date: Date): string {
  return minutesToTimeLabel(utcDateToChihuahuaMinutes(date));
}

export function formatChihuahuaDate(date: Date): string {
  const p = getChihuahuaParts(date);
  return `${WEEKDAYS_ES[p.weekday]} ${p.day} de ${MONTHS_ES[p.month - 1]}`;
}

export function formatChihuahuaMonthShort(date: Date): string {
  return MONTHS_ES_SHORT[getChihuahuaParts(date).month - 1];
}