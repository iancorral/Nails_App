import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasConfirmedCollision } from "@/lib/availability";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum(["CONFIRMED", "CANCELLED"]),
});

/**
 * Cancela (soft) o restaura una cita cambiando su estado. Nunca borra datos: una
 * cita cancelada permanece para historial, métricas de cancelación y reportes,
 * pero deja de ocupar disponibilidad y de aparecer en próximas/recordatorios.
 */
export async function PATCH(
  request: Request,
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
    const body = await request.json();
    const validation = patchSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    const { status } = validation.data;

    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
    }

    // Al restaurar una cita futura, evita reponerla sobre un horario que otra
    // cita confirmada haya ocupado mientras estuvo cancelada (evita doble reserva).
    // Las citas pasadas se restauran sin validar: solo son registro histórico.
    if (
      status === "CONFIRMED" &&
      existing.status === "CANCELLED" &&
      existing.date.getTime() > Date.now()
    ) {
      const collision = await hasConfirmedCollision(existing.date, existing.endDate, id);
      if (collision) {
        return NextResponse.json(
          {
            error:
              "El horario ya fue ocupado por otra cita. Muévela a otro horario antes de restaurarla.",
          },
          { status: 409 }
        );
      }
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updatedAppointment);
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
