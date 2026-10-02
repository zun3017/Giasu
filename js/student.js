var currentChartInstance = null;
var currentStudentName = "";

// Hàm chuẩn hoá chuỗi loại bỏ dấu tiếng Việt để kiểm tra chính xác
function normalizeStr(str) {
    if (!str) return "";
    return String(str).toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .trim();
}

// Hàm nhận diện buổi nghỉ (chỉ dựa trên thẻ / trạng thái điểm danh do người dùng chọn)
function isAbsentSession(statusOrItem) {
    var rawStatus = "";
    if (typeof statusOrItem === 'object' && statusOrItem !== null) {
        rawStatus = statusOrItem.trangThai || statusOrItem.chuyenCan || statusOrItem.attendance_status || statusOrItem.attendance || statusOrItem.status || "";
    } else {
        rawStatus = String(statusOrItem || "");
    }
    var normTt = normalizeStr(rawStatus);

    // 1. Nếu là học bù / đã bù thì luôn tính là buổi có học
    if (normTt.includes('hoc bu') || normTt.includes('da bu')) {
        return false;
    }

    // 2. Kiểm tra trạng thái / thẻ điểm danh rõ ràng
    if (
        normTt.includes('nghi') ||
        normTt.includes('huy') ||
        normTt.includes('vang') ||
        normTt.includes('off') ||
        normTt.includes('khong hoc') ||
        normTt.includes('chua hoc') ||
        normTt.includes('tam hoan') ||
        normTt === 'v' ||
        normTt === 'n' ||
        normTt === 'x'
    ) {
        return true;
    }

    return false;
}

// Helper phân tích ngày học linh hoạt từ mọi định dạng
function parseLessonDate(rawStr) {
    if (!rawStr) return null;
    var s = String(rawStr).trim();
    var mIso = s.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    var mDmy = s.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
    var mDm = s.match(/(\d{1,2})[-/.](\d{1,2})/);
    var curY = new Date().getFullYear();
    if (mIso) return { year: parseInt(mIso[1], 10), month: parseInt(mIso[2], 10) - 1 };
    if (mDmy) return { year: parseInt(mDmy[3], 10), month: parseInt(mDmy[2], 10) - 1 };
    if (mDm) return { year: curY, month: parseInt(mDm[2], 10) - 1 };
    var d = new Date(s);
    return isNaN(d.getTime()) ? null : { year: d.getFullYear(), month: d.getMonth() };
}

function renderStudentView(ketQua) {
    if (!ketQua) return;
    
    // Đảm bảo có mảng danh sách lịch sử học tập
    var lichSu = ketQua.lichSuHocTap || ketQua.danhSachNhatKy || [];

    // Hủy biểu đồ cũ nếu có
    if (currentChartInstance) {
        currentChartInstance.destroy();
        currentChartInstance = null;
    }
    if (window._btvnInst) {
        window._btvnInst.destroy();
        window._btvnInst = null;
    }
    if (window._ccInst) {
        window._ccInst.destroy();
        window._ccInst = null;
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
    var resBox = document.getElementById('resultBox');
    if (resBox) resBox.style.display = 'block';
    document.body.classList.add('logged-in');
    var bottomNavEl = document.querySelector('.bottom-nav');
    if (bottomNavEl) bottomNavEl.style.setProperty('display', 'none', 'important');
    
    var studentPhone = sessionStorage.getItem('userPhone') || localStorage.getItem('userPhone') || "";
    if (studentPhone && studentPhone.charAt(0) !== '0' && studentPhone.length === 9) {
        studentPhone = '0' + studentPhone;
    }
    
    var lopHoc = ketQua.lop || "Đang cập nhật";
    if ((lopHoc === "Đang cập nhật" || !lopHoc) && lichSu.length > 0) {
        for (var k = 0; k < lichSu.length; k++) {
            if (lichSu[k].mon) {
                lopHoc = lichSu[k].mon;
                break;
            }
        }
    }
    
    var loiChaoEl = document.getElementById('loiChao');
    if (loiChaoEl) {
        // Lấy 2 chữ initials từ tên
        var nameParts = (ketQua.tenHocSinh || 'HS').trim().split(/\s+/);
        var initials = nameParts.length >= 2
            ? nameParts[0][0] + nameParts[nameParts.length - 1][0]
            : nameParts[0].substring(0, 2);
        initials = initials.toUpperCase();

        // Tháng hiện tại
        var now = new Date();
        var monthLabel = 'Tháng ' + (now.getMonth() + 1) + '/' + now.getFullYear();

        var displayPhone = studentPhone || ketQua.sdt || "";

        loiChaoEl.innerHTML =
            '<div class="student-hero-card">' +
                '<div class="hero-avatar">' + initials + '</div>' +
                '<div class="hero-info">' +
                    '<h2 class="hero-name">Xin chào, <strong>' + (ketQua.tenHocSinh || 'Học sinh') + '</strong> 👋</h2>' +
                    '<div class="hero-meta">' +
                        '<span class="hero-tag"><i class="fa-solid fa-book"></i> ' + lopHoc + '</span>' +
                    '</div>' +
                '</div>' +
                '<div class="hero-month-badge"><i class="fa-solid fa-calendar-days"></i> ' + monthLabel + '</div>' +
            '</div>';
    }
    currentStudentName = ketQua.tenHocSinh || "";
    
    // Khôi phục trạng thái active cho các nút legend tùy chọn
    var btnDauGio = document.getElementById('btnLegDauGio');
    var btnDinhKi = document.getElementById('btnLegDinhKi');
    if (btnDauGio && btnDinhKi) {
        btnDauGio.className = 'legend-btn active btn-dau-gio';
        btnDinhKi.className = 'legend-btn active btn-dinh-ki';
    }
    
    // --- 1. HIỂN THỊ KHUNG THÔNG BÁO (TASK 15.6) ---
    var khuVucThongBao = document.getElementById('khuVucThongBao');
    if (khuVucThongBao) {
        var thongBaoText = ketQua.thongBaoHocSinh || ketQua.thongBao || "";
        if (thongBaoText.trim() !== "") {
            khuVucThongBao.innerHTML = 
                '<div class="announce-card announce-has">' +
                    '<div class="announce-icon"><i class="fa-solid fa-bullhorn"></i></div>' +
                    '<div class="announce-body">' +
                        '<div class="announce-title">Thông báo từ gia sư</div>' +
                        '<div class="announce-text">' + thongBaoText + '</div>' +
                    '</div>' +
                '</div>';
        } else {
            khuVucThongBao.innerHTML = 
                '<div class="announce-card announce-empty">' +
                    '<i class="fa-regular fa-bell"></i>' +
                    '<span>Chưa có thông báo mới</span>' +
                '</div>';
        }
    }

    // --- 2. TÍNH TOÁN VÀ KHỞI TẠO BỘ CHỌN THÁNG (MONTH FILTER) ---
    var today = new Date();
    var currentMonth = today.getMonth(); // 0 - 11
    var currentYear = today.getFullYear();

    var availableMonthsMap = {};
    lichSu.forEach(function(item) {
        var pd = parseLessonDate(item.studyDate || item.ngay);
        if (pd) {
            var key = (pd.month + 1) + '/' + pd.year;
            if (!availableMonthsMap[key]) {
                availableMonthsMap[key] = {
                    key: key,
                    month: pd.month,
                    year: pd.year,
                    label: "Tháng " + String(pd.month + 1).padStart(2, '0') + '/' + pd.year,
                    sortVal: pd.year * 100 + (pd.month + 1)
                };
            }
        }
    });
    var sortedMonths = Object.keys(availableMonthsMap).map(function(k) {
        return availableMonthsMap[k];
    }).sort(function(a, b) {
        return b.sortVal - a.sortVal;
    });

    var curKey = (currentMonth + 1) + '/' + currentYear;
    var defaultMonthKey = "";
    if (availableMonthsMap[curKey]) {
        defaultMonthKey = curKey;
    } else if (sortedMonths.length > 0) {
        defaultMonthKey = sortedMonths[0].key;
    } else {
        defaultMonthKey = curKey;
    }

    var monthSelectEl = document.getElementById('studentStatsMonthFilter');
    if (monthSelectEl) {
        var optsHtml = "";
        sortedMonths.forEach(function(m) {
            var isSel = (m.key === defaultMonthKey) ? 'selected' : '';
            optsHtml += '<option value="' + m.key + '" ' + isSel + '>' + m.label + '</option>';
        });
        if (sortedMonths.length > 1) {
            optsHtml += '<option value="all">Tất cả các tháng</option>';
        }
        if (!sortedMonths.length) {
            optsHtml = '<option value="' + curKey + '">Tháng ' + String(currentMonth + 1).padStart(2, '0') + '/' + currentYear + '</option>';
        }
        monthSelectEl.innerHTML = optsHtml;
    }

    var totalPresentAllTime = 0;
    var totalAbsentAllTime = 0;
    lichSu.forEach(function(item) {
        if (isAbsentSession(item)) {
            totalAbsentAllTime++;
        } else {
            totalPresentAllTime++;
        }
    });

    // Cập nhật số liệu KPI và 2 biểu đồ Donut theo tháng mục tiêu
    updateStudentMonthlyStats(defaultMonthKey);

    // --- 3. KHỞI TẠO BIỂU ĐỒ ĐIỂM SỐ ---
    var labels = [];
    var dataDauGio = [];
    var dataDinhKi = [];
    
    // Sắp xếp dữ liệu theo trình tự thời gian từ cũ đến mới (trái qua phải)
    // để biểu đồ thể hiện rõ tiến trình tiến bộ học tập của học sinh
    var lichSuVe = lichSu.slice();
    if (lichSuVe.length > 1) {
        var parseDateNum = function(str) {
            if (!str) return 0;
            var s = String(str).trim();
            s = s.replace(/^(thứ\s*[\w\d]+|chủ\s*nhật|cn|t\d+)\s*[,.-]?\s*/i, '').trim();
            var mIso = s.match(/(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/);
            if (mIso) return parseInt(mIso[1], 10) * 10000 + parseInt(mIso[2], 10) * 100 + parseInt(mIso[3], 10);
            var mDmy = s.match(/(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})/);
            if (mDmy) return parseInt(mDmy[3], 10) * 10000 + parseInt(mDmy[2], 10) * 100 + parseInt(mDmy[1], 10);
            var mDm = s.match(/(\d{1,2})[-\/.](\d{1,2})/);
            if (mDm) return (new Date().getFullYear()) * 10000 + parseInt(mDm[2], 10) * 100 + parseInt(mDm[1], 10);
            var d = new Date(s);
            if (!isNaN(d.getTime())) return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
            return 0;
        };
        var firstD = parseDateNum(lichSuVe[0].ngay);
        var lastD = parseDateNum(lichSuVe[lichSuVe.length - 1].ngay);
        if (firstD > lastD) {
            lichSuVe.reverse();
        }
    }

    lichSuVe.forEach(function(item) {
        var valDG = parseFloat(item.diemDauGio !== undefined && item.diemDauGio !== null ? item.diemDauGio : item.diemDG);
        var valDK = parseFloat(item.diemDinhKi !== undefined && item.diemDinhKi !== null ? item.diemDinhKi : item.diemDK);
        var isValidDG = !isNaN(valDG) && valDG >= 0 && valDG <= 10;
        var isValidDK = !isNaN(valDK) && valDK >= 0 && valDK <= 10;

        // Chỉ đưa vào biểu đồ điểm số những buổi học CÓ ĐIỂM (loại bỏ các buổi vắng hoặc không có điểm kiểm tra)
        if (isValidDG || isValidDK) {
            var rawDate = item.ngay || "";
            var shortDate = rawDate;
            if (typeof formatDateOnly === 'function') {
                shortDate = formatDateOnly(rawDate);
            } else {
                var dateParts = rawDate.match(/(\d{1,2})\/(\d{1,2})/);
                if (dateParts) shortDate = dateParts[1] + "/" + dateParts[2];
            }
            labels.push(shortDate);
            dataDauGio.push(isValidDG ? valDG : null);
            dataDinhKi.push(isValidDK ? valDK : null);
        }
    });

    var chartCanvas = document.getElementById('diemChart');
    if (chartCanvas && labels.length > 0) {
        var ctx = chartCanvas.getContext('2d');

        // 1. Tạo linear gradient fill chuyển sắc mượt mà chuẩn phong cách Hình 1
        var gradDauGio = ctx.createLinearGradient(0, 0, 0, 260);
        gradDauGio.addColorStop(0, 'rgba(59, 130, 246, 0.35)');
        gradDauGio.addColorStop(1, 'rgba(59, 130, 246, 0.01)');

        var gradDinhKi = ctx.createLinearGradient(0, 0, 0, 260);
        gradDinhKi.addColorStop(0, 'rgba(245, 158, 11, 0.32)');
        gradDinhKi.addColorStop(1, 'rgba(245, 158, 11, 0.01)');

        // Tính toán dải trục Y linh hoạt để đường cong có độ võng/nhấp nhô tự nhiên chuẩn Hình 1
        var allScores = dataDauGio.concat(dataDinhKi).filter(function(v) { return v !== null && !isNaN(v); });
        var minScore = allScores.length > 0 ? Math.min.apply(null, allScores) : 0;
        var maxScore = allScores.length > 0 ? Math.max.apply(null, allScores) : 10;
        var yMin = (minScore >= 6) ? Math.max(0, Math.floor(minScore) - 1) : 0;
        var yMax = Math.min(10.5, Math.max(10, maxScore + 0.5));

        currentChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Điểm đầu giờ',
                        data: dataDauGio,
                        borderColor: '#3B82F6',
                        backgroundColor: gradDauGio,
                        borderWidth: 3,
                        fill: true,
                        tension: 0.38,
                        pointBackgroundColor: '#3B82F6',
                        pointBorderColor: '#FFFFFF',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7.5,
                        spanGaps: true
                    },
                    {
                        label: 'Điểm định kì',
                        data: dataDinhKi,
                        borderColor: '#F59E0B',
                        backgroundColor: gradDinhKi,
                        borderWidth: 3,
                        fill: false, // Đường cam nổi bật sắc sảo trên nền gradient xanh
                        tension: 0.38,
                        pointBackgroundColor: '#F59E0B',
                        pointBorderColor: '#FFFFFF',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7.5,
                        spanGaps: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        left: 16,
                        right: 28,
                        top: 12,
                        bottom: 6
                    }
                },
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1E293B',
                        titleColor: '#FFFFFF',
                        titleFont: { family: 'Inter', size: 12, weight: 'bold' },
                        bodyColor: '#FFFFFF',
                        bodyFont: { family: 'Inter', size: 11, weight: '600' },
                        borderColor: 'rgba(59, 130, 246, 0.4)',
                        borderWidth: 1,
                        padding: 10,
                        cornerRadius: 10,
                        boxPadding: 4,
                        usePointStyle: true,
                        callbacks: {
                            title: function(items) {
                                return items.length > 0 ? ('Buổi ngày ' + items[0].label) : '';
                            },
                            label: function(c) {
                                if (c.raw === null || c.raw === undefined) return null;
                                return ' ' + c.dataset.label + ': ' + c.parsed.y + ' điểm';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false,
                            drawBorder: false
                        },
                        ticks: {
                            color: '#94A3B8',
                            font: { family: 'Inter', size: 11, weight: '500' }
                        }
                    },
                    y: {
                        display: false,
                        grid: {
                            display: false,
                            drawBorder: false
                        },
                        min: yMin,
                        suggestedMax: yMax
                    }
                }
            }
        });
    }

    // --- 4. RENDER BẢNG LỊCH SỬ & MOBILE ACCORDION CARDS ---
    var htmlLichSu = "";
    var htmlMobile = "";
    var totalBuoi = lichSu.length;
    if (totalBuoi > 0) {
        // Cập nhật tiêu đề Lịch sử có kèm tổng số buổi rõ ràng
        var historyTitleEl = document.getElementById('studentHistoryTitle');
        if (!historyTitleEl) historyTitleEl = document.querySelector('#resultBox .schedule-section h3 span') || document.querySelector('#resultBox .result-section h4');
        if (historyTitleEl) {
            historyTitleEl.innerHTML = '<i class="fa-solid fa-clock-rotate-left"></i> Lịch sử học tập & Nhận xét chi tiết <span style="font-size: 12px; color: var(--text-secondary); font-weight: normal; margin-left: 8px;">(Đã học: <b style="color:#10B981;">' + totalPresentAllTime + '</b> • Nghỉ: <b style="color:#EF4444;">' + totalAbsentAllTime + '</b>)</span>';
        }

        // Helper màu sắc điểm số
        function scoreColor(val) {
            var n = parseFloat(val);
            if (isNaN(n)) return 'var(--text-secondary, #94A3B8)';
            if (n >= 9) return '#059669';
            if (n >= 7) return '#2563EB';
            if (n >= 5) return '#D97706';
            return '#DC2626';
        }

        // Helper trạng thái chuyên cần (chuẩn theo tutor.js)
        var getStatusBadge = function(trangThai, isAbsent) {
            if (isAbsent) return '<span class="status-badge badge-nghi">Vắng</span>';
            var tt = (trangThai || "").trim().toLowerCase();
            if (tt === "đã học" || tt === "có mặt" || tt === "có") return '<span class="status-badge badge-dahoc">Có mặt</span>';
            if (tt === "học bù") return '<span class="status-badge badge-hocbu">Học bù</span>';
            if (tt === "đi muộn") return '<span class="status-badge badge-hocbu" style="background:rgba(245,158,11,0.15); border-color:rgba(245,158,11,0.4); color:var(--text-primary);">Đi muộn</span>';
            if (tt.indexOf("hủy") !== -1 || tt.indexOf("nghỉ") !== -1 || tt === "vắng" || tt === "vắng mặt" || tt === "cả lớp nghỉ") {
                var label = (tt === "cả lớp nghỉ") ? "Cả lớp nghỉ" : (tt.indexOf("hủy") !== -1 ? "Hủy/Nghỉ" : "Vắng");
                return '<span class="status-badge badge-nghi">' + label + '</span>';
            }
            return '<span class="status-badge badge-dahoc">' + (trangThai || 'Có mặt') + '</span>';
        };

        // Helper đánh giá bài tập về nhà (chuẩn theo tutor.js)
        var getBtvnBadge = function(btvn) {
            var raw = (btvn || "").trim();
            var bt = raw.toLowerCase();
            if (!raw || raw === "-" || raw === "không có") return '<span class="status-badge" style="background: var(--bg-input); border: 1px solid var(--border-card); color: var(--text-secondary);">-</span>';
            
            var pctMatch = bt.match(/(\d+(\.\d+)?)\s*%/);
            if (pctMatch) {
                var pct = parseFloat(pctMatch[1]);
                if (pct >= 90) {
                    return '<span class="status-badge badge-hoanthanh">' + raw + '</span>';
                } else if (pct >= 50) {
                    return '<span class="status-badge badge-thieu">' + raw + '</span>';
                } else {
                    return '<span class="status-badge badge-nghi">' + raw + '</span>';
                }
            }

            if (bt.indexOf("không làm") !== -1 || bt.indexOf("chưa làm") !== -1 || bt.indexOf("chưa nộp") !== -1 || bt.indexOf("chưa đạt") !== -1 || bt === "không") {
                return '<span class="status-badge badge-nghi">' + raw + '</span>';
            }
            if (bt.indexOf("hoàn thành") !== -1 || bt === "đạt" || bt === "tốt" || bt === "xuất sắc" || bt === "có") {
                return '<span class="status-badge badge-hoanthanh">' + raw + '</span>';
            }
            if (bt.indexOf("thiếu") !== -1) {
                return '<span class="status-badge badge-thieu">' + raw + '</span>';
            }
            if (bt.indexOf("phụ huynh") !== -1 || bt.indexOf("nhắc") !== -1) {
                return '<span class="status-badge badge-hocbu" style="font-size:10.5px; padding:3px 8px;">' + raw + '</span>';
            }
            return '<span class="status-badge badge-hoanthanh">' + raw + '</span>';
        };

        // Helper định dạng ngày chỉ lấy ngày/tháng, bỏ thứ (Ví dụ: "22/09")
        function formatDateOnly(dStr) {
            if (typeof window.formatDateOnly === 'function') return window.formatDateOnly(dStr);
            if (!dStr || dStr === "-" || dStr === "null") return "-";
            var s = String(dStr).trim();
            s = s.replace(/^(thứ\s*\d+|chủ nhật|cn)\s*[,.-]?\s*/i, '').trim();
            var day = null, month = null;
            var mIso = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
            if (mIso) {
                month = parseInt(mIso[2], 10);
                day = parseInt(mIso[3], 10);
            } else {
                var mDmy = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
                if (mDmy) {
                    day = parseInt(mDmy[1], 10);
                    month = parseInt(mDmy[2], 10);
                } else {
                    var mDm = s.match(/^(\d{1,2})[-/.](\d{1,2})/);
                    if (mDm) {
                        day = parseInt(mDm[1], 10);
                        month = parseInt(mDm[2], 10);
                    }
                }
            }
            if (day && month) {
                return String(day).padStart(2, '0') + '/' + String(month).padStart(2, '0');
            }
            return s;
        }

        // 1. Desktop View (Bảng Table)
        htmlLichSu += "<div class='table-wrapper desktop-table-view'>";
        htmlLichSu += "<table class='history-table'>";
        htmlLichSu += "<thead><tr>" +
            "<th style='width: 42px; text-align: center;'>Tuần</th>" +
            "<th style='width: 62px; text-align: center;'>Ngày dạy</th>" +
            "<th style='width: 65px; text-align: center;'>Môn</th>" +
            "<th>Nội dung</th>" +
            "<th>Nhận xét của gia sư</th>" +
            "<th style='width: 105px; text-align: center;'>Đánh giá BTVN</th>" +
            "<th style='width: 70px; text-align: center;'>KT Đầu giờ</th>" +
            "<th style='width: 70px; text-align: center;'>KT Định kì</th>" +
            "<th style='width: 78px; text-align: center;'>Trạng thái</th>" +
            "</tr></thead><tbody>";

        // 2. Mobile View (Thẻ Accordion Cards y hệt Gia sư)
        htmlMobile = "<div class='mobile-cards-view' id='studentHistoryMobile'>";

        var reversedList = lichSu.slice().reverse();
        reversedList.forEach(function(item, idx) {
            var isAbsent = isAbsentSession(item);
            var isHidden = (idx >= 5);
            var hiddenAttr = isHidden ? ' style="display:none;" class="history-row hidden-row' + (isAbsent ? ' row-absent' : '') + '"' : ' class="history-row' + (isAbsent ? ' row-absent' : '') + '"';
            
            var btvnValue = (item.danhGiaBTVN || item.btvn || "");
            var diemDau = item.diemDauGio !== undefined && item.diemDauGio !== null ? item.diemDauGio : item.diemDG;
            var diemDinh = item.diemDinhKi !== undefined && item.diemDinhKi !== null ? item.diemDinhKi : item.diemDK;
            var tuanVal = item.tuan !== undefined && item.tuan !== null && item.tuan !== '' ? item.tuan : (item.buoi || item.rowIndex || (idx + 1));
            
            var rawDateOnly = (typeof window.formatDateOnly === 'function') 
                ? window.formatDateOnly(item.ngay) 
                : (typeof formatDateOnly === 'function' ? formatDateOnly(item.ngay) : (item.ngay || "—"));

            var commentHtml = (item.nhanXet && String(item.nhanXet).trim() !== "")
                ? '<span style="color: var(--text-primary); font-style: italic;"><i class="fa-solid fa-comment-dots" style="color: #3B82F6; font-size: 12px; margin-right: 5px;"></i>' + item.nhanXet + '</span>'
                : '<span style="color: var(--text-muted); font-style: italic;">—</span>';

            var ktDauGioText = (diemDau !== undefined && diemDau !== null && String(diemDau).trim() !== "" && String(diemDau).trim() !== "-")
                ? diemDau
                : (isAbsent ? 'Không có' : '—');
            var ktDinhKiText = (diemDinh !== undefined && diemDinh !== null && String(diemDinh).trim() !== "" && String(diemDinh).trim() !== "-")
                ? diemDinh
                : (isAbsent ? 'Không có' : '—');

            var ktDauGioColor = (ktDauGioText === 'Không có' || ktDauGioText === '—') ? 'var(--text-secondary)' : scoreColor(diemDau);
            var ktDinhKiColor = (ktDinhKiText === 'Không có' || ktDinhKiText === '—') ? 'var(--text-secondary)' : scoreColor(diemDinh);

            // --- Desktop Row ---
            htmlLichSu +=
                '<tr' + hiddenAttr + '>' +
                    '<td style="text-align: center; font-weight: 700; color: var(--text-primary);">' + tuanVal + '</td>' +
                    '<td style="white-space: nowrap; text-align: center; color: var(--text-primary); font-weight: 500;">' + rawDateOnly + '</td>' +
                    '<td>' + (item.mon || lopHoc ? ('<span class="subj-chip">' + (item.mon || lopHoc) + '</span>') : '') + '</td>' +
                    '<td class="cell-noidung">' + (item.noiDung || item.topic || '-') + '</td>' +
                    '<td class="cell-nhanxet">' + commentHtml + '</td>' +
                    '<td style="text-align: center;">' + getBtvnBadge(btvnValue) + '</td>' +
                    '<td style="text-align: center; font-weight: 700; font-size: 14px; color:' + ktDauGioColor + ';">' + ktDauGioText + '</td>' +
                    '<td style="text-align: center; font-weight: 700; font-size: 14px; color:' + ktDinhKiColor + ';">' + ktDinhKiText + '</td>' +
                    '<td style="text-align: center;">' + getStatusBadge(item.trangThai || item.chuyenCan, isAbsent) + '</td>' +
                '</tr>';

            // --- Mobile Accordion Card (Theo đúng mẫu ảnh media_1790923332447.png) ---
            var mobileStyleStr = isHidden ? 'style="display: none;" class="accordion-item student-history-row student-hidden-row"' : 'class="accordion-item student-history-row"';
            htmlMobile += '<div ' + mobileStyleStr + '>';
            htmlMobile += '  <div class="accordion-header" onclick="toggleStudentAccordion(' + idx + ')">';
            htmlMobile += '    <div style="display: flex; align-items: center;">';
            htmlMobile += '      <div class="accordion-header-title">';
            htmlMobile += '        <span style="font-size: 15px; font-weight: 700; color: var(--text-primary);">' + tuanVal + '</span>';
            htmlMobile += '        <span class="accordion-header-date">' + rawDateOnly + '</span>';
            htmlMobile += '      </div>';
            htmlMobile += '    </div>';
            htmlMobile += '    <div class="accordion-header-status">';
            htmlMobile += '      ' + getStatusBadge(item.trangThai || item.chuyenCan, isAbsent);
            htmlMobile += '      <i class="fa-solid fa-chevron-down" id="student-chevron-' + idx + '" style="font-size: 13px; color: var(--color-primary, #3B82F6);"></i>';
            htmlMobile += '    </div>';
            htmlMobile += '  </div>';
            htmlMobile += '  <div class="accordion-body" id="student-accordion-body-' + idx + '" style="display: none;">';
            htmlMobile += '    <div class="accordion-body-row"><span class="accordion-body-label">Môn học</span><span class="accordion-body-val">' + (item.mon || lopHoc || '—') + '</span></div>';
            htmlMobile += '    <div class="accordion-body-row"><span class="accordion-body-label">Nội dung dạy học</span><span class="accordion-body-val">' + (item.noiDung || item.topic || '—') + '</span></div>';
            htmlMobile += '    <div class="accordion-body-row"><span class="accordion-body-label">Nhận xét của gia sư</span><span class="accordion-body-val" style="font-style: italic; color: #2563EB; font-weight: 500;">' + (item.nhanXet ? ("<i class='fa-solid fa-comment-dots' style='margin-right: 4px;'></i>" + item.nhanXet) : '—') + '</span></div>';
            htmlMobile += '    <div class="accordion-body-row"><span class="accordion-body-label">Đánh giá bài tập về nhà</span><span class="accordion-body-val">' + getBtvnBadge(btvnValue) + '</span></div>';
            htmlMobile += '    <div class="accordion-body-row"><span class="accordion-body-label">Kiểm tra đầu giờ</span><span class="accordion-body-val" style="font-weight: 700; color:' + scoreColor(diemDau) + ';">' + (diemDau !== undefined && diemDau !== null && diemDau !== '' ? diemDau : '—') + '</span></div>';
            htmlMobile += '    <div class="accordion-body-row"><span class="accordion-body-label">Kiểm tra định kì</span><span class="accordion-body-val" style="font-weight: 700; color:' + scoreColor(diemDinh) + ';">' + (diemDinh !== undefined && diemDinh !== null && diemDinh !== '' ? diemDinh : '—') + '</span></div>';
            htmlMobile += '  </div>';
            htmlMobile += '</div>';
        });

        htmlLichSu += "</tbody></table></div>";
        htmlMobile += "</div>";
    } else {
        htmlLichSu = "<p style='color: #A6ADCE; padding: 16px;'>Chưa có dữ liệu đánh giá nào được cập nhật.</p>";
    }
    
    var khuVucLichSuEl = document.getElementById('khuVucLichSu');
    if (khuVucLichSuEl) khuVucLichSuEl.innerHTML = htmlLichSu + htmlMobile;
    
    // Ẩn/Hiện nút Xem thêm (...) dựa trên số lượng buổi học
    var loadMoreContainer = document.getElementById('loadMoreContainer');
    if (loadMoreContainer) {
        if (totalBuoi > 5) {
            loadMoreContainer.style.display = 'block';
        } else {
            loadMoreContainer.style.display = 'none';
        }
    }
    
    // Render Bài tập / File tải về
    var khuVucBaiTapEl = document.getElementById('khuVucBaiTap');
    if (khuVucBaiTapEl) {
        var htmlBaiTap = "";
        var listBt = ketQua.baiTap || ketQua.danhSachBaiTap || [];
        if (listBt.length > 0) {
            listBt.slice().reverse().forEach(function(bt) {
                htmlBaiTap += "<div class='bt-item'>";
                htmlBaiTap += "<div><strong style='color: var(--text-heading);'>[" + (bt.mon || "Gia sư") + "]</strong> <span style='color: var(--text-primary); font-weight: 500; font-size: 15px; margin-left: 8px;'>" + (bt.tenBai || bt.title || "Tài liệu học tập") + "</span></div>";
                if (bt.link || bt.file) {
                    htmlBaiTap += "<a href='" + (bt.link || bt.file) + "' target='_blank' class='btn-download'><i class='fa-solid fa-cloud-arrow-down'></i> Tải Xuống</a>";
                }
                htmlBaiTap += "</div>";
            });
        } else {
            htmlBaiTap = "<p style='color: #A6ADCE;'>Chưa có bài kiểm tra hoặc tài liệu nào.</p>";
        }
        khuVucBaiTapEl.innerHTML = htmlBaiTap;
    }
} // End renderStudentView

// Hàm chuyển đổi bộ lọc tháng từ giao diện học sinh
window.onStudentMonthFilterChange = function(monthKey) {
    updateStudentMonthlyStats(monthKey);
};

// Cập nhật toàn bộ chỉ số KPI và 2 biểu đồ tròn Donut theo tháng đã chọn
function updateStudentMonthlyStats(monthKey) {
    var lichSu = window._currentStudentLichSu || [];
    var isAll = (monthKey === "all");
    var targetM = -1, targetY = -1;
    var badgeMonthStr = "";
    var kpiMonthLabel = "";

    if (!isAll && monthKey) {
        var parts = String(monthKey).split('/');
        targetM = parseInt(parts[0], 10) - 1;
        targetY = parseInt(parts[1], 10);
        badgeMonthStr = "Tháng " + (targetM + 1);
        kpiMonthLabel = "Tháng " + (targetM + 1);
    } else {
        badgeMonthStr = "Tất cả";
        kpiMonthLabel = "tất cả";
    }

    // 1. Cập nhật nhãn tháng trên badge tiêu đề Donut charts
    var btvnBadge = document.getElementById('btvnMonthBadge');
    if (btvnBadge) btvnBadge.textContent = "(" + badgeMonthStr + ")";
    var ccBadge = document.getElementById('chuyenCanMonthBadge');
    if (ccBadge) ccBadge.textContent = "(" + badgeMonthStr + ")";

    // 2. Cập nhật nhãn trên KPI cards
    var elLblBuoiHoc = document.getElementById('lblBuoiHoc');
    if (elLblBuoiHoc) elLblBuoiHoc.innerText = "Số buổi đã học (" + kpiMonthLabel + ")";
    var elLblBuoiNghi = document.getElementById('lblBuoiNghi');
    if (elLblBuoiNghi) elLblBuoiNghi.innerText = "Số buổi nghỉ (" + kpiMonthLabel + ")";

    // 3. Lọc danh sách buổi học theo tháng
    var targetLogs = [];
    if (isAll) {
        targetLogs = lichSu.slice();
    } else {
        targetLogs = lichSu.filter(function(item) {
            var pd = parseLessonDate(item.studyDate || item.ngay);
            return pd && pd.month === targetM && pd.year === targetY;
        });
    }

    // 4. Tính toán số liệu tháng cho KPI cards
    var buoiHocThang = 0;
    var buoiNghiThang = 0;
    var listDiemDauGioThang = [];
    var listDiemDinhKiThang = [];
    var tongBTVNThang = 0;
    var completedBTVNThang = 0;

    targetLogs.forEach(function(item) {
        var isAbsent = isAbsentSession(item);
        if (isAbsent) {
            buoiNghiThang++;
        } else {
            buoiHocThang++;
            var scoreDG = parseFloat(item.diemDauGio);
            var scoreDK = parseFloat(item.diemDinhKi);
            if (!isNaN(scoreDG) && scoreDG >= 0 && scoreDG <= 10) {
                listDiemDauGioThang.push(scoreDG);
            }
            if (!isNaN(scoreDK) && scoreDK >= 0 && scoreDK <= 10) {
                listDiemDinhKiThang.push(scoreDK);
            }

            var btvnStr = (item.danhGiaBTVN || item.btvn || "").trim().toLowerCase();
            if (btvnStr !== "" && btvnStr !== "không có" && btvnStr !== "-" && btvnStr !== "chưa có") {
                tongBTVNThang++;
                var pctMatch = btvnStr.match(/(\d+(\.\d+)?)\s*%/);
                if (pctMatch) {
                    var pVal = parseFloat(pctMatch[1]);
                    if (!isNaN(pVal)) {
                        completedBTVNThang += Math.min(Math.max(pVal / 100.0, 0), 1.0);
                    }
                } else if (btvnStr.indexOf("không làm") !== -1 || btvnStr.indexOf("chưa làm") !== -1 || btvnStr.indexOf("chưa nộp") !== -1 || btvnStr === "không") {
                    completedBTVNThang += 0.0;
                } else if (btvnStr.indexOf("hoàn thành") !== -1 || btvnStr.indexOf("phụ huynh") !== -1 || btvnStr === "đạt" || btvnStr === "tốt" || btvnStr === "xuất sắc" || btvnStr === "có") {
                    completedBTVNThang += 1.0;
                } else if (btvnStr.indexOf("thiếu") !== -1) {
                    var match = btvnStr.match(/thiếu\s+(\d+)/);
                    if (match) {
                        var missingCount = parseInt(match[1], 10);
                        var completedCount = 5 - missingCount;
                        if (completedCount < 0) completedCount = 0;
                        completedBTVNThang += (completedCount / 5.0);
                    } else {
                        completedBTVNThang += 0.5;
                    }
                } else {
                    completedBTVNThang += 1.0;
                }
            }
        }
    });

    // Điểm đầu giờ
    var valDiemDauGio = "Chưa có";
    var numDiemDauGio = null;
    if (listDiemDauGioThang.length > 0) {
        var sumDG = 0;
        for (var s = 0; s < listDiemDauGioThang.length; s++) sumDG += listDiemDauGioThang[s];
        numDiemDauGio = sumDG / listDiemDauGioThang.length;
        valDiemDauGio = numDiemDauGio.toFixed(2);
    }
    var elDauGio = document.getElementById('valDiemDauGio');
    if (elDauGio) elDauGio.innerText = valDiemDauGio;

    // Điểm định kì
    var valDiemDinhKi = "Chưa có";
    var numDiemDinhKi = null;
    if (listDiemDinhKiThang.length > 0) {
        var sumDK = 0;
        for (var k = 0; k < listDiemDinhKiThang.length; k++) sumDK += listDiemDinhKiThang[k];
        numDiemDinhKi = sumDK / listDiemDinhKiThang.length;
        valDiemDinhKi = numDiemDinhKi.toFixed(2);
    }
    var elDinhKi = document.getElementById('valDiemDinhKi');
    if (elDinhKi) elDinhKi.innerText = valDiemDinhKi;

    // BTVN (%)
    var valBTVNText = "--";
    var btvnPercent = null;
    if (tongBTVNThang > 0) {
        btvnPercent = Math.round((completedBTVNThang / tongBTVNThang) * 100);
        valBTVNText = btvnPercent + "%";
    }
    var elBTVN = document.getElementById('valBTVN');
    if (elBTVN) elBTVN.innerText = valBTVNText;

    // Số buổi học & nghỉ
    var elBuoiHoc = document.getElementById('valBuoiHoc');
    if (elBuoiHoc) elBuoiHoc.innerText = buoiHocThang + " buổi";
    var elBuoiNghi = document.getElementById('valBuoiNghi');
    if (elBuoiNghi) elBuoiNghi.innerText = buoiNghiThang + " buổi";

    // Badges đánh giá
    function scoreLevelBadge(val) {
        var n = parseFloat(val);
        if (isNaN(n) || val === '-' || val === '' || val === null) return '';
        if (n >= 9.0) return '<span class="score-badge-xs badge-excellent">Xuất sắc ⭐</span>';
        if (n >= 7.0) return '<span class="score-badge-xs badge-good">Giỏi 👍</span>';
        if (n >= 5.0) return '<span class="score-badge-xs badge-average">Khá 📚</span>';
        return '<span class="score-badge-xs badge-poor">Cần cố gắng 💪</span>';
    }
    var badgeDauGioEl = document.getElementById('badgeDauGioContainer');
    if (badgeDauGioEl) badgeDauGioEl.innerHTML = scoreLevelBadge(numDiemDauGio);
    var badgeDinhKiEl = document.getElementById('badgeDinhKiContainer');
    if (badgeDinhKiEl) badgeDinhKiEl.innerHTML = scoreLevelBadge(numDiemDinhKi);

    var elBtvnBadge = document.getElementById('btvnBadgeContainer');
    if (elBtvnBadge) {
        if (btvnPercent !== null) {
            if (btvnPercent === 100) elBtvnBadge.innerHTML = '<div class="medal-badge medal-platinum"><i class="fa-solid fa-trophy"></i> Chăm chỉ Xuất sắc 🏆</div>';
            else if (btvnPercent >= 90) elBtvnBadge.innerHTML = '<div class="medal-badge medal-gold"><i class="fa-solid fa-medal"></i> Tích cực 🥇</div>';
            else if (btvnPercent >= 80) elBtvnBadge.innerHTML = '<div class="medal-badge medal-silver"><i class="fa-solid fa-medal"></i> Tiến bộ 🥈</div>';
            else if (btvnPercent >= 70) elBtvnBadge.innerHTML = '<div class="medal-badge medal-bronze"><i class="fa-solid fa-medal"></i> Cố gắng 🥉</div>';
            else elBtvnBadge.innerHTML = '<span class="score-badge-xs badge-poor">Cần cố gắng 💪</span>';
        } else {
            elBtvnBadge.innerHTML = '';
        }
    }

    // 5. Render 2 biểu đồ tròn donut tính toán theo danh sách buổi học tháng
    renderDonutCharts(targetLogs);
}

// ===== TASK 15.3: 2 BIỂU ĐỒ TRÒN DONUT (BTVN & CHUYÊN CẦN TÍNH THEO THÁNG) =====
function renderDonutCharts(targetLogs) {
    if (!targetLogs) targetLogs = [];

    // --- TÍNH BTVN THEO THÁNG ---
    var btvnHT = 0, btvnKHT = 0;
    targetLogs.forEach(function(item) {
        if (!isAbsentSession(item)) {
            var raw = normalizeStr(item.danhGiaBTVN || item.btvn || '');
            if (raw !== "" && raw !== "-" && raw !== "khong co" && raw !== "chua co") {
                if (raw.includes('hoan') || raw.includes('tot') || raw === 'co' || raw.includes('day du') || raw.includes('xuat') || raw === 'dat') {
                    btvnHT++;
                } else if (raw.includes('thieu') || raw.includes('khong lam') || raw.includes('chua lam') || raw.includes('chua nop')) {
                    btvnKHT++;
                } else {
                    var mPct = raw.match(/(\d+)/);
                    if (mPct && parseInt(mPct[1], 10) >= 80) {
                        btvnHT++;
                    } else if (mPct) {
                        btvnKHT++;
                    } else {
                        btvnHT++;
                    }
                }
            }
        }
    });
    var btvnActive = btvnHT + btvnKHT; // buổi có bài tập trong tháng
    var btvnPct = btvnActive > 0 ? Math.round(btvnHT / btvnActive * 100) : 0;

    var btvnPctEl = document.getElementById('btvnPct');
    var btvnLegEl = document.getElementById('btvnLegend');
    if (btvnPctEl) btvnPctEl.textContent = btvnActive > 0 ? (btvnPct + '%') : '—';
    if (btvnLegEl) {
        btvnLegEl.innerHTML =
            donutLegItem('#10B981', 'Hoàn thành', btvnHT) +
            donutLegItem('#F97316', 'Chưa hoàn thành', btvnKHT);
    }

    // Khích lệ BTVN bằng huy hiệu / cúp
    var btvnRewardEl = document.getElementById('btvnRewardBadge');
    if (btvnRewardEl) {
        var btvnRewardHtml = "";
        if (btvnActive > 0) {
            if (btvnPct === 100) {
                btvnRewardHtml = '<div class="donut-reward-pill reward-trophy"><i class="fa-solid fa-trophy" style="color: #D97706;"></i> Chăm chỉ Xuất sắc 🏆</div>';
            } else if (btvnPct >= 90) {
                btvnRewardHtml = '<div class="donut-reward-pill reward-gold"><i class="fa-solid fa-medal" style="color: #2563EB;"></i> Tích cực Làm bài 🥇</div>';
            } else if (btvnPct >= 80) {
                btvnRewardHtml = '<div class="donut-reward-pill reward-silver"><i class="fa-solid fa-award" style="color: #059669;"></i> Tiến bộ Vượt bậc 🥈</div>';
            } else if (btvnPct >= 60) {
                btvnRewardHtml = '<div class="donut-reward-pill reward-cheer"><i class="fa-solid fa-star" style="color: #9333EA;"></i> Đang Cố gắng 🥉</div>';
            } else {
                btvnRewardHtml = '<div class="donut-reward-pill reward-cheer"><i class="fa-solid fa-hand-sparkles" style="color: #EA580C;"></i> Cần Cố gắng Hơn 💪</div>';
            }
        }
        btvnRewardEl.innerHTML = btvnRewardHtml;
    }

    var btvnCtx = document.getElementById('btvnChart');
    if (btvnCtx) {
        if (window._btvnInst) { window._btvnInst.destroy(); }
        var chartData = (btvnHT === 0 && btvnKHT === 0) ? [0, 1] : [btvnHT, btvnKHT];
        var chartColors = (btvnHT === 0 && btvnKHT === 0) ? ['#CBD5E1', '#E2E8F0'] : ['#10B981', '#F97316'];
        window._btvnInst = new Chart(btvnCtx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: chartData,
                    backgroundColor: chartColors,
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                cutout: '72%',
                responsive: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(c) {
                                if (btvnHT === 0 && btvnKHT === 0) return ' Chưa có dữ liệu BTVN';
                                var L = ['Hoàn thành', 'Chưa hoàn thành'];
                                return ' ' + (L[c.dataIndex] || '') + ': ' + c.raw + ' buổi';
                            }
                        }
                    }
                }
            }
        });
    }

    // --- TÍNH CHUYÊN CẦN THEO THÁNG ---
    var coMat = 0, vangHoc = 0;
    targetLogs.forEach(function(item) {
        if (isAbsentSession(item)) { vangHoc++; } else { coMat++; }
    });
    var ccTotal = coMat + vangHoc;
    var ccPct = ccTotal > 0 ? Math.round(coMat / ccTotal * 100) : 0;

    var ccPctEl = document.getElementById('chuyenCanPct');
    var ccLegEl = document.getElementById('chuyenCanLegend');
    if (ccPctEl) ccPctEl.textContent = ccTotal > 0 ? (ccPct + '%') : '—';
    if (ccLegEl) {
        ccLegEl.innerHTML =
            donutLegItem('#3B82F6', 'Có mặt', coMat) +
            donutLegItem('#EF4444', 'Vắng', vangHoc);
    }

    // Khích lệ Chuyên cần bằng huy hiệu / cúp
    var ccRewardEl = document.getElementById('chuyenCanRewardBadge');
    if (ccRewardEl) {
        var ccRewardHtml = "";
        if (ccTotal > 0) {
            if (ccPct === 100) {
                ccRewardHtml = '<div class="donut-reward-pill reward-trophy"><i class="fa-solid fa-crown" style="color: #D97706;"></i> Chuyên cần 100% 👑</div>';
            } else if (ccPct >= 90) {
                ccRewardHtml = '<div class="donut-reward-pill reward-gold"><i class="fa-solid fa-medal" style="color: #2563EB;"></i> Đi học Đều đặn 🌟</div>';
            } else if (ccPct >= 80) {
                ccRewardHtml = '<div class="donut-reward-pill reward-silver"><i class="fa-solid fa-thumbs-up" style="color: #059669;"></i> Chuyên cần Tốt 👍</div>';
            } else {
                ccRewardHtml = '<div class="donut-reward-pill reward-cheer"><i class="fa-solid fa-seedling" style="color: #EA580C;"></i> Đi học Đều Hơn Nhé 🌱</div>';
            }
        }
        ccRewardEl.innerHTML = ccRewardHtml;
    }

    var ccCtx = document.getElementById('chuyenCanChart');
    if (ccCtx) {
        if (window._ccInst) { window._ccInst.destroy(); }
        var ccData = (ccTotal === 0) ? [0, 1] : [coMat, vangHoc];
        var ccColors = (ccTotal === 0) ? ['#CBD5E1', '#E2E8F0'] : ['#3B82F6', '#EF4444'];
        window._ccInst = new Chart(ccCtx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: ccData,
                    backgroundColor: ccColors,
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                cutout: '72%',
                responsive: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(c) {
                                if (ccTotal === 0) return ' Chưa có dữ liệu chuyên cần';
                                var L = ['Có mặt', 'Vắng'];
                                return ' ' + L[c.dataIndex] + ': ' + c.raw + ' buổi';
                            }
                        }
                    }
                }
            }
        });
    }
}

function donutLegItem(color, label, count) {
    return '<div class="donut-legend-item">' +
        '<span class="donut-legend-dot" style="background:' + color + ';"></span>' +
        '<span>' + label + '</span>' +
        '<span class="donut-legend-count">' + count + '</span>' +
        '</div>';
}

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
    if (window._btvnInst) {
        window._btvnInst.destroy();
        window._btvnInst = null;
    }
    if (window._ccInst) {
        window._ccInst.destroy();
        window._ccInst = null;
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
    // 1. Mở thêm 5 dòng trong bảng Desktop
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

    // 2. Mở thêm 5 thẻ Accordion trong Mobile View
    var hiddenCards = document.querySelectorAll('.accordion-item.student-hidden-row');
    var cardCount = 0;
    for (var j = 0; j < hiddenCards.length; j++) {
        if (cardCount < 5) {
            hiddenCards[j].style.display = '';
            hiddenCards[j].classList.remove('student-hidden-row');
            cardCount++;
        } else {
            break;
        }
    }
    
    // Ẩn nút nếu không còn dòng hoặc thẻ nào bị ẩn
    var remainingRows = document.querySelectorAll('.history-row.hidden-row');
    var remainingCards = document.querySelectorAll('.accordion-item.student-hidden-row');
    if (remainingRows.length === 0 && remainingCards.length === 0) {
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
    
    // Nếu đường điểm đầu giờ bị ẩn, bật fill cho điểm định kì để luôn có gradient đẹp mắt
    var meta0 = currentChartInstance.getDatasetMeta(0);
    if (meta0 && meta0.hidden) {
        currentChartInstance.data.datasets[1].fill = true;
    } else {
        currentChartInstance.data.datasets[1].fill = false;
    }

    currentChartInstance.update();
}

function toggleStudentAccordion(idx) {
    var body = document.getElementById('student-accordion-body-' + idx) || document.getElementById('accordion-body-' + idx);
    var chevron = document.getElementById('student-chevron-' + idx);
    if (!body) return;
    
    var item = body.closest('.accordion-item');
    var isActive = item ? item.classList.contains('active') : false;
    
    var allBodies = document.querySelectorAll('[id^="student-accordion-body-"], [id^="accordion-body-"]');
    allBodies.forEach(function(b) {
        b.style.display = 'none';
        var it = b.closest('.accordion-item');
        if (it) it.classList.remove('active');
    });
    
    if (!isActive) {
        body.style.display = 'block';
        if (item) item.classList.add('active');
    }
}

function toggleAccordion(idx) {
    toggleStudentAccordion(idx);
}

function showToast(message, type) {
    type = type || 'info';
    var container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 99999; display: flex; flex-direction: column; gap: 10px; pointer-events: none; max-width: calc(100vw - 40px);';
        document.body.appendChild(container);
    }
    var toast = document.createElement('div');
    toast.style.cssText = 'padding: 12px 20px; border-radius: 12px; color: #FFF; font-size: 13.5px; font-weight: 600; box-shadow: 0 10px 25px rgba(0,0,0,0.25); pointer-events: auto; font-family: Inter, sans-serif; display: flex; align-items: center; gap: 10px; border: 1px solid transparent; transition: all 0.3s ease;';
    if (type === 'success') {
        toast.style.background = '#059669';
        toast.style.borderColor = '#10B981';
        toast.innerHTML = '<i class="fa-solid fa-circle-check"></i> ' + message;
    } else if (type === 'error') {
        toast.style.background = '#DC2626';
        toast.style.borderColor = '#EF4444';
        toast.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> ' + message;
    } else {
        toast.style.background = '#2563EB';
        toast.style.borderColor = '#60A5FA';
        toast.innerHTML = '<i class="fa-solid fa-circle-info"></i> ' + message;
    }
    container.appendChild(toast);
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(function() {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }, 3000);
}

function lamMoiLichSuHocTap() {
    var btn = document.querySelector('[onclick="lamMoiLichSuHocTap()"]');
    var icon = btn ? btn.querySelector('i') : null;
    if (icon) icon.classList.add('fa-spin');
    
    if (typeof google !== 'undefined' && google.script && google.script.run && google.script.run.traCuuThongTin) {
        var studentPhone = sessionStorage.getItem('userPhone') || localStorage.getItem('userPhone') || "";
        google.script.run
            .withSuccessHandler(function(res) {
                if (icon) icon.classList.remove('fa-spin');
                if (res && res.timThay) {
                    sessionStorage.setItem('dashboardData', JSON.stringify(res));
                    renderStudentView(res);
                    showToast('Đã làm mới dữ liệu học tập!', 'success');
                } else {
                    showToast('Không có dữ liệu mới.', 'info');
                }
            })
            .withFailureHandler(function(err) {
                if (icon) icon.classList.remove('fa-spin');
                showToast('Lỗi khi tải dữ liệu: ' + err.toString(), 'error');
            })
            .traCuuThongTin(studentPhone);
    } else {
        setTimeout(function() {
            if (icon) icon.classList.remove('fa-spin');
            var dataStr = sessionStorage.getItem('dashboardData') || localStorage.getItem('dashboardData');
            var data = null;
            try {
                if (dataStr) data = JSON.parse(dataStr);
            } catch(e) {}
            
            if (data) {
                renderStudentView(data);
            }
            showToast('Đã làm mới dữ liệu học tập!', 'success');
        }, 500);
    }
}

function toggleRowDetail(btn) {
    var tr = btn.closest('tr');
    var detailRow = tr ? tr.nextElementSibling : null;
    if (!detailRow) return;
    var isOpen = detailRow.style.display !== 'none';
    detailRow.style.display = isOpen ? 'none' : 'table-row';
    btn.classList.toggle('open', !isOpen);
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
    
    // Kiểm tra môi trường Apps Script hoặc Local Demo API
    if (typeof google !== 'undefined' && google.script && google.script.run) {
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
    } else {
        // Mock demo handler
        setTimeout(function() {
            btn.disabled = false;
            btn.innerHTML = 'Gửi phản hồi <i class="fa-regular fa-paper-plane"></i>';
            textarea.value = "";
            msg.innerText = "Gửi phản hồi thành công! Cảm ơn ý kiến đóng góp của phụ huynh.";
            msg.className = "feedback-message-status success";
            msg.style.display = "block";
            setTimeout(function() {
                msg.style.display = "none";
            }, 5000);
        }, 500);
    }
}

// ==========================================
// BACKWARD COMPATIBILITY HELPER
// Giữ lại hàm tạo huy chương dạng legacy từ bản production cũ
// ==========================================
function createScoreBadgeHtml(scoreNum) {
    if (scoreNum === null || scoreNum === undefined || isNaN(scoreNum)) return "";
    var n = parseFloat(scoreNum);
    if (n >= 9.0) {
        return '<div class="medal-badge medal-academic"><i class="fa-solid fa-award"></i> Học giỏi 🎖️</div>';
    } else if (n >= 8.0) {
        return '<div class="medal-badge medal-silver"><i class="fa-solid fa-award"></i> Học khá 🎖️</div>';
    } else if (n >= 7.0) {
        return '<div class="medal-badge medal-bronze"><i class="fa-solid fa-award"></i> Học TB 🎖️</div>';
    } else {
        return '<div class="medal-badge" style="background: rgba(255, 51, 51, 0.15); border: 1px solid #FF3333; color: #FF3333; text-shadow: 0 0 5px rgba(255, 51, 51, 0.3);"><i class="fa-solid fa-triangle-exclamation"></i> Học yếu</div>';
    }
}

