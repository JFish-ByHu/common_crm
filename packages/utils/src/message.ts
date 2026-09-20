import { ElMessage, type MessageHandler, type MessageOptionsWithType } from 'element-plus'

type MessageInput = MessageOptionsWithType | string | undefined
type MessageType = 'primary' | 'success' | 'warning' | 'info' | 'error'

const openMessage = (type: MessageType, input?: MessageInput): MessageHandler => {
  const options: MessageOptionsWithType =
    typeof input === 'string' || input === undefined ? { message: input } : input

  return ElMessage({
    ...options,
    type,
    plain: true,
    showClose: true,
    grouping: true
  })
}

export const Message = {
  primary: (input?: MessageInput) => openMessage('primary', input),
  success: (input?: MessageInput) => openMessage('success', input),
  warning: (input?: MessageInput) => openMessage('warning', input),
  info: (input?: MessageInput) => openMessage('info', input),
  error: (input?: MessageInput) => openMessage('error', input),
  closeAll: ElMessage.closeAll,
  closeAllByPlacement: ElMessage.closeAllByPlacement
}

export type { MessageInput, MessageType }
