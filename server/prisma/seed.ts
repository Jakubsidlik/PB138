import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const dateOnly = (value: string) => new Date(`${value}T00:00:00.000Z`)

async function main() {
  const existingUsers = await prisma.user.count()
  if (existingUsers > 0) {
    return
  }

  const user = await prisma.user.create({
    data: {
      fullName: 'Jakub Kowalski',
      email: 'jakub.kowalski@muni.cz',
      passwordHash: 'demo-password',
      role: 'REGISTERED',
      school: 'Masarykova univerzita',
      faculty: 'FI',
      studyMajor: 'Informatika',
      studyYear: '3. rocnik',
      studyType: 'Bakalarske studium',
      birthDate: dateOnly('2002-09-14'),
      bio: 'Student softwaroveho inzenyrstvi.',
      avatarDataUrl: null,
    },
  })

  const adminUser = await prisma.user.create({
    data: {
      fullName: 'Admin LonelyStudent',
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

  const mainPlan = await prisma.studyPlan.create({
    data: {
      userId: user.id,
      name: 'LS 2026',
      description: 'Hlavni semestralni plan',
      faculty: 'FI',
      startDate: dateOnly('2026-02-16'),
      endDate: dateOnly('2026-06-30'),
      isActive: true,
      isShared: true,
    },
  })

  const archivedPlan = await prisma.studyPlan.create({
    data: {
      userId: user.id,
      name: 'ZS 2025',
      description: 'Archivovany plan',
      faculty: 'FI',
      startDate: dateOnly('2025-09-15'),
      endDate: dateOnly('2026-01-20'),
      isActive: false,
      isShared: false,
    },
  })

  await prisma.studyPlanCollaborator.create({
    data: {
      studyPlanId: mainPlan.id,
      userId: adminUser.id,
      role: 'CONTRIBUTOR',
    },
  })

  const seSubject = await prisma.subject.create({
    data: {
      userId: user.id,
      studyPlanId: mainPlan.id,
      name: 'Software Engineering',
      teacher: 'PROF. ANDERSON',
      code: 'PB138',
      isShared: true,
    },
  })

  const aiSubject = await prisma.subject.create({
    data: {
      userId: user.id,
      studyPlanId: mainPlan.id,
      name: 'Artificial Intelligence',
      teacher: 'PROF. MILES',
      code: 'PA165',
      isShared: true,
    },
  })

  await prisma.subject.create({
    data: {
      userId: user.id,
      studyPlanId: archivedPlan.id,
      name: 'Data Structures',
      teacher: 'PROF. SMITH',
      code: 'IB002',
      isShared: false,
    },
  })

  await prisma.task.create({
    data: {
      userId: user.id,
      subjectId: seSubject.id,
      studyPlanId: mainPlan.id,
      title: 'Dokoncit semestralni navrh',
      done: false,
      favorite: true,
      tag: 'deadline',
      deadline: new Date('2026-05-02T18:00:00.000Z'),
    },
  })

  await prisma.task.create({
    data: {
      userId: user.id,
      subjectId: aiSubject.id,
      studyPlanId: mainPlan.id,
      title: 'Precist materialy na cviceni',
      done: false,
      favorite: false,
      tag: 'priprava',
      deadline: new Date('2026-04-20T16:00:00.000Z'),
    },
  })

  await prisma.task.create({
    data: {
      userId: user.id,
      subjectId: seSubject.id,
      studyPlanId: mainPlan.id,
      title: 'Nahrat zapis z prednasky',
      done: true,
      favorite: false,
      tag: 'hotovo',
      deadline: new Date('2026-03-20T20:00:00.000Z'),
    },
  })

  const lecture1 = await prisma.lesson.create({
    data: {
      subjectId: seSubject.id,
      studyPlanId: mainPlan.id,
      title: 'Use case a domenovy model',
      content: 'Projit use case diagram a namodelovat ERD.',
      isShared: true,
      orderIndex: 1,
    },
  })

  await prisma.lesson.create({
    data: {
      subjectId: aiSubject.id,
      studyPlanId: mainPlan.id,
      title: 'Heuristiky a vyhledavani',
      content: 'A* a greedy best-first search.',
      isShared: true,
      orderIndex: 2,
    },
  })

  await prisma.lessonNote.createMany({
    data: [
      {
        lessonId: lecture1.id,
        userId: user.id,
        note: 'Pozor na kardinality 1:N u Subject -> Task.',
        isPinned: true,
      },
      {
        lessonId: lecture1.id,
        userId: user.id,
        note: 'Dopsat priklady pro soft delete.',
        isPinned: false,
      },
    ],
  })

  const file1 = await prisma.fileRecord.create({
    data: {
      userId: user.id,
      subjectId: seSubject.id,
      lessonId: lecture1.id,
      name: 'Lecture_05_Software_Design.pdf',
      size: 2516582,
      addedLabel: 'Added 2h ago',
      isShared: true,
    },
  })

  await prisma.fileRecord.create({
    data: {
      userId: user.id,
      subjectId: aiSubject.id,
      lessonId: null,
      name: 'Neural_Networks_Notes.docx',
      size: 798720,
      addedLabel: 'Added yesterday',
      isShared: false,
    },
  })

  await prisma.fileComment.create({
    data: {
      fileId: file1.id,
      userId: user.id,
      comment: 'Doplnit shrnuti kapitoly 5 a odkazy na cviceni.',
    },
  })

  await prisma.event.createMany({
    data: [
      {
        userId: user.id,
        subjectId: seSubject.id,
        title: 'PB138 Prednaska',
        date: new Date('2026-04-16T09:00:00.000Z'),
        time: '09:00 - 10:30',
        location: 'Ucebna B-12',
        isShared: true,
        recurrence: 'WEEKLY',
        recurrenceGroupId: 'seed-pb138-weekly',
      },
      {
        userId: user.id,
        subjectId: aiSubject.id,
        title: 'PA165 Cviceni',
        date: new Date('2026-04-17T11:00:00.000Z'),
        time: '11:00 - 12:30',
        location: 'Lab 402',
        isShared: true,
        recurrence: 'NONE',
      },
      {
        userId: user.id,
        subjectId: null,
        title: 'Konzultace semestralniho projektu',
        date: new Date('2026-04-18T15:30:00.000Z'),
        time: '15:30 - 16:00',
        location: 'Online',
        isShared: false,
        recurrence: 'NONE',
      },
    ],
  })

  await prisma.fileRecord.create({
    data: {
      userId: adminUser.id,
      subjectId: null,
      lessonId: null,
      name: 'Public_Study_Tips.txt',
      size: 12000,
      addedLabel: 'Added this week',
      isShared: true,
    },
  })

  await prisma.textAnnotation.create({
    data: {
      targetType: 'LESSON',
      targetId: lecture1.id,
      userId: user.id,
      startOffset: 0,
      endOffset: 32,
      selectedText: 'Projit use case diagram a namodelovat',
      comment: 'Tady doplnit konkretni priklad k ERD.',
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
