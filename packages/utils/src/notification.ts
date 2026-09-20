import {
  ElNotification,
  type NotificationHandle,
  type NotificationOptionsTyped
} from 'element-plus'

type NotificationInput = NotificationOptionsTyped | string | undefined
type NotificationType = 'primary' | 'success' | 'warning' | 'info' | 'error'

const openNotification = (
  type: NotificationType,
  input?: NotificationInput
): NotificationHandle => {
  const options: NotificationOptionsTyped =
    typeof input === 'string' || input === undefined ? { message: input } : input

  return ElNotification({
    ...options,
    type,
    showClose: true
  })
}

export const Notification = {
  primary: (input?: NotificationInput) => openNotification('primary', input),
  success: (input?: NotificationInput) => openNotification('success', input),
  warning: (input?: NotificationInput) => openNotification('warning', input),
  info: (input?: NotificationInput) => openNotification('info', input),
  error: (input?: NotificationInput) => openNotification('error', input),
  closeAll: ElNotification.closeAll,
  updateOffsets: ElNotification.updateOffsets
}

export type { NotificationInput, NotificationType }
