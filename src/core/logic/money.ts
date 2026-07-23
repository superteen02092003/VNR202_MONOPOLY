/**
 * Định dạng tiền tệ. Mọi con số trong game tính theo đơn vị TRIỆU VNĐ,
 * nên 1500 nghĩa là 1.500 triệu = 1,5 tỷ đồng.
 */

const VI = new Intl.NumberFormat('vi-VN')

/** 1500 → "1.500 tr" — dùng cho bảng điều khiển Host và nhật ký. */
export function formatMoney(amount: number): string {
  return `${VI.format(Math.round(amount))} tr`
}

/** 1500 → "1,5 tỷ" / 320 → "320 triệu" — dùng cho các nhãn lớn, dễ đọc từ xa. */
export function formatMoneyLong(amount: number): string {
  const rounded = Math.round(amount)
  if (Math.abs(rounded) >= 1000) {
    const billions = rounded / 1000
    const text = Number.isInteger(billions) ? String(billions) : billions.toFixed(1)
    return `${text.replace('.', ',')} tỷ`
  }
  return `${VI.format(rounded)} triệu`
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
