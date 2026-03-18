// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seeding...') 

  // Clean existing data / Limpiar datos
  await prisma.appointment.deleteMany()
  await prisma.service.deleteMany()
  await prisma.workSchedule.deleteMany()

  // Create Services / Crear Servicios
  await prisma.service.createMany({
    data: [
      { name: 'Manicure Gelish', duration: 60, price: 350.00 },
      { name: 'Acrílicas Esculturales', duration: 120, price: 650.00 },
      { name: 'Retiro de uñas', duration: 30, price: 100.00 },
      { name: 'Pedicure Spa', duration: 90, price: 450.00 }
    ]
  })

  // Create Schedule (Mon-Fri 10am-7pm) / Horario L-V
  const workDays = []
  for (let i = 1; i <= 5; i++) {
    workDays.push({ dayOfWeek: i, startTime: '10:00', endTime: '19:00', isDayOff: false })
  }
  await prisma.workSchedule.createMany({ data: workDays })

  console.log('✅ Seeding finished.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })