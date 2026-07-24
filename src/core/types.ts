/**
 * VNR202 BUSINESS VOYAGE - VIETNAM EDITION
 * Toàn bộ định nghĩa kiểu dữ liệu của lõi game (không phụ thuộc React / Zustand).
 *
 * Quy ước tiền tệ: mọi con số tiền trong game đều tính theo đơn vị "K".
 */

/* ------------------------------------------------------------------ */
/* Định danh                                                           */
/* ------------------------------------------------------------------ */

export type PlayerId = string
/** Chỉ số ô trên bàn cờ, 0..31 theo chiều kim đồng hồ. */
export type TileId = number

/* ------------------------------------------------------------------ */
/* Nhân vật 3D                                                         */
/* ------------------------------------------------------------------ */

export type CharacterId =
  | 'hello-kitty'
  | 'masha'
  | 'pikachu'
  | 'doraemon'
  | 'totoro'
  | 'conan'

export interface Character {
  id: CharacterId
  /** Tên hiển thị trên UI của Host. */
  name: string
  /** Đường dẫn tới file .glb trong /public/models (nạp ở Giai đoạn 2). */
  modelUrl: string
  /** Màu đại diện của đội — dùng cho quân cờ, nhà cửa và badge trên dashboard. */
  color: string
  /**
   * Ghi đè tên clip animation khi bộ dò tự động chọn sai.
   * Bỏ trống thì `resolveClipName` tự khớp theo tên (idle / jump / celebrate...).
   */
  clips?: Partial<Record<CharacterAnimation, string>>
  /** Hiệu chỉnh model .glb cho khớp bàn cờ: tỉ lệ, hướng quay, độ cao chân. */
  transform?: {
    scale?: number
    rotationY?: number
    yOffset?: number
  }
}

/** Ba trạng thái hoạt ảnh của nhân vật theo GDD. */
export type CharacterAnimation = 'idle' | 'jump' | 'celebrate'

/* ------------------------------------------------------------------ */
/* Bàn cờ                                                              */
/* ------------------------------------------------------------------ */

export type RegionId =
  | 'tay-bac'
  | 'dong-bac'
  | 'dong-bang-song-hong'
  | 'bac-trung-bo'
  | 'duyen-hai-nam-trung-bo'
  | 'tay-nguyen'
  | 'tay-nam-bo'
  | 'dong-nam-bo'

/** Một vùng miền = một "nhóm màu" trên bàn cờ, gồm đúng 3 địa danh. */
export interface Region {
  id: RegionId
  name: string
  /** Màu dải nhận diện của vùng miền trên bàn cờ 3D. */
  color: string
  /** Chi phí cơ sở cho một lần nâng cấp công trình trong vùng này. */
  upgradeCost: number
}

export type TileType = 'start' | 'jail' | 'festival' | 'travel' | 'property' | 'chance' | 'tax'

/**
 * Cấp độ công trình trên một ô đất:
 *  0 - Chưa ai sở hữu
 *  1 - Đất trống (vừa mua)
 *  2 - Trạm dừng chân
 *  3 - Khách sạn / Khu nghỉ dưỡng
 *  4 - Biểu tượng Địa phương (đặc quyền: KHÔNG thể bị thâu tóm)
 */
export type BuildLevel = 0 | 1 | 2 | 3 | 4

interface TileBase {
  id: TileId
  type: TileType
  name: string
  description: string
}

export interface PropertyTile extends TileBase {
  type: 'property'
  region: RegionId
  /** Tên tỉnh/thành phố. */
  province: string
  /** Giá mua đất trống. */
  price: number
  /** Tiền tham quan/lưu trú cơ sở (nhân theo cấp công trình). */
  baseRent: number
}

export interface TaxTile extends TileBase {
  type: 'tax'
  amount: number
}

export interface CornerTile extends TileBase {
  type: 'start' | 'jail' | 'festival' | 'travel'
}

export interface ChanceTile extends TileBase {
  type: 'chance'
}

export type Tile = PropertyTile | TaxTile | CornerTile | ChanceTile

/** Trạng thái động của một ô đất (tách khỏi dữ liệu tĩnh của bàn cờ). */
export interface PropertyState {
  tileId: TileId
  ownerId: PlayerId | null
  level: BuildLevel
  /** Tổng số tiền chủ đất đã bỏ ra cho ô này (giá mua + các lần nâng cấp). */
  invested: number
  /**
   * Số lượt còn hiệu lực của Festival (x2 tiền thu).
   * 0 = không có Festival, null = Festival vĩnh viễn.
   */
  festivalTurnsLeft: number | null
  /** Được thẻ "Bảo hộ Di sản" che chắn — chặn một lần thâu tóm rồi mất hiệu lực. */
  shielded: boolean
}

/* ------------------------------------------------------------------ */
/* Thẻ Cơ hội                                                          */
/* ------------------------------------------------------------------ */

export type CardEffect =
  | 'choose-dice'
  | 'demolish'
  | 'free-stay'
  | 'escape-jail'
  | 'teleport'
  | 'stimulus'
  | 'swap-position'
  | 'instant-festival'
  | 'heritage-shield'

/** Loại mục tiêu mà Host phải chỉ định khi kích hoạt thẻ. */
export type CardTargetKind = 'none' | 'dice' | 'own-tile' | 'opponent-tile' | 'any-tile' | 'player'

export interface CardDefinition {
  effect: CardEffect
  name: string
  description: string
  targetKind: CardTargetKind
  /** Trọng số khi bốc thẻ — số càng lớn càng dễ ra. */
  weight: number
  /**
   * true  = dùng ở Vòng Chiến thuật (trước khi đổ xúc xắc)
   * false = dùng ở Vòng Hành động (khi đã dừng chân)
   */
  playableBeforeRoll: boolean
  playableInAction: boolean
}

/** Một lá thẻ cụ thể đang nằm trong túi đồ của một nhóm. */
export interface CardInstance {
  instanceId: string
  effect: CardEffect
}

export type CardTarget =
  | { kind: 'none' }
  /** Tổng điểm 2 viên xúc xắc mà nhóm muốn chốt (2..12). */
  | { kind: 'dice'; total: number }
  | { kind: 'tile'; tileId: TileId }
  | { kind: 'player'; playerId: PlayerId }

/* ------------------------------------------------------------------ */
/* Ngân hàng câu hỏi VNR202                                            */
/* ------------------------------------------------------------------ */

export type QuestionTopic =
  /** Chương 1: Đảng ra đời và lãnh đạo giành chính quyền (1930-1945) */
  | 'thanh-lap-dang'
  /** Chương 2: Lãnh đạo hai cuộc kháng chiến (1945-1975) */
  | 'khang-chien'
  /** Chương 3: Cả nước quá độ lên CNXH và công cuộc Đổi mới (1975-nay) */
  | 'doi-moi'

export type QuestionDifficulty = 'easy' | 'medium' | 'hard'

export interface Question {
  id: string
  topic: QuestionTopic
  difficulty: QuestionDifficulty
  prompt: string
  options: [string, string, string, string]
  answerIndex: 0 | 1 | 2 | 3
  /** Giải thích ngắn để Host đọc lại cho lớp sau khi chốt đáp án. */
  explanation: string
}

/* ------------------------------------------------------------------ */
/* Người chơi                                                          */
/* ------------------------------------------------------------------ */

export type PlayerStatus = 'active' | 'jailed' | 'bankrupt'

export interface PlayerStats {
  correctAnswers: number
  wrongAnswers: number
  rentCollected: number
  rentPaid: number
  propertiesBought: number
  upgradesBuilt: number
  landmarksBuilt: number
  takeoversMade: number
  takeoversSuffered: number
  lapsCompleted: number
  cardsPlayed: number
}

export interface Player {
  id: PlayerId
  /** Tên nhóm, ví dụ "Nhóm 1 - Sao Vàng". */
  name: string
  characterId: CharacterId
  color: string
  cash: number
  position: TileId
  status: PlayerStatus
  /** Số lượt còn phải nghỉ ở ô Kẹt xe / Cách ly. */
  jailTurnsLeft: number
  /** Túi đồ, tối đa GAME_CONFIG.MAX_CARDS lá. */
  cards: CardInstance[]

  /* --- Hiệu ứng tạm thời (reset ở đầu mỗi lượt của nhóm) --- */
  /** Vừa dừng ở Sân bay Quốc tế → lượt kế tiếp được bay tới ô bất kỳ. */
  pendingTravel: boolean
  /** Thẻ "Giấy Miễn Phí Tham Quan" → miễn tiền lưu trú lượt này. */
  rentImmunity: boolean
  /** Thẻ "Chỉ Đạo Chiến Lược" → chốt trước tổng điểm xúc xắc. */
  forcedDiceTotal: number | null

  stats: PlayerStats
}

/* ------------------------------------------------------------------ */
/* Luồng ván đấu                                                       */
/* ------------------------------------------------------------------ */

export type GamePhase =
  /** Sảnh chờ: chọn nhóm, nhân vật, thời lượng ván. */
  | 'lobby'
  /** Vòng Hỏi Đáp: bảng câu hỏi VNR202 trượt xuống. */
  | 'trivia'
  /** Vòng Chiến thuật: nhóm có thể yêu cầu Host dùng Thẻ Cơ hội. */
  | 'pre-roll'
  /** Host đã bấm lắc — xúc xắc vật lý đang lăn. */
  | 'rolling'
  /** Quân cờ đang nhảy parabol qua các ô. */
  | 'moving'
  /** Vòng Hành động: giải quyết ô vừa dừng chân. */
  | 'action'
  /** Chốt lượt, chuẩn bị chuyển nhóm. */
  | 'turn-end'
  /** Hết giờ, bàn cờ đóng băng, hiện bảng xếp hạng. */
  | 'game-over'

/** Việc mà Host phải bấm xử lý trong Vòng Hành động. */
export type PendingAction =
  | { kind: 'idle' }
  /** Dừng ở đất trống chưa ai mua. */
  | { kind: 'buy'; tileId: TileId; price: number; affordable: boolean }
  /** Dừng ở đất của chính mình → có thể nâng cấp. */
  | { kind: 'upgrade'; tileId: TileId; cost: number; nextLevel: BuildLevel; affordable: boolean }
  /** Dừng ở đất đối thủ → nộp tiền lưu trú, hoặc thâu tóm. */
  | {
      kind: 'rent'
      tileId: TileId
      ownerId: PlayerId
      rent: number
      /** null = không thể thâu tóm (Biểu tượng Địa phương / được bảo hộ). */
      takeoverCost: number | null
      takeoverBlockedReason: string | null
    }
  /** Dừng ở ô Thuế / Đóng góp. */
  | { kind: 'tax'; tileId: TileId; amount: number }
  /** Dừng ở góc Đăng cai Festival → chọn 1 ô mình sở hữu để nhân đôi tiền thu. */
  | { kind: 'festival'; eligibleTileIds: TileId[] }
  /** Dừng ở góc Sân bay Quốc tế → lượt sau được bay. */
  | { kind: 'travel' }
  /** Dừng ở góc Kẹt xe / Cách ly. */
  | { kind: 'jail'; turns: number }
  /** Dừng ở ô Cơ hội trên bàn cờ → bốc thêm 1 thẻ. */
  | { kind: 'chance' }
  /** Đầu lượt và nhóm đang có quyền bay (từ Sân bay Quốc tế). */
  | { kind: 'travel-choose' }
  /** Đang nằm ở ô Kẹt xe → trả phí, dùng thẻ, hoặc chịu nghỉ lượt. */
  | { kind: 'jailed'; bail: number; turnsLeft: number }

/* ------------------------------------------------------------------ */
/* Nhật ký ván đấu                                                     */
/* ------------------------------------------------------------------ */

export type LogKind = 'info' | 'money' | 'property' | 'card' | 'trivia' | 'warning' | 'success'

export interface LogEntry {
  id: string
  turn: number
  playerId: PlayerId | null
  kind: LogKind
  message: string
}

/* ------------------------------------------------------------------ */
/* Hàng đợi sự kiện (cho hoạt ảnh 3D & SFX)                            */
/* ------------------------------------------------------------------ */

/**
 * Sự kiện xảy ra một lần, để lớp 3D và âm thanh bắt lấy mà diễn hoạt ảnh.
 * Khác với `log` (dành cho người đọc), đây là tín hiệu dành cho máy.
 */
export type GameEventType =
  | 'property-bought'
  | 'property-upgraded'
  /** Nâng lên cấp 4 — nhân vật chạy hoạt ảnh Celebrate. */
  | 'landmark-built'
  | 'property-takeover'
  | 'property-demolished'
  | 'festival-started'
  | 'rent-paid'
  | 'player-moved'
  | 'player-jailed'
  | 'player-bankrupt'
  | 'trivia-correct'
  | 'trivia-wrong'
  | 'card-drawn'
  | 'pass-start'
  | 'escape-jail'
  | 'teleport'
  | 'shield-activate'
  | 'cash-gained'

export interface GameEvent {
  id: string
  /** Số thứ tự tăng dần — lớp 3D dùng để biết sự kiện nào chưa xử lý. */
  seq: number
  type: GameEventType
  playerId: PlayerId | null
  tileId: TileId | null
  amount: number | null
  turn: number
}

/* ------------------------------------------------------------------ */
/* Cấu hình & kết quả ván                                              */
/* ------------------------------------------------------------------ */

export interface GameSettings {
  /** Thời lượng tổng của ván, Host chọn ở sảnh chờ. */
  matchMinutes: number
  /** Thời gian đếm ngược cho mỗi câu hỏi VNR202. */
  triviaSeconds: number
  startingCash: number
  /** Bật/tắt cơ chế thâu tóm đất đối thủ. */
  allowTakeover: boolean
  /** Bắt buộc sở hữu trọn vùng miền mới được xây Biểu tượng Địa phương. */
  requireRegionForLandmark: boolean
}

export interface Standing {
  rank: number
  playerId: PlayerId
  name: string
  characterId: CharacterId
  color: string
  cash: number
  /** Tổng vốn đã rót vào các công trình đang sở hữu. */
  propertyValue: number
  /** cash + propertyValue */
  netWorth: number
  propertiesOwned: number
  landmarks: number
  status: PlayerStatus
  stats: PlayerStats
}

/* ------------------------------------------------------------------ */
/* Trạng thái lõi                                                      */
/* ------------------------------------------------------------------ */

/**
 * Toàn bộ dữ liệu của một ván đấu — thuần dữ liệu, serialize được.
 * Store Zustand = GameCore + các action; mọi hàm trong core/logic
 * đều nhận GameCore nên có thể test độc lập, không cần React.
 */
export interface GameCore {
  phase: GamePhase
  settings: GameSettings

  players: Player[]
  /** Thứ tự đi, chứa id người chơi. */
  turnOrder: PlayerId[]
  currentPlayerIndex: number
  /** Số lượt đã diễn ra kể từ đầu ván (dùng cho log và đếm hiệu lực Festival). */
  turnCount: number

  properties: Record<TileId, PropertyState>

  /** Kết quả 2 viên xúc xắc của lượt hiện tại. */
  dice: [number, number] | null

  currentQuestion: Question | null
  /** Các câu đã dùng để không hỏi lặp trong cùng một ván. */
  askedQuestionIds: string[]
  triviaResult: 'correct' | 'wrong' | 'timeout' | null

  pendingAction: PendingAction

  log: LogEntry[]
  /** Hàng đợi sự kiện cho hoạt ảnh 3D — xem `useGameEvents`. */
  events: GameEvent[]

  /* --- Đồng hồ tổng --- */
  timeRemainingMs: number
  isTimerRunning: boolean
  /** Hết giờ rồi, nhóm hiện tại đang đi nốt lượt cuối. */
  isFinalTurn: boolean

  standings: Standing[] | null

  /** Trạng thái bộ sinh số ngẫu nhiên — giữ trong state để ván đấu tái lập được. */
  rngState: number
  /** Bộ đếm nội bộ tạo id duy nhất cho log và thẻ bài. */
  seq: number
}
