import { registerAs } from '@nestjs/config'
import { resolve } from 'node:path'

/** 开发时位于 src/config，标准 Nest 构建后位于 dist/config，均定位到后端根目录。 */
const backendRoot = resolve(__dirname, '../..')

export const storageConfig = registerAs('storage', () => ({
  uploadDirectory: resolve(backendRoot, process.env.UPLOAD_DIR?.trim() || 'storage/uploads')
}))
