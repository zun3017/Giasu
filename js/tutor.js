var tutorChartInstance = null;
var tutorDataGlobal = null;
var currentTutorStudent = null;
var currentTutorPhone = "";
var pinVerifyAction = "deleteStudent";

function formatScheduleCell(val) {
    if (!val || val.trim() === "") {
        return "-";
    }
    return "<span style='color:#10B981; font-weight:500;'>" + val + "</span>";
}

        function renderTutorView(data) {
            tutorDataGlobal = data;
            currentTutorPhone = document.getElementById('maHocSinh').value.trim();
            
            var mainScr = document.getElementById('mainScreen');
            if (mainScr) mainScr.style.display = 'none';
            var deskSurf = document.getElementById('deskSurface');
            if (deskSurf) deskSurf.style.display = 'none';
            var boy = document.getElementById('charBoy');
            if (boy) boy.style.display = 'none';
            var girl = document.getElementById('charGirl');
            if (girl) girl.style.display = 'none';
            var resBox = document.getElementById('resultBox');
            if (resBox) resBox.style.display = 'none';
            
            var headerEl = document.querySelector('.header');
            if (headerEl) headerEl.style.display = 'none';
            
            document.getElementById('tutorDashboardBox').style.display = 'block';
            document.getElementById('tutorStudentDetail').style.display = 'none'; // Đảm bảo ẩn chi tiết khi mới đăng nhập
            document.getElementById('tutorNameDisplay').innerText = "Xin chào, Gia sư " + data.tutorName;
            
            // Hiển thị thông báo chạy chữ từ Admin
            var marqueeContainer = document.getElementById('tutorMarqueeContainer');
            var marqueeWrapper = document.getElementById('tutorMarqueeWrapper');
            if (marqueeContainer && marqueeWrapper) {
                if (data.marqueeAnnouncement && data.marqueeAnnouncement.trim() !== "") {
                    marqueeWrapper.innerHTML = '<div class="smooth-marquee-content"><i class="fa-solid fa-circle-exclamation" style="margin-right: 8px;"></i>' + data.marqueeAnnouncement + '</div>';
                    marqueeContainer.style.display = "block";
                } else {
                    marqueeWrapper.innerHTML = "";
                    marqueeContainer.style.display = "none";
                }
            }
            // Load Schedule
            google.script.run.withSuccessHandler(function(schedule) {
                var table = document.getElementById('tutorScheduleTable');
                if (table) {
                    table.innerHTML = "<tr><th>Học sinh</th><th>Thứ 2</th><th>Thứ 3</th><th>Thứ 4</th><th>Thứ 5</th><th>Thứ 6</th><th>Thứ 7</th><th>CN</th><th style='width: 50px;'>Sửa</th></tr>";
                }
                
                var mobileContainer = document.getElementById('tutorScheduleMobile');
                if (mobileContainer) {
                    mobileContainer.innerHTML = "";
                }
                
                var schedMap = {};
                if(schedule && schedule.length > 0) {
                    schedule.forEach(function(s) {
                        schedMap[s.studentName.trim()] = s;
                    });
                }
                
                if(tutorDataGlobal && tutorDataGlobal.students) {
                    var tableHtml = "<tr><th>Học sinh</th><th>Thứ 2</th><th>Thứ 3</th><th>Thứ 4</th><th>Thứ 5</th><th>Thứ 6</th><th>Thứ 7</th><th>CN</th><th style='width: 50px;'>Sửa</th></tr>";
                    var mobileHtml = "";
                    
                    tutorDataGlobal.students.forEach(function(st, idx) {
                        var s = schedMap[st.name.trim()] || { mon: "", tue: "", wed: "", thu: "", fri: "", sat: "", sun: "" };
                        
                        // Desktop Row
                        tableHtml += "<tr>" +
                            "<td style='font-weight:bold; color:#FFD23F;'>" + st.name + "</td>" +
                            "<td>" + formatScheduleCell(s.mon) + "</td>" +
                            "<td>" + formatScheduleCell(s.tue) + "</td>" +
                            "<td>" + formatScheduleCell(s.wed) + "</td>" +
                            "<td>" + formatScheduleCell(s.thu) + "</td>" +
                            "<td>" + formatScheduleCell(s.fri) + "</td>" +
                            "<td>" + formatScheduleCell(s.sat) + "</td>" +
                            "<td>" + formatScheduleCell(s.sun) + "</td>" +
                            "<td><button onclick='openEditScheduleModal(\"" + st.name.replace(/'/g, "\\'").replace(/"/g, '&quot;') + "\", \"" + (s.mon||"") + "\", \"" + (s.tue||"") + "\", \"" + (s.wed||"") + "\", \"" + (s.thu||"") + "\", \"" + (s.fri||"") + "\", \"" + (s.sat||"") + "\", \"" + (s.sun||"") + "\")' class='btn-icon-edit' style='margin: 0; padding: 4px;' title='Sửa thời khóa biểu'><i class='fa-solid fa-pen-to-square'></i></button></td>" +
                            "</tr>";
                            
                        // Mobile Card (Accordion)
                        var activeDays = [];
                        if (s.mon) activeDays.push("T2");
                        if (s.tue) activeDays.push("T3");
                        if (s.wed) activeDays.push("T4");
                        if (s.thu) activeDays.push("T5");
                        if (s.fri) activeDays.push("T6");
                        if (s.sat) activeDays.push("T7");
                        if (s.sun) activeDays.push("CN");
                        var activeDaysStr = activeDays.length > 0 ? activeDays.join(", ") : "Chưa xếp lịch";
                        
                        mobileHtml += "<div class='accordion-item' id='sched-item-" + idx + "'>";
                        mobileHtml += "  <div class='accordion-header' onclick='toggleTutorScheduleAccordion(" + idx + ")'>";
                        mobileHtml += "    <div class='accordion-header-title'>";
                        mobileHtml += "      <span>" + st.name + "</span>";
                        mobileHtml += "      <span class='accordion-header-date'>" + activeDaysStr + "</span>";
                        mobileHtml += "    </div>";
                        mobileHtml += "    <div class='accordion-header-status'>";
                        mobileHtml += "      <i class='fa-solid fa-chevron-down' id='sched-chevron-" + idx + "'></i>";
                        mobileHtml += "    </div>";
                        mobileHtml += "  </div>";
                        mobileHtml += "  <div class='accordion-body' id='sched-accordion-body-" + idx + "' style='display: none;'>";
                        
                        var daysList = [
                            { label: "Thứ 2", val: s.mon },
                            { label: "Thứ 3", val: s.tue },
                            { label: "Thứ 4", val: s.wed },
                            { label: "Thứ 5", val: s.thu },
                            { label: "Thứ 6", val: s.fri },
                            { label: "Thứ 7", val: s.sat },
                            { label: "Chủ nhật", val: s.sun }
                        ];
                        
                        daysList.forEach(function(day) {
                            var dayVal = day.val ? day.val : "<span style='color: rgba(255,255,255,0.15); font-weight: 400;'>Trống</span>";
                            mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>" + day.label + "</span><span class='accordion-body-val' style='color:#FFD23F; font-weight:600;'>" + dayVal + "</span></div>";
                        });
                        
                        // Edit button at the bottom of accordion body
                        mobileHtml += "    <div style='margin-top: 10px; text-align: right;'>";
                        mobileHtml += "      <button onclick='openEditScheduleModal(\"" + st.name.replace(/'/g, "\\'").replace(/"/g, '&quot;') + "\", \"" + (s.mon||"") + "\", \"" + (s.tue||"") + "\", \"" + (s.wed||"") + "\", \"" + (s.thu||"") + "\", \"" + (s.fri||"") + "\", \"" + (s.sat||"") + "\", \"" + (s.sun||"") + "\")' class='action-btn-hw' style='border-color:#8E4DFF; color:#8E4DFF; cursor:pointer;'><i class='fa-solid fa-pen-to-square'></i> Sửa lịch học</button>";
                        mobileHtml += "    </div>";
                        
                        mobileHtml += "  </div>";
                        mobileHtml += "</div>";
                    });
                    
                    if (table) table.innerHTML = tableHtml;
                    if (mobileContainer) mobileContainer.innerHTML = mobileHtml;
                }
            }).getTutorSchedule(currentTutorPhone);
            
            // Render Student Buttons
            var btnContainer = document.getElementById('tutorStudentsList');
            btnContainer.innerHTML = "";
            data.students.forEach(function(st, idx) {
                btnContainer.innerHTML += "<button class='student-btn' id='btn-st-" + idx + "' onclick='selectTutorStudent(" + idx + ")'>" + st.name + "</button>";
            });
            // Nút thêm học sinh mới
            btnContainer.innerHTML += "<button class='student-btn' onclick='openAddStudentModal()' style='background: rgba(142, 77, 255, 0.1); border: 1px dashed #8E4DFF; color: #8E4DFF;'><i class='fa-solid fa-plus'></i> Thêm học sinh</button>";
            // Nút Thùng rác (Chỉ hiển thị icon)
            btnContainer.innerHTML += "<button class='student-btn' onclick='openTrashModal()' style='background: rgba(239, 68, 68, 0.1); border: 1px dashed #EF4444; color: #EF4444; width: 45px; display: inline-flex; align-items: center; justify-content: center; margin-left: 5px;' title='Thùng rác học sinh'><i class='fa-solid fa-trash-can'></i></button>";
            
            // Load ý kiến phản hồi của phụ huynh
            loadTutorFeedbacks();
        }

        function toggleTutorScheduleAccordion(idx) {
            var body = document.getElementById('sched-accordion-body-' + idx);
            if (!body) return;
            var item = body.closest('.accordion-item');
            
            if (body.style.display === 'flex' || body.style.display === 'block') {
                body.style.display = 'none';
                if (item) item.classList.remove('active');
            } else {
                body.style.display = 'block'; // Block or flex are both fine, block is safer for default stack layout
                if (item) item.classList.add('active');
            }
        }

        function selectTutorStudent(idx) {
            var btns = document.querySelectorAll('.student-btn');
            btns.forEach(b => b.classList.remove('active'));
            // Chỉ add active class cho nút của học sinh thực, tránh nút "Thêm học sinh"
            var targetBtn = document.getElementById('btn-st-' + idx);
            if (targetBtn) targetBtn.classList.add('active');
            
            currentTutorStudent = tutorDataGlobal.students[idx];
            document.getElementById('tutorStudentDetail').style.display = 'block';
            document.getElementById('selectedStudentNameHeader').innerText = currentTutorStudent.name;
            document.getElementById('invStudentName').innerText = currentTutorStudent.name;
            document.getElementById('quickAnnouncementInput').value = currentTutorStudent.thongBao || "";
            if (document.getElementById('announcementStatus')) {
                document.getElementById('announcementStatus').style.display = 'none';
            }
            
            // Mở sẵn trạng thái bài tập theo mặc định
            var hwSec = document.getElementById('tutorHomeworkSection');
            if (hwSec) {
                hwSec.style.display = 'block';
                hwSec.style.maxHeight = 'none';
            }
            
            // Tải dữ liệu tab Giao bài tập
            switchTutorHwTab('assign');
            switchTutorHwSubTab('upload');
            
            // Clear file upload selection
            clearTutorSelectedFile();
            
            // Reset trạng thái thu gọn hóa đơn
            document.getElementById('invoiceCollapseContainer').style.display = 'none';
            document.getElementById('btnToggleInvoice').innerHTML = '<i class="fa-solid fa-file-invoice-dollar"></i> Xuất Hóa Đơn (Phiếu Học Tập)';
            
            // Fetch logs for this student to render invoice and stats
            google.script.run
                .withSuccessHandler(function(res) {
                    try {
                        if (res && res.error) {
                            showToast("Lỗi từ hệ thống: " + res.error, "error");
                            return;
                        }
                        currentTutorStudent.logs = (res && res.logs) ? res.logs : [];
                        renderInvoice();
                        renderTutorChart(currentTutorStudent.logs);
                        renderTutorStudentHistory(currentTutorStudent.logs);
                    } catch (err) {
                        showToast("Lỗi hiển thị biểu đồ/lịch sử: " + err.message, "error");
                        console.error("Render student logs error: ", err);
                    }
                })
                .withFailureHandler(function(err) {
                    showToast("Lỗi kết nối máy chủ: " + err.toString(), "error");
                })
                .getStudentDetailsForTutor(currentTutorStudent.phone, currentTutorStudent.name);
        }
        
        function renderTutorChart(lichSuVe) {
            if (tutorChartInstance) {
                tutorChartInstance.destroy();
                tutorChartInstance = null;
            }
            
            var labels = [];
            var dataDauGio = [];
            var dataDinhKi = [];
            
            lichSuVe.forEach(function(item, idx) {
                // Dùng ngày thực tế thay vì số buổi
                var rawDate = item.ngay || "";
                var shortDate = rawDate;
                var dateParts = rawDate.match(/(\d{1,2})\/(\d{1,2})/);
                if (dateParts) shortDate = dateParts[1] + "/" + dateParts[2];
                labels.push(shortDate);
                
                var valDG = parseFloat(item.diemDauGio);
                var valDK = parseFloat(item.diemDinhKi);

                dataDauGio.push(!isNaN(valDG) && valDG >= 0 && valDG <= 10 ? valDG : null);
                dataDinhKi.push(!isNaN(valDK) && valDK >= 0 && valDK <= 10 ? valDK : null);
            });

            if (labels.length > 0) {
                var ctx = document.getElementById('tutorDiemChart').getContext('2d');
                tutorChartInstance = new Chart(ctx, {
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
                            legend: { display: false },
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
                                ticks: {
                                    color: '#A6ADCE',
                                    font: { family: 'Inter', size: 9.5 },
                                    maxRotation: 45,
                                    minRotation: 0,
                                    autoSkip: true,
                                    maxTicksLimit: 12
                                }
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
        }
        
        function renderInvoice() {
            if(!currentTutorStudent || !currentTutorStudent.logs) return;
            var logs = currentTutorStudent.logs;
            var feePerClass = parseFloat(currentTutorStudent.tuition) || 75000;
            
            var presentClasses = 0;
            var absentClasses = 0;
            var makeupClasses = 0;
            var unpaidClasses = 0;
            var paidTotal = 0;
            
            var absentDates = [];
            var missingHwDates = [];
            var missingHwCount = 0;
            var doneHwCount = 0;
            
            var logsToProcess = [];
            
            // Tìm buổi học đã đóng gần nhất và lấy tất cả các buổi sau đó (chưa đóng)
            var lastPaidIndex = -1;
            for (var i = 0; i < logs.length; i++) {
                var isPaid = (logs[i].tienDong || "").trim().toLowerCase().indexOf("đã đóng") !== -1;
                if (isPaid) lastPaidIndex = i;
            }
            logsToProcess = logs.slice(lastPaidIndex + 1);
            
            logsToProcess.forEach(function(log) {
                if (!log) return;
                var dateText = log.ngay || "";
                var cleanStr = dateText.split(" ")[0].trim();
                
                var tt = (log.trangThai || "").trim().toLowerCase();
                var isDaBu = (tt.indexOf("đã bù") !== -1 || tt === "học bù");
                var isPresent = (tt.indexOf("đã học") !== -1 || tt === "có mặt" || tt === "có");
                var isAbsent = (tt.indexOf("nghỉ") !== -1 || tt.indexOf("hủy") !== -1 || tt.indexOf("vắng") !== -1) && !isDaBu;
                
                if (isDaBu) {
                    makeupClasses++;
                } else if (isPresent) {
                    presentClasses++;
                } else if (isAbsent) {
                    absentClasses++;
                    absentDates.push(cleanStr);
                }
                
                var isPaid = (log.tienDong || "").trim().toLowerCase().indexOf("đã đóng") !== -1;
                if(isPresent || isDaBu) {
                    if (isPaid) paidTotal += feePerClass;
                    else unpaidClasses++;
                }
                
                var btvn = (log.btvn || "").trim().toLowerCase();
                if(btvn) {
                    if (btvn.indexOf("hoàn thành") !== -1 || btvn === "có") doneHwCount++;
                    if (btvn.indexOf("thiếu") !== -1 || btvn === "không") {
                        missingHwCount++;
                        missingHwDates.push(cleanStr + " (" + log.btvn + ")");
                    }
                }
            });
            
            var expectedRev = unpaidClasses * feePerClass;
            
            document.getElementById('tutorExpRev').innerText = expectedRev.toLocaleString('vi-VN') + "đ";
            document.getElementById('tutorPaidRev').innerText = paidTotal.toLocaleString('vi-VN') + "đ";
            var totalClasses = presentClasses + absentClasses;
            document.getElementById('tutorAttendance').innerText = totalClasses > 0 ? Math.round(presentClasses/totalClasses*100) + "%" : "0%";
            
            document.getElementById('invAttP').innerText = presentClasses;
            document.getElementById('invAttA').innerText = absentClasses;
            document.getElementById('invAttB').innerText = makeupClasses;
            document.getElementById('invAbsentDates').innerText = absentDates.length > 0 ? "Vắng ngày: " + absentDates.join(", ") : "Không có vắng";
            
            document.getElementById('invHwDone').innerText = doneHwCount + " buổi";
            document.getElementById('invHwMiss').innerText = missingHwCount + " buổi";
            
            if(missingHwDates.length > 0) {
                document.getElementById('invHwMissDates').innerHTML = "• " + missingHwDates.join("<br>• ");
            } else {
                document.getElementById('invHwMissDates').innerHTML = "• Không thiếu bài";
            }
            
            document.getElementById('invMonthDisplay').innerText = "TỔNG HỢP CÁC BUỔI ĐÃ HỌC";
            
            var feeStr = feePerClass.toLocaleString('vi-VN');
            var totalStr = expectedRev.toLocaleString('vi-VN');
            document.getElementById('invFeeCalcText').innerText = "Học phí (" + feeStr + "đ × " + unpaidClasses + "):";
            document.getElementById('invFeeCalcTotal').innerText = totalStr + " VNĐ";
            document.getElementById('invGrandTotal').innerText = totalStr + " đ";
            
            var qrImg = document.getElementById('invQrImg');
            var qrText = document.getElementById('invQrText');
            // Gắn trực tiếp mã QR Base64
            // Lấy link ảnh trực tiếp từ dữ liệu (link postimg)
            if (tutorDataGlobal && tutorDataGlobal.qrCode) {
                qrImg.src = tutorDataGlobal.qrCode;
                qrImg.style.display = "block";
                qrText.innerText = "Quét mã để thanh toán";
            } else {
                qrImg.style.display = "none";
                qrText.innerText = "Chưa có mã QR thanh toán";
            }
            
            // Update Textarea with prefilled text
            var msg = "Dạ em chào anh/chị, em gửi anh chị phiếu học tập tổng hợp của bé " + currentTutorStudent.name + " ạ.\nTổng số buổi chưa đóng là " + unpaidClasses + " buổi, thành tiền là " + totalStr + " VNĐ.\nAnh/chị quét mã QR trên phiếu để thanh toán giúp em nhé. Em cảm ơn ạ!";
            var ta = document.getElementById('invTextarea');
            ta.innerText = msg;
        }
        
        function exportInvoice() {
            var invElement = document.getElementById('invoiceElement');
            var ta = document.getElementById('invTextarea');
            ta.style.border = "none";
            ta.style.resize = "none";
            
            html2canvas(invElement, { scale: 2, backgroundColor: "#FFFFFF", useCORS: true }).then(canvas => {
                ta.style.border = "1px solid #E5E7EB"; 
                var link = document.createElement('a');
                link.download = 'HoaDon_' + currentTutorStudent.name + '.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
            });
        }

        // Các hàm giao diện của Học sinh đã được chuyển sang đúng file student.js.

        function isSinglePageApp() {
            return (document.getElementById('mainScreen') !== null);
        }

        function quayLai() {
            if (tutorChartInstance) {
                tutorChartInstance.destroy();
                tutorChartInstance = null;
            }
            sessionStorage.clear();
            if (isSinglePageApp()) {
                document.getElementById('tutorDashboardBox').style.display = 'none';
                var mainScr = document.getElementById('mainScreen');
                if (mainScr) mainScr.style.display = 'flex';
                navigateToPage('tutor');
            } else {
                window.location.href = 'tutor-login.html';
            }
        }

        // ================= TUTOR MODAL CONTROLLER FUNCTIONS =================
        
        // 1. Cửa sổ Tài khoản (Account)
        function openTutorAccountModal() {
            if(!tutorDataGlobal) return;
            document.getElementById('accTutorName').value = tutorDataGlobal.tutorName || "";
            document.getElementById('accTutorPhone').value = tutorDataGlobal.tutorPhone || "";
            document.getElementById('accTutorPin').value = tutorDataGlobal.tutorPin || "";
            document.getElementById('accClassCount').value = tutorDataGlobal.classCount || "0";
            document.getElementById('accUnpaidIncome').value = (tutorDataGlobal.totalUnpaidIncome || 0).toLocaleString('vi-VN') + " VNĐ";
            
            var qrImg = document.getElementById('accQrImg');
            var qrText = document.getElementById('accQrText');
            if (tutorDataGlobal.qrCode) {
                qrImg.src = tutorDataGlobal.qrCode;
                qrImg.style.display = "block";
                qrText.style.display = "none";
            } else {
                qrImg.style.display = "none";
                qrText.style.display = "block";
            }
            
            document.getElementById('tutorAccountModal').style.display = "flex";
        }
        function closeTutorAccountModal() {
            document.getElementById('tutorAccountModal').style.display = "none";
        }
        function saveTutorAccount() {
            var name = document.getElementById('accTutorName').value.trim();
            var phone = document.getElementById('accTutorPhone').value.trim();
            var pin = document.getElementById('accTutorPin').value.trim();
            
            if(!name || !phone) {
                showToast("Vui lòng điền đầy đủ Tên và Số điện thoại!", "error");
                return;
            }
            
            var confirmMsg = "Bạn có chắc chắn muốn cập nhật thông tin tài khoản?";
            if(phone !== tutorDataGlobal.tutorPhone) {
                confirmMsg += " LƯU Ý: Đổi số điện thoại sẽ đồng bộ hóa lại toàn bộ học sinh và lịch học của bạn. Vui lòng kiểm tra kỹ!";
            }
            
            showCustomConfirm(confirmMsg, function() {
                var btn = document.querySelector('[onclick="saveTutorAccount()"]');
                var originalText = btn ? btn.innerText : "Cập nhật tài khoản";
                if(btn) {
                    btn.disabled = true;
                    btn.innerText = "Đang cập nhật...";
                }
                
                google.script.run
                    .withSuccessHandler(function(res) {
                        if(btn) {
                            btn.disabled = false;
                            btn.innerText = originalText;
                        }
                        if(res.error) {
                            showToast("Lỗi: " + res.error, "error");
                        } else {
                            showToast("Cập nhật tài khoản thành công!", "success");
                            
                            // Cập nhật dữ liệu cục bộ ngay lập tức
                            tutorDataGlobal.tutorName = name;
                            tutorDataGlobal.tutorPhone = phone;
                            tutorDataGlobal.tutorPin = pin;
                            currentTutorPhone = phone;
                            
                            // Cập nhật ô input đăng nhập ẩn để đồng bộ
                            document.getElementById('maHocSinh').value = phone;
                            document.getElementById('maPin').value = pin;
                            
                            // Cập nhật tên hiển thị trên Header
                            document.getElementById('tutorNameDisplay').innerText = "Xin chào, Gia sư " + name;
                            
                            closeTutorAccountModal();
                        }
                    })
                    .withFailureHandler(function(err) {
                        if(btn) {
                            btn.disabled = false;
                            btn.innerText = originalText;
                        }
                        showToast("Lỗi kết nối hoặc hệ thống: " + err.toString(), "error");
                    })
                    .capNhatThongTinGiaSu(tutorDataGlobal.tutorPhone, name, phone, pin);
            });
        }

        // 2. Cửa sổ Thêm học sinh (Add Student)
        function openAddStudentModal() {
            document.getElementById('addParentName').value = "";
            document.getElementById('addStudentName').value = "";
            document.getElementById('addStudentPhone').value = "";
            document.getElementById('addStudentTuition').value = "";
            document.getElementById('addStudentMaBaiTap').value = "";
            document.getElementById('addStudentModal').style.display = "flex";
        }
        function closeAddStudentModal() {
            document.getElementById('addStudentModal').style.display = "none";
        }

        function saveNewStudent() {
            var pName = document.getElementById('addParentName').value.trim();
            var sName = document.getElementById('addStudentName').value.trim();
            var phone = document.getElementById('addStudentPhone').value.trim();
            var tuition = document.getElementById('addStudentTuition').value.trim();
            var maBaiTap = document.getElementById('addStudentMaBaiTap').value.trim();
            var thongBao = "";
            
            if(!pName || !sName || !phone || !tuition || !maBaiTap) {
                showToast("Vui lòng điền đầy đủ các thông tin!", "error");
                return;
            }
            
            google.script.run.withSuccessHandler(function(res) {
                if(res.error) {
                     showToast("Lỗi: " + res.error, "error");
                } else {
                     showToast("Thêm học sinh mới thành công!", "success");
                     closeAddStudentModal();
                     google.script.run.withSuccessHandler(function(loginRes) {
                         if(loginRes.role === 'tutor') renderTutorView(loginRes.data);
                     }).loginSystem(tutorDataGlobal.tutorPhone, document.getElementById('maPin').value.trim());
                }
            }).themHocSinhMoi(tutorDataGlobal.tutorPhone, pName, sName, phone, parseFloat(tuition), maBaiTap, thongBao);
        }

        // 3. Cửa sổ Sửa học sinh (Edit Student)
        function openEditStudentModal() {
            if(!currentTutorStudent) return;
            document.getElementById('editOldStudentPhone').value = currentTutorStudent.phone;
            document.getElementById('editStudentName').value = currentTutorStudent.name;
            document.getElementById('editStudentTuition').value = currentTutorStudent.tuition || "";
            document.getElementById('editStudentMaBaiTap').value = currentTutorStudent.maBaiTap || "";
            
            document.getElementById('editParentName').value = ""; 
            document.getElementById('editParentName').placeholder = "Đang tải tên phụ huynh...";
            google.script.run.withSuccessHandler(function(pName) {
                document.getElementById('editParentName').value = pName || "";
                document.getElementById('editParentName').placeholder = "";
            }).getStudentParentName(currentTutorStudent.phone);
            
            document.getElementById('editStudentPhone').value = currentTutorStudent.phone;
            document.getElementById('editStudentModal').style.display = "flex";
        }
        function closeEditStudentModal() {
            document.getElementById('editStudentModal').style.display = "none";
        }
        function saveEditStudent() {
            var oldPhone = document.getElementById('editOldStudentPhone').value;
            var pName = document.getElementById('editParentName').value.trim();
            var sName = document.getElementById('editStudentName').value.trim();
            var phone = document.getElementById('editStudentPhone').value.trim();
            var tuition = document.getElementById('editStudentTuition').value.trim();
            var maBaiTap = document.getElementById('editStudentMaBaiTap').value.trim();
            var thongBao = currentTutorStudent.thongBao || "";
            
            if(!pName || !sName || !phone || !tuition || !maBaiTap) {
                showToast("Vui lòng điền đầy đủ các thông tin!", "error");
                return;
            }
            
            google.script.run.withSuccessHandler(function(res) {
                if(res.error) {
                    showToast("Lỗi: " + res.error, "error");
                } else {
                    showToast("Cập nhật thông tin học sinh thành công!", "success");
                    closeEditStudentModal();
                    google.script.run.withSuccessHandler(function(loginRes) {
                        if(loginRes.role === 'tutor') {
                            renderTutorView(loginRes.data);
                            for(var i=0; i<loginRes.data.students.length; i++) {
                                if(loginRes.data.students[i].phone === phone) {
                                    selectTutorStudent(i);
                                    break;
                                }
                            }
                        }
                    }).loginSystem(tutorDataGlobal.tutorPhone, document.getElementById('maPin').value.trim());
                }
            }).suaThongTinHocSinh(oldPhone, pName, sName, phone, parseFloat(tuition), maBaiTap, thongBao);
        }

        function saveQuickAnnouncement() {
            if (!currentTutorStudent) return;
            var text = document.getElementById('quickAnnouncementInput').value.trim();
            var statusLabel = document.getElementById('announcementStatus');
            
            // 1. Cập nhật cục bộ ngay lập tức
            currentTutorStudent.thongBao = text;
            var globalIndex = tutorDataGlobal.students.findIndex(s => s.phone === currentTutorStudent.phone);
            if (globalIndex !== -1) {
                tutorDataGlobal.students[globalIndex].thongBao = text;
            }
            
            // 2. Hiển thị trạng thái thành công ngay
            statusLabel.innerText = "Đã lưu thành công!";
            statusLabel.style.display = 'inline';
            setTimeout(function() {
                statusLabel.style.display = 'none';
            }, 3000);
            showToast("Đã lưu thông báo nhanh!", "success");
            
            // 3. Sync ngầm lên backend
            showSyncToast('pending');
            google.script.run
                .withSuccessHandler(function(res) {
                    if (res && res.error) {
                        showSyncToast('error');
                        showToast("Lỗi đồng bộ thông báo: " + res.error, "error");
                    } else {
                        showSyncToast('success');
                    }
                })
                .withFailureHandler(function(err) {
                    showSyncToast('error');
                    console.error("Lỗi kết nối lưu thông báo:", err);
                })
                .capNhatThongBaoHocSinh(currentTutorStudent.phone, text);
        }


        // 4. Cửa sổ Thêm buổi học (Add Lesson) & Preview
        function openAddLessonModal() {
            if(!currentTutorStudent) return;
            
            var today = new Date();
            var dd = String(today.getDate()).padStart(2, '0');
            var mm = String(today.getMonth() + 1).padStart(2, '0'); 
            var yyyy = today.getFullYear();
            document.getElementById('lesNgay').value = dd + '/' + mm + '/' + yyyy;
            
            var weekNum = 1;
            if (currentTutorStudent.logs && currentTutorStudent.logs.length > 0) {
                var lastLog = currentTutorStudent.logs[currentTutorStudent.logs.length - 1];
                var lastWeekVal = parseInt(lastLog.tuan);
                if (!isNaN(lastWeekVal)) {
                    // Phân tích ngày của buổi học trước (DD/MM/YYYY)
                    var parseDate = function(str) {
                        if (!str) return null;
                        var parts = str.split('/');
                        if (parts.length !== 3) return null;
                        return new Date(parts[2], parts[1] - 1, parts[0]);
                    };
                    // Lấy ngày Thứ Hai đầu tuần của 1 ngày bất kỳ
                    var getMonday = function(d) {
                        var day = d.getDay();
                        var diff = d.getDate() - day + (day === 0 ? -6 : 1);
                        var monday = new Date(d);
                        monday.setDate(diff);
                        monday.setHours(0, 0, 0, 0);
                        return monday;
                    };
                    
                    var lastLogDate = parseDate(lastLog.ngay);
                    if (lastLogDate) {
                        var lastMonday = getMonday(lastLogDate);
                        var todayMonday = getMonday(today);
                        
                        if (lastMonday.getTime() === todayMonday.getTime()) {
                            // Cùng một tuần: giữ nguyên số tuần của buổi trước
                            weekNum = lastWeekVal;
                        } else {
                            // Khác tuần (sang tuần mới): tăng số tuần lên 1
                            weekNum = lastWeekVal + 1;
                        }
                    } else {
                        weekNum = lastWeekVal + 1;
                    }
                }
            }
            document.getElementById('lesTuan').value = weekNum;


            
            document.getElementById('lesNoiDung').value = "";
            document.getElementById('lesDiemDau').value = "Không có";
            document.getElementById('lesDiemDinhKi').value = "Không có";
            document.getElementById('lesTrangThai').value = "Đã học";
            document.getElementById('lesBtvn').value = "Hoàn thành";
            document.getElementById('lesMon').value = "Toán học";
            
            document.getElementById('addLessonModal').style.display = "flex";
        }
        function closeAddLessonModal() {
            document.getElementById('addLessonModal').style.display = "none";
        }
        
        var tempLessonData = null; 
        
        function previewLessonLog() {
            var tuan = document.getElementById('lesTuan').value.trim();
            var ngayVal = document.getElementById('lesNgay').value;
            var mon = document.getElementById('lesMon').value;
            var trangThai = document.getElementById('lesTrangThai').value;
            var btvn = document.getElementById('lesBtvn').value;
            var diemDau = document.getElementById('lesDiemDau').value.trim();
            var diemDinhKi = document.getElementById('lesDiemDinhKi').value.trim();
            var noiDung = document.getElementById('lesNoiDung').value.trim();
            
            if(!tuan || !ngayVal || !noiDung) {
                showToast("Vui lòng nhập đầy đủ Tuần, Ngày học và Nội dung nhận xét!", "error");
                return;
            }
            
            var dateFormatted = "";
            if (ngayVal.includes("/")) {
                var parts = ngayVal.split("/");
                if (parts.length >= 2) {
                    dateFormatted = parts[0] + "/" + parts[1]; // DD/MM
                } else {
                    dateFormatted = ngayVal;
                }
            } else if (ngayVal.includes("-")) {
                var parts = ngayVal.split("-");
                if (parts.length >= 3) {
                    dateFormatted = parts[2] + "/" + parts[1]; // DD/MM
                } else {
                    dateFormatted = ngayVal;
                }
            } else {
                dateFormatted = ngayVal;
            }
            
            tempLessonData = {
                studentPhone: currentTutorStudent.phone,
                studentName: currentTutorStudent.name,
                tuan: tuan,
                ngay: dateFormatted,
                mon: mon,
                trangThai: trangThai,
                btvn: btvn,
                diemDau: diemDau,
                diemDinhKi: diemDinhKi,
                noiDung: noiDung
            };
            
            document.getElementById('prevStudentName').innerText = tempLessonData.studentName;
            document.getElementById('prevTuan').innerText = tempLessonData.tuan;
            document.getElementById('prevNgay').innerText = tempLessonData.ngay;
            document.getElementById('prevMon').innerText = tempLessonData.mon;
            document.getElementById('prevTrangThai').innerText = tempLessonData.trangThai;
            document.getElementById('prevBtvn').innerText = tempLessonData.btvn;
            document.getElementById('prevDiemDau').innerText = tempLessonData.diemDau;
            document.getElementById('prevDiemDinhKi').innerText = tempLessonData.diemDinhKi;
            document.getElementById('prevNoiDung').innerText = tempLessonData.noiDung;
            
            document.getElementById('previewLessonModal').style.display = "flex";
        }
        function closePreviewLessonModal() {
            document.getElementById('previewLessonModal').style.display = "none";
        }
        function submitLessonLog() {
            if(!tempLessonData) return;
            
            // 1. Tạo dữ liệu buổi học mới cục bộ
            let tempRowId = "temp_" + (_tempRowIdCounter++);
            let newLog = {
                rowIndex: tempRowId,
                tempId: tempRowId,
                tuan: tempLessonData.tuan,
                ngay: tempLessonData.ngay,
                mon: tempLessonData.mon,
                noiDung: tempLessonData.noiDung,
                btvn: tempLessonData.btvn,
                diemDauGio: tempLessonData.diemDau,
                diemDinhKi: tempLessonData.diemDinhKi,
                trangThai: tempLessonData.trangThai,
                tienDong: "" // Mới học chưa đóng tiền
            };
            
            if (!currentTutorStudent.logs) currentTutorStudent.logs = [];
            currentTutorStudent.logs.push(newLog);
            
            // 2. Render lại UI ngay lập tức
            renderInvoice();
            renderTutorChart(currentTutorStudent.logs);
            renderTutorStudentHistory(currentTutorStudent.logs);
            
            // 3. Đóng các modal
            closePreviewLessonModal();
            closeAddLessonModal();
            showToast("Đã thêm buổi học mới!", "success");
            
            // 4. Đẩy vào hàng đợi sync ngầm
            queueLessonOperation({
                type: 'add',
                tempId: tempRowId,
                data: {
                    studentPhone: tempLessonData.studentPhone,
                    studentName: tempLessonData.studentName,
                    tuan: tempLessonData.tuan,
                    ngay: tempLessonData.ngay,
                    mon: tempLessonData.mon,
                    noiDung: tempLessonData.noiDung,
                    btvn: tempLessonData.btvn,
                    diemDau: tempLessonData.diemDau,
                    diemDinhKi: tempLessonData.diemDinhKi,
                    trangThai: tempLessonData.trangThai
                }
            });
        }


        // --- Custom in-app notification and confirmation dialogs ---
        function showToast(message, type = 'info') {
            var container = document.getElementById('toastContainer');
            if (!container) return;
            
            var toast = document.createElement('div');
            toast.style.padding = '15px 25px';
            toast.style.borderRadius = '12px';
            toast.style.color = '#FFF';
            toast.style.fontSize = '14px';
            toast.style.fontWeight = 'bold';
            toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
            toast.style.pointerEvents = 'auto';
            toast.style.animation = 'slideIn 0.3s ease forwards';
            toast.style.fontFamily = 'Inter, sans-serif';
            toast.style.display = 'flex';
            toast.style.alignItems = 'center';
            toast.style.gap = '10px';
            toast.style.borderWidth = '1px';
            toast.style.borderStyle = 'solid';
            
            if (type === 'success') {
                toast.style.background = '#00CC66';
                toast.style.borderColor = '#00FF88';
                toast.innerHTML = '<i class="fa-solid fa-circle-check"></i> ' + message;
            } else if (type === 'error') {
                toast.style.background = '#FF4D4D';
                toast.style.borderColor = '#FF8080';
                toast.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> ' + message;
            } else {
                toast.style.background = '#8E4DFF';
                toast.style.borderColor = '#A870FF';
                toast.innerHTML = '<i class="fa-solid fa-circle-info"></i> ' + message;
            }
            
            container.appendChild(toast);
            
            setTimeout(function() {
                toast.style.animation = 'slideOut 0.3s ease forwards';
                setTimeout(function() {
                    toast.remove();
                }, 300);
            }, 3000);
        }

        function showCustomConfirm(message, onConfirm) {
            document.getElementById('confirmModalMessage').innerText = message;
            var modal = document.getElementById('customConfirmModal');
            modal.style.display = 'flex';
            
            var btnCancel = document.getElementById('btnConfirmCancel');
            var btnOk = document.getElementById('btnConfirmOk');
            
            btnCancel.onclick = function() {
                modal.style.display = 'none';
            };
            
            btnOk.onclick = function() {
                modal.style.display = 'none';
                onConfirm();
            };
        }

        // === OPTIMISTIC UI FOR CHECKBOXES ===
        let _pendingTuitionUpdates = {};
        let _tuitionSyncTimer = null;

        let _pendingLessonOperations = [];
        let _lessonOperationsTimer = null;
        let _tempRowIdCounter = 1;
        let _tempIdToRealRowIndex = {};


        function queueLessonOperation(op) {
            // 1. Nếu xóa một tempId và có hành động thêm tương ứng đang chờ trong queue, hủy bỏ cả hai (không cần gọi lên server)
            if (op.type === 'delete' && typeof op.rowIndex === 'string' && op.rowIndex.startsWith('temp_')) {
                let addOpIdx = _pendingLessonOperations.findIndex(p => p.type === 'add' && p.tempId === op.rowIndex);
                if (addOpIdx !== -1) {
                    _pendingLessonOperations.splice(addOpIdx, 1);
                    if (_pendingLessonOperations.length === 0) {
                        showSyncToast('success');
                        clearTimeout(_lessonOperationsTimer);
                    } else {
                        clearTimeout(_lessonOperationsTimer);
                        _lessonOperationsTimer = setTimeout(flushLessonOperations, 1500);
                    }
                    return;
                }
            }
            
            // 2. Nếu sửa một tempId đang chờ thêm, chập trực tiếp dữ liệu sửa vào hành động thêm
            if (op.type === 'edit' && typeof op.rowIndex === 'string' && op.rowIndex.startsWith('temp_')) {
                let addOp = _pendingLessonOperations.find(p => p.type === 'add' && p.tempId === op.rowIndex);
                if (addOp) {
                    addOp.data = { ...addOp.data, ...op.data };
                    return;
                }
            }

            _pendingLessonOperations.push(op);
            showSyncToast('pending');
            clearTimeout(_lessonOperationsTimer);
            _lessonOperationsTimer = setTimeout(flushLessonOperations, 1500);
        }


        function flushLessonOperations() {
            if (_pendingLessonOperations.length === 0) return;
            let ops = [..._pendingLessonOperations];
            _pendingLessonOperations = [];

            let processNext = () => {
                if (ops.length === 0) {
                    showSyncToast('success');
                    refreshTutorStudentHistorySilent();
                    return;
                }
                let op = ops.shift();

                if (op.type === 'add') {
                    google.script.run
                        .withSuccessHandler(function(res) {
                            if (res && res.error) {
                                showSyncToast('error');
                                showToast("Lỗi đồng bộ thêm buổi học: " + res.error, "error");
                                refreshTutorStudentHistory();
                            } else {
                                // Tìm và cập nhật rowIndex thực tế từ phản hồi (nếu có trả về)
                                if (res.rowIndex && currentTutorStudent && currentTutorStudent.logs) {
                                    _tempIdToRealRowIndex[op.tempId] = res.rowIndex; // Lưu ánh xạ tempId -> rowIndex thực tế
                                    currentTutorStudent.logs.forEach(log => {
                                        if (log.rowIndex === op.tempId) {
                                            log.rowIndex = res.rowIndex;
                                        }
                                    });
                                    renderTutorStudentHistory(currentTutorStudent.logs);
                                }
                                processNext();
                            }
                        })
                        .withFailureHandler(function(err) {
                            showSyncToast('error');
                            showToast("Lỗi kết nối", "error");
                            refreshTutorStudentHistory();
                        })
                        .themBuoiHoc(
                            op.data.studentPhone,
                            op.data.studentName,
                            op.data.tuan,
                            op.data.ngay,
                            op.data.mon,
                            op.data.noiDung,
                            op.data.btvn,
                            op.data.diemDau,
                            op.data.diemDinhKi,
                            op.data.trangThai
                        );
                } 
                else if (op.type === 'edit') {
                    let targetRowIndex = op.rowIndex;
                    if (typeof targetRowIndex === 'string' && targetRowIndex.startsWith('temp_')) {
                        if (_tempIdToRealRowIndex[targetRowIndex]) {
                            targetRowIndex = _tempIdToRealRowIndex[targetRowIndex];
                        } else if (currentTutorStudent && currentTutorStudent.logs) {
                            let match = currentTutorStudent.logs.find(log => log.tempId === targetRowIndex || log.rowIndex === targetRowIndex);
                            if (match && typeof match.rowIndex === 'number') {
                                targetRowIndex = match.rowIndex;
                            }
                        }
                    }

                    if (typeof targetRowIndex === 'string' && targetRowIndex.startsWith('temp_')) {
                        processNext();
                        return;
                    }


                    google.script.run
                        .withSuccessHandler(function(res) {
                            if (res && res.error) {
                                showSyncToast('error');
                                showToast("Lỗi đồng bộ sửa buổi học: " + res.error, "error");
                                refreshTutorStudentHistory();
                            } else {
                                processNext();
                            }
                        })
                        .withFailureHandler(function(err) {
                            showSyncToast('error');
                            showToast("Lỗi kết nối", "error");
                            refreshTutorStudentHistory();
                        })
                        .suaBuoiHoc(
                            targetRowIndex,
                            op.data.tuan,
                            op.data.ngay,
                            op.data.mon,
                            op.data.noiDung,
                            op.data.btvn,
                            op.data.diemDau,
                            op.data.diemDinhKi,
                            op.data.trangThai
                        );
                }
                else if (op.type === 'delete') {
                    let targetRowIndex = op.rowIndex;
                    if (typeof targetRowIndex === 'string' && targetRowIndex.startsWith('temp_')) {
                        if (_tempIdToRealRowIndex[targetRowIndex]) {
                            targetRowIndex = _tempIdToRealRowIndex[targetRowIndex];
                        }
                    }

                    if (typeof targetRowIndex === 'string' && targetRowIndex.startsWith('temp_')) {
                        processNext();
                        return;
                    }


                    google.script.run
                        .withSuccessHandler(function(res) {
                            if (res && res.error) {
                                showSyncToast('error');
                                showToast("Lỗi đồng bộ xóa buổi học: " + res.error, "error");
                                refreshTutorStudentHistory();
                            } else {
                                processNext();
                            }
                        })
                        .withFailureHandler(function(err) {
                            showSyncToast('error');
                            showToast("Lỗi kết nối", "error");
                            refreshTutorStudentHistory();
                        })
                        .xoaBuoiHoc(targetRowIndex);
                }
            };

            processNext();
        }

        function showSyncToast(state) {
            let toast = document.getElementById('syncToast');
            if (!toast) return;
            toast.className = 'sync-toast ' + state;
            if (state === 'pending') {
                toast.innerHTML = '<i class="fa-solid fa-rotate fa-spin"></i> Đang đồng bộ...';
                toast.style.display = 'flex';
            } else if (state === 'success') {
                toast.innerHTML = '<i class="fa-solid fa-circle-check"></i> Đã lưu';
                toast.style.display = 'flex';
                setTimeout(function() { toast.style.display = 'none'; }, 2000);
            } else if (state === 'error') {
                toast.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Lỗi đồng bộ!';
                toast.style.display = 'flex';
                setTimeout(function() { toast.style.display = 'none'; }, 4000);
            }
        }

        function queueTuitionUpdate(rowIndex, state) {
            _pendingTuitionUpdates[rowIndex] = state;
            showSyncToast('pending');
            clearTimeout(_tuitionSyncTimer);
            _tuitionSyncTimer = setTimeout(flushTuitionUpdates, 1500);
        }

        function flushTuitionUpdates() {
            let entries = Object.entries(_pendingTuitionUpdates);
            if (entries.length === 0) return;
            _pendingTuitionUpdates = {};

            let payIndices = [];
            let unpayIndices = [];
            entries.forEach(([rowIndex, state]) => {
                if (state) {
                    payIndices.push(rowIndex);
                } else {
                    unpayIndices.push(rowIndex);
                }
            });

            google.script.run
                .withSuccessHandler(function(res) {
                    if (res && res.error) {
                        showSyncToast('error');
                        showToast("Lỗi đồng bộ học phí: " + res.error, "error");
                        refreshTutorStudentHistory();
                    } else {
                        showSyncToast('success');
                        refreshTutorStudentHistorySilent();
                    }
                })
                .withFailureHandler(function(err) {
                    showSyncToast('error');
                    showToast("Lỗi kết nối máy chủ Google", "error");
                    refreshTutorStudentHistory();
                })
                .capNhatNhieuDongHocPhi(payIndices, unpayIndices);
        }

        function refreshTutorStudentHistorySilent() {
            if (!currentTutorStudent) return;
            google.script.run.withSuccessHandler(function(res) {
                currentTutorStudent.logs = res.logs || [];
                renderInvoice();
                renderTutorChart(res.logs || []);
                renderTutorStudentHistory(res.logs || []);
            }).getStudentDetailsForTutor(currentTutorStudent.phone);
        }

        function toggleSelectAllTutorLessons(masterChk) {
            if (!masterChk) return;
            var chks = document.querySelectorAll('.tutor-lesson-chk');
            
            if (masterChk.checked) {
                masterChk.checked = false; // Tạm bỏ check để chờ confirm
                var targetRowIndices = [];
                chks.forEach(function(c) {
                    if (!c.checked) {
                        var rIndex = c.getAttribute('data-rowindex');
                        if (targetRowIndices.indexOf(rIndex) === -1) {
                            targetRowIndices.push(rIndex);
                        }
                    }
                });
                
                if (targetRowIndices.length === 0) {
                    showToast("Tất cả các buổi học đều đã được đóng học phí!", "info");
                    return;
                }
                
                showCustomConfirm("Xác nhận đóng học phí hàng loạt cho " + targetRowIndices.length + " buổi học chưa thanh toán?", function() {
                    masterChk.checked = true;
                    chks.forEach(function(c) {
                        c.checked = true;
                        syncCheckboxAndCheckAll(c);
                        _pendingTuitionUpdates[c.getAttribute('data-rowindex')] = true;
                    });
                    
                    showSyncToast('pending');
                    clearTimeout(_tuitionSyncTimer);
                    _tuitionSyncTimer = setTimeout(flushTuitionUpdates, 1500);
                });
            } else {
                masterChk.checked = true; // Tạm giữ check để chờ confirm
                var targetRowIndices = [];
                chks.forEach(function(c) {
                    if (c.checked) {
                        var rIndex = c.getAttribute('data-rowindex');
                        if (targetRowIndices.indexOf(rIndex) === -1) {
                            targetRowIndices.push(rIndex);
                        }
                    }
                });
                
                if (targetRowIndices.length === 0) {
                    masterChk.checked = false;
                    return;
                }
                
                showCustomConfirm("Bạn có chắc chắn muốn hủy trạng thái đóng học phí cho TOÀN BỘ " + targetRowIndices.length + " buổi học?", function() {
                    masterChk.checked = false;
                    chks.forEach(function(c) {
                        c.checked = false;
                        syncCheckboxAndCheckAll(c);
                        _pendingTuitionUpdates[c.getAttribute('data-rowindex')] = false;
                    });
                    
                    showSyncToast('pending');
                    clearTimeout(_tuitionSyncTimer);
                    _tuitionSyncTimer = setTimeout(flushTuitionUpdates, 1500);
                });
            }
        }

        function checkTutorLessonCheckboxSelection(chkEl) {
            if (!chkEl) return;
            var rIndex = chkEl.getAttribute('data-rowindex');
            
            if (chkEl.checked) {
                chkEl.checked = false; // Tạm bỏ check chờ confirm
                showCustomConfirm("Xác nhận đóng học phí cho buổi học này?", function() {
                    chkEl.checked = true;
                    syncCheckboxAndCheckAll(chkEl);
                    queueTuitionUpdate(rIndex, true);
                });
            } else {
                chkEl.checked = true; // Tạm giữ check chờ confirm
                showCustomConfirm("Bạn có chắc chắn muốn hủy trạng thái đã đóng học phí của buổi học này?", function() {
                    chkEl.checked = false;
                    syncCheckboxAndCheckAll(chkEl);
                    queueTuitionUpdate(rIndex, false);
                });
            }
        }

        function syncCheckboxAndCheckAll(chkEl) {
            if (chkEl) {
                var rIndex = chkEl.getAttribute('data-rowindex');
                var state = chkEl.checked;
                var mates = document.querySelectorAll('.tutor-lesson-chk[data-rowindex="' + rIndex + '"]');
                mates.forEach(function(m) {
                    m.checked = state;
                });
            }
            
            var chks = document.querySelectorAll('.tutor-lesson-chk');
            var allChecked = true;
            chks.forEach(function(c) {
                if (!c.checked) allChecked = false;
            });
            var master = document.getElementById('tutorSelectAllLessons');
            if (master) {
                master.checked = allChecked && chks.length > 0;
            }
        }

        // --- Render tutor student history list ---
        function renderTutorStudentHistory(logs) {
            var container = document.getElementById('tutorStudentHistory');
            if (!container) return;
            
            var totalBuoi = logs.length;
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

                var htmlLichSu = "";
                
                // 1. Desktop View (Table)
                htmlLichSu += "<div class='desktop-table-view'>";
                htmlLichSu += "<table><tr><th style='width: 105px; text-align: center;' title='Tích chọn để đóng học phí hàng loạt cho tất cả các buổi học chưa đóng'><div style='display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer;' onclick='var c=document.getElementById(\"tutorSelectAllLessons\"); if(c){c.checked=!c.checked;toggleSelectAllTutorLessons(c);}event.stopPropagation();'><input type='checkbox' id='tutorSelectAllLessons' onchange='toggleSelectAllTutorLessons(this)' onclick='event.stopPropagation();' style='cursor: pointer; width: 15px; height: 15px;' title='Tích chọn để đóng học phí cho tất cả các buổi'><span style='font-size: 12px; font-weight: bold; display: inline-flex; align-items: center; gap: 4px; user-select: none;'><i class='fa-solid fa-wallet' style='color:#10B981;'></i> Đóng tiền</span></div></th><th>Tuần</th><th>Ngày dạy</th><th>Môn</th><th>Nội dung</th><th>Đánh giá BTVN</th><th>KT Đầu giờ</th><th>KT Định kì</th><th>Trạng thái</th><th style='width: 90px; text-align: center;'>Thao tác</th></tr>";
                
                // 2. Mobile View (Accordion list)
                var htmlMobile = "<div class='mobile-cards-view'>";
                htmlMobile += "  <div class='mobile-select-all-container' style='display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; margin-bottom: 12px;'>";
                htmlMobile += "      <input type='checkbox' id='tutorSelectAllLessonsMobile' onchange='toggleSelectAllTutorLessons(this)' style='cursor: pointer; width: 16px; height: 16px;' title='Tích chọn để đóng học phí cho tất cả các buổi'>";
                htmlMobile += "      <label for='tutorSelectAllLessonsMobile' style='cursor: pointer; font-size: 13.5px; font-weight: bold; margin: 0; user-select: none; display: inline-flex; align-items: center; gap: 6px;'><i class='fa-solid fa-wallet' style='color:#10B981;'></i> Đóng học phí tất cả các buổi</label>";
                htmlMobile += "  </div>";

                logs.slice().reverse().forEach(function(item, idx) {
                    var styleStr = (idx >= 5) ? 'style="display: none;" class="tutor-history-row tutor-hidden-row"' : 'class="tutor-history-row"';
                    
                    var isPaid = (item.tienDong || "").trim().toLowerCase().indexOf("đã đóng") !== -1;
                    var tt = (item.trangThai || "").trim().toLowerCase();
                    var isDaBu = (tt.indexOf("đã bù") !== -1 || tt === "học bù");
                    var isPresent = (tt.indexOf("đã học") !== -1 || tt === "có mặt" || tt === "có");
                    
                    var chkHtml = "";
                    var mobileChkHtml = "";
                    if (isPresent || isDaBu) {
                        var isChecked = isPaid ? "checked" : "";
                        var titleText = isPaid ? "Đã đóng học phí (Bấm để HỦY đóng tiền)" : "Chưa đóng học phí (Bấm để báo ĐÃ ĐÓNG TIỀN)";
                        chkHtml = '<input type="checkbox" class="tutor-lesson-chk" data-rowindex="' + item.rowIndex + '" data-tuan="' + (item.tuan || "") + '" onchange="checkTutorLessonCheckboxSelection(this)" style="cursor: pointer; width: 16px; height: 16px;" title="' + titleText + '" ' + isChecked + '>';
                        mobileChkHtml = '<input type="checkbox" class="tutor-lesson-chk" data-rowindex="' + item.rowIndex + '" data-tuan="' + (item.tuan || "") + '" onclick="event.stopPropagation();" onchange="checkTutorLessonCheckboxSelection(this)" style="margin-right: 8px; width: 16px; height: 16px; cursor: pointer;" title="' + titleText + '" ' + isChecked + '>';
                    } else {
                        chkHtml = '<span style="color: rgba(255,255,255,0.2); font-size: 12px;">-</span>';
                        mobileChkHtml = '<span style="color: rgba(255,255,255,0.2); font-size: 12px; margin-right: 8px;">-</span>';
                    }

                    // Desktop Row
                    htmlLichSu += "<tr " + styleStr + ">";
                    htmlLichSu += "<td style='text-align: center;'>" + chkHtml + "</td>";
                    htmlLichSu += "<td>" + (item.tuan || "") + "</td>";
                    htmlLichSu += "<td>" + (item.ngay || "") + "</td>";
                    htmlLichSu += "<td>" + (item.mon || "") + "</td>";
                    htmlLichSu += "<td>" + (item.noiDung || "") + "</td>";
                    htmlLichSu += "<td>" + getBtvnBadge(item.btvn) + "</td>";
                    htmlLichSu += "<td>" + (item.diemDauGio || "") + "</td>";
                    htmlLichSu += "<td>" + (item.diemDinhKi || "") + "</td>";
                    htmlLichSu += "<td>" + getStatusBadge(item.trangThai) + "</td>";
                    htmlLichSu += "<td style='text-align: center; white-space: nowrap;'>" +
                                  "  <button onclick='openEditLessonModal(\"" + item.rowIndex + "\")' class='btn-icon-edit' title='Sửa buổi học' style='margin: 0; padding: 4px;'><i class='fa-solid fa-pen-to-square'></i></button>" +
                                  "  <button onclick='duplicateLesson(\"" + item.rowIndex + "\")' class='btn-icon-edit' title='Nhân bản buổi học' style='margin: 0 0 0 8px; padding: 4px; color: #10B981;'><i class='fa-solid fa-copy'></i></button>" +
                                  "</td>";
                    htmlLichSu += "</tr>";

                    // Mobile Row (Accordion Card)
                    var mobileStyleStr = (idx >= 5) ? 'style="display: none;" class="accordion-item tutor-history-row tutor-hidden-row"' : 'class="accordion-item tutor-history-row"';
                    htmlMobile += "<div " + mobileStyleStr + ">";
                    htmlMobile += "  <div class='accordion-header' onclick='toggleTutorAccordion(" + idx + ")'>";
                    htmlMobile += "    <div style='display: flex; align-items: center;'>";
                    htmlMobile += "      " + mobileChkHtml;
                    htmlMobile += "      <div class='accordion-header-title'>";
                    htmlMobile += "        <span>" + (item.tuan || "") + "</span>";
                    htmlMobile += "        <span class='accordion-header-date'>" + (item.ngay || "") + "</span>";
                    htmlMobile += "      </div>";
                    htmlMobile += "    </div>";
                    htmlMobile += "    <div class='accordion-header-status'>";
                    htmlMobile += "      " + getStatusBadge(item.trangThai);
                    htmlMobile += "      <i class='fa-solid fa-chevron-down' id='tutor-chevron-" + idx + "'></i>";
                    htmlMobile += "    </div>";
                    htmlMobile += "  </div>";
                    htmlMobile += "  <div class='accordion-body' id='tutor-accordion-body-" + idx + "'>";
                    htmlMobile += "    <div class='accordion-body-row'><span class='accordion-body-label'>Môn học</span><span class='accordion-body-val'>" + (item.mon || "") + "</span></div>";
                    htmlMobile += "    <div class='accordion-body-row'><span class='accordion-body-label'>Nội dung dạy học</span><span class='accordion-body-val'>" + (item.noiDung || "") + "</span></div>";
                    htmlMobile += "    <div class='accordion-body-row'><span class='accordion-body-label'>Đánh giá bài tập về nhà</span><span class='accordion-body-val'>" + getBtvnBadge(item.btvn) + "</span></div>";
                    htmlMobile += "    <div class='accordion-body-row'><span class='accordion-body-label'>Kiểm tra đầu giờ</span><span class='accordion-body-val'>" + (item.diemDauGio || "") + "</span></div>";
                    htmlMobile += "    <div class='accordion-body-row'><span class='accordion-body-label'>Kiểm tra định kì</span><span class='accordion-body-val'>" + (item.diemDinhKi || "") + "</span></div>";
                    htmlMobile += "    <div class='accordion-body-row' style='justify-content: space-between; gap: 10px; border-top: 1px dashed rgba(255,255,255,0.05); padding-top: 10px; margin-top: 5px; width: 100%;'>";
                    htmlMobile += "      <button onclick='duplicateLesson(\"" + item.rowIndex + "\")' class='modal-btn modal-btn-primary' style='flex: 1; border-radius: 20px; font-size: 12px; background: linear-gradient(135deg, #8E4DFF 0%, #5B21B6 100%); border: none; color: #FFF; font-weight: bold; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px;'><i class='fa-solid fa-copy'></i> Nhân bản</button>";
                    htmlMobile += "      <button onclick='openEditLessonModal(\"" + item.rowIndex + "\")' class='modal-btn modal-btn-secondary' style='flex: 1; border-radius: 20px; font-size: 12px; display: inline-flex; align-items: center; justify-content: center; gap: 6px;'><i class='fa-solid fa-pen-to-square'></i> Sửa</button>";
                    htmlMobile += "    </div>";
                    htmlMobile += "  </div>";
                    htmlMobile += "</div>";

                });

                htmlLichSu += "</table></div>";
                htmlMobile += "</div>";

                var totalHtml = htmlLichSu + htmlMobile;
                
                if (totalBuoi > 5) {
                    totalHtml += "<div class='show-more-btn-container' id='tutorShowMoreBox' style='margin-top: 15px; text-align: center;'>";
                    totalHtml += "  <button class='btn-show-more' onclick='toggleTutorShowMore()' id='btnTutorShowMore'>Xem thêm</button>";
                    totalHtml += "</div>";
                }
                
                container.innerHTML = totalHtml;
                syncCheckboxAndCheckAll(); // Cập nhật trạng thái của nút chọn tất cả
            } else {
                container.innerHTML = "<p style='color: #A6ADCE; text-align: center; padding: 20px;'>Học sinh này chưa có dữ liệu nhật ký học tập nào.</p>";
            }
        }

        function toggleTutorAccordion(idx) {
            var body = document.getElementById('tutor-accordion-body-' + idx);
            var chevron = document.getElementById('tutor-chevron-' + idx);
            if (!body) return;
            
            var item = body.closest('.accordion-item');
            var isActive = item.classList.contains('active');
            
            var allBodies = document.querySelectorAll('[id^="tutor-accordion-body-"]');
            allBodies.forEach(function(b) {
                b.style.display = 'none';
                var it = b.closest('.accordion-item');
                if (it) it.classList.remove('active');
            });
            var allChevrons = document.querySelectorAll('[id^="tutor-chevron-"]');
            allChevrons.forEach(function(c) {
                c.classList.remove('fa-chevron-up');
                c.classList.add('fa-chevron-down');
            });
            
            if (!isActive) {
                body.style.display = 'block';
                item.classList.add('active');
                chevron.classList.remove('fa-chevron-down');
                chevron.classList.add('fa-chevron-up');
            }
        }

        var tutorExpanded = false;
        function toggleTutorShowMore() {
            var hiddenRows = document.querySelectorAll('.tutor-hidden-row');
            var btn = document.getElementById('btnTutorShowMore');
            tutorExpanded = !tutorExpanded;
            
            hiddenRows.forEach(function(row) {
                row.style.display = tutorExpanded ? (row.classList.contains('accordion-item') ? 'block' : 'table-row') : 'none';
            });
            
            btn.innerText = tutorExpanded ? "Thu gọn" : "Xem thêm";
        }

        function refreshTutorStudentHistory() {
            if (!currentTutorStudent) return;
            var button = document.querySelector('[onclick="refreshTutorStudentHistory()"]');
            var icon = button ? button.querySelector('i') : null;
            if (icon) icon.classList.add('fa-spin');
            
            google.script.run.withSuccessHandler(function(res) {
                if (icon) icon.classList.remove('fa-spin');
                currentTutorStudent.logs = res.logs || [];
                renderInvoice();
                renderTutorChart(res.logs || []);
                renderTutorStudentHistory(res.logs || []);
                showToast("Đã cập nhật dữ liệu mới nhất!", "success");
            }).getStudentDetailsForTutor(currentTutorStudent.phone);
        }

        // --- Edit lesson handlers ---
        function openEditLessonModal(rowIndex) {
            var log = null;
            if (currentTutorStudent && currentTutorStudent.logs) {
                for (var i = 0; i < currentTutorStudent.logs.length; i++) {
                    if (currentTutorStudent.logs[i].rowIndex == rowIndex || String(currentTutorStudent.logs[i].rowIndex) === String(rowIndex)) {
                        log = currentTutorStudent.logs[i];
                        break;
                    }
                }
            }

            if (!log) {
                showToast("Không tìm thấy thông tin buổi học.", "error");
                return;
            }
            
            document.getElementById('editLesRowIndex').value = rowIndex;
            document.getElementById('editLesTuan').value = log.tuan || "";
            
            var ngayValue = log.ngay || "";
            if (ngayValue.includes("/") && !ngayValue.includes("/202")) {
                var year = new Date().getFullYear();
                ngayValue = ngayValue + "/" + year;
            }
            document.getElementById('editLesNgay').value = ngayValue;
            document.getElementById('editLesMon').value = mapSubjectToSelectValue(log.mon);
            
            var tt = log.trangThai || "Đã học";
            if (tt.trim().toLowerCase() === "hủy/nghỉ") {
                tt = "Hủy/ nghỉ";
            }
            document.getElementById('editLesTrangThai').value = tt;
            document.getElementById('editLesBtvn').value = log.btvn || "Hoàn thành";
            document.getElementById('editLesDiemDau').value = log.diemDauGio || "Không có";
            document.getElementById('editLesDiemDinhKi').value = log.diemDinhKi || "Không có";
            document.getElementById('editLesNoiDung').value = log.noiDung || "";
            
            document.getElementById('editLessonModal').style.display = "flex";
        }

        function closeEditLessonModal() {
            document.getElementById('editLessonModal').style.display = "none";
        }

        function saveEditedLesson() {
            var rowIndex = document.getElementById('editLesRowIndex').value;
            var tuan = document.getElementById('editLesTuan').value.trim();
            var ngayVal = document.getElementById('editLesNgay').value.trim();
            var mon = document.getElementById('editLesMon').value;
            var trangThai = document.getElementById('editLesTrangThai').value;
            var btvn = document.getElementById('editLesBtvn').value;
            var diemDau = document.getElementById('editLesDiemDau').value.trim();
            var diemDinhKi = document.getElementById('editLesDiemDinhKi').value.trim();
            var noiDung = document.getElementById('editLesNoiDung').value.trim();
            
            if(!tuan || !ngayVal || !noiDung) {
                showToast("Vui lòng điền đầy đủ Tuần, Ngày học và Nội dung nhận xét!", "error");
                return;
            }
            
            var dateFormatted = "";
            if (ngayVal.includes("/")) {
                var parts = ngayVal.split("/");
                if (parts.length >= 2) {
                    dateFormatted = parts[0] + "/" + parts[1]; // DD/MM
                } else {
                    dateFormatted = ngayVal;
                }
            } else if (ngayVal.includes("-")) {
                var parts = ngayVal.split("-");
                if (parts.length >= 3) {
                    dateFormatted = parts[2] + "/" + parts[1]; // DD/MM
                } else {
                    dateFormatted = ngayVal;
                }
            } else {
                dateFormatted = ngayVal;
            }
            
            showCustomConfirm("Bạn có chắc chắn muốn cập nhật thông tin buổi học này?", function() {
                // 1. Cập nhật cục bộ
                if (currentTutorStudent && currentTutorStudent.logs) {
                    let log = currentTutorStudent.logs.find(l => l.rowIndex === rowIndex || (typeof l.rowIndex === 'number' && String(l.rowIndex) === String(rowIndex)) || l.tempId === rowIndex);
                    if (log) {
                        log.tuan = tuan;
                        log.ngay = dateFormatted;
                        log.mon = mon;
                        log.trangThai = trangThai;
                        log.btvn = btvn;
                        log.diemDauGio = diemDau;
                        log.diemDinhKi = diemDinhKi;
                        log.noiDung = noiDung;
                    }
                }
                
                // 2. Render lại UI ngay lập tức
                renderInvoice();
                if (currentTutorStudent && currentTutorStudent.logs) {
                    renderTutorChart(currentTutorStudent.logs);
                    renderTutorStudentHistory(currentTutorStudent.logs);
                }
                
                // 3. Đóng modal
                closeEditLessonModal();
                showToast("Đã cập nhật thông tin buổi học!", "success");
                
                // 4. Đẩy vào hàng đợi sync ngầm
                queueLessonOperation({
                    type: 'edit',
                    rowIndex: rowIndex,
                    data: {
                        tuan: tuan,
                        ngay: dateFormatted,
                        mon: mon,
                        noiDung: noiDung,
                        btvn: btvn,
                        diemDau: diemDau,
                        diemDinhKi: diemDinhKi,
                        trangThai: trangThai
                    }
                });
            });
        }


        // --- Schedule handlers ---
        function openEditScheduleModal(studentName, mon, tue, wed, thu, fri, sat, sun) {
            document.getElementById('schStudentName').value = studentName;
            document.getElementById('schMon').value = mon === "undefined" ? "" : mon;
            document.getElementById('schTue').value = tue === "undefined" ? "" : tue;
            document.getElementById('schWed').value = wed === "undefined" ? "" : wed;
            document.getElementById('schThu').value = thu === "undefined" ? "" : thu;
            document.getElementById('schFri').value = fri === "undefined" ? "" : fri;
            document.getElementById('schSat').value = sat === "undefined" ? "" : sat;
            document.getElementById('schSun').value = sun === "undefined" ? "" : sun;
            
            document.getElementById('editScheduleModal').style.display = "flex";
        }

        function closeEditScheduleModal() {
            document.getElementById('editScheduleModal').style.display = "none";
        }

        function saveSchedule() {
            var studentName = document.getElementById('schStudentName').value;
            var mon = document.getElementById('schMon').value.trim();
            var tue = document.getElementById('schTue').value.trim();
            var wed = document.getElementById('schWed').value.trim();
            var thu = document.getElementById('schThu').value.trim();
            var fri = document.getElementById('schFri').value.trim();
            var sat = document.getElementById('schSat').value.trim();
            var sun = document.getElementById('schSun').value.trim();
            
            var btn = document.getElementById('btnSaveSchedule');
            btn.disabled = true;
            btn.innerText = "Đang lưu...";
            
            google.script.run
                .withSuccessHandler(function(res) {
                    btn.disabled = false;
                    btn.innerText = "Cập nhật";
                    if(res.error) {
                        showToast("Lỗi: " + res.error, "error");
                    } else {
                        showToast("Cập nhật thời khóa biểu thành công!", "success");
                        closeEditScheduleModal();
                        
                        // Reload schedule table
                        google.script.run.withSuccessHandler(function(schedule) {
                            var table = document.getElementById('tutorScheduleTable');
                            table.innerHTML = "<tr><th>Học sinh</th><th>Thứ 2</th><th>Thứ 3</th><th>Thứ 4</th><th>Thứ 5</th><th>Thứ 6</th><th>Thứ 7</th><th>CN</th><th style='width: 50px;'>Sửa</th></tr>";
                            var schedMap = {};
                            if(schedule && schedule.length > 0) {
                                schedule.forEach(function(s) {
                                    schedMap[s.studentName.trim()] = s;
                                });
                            }
                            if(tutorDataGlobal && tutorDataGlobal.students) {
                                tutorDataGlobal.students.forEach(function(st) {
                                    var s = schedMap[st.name.trim()] || { mon: "", tue: "", wed: "", thu: "", fri: "", sat: "", sun: "" };
                                    table.innerHTML += "<tr>" +
                                        "<td style='font-weight:bold; color:#FFD23F;'>" + st.name + "</td>" +
                                        "<td>" + formatScheduleCell(s.mon) + "</td>" +
                                        "<td>" + formatScheduleCell(s.tue) + "</td>" +
                                        "<td>" + formatScheduleCell(s.wed) + "</td>" +
                                        "<td>" + formatScheduleCell(s.thu) + "</td>" +
                                        "<td>" + formatScheduleCell(s.fri) + "</td>" +
                                        "<td>" + formatScheduleCell(s.sat) + "</td>" +
                                        "<td>" + formatScheduleCell(s.sun) + "</td>" +
                                        "<td><button onclick='openEditScheduleModal(\"" + st.name.replace(/'/g, "\\'").replace(/"/g, '&quot;') + "\", \"" + (s.mon||"") + "\", \"" + (s.tue||"") + "\", \"" + (s.wed||"") + "\", \"" + (s.thu||"") + "\", \"" + (s.fri||"") + "\", \"" + (s.sat||"") + "\", \"" + (s.sun||"") + "\")' class='btn-icon-edit' style='margin: 0; padding: 4px;' title='Sửa thời khóa biểu'><i class='fa-solid fa-pen-to-square'></i></button></td>" +
                                        "</tr>";
                                });
                            }
                        }).getTutorSchedule(tutorDataGlobal.tutorPhone);
                    }
                })
                .withFailureHandler(function(err) {
                    btn.disabled = false;
                    btn.innerText = "Cập nhật";
                    showToast("Lỗi kết nối hoặc hệ thống: " + err.toString(), "error");
                })
                .capNhatThoiKhoaBieu(tutorDataGlobal.tutorPhone, studentName, mon, tue, wed, thu, fri, sat, sun);
        }

        // --- Invoice collapsible handlers ---
        function toggleInvoiceCollapse() {
            var container = document.getElementById('invoiceCollapseContainer');
            var btn = document.getElementById('btnToggleInvoice');
            if (container.style.display === "none") {
                container.style.display = "block";
                btn.innerHTML = '<i class="fa-solid fa-chevron-up"></i> Thu gọn Hóa Đơn';
                renderInvoice();
                // Cuộn xuống vùng hóa đơn mượt mà
                container.scrollIntoView({ behavior: 'smooth' });
            } else {
                container.style.display = "none";
                btn.innerHTML = '<i class="fa-solid fa-file-invoice-dollar"></i> Xuất Hóa Đơn (Phiếu Học Tập)';
            }
        }

        // --- Trash & PIN verify handlers ---
        function openTrashModal() {
            renderTrashList();
            document.getElementById('trashModal').style.display = "flex";
        }

        function closeTrashModal() {
            document.getElementById('trashModal').style.display = "none";
        }

        function renderTrashList() {
            var container = document.getElementById('trashStudentList');
            if (!container) return;
            container.innerHTML = "";

            if (!tutorDataGlobal || !tutorDataGlobal.deletedStudents || tutorDataGlobal.deletedStudents.length === 0) {
                container.innerHTML = "<div style='text-align: center; color: #A6ADCE; font-size: 13px; padding: 20px;'>Thùng rác trống.</div>";
                return;
            }

            tutorDataGlobal.deletedStudents.forEach(function(st) {
                var card = document.createElement('div');
                card.style.background = "rgba(255,255,255,0.03)";
                card.style.border = "1px solid rgba(255,255,255,0.08)";
                card.style.borderRadius = "8px";
                card.style.padding = "10px 15px";
                card.style.display = "flex";
                card.style.justifyContent = "space-between";
                card.style.alignItems = "center";
                card.style.gap = "10px";

                var info = document.createElement('div');
                info.innerHTML = "<div style='color: #FFF; font-weight: bold; font-size: 14px;'>" + st.name + "</div>" +
                                 "<div style='color: #A6ADCE; font-size: 12px; margin-top: 3px;'>SĐT: " + st.phone + "</div>" +
                                 "<div style='color: #EF4444; font-size: 11px; margin-top: 3px;'>Đã xóa lúc: " + st.deletedDate + "</div>";

                var btnRestore = document.createElement('button');
                btnRestore.className = "modal-btn modal-btn-primary";
                btnRestore.style.width = "auto";
                btnRestore.style.padding = "6px 12px";
                btnRestore.style.fontSize = "12px";
                btnRestore.style.borderRadius = "6px";
                btnRestore.innerHTML = "<i class='fa-solid fa-trash-arrow-up'></i> Khôi phục";
                btnRestore.onclick = function() {
                    restoreStudent(st.phone);
                };

                card.appendChild(info);
                card.appendChild(btnRestore);
                container.appendChild(card);
            });
        }

        // --- Student delete logic with PIN verification ---
        function confirmDeleteStudent() {
            pinVerifyAction = "deleteStudent";
            document.getElementById('confirmTutorPinInput').value = "";
            document.getElementById('pinConfirmModal').style.display = "flex";
        }

        function closePinConfirmModal() {
            document.getElementById('pinConfirmModal').style.display = "none";
        }

        function submitPinVerifyForDelete() {
            var inputPin = document.getElementById('confirmTutorPinInput').value.trim();
            
            if (pinVerifyAction === "deleteTutor") {
                var adminPin = document.getElementById('maPin').value.trim();
                if (inputPin === adminPin) {
                    closePinConfirmModal();
                    closeAdminEditTutorModal();
                    deleteTutorBackend();
                } else {
                    showToast("Mã PIN xác thực của Admin không chính xác!", "error");
                }
            } else {
                if (!tutorDataGlobal) return;
                var truePin = (tutorDataGlobal.tutorPin || "").trim();
                if (inputPin === truePin) {
                    closePinConfirmModal();
                    closeEditStudentModal();
                    deleteStudentBackend();
                } else {
                    showToast("Mã PIN xác thực không chính xác!", "error");
                }
            }
        }

        function deleteStudentBackend() {
            if (!currentTutorStudent) return;
            showCustomConfirm("Xác nhận đưa học sinh " + currentTutorStudent.name + " vào thùng rác? Học sinh sẽ ẩn khỏi danh sách và bị xóa vĩnh viễn trên sheet sau 10 ngày.", function() {
                google.script.run
                    .withSuccessHandler(function(res) {
                        if (res.error) {
                            showToast("Lỗi: " + res.error, "error");
                        } else {
                            showToast("Đã đưa học sinh vào thùng rác!", "success");
                            // Tải lại bảng điều khiển gia sư để cập nhật danh sách học sinh mới
                            refreshTutorDashboard();
                        }
                    })
                    .withFailureHandler(function(err) {
                        showToast("Lỗi kết nối hoặc hệ thống: " + err.toString(), "error");
                    })
                    .xoaHocSinhTamThoi(tutorDataGlobal.tutorPhone, currentTutorStudent.phone);
            });
        }

        function restoreStudent(studentPhone) {
            google.script.run
                .withSuccessHandler(function(res) {
                    if (res.error) {
                        showToast("Lỗi: " + res.error, "error");
                    } else {
                        showToast("Khôi phục học sinh thành công!", "success");
                        closeTrashModal();
                        refreshTutorDashboard();
                    }
                })
                .withFailureHandler(function(err) {
                    showToast("Lỗi kết nối hoặc hệ thống: " + err.toString(), "error");
                })
                .khoiPhucHocSinh(tutorDataGlobal.tutorPhone, studentPhone);
        }

        function refreshTutorDashboard() {
            // Đăng nhập lại bằng số điện thoại và PIN cũ để cập nhật toàn bộ trạng thái Dashboard mới
            google.script.run
                .withSuccessHandler(function(loginRes) {
                    if(loginRes.role === 'tutor') {
                        tutorDataGlobal = loginRes.data;
                        renderTutorView(loginRes.data);
                    } else {
                        location.reload();
                    }
                })
                .loginSystem(tutorDataGlobal.tutorPhone, tutorDataGlobal.tutorPin);
        }

        // --- Lesson log delete logic ---
        function confirmDeleteLesson() {
            var rowIndex = document.getElementById('editLesRowIndex').value;
            if (!rowIndex) return;

            showCustomConfirm("Bạn có chắc chắn muốn xóa hoàn toàn buổi học này?", function() {
                // 1. Cập nhật cục bộ: lọc bỏ dòng bị xóa
                if (currentTutorStudent && currentTutorStudent.logs) {
                    currentTutorStudent.logs = currentTutorStudent.logs.filter(l => 
                        l.rowIndex !== rowIndex && 
                        !(typeof l.rowIndex === 'number' && String(l.rowIndex) === String(rowIndex)) && 
                        l.tempId !== rowIndex
                    );
                }
                
                // 2. Render lại UI ngay lập tức
                renderInvoice();
                if (currentTutorStudent && currentTutorStudent.logs) {
                    renderTutorChart(currentTutorStudent.logs);
                    renderTutorStudentHistory(currentTutorStudent.logs);
                }
                
                // 3. Đóng modal
                closeEditLessonModal();
                showToast("Đã xóa buổi học!", "success");
                
                // 4. Đẩy vào hàng đợi sync ngầm
                queueLessonOperation({
                    type: 'delete',
                    rowIndex: rowIndex
                });
            });
        }


        // --- Admin Dashboard JS Controllers ---

        // --- Unpaid lessons lists handlers ---
        function selectAllUnpaidSessions(master) {
            var chks = document.querySelectorAll('.unpaid-chk');
            chks.forEach(function(chk) {
                chk.checked = master.checked;
            });
        }

        function submitMarkSessionsPaid() {
            var checked = document.querySelectorAll('.unpaid-chk:checked');
            if (checked.length === 0) {
                showToast("Vui lòng chọn ít nhất một buổi học!", "error");
                return;
            }
            
            var rowIndices = [];
            checked.forEach(function(chk) {
                rowIndices.push(parseInt(chk.value));
            });
            
            var btn = document.getElementById('btnMarkPaid');
            btn.disabled = true;
            var originalText = btn.innerText;
            btn.innerText = "Đang lưu...";
            
            google.script.run
                .withSuccessHandler(function(res) {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Xác nhận Đóng học phí';
                    if (res.error) {
                        showToast("Lỗi: " + res.error, "error");
                    } else {
                        showToast("Cập nhật trạng thái đóng học phí thành công!", "success");
                        // Refresh học sinh
                        refreshTutorStudentHistory();
                    }
                })
                .withFailureHandler(function(err) {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Xác nhận Đóng học phí';
                    showToast("Lỗi kết nối hoặc hệ thống: " + err.toString(), "error");
                })
                .capNhatDongHocPhiBuoiHoc(rowIndices);
        }

        // Hook renderInvoice để nạp danh sách buổi học chưa đóng vào Collapsible Invoice Container
        var originalRenderInvoice = renderInvoice;
        renderInvoice = function() {
            originalRenderInvoice();
            
            // Nạp danh sách checkbox buổi học chưa đóng
            var container = document.getElementById('unpaidLessonsListContainer');
            if (!container) return;
            container.innerHTML = "";
            
            var masterSelectAll = document.getElementById('chkSelectAllUnpaid');
            if(masterSelectAll) masterSelectAll.checked = false;
            
            var unpaidCount = 0;
            if (currentTutorStudent && currentTutorStudent.logs) {
                currentTutorStudent.logs.forEach(function(log) {
                    if (log.tuan !== "" && log.tienDong !== "Đã đóng") {
                        unpaidCount++;
                        var div = document.createElement('div');
                        div.style.display = "flex";
                        div.style.alignItems = "center";
                        div.style.gap = "10px";
                        div.style.padding = "8px 10px";
                        div.style.background = "rgba(255,255,255,0.03)";
                        div.style.borderRadius = "8px";
                        div.style.border = "1px solid rgba(255,255,255,0.05)";
                        
                        div.innerHTML = '<input type="checkbox" class="unpaid-chk" value="' + log.rowIndex + '" style="cursor:pointer; width:16px; height:16px; accent-color:#8E4DFF;">' +
                                        '<span style="color: #FFF; font-size: 13px;">' +
                                          '<b>Tuần ' + log.tuan + '</b> (' + log.ngay + ') - ' + log.mon + ' - <span class="badge" style="background:rgba(245,158,11,0.1); color:#F59E0B; padding:2px 6px;">' + log.trangThai + '</span>' +
                                        '</span>';
                        container.appendChild(div);
                    }
                });
            }
            
            var btn = document.getElementById('btnMarkPaid');
            if (unpaidCount === 0) {
                container.innerHTML = '<div style="color: #A6ADCE; font-size: 13px; text-align: center; padding: 15px;"><i class="fa-solid fa-circle-check" style="color:#10B981;"></i> Tất cả buổi học đã đóng học phí!</div>';
                if(btn) btn.disabled = true;
            } else {
                if(btn) btn.disabled = false;
            }
        };

// ================= TUTOR HOMEWORK FRONTEND CONTROLLER =================

var currentTutorHwFile = null;
var assignedHwListGlobal = [];
var assignedHwTrashGlobal = [];
var studentSubmissionsGlobal = [];
var isEditingAssignedHw = false;
var editingAssignedHwRowIndex = null;
var submissionsLimit = 5;

// 1. Accordion Toggle Section Bài tập (Đã lược bỏ chế độ thu gọn theo yêu cầu)
function toggleTutorHomeworkSection() {
    // Không làm gì cả
}

// 2. Chuyển đổi Tab điều khiển
function switchTutorHwTab(tabName) {
    var tabAssignBtn = document.getElementById('tabAssignBtn');
    var tabSubmitBtn = document.getElementById('tabSubmitBtn');
    var tabContentAssign = document.getElementById('tabContentAssign');
    var tabContentSubmit = document.getElementById('tabContentSubmit');
    
    if (tabName === 'assign') {
        tabAssignBtn.classList.add('active');
        tabSubmitBtn.classList.remove('active');
        tabContentAssign.style.display = 'block';
        tabContentSubmit.style.display = 'none';
        
        loadTutorAssignedHomework();
    } else {
        tabAssignBtn.classList.remove('active');
        tabSubmitBtn.classList.add('active');
        tabContentAssign.style.display = 'none';
        tabContentSubmit.style.display = 'block';
        
        loadStudentSubmissions();
    }
}

// 3. Form Giao bài tập
function openAssignHwForm() {
    isEditingAssignedHw = false;
    editingAssignedHwRowIndex = null;
    
    document.getElementById('assignHwTitle').value = "";
    var now = new Date();
    document.getElementById('assignHwReleaseDate').value = formatDateDDMMYYYY(now);
    if (document.getElementById('assignHwLink')) {
        document.getElementById('assignHwLink').value = "";
    }
    clearTutorSelectedFile();
    
    document.getElementById('btnSubmitAssignedHw').innerHTML = "Giao bài";
    document.getElementById('assignHwFormContainer').style.display = 'block';
}

function closeAssignHwForm() {
    document.getElementById('assignHwFormContainer').style.display = 'none';
}

// 4. Chuyển đổi tab con (sub-tab) của Giao bài tập
function switchTutorHwSubTab(subTab) {
    var form = document.getElementById('assignHwFormContainer');
    var list = document.getElementById('assignedHwListContainer');
    var btnUpload = document.getElementById('btnShowUploadForm');
    var btnViewList = document.getElementById('btnToggleViewAssignedHw');
    
    if (!form || !list || !btnUpload || !btnViewList) return;
    
    if (subTab === 'upload') {
        form.style.display = 'block';
        list.style.display = 'none';
        
        btnUpload.style.background = 'linear-gradient(135deg, #8E4DFF 0%, #5B21B6 100%)';
        btnUpload.style.color = '#FFF';
        
        btnViewList.style.background = 'rgba(255, 255, 255, 0.05)';
        btnViewList.style.color = '#A6ADCE';
        btnViewList.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        
        openAssignHwForm();
    } else {
        form.style.display = 'none';
        list.style.display = 'block';
        
        btnUpload.style.background = 'rgba(255, 255, 255, 0.05)';
        btnUpload.style.color = '#A6ADCE';
        btnUpload.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        
        btnViewList.style.background = 'linear-gradient(135deg, #8E4DFF 0%, #5B21B6 100%)';
        btnViewList.style.color = '#FFF';
        btnViewList.style.border = 'none';
        
        loadTutorAssignedHomework();
    }
}

// 5. Chọn và Hủy file bài tập giao
function handleTutorHwFileSelect(event) {
    var files = event.target.files;
    if (files.length === 0) return;
    
    var file = files[0];
    // Giới hạn dung lượng 15MB
    if (file.size > 15 * 1024 * 1024) {
        showToast("Dung lượng file tối đa là 15MB!", "error");
        return;
    }
    
    currentTutorHwFile = file;
    document.getElementById('tutorSelectedFileName').innerText = file.name + " (" + formatBytes(file.size) + ")";
    document.getElementById('tutorSelectedFileBox').style.display = 'flex';
    document.getElementById('tutorHwUploadText').innerText = "Đã chọn 1 file";
}

function clearTutorSelectedFile() {
    currentTutorHwFile = null;
    var inputs = ['tutorHwFileInput', 'tutorHwFileInputDesktop', 'tutorHwImageInputMobile', 'tutorHwDocInputMobile'];
    inputs.forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.value = "";
    });
    
    var fileBox = document.getElementById('tutorSelectedFileBox');
    if (fileBox) fileBox.style.display = 'none';
    
    var uploadText = document.getElementById('tutorHwUploadText');
    if (uploadText) uploadText.innerText = "Kéo thả hoặc click chọn file bài tập từ máy...";
}

// 6. Gửi bài tập giao (Tải lên hoặc Cập nhật)
function submitAssignedHomework() {
    if (!currentTutorStudent) {
        showToast("Vui lòng chọn học sinh trước!", "error");
        return;
    }
    
    var title = document.getElementById('assignHwTitle').value.trim();
    var releaseDate = document.getElementById('assignHwReleaseDate').value.trim();
    var externalLink = document.getElementById('assignHwLink') ? document.getElementById('assignHwLink').value.trim() : "";
    var maBaiTap = currentTutorStudent.maBaiTap || "";
    
    if (!title) {
        showToast("Vui lòng nhập Tên bài tập!", "error");
        return;
    }
    
    if (!maBaiTap) {
        showToast("Học sinh này chưa có Mã bài tập! Vui lòng cập nhật thông tin học sinh trước.", "error");
        return;
    }
    
    // Nếu là giao bài mới (không sửa) thì bắt buộc chọn file hoặc nhập link ngoài
    if (!isEditingAssignedHw && !currentTutorHwFile && !externalLink) {
        showToast("Vui lòng đính kèm file hoặc nhập link bài tập!", "error");
        return;
    }
    
    var submitBtn = document.getElementById('btnSubmitAssignedHw');
    submitBtn.disabled = true;
    
    // Hiển thị thanh tiến trình giả lập để nâng cao trải nghiệm người dùng
    var progressContainer = document.getElementById('tutorHwProgressContainer');
    var progressBar = document.getElementById('tutorHwProgressBar');
    var progressText = document.getElementById('tutorHwProgressText');
    
    progressContainer.style.display = 'block';
    progressText.style.display = 'block';
    progressBar.style.width = '0%';
    progressText.innerText = '0%';
    
    var progressInterval = setInterval(function() {
        var currentW = parseFloat(progressBar.style.width) || 0;
        if (currentW < 90) {
            var nextW = currentW + Math.random() * 15;
            if (nextW > 90) nextW = 90;
            progressBar.style.width = nextW + '%';
            progressText.innerText = Math.round(nextW) + '%';
        }
    }, 150);
    
    var proceedWithUpload = function(fileBase64, fileName, mimeType) {
        if (isEditingAssignedHw) {
            // Cập nhật bài cũ
            google.script.run
                .withSuccessHandler(function(res) {
                    clearInterval(progressInterval);
                    progressBar.style.width = '100%';
                    progressText.innerText = '100%';
                    
                    setTimeout(function() {
                        progressContainer.style.display = 'none';
                        progressText.style.display = 'none';
                        submitBtn.disabled = false;
                        
                        if (res.error) {
                            showToast("Lỗi: " + res.error, "error");
                        } else {
                            showToast("Cập nhật bài tập thành công!", "success");
                            closeAssignHwForm();
                            loadTutorAssignedHomework();
                        }
                    }, 300);
                })
                .withFailureHandler(function(err) {
                    clearInterval(progressInterval);
                    progressContainer.style.display = 'none';
                    progressText.style.display = 'none';
                    submitBtn.disabled = false;
                    showToast("Lỗi: " + err.toString(), "error");
                })
                .editAssignedHomework(editingAssignedHwRowIndex, title, releaseDate, fileBase64, fileName, mimeType, externalLink);
        } else {
            // Tải bài mới lên
            google.script.run
                .withSuccessHandler(function(res) {
                    clearInterval(progressInterval);
                    progressBar.style.width = '100%';
                    progressText.innerText = '100%';
                    
                    setTimeout(function() {
                        progressContainer.style.display = 'none';
                        progressText.style.display = 'none';
                        submitBtn.disabled = false;
                        
                        if (res.error) {
                            showToast("Lỗi: " + res.error, "error");
                        } else {
                            showToast("Giao bài tập thành công!", "success");
                            switchTutorHwSubTab('list');
                            loadTutorAssignedHomework();
                        }
                    }, 300);
                })
                .withFailureHandler(function(err) {
                    clearInterval(progressInterval);
                    progressContainer.style.display = 'none';
                    progressText.style.display = 'none';
                    submitBtn.disabled = false;
                    showToast("Lỗi: " + err.toString(), "error");
                })
                .uploadAssignedHomework(tutorDataGlobal.tutorPhone, currentTutorStudent.name, title, releaseDate, fileBase64, fileName, mimeType, maBaiTap, externalLink);
        }
    };
    
    if (currentTutorHwFile) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var content = e.target.result;
            var commaIdx = content.indexOf(',');
            var base64 = content.substring(commaIdx + 1);
            proceedWithUpload(base64, currentTutorHwFile.name, currentTutorHwFile.type);
        };
        reader.onerror = function() {
            clearInterval(progressInterval);
            progressContainer.style.display = 'none';
            progressText.style.display = 'none';
            submitBtn.disabled = false;
            showToast("Lỗi đọc file từ thiết bị!", "error");
        };
        reader.readAsDataURL(currentTutorHwFile);
    } else {
        proceedWithUpload("", "", "");
    }
}

// 7. Lấy danh sách bài tập đã giao từ Sheet
function loadTutorAssignedHomework() {
    if (!currentTutorStudent) return;
    
    var tableBody = document.getElementById('assignedHwTableBody');
    tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#A6ADCE; padding: 15px;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu...</td></tr>';
    
    google.script.run
        .withSuccessHandler(function(res) {
            if (res.error) {
                showToast("Lỗi: " + res.error, "error");
                tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#EF4444; padding: 15px;">Không thể tải dữ liệu!</td></tr>';
                return;
            }
            
            assignedHwListGlobal = res.activeList || [];
            assignedHwTrashGlobal = res.trashList || [];
            
            renderAssignedHwList(assignedHwListGlobal);
            renderTutorHwTrashList(assignedHwTrashGlobal);
        })
        .withFailureHandler(function(err) {
            showToast("Lỗi kết nối: " + err.toString(), "error");
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#EF4444; padding: 15px;">Không thể tải dữ liệu!</td></tr>';
        })
        .getAssignedHomework(currentTutorStudent.name, tutorDataGlobal.tutorPhone);
}

// 8. Render bảng danh sách bài tập hoạt động
var assignedHwShowAll = false;
var ASSIGNED_HW_LIMIT = 5;

function renderAssignedHwList(list, showAll) {
    assignedHwShowAll = !!showAll;
    var tableBody = document.getElementById('assignedHwTableBody');
    var mobileContainer = document.getElementById('assignedHwMobile');
    if (!tableBody) return;
    
    if (!list || list.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#A6ADCE; padding: 20px;"><i class="fa-solid fa-circle-info"></i> Chưa giao bài tập nào cho học sinh này!</td></tr>';
        if (mobileContainer) {
            mobileContainer.innerHTML = '<div style="text-align:center; color:#A6ADCE; padding: 20px; font-size: 13px;"><i class="fa-solid fa-circle-info"></i> Chưa giao bài tập nào cho học sinh này!</div>';
        }
        return;
    }

    // Sắp xếp: bài giao mới nhất lên đầu (dựa vào rowIndex hoặc ngày giao)
    var sortedList = list.slice().sort(function(a, b) {
        if (a.rowIndex && b.rowIndex) {
            return parseInt(b.rowIndex) - parseInt(a.rowIndex);
        }
        return parseDateTimeString(b.releaseDate) - parseDateTimeString(a.releaseDate);
    });
    var totalCount = sortedList.length;
    var limit = showAll ? totalCount : ASSIGNED_HW_LIMIT;
    var visibleList = sortedList.slice(0, limit);

    
    tableBody.innerHTML = "";
    var mobileHtml = "";
    
    visibleList.forEach(function(item, idx) {
        var fileLinkHtml = item.fileUrl ? '<a href="' + item.fileUrl + '" target="_blank" style="color:#8E4DFF; font-weight:600; text-decoration:none; display:inline-flex; align-items:center; gap:6px;"><i class="fa-solid fa-file-pdf"></i> Xem file</a>' : '';
        var extLinkHtml = item.externalLink ? '<a href="' + item.externalLink + '" target="_blank" style="color:#10B981; font-weight:600; text-decoration:none; display:inline-flex; align-items:center; gap:6px;"><i class="fa-solid fa-link"></i> Mở link</a>' : '';
        
        var attachments = [];
        if (fileLinkHtml) attachments.push(fileLinkHtml);
        if (extLinkHtml) attachments.push(extLinkHtml);
        var attachmentsHtml = attachments.join('<br>') || '<span style="color:#A6ADCE;">Không có</span>';
        
        var attachmentsMobile = [];
        if (fileLinkHtml) attachmentsMobile.push(fileLinkHtml);
        if (extLinkHtml) attachmentsMobile.push(extLinkHtml);
        var attachmentsMobileHtml = '<div style="display:flex; flex-direction:column; gap:4px; align-items:flex-end;">' + (attachmentsMobile.join('') || '<span style="color:#A6ADCE;">Không có</span>') + '</div>';

        var actionsHtml = 
            '<div style="display:flex; gap:8px; justify-content:center; align-items:center;">' +
                '<button onclick="startEditAssignedHw(' + item.rowIndex + ', \'' + item.title.replace(/'/g, "\\'") + '\', \'' + item.releaseDate + '\')" class="action-btn-hw-icon action-btn-hw-edit" title="Chỉnh sửa"><i class="fa-solid fa-pen-to-square"></i></button>' +
                '<button onclick="deleteAssignedHomework(' + item.rowIndex + ')" class="action-btn-hw-icon action-btn-hw-delete" title="Xóa tạm thời"><i class="fa-solid fa-trash-can"></i></button>' +
            '</div>';
            
        // Desktop Row
        tableBody.innerHTML += 
            '<tr>' +
                '<td style="color:#A6ADCE;">' + item.releaseDate + '</td>' +
                '<td style="color:#FFF; font-weight:500;">' + item.title + '</td>' +
                '<td>' + attachmentsHtml + '</td>' +
                '<td style="text-align: center; vertical-align: middle;">' + actionsHtml + '</td>' +
            '</tr>';
            
        // Mobile Accordion Card
        mobileHtml += "<div class='accordion-item' id='assign-hw-item-" + idx + "'>";
        mobileHtml += "  <div class='accordion-header' onclick='toggleTutorAssignedHwAccordion(" + idx + ")'>";
        mobileHtml += "    <div class='accordion-header-title'>";
        mobileHtml += "      <span>" + item.title + "</span>";
        mobileHtml += "      <span class='accordion-header-date'>" + item.releaseDate + "</span>";
        mobileHtml += "    </div>";
        mobileHtml += "    <div class='accordion-header-status'>";
        mobileHtml += "      <i class='fa-solid fa-chevron-down' id='assign-hw-chevron-" + idx + "'></i>";
        mobileHtml += "    </div>";
        mobileHtml += "  </div>";
        mobileHtml += "  <div class='accordion-body' id='assign-hw-body-" + idx + "' style='display: none;'>";
        mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Ngày giao</span><span class='accordion-body-val'>" + item.releaseDate + "</span></div>";
        mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Đính kèm</span><span class='accordion-body-val'>" + attachmentsMobileHtml + "</span></div>";
        mobileHtml += "    <div class='accordion-body-row' style='margin-top: 5px;'><span class='accordion-body-label'>Thao tác</span>";
        mobileHtml += "      <span class='accordion-body-val' style='display:inline-flex; gap:10px;'>";
        mobileHtml += "        <button onclick=\"startEditAssignedHw(" + item.rowIndex + ", '" + item.title.replace(/'/g, "\\'") + "', '" + item.releaseDate + "')\" class='action-btn-hw' style='border-color:#F59E0B; color:#F59E0B; cursor:pointer;'><i class='fa-solid fa-pen-to-square'></i> Sửa</button>";
        mobileHtml += "        <button onclick='deleteAssignedHomework(" + item.rowIndex + ")' class='action-btn-hw' style='border-color:#EF4444; color:#EF4444; cursor:pointer;'><i class='fa-solid fa-trash-can'></i> Xóa</button>";
        mobileHtml += "      </span>";
        mobileHtml += "    </div>";
        mobileHtml += "  </div>";
        mobileHtml += "</div>";
    });

    // Nút Xem thêm / Thu gọn
    if (totalCount > ASSIGNED_HW_LIMIT) {
        var remaining = totalCount - ASSIGNED_HW_LIMIT;
        if (!showAll) {
            tableBody.innerHTML += '<tr><td colspan="4" style="text-align:center; padding:10px;">'
                + '<button onclick="renderAssignedHwList(assignedHwListGlobal, true)" style="background:none; border:1px solid #4B5563; color:#8E4DFF; padding:6px 20px; border-radius:8px; cursor:pointer; font-size:13px;">'
                + '<i class="fa-solid fa-chevron-down" style="margin-right:5px;"></i>Xem thêm ' + remaining + ' bài cũ hơn'
                + '</button></td></tr>';
            mobileHtml += '<div style="text-align:center; padding:10px;">'
                + '<button onclick="renderAssignedHwList(assignedHwListGlobal, true)" style="background:none; border:1px solid #4B5563; color:#8E4DFF; padding:6px 20px; border-radius:8px; cursor:pointer; font-size:13px; width:100%;">'
                + '<i class="fa-solid fa-chevron-down" style="margin-right:5px;"></i>Xem thêm ' + remaining + ' bài cũ hơn'
                + '</button></div>';
        } else {
            tableBody.innerHTML += '<tr><td colspan="4" style="text-align:center; padding:10px;">'
                + '<button onclick="renderAssignedHwList(assignedHwListGlobal, false)" style="background:none; border:1px solid #4B5563; color:#9CA3AF; padding:6px 20px; border-radius:8px; cursor:pointer; font-size:13px;">'
                + '<i class="fa-solid fa-chevron-up" style="margin-right:5px;"></i>Thu gọn'
                + '</button></td></tr>';
            mobileHtml += '<div style="text-align:center; padding:10px;">'
                + '<button onclick="renderAssignedHwList(assignedHwListGlobal, false)" style="background:none; border:1px solid #4B5563; color:#9CA3AF; padding:6px 20px; border-radius:8px; cursor:pointer; font-size:13px; width:100%;">'
                + '<i class="fa-solid fa-chevron-up" style="margin-right:5px;"></i>Thu gọn'
                + '</button></div>';
        }
    }
    
    if (mobileContainer) {
        mobileContainer.innerHTML = mobileHtml;
    }
}


function toggleTutorAssignedHwAccordion(idx) {
    var body = document.getElementById('assign-hw-body-' + idx);
    if (!body) return;
    var item = body.closest('.accordion-item');
    if (body.style.display === 'flex' || body.style.display === 'block') {
        body.style.display = 'none';
        if (item) item.classList.remove('active');
    } else {
        body.style.display = 'block';
        if (item) item.classList.add('active');
    }
}

// 9. Bắt đầu chỉnh sửa bài tập giao (Sử dụng Modal độc lập)
var currentTutorEditHwFile = null;

function startEditAssignedHw(rowIndex, title, releaseDate) {
    editingAssignedHwRowIndex = rowIndex;
    
    var currentLink = "";
    if (assignedHwListGlobal) {
        var foundHw = assignedHwListGlobal.find(function(item) {
            return item.rowIndex === rowIndex;
        });
        if (foundHw && foundHw.externalLink) {
            currentLink = foundHw.externalLink;
        }
    }
    
    document.getElementById('editAssignHwTitle').value = title;
    document.getElementById('editAssignHwReleaseDate').value = releaseDate;
    if (document.getElementById('editAssignHwLink')) {
        document.getElementById('editAssignHwLink').value = currentLink;
    }
    clearTutorEditSelectedFile();
    
    document.getElementById('editAssignedHwModal').style.display = 'flex';
}

function closeEditAssignedHwModal() {
    document.getElementById('editAssignedHwModal').style.display = 'none';
}

function handleTutorEditHwFileSelect(event) {
    var files = event.target.files;
    if (files.length === 0) return;
    
    var file = files[0];
    if (file.size > 15 * 1024 * 1024) {
        showToast("Dung lượng file tối đa là 15MB!", "error");
        return;
    }
    
    currentTutorEditHwFile = file;
    document.getElementById('tutorEditSelectedFileName').innerText = file.name + " (" + formatBytes(file.size) + ")";
    document.getElementById('tutorEditSelectedFileBox').style.display = 'flex';
    document.getElementById('tutorEditHwUploadText').innerText = "Đã chọn 1 file mới";
}

function clearTutorEditSelectedFile() {
    currentTutorEditHwFile = null;
    var fileInput = document.getElementById('tutorEditHwFileInput');
    if (fileInput) fileInput.value = "";
    
    var fileBox = document.getElementById('tutorEditSelectedFileBox');
    if (fileBox) fileBox.style.display = 'none';
    
    var uploadText = document.getElementById('tutorEditHwUploadText');
    if (uploadText) uploadText.innerText = "Kéo thả hoặc click chọn file bài tập từ máy...";
}

function submitEditAssignedHomework() {
    var title = document.getElementById('editAssignHwTitle').value.trim();
    var releaseDate = document.getElementById('editAssignHwReleaseDate').value.trim();
    var externalLink = document.getElementById('editAssignHwLink') ? document.getElementById('editAssignHwLink').value.trim() : "";
    
    if (!title) {
        showToast("Vui lòng nhập Tên bài tập!", "error");
        return;
    }
    
    var submitBtn = document.getElementById('btnSubmitEditAssignedHw');
    submitBtn.disabled = true;
    
    var progressContainer = document.getElementById('tutorEditHwProgressContainer');
    var progressBar = document.getElementById('tutorEditHwProgressBar');
    var progressText = document.getElementById('tutorEditHwProgressText');
    
    progressContainer.style.display = 'block';
    progressText.style.display = 'block';
    progressBar.style.width = '0%';
    progressText.innerText = '0%';
    
    var progressInterval = setInterval(function() {
        var currentW = parseFloat(progressBar.style.width) || 0;
        if (currentW < 90) {
            var nextW = currentW + Math.random() * 15;
            if (nextW > 90) nextW = 90;
            progressBar.style.width = nextW + '%';
            progressText.innerText = Math.round(nextW) + '%';
        }
    }, 150);
    
    var proceedWithUpload = function(fileBase64, fileName, mimeType) {
        google.script.run
            .withSuccessHandler(function(res) {
                clearInterval(progressInterval);
                progressBar.style.width = '100%';
                progressText.innerText = '100%';
                
                setTimeout(function() {
                    progressContainer.style.display = 'none';
                    progressText.style.display = 'none';
                    submitBtn.disabled = false;
                    
                    if (res.error) {
                        showToast("Lỗi: " + res.error, "error");
                    } else {
                        showToast("Cập nhật bài tập thành công!", "success");
                        closeEditAssignedHwModal();
                        loadTutorAssignedHomework();
                    }
                }, 300);
            })
            .withFailureHandler(function(err) {
                clearInterval(progressInterval);
                progressContainer.style.display = 'none';
                progressText.style.display = 'none';
                submitBtn.disabled = false;
                showToast("Lỗi: " + err.toString(), "error");
            })
            .editAssignedHomework(editingAssignedHwRowIndex, title, releaseDate, fileBase64, fileName, mimeType, externalLink);
    };
    
    if (currentTutorEditHwFile) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var content = e.target.result;
            var commaIdx = content.indexOf(',');
            var base64 = content.substring(commaIdx + 1);
            proceedWithUpload(base64, currentTutorEditHwFile.name, currentTutorEditHwFile.type);
        };
        reader.onerror = function() {
            clearInterval(progressInterval);
            progressContainer.style.display = 'none';
            progressText.style.display = 'none';
            submitBtn.disabled = false;
            showToast("Lỗi đọc file từ thiết bị!", "error");
        };
        reader.readAsDataURL(currentTutorEditHwFile);
    } else {
        proceedWithUpload("", "", "");
    }
}

// 10. Xóa bài tập giao (Đưa vào thùng rác)
function deleteAssignedHomework(rowIndex) {
    showCustomConfirm("Bạn có chắc chắn muốn xóa bài tập này? (Bài tập sẽ được lưu trong thùng rác 1 ngày để khôi phục)", function() {
        showToast("Đang xử lý...", "info");
        google.script.run
            .withSuccessHandler(function(res) {
                if (res.error) {
                    showToast("Lỗi: " + res.error, "error");
                } else {
                    showToast("Đã chuyển bài tập vào thùng rác!", "success");
                    loadTutorAssignedHomework();
                }
            })
            .withFailureHandler(function(err) {
                showToast("Lỗi kết nối: " + err.toString(), "error");
            })
            .deleteAssignedHomework(rowIndex);
    });
}

// 11. Thùng rác bài tập giao Modals
function openTutorHwTrashModal() {
    document.getElementById('tutorHwTrashModal').style.display = 'flex';
}

function closeTutorHwTrashModal() {
    document.getElementById('tutorHwTrashModal').style.display = 'none';
}

function renderTutorHwTrashList(list) {
    var tableBody = document.getElementById('tutorHwTrashTableBody');
    if (!tableBody) return;
    
    if (list.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#A6ADCE; padding: 15px;">Thùng rác trống!</td></tr>';
        return;
    }
    
    tableBody.innerHTML = "";
    list.forEach(function(item) {
        var actionsHtml = 
            '<button onclick="restoreAssignedHomework(' + item.rowIndex + ')" class="action-btn-hw" style="color:#10B981; border-color:rgba(16,185,129,0.3); background:rgba(16,185,129,0.1); padding: 4px 14px;"><i class="fa-solid fa-trash-arrow-up"></i> Khôi phục</button>';
            
        tableBody.innerHTML += 
            '<tr>' +
                '<td style="color:#FFF; font-weight:500;">' + item.title + '</td>' +
                '<td style="color:#A6ADCE; font-size:12px;">' + item.deletedTime + '</td>' +
                '<td>' + actionsHtml + '</td>' +
            '</tr>';
    });
}

function restoreAssignedHomework(rowIndex) {
    showToast("Đang khôi phục...", "info");
    google.script.run
        .withSuccessHandler(function(res) {
            if (res.error) {
                showToast("Lỗi: " + res.error, "error");
            } else {
                showToast("Khôi phục bài tập thành công!", "success");
                loadTutorAssignedHomework();
            }
        })
        .withFailureHandler(function(err) {
            showToast("Lỗi: " + err.toString(), "error");
        })
        .restoreAssignedHomework(rowIndex);
}

// 12. Tải bài nộp của học sinh (Tab Submit)
function loadStudentSubmissions() {
    if (!currentTutorStudent) return;
    
    var tableBody = document.getElementById('studentSubmissionsTableBody');
    tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#A6ADCE; padding: 15px;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải danh sách bài nộp...</td></tr>';
    document.getElementById('submissionViewMoreBtnContainer').style.display = 'none';
    
    var ma = currentTutorStudent.maBaiTap || "";
    if (ma === "") {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#A6ADCE; padding: 15px;">Học sinh chưa có Mã bài tập nên không thể kiểm tra bài nộp!</td></tr>';
        return;
    }
    
    google.script.run
        .withSuccessHandler(function(res) {
            if (res.error) {
                showToast("Lỗi: " + res.error, "error");
                tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#EF4444; padding: 15px;">Lỗi tải dữ liệu!</td></tr>';
                return;
            }
            
            studentSubmissionsGlobal = res.submissions || [];
            submissionsLimit = 5; // Reset limit về 5
            renderStudentSubmissionsList();
        })
        .withFailureHandler(function(err) {
            showToast("Lỗi: " + err.toString(), "error");
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#EF4444; padding: 15px;">Lỗi kết nối server!</td></tr>';
        })
        .getStudentSubmissionsForTutor(ma);
}

// 13. Render bảng bài nộp học sinh với phân trang hiển thị
// Hàm tiện ích parse ngày/giờ dạng DD/MM/YYYY HH:mm:ss hoặc các chuẩn khác về timestamp
function parseDateTimeString(str) {
    if (!str) return 0;
    let d = new Date(str);
    if (!isNaN(d.getTime())) return d.getTime();
    
    let parts = str.split(' ');
    let dateParts = parts[0].split('/');
    if (dateParts.length === 3) {
        let day = parseInt(dateParts[0]);
        let month = parseInt(dateParts[1]) - 1;
        let year = parseInt(dateParts[2]);
        let hour = 0, min = 0, sec = 0;
        if (parts[1]) {
            let timeParts = parts[1].split(':');
            hour = parseInt(timeParts[0] || 0);
            min = parseInt(timeParts[1] || 0);
            sec = parseInt(timeParts[2] || 0);
        }
        return new Date(year, month, day, hour, min, sec).getTime();
    }
    return 0;
}

function renderStudentSubmissionsList() {
    var tableBody = document.getElementById('studentSubmissionsTableBody');
    var mobileContainer = document.getElementById('submittedHwMobile');
    if (!tableBody) return;
    
    if (studentSubmissionsGlobal.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#A6ADCE; padding: 20px;"><i class="fa-solid fa-circle-info"></i> Học sinh này chưa nộp bài tập nào!</td></tr>';
        if (mobileContainer) {
            mobileContainer.innerHTML = '<div style="text-align:center; color:#A6ADCE; padding: 20px; font-size: 13px;"><i class="fa-solid fa-circle-info"></i> Học sinh này chưa nộp bài tập nào!</div>';
        }
        document.getElementById('submissionViewMoreBtnContainer').style.display = 'none';
        return;
    }

    // Sắp xếp: bài nộp mới nhất lên đầu
    var sortedList = studentSubmissionsGlobal.slice().sort(function(a, b) {
        return parseDateTimeString(b.timestamp) - parseDateTimeString(a.timestamp);
    });
    var totalCount = sortedList.length;
    var showList = sortedList.slice(0, submissionsLimit);


    tableBody.innerHTML = "";
    var mobileHtml = "";
    
    showList.forEach(function(item, idx) {
        var isFolder = item.fileUrl && (item.fileUrl.indexOf("/folders/") !== -1 || item.fileUrl.indexOf("/drive/folders/") !== -1);
        var isZip = item.fileUrl && (item.fileUrl.toLowerCase().indexOf(".zip") !== -1 || item.fileUrl.indexOf("/file/d/") !== -1);
        
        var viewText = isFolder ? '<i class="fa-solid fa-folder-open"></i> Xem thư mục' : (isZip ? '<i class="fa-solid fa-file-zipper"></i> Tải bài nộp (ZIP)' : '<i class="fa-solid fa-image"></i> Xem file nộp');
        var fileLink = item.fileUrl ? '<a href="' + (isZip ? getGoogleDriveDownloadUrl(item.fileUrl) : item.fileUrl) + '" target="_blank" style="color:#FFD23F; font-weight:600; text-decoration:none;">' + viewText + '</a>' : '<span style="color:#A6ADCE;">Không có file</span>';
        
        var dlText = isFolder ? '<i class="fa-solid fa-folder-arrow-down"></i> Tải cả thư mục' : (isZip ? '<i class="fa-solid fa-file-zipper"></i> Tải bài nộp (ZIP)' : '<i class="fa-solid fa-cloud-arrow-down"></i> Tải về');
        var downloadBtn = item.fileUrl ? '<a href="' + getGoogleDriveDownloadUrl(item.fileUrl) + '" target="_blank" download class="action-btn-hw" style="color:#10B981; border-color:rgba(16,185,129,0.3); background:rgba(16,185,129,0.1); padding: 4px 14px; text-decoration: none;">' + dlText + '</a>' : '<span style="color:#A6ADCE;">N/A</span>';
        
        // Desktop Row
        tableBody.innerHTML += 
            '<tr>' +
                '<td style="color:#A6ADCE;">' + item.timestamp + '</td>' +
                '<td style="color:#FFF; font-weight:500;">' + item.lessonName + '</td>' +
                '<td>' + fileLink + '</td>' +
                '<td>' + downloadBtn + '</td>' +
            '</tr>';
            
        // Mobile Accordion Card
        mobileHtml += "<div class='accordion-item' id='submit-hw-item-" + idx + "'>";
        mobileHtml += "  <div class='accordion-header' onclick='toggleTutorSubmittedHwAccordion(" + idx + ")'>";
        mobileHtml += "    <div class='accordion-header-title'>";
        mobileHtml += "      <span>" + item.lessonName + "</span>";
        mobileHtml += "      <span class='accordion-header-date'>" + item.timestamp + "</span>";
        mobileHtml += "    </div>";
        mobileHtml += "    <div class='accordion-header-status'>";
        mobileHtml += "      <i class='fa-solid fa-chevron-down' id='submit-hw-chevron-" + idx + "'></i>";
        mobileHtml += "    </div>";
        mobileHtml += "  </div>";
        mobileHtml += "  <div class='accordion-body' id='submit-hw-body-" + idx + "' style='display: none;'>";
        mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Thời gian nộp</span><span class='accordion-body-val'>" + item.timestamp + "</span></div>";
        mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>File nộp bài</span><span class='accordion-body-val'>" + fileLink + "</span></div>";
        mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Tải về</span><span class='accordion-body-val'>" + downloadBtn + "</span></div>";
        mobileHtml += "  </div>";
        mobileHtml += "</div>";
    });

    // Nút Xem thêm / Thu gọn cho cả desktop lẫn mobile
    if (totalCount > submissionsLimit) {
        var remaining = totalCount - submissionsLimit;
        tableBody.innerHTML += '<tr><td colspan="4" style="text-align:center; padding:10px;">'
            + '<button onclick="loadMoreStudentSubmissions()" style="background:none; border:1px solid #4B5563; color:#FFD23F; padding:6px 20px; border-radius:8px; cursor:pointer; font-size:13px;">'
            + '<i class="fa-solid fa-chevron-down" style="margin-right:5px;"></i>Xem thêm ' + remaining + ' bài nộp cũ hơn'
            + '</button></td></tr>';
        mobileHtml += '<div style="text-align:center; padding:10px;">'
            + '<button onclick="loadMoreStudentSubmissions()" style="background:none; border:1px solid #4B5563; color:#FFD23F; padding:6px 20px; border-radius:8px; cursor:pointer; font-size:13px; width:100%;">'
            + '<i class="fa-solid fa-chevron-down" style="margin-right:5px;"></i>Xem thêm ' + remaining + ' bài nộp cũ hơn'
            + '</button></div>';
    } else if (submissionsLimit > 5 && totalCount <= submissionsLimit) {
        // Nút Thu gọn khi đang xem tất cả
        tableBody.innerHTML += '<tr><td colspan="4" style="text-align:center; padding:10px;">'
            + '<button onclick="collapseStudentSubmissions()" style="background:none; border:1px solid #4B5563; color:#9CA3AF; padding:6px 20px; border-radius:8px; cursor:pointer; font-size:13px;">'
            + '<i class="fa-solid fa-chevron-up" style="margin-right:5px;"></i>Thu gọn'
            + '</button></td></tr>';
        mobileHtml += '<div style="text-align:center; padding:10px;">'
            + '<button onclick="collapseStudentSubmissions()" style="background:none; border:1px solid #4B5563; color:#9CA3AF; padding:6px 20px; border-radius:8px; cursor:pointer; font-size:13px; width:100%;">'
            + '<i class="fa-solid fa-chevron-up" style="margin-right:5px;"></i>Thu gọn'
            + '</button></div>';
    }

    if (mobileContainer) {
        mobileContainer.innerHTML = mobileHtml;
    }
    
    // Ẩn nút Xem thêm cũ (đã tích hợp inline)
    document.getElementById('submissionViewMoreBtnContainer').style.display = 'none';
}

function toggleTutorSubmittedHwAccordion(idx) {
    var body = document.getElementById('submit-hw-body-' + idx);
    if (!body) return;
    var item = body.closest('.accordion-item');
    if (body.style.display === 'flex' || body.style.display === 'block') {
        body.style.display = 'none';
        if (item) item.classList.remove('active');
    } else {
        body.style.display = 'block';
        if (item) item.classList.add('active');
    }
}

// 14. Bấm nút Xem thêm để mở rộng toàn bộ lịch sử bài nộp
function loadMoreStudentSubmissions() {
    submissionsLimit = studentSubmissionsGlobal.length;
    renderStudentSubmissionsList();
}

// Thu gọn về 5 bài đầu
function collapseStudentSubmissions() {
    submissionsLimit = 5;
    renderStudentSubmissionsList();
}

// Helper: Định dạng byte
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    var k = 1024;
    var dm = decimals < 0 ? 0 : decimals;
    var sizes = ['Bytes', 'KB', 'MB', 'GB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Helper: Định dạng ngày dd/mm/yyyy
function formatDateDDMMYYYY(date) {
    var d = date.getDate();
    var m = date.getMonth() + 1;
    var y = date.getFullYear();
    return (d < 10 ? '0' + d : d) + '/' + (m < 10 ? '0' + m : m) + '/' + y;
}

// Helper: Chuyển đổi link xem Drive thành link tải trực tiếp
function getGoogleDriveDownloadUrl(url) {
    if (!url) return "";
    if (url.indexOf("/folders/") !== -1 || url.indexOf("/drive/folders/") !== -1) {
        return url;
    }
    var matches = url.match(/[-\w]{25,}/);
    if (matches && matches[0]) {
        return "https://drive.google.com/uc?export=download&id=" + matches[0];
    }
    return url;
}

// Nạp ý kiến phản hồi của phụ huynh cho các lớp của Gia sư này
function loadTutorFeedbacks() {
    var container = document.getElementById('tutorFeedbackList');
    if (!container) return;
    
    google.script.run.withSuccessHandler(function(response) {
        if (response && response.success && response.feedbacks) {
            var feedbacks = response.feedbacks;
            if (feedbacks.length === 0) {
                container.innerHTML = "<div style='text-align: center; color: rgba(255,255,255,0.3); font-style: italic; padding: 25px;'><i class='fa-regular fa-comment-slash' style='font-size: 20px; display: block; margin-bottom: 8px;'></i>Chưa có ý kiến phản hồi nào trong 10 ngày gần đây.</div>";
                return;
            }
            
            var html = "";
            feedbacks.forEach(function(fb) {
                html += '<div class="agenda-event-card" style="border-left-color: #FFD23F; background: rgba(255, 210, 63, 0.04); border: 1px solid rgba(255, 210, 63, 0.1); border-left-width: 4px; padding: 12px 15px; border-radius: 10px; flex-direction: column; align-items: stretch; cursor: default; gap: 6px;">' +
                    '  <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 5px;">' +
                    '    <span style="font-weight: 800; color: #FFD23F; font-size: 13.5px;"><i class="fa-solid fa-graduation-cap"></i> Phụ huynh em ' + fb.studentName + ' <span style="font-size: 11.5px; color: rgba(255,255,255,0.4); font-weight: normal;">(' + fb.studentPhone + ')</span></span>' +
                    '    <span style="font-size: 11px; color: rgba(255,255,255,0.4); font-weight: 600;"><i class="fa-regular fa-clock"></i> ' + fb.timestamp + '</span>' +
                    '  </div>' +
                    '  <div style="font-size: 13px; color: #E2D1FF; line-height: 1.5; font-style: italic; background: rgba(0,0,0,0.2); padding: 8px 12px; border-radius: 8px; margin-top: 4px;">' +
                    '    "' + fb.content + '"' +
                    '  </div>' +
                    '</div>';
            });
            container.innerHTML = html;
        } else {
            container.innerHTML = "<div style='text-align: center; color: #EF4444; padding: 20px;'>Lỗi tải dữ liệu phản hồi.</div>";
        }
    }).getTutorFeedback(currentTutorPhone);
}

// Hàm nhân bản buổi học nhanh cho gia sư
function duplicateLesson(rowIndex) {
    var log = null;
    if (currentTutorStudent && currentTutorStudent.logs) {
        for (var i = 0; i < currentTutorStudent.logs.length; i++) {
            if (currentTutorStudent.logs[i].rowIndex == rowIndex || String(currentTutorStudent.logs[i].rowIndex) === String(rowIndex)) {
                log = currentTutorStudent.logs[i];
                break;
            }
        }
    }

    if (!log) {
        showToast("Không tìm thấy thông tin buổi học để nhân bản.", "error");
        return;
    }
    
    // 1. Mở modal thêm buổi học (để nó tự điền ngày hôm nay và tự tính Tuần phù hợp)
    openAddLessonModal();
    
    // 2. Ghi đè các thông tin cũ của buổi học này (ngoại trừ Ngày dạy)
    document.getElementById('lesTuan').value = log.tuan || "";
    document.getElementById('lesMon').value = mapSubjectToSelectValue(log.mon);
    
    var tt = log.trangThai || "Đã học";
    if (tt.trim().toLowerCase() === "hủy/nghỉ") {
        tt = "Hủy/ nghỉ"; // Chuẩn hóa
    }
    document.getElementById('lesTrangThai').value = tt;
    document.getElementById('lesBtvn').value = log.btvn || "Hoàn thành";
    document.getElementById('lesDiemDau').value = log.diemDauGio || "Không có";
    document.getElementById('lesDiemDinhKi').value = log.diemDinhKi || "Không có";
    document.getElementById('lesNoiDung').value = log.noiDung || "";
    
    showToast("Đã nhân bản dữ liệu buổi học! Vui lòng kiểm tra ngày dạy và nhận xét.", "success");
}

// Hàm chuẩn hóa và ánh xạ môn học từ Google Sheet về đúng giá trị option trong thẻ select
function mapSubjectToSelectValue(val) {
    if (!val) return "Toán học";
    var clean = val.trim().toLowerCase();
    
    // So khớp trực tiếp hoặc từ viết tắt phổ biến
    if (clean === "toán học" || clean === "toán") return "Toán học";
    if (clean === "vật lý" || clean === "vật lí" || clean === "lý" || clean === "lí") return "Vật lý";
    if (clean === "hóa học" || clean === "hóa") return "Hóa học";
    if (clean === "khoa học tự nhiên" || clean === "khtn" || clean === "sinh" || clean === "sinh học" || clean === "lý, hóa, sinh") return "Khoa học tự nhiên";
    if (clean === "ngữ văn" || clean === "văn") return "Ngữ văn";
    if (clean === "tiếng anh" || clean === "anh" || clean === "english") return "Tiếng anh";
    
    // Nếu có chứa từ khóa
    if (clean.indexOf("toán") !== -1) return "Toán học";
    if (clean.indexOf("lý") !== -1 || clean.indexOf("lí") !== -1 || clean.indexOf("phys") !== -1) return "Vật lý";
    if (clean.indexOf("hóa") !== -1 || clean.indexOf("chem") !== -1) return "Hóa học";
    if (clean.indexOf("khoa học") !== -1 || clean.indexOf("tự nhiên") !== -1 || clean.indexOf("khtn") !== -1) return "Khoa học tự nhiên";
    if (clean.indexOf("văn") !== -1 || clean.indexOf("ngữ") !== -1) return "Ngữ văn";
    if (clean.indexOf("anh") !== -1 || clean.indexOf("eng") !== -1) return "Tiếng anh";
    
    return "Toán học"; // Mặc định nếu không khớp
}
