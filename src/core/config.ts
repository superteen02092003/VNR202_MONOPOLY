/**
 * Các hằng số cân bằng của game. Chỉnh ở đây, không hardcode rải rác trong logic.
 * Đơn vị tiền: triệu VNĐ.
 */

import type { BuildLevel, GameSettings } from './types'

export const GAME_CONFIG = {
  /* --- Bàn cờ --- */
  BOARD_SIZE: 32,
  /** 4 góc bàn cờ. */
  TILE_START: 0,
  TILE_JAIL: 8,
  TILE_FESTIVAL: 16,
  TILE_TRAVEL: 24,

  /* --- Người chơi --- */
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 5,
  STARTING_CASH: 1500,

  /* --- Ô Xuất phát --- */
  /** Đi ngang qua ô Xuất phát: nhà nước hỗ trợ vốn. */
  PASS_START_BONUS: 200,
  /** Dừng đúng ô Xuất phát: thưởng gấp đôi. */
  LAND_ON_START_BONUS: 400,

  /* --- Ô Kẹt xe / Cách ly --- */
  JAIL_TURNS: 3,
  /** Phí "giải tỏa" để ra sớm. */
  JAIL_BAIL: 50,

  /* --- Xúc xắc --- */
  DICE_COUNT: 2,
  DICE_FACES: 6,

  /* --- Thẻ Cơ hội --- */
  MAX_CARDS: 3,
  /** Tiền của thẻ "Gói Kích Cầu". */
  STIMULUS_AMOUNT: 300,

  /* --- Công trình --- */
  MAX_BUILD_LEVEL: 4 as BuildLevel,
  /**
   * Hệ số nhân tiền lưu trú theo cấp công trình (index = cấp).
   * 0: chưa sở hữu | 1: Đất trống | 2: Trạm dừng chân | 3: Khách sạn | 4: Biểu tượng Địa phương
   */
  RENT_BY_LEVEL: [0, 1, 5, 15, 40] as const,
  /**
   * Hệ số nhân chi phí nâng cấp theo cấp đích (index = cấp muốn lên).
   * Lên Biểu tượng Địa phương đắt gấp 4 lần một lần nâng cấp thường.
   */
  UPGRADE_COST_MULTIPLIER: [0, 0, 1, 2, 4] as const,
  /** Sở hữu trọn 3 địa danh của một vùng miền → tiền lưu trú ở cấp Đất trống nhân đôi. */
  REGION_MONOPOLY_MULTIPLIER: 2,
  /** Thanh lý công trình khi thiếu tiền chỉ thu về 50% vốn. */
  LIQUIDATION_RATE: 0.5,

  /* --- Thâu tóm (Takeover) --- */
  /** Giá thâu tóm = tổng vốn chủ đất đã rót x hệ số này. */
  TAKEOVER_MULTIPLIER: 2,

  /* --- Festival --- */
  FESTIVAL_MULTIPLIER: 2,
  /** Số lượt Festival có hiệu lực; null = vĩnh viễn. */
  FESTIVAL_DURATION_TURNS: null as number | null,

  /* --- Đồng hồ tổng --- */
  MATCH_MINUTE_OPTIONS: [15, 20, 30, 45, 60] as const,
  DEFAULT_MATCH_MINUTES: 30,
  /** 5 phút cuối: đồng hồ đổi màu đỏ và nhấp nháy. */
  ENDGAME_WARNING_MS: 5 * 60 * 1000,

  /* --- Hỏi đáp --- */
  DEFAULT_TRIVIA_SECONDS: 30,

  /* --- Nhật ký --- */
  MAX_LOG_ENTRIES: 200,
  /** Hàng đợi sự kiện cho hoạt ảnh 3D — chỉ cần đủ cho vài lượt gần nhất. */
  MAX_EVENT_ENTRIES: 50,
} as const

/* ------------------------------------------------------------------ */
/* Hằng số hình học của bàn cờ 3D (Giai đoạn 2)                        */
/* ------------------------------------------------------------------ */

export const BOARD_3D = {
  /** Cạnh của một ô góc (hình vuông). */
  CORNER_SIZE: 2.4,
  /** Bề ngang một ô thường (dọc theo cạnh bàn cờ). */
  TILE_WIDTH: 1.5,
  /** Bề sâu một ô thường (hướng vào tâm bàn cờ). */
  TILE_DEPTH: 2.4,
  /** Độ dày mặt ô. */
  TILE_HEIGHT: 0.18,
  /** Số ô thường trên mỗi cạnh (không tính 2 góc). */
  TILES_PER_SIDE: 7,
  /** Độ cao đỉnh parabol khi nhân vật nhảy qua một ô. */
  HOP_HEIGHT: 0.9,
  /** Thời gian nhảy qua MỘT ô (ms). */
  HOP_DURATION: 260,
  /** Bán kính vòng tròn xếp quân cờ khi nhiều nhóm đứng chung một ô. */
  PAWN_SPREAD: 0.42,
} as const

export const DEFAULT_SETTINGS: GameSettings = {
  matchMinutes: GAME_CONFIG.DEFAULT_MATCH_MINUTES,
  triviaSeconds: GAME_CONFIG.DEFAULT_TRIVIA_SECONDS,
  startingCash: GAME_CONFIG.STARTING_CASH,
  allowTakeover: true,
  // Mặc định bám sát GDD: không ràng buộc phải sở hữu trọn vùng miền.
  // Bật lên nếu muốn Biểu tượng Địa phương khó đạt hơn.
  requireRegionForLandmark: false,
}

/** Nhãn tiếng Việt của từng cấp công trình — dùng chung cho log và UI Host. */
export const BUILD_LEVEL_LABEL: Record<BuildLevel, string> = {
  0: 'Chưa khai thác',
  1: 'Đất trống',
  2: 'Trạm dừng chân',
  3: 'Khách sạn / Khu nghỉ dưỡng',
  4: 'Biểu tượng Địa phương',
}

export const PHASE_LABEL = {
  lobby: 'Sảnh chờ',
  trivia: 'Vòng Hỏi Đáp',
  'pre-roll': 'Vòng Chiến thuật',
  rolling: 'Đang đổ xúc xắc',
  moving: 'Đang di chuyển',
  action: 'Vòng Hành động',
  'turn-end': 'Kết thúc lượt',
  'game-over': 'Kết thúc ván',
} as const
