/** 地址相对前端 API baseURL；通过鉴权请求读取，不暴露磁盘路径。 */
export const createAvatarUrl = (fileId: string | null): string | null =>
  fileId ? `/files/preview?fileId=${encodeURIComponent(fileId)}` : null
