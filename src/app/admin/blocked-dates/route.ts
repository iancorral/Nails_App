import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const blockedDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().max(100).optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const dates = await prisma.blockedDate.findMany({
    where: { date: { gte: new Date() } },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(dates);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const validation = blockedDateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const [y, m, d] = validation.data.date.split("-").map(Number);
    const date = new Date(y, m - 1, d, 12, 0, 0);

    const blocked = await prisma.blockedDate.create({
      data: { date, reason: validation.data.reason },
    });
    return NextResponse.json(blocked, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { id } = await req.json();
    if (!id || !/^[a-f\d]{24}$/i.test(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }
    await prisma.blockedDate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}