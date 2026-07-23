import type { CardDefinition, CardEffect } from '../types'

/**
 * Bộ Thẻ Cơ hội. Nhóm trả lời đúng câu hỏi VNR202 sẽ được bốc 1 lá,
 * cất trong túi đồ (tối đa GAME_CONFIG.MAX_CARDS lá) và yêu cầu Host kích hoạt sau.
 */
export const CARD_DEFINITIONS: CardDefinition[] = [
  {
    effect: 'choose-dice',
    name: 'Chỉ Đạo Chiến Lược',
    description: 'Chốt trước tổng điểm 2 viên xúc xắc (từ 2 đến 12) cho lượt di chuyển này.',
    targetKind: 'dice',
    weight: 3,
    playableBeforeRoll: true,
    playableInAction: false,
  },
  {
    effect: 'demolish',
    name: 'Giải Tỏa Mặt Bằng',
    description: 'Hạ 1 cấp công trình của đối thủ. Không tác động được lên Biểu tượng Địa phương.',
    targetKind: 'opponent-tile',
    weight: 2,
    playableBeforeRoll: true,
    playableInAction: true,
  },
  {
    effect: 'free-stay',
    name: 'Giấy Miễn Phí Tham Quan',
    description: 'Miễn toàn bộ tiền tham quan / lưu trú phải trả trong lượt này.',
    targetKind: 'none',
    weight: 4,
    playableBeforeRoll: true,
    playableInAction: true,
  },
  {
    effect: 'escape-jail',
    name: 'Vé Thông Hành',
    description: 'Thoát ngay khỏi ô Kẹt xe – Cách ly mà không mất phí giải tỏa.',
    targetKind: 'none',
    weight: 3,
    playableBeforeRoll: true,
    playableInAction: true,
  },
  {
    effect: 'teleport',
    name: 'Chuyến Bay Đêm',
    description: 'Bay thẳng tới bất kỳ ô nào trên bản đồ, không nhận thưởng khi bay qua Xuất phát.',
    targetKind: 'any-tile',
    weight: 2,
    playableBeforeRoll: true,
    playableInAction: false,
  },
  {
    effect: 'stimulus',
    name: 'Gói Kích Cầu',
    description: 'Nhận ngay tiền hỗ trợ từ ngân sách nhà nước.',
    targetKind: 'none',
    weight: 4,
    playableBeforeRoll: true,
    playableInAction: true,
  },
  {
    effect: 'swap-position',
    name: 'Hoán Đổi Vị Trí',
    description: 'Đổi chỗ đứng trên bàn cờ với một nhóm khác.',
    targetKind: 'player',
    weight: 2,
    playableBeforeRoll: true,
    playableInAction: false,
  },
  {
    effect: 'instant-festival',
    name: 'Đăng Cai Đột Xuất',
    description: 'Tổ chức Festival ngay trên một địa danh đang sở hữu — tiền lưu trú nhân đôi.',
    targetKind: 'own-tile',
    weight: 2,
    playableBeforeRoll: true,
    playableInAction: true,
  },
  {
    effect: 'heritage-shield',
    name: 'Bảo Hộ Di Sản',
    description: 'Che chắn một địa danh đang sở hữu, chặn được một lần bị thâu tóm.',
    targetKind: 'own-tile',
    weight: 3,
    playableBeforeRoll: true,
    playableInAction: true,
  },
]

export const CARD_BY_EFFECT: Record<CardEffect, CardDefinition> = Object.fromEntries(
  CARD_DEFINITIONS.map((c) => [c.effect, c]),
) as Record<CardEffect, CardDefinition>

export function getCardDefinition(effect: CardEffect): CardDefinition {
  const definition = CARD_BY_EFFECT[effect]
  if (!definition) throw new Error(`Không tìm thấy thẻ: ${effect}`)
  return definition
}
