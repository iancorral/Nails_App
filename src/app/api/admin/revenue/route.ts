import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CHIHUAHUA_UTC_OFFSET, chihuahuaToUTC, getChihuahuaParts } from "@/lib/timezone";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") === "month" ? "month" : "week";
  // offset: 0 = periodo actual, -1 = anterior, +1 = siguiente (tope en 0).
  const rawOffset = parseInt(searchParams.get("offset") ?? "0", 10);
  const offset = Number.isFinite(rawOffset) ? Math.min(rawOffset, 0) : 0;

  // Los límites se calculan en el calendario de Chihuahua (UTC-6 fijo) para que
  // una cita nunca caiga en el mes/semana equivocado por el desfase horario.
  const cp = getChihuahuaParts(new Date());

  let start: Date;
  let end: Date;
  let periodLabel: string;

  if (period === "month") {
    // Mes objetivo = mes local actual + offset (Date.UTC normaliza el overflow).
    const target = new Date(Date.UTC(cp.year, cp.month - 1 + offset, 1, 12));
    const ty = target.getUTCFullYear();
    const tm = target.getUTCMonth() + 1; // 1-12
    start = chihuahuaToUTC(ty, tm, 1, 0, 0);
    end = chihuahuaToUTC(ty, tm + 1, 1, 0, 0);
    periodLabel = format(target, "MMMM yyyy", { locale: es });
  } else {
    // Lunes de la semana local actual + offset semanas.
    const daysSinceMonday = (cp.weekday + 6) % 7;
    const monday = new Date(
      Date.UTC(cp.year, cp.month - 1, cp.day - daysSinceMonday + offset * 7, 12)
    );
    const my = monday.getUTCFullYear();
    const mm = monday.getUTCMonth() + 1;
    const md = monday.getUTCDate();
    start = chihuahuaToUTC(my, mm, md, 0, 0);
    end = chihuahuaToUTC(my, mm, md + 7, 0, 0);
    const sunday = new Date(Date.UTC(my, mm - 1, md + 6, 12));
    periodLabel = `${format(monday, "d MMM", { locale: es })} – ${format(sunday, "d MMM", { locale: es })}`;
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      status: "CONFIRMED",
      date: { gte: start, lt: end },
    },
    include: { services: true },
    orderBy: { date: "asc" },
  });

  const entries = appointments.map((app) => {
    const amount =
      app.finalPrice != null
        ? Number(app.finalPrice)
        : app.services.reduce((s, svc) => s + svc.price, 0);

    // Convert UTC stored date to Chihuahua local date string
    const localDate = new Date(app.date.getTime() - CHIHUAHUA_UTC_OFFSET * 3600000);
    const dateStr = `${localDate.getUTCFullYear()}-${String(localDate.getUTCMonth() + 1).padStart(2, "0")}-${String(localDate.getUTCDate()).padStart(2, "0")}`;
    const dateLabel = format(new Date(dateStr + "T12:00:00"), "EEE d MMM", { locale: es });

    return {
      id: app.id,
      date: dateStr,
      dateLabel,
      paymentMethod: app.paymentMethod ?? "PENDING",
      paymentStatus: app.paymentStatus,
      amount,
    };
  });

  const summary = entries.reduce(
    (acc, e) => {
      const key = e.paymentMethod as keyof typeof acc;
      if (key in acc) acc[key] = (acc[key] as number) + e.amount;
      else acc.PENDING = (acc.PENDING ?? 0) + e.amount;
      return acc;
    },
    { CASH: 0, TRANSFER: 0, CARD: 0, PENDING: 0 } as Record<string, number>
  );

  const grandTotal = summary.CASH + summary.TRANSFER + summary.CARD + summary.PENDING;

  return NextResponse.json({ period, offset, periodLabel, entries, summary, grandTotal });
}
