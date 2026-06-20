import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { addDays, startOfDay, endOfDay } from "date-fns";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const tomorrow = addDays(new Date(), 1);

  const reminders = await prisma.reminder.findMany({
    where: {
      scheduledFor: {
        gte: startOfDay(tomorrow),
        lte: endOfDay(tomorrow),
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(reminders);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { id } = await req.json();
    if (typeof id !== "string" || !/^[a-f\d]{24}$/i.test(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const updated = await prisma.reminder.update({
      where: { id },
      data: { sent: true },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}