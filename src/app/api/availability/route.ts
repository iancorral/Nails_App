// src/app/api/availability/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addMinutes, format, parse, isBefore } from 'date-fns';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get('date'); // "2024-02-20"
  const durationParam = searchParams.get('duration'); 

  if (!dateParam || !durationParam) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const serviceDuration = parseInt(durationParam);

  // 1. Definir rango del día en UTC para buscar en la Base de Datos
  // Truco de ingeniero: Creamos las fechas manualmente para asegurar que cubrimos todo el día
  const searchDateStart = new Date(`${dateParam}T00:00:00.000Z`);
  const searchDateEnd = new Date(`${dateParam}T23:59:59.999Z`);

  // 2. Traer citas existentes (CONFIRMED)
  // Buscamos cualquier cita que ocurra o se traslape con este día
  const appointments = await prisma.appointment.findMany({
    where: {
      status: 'CONFIRMED',
      OR: [
        {
          date: { gte: searchDateStart, lte: searchDateEnd } // Empieza hoy
        },
        {
          endDate: { gte: searchDateStart, lte: searchDateEnd } // Termina hoy
        }
      ]
    }
  });

  // 3. Definir Horario Laboral (Hardcoded por ahora: 10:00 a 19:00)
  // Usamos la fecha del parametro para crear objetos Date locales correctos
  const workStart = new Date(`${dateParam}T10:00:00`); 
  const workEnd = new Date(`${dateParam}T19:00:00`);

  const availableSlots = [];
  let currentSlot = new Date(workStart);

  // 4. Algoritmo de Barrido
  while (isBefore(currentSlot, workEnd)) {
    const potentialEnd = addMinutes(currentSlot, serviceDuration);

    // Regla A: El servicio debe terminar ANTES de cerrar
    // Usamos .getTime() para comparar números exactos (milisegundos)
    if (potentialEnd.getTime() <= workEnd.getTime()) {
      
      // Regla B: Choque con citas existentes
      const isCollision = appointments.some(app => {
        // Convertimos fechas de la BD a objetos Date para comparar
        const appStart = new Date(app.date);
        const appEnd = new Date(app.endDate);

        // FORMULA MAESTRA DE COLISIÓN:
        // (NuevoInicio < CitaFin) Y (NuevoFin > CitaInicio)
        // Esto detecta si metes una cita de 9 a 11 y ya hay una de 10 a 10:30.
        return (currentSlot.getTime() < appEnd.getTime() && potentialEnd.getTime() > appStart.getTime());
      });

      if (!isCollision) {
        // Si no choca, lo agregamos a la lista
        // Formato HH:mm para el frontend
        availableSlots.push(format(currentSlot, 'HH:mm'));
      }
    }

    // Avanzamos 30 minutos
    currentSlot = addMinutes(currentSlot, 30);
  }

  return NextResponse.json(availableSlots);
}