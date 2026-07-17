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
            
            // Khởi tạo số điện thoại Admin hiện tại nếu chưa có
            if (!currentAdminPhone) {
                currentAdminPhone = sessionStorage.getItem('userPhone') || (document.getElementById('maHocSinh') ? document.getElementById('maHocSinh').value : "");
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
            
            // Nạp thông báo chạy chữ vào ô input
            var marqueeInput = document.getElementById('adminMarqueeInput');
            if (marqueeInput) {
                marqueeInput.value = data.marqueeAnnouncement || "";
            }
            
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
            
            // 1. Cập nhật Bảng phân rã theo Gia sư cho tháng chọn (Desktop & Mobile)
            var breakdownBody = document.querySelector('#adminTutorBreakdownTable tbody');
            var breakdownMobile = document.getElementById('adminTutorBreakdownMobile');
            
            if (breakdownBody) {
                breakdownBody.innerHTML = "";
                var tutorsData = report.tutors || {};
                var tutorKeys = Object.keys(tutorsData);
                
                if (tutorKeys.length === 0) {
                    breakdownBody.innerHTML = "<tr><td colspan='5' style='text-align:center; color:#A6ADCE;'>Không có dữ liệu buổi học nào trong tháng này.</td></tr>";
                    if (breakdownMobile) {
                        breakdownMobile.innerHTML = "<div style='text-align:center; color:#A6ADCE; padding: 20px; font-size: 13px;'><i class='fa-solid fa-circle-info'></i> Không có dữ liệu buổi học nào trong tháng này.</div>";
                    }
                } else {
                    var mobileHtml = "";
                    tutorKeys.forEach((tKey, idx) => {
                        var tReport = tutorsData[tKey];
                        var rate = tReport.expected > 0 ? ((tReport.paid / tReport.expected) * 100).toFixed(1) + "%" : "0%";
                        
                        // Desktop
                        var tr = document.createElement('tr');
                        tr.innerHTML = "<td><b>" + tReport.name + "</b></td>" +
                                       "<td style='color:#8E4DFF; font-weight:bold;'>" + tReport.expected.toLocaleString('vi-VN') + "đ</td>" +
                                       "<td style='color:#10B981; font-weight:bold;'>" + tReport.paid.toLocaleString('vi-VN') + "đ</td>" +
                                       "<td style='color:#F59E0B; font-weight:bold;'>" + tReport.unpaid.toLocaleString('vi-VN') + "đ</td>" +
                                       "<td style='text-align:center;'><span class='badge' style='background:rgba(142,77,255,0.15); color:#a78bfa;'>" + rate + "</span></td>";
                        breakdownBody.appendChild(tr);
                        
                        // Mobile
                        mobileHtml += "<div class='accordion-item'>";
                        mobileHtml += "  <div class='accordion-header' onclick='toggleAdminTutorBreakdownAccordion(" + idx + ")'>";
                        mobileHtml += "    <div class='accordion-header-title'>";
                        mobileHtml += "      <span>" + tReport.name + "</span>";
                        mobileHtml += "      <span class='badge' style='background:rgba(142,77,255,0.15); color:#a78bfa; margin-bottom: 0; padding: 3px 8px; font-size: 10px;'>" + rate + "</span>";
                        mobileHtml += "    </div>";
                        mobileHtml += "    <div class='accordion-header-status'><i class='fa-solid fa-chevron-down' id='adm-tutor-bd-chevron-" + idx + "'></i></div>";
                        mobileHtml += "  </div>";
                        mobileHtml += "  <div class='accordion-body' id='adm-tutor-bd-body-" + idx + "' style='display: none;'>";
                        mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Lương dự kiến</span><span class='accordion-body-val' style='color:#8E4DFF; font-weight:bold;'>" + tReport.expected.toLocaleString('vi-VN') + "đ</span></div>";
                        mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Lương thực tế</span><span class='accordion-body-val' style='color:#10B981; font-weight:bold;'>" + tReport.paid.toLocaleString('vi-VN') + "đ</span></div>";
                        mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Còn nợ</span><span class='accordion-body-val' style='color:#F59E0B; font-weight:bold;'>" + tReport.unpaid.toLocaleString('vi-VN') + "đ</span></div>";
                        mobileHtml += "  </div>";
                        mobileHtml += "</div>";
                    });
                    if (breakdownMobile) {
                        breakdownMobile.innerHTML = mobileHtml;
                    }
                }
            }
            
            // 2. Cập nhật bảng tổng hợp doanh thu toàn cơ sở qua các tháng (Desktop & Mobile)
            var tableBody = document.querySelector('#adminReportTable tbody');
            var reportMobile = document.getElementById('adminReportMobile');
            
            if (tableBody) {
                tableBody.innerHTML = "";
                
                var sortedMonths = Object.keys(reports).sort(function(a, b) {
                    var pa = parseMonthYear(a);
                    var pb = parseMonthYear(b);
                    if (pa.year !== pb.year) return pa.year - pb.year;
                    return pa.month - pb.month;
                });

                var reportMobileHtml = "";
                sortedMonths.forEach((m, idx) => {
                    var r = reports[m];
                    
                    // Desktop
                    var tr = document.createElement('tr');
                    tr.innerHTML = "<td><b>" + m + "</b></td>" +
                                   "<td style='color:#8E4DFF; font-weight:bold;'>" + r.expected.toLocaleString('vi-VN') + "đ</td>" +
                                   "<td style='color:#10B981; font-weight:bold;'>" + r.paid.toLocaleString('vi-VN') + "đ</td>" +
                                   "<td style='color:#F59E0B; font-weight:bold;'>" + r.unpaid.toLocaleString('vi-VN') + "đ</td>";
                    tableBody.appendChild(tr);
                    
                    // Mobile
                    reportMobileHtml += "<div class='accordion-item'>";
                    reportMobileHtml += "  <div class='accordion-header' onclick='toggleAdminReportAccordion(" + idx + ")'>";
                    reportMobileHtml += "    <div class='accordion-header-title'>";
                    reportMobileHtml += "      <span>Tháng " + m + "</span>";
                    reportMobileHtml += "    </div>";
                    reportMobileHtml += "    <div class='accordion-header-status'><i class='fa-solid fa-chevron-down' id='adm-report-chevron-" + idx + "'></i></div>";
                    reportMobileHtml += "  </div>";
                    reportMobileHtml += "  <div class='accordion-body' id='adm-report-body-" + idx + "' style='display: none;'>";
                    reportMobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Dự kiến thu</span><span class='accordion-body-val' style='color:#8E4DFF; font-weight:bold;'>" + r.expected.toLocaleString('vi-VN') + "đ</span></div>";
                    reportMobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Thực tế đã thu</span><span class='accordion-body-val' style='color:#10B981; font-weight:bold;'>" + r.paid.toLocaleString('vi-VN') + "đ</span></div>";
                    reportMobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Còn nợ</span><span class='accordion-body-val' style='color:#F59E0B; font-weight:bold;'>" + r.unpaid.toLocaleString('vi-VN') + "đ</span></div>";
                    reportMobileHtml += "  </div>";
                    reportMobileHtml += "</div>";
                });
                
                if (reportMobile) {
                    reportMobile.innerHTML = reportMobileHtml;
                }
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
                                font: { family: 'Inter', size: 11 }
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(11, 8, 38, 0.95)',
                            titleColor: '#FFF',
                            bodyColor: '#A6ADCE',
                            titleFont: { family: 'Inter', weight: 'bold', size: 11 },
                            bodyFont: { family: 'Inter', size: 10 },
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
                            grid: { color: 'rgba(255, 255, 255, 0.03)' },
                            ticks: { color: '#A6ADCE', font: { family: 'Inter', size: 9.5 } }
                        },
                        y: {
                            min: 0,
                            grid: { color: 'rgba(255, 255, 255, 0.03)' },
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
        // Helper tính số học sinh hoạt động của 1 gia sư
        function getActiveStudentsForTutor(tPhone) {
            if (!adminDataGlobal.students) return 0;
            var normT = normalizePhone(tPhone);
            return adminDataGlobal.students.filter(s => 
                normalizePhone(s.tutorPhone) === normT && 
                (!s.deletedDate || s.deletedDate.trim() === "")
            ).length;
        }

        // Kiểm tra xem đã đến kỳ đóng phí thuê web chưa (đúng ngày chốt chu kỳ)
        function isBillingDue(dateStr) {
            if (!dateStr) return false;
            try {
                var parts = dateStr.split("/");
                if (parts.length === 3) {
                    var d = parseInt(parts[0], 10);
                    var m = parseInt(parts[1], 10) - 1;
                    var y = parseInt(parts[2], 10);
                    var billDate = new Date(y, m, d);
                    billDate.setHours(0,0,0,0);
                    
                    var today = new Date();
                    today.setHours(0,0,0,0);
                    
                    return billDate <= today;
                }
            } catch (e) {
                console.error("Lỗi isBillingDue: ", e);
            }
            return false;
        }

        // 2. Tutors Management Tab
        function renderAdminTutorsList() {
            var tbody = document.querySelector('#adminTutorsTable tbody');
            var mobileContainer = document.getElementById('adminTutorsMobile');
            
            if (!tbody) return;
            tbody.innerHTML = "";
            
            var dueAlerts = [];
            var alertContainer = document.getElementById('adminBillingAlerts');
            
            if (!adminDataGlobal.tutors || adminDataGlobal.tutors.length === 0) {
                tbody.innerHTML = "<tr><td colspan='10' style='text-align:center; color:#A6ADCE;'>Không có gia sư nào trên hệ thống.</td></tr>";
                if (mobileContainer) {
                    mobileContainer.innerHTML = "<div style='text-align:center; color:#A6ADCE; padding: 20px; font-size: 13px;'><i class='fa-solid fa-circle-info'></i> Không có gia sư nào trên hệ thống.</div>";
                }
                if (alertContainer) {
                    alertContainer.style.display = "none";
                    alertContainer.innerHTML = "";
                }
                return;
            }
            
            var mobileHtml = "";
            adminDataGlobal.tutors.forEach((t, idx) => {
                 var sCount = getActiveStudentsForTutor(t.phone);
                 var webFee = Math.ceil(sCount / 2) * 30000;
                 
                 var isCurrentlyDeactivated = (t.status === "Vô hiệu hóa");
                 var isDue = isBillingDue(t.nextBillingDate) && !isCurrentlyDeactivated;
                 if (isDue) {
                     dueAlerts.push({
                         name: t.name,
                         phone: t.phone,
                         nextBillingDate: t.nextBillingDate,
                         students: sCount,
                         fee: webFee
                     });
                 }
                 
                 var statusText = "";
                 if (isCurrentlyDeactivated) {
                     statusText = "<span style='color:#F59E0B; font-weight:bold;'><i class='fa-solid fa-ban'></i> Bị vô hiệu hóa</span>";
                 } else if (isDue) {
                     statusText = "<span style='color:#FF4D4D; font-weight:bold;'><i class='fa-solid fa-triangle-exclamation'></i> Đến hạn</span>";
                 } else {
                     statusText = "<span style='color:#00CC66;'><i class='fa-solid fa-circle-check'></i> Hoạt động</span>";
                 }
                 
                 var quickPayBtn = "";
                 if (isCurrentlyDeactivated) {
                     quickPayBtn = "<span style='color:#6c757d; font-size:11px;'>Tài khoản đang khóa</span>";
                 } else if (isDue) {
                     quickPayBtn = "<button class='modal-btn modal-btn-primary' onclick='confirmQuickPaid(\"" + t.phone + "\", \"" + t.name + "\")' style='padding:4px 10px; font-size:11px; border-radius:15px; background:linear-gradient(135deg, #10B981, #059669); border:none; color:#FFF; font-weight:bold; cursor:pointer;'><i class='fa-solid fa-check'></i> Đã thu</button>";
                 } else {
                     quickPayBtn = "<span style='color:#A6ADCE; font-size:11px;'>Chưa đến hạn</span>";
                 }
                 
                 var lastActiveDisplay = t.lastActive ? t.lastActive : "<i style='color:#6c757d;'>Chưa hoạt động</i>";
                 
                 // Desktop row
                 var tr = document.createElement('tr');
                 if (isCurrentlyDeactivated) {
                     tr.style.background = "rgba(245, 158, 11, 0.02)";
                     tr.style.opacity = "0.8";
                 } else if (isDue) {
                     tr.style.background = "rgba(239, 68, 68, 0.04)";
                 }
                 tr.innerHTML = "<td><b>" + t.name + "</b></td>" +
                                "<td>" + t.phone + "</td>" +
                                "<td><code style='letter-spacing:2px; font-weight:bold; color:#FFD23F;'>" + t.pin + "</code></td>" +
                                "<td>" + (t.createdDate || "-") + "</td>" +
                                "<td><b style='" + (isDue ? "color:#FF8080;" : "") + "'>" + (t.nextBillingDate || "-") + "</b></td>" +
                                "<td style='text-align:center;'><b>" + sCount + "</b></td>" +
                                "<td><b style='color:#A78BFA;'>" + webFee.toLocaleString('vi-VN') + "đ</b></td>" +
                                "<td style='font-size:12px;'>" + lastActiveDisplay + "</td>" +
                                "<td style='text-align:center;'>" + statusText + "</td>" +
                                "<td style='text-align:center;'>" +
                                  "<button class='btn-icon-edit' onclick='openAdminEditTutorModal(\"" + t.phone + "\")' title='Sửa/Vô hiệu hóa gia sư'><i class='fa-solid fa-pen-to-square'></i> Sửa</button>" +
                                "</td>";
                 tbody.appendChild(tr);
                 
                 // Mobile accordion view
                 var editBtn = "<button class='action-btn-hw' onclick='openAdminEditTutorModal(\"" + t.phone + "\")' style='color:#FFD23F; border-color:rgba(255,210,63,0.3); background:rgba(255,210,63,0.1); padding: 4px 14px; text-decoration: none; font-size:12px; border-radius: 20px;'><i class='fa-solid fa-pen-to-square'></i> Sửa</button>";
                 var mobilePayBtn = "";
                 if (isCurrentlyDeactivated) {
                     mobilePayBtn = "<span style='color:#6c757d; font-size:12px; margin-right: 8px;'>Đã khóa</span>";
                 } else if (isDue) {
                     mobilePayBtn = "<button class='action-btn-hw' onclick='confirmQuickPaid(\"" + t.phone + "\", \"" + t.name + "\")' style='color:#10B981; border-color:rgba(16,185,129,0.3); background:rgba(16,185,129,0.1); padding: 4px 14px; text-decoration: none; font-size:12px; border-radius: 20px; margin-right: 8px;'><i class='fa-solid fa-check'></i> Xác nhận đã thu</button>";
                 }
                 
                 mobileHtml += "<div class='accordion-item' style='" + (isCurrentlyDeactivated ? "border: 1px solid rgba(245, 158, 11, 0.25); opacity: 0.85;" : (isDue ? "border: 1px solid rgba(239, 68, 68, 0.35);" : "")) + "'>";
                 mobileHtml += "  <div class='accordion-header' onclick='toggleAdminTutorAccordion(" + idx + ")'>";
                 mobileHtml += "    <div class='accordion-header-title'>";
                 mobileHtml += "      <span>" + t.name + "</span>" + (isCurrentlyDeactivated ? " <span style='background:#F59E0B; color:#000; font-size:9px; padding:1px 5px; border-radius:10px; font-weight:bold; margin-left:5px;'>Vô hiệu hóa</span>" : (isDue ? " <span style='background:#EF4444; color:#FFF; font-size:9px; padding:1px 5px; border-radius:10px; font-weight:bold; margin-left:5px;'>Đến hạn</span>" : ""));
                 mobileHtml += "    </div>";
                 mobileHtml += "    <div class='accordion-header-status'><i class='fa-solid fa-chevron-down' id='adm-tutor-chevron-" + idx + "'></i></div>";
                 mobileHtml += "  </div>";
                 mobileHtml += "  <div class='accordion-body' id='adm-tutor-body-" + idx + "' style='display: none;'>";
                 mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Số điện thoại</span><span class='accordion-body-val'>" + t.phone + "</span></div>";
                 mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Mã PIN</span><span class='accordion-body-val'><code style='letter-spacing:2px; font-weight:bold; color:#FFD23F;'>" + t.pin + "</code></span></div>";
                 mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Ngày đăng ký</span><span class='accordion-body-val'>" + (t.createdDate || "-") + "</span></div>";
                 mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Ngày hạn kế</span><span class='accordion-body-val' style='" + (isDue ? "color:#FF8080; font-weight:bold;" : "") + "'>" + (t.nextBillingDate || "-") + "</span></div>";
                 mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Số HS hoạt động</span><span class='accordion-body-val'><b>" + sCount + "</b></span></div>";
                 mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Phí thuê Web</span><span class='accordion-body-val'><b style='color:#A78BFA;'>" + webFee.toLocaleString('vi-VN') + "đ</b></span></div>";
                 mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Hoạt động cuối</span><span class='accordion-body-val'>" + lastActiveDisplay + "</span></div>";
                 mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Trạng thái</span><span class='accordion-body-val'>" + statusText + "</span></div>";
                 mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Thao tác</span><span class='accordion-body-val'>" + mobilePayBtn + editBtn + "</span></div>";
                 mobileHtml += "  </div>";
                 mobileHtml += "</div>";
            });
            
            if (mobileContainer) {
                mobileContainer.innerHTML = mobileHtml;
            }
            
            // Vẽ hộp cảnh báo đỏ lên đầu trang Admin
            if (alertContainer) {
                if (dueAlerts.length > 0) {
                    var alertHtml = "";
                    dueAlerts.forEach(a => {
                        alertHtml += `
                            <div style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.35); border-radius: 12px; padding: 15px; color: #FF8080; font-size: 13.5px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; font-family: Inter;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <i class="fa-solid fa-circle-exclamation" style="font-size: 16px; color: #EF4444;"></i>
                                    <span>⚠️ Gia sư <b>${a.name}</b> (${a.students} HS) đến hạn đóng tiền thuê Web: <b style="color: #FFF; background: #EF4444; padding: 2px 8px; border-radius: 4px;">${a.fee.toLocaleString('vi-VN')}đ</b> (Hạn: ${a.nextBillingDate})</span>
                                </div>
                                <button onclick="confirmQuickPaid('${a.phone}', '${a.name}')" class="modal-btn modal-btn-primary" style="padding: 6px 14px; font-size: 12px; border-radius: 20px; background: linear-gradient(135deg, #10B981, #059669); border: none; box-shadow: 0 4px 10px rgba(16,185,129,0.2); color:#FFF; font-weight:bold; cursor:pointer;"><i class="fa-solid fa-check"></i> Xác nhận đã thu</button>
                            </div>
                        `;
                    });
                    alertContainer.innerHTML = alertHtml;
                    alertContainer.style.display = "flex";
                } else {
                    alertContainer.innerHTML = "";
                    alertContainer.style.display = "none";
                }
            }
        }

        // 3. Students Management Tab
        function renderAdminStudentsList() {
            var tbody = document.querySelector('#adminStudentsTable tbody');
            var mobileContainer = document.getElementById('adminStudentsMobile');
            
            if (!tbody) return;
            tbody.innerHTML = "";
            
            if (!adminDataGlobal.students || adminDataGlobal.students.length === 0) {
                tbody.innerHTML = "<tr><td colspan='7' style='text-align:center; color:#A6ADCE;'>Không có học sinh nào trên hệ thống.</td></tr>";
                if (mobileContainer) {
                    mobileContainer.innerHTML = "<div style='text-align:center; color:#A6ADCE; padding: 20px; font-size: 13px;'><i class='fa-solid fa-circle-info'></i> Không có học sinh nào trên hệ thống.</div>";
                }
                return;
            }
            
            var mobileHtml = "";
            adminDataGlobal.students.forEach((st, idx) => {
                var statusText = st.deletedDate ? "<span class='badge' style='background:rgba(239,68,68,0.1); color:#EF4444; margin-bottom:0;'>Đã xóa (" + st.deletedDate.split(" ")[0] + ")</span>" : "<span class='badge' style='background:rgba(16,185,129,0.1); color:#10B981; margin-bottom:0;'>Hoạt động</span>";
                var tName = adminDataGlobal.tutors.find(t => t.phone === st.tutorPhone)?.name || "Chưa gán";
                
                // Desktop
                var tr = document.createElement('tr');
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
                
                // Mobile
                var editBtn = "<button class='action-btn-hw' onclick='openAdminEditStudentModal(\"" + st.phone + "\", \"" + st.parentName.replace(/'/g, "\\'") + "\", \"" + st.name.replace(/'/g, "\\'") + "\", " + st.tuition + ", \"" + st.tutorPhone + "\")' style='color:#FFD23F; border-color:rgba(255,210,63,0.3); background:rgba(255,210,63,0.1); padding: 4px 14px; text-decoration: none; font-size:12px; border-radius:20px;'><i class='fa-solid fa-pen-to-square'></i> Chỉnh sửa</button>";
                
                mobileHtml += "<div class='accordion-item'>";
                mobileHtml += "  <div class='accordion-header' onclick='toggleAdminStudentAccordion(" + idx + ")'>";
                mobileHtml += "    <div class='accordion-header-title'>";
                mobileHtml += "      <span>" + st.name + "</span>";
                mobileHtml += "      " + statusText;
                mobileHtml += "    </div>";
                mobileHtml += "    <div class='accordion-header-status'><i class='fa-solid fa-chevron-down' id='adm-student-chevron-" + idx + "'></i></div>";
                mobileHtml += "  </div>";
                mobileHtml += "  <div class='accordion-body' id='adm-student-body-" + idx + "' style='display: none;'>";
                mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Tên phụ huynh</span><span class='accordion-body-val'>" + st.parentName + "</span></div>";
                mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>SĐT Phụ Huynh</span><span class='accordion-body-val'>" + st.phone + "</span></div>";
                mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Học phí/buổi</span><span class='accordion-body-val' style='font-weight:bold; color:#FFD23F;'>" + st.tuition.toLocaleString('vi-VN') + "đ</span></div>";
                mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Gia sư</span><span class='accordion-body-val'>" + tName + "</span></div>";
                mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Thao tác</span><span class='accordion-body-val'>" + editBtn + "</span></div>";
                mobileHtml += "  </div>";
                mobileHtml += "</div>";
            });
            
            if (mobileContainer) {
                mobileContainer.innerHTML = mobileHtml;
            }
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
            document.getElementById('adminTutorCreatedDate').value = "";
            document.getElementById('adminTutorNextBillingDate').value = "";
            document.getElementById('btnDeleteAdminTutor').style.display = "none";
            document.getElementById('btnDeactivateAdminTutor').style.display = "none";
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
            document.getElementById('adminTutorCreatedDate').value = tutor.createdDate || "";
            document.getElementById('adminTutorNextBillingDate').value = tutor.nextBillingDate || "";
            document.getElementById('btnDeleteAdminTutor').style.display = "flex";
            
            // Thiết lập nút Vô hiệu hóa
            var btnDeact = document.getElementById('btnDeactivateAdminTutor');
            if (btnDeact) {
                btnDeact.style.display = "flex";
                if (tutor.status === "Vô hiệu hóa") {
                    btnDeact.innerHTML = '<i class="fa-solid fa-user-check"></i> Kích hoạt lại';
                    btnDeact.style.background = "rgba(16, 185, 129, 0.1)";
                    btnDeact.style.border = "1px solid #10B981";
                    btnDeact.style.color = "#10B981";
                } else {
                    btnDeact.innerHTML = '<i class="fa-solid fa-user-slash"></i> Vô hiệu hóa';
                    btnDeact.style.background = "rgba(245, 158, 11, 0.1)";
                    btnDeact.style.border = "1px solid #F59E0B";
                    btnDeact.style.color = "#F59E0B";
                }
            }
            
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
            var createdDate = document.getElementById('adminTutorCreatedDate').value.trim();
            var nextBillingDate = document.getElementById('adminTutorNextBillingDate').value.trim();
            
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
                .adminLuuGiaSur(oldPhone, name, phone, pin, qrUrl, createdDate, nextBillingDate);
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
             
             showCustomConfirm("Xác nhận đưa gia sư " + name + " vào thùng rác? Gia sư sẽ ẩn khỏi danh sách và sẽ bị xóa vĩnh viễn sau 10 ngày.", function() {
                 google.script.run
                     .withSuccessHandler(function(res) {
                         if (res.error) {
                             showToast("Lỗi: " + res.error, "error");
                         } else {
                             showToast("Đã đưa gia sư vào thùng rác thành công!", "success");
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

        function toggleAdminTutorBreakdownAccordion(idx) {
            var body = document.getElementById('adm-tutor-bd-body-' + idx);
            if (!body) return;
            var item = body.closest('.accordion-item');
            var chevron = document.getElementById('adm-tutor-bd-chevron-' + idx);
            
            if (body.style.display === 'block') {
                body.style.display = 'none';
                if (item) item.classList.remove('active');
                if (chevron) {
                    chevron.classList.remove('fa-chevron-up');
                    chevron.classList.add('fa-chevron-down');
                }
            } else {
                body.style.display = 'block';
                if (item) item.classList.add('active');
                if (chevron) {
                    chevron.classList.remove('fa-chevron-down');
                    chevron.classList.add('fa-chevron-up');
                }
            }
        }

        function toggleAdminReportAccordion(idx) {
            var body = document.getElementById('adm-report-body-' + idx);
            if (!body) return;
            var item = body.closest('.accordion-item');
            var chevron = document.getElementById('adm-report-chevron-' + idx);
            
            if (body.style.display === 'block') {
                body.style.display = 'none';
                if (item) item.classList.remove('active');
                if (chevron) {
                    chevron.classList.remove('fa-chevron-up');
                    chevron.classList.add('fa-chevron-down');
                }
            } else {
                body.style.display = 'block';
                if (item) item.classList.add('active');
                if (chevron) {
                    chevron.classList.remove('fa-chevron-down');
                    chevron.classList.add('fa-chevron-up');
                }
            }
        }

        function toggleAdminTutorAccordion(idx) {
            var body = document.getElementById('adm-tutor-body-' + idx);
            if (!body) return;
            var item = body.closest('.accordion-item');
            var chevron = document.getElementById('adm-tutor-chevron-' + idx);
            
            if (body.style.display === 'block') {
                body.style.display = 'none';
                if (item) item.classList.remove('active');
                if (chevron) {
                    chevron.classList.remove('fa-chevron-up');
                    chevron.classList.add('fa-chevron-down');
                }
            } else {
                body.style.display = 'block';
                if (item) item.classList.add('active');
                if (chevron) {
                    chevron.classList.remove('fa-chevron-down');
                    chevron.classList.add('fa-chevron-up');
                }
            }
        }

        function toggleAdminStudentAccordion(idx) {
            var body = document.getElementById('adm-student-body-' + idx);
            if (!body) return;
            var item = body.closest('.accordion-item');
            var chevron = document.getElementById('adm-student-chevron-' + idx);
            
            if (body.style.display === 'block') {
                body.style.display = 'none';
                if (item) item.classList.remove('active');
                if (chevron) {
                    chevron.classList.remove('fa-chevron-up');
                    chevron.classList.add('fa-chevron-down');
                }
            } else {
                body.style.display = 'block';
                if (item) item.classList.add('active');
                if (chevron) {
                    chevron.classList.remove('fa-chevron-down');
                    chevron.classList.add('fa-chevron-up');
                }
            }
        }

        // --- Cải tiến Admin quản lý Phí thuê Web và Marquee ---
        function confirmQuickPaid(phone, name) {
            showCustomConfirm("Xác nhận đã nhận tiền thuê Web của gia sư " + name + " cho chu kỳ này và tự động gia hạn thêm 1 tháng?", function() {
                showToast("Đang gửi xác nhận lên Google Sheets...", "info");
                google.script.run
                    .withSuccessHandler(function(res) {
                        if (res.error) {
                            showToast("Lỗi: " + res.error, "error");
                        } else {
                            showToast("Xác nhận đóng phí thuê web và gia hạn thành công!", "success");
                            refreshAdminDashboard();
                        }
                    })
                    .withFailureHandler(function(err) {
                        showToast("Lỗi kết nối: " + err.toString(), "error");
                    })
                    .adminXacNhanDongTienTutor(phone);
            });
        }

        // Hàm chuyển đổi trạng thái Vô hiệu hóa / Kích hoạt lại gia sư
         function toggleTutorDeactivateStatus() {
             var phone = document.getElementById('adminTutorOldPhone').value;
             var name = document.getElementById('adminTutorName').value;
             var tutor = adminDataGlobal.tutors.find(t => t.phone === phone);
             if (!tutor) return;
             
             var isCurrentlyDeactivated = (tutor.status === "Vô hiệu hóa");
             var newStatus = isCurrentlyDeactivated ? "" : "Vô hiệu hóa";
             var actionText = isCurrentlyDeactivated ? "kích hoạt lại" : "vô hiệu hóa";
             
             showCustomConfirm("Xác nhận " + actionText + " tài khoản gia sư " + name + "?", function() {
                 showToast("Đang cập nhật trạng thái gia sư...", "info");
                 google.script.run
                     .withSuccessHandler(function(res) {
                         if (res.error) {
                             showToast("Lỗi: " + res.error, "error");
                         } else {
                             showToast((isCurrentlyDeactivated ? "Kích hoạt lại" : "Vô hiệu hóa") + " tài khoản gia sư thành công!", "success");
                             closeAdminEditTutorModal();
                             refreshAdminDashboard();
                         }
                     })
                     .withFailureHandler(function(err) {
                         showToast("Lỗi kết nối: " + err.toString(), "error");
                     })
                     .adminSetTutorStatus(phone, newStatus);
             });
         }

        function saveAdminMarquee() {
            var text = document.getElementById('adminMarqueeInput').value.trim();
            var btn = document.querySelector('button[onclick="saveAdminMarquee()"]');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';
            }
            
            google.script.run
                .withSuccessHandler(function(res) {
                    if (btn) {
                        btn.disabled = false;
                        btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Lưu thông báo';
                    }
                    if (res.error) {
                        showToast("Lỗi: " + res.error, "error");
                    } else {
                        showToast("Lưu dòng chạy chữ thông báo thành công!", "success");
                        // Cập nhật lại cache cục bộ
                        if (adminDataGlobal) {
                            adminDataGlobal.marqueeAnnouncement = text;
                        }
                    }
                })
                .withFailureHandler(function(err) {
                    if (btn) {
                        btn.disabled = false;
                        btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Lưu thông báo';
                    }
                    showToast("Lỗi hệ thống: " + err.toString(), "error");
                })
                .adminLuuMarquee(text);
        }
