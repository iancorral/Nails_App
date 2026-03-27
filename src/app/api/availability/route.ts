import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addMinutes, format, isBefore } from "date-fns";
import { z } from "zod";

const availabilitySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  duration: z.number().int().min(15).max(480),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date");
  const durationParam = searchParams.get("duration");

  const validation = availabilitySchema.safeParse({
    date: dateParam,
    duration: durationParam ? parseInt(durationParam) : undefined,
  });

  if (!validation.success) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const { date, duration } = validation.data;
  const [year, month, day] = date.split("-").map(Number);
  const dayOfWeek = new Date(year, month - 1, day).getDay();

  try {
    // 1. Verificar si el día está bloqueado explícitamente
    const dayStart = new Date(year, month - 1, day, 0, 0, 0);
    const dayEnd = new Date(year, month - 1, day, 23, 59, 59);

    const blockedDate = await prisma.blockedDate.findFirst({
      where: { date: { gte: dayStart, lte: dayEnd } },
    });

    if (blockedDate) return NextResponse.json([]);

    // 2. Obtener el horario del día de la semana
    const schedule = await prisma.workSchedule.findFirst({
      where: { dayOfWeek },
    });

    // Si es día libre o no hay horario configurado para ese día, retornar vacío
    if (schedule?.isDayOff) return NextResponse.json([]);

    // Usar horario de la DB o fallback a 10:00-19:00
    const [startH, startM] = (schedule?.startTime ?? "10:00").split(":").map(Number);
    const [endH, endM] = (schedule?.endTime ?? "19:00").split(":").map(Number);

    const workStart = new Date(year, month - 1, day, startH, startM, 0);
    const workEnd = new Date(year, month - 1, day, endH, endM, 0);

    // 3. Filtrar horarios pasados si es hoy
    const now = new Date();
    const isToday =
      now.getFullYear() === year &&
      now.getMonth() === month - 1 &&
      now.getDate() === day;

    // 4. Traer citas confirmadas del día
    const appointments = await prisma.appointment.findMany({
      where: {
        status: "CONFIRMED",
        OR: [
          { date: { gte: dayStart, lte: dayEnd } },
          { endDate: { gte: dayStart, lte: dayEnd } },
        ],
      },
    });

    const availableSlots: string[] = [];
    let currentSlot = new Date(workStart);

    while (currentSlot.getTime() <= workEnd.getTime()) {
      const potentialEnd = addMinutes(currentSlot, duration);

      if (currentSlot.getTime() <= workEnd.getTime()) {
        if (isToday) {
          const thirtyMinFromNow = addMinutes(now, 30);
          if (isBefore(currentSlot, thirtyMinFromNow)) {
            currentSlot = addMinutes(currentSlot, 30);
            continue;
          }
        }

        const isCollision = appointments.some((app) => {
          const appStart = new Date(app.date);
          const appEnd = new Date(app.endDate);
          return (
            currentSlot.getTime() < appEnd.getTime() &&
            potentialEnd.getTime() > appStart.getTime()
          );
        });

        if (!isCollision) {
          availableSlots.push(format(currentSlot, "HH:mm"));
        }
      }

      currentSlot = addMinutes(currentSlot, 30);
    }

    return NextResponse.json(availableSlots);
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}