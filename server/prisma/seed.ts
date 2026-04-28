import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const dateOnly = (value: string) => new Date(`${value}T00:00:00.000Z`)

async function main() {
  const existingAdminUsers = await prisma.user.count({
    where: { role: 'ADMIN' }
  })
  if (existingAdminUsers > 0) {
    return
  }

  // Create admin user for administrative purposes
  await prisma.user.create({
    data: {
      fullName: 'Admin',
      email: 'admin@lonelystudent.local',
      passwordHash: 'admin-password',
      role: 'ADMIN',
      school: 'Masarykova univerzita',
      faculty: 'FI',
      studyMajor: 'Sprava systemu',
      studyYear: 'N/A',
      studyType: 'Administrace',
      avatarDataUrl: null,
    },
  })
}

main()
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
