import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const existingSubjects = await prisma.subject.count()

  if (existingSubjects === 0) {
    await prisma.subject.createMany({
      data: [
        { name: 'Software Engineering', teacher: 'PROF. ANDERSON', code: 'SE' },
        { name: 'Artificial Intelligence', teacher: 'PROF. MILES', code: 'AI' },
        { name: 'Data Structures', teacher: 'PROF. SMITH', code: 'DS' },
      ],
    })
  }

  const subjects = await prisma.subject.findMany()
  const byCode = new Map(subjects.map((subject) => [subject.code, subject.id]))

  const existingPlannerUsers = await prisma.user.count()
  if (existingPlannerUsers === 0) {
    await prisma.user.createMany({
      data: [
        {
          name: 'User',
          email: 'user@example.com',
          role: 'student',
          institution: 'Masarykova univerzita',
          bio: 'Správce studijního prostoru, který publikuje lekce a řídí přístup.',
        },
        {
          name: 'Registrovaný uživatel',
          email: 'reader@example.com',
          role: 'registered',
          institution: 'Fakulta informatiky',
          bio: 'Sleduje sdílené předměty a ukládá si zajímavé lekce.',
        },
        {
          name: 'Návštěvník',
          email: 'public@example.com',
          role: 'public',
          institution: 'Veřejnost',
          bio: 'Prohlíží si jen veřejně sdílený obsah.',
        },
      ],
    })
  }

  const plannerUser = await prisma.user.findUnique({
    where: { email: 'user@example.com' },
  })

  if (plannerUser) {
    await prisma.subject.updateMany({
      where: { code: 'SE' },
      data: {
        ownerId: plannerUser.id,
        access: 'public',
        description: 'Základní projekt s rolí správce, veřejným náhledem a sdílenými lekcemi.',
        color: 'indigo',
      },
    })

    await prisma.subject.updateMany({
      where: { code: 'AI' },
      data: {
        ownerId: plannerUser.id,
        access: 'registered',
        description: 'Sdílené poznámky, příklady a přednášky pro registrované uživatele.',
        color: 'emerald',
      },
    })

    await prisma.subject.updateMany({
      where: { code: 'DS' },
      data: {
        ownerId: plannerUser.id,
        access: 'public',
        description: 'Veřejná ukázka studijního obsahu s omezeným náhledem.',
        color: 'amber',
      },
    })
  }

  const existingLessons = await prisma.lesson.count()
  if (existingLessons === 0) {
    await prisma.lesson.createMany({
      data: [
        {
          subjectId: byCode.get('SE') ?? null,
          title: 'Role a oprávnění',
          startsAt: new Date('2026-04-03T09:00:00'),
          endsAt: new Date('2026-04-03T10:30:00'),
          room: 'A2.12',
          format: 'lecture',
          shared: true,
          notes: 'Student spravuje sdílení, registrovaní vidí publikovanou část.',
        },
        {
          subjectId: byCode.get('SE') ?? null,
          title: 'Návrh obrazovek',
          startsAt: new Date('2026-04-05T13:00:00'),
          endsAt: new Date('2026-04-05T14:30:00'),
          room: 'Studio 3',
          format: 'seminar',
          shared: true,
          notes: 'Cvičení na redesign hlavních stránek.',
        },
        {
          subjectId: byCode.get('AI') ?? null,
          title: 'Normalizace dat',
          startsAt: new Date('2026-04-04T11:00:00'),
          endsAt: new Date('2026-04-04T12:30:00'),
          room: 'B1.08',
          format: 'lecture',
          shared: true,
          notes: 'Pro registrované uživatele.',
        },
        {
          subjectId: byCode.get('DS') ?? null,
          title: 'Algoritmická soutěž',
          startsAt: new Date('2026-04-06T15:00:00'),
          endsAt: new Date('2026-04-06T16:30:00'),
          room: 'Lab C',
          format: 'lab',
          shared: true,
          notes: 'Veřejně sdílený workshop.',
        },
        {
          subjectId: byCode.get('AI') ?? null,
          title: 'Interní konzultace',
          startsAt: new Date('2026-04-07T10:00:00'),
          endsAt: new Date('2026-04-07T11:00:00'),
          room: 'Privátní kanál',
          format: 'seminar',
          shared: false,
          notes: 'Vidí jen student.',
        },
      ],
    })
  }

  const existingTasks = await prisma.task.count()
  if (existingTasks === 0) {
    await prisma.task.createMany({
      data: [
        { title: 'Dokončit Data Structures essay', done: false, subjectId: byCode.get('DS') },
        { title: 'Přečíst materiály na AI cvičení', done: true, subjectId: byCode.get('AI') },
        { title: 'Nahrát zápisky z přednášky SE', done: false, subjectId: byCode.get('SE') },
        { title: 'Zkontrolovat termíny deadlinů', done: true, subjectId: null },
      ],
    })
  }

  const existingEvents = await prisma.event.count()
  if (existingEvents === 0) {
    await prisma.event.createMany({
      data: [
        {
          title: 'Data Structures Essay Deadline',
          date: new Date('2026-03-18'),
          time: '09:00 AM - 10:30 AM',
          location: 'Science Building, Room 402',
          icon: '🧮',
          accent: 'primary',
          subjectId: byCode.get('DS'),
        },
        {
          title: 'AI Lecture',
          date: new Date('2026-03-19'),
          time: '01:00 PM - 03:00 PM',
          location: 'Main Lab, Block C',
          icon: '🧪',
          accent: 'amber',
          subjectId: byCode.get('AI'),
        },
        {
          title: 'SE Exercise',
          date: new Date('2026-03-20'),
          time: '04:30 PM - 05:30 PM',
          location: 'Student Union Lounge',
          icon: '👥',
          accent: 'emerald',
          subjectId: byCode.get('SE'),
        },
      ],
    })
  }

  const existingFiles = await prisma.fileRecord.count()
  if (existingFiles === 0) {
    await prisma.fileRecord.createMany({
      data: [
        {
          name: 'Assignment_v1.pdf',
          size: '2.4 MB',
          addedLabel: 'Added 2h ago',
          category: 'pdf',
          shared: true,
          subjectId: byCode.get('SE'),
        },
        {
          name: 'Project_Proposal.docx',
          size: '1.1 MB',
          addedLabel: 'Added yesterday',
          category: 'document',
          shared: false,
          subjectId: byCode.get('AI'),
        },
      ],
    })
  }

  const existingProfile = await prisma.profile.count()
  if (existingProfile === 0) {
    await prisma.profile.create({
      data: {
        fullName: 'User',
        email: 'user@example.com',
        school: 'Masarykova univerzita',
        studyMajor: 'Informatika',
        studyYear: '3. ročník',
        studyType: 'Bakalářské studium',
      },
    })
  }

  const firstNames = ['Anna', 'Jakub', 'Tereza', 'Martin', 'Eliška', 'David', 'Barbora', 'Tomáš', 'Klára', 'Filip']
  const lastNames = ['Novák', 'Svoboda', 'Dvořák', 'Černý', 'Procházka', 'Kučera', 'Veselý', 'Horák', 'Němec', 'Pokorný']
  const majors = ['Informatika', 'Umělá inteligence', 'Datová analytika', 'Softwarové inženýrství']
  const years = ['1. ročník', '2. ročník', '3. ročník']

  const generatedUsers = Array.from({ length: 10 }, (_, index) => {
    const firstName = firstNames[index % firstNames.length]
    const lastName = lastNames[index % lastNames.length]

    return {
      fullName: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}${index + 1}@muni.cz`,
      school: 'Masarykova univerzita',
      studyMajor: majors[index % majors.length],
      studyYear: years[index % years.length],
    }
  })

  await prisma.user.createMany({
    data: generatedUsers,
    skipDuplicates: true,
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
