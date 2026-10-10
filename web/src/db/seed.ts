import 'dotenv/config'
import { db } from '../db'

async function main() {
  console.log('🌱 Seeding database...')
  // Add seed logic here
  console.log('✅ Done')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
