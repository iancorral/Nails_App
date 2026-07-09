import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "week";

  const now = new Date();
  const start = period === "week" ? startOfWeek(now, { weekStartsOn: 1 }) : startOfMonth(now);
  const end = period === "week" ? endOfWeek(now, { weekStartsOn: 1 }) : endOfMonth(now);

  const appointments = await prisma.appointment.findMany({
    where: { date: { gte: start, lte: end } },
    include: { services: true },
  });

  const confirmed = appointments.filter((a) => a.status === "CONFIRMED");
  const cancelled = appointments.filter((a) => a.status === "CANCELLED");

  const revenue = confirmed.reduce((acc, app) => {
    const price =
      app.finalPrice != null
        ? Number(app.finalPrice)
        : app.services.reduce((s, svc) => s + svc.price, 0);
    return acc + price;
  }, 0);

  const serviceCount: Record<string, { name: string; count: number }> = {};
  confirmed.forEach((app) => {
    app.services.forEach((svc) => {
      if (!serviceCount[svc.id]) serviceCount[svc.id] = { name: svc.name, count: 0 };
      serviceCount[svc.id].count++;
    });
  });

  const topService = Object.values(serviceCount).sort((a, b) => b.count - a.count)[0] ?? null;

  const avgDuration =
    confirmed.length > 0
      ? Math.round(
          confirmed.reduce((acc, app) => {
            return acc + app.services.reduce((s, svc) => s + svc.duration, 0);
          }, 0) / confirmed.length
        )
      : 0;

  return NextResponse.json({
    period,
    totalConfirmed: confirmed.length,
    totalCancelled: cancelled.length,
    revenue,
    topService,
    avgDuration,
    cancellationRate:
      appointments.length > 0
        ? Math.round((cancelled.length / appointments.length) * 100)
        : 0,
  });
}