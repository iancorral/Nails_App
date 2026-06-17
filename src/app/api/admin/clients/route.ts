import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone");

  if (!phone || phone.replace(/\D/g, "").length < 7) {
    return NextResponse.json({ appointments: [], total: 0 });
  }

  const digits = phone.replace(/\D/g, "");

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where: { clientPhone: { contains: digits } },
      include: { services: true },
      orderBy: { date: "desc" },
      take: 3,  
    }),
    prisma.appointment.count({
      where: { clientPhone: { contains: digits } },
    }),
  ]);

  return NextResponse.json({ appointments, total });
}