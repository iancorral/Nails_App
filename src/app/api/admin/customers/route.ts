import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { maskPhone } from "@/lib/phone";
import type { Prisma } from "@prisma/client";

/**
 * The studio has tens of clients, not thousands, so the list is returned whole
 * and ranked in memory. Add pagination when this cap starts truncating.
 */
const MAX_CUSTOMERS = 300;

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const term = (new URL(req.url).searchParams.get("q") ?? "").trim();

  const where: Prisma.CustomerWhereInput = {};
  if (term.length >= 2) {
    const digits = term.replace(/\D/g, "");
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      ...(digits.length >= 3 ? [{ phone: { contains: digits } }] : []),
    ];
  }

  const customers = await prisma.customer.findMany({
    where,
    take: MAX_CUSTOMERS,
    select: { id: true, name: true, phone: true, createdAt: true },
  });

  if (customers.length === 0) {
    return NextResponse.json({ customers: [] });
  }

  // Visits and last appointment come from the agenda itself rather than a stored
  // counter, so they can never disagree with what the calendar shows.
  const stats = await prisma.appointment.groupBy({
    by: ["customerId"],
    where: {
      customerId: { in: customers.map((c) => c.id) },
      status: { not: "CANCELLED" },
    },
    _count: { _all: true },
    _max: { date: true },
  });

  const statsByCustomer = new Map(stats.map((s) => [s.customerId, s]));

  const enriched = customers
    .map((customer) => {
      const stat = statsByCustomer.get(customer.id);
      return {
        id: customer.id,
        name: customer.name,
        // The full number never leaves the server for the list view.
        maskedPhone: maskPhone(customer.phone),
        visits: stat?._count._all ?? 0,
        lastVisit: stat?._max.date ?? null,
        createdAt: customer.createdAt,
      };
    })
    .sort((a, b) => {
      // Most recently seen first; clients with no appointments yet sink to the
      // bottom, ordered by when they were added.
      if (a.lastVisit && b.lastVisit) return b.lastVisit.getTime() - a.lastVisit.getTime();
      if (a.lastVisit) return -1;
      if (b.lastVisit) return 1;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

  return NextResponse.json({ customers: enriched });
}
