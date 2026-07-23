# `src/scene` — Bàn cờ 3D (Giai đoạn 2)

Nơi đặt toàn bộ code React Three Fiber. Lõi logic ở `src/core` đã cung cấp sẵn
mọi dữ liệu cần để render, các component ở đây chỉ **đọc** store và **gọi action**,
tuyệt đối không tự tính toán luật chơi.

## Các component dự kiến

| File                | Nhiệm vụ                                                                   |
| ------------------- | -------------------------------------------------------------------------- |
| `GameCanvas.tsx`    | `<Canvas>`, ánh sáng, camera isometric 45°, `<Physics>` của Cannon.js       |
| `Board.tsx`         | Render 32 ô từ `BOARD`, tô màu theo `REGIONS`                               |
| `Tile.tsx`          | Một ô cờ; đọc `properties[tileId]` để dựng công trình theo `level`          |
| `Building.tsx`      | 4 cấp: Đất trống → Trạm dừng chân → Khách sạn → Biểu tượng Địa phương       |
| `Pawn.tsx`          | Quân cờ `.glb`, animation nhảy parabol qua từng ô                          |
| `Dice.tsx`          | 2 viên xúc xắc vật lý `@react-three/cannon`                                |

## Móc nối với store

```ts
// Đọc dữ liệu
const properties = useGameStore((s) => s.properties)
const players = useGameStore((s) => s.players)

// Xúc xắc vật lý: sau khi 2 viên nằm yên, đọc mặt ngửa rồi báo cho lõi game
useGameStore.getState().setDiceResult([d1, d2])
useGameStore.getState().markMoving()      // bắt đầu animation quân cờ nhảy
useGameStore.getState().applyMovement()   // animation xong → mở Vòng Hành động
```

Tọa độ ô cờ suy ra từ `tileId` (0..31): 4 cạnh, mỗi cạnh 9 ô tính cả hai góc,
góc nằm ở các chỉ số 0 / 8 / 16 / 24.
