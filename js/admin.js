var adminDataGlobal = null;
var currentAdminPhone = "";
var currentAdminTab = "report";
var adminRevenueChartInstance = null;
var pinVerifyAction = "deleteTutor";

// --- Custom in-app notification and confirmation dialogs ---
function showToast(message, type = 'info') {
    var container = document.getElementById('toastContainer');
    if (!container) return;
    
    var toast = document.createElement('div');
    toast.style.padding = '14px 22px';
    toast.style.borderRadius = '14px';
    toast.style.color = '#1E293B';
    toast.style.background = '#FFFFFF';
    toast.style.fontSize = '13.5px';
    toast.style.fontWeight = '600';
    toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.12)';
    toast.style.pointerEvents = 'auto';
    toast.style.animation = 'slideIn 0.3s ease forwards';
    toast.style.fontFamily = 'Plus Jakarta Sans, Inter, sans-serif';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '10px';
    toast.style.borderWidth = '1px';
    toast.style.borderStyle = 'solid';
    toast.style.borderColor = '#E2E8F0';
    
    var safeMessage = escapeHtml(message);
    if (type === 'success') {
        toast.style.borderLeft = '4px solid #10B981';
        toast.innerHTML = '<i class="fa-solid fa-circle-check" style="color:#10B981; font-size:16px;"></i> ' + safeMessage;
    } else if (type === 'error') {
        toast.style.borderLeft = '4px solid #EF4444';
        toast.innerHTML = '<i class="fa-solid fa-circle-xmark" style="color:#EF4444; font-size:16px;"></i> ' + safeMessage;
    } else {
        toast.style.borderLeft = '4px solid #2563EB';
        toast.innerHTML = '<i class="fa-solid fa-circle-info" style="color:#2563EB; font-size:16px;"></i> ' + safeMessage;
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

function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
}

function jsStr(s) {
    return String(s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
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

function parseDateHelper(dateStr) {
    if (typeof ztParseVNDate === 'function') return ztParseVNDate(dateStr);
    if (!dateStr) return null;
    var s = String(dateStr).trim().split(' ')[0];
    if (s.includes('/')) {
        var parts = s.split('/');
        if (parts.length >= 3) {
            var d = parseInt(parts[0], 10);
            var m = parseInt(parts[1], 10) - 1;
            var y = parseInt(parts[2], 10);
            return new Date(y, m, d);
        }
    }
    return new Date(s);
}

// Kiểm tra xem gia sư sắp hết hạn (≤3 ngày) hoặc đã quá hạn
function isBillingDue(dateStr) {
    if (!dateStr) return false;
    var dt = parseDateHelper(dateStr);
    if (!dt || isNaN(dt.getTime())) return false;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    dt.setHours(0, 0, 0, 0);
    var diffDays = Math.ceil((dt - today) / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
}

// Phí thuê web ZunTutor theo biểu phí bậc thang
function calculateTutorWebFee(sCount, customFee) {
    if (customFee !== undefined && customFee !== null && customFee !== "" && Number(customFee) > 0) {
        return { amount: Number(customFee), text: Number(customFee).toLocaleString('vi-VN') + "đ", isCustom: true };
    }
    var n = Number(sCount) || 0;
    if (n <= 2) return { amount: 30000, text: "30.000đ", isCustom: false };
    if (n <= 4) return { amount: 50000, text: "50.000đ", isCustom: false };
    if (n <= 6) return { amount: 75000, text: "75.000đ", isCustom: false };
    return { amount: 0, text: "Liên hệ Admin (≥7 HS)", isCustom: true };
}

// ==========================================
// RENDER ADMIN MAIN VIEW
// ==========================================
function renderAdminView(data) {
    if (!data) data = {};
    if (!data.tutors) data.tutors = [];
    if (!data.payments) data.payments = [];
    if (!data.centerStats) data.centerStats = [];
    adminDataGlobal = data;
    
    if (!currentAdminPhone) {
        currentAdminPhone = sessionStorage.getItem('userPhone') || (document.getElementById('maHocSinh') ? document.getElementById('maHocSinh').value : "") || "302001";
    }
    
    // Ẩn các màn hình khác
    var mainScr = document.getElementById('mainScreen');
    if (mainScr) mainScr.style.display = 'none';
    var tutorDash = document.getElementById('tutorDashboardBox');
    if (tutorDash) tutorDash.style.display = 'none';
    
    // Hiển thị Admin Dashboard
    var admBox = document.getElementById('adminDashboardBox');
    if (admBox) admBox.style.display = 'block';
    
    // Cập nhật tên hiển thị
    var adminNameEl = document.getElementById('adminNameDisplay');
    if (adminNameEl) {
        var adminDisplayName = (data.adminInfo && data.adminInfo.name) ? data.adminInfo.name : "Quản trị viên";
        adminNameEl.innerText = "Xin chào, Admin " + adminDisplayName;
    }
    
    // Cập nhật badges số lượng
    var totalTutors = (data.tutors || []).length;
    var totalCenters = (data.centerStats || []).length;
    var tBadge = document.getElementById('tutorTabCountBadge');
    if (tBadge) tBadge.innerText = totalTutors;
    var cBadge = document.getElementById('centerTabCountBadge');
    if (cBadge) cBadge.innerText = totalCenters;
    
    // Render dữ liệu từng phần
    renderAdminBusinessReport();
    populateTutorCenterFilterDropdown();
    renderAdminTutorsList();
    renderAdminCentersList();
    renderAdminSettings();
}

function switchAdminTab(tabName) {
    currentAdminTab = tabName;
    var tabs = ['report', 'tutors', 'centers', 'settings'];
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

// ==========================================
// 1. TAB TỔNG QUAN KINH DOANH (SAAS)
// ==========================================
function renderAdminBusinessReport() {
    if (!adminDataGlobal) return;
    var tutors = adminDataGlobal.tutors || [];
    var payments = adminDataGlobal.payments || [];
    
    // 1. Tính toán KPIs
    var today = new Date();
    var curMonth = today.getMonth() + 1;
    var curYear = today.getFullYear();
    
    var mrrThisMonth = 0;
    payments.forEach(p => {
        var dt = parseDateHelper(p.paidAt);
        if (dt && (dt.getMonth() + 1 === curMonth) && (dt.getFullYear() === curYear)) {
            mrrThisMonth += Number(p.amount) || 0;
        }
    });
    // Fallback nếu trong tháng chưa có khoản nạp nào, tính tổng toàn bộ các khoản đã nạp gần đây
    if (mrrThisMonth === 0 && payments.length > 0) {
        mrrThisMonth = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    }
    
    var countActive = 0;
    var countTrial = 0;
    var countExpired = 0;
    var dueAlerts = [];
    
    tutors.forEach(t => {
        var isDeact = (t.status === 'Vô hiệu hóa');
        var isDue = isBillingDue(t.nextBillingDate) && !isDeact;
        var s = t.status || 'Hoạt động';
        
        if (isDeact) {
            // không tính vào active/trial
        } else if (s === 'Hết hạn dùng thử' || s === 'Hết hạn sử dụng' || isDue) {
            countExpired++;
            dueAlerts.push(t);
        } else if (t.isTrial || s === 'Dùng thử') {
            countTrial++;
        } else {
            countActive++;
        }
    });
    
    var kpiRevEl = document.getElementById('admKpiRevenue');
    if (kpiRevEl) kpiRevEl.innerText = mrrThisMonth.toLocaleString('vi-VN') + " đ";
    var kpiActEl = document.getElementById('admKpiActive');
    if (kpiActEl) kpiActEl.innerText = countActive;
    var kpiTriEl = document.getElementById('admKpiTrial');
    if (kpiTriEl) kpiTriEl.innerText = countTrial;
    var kpiExpEl = document.getElementById('admKpiExpired');
    if (kpiExpEl) kpiExpEl.innerText = countExpired;
    
    // 2. Cảnh báo gia sư sắp hết hạn (≤3 ngày) hoặc đã hết hạn
    var alertContainer = document.getElementById('adminBillingAlerts');
    if (alertContainer) {
        if (dueAlerts.length > 0) {
            var alertHtml = "";
            dueAlerts.forEach(t => {
                var feeInfo = calculateTutorWebFee(t.studentCount, t.customFee);
                alertHtml += `
                    <div class="adm-alert-card" style="background:#FFF1F2; border:1px solid #FECDD3; border-radius:14px; padding:12px 18px; display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <i class="fa-solid fa-triangle-exclamation" style="font-size:18px; color:#EF4444;"></i>
                            <span style="color:#9F1239; font-size:13.5px;">
                                Gia sư <b style="color:#0F172A;">${escapeHtml(t.name)}</b> (${t.phone}) · Đang dạy <b>${t.studentCount} HS</b> · Hạn: <b style="color:#DC2626;">${escapeHtml(t.nextBillingDate || 'Hết hạn')}</b>
                                · Phí: <b>${escapeHtml(feeInfo.text)}</b>
                            </span>
                        </div>
                        <button onclick="openAdminRenewModal('${jsStr(t.phone)}')" class="adm-btn-action btn-pay" style="padding:7px 16px; font-size:13px; border-radius:10px; background:#2563EB; color:#fff; border:0; cursor:pointer; font-weight:700;">
                            <i class="fa-solid fa-crown"></i> Gia hạn ngay
                        </button>
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
    
    // 3. Biểu đồ doanh thu phí duy trì web
    renderAdminRevenueChart(payments);
    
    // 4. Bảng lịch sử thu phí
    renderAdminPaymentsList(payments);
}

function renderAdminRevenueChart(payments) {
    if (typeof Chart === 'undefined') return;
    var canvas = document.getElementById('adminRevenueChartCanvas');
    if (!canvas) return;
    
    if (adminRevenueChartInstance) {
        try { adminRevenueChartInstance.destroy(); } catch(e) {}
    }
    
    // Gom doanh thu theo tháng (từ payments)
    var monthlyRev = {};
    var today = new Date();
    // Tạo sẵn 6 tháng gần nhất
    for (var i = 5; i >= 0; i--) {
        var d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        var k = "Thg " + (d.getMonth() + 1) + "/" + d.getFullYear();
        monthlyRev[k] = 0;
    }
    
    payments.forEach(p => {
        var dt = parseDateHelper(p.paidAt);
        if (dt) {
            var k = "Thg " + (dt.getMonth() + 1) + "/" + dt.getFullYear();
            if (monthlyRev[k] !== undefined) {
                monthlyRev[k] += Number(p.amount) || 0;
            }
        }
    });
    
    var labels = Object.keys(monthlyRev);
    var dataVals = labels.map(k => monthlyRev[k]);
    
    var ctx = canvas.getContext('2d');
    adminRevenueChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Doanh thu phí duy trì web (VNĐ)',
                data: dataVals,
                backgroundColor: 'rgba(37, 99, 235, 0.85)',
                borderColor: '#2563EB',
                borderWidth: 1.5,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(v) { return v.toLocaleString('vi-VN') + ' đ'; }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(c) { return " Doanh thu: " + c.raw.toLocaleString('vi-VN') + " đ"; }
                    }
                }
            }
        }
    });
}

function renderAdminPaymentsList(payments) {
    var tbody = document.querySelector('#adminPaymentsTable tbody');
    var mobileWrap = document.getElementById('adminPaymentsMobile');
    if (!tbody) return;
    tbody.innerHTML = "";
    
    if (!payments || payments.length === 0) {
        tbody.innerHTML = "<tr><td colspan='8' style='text-align:center; color:#64748B; padding:25px;'>Chưa có lịch sử thanh toán nào.</td></tr>";
        if (mobileWrap) mobileWrap.innerHTML = "<div style='text-align:center; color:#64748B; padding:20px; font-size:13px;'>Chưa có giao dịch gia hạn nào.</div>";
        return;
    }
    
    var mobileHtml = "";
    payments.forEach((p, idx) => {
        var tr = document.createElement('tr');
        var amtStr = (Number(p.amount) || 0).toLocaleString('vi-VN') + " đ";
        tr.innerHTML = `
            <td><span style="font-family:monospace; font-size:11.5px; color:#64748B;">${escapeHtml(p.id)}</span></td>
            <td><b style="color:#0F172A;">${escapeHtml(p.tutorName)}</b></td>
            <td>${escapeHtml(p.tutorPhone)}</td>
            <td><b style="color:#059669;">${amtStr}</b></td>
            <td><span style="background:#EFF6FF; color:#2563EB; font-weight:700; padding:2px 8px; border-radius:6px;">${p.months} tháng</span></td>
            <td><span style="font-size:12px; color:#475569;">${escapeHtml(p.periodFrom)} → ${escapeHtml(p.periodTo)}</span></td>
            <td><span style="font-size:12px; color:#64748B;">${escapeHtml(p.paidAt)}</span></td>
            <td><span style="font-size:12px; color:#64748B;">${escapeHtml(p.note || '-')}</span></td>
        `;
        tbody.appendChild(tr);
        
        mobileHtml += `
            <div class="accordion-item" style="border:1px solid #E2E8F0; border-radius:14px; margin-bottom:10px; padding:12px 14px; background:#fff;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                    <b style="color:#0F172A; font-size:14px;">${escapeHtml(p.tutorName)}</b>
                    <b style="color:#059669; font-size:14px;">${amtStr}</b>
                </div>
                <div style="font-size:12px; color:#64748B; display:flex; justify-content:space-between;">
                    <span>SĐT: ${escapeHtml(p.tutorPhone)}</span>
                    <span>Gia hạn: <b>${p.months} tháng</b></span>
                </div>
                <div style="font-size:11.5px; color:#94A3B8; margin-top:4px;">
                    ${escapeHtml(p.periodFrom)} → ${escapeHtml(p.periodTo)} · ${escapeHtml(p.paidAt)}
                </div>
            </div>
        `;
    });
    if (mobileWrap) mobileWrap.innerHTML = mobileHtml;
}

// ==========================================
// 2. TAB QUẢN LÝ GIA SƯ (SAAS & BẢO MẬT)
// ==========================================
function populateTutorCenterFilterDropdown() {
    var select = document.getElementById('adminTutorCenterFilter');
    if (!select || !adminDataGlobal) return;
    var currentVal = select.value || "all";
    select.innerHTML = '<option value="all">Tất cả nguồn / trung tâm</option>';
    
    var set = new Set();
    (adminDataGlobal.tutors || []).forEach(t => {
        var c = (t.referralCenter || '').trim();
        if (c) set.add(c);
    });
    
    Array.from(set).sort().forEach(c => {
        var opt = document.createElement('option');
        opt.value = c;
        opt.innerText = c;
        if (c === currentVal) opt.selected = true;
        select.appendChild(opt);
    });
}

function onAdminTutorFilterChange() {
    renderAdminTutorsList();
}
window.onAdminTutorFilterChange = onAdminTutorFilterChange;

function renderAdminTutorsList() {
    var tbody = document.querySelector('#adminTutorsTable tbody');
    var mobileContainer = document.getElementById('adminTutorsMobile');
    if (!tbody) return;
    tbody.innerHTML = "";
    
    var tutors = (adminDataGlobal && adminDataGlobal.tutors) ? adminDataGlobal.tutors : [];
    if (tutors.length === 0) {
        tbody.innerHTML = "<tr><td colspan='10' style='text-align:center; color:#64748B; padding:30px;'>Không có gia sư nào trên hệ thống.</td></tr>";
        if (mobileContainer) mobileContainer.innerHTML = "<div style='text-align:center; color:#64748B; padding: 25px; font-size: 13px;'>Không có gia sư nào trên hệ thống.</div>";
        return;
    }
    
    var searchInput = document.getElementById('adminTutorSearchInput');
    var searchVal = searchInput ? searchInput.value.trim().toLowerCase() : "";
    var statusFilterEl = document.getElementById('adminTutorStatusFilter');
    var statusFilter = statusFilterEl ? statusFilterEl.value : "all";
    var centerFilterEl = document.getElementById('adminTutorCenterFilter');
    var centerFilter = centerFilterEl ? centerFilterEl.value : "all";
    
    var filteredTutors = tutors.filter(t => {
        var isDeact = (t.status === "Vô hiệu hóa");
        var isDue = isBillingDue(t.nextBillingDate) && !isDeact;
        var s = t.status || "Hoạt động";
        
        if (statusFilter === "active" && (isDeact || t.isTrial || s.includes('Hết hạn'))) return false;
        if (statusFilter === "trial" && (!t.isTrial || isDeact || s === 'Hết hạn dùng thử')) return false;
        if (statusFilter === "trial_expired" && s !== 'Hết hạn dùng thử') return false;
        if (statusFilter === "sub_expired" && s !== 'Hết hạn sử dụng') return false;
        if (statusFilter === "due" && !isDue) return false;
        if (statusFilter === "deactivated" && !isDeact) return false;
        
        if (centerFilter !== "all" && (t.referralCenter || '').trim() !== centerFilter) {
            return false;
        }
        
        if (searchVal) {
            var matchName = (t.name || "").toLowerCase().includes(searchVal);
            var matchPhone = (t.phone || "").toLowerCase().includes(searchVal);
            var matchEmail = (t.email || "").toLowerCase().includes(searchVal);
            if (!matchName && !matchPhone && !matchEmail) return false;
        }
        return true;
    });
    
    if (filteredTutors.length === 0) {
        tbody.innerHTML = "<tr><td colspan='10' style='text-align:center; color:#64748B; padding:30px;'><i class='fa-solid fa-magnifying-glass'></i> Không tìm thấy gia sư nào phù hợp với bộ lọc.</td></tr>";
        if (mobileContainer) mobileContainer.innerHTML = "<div style='text-align:center; color:#64748B; padding: 25px; font-size: 13px;'><i class='fa-solid fa-magnifying-glass'></i> Không tìm thấy gia sư nào phù hợp.</div>";
        return;
    }
    
    var mobileHtml = "";
    filteredTutors.forEach((t, idx) => {
        var sCount = t.studentCount || 0;
        var feeInfo = calculateTutorWebFee(sCount, t.customFee);
        var isDeact = (t.status === "Vô hiệu hóa");
        var isDue = isBillingDue(t.nextBillingDate) && !isDeact;
        var initials = getInitials(t.name);
        
        // Status pill
        var statusPill = "";
        if (isDeact) {
            statusPill = "<span class='adm-status-pill status-locked'><i class='fa-solid fa-ban'></i> Đã khóa</span>";
        } else if (t.status === 'Hết hạn dùng thử') {
            statusPill = "<span class='adm-status-pill' style='background:#FEF2F2; color:#DC2626; border:1px solid #FECACA;'><i class='fa-solid fa-lock'></i> Hết hạn thử</span>";
        } else if (t.status === 'Hết hạn sử dụng') {
            statusPill = "<span class='adm-status-pill' style='background:#FEF2F2; color:#DC2626; border:1px solid #FECACA;'><i class='fa-solid fa-hourglass-end'></i> Hết hạn 30 ngày</span>";
        } else if (isDue) {
            statusPill = "<span class='adm-status-pill status-due'><i class='fa-solid fa-triangle-exclamation'></i> Sắp hết hạn</span>";
        } else if (t.isTrial || (t.accountType || '').includes('dùng thử')) {
            statusPill = "<span class='adm-status-pill' style='background:#EFF6FF; color:#2563EB; border:1px solid #BFDBFE;'><i class='fa-solid fa-clock'></i> Dùng thử</span>";
        } else {
            statusPill = "<span class='adm-status-pill status-active'><i class='fa-solid fa-circle-check'></i> Hoạt động</span>";
        }
        
        var lockBtn = isDeact ?
            `<button class='adm-btn-action btn-unlock' onclick='quickToggleTutorStatus("${jsStr(t.phone)}", "${jsStr(t.name)}", true)' title='Mở khóa'><i class='fa-solid fa-unlock'></i> Mở</button>` :
            `<button class='adm-btn-action btn-lock' onclick='quickToggleTutorStatus("${jsStr(t.phone)}", "${jsStr(t.name)}", false)' title='Khóa tài khoản'><i class='fa-solid fa-lock'></i> Khóa</button>`;
        
        var renewBtn = `<button class='adm-btn-action btn-pay' onclick='openAdminRenewModal("${jsStr(t.phone)}")' title='Gia hạn dịch vụ'><i class='fa-solid fa-crown'></i> Gia hạn</button>`;
        var editBtn = `<button class='adm-btn-action btn-edit' onclick='openAdminEditTutorModal("${jsStr(t.phone)}")' title='Sửa thông tin'><i class='fa-solid fa-pen-to-square'></i> Sửa</button>`;
        
        var tr = document.createElement('tr');
        if (isDeact) tr.style.opacity = "0.75";
        
        tr.innerHTML = `
            <td>
                <div class='adm-user-cell'>
                    <span class='adm-avatar-circle'>${escapeHtml(initials)}</span>
                    <div>
                        <div style='font-weight:700; color:#0F172A; font-size:13.5px;'>${escapeHtml(t.name)}</div>
                        <div style='font-size:11.5px; color:#64748B;'>${escapeHtml(t.subjects || 'Gia sư')}</div>
                    </div>
                </div>
            </td>
            <td>
                <div class='adm-phone-tag'>
                    <span>${escapeHtml(t.phone)}</span>
                    <button type='button' class='adm-copy-btn' onclick='copyPhoneToClipboard("${jsStr(t.phone)}")'><i class='fa-regular fa-copy'></i></button>
                </div>
            </td>
            <td><span style='font-size:12.5px; color:#475569;'>${escapeHtml(t.email || '-')}</span></td>
            <td><span style='font-size:12px; background:#F1F5F9; padding:2px 8px; border-radius:6px; font-weight:600;'>${escapeHtml(t.referralCenter || 'Tự đăng ký')}</span></td>
            <td style='text-align:center;'><span style='font-weight:700; color:#0F172A; background:#F1F5F9; border:1px solid #E2E8F0; padding:3px 10px; border-radius:8px;'>${sCount}</span></td>
            <td><b style='color:${feeInfo.isCustom ? "#D97706" : "#2563EB"}; font-size:13px;'>${escapeHtml(feeInfo.text)}</b></td>
            <td>
                <span class='adm-due-badge${isDue ? " is-due" : ""}'>
                    <i class='${isDue ? "fa-solid fa-triangle-exclamation" : "fa-regular fa-calendar-check"}'></i>
                    ${escapeHtml(t.nextBillingDate || "-")}
                </span>
            </td>
            <td style='font-size:11.5px; color:#64748B;'>${escapeHtml(t.lastActive || "Chưa vào")}</td>
            <td style='text-align:center;'>${statusPill}</td>
            <td style='text-align:center;'>
                <div style='display:inline-flex; align-items:center; gap:5px;'>
                    ${renewBtn}
                    ${editBtn}
                    ${lockBtn}
                </div>
            </td>
        `;
        tbody.appendChild(tr);
        
        // Mobile card view
        mobileHtml += `
            <div class='accordion-item' style='border:1px solid ${isDeact ? "#FDE68A" : (isDue ? "#FECACA" : "#E2E8F0")}; margin-bottom:10px; border-radius:14px; background:#fff; overflow:hidden;'>
                <div class='accordion-header' onclick='toggleAdminTutorAccordion(${idx})' style='padding:12px 14px; display:flex; justify-content:space-between; align-items:center; cursor:pointer;'>
                    <div style='display:flex; align-items:center; gap:10px;'>
                        <span class='adm-avatar-circle' style='width:32px; height:32px; font-size:12px;'>${escapeHtml(initials)}</span>
                        <div>
                            <div style='font-weight:700; color:#0F172A; font-size:13.5px;'>${escapeHtml(t.name)}</div>
                            <div style='font-size:11.5px; color:#64748B;'>${escapeHtml(t.phone)} · ${sCount} HS</div>
                        </div>
                    </div>
                    <div style='display:flex; align-items:center; gap:8px;'>
                        ${statusPill}
                        <i class='fa-solid fa-chevron-down' id='adm-tutor-chevron-${idx}' style='color:#94A3B8; font-size:12px;'></i>
                    </div>
                </div>
                <div class='accordion-body' id='adm-tutor-body-${idx}' style='display:none; padding:12px 14px; border-top:1px solid #F1F5F9; background:#FAFBFD;'>
                    <div style='font-size:12.5px; color:#475569; display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px;'>
                        <div>Email: <b>${escapeHtml(t.email || '-')}</b></div>
                        <div>Nguồn: <b>${escapeHtml(t.referralCenter || 'Tự đăng ký')}</b></div>
                        <div>Bậc phí: <b style='color:#2563EB;'>${escapeHtml(feeInfo.text)}</b></div>
                        <div>Hạn dùng: <b style='color:${isDue ? "#DC2626" : "#0F172A"};'>${escapeHtml(t.nextBillingDate || '-')}</b></div>
                    </div>
                    <div style='display:flex; gap:8px;'>
                        <button onclick='openAdminRenewModal("${jsStr(t.phone)}")' class='adm-btn-action btn-pay' style='flex:1; justify-content:center; padding:7px;'><i class='fa-solid fa-crown'></i> Gia hạn</button>
                        <button onclick='openAdminEditTutorModal("${jsStr(t.phone)}")' class='adm-btn-action btn-edit' style='flex:1; justify-content:center; padding:7px;'><i class='fa-solid fa-pen-to-square'></i> Sửa</button>
                        <button onclick='quickToggleTutorStatus("${jsStr(t.phone)}", "${jsStr(t.name)}", ${isDeact})' class='adm-btn-action ${isDeact ? "btn-unlock" : "btn-lock"}' style='padding:7px 12px;'>${isDeact ? "Mở" : "Khóa"}</button>
                    </div>
                </div>
            </div>
        `;
    });
    if (mobileContainer) mobileContainer.innerHTML = mobileHtml;
}

// ==========================================
// 3. TAB THỐNG KÊ TRUNG TÂM GIỚI THIỆU
// ==========================================
function renderAdminCentersList() {
    var tbody = document.querySelector('#adminCentersTable tbody');
    var mobileWrap = document.getElementById('adminCentersMobile');
    if (!tbody) return;
    tbody.innerHTML = "";
    
    var centerStats = (adminDataGlobal && adminDataGlobal.centerStats) ? adminDataGlobal.centerStats : [];
    if (centerStats.length === 0) {
        tbody.innerHTML = "<tr><td colspan='6' style='text-align:center; color:#64748B; padding:25px;'>Chưa có dữ liệu nguồn giới thiệu.</td></tr>";
        if (mobileWrap) mobileWrap.innerHTML = "<div style='text-align:center; color:#64748B; padding:20px; font-size:13px;'>Chưa có dữ liệu nguồn giới thiệu.</div>";
        return;
    }
    
    var mobileHtml = "";
    centerStats.forEach(c => {
        var revStr = (Number(c.revenue) || 0).toLocaleString('vi-VN') + " đ";
        var tr = document.createElement('tr');
        tr.innerHTML = `
            <td><b style="color:#0F172A; font-size:14px;"><i class="fa-solid fa-building" style="color:#2563EB; margin-right:6px;"></i> ${escapeHtml(c.name)}</b></td>
            <td style="text-align:center;"><b style="background:#F1F5F9; border:1px solid #E2E8F0; padding:3px 10px; border-radius:8px;">${c.tutorCount}</b></td>
            <td style="text-align:center;"><span style="color:#059669; font-weight:700;">${c.activeCount}</span></td>
            <td style="text-align:center;"><span style="color:#2563EB; font-weight:700;">${c.trialCount}</span></td>
            <td style="text-align:center;"><span style="color:#DC2626; font-weight:700;">${c.expiredCount}</span></td>
            <td style="text-align:right;"><b style="color:#059669; font-size:14px;">${revStr}</b></td>
        `;
        tbody.appendChild(tr);
        
        mobileHtml += `
            <div class="accordion-item" style="border:1px solid #E2E8F0; border-radius:14px; margin-bottom:10px; padding:14px; background:#fff;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <b style="color:#0F172A; font-size:14px;"><i class="fa-solid fa-building" style="color:#2563EB;"></i> ${escapeHtml(c.name)}</b>
                    <b style="color:#059669; font-size:14px;">${revStr}</b>
                </div>
                <div style="font-size:12.5px; color:#475569; display:flex; justify-content:space-between;">
                    <span>Tổng: <b>${c.tutorCount} gia sư</b></span>
                    <span>Hoạt động: <b style="color:#059669;">${c.activeCount}</b></span>
                    <span>Dùng thử: <b style="color:#2563EB;">${c.trialCount}</b></span>
                    <span>Hết hạn: <b style="color:#DC2626;">${c.expiredCount}</b></span>
                </div>
            </div>
        `;
    });
    if (mobileWrap) mobileWrap.innerHTML = mobileHtml;
}

// ==========================================
// 4. TAB CÀI ĐẶT HỆ THỐNG & LIÊN HỆ ADMIN
// ==========================================
function renderAdminSettings() {
    if (!adminDataGlobal) return;
    var c = adminDataGlobal.adminContact || {};
    var zInput = document.getElementById('adminContactZalo');
    if (zInput) zInput.value = c.zalo || "0975546830";
    var mInput = document.getElementById('adminContactMessenger');
    if (mInput) mInput.value = c.facebook || "https://m.me/zuntutor";
    var pInput = document.getElementById('adminContactPhone');
    if (pInput) pInput.value = c.phone || "0975 546 830";
    
    var mqInput = document.getElementById('adminMarqueeInput');
    if (mqInput) mqInput.value = adminDataGlobal.marqueeAnnouncement || "";
}

function saveAdminContactSettings() {
    var zalo = document.getElementById('adminContactZalo').value.trim();
    var messenger = document.getElementById('adminContactMessenger').value.trim();
    var phone = document.getElementById('adminContactPhone').value.trim();
    
    showToast("Đang lưu cài đặt liên hệ...", "info");
    google.script.run
        .withSuccessHandler(function(res) {
            if (res && res.error) {
                showToast("Lỗi: " + res.error, "error");
            } else {
                showToast("Đã lưu thông tin liên hệ Admin thành công!", "success");
                if (adminDataGlobal) {
                    adminDataGlobal.adminContact = { zalo: zalo, facebook: messenger, phone: phone };
                }
            }
        })
        .withFailureHandler(function(err) {
            showToast("Lỗi kết nối: " + err.toString(), "error");
        })
        .adminLuuLienHe(zalo, messenger, phone);
}
window.saveAdminContactSettings = saveAdminContactSettings;

// ==========================================
// MODAL GIA HẠN GIA SƯ (SAAS MANUAL RENEW)
// ==========================================
function openAdminRenewModal(phone) {
    if (!adminDataGlobal || !adminDataGlobal.tutors) return;
    var tutor = adminDataGlobal.tutors.find(t => t.phone === phone || normalizePhone(t.phone) === normalizePhone(phone));
    if (!tutor) return;
    
    document.getElementById('adminRenewTutorPhone').value = tutor.phone;
    document.getElementById('rnTutorName').innerText = "Gia sư: " + tutor.name;
    document.getElementById('rnTutorPhone').innerText = tutor.phone;
    document.getElementById('rnTutorStudentCount').innerText = (tutor.studentCount || 0) + " học sinh";
    document.getElementById('rnTutorCurrentDue').innerText = tutor.nextBillingDate || "Chưa có";
    
    var mSel = document.getElementById('rnMonthsSelect');
    if (mSel) mSel.value = "1";
    
    document.getElementById('rnNoteInput').value = "Thanh toán gói 1 tháng qua Zalo";
    onAdminRenewMonthsChange();
    
    document.getElementById('adminRenewModal').style.display = "flex";
}
window.openAdminRenewModal = openAdminRenewModal;

function closeAdminRenewModal() {
    var m = document.getElementById('adminRenewModal');
    if (m) m.style.display = "none";
}
window.closeAdminRenewModal = closeAdminRenewModal;

function onAdminRenewMonthsChange() {
    var phone = document.getElementById('adminRenewTutorPhone').value;
    var tutor = adminDataGlobal.tutors.find(t => t.phone === phone || normalizePhone(t.phone) === normalizePhone(phone));
    if (!tutor) return;
    
    var months = parseInt(document.getElementById('rnMonthsSelect').value, 10) || 1;
    var feeInfo = calculateTutorWebFee(tutor.studentCount, tutor.customFee);
    var unitPrice = feeInfo.amount || 50000;
    var total = unitPrice * months;
    
    var amtInput = document.getElementById('rnAmountInput');
    if (amtInput) amtInput.value = total;
    
    var noteEl = document.getElementById('rnFeeNote');
    if (noteEl) {
        noteEl.innerText = feeInfo.isCustom ? 
            "Gia sư có giá riêng thỏa thuận: " + unitPrice.toLocaleString('vi-VN') + " đ/tháng" :
            "Bậc phí " + (tutor.studentCount || 0) + " học sinh: " + unitPrice.toLocaleString('vi-VN') + " đ/tháng";
    }
}
window.onAdminRenewMonthsChange = onAdminRenewMonthsChange;

function submitAdminRenewTutor() {
    var phone = document.getElementById('adminRenewTutorPhone').value;
    var months = parseInt(document.getElementById('rnMonthsSelect').value, 10) || 1;
    var amount = Number(document.getElementById('rnAmountInput').value) || 0;
    var note = document.getElementById('rnNoteInput').value.trim();
    
    var btn = document.getElementById('btnSubmitAdminRenew');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang gia hạn...';
    }
    
    google.script.run
        .withSuccessHandler(function(res) {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-check"></i> Xác nhận gia hạn';
            }
            if (res && res.error) {
                showToast("Lỗi: " + res.error, "error");
            } else {
                showToast("Gia hạn thành công! Hạn mới đến: " + (res.nextDue || ""), "success");
                closeAdminRenewModal();
                
                // Cập nhật bộ nhớ cục bộ
                if (adminDataGlobal && adminDataGlobal.tutors) {
                    var t = adminDataGlobal.tutors.find(x => x.phone === phone || normalizePhone(x.phone) === normalizePhone(phone));
                    if (t) {
                        t.nextBillingDate = res.nextDue;
                        t.status = "Hoạt động";
                        t.isTrial = false;
                    }
                }
                if (res.payment && adminDataGlobal.payments) {
                    adminDataGlobal.payments.unshift({
                        id: res.payment.payment_id,
                        tutorPhone: res.payment.tutor_phone,
                        tutorName: res.payment.tutor_name,
                        amount: res.payment.amount,
                        months: res.payment.months,
                        periodFrom: res.payment.period_from,
                        periodTo: res.payment.period_to,
                        paidAt: res.payment.paid_at,
                        note: res.payment.note
                    });
                }
                
                renderAdminBusinessReport();
                renderAdminTutorsList();
                refreshAdminDashboard(true);
            }
        })
        .withFailureHandler(function(err) {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-check"></i> Xác nhận gia hạn';
            }
            showToast("Lỗi kết nối: " + err.toString(), "error");
        })
        .adminGiaHanGiaSu(phone, months, amount, note);
}
window.submitAdminRenewTutor = submitAdminRenewTutor;

// ==========================================
// MODAL THÊM / SỬA GIA SƯ
// ==========================================
function openAdminAddTutorModal() {
    document.getElementById('adminTutorModalTitle').innerHTML = '<i class="fa-solid fa-chalkboard-user"></i> Thêm Gia Sư Mới';
    document.getElementById('adminTutorOldPhone').value = "";
    document.getElementById('adminTutorName').value = "";
    document.getElementById('adminTutorPhone').value = "";
    document.getElementById('adminTutorEmail').value = "";
    document.getElementById('adminTutorSubjects').value = "";
    document.getElementById('adminTutorLevels').value = "";
    document.getElementById('adminTutorReferralCenter').value = "";
    document.getElementById('adminTutorCustomFee').value = "";
    document.getElementById('adminTutorNextBillingDate').value = "";
    document.getElementById('btnDeleteAdminTutor').style.display = "none";
    document.getElementById('btnDeactivateAdminTutor').style.display = "none";
    document.getElementById('adminEditTutorModal').style.display = "flex";
}
window.openAdminAddTutorModal = openAdminAddTutorModal;

function openAdminEditTutorModal(phone) {
    var tutor = (adminDataGlobal && adminDataGlobal.tutors) ? adminDataGlobal.tutors.find(t => t.phone === phone || normalizePhone(t.phone) === normalizePhone(phone)) : null;
    if (!tutor) return;
    
    document.getElementById('adminTutorModalTitle').innerHTML = '<i class="fa-solid fa-chalkboard-user"></i> Sửa Thông Tin Gia Sư';
    document.getElementById('adminTutorOldPhone').value = tutor.phone;
    document.getElementById('adminTutorName').value = tutor.name;
    document.getElementById('adminTutorPhone').value = tutor.phone;
    document.getElementById('adminTutorEmail').value = tutor.email || "";
    document.getElementById('adminTutorSubjects').value = tutor.subjects || "";
    document.getElementById('adminTutorLevels').value = tutor.levels || "";
    document.getElementById('adminTutorReferralCenter').value = tutor.referralCenter || "";
    document.getElementById('adminTutorCustomFee').value = tutor.customFee || "";
    document.getElementById('adminTutorNextBillingDate').value = tutor.nextBillingDate || "";
    document.getElementById('btnDeleteAdminTutor').style.display = "flex";
    
    var btnDeact = document.getElementById('btnDeactivateAdminTutor');
    if (btnDeact) {
        btnDeact.style.display = "flex";
        if (tutor.status === "Vô hiệu hóa") {
            btnDeact.innerHTML = '<i class="fa-solid fa-user-check"></i> Kích hoạt lại';
            btnDeact.style.background = "#ECFDF5";
            btnDeact.style.border = "1px solid #A7F3D0";
            btnDeact.style.color = "#059669";
        } else {
            btnDeact.innerHTML = '<i class="fa-solid fa-user-slash"></i> Vô hiệu hóa';
            btnDeact.style.background = "#FFFBEB";
            btnDeact.style.border = "1px solid #FDE68A";
            btnDeact.style.color = "#D97706";
        }
    }
    
    document.getElementById('adminEditTutorModal').style.display = "flex";
}
window.openAdminEditTutorModal = openAdminEditTutorModal;

function closeAdminEditTutorModal() {
    document.getElementById('adminEditTutorModal').style.display = "none";
}
window.closeAdminEditTutorModal = closeAdminEditTutorModal;

function adminResetPinForCurrentTutor() {
    var phone = document.getElementById('adminTutorOldPhone').value || document.getElementById('adminTutorPhone').value;
    if (!phone) return;
    showCustomConfirm("Bạn có chắc chắn muốn đặt lại mã PIN của gia sư này về '1234'?", function() {
        showToast("Đang đặt lại mã PIN...", "info");
        google.script.run
            .withSuccessHandler(function(res) {
                if (res && res.error) showToast("Lỗi: " + res.error, "error");
                else showToast("Đã đặt lại mã PIN thành công về 1234!", "success");
            })
            .withFailureHandler(function(err) {
                showToast("Lỗi: " + err.toString(), "error");
            })
            .adminDatLaiPin(phone, "1234");
    });
}
window.adminResetPinForCurrentTutor = adminResetPinForCurrentTutor;

function saveAdminTutor() {
    var oldPhone = document.getElementById('adminTutorOldPhone').value;
    var name = document.getElementById('adminTutorName').value.trim();
    var phone = document.getElementById('adminTutorPhone').value.trim();
    var email = document.getElementById('adminTutorEmail').value.trim();
    var subjects = document.getElementById('adminTutorSubjects').value.trim();
    var levels = document.getElementById('adminTutorLevels').value.trim();
    var referralCenter = document.getElementById('adminTutorReferralCenter').value.trim();
    var customFee = document.getElementById('adminTutorCustomFee').value.trim();
    var nextBillingDate = document.getElementById('adminTutorNextBillingDate').value.trim();
    
    if(!name || !phone) {
        showToast("Vui lòng nhập tên và số điện thoại gia sư!", "error");
        return;
    }
    
    var btn = document.getElementById('btnSaveAdminTutor');
    btn.disabled = true;
    btn.innerText = "Đang lưu...";
    
    // adminLuuGiaSu args: [oldPhone, name, phone, pin, qrUrl, createdDate, nextBillingDate, accountType, email, subjects, levels, referralCenter, customFee]
    google.script.run
        .withSuccessHandler(function(res) {
            btn.disabled = false;
            btn.innerText = "Lưu lại";
            if(res && res.error) {
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
        .adminLuuGiaSu(oldPhone, name, phone, "", "", "", nextBillingDate, "", email, subjects, levels, referralCenter, customFee);
}
window.saveAdminTutor = saveAdminTutor;

// ==========================================
// THAO TÁC XÓA & THÙNG RÁC GIA SƯ
// ==========================================
function confirmDeleteAdminTutor() {
    pinVerifyAction = "deleteTutor";
    var desc = document.getElementById('confirmPinModalText');
    if (desc) desc.innerText = "Vui lòng nhập mã PIN Admin để xác nhận đưa gia sư vào thùng rác.";
    document.getElementById('confirmTutorPinInput').value = "";
    document.getElementById('pinConfirmModal').style.display = "flex";
}
window.confirmDeleteAdminTutor = confirmDeleteAdminTutor;

function closePinConfirmModal() {
    document.getElementById('pinConfirmModal').style.display = "none";
}
window.closePinConfirmModal = closePinConfirmModal;

function submitPinVerifyForDelete() {
    var inputPin = document.getElementById('confirmTutorPinInput').value.trim();
    var adminPin = sessionStorage.getItem('userPin') || (adminDataGlobal && adminDataGlobal.adminInfo ? adminDataGlobal.adminInfo.pin : "") || "1234";
    
    if (inputPin && inputPin === adminPin) {
        closePinConfirmModal();
        closeAdminEditTutorModal();
        deleteTutorBackend();
    } else {
        showToast("Mã PIN xác thực của Admin không chính xác!", "error");
    }
}
window.submitPinVerifyForDelete = submitPinVerifyForDelete;

function deleteTutorBackend() {
    var phone = document.getElementById('adminTutorOldPhone').value;
    var name = document.getElementById('adminTutorName').value;
    
    showCustomConfirm("Xác nhận đưa gia sư " + name + " vào thùng rác? Dữ liệu sẽ tạm ẩn và có thể khôi phục bất cứ lúc nào.", function() {
        google.script.run
            .withSuccessHandler(function(res) {
                if (res && res.error) {
                    showToast("Lỗi: " + res.error, "error");
                } else {
                    showToast("Đã đưa gia sư vào thùng rác thành công!", "success");
                    refreshAdminDashboard();
                }
            })
            .withFailureHandler(function(err) {
                showToast("Lỗi kết nối: " + err.toString(), "error");
            })
            .xoaGiaSuTamThoi(phone);
    });
}

function openTutorTrashModal() {
    var modal = document.getElementById('tutorTrashModal');
    var list = document.getElementById('trashTutorList');
    if (!modal || !list) return;
    list.innerHTML = "";
    
    var deleted = (adminDataGlobal && adminDataGlobal.deletedTutors) ? adminDataGlobal.deletedTutors : [];
    if (deleted.length === 0) {
        list.innerHTML = "<div style='text-align:center; color:#64748B; padding:20px; font-size:13px;'><i class='fa-solid fa-trash-can-arrow-up'></i> Thùng rác hiện đang trống.</div>";
    } else {
        deleted.forEach(t => {
            var row = document.createElement('div');
            row.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:12px 14px; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px;";
            row.innerHTML = `
                <div>
                    <div style="font-weight:700; color:#0F172A; font-size:13.5px;">${escapeHtml(t.name)}</div>
                    <div style="font-size:12px; color:#64748B;">SĐT: ${escapeHtml(t.phone)} · Ngày xóa: ${escapeHtml(t.deletedDate || 'Gần đây')}</div>
                </div>
                <button type="button" onclick="restoreTutor('${jsStr(t.phone)}', '${jsStr(t.name)}')" class="btn-primary-gradient" style="padding:6px 14px; font-size:12.5px;">
                    <i class="fa-solid fa-rotate-left"></i> Khôi phục
                </button>
            `;
            list.appendChild(row);
        });
    }
    modal.style.display = "flex";
}
window.openTutorTrashModal = openTutorTrashModal;

function closeTutorTrashModal() {
    var m = document.getElementById('tutorTrashModal');
    if (m) m.style.display = "none";
}
window.closeTutorTrashModal = closeTutorTrashModal;

function restoreTutor(phone, name) {
    showCustomConfirm("Khôi phục tài khoản cho gia sư " + name + "?", function() {
        showToast("Đang khôi phục gia sư...", "info");
        google.script.run
            .withSuccessHandler(function(res) {
                if (res && res.error) showToast("Lỗi: " + res.error, "error");
                else {
                    showToast("Đã khôi phục gia sư thành công!", "success");
                    closeTutorTrashModal();
                    refreshAdminDashboard();
                }
            })
            .withFailureHandler(function(err) {
                showToast("Lỗi: " + err.toString(), "error");
            })
            .khoiPhucGiaSu(phone);
    });
}
window.restoreTutor = restoreTutor;

function quickToggleTutorStatus(phone, name, isCurrentlyDeactivated) {
    var actionText = isCurrentlyDeactivated ? 'kích hoạt lại' : 'vô hiệu hóa';
    var newStatus = isCurrentlyDeactivated ? 'Hoạt động' : 'Vô hiệu hóa';
    
    showCustomConfirm('Xác nhận ' + actionText + ' tài khoản gia sư ' + name + '?', function() {
        showToast('Đang cập nhật trạng thái gia sư...', 'info');
        google.script.run
            .withSuccessHandler(function(res) {
                if (res && res.error) {
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
window.quickToggleTutorStatus = quickToggleTutorStatus;

function toggleTutorDeactivateStatus() {
    var phone = document.getElementById('adminTutorOldPhone').value;
    var name = document.getElementById('adminTutorName').value;
    var tutor = (adminDataGlobal && adminDataGlobal.tutors) ? adminDataGlobal.tutors.find(t => t.phone === phone || normalizePhone(t.phone) === normalizePhone(phone)) : null;
    if (!tutor) return;
    quickToggleTutorStatus(phone, name, tutor.status === 'Vô hiệu hóa');
    closeAdminEditTutorModal();
}
window.toggleTutorDeactivateStatus = toggleTutorDeactivateStatus;

// Accordion toggle helpers
function toggleAdminTutorAccordion(idx) {
    var body = document.getElementById('adm-tutor-body-' + idx);
    if (!body) return;
    var chevron = document.getElementById('adm-tutor-chevron-' + idx);
    if (body.style.display === 'block') {
        body.style.display = 'none';
        if (chevron) { chevron.classList.remove('fa-chevron-up'); chevron.classList.add('fa-chevron-down'); }
    } else {
        body.style.display = 'block';
        if (chevron) { chevron.classList.remove('fa-chevron-down'); chevron.classList.add('fa-chevron-up'); }
    }
}
window.toggleAdminTutorAccordion = toggleAdminTutorAccordion;

// ==========================================
// THÔNG BÁO DÒNG CHỮ CHẠY (MARQUEE)
// ==========================================
function clearAdminMarquee() {
    showCustomConfirm("Bạn có chắc chắn muốn xóa dòng chữ chạy thông báo này không?", function() {
        var input = document.getElementById('adminMarqueeInput');
        if (input) input.value = "";
        
        showToast("Đang xóa thông báo...", "info");
        google.script.run
            .withSuccessHandler(function(res) {
                if (res && res.error) {
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
    showToast("Đang lưu dòng chữ chạy...", "info");
    google.script.run
        .withSuccessHandler(function(res) {
            if (res && res.error) {
                showToast("Lỗi: " + res.error, "error");
            } else {
                showToast("Lưu dòng chạy chữ thông báo thành công!", "success");
                if (adminDataGlobal) {
                    adminDataGlobal.marqueeAnnouncement = text;
                }
            }
        })
        .withFailureHandler(function(err) {
            showToast("Lỗi hệ thống: " + err.toString(), "error");
        })
        .adminLuuMarquee(text);
}
window.saveAdminMarquee = saveAdminMarquee;

// ==========================================
// TỰ ĐỘNG ĐỒNG BỘ DỮ LIỆU ADMIN
// ==========================================
function refreshAdminDashboard(silent) {
    var phone = sessionStorage.getItem('userPhone') || currentAdminPhone;
    var pin = sessionStorage.getItem('userPin') || "";
    
    google.script.run
        .withSuccessHandler(function(res) {
            var data = (res && res.data) ? res.data : res;
            if (data && data.tutors) {
                sessionStorage.setItem('dashboardData', JSON.stringify(data));
                renderAdminView(data);
                if (!silent) showToast("Đã cập nhật dữ liệu mới nhất!", "success");
            }
        })
        .withFailureHandler(function(err) {
            console.warn("Lỗi làm mới admin dashboard:", err);
        })
        .getAdminDashboardData(phone, pin);
}
window.refreshAdminDashboard = refreshAdminDashboard;
