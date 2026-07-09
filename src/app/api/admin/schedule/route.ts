import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const scheduleSchema = z.array(
  z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    isDayOff: z.boolean(),
  })
);

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const schedule = await prisma.workSchedule.findMany({
    orderBy: { dayOfWeek: "asc" },
  });

  if (schedule.length === 0) {
    return NextResponse.json(
      [0, 1, 2, 3, 4, 5, 6].map((day) => ({
        dayOfWeek: day,
        startTime: "10:00",
        endTime: "19:00",
        isDayOff: day === 0, 
      }))
    );
  }

  return NextResponse.json(schedule);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const validation = scheduleSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    await prisma.workSchedule.deleteMany();
    await prisma.workSchedule.createMany({ data: validation.data });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}