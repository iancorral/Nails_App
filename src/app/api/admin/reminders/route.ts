import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { chihuahuaToUTC, getChihuahuaParts } from "@/lib/timezone";

/**
 * Devuelve las citas de MAÑANA (día de calendario de Chihuahua) en vivo, junto
 * con si ya se envió su recordatorio. El mensaje se arma en el cliente desde
 * estos datos, por lo que siempre coincide con la base de datos y el calendario.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // "Mañana" en calendario de Chihuahua, traducido a límites UTC.
  const today = getChihuahuaParts(new Date());
  const start = chihuahuaToUTC(today.year, today.month, today.day + 1, 0, 0);
  const end = chihuahuaToUTC(today.year, today.month, today.day + 2, 0, 0);

  const appointments = await prisma.appointment.findMany({
    where: { status: "CONFIRMED", date: { gte: start, lt: end } },
    include: { services: true },
    orderBy: { date: "asc" },
  });

  const ids = appointments.map((a) => a.id);
  const sentLog = ids.length
    ? await prisma.reminder.findMany({
        where: { appointmentId: { in: ids }, sent: true },
      })
    : [];
  const sentSet = new Set(sentLog.map((r) => r.appointmentId));

  return NextResponse.json(
    appointments.map((a) => ({
      id: a.id,
      clientName: a.clientName,
      clientPhone: a.clientPhone,
      date: a.date,
      services: a.services.map((s) => ({ name: s.name })),
      reminderSent: sentSet.has(a.id),
    }))
  );
}

/** Marca el recordatorio de una cita como enviado (bitácora idempotente). */
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { appointmentId } = await req.json();
    if (typeof appointmentId !== "string" || !/^[a-f\d]{24}$/i.test(appointmentId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });
    if (!appointment) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
    }

    const existing = await prisma.reminder.findFirst({ where: { appointmentId } });
    if (existing) {
      await prisma.reminder.update({
        where: { id: existing.id },
        data: { sent: true, sentAt: new Date() },
      });
    } else {
      await prisma.reminder.create({
        data: {
          appointmentId,
          clientName: appointment.clientName,
          clientPhone: appointment.clientPhone,
          scheduledFor: appointment.date,
          sent: true,
          sentAt: new Date(),
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
