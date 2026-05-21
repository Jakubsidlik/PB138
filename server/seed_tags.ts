import { db } from './src/db/client.js'
import { tags } from './src/db/schema.js'

async function seed() {
  const systemTags = [
    { name: 'Jednoduchý', color: 'emerald', isSystem: true },
    { name: 'Náročný', color: 'rose', isSystem: true },
    { name: 'Absolvovaný', color: 'blue', isSystem: true }
  ]

  console.log('Seeding system tags...')
  for (const tag of systemTags) {
    const existing = await db.query.tags.findFirst({
      where: (tags, { and, eq }) => and(eq(tags.name, tag.name), eq(tags.isSystem, true))
    })
    if (!existing) {
      await db.insert(tags).values(tag)
    }
  }
  console.log('System tags seeded successfully!')
  process.exit(0)
}

seed().catch(console.error)
