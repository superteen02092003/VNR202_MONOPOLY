# Model nhân vật 3D (.glb) — dùng ở Giai đoạn 2

Đặt 10 file `.glb` vào đúng thư mục này, tên file phải khớp với `modelUrl`
khai báo trong [`src/core/data/characters.ts`](../../src/core/data/characters.ts):

| Nhân vật               | Tên file             |
| ---------------------- | -------------------- |
| Hello Kitty            | `hello-kitty.glb`    |
| Masha                  | `masha.glb`          |
| Pikachu                | `pikachu.glb`        |
| Doraemon               | `doraemon.glb`       |
| Minion                 | `minion.glb`         |
| Kirby                  | `kirby.glb`          |
| Baymax                 | `baymax.glb`         |
| Totoro                 | `totoro.glb`         |
| Snoopy                 | `snoopy.glb`         |
| Phi hành gia Among Us  | `among-us.glb`       |

## Lưu ý khi tải model từ Sketchfab

- Chọn định dạng **glTF Binary (.glb)** để gộp sẵn texture vào một file.
- Nén bằng `gltf-transform optimize` hoặc Draco để giữ file dưới ~2 MB, tránh giật khi có 5 quân cờ cùng lúc.
- Chuẩn hóa kích thước quân cờ về khoảng **1 đơn vị chiều cao**, gốc tọa độ đặt dưới chân model.
- Kiểm tra bản quyền: chỉ dùng model có giấy phép cho phép sử dụng phi thương mại (bài tập môn học).
