import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { normalizePhone } from "@/lib/phone";
import { getAppointmentAmount } from "@/lib/pricing";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const OBJECT_ID = /^[a-f\d]{24}$/i;

const updateSchema = z.object({
  name: z
    .string()
    .min(2, "Nombre muy corto")
    .max(100)
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ.'’\-\s]+$/, "Nombre contiene caracteres no permitidos"),
  phone: z.string().regex(/^[\d\s\-().+]{10,20}$/, "Teléfono inválido"),
  notes: z.string().max(500).nullable().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  if (!OBJECT_ID.test(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) {
    return NextResponse.json({ error: "Clienta no encontrada" }, { status: 404 });
  }

  const appointments = await prisma.appointment.findMany({
    where: { customerId: id },
    include: { services: true },
    orderBy: { date: "desc" },
  });

  // Cancelled appointments stay visible in the history but never count toward
  // visits or spend, matching how the dashboard and revenue reports treat them.
  const attended = appointments.filter((a) => a.status !== "CANCELLED");

  return NextResponse.json({
    customer,
    appointments,
    stats: {
      visits: attended.length,
      cancelled: appointments.length - attended.length,
      totalSpent: attended.reduce((total, a) => total + getAppointmentAmount(a), 0),
      lastVisit: attended[0]?.date ?? null,
    },
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  if (!OBJECT_ID.test(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const validation = updateSchema.safeParse(await req.json());
    if (!validation.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const phone = normalizePhone(validation.data.phone);
    if (!phone) {
      return NextResponse.json({ error: "Teléfono inválido" }, { status: 400 });
    }

    // Explicit conflict check before writing anything. Two customer records for
    // the same person is a real situation (an old number and a new one), but
    // resolving it means moving appointment history between records, which the
    // owner has to ask for on purpose — never as a side effect of an edit.
    const holder = await prisma.customer.findUnique({
      where: { phone },
      select: { id: true, name: true },
    });

    if (holder && holder.id !== id) {
      const visits = await prisma.appointment.count({
        where: { customerId: holder.id, status: { not: "CANCELLED" } },
      });
      return NextResponse.json(
        {
          error: "Ese teléfono ya es de otra clienta",
          conflict: { id: holder.id, name: holder.name, visits },
        },
        { status: 409 }
      );
    }

    const notes = validation.data.notes?.trim();

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        name: validation.data.name.trim(),
        phone,
        notes: notes ? notes : null,
      },
    });

    // Past appointments keep the name and phone they were booked with: they are
    // the record of that day, not a view of the client's current details.
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Backstop for the narrow race between the check above and the write.
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Ese teléfono ya es de otra clienta" },
          { status: 409 }
        );
      }
      if (error.code === "P2025") {
        return NextResponse.json({ error: "Clienta no encontrada" }, { status: 404 });
      }
    }
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
