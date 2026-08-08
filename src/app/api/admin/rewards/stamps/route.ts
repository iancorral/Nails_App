import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UNSPENT_STAMP } from "@/lib/rewards";
import { getRewardProgram, getStampBalance } from "@/lib/rewards.server";
import { z } from "zod";

const stampSchema = z.object({
  customerId: z.string().regex(/^[a-f\d]{24}$/i, "ID inválido"),
  action: z.enum(["ADD", "REMOVE"]),
  note: z.string().max(200).optional(),
});

/**
 * Owner-driven stamp adjustment. Earned stamps arrive through the checkout flow
 * in phase 3; this is the manual correction path — rewarding a long-standing
 * client at launch, or undoing a mistake.
 *
 * ADD appends to the ledger. REMOVE deletes the newest unspent stamp rather than
 * marking it, because a correction is not history worth keeping and a second
 * nullable state would double the number of ways a balance query can go quietly
 * wrong. Spent stamps are never touched: a reward already handed over stays in
 * the record.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const validation = stampSchema.safeParse(await req.json());
    if (!validation.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const { customerId, action, note } = validation.data;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true },
    });
    if (!customer) {
      return NextResponse.json({ error: "Clienta no encontrada" }, { status: 404 });
    }

    if (action === "ADD") {
      await prisma.stamp.create({
        data: {
          customerId,
          dedupeKey: `manual:${randomUUID()}`,
          source: "MANUAL",
          // Written explicitly so the field is present, not absent. See
          // UNSPENT_STAMP in lib/rewards.ts for why that matters on MongoDB.
          redemptionId: null,
          note: note?.trim() || null,
          createdBy: session.user?.email ?? "admin",
        },
      });
    } else {
      const newest = await prisma.stamp.findFirst({
        where: { customerId, ...UNSPENT_STAMP },
        orderBy: { earnedAt: "desc" },
        select: { id: true },
      });

      if (!newest) {
        return NextResponse.json(
          { error: "No hay sellos disponibles para quitar" },
          { status: 409 }
        );
      }

      // Guarded by the same filter so a stamp redeemed a moment ago cannot be
      // deleted out from under the redemption that spent it.
      const deleted = await prisma.stamp.deleteMany({
        where: { id: newest.id, ...UNSPENT_STAMP },
      });
      if (deleted.count === 0) {
        return NextResponse.json({ error: "Intenta de nuevo" }, { status: 409 });
      }
    }

    const [stamps, program] = await Promise.all([
      getStampBalance(customerId),
      getRewardProgram(),
    ]);

    return NextResponse.json({ stamps, ready: stamps >= program.stampsRequired });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
