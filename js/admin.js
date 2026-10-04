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
            
            var safeMessage = escapeHtml(message);
            if (type === 'success') {
                toast.style.background = '#00CC66';
                toast.style.borderColor = '#00FF88';
                toast.innerHTML = '<i class="fa-solid fa-circle-check"></i> ' + safeMessage;
            } else if (type === 'error') {
                toast.style.background = '#FF4D4D';
                toast.style.borderColor = '#FF8080';
                toast.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> ' + safeMessage;
            } else {
                toast.style.background = '#8E4DFF';
                toast.style.borderColor = '#A870FF';
                toast.innerHTML = '<i class="fa-solid fa-circle-info"></i> ' + safeMessage;
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

        function getInitials(name) {
            if (!name) return "?";
            var parts = name.trim().split(/\s+/);
            if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }

        function copyPhoneToClipboard(text) {
            if (!text) return;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(function() {
                    showToast("Đã sao chép: " + text, "success");
                }).catch(function() {
                    fallbackCopyText(text);
                });
            } else {
                fallbackCopyText(text);
            }
        }
        function fallbackCopyText(text) {
            var el = document.createElement('textarea');
            el.value = text;
            el.style.position = 'fixed';
            el.style.left = '-9999px';
            document.body.appendChild(el);
            el.select();
            try {
                document.execCommand('copy');
                showToast("Đã sao chép: " + text, "success");
            } catch(e) {
                showToast("Không thể sao chép tự động: " + text, "error");
            }
            document.body.removeChild(el);
        }
        window.copyPhoneToClipboard = copyPhoneToClipboard;

        function populateStudentTutorFilterDropdown() {
            var filterSelect = document.getElementById('adminStudentTutorFilter');
            if (!filterSelect) return;
            var currentVal = filterSelect.value || "all";
            filterSelect.innerHTML = '<option value="all">Tất cả gia sư</option>';
            if (adminDataGlobal && adminDataGlobal.tutors) {
                adminDataGlobal.tutors.forEach(function(t) {
                    var opt = document.createElement('option');
                    opt.value = t.phone;
                    opt.innerText = t.name + " (" + t.phone + ")";
                    if (t.phone === currentVal) opt.selected = true;
                    filterSelect.appendChild(opt);
                });
            }
        }

        function onAdminTutorFilterChange() {
            renderAdminTutorsList();
        }
        window.onAdminTutorFilterChange = onAdminTutorFilterChange;

        function onAdminStudentFilterChange() {
            renderAdminStudentsList();
        }
        window.onAdminStudentFilterChange = onAdminStudentFilterChange;

        function renderAdminView(data) {
            if (!data) data = {};
            if (!data.tutors) data.tutors = [];
            if (!data.students) data.students = [];
            if (!data.incomeReports) data.incomeReports = {};
            adminDataGlobal = data;
            
            // Khởi tạo số điện thoại Admin hiện tại nếu chưa có
            if (!currentAdminPhone) {
                currentAdminPhone = sessionStorage.getItem('userPhone') || (document.getElementById('maHocSinh') ? document.getElementById('maHocSinh').value : "") || "302001";
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
            var adminNameEl = document.getElementById('adminNameDisplay');
            if (adminNameEl) {
                var adminDisplayName = (data.adminInfo && data.adminInfo.name) ? data.adminInfo.name : ((data.tutors && data.tutors.find(t => normalizePhone(t.phone) === normalizePhone(currentAdminPhone)))?.name || "Quản trị viên");
                adminNameEl.innerText = "Xin chào, Admin " + adminDisplayName;
            }
            
            // Cập nhật badge số lượng trên các tab
            var totalTutors = (data.tutors || []).length;
            var totalStudents = (data.students || []).length;
            var tBadge = document.getElementById('tutorTabCountBadge');
            if (tBadge) tBadge.innerText = totalTutors;
            var sBadge = document.getElementById('studentTabCountBadge');
            if (sBadge) sBadge.innerText = totalStudents;
            
            // Nạp dropdown lọc gia sư cho học sinh
            populateStudentTutorFilterDropdown();
            
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
                        var pct = tReport.expected > 0 ? Math.min(100, Math.round((tReport.paid / tReport.expected) * 100)) : 0;
                        var rate = pct + "%";
                        var barColor = pct >= 80 ? '#10B981' : (pct >= 50 ? '#8E4DFF' : '#F59E0B');
                        var initials = getInitials(tReport.name);
                        
                        // Desktop
                        var tr = document.createElement('tr');
                        tr.innerHTML = "<td>" +
                                         "<div class='adm-user-cell'>" +
                                           "<span class='adm-avatar-circle' style='width:32px; height:32px; font-size:12px;'>" + escapeHtml(initials) + "</span>" +
                                           "<b style='color:#FFF; font-size:13.5px;'>" + escapeHtml(tReport.name) + "</b>" +
                                         "</div>" +
                                       "</td>" +
                                       "<td style='color:#C084FC; font-weight:700;'>" + tReport.expected.toLocaleString('vi-VN') + "đ</td>" +
                                       "<td style='color:#34D399; font-weight:700;'>" + tReport.paid.toLocaleString('vi-VN') + "đ</td>" +
                                       "<td style='color:#FBBF24; font-weight:700;'>" + tReport.unpaid.toLocaleString('vi-VN') + "đ</td>" +
                                       "<td>" +
                                         "<div style='display:flex; flex-direction:column; gap:4px; min-width:90px;'>" +
                                           "<div style='display:flex; justify-content:space-between; font-size:11px;'><span style='color:#A6ADCE;'>Thu hồi</span><b style='color:#FFF;'>" + rate + "</b></div>" +
                                           "<div class='adm-progress-bar'><div class='adm-progress-fill' style='width:" + pct + "%; background:" + barColor + ";'></div></div>" +
                                         "</div>" +
                                       "</td>";
                        breakdownBody.appendChild(tr);
                        
                        // Mobile
                        mobileHtml += "<div class='accordion-item'>";
                        mobileHtml += "  <div class='accordion-header' onclick='toggleAdminTutorBreakdownAccordion(" + idx + ")'>";
                        mobileHtml += "    <div class='accordion-header-title'>";
                        mobileHtml += "      <span class='adm-avatar-circle' style='width:26px; height:26px; font-size:10px;'>" + escapeHtml(initials) + "</span>";
                        mobileHtml += "      <span>" + escapeHtml(tReport.name) + "</span>";
                        mobileHtml += "      <span class='badge' style='background:rgba(142,77,255,0.15); color:#a78bfa; margin-bottom: 0; padding: 3px 8px; font-size: 10px;'>" + rate + "</span>";
                        mobileHtml += "    </div>";
                        mobileHtml += "    <div class='accordion-header-status'><i class='fa-solid fa-chevron-down' id='adm-tutor-bd-chevron-" + idx + "'></i></div>";
                        mobileHtml += "  </div>";
                        mobileHtml += "  <div class='accordion-body' id='adm-tutor-bd-body-" + idx + "' style='display: none;'>";
                        mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Lương dự kiến</span><span class='accordion-body-val' style='color:#C084FC; font-weight:bold;'>" + tReport.expected.toLocaleString('vi-VN') + "đ</span></div>";
                        mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Lương thực tế</span><span class='accordion-body-val' style='color:#34D399; font-weight:bold;'>" + tReport.paid.toLocaleString('vi-VN') + "đ</span></div>";
                        mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Còn nợ</span><span class='accordion-body-val' style='color:#FBBF24; font-weight:bold;'>" + tReport.unpaid.toLocaleString('vi-VN') + "đ</span></div>";
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
                    tr.innerHTML = "<td><b style='color:#FFF;'>" + escapeHtml(m) + "</b></td>" +
                                   "<td style='color:#C084FC; font-weight:700;'>" + r.expected.toLocaleString('vi-VN') + "đ</td>" +
                                   "<td style='color:#34D399; font-weight:700;'>" + r.paid.toLocaleString('vi-VN') + "đ</td>" +
                                   "<td style='color:#FBBF24; font-weight:700;'>" + r.unpaid.toLocaleString('vi-VN') + "đ</td>";
                    tableBody.appendChild(tr);
                    
                    // Mobile
                    reportMobileHtml += "<div class='accordion-item'>";
                    reportMobileHtml += "  <div class='accordion-header' onclick='toggleAdminReportAccordion(" + idx + ")'>";
                    reportMobileHtml += "    <div class='accordion-header-title'>";
                    reportMobileHtml += "      <span>Tháng " + escapeHtml(m) + "</span>";
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
            if (typeof Chart === 'undefined') {
                console.warn("Chart.js chưa được tải, bỏ qua vẽ biểu đồ");
                return;
            }
            var canvas = document.getElementById('adminRevenueChartCanvas');
            if (!canvas) return;

            if (adminRevenueChartInstance) {
                try {
                    adminRevenueChartInstance.destroy();
                } catch(e) {}
                adminRevenueChartInstance = null;
            }

            var sortedMonths = Object.keys(reports || {}).sort(function(a, b) {
                var pa = parseMonthYear(a);
                var pb = parseMonthYear(b);
                if (pa.year !== pb.year) return pa.year - pb.year;
                return pa.month - pb.month;
            });

            var labels = sortedMonths.map(m => m.replace("Tháng ", "T"));
            var expectedData = sortedMonths.map(m => (reports[m] ? reports[m].expected : 0));
            var paidData = sortedMonths.map(m => (reports[m] ? reports[m].paid : 0));

            try {
                var ctx = canvas.getContext('2d');
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
            } catch(chartErr) {
                console.warn("Lỗi khi vẽ biểu đồ doanh thu:", chartErr);
            }
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
                tbody.innerHTML = "<tr><td colspan='10' style='text-align:center; color:#A6ADCE; padding:30px;'>Không có gia sư nào trên hệ thống.</td></tr>";
                if (mobileContainer) {
                    mobileContainer.innerHTML = "<div style='text-align:center; color:#A6ADCE; padding: 25px; font-size: 13px;'><i class='fa-solid fa-circle-info'></i> Không có gia sư nào trên hệ thống.</div>";
                }
                if (alertContainer) {
                    alertContainer.style.display = "none";
                    alertContainer.innerHTML = "";
                }
                return;
            }
            
            // Tính toán danh sách cảnh báo đến hạn phí web cho toàn bộ gia sư
            adminDataGlobal.tutors.forEach(t => {
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
            });

            // Vẽ hộp cảnh báo đỏ lên đầu trang Admin
            if (alertContainer) {
                if (dueAlerts.length > 0) {
                    var alertHtml = "";
                    dueAlerts.forEach(a => {
                        alertHtml += `
                            <div class="adm-alert-card">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <i class="fa-solid fa-triangle-exclamation" style="font-size: 18px; color: #EF4444;"></i>
                                    <span style="color:#FECACA; font-size:13.5px;">Gia sư <b style="color:#FFF;">${escapeHtml(a.name)}</b> (${a.students} HS) đến hạn đóng tiền thuê Web: <b style="color: #FFF; background: #DC2626; padding: 2px 8px; border-radius: 6px;">${a.fee.toLocaleString('vi-VN')}đ</b> (Hạn: ${escapeHtml(a.nextBillingDate)})</span>
                                </div>
                                <button onclick="confirmQuickPaid('${jsStr(a.phone)}', '${jsStr(a.name)}')" class="adm-btn-action btn-pay" style="padding: 7px 16px; font-size: 13px; border-radius: 10px;"><i class="fa-solid fa-check"></i> Xác nhận đã thu</button>
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

            // Lọc dữ liệu theo Search và Trạng thái
            var searchInput = document.getElementById('adminTutorSearchInput');
            var searchVal = searchInput ? searchInput.value.trim().toLowerCase() : "";
            var statusFilterEl = document.getElementById('adminTutorStatusFilter');
            var statusFilter = statusFilterEl ? statusFilterEl.value : "all";

            var filteredTutors = adminDataGlobal.tutors.filter(t => {
                var isCurrentlyDeactivated = (t.status === "Vô hiệu hóa");
                var isDue = isBillingDue(t.nextBillingDate) && !isCurrentlyDeactivated;

                if (statusFilter === "active" && (isCurrentlyDeactivated || isDue)) return false;
                if (statusFilter === "due" && !isDue) return false;
                if (statusFilter === "deactivated" && !isCurrentlyDeactivated) return false;

                if (searchVal) {
                    var matchName = (t.name || "").toLowerCase().includes(searchVal);
                    var matchPhone = (t.phone || "").toLowerCase().includes(searchVal);
                    var matchPin = (t.pin || "").toLowerCase().includes(searchVal);
                    if (!matchName && !matchPhone && !matchPin) return false;
                }
                return true;
            });

            if (filteredTutors.length === 0) {
                tbody.innerHTML = "<tr><td colspan='10' style='text-align:center; color:#A6ADCE; padding:30px;'><i class='fa-solid fa-magnifying-glass'></i> Không tìm thấy gia sư nào phù hợp với bộ lọc.</td></tr>";
                if (mobileContainer) {
                    mobileContainer.innerHTML = "<div style='text-align:center; color:#A6ADCE; padding: 25px; font-size: 13px;'><i class='fa-solid fa-magnifying-glass'></i> Không tìm thấy gia sư nào phù hợp với bộ lọc.</div>";
                }
                return;
            }

            var mobileHtml = "";
            filteredTutors.forEach((t, idx) => {
                 var sCount = getActiveStudentsForTutor(t.phone);
                 var webFee = Math.ceil(sCount / 2) * 30000;
                 var isCurrentlyDeactivated = (t.status === "Vô hiệu hóa");
                 var isDue = isBillingDue(t.nextBillingDate) && !isCurrentlyDeactivated;
                 var initials = getInitials(t.name);
                 
                 var statusPill = "";
                 if (isCurrentlyDeactivated) {
                     statusPill = "<span class='adm-status-pill status-locked'><i class='fa-solid fa-ban'></i> Đã khóa</span>";
                 } else if (isDue) {
                     statusPill = "<span class='adm-status-pill status-due'><i class='fa-solid fa-triangle-exclamation'></i> Đến hạn</span>";
                 } else {
                     statusPill = "<span class='adm-status-pill status-active'><i class='fa-solid fa-circle-check'></i> Hoạt động</span>";
                 }
                 
                 var quickPayBtn = "";
                 if (isDue && !isCurrentlyDeactivated) {
                     quickPayBtn = "<button class='adm-btn-action btn-pay' onclick='confirmQuickPaid(\"" + jsStr(t.phone) + "\", \"" + jsStr(t.name) + "\")' title='Xác nhận đã thu'><i class='fa-solid fa-check'></i> Thu</button>";
                 }
                 
                 var lockBtn = isCurrentlyDeactivated ?
                     "<button class='adm-btn-action btn-unlock' onclick='quickToggleTutorStatus(\"" + jsStr(t.phone) + "\", \"" + jsStr(t.name) + "\", true)' title='Kích hoạt lại tài khoản'><i class='fa-solid fa-unlock'></i> Mở</button>" :
                     "<button class='adm-btn-action btn-lock' onclick='quickToggleTutorStatus(\"" + jsStr(t.phone) + "\", \"" + jsStr(t.name) + "\", false)' title='Vô hiệu hóa tài khoản'><i class='fa-solid fa-lock'></i> Khóa</button>";

                 var lastActiveDisplay = t.lastActive ? escapeHtml(t.lastActive) : "<i style='color:#6c757d;'>Chưa vào</i>";
                 
                 // Desktop row
                 var tr = document.createElement('tr');
                 if (isCurrentlyDeactivated) {
                     tr.style.opacity = "0.75";
                 }
                 
                 tr.innerHTML = "<td>" +
                                  "<div class='adm-user-cell'>" +
                                    "<span class='adm-avatar-circle'>" + escapeHtml(initials) + "</span>" +
                                    "<div>" +
                                      "<div style='font-weight:700; color:#FFFFFF; font-size:13.5px;'>" + escapeHtml(t.name) + "</div>" +
                                      "<div style='font-size:11px; color:#94A3B8;'>" + sCount + " học sinh</div>" +
                                    "</div>" +
                                  "</div>" +
                                "</td>" +
                                "<td>" +
                                  "<div class='adm-phone-tag'>" +
                                    "<span>" + escapeHtml(t.phone) + "</span>" +
                                    "<button type='button' class='adm-copy-btn' onclick='copyPhoneToClipboard(\"" + jsStr(t.phone) + "\")' title='Sao chép SĐT'><i class='fa-regular fa-copy'></i></button>" +
                                  "</div>" +
                                "</td>" +
                                "<td><span class='adm-pin-badge'>" + escapeHtml(t.pin) + "</span></td>" +
                                "<td><span style='font-size:12px; color:#A6ADCE;'>" + escapeHtml(t.createdDate || "-") + "</span></td>" +
                                "<td>" +
                                  "<span class='adm-due-badge" + (isDue ? " is-due" : "") + "'>" +
                                    "<i class='" + (isDue ? "fa-solid fa-triangle-exclamation" : "fa-regular fa-calendar-check") + "'></i> " +
                                    escapeHtml(t.nextBillingDate || "-") +
                                  "</span>" +
                                "</td>" +
                                "<td style='text-align:center;'><span style='font-weight:700; color:#FFFFFF; background:rgba(255,255,255,0.06); padding:4px 10px; border-radius:8px;'>" + sCount + "</span></td>" +
                                "<td><b style='color:#C084FC; font-size:13.5px;'>" + webFee.toLocaleString('vi-VN') + "đ</b></td>" +
                                "<td style='font-size:11.5px; color:#94A3B8;'>" + lastActiveDisplay + "</td>" +
                                "<td style='text-align:center;'>" + statusPill + "</td>" +
                                "<td style='text-align:center;'>" +
                                  "<div style='display:inline-flex; align-items:center; gap:6px;'>" +
                                    "<button class='adm-btn-action btn-edit' onclick='openAdminEditTutorModal(\"" + jsStr(t.phone) + "\")' title='Sửa thông tin'><i class='fa-solid fa-pen-to-square'></i> Sửa</button>" +
                                    quickPayBtn +
                                    lockBtn +
                                  "</div>" +
                                "</td>";
                 tbody.appendChild(tr);
                 
                 // Mobile accordion view
                 var mobilePayBtn = "";
                 if (isDue && !isCurrentlyDeactivated) {
                     mobilePayBtn = "<button class='adm-btn-action btn-pay' onclick='confirmQuickPaid(\"" + jsStr(t.phone) + "\", \"" + jsStr(t.name) + "\")' style='font-size:12px; padding:5px 12px;'><i class='fa-solid fa-check'></i> Xác nhận thu</button>";
                 }
                 var mobileLockBtn = isCurrentlyDeactivated ?
                     "<button class='adm-btn-action btn-unlock' onclick='quickToggleTutorStatus(\"" + jsStr(t.phone) + "\", \"" + jsStr(t.name) + "\", true)' style='font-size:12px; padding:5px 12px;'><i class='fa-solid fa-unlock'></i> Mở</button>" :
                     "<button class='adm-btn-action btn-lock' onclick='quickToggleTutorStatus(\"" + jsStr(t.phone) + "\", \"" + jsStr(t.name) + "\", false)' style='font-size:12px; padding:5px 12px;'><i class='fa-solid fa-lock'></i> Khóa</button>";
                 var mobileEditBtn = "<button class='adm-btn-action btn-edit' onclick='openAdminEditTutorModal(\"" + jsStr(t.phone) + "\")' style='font-size:12px; padding:5px 12px;'><i class='fa-solid fa-pen-to-square'></i> Sửa</button>";
                 
                 mobileHtml += "<div class='accordion-item' style='" + (isCurrentlyDeactivated ? "border: 1px solid rgba(245, 158, 11, 0.25); opacity: 0.85;" : (isDue ? "border: 1px solid rgba(239, 68, 68, 0.35);" : "")) + "'>";
                 mobileHtml += "  <div class='accordion-header' onclick='toggleAdminTutorAccordion(" + idx + ")'>";
                 mobileHtml += "    <div class='accordion-header-title'>";
                 mobileHtml += "      <span class='adm-avatar-circle' style='width:28px; height:28px; font-size:11px;'>" + escapeHtml(initials) + "</span>";
                 mobileHtml += "      <span style='font-weight:700; color:#FFF;'>" + escapeHtml(t.name) + "</span>";
                 mobileHtml += "      " + statusPill;
                 mobileHtml += "    </div>";
                 mobileHtml += "    <div class='accordion-header-status'><i class='fa-solid fa-chevron-down' id='adm-tutor-chevron-" + idx + "'></i></div>";
                 mobileHtml += "  </div>";
                 mobileHtml += "  <div class='accordion-body' id='adm-tutor-body-" + idx + "' style='display: none;'>";
                 mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Số điện thoại</span><span class='accordion-body-val'><div class='adm-phone-tag'><span>" + escapeHtml(t.phone) + "</span><button type='button' class='adm-copy-btn' onclick='copyPhoneToClipboard(\"" + jsStr(t.phone) + "\")'><i class='fa-regular fa-copy'></i></button></div></span></div>";
                 mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Mã PIN</span><span class='accordion-body-val'><span class='adm-pin-badge'>" + escapeHtml(t.pin) + "</span></span></div>";
                 mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Ngày đăng ký</span><span class='accordion-body-val'>" + escapeHtml(t.createdDate || "-") + "</span></div>";
                 mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Ngày hạn kế</span><span class='accordion-body-val' style='" + (isDue ? "color:#F87171; font-weight:bold;" : "") + "'>" + escapeHtml(t.nextBillingDate || "-") + "</span></div>";
                 mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Số HS hoạt động</span><span class='accordion-body-val'><b>" + sCount + "</b></span></div>";
                 mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Phí thuê Web</span><span class='accordion-body-val'><b style='color:#C084FC;'>" + webFee.toLocaleString('vi-VN') + "đ</b></span></div>";
                 mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Hoạt động cuối</span><span class='accordion-body-val'>" + lastActiveDisplay + "</span></div>";
                 mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Thao tác</span><span class='accordion-body-val' style='display:flex; gap:6px; flex-wrap:wrap;'>" + mobilePayBtn + mobileLockBtn + mobileEditBtn + "</span></div>";
                 mobileHtml += "  </div>";
                 mobileHtml += "</div>";
            });
            
            if (mobileContainer) {
                mobileContainer.innerHTML = mobileHtml;
            }
        }

        // 3. Students Management Tab
        function renderAdminStudentsList() {
            var tbody = document.querySelector('#adminStudentsTable tbody');
            var mobileContainer = document.getElementById('adminStudentsMobile');
            
            if (!tbody) return;
            tbody.innerHTML = "";
            
            if (!adminDataGlobal.students || adminDataGlobal.students.length === 0) {
                tbody.innerHTML = "<tr><td colspan='7' style='text-align:center; color:#A6ADCE; padding:30px;'>Không có học sinh nào trên hệ thống.</td></tr>";
                if (mobileContainer) {
                    mobileContainer.innerHTML = "<div style='text-align:center; color:#A6ADCE; padding: 25px; font-size: 13px;'><i class='fa-solid fa-circle-info'></i> Không có học sinh nào trên hệ thống.</div>";
                }
                return;
            }

            // Lọc dữ liệu theo Search và Gia sư phụ trách
            var searchInput = document.getElementById('adminStudentSearchInput');
            var searchVal = searchInput ? searchInput.value.trim().toLowerCase() : "";
            var tutorFilterEl = document.getElementById('adminStudentTutorFilter');
            var tutorFilter = tutorFilterEl ? tutorFilterEl.value : "all";

            var filteredStudents = adminDataGlobal.students.filter(st => {
                if (tutorFilter !== "all" && normalizePhone(st.tutorPhone) !== normalizePhone(tutorFilter)) {
                    return false;
                }
                if (searchVal) {
                    var matchName = (st.name || "").toLowerCase().includes(searchVal);
                    var matchParent = (st.parentName || "").toLowerCase().includes(searchVal);
                    var matchPhone = (st.phone || "").toLowerCase().includes(searchVal);
                    if (!matchName && !matchParent && !matchPhone) return false;
                }
                return true;
            });

            if (filteredStudents.length === 0) {
                tbody.innerHTML = "<tr><td colspan='7' style='text-align:center; color:#A6ADCE; padding:30px;'><i class='fa-solid fa-magnifying-glass'></i> Không tìm thấy học sinh nào phù hợp với bộ lọc.</td></tr>";
                if (mobileContainer) {
                    mobileContainer.innerHTML = "<div style='text-align:center; color:#A6ADCE; padding: 25px; font-size: 13px;'><i class='fa-solid fa-magnifying-glass'></i> Không tìm thấy học sinh nào phù hợp với bộ lọc.</div>";
                }
                return;
            }
            
            var mobileHtml = "";
            filteredStudents.forEach((st, idx) => {
                var isDeleted = !!st.deletedDate && st.deletedDate.trim() !== "";
                var statusPill = isDeleted ?
                    "<span class='adm-status-pill status-locked'><i class='fa-solid fa-trash-can'></i> Đã xóa (" + escapeHtml(st.deletedDate.split(" ")[0]) + ")</span>" :
                    "<span class='adm-status-pill status-active'><i class='fa-solid fa-circle-check'></i> Hoạt động</span>";
                
                var tObj = adminDataGlobal.tutors ? adminDataGlobal.tutors.find(t => normalizePhone(t.phone) === normalizePhone(st.tutorPhone)) : null;
                var tName = escapeHtml(tObj ? tObj.name : (st.tutorPhone || "Chưa gán"));
                var stTuitionNum = Number(st.tuition) || 0;
                var tuitionDisplay = escapeHtml(st.tuition != null && st.tuition.toLocaleString ? st.tuition.toLocaleString('vi-VN') : st.tuition);
                var editStudentArgs = "\"" + jsStr(st.phone) + "\", \"" + jsStr(st.parentName) + "\", \"" + jsStr(st.name) + "\", " + stTuitionNum + ", \"" + jsStr(st.tutorPhone) + "\"";
                var initials = getInitials(st.name);
                
                // Desktop
                var tr = document.createElement('tr');
                if (isDeleted) {
                    tr.style.opacity = "0.7";
                }
                tr.innerHTML = "<td>" +
                                 "<div class='adm-user-cell'>" +
                                   "<span class='adm-avatar-circle' style='background:linear-gradient(135deg, #10B981, #059669);'>" + escapeHtml(initials) + "</span>" +
                                   "<div style='font-weight:700; color:#FFFFFF; font-size:13.5px;'>" + escapeHtml(st.name) + "</div>" +
                                 "</div>" +
                               "</td>" +
                               "<td><span style='color:#CBD5E1;'>" + escapeHtml(st.parentName || "-") + "</span></td>" +
                               "<td>" +
                                 "<div class='adm-phone-tag'>" +
                                   "<span>" + escapeHtml(st.phone) + "</span>" +
                                   "<button type='button' class='adm-copy-btn' onclick='copyPhoneToClipboard(\"" + jsStr(st.phone) + "\")' title='Sao chép SĐT'><i class='fa-regular fa-copy'></i></button>" +
                                 "</div>" +
                               "</td>" +
                               "<td><b style='color:#FFD23F; font-size:13px;'>" + tuitionDisplay + "đ</b></td>" +
                               "<td><span class='adm-tag-tutor'><i class='fa-solid fa-chalkboard-user'></i> " + tName + "</span></td>" +
                               "<td>" + statusPill + "</td>" +
                               "<td style='text-align:center;'>" +
                                 "<button class='adm-btn-action btn-edit' onclick='openAdminEditStudentModal(" + editStudentArgs + ")' title='Sửa học sinh'><i class='fa-solid fa-pen-to-square'></i> Sửa</button>" +
                               "</td>";
                tbody.appendChild(tr);
                
                // Mobile
                var editBtn = "<button class='adm-btn-action btn-edit' onclick='openAdminEditStudentModal(" + editStudentArgs + ")' style='font-size:12px; padding:5px 12px;'><i class='fa-solid fa-pen-to-square'></i> Chỉnh sửa</button>";
                
                mobileHtml += "<div class='accordion-item' style='" + (isDeleted ? "opacity: 0.75; border-color: rgba(245,158,11,0.2);" : "") + "'>";
                mobileHtml += "  <div class='accordion-header' onclick='toggleAdminStudentAccordion(" + idx + ")'>";
                mobileHtml += "    <div class='accordion-header-title'>";
                mobileHtml += "      <span class='adm-avatar-circle' style='width:28px; height:28px; font-size:11px; background:linear-gradient(135deg, #10B981, #059669);'>" + escapeHtml(initials) + "</span>";
                mobileHtml += "      <span style='font-weight:700; color:#FFF;'>" + escapeHtml(st.name) + "</span>";
                mobileHtml += "      " + statusPill;
                mobileHtml += "    </div>";
                mobileHtml += "    <div class='accordion-header-status'><i class='fa-solid fa-chevron-down' id='adm-student-chevron-" + idx + "'></i></div>";
                mobileHtml += "  </div>";
                mobileHtml += "  <div class='accordion-body' id='adm-student-body-" + idx + "' style='display: none;'>";
                mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Tên phụ huynh</span><span class='accordion-body-val'>" + escapeHtml(st.parentName || "-") + "</span></div>";
                mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>SĐT Phụ Huynh</span><span class='accordion-body-val'><div class='adm-phone-tag'><span>" + escapeHtml(st.phone) + "</span><button type='button' class='adm-copy-btn' onclick='copyPhoneToClipboard(\"" + jsStr(st.phone) + "\")'><i class='fa-regular fa-copy'></i></button></div></span></div>";
                mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Học phí/buổi</span><span class='accordion-body-val' style='font-weight:bold; color:#FFD23F;'>" + tuitionDisplay + "đ</span></div>";
                mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Gia sư</span><span class='accordion-body-val'><span class='adm-tag-tutor'><i class='fa-solid fa-chalkboard-user'></i> " + tName + "</span></span></div>";
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
            var adminInfo = (adminDataGlobal && adminDataGlobal.adminInfo) ? adminDataGlobal.adminInfo : {};
            document.getElementById('adminAccName').value = adminInfo.name || "Quản trị viên";
            document.getElementById('adminAccPhone').value = adminInfo.phone || currentAdminPhone || "";
            document.getElementById('adminAccPin').value = adminInfo.pin || sessionStorage.getItem('userPin') || "";
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
                        sessionStorage.setItem('userPhone', phone);
                        sessionStorage.setItem('userPin', pin);
                        if (document.getElementById('maPin')) document.getElementById('maPin').value = pin;
                        if (adminDataGlobal && adminDataGlobal.adminInfo) {
                            adminDataGlobal.adminInfo.name = name;
                            adminDataGlobal.adminInfo.phone = phone;
                            adminDataGlobal.adminInfo.pin = pin;
                        }
                        var adminNameEl = document.getElementById('adminNameDisplay');
                        if (adminNameEl) adminNameEl.innerText = "Xin chào, " + name;
                        closeAdminAccountModal();
                        refreshAdminDashboard();
                    }
                })
                .withFailureHandler(function(err) {
                    btn.disabled = false;
                    btn.innerText = "Cập nhật";
                    showToast("Lỗi kết nối: " + err.toString(), "error");
                })
                .adminCapNhatTaiKhoanAdmin(currentAdminPhone, name, phone, pin);
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
            var tutor = (adminDataGlobal && adminDataGlobal.tutors) ? adminDataGlobal.tutors.find(t => t.phone === phone || normalizePhone(t.phone) === normalizePhone(phone)) : null;
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
                .adminLuuGiaSu(oldPhone, name, phone, pin, qrUrl, createdDate, nextBillingDate);
        }

        // Xóa/Khôi phục & Thùng rác Gia sư JS Controllers
        function confirmDeleteAdminTutor() {
            pinVerifyAction = "deleteTutor";
            var desc = document.getElementById('confirmPinModalText');
            if (desc) desc.innerText = "Vui lòng nhập mã PIN Admin để xác nhận đưa gia sư vào thùng rác.";
            document.getElementById('confirmTutorPinInput').value = "";
            document.getElementById('pinConfirmModal').style.display = "flex";
        }

        function closePinConfirmModal() {
            document.getElementById('pinConfirmModal').style.display = "none";
        }

        function submitPinVerifyForDelete() {
            var inputPin = document.getElementById('confirmTutorPinInput').value.trim();
            var adminPin = (document.getElementById('maPin') ? document.getElementById('maPin').value.trim() : "") || sessionStorage.getItem('userPin') || (adminDataGlobal && adminDataGlobal.adminInfo ? adminDataGlobal.adminInfo.pin : "") || "";
            var currentAdminTutor = (adminDataGlobal && adminDataGlobal.tutors) ? adminDataGlobal.tutors.find(t => t.phone === currentAdminPhone) : null;
            var validPin = adminPin || (currentAdminTutor ? currentAdminTutor.pin : "");
            
            if (inputPin && (inputPin === validPin || inputPin === adminPin || (currentAdminTutor && inputPin === currentAdminTutor.pin))) {
                closePinConfirmModal();
                if (pinVerifyAction === "deleteTutor") {
                    closeAdminEditTutorModal();
                    deleteTutorBackend();
                } else if (pinVerifyAction === "deleteStudent") {
                    closeAdminEditStudentModal();
                    deleteStudentBackend();
                }
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
                info.innerHTML = "<p style='margin:0; color:#FFF; font-weight:bold;'>" + escapeHtml(t.name) + "</p>" +
                                 "<p style='margin:3px 0 0; color:#A6ADCE; font-size:12px;'>SĐT: " + escapeHtml(t.phone) + " | Đã xóa: " + escapeHtml(t.deletedDate.split(" ")[0]) + "</p>";
                
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
            var btnDel = document.getElementById('btnDeleteAdminStudent');
            if (btnDel) btnDel.style.display = "none";
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
            var btnDel = document.getElementById('btnDeleteAdminStudent');
            if (btnDel) btnDel.style.display = "flex";
            document.getElementById('adminStudentModalTitle').innerHTML = '<i class="fa-solid fa-user-graduate"></i> Sửa Thông Tin Học Sinh';
            document.getElementById('adminStudentOldPhone').value = phone;
            document.getElementById('adminStudentParentName').value = parentName;
            document.getElementById('adminStudentName').value = name;
            document.getElementById('adminStudentPhone').value = phone;
            document.getElementById('adminStudentTuition').value = tuition ? formatNumberWithDots(tuition) : "";
            
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

        
        function confirmDeleteAdminStudent() {
            pinVerifyAction = "deleteStudent";
            var desc = document.getElementById('confirmPinModalText');
            if (desc) desc.innerText = "Vui lòng nhập mã PIN Admin để xác nhận đưa học sinh vào thùng rác.";
            document.getElementById('confirmTutorPinInput').value = "";
            document.getElementById('pinConfirmModal').style.display = "flex";
        }

        function deleteStudentBackend() {
             var phone = document.getElementById('adminStudentOldPhone').value;
             var name = document.getElementById('adminStudentName').value;
             
             showCustomConfirm("Xác nhận đưa học sinh " + name + " vào thùng rác? Học sinh sẽ ẩn khỏi danh sách và sẽ bị xóa vĩnh viễn sau 10 ngày.", function() {
                 google.script.run
                     .withSuccessHandler(function(res) {
                         if (res.error) {
                             showToast("Lỗi: " + res.error, "error");
                         } else {
                             showToast("Đã đưa học sinh vào thùng rác thành công!", "success");
                             refreshAdminDashboard();
                         }
                     })
                     .withFailureHandler(function(err) {
                         showToast("Lỗi kết nối hoặc hệ thống: " + err.toString(), "error");
                     })
                     .adminXoaHocSinhTamThoi(phone);
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
                .adminLuuHocSinh(oldPhone, parentName, studentName, phone, parseFloat(String(tuition).replace(/\D/g, '')) || 0, tutorPhone);
        }

        function refreshAdminDashboard(silent) {
            var refreshBtn = document.getElementById('btnRefreshAdmin');
            if (refreshBtn) {
                refreshBtn.innerHTML = '<i class="fa-solid fa-arrows-rotate fa-spin"></i> Đang tải...';
            }
            if (!silent && typeof showToast === 'function') {
                showToast("Đang đồng bộ dữ liệu mới nhất...", "info");
            }
            
            var phone = sessionStorage.getItem('userPhone') || (document.getElementById('maHocSinh') ? document.getElementById('maHocSinh').value : "") || "";
            var pin = sessionStorage.getItem('userPin') || (document.getElementById('maPin') ? document.getElementById('maPin').value : "") || "";

            google.script.run
                .withSuccessHandler(function(res) {
                    if (refreshBtn) {
                        refreshBtn.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> Làm mới';
                    }
                    if (res && res.error) {
                        if (typeof showToast === 'function') showToast(res.error, "error");
                        if (res.error.includes("Từ chối truy cập")) {
                            var cached = sessionStorage.getItem('dashboardData');
                            if (!cached) {
                                setTimeout(function() { window.location.href = 'tutor-login.html'; }, 1500);
                            }
                        }
                        return;
                    }
                    var data = (res && res.data) ? res.data : res;
                    if (data && (data.tutors || data.students)) {
                        sessionStorage.setItem('dashboardData', JSON.stringify(data));
                        renderAdminView(data);
                        if (!silent && typeof showToast === 'function') {
                            showToast("Đã cập nhật dữ liệu mới nhất!", "success");
                        }
                    }
                })
                .withFailureHandler(function(err) {
                    if (refreshBtn) {
                        refreshBtn.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> Làm mới';
                    }
                    console.warn("Lỗi làm mới dashboard admin:", err);
                    if (!silent && typeof showToast === 'function') {
                        showToast("Lỗi làm mới: " + err.toString(), "error");
                    }
                })
                .getAdminDashboardData(phone, pin);
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
                showToast("Đang cập nhật lên hệ thống...", "info");
                google.script.run
                    .withSuccessHandler(function(res) {
                        if (res.error) {
                            showToast("Lỗi: " + res.error, "error");
                        } else {
                            showToast("Xác nhận đóng phí thuê web và gia hạn thành công!", "success");
                            
                            // Cập nhật ngay trên cache cục bộ để giao diện đổi tức thì
                            if (adminDataGlobal && adminDataGlobal.tutors) {
                                var t = adminDataGlobal.tutors.find(x => x.phone === phone || normalizePhone(x.phone) === normalizePhone(phone));
                                if (t) {
                                    if (res.nextDue) t.nextBillingDate = res.nextDue;
                                    t.status = "Hoạt động";
                                }
                                sessionStorage.setItem('dashboardData', JSON.stringify(adminDataGlobal));
                                renderAdminTutorsList();
                            }
                            
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
             var tutor = (adminDataGlobal && adminDataGlobal.tutors) ? adminDataGlobal.tutors.find(t => t.phone === phone || normalizePhone(t.phone) === normalizePhone(phone)) : null;
             if (!tutor) return;
             
             var isCurrentlyDeactivated = (tutor.status === 'Vô hiệu hóa');
             var newStatus = isCurrentlyDeactivated ? 'Hoạt động' : 'Vô hiệu hóa';
             var actionText = isCurrentlyDeactivated ? 'kích hoạt lại' : 'vô hiệu hóa';
             
             showCustomConfirm('Xác nhận ' + actionText + ' tài khoản gia sư ' + name + '?', function() {
                 showToast('Đang cập nhật trạng thái gia sư...', 'info');
                 google.script.run
                     .withSuccessHandler(function(res) {
                         if (res.error) {
                             showToast('Lỗi: ' + res.error, 'error');
                         } else {
                             showToast((isCurrentlyDeactivated ? 'Kích hoạt lại' : 'Vô hiệu hóa') + ' tài khoản gia sư thành công!', 'success');
                             closeAdminEditTutorModal();
                             refreshAdminDashboard();
                         }
                     })
                     .withFailureHandler(function(err) {
                         showToast('Lỗi kết nối: ' + err.toString(), 'error');
                     })
                     .adminSetTutorStatus(phone, newStatus);
             });
         }

         function quickToggleTutorStatus(phone, name, isCurrentlyDeactivated) {
             var actionText = isCurrentlyDeactivated ? 'kích hoạt lại' : 'vô hiệu hóa';
             var newStatus = isCurrentlyDeactivated ? 'Hoạt động' : 'Vô hiệu hóa';
             
             showCustomConfirm('Xác nhận ' + actionText + ' tài khoản gia sư ' + name + '?', function() {
                 showToast('Đang cập nhật trạng thái gia sư...', 'info');
                 google.script.run
                     .withSuccessHandler(function(res) {
                         if (res.error) {
                             showToast('Lỗi: ' + res.error, 'error');
                         } else {
                             showToast((isCurrentlyDeactivated ? 'Kích hoạt lại' : 'Vô hiệu hóa') + ' tài khoản gia sư thành công!', 'success');
                             refreshAdminDashboard();
                         }
                     })
                     .withFailureHandler(function(err) {
                         showToast('Lỗi kết nối: ' + err.toString(), 'error');
                     })
                     .adminSetTutorStatus(phone, newStatus);
             });
         }

        
        function clearAdminMarquee() {
            showCustomConfirm("Bạn có chắc chắn muốn xóa dòng chữ chạy thông báo này không?", function() {
                var input = document.getElementById('adminMarqueeInput');
                if (input) input.value = "";
                
                showToast("Đang xóa thông báo...", "info");
                google.script.run
                    .withSuccessHandler(function(res) {
                        if (res.error) {
                            showToast("Lỗi: " + res.error, "error");
                        } else {
                            showToast("Đã xóa dòng chạy chữ thông báo thành công!", "success");
                            if (adminDataGlobal) {
                                adminDataGlobal.marqueeAnnouncement = "";
                            }
                        }
                    })
                    .withFailureHandler(function(err) {
                        showToast("Lỗi hệ thống: " + err.toString(), "error");
                    })
                    .adminLuuMarquee("");
            });
        }
        window.clearAdminMarquee = clearAdminMarquee;

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
        window.saveAdminMarquee = saveAdminMarquee;
