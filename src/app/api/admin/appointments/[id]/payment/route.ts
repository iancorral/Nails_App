import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const paymentSchema = z.object({
  paymentStatus: z.enum(["PENDING", "PARTIAL", "PAID"]).optional(),
  paymentMethod: z.enum(["CASH", "CARD", "TRANSFER"]).optional(),
  finalPrice: z.number().min(0).optional().nullable(),
  depositPaid: z.boolean().optional(),
  depositAmount: z.number().min(0).optional().nullable(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  if (!id || !/^[a-f\d]{24}$/i.test(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const validation = paymentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: validation.data,
      include: { services: true },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}