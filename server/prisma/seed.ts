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
        fullName: 'Jakub Kowalski',
        email: 'jakub.kowalski@muni.cz',
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
