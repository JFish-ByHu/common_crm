import { FileErrors } from '@common-crm/errors'
import { Injectable } from '@nestjs/common'
import { readFile } from 'node:fs/promises'
import { extname } from 'node:path'
import type { FileCategory } from '@common-crm/types/api'
import { filePolicies } from '../types'
import { rejectFileUpload } from '../files.error'

@Injectable()
export class FileValidationService {
  async validateFile(file: Express.Multer.File, category: FileCategory) {
    const policy = filePolicies[category]
    if (!policy) return rejectFileUpload(FileErrors.INVALID_CATEGORY)
    if (!file.size) rejectFileUpload(FileErrors.EMPTY_FILE)
    if (file.size > policy.maxBytes) {
      rejectFileUpload(FileErrors.FILE_TOO_LARGE, { maxSizeMB: policy.maxBytes / 1024 / 1024 })
    }
    const originalName = this.normalizeOriginalName(file.originalname)
    const extension = extname(originalName).slice(1).toLowerCase()
    if (!policy.extensions.includes(extension)) {
      rejectFileUpload(FileErrors.UNSUPPORTED_EXTENSION, { extensions: policy.extensions })
    }
    // 动态加载 ESM 包；不信任浏览器提供的 MIME 或文件名后缀。
    const { fileTypeFromFile } = await import('file-type')
    let detected: Awaited<ReturnType<typeof fileTypeFromFile>>
    try {
      detected = await fileTypeFromFile(file.path)
    } catch {
      return rejectFileUpload(FileErrors.UNRECOGNIZED_CONTENT)
    }
    if (extension === 'txt' || extension === 'csv') {
      if (detected) rejectFileUpload(FileErrors.NOT_TEXT)
      const content = await readFile(file.path)
      let text: string
      try {
        text = new TextDecoder('utf-8', { fatal: true }).decode(content)
      } catch {
        return rejectFileUpload(FileErrors.INVALID_TEXT_ENCODING)
      }
      for (const char of text) {
        const code = char.charCodeAt(0)
        if (code < 32 && ![9, 10, 13].includes(code))
          rejectFileUpload(FileErrors.INVALID_TEXT_CONTROL)
      }
      return { originalName, extension, mimeType: extension === 'csv' ? 'text/csv' : 'text/plain' }
    }
    const expected = extension === 'jpeg' ? 'jpg' : extension
    if (!detected || detected.ext !== expected) {
      return rejectFileUpload(FileErrors.TYPE_MISMATCH)
    }
    return { originalName, extension: expected, mimeType: detected.mime }
  }

  private normalizeOriginalName(name: string): string {
    const decoded = name.normalize('NFC').trim()
    if (
      !decoded ||
      decoded.length > 255 ||
      /[\\/\ufffd]/u.test(decoded) ||
      [...decoded].some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)
    ) {
      rejectFileUpload(FileErrors.INVALID_FILENAME)
    }
    return decoded
  }
}
