import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const phone = searchParams.get("phone");

  // ── Modo búsqueda: nombre o teléfono → lista de clientas distintas ──────────
  // No existe un modelo Client; las clientas se derivan de las citas. Agrupamos
  // por teléfono (identificador estable) o, sin teléfono, por nombre normalizado.
  if (q !== null) {
    const term = q.trim();
    if (term.length < 2) {
      return NextResponse.json({ clients: [] });
    }

    const digits = term.replace(/\D/g, "");
    const or: Prisma.AppointmentWhereInput[] = [
      { clientName: { contains: term, mode: "insensitive" } },
    ];
    // Solo tratamos el término como teléfono si tiene al menos 3 dígitos.
    if (digits.length >= 3) {
      or.push({ clientPhone: { contains: digits } });
    }

    const matches = await prisma.appointment.findMany({
      where: { OR: or },
      select: { clientName: true, clientPhone: true, date: true },
      orderBy: { date: "desc" },
      take: 200,
    });

    type Client = { name: string; phone: string | null; visits: number; lastVisit: Date };
    const byClient = new Map<string, Client>();

    for (const m of matches) {
      const phoneDigits = m.clientPhone?.replace(/\D/g, "") ?? "";
      const key = phoneDigits
        ? `p:${phoneDigits}`
        : `n:${m.clientName.trim().toLowerCase()}`;

      const existing = byClient.get(key);
      if (existing) {
        existing.visits += 1;
        if (m.date > existing.lastVisit) existing.lastVisit = m.date;
      } else {
        // Como venimos ordenados por fecha desc, el primer nombre visto es la
        // grafía más reciente del cliente.
        byClient.set(key, {
          name: m.clientName,
          phone: m.clientPhone,
          visits: 1,
          lastVisit: m.date,
        });
      }
    }

    const clients = [...byClient.values()]
      .sort((a, b) => b.lastVisit.getTime() - a.lastVisit.getTime())
      .slice(0, 8);

    return NextResponse.json({ clients });
  }

  // ── Modo historial: teléfono exacto → últimas citas + total ─────────────────
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
