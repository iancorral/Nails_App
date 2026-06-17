import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { addMinutes } from "date-fns";
import { z } from "zod";

const createSchema = z.object({
  clientName: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ.''\-\s]+$/, "Nombre contiene caracteres no permitidos"),
  clientPhone: z
    .string()
    .regex(/^[\d\s\-().+]{7,20}$/, "Teléfono inválido"),
  serviceIds: z
    .array(z.string().regex(/^[a-f\d]{24}$/i))
    .min(1)
    .max(10),
  date: z.string().datetime().optional(),
  adminNotes: z.string().max(500).optional().nullable(),
  depositAmount: z.number().min(0).nullable().optional(), // ← acepta null
  depositPaid: z.boolean().optional(),
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
    const validation = createSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.format() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Determinar duración total: nuevos servicios si vienen, si no los actuales
    let totalDuration: number;
    let serviceConnect: { id: string }[] | undefined;

    if (data.serviceIds) {
      const services = await prisma.service.findMany({
        where: { id: { in: data.serviceIds } },
      });
      if (services.length === 0) {
        return NextResponse.json({ error: "Servicios no encontrados" }, { status: 404 });
      }
      totalDuration = services.reduce((acc, s) => acc + s.duration, 0);
      serviceConnect = data.serviceIds.map((sid) => ({ id: sid }));
    } else {
      const existing = await prisma.appointment.findUnique({
        where: { id },
        include: { services: true },
      });
      if (!existing) {
        return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
      }
      totalDuration = existing.services.reduce((acc, s) => acc + s.duration, 0);
    }

    // Fecha base: la nueva si viene, si no la existente
    let startDate: Date;
    if (data.date) {
      startDate = new Date(data.date);
    } else {
      const existing = await prisma.appointment.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
      }
      startDate = existing.date;
    }

    const endDate = addMinutes(startDate, totalDuration);

    const updateData: Record<string, unknown> = {
      date: startDate,
      endDate,
    };
    if (data.clientName) updateData.clientName = data.clientName;
    if (data.clientPhone) updateData.clientPhone = data.clientPhone;
    if (data.adminNotes !== undefined) updateData.adminNotes = data.adminNotes;
    if (serviceConnect) {
      updateData.services = { set: serviceConnect };
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: { services: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}