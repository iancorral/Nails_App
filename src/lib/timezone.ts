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