# SỔ TAY CÁC LỖI KHI THAY ĐỔI & CÁCH PHÒNG TRÁNH (DEMO & WEB CHÍNH)

Tài liệu này ghi lại chi tiết **toàn bộ các lỗi thực tế, bẫy kỹ thuật (gotchas)** đã từng xuất hiện trong quá trình phát triển, cùng với nguyên nhân gốc rễ và giải pháp triệt để. Mọi thay đổi trên Bản Demo **phải đối chiếu sổ tay này** trước khi đưa sang Web Chính để tuyệt đối không để xảy ra sự cố.

---

## 1. Danh sách các lỗi đã từng gặp & Bài học xương máu

### Lỗi 1: PostgREST `PGRST204` - Gửi trường không tồn tại trong Schema Database
* **Hiện tượng:** Khi Gia sư thêm hoặc sửa học sinh, hệ thống báo lỗi đỏ:
  > `Lỗi: {"code":"PGRST204","details":null,"hint":null,"message":"Could not find the 'billing_type' column of 'gs_students' in the schema cache"}`
* **Nguyên nhân gốc rễ:**
  * Bảng `gs_students` trên Supabase chỉ có 9 cột: `student_id`, `student_name`, `parent_name`, `parent_phone`, `tutor_phone`, `tuition_fee`, `homework_id`, `announcement`, `deleted_date`.
  * Mã nguồn gửi kèm trường `{ billing_type: 'session' }` trong payload POST/PATCH, Supabase PostgREST từ chối ngay lập tức.
* **Cách phòng tránh cho Web Chính:**
  * **Trước khi gửi bất kỳ payload nào lên Supabase**, bắt buộc phải kiểm tra bảng CSDL có cột đó hay không.
  * Nếu bảng không có cột đó, tuyệt đối không chèn vào object payload.

---

### Lỗi 2: Hiểu nhầm dấu chấm học phí là số thập phân (`200.000` thành `200`)
* **Hiện tượng:** Khi người dùng nhập `200.000` VNĐ, hệ thống lưu vào database chỉ còn `200` VNĐ hoặc `0.2` VNĐ.
* **Nguyên nhân gốc rễ:**
  * Trong JavaScript tiêu chuẩn, dấu chấm `.` là dấu ngăn cách số thập phân (ví dụ `3.14`).
  * Khi chuỗi là `"200.000"`, lệnh `parseFloat("200.000")` sẽ đọc tới dấu chấm và coi `.000` là phần thập phân $\rightarrow$ kết quả là số `200`!
* **Cách phòng tránh cho Web Chính:**
  * Luôn làm sạch chuỗi bằng biểu thức chính quy loại bỏ toàn bộ ký tự không phải số trước khi parse:
    ```javascript
    // ĐÚNG:
    var cleanTuition = String(tuition || "").replace(/\D/g, '');
    var tuitionNum = parseFloat(cleanTuition) || 0; // Ra đúng 200000
    
    // SAI:
    var tuitionNum = parseFloat(tuition); // Ra 200 (SAI NGHIÊM TRỌNG!)
    ```

---

### Lỗi 3: Trình duyệt lưu Cache mã cũ (Stale Browser Cache)
* **Hiện tượng:** Lập trình viên đã sửa code và push lên GitHub, nhưng người dùng hoặc chính mình F5 lại vẫn thấy giao diện cũ và vẫn dính lỗi cũ.
* **Nguyên nhân gốc rễ:**
  * Trình duyệt tự động lưu cache các file `.js`, `.css`, `.html` để tăng tốc tải trang.
  * Nếu đường dẫn file không đổi (`js/api.js`), trình duyệt sẽ dùng bản trong cache chứ không tải bản mới từ máy chủ.
* **Cách phòng tránh cho Web Chính:**
  * Mỗi khi có bất kỳ thay đổi nào trong file JS/CSS, **bắt buộc phải tăng số phiên bản** ở thẻ `<script>` và `<link>`:
    * Ví dụ: `js/api.js?v=2.0.4` $\rightarrow$ `js/api.js?v=2.0.5`.
  * Hướng dẫn người dùng nhấn tổ hợp phím **`Ctrl + F5`** (hoặc `Shift + F5`) để xóa sạch cache trình duyệt.

---

### Lỗi 4: Trùng lặp Mã bài tập (`homework_id`) gây xung đột tài khoản
* **Hiện tượng:** Khi hai học sinh có cùng mã bài tập (hoặc cùng để trống và trùng SĐT), khi đăng nhập vào `homework.html` để nộp bài, hệ thống sẽ tải nhầm bài tập và danh sách nộp của học sinh kia.
* **Nguyên nhân gốc rễ:** Hệ thống không kiểm tra tính duy nhất (unique) của `homework_id` trước khi lưu vào bảng `gs_students`.
* **Cách phòng tránh cho Web Chính:**
  * Bắt buộc có bước kiểm tra chống trùng cả ở giao diện (`js/tutor.js`) và backend (`js/api.js`).
  * Nếu mã đã tồn tại, hiển thị thông báo lỗi rõ ràng và yêu cầu gia sư đặt mã khác.

---

### Lỗi 5: `ReferenceError: functionName is not defined`
* **Hiện tượng:** Bấm vào nút bấm trên giao diện nhưng không có phản hồi, mở Console thấy báo lỗi `Uncaught ReferenceError: clearAdminMarquee is not defined`.
* **Nguyên nhân gốc rễ:**
  * Hàm được viết trong file JS tải sau, hoặc hàm không được gắn vào phạm vi toàn cục (`window.functionName = ...`).
  * Khi sự kiện `onclick="functionName()"` trên HTML được kích hoạt thì hàm chưa sẵn sàng trong DOM.
* **Cách phòng tránh cho Web Chính:**
  * Các hàm gọi trực tiếp từ HTML `onclick` phải luôn được khai báo trên `window`:
    ```javascript
    window.clearAdminMarquee = function() { ... };
    ```
  * Đặt thẻ `<script>` gọi hàm sau khi các thư viện bổ trợ đã được tải xong.

---

### Lỗi 6: Gia hạn thanh toán không nhảy ngày khi ngày cũ đã quá hạn
* **Hiện tượng:** Gia sư có ngày hạn cũ là `15/07/2026`, hiện tại là tháng 9/2026. Khi Admin bấm "Xác nhận đã thu", ngày mới chỉ nhảy thành `15/08/2026` (vẫn trong quá khứ và vẫn bị tính là hết hạn).
* **Nguyên nhân gốc rễ:** Code chỉ cộng thêm 1 tháng duy nhất vào ngày cũ (`oldDate.setMonth(oldDate.getMonth() + 1)`) mà không có vòng lặp kiểm tra xem ngày mới đã vượt qua ngày hiện tại chưa.
* **Cách phòng tránh cho Web Chính:**
  * Sử dụng vòng lặp `do...while`:
    ```javascript
    do {
        nextDate.setMonth(nextDate.getMonth() + 1);
    } while (nextDate <= today);
    ```

---

### Lỗi 7: Thông báo hệ thống bị lẫn vào danh sách phản hồi phụ huynh
* **Hiện tượng:** Admin gửi thông báo chạy chữ trên đầu trang thì dòng chữ đó lại xuất hiện trong danh sách "Ý kiến phản hồi của phụ huynh".
* **Nguyên nhân gốc rễ:** Cả thông báo chạy chữ và ý kiến phụ huynh đều lưu chung trong bảng `gs_feedbacks`, nhưng khi truy vấn không lọc bỏ bản ghi `feedback_id = 'SYSTEM_MARQUEE'`.
* **Cách phòng tránh cho Web Chính:**
  * Luôn lọc dữ liệu trước khi hiển thị:
    ```javascript
    let parentFeedbacks = allFeedbacks.filter(f => f.feedback_id !== 'SYSTEM_MARQUEE');
    ```

---

## 2. Biểu mẫu ghi chép lỗi mới (Dành cho quá trình Đại tu Bản Demo)

Khi thử nghiệm trên Bản Demo, nếu phát sinh bất kỳ lỗi nào, hãy điền vào bảng dưới đây trước khi sửa:

| Ngày | Lỗi gặp phải | Nguyên nhân | File bị ảnh hưởng | Cách sửa triệt để | Đã áp dụng sang Web Chính? |
| :---: | :--- | :--- | :--- | :--- | :---: |
| *20/09* | *PGRST204 column not found* | *Gửi billing_type lên gs_students* | *js/api.js* | *Xóa billing_type khỏi payload* |  Đã xong |
| *20/09* | *Dấu chấm học phí bị hiểu nhầm* | *parseFloat("200.000") = 200* | *js/tutor.js, js/admin.js* | *Dùng replace(/\D/g, '')* |  Đã xong |
| ... | ... | ... | ... | ... | ⏳ Chờ |

---

## 3. Checklist an toàn trước khi đưa code sang Web Chính (Pre-flight Checklist)

Trước khi copy code từ Bản Demo sang Web Chính:
- [ ] **1. Kiểm tra Schema Database:** Không gửi trường nào không có trong bảng Supabase.
- [ ] **2. Kiểm tra ép kiểu số:** Các ô tiền tệ/học phí đã được bóc tách số bằng `replace(/\D/g, '')` chưa?
- [ ] **3. Kiểm tra hàm toàn cục:** Các hàm gắn trên `onclick` đã được gán vào `window` chưa?
- [ ] **4. Tăng số phiên bản cache:** Đã tăng `?v=X.X.X` cho tất cả các file HTML có liên quan chưa?
- [ ] **5. Thử nghiệm thực tế:** Đã thử nghiệm luồng nghiệp vụ trên ít nhất 2 kích thước màn hình (Desktop & Mobile) chưa?
- [ ] **6. Git Commit rõ ràng:** Commit có ghi rõ nội dung thay đổi và không chứa file rác/file tạm.
