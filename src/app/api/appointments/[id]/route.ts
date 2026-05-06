import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum(["CONFIRMED", "CANCELLED"]),
});

export async function PATCH(
  request: Request,
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
    const body = await request.json();
    const validation = patchSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: { status: validation.data.status },
    });

    return NextResponse.json(updatedAppointment);
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}