# DANH MỤC & NHẬT KÝ THAY ĐỔI TRANG WEB (DEMO & WEB CHÍNH)

Tài liệu này ghi nhận toàn bộ các hạng mục thay đổi, nâng cấp và đại tu hệ thống trang web. Áp dụng quy trình: **Thực hiện & Kiểm thử trên Bản Demo trước $\rightarrow$ Nghiệm thu hoàn tất $\rightarrow$ Đồng bộ sang Web Chính**.

---

## 1. Tổng quan kế hoạch đại tu hệ thống

* **Mục đích:** Tối ưu hóa trải nghiệm người dùng (UX/UI), chuẩn hóa luồng nghiệp vụ, loại bỏ hoàn toàn các lỗi tồn đọng, tăng cường tính chuyên nghiệp và bảo mật.
* **Môi trường thực thi:**
  * **Bản Demo:** `d:\Vibe code\Lớp học\Gia sư - demo` (GitHub: `https://github.com/zun3017/Giasugioi.git`)
  * **Web Chính:** `d:\Vibe code\Lớp học\Gia sư` (GitHub: `https://github.com/zun3017/Giasu.git` - Database: Supabase)

---

## 2. Bảng theo dõi tiến độ các hạng mục thay đổi

| STT | Phân hệ | Nội dung thay đổi | Trạng thái Demo | Trạng thái Web Chính | Ghi chú |
| :---: | :--- | :--- | :---: | :---: | :--- |
| 1 | **Gia sư** | Tự động định dạng học phí có dấu chấm (`200.000`) | ⏳ Cần đồng bộ |  Đã hoàn thành | Giữ vị trí con trỏ chuột |
| 2 | **Gia sư** | Kiểm tra và chặn trùng Mã bài tập học sinh | ⏳ Cần đồng bộ |  Đã hoàn thành | Kiểm tra đa chiều |
| 3 | **Gia sư** | Cho phép Gia sư tự tải/đổi ảnh mã QR chuyển khoản | ⏳ Cần đồng bộ |  Đã hoàn thành | Không cần admin làm hộ |
| 4 | **Admin** | Thêm nút "Xóa thông báo chạy chữ" (Marquee) | ⏳ Cần đồng bộ |  Đã hoàn thành | Xóa tức thì |
| 5 | **Admin** | Nút Kích hoạt / Vô hiệu hóa Gia sư trực tiếp | ⏳ Cần đồng bộ |  Đã hoàn thành | Nút bấm trên bảng |
| 6 | **Admin** | Định dạng học phí có dấu chấm (`200.000`) | ⏳ Cần đồng bộ |  Đã hoàn thành | Trong modal sửa học sinh |
| 7 | **Hệ thống** | Loại bỏ `billing_type` gây lỗi schema `gs_students` | ⏳ Cần đồng bộ |  Đã hoàn thành | Tránh lỗi PGRST204 |
| 8 | **Hệ thống** | Phân loại tin tức chạy chữ khỏi danh sách phản hồi PH | ⏳ Cần đồng bộ |  Đã hoàn thành | Tách `SYSTEM_MARQUEE` |
| 9 | **Đại tu UI/UX** | *[Kế hoạch mới chuẩn bị triển khai]* | 📝 Chờ yêu cầu | ⏸️ Tạm dừng | Chờ làm trên demo |

*Ký hiệu:  Đã hoàn thành | ⏳ Cần đồng bộ | 📝 Chờ yêu cầu | ⏸️ Tạm dừng*

---

## 3. Chi tiết các hạng mục thay đổi theo từng phân hệ

### 3.1. Phân hệ Gia sư (Tutor Dashboard & Calendar)
1. **Quản lý học phí chuyên nghiệp:**
   * Thay đổi ô nhập học phí từ kiểu số thông thường (`<input type="number">`) sang dạng văn bản số tự động ngắt dấu chấm mỗi 3 chữ số (Ví dụ: `200.000`, `1.500.000`).
   * Tự động hiển thị dấu chấm khi mở modal chỉnh sửa thông tin học sinh.
2. **Chuẩn hóa Mã bài tập:**
   * Cập nhật nhãn rõ ràng: `Mã bài tập (Để trống sẽ tự lấy số điện thoại)`.
   * Tự động kiểm tra trùng lặp: Nếu mã bài tập đã được gán cho học sinh khác, hệ thống sẽ từ chối lưu và yêu cầu nhập mã khác.
3. **Chủ động quản lý mã QR thanh toán:**
   * Gia sư có nút bấm riêng để tải ảnh mã QR tài khoản ngân hàng của chính mình.
   * Tự động lưu trữ và hiển thị ảnh QR này khi phụ huynh hoặc học sinh quét đóng học phí.

### 3.2. Phân hệ Quản trị viên (Admin Dashboard)
1. **Quản lý thông báo chạy chữ:**
   * Bổ sung nút **"Xóa thông báo"** trực tiếp bên cạnh thanh nhập thông báo chạy chữ.
   * Khi bấm xóa, chữ chạy chữ sẽ lập tức biến mất và đồng bộ về cơ sở dữ liệu.
2. **Quản lý trạng thái tài khoản gia sư:**
   * Bổ sung nút bấm trực tiếp tại bảng danh sách: **Vô hiệu hóa** (Đổi sang Đã khóa) hoặc **Kích hoạt lại** (Hoạt động).
   * Không còn tình trạng vô hiệu hóa không nhận hoặc sai lệch định dạng số điện thoại.
3. **Đồng bộ xác nhận thu tiền gia sư:**
   * Nút **"Xác nhận đã thu"** tự động đẩy lùi ngày hết hạn sang chu kỳ tháng tiếp theo (tháng hiện tại + 1) ngay cả khi ngày cũ đã quá hạn từ lâu.

### 3.3. Phân hệ Học sinh & Nộp bài tập (Student & Homework)
1. **Lọc phản hồi ý kiến phụ huynh:**
   * Thông báo chạy chữ hệ thống (`SYSTEM_MARQUEE`) không còn bị hiển thị nhầm lẫn trong danh sách ý kiến đóng góp của phụ huynh.
2. **Cơ chế thùng rác:**
   * Duy trì quy tắc dọn dẹp dữ liệu thùng rác sau 10 ngày để giải phóng bộ nhớ.

---

## 4. Nhật ký các lần cập nhật (Change Log)

* **20/09/2026:**
  * Thêm bộ lọc dấu chấm học phí `200.000` (giữ vị trí con trỏ thông minh).
  * Thêm bộ kiểm soát chống trùng mã bài tập ở cả Frontend và Backend API.
  * Xóa bỏ hoàn toàn cột `billing_type` khỏi payload gửi tới bảng `gs_students`.
  * Khởi tạo bộ 3 tài liệu quản lý đại tu web (`THAY_DOI_WEB.md`, `CHI_TIET_CACH_THAY_DOI.md`, `NHUNG_LOI_KHI_THAY_DOI.md`).
