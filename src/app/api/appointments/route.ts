import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const appointments = await prisma.appointment.findMany({
      orderBy: { date: "desc" },
      include: { services: true },
    });
    return NextResponse.json(appointments);
  } catch {

    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}