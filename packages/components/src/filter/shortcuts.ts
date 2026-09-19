/** 每次点击时计算时间，避免长时间打开页面后快捷范围过期。 */
export const dateTimeRangeShortcuts = [
  {
    text: '今天',
    value: (): [Date, Date] => {
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      return [start, new Date()]
    }
  },
  ...[7, 30].map(days => ({
    text: `最近 ${days} 天`,
    value: (): [Date, Date] => {
      const end = new Date()
      const start = new Date(end)
      start.setDate(start.getDate() - days)
      return [start, end]
    }
  }))
]
