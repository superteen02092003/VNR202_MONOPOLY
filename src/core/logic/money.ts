/** Định dạng số dư và giao dịch theo đơn vị K. */

const VI = new Intl.NumberFormat('vi-VN')

/** 1500 → "1.500 K" — dùng cho bảng điều khiển Host và nhật ký. */
export function formatMoney(amount: number): string {
  return `${VI.format(Math.round(amount))} K`
}

/** Dùng cho các nhãn lớn, dễ đọc từ xa. */
export function formatMoneyLong(amount: number): string {
  return `${VI.format(Math.round(amount))} K`
}

/** Thêm dấu +/- phía trước, dùng cho hiệu ứng "tiền bay" ở Giai đoạn 3. */
export function formatDelta(amount: number): string {
  const sign = amount >= 0 ? '+' : '-'
  return `${sign}${formatMoney(Math.abs(amount))}`
}

/** Làm tròn về số nguyên dương gần nhất — mọi khoản tiền trong game đều là số nguyên. */
export function normalizeAmount(amount: number): number {
  return Math.max(0, Math.round(amount))
}
