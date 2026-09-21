/** null 表示 Redis 不可用，不能确定是否在线。 */
export type OnlineStatus = 0 | 1 | null

export interface UserOnlineStatus {
  userId: string
  onlineStatus: OnlineStatus
}
