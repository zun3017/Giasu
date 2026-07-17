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
                { date: "02/07/2026", title: "Đề ôn tập số 1 chương Hệ thức lượng", file: "de_on_tap_1.pdf" },
                { date: "05/07/2026", title: "Bài tập Tỉ số lượng giác góc nhọn", file: "ti_so_luong_giac.pdf" },
                { date: "09/07/2026", title: "Hệ thức về cạnh và góc tự luyện", file: "he_thuc_canh_goc.docx" },
                { date: "12/07/2026", title: "Luyện tập tổng hợp chương I nâng cao", file: "tong_hop_chuong_1.pdf" },
                { date: "14/07/2026", title: "Đề thi khảo sát chất lượng giữa kì", file: "de_khao_sat_gk.pdf" },
                { date: "16/07/2026", title: "Phiếu học tập định lí Sin và Cosin", file: "phieu_dinh_li_sin_cos.docx" }
            ],
            submittedHw: [
                { time: "02/07/2026 21:45", title: "Đề ôn tập số 1 chương Hệ thức lượng", file: "nguyenhoangnam_on_tap_1_done.jpg" },
                { time: "05/07/2026 22:10", title: "Bài tập Tỉ số lượng giác góc nhọn", file: "nguyenhoangnam_ti_so_done.jpg" },
                { time: "09/07/2026 20:30", title: "Hệ thức về cạnh và góc tự luyện", file: "nguyenhoangnam_he_thuc_done.zip" },
                { time: "12/07/2026 23:15", title: "Luyện tập tổng hợp chương I nâng cao", file: "nguyenhoangnam_tong_hop_done.pdf" },
                { time: "14/07/2026 19:40", title: "Đề thi khảo sát chất lượng giữa kì", file: "nguyenhoangnam_gk_done.pdf" },
                { time: "16/07/2026 21:05", title: "Phiếu học tập định lí Sin và Cosin", file: "nguyenhoangnam_sin_cos_done.jpg" }
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
    
    // Trạng thái Xem thêm / Thu gọn của các danh sách demo
    let demoStudentLogsShowAll = false;
    let demoTutorShowAllAssigned = false;
    let demoTutorShowAllSubmitted = false;
    let demoHomeworkShowAllAssigned = false;
    let demoHomeworkShowAllSubmitted = false;

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
                } else if (role === "homework") {
                    renderHomeworkDemo();
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
        
        // Tính toán các huy chương/huy hiệu vinh danh giống hệt trang thật
        let gpaVal = parseFloat(student.gpa);
        let gpaBadgeHtml = "";
        if (!isNaN(gpaVal)) {
            if (gpaVal >= 9.0) {
                gpaBadgeHtml = '<div class="medal-badge medal-academic" style="margin-top: 6px;"><i class="fa-solid fa-award"></i> Học giỏi 🎖️</div>';
            } else if (gpaVal >= 8.0) {
                gpaBadgeHtml = '<div class="medal-badge medal-silver" style="margin-top: 6px;"><i class="fa-solid fa-award"></i> Học khá 🎖️</div>';
            } else if (gpaVal >= 7.0) {
                gpaBadgeHtml = '<div class="medal-badge medal-bronze" style="margin-top: 6px;"><i class="fa-solid fa-award"></i> Học TB 🎖️</div>';
            } else {
                gpaBadgeHtml = '<div class="medal-badge" style="margin-top: 6px; background: rgba(255, 51, 51, 0.15); border: 1px solid #FF3333; color: #FF3333; text-shadow: 0 0 5px rgba(255, 51, 51, 0.3);"><i class="fa-solid fa-triangle-exclamation"></i> Học yếu</div>';
            }
        }

        let btvnVal = parseInt(student.btvnRate);
        let btvnBadgeHtml = "";
        if (!isNaN(btvnVal)) {
            if (btvnVal >= 90) {
                btvnBadgeHtml = '<div class="medal-badge medal-gold" style="margin-top: 6px;"><i class="fa-solid fa-medal"></i> Tích cực 🏅</div>';
            } else if (btvnVal >= 80) {
                btvnBadgeHtml = '<div class="medal-badge medal-silver" style="margin-top: 6px;"><i class="fa-solid fa-medal"></i> Chăm chỉ 🏅</div>';
            } else if (btvnVal >= 50) {
                btvnBadgeHtml = '<div class="medal-badge medal-bronze" style="margin-top: 6px;"><i class="fa-solid fa-medal"></i> Cần cố gắng 🏅</div>';
            } else {
                btvnBadgeHtml = '<div class="medal-badge" style="margin-top: 6px; background: rgba(255, 51, 51, 0.15); border: 1px solid #FF3333; color: #FF3333; text-shadow: 0 0 5px rgba(255, 51, 51, 0.3);"><i class="fa-solid fa-circle-exclamation"></i> Lười làm bài</div>';
            }
        }

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
                <p style="color: #A6ADCE; font-size: 13px; text-align: center; margin: 0 0 20px 0; font-family: Inter;">(${student.class} • Số điện thoại: ${student.id})</p>

                <!-- Hộp Thông Báo từ Gia Sư (giống thực tế) -->
                <div class="announcement-box has-msg" style="margin-bottom: 20px;">
                    <div class="announcement-icon"><i class="fa-solid fa-bullhorn"></i></div>
                    <div class="announcement-content">
                        <div class="announcement-title">Thông báo từ gia sư</div>
                        <div class="announcement-text">Phụ huynh nhớ nhắc bé ôn lại chương I trước buổi kiểm tra định kì tuần tới nhé! 📚</div>
                    </div>
                </div>

                <!-- Bảng Tóm Tắt Kết Quả -->
                <div class="summary-grid">
                    <div class="summary-card">
                        <div class="summary-icon icon-purple" style="background: linear-gradient(135deg, #8E4DFF, #5B2EFF); box-shadow: 0 0 20px rgba(142,77,255,0.4);"><i class="fa-solid fa-graduation-cap"></i></div>
                        <div class="summary-info">
                            <span class="summary-label">Điểm trung bình (tháng)</span>
                            <span class="summary-val">${student.gpa}</span>
                            ${gpaBadgeHtml}
                        </div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-icon icon-blue" style="background: linear-gradient(135deg, #33ccff, #0066ff); box-shadow: 0 0 20px rgba(0,102,255,0.4);"><i class="fa-solid fa-list-check"></i></div>
                        <div class="summary-info">
                            <span class="summary-label">Hoàn thành BTVN (tháng)</span>
                            <span class="summary-val">${student.btvnRate}</span>
                            ${btvnBadgeHtml}
                        </div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-icon icon-green" style="background: linear-gradient(135deg, #33ff99, #009933); box-shadow: 0 0 20px rgba(0,153,51,0.4);"><i class="fa-solid fa-calendar-check"></i></div>
                        <div class="summary-info">
                            <span class="summary-label">Số buổi đã học (Tháng ${new Date().getMonth() + 1})</span>
                            <span class="summary-val">${student.buoiHoc} buổi</span>
                        </div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-icon icon-orange" style="background: linear-gradient(135deg, #ffcc66, #ff6600); box-shadow: 0 0 20px rgba(255,102,0,0.4);"><i class="fa-solid fa-calendar-times"></i></div>
                        <div class="summary-info">
                            <span class="summary-label">Số buổi nghỉ (Tháng ${new Date().getMonth() + 1})</span>
                            <span class="summary-val">${student.buoiNghi} buổi</span>
                        </div>
                    </div>
                </div>

                <!-- Biểu Đồ Học Tập -->
                <div class="chart-box" style="background: rgba(11, 8, 38, 0.95); border: 1px solid #8E4DFF; border-radius: 20px; padding: 20px; margin-bottom: 20px; box-shadow: 0 0 30px rgba(91, 46, 255, 0.1);">
                    <div class="chart-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 10px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <i class="fa-solid fa-chart-line" style="color: #8E4DFF; font-size: 18px;"></i>
                            <h4 style="margin: 0; color: #FFF; font-size: 14px; font-weight: 600;">Biểu đồ điểm số học tập</h4>
                        </div>
                        <div class="chart-instruction" style="font-size: 11.5px; color: #A6ADCE; display:flex; align-items:center; gap:5px;">
                            <i class="fa-solid fa-circle-info" style="color:#8E4DFF;"></i> Nhấn nút điểm để ẩn/hiện đường dữ liệu
                        </div>
                    </div>
                    <!-- Legend Buttons giống trang thật -->
                    <div class="chart-legend-wrapper" style="margin-bottom: 12px;">
                        <div class="chart-legend-container" style="display:flex; gap:8px; flex-wrap:wrap;">
                            <button class="legend-btn active btn-dau-gio" style="display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:20px; border:1px solid #8E4DFF; background:rgba(142,77,255,0.15); color:#A78BFA; font-size:12px; font-weight:600; cursor:pointer; font-family:Inter;">
                                <span style="display:inline-block; width:8px; height:8px; background:#8E4DFF; border-radius:50%;"></span>Điểm đầu giờ
                            </button>
                            <button class="legend-btn active btn-dinh-ki" style="display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:20px; border:1px solid #FFD23F; background:rgba(255,210,63,0.1); color:#FFD23F; font-size:12px; font-weight:600; cursor:pointer; font-family:Inter;">
                                <span style="display:inline-block; width:8px; height:8px; background:#FFD23F; border-radius:50%;"></span>Điểm định kì
                            </button>
                        </div>
                    </div>
                    <div class="chart-canvas-container" style="height: 180px; position: relative;">
                        <canvas id="demoDiemChart"></canvas>
                    </div>
                </div>

                <!-- Lịch sử Đánh giá Học tập -->
                <div class="result-section" style="background: rgba(0,0,0,0.4); padding: 20px; border-radius: 16px; margin-bottom: 20px; border: 1px solid rgba(142, 77, 255, 0.2);">
                    <h4 style="color: #8E4DFF; margin: 0 0 15px 0; font-size: 15px; display: flex; align-items: center; gap: 10px; font-weight: 600;"><i class="fa-solid fa-clock-rotate-left"></i> Lịch sử Đánh giá Học tập</h4>
                    <div class="desktop-table-view">
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
                                    ${(function() {
                                        const sortedLogs = student.logs.slice().reverse();
                                        const limit = demoStudentLogsShowAll ? sortedLogs.length : 5;
                                        const visibleLogs = sortedLogs.slice(0, limit);
                                        let trHtml = visibleLogs.map((log, idx) => `
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
                                        `).join('');
                                        if (sortedLogs.length > 5) {
                                            const remaining = sortedLogs.length - 5;
                                            trHtml += `
                                                <tr>
                                                    <td colspan="8" style="text-align:center; padding:10px;">
                                                        <button onclick="toggleDemoStudentLogs(${!demoStudentLogsShowAll})" style="background:none; border:1px solid #4B5563; color:#FFD23F; padding:6px 20px; border-radius:8px; cursor:pointer; font-size:13px; outline:none;">
                                                            <i class="fa-solid ${demoStudentLogsShowAll ? 'fa-chevron-up' : 'fa-chevron-down'}" style="margin-right:5px;"></i>
                                                            ${demoStudentLogsShowAll ? 'Thu gọn' : 'Xem thêm ' + remaining + ' buổi học cũ hơn'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            `;
                                        }
                                        return trHtml;
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="mobile-cards-view" style="width: 100%;">
                        ${(function() {
                            const sortedLogs = student.logs.slice().reverse();
                            const limit = demoStudentLogsShowAll ? sortedLogs.length : 5;
                            const visibleLogs = sortedLogs.slice(0, limit);
                            let cardHtml = visibleLogs.map((log, idx) => `
                                <div class="accordion-item" style="border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; margin-bottom: 12px; overflow: hidden; background: rgba(255, 255, 255, 0.01);">
                                    <div class="accordion-header" onclick="toggleDemoAccordion(${idx})" style="display:flex; justify-content:space-between; align-items:center; padding:14px 18px; cursor:pointer;">
                                        <div class="accordion-header-title" style="display:flex; flex-direction:column; gap:4px; text-align:left;">
                                            <span style="font-weight:600; color:#FFF;">Tuần ${student.logs.length - idx}</span>
                                            <span class="accordion-header-date" style="font-size:11.5px; color:#A6ADCE;">Ngày: ${log.date}</span>
                                    </div>
                                    <div class="accordion-header-status" style="display:flex; align-items:center; gap:8px;">
                                        <span class="status-badge badge-dahoc">Đã học</span>
                                        <i class="fa-solid fa-chevron-down" id="demo-chevron-${idx}" style="color:#A6ADCE; transition: transform 0.2s;"></i>
                                    </div>
                                </div>
                                <div class="accordion-body" id="demo-accordion-body-${idx}" style="display:none; padding:15px; border-top:1px solid rgba(255,255,255,0.05); background:rgba(255,255,255,0.01); text-align:left;">
                                    <div class="accordion-body-row" style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px;"><span class="accordion-body-label" style="color:#A6ADCE;">Môn học</span><span class="accordion-body-val" style="color:#FFF;">${student.class.split(" ")[1] || "Toán"}</span></div>
                                    <div class="accordion-body-row" style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px;"><span class="accordion-body-label" style="color:#A6ADCE;">Nội dung dạy học & Nhận xét</span><span class="accordion-body-val" style="color:#FFF; font-weight:500;"><strong>${log.topic}</strong>. ${log.comment}</span></div>
                                    <div class="accordion-body-row" style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px;"><span class="accordion-body-label" style="color:#A6ADCE;">Đánh giá BTVN</span><span class="accordion-body-val"><span class="status-badge ${log.btvn === 'Đạt' ? 'badge-hoanthanh' : 'badge-thieu'}">${log.btvn === 'Đạt' ? 'Hoàn thành' : 'Thiếu'}</span></span></div>
                                    <div class="accordion-body-row" style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px;"><span class="accordion-body-label" style="color:#A6ADCE;">Kiểm tra đầu giờ</span><span class="accordion-body-val" style="font-weight:600; color:#A78BFA;">${log.valDG !== null ? log.valDG.toFixed(1) : 'Không có'}</span></div>
                                    <div class="accordion-body-row" style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px;"><span class="accordion-body-label" style="color:#A6ADCE;">Kiểm tra định kì</span><span class="accordion-body-val" style="font-weight:600; color:#FFD23F;">${log.valDK !== null ? log.valDK.toFixed(1) : 'Không có'}</span></div>
                                </div>
                            </div>
                            `).join('');
                            if (sortedLogs.length > 5) {
                                const remaining = sortedLogs.length - 5;
                                cardHtml += `
                                    <div style="text-align:center; padding:10px;">
                                        <button onclick="toggleDemoStudentLogs(${!demoStudentLogsShowAll})" style="background:none; border:1px solid #4B5563; color:#FFD23F; padding:6px 20px; border-radius:8px; cursor:pointer; font-size:13px; width:100%; outline:none;">
                                            <i class="fa-solid ${demoStudentLogsShowAll ? 'fa-chevron-up' : 'fa-chevron-down'}" style="margin-right:5px;"></i>
                                            ${demoStudentLogsShowAll ? 'Thu gọn' : 'Xem thêm ' + remaining + ' buổi học cũ hơn'}
                                        </button>
                                    </div>
                                `;
                            }
                            return cardHtml;
                        })()}
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
 

    // ===== GIAO DIEN NOP BAI TAP (Demo) =====
    let demoHomeworkUploadFile = "";

    function renderHomeworkDemo() {
        var student = demoStudents[currentDemoStudentIndex];
        var contentArea = document.getElementById("demoContentArea");

        var uploadedText = demoHomeworkUploadFile
            ? '<span style="color:#00d2ff; font-size:12px;"><i class="fa-solid fa-file-circle-check" style="margin-right:4px;"></i>' + demoHomeworkUploadFile + '</span>'
            : '<span style="color:#6A6E8D; font-size:12px;">Keo tha hoac click chon file bai tap (JPG, PNG, PDF, Word)...</span>';

        var sortedAssigned = (student.assignedHw || []).slice().reverse();
        var visibleAssigned = sortedAssigned.slice(0, demoHomeworkShowAllAssigned ? sortedAssigned.length : 5);

        var assignedDesktopRows = visibleAssigned.map(function(hw) {
            return '<tr style="border-bottom:1px solid rgba(0,210,255,0.2); color:#E2D1FF;"><td style="padding:12px 16px; font-size:13px;">' + hw.date + '</td><td style="padding:12px 16px; font-size:13px; font-weight:500; color:#FFF;">' + hw.title + '</td><td style="padding:12px 16px; font-size:13px;"><a href="javascript:void(0)" style="color:#FFD23F; text-decoration:none;"><i class="fa-solid fa-file-pdf" style="color:#FF4D4D;"></i> ' + hw.file + '</a></td></tr>';
        }).join('');
        if (sortedAssigned.length > 5) {
            var remA = sortedAssigned.length - 5;
            var showAllA = !demoHomeworkShowAllAssigned;
            assignedDesktopRows += '<tr><td colspan="3" style="text-align:center; padding:10px;"><button onclick="toggleDemoHomeworkAssigned(' + showAllA + ')" style="background:none; border:1px solid #4B5563; color:#00d2ff; padding:6px 20px; border-radius:8px; cursor:pointer; font-size:13px; outline:none;"><i class="fa-solid ' + (demoHomeworkShowAllAssigned ? 'fa-chevron-up' : 'fa-chevron-down') + '" style="margin-right:5px;"></i>' + (demoHomeworkShowAllAssigned ? 'Thu gon' : 'Xem them ' + remA + ' bai cu hon') + '</button></td></tr>';
        }
        if (sortedAssigned.length === 0) {
            assignedDesktopRows = '<tr><td colspan="3" style="padding:20px; text-align:center; color:#A6ADCE;">Gia su chua giao bai tap nao.</td></tr>';
        }

        var assignedMobileCards = visibleAssigned.map(function(hw) {
            return '<div style="border:1px solid rgba(0,210,255,0.15); border-radius:12px; margin-bottom:10px; padding:12px 16px; background:rgba(255,255,255,0.02);"><div style="font-weight:600; color:#FFF; font-size:13.5px; margin-bottom:5px;">' + hw.title + '</div><div style="font-size:11.5px; color:#A6ADCE; display:flex; justify-content:space-between; flex-wrap:wrap; gap:4px;"><span>Ngay giao: ' + hw.date + '</span><span><a href="javascript:void(0)" style="color:#FFD23F; text-decoration:none;">' + hw.file + '</a></span></div></div>';
        }).join('');
        if (sortedAssigned.length > 5) {
            var remA2 = sortedAssigned.length - 5;
            var showAllA2 = !demoHomeworkShowAllAssigned;
            assignedMobileCards += '<div style="text-align:center; padding:10px;"><button onclick="toggleDemoHomeworkAssigned(' + showAllA2 + ')" style="background:none; border:1px solid #4B5563; color:#00d2ff; padding:6px 20px; border-radius:8px; cursor:pointer; font-size:13px; width:100%;">' + (demoHomeworkShowAllAssigned ? 'Thu gon' : 'Xem them ' + remA2 + ' bai cu hon') + '</button></div>';
        }
        if (sortedAssigned.length === 0) {
            assignedMobileCards = '<div style="text-align:center; color:#A6ADCE; padding:20px; font-size:13px;">Gia su chua giao bai tap nao.</div>';
        }

        var sortedSubmitted = (student.submittedHw || []).slice().reverse();
        var visibleSubmitted = sortedSubmitted.slice(0, demoHomeworkShowAllSubmitted ? sortedSubmitted.length : 5);

        var submittedDesktopRows = visibleSubmitted.map(function(hw) {
            return '<tr style="border-bottom:1px solid rgba(0,210,255,0.2); color:#E2D1FF;"><td style="padding:12px 16px; font-size:13px;">' + hw.time + '</td><td style="padding:12px 16px; font-size:13px; font-weight:500; color:#FFF;">' + hw.title + '</td><td style="padding:12px 16px; font-size:13px; color:#FFD23F;"><i class="fa-solid fa-file-image"></i> ' + hw.file + '</td></tr>';
        }).join('');
        if (sortedSubmitted.length > 5) {
            var remS = sortedSubmitted.length - 5;
            var showAllS = !demoHomeworkShowAllSubmitted;
            submittedDesktopRows += '<tr><td colspan="3" style="text-align:center; padding:10px;"><button onclick="toggleDemoHomeworkSubmitted(' + showAllS + ')" style="background:none; border:1px solid #4B5563; color:#00d2ff; padding:6px 20px; border-radius:8px; cursor:pointer; font-size:13px;">' + (demoHomeworkShowAllSubmitted ? 'Thu gon' : 'Xem them ' + remS + ' bai cu hon') + '</button></td></tr>';
        }
        if (sortedSubmitted.length === 0) {
            submittedDesktopRows = '<tr><td colspan="3" style="padding:20px; text-align:center; color:#A6ADCE;">Chua co bai nop nao.</td></tr>';
        }

        var submittedMobileCards = visibleSubmitted.map(function(hw) {
            return '<div style="border:1px solid rgba(0,210,255,0.15); border-radius:12px; margin-bottom:10px; padding:12px 16px; background:rgba(255,255,255,0.02);"><div style="font-weight:600; color:#FFF; font-size:13.5px; margin-bottom:5px;">' + hw.title + '</div><div style="font-size:11.5px; color:#A6ADCE; display:flex; justify-content:space-between; flex-wrap:wrap; gap:4px;"><span>Nop luc: ' + hw.time + '</span><span style="color:#FFD23F;">' + hw.file + '</span></div></div>';
        }).join('');
        if (sortedSubmitted.length > 5) {
            var remS2 = sortedSubmitted.length - 5;
            var showAllS2 = !demoHomeworkShowAllSubmitted;
            submittedMobileCards += '<div style="text-align:center; padding:10px;"><button onclick="toggleDemoHomeworkSubmitted(' + showAllS2 + ')" style="background:none; border:1px solid #4B5563; color:#00d2ff; padding:6px 20px; border-radius:8px; cursor:pointer; font-size:13px; width:100%;">' + (demoHomeworkShowAllSubmitted ? 'Thu gon' : 'Xem them ' + remS2 + ' bai cu hon') + '</button></div>';
        }
        if (sortedSubmitted.length === 0) {
            submittedMobileCards = '<div style="text-align:center; color:#A6ADCE; padding:20px; font-size:13px;">Chua co bai nop nao.</div>';
        }

        contentArea.innerHTML = `
            <div class="simulated-screen" style="background:#03081D; border:1px solid rgba(0,210,255,0.5); border-radius:20px; padding:30px; box-shadow:0 0 50px rgba(0,210,255,0.15);">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:15px; margin-bottom:20px;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <i class="fa-solid fa-book-open-reader" style="color:#00d2ff; font-size:22px;"></i>
                        <span style="font-weight:700; color:#FFF; font-size:14px;">Nop Bai Tap (Demo)</span>
                    </div>
                    <div style="background:rgba(0,210,255,0.15); color:#00d2ff; border:1px solid rgba(0,210,255,0.3); font-size:10px; font-weight:700; padding:2px 8px; border-radius:4px; text-transform:uppercase;"><i class="fa-solid fa-user-graduate"></i> Hoc sinh</div>
                </div>
                <h3 style="color:#00d2ff; font-size:18px; font-weight:800; margin:0 0 5px 0; text-align:center;">Xin chao, <span style="color:#FFF;">${student.name}</span></h3>
                <p style="color:#A6ADCE; font-size:12px; text-align:center; margin:0 0 20px 0;">${student.class} - ${student.id}</p>

                <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(0,210,255,0.2); border-radius:16px; padding:20px; margin-bottom:20px;">
                    <h4 style="color:#00d2ff; font-size:13px; font-weight:700; margin:0 0 14px 0; text-transform:uppercase;"><i class="fa-solid fa-clipboard-list" style="margin-right:6px;"></i>Thong tin bai tap</h4>
                    <div class="desktop-table-view">
                        <div style="width:100%; overflow-x:auto; border-radius:12px;">
                            <table style="width:100%; border-collapse:collapse;">
                                <thead><tr style="background-color:rgba(0,210,255,0.08); color:#FFF;">
                                    <th style="padding:12px 16px; font-size:13px; font-weight:600; text-align:left;">Ngay giao</th>
                                    <th style="padding:12px 16px; font-size:13px; font-weight:600; text-align:left;">Ten bai tap</th>
                                    <th style="padding:12px 16px; font-size:13px; font-weight:600; text-align:left;">File dinh kem</th>
                                </tr></thead>
                                <tbody>${assignedDesktopRows}</tbody>
                            </table>
                        </div>
                    </div>
                    <div class="mobile-cards-view" style="width:100%;">${assignedMobileCards}</div>
                </div>

                <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(0,210,255,0.2); border-radius:16px; padding:20px; margin-bottom:20px;">
                    <h4 style="color:#00d2ff; font-size:13px; font-weight:700; margin:0 0 14px 0; text-transform:uppercase;"><i class="fa-solid fa-cloud-arrow-up" style="margin-right:6px;"></i>Nop bai tap</h4>
                    <div onclick="selectDemoStudentHwFile()" style="padding:20px; border:2px dashed rgba(0,210,255,0.4); border-radius:12px; text-align:center; cursor:pointer; background:rgba(4,2,10,0.6); margin-bottom:15px;">
                        <i class="fa-solid fa-file-arrow-up" style="font-size:24px; color:#00d2ff; margin-bottom:6px; display:block;"></i>
                        <div id="demoStudentHwUploadText">${uploadedText}</div>
                    </div>
                    <button onclick="submitDemoStudentHw()" style="width:100%; padding:12px; background:linear-gradient(90deg,#00d2ff,#0080ff); border:none; color:#FFF; border-radius:10px; font-size:14px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 0 20px rgba(0,210,255,0.4);">
                        <i class="fa-solid fa-paper-plane"></i> Nop bai tap
                    </button>
                    <div id="demoHwSubmitMsg" style="display:none; margin-top:10px; padding:10px; background:rgba(0,204,102,0.1); border:1px solid rgba(0,204,102,0.3); border-radius:8px; color:#00CC66; font-size:13px; text-align:center;">
                        <i class="fa-solid fa-circle-check"></i> Bai tap da nop thanh cong! (Mo phong)
                    </div>
                </div>

                <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(0,210,255,0.2); border-radius:16px; padding:20px;">
                    <h4 style="color:#00d2ff; font-size:13px; font-weight:700; margin:0 0 14px 0; text-transform:uppercase;"><i class="fa-solid fa-history" style="margin-right:6px;"></i>Lich su bai da nop</h4>
                    <div class="desktop-table-view">
                        <div style="width:100%; overflow-x:auto; border-radius:12px;">
                            <table style="width:100%; border-collapse:collapse;">
                                <thead><tr style="background-color:rgba(0,210,255,0.08); color:#FFF;">
                                    <th style="padding:12px 16px; font-size:13px; font-weight:600; text-align:left;">Thoi gian nop</th>
                                    <th style="padding:12px 16px; font-size:13px; font-weight:600; text-align:left;">Ten bai tap</th>
                                    <th style="padding:12px 16px; font-size:13px; font-weight:600; text-align:left;">File da nop</th>
                                </tr></thead>
                                <tbody>${submittedDesktopRows}</tbody>
                            </table>
                        </div>
                    </div>
                    <div class="mobile-cards-view" style="width:100%;">${submittedMobileCards}</div>
                </div>
            </div>
        `;
    }

    window.selectDemoStudentHwFile = function() {
        var mockNames = ["bai_tap_nop.jpg", "homework_photo.png", "bai_lam.pdf", "on_tap_done.docx", "nop_bai.jpg"];
        demoHomeworkUploadFile = mockNames[Math.floor(Math.random() * mockNames.length)];
        var textEl = document.getElementById("demoStudentHwUploadText");
        if (textEl) {
            textEl.innerHTML = '<span style="color:#00d2ff; font-size:12px;"><i class="fa-solid fa-file-circle-check" style="margin-right:4px;"></i>' + demoHomeworkUploadFile + '</span>';
        }
    };

    window.submitDemoStudentHw = function() {
        if (!demoHomeworkUploadFile) {
            alert("Vui long chon file bai tap truoc khi nop! (Mo phong)");
            return;
        }
        var student = demoStudents[currentDemoStudentIndex];
        var now = new Date();
        var timeStr = String(now.getDate()).padStart(2,"0") + "/" + String(now.getMonth()+1).padStart(2,"0") + "/" + now.getFullYear() + " " + String(now.getHours()).padStart(2,"0") + ":" + String(now.getMinutes()).padStart(2,"0");
        var lastTitle = student.assignedHw && student.assignedHw.length > 0 ? student.assignedHw[student.assignedHw.length - 1].title : "Bai tap tu luyen";
        student.submittedHw.push({ time: timeStr, title: lastTitle, file: demoHomeworkUploadFile });
        demoHomeworkUploadFile = "";
        demoHomeworkShowAllSubmitted = false;
        renderHomeworkDemo();
        setTimeout(function() {
            var msg = document.getElementById("demoHwSubmitMsg");
            if (msg) {
                msg.style.display = "block";
                setTimeout(function() { msg.style.display = "none"; }, 3000);
            }
        }, 80);
    };


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
                    <div class="desktop-table-view">
                        <div class="table-wrapper" style="width: 100%; overflow-x: auto; border-radius: 12px;">
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

                    <div class="mobile-cards-view" style="width: 100%; margin-bottom: 20px;">
                        <div class="accordion-item" style="border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; margin-bottom: 12px; overflow: hidden; background: rgba(255, 255, 255, 0.01);">
                            <div class="accordion-header" onclick="toggleDemoTutorScheduleAccordion(0)" style="display:flex; justify-content:space-between; align-items:center; padding:14px 18px; cursor:pointer;">
                                <div class="accordion-header-title" style="display:flex; flex-direction:column; gap:4px; text-align:left;">
                                    <span style="font-weight:600; color:#FFF;">Nguyễn Hoàng Nam</span>
                                    <span class="accordion-header-date" style="font-size:11.5px; color:#A6ADCE;">Thứ 3, Thứ 5</span>
                                </div>
                                <div class="accordion-header-status"><i class="fa-solid fa-chevron-down" id="demo-tutor-sched-chevron-0" style="color:#A6ADCE; transition: transform 0.2s;"></i></div>
                            </div>
                            <div class="accordion-body" id="demo-tutor-sched-body-0" style="display:none; padding:15px; border-top:1px solid rgba(255,255,255,0.05); background:rgba(255,255,255,0.01); text-align:left;">
                                <div class="accordion-body-row" style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px;"><span class="accordion-body-label" style="color:#A6ADCE;">Thứ 3</span><span class="accordion-body-val" style="font-weight:600; color:#10B981;">19:30 - 21:30</span></div>
                                <div class="accordion-body-row" style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px;"><span class="accordion-body-label" style="color:#A6ADCE;">Thứ 5</span><span class="accordion-body-val" style="font-weight:600; color:#10B981;">19:30 - 21:30</span></div>
                            </div>
                        </div>
                        <div class="accordion-item" style="border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; margin-bottom: 12px; overflow: hidden; background: rgba(255, 255, 255, 0.01);">
                            <div class="accordion-header" onclick="toggleDemoTutorScheduleAccordion(1)" style="display:flex; justify-content:space-between; align-items:center; padding:14px 18px; cursor:pointer;">
                                <div class="accordion-header-title" style="display:flex; flex-direction:column; gap:4px; text-align:left;">
                                    <span style="font-weight:600; color:#FFF;">Lê Minh Thư</span>
                                    <span class="accordion-header-date" style="font-size:11.5px; color:#A6ADCE;">Thứ 4, Thứ 6</span>
                                </div>
                                <div class="accordion-header-status"><i class="fa-solid fa-chevron-down" id="demo-tutor-sched-chevron-1" style="color:#A6ADCE; transition: transform 0.2s;"></i></div>
                            </div>
                            <div class="accordion-body" id="demo-tutor-sched-body-1" style="display:none; padding:15px; border-top:1px solid rgba(255,255,255,0.05); background:rgba(255,255,255,0.01); text-align:left;">
                                <div class="accordion-body-row" style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px;"><span class="accordion-body-label" style="color:#A6ADCE;">Thứ 4</span><span class="accordion-body-val" style="font-weight:600; color:#10B981;">18:00 - 20:00</span></div>
                                <div class="accordion-body-row" style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px;"><span class="accordion-body-label" style="color:#A6ADCE;">Thứ 6</span><span class="accordion-body-val" style="font-weight:600; color:#10B981;">18:00 - 20:00</span></div>
                            </div>
                        </div>
                        <div class="accordion-item" style="border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; margin-bottom: 12px; overflow: hidden; background: rgba(255, 255, 255, 0.01);">
                            <div class="accordion-header" onclick="toggleDemoTutorScheduleAccordion(2)" style="display:flex; justify-content:space-between; align-items:center; padding:14px 18px; cursor:pointer;">
                                <div class="accordion-header-title" style="display:flex; flex-direction:column; gap:4px; text-align:left;">
                                    <span style="font-weight:600; color:#FFF;">Phạm Hải Đăng</span>
                                    <span class="accordion-header-date" style="font-size:11.5px; color:#A6ADCE;">Thứ 2, Thứ 6</span>
                                </div>
                                <div class="accordion-header-status"><i class="fa-solid fa-chevron-down" id="demo-tutor-sched-chevron-2" style="color:#A6ADCE; transition: transform 0.2s;"></i></div>
                            </div>
                            <div class="accordion-body" id="demo-tutor-sched-body-2" style="display:none; padding:15px; border-top:1px solid rgba(255,255,255,0.05); background:rgba(255,255,255,0.01); text-align:left;">
                                <div class="accordion-body-row" style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px;"><span class="accordion-body-label" style="color:#A6ADCE;">Thứ 2</span><span class="accordion-body-val" style="font-weight:600; color:#10B981;">17:00 - 19:00</span></div>
                                <div class="accordion-body-row" style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px;"><span class="accordion-body-label" style="color:#A6ADCE;">Thứ 6</span><span class="accordion-body-val" style="font-weight:600; color:#10B981;">17:00 - 19:00</span></div>
                            </div>
                        </div>
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

                    <!-- Widget Thông báo nhanh cho phụ huynh (giống thực tế) -->
                    <div style="background: rgba(142, 77, 255, 0.08); border: 1px dashed rgba(142, 77, 255, 0.3); border-radius: 12px; padding: 15px; margin-bottom: 20px; display: flex; flex-direction: column; gap: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: #A6ADCE; font-size: 13.5px; font-weight: bold; display: inline-flex; align-items: center; gap: 6px;"><i class="fa-solid fa-bullhorn" style="color: #8E4DFF;"></i> Thông báo nhanh cho phụ huynh (Việc gấp)</span>
                        </div>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap; width: 100%;">
                            <input type="text" placeholder="Ví dụ: Hôm nay nghỉ học nhé phụ huynh ơi..." value="Phụ huynh nhớ nhắc bé ôn bài trước khi kiểm tra nhé! 📚" style="flex: 1; min-width: 250px; padding: 10px 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.25); color: #FFF; font-size: 13.5px; outline: none;">
                            <button style="padding: 10px 20px; background: linear-gradient(135deg, #8E4DFF 0%, #5B21B6 100%); color:#FFF; border:none; border-radius: 8px; font-size:13.5px; font-weight:bold; cursor:pointer; display:inline-flex; align-items:center; gap:8px; box-shadow:0 4px 12px rgba(142,77,255,0.2);" onclick="alert('Đây là tính năng giả lập. Trên thực tế thông báo sẽ được gửi đến phụ huynh!')"><i class="fa-solid fa-paper-plane"></i> Gửi thông báo</button>
                        </div>
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

                                <div class="desktop-table-view">
                                    <div class="table-wrapper" style="width: 100%; overflow-x: auto; border-radius: 12px;">
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
                                                ${(function() {
                                                    const sortedList = (student.assignedHw || []).slice().reverse();
                                                    const limit = demoTutorShowAllAssigned ? sortedList.length : 5;
                                                    const visibleList = sortedList.slice(0, limit);
                                                    let trHtml = visibleList.map(hw => {
                                                        const originalIndex = student.assignedHw.indexOf(hw);
                                                        return `
                                                            <tr style="border-bottom:1px solid rgba(142, 77, 255, 0.2); color:#E2D1FF;">
                                                                <td style="padding:12px 16px; font-size:13px; text-align:left;">${hw.date}</td>
                                                                <td style="padding:12px 16px; font-size:13px; font-weight:500; color:#FFF; text-align:left;">${hw.title}</td>
                                                                <td style="padding:12px 16px; font-size:13px; text-align:left;"><a href="javascript:void(0)" style="color:#FFD23F; text-decoration:none;"><i class="fa-solid fa-file-pdf" style="color:#FF4D4D;"></i> ${hw.file}</a></td>
                                                                <td style="padding:12px 16px; text-align:center;"><button class="btn-icon-edit" onclick="deleteDemoAssignedHw(${originalIndex})" style="background:none; border:none; color:#FF4D4D; cursor:pointer;" title="Xóa bài tập"><i class="fa-solid fa-trash-can"></i></button></td>
                                                            </tr>
                                                        `;
                                                    }).join('');
                                                    if (sortedList.length > 5) {
                                                        const remaining = sortedList.length - 5;
                                                        trHtml += `
                                                            <tr>
                                                                <td colspan="4" style="text-align:center; padding:10px;">
                                                                    <button onclick="toggleDemoTutorAssignedHw(${!demoTutorShowAllAssigned})" style="background:none; border:1px solid #4B5563; color:#8E4DFF; padding:6px 20px; border-radius:8px; cursor:pointer; font-size:13px; outline:none;">
                                                                        <i class="fa-solid ${demoTutorShowAllAssigned ? 'fa-chevron-up' : 'fa-chevron-down'}" style="margin-right:5px;"></i>
                                                                        ${demoTutorShowAllAssigned ? 'Thu gọn' : 'Xem thêm ' + remaining + ' bài cũ hơn'}
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        `;
                                                    }
                                                    return trHtml;
                                                })()}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div class="mobile-cards-view" style="width: 100%;">
                                    ${(function() {
                                        const sortedList = (student.assignedHw || []).slice().reverse();
                                        const limit = demoTutorShowAllAssigned ? sortedList.length : 5;
                                        const visibleList = sortedList.slice(0, limit);
                                        let cardHtml = visibleList.map(hw => {
                                            const originalIndex = student.assignedHw.indexOf(hw);
                                            return `
                                                <div class="accordion-item" style="border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; margin-bottom: 12px; background: rgba(255, 255, 255, 0.02); padding: 12px 16px; text-align: left;">
                                                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                                                        <span style="font-weight:600; color:#FFF; font-size:13.5px;">${hw.title}</span>
                                                        <button onclick="deleteDemoAssignedHw(${originalIndex})" style="background:none; border:none; color:#FF4D4D; cursor:pointer;" title="Xóa bài tập"><i class="fa-solid fa-trash-can"></i></button>
                                                    </div>
                                                    <div style="font-size:11.5px; color:#A6ADCE; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:4px;">
                                                        <span>Ngày giao: ${hw.date}</span>
                                                        <span>File: <a href="javascript:void(0)" style="color:#FFD23F; text-decoration:none;"><i class="fa-solid fa-file-pdf" style="color:#FF4D4D;"></i> ${hw.file}</a></span>
                                                    </div>
                                                </div>
                                            `;
                                        }).join('');
                                        if (sortedList.length > 5) {
                                            const remaining = sortedList.length - 5;
                                            cardHtml += `
                                                <div style="text-align:center; padding:10px;">
                                                    <button onclick="toggleDemoTutorAssignedHw(${!demoTutorShowAllAssigned})" style="background:none; border:1px solid #4B5563; color:#8E4DFF; padding:6px 20px; border-radius:8px; cursor:pointer; font-size:13px; width:100%; outline:none;">
                                                        <i class="fa-solid ${demoTutorShowAllAssigned ? 'fa-chevron-up' : 'fa-chevron-down'}" style="margin-right:5px;"></i>
                                                        ${demoTutorShowAllAssigned ? 'Thu gọn' : 'Xem thêm ' + remaining + ' bài cũ hơn'}
                                                    </button>
                                                </div>
                                            `;
                                        }
                                        return cardHtml;
                                    })()}
                                </div>
                            `}
                        ` : `
                            <!-- Tab Học sinh nộp bài -->
                            <div class="desktop-table-view">
                                <div class="table-wrapper" style="width: 100%; overflow-x: auto; border-radius: 12px;">
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
                                            ${(function() {
                                                const sortedList = (student.submittedHw || []).slice().reverse();
                                                const limit = demoTutorShowAllSubmitted ? sortedList.length : 5;
                                                const visibleList = sortedList.slice(0, limit);
                                                let trHtml = visibleList.map(hw => `
                                                    <tr style="border-bottom:1px solid rgba(142, 77, 255, 0.2); color:#E2D1FF;">
                                                        <td style="padding:12px 16px; font-size:13px; text-align:left;">${hw.time}</td>
                                                        <td style="padding:12px 16px; font-size:13px; font-weight:500; color:#FFF; text-align:left;">${hw.title}</td>
                                                        <td style="padding:12px 16px; font-size:13px; color:#FFD23F; text-align:left;"><i class="fa-solid fa-file-image"></i> ${hw.file}</td>
                                                        <td style="padding:12px 16px; text-align:center;"><button class="btn-icon-edit" style="background:none; border:none; color:#8E4DFF; cursor:pointer;"><i class="fa-solid fa-cloud-arrow-down"></i></button></td>
                                                    </tr>
                                                `).join('');
                                                if (sortedList.length > 5) {
                                                    const remaining = sortedList.length - 5;
                                                    trHtml += `
                                                        <tr>
                                                            <td colspan="4" style="text-align:center; padding:10px;">
                                                                <button onclick="toggleDemoTutorSubmittedHw(${!demoTutorShowAllSubmitted})" style="background:none; border:1px solid #4B5563; color:#8E4DFF; padding:6px 20px; border-radius:8px; cursor:pointer; font-size:13px; outline:none;">
                                                                    <i class="fa-solid ${demoTutorShowAllSubmitted ? 'fa-chevron-up' : 'fa-chevron-down'}" style="margin-right:5px;"></i>
                                                                    ${demoTutorShowAllSubmitted ? 'Thu gọn' : 'Xem thêm ' + remaining + ' bài cũ hơn'}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    `;
                                                }
                                                return trHtml;
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div class="mobile-cards-view" style="width: 100%;">
                                ${(function() {
                                    const sortedList = (student.submittedHw || []).slice().reverse();
                                    const limit = demoTutorShowAllSubmitted ? sortedList.length : 5;
                                    const visibleList = sortedList.slice(0, limit);
                                    let cardHtml = visibleList.map(hw => `
                                        <div class="accordion-item" style="border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; margin-bottom: 12px; background: rgba(255, 255, 255, 0.02); padding: 12px 16px; text-align: left;">
                                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                                                <span style="font-weight:600; color:#FFF; font-size:13.5px;">${hw.title}</span>
                                                <button style="background:none; border:none; color:#8E4DFF; cursor:pointer;"><i class="fa-solid fa-cloud-arrow-down"></i></button>
                                            </div>
                                            <div style="font-size:11.5px; color:#A6ADCE; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:4px;">
                                                <span>Nộp lúc: ${hw.time}</span>
                                                <span style="color:#FFD23F;"><i class="fa-solid fa-file-image"></i> ${hw.file}</span>
                                            </div>
                                        </div>
                                    `).join('');
                                    if (sortedList.length > 5) {
                                        const remaining = sortedList.length - 5;
                                        cardHtml += `
                                            <div style="text-align:center; padding:10px;">
                                                <button onclick="toggleDemoTutorSubmittedHw(${!demoTutorShowAllSubmitted})" style="background:none; border:1px solid #4B5563; color:#8E4DFF; padding:6px 20px; border-radius:8px; cursor:pointer; font-size:13px; width:100%; outline:none;">
                                                    <i class="fa-solid ${demoTutorShowAllSubmitted ? 'fa-chevron-up' : 'fa-chevron-down'}" style="margin-right:5px;"></i>
                                                    ${demoTutorShowAllSubmitted ? 'Thu gọn' : 'Xem thêm ' + remaining + ' bài cũ hơn'}
                                                </button>
                                            </div>
                                        `;
                                    }
                                    return cardHtml;
                                })()}
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
                        <div class="chart-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 10px;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <i class="fa-solid fa-chart-line" style="color: #8E4DFF; font-size: 18px;"></i>
                                <h4 style="margin: 0; color: #FFF; font-size: 14px; font-weight: 600;">Biểu đồ điểm số học tập</h4>
                            </div>
                            <div style="font-size: 11.5px; color: #A6ADCE; display:flex; align-items:center; gap:5px;">
                                <i class="fa-solid fa-circle-info" style="color:#8E4DFF;"></i> Nhấn nút điểm để ẩn/hiện đường dữ liệu
                            </div>
                        </div>
                        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:12px;">
                            <button style="display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:20px; border:1px solid #8E4DFF; background:rgba(142,77,255,0.15); color:#A78BFA; font-size:12px; font-weight:600; cursor:pointer; font-family:Inter;">
                                <span style="display:inline-block; width:8px; height:8px; background:#8E4DFF; border-radius:50%;"></span>Điểm đầu giờ
                            </button>
                            <button style="display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:20px; border:1px solid #FFD23F; background:rgba(255,210,63,0.1); color:#FFD23F; font-size:12px; font-weight:600; cursor:pointer; font-family:Inter;">
                                <span style="display:inline-block; width:8px; height:8px; background:#FFD23F; border-radius:50%;"></span>Điểm định kì
                            </button>
                        </div>
                        <div class="chart-canvas-container" style="height: 180px; position: relative;">
                            <canvas id="demoDiemChart"></canvas>
                        </div>
                    </div>

                    <!-- Lịch sử Đánh giá / Nhận xét Buổi Học -->
                    <div class="schedule-section" style="margin-top: 30px; margin-bottom: 30px;">
                        <h3 style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; font-family: Inter; color: #8E4DFF; font-size: 18px; margin:0 0 6px 0; font-weight:700;">
                            <span style="display: flex; align-items: center; gap: 10px;"><i class="fa-solid fa-clock-rotate-left"></i> Lịch sử học tập & Nhận xét chi tiết</span>
                            <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                                <button class="btn-refresh-history" onclick="openDemoAddLessonModal()" style="background: linear-gradient(135deg, #8E4DFF 0%, #5B21B6 100%); border: none; color: #FFF; font-weight: bold; border-radius: 20px; padding: 6px 16px; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 10px rgba(142,77,255,0.2); font-size:12px; cursor:pointer; font-family:Inter;"><i class="fa-solid fa-calendar-plus"></i> Thêm buổi học</button>
                                <button class="btn-refresh-history" style="font-size:12px; cursor:pointer; font-family:Inter; border: 1px solid rgba(255,255,255,0.1); background:none; color:#FFF; padding:6px 16px; border-radius:20px;"><i class="fa-solid fa-arrows-rotate"></i> Làm mới</button>
                            </div>
                        </h3>
                        <div class="desktop-table-view">
                            <div class="table-wrapper" style="width: 100%; overflow-x: auto; border-radius: 12px;">
                                <table style="width:100%; border-collapse:collapse; min-width: 800px;">
                                    <thead>
                                        <tr style="background-color: rgba(91, 46, 255, 0.1); color:#FFF;">
                                            <th style="padding:12px 16px; font-size:13px; font-weight:600; text-align: center; width:105px;" title="Tích chọn để đóng học phí hàng loạt cho tất cả các buổi học chưa đóng">
                                                <div style="display:flex; align-items:center; justify-content:center; gap:6px;">
                                                    <input type="checkbox" checked style="cursor: pointer; width:15px; height:15px;">
                                                    <span style="font-size:12px; font-weight:bold; display:inline-flex; align-items:center; gap:4px;"><i class="fa-solid fa-wallet" style="color:#10B981;"></i> Đóng tiền</span>
                                                </div>
                                            </th>
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

                        <div class="mobile-cards-view" style="width: 100%;">
                            <div class="mobile-select-all-container" style="display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; margin-bottom: 12px;">
                                <input type="checkbox" checked style="cursor: pointer; width: 16px; height: 16px;" title="Tích chọn để đóng học phí cho tất cả các buổi">
                                <label style="cursor: pointer; font-size: 13.5px; font-weight: bold; margin: 0; user-select: none; display:inline-flex; align-items:center; gap:6px;"><i class="fa-solid fa-wallet" style="color:#10B981;"></i> Đóng học phí tất cả các buổi</label>
                            </div>
                            ${student.logs.slice().reverse().map((log, idx) => `
                                <div class="accordion-item" style="border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; margin-bottom: 12px; overflow: hidden; background: rgba(255, 255, 255, 0.01);">
                                    <div class="accordion-header" onclick="toggleDemoTutorLogAccordion(${idx})" style="display:flex; justify-content:space-between; align-items:center; padding:14px 18px; cursor:pointer;">
                                        <div style="display: flex; align-items: center;">
                                            <input type="checkbox" checked onclick="event.stopPropagation();" style="margin-right: 8px; width: 16px; height: 16px; cursor: pointer;">
                                            <div class="accordion-header-title" style="display:flex; flex-direction:column; gap:4px; text-align:left;">
                                                <span style="font-weight:600; color:#FFF;">Tuần ${student.logs.length - idx}</span>
                                                <span class="accordion-header-date" style="font-size:11.5px; color:#A6ADCE;">Ngày: ${log.date}</span>
                                            </div>
                                        </div>
                                        <div class="accordion-header-status" style="display:flex; align-items:center; gap:8px;">
                                            <span class="status-badge badge-dahoc">Đã học</span>
                                            <i class="fa-solid fa-chevron-down" id="demo-tutor-chevron-${idx}" style="color:#A6ADCE; transition: transform 0.2s;"></i>
                                        </div>
                                    </div>
                                    <div class="accordion-body" id="demo-tutor-accordion-body-${idx}" style="display:none; padding:15px; border-top:1px solid rgba(255,255,255,0.05); background:rgba(255,255,255,0.01); text-align:left;">
                                        <div class="accordion-body-row" style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px;"><span class="accordion-body-label" style="color:#A6ADCE;">Môn học</span><span class="accordion-body-val" style="color:#FFF;">${student.class.split(" ")[1] || "Toán"}</span></div>
                                        <div class="accordion-body-row" style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px;"><span class="accordion-body-label" style="color:#A6ADCE;">Nội dung dạy học & Nhận xét</span><span class="accordion-body-val" style="color:#FFF; font-weight:500;"><strong>${log.topic}</strong>. ${log.comment}</span></div>
                                        <div class="accordion-body-row" style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px;"><span class="accordion-body-label" style="color:#A6ADCE;">Đánh giá BTVN</span><span class="accordion-body-val"><span class="status-badge ${log.btvn === 'Đạt' ? 'badge-hoanthanh' : 'badge-thieu'}">${log.btvn === 'Đạt' ? 'Hoàn thành' : 'Thiếu'}</span></span></div>
                                        <div class="accordion-body-row" style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px;"><span class="accordion-body-label" style="color:#A6ADCE;">Kiểm tra đầu giờ</span><span class="accordion-body-val" style="font-weight:600; color:#A78BFA;">${log.valDG !== null ? log.valDG.toFixed(1) : 'Không có'}</span></div>
                                        <div class="accordion-body-row" style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px;"><span class="accordion-body-label" style="color:#A6ADCE;">Kiểm tra định kì</span><span class="accordion-body-val" style="font-weight:600; color:#FFD23F;">${log.valDK !== null ? log.valDK.toFixed(1) : 'Không có'}</span></div>
                                        <div style="margin-top: 10px; text-align: right;">
                                            <button class="action-btn-hw" style="border-color:#8E4DFF; color:#8E4DFF; cursor:pointer;" onclick="alert('Đây là tính năng giả lập không thay đổi dữ liệu thật!')"><i class="fa-solid fa-pen-to-square"></i> Chỉnh sửa</button>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
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
 
    // Accordion togglers for Mobile Demo Screen
    window.toggleDemoAccordion = function(idx) {
        const body = document.getElementById("demo-accordion-body-" + idx);
        const chevron = document.getElementById("demo-chevron-" + idx);
        if (body) {
            const isCollapsed = body.style.display === "none" || body.style.display === "";
            body.style.display = isCollapsed ? "block" : "none";
            if (chevron) {
                chevron.style.transform = isCollapsed ? "rotate(180deg)" : "rotate(0deg)";
            }
        }
    };

    window.toggleDemoTutorLogAccordion = function(idx) {
        const body = document.getElementById("demo-tutor-accordion-body-" + idx);
        const chevron = document.getElementById("demo-tutor-chevron-" + idx);
        if (body) {
            const isCollapsed = body.style.display === "none" || body.style.display === "";
            body.style.display = isCollapsed ? "block" : "none";
            if (chevron) {
                chevron.style.transform = isCollapsed ? "rotate(180deg)" : "rotate(0deg)";
            }
        }
    };

    window.toggleDemoTutorScheduleAccordion = function(idx) {
        const body = document.getElementById("demo-tutor-sched-body-" + idx);
        const chevron = document.getElementById("demo-tutor-sched-chevron-" + idx);
        if (body) {
            const isCollapsed = body.style.display === "none" || body.style.display === "";
            body.style.display = isCollapsed ? "block" : "none";
            if (chevron) {
                chevron.style.transform = isCollapsed ? "rotate(180deg)" : "rotate(0deg)";
            }
        }
    };

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

    // ===== Các hàm toggle toàn cục cho nút Xem thêm / Thu gọn =====

    // Toggle danh sách nhật ký buổi học (Giao diện Học sinh)
    window.toggleDemoStudentLogs = function(showAll) {
        demoStudentLogsShowAll = showAll;
        renderStudentDemo();
    };

    // Toggle danh sách bài tập đã giao (Giao diện Gia sư - tab Giao bài)
    window.toggleDemoTutorAssignedHw = function(showAll) {
        demoTutorShowAllAssigned = showAll;
        renderTutorDemo();
    };

    // Toggle danh sách bài nộp của học sinh (Giao diện Gia sư - tab Học sinh nộp bài)
    window.toggleDemoTutorSubmittedHw = function(showAll) {
        demoTutorShowAllSubmitted = showAll;
        renderTutorDemo();
    };

    // Toggle danh sách bài tập được giao (Giao diện Nộp bài tập - phần Thông tin bài tập)
    window.toggleDemoHomeworkAssigned = function(showAll) {
        demoHomeworkShowAllAssigned = showAll;
        renderHomeworkDemo();
    };

    // Toggle danh sách lịch sử bài đã nộp (Giao diện Nộp bài tập - phần Lịch sử nộp)
    window.toggleDemoHomeworkSubmitted = function(showAll) {
        demoHomeworkShowAllSubmitted = showAll;
        renderHomeworkDemo();
    };

})();

