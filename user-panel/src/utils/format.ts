import dayjs from 'dayjs'

// Display helpers shared across the panel.

/** Human date/time, e.g. "29 Jun 26, 06:30 PM". */
export const formatDateTime = (d: string | number | Date): string =>
  dayjs(d).format('DD MMM YY, hh:mm A')

/** Date only, e.g. "29 Jun 26". */
export const formatDate = (d: string | number | Date): string => dayjs(d).format('DD MMM YY')

/** API date param, e.g. "2026-06-29". */
export const apiDate = (d: string | number | Date): string => dayjs(d).format('YYYY-MM-DD')

/** API date param for N days ago (dayjs replacement for moment().subtract(n,'days')). */
export const daysAgoApi = (n: number): string => dayjs().subtract(n, 'day').format('YYYY-MM-DD')

/** Today as an API date param. */
export const todayApi = (): string => dayjs().format('YYYY-MM-DD')

/** Angular `date:'medium'` ≈ "Jun 29, 2026, 6:30:00 PM". */
export const formatMedium = (d: string | number | Date): string => dayjs(d).format('MMM D, YYYY, h:mm:ss A')

/** Angular `date:'EEE, dd MMM yy'` ≈ "Mon, 29 Jun 26". */
export const formatDayDate = (d: string | number | Date): string => dayjs(d).format('ddd, DD MMM YY')

/** Money with two decimals; null/undefined become 0.00. */
export const formatAmount = (n: number | null | undefined): string => Number(n ?? 0).toFixed(2)
