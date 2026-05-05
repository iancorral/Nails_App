import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; 

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      where: {
        isActive: true
      }
    });

    return NextResponse.json(services, { status: 200 });
    
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" }, 
      { status: 500 }
    );
  }
}