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
            
            // Load Schedule
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
                            "<td>" + st.name + "</td>" +
                            "<td>" + (s.mon||"") + "</td>" +
                            "<td>" + (s.tue||"") + "</td>" +
                            "<td>" + (s.wed||"") + "</td>" +
                            "<td>" + (s.thu||"") + "</td>" +
                            "<td>" + (s.fri||"") + "</td>" +
                            "<td>" + (s.sat||"") + "</td>" +
                            "<td>" + (s.sun||"") + "</td>" +
                            "<td><button onclick='openEditScheduleModal(\"" + st.name.replace(/'/g, "\\'").replace(/"/g, '&quot;') + "\", \"" + (s.mon||"") + "\", \"" + (s.tue||"") + "\", \"" + (s.wed||"") + "\", \"" + (s.thu||"") + "\", \"" + (s.fri||"") + "\", \"" + (s.sat||"") + "\", \"" + (s.sun||"") + "\")' class='btn-icon-edit' style='margin: 0; padding: 4px;' title='Sửa thời khóa biểu'><i class='fa-solid fa-pen-to-square'></i></button></td>" +
                            "</tr>";
                    });
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
            
            var currentMonth = new Date().getMonth() + 1;
            document.getElementById('invoiceMonthSelect').value = currentMonth;
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
                labels.push("Buổi " + (idx + 1));
                
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
                                borderWidth: 3,
                                pointBackgroundColor: '#8E4DFF',
                                pointBorderColor: '#ffffff',
                                pointHoverRadius: 6,
                                tension: 0.3,
                                spanGaps: true
                            },
                            {
                                label: 'Điểm định kì',
                                data: dataDinhKi,
                                borderColor: '#FFD23F',
                                backgroundColor: 'rgba(255, 210, 63, 0.1)',
                                borderWidth: 3,
                                pointBackgroundColor: '#FFD23F',
                                pointBorderColor: '#ffffff',
                                pointHoverRadius: 6,
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
                                titleFont: { family: 'Inter', weight: 'bold' },
                                bodyFont: { family: 'Inter' }
                            }
                        },
                        scales: {
                            x: { grid: { color: 'rgba(255, 255, 255, 0.03)' }, ticks: { color: '#A6ADCE' } },
                            y: { min: 0, max: 10, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#A6ADCE', stepSize: 2 } }
                        }
                    }
                });
            }
        }
        
        function renderInvoice() {
            if(!currentTutorStudent || !currentTutorStudent.logs) return;
            var logs = currentTutorStudent.logs;
            var selectedMonth = document.getElementById('invoiceMonthSelect').value;
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
            
            if (selectedMonth === 'all') {
                var lastPaidIndex = -1;
                for (var i = 0; i < logs.length; i++) {
                    var isPaid = (logs[i].tienDong || "").trim().toLowerCase().indexOf("đã đóng") !== -1;
                    if (isPaid) lastPaidIndex = i;
                }
                logsToProcess = logs.slice(lastPaidIndex + 1);
            } else {
                var selM = parseInt(selectedMonth, 10);
                logsToProcess = logs.filter(function(log) {
                    if (!log || !log.ngay) return false;
                    var cleanStr = log.ngay.split(" ")[0].trim();
                    var parts = cleanStr.split(/[-/]/);
                    var logMonth = -1;
                    if (parts.length === 3) {
                        if (parts[0].length === 4) logMonth = parseInt(parts[1], 10);
                        else logMonth = parseInt(parts[1], 10);
                    } else if (parts.length === 2) {
                        logMonth = parseInt(parts[1], 10);
                    }
                    return logMonth === selM;
                });
            }
            
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
            
            if (selectedMonth === 'all') {
                document.getElementById('invMonthDisplay').innerText = "TỔNG HỢP CÁC BUỔI ĐÃ HỌC";
            } else {
                var currentYear = new Date().getFullYear();
                document.getElementById('invMonthDisplay').innerText = "THÁNG " + selectedMonth + " • NĂM " + currentYear;
            }
            
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
            var msg = "Dạ em chào anh/chị, em gửi anh chị phiếu học tập " + (selectedMonth === 'all' ? "tổng hợp" : "tháng " + selectedMonth) + " của bé " + currentTutorStudent.name + " ạ.\nTổng số buổi chưa đóng là " + unpaidClasses + " buổi, thành tiền là " + totalStr + " VNĐ.\nAnh/chị quét mã QR trên phiếu để thanh toán giúp em nhé. Em cảm ơn ạ!";
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
                document.getElementById('loadMoreContainer').style.display = 'none';
            }
        }

        function toggleDataset(index) {
            if (!currentChartInstance) return;
            
            var meta = currentChartInstance.getDatasetMeta(index);
            var btn = (index === 0) ? document.getElementById('btnLegDauGio') : document.getElementById('btnLegDinhKi');
            
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
            var item = body.closest('.accordion-item');
            var chevron = document.getElementById('chevron-' + idx);
            
            if (body.style.display === 'flex') {
                body.style.display = 'none';
                item.classList.remove('active');
            } else {
                body.style.display = 'flex';
                item.classList.add('active');
            }
        }


        function guiPhanHoiPhuHuynh() {
            var textarea = document.getElementById('feedbackInput');
            var btn = document.getElementById('btnSubmitFeedback');
            var msg = document.getElementById('feedbackMessage');
            var content = textarea.value.trim();
            
            if (content === "") {
                msg.innerText = "Vui lòng nhập nội dung nhận xét/phản hồi trước khi gửi!";
                msg.className = "feedback-message-status error";
                msg.style.display = "block";
                return;
            }
            
            var maHS = document.getElementById('maHocSinh').value.trim();
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

        function quayLai() {
            if (tutorChartInstance) {
                tutorChartInstance.destroy();
                tutorChartInstance = null;
            }
            sessionStorage.clear();
            window.location.href = 'tutor-login.html';
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
            
            if(!pName || !sName || !phone || !tuition) {
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
            }).themHocSinhMoi(tutorDataGlobal.tutorPhone, pName, sName, phone, parseFloat(tuition));
        }

        // 3. Cửa sổ Sửa học sinh (Edit Student)
        function openEditStudentModal() {
            if(!currentTutorStudent) return;
            document.getElementById('editOldStudentPhone').value = currentTutorStudent.phone;
            document.getElementById('editStudentName').value = currentTutorStudent.name;
            document.getElementById('editStudentTuition').value = currentTutorStudent.tuition || "";
            
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
            
            if(!pName || !sName || !phone || !tuition) {
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
            }).suaThongTinHocSinh(oldPhone, pName, sName, phone, parseFloat(tuition));
        }

        // 4. Cửa sổ Thêm buổi học (Add Lesson) & Preview
        function openAddLessonModal() {
            if(!currentTutorStudent) return;
            
            var today = new Date();
            var dd = String(today.getDate()).padStart(2, '0');
            var mm = String(today.getMonth() + 1).padStart(2, '0'); 
            var yyyy = today.getFullYear();
            document.getElementById('lesNgay').value = dd + '/' + mm + '/' + yyyy;
            
            var nextLessonIndex = (currentTutorStudent.logs ? currentTutorStudent.logs.length : 0) + 1;
            var weekNum = Math.ceil(nextLessonIndex / 3); 
            document.getElementById('lesTuan').value = (weekNum || 1);
            
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
            
            var btn = document.getElementById('btnSubmitLesson');
            btn.disabled = true;
            btn.innerText = "Đang đăng...";
            
            google.script.run.withSuccessHandler(function(res) {
                btn.disabled = false;
                btn.innerText = "Xác nhận đăng";
                
                if(res.error) {
                    showToast("Lỗi: " + res.error, "error");
                } else {
                    showToast("Đăng nhật ký buổi học thành công!", "success");
                    closePreviewLessonModal();
                    closeAddLessonModal();
                    
                    var studentPhone = currentTutorStudent.phone;
                    google.script.run.withSuccessHandler(function(loginRes) {
                        if(loginRes.role === 'tutor') {
                            tutorDataGlobal = loginRes.data;
                            var stIdx = -1;
                            for(var i=0; i<tutorDataGlobal.students.length; i++) {
                                if(tutorDataGlobal.students[i].phone === studentPhone) {
                                    stIdx = i;
                                    break;
                                }
                            }
                            if(stIdx !== -1) {
                                selectTutorStudent(stIdx);
                            }
                        }
                    }).loginSystem(tutorDataGlobal.tutorPhone, document.getElementById('maPin').value.trim());
                }
            }).themBuoiHoc(
                tempLessonData.studentPhone,
                tempLessonData.studentName,
                tempLessonData.tuan,
                tempLessonData.ngay,
                tempLessonData.mon,
                tempLessonData.noiDung,
                tempLessonData.btvn,
                tempLessonData.diemDau,
                tempLessonData.diemDinhKi,
                tempLessonData.trangThai
            );
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

        function toggleSelectAllTutorLessons(masterChk) {
            if (!masterChk) return;
            var chks = document.querySelectorAll('.tutor-lesson-chk');
            
            if (masterChk.checked) {
                masterChk.checked = false;
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
                    });
                    
                    showToast("Đang cập nhật đóng học phí hàng loạt...", "info");
                    google.script.run
                        .withSuccessHandler(function(res) {
                            if (res.error) {
                                showToast("Lỗi: " + res.error, "error");
                                masterChk.checked = false;
                                refreshTutorStudentHistory();
                            } else {
                                showToast("Đã đóng học phí thành công cho " + targetRowIndices.length + " buổi học!", "success");
                                refreshTutorStudentHistory();
                            }
                        })
                        .withFailureHandler(function(err) {
                            showToast("Lỗi kết nối: " + err.toString(), "error");
                            masterChk.checked = false;
                            refreshTutorStudentHistory();
                        })
                        .capNhatNhieuDongHocPhi(targetRowIndices, []);
                });
            } else {
                masterChk.checked = true;
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
                    });
                    
                    showToast("Đang hủy đóng học phí hàng loạt...", "info");
                    google.script.run
                        .withSuccessHandler(function(res) {
                            if (res.error) {
                                showToast("Lỗi: " + res.error, "error");
                                masterChk.checked = true;
                                refreshTutorStudentHistory();
                            } else {
                                showToast("Đã hủy trạng thái đóng học phí thành công cho " + targetRowIndices.length + " buổi học!", "success");
                                refreshTutorStudentHistory();
                            }
                        })
                        .withFailureHandler(function(err) {
                            showToast("Lỗi kết nối: " + err.toString(), "error");
                            masterChk.checked = true;
                            refreshTutorStudentHistory();
                        })
                        .capNhatNhieuDongHocPhi([], targetRowIndices);
                });
            }
        }

        function checkTutorLessonCheckboxSelection(chkEl) {
            if (!chkEl) return;
            var rIndex = chkEl.getAttribute('data-rowindex');
            
            if (chkEl.checked) {
                // Đang từ bỏ tích chuyển thành tích chọn -> Xác nhận đóng học phí
                chkEl.checked = false; // Tạm thời bỏ tích để chờ xác thực
                showCustomConfirm("Xác nhận đóng học phí cho buổi học này? Trạng thái sẽ được cập nhật tức thì lên hệ thống.", function() {
                    chkEl.checked = true;
                    syncCheckboxAndCheckAll(chkEl);
                    
                    showToast("Đang cập nhật đóng học phí...", "info");
                    google.script.run
                        .withSuccessHandler(function(res) {
                            if (res.error) {
                                showToast("Lỗi: " + res.error, "error");
                                chkEl.checked = false;
                                syncCheckboxAndCheckAll(chkEl);
                            } else {
                                showToast("Cập nhật đóng học phí thành công!", "success");
                                refreshTutorStudentHistory();
                            }
                        })
                        .withFailureHandler(function(err) {
                            showToast("Lỗi kết nối: " + err.toString(), "error");
                            chkEl.checked = false;
                            syncCheckboxAndCheckAll(chkEl);
                        })
                        .capNhatNhieuDongHocPhi([rIndex], []);
                });
            } else {
                // Đang từ tích chọn chuyển thành bỏ tích -> Xác nhận hủy đóng học phí
                chkEl.checked = true; // Tạm thời tích lại để chờ xác thực
                showCustomConfirm("Bạn có chắc chắn muốn hủy trạng thái đã đóng học phí của buổi học này?", function() {
                    chkEl.checked = false;
                    syncCheckboxAndCheckAll(chkEl);
                    
                    showToast("Đang cập nhật hủy đóng học phí...", "info");
                    google.script.run
                        .withSuccessHandler(function(res) {
                            if (res.error) {
                                showToast("Lỗi: " + res.error, "error");
                                chkEl.checked = true;
                                syncCheckboxAndCheckAll(chkEl);
                            } else {
                                showToast("Hủy trạng thái đóng học phí thành công!", "success");
                                refreshTutorStudentHistory();
                            }
                        })
                        .withFailureHandler(function(err) {
                            showToast("Lỗi kết nối: " + err.toString(), "error");
                            chkEl.checked = true;
                            syncCheckboxAndCheckAll(chkEl);
                        })
                        .capNhatNhieuDongHocPhi([], [rIndex]);
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
                htmlLichSu += "<table><tr><th style='width: 40px; text-align: center;'><input type='checkbox' id='tutorSelectAllLessons' onchange='toggleSelectAllTutorLessons(this)' style='cursor: pointer; width: 16px; height: 16px;'></th><th>Tuần</th><th>Ngày dạy</th><th>Môn</th><th>Nội dung</th><th>Đánh giá BTVN</th><th>KT Đầu giờ</th><th>KT Định kì</th><th>Trạng thái</th><th style='width: 50px;'>Sửa</th></tr>";
                
                // 2. Mobile View (Accordion list)
                var htmlMobile = "<div class='mobile-cards-view'>";
                htmlMobile += "  <div class='mobile-select-all-container' style='display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; margin-bottom: 12px;'>";
                htmlMobile += "      <input type='checkbox' id='tutorSelectAllLessonsMobile' onchange='toggleSelectAllTutorLessons(this)' style='cursor: pointer; width: 16px; height: 16px;'>";
                htmlMobile += "      <label for='tutorSelectAllLessonsMobile' style='cursor: pointer; font-size: 13px; color: #A6ADCE; font-weight: bold; margin: 0; user-select: none;'>Chọn tất cả buổi học</label>";
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
                        chkHtml = '<input type="checkbox" class="tutor-lesson-chk" data-rowindex="' + item.rowIndex + '" data-tuan="' + (item.tuan || "") + '" onchange="checkTutorLessonCheckboxSelection(this)" style="cursor: pointer; width: 16px; height: 16px;" ' + isChecked + '>';
                        mobileChkHtml = '<input type="checkbox" class="tutor-lesson-chk" data-rowindex="' + item.rowIndex + '" data-tuan="' + (item.tuan || "") + '" onclick="event.stopPropagation();" onchange="checkTutorLessonCheckboxSelection(this)" style="margin-right: 8px; width: 16px; height: 16px; cursor: pointer;" ' + isChecked + '>';
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
                    htmlLichSu += "<td><button onclick='openEditLessonModal(" + item.rowIndex + ")' class='btn-icon-edit' title='Sửa buổi học' style='margin: 0; padding: 4px;'><i class='fa-solid fa-pen-to-square'></i></button></td>";
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
                    htmlMobile += "    <div class='accordion-body-row' style='justify-content: flex-end; border-top: 1px dashed rgba(255,255,255,0.05); padding-top: 10px; margin-top: 5px;'>";
                    htmlMobile += "      <button onclick='openEditLessonModal(" + item.rowIndex + ")' class='modal-btn modal-btn-secondary' style='width: 100%; border-radius: 20px;'><i class='fa-solid fa-pen-to-square'></i> Sửa buổi học</button>";
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
                    if (currentTutorStudent.logs[i].rowIndex === rowIndex) {
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
            var monVal = log.mon || "Toán học";
            if (monVal.trim().toLowerCase() === "vật lý") {
                monVal = "Vật Lý";
            }
            document.getElementById('editLesMon').value = monVal;
            
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
                var btn = document.getElementById('btnSaveEditedLesson');
                btn.disabled = true;
                btn.innerText = "Đang lưu...";
                
                google.script.run
                    .withSuccessHandler(function(res) {
                        btn.disabled = false;
                        btn.innerText = "Cập nhật";
                        if(res.error) {
                            showToast("Lỗi: " + res.error, "error");
                        } else {
                            showToast("Cập nhật nhật ký buổi học thành công!", "success");
                            closeEditLessonModal();
                            refreshTutorStudentHistory();
                        }
                    })
                    .withFailureHandler(function(err) {
                        btn.disabled = false;
                        btn.innerText = "Cập nhật";
                        showToast("Lỗi kết nối hoặc hệ thống: " + err.toString(), "error");
                    })
                    .suaBuoiHoc(rowIndex, tuan, dateFormatted, mon, noiDung, btvn, diemDau, diemDinhKi, trangThai);
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
                                        "<td>" + st.name + "</td>" +
                                        "<td>" + (s.mon||"") + "</td>" +
                                        "<td>" + (s.tue||"") + "</td>" +
                                        "<td>" + (s.wed||"") + "</td>" +
                                        "<td>" + (s.thu||"") + "</td>" +
                                        "<td>" + (s.fri||"") + "</td>" +
                                        "<td>" + (s.sat||"") + "</td>" +
                                        "<td>" + (s.sun||"") + "</td>" +
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
                var btn = document.querySelector('[onclick="confirmDeleteLesson()"]');
                var originalText = btn ? btn.innerText : "Xóa buổi học";
                if(btn) {
                    btn.disabled = true;
                    btn.innerText = "Đang xóa...";
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
                            showToast("Xóa nhật ký buổi học thành công!", "success");
                            closeEditLessonModal();
                            refreshTutorStudentHistory();
                        }
                    })
                    .withFailureHandler(function(err) {
                        if(btn) {
                            btn.disabled = false;
                            btn.innerText = originalText;
                        }
                        showToast("Lỗi kết nối hoặc hệ thống: " + err.toString(), "error");
                    })
                    .xoaBuoiHoc(rowIndex);
            });
        }

        // --- Admin Dashboard JS Controllers ---
