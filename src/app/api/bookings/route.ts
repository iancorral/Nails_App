// src/app/api/bookings/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addMinutes } from 'date-fns';
import { z } from 'zod'; // 🛡️ Importamos la librería de seguridad

// 1. ESQUEMA DE SEGURIDAD (Las reglas del juego)
// Si los datos no cumplen esto, ni siquiera molestamos a la base de datos.
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
    console.log("📥 Petición recibida:", body);

    // --- 🛡️ NIVEL 1: TRAMPA PARA BOTS (Honeypot) ---
    // Si el campo invisible 'website_url' tiene texto, es un bot estúpido.
    // Rechazamos la petición fingiendo que todo está bien para no darle pistas.
    if (body.website_url && body.website_url.length > 0) {
      console.warn("Bot detectado y bloqueado.");
      return NextResponse.json({ message: "Procesado" }, { status: 200 }); 
    }

    // --- 🛡️ NIVEL 2: VALIDACIÓN DE DATOS (Zod) ---
    const validation = bookingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Datos incorrectos", details: validation.error.format() }, { status: 400 });
    }

    // Usamos los datos LIMPIOS de la validación
    const { serviceIds, date, clientName, clientPhone } = validation.data;

    // 2. Buscar Servicios
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds } }
    });

    if (services.length === 0) {
      return NextResponse.json({ error: "Servicios no encontrados" }, { status: 404 });
    }

    // 3. Calcular Duración y Fechas
    const totalDuration = services.reduce((acc, service) => acc + service.duration, 0);
    const startDate = new Date(date);
    const endDate = addMinutes(startDate, totalDuration);

    console.log(`⏱️ Cita de ${totalDuration} min. Fin: ${endDate}`);

    // 4. Guardar en Base de Datos
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