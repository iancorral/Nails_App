import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from "date-fns";
import { es } from "date-fns/locale";
import { CHIHUAHUA_UTC_OFFSET } from "@/lib/timezone";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "week";

  const now = new Date();
  const start = period === "week" ? startOfWeek(now, { weekStartsOn: 1 }) : startOfMonth(now);
  const end = period === "week" ? endOfWeek(now, { weekStartsOn: 1 }) : endOfMonth(now);

  const appointments = await prisma.appointment.findMany({
    where: {
      status: "CONFIRMED",
      date: { gte: start, lte: end },
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

  const periodLabel =
    period === "week"
      ? `${format(start, "d MMM", { locale: es })} – ${format(end, "d MMM", { locale: es })}`
      : format(now, "MMMM yyyy", { locale: es });

  return NextResponse.json({ period, periodLabel, entries, summary, grandTotal });
}
