import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addMinutes } from 'date-fns';
import { z } from 'zod'; 

const bookingSchema = z.object({
  clientName: z
    .string()
    .min(2, "Nombre muy corto")
    .max(100)
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, "Solo se permiten letras"),
  clientPhone: z
    .string()
    .regex(/^\+?[\d\s\-]{10,15}$/, "Teléfono inválido"),
  serviceIds: z
    .array(z.string().regex(/^[a-f\d]{24}$/i, "ID inválido"))
    .min(1)
    .max(10),
  date: z.string().datetime(),
  notes: z
    .string()
    .max(500)
    .transform(val => val.replace(/[<>"'`]/g, ""))
    .optional(),
  website_url: z.string().optional().or(z.literal('')),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.website_url && body.website_url.length > 0) {
      console.warn("Bot detectado y bloqueado.");
      return NextResponse.json({ message: "Procesado" }, { status: 200 }); 
    }

    const validation = bookingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Datos incorrectos", details: validation.error.format() }, { status: 400 });
    }

    const { serviceIds, date, clientName, clientPhone } = validation.data;

    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds } }
    });

    if (services.length === 0) {
      return NextResponse.json({ error: "Servicios no encontrados" }, { status: 404 });
    }

    const totalDuration = services.reduce((acc, service) => acc + service.duration, 0);
    const startDate = new Date(date);
    const endDate = addMinutes(startDate, totalDuration);

    console.log(`⏱️ Cita de ${totalDuration} min. Fin: ${endDate}`);

    const appointment = await prisma.appointment.create({
      data: {
        date: startDate,
        endDate: endDate,
        clientName,
        clientPhone,
        status: 'CONFIRMED',
        services: {
          connect: serviceIds.map((id) => ({ id }))
        }
      }
    });

    return NextResponse.json(appointment, { status: 201 });

  } catch (error) {
    console.error("Error crítico:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}