import { config } from 'dotenv'
import { defineConfig } from 'prisma/config'

config({ path: ['.env.development', '.env'], quiet: true })

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations'
  }
})
