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
    .regex(/^[\d\s\-().+]{7,20}$/, "Teléfono inválido")
    .optional()
    .or(z.literal("")),
  serviceIds: z
    .array(z.string().regex(/^[a-f\d]{24}$/i))
    .min(1)
    .max(10),
  date: z.string().datetime(),
  adminNotes: z.string().max(500).optional().nullable(),
  depositAmount: z.number().min(0).nullable().optional(), 
  depositPaid: z.boolean().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
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

    const { serviceIds, date, clientName, clientPhone, adminNotes, depositAmount, depositPaid } =
      validation.data;

    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds } },
    });

    if (services.length === 0) {
      return NextResponse.json({ error: "Servicios no encontrados" }, { status: 404 });
    }

    const totalDuration = services.reduce((acc, s) => acc + s.duration, 0);
    const startDate = new Date(date);
    const endDate = addMinutes(startDate, totalDuration);

    const normalizedPhone = clientPhone && clientPhone.trim() ? clientPhone.trim() : null;

    const appointment = await prisma.appointment.create({
      data: {
        date: startDate,
        endDate,
        clientName,
        clientPhone: normalizedPhone,
        status: "CONFIRMED",
        createdByAdmin: true,
        adminNotes: adminNotes ?? null,
        depositAmount: depositAmount ?? null,
        depositPaid: depositPaid ?? false,
        services: {
          connect: serviceIds.map((id) => ({ id })),
        },
      },
      include: { services: true },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}