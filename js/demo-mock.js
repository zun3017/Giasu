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
            ]
        }
    ];

    let currentDemoStudentIndex = 0;
    let demoChartInstance = null;

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

    // 5. Render Giao diện Demo Học sinh
    function renderStudentDemo() {
        const student = demoStudents[currentDemoStudentIndex];
        const contentArea = document.getElementById("demoContentArea");
        
        contentArea.innerHTML = `
            <div class="simulated-screen">
                <div class="simulated-screen-header">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="https://cdn-icons-png.flaticon.com/512/3330/3330314.png" width="24" height="24">
                        <span style="font-weight:700; color:#FFF; font-size:14px;">Màn hình PH/HS</span>
                    </div>
                    <div class="simulated-badge"><i class="fa-solid fa-graduation-cap"></i> Phụ huynh / Học sinh</div>
                </div>
                <div class="simulated-screen-body">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                        <div>
                            <h3 style="color:#FFD23F; font-size:16px; font-weight:800; margin:0;">Xin chào, ${student.name} 👋</h3>
                            <p style="color:#A6ADCE; font-size:12px; margin:2px 0 0 0;">Lớp học: ${student.class} | SĐT tra cứu: ${student.id}</p>
                        </div>
                        <div style="text-align:right;">
                            <span style="font-size:11px; color:#A6ADCE;">Mẫu dữ liệu mô phỏng</span>
                        </div>
                    </div>

                    <!-- Tóm tắt thống kê học sinh -->
                    <div class="demo-summary-row">
                        <div class="demo-summary-card">
                            <i class="fa-solid fa-star icon-purple icon-purple-glow" style="padding: 6px; border-radius: 6px; font-size: 13px;"></i>
                            <div>
                                <span class="val" style="font-size:15px;">${student.gpa}</span>
                                <span class="lbl" style="font-size:9.5px;">ĐTB môn</span>
                            </div>
                        </div>
                        <div class="demo-summary-card">
                            <i class="fa-solid fa-clipboard-check icon-blue icon-blue-glow" style="padding: 6px; border-radius: 6px; font-size: 13px;"></i>
                            <div>
                                <span class="val" style="font-size:15px;">${student.btvnRate}</span>
                                <span class="lbl" style="font-size:9.5px;">BTVN đạt</span>
                            </div>
                        </div>
                        <div class="demo-summary-card">
                            <i class="fa-solid fa-calendar-check icon-green icon-green-glow" style="padding: 6px; border-radius: 6px; font-size: 13px;"></i>
                            <div>
                                <span class="val" style="font-size:15px;">${student.buoiHoc}</span>
                                <span class="lbl" style="font-size:9.5px;">Số buổi học</span>
                            </div>
                        </div>
                        <div class="demo-summary-card">
                            <i class="fa-solid fa-calendar-times icon-orange icon-orange-glow" style="padding: 6px; border-radius: 6px; font-size: 13px;"></i>
                            <div>
                                <span class="val" style="font-size:15px;">${student.buoiNghi}</span>
                                <span class="lbl" style="font-size:9.5px;">Số buổi nghỉ</span>
                            </div>
                        </div>
                    </div>

                    <!-- Biểu đồ điểm -->
                    <div class="demo-chart-box">
                        <div style="display:flex; justify-content:space-between; margin-bottom:10px; align-items:center;">
                            <span style="font-size:12px; font-weight:700; color:#FFF;"><i class="fa-solid fa-chart-line"></i> Biểu đồ điểm học tập</span>
                            <div style="display:flex; gap:10px; font-size:10px;">
                                <span><span style="display:inline-block; width:8px; height:8px; background:#8E4DFF; border-radius:50%; margin-right:4px;"></span>Đầu giờ</span>
                                <span><span style="display:inline-block; width:8px; height:8px; background:#FFD23F; border-radius:50%; margin-right:4px;"></span>Định kì</span>
                            </div>
                        </div>
                        <div class="demo-chart-container">
                            <canvas id="demoDiemChart"></canvas>
                        </div>
                    </div>

                    <!-- Lịch sử đánh giá -->
                    <div class="demo-history-box" style="margin-top:15px;">
                        <span style="font-size:12px; font-weight:700; color:#FFF; display:block; margin-bottom:8px;"><i class="fa-solid fa-clock-rotate-left"></i> Lịch sử Đánh giá (Chi tiết)</span>
                        <div style="overflow-x:auto; background:rgba(0,0,0,0.2); border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
                            <table style="width:100%; border-collapse:collapse; text-align:left; font-size:11.5px;">
                                <thead>
                                    <tr style="border-bottom:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.02); color:#FFF;">
                                        <th style="padding:8px 10px;">Ngày</th>
                                        <th style="padding:8px 10px;">Bài học</th>
                                        <th style="padding:8px 10px; text-align:center;">Điểm ĐG</th>
                                        <th style="padding:8px 10px; text-align:center;">Điểm ĐK</th>
                                        <th style="padding:8px 10px;">BTVN</th>
                                        <th style="padding:8px 10px;">Nhận xét gia sư</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${student.logs.slice().reverse().map(log => `
                                        <tr style="border-bottom:1px solid rgba(255,255,255,0.04); color:#E2D1FF;">
                                            <td style="padding:8px 10px; white-space:nowrap;">${log.date}</td>
                                            <td style="padding:8px 10px; font-weight:600; color:#FFF;">${log.topic}</td>
                                            <td style="padding:8px 10px; text-align:center; color:#A78BFA; font-weight:700;">${log.valDG !== null ? log.valDG.toFixed(1) : '-'}</td>
                                            <td style="padding:8px 10px; text-align:center; color:#FFD23F; font-weight:700;">${log.valDK !== null ? log.valDK.toFixed(1) : '-'}</td>
                                            <td style="padding:8px 10px;">
                                                <span style="padding:2px 6px; border-radius:4px; font-size:9.5px; font-weight:bold; background:${log.btvn === 'Đạt' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}; color:${log.btvn === 'Đạt' ? '#34D399' : '#F87171'}">${log.btvn}</span>
                                            </td>
                                            <td style="padding:8px 10px; max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${log.comment}">${log.comment}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;

        renderDemoChart(student.logs);
    }

    // 6. Render Giao diện Demo Gia sư
    function renderTutorDemo() {
        const contentArea = document.getElementById("demoContentArea");
        
        contentArea.innerHTML = `
            <div class="simulated-screen">
                <div class="simulated-screen-header">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <i class="fa-solid fa-chalkboard-user" style="color:#8E4DFF;"></i>
                        <span style="font-weight:700; color:#FFF; font-size:14px;">Màn hình Quản lý Gia sư</span>
                    </div>
                    <div class="simulated-badge" style="background:rgba(142,77,255,0.15); color:#A78BFA; border-color:rgba(142,77,255,0.3);"><i class="fa-solid fa-lock"></i> Gia sư đăng nhập</div>
                </div>
                <div class="simulated-screen-body">
                    <div class="demo-tutor-layout">
                        <!-- Cột trái: Chọn học sinh -->
                        <div class="demo-sidebar">
                            <h4>Học sinh của bạn</h4>
                            <div style="display:flex; flex-direction:column;">
                                ${demoStudents.map((st, index) => `
                                    <div class="demo-student-item ${index === currentDemoStudentIndex ? 'active' : ''}" data-index="${index}">
                                        <i class="fa-regular fa-user"></i>
                                        <div>
                                            <strong style="display:block; font-size:12.5px;">${st.name}</strong>
                                            <span style="font-size:10.5px; opacity:0.7;">${st.class}</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            <div style="margin-top:20px; padding:10px; background:rgba(142, 77, 255, 0.05); border:1px dashed rgba(142, 77, 255, 0.2); border-radius:8px;">
                                <p style="font-size:10px; color:#A6ADCE; margin:0; line-height:1.4;">
                                    💡 <strong>Tương tác thử:</strong> Chọn học sinh, nhập điểm mới ở form bên phải rồi nhấn "Cập nhật thử". Hệ thống sẽ vẽ lại đồ thị tức thì!
                                </p>
                            </div>
                        </div>

                        <!-- Cột phải: Form nhập liệu giả lập -->
                        <div class="demo-tutor-form">
                            <h4><i class="fa-regular fa-edit" style="color:#FFD23F;"></i> Nhập điểm & Đánh giá buổi học</h4>
                            <p style="color:#A6ADCE; font-size:11.5px; margin-bottom:15px; line-height:1.4;">
                                Đang thao tác nhập dữ liệu cho học sinh: <span style="color:#FFD23F; font-weight:700;">${demoStudents[currentDemoStudentIndex].name}</span>
                            </p>
                            
                            <form id="demoTutorInputForm">
                                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
                                    <div>
                                        <label style="display:block; font-size:11px; color:#A6ADCE; margin-bottom:4px;">Chủ đề/Bài học *</label>
                                        <input type="text" id="demoTopic" value="Luyện đề tổng hợp số 2" required style="width:100%; padding:8px 10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:6px; color:#FFF; font-size:12px;">
                                    </div>
                                    <div>
                                        <label style="display:block; font-size:11px; color:#A6ADCE; margin-bottom:4px;">Ngày dạy *</label>
                                        <input type="text" id="demoDate" value="${getTodayFormatted()}" required style="width:100%; padding:8px 10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:6px; color:#FFF; font-size:12px;">
                                    </div>
                                </div>

                                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:12px;">
                                    <div>
                                        <label style="display:block; font-size:11px; color:#A6ADCE; margin-bottom:4px;">Điểm đầu giờ (0-10)</label>
                                        <input type="number" id="demoValDG" min="0" max="10" step="0.5" value="8.0" style="width:100%; padding:8px 10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:6px; color:#FFF; font-size:12px;">
                                    </div>
                                    <div>
                                        <label style="display:block; font-size:11px; color:#A6ADCE; margin-bottom:4px;">Điểm định kì (0-10)</label>
                                        <input type="number" id="demoValDK" min="0" max="10" step="0.5" value="8.5" style="width:100%; padding:8px 10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:6px; color:#FFF; font-size:12px;">
                                    </div>
                                    <div>
                                        <label style="display:block; font-size:11px; color:#A6ADCE; margin-bottom:4px;">BTVN về nhà</label>
                                        <select id="demoBtvn" style="width:100%; padding:8px 10px; background:rgba(3,8,29,0.9); border:1px solid rgba(255,255,255,0.08); border-radius:6px; color:#FFF; font-size:12px; height:34px;">
                                            <option value="Đạt">Đạt</option>
                                            <option value="Chưa đạt">Chưa đạt</option>
                                            <option value="Chưa nộp">Chưa nộp</option>
                                        </select>
                                    </div>
                                </div>

                                <div style="margin-bottom:15px;">
                                    <label style="display:block; font-size:11px; color:#A6ADCE; margin-bottom:4px;">Nhận xét chi tiết</label>
                                    <textarea id="demoComment" rows="2" style="width:100%; padding:8px 10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:6px; color:#FFF; font-size:12px; resize:none;">Tập trung làm bài nhanh, tiến bộ phần tính toán đạo hàm</textarea>
                                </div>

                                <button type="submit" style="width:100%; padding:10px; border-radius:8px; border:none; background:linear-gradient(135deg, #10B981 0%, #059669 100%); color:#FFF; font-weight:bold; font-size:12.5px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; box-shadow:0 4px 10px rgba(16,185,129,0.2);">
                                    <i class="fa-solid fa-save"></i> Cập nhật thử (Mô phỏng)
                                </button>
                            </form>
                            <div id="demoSuccessAlert" style="display:none; margin-top:12px; padding:10px; border-radius:6px; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); color:#34D399; font-size:11.5px; text-align:center;">
                                <i class="fa-solid fa-check-circle"></i> Đã cập nhật thành công dữ liệu giả lập cho ${demoStudents[currentDemoStudentIndex].name}!
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Đăng ký sự kiện chọn học sinh cột bên trái
        const studentItems = document.querySelectorAll(".demo-student-item");
        studentItems.forEach(item => {
            item.addEventListener("click", () => {
                currentDemoStudentIndex = parseInt(item.getAttribute("data-index"));
                renderTutorDemo(); // Re-render tutor panel
            });
        });

        // Đăng ký sự kiện nộp biểu mẫu nhập điểm
        const form = document.getElementById("demoTutorInputForm");
        form.addEventListener("submit", function(e) {
            e.preventDefault();
            
            const topic = document.getElementById("demoTopic").value.trim();
            const date = document.getElementById("demoDate").value.trim();
            const valDG = parseFloat(document.getElementById("demoValDG").value);
            const valDK = parseFloat(document.getElementById("demoValDK").value);
            const btvn = document.getElementById("demoBtvn").value;
            const comment = document.getElementById("demoComment").value.trim();
            
            // Cập nhật mảng dữ liệu RAM
            const student = demoStudents[currentDemoStudentIndex];
            student.logs.push({
                date: date,
                topic: topic,
                valDG: isNaN(valDG) ? null : valDG,
                valDK: isNaN(valDK) ? null : valDK,
                btvn: btvn,
                comment: comment
            });

            // Tự động tính toán lại điểm GPA giả lập
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
            
            // Tăng số buổi học giả lập
            student.buoiHoc += 1;

            // Hiển thị thông báo thành công
            const successAlert = document.getElementById("demoSuccessAlert");
            successAlert.style.display = "block";
            
            // Reset alert sau 2.5s
            setTimeout(() => {
                if(successAlert) successAlert.style.display = "none";
                // Chuyển về xem giao diện học sinh để thấy sự thay đổi
                const studentTab = document.querySelector('.demo-tab-btn[data-role="student"]');
                const tutorTab = document.querySelector('.demo-tab-btn[data-role="tutor"]');
                tutorTab.classList.remove("active");
                studentTab.classList.add("active");
                renderStudentDemo();
            }, 2000);
        });
    }

    // 7. Vẽ biểu đồ giả lập bằng Chart.js
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
