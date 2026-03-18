import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json(); 

    // Aquí usamos params.id que viene de la carpeta [id]
    const updatedAppointment = await prisma.appointment.update({
      where: { id: params.id },
      data: { status },
    });

    return NextResponse.json(updatedAppointment);
  } catch (error) {
    console.error("Error actualizando cita:", error);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}