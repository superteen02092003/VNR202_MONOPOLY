# `src/components` — Lớp UI 2D phủ lên Canvas (Giai đoạn 3)

Toàn bộ giao diện TailwindCSS của Quản trò, render **đè lên** `<Canvas>` 3D
bằng một lớp `absolute inset-0 pointer-events-none`, riêng các panel bật lại
`pointer-events-auto`.

## Các component dự kiến

| File                   | Nhiệm vụ                                                                 |
| ---------------------- | ------------------------------------------------------------------------ |
| `HostDashboard.tsx`    | Bảng điều khiển chính: Lắc xúc xắc, Xác nhận / Hủy, Dùng thẻ              |
| `TriviaPanel.tsx`      | Bảng câu hỏi VNR202 trượt xuống + đồng hồ đếm ngược (anime.js)            |
| `GlobalTimer.tsx`      | Đồng hồ tổng góc trên; 5 phút cuối đổi đỏ và nhấp nháy                    |
| `PlayerCard.tsx`       | Thẻ thông tin từng nhóm: tiền, vị trí, túi thẻ                            |
| `CardInventory.tsx`    | Túi đồ tối đa 3 Thẻ Cơ hội, hiệu ứng lật thẻ                              |
| `ActionPrompt.tsx`     | Hộp thoại theo `pendingAction`: mua / nâng cấp / nộp tiền / thâu tóm      |
| `LobbyScreen.tsx`      | Sảnh chờ: chọn nhóm, nhân vật, thời lượng ván                             |
| `ResultScreen.tsx`     | Bảng xếp hạng chung cuộc                                                  |

## Nguyên tắc

Component chỉ đọc state và gọi action của `useGameStore`. Mọi luật chơi nằm ở
`src/core` — nếu thấy mình đang viết `if` về luật trong component thì logic đó
đang đặt sai chỗ.

Mọi action đều trả về `ActionResult { ok, reason }`; hiển thị `reason` cho Host
khi thao tác bị từ chối thay vì để nút bấm im lặng không phản hồi.
