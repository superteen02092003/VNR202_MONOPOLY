# VNR202 BUSINESS TOUR — Vietnam Edition

Board game 3D ôn tập môn **Lịch sử Đảng (VNR202)**, lấy cảm hứng từ Business Tour với
bối cảnh các địa danh Việt Nam. Một Host điều khiển trên máy chiếu, 5 nhóm trong lớp
tương tác bằng lời nói.

> **Trạng thái hiện tại: đã xong Giai đoạn 1 — Core Logic (chưa có giao diện thật).**

## Chạy dự án

```bash
npm install
```

```bash
npm run dev
```

| Lệnh                | Tác dụng                                      |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Chạy dev server Vite                          |
| `npm test`          | Chạy 81 test của lõi game (Vitest)            |
| `npm run test:watch`| Chạy test ở chế độ theo dõi                   |
| `npm run build`     | Kiểm tra kiểu (tsc) rồi build production      |
| `npm run lint`      | Chạy oxlint                                   |

Màn hình hiện tại là **bảng thử kỹ thuật** của Giai đoạn 1: chọn nhóm → trả lời câu hỏi
→ lắc xúc xắc → mua/nâng cấp/thâu tóm → chốt lượt, kèm nhật ký ván đấu. Giai đoạn 3 sẽ
thay hoàn toàn bằng Host Dashboard thật.

## Kiến trúc

```
src/
├── core/                    ← LÕI GAME: thuần TypeScript, không phụ thuộc React
│   ├── types.ts             ← Toàn bộ kiểu dữ liệu (Player, Tile, Card, Question...)
│   ├── config.ts            ← Hằng số cân bằng: tiền, giá nâng cấp, hệ số thuê...
│   ├── data/
│   │   ├── board.ts         ← 32 ô cờ + 8 vùng miền Việt Nam
│   │   ├── characters.ts    ← 10 nhân vật 3D
│   │   ├── cards.ts         ← 9 loại Thẻ Cơ hội
│   │   └── questions.ts     ← Ngân hàng câu hỏi VNR202 (62 câu, 3 chương)
│   ├── logic/               ← Luật chơi, mỗi file một mối quan tâm
│   │   ├── board.ts         ← Truy vấn ô cờ, độc quyền vùng miền
│   │   ├── movement.ts      ← Xúc xắc, di chuyển, thưởng Xuất phát, ô Kẹt xe
│   │   ├── property.ts      ← Mua / nâng cấp / thâu tóm / phá / thanh lý
│   │   ├── rent.ts          ← Công thức tiền tham quan – lưu trú
│   │   ├── payments.ts      ← Chuyển tiền, tự thanh lý, phá sản
│   │   ├── cards.ts         ← Bốc thẻ và 9 hiệu ứng thẻ
│   │   ├── trivia.ts        ← Rút câu hỏi, chấm đáp án
│   │   ├── festival.ts      ← Đăng cai Festival (x2 tiền thu)
│   │   ├── landing.ts       ← Đáp xuống ô nào thì Host phải xử lý gì
│   │   ├── turn.ts          ← Xoay tua lượt, đồng hồ tổng, kết thúc ván
│   │   └── scoring.ts       ← Quy đổi tài sản, xếp hạng chung cuộc
│   └── __tests__/           ← Test lõi game (chạy headless, không cần trình duyệt)
├── store/
│   └── useGameStore.ts      ← Zustand + immer: điều phối các bước của một lượt
├── scene/                   ← (Giai đoạn 2) React Three Fiber — xem README bên trong
├── components/              ← (Giai đoạn 3) UI TailwindCSS — xem README bên trong
└── App.tsx                  ← Bảng thử tạm của Giai đoạn 1
```

**Nguyên tắc xuyên suốt:** mọi luật chơi nằm trong `src/core`, hoàn toàn không biết React.
`store` chỉ điều phối thứ tự các bước. `scene` và `components` chỉ đọc state và gọi action.
Nhờ vậy toàn bộ luật chơi test được mà không cần dựng cảnh 3D.

## Luật chơi đã cài đặt

### Bàn cờ

32 ô khép kín. Bốn góc: **Xuất phát** (0) · **Kẹt xe – Cách ly** (8) ·
**Đăng cai Festival** (16) · **Sân bay Quốc tế** (24).
24 ô đất chia cho 8 vùng miền, mỗi vùng 3 địa danh, giá tăng dần từ Tây Bắc (60)
đến Đông Nam Bộ (400). Xen kẽ 2 ô Cơ hội và 2 ô Thuế.

Đơn vị tiền trong toàn bộ code là **triệu VNĐ** (vốn khởi điểm 1.500 = 1,5 tỷ).

### Bốn cấp công trình

| Cấp | Tên                        | Hệ số tiền lưu trú | Ghi chú                          |
| --- | -------------------------- | ------------------ | -------------------------------- |
| 1   | Đất trống                  | ×1                 | Vừa mua                          |
| 2   | Trạm dừng chân             | ×5                 |                                  |
| 3   | Khách sạn / Khu nghỉ dưỡng | ×15                |                                  |
| 4   | **Biểu tượng Địa phương**  | ×40                | **Không thể bị thâu tóm hay phá**|

Chi phí nâng cấp = `upgradeCost` của vùng × hệ số `[1, 2, 4]` theo cấp đích.
Sở hữu trọn 3 địa danh một vùng miền thì tiền lưu trú ở cấp Đất trống nhân đôi.

### Luồng một lượt

`trivia` → `pre-roll` → `rolling` → `moving` → `action` → chốt lượt.

1. **Vòng Hỏi Đáp** — trả lời đúng được rút 1 Thẻ Cơ hội (túi tối đa 3 lá).
2. **Vòng Chiến thuật** — dùng thẻ trước khi đổ xúc xắc.
3. **Vòng Di chuyển** — 2 viên xúc xắc, đi qua Xuất phát nhận 200, dừng đúng nhận 400.
4. **Vòng Hành động** — mua / nâng cấp / nộp tiền lưu trú / thâu tóm / nộp thuế /
   đăng cai Festival / bốc thẻ, tùy ô vừa đáp xuống.

### Thâu tóm (Takeover)

Dừng vào đất đối thủ, nhóm được chọn **một trong hai**: nộp tiền lưu trú, hoặc
**mua đứt** ô đất với giá gấp đôi tổng vốn chủ cũ đã rót. Không áp dụng được với
Biểu tượng Địa phương (cấp 4) hoặc ô đang có thẻ Bảo Hộ Di Sản.

### Phá sản

Khi phải trả một khoản bắt buộc mà không đủ tiền mặt, hệ thống **tự động thanh lý**
công trình (thu về 50% vốn), ưu tiên hạ cấp công trình cao trước rồi mới bán đất trống.
Bán sạch vẫn thiếu thì nhóm phá sản và bàn giao toàn bộ bất động sản cho chủ nợ.

### Kết thúc ván

Host đặt thời lượng ở sảnh chờ (mặc định 30 phút). Hết giờ, nhóm hiện tại **đi nốt lượt
cuối**, sau đó bàn cờ đóng băng và quy đổi `tiền mặt + tổng vốn công trình` để xếp hạng.
Nhóm phá sản luôn xếp cuối bảng.

## Ngân hàng câu hỏi

62 câu trắc nghiệm, mỗi câu 4 phương án kèm phần giải thích cho Host đọc lại cho lớp:

- **Chương 1** — Đảng ra đời và lãnh đạo giành chính quyền (1930-1945)
- **Chương 2** — Lãnh đạo hai cuộc kháng chiến (1945-1975)
- **Chương 3** — Quá độ lên CNXH và công cuộc Đổi mới (1975 đến nay)

Thêm câu mới: chèn phần tử vào mảng trong
[`src/core/data/questions.ts`](src/core/data/questions.ts). Test tự động sẽ kiểm tra
id không trùng, đủ 4 phương án khác nhau và vị trí đáp án không bị thiên lệch.

## Điều chỉnh độ khó

Sửa [`src/core/config.ts`](src/core/config.ts) — không cần đụng vào logic:

| Hằng số                     | Ý nghĩa                                              |
| --------------------------- | ---------------------------------------------------- |
| `STARTING_CASH`             | Vốn khởi điểm mỗi nhóm                                |
| `RENT_BY_LEVEL`             | Hệ số tiền lưu trú theo 4 cấp công trình              |
| `TAKEOVER_MULTIPLIER`       | Giá thâu tóm gấp mấy lần vốn chủ cũ                   |
| `FESTIVAL_DURATION_TURNS`   | `null` = Festival vĩnh viễn, số = có hạn theo lượt    |
| `JAIL_TURNS` / `JAIL_BAIL`  | Số lượt nghỉ và phí thoát ô Kẹt xe                    |
| `MAX_CARDS`                 | Sức chứa túi Thẻ Cơ hội                               |

Trong `DEFAULT_SETTINGS` còn hai công tắc: `allowTakeover` (tắt hẳn cơ chế thâu tóm) và
`requireRegionForLandmark` (bắt buộc sở hữu trọn vùng miền mới được xây Biểu tượng
Địa phương — mặc định `false` theo đúng GDD).

## Công nghệ

React 19 · TypeScript · Vite · Zustand (+immer) · Three.js / @react-three/fiber ·
@react-three/drei · @react-three/cannon · anime.js · TailwindCSS 4 · Vitest

## Lộ trình

- [x] **Giai đoạn 1** — Core Logic: store, luật chơi, ngân hàng câu hỏi, 81 test
- [ ] **Giai đoạn 2** — Bàn cờ 3D & nhân vật (`src/scene`)
- [ ] **Giai đoạn 3** — UI/UX cho Quản trò (`src/components`)
- [ ] **Giai đoạn 4** — SFX, test flow, deploy
