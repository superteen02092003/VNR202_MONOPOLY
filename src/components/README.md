# `src/components` — Lớp UI 2D phủ lên Canvas (Giai đoạn 3)

Toàn bộ giao diện TailwindCSS của Quản trò, render **đè lên** `<Canvas>` 3D
bằng một lớp `absolute inset-0 pointer-events-none`, riêng các panel bật lại
`pointer-events-auto`.

## Các component hiện có

| File                   | Nhiệm vụ                                                                 |
| ---------------------- | ------------------------------------------------------------------------ |
| `LobbyScreen.tsx`      | Sảnh chờ: đội hình, nhân vật, thời lượng và luật nâng cao                  |
| `GameStartOverlay.tsx` | Màn sẵn sàng, thứ tự mở màn và nút bắt đầu đồng hồ/câu hỏi đầu tiên       |
| `GameHud.tsx`          | Top bar, phase stepper, đồng hồ, player rail và nhật ký ván đấu            |
| `ActionDock.tsx`       | Trivia, review đáp án, túi thẻ, xúc xắc, mọi pending action và kết quả     |
| `NoticeCenter.tsx`     | Toast phản hồi không làm gián đoạn luồng chơi                              |
| `BrandLogo.tsx`        | Logo responsive dùng chung ở Lobby và Host Dashboard                      |
| `GameIcon.tsx`         | Bộ icon SVG nội bộ, không phụ thuộc thư viện/asset ngoài                   |

`App.tsx` lazy-load `GameCanvas`, vì vậy scene Three.js không nằm trong bundle ban đầu
của sảnh chờ. UI dùng placeholder nhân vật từ `src/scene/PlaceholderPawn.tsx`; khi file
`.glb` đúng tên xuất hiện trong `public/models`, scene tự dùng model thật mà không phải
đổi layout hay component.

## Nguyên tắc

Component chỉ đọc state và gọi action của `useGameStore`. Mọi luật chơi nằm ở
`src/core` — nếu thấy mình đang viết `if` về luật trong component thì logic đó
đang đặt sai chỗ.

Mọi action đều trả về `ActionResult { ok, reason }`; hiển thị `reason` cho Host
khi thao tác bị từ chối thay vì để nút bấm im lặng không phản hồi.
