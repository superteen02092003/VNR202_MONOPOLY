import type { PropertyTile, Region, RegionId, Tile, TileId } from '../types'

/**
 * 8 vùng miền = 8 nhóm màu, mỗi nhóm đúng 3 địa danh.
 * Giá đất tăng dần theo thứ tự vùng, tạo đường cong kinh tế cân bằng.
 */
export const REGIONS: Region[] = [
  { id: 'tay-bac', name: 'Tây Bắc', color: '#8b5e3c', upgradeCost: 50 },
  { id: 'dong-bac', name: 'Đông Bắc', color: '#22d3ee', upgradeCost: 50 },
  { id: 'dong-bang-song-hong', name: 'Đồng bằng sông Hồng', color: '#f472b6', upgradeCost: 100 },
  { id: 'bac-trung-bo', name: 'Bắc Trung Bộ', color: '#fb923c', upgradeCost: 100 },
  { id: 'duyen-hai-nam-trung-bo', name: 'Duyên hải Nam Trung Bộ', color: '#ef4444', upgradeCost: 150 },
  { id: 'tay-nguyen', name: 'Tây Nguyên', color: '#eab308', upgradeCost: 150 },
  { id: 'tay-nam-bo', name: 'Tây Nam Bộ', color: '#22c55e', upgradeCost: 200 },
  { id: 'dong-nam-bo', name: 'Đông Nam Bộ', color: '#6366f1', upgradeCost: 200 },
]

export const REGION_BY_ID: Record<RegionId, Region> = Object.fromEntries(
  REGIONS.map((r) => [r.id, r]),
) as Record<RegionId, Region>

/**
 * Bàn cờ vuông khép kín 32 ô, đánh số theo chiều kim đồng hồ từ ô Xuất phát.
 * Bốn góc nằm ở các chỉ số 0 / 8 / 16 / 24; mỗi cạnh có 7 ô ở giữa.
 */
export const BOARD: Tile[] = [
  {
    id: 0,
    type: 'start',
    name: 'Xuất phát',
    description: 'Đi ngang qua được Nhà nước hỗ trợ vốn. Dừng đúng ô này nhận gấp đôi.',
  },

  /* --- Cạnh 1: Tây Bắc & Đông Bắc --- */
  prop(1, 'tay-bac', 'Điện Biên', 'Di tích Chiến trường Điện Biên Phủ', 60, 4),
  prop(2, 'tay-bac', 'Sơn La', 'Di tích Nhà tù Sơn La', 60, 4),
  prop(3, 'tay-bac', 'Lào Cai', 'Sa Pa – Đỉnh Fansipan', 80, 6),
  {
    id: 4,
    type: 'chance',
    name: 'Ô Cơ hội',
    description: 'Bốc ngay 1 Thẻ Cơ hội nếu túi đồ còn chỗ trống.',
  },
  prop(5, 'dong-bac', 'Hà Giang', 'Cao nguyên đá Đồng Văn', 100, 8),
  prop(6, 'dong-bac', 'Cao Bằng', 'Khu di tích Quốc gia đặc biệt Pác Bó', 100, 8),
  prop(7, 'dong-bac', 'Quảng Ninh', 'Vịnh Hạ Long', 120, 10),

  {
    id: 8,
    type: 'jail',
    name: 'Kẹt xe – Cách ly',
    description: 'Nghỉ 3 lượt. Có thể trả phí giải tỏa hoặc dùng thẻ Vé Thông Hành để thoát sớm.',
  },

  /* --- Cạnh 2: Đồng bằng sông Hồng & Bắc Trung Bộ --- */
  prop(9, 'dong-bang-song-hong', 'Hà Nội', 'Quảng trường Ba Đình', 140, 12),
  prop(10, 'dong-bang-song-hong', 'Hải Phòng', 'Cảng Hải Phòng', 140, 12),
  prop(11, 'dong-bang-song-hong', 'Ninh Bình', 'Tràng An – Cố đô Hoa Lư', 160, 16),
  {
    id: 12,
    type: 'tax',
    name: 'Thuế',
    description: 'Thuế.',
    amount: 100,
  },
  prop(13, 'bac-trung-bo', 'Nghệ An', 'Khu di tích Kim Liên', 180, 16),
  prop(14, 'bac-trung-bo', 'Quảng Bình', 'Vườn quốc gia Phong Nha – Kẻ Bàng', 180, 16),
  prop(15, 'bac-trung-bo', 'Thừa Thiên Huế', 'Quần thể di tích Cố đô Huế', 200, 20),

  {
    id: 16,
    type: 'festival',
    name: 'Đăng cai Festival',
    description: 'Chọn 1 địa danh đang sở hữu để đăng cai Festival — tiền lưu trú nhân đôi.',
  },

  /* --- Cạnh 3: Duyên hải Nam Trung Bộ & Tây Nguyên --- */
  prop(17, 'duyen-hai-nam-trung-bo', 'Đà Nẵng', 'Bán đảo Sơn Trà – Cầu Rồng', 220, 20),
  prop(18, 'duyen-hai-nam-trung-bo', 'Quảng Nam', 'Phố cổ Hội An', 220, 20),
  prop(19, 'duyen-hai-nam-trung-bo', 'Khánh Hòa', 'Vịnh Nha Trang', 240, 24),
  {
    id: 20,
    type: 'chance',
    name: 'Ô Cơ hội',
    description: 'Bốc ngay 1 Thẻ Cơ hội nếu túi đồ còn chỗ trống.',
  },
  prop(21, 'tay-nguyen', 'Lâm Đồng', 'Thành phố ngàn hoa Đà Lạt', 260, 24),
  prop(22, 'tay-nguyen', 'Đắk Lắk', 'Buôn Ma Thuột – Thủ phủ cà phê', 260, 24),
  prop(23, 'tay-nguyen', 'Gia Lai', 'Biển Hồ Pleiku', 280, 28),

  {
    id: 24,
    type: 'travel',
    name: 'Sân bay Quốc tế',
    description: 'Lượt kế tiếp, nhóm được bay thẳng tới bất kỳ ô nào trên bản đồ.',
  },

  /* --- Cạnh 4: Tây Nam Bộ & Đông Nam Bộ --- */
  prop(25, 'tay-nam-bo', 'Cần Thơ', 'Chợ nổi Cái Răng', 300, 28),
  prop(26, 'tay-nam-bo', 'Kiên Giang', 'Đảo ngọc Phú Quốc', 300, 28),
  prop(27, 'tay-nam-bo', 'Cà Mau', 'Mũi Cà Mau – Đất Mũi', 320, 32),
  {
    id: 28,
    type: 'tax',
    name: 'Thuế',
    description: 'Thuế.',
    amount: 200,
  },
  prop(29, 'dong-nam-bo', 'Tây Ninh', 'Căn cứ Trung ương Cục miền Nam', 350, 35),
  prop(30, 'dong-nam-bo', 'Bà Rịa – Vũng Tàu', 'Di tích Nhà tù Côn Đảo', 350, 35),
  prop(31, 'dong-nam-bo', 'TP. Hồ Chí Minh', 'Bến Nhà Rồng – Dinh Độc Lập', 400, 50),
]

/** Helper thu gọn khai báo một ô đất. */
function prop(
  id: TileId,
  region: RegionId,
  province: string,
  landmark: string,
  price: number,
  baseRent: number,
): PropertyTile {
  return {
    id,
    type: 'property',
    name: landmark,
    description: `${province} — ${landmark}`,
    region,
    province,
    price,
    baseRent,
  }
}

export const PROPERTY_TILES: PropertyTile[] = BOARD.filter(
  (t): t is PropertyTile => t.type === 'property',
)

/** Danh sách id các ô đất theo từng vùng miền — dùng để kiểm tra độc quyền vùng. */
export const TILES_BY_REGION: Record<RegionId, TileId[]> = REGIONS.reduce(
  (acc, region) => {
    acc[region.id] = PROPERTY_TILES.filter((t) => t.region === region.id).map((t) => t.id)
    return acc
  },
  {} as Record<RegionId, TileId[]>,
)
