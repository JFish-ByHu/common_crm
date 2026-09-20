'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const dotenv_1 = require('dotenv')
const config_1 = require('prisma/config')
;(0, dotenv_1.config)({ path: ['.env.development', '.env'], quiet: true })
exports.default = (0, config_1.defineConfig)({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations'
  }
})
//# sourceMappingURL=prisma.config.js.map
