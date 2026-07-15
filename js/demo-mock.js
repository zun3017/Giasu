/**
 * MOCK DATA & DEMO INTERACTIVE LOGIC (js/demo-mock.js)
 * Mô phỏng dữ liệu học sinh và gia sư để người dùng tương tác ngay trên Trang chủ
 */

(function() {
    // 1. Kho dữ liệu giả lập (Lưu trữ trong RAM của trình duyệt cho phiên hiện tại)
    let demoStudents = [
        {
            id: "0912345678",
            name: "Nguyễn Hoàng Nam",
            class: "Lớp 9 Toán",
            gpa: "8.6",
            buoiHoc: 12,
            buoiNghi: 1,
            btvnRate: "90%",
            logs: [
                { date: "02/07", topic: "Hệ thức lượng trong tam giác", valDG: 8.0, valDK: 9.0, comment: "Làm bài tốt, chú ý trình bày hình học", btvn: "Đạt" },
                { date: "05/07", topic: "Tỉ số lượng giác góc nhọn", valDG: 9.0, valDK: 8.5, comment: "Hiểu bài nhanh, giải quyết tốt các bài nâng cao", btvn: "Đạt" },
                { date: "09/07", topic: "Hệ thức về cạnh và góc", valDG: 7.0, valDK: 8.0, comment: "Có tiến bộ, cần cẩn thận khi tính toán số thập phân", btvn: "Chưa đạt" },
                { date: "12/07", topic: "Luyện tập tổng hợp chương I", valDG: 9.0, valDK: 9.0, comment: "Xuất sắc, nắm vững lý thuyết và bài tập tự luyện", btvn: "Đạt" }
            ],
            assignedHw: [
                { date: "02/07/2026", title: "Đề ôn tập số 1 chương Hệ thức lượng", file: "de_on_tap_1.pdf" }
            ],
            submittedHw: [
                { time: "02/07/2026 21:45", title: "Đề ôn tập số 1 chương Hệ thức lượng", file: "nguyenhoangnam_on_tap_1_done.jpg" }
            ]
        },
        {
            id: "0987654321",
            name: "Lê Minh Thư",
            class: "Lớp 12 Toán",
            gpa: "7.2",
            buoiHoc: 10,
            buoiNghi: 2,
            btvnRate: "80%",
            logs: [
                { date: "01/07", topic: "Khảo sát sự biến thiên hàm số", valDG: 6.0, valDK: 7.0, comment: "Cần xem lại công thức đạo hàm lượng giác", btvn: "Đạt" },
                { date: "04/07", topic: "Cực trị của hàm số", valDG: 7.0, valDK: 7.5, comment: "Làm bài đầy đủ, còn nhầm lẫn bảng xét dấu", btvn: "Đạt" },
                { date: "08/07", topic: "Giá trị lớn nhất, nhỏ nhất", valDG: 8.0, valDK: 7.0, comment: "Khá hơn, đã biết cách tìm GTLN trên đoạn", btvn: "Đạt" },
                { date: "11/07", topic: "Đường tiệm cận", valDG: 6.5, valDK: 8.0, comment: "Nắm được cách tìm tiệm cận đứng, ngang", btvn: "Chưa nộp" }
            ],
            assignedHw: [
                { date: "02/07/2026", title: "Đề ôn tập số 1 chương Hệ thức lượng", file: "de_on_tap_1.pdf" }
            ],
            submittedHw: [
                { time: "02/07/2026 21:45", title: "Đề ôn tập số 1 chương Hệ thức lượng", file: "leminhthu_on_tap_1_done.jpg" }
            ]
        },
        {
            id: "0905123456",
            name: "Phạm Hải Đăng",
            class: "Lớp 11 Lý",
            gpa: "9.2",
            buoiHoc: 14,
            buoiNghi: 0,
            btvnRate: "100%",
            logs: [
                { date: "03/07", topic: "Điện tích - Định luật Cu-lông", valDG: 9.5, valDK: 9.0, comment: "Rất xuất sắc, giải đề nhanh và đúng phương pháp", btvn: "Đạt" },
                { date: "06/07", topic: "Thuyết electron - ĐL bảo toàn ĐT", valDG: 9.0, valDK: 9.5, comment: "Ý thức học tập tốt, chủ động hỏi bài tập khó", btvn: "Đạt" },
                { date: "10/07", topic: "Điện trường - Cường độ điện trường", valDG: 9.0, valDK: 9.0, comment: "Hiểu bản chất hiện tượng vật lý rất tốt", btvn: "Đạt" }
            ],
            assignedHw: [
                { date: "03/07/2026", title: "Điện tích - Định luật Cu-lông", file: "dien_tich_cu_long.pdf" }
            ],
            submittedHw: [
                { time: "03/07/2026 21:45", title: "Điện tích - Định luật Cu-lông", file: "phamhaidang_cu_long_done.jpg" }
            ]
        }
    ];

    let currentDemoStudentIndex = 0;
    let demoChartInstance = null;
    let demoTutorHwTab = "assign"; // "assign" or "submit"
    let demoTutorHwSubTab = "list"; // "list" or "upload"
    let demoSelectedFileName = ""; // Lưu tên file đính kèm giả lập khi giao bài tập

    // 2. Khởi tạo khi trang tải xong
    document.addEventListener("DOMContentLoaded", function() {
        initTabs();
        initFaqs();
        renderStudentDemo(); // Chạy mặc định demo học sinh
    });

    // 3. Xử lý các tab điều hướng Demo và Hướng dẫn
    function initTabs() {
        // Tab lớn của Widget Trải nghiệm Demo
        const demoTabs = document.querySelectorAll(".demo-tab-btn");
        demoTabs.forEach((tab, index) => {
            tab.addEventListener("click", () => {
                demoTabs.forEach(t => t.classList.remove("active"));
                tab.classList.add("active");
                
                const role = tab.getAttribute("data-role");
                if (role === "student") {
                    renderStudentDemo();
                } else if (role === "tutor") {
                    renderTutorDemo();
                }
            });
        });

        // Tab của mục Hướng dẫn sử dụng
        const guideTabs = document.querySelectorAll(".guide-tab-btn");
        const studentGuide = document.getElementById("guideStudentContainer");
        const tutorGuide = document.getElementById("guideTutorContainer");

        guideTabs.forEach(tab => {
            tab.addEventListener("click", () => {
                guideTabs.forEach(t => t.classList.remove("active"));
                tab.classList.add("active");

                const target = tab.getAttribute("data-target");
                if (target === "student") {
                    studentGuide.style.display = "grid";
                    tutorGuide.style.display = "none";
                } else {
                    studentGuide.style.display = "none";
                    tutorGuide.style.display = "grid";
                }
            });
        });
    }

    // 4. Xử lý hiệu ứng Accordion FAQ
    function initFaqs() {
        const faqQuestions = document.querySelectorAll(".faq-question");
        faqQuestions.forEach(q => {
            q.addEventListener("click", () => {
                const item = q.parentElement;
                const isActive = item.classList.contains("active");
                
                // Thu gọn tất cả các câu hỏi khác trước
                document.querySelectorAll(".faq-item").forEach(i => {
                    i.classList.remove("active");
                    i.querySelector(".faq-answer").style.maxHeight = null;
                });

                if (!isActive) {
                    item.classList.add("active");
                    const answer = item.querySelector(".faq-answer");
                    answer.style.maxHeight = answer.scrollHeight + "px";
                }
            });
        });
    }

    // 5. Render Giao diện Demo Học sinh (Khớp 100% bố cục trang student-dashboard.html)
    function renderStudentDemo() {
        const student = demoStudents[currentDemoStudentIndex];
        const contentArea = document.getElementById("demoContentArea");
        
        contentArea.innerHTML = `
            <div class="simulated-screen" style="background:#06091F; border:1px solid #8E4DFF; border-radius:20px; padding:30px; box-shadow:0 0 50px rgba(91,46,255,0.2);">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:15px; margin-bottom:20px;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="https://cdn-icons-png.flaticon.com/512/3330/3330314.png" width="24" height="24">
                        <span style="font-weight:700; color:#FFF; font-size:14px;">Màn hình PH/HS (Demo)</span>
                    </div>
                    <div class="simulated-badge" style="background:rgba(142,77,255,0.15); color:#A78BFA; border:1px solid rgba(142,77,255,0.3); font-size:10px; font-weight:700; padding:2px 8px; border-radius:4px; text-transform:uppercase;"><i class="fa-solid fa-graduation-cap"></i> Phụ huynh / Học sinh</div>
                </div>

                <h3 style="color: #FFD23F; font-size: 20px; font-weight: 800; margin: 0 0 8px 0; text-align: center; font-family: Inter;">Xin chào, <span style="color: #FFFFFF;">${student.name}</span> 👋</h3>
                <p style="color: #A6ADCE; font-size: 13px; text-align: center; margin: 0 0 25px 0; font-family: Inter;">(Lớp: ${student.class} • Số điện thoại: ${student.id})</p>

                <!-- Bảng Tóm Tắt Kết Quả -->
                <div class="summary-grid">
                    <div class="summary-card">
                        <div class="summary-icon icon-purple" style="background: linear-gradient(135deg, #8E4DFF, #5B2EFF); box-shadow: 0 0 20px rgba(142,77,255,0.4);"><i class="fa-solid fa-graduation-cap"></i></div>
                        <div class="summary-info">
                            <span class="summary-label">Điểm trung bình (theo tháng)</span>
                            <span class="summary-val">${student.gpa}</span>
                        </div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-icon icon-blue" style="background: linear-gradient(135deg, #33ccff, #0066ff); box-shadow: 0 0 20px rgba(0,102,255,0.4);"><i class="fa-solid fa-list-check"></i></div>
                        <div class="summary-info">
                            <span class="summary-label">Hoàn thành BTVN (theo tháng)</span>
                            <span class="summary-val">${student.btvnRate}</span>
                        </div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-icon icon-green" style="background: linear-gradient(135deg, #33ff99, #009933); box-shadow: 0 0 20px rgba(0,153,51,0.4);"><i class="fa-solid fa-calendar-check"></i></div>
                        <div class="summary-info">
                            <span class="summary-label">Số buổi đã học (tháng này)</span>
                            <span class="summary-val">${student.buoiHoc}</span>
                        </div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-icon icon-orange" style="background: linear-gradient(135deg, #ffcc66, #ff6600); box-shadow: 0 0 20px rgba(255,102,0,0.4);"><i class="fa-solid fa-calendar-times"></i></div>
                        <div class="summary-info">
                            <span class="summary-label">Số buổi nghỉ (tháng này)</span>
                            <span class="summary-val">${student.buoiNghi}</span>
                        </div>
                    </div>
                </div>

                <!-- Biểu Đồ Học Tập -->
                <div class="chart-box" style="background: rgba(11, 8, 38, 0.95); border: 1px solid #8E4DFF; border-radius: 20px; padding: 20px; margin-bottom: 20px; box-shadow: 0 0 30px rgba(91, 46, 255, 0.1);">
                    <div class="chart-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <i class="fa-solid fa-chart-line" style="color: #8E4DFF; font-size: 18px;"></i>
                            <h4 style="margin: 0; color: #FFF; font-size: 14px; font-weight: 600;">Biểu đồ điểm số học tập</h4>
                        </div>
                        <div style="display: flex; gap: 10px; font-size: 11px;">
                            <span><span style="display:inline-block; width:8px; height:8px; background:#8E4DFF; border-radius:50%; margin-right:4px;"></span>Đầu giờ</span>
                            <span><span style="display:inline-block; width:8px; height:8px; background:#FFD23F; border-radius:50%; margin-right:4px;"></span>Định kì</span>
                        </div>
                    </div>
                    <div class="chart-canvas-container" style="height: 180px; position: relative;">
                        <canvas id="demoDiemChart"></canvas>
                    </div>
                </div>

                <!-- Lịch sử Đánh giá Học tập -->
                <div class="result-section" style="background: rgba(0,0,0,0.4); padding: 20px; border-radius: 16px; margin-bottom: 20px; border: 1px solid rgba(142, 77, 255, 0.2);">
                    <h4 style="color: #8E4DFF; margin: 0 0 15px 0; font-size: 15px; display: flex; align-items: center; gap: 10px; font-weight: 600;"><i class="fa-solid fa-clock-rotate-left"></i> Lịch sử Đánh giá Học tập</h4>
                    <div class="table-wrapper" style="width: 100%; overflow-x: auto; border-radius: 12px;">
                        <table style="width: 100%; border-collapse: collapse; min-width: 800px;">
                            <thead>
                                <tr style="background-color: rgba(91, 46, 255, 0.1); color: #FFF;">
                                    <th style="padding: 12px 16px; font-weight: 600; text-align: left; font-size: 13px;">Tuần</th>
                                    <th style="padding: 12px 16px; font-weight: 600; text-align: left; font-size: 13px;">Ngày dạy</th>
                                    <th style="padding: 12px 16px; font-weight: 600; text-align: left; font-size: 13px;">Môn</th>
                                    <th style="padding: 12px 16px; font-weight: 600; text-align: left; font-size: 13px;">Nội dung</th>
                                    <th style="padding: 12px 16px; font-weight: 600; text-align: left; font-size: 13px;">Đánh giá BTVN</th>
                                    <th style="padding: 12px 16px; font-weight: 600; text-align: left; font-size: 13px;">KT Đầu giờ</th>
                                    <th style="padding: 12px 16px; font-weight: 600; text-align: left; font-size: 13px;">KT Định kì</th>
                                    <th style="padding: 12px 16px; font-weight: 600; text-align: left; font-size: 13px;">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${student.logs.slice().reverse().map((log, idx) => `
                                    <tr style="border-bottom:1px solid rgba(142, 77, 255, 0.2); color:#E2D1FF;">
                                        <td style="padding:12px 16px; font-size: 13px;">${student.logs.length - idx}</td>
                                        <td style="padding:12px 16px; font-size: 13px; white-space:nowrap;">${log.date}</td>
                                        <td style="padding:12px 16px; font-size: 13px;">${student.class.split(" ")[1] || "Toán"}</td>
                                        <td style="padding:12px 16px; font-size: 13px; font-weight:500; color:#FFF;"><strong>${log.topic}</strong>. ${log.comment}</td>
                                        <td style="padding:12px 16px; font-size: 13px;">
                                            <span class="status-badge ${log.btvn === 'Đạt' ? 'badge-hoanthanh' : 'badge-thieu'}">${log.btvn === 'Đạt' ? 'Hoàn thành' : 'Thiếu'}</span>
                                        </td>
                                        <td style="padding:12px 16px; font-size: 13px; color:#A78BFA; font-weight:700;">${log.valDG !== null ? log.valDG.toFixed(1) : 'Không có'}</td>
                                        <td style="padding:12px 16px; font-size: 13px; color:#FFD23F; font-weight:700;">${log.valDK !== null ? log.valDK.toFixed(1) : 'Không có'}</td>
                                        <td style="padding:12px 16px; font-size: 13px;">
                                            <span class="status-badge badge-dahoc">Đã học</span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Bài kiểm tra & Tài liệu -->
                <div class="result-section" style="background: rgba(0,0,0,0.4); padding: 20px; border-radius: 16px; margin-bottom: 20px; border: 1px solid rgba(142, 77, 255, 0.2);">
                    <h4 style="color: #8E4DFF; margin: 0 0 15px 0; font-size: 15px; display: flex; align-items: center; gap: 10px; font-weight: 600;"><i class="fa-solid fa-file-pdf"></i> Bài kiểm tra & Tài liệu</h4>
                    <div>
                        <div class="bt-item" style="display:flex; justify-content:space-between; align-items:center; padding: 12px 0; border-bottom:1px dashed rgba(142, 77, 255, 0.3);">
                            <div><strong style="color: #FFD23F;">[${student.class.split(" ")[1] || "Toán"}]</strong> <span style="color: #FFF; font-weight: 500; font-size: 14px; margin-left: 8px;">Đề cương ôn tập Giữa kỳ I</span></div>
                            <a class="btn-download" href="javascript:void(0)" style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background: rgba(91, 46, 255, 0.2); color: #FFF; text-decoration: none; border-radius: 20px; font-size: 13px; font-weight: 600; border: 1px solid #8E4DFF;"><i class="fa-solid fa-cloud-arrow-down"></i> Tải về</a>
                        </div>
                        <div class="bt-item" style="display:flex; justify-content:space-between; align-items:center; padding: 12px 0; border-bottom:none;">
                            <div><strong style="color: #FFD23F;">[${student.class.split(" ")[1] || "Toán"}]</strong> <span style="color: #FFF; font-weight: 500; font-size: 14px; margin-left: 8px;">Phiếu tự luyện Hệ thức lượng</span></div>
                            <a class="btn-download" href="javascript:void(0)" style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background: rgba(91, 46, 255, 0.2); color: #FFF; text-decoration: none; border-radius: 20px; font-size: 13px; font-weight: 600; border: 1px solid #8E4DFF;"><i class="fa-solid fa-cloud-arrow-down"></i> Tải về</a>
                        </div>
                    </div>
                </div>

                <!-- Phản hồi từ Phụ huynh -->
                <div class="result-section" style="background: rgba(0,0,0,0.4); padding: 20px; border-radius: 16px; margin-bottom: 20px; border: 1px solid rgba(142, 77, 255, 0.2);">
                    <h4 style="color: #8E4DFF; margin: 0 0 15px 0; font-size: 15px; display: flex; align-items: center; gap: 10px; font-weight: 600;"><i class="fa-regular fa-comment-dots"></i> Phản hồi từ Phụ huynh</h4>
                    <div style="display:flex; gap:12px; margin-top:10px; flex-wrap:wrap;">
                        <textarea placeholder="Nhập ý kiến đóng góp hoặc phản hồi của phụ huynh gửi cho gia sư tại đây..." rows="2" style="flex:1; min-width:240px; background:#04020A; border:1px solid rgba(142, 77, 255, 0.3); border-radius:12px; padding:12px; color:#FFF; font-size:13px; outline:none; resize:none; font-family:sans-serif;"></textarea>
                        <button class="btn-submit" style="padding:0 20px; height:45px; border-radius:12px; font-size:13px; font-weight:bold; background:linear-gradient(135deg, #8E4DFF 0%, #5B21B6 100%); color:#FFF; border:none; cursor:pointer; display:inline-flex; align-items:center; gap:8px;">Gửi phản hồi <i class="fa-regular fa-paper-plane"></i></button>
                    </div>
                </div>

                <button class="btn-back" style="width: 100%; padding: 14px; background: transparent; border: 1px solid #8E4DFF; color: #FFF; border-radius: 25px; font-weight: 600; font-size: 15px; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 10px; margin-top:15px;"><i class="fa-solid fa-arrow-left"></i> Trở Về Màn Hình Chính</button>
            </div>
        `;
 
        renderDemoChart(student.logs);
    }
 
    // 6. Render Giao diện Demo Gia sư (Khớp 100% bố cục trang tutor-dashboard.html)
    function renderTutorDemo() {
        const student = demoStudents[currentDemoStudentIndex];
        const contentArea = document.getElementById("demoContentArea");
        
        contentArea.innerHTML = `
            <div class="simulated-screen" style="background:#06091F; border:1px solid #FFD23F; border-radius:20px; padding:30px; box-shadow:0 0 50px rgba(255,210,63,0.15);">
                <!-- Header -->
                <div class="tutor-header" style="background: rgba(11, 8, 38, 0.95); border: 1px solid #FFD23F; border-radius: 20px; padding: 20px 30px; margin-bottom: 20px; box-shadow: 0 0 30px rgba(255, 210, 63, 0.15); display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <h2 style="color: #FFD23F; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin:0;">Xin chào, Gia sư (Demo)</h2>
                        <p style="color: #A6ADCE; font-size: 14px; margin-top: 5px; margin-bottom:0;">Tổng quan hệ thống giảng dạy</p>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn-back" style="width: auto; padding: 10px 20px; background: rgba(142,77,255,0.1); border-color: #8E4DFF; color:#FFF; font-size:13px; font-weight:600; border-radius:25px; cursor:pointer;"><i class="fa-solid fa-user"></i> Tài khoản</button>
                        <button class="btn-back" style="width: auto; padding: 10px 20px; color:#FFF; font-size:13px; font-weight:600; border-radius:25px; cursor:pointer;"><i class="fa-solid fa-arrow-right-from-bracket"></i> Đăng xuất</button>
                    </div>
                </div>

                <!-- Thời khóa biểu tổng hợp -->
                <div class="schedule-section">
                    <h3 style="color: #8E4DFF; margin: 0 0 15px 0; font-size: 18px; font-weight:700;"><i class="fa-regular fa-calendar-alt"></i> Thời khóa biểu tổng hợp</h3>
                    <div class="table-wrapper desktop-table-view" style="width: 100%; overflow-x: auto; border-radius: 12px;">
                        <table style="width:100%; border-collapse:collapse; min-width: 800px;">
                            <thead>
                                <tr style="background-color: rgba(91, 46, 255, 0.1); color:#FFF;">
                                    <th style="padding:12px 16px; font-size:13px; font-weight:600;">Học sinh</th>
                                    <th style="padding:12px 16px; font-size:13px; font-weight:600;">Thứ 2</th>
                                    <th style="padding:12px 16px; font-size:13px; font-weight:600;">Thứ 3</th>
                                    <th style="padding:12px 16px; font-size:13px; font-weight:600;">Thứ 4</th>
                                    <th style="padding:12px 16px; font-size:13px; font-weight:600;">Thứ 5</th>
                                    <th style="padding:12px 16px; font-size:13px; font-weight:600;">Thứ 6</th>
                                    <th style="padding:12px 16px; font-size:13px; font-weight:600;">Thứ 7</th>
                                    <th style="padding:12px 16px; font-size:13px; font-weight:600;">CN</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style="border-bottom: 1px solid rgba(142, 77, 255, 0.2); color:#E2D1FF;">
                                    <td style="padding:12px 16px; font-weight:bold; color:#FFD23F; font-size:13px;">Nguyễn Hoàng Nam</td>
                                    <td style="padding:12px 16px; font-size:13px;">-</td>
                                    <td style="padding:12px 16px; font-size:13px; color:#10B981; font-weight:500;">19:30 - 21:30</td>
                                    <td style="padding:12px 16px; font-size:13px;">-</td>
                                    <td style="padding:12px 16px; font-size:13px; color:#10B981; font-weight:500;">19:30 - 21:30</td>
                                    <td style="padding:12px 16px; font-size:13px;">-</td>
                                    <td style="padding:12px 16px; font-size:13px;">-</td>
                                    <td style="padding:12px 16px; font-size:13px;">-</td>
                                </tr>
                                <tr style="border-bottom: 1px solid rgba(142, 77, 255, 0.2); color:#E2D1FF;">
                                    <td style="padding:12px 16px; font-weight:bold; color:#FFD23F; font-size:13px;">Lê Minh Thư</td>
                                    <td style="padding:12px 16px; font-size:13px;">-</td>
                                    <td style="padding:12px 16px; font-size:13px;">-</td>
                                    <td style="padding:12px 16px; font-size:13px; color:#10B981; font-weight:500;">18:00 - 20:00</td>
                                    <td style="padding:12px 16px; font-size:13px;">-</td>
                                    <td style="padding:12px 16px; font-size:13px; color:#10B981; font-weight:500;">18:00 - 20:00</td>
                                    <td style="padding:12px 16px; font-size:13px;">-</td>
                                    <td style="padding:12px 16px; font-size:13px;">-</td>
                                </tr>
                                <tr style="border-bottom: none; color:#E2D1FF;">
                                    <td style="padding:12px 16px; font-weight:bold; color:#FFD23F; font-size:13px;">Phạm Hải Đăng</td>
                                    <td style="padding:12px 16px; font-size:13px; color:#10B981; font-weight:500;">17:00 - 19:00</td>
                                    <td style="padding:12px 16px; font-size:13px;">-</td>
                                    <td style="padding:12px 16px; font-size:13px;">-</td>
                                    <td style="padding:12px 16px; font-size:13px;">-</td>
                                    <td style="padding:12px 16px; font-size:13px; color:#10B981; font-weight:500;">17:00 - 19:00</td>
                                    <td style="padding:12px 16px; font-size:13px;">-</td>
                                    <td style="padding:12px 16px; font-size:13px;">-</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Danh sách học sinh điều hướng -->
                <div class="student-buttons-container" style="display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 25px; justify-content: center;">
                    ${demoStudents.map((st, index) => `
                        <button class="student-btn ${index === currentDemoStudentIndex ? 'active' : ''}" data-index="${index}" style="padding: 12px 24px; border-radius: 30px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; border: 1px solid rgba(255,255,255,0.1); color:#FFF; background:${index === currentDemoStudentIndex ? 'linear-gradient(135deg, #8E4DFF, #5B2EFF)' : 'rgba(255, 255, 255, 0.05)'}; box-shadow:${index === currentDemoStudentIndex ? '0 0 20px rgba(142, 77, 255, 0.5)' : 'none'};">
                            ${st.name}
                        </button>
                    `).join('')}
                </div>

                <!-- Khối Chi tiết Học sinh đã chọn -->
                <div style="display: block; position:relative; z-index:50;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 15px; flex-wrap: wrap; gap: 10px;">
                        <h3 style="color: #FFF; margin: 0; display: flex; align-items: center; gap: 10px; font-size: 18px; font-family: Inter;">
                            Học sinh: <span style="color: #FFD23F; font-weight: 800;">${student.name}</span>
                            <button class="btn-icon-edit" title="Sửa thông tin học sinh" style="background:none; border:none; color:#8E4DFF; cursor:pointer; font-size:16px;"><i class="fa-solid fa-pen-to-square"></i></button>
                        </h3>
                        <span style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); border: none; color: #FFF; font-weight: bold; border-radius: 20px; padding: 8px 20px; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 10px rgba(16,185,129,0.2); font-family: 'Inter', sans-serif; cursor: default; font-size:13px;"><i class="fa-solid fa-book"></i> Bài tập</span>
                    </div>

                    <!-- Bảng bài tập của học sinh -->
                    <div style="background: rgba(11, 8, 38, 0.6); border: 1px solid rgba(142, 77, 255, 0.3); border-radius: 16px; padding: 20px; margin-bottom: 25px;">
                        <!-- Menu Tabs thực tế -->
                        <div style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 10px;">
                            <button class="tutor-hw-tab ${demoTutorHwTab === 'assign' ? 'active' : ''}" onclick="switchDemoTutorHwTab('assign')" style="background:none; border:none; color:${demoTutorHwTab === 'assign' ? '#8E4DFF' : '#A6ADCE'}; font-weight:bold; font-size:14px; border-bottom:${demoTutorHwTab === 'assign' ? '2px solid #8E4DFF' : 'none'}; padding-bottom:10px; cursor:pointer; display:flex; align-items:center; gap:6px;"><i class="fa-solid fa-pen-ruler"></i> Giao bài tập</button>
                            <button class="tutor-hw-tab ${demoTutorHwTab === 'submit' ? 'active' : ''}" onclick="switchDemoTutorHwTab('submit')" style="background:none; border:none; color:${demoTutorHwTab === 'submit' ? '#8E4DFF' : '#A6ADCE'}; font-weight:bold; font-size:14px; border-bottom:${demoTutorHwTab === 'submit' ? '2px solid #8E4DFF' : 'none'}; padding-bottom:10px; cursor:pointer; display:flex; align-items:center; gap:6px;"><i class="fa-solid fa-graduation-cap"></i> Học sinh nộp bài</button>
                        </div>
                        
                        ${demoTutorHwTab === 'assign' ? `
                            <!-- Thanh nút chức năng thực tế -->
                            <div style="display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap;">
                                <button onclick="switchDemoTutorHwSubTab('upload')" class="modal-btn ${demoTutorHwSubTab === 'upload' ? 'modal-btn-primary' : 'modal-btn-secondary'}" style="width: auto; font-size: 13px; padding: 8px 16px; cursor:pointer; background:${demoTutorHwSubTab === 'upload' ? 'linear-gradient(135deg, #8E4DFF 0%, #5B21B6 100%)' : 'rgba(255, 255, 255, 0.05)'}; border:${demoTutorHwSubTab === 'upload' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)'}; color:#FFF; border-radius:8px; display:inline-flex; align-items:center; gap:6px;"><i class="fa-solid fa-cloud-arrow-up"></i> Tải bài tập lên</button>
                                <button onclick="switchDemoTutorHwSubTab('list')" class="modal-btn ${demoTutorHwSubTab === 'list' ? 'modal-btn-primary' : 'modal-btn-secondary'}" style="width: auto; font-size: 13px; padding: 8px 16px; cursor:pointer; background:${demoTutorHwSubTab === 'list' ? 'linear-gradient(135deg, #8E4DFF 0%, #5B21B6 100%)' : 'rgba(255, 255, 255, 0.05)'}; border:${demoTutorHwSubTab === 'list' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)'}; color:#FFF; border-radius:8px; display:inline-flex; align-items:center; gap:6px;"><i class="fa-solid fa-list-check"></i> Xem bài tập đã tải</button>
                            </div>

                            ${demoTutorHwSubTab === 'upload' ? `
                                <!-- Form Đăng tải bài tập mới -->
                                <div style="border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); border-radius: 12px; padding: 15px; margin-bottom: 20px;">
                                    <h4 style="color: #FFD23F; margin-top:0; margin-bottom: 15px; font-size: 14px;"><i class="fa-solid fa-folder-plus"></i> Đăng tải bài tập mới (Mô phỏng)</h4>
                                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
                                        <div style="display:flex; flex-direction:column; gap:4px;">
                                            <label style="color:#A6ADCE; font-size:11px;">Tên bài tập *</label>
                                            <input type="text" id="demoAssignHwTitle" placeholder="Ví dụ: Đề ôn tập số 2" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:8px 12px; color:#FFF; font-size:12px; outline:none;">
                                        </div>
                                        <div style="display:flex; flex-direction:column; gap:4px;">
                                            <label style="color:#A6ADCE; font-size:11px;">Ngày phát hành *</label>
                                            <input type="text" id="demoAssignHwDate" placeholder="dd/mm/yyyy" value="${getTodayFormatted()}/2026" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:8px 12px; color:#FFF; font-size:12px; outline:none;">
                                        </div>
                                    </div>
                                    <div style="margin-bottom:15px;">
                                        <label style="color:#A6ADCE; font-size:11px; display:block; margin-bottom:4px;">Chọn file bài tập (Hình ảnh, Word, PDF...) *</label>
                                        <div id="demoHwUploadBox" onclick="selectDemoHwFile()" style="padding: 20px; border: 2px dashed rgba(142, 77, 255, 0.4); border-radius: 12px; text-align: center; cursor: pointer; background: rgba(4,2,10,0.6); transition: 0.3s;">
                                            <i class="fa-solid fa-file-arrow-up" style="font-size: 20px; color: #8E4DFF; margin-bottom: 4px;"></i>
                                            <div id="demoHwUploadText" style="font-size: 11.5px; color: #E2D1FF;">${demoSelectedFileName ? `Đã chọn: ${demoSelectedFileName}` : 'Kéo thả hoặc click chọn file bài tập...'}</div>
                                        </div>
                                    </div>
                                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                                        <button onclick="switchDemoTutorHwSubTab('list')" class="modal-btn modal-btn-secondary" style="width: auto; padding: 6px 15px; font-size: 12.5px; cursor:pointer;">Hủy</button>
                                        <button onclick="submitDemoAssignHw()" class="modal-btn modal-btn-primary" style="width: auto; padding: 6px 15px; font-size: 12.5px; background: linear-gradient(135deg, #8E4DFF 0%, #5B21B6 100%); border:none; color:#FFF; border-radius:6px; cursor:pointer; font-weight:bold;">Giao bài</button>
                                    </div>
                                </div>
                            ` : `
                                <!-- Tiêu đề lịch sử bài tập & Thùng rác -->
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
                                    <h4 style="color:#FFF; font-size:14px; margin:0; display:flex; align-items:center; gap:8px;"><i class="fa-solid fa-list-ol"></i> Lịch sử bài tập đã giao</h4>
                                    <button class="action-btn-hw btn-delete" style="font-size: 12px; cursor:pointer; display:flex; align-items:center; gap:6px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #F87171; padding: 6px 12px; border-radius: 6px; font-weight:600;"><i class="fa-solid fa-trash-can"></i> Thùng rác bài tập</button>
                                </div>

                                <div class="table-wrapper desktop-table-view" style="width: 100%; overflow-x: auto; border-radius: 12px;">
                                    <table style="width:100%; border-collapse:collapse;">
                                        <thead>
                                            <tr style="background-color: rgba(91, 46, 255, 0.1); color:#FFF;">
                                                <th style="padding:12px 16px; font-size:13px; font-weight:600; text-align:left;">Ngày giao</th>
                                                <th style="padding:12px 16px; font-size:13px; font-weight:600; text-align:left;">Tên bài tập</th>
                                                <th style="padding:12px 16px; font-size:13px; font-weight:600; text-align:left;">File đính kèm</th>
                                                <th style="padding:12px 16px; font-size:13px; font-weight:600; text-align:center; width:80px;">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${student.assignedHw && student.assignedHw.length > 0 ? student.assignedHw.map((hw, index) => `
                                                <tr style="border-bottom:1px solid rgba(142, 77, 255, 0.2); color:#E2D1FF;">
                                                    <td style="padding:12px 16px; font-size:13px; text-align:left;">${hw.date}</td>
                                                    <td style="padding:12px 16px; font-size:13px; font-weight:500; color:#FFF; text-align:left;">${hw.title}</td>
                                                    <td style="padding:12px 16px; font-size:13px; text-align:left;"><a href="javascript:void(0)" style="color:#FFD23F; text-decoration:none;"><i class="fa-solid fa-file-pdf" style="color:#FF4D4D;"></i> ${hw.file}</a></td>
                                                    <td style="padding:12px 16px; text-align:center;"><button class="btn-icon-edit" onclick="deleteDemoAssignedHw(${index})" style="background:none; border:none; color:#FF4D4D; cursor:pointer;" title="Xóa bài tập"><i class="fa-solid fa-trash-can"></i></button></td>
                                                </tr>
                                            `).join('') : `
                                                <tr>
                                                    <td colspan="4" style="padding: 20px; text-align: center; color: #A6ADCE;"><i class="fa-solid fa-circle-info"></i> Chưa giao bài tập nào cho học sinh này!</td>
                                                </tr>
                                            `}
                                        </tbody>
                                    </table>
                                </div>
                            `}
                        ` : `
                            <!-- Tiêu đề Học sinh nộp bài -->
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                <h4 style="color:#FFF; font-size:14px; margin:0; display:flex; align-items:center; gap:8px;"><i class="fa-solid fa-list"></i> Các bài tập học sinh đã nộp</h4>
                            </div>

                            <div class="table-wrapper desktop-table-view" style="width: 100%; overflow-x: auto; border-radius: 12px;">
                                <table style="width:100%; border-collapse:collapse;">
                                    <thead>
                                        <tr style="background-color: rgba(91, 46, 255, 0.1); color:#FFF;">
                                            <th style="padding:12px 16px; font-size:13px; font-weight:600; text-align:left;">Thời gian nộp</th>
                                            <th style="padding:12px 16px; font-size:13px; font-weight:600; text-align:left;">Tên bài học</th>
                                            <th style="padding:12px 16px; font-size:13px; font-weight:600; text-align:left;">File nộp bài</th>
                                            <th style="padding:12px 16px; font-size:13px; font-weight:600; text-align:center; width:80px;">Tải về</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${student.submittedHw && student.submittedHw.length > 0 ? student.submittedHw.map(hw => `
                                            <tr style="border-bottom:1px solid rgba(142, 77, 255, 0.2); color:#E2D1FF;">
                                                <td style="padding:12px 16px; font-size:13px; text-align:left;">${hw.time}</td>
                                                <td style="padding:12px 16px; font-size:13px; font-weight:500; color:#FFF; text-align:left;">${hw.title}</td>
                                                <td style="padding:12px 16px; font-size:13px; color:#FFD23F; text-align:left;"><i class="fa-solid fa-file-image"></i> ${hw.file}</td>
                                                <td style="padding:12px 16px; text-align:center;"><button class="btn-icon-edit" style="background:none; border:none; color:#8E4DFF; cursor:pointer;"><i class="fa-solid fa-cloud-arrow-down"></i></button></td>
                                            </tr>
                                        `).join('') : `
                                            <tr>
                                                <td colspan="4" style="padding: 20px; text-align: center; color: #A6ADCE;"><i class="fa-solid fa-circle-info"></i> Chưa có bài nộp nào từ học sinh này.</td>
                                            </tr>
                                        `}
                                    </tbody>
                                </table>
                            </div>
                        `}
                    </div>

                    <!-- Doanh thu & Tóm tắt thống kê lớp của HS -->
                    <div class="summary-grid">
                        <div class="summary-card">
                            <div class="summary-icon icon-purple" style="background: linear-gradient(135deg, #8E4DFF, #5B2EFF); box-shadow: 0 0 20px rgba(142,77,255,0.4);"><i class="fa-solid fa-money-bill-wave"></i></div>
                            <div class="summary-info">
                                <span class="summary-label">Doanh thu dự kiến</span>
                                <span class="summary-val">${(student.buoiHoc * 75000).toLocaleString('vi-VN')}đ</span>
                            </div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-icon icon-green" style="background: linear-gradient(135deg, #33ff99, #009933); box-shadow: 0 0 20px rgba(0,153,51,0.4);"><i class="fa-solid fa-check-circle"></i></div>
                            <div class="summary-info">
                                <span class="summary-label">Đã thanh toán</span>
                                <span class="summary-val">${((student.buoiHoc - 1) * 75000).toLocaleString('vi-VN')}đ</span>
                            </div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-icon icon-orange" style="background: linear-gradient(135deg, #ffcc66, #ff6600); box-shadow: 0 0 20px rgba(255,102,0,0.4);"><i class="fa-solid fa-calendar-check"></i></div>
                            <div class="summary-info">
                                <span class="summary-label">Tỷ lệ đi học</span>
                                <span class="summary-val">${student.btvnRate}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Biểu Đồ Học Tập -->
                    <div class="chart-box" style="background: rgba(11, 8, 38, 0.95); border: 1px solid #8E4DFF; border-radius: 20px; padding: 20px; box-shadow: 0 0 30px rgba(91, 46, 255, 0.1); margin-bottom:30px;">
                        <div class="chart-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <i class="fa-solid fa-chart-line" style="color: #8E4DFF; font-size: 18px;"></i>
                                <h4 style="margin: 0; color: #FFF; font-size: 14px; font-weight: 600;">Biểu đồ điểm số học tập</h4>
                            </div>
                            <div style="display: flex; gap: 10px; font-size: 11px;">
                                <span><span style="display:inline-block; width:8px; height:8px; background:#8E4DFF; border-radius:50%; margin-right:4px;"></span>Đầu giờ</span>
                                <span><span style="display:inline-block; width:8px; height:8px; background:#FFD23F; border-radius:50%; margin-right:4px;"></span>Định kì</span>
                            </div>
                        </div>
                        <div class="chart-canvas-container" style="height: 180px; position: relative;">
                            <canvas id="demoDiemChart"></canvas>
                        </div>
                    </div>

                    <!-- Lịch sử Đánh giá / Nhận xét Buổi Học -->
                    <div class="schedule-section" style="margin-top: 30px; margin-bottom: 30px;">
                        <h3 style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; font-family: Inter; color: #8E4DFF; font-size: 18px; margin:0 0 15px 0; font-weight:700;">
                            <span style="display: flex; align-items: center; gap: 10px;"><i class="fa-solid fa-clock-rotate-left"></i> Lịch sử học tập & Nhận xét chi tiết</span>
                            <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                                <button class="btn-refresh-history" onclick="openDemoAddLessonModal()" style="background: linear-gradient(135deg, #8E4DFF 0%, #5B21B6 100%); border: none; color: #FFF; font-weight: bold; border-radius: 20px; padding: 6px 16px; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 10px rgba(142,77,255,0.2); font-size:12px; cursor:pointer; font-family:Inter;"><i class="fa-solid fa-calendar-plus"></i> Thêm buổi học</button>
                                <button class="btn-refresh-history" style="font-size:12px; cursor:pointer; font-family:Inter; border: 1px solid rgba(255,255,255,0.1); background:none; color:#FFF; padding:6px 16px; border-radius:20px;"><i class="fa-solid fa-arrows-rotate"></i> Làm mới</button>
                            </div>
                        </h3>
                        <div class="table-wrapper" style="width: 100%; overflow-x: auto; border-radius: 12px;">
                            <table style="width:100%; border-collapse:collapse; min-width: 800px;">
                                <thead>
                                    <tr style="background-color: rgba(91, 46, 255, 0.1); color:#FFF;">
                                        <th style="padding:12px 16px; font-size:13px; font-weight:600; text-align: center; width:40px;"><input type="checkbox" checked style="cursor: pointer; width:15px; height:15px;"></th>
                                        <th style="padding:12px 16px; font-size:13px; font-weight:600; text-align: left;">Tuần</th>
                                        <th style="padding:12px 16px; font-size:13px; font-weight:600; text-align: left;">Ngày dạy</th>
                                        <th style="padding:12px 16px; font-size:13px; font-weight:600; text-align: left;">Môn</th>
                                        <th style="padding:12px 16px; font-size:13px; font-weight:600; text-align: left;">Nội dung</th>
                                        <th style="padding:12px 16px; font-size:13px; font-weight:600; text-align: left;">Đánh giá BTVN</th>
                                        <th style="padding:12px 16px; font-size:13px; font-weight:600; text-align: left;">KT Đầu giờ</th>
                                        <th style="padding:12px 16px; font-size:13px; font-weight:600; text-align: left;">KT Định kì</th>
                                        <th style="padding:12px 16px; font-size:13px; font-weight:600; text-align: left;">Trạng thái</th>
                                        <th style="padding:12px 16px; font-size:13px; font-weight:600; text-align: center; width: 50px;">Sửa</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${student.logs.slice().reverse().map((log, idx) => `
                                        <tr style="border-bottom:1px solid rgba(142, 77, 255, 0.2); color:#E2D1FF;">
                                            <td style="padding:12px 16px; text-align: center;"><input type="checkbox" checked style="cursor: pointer; width:15px; height:15px;"></td>
                                            <td style="padding:12px 16px; font-size:13px;">${student.logs.length - idx}</td>
                                            <td style="padding:12px 16px; font-size: 13px; white-space:nowrap;">${log.date}</td>
                                            <td style="padding:12px 16px; font-size: 13px;">${student.class.split(" ")[1] || "Toán"}</td>
                                            <td style="padding:12px 16px; font-size: 13px; font-weight:500; color:#FFF;"><strong>${log.topic}</strong>. ${log.comment}</td>
                                            <td style="padding:12px 16px; font-size: 13px;">
                                                <span class="status-badge ${log.btvn === 'Đạt' ? 'badge-hoanthanh' : 'badge-thieu'}">${log.btvn === 'Đạt' ? 'Hoàn thành' : 'Thiếu'}</span>
                                            </td>
                                            <td style="padding:12px 16px; font-size: 13px; color:#A78BFA; font-weight:700;">${log.valDG !== null ? log.valDG.toFixed(1) : 'Không có'}</td>
                                            <td style="padding:12px 16px; font-size: 13px; color:#FFD23F; font-weight:700;">${log.valDK !== null ? log.valDK.toFixed(1) : 'Không có'}</td>
                                            <td style="padding:12px 16px; font-size: 13px;">
                                                <span class="status-badge badge-dahoc">Đã học</span>
                                            </td>
                                            <td style="padding:12px 16px; text-align:center;"><button class="btn-icon-edit" style="background:none; border:none; color:#8E4DFF; cursor:pointer;"><i class="fa-solid fa-pen-to-square"></i></button></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
 
        // Đăng ký sự kiện chọn học sinh cột trên
        const studentBtns = document.querySelectorAll(".student-btn");
        studentBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                currentDemoStudentIndex = parseInt(btn.getAttribute("data-index"));
                renderTutorDemo(); // Re-render tutor panel
            });
        });
 
        renderDemoChart(student.logs);
    }
 
    // 7. Định nghĩa các hàm toàn cục để đóng mở và xử lý Modal Thêm Buổi Học (Demo)
    window.openDemoAddLessonModal = function() {
        const student = demoStudents[currentDemoStudentIndex];
        
        // Tạo tệp overlay modal
        const modal = document.createElement("div");
        modal.id = "demoAddLessonModalOverlay";
        modal.className = "modal-overlay";
        modal.style.position = "fixed";
        modal.style.top = "0";
        modal.style.left = "0";
        modal.style.width = "100%";
        modal.style.height = "100%";
        modal.style.background = "rgba(4, 2, 10, 0.8)";
        modal.style.display = "flex";
        modal.style.justifyContent = "center";
        modal.style.alignItems = "center";
        modal.style.zIndex = "10000";
        
        modal.innerHTML = `
            <div class="modal-content" style="background:#0b0826; border:2px solid #8e4dff; border-radius:20px; max-width:600px; width:90%; padding:25px; box-shadow:0 0 50px rgba(91,46,255,0.4); font-family: 'Inter', sans-serif; position:relative; z-index:10001; box-sizing:border-box;">
                <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:12px; margin-bottom:15px;">
                    <h3 style="color:#FFD23F; margin:0; font-size:16px; font-weight:800;"><i class="fa-solid fa-calendar-plus"></i> Thêm nhật ký buổi học (Demo)</h3>
                    <button onclick="closeDemoAddLessonModal()" class="modal-close" style="background:none; border:none; color:#FFF; font-size:22px; cursor:pointer;">&times;</button>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
                    <div style="display:flex; flex-direction:column; gap:4px;">
                        <label style="color:#A6ADCE; font-size:11.5px; font-weight:500;">Tuần dạy</label>
                        <input type="text" id="demoLesTuan" placeholder="Ví dụ: 5" value="${student.logs.length + 1}" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:8px 12px; color:#FFF; font-size:12.5px; outline:none;">
                    </div>
                    <div style="display:flex; flex-direction:column; gap:4px;">
                        <label style="color:#A6ADCE; font-size:11.5px; font-weight:500;">Ngày học</label>
                        <input type="text" id="demoLesNgay" placeholder="dd/mm/yyyy" value="${getTodayFormatted()}" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:8px 12px; color:#FFF; font-size:12.5px; outline:none;">
                    </div>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
                    <div style="display:flex; flex-direction:column; gap:4px;">
                        <label style="color:#A6ADCE; font-size:11.5px; font-weight:500;">Môn học</label>
                        <select id="demoLesMon" style="background:#04020a; border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:8px 12px; color:#FFF; font-size:12.5px; outline:none; height:37px;">
                            <option value="Toán học">Toán học</option>
                            <option value="Vật lý">Vật lý</option>
                            <option value="Hóa học">Hóa học</option>
                            <option value="Khoa học tự nhiên">Khoa học tự nhiên</option>
                        </select>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:4px;">
                        <label style="color:#A6ADCE; font-size:11.5px; font-weight:500;">Trạng thái</label>
                        <select id="demoLesTrangThai" style="background:#04020a; border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:8px 12px; color:#FFF; font-size:12.5px; outline:none; height:37px;">
                            <option value="Đã học">Đã học</option>
                            <option value="Học bù">Học bù</option>
                            <option value="Hủy/ nghỉ">Hủy/ nghỉ</option>
                        </select>
                    </div>
                </div>
                <div style="display:flex; flex-direction:column; gap:4px; margin-bottom:12px;">
                    <label style="color:#A6ADCE; font-size:11.5px; font-weight:500;">Đánh giá Bài tập về nhà</label>
                    <select id="demoLesBtvn" style="background:#04020a; border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:8px 12px; color:#FFF; font-size:12.5px; outline:none; height:37px; width:100%;">
                        <option value="Hoàn thành">Hoàn thành</option>
                        <option value="Thiếu">Thiếu</option>
                        <option value="Không làm">Không làm</option>
                        <option value="Phụ huynh nhớ nhắc nhở bé làm bài tập gia sư mới giao">Phụ huynh nhớ nhắc nhở bé làm bài tập gia sư mới giao</option>
                    </select>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
                    <div style="display:flex; flex-direction:column; gap:4px;">
                        <label style="color:#A6ADCE; font-size:11.5px; font-weight:500;">Điểm kiểm tra đầu giờ</label>
                        <input type="text" id="demoLesDiemDau" placeholder="Ví dụ: 8.5 hoặc Không có" value="8.0" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:8px 12px; color:#FFF; font-size:12.5px; outline:none;">
                    </div>
                    <div style="display:flex; flex-direction:column; gap:4px;">
                        <label style="color:#A6ADCE; font-size:11.5px; font-weight:500;">Điểm kiểm tra định kì</label>
                        <input type="text" id="demoLesDiemDinhKi" placeholder="Ví dụ: 9.0 hoặc Không có" value="8.5" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:8px 12px; color:#FFF; font-size:12.5px; outline:none;">
                    </div>
                </div>
                <div style="display:flex; flex-direction:column; gap:4px; margin-bottom:15px;">
                    <label style="color:#A6ADCE; font-size:11.5px; font-weight:500;">Nội dung bài học & Nhận xét</label>
                    <textarea id="demoLesNoiDung" rows="2" placeholder="Nhập nội dung giảng dạy và nhận xét chi tiết..." style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:8px 12px; color:#FFF; font-size:12.5px; outline:none; resize:none; font-family:sans-serif;box-sizing:border-box;width:100%;">Tập trung ôn luyện tốt lý thuyết lượng giác.</textarea>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:8px; border-top:1px solid rgba(255,255,255,0.05); padding-top:12px;">
                    <button onclick="closeDemoAddLessonModal()" style="width:90px; padding:8px; border-radius:6px; font-weight:bold; font-size:12px; border:1px solid rgba(255,255,255,0.1); background:none; color:#FFF; cursor:pointer;">Đóng</button>
                    <button onclick="saveDemoLessonLog()" style="width:110px; padding:8px; border-radius:6px; font-weight:bold; font-size:12px; border:none; background:linear-gradient(135deg, #8E4DFF 0%, #5B21B6 100%); color:#FFF; cursor:pointer;">Cập nhật</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    };

    window.closeDemoAddLessonModal = function() {
        const overlay = document.getElementById("demoAddLessonModalOverlay");
        if (overlay) overlay.remove();
    };

    window.saveDemoLessonLog = function() {
        const dateInput = document.getElementById("demoLesNgay").value.trim() || getTodayFormatted();
        const topicInput = document.getElementById("demoLesTrangThai").value + " - " + document.getElementById("demoLesMon").value;
        const btvnSelect = document.getElementById("demoLesBtvn").value;
        const valDGInput = parseFloat(document.getElementById("demoLesDiemDau").value);
        const valDKInput = parseFloat(document.getElementById("demoLesDiemDinhKi").value);
        const commentText = document.getElementById("demoLesNoiDung").value.trim();

        // Cập nhật cấu trúc logs của student
        const student = demoStudents[currentDemoStudentIndex];
        student.logs.push({
            date: dateInput,
            topic: topicInput,
            valDG: isNaN(valDGInput) ? null : valDGInput,
            valDK: isNaN(valDKInput) ? null : valDKInput,
            btvn: btvnSelect === 'Hoàn thành' ? 'Đạt' : 'Chưa đạt',
            comment: commentText
        });

        // Tính toán lại điểm số
        let sum = 0;
        let count = 0;
        student.logs.forEach(log => {
            if (log.valDK !== null) {
                sum += log.valDK;
                count++;
            }
            if (log.valDG !== null) {
                sum += log.valDG;
                count++;
            }
        });
        if (count > 0) {
            student.gpa = (sum / count).toFixed(1);
        }
        student.buoiHoc += 1;

        closeDemoAddLessonModal();

        // Render lại và tự động chuyển về Giao diện Học sinh để xem sự tiến bộ
        renderTutorDemo();
        setTimeout(() => {
            const studentTab = document.querySelector('.demo-tab-btn[data-role="student"]');
            const tutorTab = document.querySelector('.demo-tab-btn[data-role="tutor"]');
            if (tutorTab && studentTab) {
                tutorTab.classList.remove("active");
                studentTab.classList.add("active");
                renderStudentDemo();
            }
        }, 1200);
    };

    // 7. Các hàm điều khiển tab Bài tập trong giao diện Gia sư Demo

    window.switchDemoTutorHwTab = function(tabName) {
        demoTutorHwTab = tabName;
        demoTutorHwSubTab = "list";
        renderTutorDemo();
    };

    window.switchDemoTutorHwSubTab = function(subTabName) {
        demoTutorHwSubTab = subTabName;
        renderTutorDemo();
    };

    window.selectDemoHwFile = function() {
        // Mô phỏng việc chọn file đính kèm
        demoSelectedFileName = "de_kiem_tra_luyentap_" + Math.floor(Math.random() * 10 + 1) + ".pdf";
        const boxText = document.getElementById("demoHwUploadText");
        if (boxText) {
            boxText.innerHTML = `<span style="color:#10B981; font-weight:bold;"><i class="fa-solid fa-file-pdf"></i> Đã chọn: ${demoSelectedFileName}</span>`;
        }
    };

    window.submitDemoAssignHw = function() {
        const titleInput = document.getElementById("demoAssignHwTitle");
        const dateInput = document.getElementById("demoAssignHwDate");
        const title = titleInput ? titleInput.value.trim() : "";
        const date = dateInput ? dateInput.value.trim() : getTodayFormatted() + "/2026";

        if (!title) {
            alert("Vui lòng nhập tên bài tập!");
            return;
        }

        const student = demoStudents[currentDemoStudentIndex];
        student.assignedHw.push({
            date: date,
            title: title,
            file: demoSelectedFileName || "de_luyentap_macDinh.pdf"
        });

        // Reset
        demoSelectedFileName = "";
        demoTutorHwSubTab = "list";
        renderTutorDemo();
    };

    window.deleteDemoAssignedHw = function(index) {
        const student = demoStudents[currentDemoStudentIndex];
        if (student.assignedHw && student.assignedHw[index]) {
            student.assignedHw.splice(index, 1);
        }
        renderTutorDemo();
    };

    // 8. Vẽ biểu đồ giả lập bằng Chart.js
    function renderDemoChart(logs) {
        // Kiểm tra thư viện Chart.js đã được tải
        if (typeof Chart === 'undefined') {
            console.warn("Chart.js không tìm thấy! Không thể vẽ biểu đồ.");
            return;
        }

        const ctxElement = document.getElementById("demoDiemChart");
        if (!ctxElement) return;

        const ctx = ctxElement.getContext("2d");

        // Dọn dẹp biểu đồ cũ nếu đã tồn tại để tránh xung đột đè nét vẽ
        if (demoChartInstance) {
            demoChartInstance.destroy();
            demoChartInstance = null;
        }

        // Chuẩn bị dữ liệu vẽ
        const labels = [];
        const dataDauGio = [];
        const dataDinhKi = [];

        // Lấy tối đa 5 buổi gần nhất để vẽ biểu đồ cho thoáng
        const activeLogs = logs.slice(-5);
        activeLogs.forEach(log => {
            labels.push(log.date);
            dataDauGio.push(log.valDG);
            dataDinhKi.push(log.valDK);
        });

        demoChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Điểm đầu giờ',
                        data: dataDauGio,
                        borderColor: '#8E4DFF',
                        backgroundColor: 'rgba(142, 77, 255, 0.1)',
                        borderWidth: 2,
                        pointBackgroundColor: '#8E4DFF',
                        pointBorderColor: '#ffffff',
                        pointHoverRadius: 5,
                        tension: 0.3,
                        spanGaps: true
                    },
                    {
                        label: 'Điểm định kì',
                        data: dataDinhKi,
                        borderColor: '#FFD23F',
                        backgroundColor: 'rgba(255, 210, 63, 0.1)',
                        borderWidth: 2,
                        pointBackgroundColor: '#FFD23F',
                        pointBorderColor: '#ffffff',
                        pointHoverRadius: 5,
                        tension: 0.3,
                        spanGaps: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(11, 8, 38, 0.95)',
                        titleFont: { family: 'Inter', weight: 'bold', size: 11 },
                        bodyFont: { family: 'Inter', size: 10 },
                        borderColor: '#8E4DFF',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.03)' },
                        ticks: { color: '#A6ADCE', font: { family: 'Inter', size: 9.5 } }
                    },
                    y: {
                        min: 0,
                        max: 10,
                        grid: { color: 'rgba(255, 255, 255, 0.03)' },
                        ticks: { color: '#A6ADCE', font: { family: 'Inter', size: 9.5 }, stepSize: 2 }
                    }
                }
            }
        });
    }

    // Hàm phụ trợ: Lấy ngày hôm nay định dạng dd/mm
    function getTodayFormatted() {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        return dd + '/' + mm;
    }
})();
