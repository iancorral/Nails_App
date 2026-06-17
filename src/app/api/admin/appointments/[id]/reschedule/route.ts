import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { addMinutes } from "date-fns";
import { z } from "zod";

const rescheduleSchema = z.object({
  date: z.string().datetime(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  if (!id || !/^[a-f\d]{24}$/i.test(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const validation = rescheduleSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
    }

    // Traer la cita con sus servicios para recalcular endDate
    const existing = await prisma.appointment.findUnique({
      where: { id },
      include: { services: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
    }

    const totalDuration = existing.services.reduce((a, s) => a + s.duration, 0);
    const newStart = new Date(validation.data.date);
    const newEnd   = addMinutes(newStart, totalDuration);

    const updated = await prisma.appointment.update({
      where: { id },
      data: { date: newStart, endDate: newEnd },
      include: { services: true },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}