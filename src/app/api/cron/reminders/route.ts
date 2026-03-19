import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { format, addDays, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const tomorrow = addDays(new Date(), 1);
  const start = startOfDay(tomorrow);
  const end = endOfDay(tomorrow);

  const appointments = await prisma.appointment.findMany({
    where: {
      status: "CONFIRMED",
      date: { gte: start, lte: end },
    },
    include: { services: true },
    orderBy: { date: "asc" },
  });

  if (appointments.length === 0) {
    return NextResponse.json({ message: "No hay citas mañana", sent: 0 });
  }

  const reminders = appointments.map((app) => {
    const dateStr = format(app.date, "EEEE d 'de' MMMM", { locale: es });
    const timeStr = format(app.date, "HH:mm");
    const servicesStr = app.services.map((s) => s.name).join(", ");

    const message = `HOLA ${app.clientName.split(" ")[0].toUpperCase()}, TE ESCRIBIMOS DE TANGIBLE.\n\nTE RECORDAMOS QUE MAÑANA TIENES CITA:\n\nFECHA: ${dateStr} a las ${timeStr}\nSERVICIOS: ${servicesStr}\n\n¡Te esperamos!`;

    const whatsappUrl = `https://wa.me/${app.clientPhone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;

    return {
      appointmentId: app.id,
      clientName: app.clientName,
      clientPhone: app.clientPhone,
      scheduledFor: tomorrow,
      whatsappUrl,
      sent: false,
    };
  });

  // Borrar recordatorios anteriores del mismo día y guardar los nuevos
  await prisma.reminder.deleteMany({
    where: { scheduledFor: { gte: start, lte: end } },
  });

  await prisma.reminder.createMany({ data: reminders });

  return NextResponse.json({
    message: `${reminders.length} recordatorio(s) generados`,
    reminders,
  });
}