var currentChartInstance = null;
var currentStudentName = "";

        function renderStudentView(ketQua) {
                // Hủy biểu đồ cũ nếu có
                if (currentChartInstance) {
                    currentChartInstance.destroy();
                    currentChartInstance = null;
                }

                // Ẩn màn hình chính và các nhân vật 3D nếu tồn tại
                var mainScr = document.getElementById('mainScreen');
                if (mainScr) mainScr.style.display = 'none';
                var deskSurf = document.getElementById('deskSurface');
                if (deskSurf) deskSurf.style.display = 'none';
                var boy = document.getElementById('charBoy');
                if (boy) boy.style.display = 'none';
                var girl = document.getElementById('charGirl');
                if (girl) girl.style.display = 'none';
                
                var headerEl = document.querySelector('.header');
                if (headerEl) headerEl.style.display = 'none';

                // Hiện khung kết quả
                document.getElementById('resultBox').style.display = 'block';
                var studentPhone = sessionStorage.getItem('userPhone') || "";
                if (studentPhone && studentPhone.charAt(0) !== '0' && studentPhone.length === 9) {
                    studentPhone = '0' + studentPhone;
                }
                var lopHoc = "Đang cập nhật";
                if (ketQua.lichSuHocTap && ketQua.lichSuHocTap.length > 0) {
                    for (var k = 0; k < ketQua.lichSuHocTap.length; k++) {
                        if (ketQua.lichSuHocTap[k].mon) {
                            lopHoc = ketQua.lichSuHocTap[k].mon;
                            break;
                        }
                    }
                }
                document.getElementById('loiChao').innerHTML = 
                    "<h3 style='color: #FFD23F; font-size: 20px; font-weight: 800; margin: 0 0 8px 0; text-align: center; font-family: Inter;'>Xin chào, <span style='color: #FFFFFF;'>" + ketQua.tenHocSinh + "</span> 👋</h3>" +
                    "<p style='color: #A6ADCE; font-size: 13px; text-align: center; margin: 0 0 25px 0; font-family: Inter;'>(" + lopHoc + " • Số điện thoại: " + studentPhone + ")</p>";
                currentStudentName = ketQua.tenHocSinh;
                
                // Khôi phục trạng thái active cho các nút legend tùy chọn
                var btnDauGio = document.getElementById('btnLegDauGio');
                var btnDinhKi = document.getElementById('btnLegDinhKi');
                if (btnDauGio && btnDinhKi) {
                    btnDauGio.className = 'legend-btn active btn-dau-gio';
                    btnDinhKi.className = 'legend-btn active btn-dinh-ki';
                }
                
                // --- 1. HIỂN THỊ KHUNG THÔNG BÁO ---
                var khuVucThongBao = document.getElementById('khuVucThongBao');
                var thongBaoText = ketQua.thongBaoHocSinh || "";
                if (thongBaoText.trim() !== "") {
                    khuVucThongBao.innerHTML = 
                        '<div class="announcement-box has-msg">' +
                            '<div class="announcement-icon"><i class="fa-solid fa-bullhorn"></i></div>' +
                            '<div class="announcement-content">' +
                                '<div class="announcement-title">Thông báo từ gia sư</div>' +
                                '<div class="announcement-text">' + thongBaoText + '</div>' +
                            '</div>' +
                        '</div>';
                } else {
                    khuVucThongBao.innerHTML = 
                        '<div class="announcement-box no-msg">' +
                            '<div class="announcement-icon"><i class="fa-regular fa-bell"></i></div>' +
                            '<div class="announcement-content">' +
                                '<div class="announcement-title">Thông báo</div>' +
                                '<div class="announcement-text">Chưa có thông báo</div>' +
                            '</div>' +
                        '</div>';
                }

                // --- 2. TÍNH TOÁN SỐ LIỆU TÓM TẮT THEO THÁNG HIỆN TẠI ---
                var today = new Date();
                var currentMonth = today.getMonth(); // 0 - 11
                var currentYear = today.getFullYear();
                
                // Thiết lập nhãn động cho tháng hiện tại
                document.getElementById('lblBuoiHoc').innerText = "Số buổi đã học (Tháng " + (currentMonth + 1) + ")";
                document.getElementById('lblBuoiNghi').innerText = "Số buổi nghỉ (Tháng " + (currentMonth + 1) + ")";

                var buoiHocThangNay = 0;
                var buoiNghiThangNay = 0;
                var listDiemThangNay = [];
                var tongBTVNThangNay = 0;
                var completedBTVNThangNay = 0;

                ketQua.lichSuHocTap.forEach(function(item) {
                    var parsedDate = null;
                    if (item.ngay) {
                        var cleanStr = item.ngay.split(" ")[0].trim();
                        var parts = cleanStr.split(/[-/]/);
                        if (parts.length === 3) {
                            var y, m;
                            if (parts[0].length === 4) { // YYYY-MM-DD
                                y = parseInt(parts[0], 10);
                                m = parseInt(parts[1], 10) - 1;
                            } else if (parts[2].length === 4) { // DD/MM/YYYY
                                y = parseInt(parts[2], 10);
                                m = parseInt(parts[1], 10) - 1;
                            }
                            if (!isNaN(y) && !isNaN(m)) {
                                parsedDate = { year: y, month: m };
                            }
                        } else if (parts.length === 2) { // DD/MM (ví dụ: 3/7, 10/7)
                            var m = parseInt(parts[1], 10) - 1;
                            var y = currentYear; // Mặc định năm hiện tại
                            if (!isNaN(y) && !isNaN(m)) {
                                parsedDate = { year: y, month: m };
                            }
                        }
                    }
                    
                    if (!parsedDate && item.ngay) {
                        var dateObj = new Date(item.ngay);
                        if (!isNaN(dateObj.getTime())) {
                            parsedDate = { year: dateObj.getFullYear(), month: dateObj.getMonth() };
                        }
                    }

                    // Chỉ tính toán nếu buổi học nằm trong tháng hiện tại
                    if (parsedDate && parsedDate.year === currentYear && parsedDate.month === currentMonth) {
                        var tt = (item.trangThai || "").trim().toLowerCase();
                        if (tt === "đã học" || tt === "học bù") {
                            buoiHocThangNay++;
                        } else if (tt.indexOf("hủy") !== -1 || tt.indexOf("nghỉ") !== -1) {
                            buoiNghiThangNay++;
                        }

                        // Điểm đầu giờ & định kì
                        var scoreDG = parseFloat(item.diemDauGio);
                        var scoreDK = parseFloat(item.diemDinhKi);
                        if (!isNaN(scoreDG) && scoreDG >= 0 && scoreDG <= 10) {
                            listDiemThangNay.push(scoreDG);
                        }
                        if (!isNaN(scoreDK) && scoreDK >= 0 && scoreDK <= 10) {
                            listDiemThangNay.push(scoreDK);
                        }

                        // Đánh giá BTVN
                        var btvnStr = (item.danhGiaBTVN || "").trim().toLowerCase();
                        if (btvnStr !== "") {
                            tongBTVNThangNay++;
                            if (btvnStr.indexOf("hoàn thành") !== -1) {
                                completedBTVNThangNay += 1.0;
                            } else if (btvnStr.indexOf("thiếu") !== -1) {
                                var match = btvnStr.match(/thiếu\s+(\d+)/);
                                if (match) {
                                    var missingCount = parseInt(match[1], 10);
                                    var completedCount = 5 - missingCount;
                                    if (completedCount < 0) completedCount = 0;
                                    completedBTVNThangNay += (completedCount / 5.0);
                                } else {
                                    // Trường hợp ghi mỗi chữ "Thiếu" mà không ghi số lượng cụ thể
                                    completedBTVNThangNay += 0.0;
                                }
                            } else {
                                completedBTVNThangNay += 0.0;
                            }
                        }
                    }
                });

                // Gán chỉ số trung bình điểm (GPA)
                var valGPA = "Chưa có";
                var gpaNumeric = null;
                if (listDiemThangNay.length > 0) {
                    var sum = 0;
                    for (var s = 0; s < listDiemThangNay.length; s++) {
                        sum += listDiemThangNay[s];
                    }
                    gpaNumeric = sum / listDiemThangNay.length;
                    valGPA = gpaNumeric.toFixed(2);
                }
                document.getElementById('valGPA').innerText = valGPA;

                // Gán tỷ lệ BTVN
                var valBTVNText = "Chưa có";
                var btvnPercent = null;
                if (tongBTVNThangNay > 0) {
                    btvnPercent = Math.round((completedBTVNThangNay / tongBTVNThangNay) * 100);
                    valBTVNText = btvnPercent + "%";
                } else if (buoiHocThangNay > 0) {
                    btvnPercent = 0;
                    valBTVNText = "0%";
                }
                document.getElementById('valBTVN').innerText = valBTVNText;

                // Gán số buổi học & nghỉ
                document.getElementById('valBuoiHoc').innerText = buoiHocThangNay + " buổi";
                document.getElementById('valBuoiNghi').innerText = buoiNghiThangNay + " buổi";

                // Sinh huy chương vinh danh động
                var gpaBadgeHtml = "";
                if (gpaNumeric !== null) {
                    if (gpaNumeric >= 9.0) {
                        gpaBadgeHtml = '<div class="medal-badge medal-academic"><i class="fa-solid fa-award"></i> Học giỏi 🎖️</div>';
                    } else if (gpaNumeric >= 8.0) {
                        gpaBadgeHtml = '<div class="medal-badge medal-silver"><i class="fa-solid fa-award"></i> Học khá 🎖️</div>';
                    } else if (gpaNumeric >= 7.0) {
                        gpaBadgeHtml = '<div class="medal-badge medal-bronze"><i class="fa-solid fa-award"></i> Học TB 🎖️</div>';
                    } else {
                        gpaBadgeHtml = '<div class="medal-badge" style="background: rgba(255, 51, 51, 0.15); border: 1px solid #FF3333; color: #FF3333; text-shadow: 0 0 5px rgba(255, 51, 51, 0.3);"><i class="fa-solid fa-triangle-exclamation"></i> Học yếu</div>';
                    }
                }
                document.getElementById('gpaBadgeContainer').innerHTML = gpaBadgeHtml;

                var btvnBadgeHtml = "";
                if (btvnPercent !== null) {
                    if (btvnPercent === 100) {
                        btvnBadgeHtml = '<div class="medal-badge medal-platinum"><i class="fa-solid fa-trophy"></i> Chăm chỉ Xuất sắc 🏆</div>';
                    } else if (btvnPercent >= 90) {
                        btvnBadgeHtml = '<div class="medal-badge medal-gold"><i class="fa-solid fa-medal"></i> Tích cực 🥇</div>';
                    } else if (btvnPercent >= 80) {
                        btvnBadgeHtml = '<div class="medal-badge medal-silver"><i class="fa-solid fa-medal"></i> Tiến bộ 🥈</div>';
                    } else if (btvnPercent >= 70) {
                        btvnBadgeHtml = '<div class="medal-badge medal-bronze"><i class="fa-solid fa-medal"></i> Cố gắng 🥉</div>';
                    }
                }
                document.getElementById('btvnBadgeContainer').innerHTML = btvnBadgeHtml;

                // --- 3. KHỞI TẠO BIỂU ĐỒ DIỄM SỐ (TOÀN BỘ LỊCH SỬ CHRONOLOGICAL) ---
                var labels = [];
                var dataDauGio = [];
                var dataDinhKi = [];
                
                var lichSuVe = ketQua.lichSuHocTap.slice(); // Dùng thứ tự thời gian gốc (cũ trước mới sau)
                lichSuVe.forEach(function(item) {
                    labels.push("Tuần " + item.tuan);

                    var valDG = parseFloat(item.diemDauGio);
                    var valDK = parseFloat(item.diemDinhKi);

                    dataDauGio.push(!isNaN(valDG) && valDG >= 0 && valDG <= 10 ? valDG : null);
                    dataDinhKi.push(!isNaN(valDK) && valDK >= 0 && valDK <= 10 ? valDK : null);
                });

                if (labels.length > 0) {
                    var ctx = document.getElementById('diemChart').getContext('2d');
                    currentChartInstance = new Chart(ctx, {
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
                                    titleColor: '#FFF',
                                    bodyColor: '#A6ADCE',
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

                // Render Bảng Lịch sử & Mobile Accordion (Chỉ hiện tối đa 5 dòng đầu, phần còn lại ẩn đi để Xem thêm)
                var htmlLichSu = "";
                var totalBuoi = ketQua.lichSuHocTap.length;
                if (totalBuoi > 0) {
                    var getStatusBadge = function(trangThai) {
                        var tt = (trangThai || "").trim().toLowerCase();
                        if (tt === "đã học") return '<span class="status-badge badge-dahoc">Đã học</span>';
                        if (tt === "học bù") return '<span class="status-badge badge-hocbu">Học bù</span>';
                        if (tt.indexOf("hủy") !== -1 || tt.indexOf("nghỉ") !== -1) return '<span class="status-badge badge-nghi">Hủy/Nghỉ</span>';
                        return '<span class="status-badge" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); color: #FFF;">' + trangThai + '</span>';
                    };
                    var getBtvnBadge = function(btvn) {
                        var bt = (btvn || "").trim().toLowerCase();
                        if (bt.indexOf("hoàn thành") !== -1) return '<span class="status-badge badge-hoanthanh">Hoàn thành</span>';
                        if (bt.indexOf("thiếu") !== -1) return '<span class="status-badge badge-thieu">' + btvn + '</span>';
                        return '<span class="status-badge" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); color: #FFF;">' + btvn + '</span>';
                    };

                    // 1. Desktop View (Table)
                    htmlLichSu += "<div class='desktop-table-view'>";
                    htmlLichSu += "<table><tr><th>Tuần</th><th>Ngày dạy</th><th>Môn</th><th>Nội dung</th><th>Đánh giá BTVN</th><th>KT Đầu giờ</th><th>KT Định kì</th><th>Trạng thái</th></tr>";
                    
                    // 2. Mobile View (Accordion list)
                    var htmlMobile = "<div class='mobile-cards-view'>";

                    ketQua.lichSuHocTap.slice().reverse().forEach(function(item, idx) {
                        var styleStr = (idx >= 5) ? 'style="display: none;" class="history-row hidden-row"' : 'class="history-row"';
                        
                        // Desktop Row
                        htmlLichSu += "<tr " + styleStr + ">";
                        htmlLichSu += "<td>" + item.tuan + "</td>";
                        htmlLichSu += "<td>" + item.ngay + "</td>";
                        htmlLichSu += "<td>" + item.mon + "</td>";
                        htmlLichSu += "<td>" + item.noiDung + "</td>";
                        htmlLichSu += "<td>" + getBtvnBadge(item.danhGiaBTVN) + "</td>";
                        htmlLichSu += "<td>" + item.diemDauGio + "</td>";
                        htmlLichSu += "<td>" + item.diemDinhKi + "</td>";
                        htmlLichSu += "<td>" + getStatusBadge(item.trangThai) + "</td>";
                        htmlLichSu += "</tr>";

                        // Mobile Row (Accordion Card)
                        var mobileStyleStr = (idx >= 5) ? 'style="display: none;" class="accordion-item history-row hidden-row"' : 'class="accordion-item history-row"';
                        htmlMobile += "<div " + mobileStyleStr + ">";
                        htmlMobile += "  <div class='accordion-header' onclick='toggleAccordion(" + idx + ")'>";
                        htmlMobile += "    <div class='accordion-header-title'>";
                        htmlMobile += "      <span>Tuần " + item.tuan + "</span>";
                        htmlMobile += "      <span class='accordion-header-date'>" + item.ngay + "</span>";
                        htmlMobile += "    </div>";
                        htmlMobile += "    <div class='accordion-header-status'>";
                        htmlMobile += "      " + getStatusBadge(item.trangThai);
                        htmlMobile += "      <i class='fa-solid fa-chevron-down' id='chevron-" + idx + "'></i>";
                        htmlMobile += "    </div>";
                        htmlMobile += "  </div>";
                        htmlMobile += "  <div class='accordion-body' id='accordion-body-" + idx + "'>";
                        htmlMobile += "    <div class='accordion-body-row'><span class='accordion-body-label'>Môn học</span><span class='accordion-body-val'>" + item.mon + "</span></div>";
                        htmlMobile += "    <div class='accordion-body-row'><span class='accordion-body-label'>Nội dung dạy học</span><span class='accordion-body-val'>" + item.noiDung + "</span></div>";
                        htmlMobile += "    <div class='accordion-body-row'><span class='accordion-body-label'>Đánh giá bài tập về nhà</span><span class='accordion-body-val'>" + getBtvnBadge(item.danhGiaBTVN) + "</span></div>";
                        htmlMobile += "    <div class='accordion-body-row'><span class='accordion-body-label'>Kiểm tra đầu giờ</span><span class='accordion-body-val'>" + item.diemDauGio + "</span></div>";
                        htmlMobile += "    <div class='accordion-body-row'><span class='accordion-body-label'>Kiểm tra định kì</span><span class='accordion-body-val'>" + item.diemDinhKi + "</span></div>";
                        htmlMobile += "  </div>";
                        htmlMobile += "</div>";
                    });

                    htmlLichSu += "</table></div>";
                    htmlMobile += "</div>";
                    
                    htmlLichSu = htmlLichSu + htmlMobile;
                } else {
                    htmlLichSu = "<p style='color: #A6ADCE;'>Chưa có dữ liệu đánh giá nào được cập nhật.</p>";
                }
                document.getElementById('khuVucLichSu').innerHTML = htmlLichSu;
                
                // Ẩn/Hiện nút Xem thêm (...) dựa trên số lượng buổi học
                var loadMoreContainer = document.getElementById('loadMoreContainer');
                if (totalBuoi > 5) {
                    loadMoreContainer.style.display = 'block';
                } else {
                    loadMoreContainer.style.display = 'none';
                }
                
                // Render Bài tập / File tải về
                var htmlBaiTap = "";
                if (ketQua.baiTap.length > 0) {
                    ketQua.baiTap.slice().reverse().forEach(function(bt) {
                        htmlBaiTap += "<div class='bt-item'>";
                        htmlBaiTap += "<div><strong style='color: #FFD23F;'>[" + bt.mon + "]</strong> <span style='color: #FFF; font-weight: 500; font-size: 15px; margin-left: 8px;'>" + bt.tenBai + "</span></div>";
                        htmlBaiTap += "<a href='" + bt.link + "' target='_blank' class='btn-download'><i class='fa-solid fa-cloud-arrow-down'></i> Tải Xuống</a>";
                        htmlBaiTap += "</div>";
                    });
                } else {
                    htmlBaiTap = "<p style='color: #A6ADCE;'>Chưa có bài kiểm tra hoặc tài liệu nào.</p>";
                }
                document.getElementById('khuVucBaiTap').innerHTML = htmlBaiTap;
                
        } // End renderStudentView
        
        // Hàm chuyển đổi link Google Drive sang link ảnh trực tiếp
        function convertDriveLink(url) {
            if (!url) return "";
            var match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
            if (match && match[1]) return "https://drive.google.com/uc?export=view&id=" + match[1];
            match = url.match(/id=([a-zA-Z0-9_-]+)/);
            if (match && match[1]) return "https://drive.google.com/uc?export=view&id=" + match[1];
            return url;
        }

        // ================= TUTOR LOGIC =================
        
        function isSinglePageApp() {
            return (document.getElementById('mainScreen') !== null);
        }

        function quayLai() {
            if (currentChartInstance) {
                currentChartInstance.destroy();
                currentChartInstance = null;
            }
            sessionStorage.clear();
            if (isSinglePageApp()) {
                var resBox = document.getElementById('resultBox');
                if (resBox) resBox.style.display = 'none';
                var mainScr = document.getElementById('mainScreen');
                if (mainScr) mainScr.style.display = 'flex';
                navigateToPage('student');
            } else {
                window.location.href = 'student-login.html';
            }
        }

        // --- Student Dashboard UI Helpers ---
        function hienThemBuoi() {
            var hiddenRows = document.querySelectorAll('.history-row.hidden-row');
            var showCount = 0;
            for (var i = 0; i < hiddenRows.length; i++) {
                if (showCount < 5) {
                    hiddenRows[i].style.display = '';
                    hiddenRows[i].classList.remove('hidden-row');
                    showCount++;
                } else {
                    break;
                }
            }
            
            // Ẩn nút nếu không còn dòng nào bị ẩn
            var remainingHidden = document.querySelectorAll('.history-row.hidden-row');
            if (remainingHidden.length === 0) {
                var loadMoreContainer = document.getElementById('loadMoreContainer');
                if (loadMoreContainer) loadMoreContainer.style.display = 'none';
            }
        }

        function toggleDataset(index) {
            if (!currentChartInstance) return;
            
            var meta = currentChartInstance.getDatasetMeta(index);
            var btn = (index === 0) ? document.getElementById('btnLegDauGio') : document.getElementById('btnLegDinhKi');
            if (!btn) return;
            
            // Đảo ngược trạng thái ẩn/hiện của dataset
            meta.hidden = meta.hidden === null ? !currentChartInstance.data.datasets[index].hidden : null;
            
            // Cập nhật lớp CSS (active/inactive) của nút
            if (meta.hidden) {
                btn.classList.remove('active');
                btn.classList.add('inactive');
            } else {
                btn.classList.remove('inactive');
                btn.classList.add('active');
            }
            
            currentChartInstance.update();
        }

        function toggleAccordion(idx) {
            var body = document.getElementById('accordion-body-' + idx);
            if (!body) return;
            var item = body.closest('.accordion-item');
            
            if (body.style.display === 'flex') {
                body.style.display = 'none';
                if (item) item.classList.remove('active');
            } else {
                body.style.display = 'flex';
                if (item) item.classList.add('active');
            }
        }

        function guiPhanHoiPhuHuynh() {
            var textarea = document.getElementById('feedbackInput');
            var btn = document.getElementById('btnSubmitFeedback');
            var msg = document.getElementById('feedbackMessage');
            if (!textarea || !btn || !msg) return;
            
            var content = textarea.value.trim();
            if (content === "") {
                msg.innerText = "Vui lòng nhập nội dung nhận xét/phản hồi trước khi gửi!";
                msg.className = "feedback-message-status error";
                msg.style.display = "block";
                return;
            }
            
            var maHS = sessionStorage.getItem('userPhone') || "";
            var tenHocSinh = currentStudentName;
            
            btn.disabled = true;
            btn.innerHTML = 'Đang gửi... <i class="fa-solid fa-circle-notch fa-spin"></i>';
            msg.style.display = 'none';
            
            google.script.run
                .withSuccessHandler(function(response) {
                    btn.disabled = false;
                    btn.innerHTML = 'Gửi phản hồi <i class="fa-regular fa-paper-plane"></i>';
                    if (response && response.thanhCong) {
                        textarea.value = "";
                        msg.innerText = "Gửi phản hồi thành công! Cảm ơn ý kiến đóng góp của phụ huynh.";
                        msg.className = "feedback-message-status success";
                        msg.style.display = "block";
                        setTimeout(function() {
                            msg.style.display = "none";
                        }, 5000);
                    } else {
                        msg.innerText = "Lỗi khi gửi: " + (response.thongBao || "Không rõ nguyên nhân.");
                        msg.className = "feedback-message-status error";
                        msg.style.display = "block";
                    }
                })
                .withFailureHandler(function(err) {
                    btn.disabled = false;
                    btn.innerHTML = 'Gửi phản hồi <i class="fa-regular fa-paper-plane"></i>';
                    msg.innerText = "Lỗi hệ thống: " + err.toString();
                    msg.className = "feedback-message-status error";
                    msg.style.display = "block";
                })
                .guiPhanHoi(maHS, tenHocSinh, content);
        }
