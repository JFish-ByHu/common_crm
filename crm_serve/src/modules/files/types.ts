import type { FileCategory } from '@common-crm/types/api'

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024
export const filePolicies: Record<FileCategory, { maxBytes: number; extensions: string[] }> = {
  avatar: { maxBytes: 5 * 1024 * 1024, extensions: ['jpg', 'jpeg', 'png', 'webp'] },
  image: { maxBytes: 10 * 1024 * 1024, extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] },
  file: { maxBytes: MAX_UPLOAD_BYTES, extensions: ['pdf', 'docx', 'xlsx', 'pptx', 'txt', 'csv'] }
}

export interface StoredUpload {
  fileId: string
  category: FileCategory
  originalName: string
  storageKey: string
  mimeType: string
  extension: string
  size: number
  uploadedBy: string
}
