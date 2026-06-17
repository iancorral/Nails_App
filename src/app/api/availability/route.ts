import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addMinutes, isBefore } from "date-fns";
import { z } from "zod";
import { chihuahuaToUTC, minutesToLabel, CHIHUAHUA_UTC_OFFSET } from "@/lib/timezone";

export const dynamic = "force-dynamic";

// Minutes of prep/cleanup buffer reserved after each appointment ends.
// Customers cannot book a slot that starts within this window after an appointment.
const BUFFER_AFTER_APPOINTMENT = 30;

const availabilitySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  duration: z.number().int().min(15).max(480),
  excludeId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date");
  const durationParam = searchParams.get("duration");
  const excludeIdParam = searchParams.get("excludeId");

  const validation = availabilitySchema.safeParse({
    date: dateParam,
    duration: durationParam ? parseInt(durationParam) : undefined,
    excludeId: excludeIdParam ?? undefined,
  });

  if (!validation.success) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const { date, duration, excludeId } = validation.data;
  const [year, month, day] = date.split("-").map(Number);
  const dayOfWeek = new Date(year, month - 1, day).getDay();

  try {
    const dayStart = chihuahuaToUTC(year, month, day, 0, 0);
    const dayEnd = chihuahuaToUTC(year, month, day + 1, 0, 0);

    // --- Check date-specific override first ---
    const override = await prisma.availabilityOverride.findFirst({
      where: { date: { gte: dayStart, lt: dayEnd } },
    });

    if (override?.isClosed) return NextResponse.json([]);

    // --- Día bloqueado ---
    const blockedDate = await prisma.blockedDate.findFirst({
      where: { date: { gte: dayStart, lt: dayEnd } },
    });
    if (blockedDate) return NextResponse.json([]);

    // --- Horario laboral (override > weekly schedule > defaults) ---
    let startMinutes: number;
    let endMinutes: number;

    if (override?.startTime && override?.endTime) {
      const [sh, sm] = override.startTime.split(":").map(Number);
      const [eh, em] = override.endTime.split(":").map(Number);
      startMinutes = sh * 60 + sm;
      endMinutes = eh * 60 + em;
    } else {
      const schedule = await prisma.workSchedule.findFirst({ where: { dayOfWeek } });
      if (schedule?.isDayOff) return NextResponse.json([]);
      const [startH, startM] = (schedule?.startTime ?? "10:00").split(":").map(Number);
      const [endH, endM] = (schedule?.endTime ?? "19:00").split(":").map(Number);
      startMinutes = startH * 60 + startM;
      endMinutes = endH * 60 + endM;
    }

    // --- ¿Es hoy en Chihuahua? ---
    const now = new Date();
    const chihuahuaNow = new Date(now.getTime() - CHIHUAHUA_UTC_OFFSET * 3600000);
    const isToday =
      chihuahuaNow.getUTCFullYear() === year &&
      chihuahuaNow.getUTCMonth() === month - 1 &&
      chihuahuaNow.getUTCDate() === day;

    // --- Citas confirmadas del día ---
    const appointments = await prisma.appointment.findMany({
      where: {
        status: "CONFIRMED",
        ...(excludeId ? { id: { not: excludeId } } : {}),
        OR: [
          { date: { gte: dayStart, lt: dayEnd } },
          { endDate: { gt: dayStart, lte: dayEnd } },
        ],
      },
    });

    // --- Generar slots ---
    const slots: string[] = [];
    let currentMinutes = startMinutes;

    while (currentMinutes + duration <= endMinutes) {
      const slotStart = chihuahuaToUTC(year, month, day, Math.floor(currentMinutes / 60), currentMinutes % 60);
      const slotEnd = addMinutes(slotStart, duration);

      if (isToday) {
        const thirtyMinFromNow = addMinutes(now, 30);
        if (isBefore(slotStart, thirtyMinFromNow)) {
          currentMinutes += 30;
          continue;
        }
      }

      const hasCollision = appointments.some((app) => {
        const appStart = new Date(app.date);
        // Extend appointment end by buffer so the next slot must start after the gap
        const appEndWithBuffer = addMinutes(new Date(app.endDate), BUFFER_AFTER_APPOINTMENT);
        return slotStart.getTime() < appEndWithBuffer.getTime() && slotEnd.getTime() > appStart.getTime();
      });

      if (!hasCollision) {
        slots.push(minutesToLabel(currentMinutes));
      }

      currentMinutes += 30;
    }

    return NextResponse.json(slots);
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
