import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addMinutes, format, isBefore } from "date-fns";
import { z } from "zod";

// Validación de los parámetros de entrada
const availabilitySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido"),
  duration: z
    .number()
    .int()
    .min(15, "Duración mínima 15 min")
    .max(480, "Duración máxima 8 horas"),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date");
  const durationParam = searchParams.get("duration");

  // Validar antes de tocar la DB
  const validation = availabilitySchema.safeParse({
    date: dateParam,
    duration: durationParam ? parseInt(durationParam) : undefined,
  });

  if (!validation.success) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const { date, duration } = validation.data;

  try {
    const searchDateStart = new Date(`${date}T00:00:00.000Z`);
    const searchDateEnd = new Date(`${date}T23:59:59.999Z`);

    const appointments = await prisma.appointment.findMany({
      where: {
        status: "CONFIRMED",
        OR: [
          { date: { gte: searchDateStart, lte: searchDateEnd } },
          { endDate: { gte: searchDateStart, lte: searchDateEnd } },
        ],
      },
    });

    const workStart = new Date(`${date}T10:00:00`);
    const workEnd = new Date(`${date}T19:00:00`);
    const availableSlots: string[] = [];
    let currentSlot = new Date(workStart);

    while (isBefore(currentSlot, workEnd)) {
      const potentialEnd = addMinutes(currentSlot, duration);

      if (potentialEnd.getTime() <= workEnd.getTime()) {
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