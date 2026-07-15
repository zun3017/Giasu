var adminDataGlobal = null;
var currentAdminPhone = "";
var currentAdminTab = "report";
var adminRevenueChartInstance = null;
var pinVerifyAction = "deleteStudent";

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

        function renderAdminView(data) {
            adminDataGlobal = data;
            
            // Ẩn màn hình chính và các nhân vật 3D nếu tồn tại
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
            var tutorDash = document.getElementById('tutorDashboardBox');
            if (tutorDash) tutorDash.style.display = 'none';
            
            var headerEl = document.querySelector('.header');
            if (headerEl) headerEl.style.display = 'none';
            
            // Hiển thị Admin Dashboard
            document.getElementById('adminDashboardBox').style.display = 'block';
            
            // Cập nhật tên hiển thị
            document.getElementById('adminNameDisplay').innerText = "Xin chào, Admin " + (data.tutors.find(t => t.phone === currentAdminPhone)?.name || "Hệ Thống");
            
            // Render dữ liệu từng tab
            renderAdminReportDropdown();
            renderAdminTutorsList();
            renderAdminStudentsList();
        }

        function switchAdminTab(tabName) {
            currentAdminTab = tabName;
            var tabs = ['report', 'tutors', 'students'];
            tabs.forEach(t => {
                var btn = document.getElementById('btnAdminTab' + t.charAt(0).toUpperCase() + t.slice(1));
                var content = document.getElementById('adminTab' + t.charAt(0).toUpperCase() + t.slice(1));
                if (t === tabName) {
                    if (btn) btn.classList.add('active');
                    if (content) content.style.display = 'block';
                } else {
                    if (btn) btn.classList.remove('active');
                    if (content) content.style.display = 'none';
                }
            });
        }

        // 1. Report Tab
        function renderAdminReportDropdown() {
            var select = document.getElementById('adminReportMonthSelect');
            if (!select) return;
            select.innerHTML = "";
            
            var reports = adminDataGlobal.incomeReports || {};
            var months = Object.keys(reports);
            
            if (months.length === 0) {
                var curMonthStr = "Tháng " + (new Date().getMonth() + 1) + "/" + new Date().getFullYear();
                months.push(curMonthStr);
                reports[curMonthStr] = { expected: 0, paid: 0, unpaid: 0, tutors: {} };
            }
            
            months.forEach(m => {
                var opt = document.createElement('option');
                opt.value = m;
                opt.innerText = m;
                select.appendChild(opt);
            });
            
            renderAdminReportData();
        }

        function parseMonthYear(mStr) {
            var parts = mStr.replace("Tháng ", "").split("/");
            if (parts.length === 2) {
                return { month: parseInt(parts[0]), year: parseInt(parts[1]) };
            }
            return { month: 1, year: 2000 };
        }

        function renderAdminReportData() {
            var select = document.getElementById('adminReportMonthSelect');
            if (!select) return;
            var selectedMonth = select.value;
            
            var reports = adminDataGlobal.incomeReports || {};
            var report = reports[selectedMonth] || { expected: 0, paid: 0, unpaid: 0, tutors: {} };
            
            // Cập nhật thẻ tóm tắt doanh thu
            document.getElementById('admExpRev').innerText = report.expected.toLocaleString('vi-VN') + "đ";
            document.getElementById('admPaidRev').innerText = report.paid.toLocaleString('vi-VN') + "đ";
            document.getElementById('admUnpaidRev').innerText = report.unpaid.toLocaleString('vi-VN') + "đ";
            
            // 1. Cập nhật Bảng phân rã theo Gia sư cho tháng chọn
            var breakdownBody = document.querySelector('#adminTutorBreakdownTable tbody');
            if (breakdownBody) {
                breakdownBody.innerHTML = "";
                var tutorsData = report.tutors || {};
                var tutorKeys = Object.keys(tutorsData);
                
                if (tutorKeys.length === 0) {
                    breakdownBody.innerHTML = "<tr><td colspan='5' style='text-align:center; color:#A6ADCE;'>Không có dữ liệu buổi học nào trong tháng này.</td></tr>";
                } else {
                    tutorKeys.forEach(tKey => {
                        var tReport = tutorsData[tKey];
                        var rate = tReport.expected > 0 ? ((tReport.paid / tReport.expected) * 100).toFixed(1) + "%" : "0%";
                        var tr = document.createElement('tr');
                        tr.innerHTML = "<td><b>" + tReport.name + "</b></td>" +
                                       "<td style='color:#8E4DFF; font-weight:bold;'>" + tReport.expected.toLocaleString('vi-VN') + "đ</td>" +
                                       "<td style='color:#10B981; font-weight:bold;'>" + tReport.paid.toLocaleString('vi-VN') + "đ</td>" +
                                       "<td style='color:#F59E0B; font-weight:bold;'>" + tReport.unpaid.toLocaleString('vi-VN') + "đ</td>" +
                                       "<td style='text-align:center;'><span class='badge' style='background:rgba(142,77,255,0.15); color:#a78bfa;'>" + rate + "</span></td>";
                        breakdownBody.appendChild(tr);
                    });
                }
            }
            
            // 2. Cập nhật bảng tổng hợp doanh thu toàn cơ sở qua các tháng
            var tableBody = document.querySelector('#adminReportTable tbody');
            if (tableBody) {
                tableBody.innerHTML = "";
                
                var sortedMonths = Object.keys(reports).sort(function(a, b) {
                    var pa = parseMonthYear(a);
                    var pb = parseMonthYear(b);
                    if (pa.year !== pb.year) return pa.year - pb.year;
                    return pa.month - pb.month;
                });

                sortedMonths.forEach(m => {
                    var r = reports[m];
                    var tr = document.createElement('tr');
                    tr.innerHTML = "<td><b>" + m + "</b></td>" +
                                   "<td style='color:#8E4DFF; font-weight:bold;'>" + r.expected.toLocaleString('vi-VN') + "đ</td>" +
                                   "<td style='color:#10B981; font-weight:bold;'>" + r.paid.toLocaleString('vi-VN') + "đ</td>" +
                                   "<td style='color:#F59E0B; font-weight:bold;'>" + r.unpaid.toLocaleString('vi-VN') + "đ</td>";
                    tableBody.appendChild(tr);
                });
            }

            // 3. Vẽ biểu đồ xu hướng tiền lương/doanh thu theo tháng
            renderAdminRevenueChart(reports);
        }

        function renderAdminRevenueChart(reports) {
            if (adminRevenueChartInstance) {
                adminRevenueChartInstance.destroy();
                adminRevenueChartInstance = null;
            }

            var sortedMonths = Object.keys(reports).sort(function(a, b) {
                var pa = parseMonthYear(a);
                var pb = parseMonthYear(b);
                if (pa.year !== pb.year) return pa.year - pb.year;
                return pa.month - pb.month;
            });

            var labels = sortedMonths.map(m => m.replace("Tháng ", "T"));
            var expectedData = sortedMonths.map(m => reports[m].expected);
            var paidData = sortedMonths.map(m => reports[m].paid);

            var ctx = document.getElementById('adminRevenueChartCanvas').getContext('2d');
            adminRevenueChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Lương dự kiến (Tổng học phí)',
                            data: expectedData,
                            borderColor: '#8E4DFF',
                            backgroundColor: 'rgba(142, 77, 255, 0.05)',
                            fill: true,
                            tension: 0.35,
                            borderWidth: 3,
                            pointBackgroundColor: '#8E4DFF',
                            pointBorderColor: '#FFFFFF',
                            pointRadius: 6,
                            pointBorderWidth: 3,
                            pointHoverRadius: 8,
                            pointHoverBorderWidth: 4
                        },
                        {
                            label: 'Lương thực thu (Thực tế đã đóng)',
                            data: paidData,
                            borderColor: '#10B981',
                            backgroundColor: 'rgba(16, 185, 129, 0.05)',
                            fill: true,
                            tension: 0.35,
                            borderWidth: 3,
                            pointBackgroundColor: '#10B981',
                            pointBorderColor: '#FFFFFF',
                            pointRadius: 6,
                            pointBorderWidth: 3,
                            pointHoverRadius: 8,
                            pointHoverBorderWidth: 4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: {
                                color: '#A6ADCE',
                                font: { family: 'Inter', size: 12 }
                            }
                        },
                        tooltip: {
                            backgroundColor: '#0B0826',
                            titleColor: '#FFF',
                            bodyColor: '#A6ADCE',
                            borderColor: '#8E4DFF',
                            borderWidth: 1,
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': ' + context.raw.toLocaleString('vi-VN') + 'đ';
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { color: 'rgba(255, 255, 255, 0.04)' },
                            ticks: { color: '#A6ADCE', font: { family: 'Inter' } }
                        },
                        y: {
                            min: 0,
                            grid: { color: 'rgba(255, 255, 255, 0.04)' },
                            ticks: {
                                color: '#A6ADCE',
                                font: { family: 'Inter' },
                                callback: function(value) {
                                    if (value >= 1000000) {
                                        return (value / 1000000) + 'M';
                                    }
                                    return value.toLocaleString('vi-VN');
                                }
                            }
                        }
                    }
                }
            });
        }

        // 2. Tutors Management Tab
        function renderAdminTutorsList() {
            var tbody = document.querySelector('#adminTutorsTable tbody');
            if (!tbody) return;
            tbody.innerHTML = "";
            
            if (!adminDataGlobal.tutors || adminDataGlobal.tutors.length === 0) {
                tbody.innerHTML = "<tr><td colspan='4' style='text-align:center; color:#A6ADCE;'>Không có gia sư nào trên hệ thống.</td></tr>";
                return;
            }
            
            adminDataGlobal.tutors.forEach(t => {
                var tr = document.createElement('tr');
                tr.innerHTML = "<td><b>" + t.name + "</b></td>" +
                               "<td>" + t.phone + "</td>" +
                               "<td><code style='letter-spacing:2px; font-weight:bold; color:#FFD23F;'>" + t.pin + "</code></td>" +
                               "<td style='text-align:center;'>" +
                                 "<button class='btn-icon-edit' onclick='openAdminEditTutorModal(\"" + t.phone + "\")' title='Sửa gia sư'><i class='fa-solid fa-pen-to-square'></i></button>" +
                               "</td>";
                tbody.appendChild(tr);
            });
        }

        // 3. Students Management Tab
        function renderAdminStudentsList() {
            var tbody = document.querySelector('#adminStudentsTable tbody');
            if (!tbody) return;
            tbody.innerHTML = "";
            
            if (!adminDataGlobal.students || adminDataGlobal.students.length === 0) {
                tbody.innerHTML = "<tr><td colspan='7' style='text-align:center; color:#A6ADCE;'>Không có học sinh nào trên hệ thống.</td></tr>";
                return;
            }
            
            adminDataGlobal.students.forEach(st => {
                var tr = document.createElement('tr');
                var statusText = st.deletedDate ? "<span class='badge' style='background:rgba(239,68,68,0.1); color:#EF4444;'>Đã xóa (" + st.deletedDate.split(" ")[0] + ")</span>" : "<span class='badge' style='background:rgba(16,185,129,0.1); color:#10B981;'>Hoạt động</span>";
                
                // Tìm tên gia sư tương ứng
                var tName = adminDataGlobal.tutors.find(t => t.phone === st.tutorPhone)?.name || "Chưa gán";
                
                tr.innerHTML = "<td><b>" + st.name + "</b></td>" +
                               "<td>" + st.parentName + "</td>" +
                               "<td>" + st.phone + "</td>" +
                               "<td>" + st.tuition.toLocaleString('vi-VN') + "đ</td>" +
                               "<td>" + tName + "</td>" +
                               "<td>" + statusText + "</td>" +
                               "<td style='text-align:center;'>" +
                                 "<button class='btn-icon-edit' onclick='openAdminEditStudentModal(\"" + st.phone + "\", \"" + st.parentName.replace(/'/g, "\\'") + "\", \"" + st.name.replace(/'/g, "\\'") + "\", " + st.tuition + ", \"" + st.tutorPhone + "\")' title='Sửa học sinh'><i class='fa-solid fa-pen-to-square'></i></button>" +
                               "</td>";
                tbody.appendChild(tr);
            });
        }

        // --- Admin Modals ---
        function openAdminAccountModal() {
            var selfData = adminDataGlobal.tutors.find(t => t.phone === currentAdminPhone);
            document.getElementById('adminAccName').value = selfData ? selfData.name : "Quản trị viên";
            document.getElementById('adminAccPhone').value = currentAdminPhone;
            document.getElementById('adminAccPin').value = selfData ? selfData.pin : "";
            document.getElementById('adminAccountModal').style.display = "flex";
        }
        function closeAdminAccountModal() {
            document.getElementById('adminAccountModal').style.display = "none";
        }
        function saveAdminAccount() {
            var name = document.getElementById('adminAccName').value.trim();
            var phone = document.getElementById('adminAccPhone').value.trim();
            var pin = document.getElementById('adminAccPin').value.trim();
            
            if (!name || !phone || !pin) {
                showToast("Vui lòng nhập đầy đủ thông tin!", "error");
                return;
            }
            
            var btn = document.getElementById('btnSaveAdminAccount');
            btn.disabled = true;
            btn.innerText = "Đang lưu...";
            
            google.script.run
                .withSuccessHandler(function(res) {
                    btn.disabled = false;
                    btn.innerText = "Cập nhật";
                    if (res.error) {
                        showToast("Lỗi: " + res.error, "error");
                    } else {
                        showToast("Cập nhật tài khoản Admin thành công!", "success");
                        currentAdminPhone = phone;
                        document.getElementById('maPin').value = pin;
                        closeAdminAccountModal();
                        refreshAdminDashboard();
                    }
                })
                .withFailureHandler(function(err) {
                    btn.disabled = false;
                    btn.innerText = "Cập nhật";
                    showToast("Lỗi kết nối: " + err.toString(), "error");
                })
                .adminCapNhatTaiKhoan(currentAdminPhone, name, phone, pin);
        }

        // Admin Edit Tutor Modal
        function openAdminAddTutorModal() {
            document.getElementById('adminTutorModalTitle').innerHTML = '<i class="fa-solid fa-chalkboard-user"></i> Thêm Gia Sư Mới';
            document.getElementById('adminTutorOldPhone').value = "";
            document.getElementById('adminTutorName').value = "";
            document.getElementById('adminTutorPhone').value = "";
            document.getElementById('adminTutorPin').value = "";
            document.getElementById('adminTutorQrUrl').value = "";
            document.getElementById('btnDeleteAdminTutor').style.display = "none";
            document.getElementById('adminEditTutorModal').style.display = "flex";
        }
        
        function openAdminEditTutorModal(phone) {
            var tutor = adminDataGlobal.tutors.find(t => t.phone === phone);
            if (!tutor) return;
            
            document.getElementById('adminTutorModalTitle').innerHTML = '<i class="fa-solid fa-chalkboard-user"></i> Sửa Thông Tin Gia Sư';
            document.getElementById('adminTutorOldPhone').value = tutor.phone;
            document.getElementById('adminTutorName').value = tutor.name;
            document.getElementById('adminTutorPhone').value = tutor.phone;
            document.getElementById('adminTutorPin').value = tutor.pin;
            document.getElementById('adminTutorQrUrl').value = tutor.qrUrl || "";
            document.getElementById('btnDeleteAdminTutor').style.display = "flex";
            document.getElementById('adminEditTutorModal').style.display = "flex";
        }
        
        function closeAdminEditTutorModal() {
            document.getElementById('adminEditTutorModal').style.display = "none";
        }
        
        function saveAdminTutor() {
            var oldPhone = document.getElementById('adminTutorOldPhone').value;
            var name = document.getElementById('adminTutorName').value.trim();
            var phone = document.getElementById('adminTutorPhone').value.trim();
            var pin = document.getElementById('adminTutorPin').value.trim();
            var qrUrl = document.getElementById('adminTutorQrUrl').value.trim();
            
            if(!name || !phone || !pin) {
                showToast("Vui lòng điền đầy đủ các ô!", "error");
                return;
            }
            
            var btn = document.getElementById('btnSaveAdminTutor');
            btn.disabled = true;
            btn.innerText = "Đang lưu...";
            
            google.script.run
                .withSuccessHandler(function(res) {
                    btn.disabled = false;
                    btn.innerText = "Lưu lại";
                    if(res.error) {
                        showToast("Lỗi: " + res.error, "error");
                    } else {
                        showToast("Lưu thông tin gia sư thành công!", "success");
                        closeAdminEditTutorModal();
                        refreshAdminDashboard();
                    }
                })
                .withFailureHandler(function(err) {
                    btn.disabled = false;
                    btn.innerText = "Lưu lại";
                    showToast("Lỗi kết nối: " + err.toString(), "error");
                })
                .adminLuuGiaSur(oldPhone, name, phone, pin, qrUrl);
        }

        // Xóa/Khôi phục & Thùng rác Gia sư JS Controllers
        function confirmDeleteAdminTutor() {
            pinVerifyAction = "deleteTutor";
            document.getElementById('confirmTutorPinInput').value = "";
            document.getElementById('pinConfirmModal').style.display = "flex";
        }

        function closePinConfirmModal() {
            document.getElementById('pinConfirmModal').style.display = "none";
        }

        function submitPinVerifyForDelete() {
            var inputPin = document.getElementById('confirmTutorPinInput').value.trim();
            var adminPin = document.getElementById('maPin').value.trim();
            if (inputPin === adminPin) {
                closePinConfirmModal();
                closeAdminEditTutorModal();
                deleteTutorBackend();
            } else {
                showToast("Mã PIN xác thực của Admin không chính xác!", "error");
            }
        }

        function deleteTutorBackend() {
            var phone = document.getElementById('adminTutorOldPhone').value;
            var name = document.getElementById('adminTutorName').value;
            
            showCustomConfirm("Xác nhận đưa gia sư " + name + " vào thùng rác? Gia sư sẽ ẩn khỏi danh sách và tài khoản này sẽ bị khóa tạm thời.", function() {
                google.script.run
                    .withSuccessHandler(function(res) {
                        if (res.error) {
                            showToast("Lỗi: " + res.error, "error");
                        } else {
                            showToast("Đã đưa gia sư vào thùng rác!", "success");
                            refreshAdminDashboard();
                        }
                    })
                    .withFailureHandler(function(err) {
                        showToast("Lỗi kết nối hoặc hệ thống: " + err.toString(), "error");
                    })
                    .xoaGiaSuTamThoi(phone);
            });
        }

        function openTutorTrashModal() {
            renderTrashTutorList();
            document.getElementById('tutorTrashModal').style.display = "flex";
        }

        function closeTutorTrashModal() {
            document.getElementById('tutorTrashModal').style.display = "none";
        }

        function restoreTutor(phone) {
            google.script.run
                .withSuccessHandler(function(res) {
                    if (res.error) {
                        showToast("Lỗi: " + res.error, "error");
                    } else {
                        showToast("Khôi phục gia sư thành công!", "success");
                        closeTutorTrashModal();
                        refreshAdminDashboard();
                    }
                })
                .withFailureHandler(function(err) {
                    showToast("Lỗi kết nối hoặc hệ thống: " + err.toString(), "error");
                })
                .khoiPhucGiaSu(phone);
        }

        function renderTrashTutorList() {
            var container = document.getElementById('trashTutorList');
            if (!container) return;
            container.innerHTML = "";
            
            var deletedTutors = adminDataGlobal.deletedTutors || [];
            if (deletedTutors.length === 0) {
                container.innerHTML = "<p style='text-align:center; color:#A6ADCE; padding: 20px 0;'>Thùng rác trống.</p>";
                return;
            }
            
            deletedTutors.forEach(t => {
                var card = document.createElement('div');
                card.className = "trash-student-card";
                card.style.display = "flex";
                card.style.justify = "space-between";
                card.style.alignItems = "center";
                card.style.background = "rgba(255, 255, 255, 0.02)";
                card.style.padding = "10px 15px";
                card.style.borderRadius = "12px";
                card.style.border = "1px solid rgba(255, 255, 255, 0.05)";
                
                var info = document.createElement('div');
                info.innerHTML = "<p style='margin:0; color:#FFF; font-weight:bold;'>" + t.name + "</p>" +
                                 "<p style='margin:3px 0 0; color:#A6ADCE; font-size:12px;'>SĐT: " + t.phone + " | Đã xóa: " + t.deletedDate.split(" ")[0] + "</p>";
                
                var btnRestore = document.createElement('button');
                btnRestore.className = "modal-btn modal-btn-primary";
                btnRestore.style.padding = "6px 14px";
                btnRestore.style.fontSize = "12px";
                btnRestore.style.borderRadius = "20px";
                btnRestore.innerHTML = "<i class='fa-solid fa-trash-arrow-up'></i> Khôi phục";
                btnRestore.onclick = function() {
                    restoreTutor(t.phone);
                };
                
                card.appendChild(info);
                card.appendChild(btnRestore);
                container.appendChild(card);
            });
        }

        // Admin Edit Student Modal
        function openAdminAddStudentModal() {
            document.getElementById('adminStudentModalTitle').innerHTML = '<i class="fa-solid fa-user-graduate"></i> Thêm Học Sinh Mới';
            document.getElementById('adminStudentOldPhone').value = "";
            document.getElementById('adminStudentParentName').value = "";
            document.getElementById('adminStudentName').value = "";
            document.getElementById('adminStudentPhone').value = "";
            document.getElementById('adminStudentTuition').value = "";
            
            populateAdminTutorSelect("");
            document.getElementById('adminEditStudentModal').style.display = "flex";
        }

        function openAdminEditStudentModal(phone, parentName, name, tuition, tutorPhone) {
            document.getElementById('adminStudentModalTitle').innerHTML = '<i class="fa-solid fa-user-graduate"></i> Sửa Thông Tin Học Sinh';
            document.getElementById('adminStudentOldPhone').value = phone;
            document.getElementById('adminStudentParentName').value = parentName;
            document.getElementById('adminStudentName').value = name;
            document.getElementById('adminStudentPhone').value = phone;
            document.getElementById('adminStudentTuition').value = tuition;
            
            populateAdminTutorSelect(tutorPhone);
            document.getElementById('adminEditStudentModal').style.display = "flex";
        }

        function closeAdminEditStudentModal() {
            document.getElementById('adminEditStudentModal').style.display = "none";
        }

        function populateAdminTutorSelect(selectedPhone) {
            var select = document.getElementById('adminStudentTutorSelect');
            if(!select) return;
            select.innerHTML = '<option value="">-- Chọn Gia Sư Phụ Trách --</option>';
            
            adminDataGlobal.tutors.forEach(t => {
                var opt = document.createElement('option');
                opt.value = t.phone;
                opt.innerText = t.name + " (" + t.phone + ")";
                if (t.phone === selectedPhone) {
                    opt.selected = true;
                }
                select.appendChild(opt);
            });
        }

        function saveAdminStudent() {
            var oldPhone = document.getElementById('adminStudentOldPhone').value;
            var parentName = document.getElementById('adminStudentParentName').value.trim();
            var studentName = document.getElementById('adminStudentName').value.trim();
            var phone = document.getElementById('adminStudentPhone').value.trim();
            var tuition = document.getElementById('adminStudentTuition').value.trim();
            var tutorPhone = document.getElementById('adminStudentTutorSelect').value;
            
            if(!parentName || !studentName || !phone || !tuition || !tutorPhone) {
                showToast("Vui lòng điền và chọn đầy đủ thông tin!", "error");
                return;
            }
            
            var btn = document.getElementById('btnSaveAdminStudent');
            btn.disabled = true;
            btn.innerText = "Đang lưu...";
            
            google.script.run
                .withSuccessHandler(function(res) {
                    btn.disabled = false;
                    btn.innerText = "Lưu lại";
                    if(res.error) {
                        showToast("Lỗi: " + res.error, "error");
                    } else {
                        showToast("Lưu thông tin học sinh thành công!", "success");
                        closeAdminEditStudentModal();
                        refreshAdminDashboard();
                    }
                })
                .withFailureHandler(function(err) {
                    btn.disabled = false;
                    btn.innerText = "Lưu lại";
                    showToast("Lỗi kết nối: " + err.toString(), "error");
                })
                .adminLuuHocSinh(oldPhone, parentName, studentName, phone, parseFloat(tuition) || 0, tutorPhone);
        }

        function refreshAdminDashboard() {
            var pin = document.getElementById('maPin').value.trim();
            
            google.script.run
                .withSuccessHandler(function(loginRes) {
                    if (loginRes.role === 'admin') {
                        renderAdminView(loginRes.data);
                    } else {
                        location.reload();
                    }
                })
                .loginSystem(currentAdminPhone, pin);
        }

        // Các hàm phụ trợ hóa đơn của Gia sư đã được di chuyển sang đúng file js/tutor.js.
        
        function isSinglePageApp() {
            return (document.getElementById('mainScreen') !== null);
        }

        function quayLai() {
            if (adminRevenueChartInstance) {
                adminRevenueChartInstance.destroy();
                adminRevenueChartInstance = null;
            }
            sessionStorage.clear();
            if (isSinglePageApp()) {
                var adminDb = document.getElementById('adminDashboardBox');
                if (adminDb) adminDb.style.display = 'none';
                var mainScr = document.getElementById('mainScreen');
                if (mainScr) mainScr.style.display = 'flex';
                navigateToPage('tutor');
            } else {
                window.location.href = 'tutor-login.html';
            }
        }
