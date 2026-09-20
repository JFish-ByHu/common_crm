const apiDateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23'
})

export const dateToTimestamp = (value: Date): bigint => BigInt(value.getTime())

export const timestampToDate = (value: bigint): Date => new Date(Number(value))

export const currentTimestamp = (): bigint => BigInt(Date.now())

/** 将毫秒时间戳格式化为中国标准时间的 yyyy-MM-dd HH:mm:ss。 */
export const formatApiDateTime = (value: bigint): string => {
  const parts = apiDateTimeFormatter.formatToParts(timestampToDate(value))
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(item => item.type === type)?.value ?? ''

  return `${part('year')}-${part('month')}-${part('day')} ${part('hour')}:${part('minute')}:${part('second')}`
}
