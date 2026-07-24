# Model nhân vật 3D (.glb) — dùng ở Giai đoạn 2

Mỗi nhân vật trong [`src/core/data/characters.ts`](../../src/core/data/characters.ts)
cần một file `.glb` trùng tên đặt trong thư mục này. Chỉ khai báo nhân vật đã có
sẵn model — nhân vật thiếu file sẽ bị loại khỏi danh sách chọn.

| Nhân vật               | Tên file             |
| ---------------------- | -------------------- |
| Hello Kitty            | `hello-kitty.glb`    |
| Masha                  | `masha.glb`          |
| Pikachu                | `pikachu.glb`        |
| Doraemon               | `doraemon.glb`       |
| Totoro                 | `totoro.glb`         |
| Conan                  | `conan.glb`          |

Muốn thêm nhân vật mới: tải model, đặt file vào đây, rồi thêm một mục vào
`CharacterId` (types.ts) và mảng `CHARACTERS` (characters.ts).

## Lưu ý khi tải model từ Sketchfab

- Chọn định dạng **glTF Binary (.glb)** để gộp sẵn texture vào một file.
- Nén bằng `gltf-transform optimize` hoặc Draco để giữ file dưới ~2 MB, tránh giật khi có 5 quân cờ cùng lúc.
- Chuẩn hóa kích thước quân cờ về khoảng **1 đơn vị chiều cao**, gốc tọa độ đặt dưới chân model.
- Kiểm tra bản quyền: chỉ dùng model có giấy phép cho phép sử dụng phi thương mại (bài tập môn học).
