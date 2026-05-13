import { subjectsService } from '../modules/subjects/subjects.services.js'

async function main() {
  console.log('Import úspěšný! subjectsService je k dispozici.')
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
