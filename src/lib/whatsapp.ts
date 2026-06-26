import { BUSINESS_NAME } from "@/lib/config/business";
import { formatChihuahuaDate, formatChihuahuaTime } from "@/lib/timezone";

// Única fuente de los mensajes de WhatsApp. Si hay que cambiar el texto o el
// formato, se cambia aquí y se refleja en confirmaciones y recordatorios.

export type AppointmentMessageData = {
  clientName: string;
  /** Instante UTC de la cita (tal cual se guarda en la base de datos). */
  date: Date | string;
  serviceNames: string[];
};

function asDate(d: Date | string): Date {
  return d instanceof Date ? d : new Date(d);
}

function firstName(name: string): string {
  const trimmed = name.trim();
  return trimmed.split(/\s+/)[0] || trimmed;
}

/**
 * Normaliza un teléfono a dígitos en formato internacional para wa.me.
 * Por defecto asume México (+52) cuando el número viene en formato nacional.
 */
export function normalizeWhatsappPhone(raw: string): string {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("52")) return digits;     // ya incluye lada de país (México)
  if (digits.length === 10) return `52${digits}`; // número nacional de 10 dígitos
  return digits;                                   // ya trae otra lada de país
}

export function buildWhatsAppUrl(rawPhone: string, message: string): string {
  return `https://wa.me/${normalizeWhatsappPhone(rawPhone)}?text=${encodeURIComponent(message)}`;
}

// Nota: se usan etiquetas de texto (FECHA:, HORA:) en vez de emojis a propósito;
// en algunos dispositivos los emojis se mostraban como "?" en WhatsApp.
function appointmentLines(a: AppointmentMessageData): string[] {
  const date = asDate(a.date);
  return [
    `FECHA: ${formatChihuahuaDate(date)}`,
    `HORA: ${formatChihuahuaTime(date)} hrs`,
    `SERVICIOS: ${a.serviceNames.join(", ")}`,
  ];
}

/** Mensaje de confirmación al crear la cita desde el panel (negocio → clienta). */
export function buildConfirmationMessage(a: AppointmentMessageData): string {
  return [
    `Hola ${firstName(a.clientName)}, te escribo de ${BUSINESS_NAME}.`,
    ``,
    `Tu cita ha quedado agendada:`,
    ``,
    ...appointmentLines(a),
    ``,
    `Si necesitas reagendar o cancelar, mandame mensaje ¡Te espero!`,
  ].join("\n");
}

/** Mensaje de recordatorio, un día antes de la cita (negocio → clienta). */
export function buildReminderMessage(a: AppointmentMessageData): string {
  return [
    `Hola ${firstName(a.clientName)}!`,
    ``,
    `Para recordarte que mañana tienes cita:`,
    ``,
    ...appointmentLines(a),
    ``,
    `¿Me confirmas tu asistencia? Responde *Sí* para confirmar o escríbeme si necesitas reagendar. ¡Te espero!`,
  ].join("\n");
}

/**
 * Solicitud de confirmación que envía la clienta al salón tras reservar en la web
 * (clienta → negocio). Recibe etiquetas ya formateadas porque proviene de la
 * selección del calendario público, no de un instante UTC almacenado.
 */
export function buildClientBookingRequestMessage(opts: {
  dateLabel: string;
  timeLabel: string;
  serviceNames: string[];
  durationMinutes: number;
}): string {
  return [
    `Hola ${BUSINESS_NAME}.`,
    ``,
    `Soy *una clienta nueva* (reservé en la web).`,
    ``,
    `FECHA: ${opts.dateLabel} a las ${opts.timeLabel}`,
    `SERVICIOS: ${opts.serviceNames.join(", ")}`,
    `DURACIÓN: ${opts.durationMinutes} min`,
    ``,
    `¿Queda confirmada mi cita?`,
  ].join("\n");
}

/** Conveniencia: URL de WhatsApp con el mensaje de confirmación listo. */
export function buildConfirmationUrl(phone: string, a: AppointmentMessageData): string {
  return buildWhatsAppUrl(phone, buildConfirmationMessage(a));
}

/** Conveniencia: URL de WhatsApp con el mensaje de recordatorio listo. */
export function buildReminderUrl(phone: string, a: AppointmentMessageData): string {
  return buildWhatsAppUrl(phone, buildReminderMessage(a));
}
