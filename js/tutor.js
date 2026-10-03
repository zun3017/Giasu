window.__tutorThemeKey = window.__tutorThemeKey || function () { var p = ''; try { p = sessionStorage.getItem('userPhone') || ''; } catch (e) {} if (!p) { try { var d = JSON.parse(sessionStorage.getItem('dashboardData') || 'null'); p = (d && (d.tutorPhone || d.phone)) || ''; } catch (e) {} } var dir = (location.pathname || '/').replace(/[^\/]*$/, ''); return 'tutorTheme::' + dir + '::' + (p || 'guest'); };
var tutorChartInstance = null;
var tutorDataGlobal = null;
var currentTutorStudent = null;
var currentTutorPhone = "";
var pinVerifyAction = "deleteStudent";

// =====================================
// UTILITIES: ĐỊNH DẠNG SỐ & TIỀN TỆ (200.000)
// =====================================
function formatNumberWithDots(val) {
    if (val === undefined || val === null || val === '') return '';
    var rawVal = String(val).replace(/\D/g, '');
    if (!rawVal) return '';
    if (rawVal.length > 1) {
        rawVal = rawVal.replace(/^0+/, '') || '0';
    }
    return rawVal.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
window.formatNumberWithDots = formatNumberWithDots;

function formatCurrencyInput(el) {
    if (!el) return;
    var cursorPosition = el.selectionStart;
    var originalLength = el.value.length;
    var rawVal = el.value.replace(/\D/g, '');
    if (!rawVal) {
        el.value = '';
        return;
    }
    if (rawVal.length > 1) {
        rawVal = rawVal.replace(/^0+/, '') || '0';
    }
    var formatted = rawVal.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    el.value = formatted;
    var newLength = formatted.length;
    cursorPosition = cursorPosition + (newLength - originalLength);
    if (cursorPosition < 0) cursorPosition = 0;
    try {
        el.setSelectionRange(cursorPosition, cursorPosition);
    } catch (e) {}
}
window.formatCurrencyInput = formatCurrencyInput;

// Lắng nghe sự kiện input tự động format tiền tệ
document.addEventListener('input', function(e) {
    var target = e.target;
    if (!target) return;
    if (target.classList && target.classList.contains('currency-input')) {
        formatCurrencyInput(target);
    } else if (target.getAttribute && target.getAttribute('data-currency') === 'true') {
        formatCurrencyInput(target);
    } else if (['addStudentTuition', 'editStudentTuition', 'adminStudentTuition', 'eventFee', 'inputDiscountFee', 'inputSurchargeFee'].indexOf(target.id) !== -1) {
        formatCurrencyInput(target);
    }
}, true);

// =====================================
// BLOCK A: NEW CORE DASHBOARD & UTILITIES (MERGED FROM DEMO)
// =====================================
function getTutorStudentsResolved() {
    return (tutorDataGlobal && tutorDataGlobal.students && tutorDataGlobal.students.length > 0) ? tutorDataGlobal.students : [];
}
window.getTutorStudentsResolved = getTutorStudentsResolved;

function parseInputDate(str) {
    if (!str && str !== 0) return null;
    if (str instanceof Date) {
        return isNaN(str.getTime()) ? null : str;
    }
    if (typeof str === 'number') {
        var dNum = new Date(str);
        return isNaN(dNum.getTime()) ? null : dNum;
    }
    var s = String(str).trim();
    if (!s) return null;

    // Chuẩn hóa, loại bỏ thứ trong tuần như "Thứ 2, ", "Thứ Hai, ", "Chủ Nhật, ", "CN, ", "T2, "
    s = s.replace(/^(thứ\s*[\w\d]+|chủ\s*nhật|cn|t\d+)\s*[,.-]?\s*/i, '').trim();

    // 0. Khớp tiếng Việt: "Ngày DD tháng MM năm YYYY" hoặc "Ngày DD/MM/YYYY"
    var vnMatch = s.match(/(?:ngày\s*)?(\d{1,2})\s*(?:tháng|\/|-)\s*(\d{1,2})(?:\s*(?:năm|\/|-)\s*(\d{4}))?/i);
    if (s.toLowerCase().indexOf('ngày') !== -1 && vnMatch) {
        var d = parseInt(vnMatch[1], 10);
        var m = parseInt(vnMatch[2], 10) - 1;
        var y = vnMatch[3] ? parseInt(vnMatch[3], 10) : new Date().getFullYear();
        var date = new Date(y, m, d, 0, 0, 0, 0);
        return isNaN(date.getTime()) ? null : date;
    }

    // 1. Khớp ISO YYYY-MM-DD hoặc YYYY/MM/DD
    var isoMatch = s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/);
    if (isoMatch) {
        var y = parseInt(isoMatch[1], 10);
        var m = parseInt(isoMatch[2], 10) - 1;
        var d = parseInt(isoMatch[3], 10);
        var date = new Date(y, m, d, 0, 0, 0, 0);
        return isNaN(date.getTime()) ? null : date;
    }

    // 2. Khớp DD/MM/YYYY hoặc DD-MM-YYYY hoặc DD.MM.YYYY
    var dmyMatch = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})/);
    if (dmyMatch) {
        var d = parseInt(dmyMatch[1], 10);
        var m = parseInt(dmyMatch[2], 10) - 1;
        var y = parseInt(dmyMatch[3], 10);
        var date = new Date(y, m, d, 0, 0, 0, 0);
        return isNaN(date.getTime()) ? null : date;
    }

    // 3. Khớp DD/MM/YY
    var dmy2Match = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2})$/);
    if (dmy2Match) {
        var d = parseInt(dmy2Match[1], 10);
        var m = parseInt(dmy2Match[2], 10) - 1;
        var y = parseInt('20' + dmy2Match[3], 10);
        var date = new Date(y, m, d, 0, 0, 0, 0);
        return isNaN(date.getTime()) ? null : date;
    }

    // 4. Khớp MM/YYYY hoặc MM-YYYY (ví dụ: "10/2026", "09/2026") -> ngày 1 của tháng đó
    var myMatch = s.match(/^(\d{1,2})[-\/.](\d{4})$/);
    if (myMatch) {
        var m = parseInt(myMatch[1], 10) - 1;
        var y = parseInt(myMatch[2], 10);
        var date = new Date(y, m, 1, 0, 0, 0, 0);
        return isNaN(date.getTime()) ? null : date;
    }

    // 5. Khớp DD/MM hoặc DD-MM (mặc định năm hiện tại từ hệ thống)
    var dmMatch = s.match(/^(\d{1,2})[-\/.](\d{1,2})$/);
    if (dmMatch) {
        var d = parseInt(dmMatch[1], 10);
        var m = parseInt(dmMatch[2], 10) - 1;
        var y = new Date().getFullYear();
        var date = new Date(y, m, d, 0, 0, 0, 0);
        return isNaN(date.getTime()) ? null : date;
    }

    // Fallback phân tích Date thông thường
    var parsed = new Date(s);
    if (!isNaN(parsed.getTime())) {
        return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 0, 0, 0, 0);
    }
    return null;
}
window.parseInputDate = parseInputDate;

function parseLogDate(dmyStr) {
    return parseInputDate(dmyStr);
}
window.parseLogDate = parseLogDate;

function getMonthYearFromLogDate(dateStr) {
    if (!dateStr && dateStr !== 0) return null;
    var s = String(dateStr).trim();
    // Khớp trực tiếp MM/YYYY (ví dụ: "10/2026")
    var myDirect = s.match(/^(\d{1,2})\/(\d{4})$/);
    if (myDirect) {
        var mDirect = parseInt(myDirect[1], 10);
        var yDirect = parseInt(myDirect[2], 10);
        return {
            month: mDirect,
            year: yDirect,
            key: String(mDirect).padStart(2, '0') + '/' + yDirect
        };
    }
    var d = parseInputDate(dateStr);
    if (!d || isNaN(d.getTime())) return null;
    var m = d.getMonth() + 1;
    var y = d.getFullYear();
    return {
        month: m,
        year: y,
        key: String(m).padStart(2, '0') + '/' + y
    };
}
window.getMonthYearFromLogDate = getMonthYearFromLogDate;

// Helper tính đơn giá học phí thực tế của học sinh (không hardcode 200k)
function getStudentUnitFee(st) {
    if (!st) return 0;
    if (st.tuition !== undefined && st.tuition !== null && Number(st.tuition) > 0) {
        return Number(st.tuition);
    }
    if (st.tuition_fee !== undefined && st.tuition_fee !== null && Number(st.tuition_fee) > 0) {
        return Number(st.tuition_fee);
    }
    if (st.hocPhi !== undefined && st.hocPhi !== null && Number(st.hocPhi) > 0) {
        return Number(st.hocPhi);
    }
    if (st.fee) {
        var digits = String(st.fee).replace(/[^0-9]/g, '');
        var num = parseInt(digits, 10);
        if (!isNaN(num) && num > 0) {
            if (num < 1000 && /k/i.test(st.fee)) num *= 1000;
            return num;
        }
    }
    return 0;
}
window.getStudentUnitFee = getStudentUnitFee;

// Helper kiểm tra buổi học có phải buổi hủy / nghỉ / vắng không
function isAbsentLog(l) {
    if (!l) return false;
    var rawStatus = l.trangThai || l.chuyenCan || l.attendance_status || l.attendance || l.status || "";
    var normTt = String(rawStatus).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();
    var isDaBu = (normTt.includes("da bu") || normTt.includes("hoc bu"));
    return !isDaBu && (
        normTt.includes("nghi") || 
        normTt.includes("huy") || 
        normTt.includes("vang") || 
        normTt.includes("off") || 
        normTt.includes("khong hoc") || 
        normTt.includes("chua hoc") || 
        normTt.includes("tam hoan") || 
        normTt === "v" || 
        normTt === "n" || 
        normTt === "x"
    );
}
window.isAbsentLog = isAbsentLog;

// Helper tính tỷ lệ nộp BTVN thực tế từ danh sách nhật ký học sinh (hỗ trợ lọc theo tháng/năm)
function calcStudentHwRate(st, targetMonth, targetYear) {
    if (!st || !st.logs || !Array.isArray(st.logs) || st.logs.length === 0) {
        return "—";
    }
    var totalBtvn = 0;
    var completedBtvn = 0;
    st.logs.forEach(function(l) {
        if (!l) return;

        // Nếu có chỉ định targetMonth và targetYear thì lọc đúng tháng/năm đó
        if (targetMonth && targetYear) {
            var rawDate = l.studyDate || l.ngay || "";
            if (!rawDate) return;
            var my = getMonthYearFromLogDate(rawDate);
            if (!my || my.month !== targetMonth || my.year !== targetYear) return;
        }

        // Loại trừ các buổi hủy / nghỉ / vắng (không học thì không thể tính BTVN)
        if (isAbsentLog(l)) return;

        var btvnStr = String(l.danhGiaBTVN || l.btvn || l.hw_eval || "").trim().toLowerCase();
        if (!btvnStr || btvnStr === "-" || btvnStr === "—" || btvnStr === "không có" || btvnStr === "null" || btvnStr === "chưa có") return;
        totalBtvn++;
        var pctMatch = btvnStr.match(/(\d+(\.\d+)?)\s*%/);
        if (pctMatch) {
            var pVal = parseFloat(pctMatch[1]);
            if (!isNaN(pVal)) completedBtvn += Math.min(Math.max(pVal / 100.0, 0), 1.0);
        } else if (btvnStr.indexOf("không làm") !== -1 || btvnStr.indexOf("chưa làm") !== -1 || btvnStr.indexOf("chưa nộp") !== -1 || btvnStr === "không" || btvnStr.indexOf("chưa đạt") !== -1) {
            completedBtvn += 0;
        } else if (btvnStr.indexOf("thiếu") !== -1) {
            var m = btvnStr.match(/thiếu\s+(\d+)/);
            if (m) {
                var missing = parseInt(m[1], 10);
                var completed = Math.max(0, 5 - missing);
                completedBtvn += (completed / 5.0);
            } else {
                completedBtvn += 0.5;
            }
        } else {
            completedBtvn += 1.0;
        }
    });
    if (totalBtvn === 0) {
        return "—";
    }
    return Math.round((completedBtvn / totalBtvn) * 100) + "%";
}
window.calcStudentHwRate = calcStudentHwRate;

// Helper xác định màu sắc học sinh động không giới hạn
function getStudentColor(name) {
    if (!name) return '#8B5CF6';
    var n = String(name).trim();
    if (window.tutorDataGlobal && window.tutorDataGlobal.students) {
        var idx = window.tutorDataGlobal.students.findIndex(function(s) {
            return s && s.name && s.name.trim().toLowerCase() === n.toLowerCase();
        });
        if (idx !== -1) {
            var st = window.tutorDataGlobal.students[idx];
            if (st.color) return st.color;
            var saved = localStorage.getItem('student_color_' + n);
            if (saved) return saved;
            var palette = ['#8B5CF6', '#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#06B6D4', '#84CC16', '#F97316'];
            return palette[idx % palette.length];
        }
    }
    var savedCol = localStorage.getItem('student_color_' + n);
    if (savedCol) return savedCol;
    var hash = 0;
    for (var i = 0; i < n.length; i++) {
        hash = n.charCodeAt(i) + ((hash << 5) - hash);
    }
    var palette = ['#8B5CF6', '#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#06B6D4', '#84CC16', '#F97316'];
    var cIndex = Math.abs(hash) % palette.length;
    return palette[cIndex];
}
window.getStudentColor = getStudentColor;

function getStudentStyle(name) {
    var c = getStudentColor(name);
    return {
        bg: "var(--nav-active-bg)",
        border: c,
        text: c
    };
}
window.getStudentStyle = getStudentStyle;

function formatDateOnly(dStr) {
    if (typeof window.formatDateOnly === 'function' && window.formatDateOnly !== formatDateOnly) {
        return window.formatDateOnly(dStr);
    }
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
    return s.split(' ')[0];
}
window.formatDateOnly = formatDateOnly;

function formatScheduleCell(val) {
    if (!val || val.trim() === "") {
        return "<span style='color: var(--text-muted); font-weight: normal;'>-</span>";
    }
    return "<span style='color: var(--text-primary); font-weight:600; font-size:13.5px; white-space:nowrap;'>" + escapeHtml(val) + "</span>";
}

var tutorOverviewMonth = new Date().getMonth() + 1;
var tutorOverviewYear = new Date().getFullYear();

function updateOverviewMonthSelectorUI() {
    var displayEl = document.getElementById('overviewMonthDisplay');
    var nextBtn = document.getElementById('overviewNextMonthBtn');
    if (displayEl) {
        displayEl.innerText = "Tháng " + tutorOverviewMonth + "/" + tutorOverviewYear;
    }
    var now = new Date();
    var curM = now.getMonth() + 1;
    var curY = now.getFullYear();
    var isCurrentOrFuture = (tutorOverviewYear > curY) || (tutorOverviewYear === curY && tutorOverviewMonth >= curM);
    if (nextBtn) {
        nextBtn.disabled = isCurrentOrFuture;
        nextBtn.style.opacity = isCurrentOrFuture ? "0.3" : "1";
        nextBtn.style.cursor = isCurrentOrFuture ? "not-allowed" : "pointer";
    }
}
window.updateOverviewMonthSelectorUI = updateOverviewMonthSelectorUI;

function navigateOverviewMonth(delta) {
    var now = new Date();
    var curM = now.getMonth() + 1;
    var curY = now.getFullYear();

    var nextM = tutorOverviewMonth + delta;
    var nextY = tutorOverviewYear;
    if (nextM < 1) {
        nextM = 12;
        nextY--;
    } else if (nextM > 12) {
        nextM = 1;
        nextY++;
    }

    // Do not allow selecting future months
    if (nextY > curY || (nextY === curY && nextM > curM)) {
        return;
    }

    tutorOverviewMonth = nextM;
    tutorOverviewYear = nextY;
    updateOverviewMonthSelectorUI();
    renderTutorKpiCards(null, tutorOverviewMonth, tutorOverviewYear);
    renderUpcomingSchedule(null, tutorOverviewMonth, tutorOverviewYear);
    if (typeof renderOverviewCharts === 'function') {
        renderOverviewCharts(tutorOverviewMonth, tutorOverviewYear);
    }
    if (typeof renderTutorStudentsGrid === 'function') {
        renderTutorStudentsGrid();
    }
}
window.navigateOverviewMonth = navigateOverviewMonth;

/**
 * Animate số từ 0 lên giá trị đích
 * @param {HTMLElement} el - Element cần animate
 * @param {number} endVal - Giá trị đích
 * @param {string} suffix - Hậu tố (vd: 'đ', 'h', '')
 * @param {number} duration - Thời gian ms (default 1200)
 * @param {boolean} isCurrency - Format tiền VNĐ
 * @param {number} decimals - Số chữ số thập phân (default 0)
 */
function animateCountUp(el, endVal, suffix, duration, isCurrency, decimals) {
    if (!el || isNaN(endVal)) return;
    suffix = suffix || '';
    duration = duration || 1200;
    decimals = (typeof decimals === 'number') ? decimals : 0;
    var startTime = null;
    var startVal = 0;
    
    function easeOutQuart(t) {
        return 1 - Math.pow(1 - t, 4);
    }
    
    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
        var easedProgress = easeOutQuart(progress);
        var current = startVal + (endVal - startVal) * easedProgress;
        
        if (isCurrency) {
            el.textContent = Math.round(current).toLocaleString('vi-VN') + suffix;
        } else if (decimals > 0) {
            el.textContent = current.toFixed(decimals) + suffix;
        } else {
            el.textContent = Math.round(current) + suffix;
        }
        
        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            if (isCurrency) {
                el.textContent = Math.round(endVal).toLocaleString('vi-VN') + suffix;
            } else if (decimals > 0) {
                el.textContent = endVal.toFixed(decimals) + suffix;
            } else {
                el.textContent = endVal + suffix;
            }
        }
    }
    
    requestAnimationFrame(step);
}
window.animateCountUp = animateCountUp;

function renderTutorKpiCards(data, selM, selY) {
    // Ẩn skeleton overview và hiện nội dung thực
    var skeletonEl = document.getElementById('skeletonOverview');
    if (skeletonEl) skeletonEl.style.display = 'none';
    var kpiGrid = document.getElementById('tutorKpiGrid');
    if (kpiGrid) kpiGrid.style.display = '';
    var scheduleBox = document.getElementById('tutorUpcomingScheduleBox');
    if (scheduleBox) scheduleBox.style.display = '';
    var chartBox = document.getElementById('revenueBarChartBox');
    if (chartBox) chartBox.style.display = '';

    var studentCountEl = document.getElementById('kpiStudentCount');
    var sessionCountEl = document.getElementById('kpiSessionCount');
    var totalHoursEl = document.getElementById('kpiTotalHours');
    var tuitionTotalEl = document.getElementById('kpiTuitionTotal');
    var sessionLabelEl = document.getElementById('kpiSessionLabel');
    var tuitionLabelEl = document.getElementById('kpiTuitionLabel');

    if (!studentCountEl) return;

    selM = selM || tutorOverviewMonth || (new Date().getMonth() + 1);
    selY = selY || tutorOverviewYear || (new Date().getFullYear());

    var now = new Date();
    var curM = now.getMonth() + 1;
    var curY = now.getFullYear();
    var isCurrentMonth = (selM === curM && selY === curY);

    if (sessionLabelEl) {
        sessionLabelEl.innerText = isCurrentMonth ? "Buổi dạy tháng này" : ("Buổi dạy Tháng " + selM);
    }
    if (tuitionLabelEl) {
        tuitionLabelEl.innerText = isCurrentMonth ? "Học phí tháng này" : ("Học phí Tháng " + selM);
    }

    var students = (tutorDataGlobal && tutorDataGlobal.students ? tutorDataGlobal.students : []);

    var count = students.length;
    var totalSessions = 0;
    var totalFee = 0;

    students.forEach(function(st) {
        var unit = getStudentUnitFee(st);
        var bType = st.billing_type || st.billingType || 'session';
        var stSessions = 0;
        if (st.logs && Array.isArray(st.logs)) {
            st.logs.forEach(function(log) {
                if (!log || !log.ngay) return;
                var my = getMonthYearFromLogDate(log.ngay);
                if (!my || my.month !== selM || my.year !== selY) return;

                var rawStatus = log.trangThai || log.chuyenCan || log.attendance_status || log.attendance || log.status || "";
                var normTt = String(rawStatus).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();
                var isDaBu = (normTt.includes("da bu") || normTt.includes("hoc bu"));
                var isAbsent = !isDaBu && (
                    normTt.includes("nghi") || 
                    normTt.includes("huy") || 
                    normTt.includes("vang") || 
                    normTt.includes("off") || 
                    normTt.includes("khong hoc") ||
                    normTt.includes("chua hoc") ||
                    normTt.includes("tam hoan") ||
                    normTt === "v" || 
                    normTt === "n" || 
                    normTt === "x"
                );
                if (isAbsent) return;

                stSessions++;
                totalSessions++;
            });
        }
        if (bType === 'month' || bType === 'monthly') {
            if (stSessions > 0) totalFee += unit;
        } else {
            totalFee += (stSessions * unit);
        }
    });

    var totalHours = totalSessions * 1.5;
    var hoursDecimals = (totalHours % 1 === 0) ? 0 : 1;

    animateCountUp(studentCountEl, count, '', 1000, false, 0);
    animateCountUp(sessionCountEl, totalSessions, '', 1000, false, 0);
    animateCountUp(totalHoursEl, totalHours, 'h', 1200, false, hoursDecimals);
    animateCountUp(tuitionTotalEl, totalFee, 'đ', 1400, true, 0);
}
window.renderTutorKpiCards = renderTutorKpiCards;

function renderUpcomingSchedule(scheduleList, selM, selY) {
    var todayListEl = document.getElementById('upcomingTodayList');
    var tomorrowListEl = document.getElementById('upcomingTomorrowList');
    var todayTitleEl = document.getElementById('upcomingTodayHeaderTitle');
    var tomorrowTitleEl = document.getElementById('upcomingTomorrowHeaderTitle');
    var todayCountBadge = document.getElementById('upcomingTodayCountBadge');
    var tomorrowCountBadge = document.getElementById('upcomingTomorrowCountBadge');
    var mainTitleEl = document.getElementById('upcomingScheduleTitleText');
    var subtextEl = document.getElementById('upcomingScheduleSubtext');

    if (!todayListEl || !tomorrowListEl) return;

    selM = selM || tutorOverviewMonth || (new Date().getMonth() + 1);
    selY = selY || tutorOverviewYear || (new Date().getFullYear());

    var now = new Date();
    var curM = now.getMonth() + 1;
    var curY = now.getFullYear();
    var isCurrentMonth = (selM === curM && selY === curY);

    var sched = scheduleList;
    if (!sched || sched.length === 0) {
        try {
            var calFrame = document.getElementById('tutorCalendarIframe');
            if (calFrame && calFrame.contentWindow && Array.isArray(calFrame.contentWindow.tutorScheduleSheetData) && calFrame.contentWindow.tutorScheduleSheetData.length > 0) {
                sched = calFrame.contentWindow.tutorScheduleSheetData;
                lastLoadedTutorSchedule = sched;
            }
        } catch(e) {}
    }
    if (!sched || sched.length === 0) {
        sched = lastLoadedTutorSchedule || [];
    }
    var students = (tutorDataGlobal && tutorDataGlobal.students ? tutorDataGlobal.students : []);

    // Helper map subject & style
    var subjectMap = {};
    students.forEach(function(st) {
        subjectMap[st.name.trim()] = st.subject || "Gia sư";
    });

    // Using global getStudentStyle(name) for all students

    if (isCurrentMonth) {
        if (mainTitleEl) mainTitleEl.innerText = "Lịch dạy sắp tới";
        if (subtextEl) subtextEl.innerHTML = '<i class="fa-solid fa-bolt" style="color: var(--color-primary);"></i> Hôm nay & Ngày mai';

        var dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        var today = new Date();
        var tomorrow = new Date(today.getTime() + 86400000);

        var todayKey = dayKeys[today.getDay()];
        var tomorrowKey = dayKeys[tomorrow.getDay()];

        function formatDmy(d) {
            var day = String(d.getDate()).padStart(2, '0');
            var month = String(d.getMonth() + 1).padStart(2, '0');
            var year = d.getFullYear();
            return day + "/" + month + "/" + year;
        }

        var todayDmyStr = formatDmy(today);
        var tomorrowDmyStr = formatDmy(tomorrow);

        var fmtFn = (typeof window.formatDateWithDayOfWeek === 'function') 
            ? window.formatDateWithDayOfWeek 
            : function(str) { return str; };

        var todayDateFormatted = fmtFn(todayDmyStr);
        var tomorrowDateFormatted = fmtFn(tomorrowDmyStr);

        if (todayTitleEl) {
            todayTitleEl.innerHTML = '<i class="fa-solid fa-sun" style="color: var(--color-primary); margin-right: 6px;"></i> Hôm nay — ' + todayDateFormatted;
        }
        if (tomorrowTitleEl) {
            tomorrowTitleEl.innerHTML = '<i class="fa-solid fa-calendar-day" style="color: var(--color-primary); margin-right: 6px;"></i> Ngày mai — ' + tomorrowDateFormatted;
        }

        // Deduplicate sched by studentName (normalized lowercase)
        var dedupedSched = [];
        var seenStudentMap = new Map();
        if (Array.isArray(sched)) {
            sched.forEach(function(s) {
                if (!s || !s.studentName) return;
                var norm = s.studentName.trim().toLowerCase();
                if (!seenStudentMap.has(norm)) {
                    var copy = Object.assign({}, s);
                    seenStudentMap.set(norm, copy);
                    dedupedSched.push(copy);
                } else {
                    // Nếu có nhiều hàng trùng tên, gộp các ô lịch
                    var existing = seenStudentMap.get(norm);
                    dayKeys.forEach(function(dk) {
                        if (s[dk] && String(s[dk]).trim()) {
                            if (!existing[dk] || !String(existing[dk]).trim()) {
                                existing[dk] = String(s[dk]).trim();
                            } else if (String(existing[dk]).trim() !== String(s[dk]).trim()) {
                                var exSlots = String(existing[dk]).split('|').map(function(x){ return x.trim(); });
                                var newSlots = String(s[dk]).split('|').map(function(x){ return x.trim(); });
                                newSlots.forEach(function(ns) {
                                    if (ns && !exSlots.includes(ns)) exSlots.push(ns);
                                });
                                existing[dk] = exSlots.join(' | ');
                            }
                        }
                    });
                }
            });
        }

        function buildItems(dayKey, targetDateStr) {
            var items = [];
            var seenSlotTimes = new Set(); // tránh trùng lặp cùng 1 học sinh cùng 1 khung giờ

            dedupedSched.forEach(function(s) {
                var studentDisplayName = s.studentName.trim();
                var studentNorm = studentDisplayName.toLowerCase();

                // Lấy tất cả các slot có thể áp dụng cho ngày này:
                // 1. Các slot trong đúng cột dayKey (lịch cố định hàng tuần và ca 1 lần đúng ngày)
                // 2. Các slot 1 lần có ngày cụ thể trùng với targetDateStr ở bất kỳ cột nào
                var potentialSlots = [];

                if (s[dayKey] && String(s[dayKey]).trim() !== '') {
                    var daySlots = String(s[dayKey]).split('|').map(function(x) { return x.trim(); }).filter(function(x) { return x !== ''; });
                    daySlots.forEach(function(sl) { potentialSlots.push({ slotVal: sl, isMainDay: true }); });
                }

                dayKeys.forEach(function(otherKey) {
                    if (otherKey !== dayKey && s[otherKey] && String(s[otherKey]).trim() !== '') {
                        var otherSlots = String(s[otherKey]).split('|').map(function(x) { return x.trim(); }).filter(function(x) { return x !== ''; });
                        otherSlots.forEach(function(sl) {
                            if (sl.includes(targetDateStr)) {
                                potentialSlots.push({ slotVal: sl, isMainDay: false });
                            }
                        });
                    }
                });

                potentialSlots.forEach(function(slotObj) {
                    var slotVal = slotObj.slotVal;

                    // 0. Bóc màu session [C:#RRGGBB]
                    var sessionColor = '';
                    var colorMatch = slotVal.match(/^\[C:(#[0-9A-Fa-f]{6})\]/);
                    if (colorMatch) {
                        sessionColor = colorMatch[1];
                        slotVal = slotVal.replace(/^\[C:(#[0-9A-Fa-f]{6})\]/, '').trim();
                    }

                    // 1. Bóc SKIP marker
                    var skipDates = [];
                    var rawVal = slotVal;
                    if (rawVal.includes(' SKIP ')) {
                        var p = rawVal.split(' SKIP ');
                        rawVal = p[0].trim();
                        skipDates = p[1].split(',').map(function(d) { return d.trim(); });
                    }
                    if (skipDates.includes(targetDateStr)) return;

                    // 2. Bóc ngày cụ thể (1 lần hoặc RESCHEDULE)
                    var datePrefixRegex = /^(\d{2})\/(\d{2})\/(\d{4}):\s*/;
                    var rescheduleRegex = /^RESCHEDULE (\d{2})\/(\d{2})\/(\d{4}):\s*/;

                    var isOneTime = false;
                    var isReschedule = false;
                    var eventDateStr = '';
                    var cleanTimeStr = rawVal;

                    var reschedMatch = rawVal.match(rescheduleRegex);
                    var dateMatch = rawVal.match(datePrefixRegex);

                    if (reschedMatch) {
                        isReschedule = true;
                        eventDateStr = reschedMatch[1] + '/' + reschedMatch[2] + '/' + reschedMatch[3];
                        cleanTimeStr = rawVal.replace(rescheduleRegex, '').trim();
                    } else if (dateMatch) {
                        isOneTime = true;
                        eventDateStr = dateMatch[1] + '/' + dateMatch[2] + '/' + dateMatch[3];
                        cleanTimeStr = rawVal.replace(datePrefixRegex, '').trim();
                    }

                    // Nếu là ca 1 lần hoặc dời lịch mà ngày không khớp targetDateStr thì bỏ qua
                    if ((isOneTime || isReschedule) && eventDateStr !== targetDateStr) {
                        return;
                    }
                    // Nếu là slot cố định hàng tuần nhưng lại lấy từ cột khác không phải dayKey thì bỏ qua
                    if (!isOneTime && !isReschedule && !slotObj.isMainDay) {
                        return;
                    }

                    // 3. Kiểm tra hủy
                    var isCancelled = /\[CANCELLED\]|\[HỦY\]|\[HUY\]/i.test(rawVal) || /đã hủy|báo nghỉ|nghỉ học/i.test(cleanTimeStr);
                    if (isCancelled) return;

                    // 4. Trích xuất giờ
                    var timeRegex = /(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/;
                    var timeMatch = cleanTimeStr.match(timeRegex);
                    if (!timeMatch) return;

                    var timeDisplay = timeMatch[1] + ' - ' + timeMatch[2];
                    var notes = cleanTimeStr.replace(timeRegex, '').trim().replace(/^[\(\[\s\-]+|[\)\]\s]+$/g, '');

                    // Tránh trùng lặp cùng 1 học sinh cùng 1 giờ
                    var uniqueKey = studentNorm + '_' + timeDisplay;
                    if (seenSlotTimes.has(uniqueKey)) return;
                    seenSlotTimes.add(uniqueKey);

                    var sSubject = subjectMap[studentDisplayName] || s.subject || "Gia sư 1-1";
                    if (notes) {
                        sSubject += " (" + notes + ")";
                    }
                    if (isOneTime) {
                        sSubject += " [1 Lần]";
                    } else if (isReschedule) {
                        sSubject += " [Dời sang]";
                    }

                    items.push({
                        studentName: studentDisplayName,
                        time: timeDisplay,
                        subject: sSubject,
                        color: sessionColor || s.color || ""
                    });
                });
            });

            // Sắp xếp theo giờ tăng dần
            items.sort(function(a, b) {
                return (a.time || '').localeCompare(b.time || '');
            });

            return items;
        }

        var todayItems = buildItems(todayKey, todayDmyStr);
        var tomorrowItems = buildItems(tomorrowKey, tomorrowDmyStr);

        if (todayCountBadge) todayCountBadge.innerText = todayItems.length + " buổi";
        if (tomorrowCountBadge) tomorrowCountBadge.innerText = tomorrowItems.length + " buổi";

        // Render Hôm nay
        if (todayItems.length === 0) {
            todayListEl.innerHTML = '<div class="upcoming-empty-card"><i class="fa-solid fa-face-smile-beam" style="font-size: 22px; color: #10B981; margin-bottom: 6px;"></i><span>Không có lịch dạy hôm nay 🎉</span></div>';
        } else {
            var html = "";
            todayItems.forEach(function(it) {
                var st = getStudentStyle(it.studentName);
                var customBorder = it.color || st.border;
                html += '<div class="upcoming-session-card">' +
                    '<div class="upcoming-session-info">' +
                        '<span class="upcoming-student-tag" style="background: ' + escapeHtml(st.bg) + '; border-color: ' + escapeHtml(customBorder) + '; color: ' + escapeHtml(st.text) + ';"><i class="fa-solid fa-user-graduate"></i> ' + escapeHtml(it.studentName) + '</span>' +
                        '<span class="upcoming-subject-badge"><i class="fa-solid fa-book-bookmark" style="color: var(--color-primary);"></i> ' + escapeHtml(it.subject) + '</span>' +
                    '</div>' +
                    '<span class="upcoming-time-badge"><i class="fa-regular fa-clock"></i> ' + escapeHtml(it.time) + '</span>' +
                '</div>';
            });
            todayListEl.innerHTML = html;
        }

        // Render Ngày mai
        if (tomorrowItems.length === 0) {
            tomorrowListEl.innerHTML = '<div class="upcoming-empty-card"><i class="fa-solid fa-mug-hot" style="font-size: 20px; color: #8E95BE; margin-bottom: 6px;"></i><span>Không có lịch dạy ngày mai 🎉</span></div>';
        } else {
            var html = "";
            tomorrowItems.forEach(function(it) {
                var st = getStudentStyle(it.studentName);
                var customBorder = it.color || st.border;
                html += '<div class="upcoming-session-card">' +
                    '<div class="upcoming-session-info">' +
                        '<span class="upcoming-student-tag" style="background: ' + escapeHtml(st.bg) + '; border-color: ' + escapeHtml(customBorder) + '; color: ' + escapeHtml(st.text) + ';"><i class="fa-solid fa-user-graduate"></i> ' + escapeHtml(it.studentName) + '</span>' +
                        '<span class="upcoming-subject-badge"><i class="fa-solid fa-book-bookmark" style="color: var(--color-primary);"></i> ' + escapeHtml(it.subject) + '</span>' +
                    '</div>' +
                    '<span class="upcoming-time-badge"><i class="fa-regular fa-clock"></i> ' + escapeHtml(it.time) + '</span>' +
                '</div>';
            });
            tomorrowListEl.innerHTML = html;
        }
    } else {
        // Viewing past month: show sessions conducted in that month from student logs
        if (mainTitleEl) mainTitleEl.innerText = "Lịch dạy Tháng " + selM + "/" + selY;
        if (subtextEl) subtextEl.innerHTML = '<i class="fa-solid fa-history" style="color: var(--color-primary);"></i> Dữ liệu lịch sử Tháng ' + selM + '/' + selY;

        var monthLogs = [];
        students.forEach(function(st) {
            if (st.logs && Array.isArray(st.logs)) {
                st.logs.forEach(function(log) {
                    if (log && log.ngay) {
                        var my = getMonthYearFromLogDate(log.ngay);
                        if (my && my.month === selM && my.year === selY) {
                            monthLogs.push({
                                studentName: st.name.trim(),
                                date: log.ngay,
                                topic: log.topic || log.noiDung || "",
                                chuyenCan: log.chuyenCan || log.trangThai || "Có mặt",
                                subject: subjectMap[st.name.trim()] || st.subject || "Gia sư 1-1"
                            });
                        }
                    }
                });
            }
        });

        var half = Math.ceil(monthLogs.length / 2);
        var firstHalf = monthLogs.slice(0, half);
        var secondHalf = monthLogs.slice(half);

        if (todayTitleEl) {
            todayTitleEl.innerHTML = '<i class="fa-solid fa-calendar-check" style="color: var(--color-primary); margin-right: 6px;"></i> Buổi dạy đầu tháng (' + firstHalf.length + ')';
        }
        if (tomorrowTitleEl) {
            tomorrowTitleEl.innerHTML = '<i class="fa-solid fa-calendar-check" style="color: var(--color-primary); margin-right: 6px;"></i> Buổi dạy cuối tháng (' + secondHalf.length + ')';
        }
        if (todayCountBadge) todayCountBadge.innerText = firstHalf.length + " buổi";
        if (tomorrowCountBadge) tomorrowCountBadge.innerText = secondHalf.length + " buổi";

        function renderMonthLogs(listEl, items, emptyText) {
            if (!items || items.length === 0) {
                listEl.innerHTML = '<div class="upcoming-empty-card"><i class="fa-regular fa-calendar-xmark" style="font-size: 20px; color: #8E95BE; margin-bottom: 6px;"></i><span>' + emptyText + '</span></div>';
            } else {
                var html = "";
                items.forEach(function(it) {
                    var st = getStudentStyle(it.studentName);
                    html += '<div class="upcoming-session-card">' +
                        '<div class="upcoming-session-info">' +
                            '<span class="upcoming-student-tag" style="background: ' + escapeHtml(st.bg) + '; border-color: ' + escapeHtml(st.border) + '; color: ' + escapeHtml(st.text) + ';"><i class="fa-solid fa-user-graduate"></i> ' + escapeHtml(it.studentName) + '</span>' +
                            '<span class="upcoming-subject-badge" title="' + escapeHtml(it.topic) + '"><i class="fa-solid fa-book-bookmark" style="color: var(--color-primary);"></i> ' + escapeHtml(it.topic ? (it.topic.length > 25 ? it.topic.substring(0, 25) + '...' : it.topic) : it.subject) + '</span>' +
                        '</div>' +
                        '<span class="upcoming-time-badge"><i class="fa-regular fa-calendar"></i> ' + escapeHtml(it.date) + '</span>' +
                    '</div>';
                });
                listEl.innerHTML = html;
            }
        }

        renderMonthLogs(todayListEl, firstHalf, "Không có buổi dạy ghi nhận");
        renderMonthLogs(tomorrowListEl, secondHalf, "Không có buổi dạy ghi nhận");
    }
}
window.renderUpcomingSchedule = renderUpcomingSchedule;

/* ==========================================================================
   Phase 8: Overview Charts - Revenue Bar Chart & Student Donut Chart
   ========================================================================== */
var revenueBarChartInstance = null;

function renderRevenueBarChart(selM, selY) {
    var canvasEl = document.getElementById('revenueBarChartCanvas');
    if (!canvasEl) return;
    if (typeof Chart === 'undefined') return;

    var periodSelect = document.getElementById('revenuePeriodFilter');
    var period = periodSelect ? parseInt(periodSelect.value, 10) : 12;
    if (isNaN(period) || period <= 0) period = 12;

    var yearSelect = document.getElementById('revenueYearFilter');
    // If selY passed (e.g. from top month navigator), sync year select if available
    if (selY && yearSelect) {
        var strY = String(selY);
        for (var i = 0; i < yearSelect.options.length; i++) {
            if (yearSelect.options[i].value === strY) {
                yearSelect.value = strY;
                break;
            }
        }
    }
    var year = yearSelect ? parseInt(yearSelect.value, 10) : 2026;
    if (isNaN(year)) year = 2026;

    var chartTitleEl = document.getElementById('revenueChartTitle');
    if (chartTitleEl) {
        if (year === 2026) {
            chartTitleEl.innerText = "Doanh thu " + period + " tháng";
        } else {
            chartTitleEl.innerText = "Doanh thu " + period + " tháng (" + year + ")";
        }
    }

    // Calculate actual revenue from real student logs in database
    var students = (tutorDataGlobal && tutorDataGlobal.students ? tutorDataGlobal.students : []);

    var actualMonthlyRevenue = {};
    students.forEach(function(st) {
        var unit = getStudentUnitFee(st);
        var bType = st.billing_type || st.billingType || 'session';
        var sessionsPerMonth = {};

        if (st.logs && Array.isArray(st.logs)) {
            st.logs.forEach(function(log) {
                if (!log || !log.ngay) return;
                var my = getMonthYearFromLogDate(log.ngay);
                if (!my || my.year !== year || my.month < 1 || my.month > 12) return;

                var rawStatus = log.trangThai || log.chuyenCan || log.attendance_status || log.attendance || log.status || "";
                var normTt = String(rawStatus).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();
                var isDaBu = (normTt.includes("da bu") || normTt.includes("hoc bu"));
                var isAbsent = !isDaBu && (
                    normTt.includes("nghi") || 
                    normTt.includes("huy") || 
                    normTt.includes("vang") || 
                    normTt.includes("off") || 
                    normTt.includes("khong hoc") ||
                    normTt.includes("chua hoc") ||
                    normTt.includes("tam hoan") ||
                    normTt === "v" || 
                    normTt === "n" || 
                    normTt === "x"
                );
                if (isAbsent) return;

                sessionsPerMonth[my.month] = (sessionsPerMonth[my.month] || 0) + 1;
            });
        }

        for (var m = 1; m <= 12; m++) {
            var sess = sessionsPerMonth[m] || 0;
            if (sess > 0) {
                var fee = (bType === 'month' || bType === 'monthly') ? unit : (sess * unit);
                actualMonthlyRevenue[m] = (actualMonthlyRevenue[m] || 0) + fee;
            }
        }
    });

    var labels = [];
    var dataValues = [];
    var periodTotal = 0;

    var startMonth = 1;
    var endMonth = 12;
    if (period === 6) {
        startMonth = 7;
        endMonth = 12;
    } else if (period === 3) {
        startMonth = 10;
        endMonth = 12;
    }

    for (var m = startMonth; m <= endMonth; m++) {
        labels.push("T" + m);
        var val = (actualMonthlyRevenue[m] && actualMonthlyRevenue[m] > 0) ? actualMonthlyRevenue[m] : 0;
        dataValues.push(val);
        periodTotal += val;
    }

    var totalEl = document.getElementById('revenuePeriodTotal');
    if (totalEl) {
        totalEl.innerText = periodTotal.toLocaleString('vi-VN') + " đ";
    }

    var maxVal = Math.max.apply(null, dataValues);
    if (maxVal <= 0) maxVal = 2000000;

    var ctx = canvasEl.getContext('2d');
    if (revenueBarChartInstance) {
        revenueBarChartInstance.destroy();
        revenueBarChartInstance = null;
    }

    // Top data labels plugin (Biểu đồ đường - hiển thị số tiền phía trên mỗi điểm)
    var topLabelsPlugin = {
        id: 'topDataLabels',
        afterDatasetsDraw: function(chart) {
            var c = chart.ctx;
            var meta = chart.getDatasetMeta(0);
            if (!meta || !meta.data) return;

            c.save();
            c.font = '600 10.5px Inter, -apple-system, sans-serif';
            c.textAlign = 'center';
            c.textBaseline = 'bottom';
            c.fillStyle = '#94A3B8';

            meta.data.forEach(function(item, idx) {
                var v = dataValues[idx] || 0;
                var text = "";
                if (v === 0) {
                    text = "0đ";
                } else if (v >= 1000000) {
                    text = (v / 1000000).toFixed(1).replace('.', ',') + 'tr';
                } else {
                    text = (v / 1000).toFixed(0) + 'k';
                }
                c.fillText(text, item.x, item.y - 8);
            });
            c.restore();
        }
    };

    var themeComp = getComputedStyle(document.documentElement);
    var chartThemeBar = (themeComp.getPropertyValue('--chart-bar') || '#4A72E8').trim();
    var chartThemeRgb = (themeComp.getPropertyValue('--chart-bar-rgb') || '74, 114, 232').trim();

    var lineGrad = ctx.createLinearGradient(0, 0, 0, 220);
    lineGrad.addColorStop(0, 'rgba(' + chartThemeRgb + ', 0.38)');
    lineGrad.addColorStop(1, 'rgba(' + chartThemeRgb + ', 0.01)');

    var datasets = [{
        label: 'Doanh thu',
        data: dataValues,
        borderColor: chartThemeBar,
        borderWidth: 3,
        backgroundColor: lineGrad,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: chartThemeBar,
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        pointRadius: 4.5,
        pointHoverRadius: 7
    }];

    revenueBarChartInstance = new Chart(ctx, {
        type: 'line',
        plugins: [topLabelsPlugin],
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            animation: {
                duration: 1200,
                easing: 'easeOutQuart'
            },
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: (getComputedStyle(document.documentElement).getPropertyValue('--bg-card-alt') || '#1E2235').trim(),
                    titleColor: '#FFFFFF',
                    titleFont: { family: 'Inter', size: 12, weight: 'bold' },
                    bodyColor: '#10B981',
                    bodyFont: { family: 'Inter', size: 12, weight: 'bold' },
                    borderColor: 'rgba(74, 114, 232, 0.4)',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return 'Doanh thu: ' + Number(context.parsed.y).toLocaleString('vi-VN') + ' đ';
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
                    suggestedMax: maxVal * 1.3
                }
            }
        }
    });
}
window.renderRevenueBarChart = renderRevenueBarChart;
window.updateRevenueBarChart = renderRevenueBarChart;
var studentRevenueDonutInstance = null;

function renderStudentRevenueDonut(selM, selY) {
    var canvasEl = document.getElementById('studentRevenueDonutCanvas');
    if (!canvasEl) return;
    if (typeof Chart === 'undefined') return;

    var filterSelect = document.getElementById('studentRevenueMonthFilter');

    // If selM, selY passed, update the select if available
    if (selM && selY && filterSelect) {
        var optVal = selM + "/" + selY;
        var found = false;
        for (var i = 0; i < filterSelect.options.length; i++) {
            if (filterSelect.options[i].value === optVal) {
                filterSelect.selectedIndex = i;
                found = true;
                break;
            }
        }
        if (!found) {
            var opt = document.createElement('option');
            opt.value = optVal;
            opt.innerText = "Tháng " + optVal;
            filterSelect.appendChild(opt);
            filterSelect.value = optVal;
        }
    }

    var selectedVal = filterSelect ? filterSelect.value : "";
    var m = selM || tutorOverviewMonth || (new Date().getMonth() + 1);
    var y = selY || tutorOverviewYear || (new Date().getFullYear());
    if (selectedVal && selectedVal.indexOf('/') !== -1) {
        var parts = selectedVal.split('/');
        m = parseInt(parts[0], 10);
        y = parseInt(parts[1], 10);
    }

    var subtitleEl = document.getElementById('studentRevenueSubtitle');
    if (subtitleEl) {
        subtitleEl.innerText = "Phân bổ doanh thu Tháng " + m + "/" + y;
    }

    var students = (tutorDataGlobal && tutorDataGlobal.students ? tutorDataGlobal.students : []);

    var studentStats = [];
    var totalMonthRevenue = 0;

    students.forEach(function(st, idx) {
        var unit = getStudentUnitFee(st);
        var sessions = 0;
        var revenue = 0;

        var bType = st.billing_type || st.billingType || 'session';
        if (st.logs && Array.isArray(st.logs)) {
            st.logs.forEach(function(log) {
                if (!log || !log.ngay) return;
                var my = getMonthYearFromLogDate(log.ngay);
                if (!my || my.month !== m || my.year !== y) return;

                var rawStatus = log.trangThai || log.chuyenCan || log.attendance_status || log.attendance || log.status || "";
                var normTt = String(rawStatus).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();
                var isDaBu = (normTt.includes("da bu") || normTt.includes("hoc bu"));
                var isAbsent = !isDaBu && (
                    normTt.includes("nghi") || 
                    normTt.includes("huy") || 
                    normTt.includes("vang") || 
                    normTt.includes("off") || 
                    normTt.includes("khong hoc") ||
                    normTt.includes("chua hoc") ||
                    normTt.includes("tam hoan") ||
                    normTt === "v" || 
                    normTt === "n" || 
                    normTt === "x"
                );
                if (isAbsent) return;

                sessions++;
            });
        }
        if (bType === 'month' || bType === 'monthly') {
            if (sessions > 0) revenue = unit;
        } else {
            revenue = sessions * unit;
        }

        var color = getStudentColor(st.name.trim());

        studentStats.push({
            name: st.name.trim(),
            sessions: sessions,
            revenue: revenue,
            color: color
        });
        totalMonthRevenue += revenue;
    });

    // Sort descending by revenue
    studentStats.sort(function(a, b) {
        return b.revenue - a.revenue;
    });

    // Update center total
    var totalValEl = document.getElementById('studentDonutTotalVal');
    if (totalValEl) {
        if (totalMonthRevenue >= 1000000) {
            totalValEl.innerText = (totalMonthRevenue / 1000000).toFixed(1) + "tr";
        } else {
            totalValEl.innerText = totalMonthRevenue.toLocaleString('vi-VN') + "đ";
        }
        totalValEl.title = totalMonthRevenue.toLocaleString('vi-VN') + "đ";
    }

    // Render list
    var listEl = document.getElementById('studentRevenueList');
    if (listEl) {
        var listHtml = "";
        studentStats.forEach(function(s) {
            var amtClass = s.revenue > 0 ? "student-revenue-amount" : "student-revenue-amount zero";
            listHtml += '<div class="student-revenue-item">' +
                '<div class="student-revenue-left">' +
                    '<span class="student-color-dot" style="background: ' + escapeHtml(s.color) + '; box-shadow: 0 0 6px ' + escapeHtml(s.color) + '66;"></span>' +
                    '<div class="student-revenue-info">' +
                        '<span class="student-revenue-name">' + escapeHtml(s.name) + '</span>' +
                        '<span class="student-revenue-sessions">' + s.sessions + ' buổi học</span>' +
                    '</div>' +
                '</div>' +
                '<span class="' + amtClass + '">' + s.revenue.toLocaleString('vi-VN') + 'đ</span>' +
            '</div>';
        });
        listEl.innerHTML = listHtml;
    }

    // Donut chart slices: only students with revenue > 0
    var donutLabels = [];
    var donutData = [];
    var donutColors = [];

    studentStats.forEach(function(s) {
        if (s.revenue > 0) {
            donutLabels.push(s.name);
            donutData.push(s.revenue);
            donutColors.push(s.color);
        }
    });

    if (donutData.length === 0) {
        donutLabels = ["Chưa có buổi học"];
        donutData = [1];
        var emptyRingColor = (getComputedStyle(document.documentElement).getPropertyValue('--border-color') || '#E2E8F0').trim();
        donutColors = [emptyRingColor];
    }

    var ctx = canvasEl.getContext('2d');
    if (studentRevenueDonutInstance) {
        studentRevenueDonutInstance.destroy();
        studentRevenueDonutInstance = null;
    }

    var themeComp = getComputedStyle(document.documentElement);
    var donutCardBg = (themeComp.getPropertyValue('--bg-card') || '#0B0826').trim();

    studentRevenueDonutInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: donutLabels,
            datasets: [{
                data: donutData,
                backgroundColor: donutColors,
                borderWidth: 2,
                borderColor: donutCardBg,
                hoverOffset: 4
            }]
        },
        options: {
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            },
            responsive: true,
            maintainAspectRatio: false,
            cutout: '72%',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: donutData.length > 0 && donutLabels[0] !== "Chưa có buổi học",
                    backgroundColor: (getComputedStyle(document.documentElement).getPropertyValue('--bg-card-alt') || '#1E2235').trim(),
                    titleColor: (getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#FFFFFF').trim(),
                    titleFont: { family: 'Inter', size: 12, weight: 'bold' },
                    bodyColor: (getComputedStyle(document.documentElement).getPropertyValue('--color-primary') || '#8E4DFF').trim(),
                    bodyFont: { family: 'Inter', size: 12 },
                    borderColor: (getComputedStyle(document.documentElement).getPropertyValue('--border-color') || 'rgba(142, 77, 255, 0.4)').trim(),
                    borderWidth: 1,
                    padding: 10,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            var val = context.parsed;
                            var pct = totalMonthRevenue > 0 ? Math.round((val / totalMonthRevenue) * 100) : 0;
                            return ' ' + Number(val).toLocaleString('vi-VN') + 'đ (' + pct + '%)';
                        }
                    }
                }
            }
        }
    });
}
window.renderStudentRevenueDonut = renderStudentRevenueDonut;

function renderOverviewCharts(selM, selY) {
    if (typeof renderRevenueBarChart === 'function') {
        renderRevenueBarChart();
    }
    if (typeof renderStudentRevenueDonut === 'function') {
        renderStudentRevenueDonut(selM, selY);
    }
}
window.renderOverviewCharts = renderOverviewCharts;


function getDiaryBtvnBadge(btvn) {
    var raw = (btvn || "").trim();
    var bt = raw.toLowerCase();
    if (!raw || raw === "-" || raw === "không có") return '<span class="status-badge" style="background: var(--bg-input); border: 1px solid var(--border-card); color: var(--text-secondary);">-</span>';
    
    var pctMatch = bt.match(/(\d+(\.\d+)?)\s*%/);
    if (pctMatch) {
        var pct = parseFloat(pctMatch[1]);
        if (pct >= 90) {
            return '<span class="status-badge badge-hoanthanh">' + escapeHtml(raw) + '</span>';
        } else if (pct >= 50) {
            return '<span class="status-badge badge-thieu">' + escapeHtml(raw) + '</span>';
        } else {
            return '<span class="status-badge badge-nghi">' + escapeHtml(raw) + '</span>';
        }
    }

    if (bt.indexOf("không làm") !== -1 || bt.indexOf("chưa làm") !== -1 || bt.indexOf("chưa nộp") !== -1 || bt.indexOf("chưa đạt") !== -1 || bt === "không") {
        return '<span class="status-badge badge-nghi">' + escapeHtml(raw) + '</span>';
    }
    if (bt.indexOf("hoàn thành") !== -1 || bt === "đạt" || bt === "tốt" || bt === "xuất sắc" || bt === "có") {
        return '<span class="status-badge badge-hoanthanh">' + escapeHtml(raw) + '</span>';
    }
    if (bt.indexOf("thiếu") !== -1) {
        return '<span class="status-badge badge-thieu">' + escapeHtml(raw) + '</span>';
    }
    return '<span class="status-badge badge-hoanthanh">' + escapeHtml(raw) + '</span>';
}
window.getDiaryBtvnBadge = getDiaryBtvnBadge;

// Demo store helper removed for production

function initTutorDiaryFilters() {
    var studentSelect = document.getElementById('diaryStudentFilter');
    var monthSelect = document.getElementById('diaryMonthFilter');
    if (!studentSelect || !monthSelect) return;

    var students = (typeof getTutorStudentsResolved === 'function') 
        ? getTutorStudentsResolved() 
        : ((tutorDataGlobal && tutorDataGlobal.students) ? tutorDataGlobal.students : []);

    var prevStudent = studentSelect.value || "";
    studentSelect.innerHTML = '';
    students.forEach(function(st) {
        var opt = document.createElement('option');
        opt.value = st.name.trim();
        opt.innerText = st.name.trim();
        studentSelect.appendChild(opt);
    });

    if (currentTutorStudent && currentTutorStudent.name && studentSelect.querySelector('option[value="' + CSS.escape(currentTutorStudent.name.trim()) + '"]')) {
        studentSelect.value = currentTutorStudent.name.trim();
    } else if (prevStudent && prevStudent !== 'all' && studentSelect.querySelector('option[value="' + CSS.escape(prevStudent) + '"]')) {
        studentSelect.value = prevStudent;
    } else if (students.length > 0) {
        studentSelect.value = students[0].name.trim();
    }

    var prevMonth = monthSelect.value || "all";
    var monthsSet = {};
    students.forEach(function(st) {
        if (st.logs && Array.isArray(st.logs)) {
            st.logs.forEach(function(log) {
                if (log.ngay) {
                    var my = getMonthYearFromLogDate(log.ngay);
                    if (my && my.key) {
                        monthsSet[my.key] = true;
                    }
                }
            });
        }
    });

    var sortedMonths = Object.keys(monthsSet).sort(function(a, b) {
        var pa = a.split('/');
        var pb = b.split('/');
        var da = parseInt(pa[1], 10) * 100 + parseInt(pa[0], 10);
        var db = parseInt(pb[1], 10) * 100 + parseInt(pb[0], 10);
        return db - da;
    });

    monthSelect.innerHTML = '<option value="all">Tất cả các tháng</option>';
    sortedMonths.forEach(function(mKey) {
        var opt = document.createElement('option');
        opt.value = mKey;
        opt.innerText = "Tháng " + mKey;
        monthSelect.appendChild(opt);
    });
    if (prevMonth && monthSelect.querySelector('option[value="' + CSS.escape(prevMonth) + '"]')) {
        monthSelect.value = prevMonth;
    }

    if (typeof syncCustomDropdownFromSelect === 'function') {
        syncCustomDropdownFromSelect('diaryStudentFilter');
        syncCustomDropdownFromSelect('diaryMonthFilter');
    }
}

function filterTutorDiary() {
    renderTutorDiarySection(false);
}
window.filterTutorDiary = filterTutorDiary;

function renderTutorDiarySection(reinitFilters) {
    if (reinitFilters !== false) {
        initTutorDiaryFilters();
    }

    var studentSelect = document.getElementById('diaryStudentFilter');
    var monthSelect = document.getElementById('diaryMonthFilter');
    var countBadge = document.getElementById('diaryTotalSessionsBadge');

    var students = (typeof getTutorStudentsResolved === 'function') 
        ? getTutorStudentsResolved() 
        : ((tutorDataGlobal && tutorDataGlobal.students) ? tutorDataGlobal.students : []);

    var selStudent = studentSelect ? studentSelect.value : "";
    if ((!selStudent || selStudent === "all") && students.length > 0) {
        selStudent = students[0].name.trim();
        if (studentSelect) studentSelect.value = selStudent;
    }

    // Đồng bộ học sinh hiện tại và nạp thông báo / bài tập tương ứng
    var matchingSt = students.find(function(s) { return s.name.trim() === selStudent; });
    if (matchingSt) {
        currentTutorStudent = matchingSt;
        var qAnn = document.getElementById('quickAnnouncementInput');
        if (qAnn) qAnn.value = matchingSt.thongBao || "";
        var annStBadge = document.getElementById('announcementStudentBadge');
        if (annStBadge) annStBadge.innerText = "(" + matchingSt.name + ")";
        var annStatus = document.getElementById('announcementStatus');
        if (annStatus) annStatus.style.display = 'none';

        // Load bài tập cho học sinh này
        var tabSubmitBtn = document.getElementById('tabSubmitBtn');
        var isSubmitTab = tabSubmitBtn && tabSubmitBtn.classList.contains('active');
        if (isSubmitTab && typeof loadStudentSubmissions === 'function') {
            loadStudentSubmissions();
        } else if (typeof loadTutorAssignedHomework === 'function') {
            loadTutorAssignedHomework();
        }

        // TỰ ĐỘNG NẠP NHẬT KÝ NẾU HỌC SINH NÀY CHƯA CÓ DỮ LIỆU
        if (!matchingSt.logs) {
            var histContainer = document.getElementById('tutorStudentHistory');
            if (histContainer) {
                histContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 30px; font-style: italic;">' +
                    '<i class="fa-solid fa-circle-notch fa-spin" style="font-size: 24px; color: var(--color-primary); margin-bottom: 8px; display: block;"></i>' +
                    'Đang tải dữ liệu nhật ký học tập của ' + escapeHtml(matchingSt.name) + '...</div>';
            }
            if (countBadge) countBadge.innerText = "... buổi học";

            if (typeof google !== 'undefined' && google.script && google.script.run && google.script.run.getStudentDetailsForTutor) {
                google.script.run
                    .withSuccessHandler(function(res) {
                        matchingSt.logs = (res && res.logs) ? res.logs : [];
                        if (res && res.tuition) matchingSt.tuition = res.tuition;
                        if (res && res.billing_type) matchingSt.billing_type = res.billing_type;
                        if (currentTutorStudent && (currentTutorStudent.phone === matchingSt.phone || currentTutorStudent.name === matchingSt.name)) {
                            currentTutorStudent.logs = matchingSt.logs;
                            if (matchingSt.tuition) currentTutorStudent.tuition = matchingSt.tuition;
                            if (matchingSt.billing_type) currentTutorStudent.billing_type = matchingSt.billing_type;
                        }
                        if (tutorDataGlobal && tutorDataGlobal.students) {
                            var fs = tutorDataGlobal.students.find(function(s) {
                                return s.phone === matchingSt.phone || s.name === matchingSt.name;
                            });
                            if (fs) {
                                fs.logs = matchingSt.logs;
                                if (matchingSt.tuition) fs.tuition = matchingSt.tuition;
                                if (matchingSt.billing_type) fs.billing_type = matchingSt.billing_type;
                            }
                        }
                        if (typeof sessionStorage !== 'undefined' && tutorDataGlobal) {
                            try { sessionStorage.setItem('dashboardData', JSON.stringify(tutorDataGlobal)); } catch (e) {}
                        }
                        initTutorDiaryFilters();
                        renderTutorDiarySection(false);
                        if (typeof renderInvoice === 'function') renderInvoice();
                        if (typeof renderTutorChart === 'function') renderTutorChart(matchingSt.logs);
                    })
                    .withFailureHandler(function(err) {
                        console.error("Lỗi nạp nhật ký cho " + matchingSt.name, err);
                        matchingSt.logs = [];
                        renderTutorStudentHistory([]);
                        if (countBadge) countBadge.innerText = "0 buổi học";
                    })
                    .getStudentDetailsForTutor(matchingSt.phone, matchingSt.name);
            }
            return;
        }
    }
    
    var selMonth = monthSelect ? monthSelect.value : "all";

    var displayLogs = [];
    if (matchingSt && matchingSt.logs && Array.isArray(matchingSt.logs)) {
        matchingSt.logs.forEach(function(log) {
            if (selMonth !== 'all' && log.ngay) {
                var my = getMonthYearFromLogDate(log.ngay);
                if (!my || my.key !== selMonth) return;
            }
            displayLogs.push(log);
        });
    }

    if (countBadge) {
        countBadge.innerText = displayLogs.length + " buổi học";
    }

    if (typeof renderTutorStudentHistory === 'function') {
        renderTutorStudentHistory(displayLogs);
    }
}
window.renderTutorDiarySection = renderTutorDiarySection;

function toggleDiaryComment(btn) {
    var parent = btn.closest('.diary-comment-content');
    if (!parent) return;
    var shortEl = parent.querySelector('.diary-text-short');
    var fullEl = parent.querySelector('.diary-text-full');
    if (fullEl && fullEl.style.display === 'none') {
        fullEl.style.display = 'inline';
        if (shortEl) shortEl.style.display = 'none';
        btn.innerText = 'Thu gọn';
    } else if (fullEl) {
        fullEl.style.display = 'none';
        if (shortEl) shortEl.style.display = 'inline';
        btn.innerText = 'Xem thêm';
    }
}
window.toggleDiaryComment = toggleDiaryComment;

function openDiaryInlineEdit(btn) {
    var box = btn.closest('.diary-comment-box');
    if (!box) return;
    var currentText = box.getAttribute('data-full') || "";

    var contentEl = box.querySelector('.diary-comment-content');
    if (contentEl) contentEl.style.display = 'none';
    btn.style.display = 'none';

    var existingEditor = box.querySelector('.diary-inline-editor');
    if (existingEditor) existingEditor.remove();

    var editorHtml = document.createElement('div');
    editorHtml.className = 'diary-inline-editor';
    editorHtml.innerHTML = '<textarea class="diary-inline-textarea">' + escapeHtml(currentText) + '</textarea>' +
        '<div class="diary-inline-actions">' +
            '<button type="button" class="btn-inline-cancel" onclick="cancelDiaryInlineEdit(this)">Hủy</button>' +
            '<button type="button" class="btn-inline-save" onclick="saveDiaryInlineComment(this)"><i class="fa-solid fa-floppy-disk"></i> Lưu</button>' +
        '</div>';
    box.appendChild(editorHtml);

    var textarea = editorHtml.querySelector('textarea');
    if (textarea) textarea.focus();
}
window.openDiaryInlineEdit = openDiaryInlineEdit;

function cancelDiaryInlineEdit(btn) {
    var box = btn.closest('.diary-comment-box');
    if (!box) return;
    var editor = box.querySelector('.diary-inline-editor');
    if (editor) editor.remove();

    var contentEl = box.querySelector('.diary-comment-content');
    if (contentEl) contentEl.style.display = 'block';

    var editBtn = box.querySelector('.btn-comment-edit');
    if (editBtn) editBtn.style.display = 'inline-flex';
}
window.cancelDiaryInlineEdit = cancelDiaryInlineEdit;

function saveDiaryInlineComment(btn) {
    var box = btn.closest('.diary-comment-box');
    if (!box) return;

    var studentName = box.getAttribute('data-student');
    var logIndex = parseInt(box.getAttribute('data-index'), 10);

    var editor = box.querySelector('.diary-inline-editor');
    var textarea = editor ? editor.querySelector('textarea') : null;
    var newComment = textarea ? textarea.value.trim() : "";

    // Demo store save removed

    if (tutorDataGlobal && tutorDataGlobal.students) {
        var gSt = tutorDataGlobal.students.find(function(s) { return s.name.trim() === studentName; });
        if (gSt && gSt.logs && gSt.logs[logIndex]) {
            gSt.logs[logIndex].nhanXet = newComment;
        }
    }

    var toast = document.getElementById('syncToast');
    if (toast) {
        toast.className = 'sync-toast success';
        toast.innerHTML = '<i class="fa-solid fa-circle-check"></i> Đã lưu nhận xét thành công!';
        toast.style.display = 'flex';
        setTimeout(function() { toast.style.display = 'none'; }, 2500);
    }

    renderTutorDiarySection(false);
}
window.saveDiaryInlineComment = saveDiaryInlineComment;

var lastLoadedTutorSchedule = null;

function getStudentInitial(name) {
    if (!name) return "HS";
    var parts = name.trim().split(/\s+/);
    var last = parts[parts.length - 1];
    return last ? last.charAt(0).toUpperCase() : name.charAt(0).toUpperCase();
}
window.getStudentInitial = getStudentInitial;

function formatStudentScheduleSummary(schedObj) {
    if (!schedObj) return "Chưa xếp lịch";
    var days = [
        { k: 'mon', label: 'T2' },
        { k: 'tue', label: 'T3' },
        { k: 'wed', label: 'T4' },
        { k: 'thu', label: 'T5' },
        { k: 'fri', label: 'T6' },
        { k: 'sat', label: 'T7' },
        { k: 'sun', label: 'CN' }
    ];
    var activeSlots = [];
    days.forEach(function(d) {
        if (schedObj[d.k] && String(schedObj[d.k]).trim() !== "") {
            activeSlots.push({ label: d.label, time: schedObj[d.k].trim() });
        }
    });
    if (activeSlots.length === 0) return "Chưa xếp lịch";
    
    var firstTime = activeSlots[0].time;
    var allSame = activeSlots.every(function(s) { return s.time === firstTime; });
    if (allSame) {
        var dayLabels = activeSlots.map(function(s) { return s.label; }).join(", ");
        return dayLabels + ": " + firstTime;
    }
    return activeSlots.map(function(s) { return s.label + " (" + s.time + ")"; }).join(", ");
}
window.formatStudentScheduleSummary = formatStudentScheduleSummary;

function renderTutorStudentsGrid() {
    var grid = document.getElementById('tutorStudentsGrid');
    if (!grid) return;

    var students = (typeof getTutorStudentsResolved === 'function') 
        ? getTutorStudentsResolved() 
        : ((tutorDataGlobal && tutorDataGlobal.students) ? tutorDataGlobal.students : []);

    if (!students || students.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1 / -1;" class="empty-state">' +
            '<div class="empty-state-icon"><i class="fa-solid fa-user-graduate"></i></div>' +
            '<div class="empty-state-title">Chưa có học sinh nào</div>' +
            '<div class="empty-state-desc">Thêm học sinh đầu tiên để bắt đầu quản lý lịch dạy và điểm số lớp học!</div>' +
            '<button type="button" class="empty-state-btn" onclick="openAddStudentModal()">' +
            '<i class="fa-solid fa-plus"></i> Thêm học sinh</button>' +
            '</div>';
        return;
    }

    var schedList = lastLoadedTutorSchedule || [];
    var schedMap = {};
    if (Array.isArray(schedList)) {
        schedList.forEach(function(s) {
            if (s.studentName) schedMap[s.studentName.trim()] = s;
        });
    }

    var now = new Date();
    var currentMonthStr = String(now.getMonth() + 1).padStart(2, '0') + '/' + now.getFullYear();

    var html = "";
    students.forEach(function(st, idx) {
        var sName = st.name.trim();
        var stStyle = (typeof getStudentStyle === 'function') 
            ? getStudentStyle(sName) 
            : { bg: "var(--nav-active-bg)", border: "var(--color-primary)", text: "var(--color-primary)" };
        var initial = getStudentInitial(sName);

        // Schedule summary
        var sObj = schedMap[sName];
        var schedSummary = formatStudentScheduleSummary(sObj);

        // Buổi tháng này / tháng được chọn
        var monthSessions = 0;
        var curDate = new Date();
        var curM = curDate.getMonth() + 1;
        var curY = curDate.getFullYear();
        var selM = tutorOverviewMonth || curM;
        var selY = tutorOverviewYear || curY;
        var isCurrentMonth = (selM === curM && selY === curY);
        var cardSessionLabel = isCurrentMonth ? "Buổi tháng này" : ("Buổi Tháng " + selM);

        if (st.logs && Array.isArray(st.logs)) {
            st.logs.forEach(function(l) {
                if (!l) return;
                var rawDate = l.studyDate || l.ngay || "";
                if (!rawDate) return;
                var my = getMonthYearFromLogDate(rawDate);
                if (!my || my.month !== selM || my.year !== selY) return;

                if (!isAbsentLog(l)) {
                    monthSessions++;
                }
            });
        }

        // Tỷ lệ nộp BTVN tính thực tế từ lịch sử theo tháng đang chọn
        var hwRate = calcStudentHwRate(st, selM, selY);

        // Đơn giá / Học phí
        var unitVal = getStudentUnitFee(st);
        var feeDisplay = unitVal > 0 ? (Number(unitVal).toLocaleString('vi-VN') + "đ") : "--";
        if (st.fee) {
            feeDisplay = st.fee.replace('/buổi', '').replace('VNĐ', 'đ').trim();
        }

        var isSelected = (currentTutorStudent && currentTutorStudent.name === st.name);

        html += '<div class="student-profile-card' + (isSelected ? ' active' : '') + '" id="studentCard_' + idx + '" onclick="openEditStudentModalByIndex(' + idx + ', event)">' +
            '<div class="student-card-header">' +
                '<div class="student-initial-avatar" style="background: ' + escapeHtml(stStyle.bg) + '; border: 2px solid ' + escapeHtml(stStyle.border) + '; color: ' + escapeHtml(stStyle.text) + ';">' + escapeHtml(initial) + '</div>' +
                '<div class="student-card-info">' +
                    '<div class="student-card-name" title="' + escapeHtml(st.name) + '">' + escapeHtml(st.name) + '</div>' +
                    '<div class="student-card-sub"><i class="fa-solid fa-graduation-cap" style="color: var(--color-primary);"></i> ' + escapeHtml(st.subject || "Gia sư") + (st.classLevel ? ' • ' + escapeHtml(st.classLevel) : '') + '</div>' +
                '</div>' +
            '</div>' +
            '<div class="student-card-schedule" title="' + escapeHtml(schedSummary) + '">' +
                '<i class="fa-regular fa-clock"></i>' +
                '<span>' + escapeHtml(schedSummary) + '</span>' +
            '</div>' +
            '<div class="student-card-metrics">' +
                '<div class="card-metric-box">' +
                    '<div class="card-metric-val text-green">' + monthSessions + '</div>' +
                    '<div class="card-metric-lbl">' + cardSessionLabel + '</div>' +
                '</div>' +
                '<div class="card-metric-box">' +
                    '<div class="card-metric-val" style="color: var(--text-primary);">' + escapeHtml(hwRate) + '</div>' +
                    '<div class="card-metric-lbl">Nộp BTVN</div>' +
                '</div>' +
                '<div class="card-metric-box">' +
                    '<div class="card-metric-val text-amber">' + escapeHtml(feeDisplay) + '</div>' +
                    '<div class="card-metric-lbl">Học phí/buổi</div>' +
                '</div>' +
            '</div>' +
            '<div class="student-card-actions">' +
                '<button type="button" class="btn-card-detail" onclick="openEditStudentModalByIndex(' + idx + ', event)" title="Chỉnh sửa hoặc xóa học sinh"><i class="fa-solid fa-user-pen"></i> Chỉnh sửa</button>' +
                '<button type="button" class="btn-card-diary" onclick="goToStudentDiary(\'' + jsStr(st.name) + '\', event)" title="Xem nhật ký học sinh này"><i class="fa-solid fa-book-open"></i> Nhật ký</button>' +
            '</div>' +
        '</div>';
    });

    grid.innerHTML = html;
}
window.renderTutorStudentsGrid = renderTutorStudentsGrid;

function openEditStudentModalByIndex(idx, event) {
    if (event) event.stopPropagation();
    var allResolved = (typeof getTutorStudentsResolved === 'function') 
        ? getTutorStudentsResolved() 
        : ((tutorDataGlobal && tutorDataGlobal.students) ? tutorDataGlobal.students : []);
    if (allResolved && allResolved[idx]) {
        currentTutorStudent = allResolved[idx];
        var cards = document.querySelectorAll('.student-profile-card');
        cards.forEach(function(c) { c.classList.remove('active'); });
        var targetCard = document.getElementById('studentCard_' + idx);
        if (targetCard) targetCard.classList.add('active');
        
        if (typeof openEditStudentModal === 'function') {
            openEditStudentModal(allResolved[idx]);
        } else if (typeof window.openEditStudentModal === 'function') {
            window.openEditStudentModal(allResolved[idx]);
        }
    }
}
window.openEditStudentModalByIndex = openEditStudentModalByIndex;

function selectTutorStudentAndScroll(idx, event) {
    openEditStudentModalByIndex(idx, event);
}
window.selectTutorStudentAndScroll = selectTutorStudentAndScroll;

function goToStudentDiary(studentName, event) {
    if (event) event.stopPropagation();
    var diaryTabBtn = document.querySelector('.sidebar-nav-item[data-tab="diary"]');
    if (typeof switchTutorNavTab === 'function') {
        switchTutorNavTab(diaryTabBtn, 'diary');
    }
    var studentFilter = document.getElementById('diaryStudentFilter');
    if (studentFilter) {
        studentFilter.value = studentName;
    }
    if (typeof filterTutorDiary === 'function') {
        filterTutorDiary();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.goToStudentDiary = goToStudentDiary;

// ==========================================================================
// CUSTOM FILTER DROPDOWN SYSTEM (Giao diện dropdown menu sang trọng, hiện đại)
// ==========================================================================
function toggleCustomDropdown(selectId, e) {
    if (e) {
        e.stopPropagation();
    }
    var select = document.getElementById(selectId);
    if (!select) return;
    var wrap = select.closest('.custom-dropdown-wrap');
    if (!wrap) return;
    var menu = wrap.querySelector('.custom-dropdown-menu');
    if (!menu) return;

    var isOpen = wrap.classList.contains('open');
    closeAllCustomDropdowns();
    if (!isOpen) {
        syncCustomDropdownFromSelect(selectId);
        wrap.classList.add('open');
        menu.classList.add('open');
        var parentToolbar = wrap.closest('.diary-toolbar, .tuition-toolbar, .report-filter-toolbar');
        if (parentToolbar) {
            parentToolbar.classList.add('has-open-dropdown');
        }
    }
}
window.toggleCustomDropdown = toggleCustomDropdown;

function closeAllCustomDropdowns() {
    document.querySelectorAll('.custom-dropdown-wrap.open').forEach(function(w) {
        w.classList.remove('open');
    });
    document.querySelectorAll('.custom-dropdown-menu.open').forEach(function(m) {
        m.classList.remove('open');
    });
    document.querySelectorAll('.has-open-dropdown').forEach(function(t) {
        t.classList.remove('has-open-dropdown');
    });
}
window.closeAllCustomDropdowns = closeAllCustomDropdowns;

function syncCustomDropdownFromSelect(selectId) {
    var select = document.getElementById(selectId);
    if (!select) return;
    var wrap = select.closest('.custom-dropdown-wrap');
    if (!wrap) return;
    var selectedTextEl = wrap.querySelector('.custom-dropdown-selected');
    var menu = wrap.querySelector('.custom-dropdown-menu');
    if (!selectedTextEl || !menu) return;

    var curVal = select.value;
    var curText = "";
    menu.innerHTML = "";

    if (select.options.length === 0) {
        selectedTextEl.innerText = (selectId === 'reportStudentSelect' || selectId === 'diaryStudentFilter') ? "Chưa có học sinh" : "Tất cả các tháng";
        return;
    }

    Array.from(select.options).forEach(function(opt) {
        var isSelected = (opt.value === curVal);
        if (isSelected || (!curText && select.selectedIndex === 0)) {
            curText = opt.innerText;
        }

        var item = document.createElement('div');
        item.className = 'custom-dropdown-item' + (isSelected ? ' active' : '');
        item.dataset.value = opt.value;

        var iconHtml = '';
        if (selectId === 'diaryStudentFilter' || selectId === 'reportStudentSelect') {
            iconHtml = '<i class="fa-solid fa-graduation-cap" style="margin-right: 8px; opacity: 0.7; font-size: 12px;"></i>';
        } else if (opt.value === 'all') {
            iconHtml = '<i class="fa-solid fa-layer-group" style="margin-right: 8px; opacity: 0.7; font-size: 12px;"></i>';
        } else {
            iconHtml = '<i class="fa-regular fa-calendar-check" style="margin-right: 8px; opacity: 0.7; font-size: 12px;"></i>';
        }

        item.innerHTML = '<span style="display: inline-flex; align-items: center;">' + iconHtml + escapeHtml(opt.innerText) + '</span>' +
                         '<i class="fa-solid fa-check item-check"></i>';

        item.onclick = function(ev) {
            ev.stopPropagation();
            select.value = opt.value;
            select.dispatchEvent(new Event('change'));
            syncCustomDropdownFromSelect(selectId);
            closeAllCustomDropdowns();
        };

        menu.appendChild(item);
    });

    if (select.selectedIndex >= 0 && select.options[select.selectedIndex]) {
        curText = select.options[select.selectedIndex].innerText;
    }
    selectedTextEl.innerText = curText || "Chọn...";
}
window.syncCustomDropdownFromSelect = syncCustomDropdownFromSelect;

if (typeof window._customDropdownClickBound === 'undefined') {
    window._customDropdownClickBound = true;
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.custom-dropdown-wrap')) {
            closeAllCustomDropdowns();
        }
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllCustomDropdowns();
        }
    });
}

function initTuitionMonthFilter() {
    var select = document.getElementById('tuitionMonthFilter');
    if (!select) return;

    var students = (typeof getTutorStudentsResolved === 'function') 
        ? getTutorStudentsResolved() 
        : ((tutorDataGlobal && tutorDataGlobal.students) ? tutorDataGlobal.students : []);

    var monthsSet = {};
    students.forEach(function(st) {
        if (st.logs && Array.isArray(st.logs)) {
            st.logs.forEach(function(l) {
                if (l && l.ngay) {
                    var my = getMonthYearFromLogDate(l.ngay);
                    if (my) {
                        monthsSet[my.key] = true;
                    }
                }
            });
        }
    });

    var now = new Date();
    var currentMonthStr = String(now.getMonth() + 1).padStart(2, '0') + '/' + now.getFullYear();
    monthsSet[currentMonthStr] = true;

    var sortedMonths = Object.keys(monthsSet).sort(function(a, b) {
        var pA = a.split('/');
        var pB = b.split('/');
        var valA = parseInt(pA[1], 10) * 100 + parseInt(pA[0], 10);
        var valB = parseInt(pB[1], 10) * 100 + parseInt(pB[0], 10);
        return valB - valA;
    });

    var currentVal = select.value;
    select.innerHTML = '<option value="all">Tất cả các tháng</option>';
    sortedMonths.forEach(function(m) {
        var opt = document.createElement('option');
        opt.value = m;
        opt.innerText = "Tháng " + m;
        select.appendChild(opt);
    });

    var latestActiveMonth = "";
    for (var i = 0; i < sortedMonths.length; i++) {
        var mCandidate = sortedMonths[i];
        var hasLogsInMonth = students.some(function(st) {
            return st.logs && Array.isArray(st.logs) && st.logs.some(function(l) {
                if (!l || !l.ngay) return false;
                var my = getMonthYearFromLogDate(l.ngay);
                return my && my.key === mCandidate;
            });
        });
        if (hasLogsInMonth) {
            latestActiveMonth = mCandidate;
            break;
        }
    }

    if (currentVal && monthsSet[currentVal]) {
        select.value = currentVal;
    } else if (latestActiveMonth) {
        select.value = latestActiveMonth;
    } else if (monthsSet[currentMonthStr]) {
        select.value = currentMonthStr;
    } else if (currentVal === 'all') {
        select.value = 'all';
    } else {
        select.value = (sortedMonths.length > 0) ? sortedMonths[0] : "all";
    }

    if (typeof syncCustomDropdownFromSelect === 'function') {
        syncCustomDropdownFromSelect('tuitionMonthFilter');
    }
}
window.initTuitionMonthFilter = initTuitionMonthFilter;

function renderTutorTuitionSection() {
    var select = document.getElementById('tuitionMonthFilter');
    if (!select || select.options.length <= 1) {
        initTuitionMonthFilter();
    }
    var selMonth = select ? select.value : 'all';

    var students = (typeof getTutorStudentsResolved === 'function') 
        ? getTutorStudentsResolved() 
        : ((tutorDataGlobal && tutorDataGlobal.students) ? tutorDataGlobal.students : []);

    var tableBody = document.getElementById('tuitionTableBody');
    var mobileList = document.getElementById('tuitionMobileList');
    var expEl = document.getElementById('tuitionTotalExpected');
    var colEl = document.getElementById('tuitionTotalCollected');
    var penEl = document.getElementById('tuitionTotalPending');

    var totalExpected = 0;
    var totalCollected = 0;
    var totalPending = 0;

    var tableHtml = "";
    var mobileHtml = "";

    if (!students || students.length === 0) {
        if (tableBody) tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px; font-style: italic;">Chưa có dữ liệu học sinh</td></tr>';
        if (mobileList) mobileList.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 25px; font-style: italic;">Chưa có dữ liệu học sinh</div>';
        if (expEl) expEl.innerText = "0đ";
        if (colEl) colEl.innerText = "0đ";
        if (penEl) penEl.innerText = "0đ";
        return;
    }

    students.forEach(function(st, idx) {
        var sName = st.name.trim();
        var stStyle = (typeof getStudentStyle === 'function') 
            ? getStudentStyle(sName) 
            : { bg: "var(--nav-active-bg)", border: "var(--color-primary)", text: "var(--color-primary)" };

        // Count sessions in selected month
        var sessionCount = 0;
        if (st.logs && Array.isArray(st.logs)) {
            st.logs.forEach(function(l) {
                if (!l) return;
                var my = getMonthYearFromLogDate(l.ngay);
                if (selMonth !== 'all' && (!my || my.key !== selMonth)) return;

                // Kiểm tra chuyên cần: buổi nghỉ/hủy thì không tính tiền
                var rawStatus = l.trangThai || l.chuyenCan || l.attendance_status || l.attendance || l.status || "";
                var normTt = String(rawStatus).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();
                var isDaBu = (normTt.includes("da bu") || normTt.includes("hoc bu"));
                var isAbsent = !isDaBu && (
                    normTt.includes("nghi") || 
                    normTt.includes("huy") || 
                    normTt.includes("vang") || 
                    normTt.includes("off") || 
                    normTt.includes("khong hoc") ||
                    normTt.includes("chua hoc") ||
                    normTt.includes("tam hoan") ||
                    normTt === "v" || 
                    normTt === "n" || 
                    normTt === "x"
                );
                if (isAbsent) return; // Buổi hủy/nghỉ không tính vào số buổi học

                sessionCount++;
            });
        }

        // Unit fee
        var unitFee = getStudentUnitFee(st);
        var unitFeeStr = st.fee || (unitFee > 0 ? (Number(unitFee).toLocaleString('vi-VN') + "đ/buổi") : "--");

        // Total fee for this student
        var studentTotal = 0;
        var bType = st.billing_type || st.billingType || 'session';
        if (bType === 'month' || bType === 'monthly') {
            studentTotal = unitFee;
        } else {
            studentTotal = sessionCount * unitFee;
        }

        // Status
        var now = new Date();
        var currentMonthStr = String(now.getMonth()+1).padStart(2,'0') + '/' + now.getFullYear();
        var monthKey = (selMonth === 'all') ? currentMonthStr : selMonth;
        var rawStatus = ((st.feeStatusByMonth && st.feeStatusByMonth[monthKey]) || "Chưa thu").toLowerCase();
        var isPaid = (rawStatus.indexOf("đã") !== -1 || rawStatus.indexOf("paid") !== -1 || rawStatus.indexOf("thành công") !== -1);

        totalExpected += studentTotal;
        if (isPaid) {
            totalCollected += studentTotal;
        } else {
            totalPending += studentTotal;
        }

        var statusBtnHtml = isPaid
            ? '<button type="button" class="tuition-status-badge status-paid" onclick="toggleStudentTuitionStatus(' + idx + ')" title="Bấm để đổi thành Chưa thu"><i class="fa-solid fa-circle-check"></i> Đã thu</button>'
            : '<button type="button" class="tuition-status-badge status-unpaid" onclick="toggleStudentTuitionStatus(' + idx + ')" title="Bấm để đổi thành Đã thu"><i class="fa-solid fa-clock"></i> Chưa thu</button>';

        var studentTotalFormatted = Number(studentTotal).toLocaleString('vi-VN') + " đ";

        // Desktop Row
        tableHtml += '<tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">' +
            '<td style="padding: 12px 14px;">' +
                '<div style="display: flex; align-items: center; gap: 10px;">' +
                    '<span style="background:' + escapeHtml(stStyle.bg) + '; border:1px solid ' + escapeHtml(stStyle.border) + '; color:' + escapeHtml(stStyle.text) + '; width: 32px; height: 32px; border-radius: 50%; font-size: 13px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;">' + escapeHtml(getStudentInitial(sName)) + '</span>' +
                    '<div>' +
                        '<div style="font-weight: 700; color: var(--text-primary); font-size: 14px;">' + escapeHtml(sName) + '</div>' +
                        '<div style="font-size: 11.5px; color: var(--text-secondary);">' + escapeHtml(st.subject || "Gia sư") + (st.classLevel ? ' • ' + escapeHtml(st.classLevel) : '') + '</div>' +
                    '</div>' +
                '</div>' +
            '</td>' +
            '<td style="padding: 12px 10px; text-align: center;"><span style="background: var(--nav-active-bg); color: var(--text-heading); border: 1px solid var(--border-color); padding: 4px 10px; border-radius: 12px; font-size: 12.5px; font-weight: 700;">' + sessionCount + ' buổi</span></td>' +
            '<td style="padding: 12px 10px; text-align: right; color: var(--text-secondary); font-size: 13px; font-weight: 600;">' + escapeHtml(unitFeeStr) + '</td>' +
            '<td style="padding: 12px 14px; text-align: right; color: var(--color-primary); font-size: 15px; font-weight: 800; font-family: \'Space Grotesk\', sans-serif;">' + studentTotalFormatted + '</td>' +
            '<td style="padding: 12px 10px; text-align: center;">' + statusBtnHtml + '</td>' +
            '<td style="padding: 12px 14px; text-align: center;">' +
                '<button type="button" class="btn-tuition-invoice" onclick="openStudentInvoiceModal(\'' + jsStr(sName) + '\')"><i class="fa-solid fa-file-invoice-dollar"></i> Xem hóa đơn</button>' +
            '</td>' +
        '</tr>';

        // Mobile Card
        mobileHtml += '<div style="background: var(--glass-inner, rgba(255, 255, 255, 0.35)); border: 1px solid var(--border-card); border-radius: 16px; padding: 16px; margin-bottom: 12px;">' +
            '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">' +
                '<div style="display: flex; align-items: center; gap: 8px;">' +
                    '<span style="background:' + escapeHtml(stStyle.bg) + '; border:1px solid ' + escapeHtml(stStyle.border) + '; color:' + escapeHtml(stStyle.text) + '; width: 30px; height: 30px; border-radius: 50%; font-size: 12px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center;">' + escapeHtml(getStudentInitial(sName)) + '</span>' +
                    '<div>' +
                        '<div style="font-weight: 700; color: var(--text-primary); font-size: 14.5px;">' + escapeHtml(sName) + '</div>' +
                        '<div style="font-size: 11px; color: var(--text-secondary);">' + escapeHtml(st.subject || "Gia sư") + '</div>' +
                    '</div>' +
                '</div>' +
                statusBtnHtml +
            '</div>' +
            '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: var(--bg-input); border-radius: 10px; padding: 10px 12px; margin-bottom: 12px; font-size: 12px;">' +
                '<div><span style="color:var(--text-secondary);">Số buổi:</span> <b style="color:var(--text-primary);">' + sessionCount + ' buổi</b></div>' +
                '<div><span style="color:var(--text-secondary);">Đơn giá:</span> <b style="color:var(--text-primary);">' + escapeHtml(unitFeeStr) + '</b></div>' +
                '<div style="grid-column: 1 / -1; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 6px; display: flex; justify-content: space-between; align-items: center;">' +
                    '<span style="color:var(--text-secondary); font-weight:600;">Tổng học phí:</span>' +
                    '<span style="color:var(--color-primary); font-size: 16px; font-weight:800; font-family: \'Space Grotesk\', sans-serif;">' + studentTotalFormatted + '</span>' +
                '</div>' +
            '</div>' +
            '<button type="button" class="btn-tuition-invoice" style="width: 100%; justify-content: center; padding: 8px;" onclick="openStudentInvoiceModal(\'' + jsStr(sName) + '\')"><i class="fa-solid fa-file-invoice-dollar"></i> Xem chi tiết hóa đơn</button>' +
        '</div>';
    });

    if (tableBody) tableBody.innerHTML = tableHtml;
    if (mobileList) mobileList.innerHTML = mobileHtml;
    if (expEl) expEl.innerText = Number(totalExpected).toLocaleString('vi-VN') + "đ";
    if (colEl) colEl.innerText = Number(totalCollected).toLocaleString('vi-VN') + "đ";
    if (penEl) penEl.innerText = Number(totalPending).toLocaleString('vi-VN') + "đ";
}
window.renderTutorTuitionSection = renderTutorTuitionSection;

function loadAllTutorStudentsLogs(data) {
    var students = (tutorDataGlobal && tutorDataGlobal.students && tutorDataGlobal.students.length > 0)
        ? tutorDataGlobal.students
        : ((data && data.students) ? data.students : []);
    if (!students || students.length === 0) return;

    var pending = students.length;
    var completed = false;

    function onAllLogsLoaded() {
        if (completed) return;
        completed = true;
        if (typeof sessionStorage !== 'undefined' && tutorDataGlobal) {
            try {
                sessionStorage.setItem('dashboardData', JSON.stringify(tutorDataGlobal));
            } catch (e) {
                console.warn("sessionStorage save error:", e);
            }
        }
        if (typeof initTuitionMonthFilter === 'function') initTuitionMonthFilter();
        if (typeof renderTutorTuitionSection === 'function') renderTutorTuitionSection();
        renderTutorKpiCards(tutorDataGlobal, tutorOverviewMonth, tutorOverviewYear);
        if (typeof renderOverviewCharts === 'function') {
            renderOverviewCharts(tutorOverviewMonth, tutorOverviewYear);
        }
        if (typeof renderTutorStudentsGrid === 'function') {
            renderTutorStudentsGrid();
        }
        if (typeof initTutorDiaryFilters === 'function') {
            initTutorDiaryFilters();
        }
        var diarySec = document.getElementById('tutorSectionDiary');
        if (diarySec && diarySec.style.display !== 'none' && typeof renderTutorDiarySection === 'function') {
            renderTutorDiarySection(false);
        }
    }

    // Timeout dự phòng 4 giây để đảm bảo giao diện luôn được render dữ liệu đã tải
    setTimeout(function() {
        if (!completed) {
            onAllLogsLoaded();
        }
    }, 4000);

    students.forEach(function(st) {
        if (st.logs && Array.isArray(st.logs) && st.logs.length > 0) {
            pending--;
            if (pending === 0) {
                onAllLogsLoaded();
            }
            return;
        }

        if (typeof google !== 'undefined' && google.script && google.script.run && google.script.run.getStudentDetailsForTutor) {
            google.script.run
                .withSuccessHandler(function(res) {
                    try {
                        if (res && res.logs) {
                            st.logs = res.logs;
                        } else if (!st.logs) {
                            st.logs = [];
                        }
                        if (res && res.tuition) {
                            st.tuition = res.tuition;
                        } else if (res && res.student && res.student.tuition) {
                            st.tuition = res.student.tuition;
                        }
                        if (res && res.billing_type) {
                            st.billing_type = res.billing_type;
                        } else if (res && res.student && res.student.billing_type) {
                            st.billing_type = res.student.billing_type;
                        }
                        if (currentTutorStudent && (currentTutorStudent.phone === st.phone || currentTutorStudent.name === st.name)) {
                            currentTutorStudent.logs = st.logs;
                            if (st.tuition) currentTutorStudent.tuition = st.tuition;
                            if (st.billing_type) currentTutorStudent.billing_type = st.billing_type;
                            if (typeof renderInvoice === 'function') renderInvoice();
                            if (typeof renderTutorChart === 'function') renderTutorChart(currentTutorStudent.logs);
                            if (typeof renderTutorStudentHistory === 'function') renderTutorStudentHistory(currentTutorStudent.logs);
                        }
                        var diaryStFilter = document.getElementById('diaryStudentFilter');
                        if (diaryStFilter && diaryStFilter.value === st.name.trim() && typeof renderTutorDiarySection === 'function') {
                            renderTutorDiarySection(false);
                        }
                    } catch (e) {
                        console.error("Error setting student logs:", e);
                    }
                    pending--;
                    if (pending === 0) {
                        onAllLogsLoaded();
                    }
                })
                .withFailureHandler(function(err) {
                    console.error("Failed to load logs for student " + st.name, err);
                    if (!st.logs) st.logs = [];
                    pending--;
                    if (pending === 0) {
                        onAllLogsLoaded();
                    }
                })
                .getStudentDetailsForTutor(st.phone, st.name);
        } else {
            pending--;
            if (pending === 0) {
                onAllLogsLoaded();
            }
        }
    });
}
window.loadAllTutorStudentsLogs = loadAllTutorStudentsLogs;

function toggleStudentTuitionStatus(idx) {
    var resolvedStudents = (typeof getTutorStudentsResolved === 'function')
        ? getTutorStudentsResolved()
        : (tutorDataGlobal ? tutorDataGlobal.students : null);
    if (!resolvedStudents || !resolvedStudents[idx]) return;

    var select = document.getElementById('tuitionMonthFilter');
    var selMonth = select ? select.value : 'all';
    var now = new Date();
    var currentMonthStr = String(now.getMonth()+1).padStart(2,'0') + '/' + now.getFullYear();
    var monthKey = (selMonth === 'all') ? currentMonthStr : selMonth;

    var target = resolvedStudents[idx];
    if (!target.feeStatusByMonth) target.feeStatusByMonth = {};
    var current = ((target.feeStatusByMonth && target.feeStatusByMonth[monthKey]) || "Chưa thu").toLowerCase();
    var isPaid = (current.indexOf("đã") !== -1 || current.indexOf("paid") !== -1 || current.indexOf("thành công") !== -1);
    var newStatus = isPaid ? "Chưa thu" : "Đã thu";
    target.feeStatusByMonth[monthKey] = newStatus;
    target.feeStatus = newStatus;

    // Demo store update removed
    if (tutorDataGlobal && tutorDataGlobal.students) {
        var stInGlobal = tutorDataGlobal.students.find(function(s) {
            return (s.phone && target.phone && s.phone === target.phone) || (s.name && target.name && s.name.trim() === target.name.trim());
        }) || tutorDataGlobal.students[idx];
        if (stInGlobal) {
            if (!stInGlobal.feeStatusByMonth) stInGlobal.feeStatusByMonth = {};
            stInGlobal.feeStatusByMonth[monthKey] = newStatus;
            stInGlobal.feeStatus = newStatus;
        }
    }

    if (typeof showToast === 'function') {
        showToast("Đã đổi trạng thái (" + monthKey + ") của " + target.name + ": " + newStatus, "success");
    }

    renderTutorTuitionSection();
    if (typeof renderTutorKpiCards === 'function') {
        renderTutorKpiCards();
    }
}
window.toggleStudentTuitionStatus = toggleStudentTuitionStatus;

function toDateInputValue(d) {
    if (!d) return "";
    var yr = d.getFullYear();
    var mo = String(d.getMonth() + 1).padStart(2, '0');
    var da = String(d.getDate()).padStart(2, '0');
    return yr + '-' + mo + '-' + da;
}

// Chuyển đổi linh hoạt chuỗi ngày hoặc Date object sang DD/MM/YYYY (Việt Nam)
function formatToDmy(val) {
    if (!val && val !== 0) return "";
    var d = parseInputDate(val);
    if (!d || isNaN(d.getTime())) return String(val);
    var day = String(d.getDate()).padStart(2, '0');
    var month = String(d.getMonth() + 1).padStart(2, '0');
    var year = d.getFullYear();
    return day + '/' + month + '/' + year;
}
window.formatToDmy = formatToDmy;

// Chuyển đổi chuỗi ngày sang YYYY-MM-DD (cho native input type="date")
function formatToYmd(val) {
    if (!val && val !== 0) return "";
    var d = parseInputDate(val);
    if (!d || isNaN(d.getTime())) return "";
    var day = String(d.getDate()).padStart(2, '0');
    var month = String(d.getMonth() + 1).padStart(2, '0');
    var year = d.getFullYear();
    return year + '-' + month + '-' + day;
}
window.formatToYmd = formatToYmd;

function generateTuitionPeriodTitle(startDateStr, endDateStr, tmpl) {
    tmpl = tmpl || (window.tuitionInvoiceModalState ? window.tuitionInvoiceModalState.template : 1);
    if (!startDateStr || !endDateStr) return tmpl === 1 ? "KỲ HỌC NÀY" : "PHIẾU HỌC TẬP KỲ NÀY";
    var sD = parseInputDate(startDateStr);
    var eD = parseInputDate(endDateStr);
    if (!sD || !eD) return tmpl === 1 ? "KỲ HỌC NÀY" : "PHIẾU HỌC TẬP KỲ NÀY";
    var sM = sD.getMonth() + 1;
    var sY = sD.getFullYear();
    var eM = eD.getMonth() + 1;
    var eY = eD.getFullYear();
    var sDay = String(sD.getDate()).padStart(2, '0');
    var sMo = String(sM).padStart(2, '0');
    var eDay = String(eD.getDate()).padStart(2, '0');
    var eMo = String(eM).padStart(2, '0');
    if (sY === eY && sM === eM) {
        return tmpl === 1 ? ("KỲ HỌC THÁNG " + sM) : ("PHIẾU HỌC TẬP THÁNG " + sM + "/" + sY);
    } else {
        return tmpl === 1 
            ? ("KỲ HỌC " + sDay + "/" + sMo + " – " + eDay + "/" + eMo)
            : ("PHIẾU HỌC TẬP " + sDay + "/" + sMo + " – " + eDay + "/" + eMo + "/" + eY);
    }
}
window.generateTuitionPeriodTitle = generateTuitionPeriodTitle;

// Bộ điều khiển Date Picker tiếng Việt chuẩn DD/MM/YYYY
function initVietnameseDatePicker(textInputId, pickerInputId, onChangeCallback) {
    var textInput = document.getElementById(textInputId);
    var picker = document.getElementById(pickerInputId);
    if (!textInput || !picker) return;

    // Đồng bộ giá trị khởi tạo
    if (textInput.value) {
        var dmy = formatToDmy(textInput.value);
        textInput.value = dmy;
        var ymd = formatToYmd(dmy);
        if (ymd) picker.value = ymd;
    } else if (picker.value) {
        textInput.value = formatToDmy(picker.value);
    }

    if (textInput._vnPickerAttached) return;
    textInput._vnPickerAttached = true;

    // Khi người dùng chọn ngày từ popup lịch
    picker.addEventListener('change', function() {
        if (this.value) {
            var dmy = formatToDmy(this.value);
            textInput.value = dmy;
            var evt = new Event('change', { bubbles: true });
            textInput.dispatchEvent(evt);
            if (typeof onChangeCallback === 'function') onChangeCallback(dmy);
        }
    });

    // Khi nhập tay: tự động thêm dấu gạch chéo phân cách DD/MM/YYYY
    textInput.addEventListener('input', function(e) {
        var v = this.value.replace(/[^\d/]/g, '');
        if (e.inputType !== 'deleteContentBackward') {
            if (v.length === 2 && v.indexOf('/') === -1) {
                v = v + '/';
            } else if (v.length === 5 && v.split('/').length === 2) {
                v = v + '/';
            }
        }
        this.value = v;
        if (v.length === 10) {
            var ymd = formatToYmd(v);
            if (ymd && !isNaN(new Date(ymd).getTime())) {
                picker.value = ymd;
                var evt = new Event('change', { bubbles: true });
                textInput.dispatchEvent(evt);
                if (typeof onChangeCallback === 'function') onChangeCallback(v);
            }
        }
    });

    // Khi blur ra ngoài: tự chuẩn hóa
    textInput.addEventListener('blur', function() {
        var v = this.value.trim();
        if (v) {
            var dmy = formatToDmy(v);
            var ymd = formatToYmd(dmy);
            if (ymd && !isNaN(new Date(ymd).getTime())) {
                picker.value = ymd;
                this.value = dmy;
            }
        }
    });
}
window.initVietnameseDatePicker = initVietnameseDatePicker;

// ===== THEME RIÊNG CHO PHIẾU HỌC PHÍ (không ảnh hưởng theme hệ thống) =====
var INVOICE_THEMES = [
    { id: 'purple', name: 'Tím',        p: '#7C3AED', pd: '#5B21B6', mid: '#6D28D9', deep: '#4C1D95', soft: '#FAF5FF', soft2: '#F5F3FF', border: '#E9D5FF', line: '#F3E8FF', strong: '#D8B4FE', rgb: '124, 58, 237', bar: '#8E4DFF 0%, #3B82F6 50%, #10B981 100%' },
    { id: 'blue',   name: 'Xanh dương', p: '#2563EB', pd: '#1E40AF', mid: '#1D4ED8', deep: '#1E3A8A', soft: '#EFF6FF', soft2: '#E0EDFF', border: '#BFDBFE', line: '#DBEAFE', strong: '#93C5FD', rgb: '37, 99, 235',  bar: '#3B82F6 0%, #06B6D4 50%, #10B981 100%' },
    { id: 'teal',   name: 'Xanh ngọc',  p: '#0D9488', pd: '#115E59', mid: '#0F766E', deep: '#134E4A', soft: '#F0FDFA', soft2: '#E6FBF6', border: '#99F6E4', line: '#CCFBF1', strong: '#5EEAD4', rgb: '13, 148, 136', bar: '#14B8A6 0%, #06B6D4 50%, #3B82F6 100%' },
    { id: 'green',  name: 'Xanh lá',    p: '#059669', pd: '#065F46', mid: '#047857', deep: '#064E3B', soft: '#ECFDF5', soft2: '#E3FAEF', border: '#A7F3D0', line: '#D1FAE5', strong: '#6EE7B7', rgb: '5, 150, 105',  bar: '#10B981 0%, #84CC16 50%, #F59E0B 100%' },
    { id: 'pink',   name: 'Hồng',       p: '#DB2777', pd: '#9D174D', mid: '#BE185D', deep: '#831843', soft: '#FDF2F8', soft2: '#FCEAF4', border: '#FBCFE8', line: '#FCE7F3', strong: '#F9A8D4', rgb: '219, 39, 119', bar: '#EC4899 0%, #F472B6 50%, #A855F7 100%' },
    { id: 'red',    name: 'Đỏ',         p: '#DC2626', pd: '#991B1B', mid: '#B91C1C', deep: '#7F1D1D', soft: '#FEF2F2', soft2: '#FDEAEA', border: '#FECACA', line: '#FEE2E2', strong: '#FCA5A5', rgb: '220, 38, 38',  bar: '#EF4444 0%, #F97316 50%, #F59E0B 100%' },
    { id: 'orange', name: 'Cam',        p: '#EA580C', pd: '#9A3412', mid: '#C2410C', deep: '#7C2D12', soft: '#FFF7ED', soft2: '#FFF1E2', border: '#FED7AA', line: '#FFEDD5', strong: '#FDBA74', rgb: '234, 88, 12',  bar: '#F97316 0%, #F59E0B 50%, #EF4444 100%' },
    { id: 'gold',   name: 'Vàng đồng',  p: '#B45309', pd: '#78350F', mid: '#92400E', deep: '#78350F', soft: '#FFFBEB', soft2: '#FEF6DA', border: '#FDE68A', line: '#FEF3C7', strong: '#FCD34D', rgb: '180, 83, 9',   bar: '#F59E0B 0%, #EAB308 50%, #D97706 100%' },
    { id: 'slate',  name: 'Đen thanh lịch', p: '#334155', pd: '#0F172A', mid: '#1E293B', deep: '#0F172A', soft: '#F8FAFC', soft2: '#F1F5F9', border: '#CBD5E1', line: '#E2E8F0', strong: '#94A3B8', rgb: '51, 65, 85', bar: '#0F172A 0%, #475569 50%, #94A3B8 100%' }
];
window.INVOICE_THEMES = INVOICE_THEMES;

function invoiceThemeStorageKey() {
    var base = (typeof window.__tutorThemeKey === 'function') ? window.__tutorThemeKey() : 'tutorTheme::guest';
    return base.replace(/^tutorTheme/, 'invoiceTheme');
}

function getInvoiceThemeId() {
    var st = window.tuitionInvoiceModalState;
    if (st && st.invoiceTheme) return st.invoiceTheme;
    try { return localStorage.getItem(invoiceThemeStorageKey()) || 'purple'; } catch (e) { return 'purple'; }
}

function getInvoiceTheme() {
    var id = getInvoiceThemeId();
    for (var i = 0; i < INVOICE_THEMES.length; i++) if (INVOICE_THEMES[i].id === id) return INVOICE_THEMES[i];
    return INVOICE_THEMES[0];
}

// Đổi bảng màu tím mặc định trong HTML phiếu sang bảng màu đã chọn
function applyInvoiceThemeToHtml(html) {
    var t = getInvoiceTheme();
    if (t.id === 'purple') return html;
    var base = INVOICE_THEMES[0];
    var map = [
        [base.bar, t.bar], ['rgba(124, 58, 237', 'rgba(' + t.rgb], ['rgba(109, 40, 217', 'rgba(' + t.rgb],
        [base.p, t.p], [base.pd, t.pd], [base.mid, t.mid], [base.deep, t.deep], [base.soft, t.soft], [base.soft2, t.soft2],
        [base.border, t.border], [base.line, t.line], [base.strong, t.strong]
    ];
    map.forEach(function (m) { html = html.split(m[0]).join(m[1]).split(m[0].toLowerCase()).join(m[1]); });
    return html;
}

function invoiceThemeCssVars() {
    var t = getInvoiceTheme();
    return '--inv-p:' + t.p + ';--inv-pd:' + t.pd + ';--inv-mid:' + t.mid + ';--inv-deep:' + t.deep + ';--inv-soft:' + t.soft + ';--inv-soft2:' + t.soft2 + ';--inv-border:' + t.border + ';--inv-line:' + t.line + ';--inv-strong:' + t.strong + ';--inv-rgb:' + t.rgb + ';--inv-bar:linear-gradient(90deg, ' + t.bar + ');';
}

function renderInvoiceThemeSwatches() {
    var wrap = document.getElementById('tuitionInvoiceThemeSwatches');
    if (!wrap) return;
    var cur = getInvoiceThemeId();
    var html = '';
    INVOICE_THEMES.forEach(function (t) {
        html += '<button type="button" class="inv-theme-swatch' + (t.id === cur ? ' active' : '') + '" title="' + t.name + '" aria-label="Màu phiếu ' + t.name + '" onclick="setInvoiceTheme(\'' + t.id + '\')" style="--sw:' + t.p + ';--sw2:' + t.strong + ';"></button>';
    });
    wrap.innerHTML = html;
}
window.renderInvoiceThemeSwatches = renderInvoiceThemeSwatches;

function setInvoiceTheme(id) {
    if (!window.tuitionInvoiceModalState) window.tuitionInvoiceModalState = {};
    window.tuitionInvoiceModalState.invoiceTheme = id;
    try { localStorage.setItem(invoiceThemeStorageKey(), id); } catch (e) {}
    renderInvoiceThemeSwatches();
    renderTuitionLivePreview();
    if (typeof autoSaveTuitionDraft === 'function') autoSaveTuitionDraft();
}
window.setInvoiceTheme = setInvoiceTheme;

function getActiveThemeInvoiceColors() {
    var t = getInvoiceTheme();
    return {
        primary: t.p,
        rgb: t.rgb,
        softBg: t.soft,
        softBorder: t.border
    };
}
window.getActiveThemeInvoiceColors = getActiveThemeInvoiceColors;

function getDefaultInvoiceSections(st, isMonthly, unitFeeStr) {
    var subject = (st && st.subject) ? st.subject.toLowerCase() : "";
    
    var feedbackHtml = 
        '<div style="margin-bottom: 3px;"><b>Tổng quan:</b></div>' +
        '<div>+ Có tinh thần học tập tích cực, đi học chuyên cần, đúng giờ và tập trung nghe giảng.</div>' +
        '<div>+ Hoàn thành tốt các bài tập được giao, chủ động trao đổi và hỏi bài khi gặp dạng khó.</div>' +
        '<div style="margin-top: 6px; margin-bottom: 3px;"><b>Kiến thức & Kỹ năng:</b></div>' +
        '<div>+ Nắm chắc các kiến thức trọng tâm đã học, tiếp thu bài tốt và hiểu rõ bản chất bài học.</div>' +
        '<div>+ Kỹ năng làm bài ngày càng tiến bộ, vận dụng tốt phương pháp vào giải quyết bài tập.</div>' +
        '<div style="margin-top: 6px; margin-bottom: 3px;"><b>Điểm cần cải thiện:</b></div>' +
        '<div>+ Cần rèn luyện thêm tính cẩn thận khi làm bài để hạn chế các lỗi sơ suất nhỏ.</div>' +
        '<div>+ Chú ý trình bày bài giải chi tiết, rõ ràng và duy trì thói quen tự ôn luyện đều đặn.</div>';
        
    var roadmapHtml = 
        '<div><b>Kiến thức trọng tâm:</b> Tiếp tục củng cố kiến thức nền tảng và mở rộng các chuyên đề nâng cao.</div>' +
        '<div><b>Mục tiêu rèn luyện:</b> Tối ưu phương pháp và tốc độ làm bài, hướng tới kết quả xuất sắc trong các kỳ thi.</div>';

    var scheduleHtml = '';
    var sSched = null;
    if (typeof lastLoadedTutorSchedule !== 'undefined' && Array.isArray(lastLoadedTutorSchedule)) {
        sSched = lastLoadedTutorSchedule.find(function(s) { 
            return s && s.studentName && s.studentName.trim() === (st ? st.name.trim() : ""); 
        });
    }
    var dayLabels = [
        { k: 'mon', label: 'Chiều thứ 2' },
        { k: 'tue', label: 'Chiều thứ 3' },
        { k: 'wed', label: 'Chiều thứ 4' },
        { k: 'thu', label: 'Chiều thứ 5' },
        { k: 'fri', label: 'Chiều thứ 6' },
        { k: 'sat', label: 'Chiều thứ 7' },
        { k: 'sun', label: 'Chiều chủ nhật' }
    ];
    var schedLines = [];
    if (sSched) {
        dayLabels.forEach(function(d) {
            if (sSched[d.k] && String(sSched[d.k]).trim() !== "") {
                schedLines.push('<div><b>' + d.label + ':</b> ' + escapeHtml(String(sSched[d.k]).trim()) + '</div>');
            }
        });
    }
    if (schedLines.length > 0) {
        scheduleHtml = schedLines.join('');
    } else {
        scheduleHtml = '<div><b>Chiều thứ 4:</b> 16h - 18h</div><div><b>Chiều thứ 7:</b> 13h - 15h</div><div><b>Chiều chủ nhật:</b> 13h - 15h</div>';
    }

    var tuitionExtraHtml = 
        '<div><b>Học phí cơ bản:</b> ' + escapeHtml(unitFeeStr) + (isMonthly ? '/tháng' : '/buổi') + '</div>' +
        '<div><b>Học phí bổ trợ tối:</b> 30k/buổi</div>';

    var footerNote = 'Phụ huynh vui lòng kiểm tra thông tin học phí và lịch học. Cháu cảm ơn ạ.';

    return {
        feedbackHtml: feedbackHtml,
        roadmapHtml: roadmapHtml,
        scheduleHtml: scheduleHtml,
        tuitionExtraHtml: tuitionExtraHtml,
        footerNote: footerNote
    };
}
window.getDefaultInvoiceSections = getDefaultInvoiceSections;

function formatTuitionFeedback(text) {
    if (!text) return '';
    // Only apply 3-part structural formatting if text matches structured feedback headers
    var hasHeaders = /(tổng\s*quan|kiến\s*thức|cải\s*thiện)/i.test(text);
    if (!hasHeaders) {
        return text;
    }

    var clean = text
        .replace(/<br\s*[\/]?>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<div[^>]*>/gi, '')
        .replace(/<p[^>]*>/gi, '')
        .replace(/&nbsp;/gi, ' ');
    
    var lines = clean.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 0; });
    var resultLines = [];
    var isFirstHeader = true;

    for (var i = 0; i < lines.length; i++) {
        var rawLine = lines[i];
        var plain = rawLine.replace(/<[^>]+>/g, '').trim();
        var headerClean = plain.replace(/[*#_]/g, '').trim().replace(/^\d+[\.\)]\s*/, '').trim();

        var isTongQuan = /^(tổng\s*quan)\s*:?$/i.test(headerClean);
        var isKienThuc = /^(kiến\s*thức\s*(&|và)?\s*kỹ\s*năng)\s*:?$/i.test(headerClean);
        var isDiemCaiThien = /^(điểm\s*cần\s*cải\s*thiện|cần\s*cải\s*thiện)\s*:?$/i.test(headerClean);

        if (isTongQuan) {
            var mt = isFirstHeader ? '0' : '6px';
            isFirstHeader = false;
            resultLines.push('<div style="margin-top: ' + mt + '; margin-bottom: 3px;"><b>Tổng quan:</b></div>');
        } else if (isKienThuc) {
            var mt = isFirstHeader ? '0' : '6px';
            isFirstHeader = false;
            resultLines.push('<div style="margin-top: ' + mt + '; margin-bottom: 3px;"><b>Kiến thức & Kỹ năng:</b></div>');
        } else if (isDiemCaiThien) {
            var mt = isFirstHeader ? '0' : '6px';
            isFirstHeader = false;
            resultLines.push('<div style="margin-top: ' + mt + '; margin-bottom: 3px;"><b>Điểm cần cải thiện:</b></div>');
        } else {
            var lineContent = rawLine
                .replace(/^[\s•\-\*\+]+/, '')
                .replace(/^\d+[\.\)]\s*/, '')
                .trim();
            lineContent = lineContent.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
            if (lineContent.length > 0) {
                resultLines.push('<div>+ ' + lineContent + '</div>');
            }
        }
    }
    return resultLines.join('');
}
window.formatTuitionFeedback = formatTuitionFeedback;

function handleTuitionFeedbackPaste(e) {
    if (!e) return;
    var pastedText = '';
    if (e.clipboardData && e.clipboardData.getData) {
        pastedText = e.clipboardData.getData('text/plain');
    } else if (window.clipboardData && window.clipboardData.getData) {
        pastedText = window.clipboardData.getData('Text');
    }
    if (!pastedText || pastedText.trim() === '') return;

    var hasHeaders = /(tổng\s*quan|kiến\s*thức|cải\s*thiện)/i.test(pastedText);
    if (hasHeaders) {
        e.preventDefault();
        // BẢO MẬT: nội dung dán là văn bản thuần -> vô hiệu hóa thẻ HTML trước khi định dạng
        var formattedHtml = formatTuitionFeedback(pastedText.replace(/</g, '&lt;').replace(/>/g, '&gt;'));
        var target = e.currentTarget || e.target;
        if (target && formattedHtml) {
            target.innerHTML = formattedHtml;
            onTuitionCustomFieldInput('feedbackText', formattedHtml);
        }
    }
}
window.handleTuitionFeedbackPaste = handleTuitionFeedbackPaste;

function onTuitionCustomFieldInput(field, val) {
    if (!window.tuitionInvoiceModalState) window.tuitionInvoiceModalState = {};
    window.tuitionInvoiceModalState[field] = val;
    window.tuitionInvoiceHasUnsavedChanges = true;
    autoSaveTuitionDraft();
}
window.onTuitionCustomFieldInput = onTuitionCustomFieldInput;

window.tuitionInvoiceModalState = {
    studentName: "",
    displayMonth: "",
    template: 1,
    toggles: {
        student: true,
        class: true,
        fee: true,
        sessions: true,
        hours: true,
        dates: true,
        discount: false,
        surcharge: false,
        qr: true,
        feedback: true,
        roadmap: true,
        schedule: true
    },
    discountAmount: 0,
    surchargeAmount: 0,
    startDate: "",
    endDate: "",
    customTitle: "",
    isCustomTitle: false,
    feedbackText: "",
    roadmapText: "",
    scheduleText: "",
    tuitionExtraText: "",
    footerNoteText: "",
    restoredFromDraft: false,
    isDraftSaved: false
};

window.tuitionInvoiceHasUnsavedChanges = false;

function updateTuitionDraftButtonUI(isSaved) {
    var btn = document.getElementById('btnTuitionSaveDraft');
    if (!btn) return;
    if (isSaved) {
        btn.innerHTML = '<i class="fa-solid fa-bookmark" style="color: #7C3AED;"></i> <span>Đã lưu nháp</span>';
        btn.classList.add('btn-draft-saved');
        btn.setAttribute('title', 'Đã lưu nháp (Nhấp một lần nữa để hủy lưu bản nháp)');
    } else {
        btn.innerHTML = '<i class="fa-regular fa-bookmark"></i> <span>Lưu bản nháp</span>';
        btn.classList.remove('btn-draft-saved');
        btn.setAttribute('title', 'Lưu bản nháp phiếu học phí này');
    }
}
window.updateTuitionDraftButtonUI = updateTuitionDraftButtonUI;

function autoSaveTuitionDraft() {
    var state = window.tuitionInvoiceModalState;
    if (!state || !state.studentName) return;
    if (!state.isDraftSaved) return; // Chỉ tự động cập nhật nếu bản nháp đang được lưu
    try {
        var key = 'tuitionDraft_' + state.studentName.trim();
        var draftData = {
            studentName: state.studentName,
            template: state.template || 1,
            toggles: state.toggles || {},
            discountAmount: state.discountAmount || 0,
            surchargeAmount: state.surchargeAmount || 0,
            startDate: state.startDate,
            endDate: state.endDate,
            customTitle: state.customTitle || "",
            isCustomTitle: !!state.isCustomTitle,
            feedbackText: state.feedbackText || "",
            roadmapText: state.roadmapText || "",
            scheduleText: state.scheduleText || "",
            tuitionExtraText: state.tuitionExtraText || "",
            footerNoteText: state.footerNoteText || "",
            savedAt: new Date().toISOString()
        };
        localStorage.setItem(key, JSON.stringify(draftData));
    } catch(e) {
        console.warn("Unable to save draft:", e);
    }
}
window.autoSaveTuitionDraft = autoSaveTuitionDraft;

function saveTuitionDraftModal() {
    var state = window.tuitionInvoiceModalState;
    if (!state || !state.studentName) return;
    var draftKey = 'tuitionDraft_' + state.studentName.trim();

    if (state.isDraftSaved) {
        // Toggle: Hủy lưu bản nháp -> trở lại như cũ không tô nữa
        state.isDraftSaved = false;
        try {
            localStorage.removeItem(draftKey);
        } catch(e) {}
        updateTuitionDraftButtonUI(false);
        var draftTxt = document.getElementById('tuitionDraftRestoredText');
        if (draftTxt && draftTxt.parentElement) {
            draftTxt.parentElement.style.display = 'none';
        }
        window.tuitionInvoiceHasUnsavedChanges = false;
        if (typeof showToast === 'function') {
            showToast("Đã hủy lưu bản nháp!", "info");
        }
    } else {
        // Toggle: Lưu bản nháp -> huy hiệu bị tô đi
        state.isDraftSaved = true;
        try {
            var draftData = {
                studentName: state.studentName,
                template: state.template || 1,
                toggles: state.toggles || {},
                discountAmount: state.discountAmount || 0,
                surchargeAmount: state.surchargeAmount || 0,
                startDate: state.startDate,
                endDate: state.endDate,
                customTitle: state.customTitle || "",
                isCustomTitle: !!state.isCustomTitle,
                feedbackText: state.feedbackText || "",
                roadmapText: state.roadmapText || "",
                scheduleText: state.scheduleText || "",
                tuitionExtraText: state.tuitionExtraText || "",
                footerNoteText: state.footerNoteText || "",
                savedAt: new Date().toISOString()
            };
            localStorage.setItem(draftKey, JSON.stringify(draftData));
        } catch(e) {
            console.warn("Unable to save draft:", e);
        }
        updateTuitionDraftButtonUI(true);
        window.tuitionInvoiceHasUnsavedChanges = false;
        if (typeof showToast === 'function') {
            showToast("Đã lưu bản nháp thành công!", "success");
        }
    }
}
window.saveTuitionDraftModal = saveTuitionDraftModal;

function onTuitionPeriodDateChange() {
    window.tuitionInvoiceHasUnsavedChanges = true;
    var sInp = document.getElementById('tuitionPeriodStartDate');
    var eInp = document.getElementById('tuitionPeriodEndDate');
    var sVal = sInp ? sInp.value : '';
    var eVal = eInp ? eInp.value : '';

    if (!window.tuitionInvoiceModalState) window.tuitionInvoiceModalState = {};
    window.tuitionInvoiceModalState.startDate = sVal;
    window.tuitionInvoiceModalState.endDate = eVal;

    if (!window.tuitionInvoiceModalState.isCustomTitle) {
        var autoTitle = generateTuitionPeriodTitle(sVal, eVal);
        window.tuitionInvoiceModalState.customTitle = autoTitle;
        var titleInp = document.getElementById('tuitionPeriodTitle');
        if (titleInp) titleInp.value = autoTitle;
    }

    renderTuitionLivePreview();
    autoSaveTuitionDraft();
}
window.onTuitionPeriodDateChange = onTuitionPeriodDateChange;

function onTuitionPeriodTitleChange() {
    window.tuitionInvoiceHasUnsavedChanges = true;
    var titleInp = document.getElementById('tuitionPeriodTitle');
    var val = titleInp ? titleInp.value.trim() : '';

    if (!window.tuitionInvoiceModalState) window.tuitionInvoiceModalState = {};
    window.tuitionInvoiceModalState.customTitle = val;
    window.tuitionInvoiceModalState.isCustomTitle = (val.length > 0);

    renderTuitionLivePreview();
    autoSaveTuitionDraft();
}
window.onTuitionPeriodTitleChange = onTuitionPeriodTitleChange;

function buildTuitionModalForm(st, studentLogs) {
    var formCol = document.getElementById('tuitionInvoiceFormCol');
    if (!formCol) return;
    if (st) window.currentTuitionInvoiceStudent = st;
    if (studentLogs) window.currentTuitionInvoiceLogs = studentLogs;
    st = st || window.currentTuitionInvoiceStudent;
    studentLogs = studentLogs || window.currentTuitionInvoiceLogs || [];
    if (!st) return;

    var state = window.tuitionInvoiceModalState || {};
    var toggles = state.toggles || {};

    var billableSess = 0;
    if (studentLogs && Array.isArray(studentLogs)) {
        studentLogs.forEach(function(log) {
            if (!log) return;
            var rawStatus = log.trangThai || log.chuyenCan || log.attendance_status || log.attendance || log.status || "";
            var normTt = String(rawStatus).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();
            var isDaBu = (normTt.includes("da bu") || normTt.includes("hoc bu"));
            var isAbsent = !isDaBu && (
                normTt.includes("nghi") || 
                normTt.includes("huy") || 
                normTt.includes("vang") || 
                normTt.includes("off") || 
                normTt.includes("khong hoc") ||
                normTt.includes("chua hoc") ||
                normTt.includes("tam hoan") ||
                normTt === "v" || 
                normTt === "n" || 
                normTt === "x"
            );
            if (!isAbsent) billableSess++;
        });
    }
    var totalSess = billableSess;
    var totalHours = (totalSess * 1.5).toFixed(1);
    var unitFee = getStudentUnitFee(st);
    var unitFeeStr = unitFee > 0 ? (Number(unitFee).toLocaleString('vi-VN') + " đ") : "--";
    var classSubjectStr = [st.classLevel, st.subject].filter(Boolean).join(' - ') || 'Gia sư';

    var html = '';

    // Box 1: Thông tin học sinh (2 Cột Toggles)
    html += '<div id="tuitionBoxStudentInfo" class="tuition-card-box">';
    html += '<div style="font-size: 15px; font-weight: 700; color: #0F172A; margin-bottom: 2px;">Thông tin học sinh</div>';
    html += '<div style="font-size: 12px; color: #64748B; margin-bottom: 12px;">Chọn thông tin hiển thị trên phiếu</div>';
    html += '<div class="tuition-toggle-grid">';

    // Card 1: Học sinh
    html += '<div class="tuition-toggle-card">';
    html += '  <div>';
    html += '    <div class="tuition-toggle-label">Học sinh</div>';
    html += '    <div class="tuition-toggle-val">' + escapeHtml(st.name) + '</div>';
    html += '  </div>';
    html += '  <label class="tuition-switch">';
    html += '    <input type="checkbox" id="toggleStudent" data-key="student"' + (toggles.student !== false ? ' checked' : '') + ' onchange="onTuitionToggleChange(\'toggleStudent\', \'student\')">';
    html += '    <span class="tuition-slider"></span>';
    html += '  </label>';
    html += '</div>';

    // Card 2: Lớp / Môn
    html += '<div class="tuition-toggle-card">';
    html += '  <div>';
    html += '    <div class="tuition-toggle-label">Lớp / Môn</div>';
    html += '    <div class="tuition-toggle-val">' + escapeHtml(classSubjectStr) + '</div>';
    html += '  </div>';
    html += '  <label class="tuition-switch">';
    html += '    <input type="checkbox" id="toggleClass" data-key="class"' + (toggles.class !== false ? ' checked' : '') + ' onchange="onTuitionToggleChange(\'toggleClass\', \'class\')">';
    html += '    <span class="tuition-slider"></span>';
    html += '  </label>';
    html += '</div>';

    // Card 3: Học phí áp dụng
    html += '<div class="tuition-toggle-card">';
    html += '  <div>';
    html += '    <div class="tuition-toggle-label">Học phí áp dụng</div>';
    html += '    <div class="tuition-toggle-val">' + unitFeeStr + '</div>';
    html += '  </div>';
    html += '  <label class="tuition-switch">';
    html += '    <input type="checkbox" id="toggleFee" data-key="fee"' + (toggles.fee !== false ? ' checked' : '') + ' onchange="onTuitionToggleChange(\'toggleFee\', \'fee\')">';
    html += '    <span class="tuition-slider"></span>';
    html += '  </label>';
    html += '</div>';

    // Card 4: Số buổi học
    html += '<div class="tuition-toggle-card">';
    html += '  <div>';
    html += '    <div class="tuition-toggle-label">Số buổi học</div>';
    html += '    <div class="tuition-toggle-val" id="val_toggleSessions">' + totalSess + '</div>';
    html += '  </div>';
    html += '  <label class="tuition-switch">';
    html += '    <input type="checkbox" id="toggleSessions" data-key="sessions"' + (toggles.sessions !== false ? ' checked' : '') + ' onchange="onTuitionToggleChange(\'toggleSessions\', \'sessions\')">';
    html += '    <span class="tuition-slider"></span>';
    html += '  </label>';
    html += '</div>';

    // Card 5: Số giờ tích lũy
    html += '<div class="tuition-toggle-card">';
    html += '  <div>';
    html += '    <div class="tuition-toggle-label">Số giờ tích lũy</div>';
    html += '    <div class="tuition-toggle-val" id="val_toggleHours">' + totalHours + ' giờ</div>';
    html += '  </div>';
    html += '  <label class="tuition-switch">';
    html += '    <input type="checkbox" id="toggleHours" data-key="hours"' + (toggles.hours !== false ? ' checked' : '') + ' onchange="onTuitionToggleChange(\'toggleHours\', \'hours\')">';
    html += '    <span class="tuition-slider"></span>';
    html += '  </label>';
    html += '</div>';

    // Card 6: Ngày học
    html += '<div class="tuition-toggle-card">';
    html += '  <div>';
    html += '    <div class="tuition-toggle-label">Ngày học</div>';
    html += '    <div class="tuition-toggle-val">Hiển thị</div>';
    html += '  </div>';
    html += '  <label class="tuition-switch">';
    html += '    <input type="checkbox" id="toggleDates" data-key="dates"' + (toggles.dates !== false ? ' checked' : '') + ' onchange="onTuitionToggleChange(\'toggleDates\', \'dates\')">';
    html += '    <span class="tuition-slider"></span>';
    html += '  </label>';
    html += '</div>';

    // Card 7: Giảm học phí
    html += '<div class="tuition-toggle-card">';
    html += '  <div>';
    html += '    <div class="tuition-toggle-label">Giảm học phí</div>';
    html += '    <div class="tuition-toggle-val" id="val_toggleDiscount">' + Number(state.discountAmount || 0).toLocaleString('vi-VN') + ' đ</div>';
    html += '  </div>';
    html += '  <label class="tuition-switch">';
    html += '    <input type="checkbox" id="toggleDiscount" data-key="discount"' + (toggles.discount === true ? ' checked' : '') + ' onchange="onTuitionToggleChange(\'toggleDiscount\', \'discount\')">';
    html += '    <span class="tuition-slider"></span>';
    html += '  </label>';
    html += '</div>';

    // Card 8: Phụ thu
    html += '<div class="tuition-toggle-card">';
    html += '  <div>';
    html += '    <div class="tuition-toggle-label">Phụ thu</div>';
    html += '    <div class="tuition-toggle-val" id="val_toggleSurcharge">' + Number(state.surchargeAmount || 0).toLocaleString('vi-VN') + ' đ</div>';
    html += '  </div>';
    html += '  <label class="tuition-switch">';
    html += '    <input type="checkbox" id="toggleSurcharge" data-key="surcharge"' + (toggles.surcharge === true ? ' checked' : '') + ' onchange="onTuitionToggleChange(\'toggleSurcharge\', \'surcharge\')">';
    html += '    <span class="tuition-slider"></span>';
    html += '  </label>';
    html += '</div>';

    // Card 9: Ảnh QR (Full width)
    html += '<div class="tuition-toggle-card" style="grid-column: 1 / -1;">';
    html += '  <div>';
    html += '    <div class="tuition-toggle-label">Ảnh QR</div>';
    html += '    <div class="tuition-toggle-val">Có thể tắt trên phiếu này</div>';
    html += '  </div>';
    html += '  <label class="tuition-switch">';
    html += '    <input type="checkbox" id="toggleQr" data-key="qr"' + (toggles.qr !== false ? ' checked' : '') + ' onchange="onTuitionToggleChange(\'toggleQr\', \'qr\')">';
    html += '    <span class="tuition-slider"></span>';
    html += '  </label>';
    html += '</div>';

    var curTmpl = state.template || window.currentTuitionTemplate || 1;
    if (curTmpl === 2) {
        // Card 10: Nhận xét học tập
        html += '<div class="tuition-toggle-card">';
        html += '  <div>';
        html += '    <div class="tuition-toggle-label">Nhận xét học tập</div>';
        html += '    <div class="tuition-toggle-val">' + (toggles.feedback !== false ? 'Hiển thị' : 'Đã ẩn') + '</div>';
        html += '  </div>';
        html += '  <label class="tuition-switch">';
        html += '    <input type="checkbox" id="toggleFeedback" data-key="feedback"' + (toggles.feedback !== false ? ' checked' : '') + ' onchange="onTuitionToggleChange(\'toggleFeedback\', \'feedback\')">';
        html += '    <span class="tuition-slider"></span>';
        html += '  </label>';
        html += '</div>';

        // Card 11: Khung lịch học
        html += '<div class="tuition-toggle-card">';
        html += '  <div>';
        html += '    <div class="tuition-toggle-label">Khung lịch học</div>';
        html += '    <div class="tuition-toggle-val">' + (toggles.schedule !== false ? 'Hiển thị' : 'Đã ẩn') + '</div>';
        html += '  </div>';
        html += '  <label class="tuition-switch">';
        html += '    <input type="checkbox" id="toggleSchedule" data-key="schedule"' + (toggles.schedule !== false ? ' checked' : '') + ' onchange="onTuitionToggleChange(\'toggleSchedule\', \'schedule\')">';
        html += '    <span class="tuition-slider"></span>';
        html += '  </label>';
        html += '</div>';
    }

    html += '</div>'; // End .tuition-toggle-grid

    // Input for discount
    html += '<div id="wrapperDiscountInput" style="display: ' + (toggles.discount === true ? 'block' : 'none') + '; margin-top: 10px; padding: 10px 12px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px;">';
    html += '<div style="font-size: 11px; font-weight: 600; color: #64748B; margin-bottom: 4px;">Số tiền giảm trừ học phí:</div>';
    html += '<div style="display: flex; align-items: center; gap: 8px;">';
    html += '<input type="text" inputmode="numeric" class="currency-input" id="inputDiscountFee" value="' + (state.discountAmount ? formatNumberWithDots(state.discountAmount) : '') + '" placeholder="0" oninput="formatCurrencyInput(this); onTuitionFeeAdjustmentChange()" style="flex: 1; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 6px 10px; color: #EA580C; font-weight: 700; font-size: 13px; outline: none;">';
    html += '<span style="font-size: 12px; color: #64748B; font-weight: 600;">VNĐ</span>';
    html += '</div></div>';

    // Input for surcharge
    html += '<div id="wrapperSurchargeInput" style="display: ' + (toggles.surcharge === true ? 'block' : 'none') + '; margin-top: 10px; padding: 10px 12px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px;">';
    html += '<div style="font-size: 11px; font-weight: 600; color: #64748B; margin-bottom: 4px;">Số tiền phụ thu thêm:</div>';
    html += '<div style="display: flex; align-items: center; gap: 8px;">';
    html += '<input type="text" inputmode="numeric" class="currency-input" id="inputSurchargeFee" value="' + (state.surchargeAmount ? formatNumberWithDots(state.surchargeAmount) : '') + '" placeholder="0" oninput="formatCurrencyInput(this); onTuitionFeeAdjustmentChange()" style="flex: 1; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 6px 10px; color: #16A34A; font-weight: 700; font-size: 13px; outline: none;">';
    html += '<span style="font-size: 12px; color: #64748B; font-weight: 600;">VNĐ</span>';
    html += '</div></div>';

    html += '</div>'; // End Box 1

    // Box 2: Thông tin kỳ học
    html += '<div id="tuitionBoxPeriodInfo" class="tuition-card-box">';
    html += '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">';
    html += '<span style="background: #7C3AED; color: #FFFFFF; font-size: 11px; font-weight: 800; padding: 2px 7px; border-radius: 6px;">01</span>';
    html += '<div>';
    html += '<div style="font-size: 15px; font-weight: 700; color: #0F172A;">Thông tin kỳ học</div>';
    html += '<div style="font-size: 12px; color: #64748B; margin-top: 1px;">Chọn khoảng thời gian và tiêu đề của phiếu</div>';
    html += '</div></div>';

    html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">';
    html += '<div>';
    html += '<label style="display: block; font-size: 11.5px; color: #64748B; margin-bottom: 4px; font-weight: 600;">Từ ngày:</label>';
    html += '<div class="vn-date-picker-box" style="width: 100%;">';
    html += '<input type="text" id="tuitionPeriodStartDate" value="' + escapeHtml(formatToDmy(state.startDate) || '') + '" placeholder="dd/mm/yyyy" maxlength="10" autocomplete="off" onchange="onTuitionPeriodDateChange()" style="width: 100%; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 8px 36px 8px 10px; color: #0F172A; font-size: 12.5px; font-weight: 600; outline: none; box-sizing: border-box;">';
    html += '<button type="button" class="vn-date-picker-icon-btn" style="color: #64748B;" tabindex="-1"><i class="fa-regular fa-calendar"></i></button>';
    html += '<input type="date" id="tuitionPeriodStartDate_picker" class="vn-hidden-native-picker" tabindex="-1">';
    html += '</div></div>';

    html += '<div>';
    html += '<label style="display: block; font-size: 11.5px; color: #64748B; margin-bottom: 4px; font-weight: 600;">Đến ngày:</label>';
    html += '<div class="vn-date-picker-box" style="width: 100%;">';
    html += '<input type="text" id="tuitionPeriodEndDate" value="' + escapeHtml(formatToDmy(state.endDate) || '') + '" placeholder="dd/mm/yyyy" maxlength="10" autocomplete="off" onchange="onTuitionPeriodDateChange()" style="width: 100%; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 8px 36px 8px 10px; color: #0F172A; font-size: 12.5px; font-weight: 600; outline: none; box-sizing: border-box;">';
    html += '<button type="button" class="vn-date-picker-icon-btn" style="color: #64748B;" tabindex="-1"><i class="fa-regular fa-calendar-check"></i></button>';
    html += '<input type="date" id="tuitionPeriodEndDate_picker" class="vn-hidden-native-picker" tabindex="-1">';
    html += '</div></div></div>';

    html += '<div>';
    html += '<label style="display: block; font-size: 11.5px; color: #64748B; margin-bottom: 4px; font-weight: 600;">Tiêu đề kỳ học:</label>';
    html += '<input type="text" id="tuitionPeriodTitle" value="' + escapeHtml(state.customTitle || '') + '" placeholder="Ví dụ: PHIẾU HỌC TẬP THÁNG 8/2026" oninput="onTuitionPeriodTitleChange()" style="width: 100%; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 8px 12px; color: #0F172A; font-weight: 700; font-size: 13px; outline: none; box-sizing: border-box;">';
    html += '</div>';

    html += '</div>'; // End Box 2

    formCol.innerHTML = html;

    initVietnameseDatePicker('tuitionPeriodStartDate', 'tuitionPeriodStartDate_picker', function() {
        onTuitionPeriodDateChange();
    });
    initVietnameseDatePicker('tuitionPeriodEndDate', 'tuitionPeriodEndDate_picker', function() {
        onTuitionPeriodDateChange();
    });
}

function onTuitionToggleChange(id, key) {
    window.tuitionInvoiceHasUnsavedChanges = true;
    var cb = document.getElementById(id);
    if (!cb) return;
    if (!window.tuitionInvoiceModalState) window.tuitionInvoiceModalState = {};
    if (!window.tuitionInvoiceModalState.toggles) window.tuitionInvoiceModalState.toggles = {};
    window.tuitionInvoiceModalState.toggles[key] = cb.checked;

    if (id === 'toggleDiscount') {
        var wrap = document.getElementById('wrapperDiscountInput');
        if (wrap) wrap.style.display = cb.checked ? 'block' : 'none';
        if (!cb.checked) {
            window.tuitionInvoiceModalState.discountAmount = 0;
            var valEl = document.getElementById('val_toggleDiscount');
            if (valEl) valEl.textContent = "0 đ";
        } else {
            var inp = document.getElementById('inputDiscountFee');
            var val = inp ? (parseInt(String(inp.value).replace(/\D/g, ''), 10) || 0) : 0;
            window.tuitionInvoiceModalState.discountAmount = val;
            var valEl = document.getElementById('val_toggleDiscount');
            if (valEl) valEl.textContent = Number(val).toLocaleString('vi-VN') + " đ";
        }
    }

    if (id === 'toggleSurcharge') {
        var wrap = document.getElementById('wrapperSurchargeInput');
        if (wrap) wrap.style.display = cb.checked ? 'block' : 'none';
        if (!cb.checked) {
            window.tuitionInvoiceModalState.surchargeAmount = 0;
            var valEl = document.getElementById('val_toggleSurcharge');
            if (valEl) valEl.textContent = "0 đ";
        } else {
            var inp = document.getElementById('inputSurchargeFee');
            var val = inp ? (parseInt(String(inp.value).replace(/\D/g, ''), 10) || 0) : 0;
            window.tuitionInvoiceModalState.surchargeAmount = val;
            var valEl = document.getElementById('val_toggleSurcharge');
            if (valEl) valEl.textContent = Number(val).toLocaleString('vi-VN') + " đ";
        }
    }

    renderTuitionLivePreview();
    autoSaveTuitionDraft();
}
window.onTuitionToggleChange = onTuitionToggleChange;

function onTuitionFeeAdjustmentChange() {
    window.tuitionInvoiceHasUnsavedChanges = true;
    var discInp = document.getElementById('inputDiscountFee');
    var surInp = document.getElementById('inputSurchargeFee');
    var discVal = discInp ? Math.max(0, parseInt(String(discInp.value).replace(/\D/g, ''), 10) || 0) : 0;
    var surVal = surInp ? Math.max(0, parseInt(String(surInp.value).replace(/\D/g, ''), 10) || 0) : 0;

    if (!window.tuitionInvoiceModalState) window.tuitionInvoiceModalState = {};
    window.tuitionInvoiceModalState.discountAmount = discVal;
    window.tuitionInvoiceModalState.surchargeAmount = surVal;

    var discValEl = document.getElementById('val_toggleDiscount');
    if (discValEl) discValEl.textContent = Number(discVal).toLocaleString('vi-VN') + " đ";

    var surValEl = document.getElementById('val_toggleSurcharge');
    if (surValEl) surValEl.textContent = Number(surVal).toLocaleString('vi-VN') + " đ";

    renderTuitionLivePreview();
    autoSaveTuitionDraft();
}
window.onTuitionFeeAdjustmentChange = onTuitionFeeAdjustmentChange;

function renderTuitionLivePreview() {
    var modalBody = document.getElementById('tuitionInvoiceModalBody');
    if (!modalBody) return;

    var state = window.tuitionInvoiceModalState || {};
    var sName = state.studentName || "";
    var tmpl = state.template || window.currentTuitionTemplate || 1;
    var toggles = state.toggles || {};
    var discount = toggles.discount ? (state.discountAmount || 0) : 0;
    var surcharge = toggles.surcharge ? (state.surchargeAmount || 0) : 0;
    var themeColors = getActiveThemeInvoiceColors();

    var students = (typeof getTutorStudentsResolved === 'function') 
        ? getTutorStudentsResolved() 
        : ((tutorDataGlobal && tutorDataGlobal.students) ? tutorDataGlobal.students : []);
    var st = students.find(function(s) { return s.name.trim() === sName.trim(); });
    if (!st && students.length > 0) st = students[0];
    if (!st) return;

    // Filter logs for this student using startDate and endDate
    var sDate = parseInputDate(state.startDate);
    var eDate = parseInputDate(state.endDate);
    if (sDate) sDate.setHours(0, 0, 0, 0);
    if (eDate) eDate.setHours(23, 59, 59, 999);

    var studentLogs = [];
    if (st.logs && Array.isArray(st.logs)) {
        st.logs.forEach(function(l) {
            if (!l) return;
            var lDate = parseLogDate(l.studyDate || l.ngay);
            if (lDate) {
                if (sDate && lDate < sDate) return;
                if (eDate && lDate > eDate) return;
                studentLogs.push(l);
            } else if (!sDate && !eDate) {
                studentLogs.push(l);
            }
        });
    }

    var invPresent = 0;
    var invAbsent = 0;
    var invMakeup = 0;
    var invAbsentDates = [];
    var invDoneHw = 0;
    var invLateHw = 0;
    var invMissingHw = 0;
    var invMissingHwDates = [];
    var invBillableCount = 0;

    studentLogs.forEach(function(log) {
        if (!log) return;
        var dateText = log.studyDate || log.ngay || "";
        var dObj = parseInputDate(dateText);
        var shortDateStr = dObj ? (String(dObj.getDate()).padStart(2, '0') + '/' + String(dObj.getMonth() + 1).padStart(2, '0')) : dateText;
        
        var rawStatus = log.trangThai || log.chuyenCan || log.attendance_status || log.attendance || log.status || "";
        var normTt = String(rawStatus).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();
        
        var isDaBu = (normTt.includes("da bu") || normTt.includes("hoc bu"));
        var isAbsent = !isDaBu && (
            normTt.includes("nghi") || 
            normTt.includes("huy") || 
            normTt.includes("vang") || 
            normTt.includes("off") || 
            normTt.includes("khong hoc") ||
            normTt.includes("chua hoc") ||
            normTt.includes("tam hoan") ||
            normTt === "v" || 
            normTt === "n" || 
            normTt === "x"
        );
        var isPresent = !isAbsent;
        
        if (isDaBu) {
            invMakeup++;
            invBillableCount++;
        } else if (isAbsent) {
            invAbsent++;
            invAbsentDates.push(shortDateStr || ("Buổi " + (log.tuan || "")));
        } else {
            invPresent++;
            invBillableCount++;
        }

        // CHỈ TÍNH BÀI TẬP VỀ NHÀ CHO CÁC BUỔI CÓ HỌC (LÊN LỚP HOẶC HỌC BÙ)
        if (isPresent || isDaBu) {
            var btvnRaw = (log.danhGiaBTVN || log.btvn || "").trim();
            var btvn = btvnRaw.toLowerCase();
            if (btvn && btvn !== "-" && btvn !== "không có") {
                if (btvn.indexOf("trễ") !== -1 || btvn.indexOf("muộn") !== -1) {
                    invLateHw++;
                }
                var pctMatch = btvn.match(/(\d+(\.\d+)?)\s*%/);
                if (pctMatch) {
                    var pVal = parseFloat(pctMatch[1]);
                    if (pVal >= 100) {
                        invDoneHw++;
                    } else {
                        invMissingHw++;
                        invMissingHwDates.push((shortDateStr || ("Buổi " + (log.tuan || ""))) + " (" + btvnRaw + ")");
                    }
                } else if (btvn.indexOf("thiếu") !== -1 || btvn.indexOf("không làm") !== -1 || btvn.indexOf("chưa làm") !== -1 || btvn.indexOf("chưa nộp") !== -1 || btvn.indexOf("chưa đạt") !== -1 || btvn === "không") {
                    invMissingHw++;
                    invMissingHwDates.push((shortDateStr || ("Buổi " + (log.tuan || ""))) + " (" + btvnRaw + ")");
                } else if (btvn.indexOf("hoàn thành") !== -1 || btvn === "có" || btvn === "đạt" || btvn === "tốt" || btvn === "xuất sắc" || btvn.indexOf("phụ huynh") !== -1 || btvn.indexOf("nhắc") !== -1) {
                    invDoneHw++;
                } else {
                    invDoneHw++;
                }
            }
        }
    });

    var totalSess = studentLogs.length;
    var totalHours = (invBillableCount * 1.5).toFixed(1);

    // Update form labels in Box 1
    var sessValEl = document.getElementById('val_toggleSessions');
    if (sessValEl) sessValEl.textContent = invBillableCount;
    var hrsValEl = document.getElementById('val_toggleHours');
    if (hrsValEl) hrsValEl.textContent = totalHours + " giờ";

    var billingType = st.billing_type || st.billingType || st.billing_cycle || 'session';
    var isMonthly = (billingType === 'month' || billingType === 'monthly');
    var unitFee = getStudentUnitFee(st);
    var baseFee = isMonthly ? unitFee : (invBillableCount * unitFee);
    var grandTotal = Math.max(0, baseFee - discount + surcharge);
    var grandTotalStr = Number(grandTotal).toLocaleString('vi-VN') + " đ";
    var unitFeeStr = unitFee > 0 ? (Number(unitFee).toLocaleString('vi-VN') + " đ") : "--";
    var classSubjectStr = [st.classLevel, st.subject].filter(Boolean).join(' - ') || 'Gia sư';

    var periodTitle = state.customTitle || generateTuitionPeriodTitle(state.startDate, state.endDate, tmpl);
    if (tmpl === 2 && periodTitle && /^HỌC\s*PHÍ/i.test(periodTitle) && !state.isCustomTitle) {
        periodTitle = periodTitle.replace(/^HỌC\s*PHÍ/i, 'PHIẾU HỌC TẬP');
        state.customTitle = periodTitle;
        var tInp = document.getElementById('tuitionPeriodTitle');
        if (tInp) tInp.value = periodTitle;
    }

    var bankName = (tutorDataGlobal && tutorDataGlobal.bankName) ? tutorDataGlobal.bankName : "";
    var tutorPhone = (tutorDataGlobal && tutorDataGlobal.tutorPhone) 
        ? tutorDataGlobal.tutorPhone 
        : (sessionStorage.getItem('userPhone') || "");
    var bankAcc = (tutorDataGlobal && tutorDataGlobal.accountNumber) 
        ? tutorDataGlobal.accountNumber 
        : tutorPhone;
    var tutorName = (tutorDataGlobal && tutorDataGlobal.tutorName) 
        ? tutorDataGlobal.tutorName 
        : "Gia sư";

    var qrVietQrUrl = "https://img.vietqr.io/image/970422-" + bankAcc + "-compact2.png?amount=" + grandTotal + "&addInfo=HOC%20PHI%20" + encodeURIComponent(st.name.replace(/\s+/g, '%20'));
    var qrImgSrc = (tutorDataGlobal && tutorDataGlobal.qrCode) ? tutorDataGlobal.qrCode : qrVietQrUrl;

    var dateChipsHtml = '';
    var attendedLogs = [];
    if (studentLogs && studentLogs.length > 0) {
        studentLogs.forEach(function(l) {
            if (!l) return;
            var lDateText = l.studyDate || l.ngay || "";
            if (!lDateText) return;
            var rawStatus = l.trangThai || l.chuyenCan || l.attendance_status || l.attendance || l.status || "";
            var normTt = String(rawStatus).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();
            var isDaBu = (normTt.includes("da bu") || normTt.includes("hoc bu"));
            var isAbsent = !isDaBu && (
                normTt.includes("nghi") || 
                normTt.includes("huy") || 
                normTt.includes("vang") || 
                normTt.includes("off") || 
                normTt.includes("khong hoc") ||
                normTt.includes("chua hoc") ||
                normTt.includes("tam hoan") ||
                normTt === "v" || 
                normTt === "n" || 
                normTt === "x"
            );
            if (!isAbsent) {
                attendedLogs.push(l);
                var dObj = parseInputDate(lDateText);
                var chipLabel = dObj ? (String(dObj.getDate()).padStart(2, '0') + '/' + String(dObj.getMonth() + 1).padStart(2, '0')) : lDateText;
                dateChipsHtml += '<span style="background: ' + themeColors.softBg + '; color: ' + themeColors.primary + '; border: 1px solid ' + themeColors.softBorder + '; font-size: 10.5px; font-weight: 700; padding: 2.5px 6px; border-radius: 6px; text-align: center; min-width: 42px; display: inline-block;">' + escapeHtml(chipLabel) + '</span>';
            }
        });
    }

    var html = '';

    // Prepare message content for parent note (used in both Template 1 and Template 2)
    var sDisplayName = escapeHtml((toggles.student !== false) ? st.name : "học sinh");
    var msgContent = "";
    if (isMonthly) {
        msgContent = "Dạ em chào anh/chị, em gửi anh/chị phiếu học tập tổng kết của bé <b>" + sDisplayName + "</b> ạ. Học phí kỳ này (" + escapeHtml(periodTitle) + ") là <b>" + grandTotalStr + "</b>. Anh/chị xem qua và quét mã QR chuyển khoản giúp em nhé ạ. Em cảm ơn anh/chị nhiều ạ!";
    } else {
        var feeWord = (grandTotal === 0) ? "0 VNĐ" : (Number(grandTotal).toLocaleString('vi-VN') + " VNĐ");
        msgContent = "Dạ em chào anh/chị, em gửi anh/chị phiếu học tập tổng kết của bé <b>" + sDisplayName + "</b> ạ. Học phí kỳ này là <b>" + feeWord + "</b> (" + invBillableCount + " buổi). Anh/chị xem qua và quét mã QR chuyển khoản giúp em nhé ạ. Em cảm ơn anh/chị nhiều ạ!";
    }

    if (tmpl === 2) {
        var defaultSections = getDefaultInvoiceSections(st, isMonthly, unitFeeStr);

        var feedbackContent = (state.feedbackText !== undefined && state.feedbackText !== "") 
            ? formatTuitionFeedback(state.feedbackText) 
            : defaultSections.feedbackHtml;
            
        var roadmapContent = (state.roadmapText !== undefined && state.roadmapText !== "") 
            ? state.roadmapText 
            : defaultSections.roadmapHtml;
            
        var scheduleContent = (state.scheduleText !== undefined && state.scheduleText !== "") 
            ? state.scheduleText 
            : defaultSections.scheduleHtml;
            
        var tuitionExtraContent = (state.tuitionExtraText !== undefined && state.tuitionExtraText !== "") 
            ? state.tuitionExtraText 
            : defaultSections.tuitionExtraHtml;
            
        var footerNoteContent = (state.footerNoteText !== undefined && state.footerNoteText !== "") 
            ? state.footerNoteText 
            : defaultSections.footerNote;

        // ==================== MẪU 2: PHIẾU HỌC PHÍ THEO MẪU BÁO CÁO TOÀN DIỆN (ĐỒNG BỘ THEME MẪU 1) ====================
        html += '<div id="tuitionInvoiceCard" class="invoice-container template-2-card" style="border: 1px solid #E2E8F0; border-radius: 28px; padding: 26px 22px 22px 22px; background: #FFFFFF; box-shadow: 0 35px 80px -15px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04); font-family: \'Plus Jakarta Sans\', -apple-system, BlinkMacSystemFont, sans-serif; color: #1E293B; box-sizing: border-box; position: relative; overflow: hidden;">';
        html += '<div style="position: absolute; top: 0; left: 0; right: 0; height: 6px; background: linear-gradient(90deg, #8E4DFF 0%, #3B82F6 50%, #10B981 100%);"></div>';

        // 1. Centered Title
        html += '<div style="text-align: center; margin-bottom: 18px; margin-top: 4px;">';
        html += '<h2 style="font-size: 22px; font-weight: 900; color: #7C3AED; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">' + escapeHtml(periodTitle) + '</h2>';
        html += '</div>';

        // 2. 2-Column Section (THÔNG TIN HỌC SINH & TỔNG HỌC PHÍ / QR)
        html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">';

        // Left Box: THÔNG TIN HỌC SINH
        html += '<div style="background: #FFFFFF; border: 1.5px solid #E9D5FF; border-radius: 18px; padding: 13px 14px; display: flex; flex-direction: column; justify-content: space-between;">';
        html += '<div style="font-size: 11.5px; font-weight: 800; color: #7C3AED; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 6px; border-bottom: 1.5px solid #F3E8FF; margin-bottom: 4px;"><i class="fa-solid fa-graduation-cap" style="color: #7C3AED; margin-right: 5px;"></i>THÔNG TIN HỌC SINH</div>';

        if (toggles.student !== false) {
            html += '<div style="display: flex; justify-content: space-between; align-items: center; font-size: 11.5px; padding: 4.5px 0; border-bottom: 1px dotted #CBD5E1;">';
            html += '<span style="color: #64748B;">Họ và tên:</span>';
            html += '<b style="color: #0F172A;">' + escapeHtml(st.name) + '</b>';
            html += '</div>';
        }
        if (toggles.class !== false) {
            html += '<div style="display: flex; justify-content: space-between; align-items: center; font-size: 11.5px; padding: 4.5px 0; border-bottom: 1px dotted #CBD5E1;">';
            html += '<span style="color: #64748B;">Lớp:</span>';
            html += '<b style="color: #0F172A;">' + escapeHtml(classSubjectStr) + '</b>';
            html += '</div>';
        }
        if (toggles.fee !== false) {
            html += '<div style="display: flex; justify-content: space-between; align-items: center; font-size: 11.5px; padding: 4.5px 0; border-bottom: 1px dotted #CBD5E1;">';
            html += '<span style="color: #64748B;">Học phí:</span>';
            html += '<b style="color: #0F172A;">' + unitFeeStr + (isMonthly ? '/tháng' : '/buổi') + '</b>';
            html += '</div>';
        }
        if (toggles.sessions !== false) {
            html += '<div style="display: flex; justify-content: space-between; align-items: center; font-size: 11.5px; padding: 4.5px 0; border-bottom: 1px dotted #CBD5E1;">';
            html += '<span style="color: #64748B;">Buổi học:</span>';
            html += '<b style="color: #0F172A;">' + invBillableCount + ' buổi</b>';
            html += '</div>';
        }
        if (toggles.hours !== false) {
            html += '<div style="display: flex; justify-content: space-between; align-items: center; font-size: 11.5px; padding: 4.5px 0; border-bottom: 1px dotted #CBD5E1;">';
            html += '<span style="color: #64748B;">Giờ học:</span>';
            html += '<b style="color: #0F172A;">' + totalHours + ' giờ</b>';
            html += '</div>';
        }
        if (toggles.discount && discount > 0) {
            html += '<div style="display: flex; justify-content: space-between; align-items: center; font-size: 11.5px; padding: 4.5px 0; border-bottom: 1px dotted #CBD5E1; color: #EA580C;">';
            html += '<span>Giảm trừ:</span>';
            html += '<b>-' + Number(discount).toLocaleString('vi-VN') + ' đ</b>';
            html += '</div>';
        }
        if (toggles.surcharge && surcharge > 0) {
            html += '<div style="display: flex; justify-content: space-between; align-items: center; font-size: 11.5px; padding: 4.5px 0; border-bottom: 1px dotted #CBD5E1; color: #16A34A;">';
            html += '<span>Phụ thu:</span>';
            html += '<b>+' + Number(surcharge).toLocaleString('vi-VN') + ' đ</b>';
            html += '</div>';
        }
        if (toggles.dates !== false) {
            html += '<div style="padding-top: 5px;">';
            html += '<div style="font-size: 11px; color: #64748B; margin-bottom: 5px; font-weight: 600;">Ngày học:</div>';
            if (dateChipsHtml) {
                html += '<div style="display: flex; flex-wrap: wrap; gap: 4px;">';
                html += dateChipsHtml;
                html += '</div>';
            } else {
                html += '<div style="font-size: 11px; color: #94A3B8; font-style: italic;">Chưa có buổi học nào</div>';
            }
            html += '</div>';
        }

        html += '</div>'; // End Left Box

        // Right Box: TỔNG HỌC PHÍ & QR (Không hiển thị dòng ngân hàng, số TK, chủ TK)
        html += '<div style="background: linear-gradient(180deg, #FAF5FF 0%, #F5F3FF 100%); border: 1.5px solid #E9D5FF; border-radius: 18px; padding: 13px 14px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">';
        html += '<div style="width: 100%; text-align: center;">';
        html += '<div style="font-size: 11px; font-weight: 800; color: #7C3AED; text-transform: uppercase; letter-spacing: 0.5px;"><i class="fa-solid fa-receipt" style="color: #7C3AED; margin-right: 5px;"></i>TỔNG HỌC PHÍ</div>';
        html += '<div style="font-size: 23px; font-weight: 900; color: #7C3AED; letter-spacing: -0.5px; margin: 2px 0 6px 0;">' + grandTotalStr + '</div>';
        html += '</div>';

        if (toggles.qr !== false) {
            html += '<div style="margin: 4px 0; text-align: center;">';
            html += '<img src="' + safeUrlAttr(qrImgSrc) + '" style="width: 130px; height: 130px; object-fit: contain; border-radius: 10px; border: 1px solid #E9D5FF; background: #FFF; padding: 4px; box-sizing: border-box; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.08);" alt="VietQR" crossorigin="anonymous">';
            html += '<div style="font-size: 11px; font-weight: 700; color: #7C3AED; margin-top: 4px;"><i class="fa-solid fa-qrcode"></i> Quét VietQR</div>';
            html += '</div>';
        }

        html += '</div>'; // End Right Box
        html += '</div>'; // End 2-Column Section

        // 3. Section: NHẬN XÉT HỌC TẬP
        if (toggles.feedback !== false) {
            html += '<div style="margin-top: 14px;">';
            html += '<div style="font-size: 12.5px; font-weight: 800; color: #7C3AED; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 5px; border-bottom: 1.5px solid #F3E8FF; margin-bottom: 8px;"><i class="fa-regular fa-comment-dots" style="color: #7C3AED; margin-right: 5px;"></i>NHẬN XÉT HỌC TẬP</div>';
            html += '<div id="invFeedbackText" contenteditable="true" style="font-size: 11.5px; color: #1E293B; line-height: 1.6; outline: none; padding: 2px 0;" onpaste="handleTuitionFeedbackPaste(event)" oninput="onTuitionCustomFieldInput(\'feedbackText\', this.innerHTML)">' + feedbackContent + '</div>';
            html += '</div>';
        }

        // 4. Section: LỊCH HỌC (Full width, không có cột học phí ở góc)
        if (toggles.schedule !== false) {
            html += '<div style="margin-top: 14px;">';
            html += '<div style="font-size: 12px; font-weight: 800; color: #7C3AED; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px; border-bottom: 1.5px solid #F3E8FF; margin-bottom: 6px;"><i class="fa-solid fa-calendar-check" style="color: #7C3AED; margin-right: 5px;"></i>LỊCH HỌC</div>';
            html += '<div id="invScheduleText" contenteditable="true" style="font-size: 11.5px; color: #1E293B; line-height: 1.6; outline: none; padding: 2px 0;" oninput="onTuitionCustomFieldInput(\'scheduleText\', this.innerHTML)">' + scheduleContent + '</div>';
            html += '</div>';
        }

        // 5. Footer Banner Lời dặn dò
        html += '<div id="invFooterNoteText" contenteditable="true" style="background: linear-gradient(135deg, #FAF5FF 0%, #F5F3FF 100%); color: #7C3AED; border: 1px solid #E9D5FF; border-radius: 20px; padding: 9px 16px; text-align: center; font-size: 11.5px; font-weight: 600; outline: none; margin-top: 16px; line-height: 1.5;" oninput="onTuitionCustomFieldInput(\'footerNoteText\', this.innerText)">' + escapeHtml(footerNoteContent) + '</div>';

        html += '</div>'; // End Mẫu 2 #tuitionInvoiceCard
    } else {
        // ==================== MẪU 1: APPROVED E-RECEIPT (ẢNH 2) ====================
        html += '<div id="tuitionInvoiceCard" class="invoice-container">';
        
        // 1. Header
        html += '<div class="inv-head">';
        html += '<div class="inv-head-left">';
        html += '<div class="inv-avatar"><i class="fa-solid fa-graduation-cap"></i></div>';
        html += '<div class="inv-user-meta">';
        html += '<span class="inv-tag-mini">HỌC SINH</span>';
        html += '<h2 id="invStudentName">' + escapeHtml(toggles.student !== false ? st.name : 'Học sinh') + '</h2>';
        if (toggles.class === true) {
            html += '<div style="font-size: 11.5px; color: #64748B; font-weight: 600; margin-top: 2px;">' + escapeHtml(classSubjectStr) + '</div>';
        }
        html += '</div></div>';
        html += '<div class="inv-head-right">';
        html += '<span class="inv-pill-status" id="invMonthDisplay"><i class="fa-solid fa-calendar-days"></i> ' + escapeHtml(periodTitle) + '</span>';
        html += '</div></div>';

        // 2. Section 1: Study Metrics
        if (toggles.sessions !== false) {
            html += '<div class="inv-section-title"><i class="fa-solid fa-chart-pie"></i> TỔNG KẾT KẾT QUẢ KỲ NÀY</div>';
            html += '<div class="metrics-grid">';
            
            // Box Chuyên cần
            html += '<div class="metric-card">';
            html += '<div class="metric-card-header">';
            html += '<span><i class="fa-solid fa-calendar-check text-green"></i> Chuyên cần</span>';
            html += '<span class="text-green font-bold" id="invAttTotalBadge">' + invBillableCount + ' Buổi</span>';
            html += '</div>';
            html += '<div class="metric-badges">';
            html += '<div class="m-badge"><div class="m-num text-green" id="invAttP">' + invPresent + '</div><div class="m-lbl">Buổi học</div></div>';
            html += '<div class="m-badge"><div class="m-num text-amber" id="invAttA">' + invAbsent + '</div><div class="m-lbl">Nghỉ phép</div></div>';
            html += '<div class="m-badge"><div class="m-num text-purple" id="invAttB">' + invMakeup + '</div><div class="m-lbl">Đã bù</div></div>';
            html += '</div>';
            html += '<div class="metric-notes" id="invAbsentDates">';
            html += '<div><span>Nghỉ phép:</span> ' + escapeHtml(invAbsentDates.length > 0 ? invAbsentDates.join(", ") : "Không có") + '</div>';
            html += '</div>';
            html += '</div>';

            // Box Bài tập về nhà
            html += '<div class="metric-card">';
            html += '<div class="metric-card-header">';
            html += '<span><i class="fa-solid fa-book-open text-purple"></i> Bài tập về nhà</span>';
            html += '<span class="text-purple font-bold" id="invHwTotalBadge">' + invBillableCount + ' Buổi</span>';
            html += '</div>';
            html += '<div class="metric-badges">';
            html += '<div class="m-badge"><div class="m-num text-green" id="invHwDone">' + invDoneHw + '</div><div class="m-lbl">Đủ bài</div></div>';
            html += '<div class="m-badge"><div class="m-num text-red" id="invHwMiss">' + invMissingHw + '</div><div class="m-lbl">Thiếu bài</div></div>';
            html += '<div class="m-badge"><div class="m-num" id="invHwLate">' + invLateHw + '</div><div class="m-lbl">Nộp trễ</div></div>';
            html += '</div>';
            html += '<div class="metric-notes" id="invHwMissDates">';
            html += '<div><span>Thiếu bài:</span> ' + escapeHtml(invMissingHwDates.length > 0 ? invMissingHwDates.join(", ") : "Không thiếu bài") + '</div>';
            html += '</div>';
            html += '</div>';

            html += '</div>';
        }

        // Chi tiết ngày học (nếu toggle bật)
        if (toggles.dates === true) {
            html += '<div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 10px 12px; margin-top: 10px;">';
            if (attendedLogs.length > 0) {
                html += '<div style="font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 6px;"><i class="fa-solid fa-calendar-days" style="color: #7C3AED;"></i> Chi tiết các ngày học (' + attendedLogs.length + ' buổi):</div>';
                html += '<div style="display: flex; flex-wrap: wrap; gap: 5px;">';
                attendedLogs.forEach(function(l) {
                    var lDateText = l.studyDate || l.ngay || "";
                    var dObj = parseInputDate(lDateText);
                    var chipLabel = dObj ? (String(dObj.getDate()).padStart(2, '0') + '/' + String(dObj.getMonth() + 1).padStart(2, '0')) : lDateText;
                    html += '<span style="background: #FFFFFF; border: 1px solid #CBD5E1; color: #334155; font-size: 11px; padding: 2px 7px; border-radius: 6px; font-weight: 600;">' + escapeHtml(chipLabel) + '</span>';
                });
                html += '</div>';
            } else {
                html += '<div style="font-size: 11.5px; color: #94A3B8; font-style: italic;"><i class="fa-solid fa-calendar-days" style="color: #94A3B8; margin-right: 4px;"></i> Chưa có buổi học nào trong kỳ</div>';
            }
            html += '</div>';
        }

        // 3. Section 2: Tuition Breakdown
        html += '<div class="fee-card">';
        if (toggles.fee !== false) {
            var feeUnitLabel = isMonthly ? "Hình thức thu học phí:" : "Đơn giá mỗi buổi học:";
            var feeUnitValue = isMonthly ? ("Trọn gói theo tháng (" + Number(unitFee).toLocaleString('vi-VN') + " VNĐ)") : (Number(unitFee).toLocaleString('vi-VN') + " VNĐ");
            html += '<div class="fee-row"><span id="invFeeUnitLabel">' + feeUnitLabel + '</span><b id="invFeeUnitValue">' + feeUnitValue + '</b></div>';
        }
        if (toggles.sessions !== false) {
            var feeCalcText = isMonthly ? "Kỳ học phí:" : "Thời lượng học kỳ này:";
            var feeCalcTotal = isMonthly ? periodTitle : (invBillableCount + " buổi");
            html += '<div class="fee-row"><span id="invFeeCalcText">' + feeCalcText + '</span><b id="invFeeCalcTotal">' + escapeHtml(feeCalcTotal) + '</b></div>';
        }
        if (toggles.discount && discount > 0) {
            html += '<div class="fee-row" style="color: #EA580C;"><span>Giảm trừ học phí:</span><b>-' + Number(discount).toLocaleString('vi-VN') + ' đ</b></div>';
        }
        if (toggles.surcharge && surcharge > 0) {
            html += '<div class="fee-row" style="color: #16A34A;"><span>Phụ thu thêm:</span><b>+' + Number(surcharge).toLocaleString('vi-VN') + ' đ</b></div>';
        }
        html += '<div class="fee-row grand-total">';
        html += '<span class="total-label">TỔNG HỌC PHÍ KỲ NÀY</span>';
        html += '<span class="total-val" id="invGrandTotal">' + grandTotalStr + '</span>';
        html += '</div></div>';

        // 4. Section 3: Bottom Action (Note & QR)
        var bottomGridCols = (toggles.qr !== false) ? 'grid-template-columns: 1fr 190px;' : 'grid-template-columns: 1fr;';
        html += '<div class="bottom-action-container" style="' + bottomGridCols + '">';
        html += '<div class="msg-box">';
        html += '<div>';
        html += '<div class="msg-header"><i class="fa-regular fa-comment-dots"></i> Lời nhắn gửi phụ huynh</div>';
        html += '<div class="msg-text" id="invTextarea" contenteditable="true">' + msgContent + '</div>';
        html += '</div>';
        html += '<div class="msg-footer">Đồng hành cùng sự tiến bộ của học sinh!</div>';
        html += '</div>';

        if (toggles.qr !== false) {
            html += '<div class="qr-card">';
            html += '<img src="' + safeUrlAttr(qrImgSrc) + '" id="invQrImg" class="qr-img" alt="QR Code" crossorigin="anonymous">';
            html += '<div class="qr-label" id="invQrText"><i class="fa-solid fa-qrcode"></i> Quét VietQR</div>';
            html += '</div>';
        }
        html += '</div>';

        html += '</div>'; // End Mẫu 1 #tuitionInvoiceCard
    }

    // Áp dụng màu riêng của phiếu (chỉ phiếu, không đụng theme hệ thống)
    html = applyInvoiceThemeToHtml(html);
    html = html.replace('id="tuitionInvoiceCard" class="invoice-container', 'id="tuitionInvoiceCard" data-inv-theme="' + getInvoiceThemeId() + '" class="invoice-container inv-themed');
    modalBody.innerHTML = html;
    var invCardEl = document.getElementById('tuitionInvoiceCard');
    if (invCardEl) invCardEl.style.cssText += ';' + invoiceThemeCssVars();
    renderInvoiceThemeSwatches();
}
window.renderTuitionLivePreview = renderTuitionLivePreview;

function switchTuitionTemplate(tmpl, isInitial) {
    window.currentTuitionTemplate = tmpl;
    if (window.tuitionInvoiceModalState) {
        window.tuitionInvoiceModalState.template = tmpl;
        if (!window.tuitionInvoiceModalState.isCustomTitle) {
            var autoTitle = generateTuitionPeriodTitle(
                window.tuitionInvoiceModalState.startDate, 
                window.tuitionInvoiceModalState.endDate, 
                tmpl
            );
            window.tuitionInvoiceModalState.customTitle = autoTitle;
            var titleInp = document.getElementById('tuitionPeriodTitle');
            if (titleInp) titleInp.value = autoTitle;
        }
    }
    if (!isInitial) {
        window.tuitionInvoiceHasUnsavedChanges = true;
    }
    var b1 = document.getElementById('btnTemplate1');
    var b2 = document.getElementById('btnTemplate2');
    if (b1 && b2) {
        if (tmpl === 1) {
            b1.classList.add('active');
            b2.classList.remove('active');
        } else {
            b2.classList.add('active');
            b1.classList.remove('active');
        }
    }
    var previewTitleEl = document.getElementById('tuitionPreviewTitle');
    if (previewTitleEl) {
        previewTitleEl.textContent = "Phiếu hiển thị trực tiếp • Mẫu " + tmpl;
    }
    if (window.currentTuitionInvoiceStudent && typeof buildTuitionModalForm === 'function') {
        buildTuitionModalForm(window.currentTuitionInvoiceStudent, window.currentTuitionInvoiceLogs);
    }
    renderTuitionLivePreview();
    autoSaveTuitionDraft();
}
window.switchTuitionTemplate = switchTuitionTemplate;

function openStudentInvoiceModal(studentName) {
    var modal = document.getElementById('tutorTuitionInvoiceModal');
    var modalBody = document.getElementById('tuitionInvoiceModalBody');
    if (!modal || !modalBody) return;

    var students = (typeof getTutorStudentsResolved === 'function') 
        ? getTutorStudentsResolved() 
        : ((tutorDataGlobal && tutorDataGlobal.students) ? tutorDataGlobal.students : []);
    var st = students.find(function(s) { return s.name.trim() === studentName.trim(); });
    if (!st) return;

    if ((!st.logs || st.logs.length === 0) && typeof google !== 'undefined' && google.script && google.script.run && google.script.run.getStudentDetailsForTutor) {
        if (typeof showToast === 'function') showToast("Đang tải dữ liệu học tập của " + st.name + "...", "info");
        google.script.run
            .withSuccessHandler(function(res) {
                if (res && res.logs) st.logs = res.logs;
                if (res && res.student && res.student.tuition) st.tuition = res.student.tuition;
                if (res && res.student && res.student.billing_type) st.billing_type = res.student.billing_type;
                openStudentInvoiceModal(studentName);
            })
            .withFailureHandler(function(err) {
                if (typeof showToast === 'function') showToast("Lỗi tải dữ liệu: " + err, "error");
            })
            .getStudentDetailsForTutor(st.phone, st.name);
        return;
    }

    var tutorPhone = (tutorDataGlobal && tutorDataGlobal.tutorPhone) 
        ? tutorDataGlobal.tutorPhone 
        : (sessionStorage.getItem('userPhone') || "");
    var bAcc = (tutorDataGlobal && tutorDataGlobal.accountNumber) 
        ? tutorDataGlobal.accountNumber 
        : tutorPhone;
    var bName = (tutorDataGlobal && tutorDataGlobal.bankName) ? tutorDataGlobal.bankName : "";
    var tName = (tutorDataGlobal && tutorDataGlobal.tutorName) ? tutorDataGlobal.tutorName : "Gia sư";

    var headerSub = document.getElementById('tuitionModalHeaderSubtitle');
    if (headerSub) {
        headerSub.textContent = "GV. " + tName + " · STK " + bAcc;
    }

    var stNameEl = document.getElementById('tuitionModalStudentName');
    if (stNameEl) stNameEl.textContent = st.name;
    var stBadge = document.getElementById('tuitionModalStudentBadge');
    if (stBadge) stBadge.textContent = st.classLevel || 'Học sinh';
    var bankInfoEl = document.getElementById('tuitionModalBankInfo');
    if (bankInfoEl) {
        bankInfoEl.textContent = "STK: " + bAcc + " (" + bName + ")";
    }

    var selMonth = document.getElementById('tuitionMonthFilter') ? document.getElementById('tuitionMonthFilter').value : 'all';
    var now = new Date();
    var yr = now.getFullYear();
    var mo = now.getMonth();
    if (selMonth && selMonth !== 'all') {
        var mParts = selMonth.split('/');
        if (mParts.length >= 2) {
            mo = parseInt(mParts[0], 10) - 1;
            yr = parseInt(mParts[1], 10);
        }
    } else {
        // If 'all', check if current month has logs for this student; if not, pick the LATEST month with actual logs!
        var hasLogsInCurrentMonth = false;
        if (st.logs && Array.isArray(st.logs)) {
            for (var i = 0; i < st.logs.length; i++) {
                var pDate = parseLogDate(st.logs[i].studyDate || st.logs[i].ngay);
                if (pDate && pDate.getMonth() === mo && pDate.getFullYear() === yr) {
                    hasLogsInCurrentMonth = true;
                    break;
                }
            }
            if (!hasLogsInCurrentMonth && st.logs.length > 0) {
                for (var i = st.logs.length - 1; i >= 0; i--) {
                    var pDate = parseLogDate(st.logs[i].studyDate || st.logs[i].ngay);
                    if (pDate) {
                        mo = pDate.getMonth();
                        yr = pDate.getFullYear();
                        break;
                    }
                }
            }
        }
    }
    var firstD = new Date(yr, mo, 1);
    var lastD = new Date(yr, mo + 1, 0);
    var defaultStartStr = formatToDmy(firstD);
    var defaultEndStr = formatToDmy(lastD);
    var defaultTmpl = window.currentTuitionTemplate || 1;
    var defaultTitle = generateTuitionPeriodTitle(defaultStartStr, defaultEndStr, defaultTmpl);

    // Check for existing draft in localStorage
    var draftKey = 'tuitionDraft_' + st.name.trim();
    var draftRaw = null;
    try {
        draftRaw = localStorage.getItem(draftKey);
    } catch(e) {}

    var restoredDraft = false;
    var draftObj = null;
    if (draftRaw) {
        try {
            draftObj = JSON.parse(draftRaw);
            restoredDraft = true;
        } catch(e) {}
    }

    if (restoredDraft && draftObj) {
        var sDateVal = formatToDmy(draftObj.startDate) || defaultStartStr;
        var eDateVal = formatToDmy(draftObj.endDate) || defaultEndStr;
        // If draft range has 0 logs while default range has logs, and not custom titled, use default range
        if (!draftObj.isCustomTitle && sDateVal !== defaultStartStr) {
            var hasLogsInDraft = false;
            var dS = parseInputDate(sDateVal);
            var dE = parseInputDate(eDateVal);
            if (dS) dS.setHours(0, 0, 0, 0);
            if (dE) dE.setHours(23, 59, 59, 999);
            if (st.logs && Array.isArray(st.logs)) {
                for (var i = 0; i < st.logs.length; i++) {
                    var lD = parseLogDate(st.logs[i].studyDate || st.logs[i].ngay);
                    if (lD && (!dS || lD >= dS) && (!dE || lD <= dE)) {
                        hasLogsInDraft = true;
                        break;
                    }
                }
            }
            if (!hasLogsInDraft) {
                sDateVal = defaultStartStr;
                eDateVal = defaultEndStr;
            }
        }

        var restoredTmpl = draftObj.template || 1;
        window.tuitionInvoiceModalState = {
            studentName: st.name,
            template: restoredTmpl,
            toggles: draftObj.toggles || {
                student: true,
                class: true,
                fee: true,
                sessions: true,
                hours: true,
                dates: true,
                discount: false,
                surcharge: false,
                qr: true,
                feedback: true,
                roadmap: true,
                schedule: true
            },
            discountAmount: draftObj.discountAmount || 0,
            surchargeAmount: draftObj.surchargeAmount || 0,
            startDate: sDateVal,
            endDate: eDateVal,
            customTitle: (function() {
                var t = draftObj.customTitle || generateTuitionPeriodTitle(sDateVal, eDateVal, restoredTmpl);
                if (restoredTmpl === 2 && t && /^HỌC\s*PHÍ/i.test(t) && !draftObj.isCustomTitle) {
                    t = t.replace(/^HỌC\s*PHÍ/i, 'PHIẾU HỌC TẬP');
                }
                return t;
            })(),
            isCustomTitle: !!draftObj.isCustomTitle,
            feedbackText: (draftObj.feedbackText && (draftObj.feedbackText.indexOf("Chưa chủ động trong quá trình học") !== -1 || draftObj.feedbackText.indexOf("tam giác đồng dạng") !== -1)) ? "" : (draftObj.feedbackText || ""),
            roadmapText: (draftObj.roadmapText && draftObj.roadmapText.indexOf("Hoàn thành chuyên đề hệ phương trình") !== -1) ? "" : (draftObj.roadmapText || ""),
            scheduleText: draftObj.scheduleText || "",
            tuitionExtraText: draftObj.tuitionExtraText || "",
            footerNoteText: draftObj.footerNoteText || "",
            restoredFromDraft: true,
            isDraftSaved: true
        };
    } else {
        window.tuitionInvoiceModalState = {
            studentName: st.name,
            template: defaultTmpl,
            toggles: {
                student: true,
                class: true,
                fee: true,
                sessions: true,
                hours: true,
                dates: true,
                discount: false,
                surcharge: false,
                qr: true,
                feedback: true,
                roadmap: true,
                schedule: true
            },
            discountAmount: 0,
            surchargeAmount: 0,
            startDate: defaultStartStr,
            endDate: defaultEndStr,
            customTitle: defaultTitle,
            isCustomTitle: false,
            feedbackText: "",
            roadmapText: "",
            scheduleText: "",
            tuitionExtraText: "",
            footerNoteText: "",
            restoredFromDraft: false,
            isDraftSaved: false
        };
    }

    var draftTxt = document.getElementById('tuitionDraftRestoredText');
    if (draftTxt && draftTxt.parentElement) {
        draftTxt.parentElement.style.display = restoredDraft ? 'flex' : 'none';
    }

    if (typeof switchTuitionTemplate === 'function') {
        switchTuitionTemplate(window.tuitionInvoiceModalState.template, true);
    }

    // Filter logs for this student using startDate and endDate
    var sDate = parseInputDate(window.tuitionInvoiceModalState.startDate);
    var eDate = parseInputDate(window.tuitionInvoiceModalState.endDate);
    if (sDate) sDate.setHours(0, 0, 0, 0);
    if (eDate) eDate.setHours(23, 59, 59, 999);

    var studentLogs = [];
    if (st.logs && Array.isArray(st.logs)) {
        st.logs.forEach(function(l) {
            if (!l) return;
            var lDate = parseLogDate(l.studyDate || l.ngay);
            if (lDate) {
                if (sDate && lDate < sDate) return;
                if (eDate && lDate > eDate) return;
                studentLogs.push(l);
            } else if (!sDate && !eDate) {
                studentLogs.push(l);
            }
        });
    }

    buildTuitionModalForm(st, studentLogs);
    renderTuitionLivePreview();

    window.tuitionInvoiceHasUnsavedChanges = false;
    modal.style.display = "flex";
    modal.setAttribute('data-student', st.name);
    modal.setAttribute('data-start', (window.tuitionInvoiceModalState.startDate || ""));
    modal.setAttribute('data-month', (window.tuitionInvoiceModalState.startDate || "").replace(/-/g, ''));
    
    // Đồng bộ trạng thái nút lưu bản nháp theo dữ liệu học sinh
    updateTuitionDraftButtonUI(restoredDraft);

    // Tự động kích hoạt hướng dẫn nếu gia sư mở tạo phiếu học phí lần đầu
    var obOverlay = document.getElementById('onboardingOverlay');
    if (obOverlay && obOverlay.style.display !== 'none' && typeof finishOnboarding === 'function') {
        finishOnboarding(true);
    }
    if (typeof shouldShowTabOnboarding === 'function' && shouldShowTabOnboarding('invoice')) {
        setTimeout(function() {
            var curModal = document.getElementById('tutorTuitionInvoiceModal');
            if (curModal && curModal.style.display !== 'none' && typeof startTabOnboarding === 'function') {
                startTabOnboarding('invoice');
            }
        }, 500);
    }
}
window.openStudentInvoiceModal = openStudentInvoiceModal;

function showCustomConfirm(message, onConfirm, onCancel) {
    var msgEl = document.getElementById('confirmModalMessage');
    if (msgEl) msgEl.innerText = message;
    var modal = document.getElementById('customConfirmModal');
    if (modal) modal.style.display = 'flex';
    
    var btnCancel = document.getElementById('btnConfirmCancel');
    var btnOk = document.getElementById('btnConfirmOk');
    
    if (btnCancel) {
        btnCancel.onclick = function() {
            if (modal) modal.style.display = 'none';
            if (typeof onCancel === 'function') onCancel();
        };
    }
    
    if (btnOk) {
        btnOk.onclick = function() {
            if (modal) modal.style.display = 'none';
            if (typeof onConfirm === 'function') onConfirm();
        };
    }
}
window.showCustomConfirm = showCustomConfirm;

function closeStudentInvoiceModal(isExplicitCancel) {
    if (isExplicitCancel && window.tuitionInvoiceHasUnsavedChanges) {
        showCustomConfirm("Bỏ các thay đổi chưa lưu?", function() {
            window.tuitionInvoiceHasUnsavedChanges = false;
            var modal = document.getElementById('tutorTuitionInvoiceModal');
            if (modal) modal.style.display = "none";
            if (typeof finishOnboarding === 'function') {
                var obOverlay = document.getElementById('onboardingOverlay');
                if (obOverlay && obOverlay.style.display !== 'none' && currentOnboardingTab === 'invoice') {
                    finishOnboarding(true);
                }
            }
        });
        return;
    }
    window.tuitionInvoiceHasUnsavedChanges = false;
    var modal = document.getElementById('tutorTuitionInvoiceModal');
    if (modal) modal.style.display = "none";
    if (typeof finishOnboarding === 'function') {
        var obOverlay = document.getElementById('onboardingOverlay');
        if (obOverlay && obOverlay.style.display !== 'none' && currentOnboardingTab === 'invoice') {
            finishOnboarding(true);
        }
    }
}
window.closeStudentInvoiceModal = closeStudentInvoiceModal;

function createPdfBlobFromJpeg(jpegBytes, imgWidth, imgHeight, customFit) {
    var a4W = 595.28;
    var a4H = 841.89;
    var margin = 20;

    var pageW = a4W;
    var pageH = a4H;

    // Nếu ảnh dài hơn tỷ lệ A4 tiêu chuẩn (như báo cáo nhiều buổi học), tự động co giãn chiều cao trang
    // để nội dung luôn hiển thị rộng rãi, sắc nét, không bị thu nhỏ li ti
    if (customFit || (imgHeight / imgWidth > a4H / a4W)) {
        var renderW = a4W - margin * 2;
        var renderH = (imgHeight / imgWidth) * renderW;
        pageH = renderH + margin * 2;
        var posX = margin;
        var posY = margin;
    } else {
        var maxW = a4W - margin * 2;
        var maxH = a4H - margin * 2;
        var renderW = maxW;
        var renderH = (imgHeight / imgWidth) * renderW;
        if (renderH > maxH) {
            renderH = maxH;
            renderW = (imgWidth / imgHeight) * renderH;
        }
        var posX = (a4W - renderW) / 2;
        var posY = (a4H - renderH) / 2;
    }

    var contentStream = 'q\n' +
        renderW.toFixed(2) + ' 0 0 ' + renderH.toFixed(2) + ' ' + posX.toFixed(2) + ' ' + posY.toFixed(2) + ' cm\n' +
        '/Img Do\n' +
        'Q\n';

    var header = '%PDF-1.4\n';
    var obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
    var obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
    var obj3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + pageW.toFixed(2) + ' ' + pageH.toFixed(2) + '] /Resources << /XObject << /Img 4 0 R >> >> /Contents 5 0 R >>\nendobj\n';
    var obj4Start = '4 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + imgWidth + ' /Height ' + imgHeight + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpegBytes.length + ' >>\nstream\n';
    var obj4End = '\nendstream\nendobj\n';
    var obj5 = '5 0 obj\n<< /Length ' + contentStream.length + ' >>\nstream\n' + contentStream + 'endstream\nendobj\n';

    var enc = new TextEncoder();
    var bHeader = enc.encode(header);
    var bObj1 = enc.encode(obj1);
    var bObj2 = enc.encode(obj2);
    var bObj3 = enc.encode(obj3);
    var bObj4Start = enc.encode(obj4Start);
    var bObj4End = enc.encode(obj4End);
    var bObj5 = enc.encode(obj5);

    var off1 = bHeader.length;
    var off2 = off1 + bObj1.length;
    var off3 = off2 + bObj2.length;
    var off4 = off3 + bObj3.length;
    var off5 = off4 + bObj4Start.length + jpegBytes.length + bObj4End.length;
    var xrefOff = off5 + bObj5.length;

    var xref = 'xref\n0 6\n0000000000 65535 f \n' +
        String(off1).padStart(10, '0') + ' 00000 n \n' +
        String(off2).padStart(10, '0') + ' 00000 n \n' +
        String(off3).padStart(10, '0') + ' 00000 n \n' +
        String(off4).padStart(10, '0') + ' 00000 n \n' +
        String(off5).padStart(10, '0') + ' 00000 n \n' +
        'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xrefOff + '\n%%EOF\n';
    var bXref = enc.encode(xref);

    return new Blob([
        bHeader,
        bObj1,
        bObj2,
        bObj3,
        bObj4Start,
        jpegBytes,
        bObj4End,
        bObj5,
        bXref
    ], { type: 'application/pdf' });
}

function exportTuitionModalPdf() {
    var card = document.getElementById('tuitionInvoiceCard');
    var modal = document.getElementById('tutorTuitionInvoiceModal');
    if (!card) {
        if (typeof showToast === 'function') showToast("Không tìm thấy phiếu học phí!", "error");
        return;
    }

    var state = window.tuitionInvoiceModalState || {};
    var sName = state.studentName || (modal ? modal.getAttribute('data-student') : "") || "HocSinh";
    var startDateStr = state.startDate || (modal ? modal.getAttribute('data-start') : "") || "";
    var fileName = getTuitionInvoiceFileName(sName, startDateStr).replace(/\.png$/i, '.pdf');

    var btn = document.getElementById('btnTuitionExportPdf');
    var originalText = btn ? btn.innerHTML : "";
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Đang tạo PDF...';
    }

    var restoreBtn = function() {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    };

    if (typeof html2canvas !== 'function') {
        restoreBtn();
        if (typeof showToast === 'function') showToast("Thư viện html2canvas chưa sẵn sàng!", "error");
        return;
    }

    html2canvas(card, {
        scale: 2,
        backgroundColor: "#FFFFFF",
        useCORS: true,
        logging: false
    }).then(function(canvas) {
        try {
            var dataUrl = canvas.toDataURL('image/jpeg', 0.95);
            var base64 = dataUrl.split(',')[1];
            var binaryStr = atob(base64);
            var len = binaryStr.length;
            var jpegBytes = new Uint8Array(len);
            for (var i = 0; i < len; i++) {
                jpegBytes[i] = binaryStr.charCodeAt(i);
            }

            var pdfBlob = createPdfBlobFromJpeg(jpegBytes, canvas.width, canvas.height);
            var url = URL.createObjectURL(pdfBlob);
            var a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(function() {
                URL.revokeObjectURL(url);
            }, 5000);

            restoreBtn();
            if (typeof showToast === 'function') {
                showToast("Đã tải phiếu học tập PDF thành công!", "success");
            }
        } catch(err) {
            console.error("PDF generation error:", err);
            restoreBtn();
            if (typeof showToast === 'function') {
                showToast("Lỗi khi tạo file PDF!", "error");
            }
        }
    }).catch(function(err) {
        console.error("html2canvas error during PDF export:", err);
        restoreBtn();
        if (typeof showToast === 'function') {
            showToast("Lỗi khi chụp phiếu học phí để xuất PDF!", "error");
        }
    });
}
window.exportTuitionModalPdf = exportTuitionModalPdf;

function copyTuitionModalImage() {
    var card = document.getElementById('tuitionInvoiceCard');
    if (!card) {
        if (typeof showToast === 'function') showToast("Không tìm thấy phiếu học phí!", "error");
        return;
    }

    var btn = document.getElementById('btnTuitionCopyImage');
    var originalText = btn ? btn.innerHTML : "";
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Đang copy...';
    }

    var restoreBtn = function() {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    };

    if (typeof html2canvas !== 'function') {
        restoreBtn();
        if (typeof showToast === 'function') showToast("Thư viện html2canvas chưa sẵn sàng!", "error");
        return;
    }

    html2canvas(card, {
        scale: 2,
        backgroundColor: "#FFFFFF",
        useCORS: true,
        logging: false
    }).then(function(canvas) {
        if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
            restoreBtn();
            if (typeof showToast === 'function') {
                showToast("Nhấn chuột phải → Lưu ảnh để tải về!", "info");
            }
            return;
        }

        canvas.toBlob(function(blob) {
            if (!blob) {
                restoreBtn();
                if (typeof showToast === 'function') {
                    showToast("Nhấn chuột phải → Lưu ảnh để tải về!", "info");
                }
                return;
            }

            try {
                var item = new ClipboardItem({ 'image/png': blob });
                navigator.clipboard.write([item]).then(function() {
                    restoreBtn();
                    if (typeof showToast === 'function') {
                        showToast("Đã copy ảnh!", "success");
                    }
                }).catch(function(err) {
                    console.warn("Clipboard write error:", err);
                    restoreBtn();
                    if (typeof showToast === 'function') {
                        showToast("Nhấn chuột phải → Lưu ảnh để tải về!", "info");
                    }
                });
            } catch(e) {
                console.warn("ClipboardItem creation error:", e);
                restoreBtn();
                if (typeof showToast === 'function') {
                    showToast("Nhấn chuột phải → Lưu ảnh để tải về!", "info");
                }
            }
        }, 'image/png');
    }).catch(function(err) {
        console.error("Copy tuition image error:", err);
        restoreBtn();
        if (typeof showToast === 'function') {
            showToast("Lỗi khi xử lý ảnh phiếu học phí!", "error");
        }
    });
}
window.copyTuitionModalImage = copyTuitionModalImage;

/**
 * Sao chép Prompt AI nhận xét học tập 30 ngày cho học sinh
 * Tổng hợp dữ liệu thực tế: Chuyên cần, BTVN, Điểm số, Nhận xét từng buổi của gia sư
 * Yêu cầu AI viết đoạn nhận xét hoàn chỉnh (100 - 180 từ)
 */
function copyTuitionAIPrompt() {
    var modal = document.getElementById('tutorTuitionInvoiceModal');
    var state = window.tuitionInvoiceModalState || {};
    var sName = state.studentName || (modal ? modal.getAttribute('data-student') : "") || "";
    
    var students = (typeof getTutorStudentsResolved === 'function') 
        ? getTutorStudentsResolved() 
        : ((tutorDataGlobal && tutorDataGlobal.students) ? tutorDataGlobal.students : []);
    
    var st = window.currentTuitionInvoiceStudent || students.find(function(s) { 
        return s && s.name && sName && s.name.trim().toLowerCase() === sName.trim().toLowerCase(); 
    });
    
    if (!st && students.length > 0) {
        st = students[0];
    }
    
    if (!st) {
        if (typeof showToast === 'function') showToast("Không tìm thấy thông tin học sinh để tạo Prompt!", "error");
        return;
    }

    // 1. Xác định kỳ học / khoảng thời gian đánh giá (~30 ngày)
    var sDate = parseInputDate(state.startDate);
    var eDate = parseInputDate(state.endDate);
    
    if (!eDate || isNaN(eDate.getTime())) {
        eDate = new Date();
    }
    if (!sDate || isNaN(sDate.getTime())) {
        sDate = new Date(eDate);
        sDate.setDate(sDate.getDate() - 30);
    }
    
    var sDateStr = formatToDmy(sDate);
    var eDateStr = formatToDmy(eDate);
    
    var sTime = new Date(sDate); sTime.setHours(0, 0, 0, 0);
    var eTime = new Date(eDate); eTime.setHours(23, 59, 59, 999);

    // 2. Lọc danh sách nhật ký học tập trong kỳ 30 ngày
    var allLogs = (st.logs && Array.isArray(st.logs)) ? st.logs : [];
    var periodLogs = [];
    
    allLogs.forEach(function(l) {
        if (!l) return;
        var lDate = parseLogDate(l.studyDate || l.ngay);
        if (lDate && !isNaN(lDate.getTime())) {
            if (lDate >= sTime && lDate <= eTime) {
                periodLogs.push({ log: l, date: lDate });
            }
        }
    });

    // Nếu khoảng ngày không có logs nào (ví dụ gia sư chọn khoảng ngày chưa có log), fallback lấy các buổi gần nhất
    if (periodLogs.length === 0 && allLogs.length > 0) {
        allLogs.slice(-12).forEach(function(l) {
            if (!l) return;
            var lDate = parseLogDate(l.studyDate || l.ngay) || new Date();
            periodLogs.push({ log: l, date: lDate });
        });
    }

    // Sắp xếp nhật ký theo thứ tự thời gian tăng dần
    periodLogs.sort(function(a, b) {
        return a.date.getTime() - b.date.getTime();
    });

    // 3. Phân tích chi tiết: Chuyên cần, BTVN, Điểm số, Lời nhận xét
    var totalSessions = periodLogs.length;
    var presentCount = 0;
    var makeupCount = 0;
    var absentCount = 0;
    var absentDates = [];
    
    var hwTotal = 0;
    var hwDone = 0;
    var hwLate = 0;
    var hwMissing = 0;
    
    var scoreRecords = [];
    var sessionNotes = [];

    periodLogs.forEach(function(item, idx) {
        var l = item.log;
        var dateText = formatToDmy(item.date) || l.studyDate || l.ngay || ("Buổi " + (idx + 1));
        var lesson = (l.noiDung || l.baiHoc || "").trim();
        var comment = (l.nhanXet || "").trim();
        
        // Trạng thái chuyên cần
        var rawStatus = l.trangThai || l.chuyenCan || l.attendance_status || l.attendance || l.status || "Đã học";
        var normTt = String(rawStatus).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();
        var isDaBu = (normTt.includes("da bu") || normTt.includes("hoc bu"));
        var isAbsent = !isDaBu && (
            normTt.includes("nghi") || 
            normTt.includes("huy") || 
            normTt.includes("vang") || 
            normTt.includes("off") || 
            normTt.includes("khong hoc") ||
            normTt.includes("chua hoc") ||
            normTt.includes("tam hoan") ||
            normTt === "v" || normTt === "n" || normTt === "x"
        );
        var isPresent = !isAbsent && !isDaBu;

        if (isDaBu) {
            makeupCount++;
        } else if (isAbsent) {
            absentCount++;
            absentDates.push(dateText);
        } else {
            presentCount++;
        }

        // BTVN (Chỉ tính cho các buổi tham gia học)
        if (isPresent || isDaBu) {
            var btvnRaw = (l.danhGiaBTVN || l.btvn || "").trim();
            var btvn = btvnRaw.toLowerCase();
            if (btvn && btvn !== "-" && btvn !== "không có" && btvn !== "chưa có") {
                hwTotal++;
                if (btvn.indexOf("trễ") !== -1 || btvn.indexOf("muộn") !== -1) {
                    hwLate++;
                }
                var pctMatch = btvn.match(/(\d+(\.\d+)?)\s*%/);
                if (pctMatch) {
                    var pVal = parseFloat(pctMatch[1]);
                    if (pVal >= 100) {
                        hwDone++;
                    } else {
                        hwMissing++;
                    }
                } else if (btvn.indexOf("thiếu") !== -1 || btvn.indexOf("không làm") !== -1 || btvn.indexOf("chưa làm") !== -1 || btvn.indexOf("chưa nộp") !== -1 || btvn.indexOf("chưa đạt") !== -1 || btvn === "không") {
                    hwMissing++;
                } else {
                    hwDone++;
                }
            }
        }

        // Điểm số trong buổi
        var dDau = (l.diemDauGio !== undefined && l.diemDauGio !== null && String(l.diemDauGio).trim() !== "" && String(l.diemDauGio).trim() !== "-") ? String(l.diemDauGio).trim() : ((l.diemDau !== undefined && String(l.diemDau).trim() !== "" && String(l.diemDau).trim() !== "-") ? String(l.diemDau).trim() : "");
        var dDinhKi = (l.diemDinhKi !== undefined && l.diemDinhKi !== null && String(l.diemDinhKi).trim() !== "" && String(l.diemDinhKi).trim() !== "-") ? String(l.diemDinhKi).trim() : ((l.diemKT !== undefined && String(l.diemKT).trim() !== "" && String(l.diemKT).trim() !== "-") ? String(l.diemKT).trim() : "");
        var dSo = (l.diemSo !== undefined && l.diemSo !== null && String(l.diemSo).trim() !== "" && String(l.diemSo).trim() !== "-") ? String(l.diemSo).trim() : "";

        var sessScores = [];
        if (dDau && dDau.toLowerCase() !== "không có" && dDau.toLowerCase() !== "null") {
            sessScores.push("Đầu giờ: " + dDau + "đ");
            scoreRecords.push(dateText + " (Kiểm tra đầu giờ: " + dDau + "đ)");
        }
        if (dDinhKi && dDinhKi.toLowerCase() !== "không có" && dDinhKi.toLowerCase() !== "null") {
            sessScores.push("Định kỳ: " + dDinhKi + "đ");
            scoreRecords.push(dateText + " (Kiểm tra định kỳ: " + dDinhKi + "đ)");
        }
        if (dSo && dSo.toLowerCase() !== "không có" && dSo.toLowerCase() !== "null" && !dDau && !dDinhKi) {
            sessScores.push("Điểm: " + dSo + "đ");
            scoreRecords.push(dateText + " (Kiểm tra: " + dSo + "đ)");
        }

        // Dòng nhật ký buổi học
        var line = "- Buổi " + (idx + 1) + " (" + dateText + ") [" + rawStatus + "]";
        if (lesson) line += " | Bài: " + lesson;
        if (sessScores.length > 0) line += " | Điểm: " + sessScores.join(", ");
        var btvnInfo = (l.danhGiaBTVN || l.btvn || "").trim();
        if (btvnInfo && btvnInfo !== "-") line += " | BTVN: " + btvnInfo;
        if (comment) line += " | Nhận xét của gia sư: \"" + comment + "\"";
        sessionNotes.push(line);
    });

    var hwPct = hwTotal > 0 ? Math.round((hwDone / hwTotal) * 100) : null;
    var hwSummaryStr = hwTotal > 0 
        ? ("Hoàn thành " + hwDone + "/" + hwTotal + " bài (" + hwPct + "%)" + (hwLate > 0 ? (", Nộp trễ " + hwLate + " lần") : "") + (hwMissing > 0 ? (", Chưa làm/thiếu " + hwMissing + " lần") : ""))
        : "Chưa có dữ liệu bài tập riêng trong kỳ này";

    var scoreSummaryStr = scoreRecords.length > 0 
        ? scoreRecords.join("; ") 
        : "Không có bài kiểm tra chính thức lấy điểm trong kỳ này (đánh giá qua tương tác và giải bài trực tiếp trên lớp).";

    var classSubjectStr = [st.classLevel, st.subject].filter(Boolean).join(' - ') || 'Gia sư';
    var tutorName = (tutorDataGlobal && tutorDataGlobal.tutorName) ? tutorDataGlobal.tutorName : "Gia sư";

    // 4. Xây dựng nội dung Prompt AI chuyên nghiệp, sâu sát và bám sát thực tế
    var promptLines = [];
    promptLines.push("Bạn là một gia sư chuyên môn cao, tận tâm, trách nhiệm và thấu hiểu học sinh.");
    promptLines.push("Dưới đây là toàn bộ dữ liệu học tập thực tế trong vòng 30 ngày qua (từ " + sDateStr + " đến " + eDateStr + ") của học sinh " + st.name + " (" + classSubjectStr + "), do gia sư " + tutorName + " trực tiếp giảng dạy:");
    promptLines.push("");
    promptLines.push("=== DỮ LIỆU HỌC TẬP THỰC TẾ TRONG KỲ (30 NGÀY) ===");
    promptLines.push("1. Học sinh: " + st.name + " | Môn/Lớp: " + classSubjectStr);
    promptLines.push("2. Giai đoạn đánh giá: Từ ngày " + sDateStr + " đến ngày " + eDateStr);
    promptLines.push("3. Chuyên cần & Ý thức BTVN:");
    promptLines.push("   - Tổng số buổi ghi nhận: " + totalSessions + " buổi");
    promptLines.push("   - Số buổi có mặt học: " + (presentCount + makeupCount) + " buổi (Học đúng lịch: " + presentCount + " buổi, Học bù: " + makeupCount + " buổi)");
    if (absentCount > 0) {
        promptLines.push("   - Số buổi nghỉ: " + absentCount + " buổi (Ngày: " + absentDates.join(", ") + ")");
    } else {
        promptLines.push("   - Số buổi nghỉ: 0 buổi (Đi học đầy đủ 100%)");
    }
    promptLines.push("   - Tình hình làm bài tập về nhà (BTVN): " + hwSummaryStr);
    promptLines.push("4. Kết quả điểm số & Kiểm tra:");
    promptLines.push("   - " + scoreSummaryStr);
    promptLines.push("5. Chi tiết nhật ký từng buổi học & ghi chú của gia sư:");
    if (sessionNotes.length > 0) {
        promptLines.push(sessionNotes.join("\n"));
    } else {
        promptLines.push("   (Chưa có nhật ký buổi học chi tiết trong khoảng thời gian này)");
    }
    promptLines.push("");
    promptLines.push("=== YÊU CẦU BẮT BUỘC ĐỐI VỚI AI ===");
    promptLines.push("Hãy dựa vào toàn bộ dữ liệu thực tế trên để viết phần \"NHẬN XÉT HỌC TẬP\" định kỳ gửi cho phụ huynh. BẮT BUỘC PHẢI CHIA ĐÚNG BỐ CỤC 3 PHẦN và TUÂN THỦ CHÍNH XÁC ĐỊNH DẠNG sau:");
    promptLines.push("");
    promptLines.push("**Tổng quan:**");
    promptLines.push("+ [Nhận xét về tinh thần, thái độ học tập, tính chuyên cần, đi học đúng giờ và tập trung nghe giảng]");
    promptLines.push("+ [Nhận xét về ý thức làm bài tập về nhà, mức độ hoàn thành BTVN và tính chủ động tương tác/hỏi bài]");
    promptLines.push("");
    promptLines.push("**Kiến thức & Kỹ năng:**");
    promptLines.push("+ [Nhận xét về khả năng tiếp thu bài, mức độ nắm chắc kiến thức trọng tâm bám sát các buổi học trong tháng]");
    promptLines.push("+ [Nhận xét về kỹ năng giải bài tập, điểm số kiểm tra, sự tiến bộ trong tư duy và vận dụng phương pháp]");
    promptLines.push("");
    promptLines.push("**Điểm cần cải thiện:**");
    promptLines.push("+ [Chỉ ra điểm cần khắc phục thực tế, rèn luyện tính cẩn thận khi tính toán/làm bài để tránh lỗi sơ suất]");
    promptLines.push("+ [Định hướng rèn luyện, lời khích lệ chân thành, nhắc nhở cách trình bày hoặc duy trì thói quen tự ôn bài]");
    promptLines.push("");
    promptLines.push("=== QUY TẮC ĐỊNH DẠNG VÀ VĂN PHONG (BẮT BUỘC TUÂN THỦ) ===");
    promptLines.push("1. TIÊU ĐỀ BẮT BUỘC IN ĐẬM: Ba tiêu đề quan trọng BẮT BUỘC PHẢI IN ĐẬM bằng cú pháp markdown: **Tổng quan:**, **Kiến thức & Kỹ năng:**, **Điểm cần cải thiện:**.");
    promptLines.push("2. DẤU ĐẦU DÒNG BẮT BUỘC DÙNG DẤU CỘNG '+ ': Dưới mỗi tiêu đề phải có đúng 2 gạch đầu dòng bắt đầu bằng dấu cộng '+ ' (mỗi gạch là 1 câu nhận xét súc tích, hoàn chỉnh). TUYỆT ĐỐI KHÔNG dùng dấu chấm tròn '•', TUYỆT ĐỐI KHÔNG dùng gạch ngang '-'.");
    promptLines.push("3. ĐỘ DÀI: Khoảng 120 – 180 từ, súc tích, cô đọng, giàu tính sư phạm.");
    promptLines.push("4. VĂN PHONG: Trang trọng, chân tình, bám sát các dữ liệu thực tế của học sinh (số buổi học, tỉ lệ BTVN, điểm kiểm tra, ghi chú của gia sư).");
    promptLines.push("5. ĐỊNH DẠNG ĐẦU RA: CHỈ XUẤT DUY NHẤT ĐOẠN VĂN THEO ĐÚNG MẪU 3 PHẦN TRÊN (không kèm lời chào mở đầu như 'Dưới đây là...', không kèm tiêu đề phụ hay ghi chú ở cuối) để gia sư có thể copy và dán ngay vào phiếu học phí.");

    var fullPromptText = promptLines.join("\n");

    // 5. Hiệu ứng nút bấm & Sao chép vào Clipboard
    var btn = document.getElementById('btnTuitionPromptAI');
    var origHtml = btn ? btn.innerHTML : "";

    function showPromptCopySuccess() {
        if (btn) {
            btn.innerHTML = '<i class="fa-solid fa-check" style="color: #10B981;"></i> <span>Đã copy prompt!</span>';
            btn.style.borderColor = '#10B981';
            btn.style.color = '#059669';
            btn.style.background = '#ECFDF5';
            setTimeout(function() {
                btn.innerHTML = origHtml;
                btn.style.borderColor = '';
                btn.style.color = '';
                btn.style.background = '';
            }, 2500);
        }
        if (typeof showToast === 'function') {
            showToast("Đã copy Prompt AI chuẩn bố cục 3 phần! Dán vào ChatGPT / Gemini để lấy nhận xét.", "success");
        }
    }

    function showPromptCopyError() {
        if (btn) {
            btn.innerHTML = origHtml;
            btn.style.borderColor = '';
            btn.style.color = '';
            btn.style.background = '';
        }
        if (typeof showToast === 'function') {
            showToast("Không thể sao chép tự động. Vui lòng thử lại!", "error");
        }
    }

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(fullPromptText).then(function() {
            showPromptCopySuccess();
        }).catch(function(err) {
            console.warn("navigator.clipboard failed, attempting fallback:", err);
            fallbackCopyPrompt(fullPromptText);
        });
    } else {
        fallbackCopyPrompt(fullPromptText);
    }

    function fallbackCopyPrompt(text) {
        try {
            var textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            textArea.style.top = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            var success = document.execCommand('copy');
            document.body.removeChild(textArea);
            if (success) {
                showPromptCopySuccess();
            } else {
                showPromptCopyError();
            }
        } catch(e) {
            console.error("Fallback copy error:", e);
            showPromptCopyError();
        }
    }
}
window.copyTuitionAIPrompt = copyTuitionAIPrompt;

function getTuitionInvoiceFileName(studentName, startDateStr) {
    var rawName = studentName || "HocSinh";
    var cleanName = rawName.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d").replace(/Đ/g, "D")
        .replace(/[^a-zA-Z0-9]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "");
    
    var monthPart = "";
    if (startDateStr) {
        if (startDateStr.indexOf('/') !== -1) {
            var sp = startDateStr.split('/');
            if (sp.length >= 3) {
                monthPart = "Thang" + sp[1] + "_" + sp[2];
            } else if (sp.length === 2) {
                monthPart = "Thang" + sp[1] + "_" + new Date().getFullYear();
            }
        } else if (startDateStr.indexOf('-') !== -1) {
            var sp = startDateStr.split('-');
            if (sp.length >= 2) {
                if (sp[0].length === 4) {
                    monthPart = "Thang" + sp[1] + "_" + sp[0];
                } else {
                    monthPart = "Thang" + sp[1] + "_" + sp[2];
                }
            }
        }
    }
    if (!monthPart) {
        var now = new Date();
        var mm = String(now.getMonth() + 1).padStart(2, '0');
        monthPart = "Thang" + mm + "_" + now.getFullYear();
    }
    return "PhieuHocPhi_" + cleanName + "_" + monthPart + ".png";
}
window.getTuitionInvoiceFileName = getTuitionInvoiceFileName;

function exportTuitionModalInvoice() {
    var card = document.getElementById('tuitionInvoiceCard');
    var modal = document.getElementById('tutorTuitionInvoiceModal');
    if (!card) {
        if (typeof showToast === 'function') showToast("Không tìm thấy phiếu học phí!", "error");
        return;
    }

    var state = window.tuitionInvoiceModalState || {};
    var sName = state.studentName || (modal ? modal.getAttribute('data-student') : "") || "HocSinh";
    var startDateStr = state.startDate || (modal ? modal.getAttribute('data-start') : "") || "";
    var fileName = getTuitionInvoiceFileName(sName, startDateStr);

    var btn = document.getElementById('btnExportTuitionInvoice');
    var originalText = btn ? btn.innerHTML : "";
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Đang xuất...';
    }

    var restoreBtn = function() {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    };

    if (typeof html2canvas !== 'function') {
        restoreBtn();
        if (typeof showToast === 'function') showToast("Thư viện html2canvas chưa sẵn sàng!", "error");
        return;
    }

    html2canvas(card, {
        scale: 2,
        backgroundColor: "#FFFFFF",
        useCORS: true,
        logging: false
    }).then(function(canvas) {
        var link = document.createElement('a');
        link.download = fileName;
        link.href = canvas.toDataURL('image/png');
        link.click();
        restoreBtn();
        if (typeof showToast === 'function') {
            showToast("Đã xuất phiếu học phí thành công!", "success");
        }
    }).catch(function(err) {
        console.error("Export tuition image error:", err);
        restoreBtn();
        if (typeof showToast === 'function') {
            showToast("Lỗi khi xuất ảnh phiếu học phí!", "error");
        }
    });
}
window.exportTuitionModalInvoice = exportTuitionModalInvoice;

function initReportFilterOptions() {
    var startInput = document.getElementById('reportStartDate');
    var endInput = document.getElementById('reportEndDate');
    var studentSelect = document.getElementById('reportStudentSelect');

    var now = new Date();
    var pad = function(n) { return String(n).padStart(2, '0'); };
    var todayStr = pad(now.getDate()) + '/' + pad(now.getMonth() + 1) + '/' + now.getFullYear();

    var past = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    var pastStr = pad(past.getDate()) + '/' + pad(past.getMonth() + 1) + '/' + past.getFullYear();

    if (startInput && !startInput.value) {
        startInput.value = pastStr;
    }
    if (endInput && !endInput.value) {
        endInput.value = todayStr;
    }

    initVietnameseDatePicker('reportStartDate', 'reportStartDate_picker', function() {
        previewTutorReport();
    });
    initVietnameseDatePicker('reportEndDate', 'reportEndDate_picker', function() {
        previewTutorReport();
    });

    if (studentSelect) {
        var curVal = studentSelect.value || "";
        var students = (typeof getTutorStudentsResolved === 'function') 
            ? getTutorStudentsResolved() 
            : ((tutorDataGlobal && tutorDataGlobal.students) ? tutorDataGlobal.students : []);

        studentSelect.innerHTML = '';
        students.forEach(function(st) {
            var opt = document.createElement('option');
            opt.value = st.name.trim();
            opt.innerText = st.name.trim() + (st.subject ? ' (' + st.subject + ')' : '');
            studentSelect.appendChild(opt);
        });

        if (curVal && curVal !== 'all' && studentSelect.querySelector('option[value="' + CSS.escape(curVal) + '"]')) {
            studentSelect.value = curVal;
        } else if (students.length > 0) {
            studentSelect.value = students[0].name.trim();
        }

        syncCustomDropdownFromSelect('reportStudentSelect');
    }
}
window.initReportFilterOptions = initReportFilterOptions;

function parseDateInputYmd(str) {
    return parseInputDate(str);
}

function parseLogDateDmy(str) {
    return parseInputDate(str);
}

function previewTutorReport() {
    var startInput = document.getElementById('reportStartDate');
    var endInput = document.getElementById('reportEndDate');
    var studentSelect = document.getElementById('reportStudentSelect');
    var container = document.getElementById('reportPreviewContainer');
    var exportBtn = document.getElementById('btnExportReportPng');
    var exportPdfBtn = document.getElementById('btnExportReportPdf');

    if (!container) return;

    try {
        var startDate = startInput ? parseDateInputYmd(startInput.value) : null;
        var endDate = endInput ? parseDateInputYmd(endInput.value) : null;
        if (endDate) {
            endDate.setHours(23, 59, 59, 999);
        }

        var selStudent = studentSelect ? studentSelect.value : '';

        var students = (typeof getTutorStudentsResolved === 'function') 
            ? getTutorStudentsResolved() 
            : ((tutorDataGlobal && tutorDataGlobal.students) ? tutorDataGlobal.students : []);

        if ((!selStudent || selStudent === 'all') && students.length > 0) {
            selStudent = students[0].name.trim();
            if (studentSelect) studentSelect.value = selStudent;
        }

        var targetSt = students.find(function(st) { return st.name.trim() === selStudent; });
        if (targetSt && !targetSt.logs) {
            container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 40px; font-style: italic;">' +
                '<i class="fa-solid fa-circle-notch fa-spin" style="font-size: 24px; color: var(--color-primary); margin-bottom: 8px; display: block;"></i>' +
                'Đang tải dữ liệu báo cáo cho ' + escapeHtml(targetSt.name) + '...</div>';
            if (exportBtn) exportBtn.style.display = 'none';
            if (exportPdfBtn) exportPdfBtn.style.display = 'none';
            if (typeof google !== 'undefined' && google.script && google.script.run && google.script.run.getStudentDetailsForTutor) {
                google.script.run
                    .withSuccessHandler(function(res) {
                        targetSt.logs = (res && res.logs) ? res.logs : [];
                        if (res && res.tuition) targetSt.tuition = res.tuition;
                        if (res && res.billing_type) targetSt.billing_type = res.billing_type;
                        if (tutorDataGlobal && tutorDataGlobal.students) {
                            var fs = tutorDataGlobal.students.find(function(s) {
                                return s.phone === targetSt.phone || s.name === targetSt.name;
                            });
                            if (fs) {
                                fs.logs = targetSt.logs;
                                if (targetSt.tuition) fs.tuition = targetSt.tuition;
                                if (targetSt.billing_type) fs.billing_type = targetSt.billing_type;
                            }
                        }
                        if (typeof sessionStorage !== 'undefined' && tutorDataGlobal) {
                            try { sessionStorage.setItem('dashboardData', JSON.stringify(tutorDataGlobal)); } catch(e) {}
                        }
                        previewTutorReport();
                    })
                    .getStudentDetailsForTutor(targetSt.phone, targetSt.name);
            }
            return;
        }

        var flatSessions = [];
        students.forEach(function(st) {
            var sName = st.name.trim();
            if (sName !== selStudent) return;

            if (st.logs && Array.isArray(st.logs)) {
                st.logs.forEach(function(log) {
                    var lDate = parseLogDateDmy(log.ngay);
                    if (lDate) {
                        if (startDate && lDate < startDate) return;
                        if (endDate && lDate > endDate) return;
                    }
                    flatSessions.push({
                        studentName: sName,
                        studentSubject: st.subject || "Gia sư",
                        log: log,
                        logDate: lDate || new Date(0)
                    });
                });
            }
        });

        // Sort by date descending (newest first)
        flatSessions.sort(function(a, b) {
            return b.logDate.getTime() - a.logDate.getTime();
        });

        if (flatSessions.length === 0) {
            container.innerHTML = '<div style="background: var(--bg-card-alt); border: 1px dashed var(--border-color); border-radius: 20px; padding: 40px; text-align: center; max-width: 600px; width: 100%;">' +
                '<i class="fa-solid fa-file-circle-xmark" style="font-size: 38px; color: var(--color-primary); margin-bottom: 12px; display: block;"></i>' +
                '<h4 style="color: var(--text-primary); font-size: 16px; margin: 0 0 6px 0;">Không tìm thấy buổi học nào</h4>' +
                '<p style="color: var(--text-secondary); font-size: 13px; margin: 0;">Vui lòng điều chỉnh lại khoảng thời gian "Từ ngày" - "Đến ngày" hoặc chọn học sinh khác.</p>' +
            '</div>';
            if (exportBtn) exportBtn.style.display = 'none';
            if (exportPdfBtn) exportPdfBtn.style.display = 'none';
            return;
        }

        if (exportBtn) exportBtn.style.display = 'inline-flex';
        if (exportPdfBtn) exportPdfBtn.style.display = 'inline-flex';

        // Calculate metrics
        var totalSessions = flatSessions.length;
        var presentCount = 0;
        var hwDoneCount = 0;

        flatSessions.forEach(function(it) {
            var l = it.log;
            var cc = (l.chuyenCan || "").toLowerCase();
            if (cc.indexOf("vắng") === -1 && cc.indexOf("nghỉ") === -1) presentCount++;
            var bt = (l.btvn || "").toLowerCase();
            if (bt.indexOf("hoàn thành") !== -1 || bt.indexOf("đạt") !== -1 || bt.indexOf("tốt") !== -1) hwDoneCount++;
        });

        var attRate = Math.round((presentCount / totalSessions) * 100) + "%";
        var hwRate = Math.round((hwDoneCount / totalSessions) * 100) + "%";

        var fmtFn = (typeof window.formatDateWithDayOfWeek === 'function') 
            ? window.formatDateWithDayOfWeek 
            : function(s) { return s; };

        var startDisplay = startInput && startInput.value ? formatToDmy(startInput.value) : "Đầu kỳ";
        var endDisplay = endInput && endInput.value ? formatToDmy(endInput.value) : "Hiện tại";
        var targetStudentDisplay = selStudent || (students[0] ? students[0].name.trim() : "Học sinh");
        var tutorName = (tutorDataGlobal && tutorDataGlobal.tutorName) ? tutorDataGlobal.tutorName : "Gia sư";

        var html = '<div id="reportCaptureCard" class="report-capture-card">' +
            '<!-- Header / Branding -->' +
            '<div class="report-card-banner">' +
                '<div>' +
                    '<div class="report-brand-title"><i class="fa-solid fa-graduation-cap" style="margin-right: 8px; color: var(--color-primary);"></i> BÁO CÁO TIẾN ĐỘ HỌC TẬP</div>' +
                    '<div class="report-brand-sub">Gia sư phụ trách: <b>' + escapeHtml(tutorName) + '</b> • Hệ thống quản lý học sinh 1-1</div>' +
                '</div>' +
                '<div class="report-meta-pills">' +
                    '<span class="report-meta-pill"><i class="fa-solid fa-user-graduate"></i> ' + escapeHtml(targetStudentDisplay) + '</span>' +
                    '<span class="report-meta-pill"><i class="fa-regular fa-calendar-days"></i> ' + escapeHtml(startDisplay) + ' → ' + escapeHtml(endDisplay) + '</span>' +
                    '<span class="report-meta-pill" style="background: rgba(16,185,129,0.15); border-color: #10B981; color: #6EE7B7;"><i class="fa-solid fa-check"></i> ' + totalSessions + ' buổi học</span>' +
                '</div>' +
            '</div>' +

            '<!-- Stats Summary Grid -->' +
            '<div class="report-stats-grid">' +
                '<div class="report-stat-box">' +
                    '<div class="report-stat-num text-purple">' + totalSessions + '</div>' +
                    '<div class="report-stat-lbl">Tổng số buổi ghi nhận</div>' +
                '</div>' +
                '<div class="report-stat-box">' +
                    '<div class="report-stat-num text-green">' + attRate + '</div>' +
                    '<div class="report-stat-lbl">Tỷ lệ chuyên cần (' + presentCount + '/' + totalSessions + ')</div>' +
                '</div>' +
                '<div class="report-stat-box">' +
                    '<div class="report-stat-num text-amber">' + hwRate + '</div>' +
                    '<div class="report-stat-lbl">Hoàn thành bài tập về nhà</div>' +
                '</div>' +
            '</div>' +

            '<!-- Detailed Session Cards -->' +
            '<div class="report-sessions-list">';

        flatSessions.forEach(function(it) {
            var log = it.log;
            var stStyle = (typeof getStudentStyle === 'function') 
                ? getStudentStyle(it.studentName) 
                : { bg: "var(--nav-active-bg)", border: "var(--color-primary)", text: "var(--color-primary)" };

            var dateWithDay = fmtFn(log.ngay);
            var btvnBadge = (typeof getDiaryBtvnBadge === 'function') 
                ? getDiaryBtvnBadge(log.btvn || log.danhGiaBTVN) 
                : '<span class="status-badge">' + escapeHtml(log.btvn || "-") + '</span>';
            var comment = (log.nhanXet || "").trim() || "Chưa có nhận xét";

            html += '<div class="report-session-item">' +
                '<div class="report-session-top">' +
                    '<div style="display: flex; align-items: center; gap: 8px;">' +
                        '<span class="report-session-date"><i class="fa-regular fa-calendar-check" style="color: var(--color-primary);"></i> ' + escapeHtml(dateWithDay) + '</span>' +
                        '<span style="background:' + escapeHtml(stStyle.bg) + '; border:1px solid ' + escapeHtml(stStyle.border) + '; color:' + escapeHtml(stStyle.text) + '; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 700;">' + escapeHtml(it.studentName) + '</span>' +
                        '<span style="font-size: 11.5px; color: var(--text-secondary);">' + escapeHtml(log.mon || it.studentSubject) + '</span>' +
                    '</div>' +
                    '<div>' + btvnBadge + '</div>' +
                '</div>' +
                '<div class="report-session-topic"><b>Nội dung:</b> ' + escapeHtml(log.topic || log.noiDung || "Học theo giáo trình") + '</div>' +
                '<div class="report-session-comment"><b>Nhận xét gia sư:</b> ' + escapeHtml(comment) + '</div>' +
            '</div>';
        });

        html += '</div>' +
            '<!-- Footer -->' +
            '<div class="report-card-footer">' +
                '<div><i class="fa-solid fa-heart" style="color: var(--color-primary);"></i> Chúc các em luôn học tập tốt và bứt phá điểm số!</div>' +
                '<div>Thời gian xuất: ' + new Date().toLocaleString('vi-VN') + '</div>' +
            '</div>' +
        '</div>';

        container.innerHTML = html;
    } catch(err) {
        console.error("Lỗi khi tạo bản xem trước báo cáo:", err);
        container.innerHTML = '<div style="background: var(--bg-card-alt); border: 1px dashed rgba(239,68,68,0.4); border-radius: 20px; padding: 40px; text-align: center; max-width: 600px; width: 100%;">' +
            '<i class="fa-solid fa-triangle-exclamation" style="font-size: 38px; color: #EF4444; margin-bottom: 12px; display: block;"></i>' +
            '<h4 style="color: var(--text-primary); font-size: 16px; margin: 0 0 6px 0;">Đã xảy ra lỗi khi tạo báo cáo</h4>' +
            '<p style="color: var(--text-secondary); font-size: 13px; margin: 0;">Vui lòng thử lại hoặc chọn học sinh khác.</p>' +
        '</div>';
        if (exportBtn) exportBtn.style.display = 'none';
        if (exportPdfBtn) exportPdfBtn.style.display = 'none';
    }
}
window.previewTutorReport = previewTutorReport;

function exportReportToPng() {
    var card = document.getElementById('reportCaptureCard');
    if (!card) return;

    var startInput = document.getElementById('reportStartDate');
    var endInput = document.getElementById('reportEndDate');
    var studentSelect = document.getElementById('reportStudentSelect');
    var btn = document.getElementById('btnExportReportPng');

    var sName = studentSelect ? studentSelect.value : "";
    if (!sName || sName === "all") {
        var students = (typeof getTutorStudentsResolved === 'function') 
            ? getTutorStudentsResolved() 
            : ((tutorDataGlobal && tutorDataGlobal.students) ? tutorDataGlobal.students : []);
        sName = (students.length > 0) ? students[0].name.trim() : "HocSinh";
    }
    var cleanStudent = sName.replace(/\s+/g, '_');

    var tuNgay = startInput && startInput.value ? startInput.value.replace(/[-/]/g, '') : "TuNgay";
    var denNgay = endInput && endInput.value ? endInput.value.replace(/[-/]/g, '') : "DenNgay";
    var fileName = 'BaoCao_' + cleanStudent + '_' + tuNgay + '_' + denNgay + '.png';

    var originalText = btn ? btn.innerHTML : "";
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Đang xuất ảnh...';
    }

    if (typeof html2canvas === 'function') {
        html2canvas(card, {
            scale: 2,
            backgroundColor: "#0E0B25",
            useCORS: true,
            logging: false
        }).then(function(canvas) {
            var link = document.createElement('a');
            link.download = fileName;
            link.href = canvas.toDataURL('image/png');
            link.click();
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
            if (typeof showToast === 'function') {
                showToast("Đã xuất báo cáo thành công!", "success");
            }
        }).catch(function(err) {
            console.error("Export PNG error:", err);
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
            if (typeof showToast === 'function') {
                showToast("Lỗi khi xuất ảnh báo cáo!", "error");
            }
        });
    } else {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
        if (typeof showToast === 'function') {
            showToast("Thư viện html2canvas chưa sẵn sàng!", "error");
        }
    }
}
window.exportReportToPng = exportReportToPng;

function exportReportToPdf() {
    var card = document.getElementById('reportCaptureCard');
    if (!card) return;

    var startInput = document.getElementById('reportStartDate');
    var endInput = document.getElementById('reportEndDate');
    var studentSelect = document.getElementById('reportStudentSelect');
    var btn = document.getElementById('btnExportReportPdf');

    var sName = studentSelect ? studentSelect.value : "";
    if (!sName || sName === "all") {
        var students = (typeof getTutorStudentsResolved === 'function') 
            ? getTutorStudentsResolved() 
            : ((tutorDataGlobal && tutorDataGlobal.students) ? tutorDataGlobal.students : []);
        sName = (students.length > 0) ? students[0].name.trim() : "HocSinh";
    }
    var cleanStudent = sName.replace(/\s+/g, '_');

    var tuNgay = startInput && startInput.value ? startInput.value.replace(/[-/]/g, '') : "TuNgay";
    var denNgay = endInput && endInput.value ? endInput.value.replace(/[-/]/g, '') : "DenNgay";
    var fileName = 'BaoCao_' + cleanStudent + '_' + tuNgay + '_' + denNgay + '.pdf';

    var originalText = btn ? btn.innerHTML : "";
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Đang tạo PDF...';
    }

    var restoreBtn = function() {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    };

    if (typeof html2canvas !== 'function') {
        restoreBtn();
        if (typeof showToast === 'function') {
            showToast("Thư viện html2canvas chưa sẵn sàng!", "error");
        }
        return;
    }

    html2canvas(card, {
        scale: 2,
        backgroundColor: "#0E0B25",
        useCORS: true,
        logging: false
    }).then(function(canvas) {
        try {
            var dataUrl = canvas.toDataURL('image/jpeg', 0.95);
            var base64 = dataUrl.split(',')[1];
            var binaryStr = atob(base64);
            var len = binaryStr.length;
            var jpegBytes = new Uint8Array(len);
            for (var i = 0; i < len; i++) {
                jpegBytes[i] = binaryStr.charCodeAt(i);
            }

            var pdfBlob = createPdfBlobFromJpeg(jpegBytes, canvas.width, canvas.height, true);
            var url = URL.createObjectURL(pdfBlob);
            var a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(function() {
                URL.revokeObjectURL(url);
            }, 5000);

            restoreBtn();
            if (typeof showToast === 'function') {
                showToast("Đã xuất file PDF báo cáo thành công!", "success");
            }
        } catch(err) {
            console.error("PDF generation error:", err);
            restoreBtn();
            if (typeof showToast === 'function') {
                showToast("Lỗi khi tạo file PDF!", "error");
            }
        }
    }).catch(function(err) {
        console.error("html2canvas error during PDF export:", err);
        restoreBtn();
        if (typeof showToast === 'function') {
            showToast("Lỗi khi chụp nội dung báo cáo để xuất PDF!", "error");
        }
    });
}
window.exportReportToPdf = exportReportToPdf;

function openTutorCalendarTab() {
    var calBtn = document.querySelector('.sidebar-nav-item[data-tab="calendar"]');
    if (typeof switchTutorNavTab === 'function') {
        switchTutorNavTab(calBtn, 'calendar');
    }
}
window.openTutorCalendarTab = openTutorCalendarTab;

function switchTutorNavTab(element, tabKey) {
    var items = document.querySelectorAll('.sidebar-nav-item');
    items.forEach(function(item) {
        item.classList.remove('active');
    });
    if (element) {
        element.classList.add('active');
    } else {
        var targetBtn = document.querySelector('.sidebar-nav-item[data-tab="' + tabKey + '"]');
        if (targetBtn) targetBtn.classList.add('active');
    }

    var isCalTab = (tabKey === 'calendar');
    var layout = document.getElementById('tutorDashboardBox');
    if (layout) {
        layout.classList.toggle('calendar-tab-active', isCalTab);
        if (isCalTab) {
            layout.style.height = '100vh';
            layout.style.maxHeight = '100vh';
            layout.style.overflow = 'hidden';
        } else {
            layout.style.height = '';
            layout.style.maxHeight = '';
            layout.style.overflow = '';
        }
    }
    if (document.body) {
        document.body.classList.toggle('calendar-tab-active', isCalTab);
        document.body.style.overflow = isCalTab ? 'hidden' : '';
    }
    if (document.documentElement) {
        document.documentElement.classList.toggle('calendar-tab-active', isCalTab);
        document.documentElement.style.overflow = isCalTab ? 'hidden' : '';
    }

    var mainContentEl = document.getElementById('tutorMainContent') || document.querySelector('.tutor-main-content');
    if (mainContentEl) {
        if (isCalTab) {
            mainContentEl.style.height = '100vh';
            mainContentEl.style.maxHeight = '100vh';
            mainContentEl.style.overflow = 'hidden';
            mainContentEl.style.padding = '14px 20px 14px 20px';
            mainContentEl.style.display = 'flex';
            mainContentEl.style.flexDirection = 'column';
            mainContentEl.style.boxSizing = 'border-box';
        } else {
            mainContentEl.style.height = '';
            mainContentEl.style.maxHeight = '';
            mainContentEl.style.overflow = '';
            mainContentEl.style.padding = '';
            mainContentEl.style.display = '';
            mainContentEl.style.flexDirection = '';
            mainContentEl.style.boxSizing = '';
        }
    }

    var overviewSec = document.getElementById('tutorSectionOverview');
    var reportsSec = document.getElementById('tutorSectionReports');
    var diarySec = document.getElementById('tutorSectionDiary');
    var calendarSec = document.getElementById('tutorSectionCalendar');
    var studentsSec = document.getElementById('tutorSectionStudents');
    var tuitionSec = document.getElementById('tutorSectionTuition');

    if (overviewSec) overviewSec.style.display = (tabKey === 'overview') ? 'block' : 'none';
    if (reportsSec) reportsSec.style.display = (tabKey === 'reports') ? 'block' : 'none';
    if (diarySec) diarySec.style.display = (tabKey === 'diary') ? 'block' : 'none';
    if (calendarSec) calendarSec.style.display = (tabKey === 'calendar') ? 'flex' : 'none';
    if (studentsSec) studentsSec.style.display = (tabKey === 'students') ? 'block' : 'none';
    if (tuitionSec) tuitionSec.style.display = (tabKey === 'tuition') ? 'block' : 'none';

    if (tabKey === 'overview') {
        try {
            var calFrame = document.getElementById('tutorCalendarIframe');
            if (calFrame && calFrame.contentWindow && Array.isArray(calFrame.contentWindow.tutorScheduleSheetData) && calFrame.contentWindow.tutorScheduleSheetData.length > 0) {
                lastLoadedTutorSchedule = calFrame.contentWindow.tutorScheduleSheetData;
            }
        } catch(e) {}
        updateOverviewMonthSelectorUI();
        renderTutorKpiCards(null, tutorOverviewMonth, tutorOverviewYear);
        renderUpcomingSchedule(lastLoadedTutorSchedule, tutorOverviewMonth, tutorOverviewYear);
        if (typeof renderOverviewCharts === 'function') {
            renderOverviewCharts(tutorOverviewMonth, tutorOverviewYear);
        }
    } else if (tabKey === 'reports') {
        initReportFilterOptions();
        previewTutorReport();
    } else if (tabKey === 'diary') {
        renderTutorDiarySection(true);
    } else if (tabKey === 'calendar') {
        var calFrame = document.getElementById('tutorCalendarIframe');
        if (calFrame) {
            var curTheme = localStorage.getItem(window.__tutorThemeKey()) || 'theme-azure-mist-minimal';
            if (!calFrame.src || calFrame.src.indexOf('tutor-calendar.html') === -1) {
                calFrame.src = 'tutor-calendar.html?embedded=1&theme=' + encodeURIComponent(curTheme);
            }
            if (typeof syncThemeToCalendarIframe === 'function') {
                syncThemeToCalendarIframe();
                setTimeout(syncThemeToCalendarIframe, 60);
                setTimeout(syncThemeToCalendarIframe, 200);
                setTimeout(syncThemeToCalendarIframe, 500);
            }
            var triggerCalendarResize = function() {
                try {
                    if (calFrame.contentWindow && calFrame.contentWindow.calendar && typeof calFrame.contentWindow.calendar.updateSize === 'function') {
                        calFrame.contentWindow.calendar.updateSize();
                    }
                } catch(e) {}
                try {
                    if (calFrame.contentWindow) {
                        calFrame.contentWindow.postMessage('updateCalendarSize', window.location.origin);
                        calFrame.contentWindow.dispatchEvent(new Event('resize'));
                    }
                } catch(e) {}
            };
            setTimeout(triggerCalendarResize, 50);
            setTimeout(triggerCalendarResize, 150);
            setTimeout(triggerCalendarResize, 350);
            setTimeout(triggerCalendarResize, 700);
        }
    } else if (tabKey === 'students') {
        renderTutorStudentsGrid();
    } else if (tabKey === 'tuition') {
        renderTutorTuitionSection();
    }

    // Đóng tour cũ nếu đang mở khi chuyển tab
    var obOverlay = document.getElementById('onboardingOverlay');
    if (obOverlay && obOverlay.style.display !== 'none' && typeof finishOnboarding === 'function') {
        finishOnboarding(true);
    }

    // Tự động kích hoạt hướng dẫn nếu gia sư vào mục này lần đầu
    if (typeof shouldShowTabOnboarding === 'function' && shouldShowTabOnboarding(tabKey)) {
        setTimeout(function() {
            var activeNav = document.querySelector('.sidebar-nav-item.active');
            if (activeNav && activeNav.dataset.tab === tabKey && typeof startTabOnboarding === 'function') {
                startTabOnboarding(tabKey);
            }
        }, 500);
    }

    if (window.innerWidth <= 768 && typeof toggleTutorMobileSidebar === 'function') {
        toggleTutorMobileSidebar(false);
    }
}
window.switchTutorNavTab = switchTutorNavTab;

function toggleTutorSidebar() {
    if (window.innerWidth <= 768 && typeof toggleTutorMobileSidebar === 'function') {
        toggleTutorMobileSidebar();
        return;
    }
    var layout = document.getElementById('tutorDashboardBox');
    var icon = document.getElementById('sidebarCollapseIcon');
    var btn = document.getElementById('sidebarCollapseBtn');
    if (!layout) return;

    var isCollapsed = layout.classList.toggle('sidebar-collapsed');
    try {
        localStorage.setItem('tutorSidebarCollapsed', isCollapsed ? 'true' : 'false');
    } catch (e) {}

    if (icon) {
        if (isCollapsed) {
            icon.className = 'fa-solid fa-chevron-right';
        } else {
            icon.className = 'fa-solid fa-chevron-left';
        }
    }
    if (btn) {
        btn.title = isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu';
    }

    setTimeout(function() {
        var calFrame = document.getElementById('tutorCalendarIframe');
        if (calFrame && calFrame.contentWindow && calFrame.contentWindow.calendar) {
            try { calFrame.contentWindow.calendar.updateSize(); } catch(e) {}
        }
    }, 280);
}
window.toggleTutorSidebar = toggleTutorSidebar;

function initTutorSidebarState() {
    try {
        var isCollapsed = localStorage.getItem('tutorSidebarCollapsed') === 'true';
        var layout = document.getElementById('tutorDashboardBox');
        var icon = document.getElementById('sidebarCollapseIcon');
        var btn = document.getElementById('sidebarCollapseBtn');
        if (layout && isCollapsed) {
            layout.classList.add('sidebar-collapsed');
            if (icon) icon.className = 'fa-solid fa-chevron-right';
            if (btn) btn.title = 'Mở rộng menu';
        } else if (layout) {
            layout.classList.remove('sidebar-collapsed');
            if (icon) icon.className = 'fa-solid fa-chevron-left';
            if (btn) btn.title = 'Thu gọn menu';
        }
    } catch (e) {}
}
window.initTutorSidebarState = initTutorSidebarState;

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
            initTutorSidebarState();
            if (typeof loadTutorAvatar === 'function') {
                loadTutorAvatar();
            }
            if (!currentTutorStudent) {
                var dt = document.getElementById('tutorStudentDetail');
                if (dt) dt.style.display = 'none';
            }
            document.getElementById('tutorNameDisplay').innerText = "Xin chào, Gia sư " + data.tutorName;
            var sidebarTutorName = document.getElementById('sidebarTutorName');
            if (sidebarTutorName && data.tutorName) {
                sidebarTutorName.innerText = data.tutorName;
            }
            var mobileHeaderTutorName = document.getElementById('mobileHeaderTutorName');
            if (mobileHeaderTutorName && data.tutorName) {
                mobileHeaderTutorName.innerText = data.tutorName;
            }
            
            // Render 4 KPI Cards for Overview
            updateOverviewMonthSelectorUI();
            renderTutorKpiCards(data, tutorOverviewMonth, tutorOverviewYear);
            renderUpcomingSchedule(null, tutorOverviewMonth, tutorOverviewYear);
            if (typeof renderOverviewCharts === 'function') {
                renderOverviewCharts(tutorOverviewMonth, tutorOverviewYear);
            }
            
            // Đã xóa thanh thông báo chạy chữ theo yêu cầu người dùng
            var marqueeContainer = document.getElementById('tutorMarqueeContainer');
            if (marqueeContainer) {
                marqueeContainer.style.display = "none";
                marqueeContainer.remove();
            }
            // Load Schedule
            google.script.run.withSuccessHandler(function(schedule) {
                lastLoadedTutorSchedule = schedule;
                refreshTutorScheduleDisplay(schedule);
                renderUpcomingSchedule(schedule);
                renderTutorStudentsGrid();
            }).getTutorSchedule(currentTutorPhone);
            
            // Render Student Buttons
            var btnContainer = document.getElementById('tutorStudentsList');
            btnContainer.innerHTML = "";
            data.students.forEach(function(st, idx) {
                btnContainer.innerHTML += "<button class='student-btn' id='btn-st-" + idx + "' onclick='selectTutorStudent(" + idx + ")'>" + escapeHtml(st.name) + "</button>";
            });
            // Nút thêm học sinh mới
            btnContainer.innerHTML += "<button class='student-btn' onclick='openAddStudentModal()' style='background: var(--nav-active-bg); border: 1px dashed var(--color-primary); color: var(--color-primary);'><i class='fa-solid fa-plus'></i> Thêm học sinh</button>";
            // Nút Thùng rác (Chỉ hiển thị icon)
            btnContainer.innerHTML += "<button class='student-btn' onclick='openTrashModal()' style='background: rgba(239, 68, 68, 0.1); border: 1px dashed #EF4444; color: #EF4444; width: 45px; display: inline-flex; align-items: center; justify-content: center; margin-left: 5px;' title='Thùng rác học sinh'><i class='fa-solid fa-trash-can'></i></button>";
            
            // Load ý kiến phản hồi của phụ huynh
            loadTutorFeedbacks();
            renderTutorStudentsGrid();

            // Khôi phục học sinh đang chọn nếu có, hoặc chọn học sinh đầu tiên
            if (data.students && data.students.length > 0) {
                var selectIdx = 0;
                if (currentTutorStudent) {
                    var curIdx = data.students.findIndex(function(s) { return s.name === currentTutorStudent.name; });
                    if (curIdx !== -1) selectIdx = curIdx;
                }
                selectTutorStudent(selectIdx);
            }

            // Nạp nhật ký cho toàn bộ học sinh để hiển thị đúng số buổi và học phí
            loadAllTutorStudentsLogs(data);

            // Task 7: Onboarding Tour cho gia sư lần đầu truy cập
            if (typeof shouldShowOnboarding === 'function' && shouldShowOnboarding()) {
                setTimeout(startOnboarding, 1500);
            }
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

            var cards = document.querySelectorAll('.student-profile-card');
            cards.forEach(function(c) { c.classList.remove('active'); });
            var targetCard = document.getElementById('studentCard_' + idx);
            if (targetCard) targetCard.classList.add('active');
            
            var allResolved = (typeof getTutorStudentsResolved === 'function') ? getTutorStudentsResolved() : (tutorDataGlobal ? tutorDataGlobal.students : []);
            currentTutorStudent = (allResolved && allResolved[idx]) ? allResolved[idx] : (tutorDataGlobal && tutorDataGlobal.students ? tutorDataGlobal.students[idx] : null);
            if (!currentTutorStudent) return;

            var elDetail = document.getElementById('tutorStudentDetail');
            if (elDetail) elDetail.style.display = 'block';

            var elHeader = document.getElementById('selectedStudentNameHeader');
            if (elHeader) elHeader.innerText = currentTutorStudent.name;

            var elInvName = document.getElementById('invStudentName');
            if (elInvName) elInvName.innerText = currentTutorStudent.name;

            var elQuickAnn = document.getElementById('quickAnnouncementInput');
            if (elQuickAnn) elQuickAnn.value = currentTutorStudent.thongBao || "";

            var elAnnStatus = document.getElementById('announcementStatus');
            if (elAnnStatus) elAnnStatus.style.display = 'none';

            // Đồng bộ sang dropdown filter của tab Nhật ký nếu có
            var diaryFilter = document.getElementById('diaryStudentFilter');
            if (diaryFilter && currentTutorStudent && currentTutorStudent.name) {
                diaryFilter.value = currentTutorStudent.name.trim();
            }
            
            // Mở sẵn trạng thái bài tập theo mặc định
            var hwSec = document.getElementById('tutorHomeworkSection');
            if (hwSec) {
                hwSec.style.display = 'block';
                hwSec.style.maxHeight = 'none';
            }
            
            // Tải dữ liệu tab Giao bài tập
            if (typeof switchTutorHwTab === 'function') switchTutorHwTab('assign');
            if (typeof switchTutorHwSubTab === 'function') switchTutorHwSubTab('upload');
            
            // Clear file upload selection
            if (typeof clearTutorSelectedFile === 'function') clearTutorSelectedFile();
            
            // Reset trạng thái thu gọn hóa đơn
            var invContainer = document.getElementById('invoiceCollapseContainer');
            if (invContainer) invContainer.style.display = 'none';
            var btnToggle = document.getElementById('btnToggleInvoice');
            if (btnToggle) btnToggle.innerHTML = '<i class="fa-solid fa-file-invoice-dollar"></i> Xuất Hóa Đơn (Phiếu Học Tập)';
            
            // Render dữ liệu cục bộ ngay lập tức nếu đã có sẵn logs để không bị khoảng trống
            if (currentTutorStudent.logs && Array.isArray(currentTutorStudent.logs) && currentTutorStudent.logs.length > 0) {
                renderInvoice();
                renderTutorChart(currentTutorStudent.logs);
                renderTutorStudentHistory(currentTutorStudent.logs);
            } else {
                var histContainer = document.getElementById('tutorStudentHistory');
                if (histContainer) {
                    histContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 30px; font-style: italic;">' +
                        '<i class="fa-solid fa-circle-notch fa-spin" style="font-size: 24px; color: var(--color-primary); margin-bottom: 8px; display: block;"></i>' +
                        'Đang tải dữ liệu nhật ký học tập...</div>';
                }
            }

            // Fetch logs for this student to render invoice and stats
            if (typeof google !== 'undefined' && google.script && google.script.run && google.script.run.getStudentDetailsForTutor) {
                google.script.run
                    .withSuccessHandler(function(res) {
                        try {
                            if (res && res.error) {
                                showToast("Lỗi từ hệ thống: " + res.error, "error");
                                return;
                            }
                            currentTutorStudent.logs = (res && res.logs) ? res.logs : (currentTutorStudent.logs || []);
                            if (res && res.tuition) {
                                currentTutorStudent.tuition = res.tuition;
                            } else if (res && res.student && res.student.tuition) {
                                currentTutorStudent.tuition = res.student.tuition;
                            }
                            if (res && res.billing_type) {
                                currentTutorStudent.billing_type = res.billing_type;
                            } else if (res && res.student && res.student.billing_type) {
                                currentTutorStudent.billing_type = res.student.billing_type;
                            }
                            // Đồng bộ ngược lại vào danh sách tutorDataGlobal.students
                            if (tutorDataGlobal && tutorDataGlobal.students) {
                                var foundSt = tutorDataGlobal.students.find(function(s) {
                                    return s.phone === currentTutorStudent.phone || s.name === currentTutorStudent.name;
                                });
                                if (foundSt) {
                                    foundSt.logs = currentTutorStudent.logs;
                                    if (currentTutorStudent.tuition) foundSt.tuition = currentTutorStudent.tuition;
                                    if (currentTutorStudent.billing_type) foundSt.billing_type = currentTutorStudent.billing_type;
                                }
                            }
                            renderInvoice();
                            renderTutorChart(currentTutorStudent.logs);
                            renderTutorStudentHistory(currentTutorStudent.logs);
                            initTuitionMonthFilter();
                            renderTutorTuitionSection();
                            if (typeof initTutorDiaryFilters === 'function') initTutorDiaryFilters();
                            var diarySec = document.getElementById('tutorSectionDiary');
                            if (diarySec && diarySec.style.display !== 'none' && typeof renderTutorDiarySection === 'function') {
                                renderTutorDiarySection(false);
                            }
                            // Chỉ cập nhật biểu đồ tổng quan khi toàn bộ học sinh đã nạp xong nhật ký để tránh chớp số liệu thiếu
                            var allLogsReady = tutorDataGlobal && tutorDataGlobal.students && tutorDataGlobal.students.length > 0 && tutorDataGlobal.students.every(function(s) {
                                return s.logs && Array.isArray(s.logs);
                            });
                            if (allLogsReady) {
                                renderTutorKpiCards(tutorDataGlobal, tutorOverviewMonth, tutorOverviewYear);
                                if (typeof renderOverviewCharts === 'function') {
                                    renderOverviewCharts(tutorOverviewMonth, tutorOverviewYear);
                                }
                            }
                            if (typeof sessionStorage !== 'undefined' && tutorDataGlobal) {
                                try {
                                    sessionStorage.setItem('dashboardData', JSON.stringify(tutorDataGlobal));
                                } catch (e) {}
                            }
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
        }
        

        
        function renderTutorChart(lichSuVe) {
            if (tutorChartInstance) {
                tutorChartInstance.destroy();
                tutorChartInstance = null;
            }
            
            var canvas = document.getElementById('tutorDiemChart');
            if (!canvas || typeof Chart === 'undefined') return;
            
            var logs = (lichSuVe && Array.isArray(lichSuVe)) ? lichSuVe : [];
            var labels = [];
            var dataDauGio = [];
            var dataDinhKi = [];
            
            logs.forEach(function(item, idx) {
                var rawDate = (item && item.ngay) ? item.ngay : "";
                var shortDate = rawDate;
                var dateParts = rawDate.match(/(\d{1,2})\/(\d{1,2})/);
                if (dateParts) shortDate = dateParts[1] + "/" + dateParts[2];
                labels.push(shortDate || ("B." + (idx + 1)));
                
                var valDG = parseFloat(item ? item.diemDauGio : NaN);
                var valDK = parseFloat(item ? item.diemDinhKi : NaN);

                dataDauGio.push(!isNaN(valDG) && valDG >= 0 && valDG <= 10 ? valDG : null);
                dataDinhKi.push(!isNaN(valDK) && valDK >= 0 && valDK <= 10 ? valDK : null);
            });

            if (labels.length > 0) {
                var ctx = canvas.getContext('2d');
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
                        animation: {
                            duration: 1500,
                            easing: 'easeOutQuart'
                        },
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

        function parseTuitionNumber(val) {
            if (val === null || val === undefined) return 0;
            if (typeof val === 'number') return isNaN(val) ? 0 : val;
            var str = String(val).trim();
            if (!str) return 0;
            var cleaned = str.replace(/[đĐvVnNdD\s]/g, '');
            if (cleaned.includes('.') && cleaned.includes(',')) {
                cleaned = cleaned.replace(/\./g, '').replace(',', '.');
            } else if (cleaned.includes('.')) {
                var parts = cleaned.split('.');
                if (parts.length > 1 && parts.every((p, i) => i === 0 || p.length === 3)) {
                    cleaned = cleaned.replace(/\./g, '');
                }
            } else if (cleaned.includes(',')) {
                var parts = cleaned.split(',');
                if (parts.length > 1 && parts.every((p, i) => i === 0 || p.length === 3)) {
                    cleaned = cleaned.replace(/,/g, '');
                }
            }
            var num = parseFloat(cleaned);
            return isNaN(num) ? 0 : num;
        }

        function parseLessonDate(rawStr) {
            if (!rawStr) return null;
            var d = parseInputDate(rawStr);
            if (!d || isNaN(d.getTime())) return null;
            return { year: d.getFullYear(), month: d.getMonth() };
        }

        // --- Render Invoice / Stats ---
        function renderInvoice() {
            if (!currentTutorStudent) return;
            var logs = currentTutorStudent.logs || [];
            var rawFee = currentTutorStudent.tuition || currentTutorStudent.tuition_fee || currentTutorStudent.fee || currentTutorStudent.hocPhi || 0;
            var feePerClass = parseTuitionNumber(rawFee);
            
            // 1. TÍNH TOÁN TOÀN BỘ LỊCH SỬ CHO DASHBOARD TỔNG QUAN
            var totalPresent = 0;
            var totalAbsent = 0;
            var totalMakeup = 0;
            var totalPaid = 0;
            var totalUnpaid = 0;
            var unpaidLogs = [];
            var lastPaidIndex = -1;
            
            for (var i = 0; i < logs.length; i++) {
                var log = logs[i];
                if (!log) continue;
                
                var rawStatus = log.trangThai || log.chuyenCan || log.attendance_status || log.attendance || log.status || "";
                var normTt = String(rawStatus).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();
                
                var isDaBu = (normTt.includes("da bu") || normTt.includes("hoc bu"));
                var isAbsent = !isDaBu && (
                    normTt.includes("nghi") || 
                    normTt.includes("huy") || 
                    normTt.includes("vang") || 
                    normTt.includes("off") || 
                    normTt.includes("khong hoc") ||
                    normTt.includes("chua hoc") ||
                    normTt.includes("tam hoan") ||
                    normTt === "v" || 
                    normTt === "n" || 
                    normTt === "x"
                );
                var isPresent = !isAbsent;
                
                if (isDaBu) totalMakeup++;
                else if (isAbsent) totalAbsent++;
                else totalPresent++;
                
                var normPaid = String(log.tienDong || "").toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();
                var isPaid = normPaid.includes("da dong");
                
                if (isPaid) {
                    lastPaidIndex = i;
                    if (isPresent || isDaBu) totalPaid += feePerClass;
                } else {
                    if (isPresent || isDaBu) {
                        totalUnpaid++;
                        unpaidLogs.push(log);
                    }
                }
            }
            
            var expectedRev = totalUnpaid * feePerClass;
            
            var elExpRev = document.getElementById('tutorExpRev');
            if (elExpRev) elExpRev.innerText = expectedRev.toLocaleString('vi-VN') + "đ";
            
            var elPaidRev = document.getElementById('tutorPaidRev');
            if (elPaidRev) elPaidRev.innerText = totalPaid.toLocaleString('vi-VN') + "đ";
            
            var totalAllClasses = totalPresent + totalAbsent + totalMakeup;
            var elAtt = document.getElementById('tutorAttendance');
            if (elAtt) elAtt.innerText = totalAllClasses > 0 ? Math.round((totalPresent + totalMakeup) / totalAllClasses * 100) + "%" : "100%";
            
            // 2. TÍNH TOÁN DÀNH RIÊNG CHO PHIẾU HỌC TẬP (ĐỢT HỌC CHƯA ĐÓNG HIỆN TẠI)
            var targetMonth = (new Date()).getMonth();
            var targetYear = (new Date()).getFullYear();
            if (logs.length > 0) {
                for (var idx = logs.length - 1; idx >= 0; idx--) {
                    var pDate = parseLessonDate(logs[idx].ngay);
                    if (pDate) {
                        targetMonth = pDate.month;
                        targetYear = pDate.year;
                        break;
                    }
                }
            }

            var invoiceLogs = [];
            if (lastPaidIndex !== -1 && lastPaidIndex < logs.length - 1) {
                // Lấy tất cả các buổi sau buổi đã đóng gần nhất
                invoiceLogs = logs.slice(lastPaidIndex + 1);
            } else if (lastPaidIndex === -1) {
                // Nếu chưa có buổi nào đánh dấu đã đóng: Lấy theo tháng mới nhất có dữ liệu
                invoiceLogs = logs.filter(function(l) {
                    var p = parseLessonDate(l.ngay);
                    return p && p.month === targetMonth && p.year === targetYear;
                });
                if (invoiceLogs.length === 0) {
                    invoiceLogs = logs.slice(Math.max(0, logs.length - 10));
                }
            } else {
                // Nếu tất cả buổi đã đóng và chưa có kỳ mới: để trống, chưa có gì để báo cáo
                invoiceLogs = [];
            }

            var invPresent = 0;
            var invAbsent = 0;
            var invMakeup = 0;
            var invAbsentDates = [];
            var invDoneHw = 0;
            var invLateHw = 0;
            var invMissingHw = 0;
            var invMissingHwDates = [];
            var invBillableCount = 0;

            invoiceLogs.forEach(function(log) {
                if (!log) return;
                var dateText = log.ngay || "";
                var cleanStr = dateText.split(" ")[0].trim();
                
                var rawStatus = log.trangThai || log.chuyenCan || log.attendance_status || log.attendance || log.status || "";
                var normTt = String(rawStatus).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();
                
                var isDaBu = (normTt.includes("da bu") || normTt.includes("hoc bu"));
                var isAbsent = !isDaBu && (
                    normTt.includes("nghi") || 
                    normTt.includes("huy") || 
                    normTt.includes("vang") || 
                    normTt.includes("off") || 
                    normTt.includes("khong hoc") ||
                    normTt.includes("chua hoc") ||
                    normTt.includes("tam hoan") ||
                    normTt === "v" || 
                    normTt === "n" || 
                    normTt === "x"
                );
                var isPresent = !isAbsent;
                
                if (isDaBu) {
                    invMakeup++;
                    invBillableCount++;
                } else if (isAbsent) {
                    invAbsent++;
                    invAbsentDates.push(cleanStr || ("Buổi " + (log.tuan || "")));
                } else {
                    invPresent++;
                    invBillableCount++;
                }

                // CHỈ TÍNH BÀI TẬP VỀ NHÀ CHO CÁC BUỔI CÓ HỌC (LÊN LỚP HOẶC HỌC BÙ)
                if (isPresent || isDaBu) {
                    var btvnRaw = (log.danhGiaBTVN || log.btvn || "").trim();
                    var btvn = btvnRaw.toLowerCase();
                    if (btvn) {
                        if (btvn.indexOf("trễ") !== -1 || btvn.indexOf("muộn") !== -1) {
                            invLateHw++;
                        }
                        var pctMatch = btvn.match(/(\d+(\.\d+)?)\s*%/);
                        if (pctMatch) {
                            var pVal = parseFloat(pctMatch[1]);
                            if (pVal >= 100) {
                                invDoneHw++;
                            } else {
                                invMissingHw++;
                                invMissingHwDates.push((cleanStr || ("Buổi " + (log.tuan || ""))) + " (" + btvnRaw + ")");
                            }
                        } else if (btvn.indexOf("thiếu") !== -1 || btvn.indexOf("không làm") !== -1 || btvn.indexOf("chưa làm") !== -1 || btvn.indexOf("chưa nộp") !== -1 || btvn.indexOf("chưa đạt") !== -1 || btvn === "không") {
                            invMissingHw++;
                            invMissingHwDates.push((cleanStr || ("Buổi " + (log.tuan || ""))) + " (" + btvnRaw + ")");
                        } else if (btvn.indexOf("hoàn thành") !== -1 || btvn === "có" || btvn === "đạt" || btvn === "tốt" || btvn === "xuất sắc" || btvn.indexOf("phụ huynh") !== -1 || btvn.indexOf("nhắc") !== -1) {
                            invDoneHw++;
                        } else {
                            invDoneHw++;
                        }
                    }
                }
            });

            var elStudentName = document.getElementById('invStudentName');
            if (elStudentName) elStudentName.innerText = (currentTutorStudent.ten || currentTutorStudent.student_name || currentTutorStudent.name || "Học sinh");

            var elMonth = document.getElementById('invMonthDisplay');
            if (elMonth) elMonth.innerHTML = '<i class="fa-solid fa-calendar-days"></i> KỲ HỌC THÁNG ' + (targetMonth + 1);

            var elAttBadge = document.getElementById('invAttTotalBadge');
            if (elAttBadge) elAttBadge.innerText = invBillableCount + " Buổi";
            var elHwBadge = document.getElementById('invHwTotalBadge');
            if (elHwBadge) elHwBadge.innerText = invBillableCount + " Buổi";

            var elInvP = document.getElementById('invAttP');
            if (elInvP) elInvP.innerText = invPresent;
            var elInvA = document.getElementById('invAttA');
            if (elInvA) elInvA.innerText = invAbsent;
            var elInvB = document.getElementById('invAttB');
            if (elInvB) elInvB.innerText = invMakeup;
            var elInvDates = document.getElementById('invAbsentDates');
            if (elInvDates) {
                elInvDates.innerHTML = '<div><span>Nghỉ phép:</span> ' + escapeHtml(invAbsentDates.length > 0 ? invAbsentDates.join(", ") : "Không có") + '</div>';
            }
            
            var elHwDone = document.getElementById('invHwDone');
            if (elHwDone) elHwDone.innerText = invDoneHw;
            var elHwLate = document.getElementById('invHwLate');
            if (elHwLate) elHwLate.innerText = invLateHw;
            var elHwMiss = document.getElementById('invHwMiss');
            if (elHwMiss) elHwMiss.innerText = invMissingHw;
            
            var elHwMissDates = document.getElementById('invHwMissDates');
            if (elHwMissDates) {
                if (invMissingHwDates.length > 0) {
                    elHwMissDates.innerHTML = '<div><span>Thiếu bài:</span> ' + escapeHtml(invMissingHwDates.join(", ")) + '</div>';
                } else {
                    elHwMissDates.innerHTML = '<div><span>Thiếu bài:</span> Không thiếu bài</div>';
                }
            }
            
            var billingType = currentTutorStudent.billing_type || currentTutorStudent.billingType || currentTutorStudent.billing_cycle || 'session';
            var isMonthly = (billingType === 'month' || billingType === 'monthly');
            
            var feeStr = feePerClass.toLocaleString('vi-VN');
            // Chỉ tính tiền cho các buổi thực sự chưa đóng (unpaidLogs)
            var billableUnpaid = unpaidLogs.filter(function(l) {
                return invoiceLogs.indexOf(l) !== -1;
            }).length;
            var invTotalAmount = isMonthly ? feePerClass : (billableUnpaid * feePerClass);
            var totalStr = invTotalAmount.toLocaleString('vi-VN');
            
            var elFeeUnitLabel = document.getElementById('invFeeUnitLabel');
            var elFeeUnitValue = document.getElementById('invFeeUnitValue');
            var elCalcText = document.getElementById('invFeeCalcText');
            var elCalcTotal = document.getElementById('invFeeCalcTotal');
            var elGrandTotal = document.getElementById('invGrandTotal');
            
            if (isMonthly) {
                if (elFeeUnitLabel) elFeeUnitLabel.innerText = "Hình thức thu học phí:";
                if (elFeeUnitValue) elFeeUnitValue.innerText = "Trọn gói theo tháng";
                if (elCalcText) elCalcText.innerText = "Kỳ học phí:";
                if (elCalcTotal) elCalcTotal.innerText = "Tháng " + (targetMonth + 1);
            } else {
                if (elFeeUnitLabel) elFeeUnitLabel.innerText = "Đơn giá mỗi buổi học:";
                if (elFeeUnitValue) elFeeUnitValue.innerText = feeStr + " VNĐ";
                if (elCalcText) elCalcText.innerText = "Thời lượng học kỳ này:";
                if (elCalcTotal) elCalcTotal.innerText = billableUnpaid + " buổi";
            }
            if (elGrandTotal) elGrandTotal.innerText = totalStr + " đ";
            
            var qrImg = document.getElementById('invQrImg');
            var qrText = document.getElementById('invQrText');
            if (qrImg && qrText) {
                if (tutorDataGlobal && tutorDataGlobal.qrCode) {
                    qrImg.src = safeUrl(tutorDataGlobal.qrCode);
                    qrImg.style.display = "block";
                    qrText.innerHTML = '<i class="fa-solid fa-qrcode"></i> Quét VietQR';
                } else {
                    qrImg.style.display = "none";
                    qrText.innerText = "Chưa có mã QR thanh toán";
                }
            }
            
            // Update Textarea with prefilled text
            var sName = currentTutorStudent.ten || currentTutorStudent.student_name || currentTutorStudent.name || "bé";
            var ta = document.getElementById('invTextarea');
            if (ta) {
                if (isMonthly) {
                    ta.innerHTML = "Dạ em chào anh/chị, em gửi anh/chị phiếu học tập tổng kết của bé <b>" + escapeHtml(sName) + "</b> ạ. Học phí kỳ này (Trọn gói tháng " + (targetMonth + 1) + ") là <b>" + totalStr + " VNĐ</b>. Anh/chị xem qua và quét mã QR chuyển khoản giúp em nhé ạ. Em cảm ơn anh/chị nhiều ạ!";
                } else {
                    ta.innerHTML = "Dạ em chào anh/chị, em gửi anh/chị phiếu học tập tổng kết của bé <b>" + escapeHtml(sName) + "</b> ạ. Học phí kỳ này là <b>" + totalStr + " VNĐ</b> (" + billableUnpaid + " buổi). Anh/chị xem qua và quét mã QR chuyển khoản giúp em nhé ạ. Em cảm ơn anh/chị nhiều ạ!";
                }
            }


            // Nạp danh sách checkbox buổi học chưa đóng vào modal / container
            var container = document.getElementById('unpaidLessonsListContainer');
            if (container) {
                container.innerHTML = "";
                var masterSelectAll = document.getElementById('chkSelectAllUnpaid');
                if (masterSelectAll) masterSelectAll.checked = false;
                
                if (unpaidLogs.length === 0) {
                    container.innerHTML = '<div style="color: #A6ADCE; font-size: 13px; text-align: center; padding: 15px;"><i class="fa-solid fa-circle-check" style="color:#10B981;"></i> Tất cả buổi học đã đóng học phí!</div>';
                    var btn = document.getElementById('btnMarkPaid');
                    if (btn) btn.disabled = true;
                } else {
                    unpaidLogs.forEach(function(log) {
                        var div = document.createElement('div');
                        div.style.display = "flex";
                        div.style.alignItems = "center";
                        div.style.gap = "10px";
                        div.style.padding = "8px 10px";
                        div.style.background = "rgba(255,255,255,0.03)";
                        div.style.borderRadius = "8px";
                        div.style.border = "1px solid rgba(255,255,255,0.05)";
                        
                        div.innerHTML = '<input type="checkbox" class="unpaid-chk" value="' + escapeHtml(log.rowIndex) + '" style="cursor:pointer; width:16px; height:16px; accent-color:#8E4DFF;">' +
                                        '<span style="color: #FFF; font-size: 13px;">' +
                                          '<b>Tuần ' + escapeHtml(log.tuan || "-") + '</b> (' + escapeHtml(log.ngay || "") + ') - ' + escapeHtml(log.mon || "") + ' - <span class="badge" style="background:rgba(245,158,11,0.1); color:#F59E0B; padding:2px 6px;">' + escapeHtml(log.trangThai || "Đã học") + '</span>' +
                                        '</span>';
                        container.appendChild(div);
                    });
                    var btn = document.getElementById('btnMarkPaid');
                    if (btn) btn.disabled = false;
                }
            }
        }
        
        function exportInvoice() {
            var invElement = document.getElementById('invoiceElement');
            var sName = (currentTutorStudent && (currentTutorStudent.ten || currentTutorStudent.student_name || currentTutorStudent.name)) || "HocSinh";
            var cleanName = sName.replace(/\s+/g, '_');
            
            html2canvas(invElement, { scale: 2.5, backgroundColor: "#FFFFFF", useCORS: true }).then(canvas => {
                var link = document.createElement('a');
                link.download = 'PhieuHocTap_' + cleanName + '.png';
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
        
        var currentTutorQrBase64 = "";

        function handleTutorQrFileSelect(input) {
            if (!input || !input.files || !input.files[0]) return;
            var file = input.files[0];
            if (!file.type.startsWith('image/')) {
                showToast("Vui lòng chọn file hình ảnh (PNG, JPG, JPEG)!", "error");
                return;
            }
            
            showToast("Đang xử lý và tối ưu ảnh mã QR...", "info");
            var reader = new FileReader();
            reader.onload = function(e) {
                var img = new Image();
                img.onload = function() {
                    // Tối ưu nén kích thước ảnh QR: max 600x600 px để cực kỳ nhẹ và sắc nét
                    var maxWidth = 600;
                    var maxHeight = 600;
                    var width = img.width;
                    var height = img.height;
                    
                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = Math.round((width * maxHeight) / height);
                            height = maxHeight;
                        }
                    }
                    
                    var canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    var ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    var dataUrl = canvas.toDataURL('image/jpeg', 0.88);
                    currentTutorQrBase64 = dataUrl;
                    
                    var qrImg = document.getElementById('accQrImg');
                    var qrText = document.getElementById('accQrText');
                    var btnRemove = document.getElementById('btnRemoveTutorQr');
                    var urlInp = document.getElementById('accQrUrlInput');
                    
                    if (qrImg) {
                        qrImg.src = dataUrl;
                        qrImg.style.display = 'block';
                    }
                    if (qrText) qrText.style.display = 'none';
                    if (btnRemove) btnRemove.style.display = 'inline-flex';
                    if (urlInp) urlInp.value = '';
                    
                    showToast("Đã tải ảnh mã QR lên! Nhấn 'Cập nhật tài khoản' để lưu lại.", "success");
                };
                img.onerror = function() {
                    showToast("Không thể đọc định dạng ảnh, vui lòng thử lại ảnh khác!", "error");
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }

        function handleTutorQrUrlInput(val) {
            var trimmed = (val || '').trim();
            currentTutorQrBase64 = trimmed;
            var qrImg = document.getElementById('accQrImg');
            var qrText = document.getElementById('accQrText');
            var btnRemove = document.getElementById('btnRemoveTutorQr');
            
            if (trimmed) {
                if (qrImg) {
                    qrImg.src = trimmed;
                    qrImg.style.display = 'block';
                }
                if (qrText) qrText.style.display = 'none';
                if (btnRemove) btnRemove.style.display = 'inline-flex';
            } else {
                if (qrImg) {
                    qrImg.src = '';
                    qrImg.style.display = 'none';
                }
                if (qrText) qrText.style.display = 'block';
                if (btnRemove) btnRemove.style.display = 'none';
            }
        }

        function removeTutorQr() {
            currentTutorQrBase64 = "";
            var qrImg = document.getElementById('accQrImg');
            var qrText = document.getElementById('accQrText');
            var btnRemove = document.getElementById('btnRemoveTutorQr');
            var urlInp = document.getElementById('accQrUrlInput');
            var fileInp = document.getElementById('accQrFileInput');
            
            if (qrImg) {
                qrImg.src = "";
                qrImg.style.display = "none";
            }
            if (qrText) qrText.style.display = "block";
            if (btnRemove) btnRemove.style.display = "none";
            if (urlInp) urlInp.value = "";
            if (fileInp) fileInp.value = "";
            showToast("Đã gỡ ảnh QR. Nhấn 'Cập nhật tài khoản' để lưu thay đổi.", "info");
        }

        /* ============================================================
         * TASK 5 — Facebook-style Avatar Cropper & Profile Fields
         * ============================================================ */
        var avatarCropperInstance = null;

        function openAvatarCropper() {
            var inp = document.getElementById('avatarFileInput');
            if (inp) inp.click();
        }
        window.openAvatarCropper = openAvatarCropper;

        function handleAvatarFileSelect(input) {
            if (!input.files || !input.files[0]) return;
            var file = input.files[0];
            
            if (!file.type.startsWith('image/')) {
                showToast('Vui lòng chọn file hình ảnh!', 'error');
                return;
            }
            if (file.size > 12 * 1024 * 1024) {
                showToast('Ảnh quá lớn! Tối đa 12MB', 'error');
                return;
            }
            
            var reader = new FileReader();
            reader.onload = function(e) {
                var cropImg = document.getElementById('avatarCropImage');
                if (!cropImg) return;
                cropImg.src = e.target.result;
                
                var cropModal = document.getElementById('avatarCropModal');
                if (cropModal) {
                    cropModal.style.zIndex = '2500';
                    cropModal.style.display = 'flex';
                }
                
                if (avatarCropperInstance) {
                    avatarCropperInstance.destroy();
                    avatarCropperInstance = null;
                }
                
                setTimeout(function() {
                    if (typeof Cropper === 'undefined') {
                        showToast('Đang tải thư viện cắt ảnh, vui lòng thử lại sau...', 'warning');
                        return;
                    }
                    avatarCropperInstance = new Cropper(cropImg, {
                        aspectRatio: 1,
                        viewMode: 1,
                        dragMode: 'move',
                        cropBoxResizable: true,
                        cropBoxMovable: true,
                        autoCropArea: 0.85,
                        responsive: true,
                        restore: false,
                        guides: false,
                        center: true,
                        highlight: false,
                        background: false,
                        modal: true,
                        minCropBoxWidth: 80,
                        minCropBoxHeight: 80
                    });
                }, 150);
            };
            reader.readAsDataURL(file);
            input.value = '';
        }
        window.handleAvatarFileSelect = handleAvatarFileSelect;

        function closeAvatarCropper() {
            var cropModal = document.getElementById('avatarCropModal');
            if (cropModal) cropModal.style.display = 'none';
            if (avatarCropperInstance) {
                avatarCropperInstance.destroy();
                avatarCropperInstance = null;
            }
        }
        window.closeAvatarCropper = closeAvatarCropper;

        function avatarCropperZoom(ratio) {
            if (avatarCropperInstance) avatarCropperInstance.zoom(ratio);
        }
        window.avatarCropperZoom = avatarCropperZoom;

        function avatarCropperRotate(degree) {
            if (avatarCropperInstance) avatarCropperInstance.rotate(degree);
        }
        window.avatarCropperRotate = avatarCropperRotate;

        function saveAvatarCrop() {
            if (!avatarCropperInstance) return;
            
            var canvas = avatarCropperInstance.getCroppedCanvas({
                width: 320,
                height: 320,
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high'
            });
            
            if (!canvas) {
                showToast('Lỗi xử lý cắt ảnh!', 'error');
                return;
            }
            
            var dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            
            var avatarImg = document.getElementById('profileAvatarImg');
            var placeholder = document.getElementById('profileAvatarPlaceholder');
            if (avatarImg) {
                avatarImg.src = dataUrl;
                avatarImg.style.display = 'block';
            }
            if (placeholder) placeholder.style.display = 'none';
            
            updateSidebarAvatar(dataUrl);
            
            var phone = (tutorDataGlobal && tutorDataGlobal.tutorPhone) ? tutorDataGlobal.tutorPhone : (currentTutorPhone || 'default');
            try {
                localStorage.setItem('tutorAvatar_' + phone, dataUrl);
                localStorage.setItem('tutorAvatar_default', dataUrl);
            } catch(e) {
                console.warn('LocalStorage quota error', e);
            }

            closeAvatarCropper();
            showToast('Đã lưu ảnh đại diện thành công!', 'success');
        }
        window.saveAvatarCrop = saveAvatarCrop;

        function updateSidebarAvatar(url) {
            var avatarImg = document.getElementById('sidebarAvatarImg');
            var avatarIcon = document.getElementById('sidebarAvatarIcon');
            var avatarContainer = document.getElementById('sidebarAvatarContainer') || document.querySelector('.tutor-sidebar .sidebar-avatar');

            if (url) {
                if (avatarImg) {
                    avatarImg.src = url;
                    avatarImg.style.display = 'block';
                }
                if (avatarIcon) {
                    avatarIcon.style.display = 'none';
                }
                if (avatarContainer) {
                    avatarContainer.style.background = 'transparent';
                    avatarContainer.style.boxShadow = '0 0 0 2px var(--color-primary, #8E4DFF), 0 4px 12px rgba(0,0,0,0.2)';
                }
            } else {
                if (avatarImg) {
                    avatarImg.src = '';
                    avatarImg.style.display = 'none';
                }
                if (avatarIcon) {
                    avatarIcon.style.display = 'inline-block';
                }
                if (avatarContainer) {
                    avatarContainer.style.background = 'var(--btn-bg)';
                    avatarContainer.style.boxShadow = 'var(--shadow-primary)';
                }
            }
            
            var mobBtn = document.querySelector('.mobile-action-btn.account-btn');
            if (mobBtn) {
                if (url) {
                    mobBtn.innerHTML = '<img src="' + safeUrlAttr(url) + '" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover; border: 1.5px solid #FFF;">';
                } else {
                    mobBtn.innerHTML = '<i class="fa-solid fa-user-gear"></i>';
                }
            }
        }
        window.updateSidebarAvatar = updateSidebarAvatar;

        function loadTutorAvatar() {
            var phone = (tutorDataGlobal && tutorDataGlobal.tutorPhone) ? tutorDataGlobal.tutorPhone : (currentTutorPhone || 'default');
            var saved = localStorage.getItem('tutorAvatar_' + phone);
            if (!saved && phone !== 'default') {
                saved = localStorage.getItem('tutorAvatar_default');
            }
            if (saved) {
                var avatarImg = document.getElementById('profileAvatarImg');
                var placeholder = document.getElementById('profileAvatarPlaceholder');
                if (avatarImg) {
                    avatarImg.src = saved;
                    avatarImg.style.display = 'block';
                }
                if (placeholder) placeholder.style.display = 'none';
                updateSidebarAvatar(saved);
            } else {
                updateSidebarAvatar(null);
            }
        }
        window.loadTutorAvatar = loadTutorAvatar;
        setTimeout(loadTutorAvatar, 50);

        // 1. Cửa sổ Tài khoản (Account)
        function openTutorAccountModal() {
            if(!tutorDataGlobal) return;
            document.getElementById('accTutorName').value = tutorDataGlobal.tutorName || "";
            document.getElementById('accTutorPhone').value = tutorDataGlobal.tutorPhone || "";
            var accPinEl = document.getElementById('accTutorPin');
            if (accPinEl) accPinEl.value = tutorDataGlobal.tutorPin || "";
            var curPinReset = document.getElementById('settingsCurrentPin');
            var npPinReset = document.getElementById('settingsNewPin');
            var cpPinReset = document.getElementById('settingsConfirmPin');
            if (curPinReset) curPinReset.value = '';
            if (npPinReset) npPinReset.value = '';
            if (cpPinReset) cpPinReset.value = '';
            document.getElementById('accClassCount').value = tutorDataGlobal.classCount || "0";
            document.getElementById('accUnpaidIncome').value = (tutorDataGlobal.totalUnpaidIncome || 0).toLocaleString('vi-VN') + " VNĐ";
            
            // Fill additional profile fields from local store
            var savedProfile = {};
            try {
                var pStr = localStorage.getItem('tutorProfile_' + tutorDataGlobal.tutorPhone);
                if (pStr) savedProfile = JSON.parse(pStr);
            } catch(e) {}

            var emailEl = document.getElementById('accTutorEmail');
            if (emailEl) emailEl.value = tutorDataGlobal.email || savedProfile.email || "";

            var subjEl = document.getElementById('accTutorSubjects');
            if (subjEl) subjEl.value = tutorDataGlobal.subjects || savedProfile.subjects || "";

            var expEl = document.getElementById('accTutorExperience');
            if (expEl) expEl.value = tutorDataGlobal.experience || savedProfile.experience || "";

            var startDateEl = document.getElementById('accStartDate');
            if (startDateEl) startDateEl.value = tutorDataGlobal.createdDate || savedProfile.startDate || "01/09/2025";

            var totalSessionsEl = document.getElementById('accTotalSessions');
            if (totalSessionsEl) {
                var totalSessionsAll = 0;
                (tutorDataGlobal.students || []).forEach(function(s) {
                    if (s.logs && Array.isArray(s.logs)) totalSessionsAll += s.logs.length;
                });
                totalSessionsEl.value = totalSessionsAll + " buổi";
            }

            loadTutorAvatar();

            currentTutorQrBase64 = (tutorDataGlobal && tutorDataGlobal.qrCode) ? tutorDataGlobal.qrCode : "";
            var qrImg = document.getElementById('accQrImg');
            var qrText = document.getElementById('accQrText');
            var btnRemove = document.getElementById('btnRemoveTutorQr');
            var urlInp = document.getElementById('accQrUrlInput');
            var fileInp = document.getElementById('accQrFileInput');
            if (fileInp) fileInp.value = "";
            
            if (currentTutorQrBase64) {
                if (qrImg) {
                    qrImg.src = currentTutorQrBase64;
                    qrImg.style.display = "block";
                }
                if (qrText) qrText.style.display = "none";
                if (btnRemove) btnRemove.style.display = "inline-flex";
                if (urlInp) {
                    urlInp.value = currentTutorQrBase64.startsWith('http') ? currentTutorQrBase64 : "";
                }
            } else {
                if (qrImg) {
                    qrImg.src = "";
                    qrImg.style.display = "none";
                }
                if (qrText) qrText.style.display = "block";
                if (btnRemove) btnRemove.style.display = "none";
                if (urlInp) urlInp.value = "";
            }
            
            document.getElementById('tutorAccountModal').style.display = "flex";
        }
        function closeTutorAccountModal() {
            document.getElementById('tutorAccountModal').style.display = "none";
        }
        function saveTutorAccount() {
            var name = document.getElementById('accTutorName').value.trim();
            var phone = document.getElementById('accTutorPhone').value.trim();
            var pinEl = document.getElementById('accTutorPin');
            var pin = (pinEl ? pinEl.value.trim() : '') || (tutorDataGlobal ? tutorDataGlobal.tutorPin : '');
            var email = document.getElementById('accTutorEmail') ? document.getElementById('accTutorEmail').value.trim() : "";
            var subjects = document.getElementById('accTutorSubjects') ? document.getElementById('accTutorSubjects').value.trim() : "";
            var experience = document.getElementById('accTutorExperience') ? document.getElementById('accTutorExperience').value.trim() : "";
            
            // Hỗ trợ đổi PIN nếu người dùng nhập vào form đổi PIN trong modal Tài khoản
            var nPinInput = document.getElementById('settingsNewPin');
            var curPinInput = document.getElementById('settingsCurrentPin');
            var confPinInput = document.getElementById('settingsConfirmPin');
            if (nPinInput && nPinInput.value.trim()) {
                var curP = curPinInput ? curPinInput.value.trim() : "";
                var newP = nPinInput.value.trim();
                var confP = confPinInput ? confPinInput.value.trim() : "";
                var truePin = (tutorDataGlobal && tutorDataGlobal.tutorPin ? tutorDataGlobal.tutorPin : "").trim();

                if (!curP) {
                    showToast("Vui lòng nhập mã PIN hiện tại để đổi mã PIN!", "warning");
                    return;
                }
                if (curP !== truePin) {
                    showToast("Mã PIN hiện tại không chính xác!", "error");
                    return;
                }
                if (newP.length < 4) {
                    showToast("Mã PIN mới phải có ít nhất 4 ký tự!", "warning");
                    return;
                }
                if (newP !== confP) {
                    showToast("Mã PIN xác nhận không khớp!", "error");
                    return;
                }
                pin = newP;
            }

            if(!name || !phone) {
                showToast("Vui lòng điền đầy đủ Tên và Số điện thoại!", "error");
                return;
            }

            // Save profile details locally
            try {
                localStorage.setItem('tutorProfile_' + phone, JSON.stringify({
                    email: email,
                    subjects: subjects,
                    experience: experience
                }));
            } catch(e) {}
            
            var confirmMsg = "Bạn có chắc chắn muốn cập nhật thông tin tài khoản và mã QR?";
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
                
                var qrToSave = currentTutorQrBase64;
                
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
                            if (pinEl) pinEl.value = pin;
                            if (curPinInput) curPinInput.value = '';
                            if (nPinInput) nPinInput.value = '';
                            if (confPinInput) confPinInput.value = '';
                            tutorDataGlobal.email = email;
                            tutorDataGlobal.subjects = subjects;
                            tutorDataGlobal.experience = experience;
                            tutorDataGlobal.qrCode = qrToSave;
                            currentTutorPhone = phone;
                            
                            // Cập nhật ô input đăng nhập ẩn để đồng bộ
                            document.getElementById('maHocSinh').value = phone;
                            document.getElementById('maPin').value = pin;
                            
                            // Cập nhật tên hiển thị trên Header
                            var nameDisp = document.getElementById('tutorNameDisplay');
                            if (nameDisp) nameDisp.innerText = "Xin chào, Gia sư " + name;
                            
                            // Cập nhật trên modal hóa đơn học phí nếu đang mở
                            var invImg = document.getElementById('invQrImg');
                            var invText = document.getElementById('invQrText');
                            if (invImg && invText) {
                                if (qrToSave) {
                                    invImg.src = qrToSave;
                                    invImg.style.display = "block";
                                    invText.innerHTML = '<i class="fa-solid fa-qrcode"></i> Quét VietQR';
                                } else {
                                    invImg.style.display = "none";
                                    invText.innerText = "Chưa có mã QR thanh toán";
                                }
                            }
                            
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
                    .capNhatThongTinGiaSu(tutorDataGlobal.tutorPhone, name, phone, pin, qrToSave);
            });
        }

        function toggleBillingTypeLabel(mode) {
            if (mode === 'add') {
                var rad = document.querySelector('input[name="addStudentBillingType"]:checked');
                var val = rad ? rad.value : 'session';
                var lbl = document.getElementById('addStudentTuitionLabel');
                var inp = document.getElementById('addStudentTuition');
                if (lbl) lbl.innerText = (val === 'month') ? "Mức học phí trọn gói / tháng (VNĐ)" : "Mức học phí / buổi (VNĐ)";
                if (inp) inp.placeholder = (val === 'month') ? "Ví dụ: 2.000.000" : "Ví dụ: 200.000";
            } else if (mode === 'edit') {
                var rad = document.querySelector('input[name="editStudentBillingType"]:checked');
                var val = rad ? rad.value : 'session';
                var lbl = document.getElementById('editStudentTuitionLabel');
                var inp = document.getElementById('editStudentTuition');
                if (lbl) lbl.innerText = (val === 'month') ? "Mức học phí trọn gói / tháng (VNĐ)" : "Mức học phí / buổi (VNĐ)";
                if (inp) inp.placeholder = (val === 'month') ? "Ví dụ: 2.000.000" : "Ví dụ: 200.000";
            }
        }

        // 2. Cửa sổ Thêm học sinh (Add Student)

// =====================================
// BLOCK B: SCHEDULE FORM HELPERS (MERGED FROM DEMO)
// =====================================
        // ==========================================
        // QUẢN LÝ THỜI GIAN HỌC TRONG TUẦN (MODAL THÊM / SỬA HỌC SINH)
        // ==========================================
        var SCHEDULE_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
        var SCHEDULE_DAY_INPUT_MAP = {
            mon: 'SchMon',
            tue: 'SchTue',
            wed: 'SchWed',
            thu: 'SchThu',
            fri: 'SchFri',
            sat: 'SchSat',
            sun: 'SchSun'
        };
        var SCHEDULE_DAY_LABELS = {
            mon: 'T2',
            tue: 'T3',
            wed: 'T4',
            thu: 'T5',
            fri: 'T6',
            sat: 'T7',
            sun: 'CN'
        };

        function getCurrentSelectedScheduleTime(prefix) {
            var select = document.getElementById(prefix + 'ScheduleTimeSelect');
            if (!select) return "19:00 - 20:30";
            if (select.value === 'custom') {
                var customInput = document.getElementById(prefix + 'ScheduleTimeCustom');
                var customVal = customInput ? customInput.value.trim() : "";
                return customVal || "19:00 - 20:30";
            }
            return select.value;
        }

        function updateScheduleSummaryUI(prefix) {
            var summaryEl = document.getElementById(prefix + 'ScheduleSummary');
            if (!summaryEl) return;
            
            var activeList = [];
            SCHEDULE_DAYS.forEach(function(d) {
                var inp = document.getElementById(prefix + SCHEDULE_DAY_INPUT_MAP[d]);
                var val = inp ? inp.value.trim() : "";
                if (val) {
                    activeList.push({ key: d, label: SCHEDULE_DAY_LABELS[d], time: val });
                }
            });
            
            if (activeList.length === 0) {
                summaryEl.innerHTML = '<span style="color: #94A3B8;"><i class="fa-solid fa-calendar-xmark" style="margin-right: 4px;"></i>Chưa chọn ngày học</span>';
                return;
            }
            
            var firstTime = activeList[0].time;
            var allSame = activeList.every(function(item) { return item.time === firstTime; });
            var text = "";
            if (allSame) {
                var daysText = activeList.map(function(item) { return item.label; }).join(", ");
                text = daysText + ": " + firstTime;
            } else {
                text = activeList.map(function(item) { return item.label + " (" + item.time + ")"; }).join(", ");
            }
            summaryEl.innerHTML = '<span style="color: #6EE7B7; font-weight: 600;"><i class="fa-solid fa-calendar-check" style="margin-right: 4px;"></i>' + escapeHtml(text) + '</span>';
        }

        function initScheduleForm(prefix, schedObj) {
            var select = document.getElementById(prefix + 'ScheduleTimeSelect');
            var customWrap = document.getElementById(prefix + 'ScheduleTimeCustomWrap');
            var customInput = document.getElementById(prefix + 'ScheduleTimeCustom');
            var detailedBox = document.getElementById(prefix + 'DetailedScheduleBox');
            
            if (select) select.value = "19:00 - 20:30";
            if (customWrap) customWrap.style.display = 'none';
            if (customInput) customInput.value = "";
            if (detailedBox) detailedBox.style.display = 'none';
            
            var activeTimes = [];
            SCHEDULE_DAYS.forEach(function(d) {
                var inp = document.getElementById(prefix + SCHEDULE_DAY_INPUT_MAP[d]);
                var pill = document.querySelector('#' + prefix + 'ScheduleDays .day-pill[data-day="' + d + '"]');
                var val = (schedObj && schedObj[d]) ? String(schedObj[d]).trim() : "";
                if (val === "-") val = "";
                
                if (inp) inp.value = val;
                if (pill) {
                    if (val) {
                        pill.classList.add('active');
                        activeTimes.push(val);
                    } else {
                        pill.classList.remove('active');
                    }
                }
            });
            
            // Nếu có thời gian sẵn, đồng bộ với select hoặc custom input
            if (activeTimes.length > 0 && select) {
                var firstTime = activeTimes[0];
                var allSame = activeTimes.every(function(t) { return t === firstTime; });
                if (allSame) {
                    var matchedVal = null;
                    for (var i = 0; i < select.options.length; i++) {
                        var optVal = select.options[i].value;
                        if (optVal && optVal !== 'custom' && (optVal === firstTime || firstTime.startsWith(optVal))) {
                            matchedVal = optVal;
                            break;
                        }
                    }
                    if (matchedVal) {
                        select.value = matchedVal;
                        if (customWrap) customWrap.style.display = 'none';
                    } else {
                        select.value = 'custom';
                        if (customWrap) customWrap.style.display = 'block';
                        if (customInput) customInput.value = firstTime;
                    }
                } else {
                    // Các ngày có giờ khác nhau: tự động mở khung chi tiết để người dùng thấy rõ
                    if (detailedBox) detailedBox.style.display = 'block';
                }
            }
            
            updateScheduleSummaryUI(prefix);
        }

        function toggleScheduleDay(prefix, dayKey) {
            var pill = document.querySelector('#' + prefix + 'ScheduleDays .day-pill[data-day="' + dayKey + '"]');
            var input = document.getElementById(prefix + SCHEDULE_DAY_INPUT_MAP[dayKey]);
            var curTime = getCurrentSelectedScheduleTime(prefix);
            
            if (pill) {
                if (pill.classList.contains('active')) {
                    pill.classList.remove('active');
                    if (input) input.value = "";
                } else {
                    pill.classList.add('active');
                    if (input) input.value = curTime;
                }
            }
            updateScheduleSummaryUI(prefix);
        }

        function handleScheduleTimeSelectChange(prefix) {
            var select = document.getElementById(prefix + 'ScheduleTimeSelect');
            var customWrap = document.getElementById(prefix + 'ScheduleTimeCustomWrap');
            var customInput = document.getElementById(prefix + 'ScheduleTimeCustom');
            
            if (!select) return;
            if (select.value === 'custom') {
                if (customWrap) customWrap.style.display = 'block';
                if (customInput) {
                    customInput.focus();
                    if (!customInput.value.trim()) customInput.value = "19:00 - 20:30";
                }
            } else {
                if (customWrap) customWrap.style.display = 'none';
            }
            
            var time = getCurrentSelectedScheduleTime(prefix);
            SCHEDULE_DAYS.forEach(function(d) {
                var pill = document.querySelector('#' + prefix + 'ScheduleDays .day-pill[data-day="' + d + '"]');
                if (pill && pill.classList.contains('active')) {
                    var inp = document.getElementById(prefix + SCHEDULE_DAY_INPUT_MAP[d]);
                    if (inp) inp.value = time;
                }
            });
            updateScheduleSummaryUI(prefix);
        }

        function handleScheduleCustomTimeInput(prefix) {
            var time = getCurrentSelectedScheduleTime(prefix);
            SCHEDULE_DAYS.forEach(function(d) {
                var pill = document.querySelector('#' + prefix + 'ScheduleDays .day-pill[data-day="' + d + '"]');
                if (pill && pill.classList.contains('active')) {
                    var inp = document.getElementById(prefix + SCHEDULE_DAY_INPUT_MAP[d]);
                    if (inp) inp.value = time;
                }
            });
            updateScheduleSummaryUI(prefix);
        }

        function toggleDetailedSchedule(prefix) {
            var box = document.getElementById(prefix + 'DetailedScheduleBox');
            if (!box) return;
            if (box.style.display === 'none' || !box.style.display) {
                box.style.display = 'block';
            } else {
                box.style.display = 'none';
            }
        }

        function syncFromDetailedSchedule(prefix) {
            SCHEDULE_DAYS.forEach(function(d) {
                var inp = document.getElementById(prefix + SCHEDULE_DAY_INPUT_MAP[d]);
                var pill = document.querySelector('#' + prefix + 'ScheduleDays .day-pill[data-day="' + d + '"]');
                if (inp && pill) {
                    if (inp.value.trim() !== "") {
                        pill.classList.add('active');
                    } else {
                        pill.classList.remove('active');
                    }
                }
            });
            updateScheduleSummaryUI(prefix);
        }

        function getScheduleDataFromForm(prefix) {
            var data = {};
            SCHEDULE_DAYS.forEach(function(d) {
                var inp = document.getElementById(prefix + SCHEDULE_DAY_INPUT_MAP[d]);
                data[d] = inp ? inp.value.trim() : "";
            });
            return data;
        }

        function refreshTutorScheduleDisplay(scheduleList) {
            if (scheduleList) lastLoadedTutorSchedule = scheduleList;
            var list = lastLoadedTutorSchedule || [];
            var schedMap = {};
            list.forEach(function(s) {
                if (s && s.studentName) {
                    schedMap[s.studentName.trim()] = s;
                    schedMap[s.studentName.trim().toLowerCase()] = s;
                }
            });
            
            var baseStudents = (typeof getTutorStudentsResolved === 'function') 
                ? getTutorStudentsResolved() 
                : ((tutorDataGlobal && tutorDataGlobal.students) ? tutorDataGlobal.students : []);
            var students = Array.isArray(baseStudents) ? baseStudents.slice() : [];
            var stNames = new Set(students.map(function(st){ return (st.name || '').trim().toLowerCase(); }));
            list.forEach(function(s) {
                if (s && s.studentName && !stNames.has(s.studentName.trim().toLowerCase())) {
                    // Chỉ hiển thị học sinh tự do / học thử nếu thực sự có ít nhất 1 buổi học trong tuần:
                    var hasAnySlot = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].some(function(k) {
                        var val = (s[k] || '').trim();
                        return val !== '' && val !== '-';
                    });
                    if (hasAnySlot) {
                        stNames.add(s.studentName.trim().toLowerCase());
                        students.push({
                            name: s.studentName.trim(),
                            subject: s.subject || "Gia sư 1-1"
                        });
                    }
                }
            });
            
            // Lọc danh sách học sinh hiển thị trên TKB: loại bỏ học sinh học thử/tự do nếu không còn ca nào
            students = students.filter(function(st) {
                var sName = (st.name || '').trim();
                var s = schedMap[sName] || schedMap[sName.toLowerCase()] || {};
                var hasActiveSlot = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].some(function(k) {
                    var val = (s[k] || '').trim();
                    return val !== '' && val !== '-';
                });
                
                // Kiểm tra xem có phải học sinh chính thức không (có phone và nằm trong tutorDataGlobal.students)
                var isOfficial = false;
                if (tutorDataGlobal && Array.isArray(tutorDataGlobal.students)) {
                    isOfficial = tutorDataGlobal.students.some(function(officialSt) {
                        return (officialSt.name || '').trim().toLowerCase() === sName.toLowerCase() && (officialSt.phone || officialSt.tuition);
                    });
                }
                
                if (isOfficial) return true;
                return hasActiveSlot;
            });
                
            var table = document.getElementById('tutorScheduleTable');
            if (table) {
                var tableHtml = "<tr><th>Học sinh</th><th>Thứ 2</th><th>Thứ 3</th><th>Thứ 4</th><th>Thứ 5</th><th>Thứ 6</th><th>Thứ 7</th><th>CN</th><th style='width: 50px;'>Sửa</th></tr>";
                if (students && students.length > 0) {
                    students.forEach(function(st) {
                        var s = schedMap[st.name.trim()] || schedMap[st.name.trim().toLowerCase()] || { mon: "", tue: "", wed: "", thu: "", fri: "", sat: "", sun: "" };
                        tableHtml += "<tr>" +
                            "<td style='font-weight:700; color:var(--color-primary); text-align: left; padding: 12px 14px; white-space: nowrap;'>" + escapeHtml(st.name) + "</td>" +
                            "<td style='text-align: center; padding: 12px 10px;'>" + formatScheduleCell(s.mon) + "</td>" +
                            "<td style='text-align: center; padding: 12px 10px;'>" + formatScheduleCell(s.tue) + "</td>" +
                            "<td style='text-align: center; padding: 12px 10px;'>" + formatScheduleCell(s.wed) + "</td>" +
                            "<td style='text-align: center; padding: 12px 10px;'>" + formatScheduleCell(s.thu) + "</td>" +
                            "<td style='text-align: center; padding: 12px 10px;'>" + formatScheduleCell(s.fri) + "</td>" +
                            "<td style='text-align: center; padding: 12px 10px;'>" + formatScheduleCell(s.sat) + "</td>" +
                            "<td style='text-align: center; padding: 12px 10px;'>" + formatScheduleCell(s.sun) + "</td>" +
                            "<td style='text-align: center; padding: 12px 10px;'><button onclick='openEditScheduleModal(\"" + jsStr(st.name) + "\", \"" + jsStr(s.mon||"") + "\", \"" + jsStr(s.tue||"") + "\", \"" + jsStr(s.wed||"") + "\", \"" + jsStr(s.thu||"") + "\", \"" + jsStr(s.fri||"") + "\", \"" + jsStr(s.sat||"") + "\", \"" + jsStr(s.sun||"") + "\")' class='btn-icon-edit' style='margin: 0 auto; padding: 6px 10px; display: inline-flex; align-items: center; justify-content: center;' title='Sửa thời khóa biểu'><i class='fa-solid fa-pen-to-square'></i></button></td>" +
                            "</tr>";
                    });
                } else {
                    tableHtml += "<tr><td colspan='9' style='text-align: center; padding: 25px; color: var(--text-muted);'>Chưa có thời khóa biểu</td></tr>";
                }
                table.innerHTML = tableHtml;
            }
            
            var mobileContainer = document.getElementById('tutorScheduleMobile');
            if (mobileContainer) {
                var mobileHtml = "";
                if (students && students.length > 0) {
                    students.forEach(function(st, idx) {
                        var s = schedMap[st.name.trim()] || { mon: "", tue: "", wed: "", thu: "", fri: "", sat: "", sun: "" };
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
                    mobileHtml += "      <span>" + escapeHtml(st.name) + "</span>";
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
                        var dayVal = day.val ? escapeHtml(day.val) : "<span style='color: var(--text-muted); font-weight: 400;'>Trống</span>";
                        mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>" + day.label + "</span><span class='accordion-body-val' style='color:var(--text-primary); font-weight:600;'>" + dayVal + "</span></div>";
                    });
                    
                    mobileHtml += "    <div style='margin-top: 10px; text-align: right;'>";
                    mobileHtml += "      <button onclick='openEditScheduleModal(\"" + jsStr(st.name) + "\", \"" + jsStr(s.mon||"") + "\", \"" + jsStr(s.tue||"") + "\", \"" + jsStr(s.wed||"") + "\", \"" + jsStr(s.thu||"") + "\", \"" + jsStr(s.fri||"") + "\", \"" + jsStr(s.sat||"") + "\", \"" + jsStr(s.sun||"") + "\")' class='action-btn-hw' style='border-color:var(--color-primary); color:var(--color-primary); cursor:pointer;'><i class='fa-solid fa-pen-to-square'></i> Sửa lịch học</button>";
                    mobileHtml += "    </div>";
                    mobileHtml += "  </div>";
                    mobileHtml += "</div>";
                });
            } else {
                mobileHtml = "<div style='text-align: center; padding: 20px; color: var(--text-muted);'>Chưa có thời khóa biểu</div>";
            }
            mobileContainer.innerHTML = mobileHtml;
        }
            
            if (typeof renderUpcomingSchedule === 'function') {
                renderUpcomingSchedule(list);
            }
            if (typeof renderTutorStudentsGrid === 'function') {
                renderTutorStudentsGrid();
            }
        }
        window.refreshTutorScheduleDisplay = refreshTutorScheduleDisplay;

        function saveStudentScheduleData(studentName, schedData, oldStudentName) {
            if (!studentName) return;
            studentName = studentName.trim();
            var lookupName = (oldStudentName || studentName).trim();
            
            // 1. Cập nhật bộ nhớ đệm lastLoadedTutorSchedule
            if (!lastLoadedTutorSchedule || !Array.isArray(lastLoadedTutorSchedule)) {
                lastLoadedTutorSchedule = [];
            }
            var foundIdx = lastLoadedTutorSchedule.findIndex(function(s) {
                return s.studentName && s.studentName.trim().toLowerCase() === lookupName.toLowerCase();
            });
            if (foundIdx !== -1) {
                lastLoadedTutorSchedule[foundIdx].studentName = studentName;
                SCHEDULE_DAYS.forEach(function(d) {
                    lastLoadedTutorSchedule[foundIdx][d] = schedData[d] || "";
                });
            } else {
                var newItem = {
                    studentName: studentName,
                    color: "#8E4DFF"
                };
                SCHEDULE_DAYS.forEach(function(d) {
                    newItem[d] = schedData[d] || "";
                });
                lastLoadedTutorSchedule.push(newItem);
            }
            
            // 2. Đồng bộ sang Iframe Lịch (tutorScheduleSheetData & FullCalendar) nếu đang mở
            try {
                var calFrame = document.getElementById('tutorCalendarIframe');
                if (calFrame && calFrame.contentWindow && Array.isArray(calFrame.contentWindow.tutorScheduleSheetData)) {
                    var cData = calFrame.contentWindow.tutorScheduleSheetData;
                    var cIdx = cData.findIndex(function(r) {
                        return (r.studentName || '').trim().toLowerCase() === lookupName.toLowerCase();
                    });
                    if (cIdx !== -1) {
                        cData[cIdx].studentName = studentName;
                        SCHEDULE_DAYS.forEach(function(d) {
                            cData[cIdx][d] = schedData[d] || "";
                        });
                    } else {
                        var newRow = { studentName: studentName, color: "#8E4DFF" };
                        SCHEDULE_DAYS.forEach(function(d) {
                            newRow[d] = schedData[d] || "";
                        });
                        cData.push(newRow);
                    }
                    if (typeof calFrame.contentWindow.loadStudentOptions === 'function') {
                        calFrame.contentWindow.loadStudentOptions();
                    }
                    if (typeof calFrame.contentWindow.renderSheetTable === 'function') {
                        calFrame.contentWindow.renderSheetTable();
                    }
                    if (calFrame.contentWindow.calendar && typeof calFrame.contentWindow.calendar.refetchEvents === 'function') {
                        calFrame.contentWindow.calendar.refetchEvents();
                    }
                }
            } catch(e) {}

            // 3. Đồng bộ vào demo store nếu đang ở chế độ demo
            try {
                var store = (typeof getSafeParentStore === 'function') ? getSafeParentStore() : null;
                if (!store && typeof getGiaSuDemoStore === 'function') store = getGiaSuDemoStore();
                if (store && store.tutorSchedule && Array.isArray(store.tutorSchedule)) {
                    var sItem = store.tutorSchedule.find(function(s) {
                        return (s.studentName || '').trim().toLowerCase() === lookupName.toLowerCase();
                    });
                    if (sItem) {
                        sItem.studentName = studentName;
                        SCHEDULE_DAYS.forEach(function(d) { sItem[d] = schedData[d] || ""; });
                    } else {
                        var nItem = { studentName: studentName, color: "#8E4DFF" };
                        SCHEDULE_DAYS.forEach(function(d) { nItem[d] = schedData[d] || ""; });
                        store.tutorSchedule.push(nItem);
                    }
                    if (typeof safeSaveParentStore === 'function') safeSaveParentStore(store);
                    else if (typeof saveGiaSuDemoStore === 'function') saveGiaSuDemoStore(store);
                }
            } catch(e) {}
            
            // 4. Đồng bộ lên Backend (GAS / Supabase / Mock API)
            var tutorPhone = (tutorDataGlobal && tutorDataGlobal.tutorPhone) ? tutorDataGlobal.tutorPhone : (sessionStorage.getItem('userPhone') || (typeof currentTutorPhone !== 'undefined' ? currentTutorPhone : ""));
            if (typeof google !== 'undefined' && google.script && google.script.run && tutorPhone) {
                if (typeof google.script.run.capNhatThoiKhoaBieu === 'function') {
                    google.script.run
                        .withSuccessHandler(function(res) {
                            console.log("Schedule saved to backend successfully", res);
                        })
                        .capNhatThoiKhoaBieu(tutorPhone, studentName, 
                            schedData.mon || "", schedData.tue || "", schedData.wed || "", schedData.thu || "", 
                            schedData.fri || "", schedData.sat || "", schedData.sun || "");
                } else if (typeof google.script.run.saveScheduleToBackend === 'function') {
                    google.script.run
                        .withSuccessHandler(function(res) {
                            console.log("Schedule saved to backend successfully", res);
                        })
                        .saveScheduleToBackend(tutorPhone, studentName, 
                            schedData.mon || "", schedData.tue || "", schedData.wed || "", schedData.thu || "", 
                            schedData.fri || "", schedData.sat || "", schedData.sun || "");
                }
            }
            
            // 5. Cập nhật giao diện (Grid thẻ học sinh, lịch tuần Overview)
            refreshTutorScheduleDisplay(lastLoadedTutorSchedule);
        }

        // Expose to window
        window.toggleScheduleDay = toggleScheduleDay;
        window.handleScheduleTimeSelectChange = handleScheduleTimeSelectChange;
        window.handleScheduleCustomTimeInput = handleScheduleCustomTimeInput;
        window.toggleDetailedSchedule = toggleDetailedSchedule;
        window.syncFromDetailedSchedule = syncFromDetailedSchedule;
        window.initScheduleForm = initScheduleForm;
        window.getScheduleDataFromForm = getScheduleDataFromForm;
        window.saveStudentScheduleData = saveStudentScheduleData;

        // 2. Cửa sổ Thêm học sinh (Add Student)

        function openAddStudentModal() {
            document.getElementById('addParentName').value = "";
            document.getElementById('addStudentName').value = "";
            document.getElementById('addStudentPhone').value = "";
            document.getElementById('addStudentTuition').value = "";
            document.getElementById('addStudentMaBaiTap').value = "";
            
            var radSession = document.getElementById('addBillingSession');
            if (radSession) radSession.checked = true;
            toggleBillingTypeLabel('add');
            initScheduleForm('add', null);
            
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
            var radBilling = document.querySelector('input[name="addStudentBillingType"]:checked');
            var billingType = radBilling ? radBilling.value : 'session';
            var thongBao = "";
            var schedData = (typeof getScheduleDataFromForm === 'function') ? getScheduleDataFromForm('add') : null;
            
            if(!sName || !phone) {
                showToast("Vui lòng nhập Tên học sinh và Số điện thoại!", "error");
                return;
            }
            if(!pName) {
                pName = "Phụ huynh em " + sName;
            }
            if(!maBaiTap) {
                maBaiTap = phone;
            }
            
            // Kiểm tra xem mã bài tập có bị trùng với học sinh khác của gia sư không
            if (tutorDataGlobal && tutorDataGlobal.students) {
                var checkHw = maBaiTap.trim().toLowerCase();
                var dup = tutorDataGlobal.students.find(function(s) {
                    var sCode = (s.maBaiTap || s.phone || "").trim().toLowerCase();
                    return sCode && sCode === checkHw;
                });
                if (dup) {
                    showToast("Mã bài tập '" + maBaiTap + "' đã được sử dụng. Vui lòng đổi mã bài tập khác!", "error");
                    return;
                }
            }
            var cleanTuition = String(tuition || "").replace(/\D/g, '');
            var tuitionNum = parseFloat(cleanTuition) || 0;
            
            var btn = document.querySelector('#addStudentModal .modal-btn-primary');
            var origText = btn ? btn.innerHTML : "Thêm mới";
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang thêm...';
            }
            
            google.script.run
                .withSuccessHandler(function(res) {
                    if (btn) {
                        btn.disabled = false;
                        btn.innerHTML = origText;
                    }
                    if(res && res.error) {
                         showToast(res.error, "error");
                    } else {
                         if (schedData && typeof saveStudentScheduleData === 'function') {
                             saveStudentScheduleData(sName, schedData);
                         }
                         showToast("Thêm học sinh mới thành công!", "success");
                         closeAddStudentModal();
                         refreshTutorDashboard();
                    }
                })
                .withFailureHandler(function(err) {
                    if (btn) {
                        btn.disabled = false;
                        btn.innerHTML = origText;
                    }
                    showToast("Lỗi kết nối hoặc hệ thống: " + err.toString(), "error");
                })
                .themHocSinhMoi(tutorDataGlobal.tutorPhone, pName, sName, phone, tuitionNum, maBaiTap, thongBao, billingType);
        }

        // 3. Cửa sổ Sửa học sinh (Edit Student)
        function openEditStudentModal(stParam) {
            if (stParam) currentTutorStudent = stParam;
            if(!currentTutorStudent) return;
            var sName = (currentTutorStudent.name || "").trim();
            
            var oldPhoneInp = document.getElementById('editOldStudentPhone');
            if (oldPhoneInp) oldPhoneInp.value = currentTutorStudent.phone || "";
            var nameInp = document.getElementById('editStudentName');
            if (nameInp) nameInp.value = sName;
            var tuitionInp = document.getElementById('editStudentTuition');
            if (tuitionInp) tuitionInp.value = currentTutorStudent.tuition ? formatNumberWithDots(currentTutorStudent.tuition) : "";
            var maBtInp = document.getElementById('editStudentMaBaiTap');
            if (maBtInp) maBtInp.value = currentTutorStudent.maBaiTap || "";
            
            var bType = currentTutorStudent.billing_type || currentTutorStudent.billingType || currentTutorStudent.billing_cycle || 'session';
            if (bType === 'month' || bType === 'monthly') {
                var radM = document.getElementById('editBillingMonth');
                if (radM) radM.checked = true;
            } else {
                var radS = document.getElementById('editBillingSession');
                if (radS) radS.checked = true;
            }
            if (typeof toggleBillingTypeLabel === 'function') {
                toggleBillingTypeLabel('edit');
            }

            // Nạp lịch học của học sinh vào form chỉnh sửa
            var studentSched = null;
            if (lastLoadedTutorSchedule && Array.isArray(lastLoadedTutorSchedule)) {
                studentSched = lastLoadedTutorSchedule.find(function(s) {
                    return s && s.studentName && s.studentName.trim().toLowerCase() === sName.toLowerCase();
                });
            }
            if (!studentSched) {
                try {
                    var calFrame = document.getElementById('tutorCalendarIframe');
                    if (calFrame && calFrame.contentWindow && Array.isArray(calFrame.contentWindow.tutorScheduleSheetData)) {
                        studentSched = calFrame.contentWindow.tutorScheduleSheetData.find(function(s) {
                            return s && s.studentName && s.studentName.trim().toLowerCase() === sName.toLowerCase();
                        });
                    }
                } catch(e) {}
            }
            if (!studentSched && currentTutorStudent.schedule) {
                studentSched = currentTutorStudent.schedule;
            }

            if (typeof initScheduleForm === 'function') {
                initScheduleForm('edit', studentSched);
            }

            if (!studentSched) {
                var tPhone = (tutorDataGlobal && tutorDataGlobal.tutorPhone) ? tutorDataGlobal.tutorPhone : (sessionStorage.getItem('userPhone') || (typeof currentTutorPhone !== 'undefined' ? currentTutorPhone : ""));
                if (typeof google !== 'undefined' && google.script && google.script.run && tPhone && typeof google.script.run.getTutorSchedule === 'function') {
                    google.script.run.withSuccessHandler(function(schedList) {
                        if (schedList && Array.isArray(schedList)) {
                            lastLoadedTutorSchedule = schedList;
                            var sFound = schedList.find(function(s) {
                                return s && s.studentName && s.studentName.trim().toLowerCase() === sName.toLowerCase();
                            });
                            if (sFound && typeof initScheduleForm === 'function') {
                                initScheduleForm('edit', sFound);
                            }
                        }
                    }).getTutorSchedule(tPhone);
                }
            }
            
            var parentInp = document.getElementById('editParentName');
            if (parentInp) {
                parentInp.value = currentTutorStudent.parentName || ("Phụ huynh em " + sName);
                parentInp.placeholder = "";
            }
            try {
                if (typeof google !== 'undefined' && google.script && google.script.run && typeof google.script.run.getStudentParentName === 'function') {
                    google.script.run.withSuccessHandler(function(pName) {
                        if (pName && parentInp) {
                            parentInp.value = pName;
                        }
                    }).getStudentParentName(currentTutorStudent.phone);
                }
            } catch (errP) {}
            
            var phoneInp = document.getElementById('editStudentPhone');
            if (phoneInp) {
                phoneInp.value = currentTutorStudent.phone || "";
            }
            var modalEl = document.getElementById('editStudentModal');
            if (modalEl) {
                modalEl.style.display = "flex";
            }
        }
        function closeEditStudentModal() {
            var modalEl = document.getElementById('editStudentModal');
            if (modalEl) modalEl.style.display = "none";
        }
        function saveEditStudent() {
            var oldPhone = document.getElementById('editOldStudentPhone').value;
            var pName = document.getElementById('editParentName').value.trim();
            var sName = document.getElementById('editStudentName').value.trim();
            var phone = document.getElementById('editStudentPhone').value.trim();
            var tuition = document.getElementById('editStudentTuition').value.trim();
            var maBaiTap = document.getElementById('editStudentMaBaiTap').value.trim();
            var radBilling = document.querySelector('input[name="editStudentBillingType"]:checked');
            var billingType = radBilling ? radBilling.value : 'session';
            var thongBao = (currentTutorStudent && currentTutorStudent.thongBao) ? currentTutorStudent.thongBao : "";
            var schedData = (typeof getScheduleDataFromForm === 'function') ? getScheduleDataFromForm('edit') : null;
            
            if(!sName || !phone) {
                showToast("Vui lòng nhập Tên học sinh và Số điện thoại!", "error");
                return;
            }
            if(!pName) {
                pName = "Phụ huynh em " + sName;
            }
            if(!maBaiTap) {
                maBaiTap = phone;
            }
            
            // Kiểm tra xem mã bài tập có bị trùng với học sinh khác không
            if (tutorDataGlobal && tutorDataGlobal.students) {
                var checkHw = maBaiTap.trim().toLowerCase();
                var dup = tutorDataGlobal.students.find(function(s) {
                    if (s.phone === oldPhone || (currentTutorStudent && s.phone === currentTutorStudent.phone)) return false;
                    var sCode = (s.maBaiTap || s.phone || "").trim().toLowerCase();
                    return sCode && sCode === checkHw;
                });
                if (dup) {
                    showToast("Mã bài tập '" + maBaiTap + "' đã được sử dụng. Vui lòng đổi mã bài tập khác!", "error");
                    return;
                }
            }
            var cleanTuition = String(tuition || "").replace(/\D/g, '');
            var tuitionNum = parseFloat(cleanTuition) || 0;
            
            var btn = document.querySelector('#editStudentModal .modal-btn-primary');
            var origText = btn ? btn.innerHTML : "Lưu thay đổi";
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';
            }
            
            google.script.run
                .withSuccessHandler(function(res) {
                    if (btn) {
                        btn.disabled = false;
                        btn.innerHTML = origText;
                    }
                    if(res && res.error) {
                        showToast("Lỗi: " + res.error, "error");
                    } else {
                        // Đồng bộ lịch học đã sửa
                        if (schedData && typeof saveStudentScheduleData === 'function') {
                            var oldSName = (currentTutorStudent && currentTutorStudent.name) ? currentTutorStudent.name : sName;
                            saveStudentScheduleData(sName, schedData, oldSName);
                        }
                        showToast("Cập nhật thông tin học sinh thành công!", "success");
                        closeEditStudentModal();
                        refreshTutorDashboard();
                    }
                })
                .withFailureHandler(function(err) {
                    if (btn) {
                        btn.disabled = false;
                        btn.innerHTML = origText;
                    }
                    showToast("Lỗi kết nối hoặc hệ thống: " + err.toString(), "error");
                })
                .suaThongTinHocSinh(oldPhone, pName, sName, phone, tuitionNum, maBaiTap, thongBao, billingType);
        }
        window.openEditStudentModal = openEditStudentModal;
        window.closeEditStudentModal = closeEditStudentModal;
        window.saveEditStudent = saveEditStudent;
        window.saveStudentScheduleData = saveStudentScheduleData;

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
            statusLabel.innerHTML = '<i class="fa-solid fa-circle-check"></i> Đã lưu thành công!';
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

        function clearQuickAnnouncement() {
            if (!currentTutorStudent) {
                showToast("Vui lòng chọn học sinh trước!", "warning");
                return;
            }
            var input = document.getElementById('quickAnnouncementInput');
            var statusLabel = document.getElementById('announcementStatus');

            // 1. Xóa sạch ô nhập ngay lập tức
            if (input) input.value = "";

            // 2. Cập nhật dữ liệu bộ nhớ cục bộ
            currentTutorStudent.thongBao = "";
            if (tutorDataGlobal && tutorDataGlobal.students) {
                tutorDataGlobal.students.forEach(function(s) {
                    if (s.phone === currentTutorStudent.phone || s.name === currentTutorStudent.name || (s.maBaiTap && s.maBaiTap === currentTutorStudent.maBaiTap)) {
                        s.thongBao = "";
                    }
                });
            }

            // 3. Hiển thị nhãn trạng thái và Toast
            if (statusLabel) {
                statusLabel.innerHTML = '<i class="fa-solid fa-circle-check" style="color: #EF4444;"></i> Đã xóa thông báo!';
                statusLabel.style.color = '#EF4444';
                statusLabel.style.display = 'inline';
                setTimeout(function() {
                    statusLabel.style.display = 'none';
                    statusLabel.style.color = '#10B981';
                }, 3000);
            }
            showToast("Đã xóa thông báo nhanh thành công!", "success");

            // 4. Đồng bộ ngay lên Supabase Backend
            showSyncToast('pending');
            var lookupKey = currentTutorStudent.phone || currentTutorStudent.maBaiTap || currentTutorStudent.name;
            google.script.run
                .withSuccessHandler(function(res) {
                    if (res && res.error) {
                        showSyncToast('error');
                        showToast("Lỗi khi xóa thông báo: " + res.error, "error");
                    } else {
                        showSyncToast('success');
                    }
                })
                .withFailureHandler(function(err) {
                    showSyncToast('error');
                    console.error("Lỗi kết nối xóa thông báo:", err);
                })
                .capNhatThongBaoHocSinh(lookupKey, "");
        }


        // 4. Cửa sổ Thêm buổi học (Add Lesson) & Preview
        function openAddLessonModal() {
            if (!currentTutorStudent) {
                var diaryFilter = document.getElementById('diaryStudentFilter');
                var students = (typeof getTutorStudentsResolved === 'function') 
                    ? getTutorStudentsResolved() 
                    : ((tutorDataGlobal && tutorDataGlobal.students) ? tutorDataGlobal.students : []);
                if (diaryFilter && diaryFilter.value && students.length > 0) {
                    var found = students.find(function(s) { return s.name.trim() === diaryFilter.value.trim(); });
                    if (found) currentTutorStudent = found;
                }
                if (!currentTutorStudent && students.length > 0) {
                    currentTutorStudent = students[0];
                }
            }

            if (!currentTutorStudent) {
                showToast("Vui lòng thêm học sinh trước khi tạo buổi học!", "warning");
                if (typeof openAddStudentModal === 'function') openAddStudentModal();
                return;
            }

            var stBadge = document.getElementById('addLessonStudentBadge');
            if (stBadge) {
                stBadge.innerText = "(Học sinh: " + currentTutorStudent.name + ")";
            }
            
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
                    // Phân tích ngày của buổi học trước (hỗ trợ cả DD/MM, DD/MM/YYYY, YYYY-MM-DD)
                    var parseDate = function(str) {
                        if (!str) return null;
                        var s = String(str).trim().split(' ')[0];
                        var mIso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
                        if (mIso) return new Date(parseInt(mIso[1], 10), parseInt(mIso[2], 10) - 1, parseInt(mIso[3], 10));
                        var mDmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                        if (mDmy) return new Date(parseInt(mDmy[3], 10), parseInt(mDmy[2], 10) - 1, parseInt(mDmy[1], 10));
                        var mDm = s.match(/^(\d{1,2})\/(\d{1,2})/);
                        if (mDm) {
                            var currentYear = new Date().getFullYear();
                            return new Date(currentYear, parseInt(mDm[2], 10) - 1, parseInt(mDm[1], 10));
                        }
                        var d = new Date(s);
                        return isNaN(d.getTime()) ? null : d;
                    };
                    // Lấy ngày Thứ Hai đầu tuần của 1 ngày bất kỳ
                    var getMonday = function(d) {
                        var date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                        var day = date.getDay();
                        var diff = date.getDate() - day + (day === 0 ? -6 : 1);
                        var monday = new Date(date);
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
                        weekNum = lastWeekVal;
                    }
                }
            }
            document.getElementById('lesTuan').value = weekNum;


            
            document.getElementById('lesNoiDung').value = "";
            if (document.getElementById('lesNhanXet')) document.getElementById('lesNhanXet').value = "";
            document.getElementById('lesDiemDau').value = "Không có";
            document.getElementById('lesDiemDinhKi').value = "Không có";
            document.getElementById('lesTrangThai').value = "Đã học";
            document.getElementById('lesBtvn').value = "Hoàn thành";
            var addWrap = document.getElementById('lesBtvnCustomWrap');
            if (addWrap) addWrap.style.display = "none";
            var addInp = document.getElementById('lesBtvnCustom');
            if (addInp) addInp.value = "";
            document.getElementById('lesMon').value = "Toán";
            var monWrap = document.getElementById('lesMonCustomWrap');
            if (monWrap) monWrap.style.display = "none";
            var monInp = document.getElementById('lesMonCustom');
            if (monInp) monInp.value = "";
            
            document.getElementById('addLessonModal').style.display = "flex";
        }

        // Helper toggle ô nhập môn học tùy chỉnh khi chọn "Khác"
        window.toggleMonCustomInput = function(selectId, wrapId, inputId) {
            var sel = document.getElementById(selectId);
            var wrap = document.getElementById(wrapId);
            var inp = document.getElementById(inputId);
            if (!sel || !wrap) return;
            if (sel.value === "Khác") {
                wrap.style.display = "block";
                if (inp) inp.focus();
            } else {
                wrap.style.display = "none";
            }
        };

        // Helper toggle ô nhập % BTVN tùy chỉnh khi chọn "Khác"
        window.toggleBtvnCustomInput = function(selectId, wrapId, inputId) {
            var sel = document.getElementById(selectId);
            var wrap = document.getElementById(wrapId);
            var inp = document.getElementById(inputId);
            if (!sel || !wrap) return;
            if (sel.value === "Khác") {
                wrap.style.display = "block";
                if (inp) inp.focus();
            } else {
                wrap.style.display = "none";
            }
        };

        function closeAddLessonModal() {
            document.getElementById('addLessonModal').style.display = "none";
        }
        
        var tempLessonData = null; 
        
        function previewLessonLog() {
            var tuan = document.getElementById('lesTuan').value.trim();
            var ngayVal = document.getElementById('lesNgay').value;
            var mon = document.getElementById('lesMon').value;
            if (mon === "Khác") {
                var customMonInp = document.getElementById('lesMonCustom');
                var customMonVal = customMonInp ? customMonInp.value.trim() : "";
                if (!customMonVal) {
                    showToast("Vui lòng nhập tên môn học!", "error");
                    if (customMonInp) customMonInp.focus();
                    return;
                }
                mon = customMonVal;
            }
            var trangThai = document.getElementById('lesTrangThai').value;
            var btvn = document.getElementById('lesBtvn').value;
            if (btvn === "Khác") {
                var customInp = document.getElementById('lesBtvnCustom');
                var customVal = customInp ? customInp.value.trim() : "";
                if (!customVal) {
                    showToast("Vui lòng nhập phần trăm hoàn thành BTVN!", "error");
                    if (customInp) customInp.focus();
                    return;
                }
                var pct = parseInt(customVal, 10);
                if (isNaN(pct) || pct < 0 || pct > 100) {
                    showToast("Phần trăm hoàn thành BTVN phải từ 0% đến 100%!", "error");
                    if (customInp) customInp.focus();
                    return;
                }
                btvn = (pct === 0) ? "Không làm" : ((pct === 100) ? "Hoàn thành" : "Hoàn thành " + pct + "%");
            }
            var diemDau = document.getElementById('lesDiemDau').value.trim();
            var diemDinhKi = document.getElementById('lesDiemDinhKi').value.trim();
            var noiDung = document.getElementById('lesNoiDung').value.trim();
            var nhanXet = document.getElementById('lesNhanXet') ? document.getElementById('lesNhanXet').value.trim() : "";
            
            if(!tuan || !ngayVal || !noiDung) {
                showToast("Vui lòng nhập đầy đủ Tuần, Ngày học và Nội dung bài học!", "error");
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
                noiDung: noiDung,
                nhanXet: nhanXet
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
            var prevNxEl = document.getElementById('prevNhanXet');
            if (prevNxEl) prevNxEl.innerText = tempLessonData.nhanXet || "—";
            
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
                nhanXet: tempLessonData.nhanXet || "",
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
                    nhanXet: tempLessonData.nhanXet || "",
                    btvn: tempLessonData.btvn,
                    diemDau: tempLessonData.diemDau,
                    diemDinhKi: tempLessonData.diemDinhKi,
                    trangThai: tempLessonData.trangThai
                }
            });
        }


        // --- Custom in-app notification and confirmation dialogs ---
        function showToast(message, type, actionBtn) {
            type = type || 'info';
            var container = document.getElementById('toastContainer');
            if (!container) return;
            
            var toast = document.createElement('div');
            toast.style.padding = '14px 20px';
            toast.style.borderRadius = '12px';
            toast.style.color = '#FFF';
            toast.style.fontSize = '14px';
            toast.style.fontWeight = '600';
            toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
            toast.style.pointerEvents = 'auto';
            toast.style.animation = 'slideIn 0.3s ease forwards';
            toast.style.fontFamily = 'Inter, sans-serif';
            toast.style.display = 'flex';
            toast.style.alignItems = 'center';
            toast.style.gap = '10px';
            toast.style.borderWidth = '1px';
            toast.style.borderStyle = 'solid';
            toast.style.position = 'relative';
            toast.style.overflow = 'hidden';
            
            var iconHtml = '<i class="fa-solid fa-circle-info"></i>';
            if (type === 'success') {
                toast.style.background = '#059669';
                toast.style.borderColor = '#10B981';
                iconHtml = '<i class="fa-solid fa-circle-check"></i>';
            } else if (type === 'error') {
                toast.style.background = '#DC2626';
                toast.style.borderColor = '#EF4444';
                iconHtml = '<i class="fa-solid fa-circle-xmark"></i>';
            } else if (type === 'warning') {
                toast.style.background = '#D97706';
                toast.style.borderColor = '#F59E0B';
                iconHtml = '<i class="fa-solid fa-triangle-exclamation"></i>';
            } else {
                toast.style.background = '#2563EB';
                toast.style.borderColor = '#3B82F6';
            }

            var textSpan = document.createElement('span');
            textSpan.innerHTML = iconHtml + ' ' + escapeHtml(message);
            textSpan.style.display = 'inline-flex';
            textSpan.style.alignItems = 'center';
            textSpan.style.gap = '8px';
            toast.appendChild(textSpan);

            // Nút hành động (Hoàn tác, v.v.)
            if (actionBtn && actionBtn.text && actionBtn.onClick) {
                var btnEl = document.createElement('button');
                btnEl.type = 'button';
                btnEl.textContent = actionBtn.text;
                btnEl.style.cssText = 'margin-left: 12px; padding: 4px 12px; border-radius: 6px; ' +
                    'border: 1px solid rgba(255,255,255,0.7); background: rgba(255,255,255,0.2); ' +
                    'color: #FFF; font-weight: 700; font-size: 13px; cursor: pointer; ' +
                    'transition: background 0.2s; white-space: nowrap;';
                btnEl.onmouseenter = function() { btnEl.style.background = 'rgba(255,255,255,0.35)'; };
                btnEl.onmouseleave = function() { btnEl.style.background = 'rgba(255,255,255,0.2)'; };
                btnEl.onclick = function(e) {
                    e.stopPropagation();
                    actionBtn.onClick();
                    toast.remove();
                };
                toast.appendChild(btnEl);
            }

            // Thanh đếm ngược progress bar
            var timeoutMs = (actionBtn && actionBtn.timeout) ? actionBtn.timeout : 3000;
            var progressBar = document.createElement('div');
            progressBar.style.cssText = 'position: absolute; bottom: 0; left: 0; height: 3px; ' +
                'background: rgba(255,255,255,0.7); border-radius: 0 0 12px 12px; width: 100%; ' +
                'transition: width ' + (timeoutMs / 1000) + 's linear;';
            toast.appendChild(progressBar);
            setTimeout(function() { progressBar.style.width = '0%'; }, 20);
            
            container.appendChild(toast);
            
            setTimeout(function() {
                toast.style.animation = 'slideOut 0.3s ease forwards';
                setTimeout(function() {
                    toast.remove();
                }, 300);
            }, timeoutMs);
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
                            op.data.trangThai,
                            op.data.nhanXet || ""
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
                            op.data.trangThai,
                            op.data.nhanXet || ""
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
                    showToast("Lỗi kết nối máy chủ hệ thống", "error");
                    refreshTutorStudentHistory();
                })
                .capNhatNhieuDongHocPhi(payIndices, unpayIndices);
        }

        function refreshTutorStudentHistorySilent() {
            if (!currentTutorStudent) return;
            google.script.run.withSuccessHandler(function(res) {
                currentTutorStudent.logs = res.logs || [];
                if (res && res.tuition) currentTutorStudent.tuition = res.tuition;
                if (res && res.billing_type) currentTutorStudent.billing_type = res.billing_type;
                if (tutorDataGlobal && tutorDataGlobal.students) {
                    var fs = tutorDataGlobal.students.find(function(s) {
                        return s.phone === currentTutorStudent.phone || s.name === currentTutorStudent.name;
                    });
                    if (fs) {
                        fs.logs = currentTutorStudent.logs;
                        if (currentTutorStudent.tuition) fs.tuition = currentTutorStudent.tuition;
                        if (currentTutorStudent.billing_type) fs.billing_type = currentTutorStudent.billing_type;
                    }
                }
                if (typeof sessionStorage !== 'undefined' && tutorDataGlobal) {
                    try { sessionStorage.setItem('dashboardData', JSON.stringify(tutorDataGlobal)); } catch(e) {}
                }
                renderInvoice();
                renderTutorChart(res.logs || []);
                renderTutorStudentHistory(res.logs || []);
                if (typeof initTutorDiaryFilters === 'function') initTutorDiaryFilters();
                var diarySec = document.getElementById('tutorSectionDiary');
                if (diarySec && diarySec.style.display !== 'none' && typeof renderTutorDiarySection === 'function') {
                    renderTutorDiarySection(false);
                }
            }).getStudentDetailsForTutor(currentTutorStudent.phone, currentTutorStudent.name);
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
            
            var list = (logs && Array.isArray(logs)) ? logs : [];
            var totalBuoi = list.length;
            
            // Helper màu sắc điểm số
            function scoreColor(val) {
                var n = parseFloat(val);
                if (isNaN(n)) return 'var(--text-secondary, #94A3B8)';
                if (n >= 9) return '#059669';
                if (n >= 7) return '#2563EB';
                if (n >= 5) return '#D97706';
                return '#DC2626';
            }

            // Đếm số buổi có mặt và nghỉ học
            var totalPresent = 0;
            var totalAbsent = 0;
            list.forEach(function(l) {
                if (!l) return;
                var rawStatus = l.trangThai || l.chuyenCan || l.attendance_status || l.attendance || l.status || "";
                var normTt = String(rawStatus).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();
                var isDaBu = (normTt.includes("da bu") || normTt.includes("hoc bu"));
                var isAbsent = !isDaBu && (
                    normTt.includes("nghi") || 
                    normTt.includes("huy") || 
                    normTt.includes("vang") || 
                    normTt.includes("off") || 
                    normTt.includes("khong hoc") ||
                    normTt.includes("chua hoc") ||
                    normTt.includes("tam hoan") ||
                    normTt === "v" || 
                    normTt === "n" || 
                    normTt === "x"
                );
                if (isAbsent) totalAbsent++;
                else totalPresent++;
            });

            // Cập nhật tiêu đề Lịch sử học tập & Nhận xét chi tiết (gọn gàng, không kèm số buổi tổng dồn)
            var historyTitleEl = document.getElementById('tutorStudentHistoryTitle');
            if (!historyTitleEl) historyTitleEl = document.querySelector('.schedule-section h3 span');
            if (historyTitleEl) {
                historyTitleEl.innerHTML = '<i class="fa-solid fa-clock-rotate-left"></i> Lịch sử học tập & Nhận xét chi tiết';
            }

            if (totalBuoi > 0) {
                var getStatusBadge = function(trangThai) {
                    var raw = (trangThai || "").trim();
                    var tt = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
                    if (tt.includes("da bu") || tt.includes("hoc bu")) return '<span class="status-badge badge-hocbu">Học bù</span>';
                    if (tt.includes("nghi") || tt.includes("huy") || tt.includes("vang") || tt.includes("off") || tt.includes("khong hoc") || tt === "v" || tt === "n" || tt === "x") {
                        return '<span class="status-badge badge-nghi">Hủy/Nghỉ</span>';
                    }
                    return '<span class="status-badge badge-dahoc">Có mặt</span>';
                };

                var getBtvnBadge = function(btvn) {
                    var raw = (btvn || "").trim();
                    var bt = raw.toLowerCase();
                    if (!raw || raw === "-" || raw === "không có") return '<span class="status-badge" style="background: var(--bg-input, #F8FAFC); border: 1px solid var(--border-card, #E2E8F0); color: var(--text-secondary, #94A3B8);">-</span>';
                    
                    var pctMatch = bt.match(/(\d+(\.\d+)?)\s*%/);
                    if (pctMatch) {
                        var pct = parseFloat(pctMatch[1]);
                        if (pct >= 90) {
                            return '<span class="status-badge badge-hoanthanh">' + escapeHtml(raw) + '</span>';
                        } else if (pct >= 50) {
                            return '<span class="status-badge badge-thieu">' + escapeHtml(raw) + '</span>';
                        } else {
                            return '<span class="status-badge badge-nghi">' + escapeHtml(raw) + '</span>';
                        }
                    }

                    if (bt.indexOf("không làm") !== -1 || bt.indexOf("chưa làm") !== -1 || bt.indexOf("chưa nộp") !== -1 || bt.indexOf("chưa đạt") !== -1 || bt === "không") {
                        return '<span class="status-badge badge-nghi">' + escapeHtml(raw) + '</span>';
                    }
                    if (bt.indexOf("hoàn thành") !== -1 || bt === "đạt" || bt === "tốt" || bt === "xuất sắc" || bt === "có") {
                        return '<span class="status-badge badge-hoanthanh">' + escapeHtml(raw) + '</span>';
                    }
                    if (bt.indexOf("thiếu") !== -1) {
                        return '<span class="status-badge badge-thieu">' + escapeHtml(raw) + '</span>';
                    }
                    if (bt.indexOf("phụ huynh") !== -1 || bt.indexOf("nhắc") !== -1) {
                        return '<span class="status-badge badge-hocbu" style="font-size:11px; padding:3px 10px; max-width: 220px; white-space: normal; line-height: 1.3; display: inline-block;">' + escapeHtml(raw) + '</span>';
                    }
                    return '<span class="status-badge badge-hoanthanh">' + escapeHtml(raw) + '</span>';
                };

                var htmlLichSu = "";
                
                // 1. Desktop View (Table)
                htmlLichSu += "<div class='table-wrapper desktop-table-view'>";
                htmlLichSu += "<table class='history-table tutor-history-table'><thead><tr>" +
                    "<th style='width: 42px; text-align: center;'>Tuần</th>" +
                    "<th style='width: 65px; text-align: center;'>Ngày dạy</th>" +
                    "<th style='width: 70px; text-align: center;'>Môn</th>" +
                    "<th>Nội dung</th>" +
                    "<th>Nhận xét của gia sư</th>" +
                    "<th style='width: 105px; text-align: center;'>Đánh giá BTVN</th>" +
                    "<th style='width: 70px; text-align: center;'>KT Đầu giờ</th>" +
                    "<th style='width: 70px; text-align: center;'>KT Định kì</th>" +
                    "<th style='width: 80px; text-align: center;'>Trạng thái</th>" +
                    "<th style='width: 75px; text-align: center;'>Thao tác</th>" +
                    "</tr></thead><tbody>";
                
                // 2. Mobile View (Accordion list)
                var htmlMobile = "<div class='mobile-cards-view'>";

                list.slice().reverse().forEach(function(item, idx) {
                    var isAbsent = isAbsentLog(item);
                    var btvnValue = isAbsent ? "-" : (item.btvn || item.danhGiaBTVN || "");

                    var rawDateOnly = formatDateOnly(item.ngay);

                    // Giữ nguyên 100% Nội dung dạy học, không tự ý cắt lời nhận xét
                    var parsedContent = item.noiDung || item.topic || "";
                    var parsedNhanXet = (item.nhanXet || item.nhan_xet || item["nhận xét"] || item.tutor_comment || item.comment || "").trim();
                    if (!parsedNhanXet && parsedContent.indexOf("---NHAN_XET---") !== -1) {
                        var cParts = parsedContent.split("---NHAN_XET---");
                        parsedContent = cParts[0].trim();
                        parsedNhanXet = cParts.slice(1).join("---NHAN_XET---").trim();
                    } else if (!parsedNhanXet && /(?:[\.\n\r]|\s+)?\s*nhận\s*xét\s*:\s*/i.test(parsedContent)) {
                        var matchNx = parsedContent.match(/^(.*?)(?:\.|\n|\r|\s+)?\s*nhận\s*xét\s*:\s*(.*)$/i);
                        if (matchNx) {
                            parsedContent = matchNx[1].trim();
                            parsedNhanXet = matchNx[2].trim();
                        }
                    }

                    // Điểm số
                    var diemDau = item.diemDauGio !== undefined && item.diemDauGio !== null ? item.diemDauGio : item.diemDG;
                    var diemDinh = item.diemDinhKi !== undefined && item.diemDinhKi !== null ? item.diemDinhKi : item.diemDK;

                    var ktDauGioText = (diemDau !== undefined && diemDau !== null && String(diemDau).trim() !== "" && String(diemDau).trim() !== "-" && String(diemDau).trim().toLowerCase() !== "không có")
                        ? diemDau
                        : "—";
                    var rawDinhStr = (diemDinh !== undefined && diemDinh !== null) ? String(diemDinh).trim() : "";
                    var lowerDinh = rawDinhStr.toLowerCase();
                    var hasDiemDinh = (rawDinhStr !== "" && rawDinhStr !== "-" && rawDinhStr !== "—" && lowerDinh !== "không có" && lowerDinh !== "khong co" && lowerDinh !== "null");
                    var ktDinhKiText = hasDiemDinh ? rawDinhStr : "-";

                    var ktDauGioColor = (ktDauGioText === "—" || ktDauGioText === "-") ? 'var(--text-muted, #94A3B8)' : scoreColor(diemDau);
                    var ktDinhKiColor = hasDiemDinh ? scoreColor(rawDinhStr) : 'var(--text-muted, #94A3B8)';

                    var commentHtml = parsedNhanXet 
                        ? "<span style='color: var(--text-primary); font-style: italic;'><i class='fa-solid fa-comment-dots' style='color: var(--color-primary, #3B82F6); font-size: 11px; margin-right: 4px;'></i>" + escapeHtml(parsedNhanXet) + "</span>" 
                        : "<span style='color: var(--text-muted); font-style: italic;'>—</span>";

                    var isHidden = (idx >= 5);
                    var styleStr = isHidden ? 'style="display: none;" class="tutor-history-row tutor-hidden-row"' : 'class="tutor-history-row"';

                    // Desktop Row
                    htmlLichSu += "<tr " + styleStr + ">";
                    htmlLichSu += "<td style='text-align: center; font-weight: 700; color: var(--text-primary);'>" + escapeHtml(item.tuan || "") + "</td>";
                    htmlLichSu += "<td style='white-space: nowrap; text-align: center; color: var(--text-primary); font-weight: 500;'>" + escapeHtml(rawDateOnly) + "</td>";
                    htmlLichSu += "<td style='text-align: center;'>" + (item.mon ? ('<span class="subj-chip">' + escapeHtml(item.mon) + '</span>') : '') + "</td>";
                    htmlLichSu += "<td class='cell-noidung'>" + escapeHtml(parsedContent || "—") + "</td>";
                    htmlLichSu += "<td class='cell-nhanxet'>" + commentHtml + "</td>";
                    htmlLichSu += "<td style='text-align: center;'>" + getBtvnBadge(btvnValue) + "</td>";
                    htmlLichSu += "<td style='text-align: center; font-weight: 700; font-size: 14px; color:" + escapeHtml(ktDauGioColor) + ";'>" + escapeHtml(ktDauGioText) + "</td>";
                    htmlLichSu += "<td style='text-align: center; font-weight: 700; font-size: 14px; color:" + escapeHtml(ktDinhKiColor) + ";'>" + escapeHtml(ktDinhKiText) + "</td>";
                    htmlLichSu += "<td style='text-align: center;'>" + getStatusBadge(item.trangThai || item.chuyenCan) + "</td>";
                    htmlLichSu += "<td style='text-align: center; white-space: nowrap;'>" +
                                  "  <button onclick='openEditLessonModal(\"" + jsStr(item.rowIndex) + "\")' class='btn-icon-edit' title='Sửa buổi học' style='margin: 0; padding: 4px;'><i class='fa-solid fa-pen-to-square'></i></button>" +
                                  "  <button onclick='duplicateLesson(\"" + jsStr(item.rowIndex) + "\")' class='btn-icon-edit' title='Nhân bản buổi học' style='margin: 0 0 0 6px; padding: 4px; color: #10B981;'><i class='fa-solid fa-copy'></i></button>" +
                                  "</td>";
                    htmlLichSu += "</tr>";

                    // Mobile Row (Accordion Card)
                    var mobileStyleStr = isHidden ? 'style="display: none;" class="accordion-item tutor-history-row tutor-hidden-row"' : 'class="accordion-item tutor-history-row"';
                    htmlMobile += "<div " + mobileStyleStr + ">";
                    htmlMobile += "  <div class='accordion-header' onclick='toggleTutorAccordion(" + idx + ")'>";
                    htmlMobile += "    <div style='display: flex; align-items: center;'>";
                    htmlMobile += "      <div class='accordion-header-title'>";
                    htmlMobile += "        <span style='font-size: 15px; font-weight: 700; color: var(--text-primary);'>" + escapeHtml(item.tuan || "") + "</span>";
                    htmlMobile += "        <span class='accordion-header-date'>" + escapeHtml(rawDateOnly) + "</span>";
                    htmlMobile += "      </div>";
                    htmlMobile += "    </div>";
                    htmlMobile += "    <div class='accordion-header-status'>";
                    htmlMobile += "      " + getStatusBadge(item.trangThai || item.chuyenCan);
                    htmlMobile += "      <i class='fa-solid fa-chevron-down' id='tutor-chevron-" + idx + "'></i>";
                    htmlMobile += "    </div>";
                    htmlMobile += "  </div>";
                    htmlMobile += "  <div class='accordion-body' id='tutor-accordion-body-" + idx + "' style='display: none;'>";
                    htmlMobile += "    <div class='accordion-body-row'><span class='accordion-body-label'>Môn học</span><span class='accordion-body-val'>" + (item.mon ? ('<span class="subj-chip">' + escapeHtml(item.mon) + '</span>') : '—') + "</span></div>";
                    htmlMobile += "    <div class='accordion-body-row'><span class='accordion-body-label'>Nội dung dạy học</span><span class='accordion-body-val' style='font-weight: 500;'>" + escapeHtml(parsedContent || "—") + "</span></div>";
                    htmlMobile += "    <div class='accordion-body-row'><span class='accordion-body-label'>Nhận xét của gia sư</span><span class='accordion-body-val' style='font-style: italic; color: #2563EB; font-weight: 500;'>" + (parsedNhanXet ? ("<i class='fa-solid fa-comment-dots' style='margin-right: 4px;'></i>" + escapeHtml(parsedNhanXet)) : '—') + "</span></div>";
                    htmlMobile += "    <div class='accordion-body-row'><span class='accordion-body-label'>Đánh giá bài tập về nhà</span><span class='accordion-body-val'>" + getBtvnBadge(btvnValue) + "</span></div>";
                    htmlMobile += "    <div class='accordion-body-row'><span class='accordion-body-label'>Kiểm tra đầu giờ</span><span class='accordion-body-val' style='font-weight: 700; color:" + escapeHtml(ktDauGioColor) + ";'>" + escapeHtml(ktDauGioText) + "</span></div>";
                    htmlMobile += "    <div class='accordion-body-row'><span class='accordion-body-label'>Kiểm tra định kì</span><span class='accordion-body-val' style='font-weight: 700; color:" + escapeHtml(ktDinhKiColor) + ";'>" + escapeHtml(ktDinhKiText) + "</span></div>";
                    htmlMobile += "    <div class='accordion-actions' style='display: flex; gap: 10px; margin-top: 10px;'>";
                    htmlMobile += "      <button onclick='duplicateLesson(\"" + jsStr(item.rowIndex) + "\")' class='modal-btn modal-btn-primary' style='flex: 1; border-radius: 20px; font-size: 12px;'><i class='fa-solid fa-copy'></i> Nhân bản</button>";
                    htmlMobile += "      <button onclick='openEditLessonModal(\"" + jsStr(item.rowIndex) + "\")' class='modal-btn modal-btn-secondary' style='flex: 1; border-radius: 20px; font-size: 12px;'><i class='fa-solid fa-pen-to-square'></i> Sửa</button>";
                    htmlMobile += "    </div>";
                    htmlMobile += "  </div>";
                    htmlMobile += "</div>";
                });

                htmlLichSu += "</tbody></table></div>";
                htmlMobile += "</div>";

                var totalHtml = htmlLichSu + htmlMobile;
                
                if (totalBuoi > 5) {
                    totalHtml += "<div class='show-more-btn-container' id='tutorShowMoreBox' style='margin-top: 15px; text-align: center;'>";
                    totalHtml += "  <button class='btn-show-more' onclick='toggleTutorShowMore()' id='btnTutorShowMore'>Xem thêm</button>";
                    totalHtml += "</div>";
                }
                
                container.innerHTML = totalHtml;
            } else {
                container.innerHTML = '<div class="empty-state">' +
                    '<div class="empty-state-icon"><i class="fa-solid fa-book-open"></i></div>' +
                    '<div class="empty-state-title">Chưa có nhật ký buổi học</div>' +
                    '<div class="empty-state-desc">Nhật ký sẽ xuất hiện sau khi bạn ghi nhận buổi dạy đầu tiên cho học sinh này.</div>' +
                    '<button type="button" class="empty-state-btn" onclick="openAddLessonModal()"><i class="fa-solid fa-calendar-plus"></i> Thêm buổi học đầu tiên</button>' +
                    '</div>';
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
            
            google.script.run
                .withSuccessHandler(function(res) {
                    if (icon) icon.classList.remove('fa-spin');
                    currentTutorStudent.logs = res.logs || [];
                    if (res && res.tuition) currentTutorStudent.tuition = res.tuition;
                    if (res && res.billing_type) currentTutorStudent.billing_type = res.billing_type;
                    if (tutorDataGlobal && tutorDataGlobal.students) {
                        var fs = tutorDataGlobal.students.find(function(s) {
                            return s.phone === currentTutorStudent.phone || s.name === currentTutorStudent.name;
                        });
                        if (fs) {
                            fs.logs = currentTutorStudent.logs;
                            if (currentTutorStudent.tuition) fs.tuition = currentTutorStudent.tuition;
                            if (currentTutorStudent.billing_type) fs.billing_type = currentTutorStudent.billing_type;
                        }
                    }
                    if (typeof sessionStorage !== 'undefined' && tutorDataGlobal) {
                        try { sessionStorage.setItem('dashboardData', JSON.stringify(tutorDataGlobal)); } catch(e) {}
                    }
                    renderInvoice();
                    renderTutorChart(res.logs || []);
                    renderTutorStudentHistory(res.logs || []);
                    if (typeof initTutorDiaryFilters === 'function') initTutorDiaryFilters();
                    var diarySec = document.getElementById('tutorSectionDiary');
                    if (diarySec && diarySec.style.display !== 'none' && typeof renderTutorDiarySection === 'function') {
                        renderTutorDiarySection(false);
                    }
                    showToast("Đã cập nhật dữ liệu mới nhất!", "success");
                })
                .withFailureHandler(function(err) {
                    if (icon) icon.classList.remove('fa-spin');
                    showToast("Lỗi cập nhật: " + err.toString(), "error");
                })
                .getStudentDetailsForTutor(currentTutorStudent.phone, currentTutorStudent.name);
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
            var mappedMon = mapSubjectToSelectValue(log.mon);
            document.getElementById('editLesMon').value = mappedMon;
            var editMonWrap = document.getElementById('editLesMonCustomWrap');
            var editMonInp = document.getElementById('editLesMonCustom');
            if (mappedMon === "Khác") {
                if (editMonWrap) editMonWrap.style.display = "block";
                if (editMonInp) editMonInp.value = log.mon || "";
            } else {
                if (editMonWrap) editMonWrap.style.display = "none";
                if (editMonInp) editMonInp.value = "";
            }
            
            var tt = log.trangThai || "Đã học";
            if (tt.trim().toLowerCase() === "hủy/nghỉ") {
                tt = "Hủy/ nghỉ";
            }
            document.getElementById('editLesTrangThai').value = tt;
            var curBtvn = (log.btvn || "Hoàn thành").trim();
            var editSel = document.getElementById('editLesBtvn');
            var editWrap = document.getElementById('editLesBtvnCustomWrap');
            var editInp = document.getElementById('editLesBtvnCustom');
            
            if (curBtvn === "Hoàn thành" || curBtvn === "Không làm" || curBtvn === "Hoàn thành 90%" || curBtvn === "Hoàn thành 75%" || curBtvn === "Phụ huynh nhớ nhắc nhở bé làm bài tập gia sư mới giao") {
                editSel.value = curBtvn;
                if (editWrap) editWrap.style.display = "none";
                if (editInp) editInp.value = "";
            } else {
                editSel.value = "Khác";
                if (editWrap) editWrap.style.display = "block";
                var mPct = curBtvn.match(/(\d+(\.\d+)?)%/);
                if (mPct) {
                    if (editInp) editInp.value = mPct[1];
                } else if (curBtvn.toLowerCase().indexOf("thiếu 1 bài") !== -1) {
                    if (editInp) editInp.value = "80";
                } else if (curBtvn.toLowerCase().indexOf("thiếu 2 bài") !== -1) {
                    if (editInp) editInp.value = "60";
                } else if (curBtvn.toLowerCase().indexOf("thiếu 3 bài") !== -1) {
                    if (editInp) editInp.value = "40";
                } else {
                    if (editInp) editInp.value = "";
                }
            }
            document.getElementById('editLesDiemDau').value = log.diemDauGio || "Không có";
            document.getElementById('editLesDiemDinhKi').value = log.diemDinhKi || "Không có";
            var cContent = log.noiDung || "";
            var cNhanXet = (log.nhanXet || log.nhan_xet || log["nhận xét"] || log.tutor_comment || "").trim();
            if (!cNhanXet && cContent.indexOf("---NHAN_XET---") !== -1) {
                var cParts = cContent.split("---NHAN_XET---");
                cContent = cParts[0].trim();
                cNhanXet = cParts.slice(1).join("---NHAN_XET---").trim();
            } else if (!cNhanXet && /(?:[\.\n\r]|\s+)?\s*nhận\s*xét\s*:\s*/i.test(cContent)) {
                var matchNx = cContent.match(/^(.*?)(?:\.|\n|\r|\s+)?\s*nhận\s*xét\s*:\s*(.*)$/i);
                if (matchNx) {
                    cContent = matchNx[1].trim();
                    cNhanXet = matchNx[2].trim();
                }
            }
            document.getElementById('editLesNoiDung').value = cContent;
            if (document.getElementById('editLesNhanXet')) {
                document.getElementById('editLesNhanXet').value = cNhanXet;
            }
            
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
            if (mon === "Khác") {
                var customMonInp = document.getElementById('editLesMonCustom');
                var customMonVal = customMonInp ? customMonInp.value.trim() : "";
                if (!customMonVal) {
                    showToast("Vui lòng nhập tên môn học!", "error");
                    if (customMonInp) customMonInp.focus();
                    return;
                }
                mon = customMonVal;
            }
            var trangThai = document.getElementById('editLesTrangThai').value;
            var btvn = document.getElementById('editLesBtvn').value;
            if (btvn === "Khác") {
                var customInp = document.getElementById('editLesBtvnCustom');
                var customVal = customInp ? customInp.value.trim() : "";
                if (!customVal) {
                    showToast("Vui lòng nhập phần trăm hoàn thành BTVN!", "error");
                    if (customInp) customInp.focus();
                    return;
                }
                var pct = parseInt(customVal, 10);
                if (isNaN(pct) || pct < 0 || pct > 100) {
                    showToast("Phần trăm hoàn thành BTVN phải từ 0% đến 100%!", "error");
                    if (customInp) customInp.focus();
                    return;
                }
                btvn = (pct === 0) ? "Không làm" : ((pct === 100) ? "Hoàn thành" : "Hoàn thành " + pct + "%");
            }
            var diemDau = document.getElementById('editLesDiemDau').value.trim();
            var diemDinhKi = document.getElementById('editLesDiemDinhKi').value.trim();
            var noiDung = document.getElementById('editLesNoiDung').value.trim();
            var nhanXet = document.getElementById('editLesNhanXet') ? document.getElementById('editLesNhanXet').value.trim() : "";
            
            if(!tuan || !ngayVal || !noiDung) {
                showToast("Vui lòng điền đầy đủ Tuần, Ngày học và Nội dung bài học!", "error");
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
                        log.nhanXet = nhanXet;
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
                        nhanXet: nhanXet,
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

            // Kiểm tra xem có phải học sinh chính thức không
            var isOfficial = false;
            if (tutorDataGlobal && Array.isArray(tutorDataGlobal.students)) {
                isOfficial = tutorDataGlobal.students.some(function(st) {
                    return (st.name || '').trim().toLowerCase() === studentName.trim().toLowerCase();
                });
            }
            var delBtn = document.getElementById('btnDeleteSchedule');
            if (delBtn) {
                // Hiển thị nút xóa nếu là học sinh tự do / học thử
                delBtn.style.display = isOfficial ? "none" : "inline-flex";
                delBtn.setAttribute('data-student', studentName);
            }
            
            document.getElementById('editScheduleModal').style.display = "flex";
        }

        function closeEditScheduleModal() {
            document.getElementById('editScheduleModal').style.display = "none";
        }

        function deleteScheduleEntry() {
            var delBtn = document.getElementById('btnDeleteSchedule');
            var sName = delBtn ? delBtn.getAttribute('data-student') : document.getElementById('schStudentName').value;
            if (!sName) return;

            showCustomConfirm("Bạn có chắc chắn muốn xóa học sinh học thử/tự do <b>" + sName + "</b> khỏi thời khóa biểu không?", function() {
                var tPhone = (tutorDataGlobal && tutorDataGlobal.tutorPhone) ? tutorDataGlobal.tutorPhone : (sessionStorage.getItem('userPhone') || "");
                if (typeof google !== 'undefined' && google.script && google.script.run && tPhone) {
                    google.script.run
                        .withSuccessHandler(function() {})
                        .capNhatThoiKhoaBieu(tPhone, sName, '', '', '', '', '', '', '');
                }

                if (lastLoadedTutorSchedule && Array.isArray(lastLoadedTutorSchedule)) {
                    lastLoadedTutorSchedule = lastLoadedTutorSchedule.filter(function(s) {
                        return (s.studentName || '').trim().toLowerCase() !== sName.trim().toLowerCase();
                    });
                }

                try {
                    var calFrame = document.getElementById('tutorCalendarIframe');
                    if (calFrame && calFrame.contentWindow && Array.isArray(calFrame.contentWindow.tutorScheduleSheetData)) {
                        var cData = calFrame.contentWindow.tutorScheduleSheetData;
                        var idx = cData.findIndex(function(r) {
                            return (r.studentName || '').trim().toLowerCase() === sName.trim().toLowerCase();
                        });
                        if (idx !== -1) {
                            cData.splice(idx, 1);
                            if (typeof calFrame.contentWindow.loadStudentOptions === 'function') {
                                calFrame.contentWindow.loadStudentOptions();
                            }
                            if (calFrame.contentWindow.calendar && typeof calFrame.contentWindow.calendar.refetchEvents === 'function') {
                                calFrame.contentWindow.calendar.refetchEvents();
                            }
                        }
                    }
                } catch(e) {}

                closeEditScheduleModal();
                refreshTutorScheduleDisplay(lastLoadedTutorSchedule);
                showToast("Đã xóa học sinh " + sName + " khỏi thời khóa biểu!", "success");
            });
        }
        window.deleteScheduleEntry = deleteScheduleEntry;

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

            var tPhone = (tutorDataGlobal && tutorDataGlobal.tutorPhone) ? tutorDataGlobal.tutorPhone : (sessionStorage.getItem('userPhone') || "");

            google.script.run
                .withSuccessHandler(function(res) {
                    btn.disabled = false;
                    btn.innerText = "Cập nhật";
                    if(res && res.error) {
                        showToast("Lỗi: " + res.error, "error");
                    } else {
                        showToast("Cập nhật thời khóa biểu thành công!", "success");
                        closeEditScheduleModal();

                        // Cập nhật lastLoadedTutorSchedule
                        var allEmpty = (!mon && !tue && !wed && !thu && !fri && !sat && !sun);
                        var isOfficial = tutorDataGlobal && Array.isArray(tutorDataGlobal.students) && tutorDataGlobal.students.some(function(st) {
                            return (st.name || '').trim().toLowerCase() === studentName.trim().toLowerCase();
                        });

                        if (lastLoadedTutorSchedule && Array.isArray(lastLoadedTutorSchedule)) {
                            if (allEmpty && !isOfficial) {
                                lastLoadedTutorSchedule = lastLoadedTutorSchedule.filter(function(s) {
                                    return (s.studentName || '').trim().toLowerCase() !== studentName.trim().toLowerCase();
                                });
                            } else {
                                var found = lastLoadedTutorSchedule.find(function(s) {
                                    return (s.studentName || '').trim().toLowerCase() === studentName.trim().toLowerCase();
                                });
                                if (found) {
                                    found.mon = mon; found.tue = tue; found.wed = wed;
                                    found.thu = thu; found.fri = fri; found.sat = sat; found.sun = sun;
                                } else {
                                    lastLoadedTutorSchedule.push({
                                        studentName: studentName,
                                        mon: mon, tue: tue, wed: wed, thu: thu, fri: fri, sat: sat, sun: sun
                                    });
                                }
                            }
                        }

                        refreshTutorScheduleDisplay(lastLoadedTutorSchedule);
                    }
                })
                .withFailureHandler(function(err) {
                    btn.disabled = false;
                    btn.innerText = "Cập nhật";
                    showToast("Lỗi kết nối hoặc hệ thống: " + err.toString(), "error");
                })
                .capNhatThoiKhoaBieu(tPhone, studentName, mon, tue, wed, thu, fri, sat, sun);
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
                info.innerHTML = "<div style='color: #FFF; font-weight: bold; font-size: 14px;'>" + escapeHtml(st.name) + "</div>" +
                                 "<div style='color: #A6ADCE; font-size: 12px; margin-top: 3px;'>SĐT: " + escapeHtml(st.phone) + "</div>" +
                                 "<div style='color: #EF4444; font-size: 11px; margin-top: 3px;'>Đã xóa lúc: " + escapeHtml(st.deletedDate) + "</div>";

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
            var stPhone = currentTutorStudent.phone;
            var stName = currentTutorStudent.name;

            showCustomConfirm("Xác nhận đưa học sinh " + stName + " vào thùng rác? Học sinh sẽ ẩn khỏi danh sách và tự động dọn dẹp sau 10 ngày.", function() {
                google.script.run
                    .withSuccessHandler(function(res) {
                        if (res.error) {
                            showToast("Lỗi: " + res.error, "error");
                        } else {
                            refreshTutorDashboard();
                            showToast("Đã đưa học sinh " + stName + " vào thùng rác!", "warning", {
                                text: "↩ Hoàn tác",
                                timeout: 6000,
                                onClick: function() {
                                    restoreStudent(stPhone);
                                }
                            });
                        }
                    })
                    .withFailureHandler(function(err) {
                        showToast("Lỗi kết nối hoặc hệ thống: " + err.toString(), "error");
                    })
                    .xoaHocSinhTamThoi(tutorDataGlobal.tutorPhone, stPhone);
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
            if (!tutorDataGlobal || !tutorDataGlobal.tutorPhone) return;
            google.script.run
                .withSuccessHandler(function(loginRes) {
                    if(loginRes && loginRes.role === 'tutor' && loginRes.data) {
                        // Giữ lại nhật ký (logs) và học phí đã nạp từ trước để không bị reset về 0
                        if (tutorDataGlobal && tutorDataGlobal.students && loginRes.data.students) {
                            var oldMap = {};
                            tutorDataGlobal.students.forEach(function(s) {
                                if (s.phone) oldMap[s.phone] = s;
                                if (s.name) oldMap[s.name] = s;
                            });
                            loginRes.data.students.forEach(function(ns) {
                                var os = oldMap[ns.phone] || oldMap[ns.name];
                                if (os) {
                                    if (os.logs && Array.isArray(os.logs) && os.logs.length > 0) {
                                        ns.logs = os.logs;
                                    }
                                    if (os.tuition && !ns.tuition) ns.tuition = os.tuition;
                                    if (os.billing_type && !ns.billing_type) ns.billing_type = os.billing_type;
                                }
                            });
                        }
                        tutorDataGlobal = loginRes.data;
                        if (typeof sessionStorage !== 'undefined') {
                            try {
                                sessionStorage.setItem('dashboardData', JSON.stringify(tutorDataGlobal));
                            } catch (e) {}
                        }
                        renderTutorView(loginRes.data);
                    } else if (loginRes && loginRes.error) {
                        console.warn("Background refresh warning: " + loginRes.error);
                    } else {
                        location.reload();
                    }
                })
                .withFailureHandler(function(err) {
                    console.warn("Background refresh failed:", err);
                })
                .loginSystem(tutorDataGlobal.tutorPhone, tutorDataGlobal.tutorPin);
        }

        // --- Lesson log delete logic ---
        function confirmDeleteLesson() {
            var rowIndex = document.getElementById('editLesRowIndex').value;
            if (!rowIndex) return;

            showCustomConfirm("Bạn có chắc chắn muốn xóa buổi học này?", function() {
                var deletedLog = null;
                // 1. Cập nhật cục bộ: lưu log tạm thời và lọc bỏ dòng bị xóa
                if (currentTutorStudent && currentTutorStudent.logs) {
                    deletedLog = currentTutorStudent.logs.find(function(l) {
                        return l.rowIndex === rowIndex || 
                            (typeof l.rowIndex === 'number' && String(l.rowIndex) === String(rowIndex)) || 
                            l.tempId === rowIndex;
                    });
                    currentTutorStudent.logs = currentTutorStudent.logs.filter(function(l) {
                        return l.rowIndex !== rowIndex && 
                            !(typeof l.rowIndex === 'number' && String(l.rowIndex) === String(rowIndex)) && 
                            l.tempId !== rowIndex;
                    });
                }
                
                // 2. Render lại UI ngay lập tức
                renderInvoice();
                if (currentTutorStudent && currentTutorStudent.logs) {
                    renderTutorChart(currentTutorStudent.logs);
                    renderTutorStudentHistory(currentTutorStudent.logs);
                }
                
                // 3. Đóng modal
                closeEditLessonModal();

                var hasUndone = false;
                var deleteTimer = setTimeout(function() {
                    if (!hasUndone) {
                        // 4. Đẩy vào hàng đợi sync ngầm sau khi hết thời gian hoàn tác
                        queueLessonOperation({
                            type: 'delete',
                            rowIndex: rowIndex
                        });
                    }
                }, 5000);

                showToast("Đã xóa buổi học!", "warning", {
                    text: "↩ Hoàn tác",
                    timeout: 5000,
                    onClick: function() {
                        hasUndone = true;
                        clearTimeout(deleteTimer);
                        if (deletedLog && currentTutorStudent && currentTutorStudent.logs) {
                            currentTutorStudent.logs.push(deletedLog);
                            renderInvoice();
                            renderTutorChart(currentTutorStudent.logs);
                            renderTutorStudentHistory(currentTutorStudent.logs);
                        }
                        showToast("Đã khôi phục buổi học!", "success");
                    }
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
    
    // Khôi phục title đã nhập từ sessionStorage nếu có (sau khi trang reload trên iOS PWA)
    var savedTitle = sessionStorage.getItem('hw_draft_title') || "";
    document.getElementById('assignHwTitle').value = savedTitle;
    var now = new Date();
    document.getElementById('assignHwReleaseDate').value = formatDateDDMMYYYY(now);
    if (document.getElementById('assignHwDueDate')) {
        document.getElementById('assignHwDueDate').value = "";
    }
    if (document.getElementById('assignHwLink')) {
        document.getElementById('assignHwLink').value = "";
    }
    // Chỉ reset file nếu chưa có file nào được chọn (tránh xóa file vừa chọn)
    if (!currentTutorHwFile) {
        clearTutorSelectedFile();
    }
    
    document.getElementById('btnSubmitAssignedHw').innerHTML = "Giao bài";
    document.getElementById('assignHwFormContainer').style.display = 'block';
    
    // Lưu title vào sessionStorage khi user gõ (bảo vệ khỏi reload bất ngờ)
    var titleEl = document.getElementById('assignHwTitle');
    if (titleEl && !titleEl._hwSaveAttached) {
        titleEl._hwSaveAttached = true;
        titleEl.addEventListener('input', function() {
            sessionStorage.setItem('hw_draft_title', titleEl.value);
        });
    }
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
    if (!files || files.length === 0) return;
    
    var file = files[0];
    // Giới hạn dung lượng 30MB
    if (file.size > 30 * 1024 * 1024) {
        showToast("Dung lượng file tối đa là 30MB!", "error");
        return;
    }
    
    currentTutorHwFile = file;
    var fileNameEl = document.getElementById('tutorSelectedFileName');
    if (fileNameEl) fileNameEl.innerText = file.name + " (" + formatBytes(file.size) + ")";
    var fileBoxEl = document.getElementById('tutorSelectedFileBox');
    if (fileBoxEl) fileBoxEl.style.display = 'flex';
    var uploadTextEl = document.getElementById('tutorHwUploadText');
    if (uploadTextEl) uploadTextEl.innerText = "Đã chọn: " + file.name;
}

function handleTutorHwDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
        handleTutorHwFileSelect({ target: { files: event.dataTransfer.files } });
    }
}

// Ngăn trình duyệt tự động mở file khi kéo thả trượt ra ngoài vùng upload
window.addEventListener('dragover', function(e) { e.preventDefault(); }, false);
window.addEventListener('drop', function(e) { e.preventDefault(); }, false);

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
    var dueDate = document.getElementById('assignHwDueDate') ? document.getElementById('assignHwDueDate').value.trim() : "";
    var externalLink = document.getElementById('assignHwLink') ? document.getElementById('assignHwLink').value.trim() : "";
    var maBaiTap = currentTutorStudent.maBaiTap || currentTutorStudent.phone || currentTutorStudent.studentId || currentTutorStudent.name || "DE_GIA_SU";
    
    if (!title) {
        showToast("Vui lòng nhập Tên bài tập!", "error");
        return;
    }

    if (!dueDate) {
        var baseDateForDue = releaseDate || formatDateDDMMYYYY(new Date());
        dueDate = computeDefaultDueDate(baseDateForDue);
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
                .editAssignedHomework(editingAssignedHwRowIndex, title, releaseDate, fileBase64, fileName, mimeType, externalLink, dueDate);
        } else {
            // Tải bài mới lên
            var tutorPhoneToSend = (tutorDataGlobal && tutorDataGlobal.tutorPhone) ? tutorDataGlobal.tutorPhone : "";
            google.script.run
                .withSuccessHandler(function(res) {
                    clearInterval(progressInterval);
                    progressBar.style.width = '100%';
                    progressText.innerText = '100%';
                    
                    setTimeout(function() {
                        progressContainer.style.display = 'none';
                        progressText.style.display = 'none';
                        submitBtn.disabled = false;
                        
                        if (res && res.error) {
                            showToast("Lỗi: " + res.error, "error");
                        } else {
                            showToast("Giao bài tập thành công!", "success");
                            sessionStorage.removeItem('hw_draft_title');
                            document.getElementById('assignHwTitle').value = "";
                            if (document.getElementById('assignHwDueDate')) {
                                document.getElementById('assignHwDueDate').value = "";
                            }
                            if (document.getElementById('assignHwLink')) {
                                document.getElementById('assignHwLink').value = "";
                            }
                            clearTutorSelectedFile();
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
                .uploadAssignedHomework(tutorPhoneToSend, currentTutorStudent.name, title, releaseDate, fileBase64, fileName, mimeType, maBaiTap, externalLink, dueDate);
        }
    };
    
    if (currentTutorHwFile) {
        if (currentTutorHwFile.type && currentTutorHwFile.type.startsWith('image/')) {
            var reader = new FileReader();
            reader.onload = function(e) {
                var img = new Image();
                img.onload = function() {
                    var maxDim = 1600;
                    var width = img.width;
                    var height = img.height;
                    if (width > maxDim || height > maxDim) {
                        if (width > height) {
                            height = Math.round((height * maxDim) / width);
                            width = maxDim;
                        } else {
                            width = Math.round((width * maxDim) / height);
                            height = maxDim;
                        }
                    }
                    var canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    var ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    var dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    var base64 = dataUrl.split(',')[1];
                    proceedWithUpload(base64, currentTutorHwFile.name, 'image/jpeg');
                };
                img.onerror = function() {
                    var content = e.target.result;
                    var base64 = content.indexOf(',') !== -1 ? content.split(',')[1] : content;
                    proceedWithUpload(base64, currentTutorHwFile.name, currentTutorHwFile.type);
                };
                img.src = e.target.result;
            };
            reader.onerror = function() {
                clearInterval(progressInterval);
                progressContainer.style.display = 'none';
                progressText.style.display = 'none';
                submitBtn.disabled = false;
                showToast("Lỗi đọc file hình ảnh!", "error");
            };
            reader.readAsDataURL(currentTutorHwFile);
        } else {
            var reader = new FileReader();
            reader.onload = function(e) {
                var content = e.target.result;
                var commaIdx = content.indexOf(',');
                var base64 = commaIdx !== -1 ? content.substring(commaIdx + 1) : content;
                proceedWithUpload(base64, currentTutorHwFile.name, currentTutorHwFile.type || 'application/octet-stream');
            };
            reader.onerror = function() {
                clearInterval(progressInterval);
                progressContainer.style.display = 'none';
                progressText.style.display = 'none';
                submitBtn.disabled = false;
                showToast("Lỗi đọc file từ thiết bị!", "error");
            };
            reader.readAsDataURL(currentTutorHwFile);
        }
    } else {
        proceedWithUpload("", "", "");
    }
}

// 7. Lấy danh sách bài tập đã giao từ Sheet
function loadTutorAssignedHomework() {
    if (!currentTutorStudent) return;
    
    var tableBody = document.getElementById('assignedHwTableBody');
    tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#A6ADCE; padding: 15px;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu...</td></tr>';
    
    var tutorPhoneToGet = (tutorDataGlobal && tutorDataGlobal.tutorPhone) ? tutorDataGlobal.tutorPhone : "";
    google.script.run
        .withSuccessHandler(function(res) {
            if (res && res.error) {
                showToast("Lỗi: " + res.error, "error");
                tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#EF4444; padding: 15px;">Không thể tải dữ liệu!</td></tr>';
                return;
            }
            
            if (Array.isArray(res)) {
                assignedHwListGlobal = res;
                assignedHwTrashGlobal = [];
            } else {
                assignedHwListGlobal = (res && res.activeList) ? res.activeList : [];
                assignedHwTrashGlobal = (res && res.trashList) ? res.trashList : [];
            }
            
            renderAssignedHwList(assignedHwListGlobal);
            renderTutorHwTrashList(assignedHwTrashGlobal);
        })
        .withFailureHandler(function(err) {
            showToast("Lỗi kết nối: " + err.toString(), "error");
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#EF4444; padding: 15px;">Không thể tải dữ liệu!</td></tr>';
        })
        .getAssignedHomework(currentTutorStudent.name, tutorPhoneToGet);
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
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#A6ADCE; padding: 20px;"><i class="fa-solid fa-circle-info"></i> Chưa giao bài tập nào cho học sinh này!</td></tr>';
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
        var dueDateText = item.dueDate || (typeof computeDefaultDueDate === 'function' ? computeDefaultDueDate(item.releaseDate) : item.releaseDate);
        var fileLinkHtml = item.fileUrl ? '<a href="' + safeUrlAttr(item.fileUrl) + '" target="_blank" rel="noopener noreferrer" style="color:#8E4DFF; font-weight:600; text-decoration:none; display:inline-flex; align-items:center; gap:6px;"><i class="fa-solid fa-file-pdf"></i> Xem file</a>' : '';
        var extLinkHtml = item.externalLink ? '<a href="' + safeUrlAttr(item.externalLink) + '" target="_blank" rel="noopener noreferrer" style="color:#10B981; font-weight:600; text-decoration:none; display:inline-flex; align-items:center; gap:6px;"><i class="fa-solid fa-link"></i> Mở link</a>' : '';
        
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
                '<button onclick="startEditAssignedHw(\'' + jsStr(item.rowIndex) + '\', \'' + jsStr(item.title) + '\', \'' + jsStr(item.releaseDate) + '\', \'' + jsStr(dueDateText) + '\')" class="action-btn-hw-icon action-btn-hw-edit" title="Chỉnh sửa"><i class="fa-solid fa-pen-to-square"></i></button>' +
                '<button onclick="deleteAssignedHomework(\'' + jsStr(item.rowIndex) + '\')" class="action-btn-hw-icon action-btn-hw-delete" title="Xóa tạm thời"><i class="fa-solid fa-trash-can"></i></button>' +
            '</div>';
            
        // Desktop Row
        tableBody.innerHTML += 
            '<tr>' +
                '<td style="color:#A6ADCE;">' + escapeHtml(item.releaseDate) + '</td>' +
                '<td style="color:#F59E0B; font-weight:600; font-size:13px;">' + escapeHtml(dueDateText) + '</td>' +
                '<td style="color:#FFF; font-weight:500;">' + escapeHtml(item.title) + '</td>' +
                '<td>' + attachmentsHtml + '</td>' +
                '<td style="text-align: center; vertical-align: middle;">' + actionsHtml + '</td>' +
            '</tr>';
            
        // Mobile Accordion Card
        mobileHtml += "<div class='accordion-item' id='assign-hw-item-" + idx + "'>";
        mobileHtml += "  <div class='accordion-header' onclick='toggleTutorAssignedHwAccordion(" + idx + ")'>";
        mobileHtml += "    <div class='accordion-header-title'>";
        mobileHtml += "      <span>" + escapeHtml(item.title) + "</span>";
        mobileHtml += "      <span class='accordion-header-date'>" + escapeHtml(item.releaseDate) + "</span>";
        mobileHtml += "    </div>";
        mobileHtml += "    <div class='accordion-header-status'>";
        mobileHtml += "      <i class='fa-solid fa-chevron-down' id='assign-hw-chevron-" + idx + "'></i>";
        mobileHtml += "    </div>";
        mobileHtml += "  </div>";
        mobileHtml += "  <div class='accordion-body' id='assign-hw-body-" + idx + "' style='display: none;'>";
        mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Ngày giao</span><span class='accordion-body-val'>" + escapeHtml(item.releaseDate) + "</span></div>";
        mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Hạn nộp</span><span class='accordion-body-val' style='color:#F59E0B; font-weight:600;'>" + escapeHtml(dueDateText) + "</span></div>";
        mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Đính kèm</span><span class='accordion-body-val'>" + attachmentsMobileHtml + "</span></div>";
        mobileHtml += "    <div class='accordion-body-row' style='margin-top: 5px;'><span class='accordion-body-label'>Thao tác</span>";
        mobileHtml += "      <span class='accordion-body-val' style='display:inline-flex; gap:10px;'>";
        mobileHtml += "        <button onclick=\"startEditAssignedHw('" + jsStr(item.rowIndex) + "', '" + jsStr(item.title) + "', '" + jsStr(item.releaseDate) + "', '" + jsStr(dueDateText) + "')\" class='action-btn-hw' style='border-color:#F59E0B; color:#F59E0B; cursor:pointer;'><i class='fa-solid fa-pen-to-square'></i> Sửa</button>";
        mobileHtml += "        <button onclick=\"deleteAssignedHomework('" + jsStr(item.rowIndex) + "')\" class='action-btn-hw' style='border-color:#EF4444; color:#EF4444; cursor:pointer;'><i class='fa-solid fa-trash-can'></i> Xóa</button>";
        mobileHtml += "      </span>";
        mobileHtml += "    </div>";
        mobileHtml += "  </div>";
        mobileHtml += "</div>";
    });

    // Nút Xem thêm / Thu gọn
    if (totalCount > ASSIGNED_HW_LIMIT) {
        var remaining = totalCount - ASSIGNED_HW_LIMIT;
        if (!showAll) {
            tableBody.innerHTML += '<tr><td colspan="5" style="text-align:center; padding:10px;">'
                + '<button onclick="renderAssignedHwList(assignedHwListGlobal, true)" style="background:none; border:1px solid #4B5563; color:#8E4DFF; padding:6px 20px; border-radius:8px; cursor:pointer; font-size:13px;">'
                + '<i class="fa-solid fa-chevron-down" style="margin-right:5px;"></i>Xem thêm ' + remaining + ' bài cũ hơn'
                + '</button></td></tr>';
            mobileHtml += '<div style="text-align:center; padding:10px;">'
                + '<button onclick="renderAssignedHwList(assignedHwListGlobal, true)" style="background:none; border:1px solid #4B5563; color:#8E4DFF; padding:6px 20px; border-radius:8px; cursor:pointer; font-size:13px; width:100%;">'
                + '<i class="fa-solid fa-chevron-down" style="margin-right:5px;"></i>Xem thêm ' + remaining + ' bài cũ hơn'
                + '</button></div>';
        } else {
            tableBody.innerHTML += '<tr><td colspan="5" style="text-align:center; padding:10px;">'
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

function startEditAssignedHw(rowIndex, title, releaseDate, dueDate) {
    editingAssignedHwRowIndex = rowIndex;
    
    var currentLink = "";
    var currentDue = dueDate || "";
    if (assignedHwListGlobal) {
        var foundHw = assignedHwListGlobal.find(function(item) {
            return item.rowIndex === rowIndex;
        });
        if (foundHw) {
            if (foundHw.externalLink) currentLink = foundHw.externalLink;
            if (!currentDue && foundHw.dueDate) currentDue = foundHw.dueDate;
        }
    }
    if (!currentDue && releaseDate) {
        currentDue = computeDefaultDueDate(releaseDate);
    }
    
    document.getElementById('editAssignHwTitle').value = title;
    document.getElementById('editAssignHwReleaseDate').value = releaseDate;
    if (document.getElementById('editAssignHwDueDate')) {
        document.getElementById('editAssignHwDueDate').value = currentDue;
    }
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
    if (file.size > 30 * 1024 * 1024) {
        showToast("Dung lượng file tối đa là 30MB!", "error");
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
    var dueDate = document.getElementById('editAssignHwDueDate') ? document.getElementById('editAssignHwDueDate').value.trim() : "";
    var externalLink = document.getElementById('editAssignHwLink') ? document.getElementById('editAssignHwLink').value.trim() : "";
    
    if (!title) {
        showToast("Vui lòng nhập Tên bài tập!", "error");
        return;
    }
    if (!dueDate) {
        var baseDateForDue = releaseDate || formatDateDDMMYYYY(new Date());
        dueDate = computeDefaultDueDate(baseDateForDue);
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
            .editAssignedHomework(editingAssignedHwRowIndex, title, releaseDate, fileBase64, fileName, mimeType, externalLink, dueDate);
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
            '<button onclick="restoreAssignedHomework(\'' + jsStr(item.rowIndex) + '\')" class="action-btn-hw" style="color:#10B981; border-color:rgba(16,185,129,0.3); background:rgba(16,185,129,0.1); padding: 4px 14px;"><i class="fa-solid fa-trash-arrow-up"></i> Khôi phục</button>';
            
        tableBody.innerHTML += 
            '<tr>' +
                '<td style="color:#FFF; font-weight:500;">' + escapeHtml(item.title) + '</td>' +
                '<td style="color:#A6ADCE; font-size:12px;">' + escapeHtml(item.deletedTime) + '</td>' +
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
    tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-secondary, #64748B); padding: 15px;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải danh sách bài nộp...</td></tr>';
    document.getElementById('submissionViewMoreBtnContainer').style.display = 'none';
    
    var ma = currentTutorStudent.maBaiTap || currentTutorStudent.phone || "";
    var stName = currentTutorStudent.name || "";
    
    google.script.run
        .withSuccessHandler(function(res) {
            if (res && res.error) {
                showToast("Lỗi: " + res.error, "error");
                tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#EF4444; padding: 15px;">Lỗi tải dữ liệu!</td></tr>';
                return;
            }
            
            studentSubmissionsGlobal = (res && res.submissions) ? res.submissions : (Array.isArray(res) ? res : []);
            submissionsLimit = 5; // Reset limit về 5
            renderStudentSubmissionsList();
        })
        .withFailureHandler(function(err) {
            showToast("Lỗi: " + err.toString(), "error");
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#EF4444; padding: 15px;">Lỗi kết nối server!</td></tr>';
        })
        .getStudentSubmissionsForTutor(ma, stName);
}

// 13. Render bảng bài nộp học sinh với phân trang hiển thị
// Hàm tiện ích parse ngày/giờ chuẩn xác cho tất cả định dạng: ISO, DD/MM/YYYY, HH:mm:ss DD/MM/YYYY
function parseDateTimeString(str) {
    if (!str) return 0;
    if (typeof str === 'number') return str;
    str = String(str).trim();
    
    // Tách các thành phần ngày và giờ
    let parts = str.split(/\s+/);
    let timePart = "";
    let datePart = "";
    
    if (parts.length >= 2) {
        if (parts[0].indexOf(':') !== -1) {
            timePart = parts[0];
            datePart = parts[1];
        } else {
            datePart = parts[0];
            timePart = parts[1];
        }
    } else {
        if (parts[0].indexOf(':') !== -1) {
            timePart = parts[0];
        } else {
            datePart = parts[0];
        }
    }
    
    let year = 1970, month = 0, day = 1;
    let hour = 0, min = 0, sec = 0;
    
    // Phân tích datePart
    if (datePart.indexOf('/') !== -1) {
        let dp = datePart.split('/');
        if (dp.length === 3) {
            if (dp[0].length === 4) { // YYYY/MM/DD
                year = parseInt(dp[0], 10);
                month = parseInt(dp[1], 10) - 1;
                day = parseInt(dp[2], 10);
            } else { // DD/MM/YYYY
                day = parseInt(dp[0], 10);
                month = parseInt(dp[1], 10) - 1;
                year = parseInt(dp[2], 10);
            }
        }
    } else if (datePart.indexOf('-') !== -1) {
        let dp = datePart.split('-');
        if (dp.length === 3) {
            if (dp[0].length === 4) { // YYYY-MM-DD
                year = parseInt(dp[0], 10);
                month = parseInt(dp[1], 10) - 1;
                day = parseInt(dp[2], 10);
            } else { // DD-MM-YYYY
                day = parseInt(dp[0], 10);
                month = parseInt(dp[1], 10) - 1;
                year = parseInt(dp[2], 10);
            }
        }
    } else {
        let d = new Date(str);
        if (!isNaN(d.getTime())) return d.getTime();
    }
    
    // Phân tích timePart
    if (timePart && timePart.indexOf(':') !== -1) {
        let tp = timePart.split(':');
        hour = parseInt(tp[0] || 0);
        min = parseInt(tp[1] || 0);
        sec = parseInt(tp[2] || 0);
    }
    
    let parsed = new Date(year, month, day, hour, min, sec);
    return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

// Hàm chuẩn hóa hiển thị ngày giờ chuẩn Việt Nam (DD/MM/YYYY HH:mm:ss)
function formatVNDateTime(str) {
    if (!str) return "-";
    let ts = parseDateTimeString(str);
    if (!ts || ts === 0) return str;
    
    let d = new Date(ts);
    let day = String(d.getDate()).padStart(2, '0');
    let month = String(d.getMonth() + 1).padStart(2, '0');
    let year = d.getFullYear();
    let hours = String(d.getHours()).padStart(2, '0');
    let minutes = String(d.getMinutes()).padStart(2, '0');
    let seconds = String(d.getSeconds()).padStart(2, '0');
    
    return day + "/" + month + "/" + year + " " + hours + ":" + minutes + ":" + seconds;
}

var activeGradingSubId = "";
var activeGradingStudentName = "";
var activeGradingFileUrl = "";

function downloadSubmissionFileByIndex(idx) {
    var item = (currentSortedSubmissions && currentSortedSubmissions[idx]) || (studentSubmissionsGlobal && studentSubmissionsGlobal[idx]);
    if (!item || !item.fileUrl) {
        showToast("Không tìm thấy file bài nộp!", "error");
        return;
    }
    var fileUrl = item.fileUrl;
    if (fileUrl.startsWith('data:')) {
        var a = document.createElement('a');
        a.href = fileUrl;
        var ext = ".pdf";
        if (fileUrl.startsWith("data:image/png")) ext = ".png";
        else if (fileUrl.startsWith("data:image/jpeg") || fileUrl.startsWith("data:image/jpg")) ext = ".jpg";
        else if (fileUrl.startsWith("data:application/zip")) ext = ".zip";
        else if (fileUrl.startsWith("data:application/pdf")) ext = ".pdf";
        else if (fileUrl.startsWith("data:application/vnd.openxmlformats") || fileUrl.startsWith("data:application/msword")) ext = ".docx";
        
        var rawName = (item.studentName || "HocSinh") + "_" + (item.lessonName || "BaiTap");
        a.download = rawName.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, "_") + ext;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast("Đang tải file bài nộp về máy...", "success");
    } else {
        var finalUrl = typeof getGoogleDriveDownloadUrl === 'function' ? getGoogleDriveDownloadUrl(fileUrl) : fileUrl;
        window.open(safeUrl(finalUrl), '_blank');
    }
}

function viewSubmissionFileByIndex(idx) {
    var item = (currentSortedSubmissions && currentSortedSubmissions[idx]) || (studentSubmissionsGlobal && studentSubmissionsGlobal[idx]);
    if (!item || !item.fileUrl) {
        showToast("Không tìm thấy file bài nộp!", "error");
        return;
    }
    openSubmissionPreviewModal(item.subId || item.rowIndex || idx, item.studentName || (currentTutorStudent ? currentTutorStudent.name : ''), item.fileUrl);
}

function openSubmissionPreviewModal(subId, studentName, fileUrl) {
    activeGradingSubId = subId;
    activeGradingStudentName = studentName;
    activeGradingFileUrl = fileUrl;

    var titleEl = document.getElementById('previewStudentNameTitle');
    var iframe = document.getElementById('submissionPreviewIframe');
    var extBtn = document.getElementById('btnPreviewExternalLink');
    var spinner = document.getElementById('previewLoadingSpinner');
    var gallery = document.getElementById('customGalleryContainer');

    if (titleEl) titleEl.textContent = studentName || (currentTutorStudent ? currentTutorStudent.name : '') || '';
    if (extBtn) extBtn.href = safeUrl(fileUrl) || '#';
    if (spinner) spinner.style.display = 'block';

    var modal = document.getElementById('previewSubmissionModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
    }

    var previewUrl = fileUrl || '';
    if (fileUrl) {
        // Trường hợp 1: Danh sách nhiều ảnh lưu dạng JSON mảng (Base64 hoặc link)
        if (fileUrl.trim().startsWith('[') || fileUrl.trim().startsWith('{')) {
            try {
                var parsedFiles = JSON.parse(fileUrl);
                if (!Array.isArray(parsedFiles)) parsedFiles = [parsedFiles];
                if (parsedFiles.length > 0) {
                    if (iframe) iframe.style.display = 'none';
                    if (gallery) {
                        gallery.style.display = 'grid';
                        if (spinner) spinner.style.display = 'none';
                        var html = '';
                        parsedFiles.forEach(function(f, fIdx) {
                            var fUrl = typeof f === 'string' ? f : (f.url || f.fileUrl || '');
                            var fName = (typeof f === 'object' && f.name) ? f.name : ('Ảnh ' + (fIdx + 1));
                            var isImg = (typeof f === 'object' && f.isImage !== undefined) ? f.isImage : (fUrl.startsWith('data:image/') || fUrl.match(/\.(jpg|jpeg|png|webp|gif)($|\?)/i));
                            
                            if (isImg) {
                                html += '<div style="cursor:pointer; border-radius:8px; overflow:hidden; border:1px solid rgba(255,255,255,0.1); transition: transform 0.2s;" onclick="openLightbox(\'' + jsStr(safeUrl(fUrl)) + '\')" onmouseover="this.style.transform=\'scale(1.02)\'" onmouseout="this.style.transform=\'scale(1)\'">' +
                                    '<img src="' + safeUrlAttr(fUrl) + '" style="width:100%; height:200px; object-fit:cover; display:block;">' +
                                    '<div style="padding:8px; background:rgba(0,0,0,0.6); color:#FFF; font-size:12px; text-align:center; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">' + escapeHtml(fName) + '</div>' +
                                    '</div>';
                            } else {
                                html += '<div style="border-radius:8px; overflow:hidden; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.05); display:flex; flex-direction:column; align-items:center; justify-content:center; padding:15px;">' +
                                    '<i class="fa-solid fa-file-lines" style="font-size:40px; color:#A5B4FC; margin-bottom:10px;"></i>' +
                                    '<div style="color:#FFF; font-size:12px; text-align:center; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; width:100%; margin-bottom:10px;">' + escapeHtml(fName) + '</div>' +
                                    '<a href="' + safeUrlAttr(fUrl) + '" target="_blank" rel="noopener noreferrer" style="background:#8E4DFF; color:#FFF; padding:5px 10px; border-radius:5px; text-decoration:none; font-size:11px;">Mở File</a>' +
                                    '</div>';
                            }
                        });
                        gallery.innerHTML = html;
                    }
                    return;
                }
            } catch (e) {
                console.warn("Lỗi parse fileUrl JSON:", e);
            }
        }

        // Trường hợp 2: Base64 trực tiếp hoặc link ảnh trực tiếp
        if (fileUrl.startsWith('data:image/') || fileUrl.match(/\.(jpg|jpeg|png|webp|gif)($|\?)/i)) {
            if (iframe) iframe.style.display = 'none';
            if (gallery) {
                gallery.style.display = 'grid';
                if (spinner) spinner.style.display = 'none';
                gallery.innerHTML = '<div style="grid-column: 1 / -1; text-align:center; cursor:pointer; padding: 15px;" onclick="openLightbox(\'' + jsStr(safeUrl(fileUrl)) + '\')">' +
                    '<img src="' + safeUrlAttr(fileUrl) + '" style="max-width:100%; max-height:65vh; object-fit:contain; border-radius:8px; box-shadow:0 5px 20px rgba(0,0,0,0.5);">' +
                    '<div style="color:#A6ADCE; font-size:12px; margin-top:8px;"><i class="fa-solid fa-magnifying-glass-plus"></i> Nhấp vào ảnh để phóng to toàn màn hình</div>' +
                    '</div>';
            }
            return;
        }

        // Trường hợp 3: Thư mục Drive hoặc file ZIP (.zip) trên Drive
        var isFolder = fileUrl.indexOf('/folders/') !== -1 || fileUrl.indexOf('/drive/folders/') !== -1;
        var isZip = fileUrl.toLowerCase().indexOf('.zip') !== -1;

        if (isFolder || isZip) {
            if (iframe) iframe.style.display = 'none';
            if (gallery) {
                gallery.style.display = 'grid';
                gallery.innerHTML = '';
            }
            if (typeof google !== 'undefined' && google.script && google.script.run && google.script.run.getDriveFolderImages) {
                google.script.run
                    .withSuccessHandler(function(files) {
                        if (spinner) spinner.style.display = 'none';
                        if (!files || files.length === 0) {
                            if (gallery) gallery.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #A6ADCE; padding: 40px;">Không tìm thấy file ảnh trong bài nộp hoặc chưa cấp quyền. <br><a href="' + safeUrlAttr(fileUrl) + '" target="_blank" rel="noopener noreferrer" style="color:#FFD23F; text-decoration:none; margin-top:8px; display:inline-block;"><i class="fa-solid fa-arrow-up-right-from-square"></i> Mở trực tiếp trên Google Drive →</a></div>';
                            return;
                        }
                        var html = '';
                        files.forEach(function(f) {
                            if (f.isImage) {
                                html += '<div style="cursor:pointer; border-radius:8px; overflow:hidden; border:1px solid rgba(255,255,255,0.1); transition: transform 0.2s;" onclick="openLightbox(\'' + jsStr(safeUrl(f.url)) + '\')" onmouseover="this.style.transform=\'scale(1.02)\'" onmouseout="this.style.transform=\'scale(1)\'">' +
                                    '<img src="' + safeUrlAttr(f.url) + '" style="width:100%; height:200px; object-fit:cover; display:block;">' +
                                    '<div style="padding:8px; background:rgba(0,0,0,0.6); color:#FFF; font-size:12px; text-align:center; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">' + escapeHtml(f.name) + '</div>' +
                                    '</div>';
                            } else {
                                html += '<div style="border-radius:8px; overflow:hidden; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.05); display:flex; flex-direction:column; align-items:center; justify-content:center; padding:15px;">' +
                                    '<i class="fa-solid fa-file-lines" style="font-size:40px; color:#A5B4FC; margin-bottom:10px;"></i>' +
                                    '<div style="color:#FFF; font-size:12px; text-align:center; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; width:100%; margin-bottom:10px;">' + escapeHtml(f.name) + '</div>' +
                                    '<a href="' + safeUrlAttr(f.url) + '" target="_blank" rel="noopener noreferrer" style="background:#8E4DFF; color:#FFF; padding:5px 10px; border-radius:5px; text-decoration:none; font-size:11px;">Mở File</a>' +
                                    '</div>';
                            }
                        });
                        if (gallery) gallery.innerHTML = html;
                    })
                    .withFailureHandler(function(err) {
                        if (spinner) spinner.style.display = 'none';
                        if (gallery) gallery.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #EF4444; padding: 40px;">Lỗi tải ảnh bài nộp: ' + escapeHtml(err.toString()) + '</div>';
                    })
                    .getDriveFolderImages(fileUrl);
            } else {
                if (spinner) spinner.style.display = 'none';
                if (gallery) gallery.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #A6ADCE; padding: 40px;"><p>Bài nộp dạng thư mục / tệp nén của học sinh</p><a href="' + safeUrlAttr(fileUrl) + '" target="_blank" rel="noopener noreferrer" style="color:#FFD23F; font-weight:bold; text-decoration:none; display:inline-block; margin-top:10px; padding:8px 16px; background:rgba(255,210,63,0.15); border:1px solid #FFD23F; border-radius:8px;"><i class="fa-solid fa-arrow-up-right-from-square"></i> Mở trên Google Drive</a></div>';
            }
            return;
        }

        // Trường hợp 4: File Drive đơn lẻ (PDF hoặc link xem Drive thông thường)
        var fileMatch = fileUrl.match(/\/file\/d\/([^\/]+)/) || fileUrl.match(/id=([^&]+)/);
        if (fileMatch && fileMatch[1]) {
            previewUrl = 'https://drive.google.com/file/d/' + fileMatch[1] + '/preview';
            if (gallery) gallery.style.display = 'none';
            if (iframe) {
                iframe.style.display = 'block';
                iframe.onload = function() { if (spinner) spinner.style.display = 'none'; };
                iframe.src = previewUrl;
            }
        } else if (fileUrl.startsWith('data:application/pdf')) {
            if (gallery) gallery.style.display = 'none';
            if (iframe) {
                iframe.style.display = 'block';
                iframe.onload = function() { if (spinner) spinner.style.display = 'none'; };
                iframe.src = fileUrl;
            }
        } else {
            if (gallery) gallery.style.display = 'none';
            if (iframe) {
                iframe.style.display = 'block';
                iframe.onload = function() { if (spinner) spinner.style.display = 'none'; };
                iframe.src = safeUrl(previewUrl);
            }
        }
    } else {
        if (spinner) spinner.style.display = 'none';
        if (gallery) gallery.style.display = 'none';
        if (iframe) {
            iframe.style.display = 'block';
            iframe.src = '';
        }
    }
}

function closeSubmissionPreviewModal() {
    var modal = document.getElementById('previewSubmissionModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
    var iframe = document.getElementById('submissionPreviewIframe');
    if (iframe) iframe.src = '';
}

function openLightbox(url) {
    if (window.event) window.event.stopPropagation();
    var img = document.getElementById('lightboxImg');
    if (img) img.src = url;
    var lb = document.getElementById('fullscreenLightbox');
    if (lb) lb.style.display = 'flex';
}

function closeLightbox() {
    var lb = document.getElementById('fullscreenLightbox');
    if (lb) lb.style.display = 'none';
    var img = document.getElementById('lightboxImg');
    if (img) img.src = '';
}

function openGradeModalFromPreview() {
    closeSubmissionPreviewModal();
    var curSub = null;
    if (studentSubmissionsGlobal) {
        curSub = studentSubmissionsGlobal.find(function(s) {
            return (s.subId && s.subId === activeGradingSubId) || (s.rowIndex && String(s.rowIndex) === String(activeGradingSubId));
        });
    }
    openGradeModal(activeGradingSubId, activeGradingStudentName, curSub ? curSub.score : '', curSub ? curSub.comment : '');
}

function openGradeModal(subId, studentName, currentScore, currentComment) {
    activeGradingSubId = subId;
    activeGradingStudentName = studentName;

    var nameInput = document.getElementById('gradeStudentNameInput');
    var scoreInput = document.getElementById('gradeScoreInput');
    var commentInput = document.getElementById('gradeCommentInput');

    if (nameInput) nameInput.value = studentName || (currentTutorStudent ? currentTutorStudent.name : '') || '';
    if (scoreInput) scoreInput.value = currentScore !== undefined && currentScore !== null ? currentScore : '';
    if (commentInput) commentInput.value = currentComment !== undefined && currentComment !== null ? currentComment : '';

    var modal = document.getElementById('tutorGradeModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
    }
}

function closeGradeModal() {
    var modal = document.getElementById('tutorGradeModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
}

function saveTutorGrade() {
    var scoreInput = document.getElementById('gradeScoreInput');
    var commentInput = document.getElementById('gradeCommentInput');

    var score = scoreInput ? scoreInput.value.trim() : '';
    var comment = commentInput ? commentInput.value.trim() : '';

    if (!score) {
        showToast('Vui lòng nhập điểm số trước khi lưu!', 'warning');
        return;
    }

    var scoreNum = parseFloat(score.replace(',', '.'));
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 10) {
        showToast('Điểm số phải từ 0 đến 10!', 'warning');
        return;
    }

    var stName = activeGradingStudentName || (currentTutorStudent ? currentTutorStudent.name : '');

    // Cập nhật Optimistic UI
    var gradeWrap = document.getElementById('grade-wrapper-' + activeGradingSubId);
    var mobileGradeWrap = document.getElementById('mobile-grade-wrapper-' + activeGradingSubId);
    
    var gradedHtml = '<span style="padding:5px 12px; background:rgba(37,99,235,0.1); border:1px solid rgba(37,99,235,0.3); border-radius:8px; color:#2563EB; font-size:12.5px; font-weight:700; display:inline-flex; align-items:center; gap:5px;"><i class="fa-solid fa-star" style="color:#3B82F6;"></i> Điểm: ' + escapeHtml(score) + '</span>'
        + ' <button onclick="openGradeModal(\'' + jsStr(activeGradingSubId) + '\',\'' + jsStr(stName || '') + '\',\'' + jsStr(score) + '\',\'' + jsStr(comment || '') + '\')" style="background:none; border:none; color:var(--text-secondary, #64748B); cursor:pointer; font-size:12px; margin-left:6px; padding:2px 4px;" title="Sửa điểm"><i class="fa-solid fa-pen"></i></button>';

    var mobileGradedHtml = '<span style="padding:3px 9px; background:rgba(37,99,235,0.1); border:1px solid rgba(37,99,235,0.3); border-radius:6px; color:#2563EB; font-size:12px; font-weight:700;"><i class="fa-solid fa-star" style="color:#3B82F6;"></i> Điểm: ' + escapeHtml(score) + '</span>'
        + ' <button onclick="openGradeModal(\'' + jsStr(activeGradingSubId) + '\',\'' + jsStr(stName || '') + '\',\'' + jsStr(score) + '\',\'' + jsStr(comment || '') + '\')" style="background:none; border:none; color:var(--text-secondary, #64748B); cursor:pointer; font-size:11px; margin-left:4px;" title="Sửa điểm"><i class="fa-solid fa-pen"></i></button>';

    if (gradeWrap) gradeWrap.innerHTML = gradedHtml;
    if (mobileGradeWrap) mobileGradeWrap.innerHTML = mobileGradedHtml;

    // Cập nhật mảng cache client
    if (studentSubmissionsGlobal) {
        for (var i = 0; i < studentSubmissionsGlobal.length; i++) {
            var sItem = studentSubmissionsGlobal[i];
            if ((sItem.subId && sItem.subId === activeGradingSubId) || (sItem.rowIndex && String(sItem.rowIndex) === String(activeGradingSubId)) || i === parseInt(activeGradingSubId, 10)) {
                sItem.score = score;
                sItem.comment = comment;
                sItem.status = "Đã chấm";
                break;
            }
        }
    }

    closeGradeModal();
    showToast('Đã lưu kết quả chấm điểm cho ' + (stName || 'học sinh') + ' thành công!', 'success');

    if (typeof google !== 'undefined' && google.script && google.script.run && google.script.run.gradeSubmission) {
        google.script.run
            .withSuccessHandler(function(res) {
                if (res && res.error) {
                    showToast('Lỗi lưu điểm: ' + res.error, 'error');
                }
            })
            .withFailureHandler(function(err) {
                showToast('Lỗi mạng khi lưu điểm: ' + err.toString(), 'error');
            })
            .gradeSubmission(activeGradingSubId, score, comment);
    }
}

function renderStudentSubmissionsList() {
    var tableBody = document.getElementById('studentSubmissionsTableBody');
    var mobileContainer = document.getElementById('submittedHwMobile');
    if (!tableBody) return;
    
    if (studentSubmissionsGlobal.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-secondary, #64748B); padding: 20px;"><i class="fa-solid fa-circle-info"></i> Học sinh này chưa nộp bài tập nào!</td></tr>';
        if (mobileContainer) {
            mobileContainer.innerHTML = '<div style="text-align:center; color:var(--text-secondary, #64748B); padding: 20px; font-size: 13px;"><i class="fa-solid fa-circle-info"></i> Học sinh này chưa nộp bài tập nào!</div>';
        }
        var vmContainer = document.getElementById('submissionViewMoreBtnContainer');
        if (vmContainer) vmContainer.style.display = 'none';
        return;
    }

    // Sắp xếp: bài nộp mới nhất lên đầu
    var sortedList = studentSubmissionsGlobal.slice().sort(function(a, b) {
        return parseDateTimeString(b.timestamp) - parseDateTimeString(a.timestamp);
    });
    currentSortedSubmissions = sortedList;
    var totalCount = sortedList.length;
    var showList = sortedList.slice(0, submissionsLimit);

    tableBody.innerHTML = "";
    var mobileHtml = "";
    var studentName = currentTutorStudent ? currentTutorStudent.name : "";
    
    showList.forEach(function(item, idx) {
        var subId = item.subId || item.rowIndex || idx;
        var isFolder = item.fileUrl && (item.fileUrl.indexOf("/folders/") !== -1 || item.fileUrl.indexOf("/drive/folders/") !== -1);
        var isZip = item.fileUrl && item.fileUrl.toLowerCase().indexOf(".zip") !== -1;
        var lessonName = item.lessonName || item.title || item.baiHoc || item.tenBaiHoc || item.homeworkTitle || "Bài tập";
        
        var viewBtn = item.fileUrl ? 
            '<button onclick="openSubmissionPreviewModal(\'' + jsStr(subId) + '\',\'' + jsStr(studentName || item.studentName || '') + '\',\'' + jsStr(item.fileUrl) + '\')" style="padding:6px 14px; background:rgba(99,102,241,0.1); border:1.5px solid rgba(99,102,241,0.4); border-radius:8px; color:#6366F1; font-size:13px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:6px; transition:all 0.2s; white-space:nowrap;"><i class="fa-solid fa-file-lines"></i> Xem bài</button>' 
            : '<span style="color:var(--text-secondary, #64748B); white-space:nowrap;">Không có file</span>';
        
        var dlText = isFolder ? '<i class="fa-solid fa-folder-arrow-down"></i> Tải thư mục' : (isZip ? '<i class="fa-solid fa-file-zipper"></i> Tải ZIP' : '<i class="fa-solid fa-download"></i> Tải');
        var downloadBtn = item.fileUrl ? '<button onclick="downloadSubmissionFileByIndex(' + idx + ')" class="action-btn-hw" style="color:var(--text-primary, #1E293B); border:1px solid rgba(16,185,129,0.35); background:rgba(16,185,129,0.08); padding: 5px 14px; cursor: pointer; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px; font-weight:600; font-size:13px; transition:all 0.2s; white-space:nowrap;"><i class="fa-solid fa-download" style="color:#059669;"></i> Tải</button>' : '<span style="color:var(--text-secondary, #64748B); white-space:nowrap;">N/A</span>';
        
        var displayTime = formatVNDateTime(item.timestamp);
        
        // Grade Button / Badge
        var rawScore = (item.score !== undefined && item.score !== null) ? String(item.score).trim() : "";
        var isGraded = rawScore !== "" && rawScore !== "-" && rawScore !== "null" && rawScore !== "undefined";
        var scoreVal = isGraded ? rawScore : null;
        var commentVal = item.comment || "";
        
        var gradeHtml = '<div id="grade-wrapper-' + escapeHtml(subId) + '" style="display:inline-flex; align-items:center; justify-content:center; white-space:nowrap;">';
        if (scoreVal) {
            gradeHtml += '<span style="padding:5px 12px; background:rgba(37,99,235,0.1); border:1px solid rgba(37,99,235,0.3); border-radius:8px; color:#2563EB; font-size:12.5px; font-weight:700; display:inline-flex; align-items:center; gap:5px; white-space:nowrap;"><i class="fa-solid fa-star" style="color:#3B82F6;"></i> Điểm: ' + escapeHtml(scoreVal) + '</span>'
                + ' <button onclick="openGradeModal(\'' + jsStr(subId) + '\',\'' + jsStr(studentName || item.studentName || '') + '\',\'' + jsStr(scoreVal) + '\',\'' + jsStr(commentVal) + '\')" style="background:none; border:none; color:var(--text-secondary, #64748B); cursor:pointer; font-size:12px; margin-left:6px; padding:2px 4px;" title="Sửa điểm"><i class="fa-solid fa-pen"></i></button>';
        } else {
            gradeHtml += '<button onclick="openGradeModal(\'' + jsStr(subId) + '\',\'' + jsStr(studentName || item.studentName || '') + '\')" style="padding:6px 14px; background:var(--bg-card, #FFFFFF); border:1px solid var(--border-card, #CBD5E1); border-radius:8px; color:var(--text-primary, #1E293B); font-size:13px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 1px 2px rgba(0,0,0,0.05); transition:all 0.2s; white-space:nowrap;"><i class="fa-solid fa-pen"></i> Chấm điểm</button>';
        }
        gradeHtml += '</div>';

        // Mobile Grade HTML
        var mobileGradeHtml = '<div id="mobile-grade-wrapper-' + escapeHtml(subId) + '" style="display:inline-flex; align-items:center; white-space:nowrap;">';
        if (scoreVal) {
            mobileGradeHtml += '<span style="padding:3px 9px; background:rgba(37,99,235,0.1); border:1px solid rgba(37,99,235,0.3); border-radius:6px; color:#2563EB; font-size:12px; font-weight:700; white-space:nowrap;"><i class="fa-solid fa-star" style="color:#3B82F6;"></i> Điểm: ' + escapeHtml(scoreVal) + '</span>'
                + ' <button onclick="openGradeModal(\'' + jsStr(subId) + '\',\'' + jsStr(studentName || item.studentName || '') + '\',\'' + jsStr(scoreVal) + '\',\'' + jsStr(commentVal) + '\')" style="background:none; border:none; color:var(--text-secondary, #64748B); cursor:pointer; font-size:11px; margin-left:4px;" title="Sửa điểm"><i class="fa-solid fa-pen"></i></button>';
        } else {
            mobileGradeHtml += '<button onclick="openGradeModal(\'' + jsStr(subId) + '\',\'' + jsStr(studentName || item.studentName || '') + '\')" style="padding:4px 10px; background:var(--bg-card, #FFFFFF); border:1px solid var(--border-card, #CBD5E1); border-radius:6px; color:var(--text-primary, #1E293B); font-size:12px; font-weight:600; cursor:pointer; white-space:nowrap;"><i class="fa-solid fa-pen"></i> Chấm điểm</button>';
        }
        mobileGradeHtml += '</div>';
        
        // Desktop Row
        tableBody.innerHTML += 
            '<tr>' +
                '<td style="color:var(--text-secondary, #475569); font-weight:500; font-size:13px; padding:12px 16px; border-bottom:1px solid var(--border-card, #E2E8F0); white-space:nowrap;">' + escapeHtml(displayTime) + '</td>' +
                '<td style="color:var(--text-primary, #0F172A); font-weight:600; font-size:13px; padding:12px 16px; border-bottom:1px solid var(--border-card, #E2E8F0);">' + escapeHtml(lessonName) + '</td>' +
                '<td style="padding:12px 16px; border-bottom:1px solid var(--border-card, #E2E8F0); white-space:nowrap;">' + viewBtn + '</td>' +
                '<td style="text-align: center; padding:12px 16px; border-bottom:1px solid var(--border-card, #E2E8F0); white-space:nowrap;">' + gradeHtml + '</td>' +
                '<td style="text-align: center; padding:12px 16px; border-bottom:1px solid var(--border-card, #E2E8F0); white-space:nowrap;">' + downloadBtn + '</td>' +
            '</tr>';
            
        // Mobile Accordion Card
        mobileHtml += "<div class='accordion-item' id='submit-hw-item-" + idx + "'>";
        mobileHtml += "  <div class='accordion-header' onclick='toggleTutorSubmittedHwAccordion(" + idx + ")'>";
        mobileHtml += "    <div class='accordion-header-title'>";
        mobileHtml += "      <span style='color:var(--text-primary, #1E293B); font-weight:600;'>" + escapeHtml(lessonName) + "</span>";
        mobileHtml += "      <span class='accordion-header-date' style='color:var(--text-secondary, #64748B);'>" + escapeHtml(displayTime) + "</span>";
        mobileHtml += "    </div>";
        mobileHtml += "    <div class='accordion-header-status' style='display:flex; align-items:center; gap:8px;'>";
        if (scoreVal) {
            mobileHtml += "      <span style='color:#2563EB; font-size:12px; font-weight:700;'><i class='fa-solid fa-star' style='color:#3B82F6;'></i> " + escapeHtml(scoreVal) + "đ</span>";
        }
        mobileHtml += "      <i class='fa-solid fa-chevron-down' id='submit-hw-chevron-" + idx + "'></i>";
        mobileHtml += "    </div>";
        mobileHtml += "  </div>";
        mobileHtml += "  <div class='accordion-body' id='submit-hw-body-" + idx + "' style='display: none;'>";
        mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Thời gian nộp</span><span class='accordion-body-val' style='color:var(--text-primary, #1E293B); font-weight:600;'>" + escapeHtml(displayTime) + "</span></div>";
        mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Xem bài làm</span><span class='accordion-body-val'>" + viewBtn + "</span></div>";
        mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Chấm điểm</span><span class='accordion-body-val'>" + mobileGradeHtml + "</span></div>";
        if (commentVal) {
            mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Nhận xét</span><span class='accordion-body-val' style='color:var(--text-secondary, #64748B); font-style:italic; font-size:12.5px;'>" + escapeHtml(commentVal) + "</span></div>";
        }
        mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Tải về</span><span class='accordion-body-val'>" + downloadBtn + "</span></div>";
        mobileHtml += "  </div>";
        mobileHtml += "</div>";
    });

    // Nút Xem thêm / Thu gọn cho cả desktop lẫn mobile
    if (totalCount > submissionsLimit) {
        var remaining = totalCount - submissionsLimit;
        tableBody.innerHTML += '<tr><td colspan="5" style="text-align:center; padding:12px; border-bottom:none;">'
            + '<button onclick="loadMoreStudentSubmissions()" style="background:var(--bg-card, #FFFFFF); border:1px solid var(--border-color, #CBD5E1); color:var(--color-primary, #2563EB); padding:6px 22px; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600; display:inline-flex; align-items:center; gap:6px; transition:all 0.2s; box-shadow:0 1px 2px rgba(0,0,0,0.04);">'
            + '<i class="fa-solid fa-chevron-down"></i> Xem thêm ' + remaining + ' bài nộp cũ hơn'
            + '</button></td></tr>';
        mobileHtml += '<div style="text-align:center; padding:12px;">'
            + '<button onclick="loadMoreStudentSubmissions()" style="background:var(--bg-card, #FFFFFF); border:1px solid var(--border-color, #CBD5E1); color:var(--color-primary, #2563EB); padding:7px 20px; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600; width:100%; display:inline-flex; align-items:center; justify-content:center; gap:6px;">'
            + '<i class="fa-solid fa-chevron-down"></i> Xem thêm ' + remaining + ' bài nộp cũ hơn'
            + '</button></div>';
    } else if (submissionsLimit > 5 && totalCount <= submissionsLimit) {
        // Nút Thu gọn khi đang xem tất cả
        tableBody.innerHTML += '<tr><td colspan="5" style="text-align:center; padding:12px; border-bottom:none;">'
            + '<button onclick="collapseStudentSubmissions()" style="background:var(--bg-card, #FFFFFF); border:1px solid var(--border-card, #E2E8F0); color:var(--text-secondary, #64748B); padding:6px 22px; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600; display:inline-flex; align-items:center; gap:6px;">'
            + '<i class="fa-solid fa-chevron-up"></i> Thu gọn'
            + '</button></td></tr>';
        mobileHtml += '<div style="text-align:center; padding:12px;">'
            + '<button onclick="collapseStudentSubmissions()" style="background:var(--bg-card, #FFFFFF); border:1px solid var(--border-card, #E2E8F0); color:var(--text-secondary, #64748B); padding:7px 20px; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600; width:100%; display:inline-flex; align-items:center; justify-content:center; gap:6px;">'
            + '<i class="fa-solid fa-chevron-up"></i> Thu gọn'
            + '</button></div>';
    }

    if (mobileContainer) {
        mobileContainer.innerHTML = mobileHtml;
    }
    
    // Ẩn nút Xem thêm cũ (đã tích hợp inline)
    var vmBtnOld = document.getElementById('submissionViewMoreBtnContainer');
    if (vmBtnOld) vmBtnOld.style.display = 'none';
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

// Helper: Tính hạn nộp mặc định (+4 ngày kể từ ngày giao bài)
function computeDefaultDueDate(releaseDateStr) {
    var baseDate = new Date();
    if (releaseDateStr && typeof releaseDateStr === 'string') {
        var str = releaseDateStr.trim().split(' ')[0];
        if (str.includes('/')) {
            var parts = str.split('/');
            if (parts.length >= 3) {
                var day = parseInt(parts[0], 10);
                var month = parseInt(parts[1], 10) - 1;
                var year = parseInt(parts[2], 10);
                if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                    baseDate = new Date(year, month, day);
                }
            }
        } else if (str.includes('-')) {
            var parts = str.split('-');
            if (parts.length >= 3 && parts[0].length === 4) {
                var year = parseInt(parts[0], 10);
                var month = parseInt(parts[1], 10) - 1;
                var day = parseInt(parts[2], 10);
                if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                    baseDate = new Date(year, month, day);
                }
            }
        }
    }
    baseDate.setDate(baseDate.getDate() + 4);
    var dd = String(baseDate.getDate()).padStart(2, '0');
    var mm = String(baseDate.getMonth() + 1).padStart(2, '0');
    var yyyy = baseDate.getFullYear();
    return dd + '/' + mm + '/' + yyyy;
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
            var feedbacks = (response.feedbacks || []).filter(function(fb) {
                return fb && fb.studentPhone !== 'ADMIN' && fb.studentName !== 'Thông báo hệ thống' && fb.studentName !== 'SYSTEM_MARQUEE';
            });
            if (feedbacks.length === 0) {
                container.innerHTML = "<div style='text-align: center; color: var(--text-muted); font-style: italic; padding: 25px;'><i class='fa-regular fa-comment-slash' style='font-size: 20px; display: block; margin-bottom: 8px; opacity: 0.6;'></i>Chưa có ý kiến phản hồi nào trong 10 ngày gần đây.</div>";
                return;
            }
            
            var html = "";
            feedbacks.forEach(function(fb) {
                html += '<div class="agenda-event-card" style="border-left-color: var(--color-primary); background: var(--nav-active-bg); border: 1px solid var(--border-color); border-left-width: 4px; padding: 12px 15px; border-radius: 10px; flex-direction: column; align-items: stretch; cursor: default; gap: 6px;">' +
                    '  <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 5px;">' +
                    '    <span style="font-weight: 800; color: var(--color-primary); font-size: 13.5px;"><i class="fa-solid fa-graduation-cap"></i> Phụ huynh em ' + escapeHtml(fb.studentName) + ' <span style="font-size: 11.5px; color: var(--text-muted); font-weight: normal;">(' + escapeHtml(fb.studentPhone) + ')</span></span>' +
                    '    <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;"><i class="fa-regular fa-clock"></i> ' + escapeHtml(fb.timestamp) + '</span>' +
                    '  </div>' +
                    '  <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; font-style: italic; background: var(--bg-input); padding: 8px 12px; border-radius: 8px; margin-top: 4px;">' +
                    '    "' + escapeHtml(fb.content) + '"' +
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
    var mappedMon = mapSubjectToSelectValue(log.mon);
    document.getElementById('lesMon').value = mappedMon;
    var lesMonWrap = document.getElementById('lesMonCustomWrap');
    var lesMonInp = document.getElementById('lesMonCustom');
    if (mappedMon === "Khác") {
        if (lesMonWrap) lesMonWrap.style.display = "block";
        if (lesMonInp) lesMonInp.value = (log.mon || "");
    } else {
        if (lesMonWrap) lesMonWrap.style.display = "none";
        if (lesMonInp) lesMonInp.value = "";
    }
    
    var tt = log.trangThai || "Đã học";
    if (tt.trim().toLowerCase() === "hủy/nghỉ") {
        tt = "Hủy/ nghỉ"; // Chuẩn hóa
    }
    document.getElementById('lesTrangThai').value = tt;
    var dupBtvn = (log.btvn || "Hoàn thành").trim();
    var addSel = document.getElementById('lesBtvn');
    var addWrap = document.getElementById('lesBtvnCustomWrap');
    var addInp = document.getElementById('lesBtvnCustom');
    if (dupBtvn === "Hoàn thành" || dupBtvn === "Không làm" || dupBtvn === "Hoàn thành 90%" || dupBtvn === "Hoàn thành 75%" || dupBtvn === "Phụ huynh nhớ nhắc nhở bé làm bài tập gia sư mới giao") {
        addSel.value = dupBtvn;
        if (addWrap) addWrap.style.display = "none";
        if (addInp) addInp.value = "";
    } else {
        addSel.value = "Khác";
        if (addWrap) addWrap.style.display = "block";
        var mPct = dupBtvn.match(/(\d+(\.\d+)?)%/);
        if (mPct) {
            if (addInp) addInp.value = mPct[1];
        } else {
            if (addInp) addInp.value = "";
        }
    }
    document.getElementById('lesDiemDau').value = log.diemDauGio || "Không có";
    document.getElementById('lesDiemDinhKi').value = log.diemDinhKi || "Không có";
    var cContent = log.noiDung || "";
    var cNhanXet = (log.nhanXet || log.nhan_xet || log["nhận xét"] || log.tutor_comment || "").trim();
    if (!cNhanXet && cContent.indexOf("---NHAN_XET---") !== -1) {
        var cParts = cContent.split("---NHAN_XET---");
        cContent = cParts[0].trim();
        cNhanXet = cParts.slice(1).join("---NHAN_XET---").trim();
    }
    document.getElementById('lesNoiDung').value = cContent;
    if (document.getElementById('lesNhanXet')) {
        document.getElementById('lesNhanXet').value = cNhanXet;
    }
    
    showToast("Đã nhân bản dữ liệu buổi học! Vui lòng kiểm tra ngày dạy và nhận xét.", "success");
}

// Hàm chuẩn hóa và ánh xạ môn học từ Google Sheet về đúng giá trị option trong thẻ select
function mapSubjectToSelectValue(val) {
    if (!val) return "Toán";
    var clean = val.trim().toLowerCase();
    
    // So khớp trực tiếp hoặc từ viết tắt phổ biến
    if (clean === "toán" || clean === "toán học") return "Toán";
    if (clean === "lý" || clean === "lí" || clean === "vật lý" || clean === "vật lí") return "Lý";
    if (clean === "anh" || clean === "tiếng anh" || clean === "english") return "Anh";
    if (clean === "văn" || clean === "ngữ văn") return "Văn";
    if (clean === "hóa" || clean === "hóa học") return "Hóa";
    
    // Nếu có chứa từ khóa
    if (clean.indexOf("toán") !== -1) return "Toán";
    if (clean.indexOf("lý") !== -1 || clean.indexOf("lí") !== -1 || clean.indexOf("phys") !== -1) return "Lý";
    if (clean.indexOf("anh") !== -1 || clean.indexOf("eng") !== -1) return "Anh";
    if (clean.indexOf("văn") !== -1 || clean.indexOf("ngữ") !== -1) return "Văn";
    if (clean.indexOf("hóa") !== -1 || clean.indexOf("chem") !== -1) return "Hóa";
    
    return "Khác"; // Mặc định chuyển sang Khác để điền tùy chỉnh
}

// =====================================
// BLOCK C: THEME SYSTEM (MERGED FROM DEMO)
// =====================================
// ============================================================================
// PHASE 12: MULTI-THEME SYSTEM (36 THEMES + CUSTOM COLOR PICKER)
// ============================================================================

var THEME_NAMES = {
  'theme-dark-purple': 'Tím Đêm (Gốc)',
  'preset-blue': 'Xanh gốc',
  'preset-hong-hoa': 'Hồng hoa',
  'preset-hong-nhe': 'Hồng nhẹ',
  'preset-matcha': 'Matcha Tea',
  'preset-linen': 'Linen Cocoa',
  'theme-azure-mist-full': 'Azure Mist · Nền & bóng',
  'theme-azure-mist-minimal': 'Azure Mist · Tối giản',
  'theme-woodland-cottage-full': 'Woodland Cottage · Nền & bóng',
  'theme-woodland-cottage-minimal': 'Woodland Cottage · Tối giản',
  'theme-sage-blush-full': 'Sage Blush · Nền & bóng',
  'theme-sage-blush-minimal': 'Sage Blush · Tối giản',
  'theme-golden-caramel-full': 'Golden Caramel · Nền & bóng',
  'theme-golden-caramel-minimal': 'Golden Caramel · Tối giản',
  'theme-pastel-alpine-full': 'Pastel Alpine · Nền & bóng',
  'theme-pastel-alpine-minimal': 'Pastel Alpine · Tối giản',
  'theme-dreamy-cosmic-full': 'Dreamy Cosmic · Nền & bóng (Tối)',
  'theme-dreamy-cosmic-minimal': 'Dreamy Cosmic · Tối giản (Tối)',
  'theme-sunset-meadow-full': 'Sunset Meadow · Nền & bóng',
  'theme-sunset-meadow-minimal': 'Sunset Meadow · Tối giản',
  'theme-neon-seoul-full': 'Neon Seoul · Nền & bóng (Tối)',
  'theme-neon-seoul-minimal': 'Neon Seoul · Tối giản (Tối)',
  'theme-mystic-blue-full': 'Mystic Blue · Nền & bóng (Tối)',
  'theme-mystic-blue-minimal': 'Mystic Blue · Tối giản (Tối)',
  'theme-blue-lime-full': 'Blue Lime · Nền & bóng',
  'theme-blue-lime-minimal': 'Blue Lime · Tối giản',
  'theme-cloud-meadow-full': 'Cloud Meadow · Nền & bóng',
  'theme-cloud-meadow-minimal': 'Cloud Meadow · Tối giản',
  'theme-soft-blue-white-full': 'Soft Blue · Nền & bóng',
  'theme-soft-blue-white-minimal': 'Soft Blue · Tối giản',
  'theme-soft-blue-full': 'Soft Blue · Nền & bóng',
  'theme-soft-blue-minimal': 'Soft Blue · Tối giản',
  'theme-blossom-noir-full': 'Blossom Noir · Nền & bóng (Tối)',
  'theme-blossom-noir-minimal': 'Blossom Noir · Tối giản (Tối)',
  'theme-violet-planet-full': 'Violet Planet · Nền & bóng (Tối)',
  'theme-violet-planet-minimal': 'Violet Planet · Tối giản (Tối)',
  'theme-claude-full': 'Claude · Nền & bóng (Ấm)',
  'theme-claude-minimal': 'Claude · Tối giản (Ấm)'
};

function syncThemeToCalendarIframe() {
  var calFrame = document.getElementById('tutorCalendarIframe');
  if (!calFrame) return;

  var curTheme = null;
  try { curTheme = localStorage.getItem(window.__tutorThemeKey()); } catch(e) {}
  if (!curTheme) {
    var root = document.documentElement;
    Array.from(root.classList).forEach(function(cls) {
      if (cls.startsWith('theme-') || cls.startsWith('preset-')) {
        curTheme = cls;
      }
    });
  }
  if (!curTheme) curTheme = 'theme-azure-mist-minimal';

  var isCustom = curTheme.startsWith('custom:');
  var customHex = isCustom ? curTheme.split(':')[1] : null;

  // 1. Gửi qua postMessage (luôn hoạt động ổn định giữa các frame)
  try {
    if (calFrame.contentWindow) {
      if (isCustom) {
        calFrame.contentWindow.postMessage({ type: 'setCustomTheme', hex: customHex }, window.location.origin);
        calFrame.contentWindow.postMessage('custom:' + customHex, window.location.origin);
      } else {
        calFrame.contentWindow.postMessage({ type: 'setTheme', themeId: curTheme }, window.location.origin);
        calFrame.contentWindow.postMessage(curTheme, window.location.origin);
      }
    }
  } catch(e) {}

  // 2. Gọi trực tiếp hàm nếu iframe cùng origin và đã tải xong
  try {
    if (calFrame.contentWindow) {
      if (isCustom) {
        if (typeof calFrame.contentWindow.applyCustomTheme === 'function') {
          var fInput = calFrame.contentWindow.document.getElementById('customColorHex');
          if (fInput) fInput.value = customHex;
          calFrame.contentWindow.applyCustomTheme(true, customHex);
        }
      } else {
        if (typeof calFrame.contentWindow.applyTheme === 'function') {
          calFrame.contentWindow.applyTheme(curTheme);
        }
      }
    }
  } catch(e) {}
}
window.syncThemeToCalendarIframe = syncThemeToCalendarIframe;

function applyTheme(themeId) {
  var root = document.documentElement;
  // 1. Dọn sạch các biến inline do custom theme gán
  var propsToClear = [
    '--color-primary', '--color-primary-light', '--color-primary-dark',
    '--color-primary-rgb', '--chart-bar', '--chart-bar-rgb', '--btn-bg',
    '--btn-text', '--nav-active-bg', '--nav-active-text', '--bg-page',
    '--bg-page-gradient', '--bg-sidebar', '--bg-card', '--bg-card-alt',
    '--bg-input', '--bg-overlay', '--border-color', '--border-card', '--text-primary',
    '--text-secondary', '--text-muted', '--shadow-card', '--shadow-primary',
    '--header-bg', '--header-border', '--is-dark-theme',
    '--color-accent-kpi', '--kpi-number-color', '--text-heading',
    '--sidebar-border', '--scrollbar-thumb', '--glass-bg', '--glass-border',
    '--glass-shadow', '--glass-blur', '--glass-inner', '--glass-inner-border',
    '--nav-btn-text', '--nav-hover-bg'
  ];
  propsToClear.forEach(function(p) { root.style.removeProperty(p); });

  // 2. Xóa các class theme cũ
  Array.from(root.classList).forEach(function(cls) {
    if (cls.startsWith('theme-') || cls.startsWith('preset-')) {
      root.classList.remove(cls);
    }
  });

  // 3. Kích hoạt theme mới
  root.classList.add(themeId);
  try { localStorage.setItem(window.__tutorThemeKey(), themeId); } catch(e) {}

  // Set data-theme cho dark mode CSS selectors
  var darkThemes = [
    'theme-dark-purple', 'theme-dreamy-cosmic-full', 'theme-dreamy-cosmic-minimal',
    'theme-neon-seoul-full', 'theme-neon-seoul-minimal', 'theme-mystic-blue-full',
    'theme-mystic-blue-minimal', 'theme-blossom-noir-full', 'theme-blossom-noir-minimal',
    'theme-violet-planet-full', 'theme-violet-planet-minimal'
  ];
  root.setAttribute('data-theme', darkThemes.indexOf(themeId) !== -1 ? 'dark' : 'light');

  // 4. Đồng bộ active state trong switcher panel
  document.querySelectorAll('#themeSwitcherPanel [data-theme]').forEach(function(el) {
    el.classList.toggle('active', el.dataset.theme === themeId);
  });

  // 5. Cập nhật nhãn theme
  var label = document.getElementById('themeCurrentLabel');
  if (label) label.textContent = THEME_NAMES[themeId] || themeId;

  // 6. Cập nhật biểu đồ doanh thu Chart.js (Task 12.6)
  if (typeof rerenderChartsForTheme === 'function') {
    rerenderChartsForTheme();
  }

  // 7. Cập nhật FullCalendar nếu đang ở trang Lịch
  if (typeof calendar !== 'undefined' && calendar && typeof calendar.render === 'function') {
    calendar.render();
  }
  syncThemeToCalendarIframe();
  if (typeof updateSettingsThemeUI === 'function') {
    updateSettingsThemeUI();
  }
}

function openThemeSwitcher() {
  var panel = document.getElementById('themeSwitcherPanel');
  if (!panel) return;
  panel.style.display = 'flex';

  var cur = localStorage.getItem(window.__tutorThemeKey()) || 'theme-azure-mist-minimal';
  if (cur.startsWith('custom:')) {
    var hex = cur.split(':')[1];
    var p = document.getElementById('customColorPicker');
    var h = document.getElementById('customColorHex');
    if (p) p.value = hex;
    if (h) h.value = hex.toUpperCase();
    var label = document.getElementById('themeCurrentLabel');
    if (label) label.textContent = 'Màu tùy chỉnh ' + hex.toUpperCase();
    document.querySelectorAll('#themeSwitcherPanel [data-theme]').forEach(function(el) {
      el.classList.remove('active');
    });
  } else {
    document.querySelectorAll('#themeSwitcherPanel [data-theme]').forEach(function(el) {
      el.classList.toggle('active', el.dataset.theme === cur);
    });
    var label = document.getElementById('themeCurrentLabel');
    if (label) label.textContent = THEME_NAMES[cur] || cur;
  }
}

function closeThemeSwitcher() {
  var panel = document.getElementById('themeSwitcherPanel');
  if (panel) panel.style.display = 'none';
}

// Task 12.6: Re-render Chart.js khi đổi theme
function rerenderChartsForTheme() {
  if (typeof renderRevenueBarChart === 'function') {
    renderRevenueBarChart();
  } else if (typeof revenueBarChartInstance !== 'undefined' && revenueBarChartInstance) {
    var comp = getComputedStyle(document.documentElement);
    var chartColor = (comp.getPropertyValue('--chart-bar') || '#4A72E8').trim();
    var chartRgb = (comp.getPropertyValue('--chart-bar-rgb') || '74, 114, 232').trim();
    if (revenueBarChartInstance.data.datasets.length > 1) {
      revenueBarChartInstance.data.datasets[0].backgroundColor = 'rgba(' + chartRgb + ', 0.16)';
      revenueBarChartInstance.data.datasets[1].backgroundColor = chartColor;
      revenueBarChartInstance.data.datasets[1].hoverBackgroundColor = chartColor;
    } else if (revenueBarChartInstance.data.datasets.length === 1) {
      revenueBarChartInstance.data.datasets[0].borderColor = chartColor;
      revenueBarChartInstance.data.datasets[0].pointBackgroundColor = chartColor;
    }
    revenueBarChartInstance.update();
  }
  if (typeof renderStudentRevenueDonut === 'function') {
    renderStudentRevenueDonut();
  }
}

// Hàm tính toán trọn bộ bảng màu hài hòa từ mã HEX người dùng chọn
function computeCustomThemeVars(hex) {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return null;
  var r = parseInt(hex.slice(1,3), 16);
  var g = parseInt(hex.slice(3,5), 16);
  var b = parseInt(hex.slice(5,7), 16);

  var toHex = function(n) { return Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0'); };

  // Màu sáng (+40% độ sáng)
  var lr = Math.round(r + (255 - r) * 0.4);
  var lg = Math.round(g + (255 - g) * 0.4);
  var lb = Math.round(b + (255 - b) * 0.4);
  var hexLight = '#' + toHex(lr) + toHex(lg) + toHex(lb);

  // Màu đậm tương phản cao cho tiêu đề và chữ (-35% độ sáng)
  var dr = Math.round(r * 0.65);
  var dg = Math.round(g * 0.65);
  var db = Math.round(b * 0.65);
  var hexDark = '#' + toHex(dr) + toHex(dg) + toHex(db);

  // Các sắc thái pastel dịu mắt để tạo nền dải gradient
  var bgr1 = Math.round(r + (255 - r) * 0.86);
  var bgg1 = Math.round(g + (255 - g) * 0.86);
  var bgb1 = Math.round(b + (255 - b) * 0.86);
  var hexBg1 = '#' + toHex(bgr1) + toHex(bgg1) + toHex(bgb1);

  var bgr2 = Math.round(r + (255 - r) * 0.93);
  var bgg2 = Math.round(g + (255 - g) * 0.93);
  var bgb2 = Math.round(b + (255 - b) * 0.93);
  var hexBg2 = '#' + toHex(bgr2) + toHex(bgg2) + toHex(bgb2);

  var bgr3 = Math.round(r + (255 - r) * 0.97);
  var bgg3 = Math.round(g + (255 - g) * 0.97);
  var bgb3 = Math.round(b + (255 - b) * 0.97);
  var hexBgPage = '#' + toHex(bgr3) + toHex(bgg3) + toHex(bgb3);

  var pageGradient = 'radial-gradient(ellipse at 20% 30%, ' + hexBg1 + ' 0%, transparent 50%), ' +
                     'radial-gradient(ellipse at 80% 15%, ' + hexBg2 + ' 0%, transparent 45%), ' +
                     'radial-gradient(ellipse at 50% 75%, ' + hexBg1 + ' 0%, transparent 55%), ' +
                     'linear-gradient(135deg, ' + hexBgPage + ', ' + hexBg2 + ')';

  return {
    '--color-primary': hex,
    '--color-primary-light': hexLight,
    '--color-primary-dark': hexDark,
    '--color-primary-rgb': r + ', ' + g + ', ' + b,
    '--color-accent-kpi': hex,
    '--kpi-number-color': '#0F172A',
    '--text-heading': hexDark,
    '--chart-bar': hex,
    '--chart-bar-rgb': r + ', ' + g + ', ' + b,
    '--btn-bg': 'linear-gradient(135deg, ' + hex + ', ' + hexDark + ')',
    '--btn-text': '#FFFFFF',
    '--nav-active-bg': 'rgba(' + r + ', ' + g + ', ' + b + ', 0.14)',
    '--nav-active-text': hexDark,
    '--nav-hover-bg': 'rgba(' + r + ', ' + g + ', ' + b + ', 0.06)',
    '--nav-btn-text': '#334155',
    '--bg-page': hexBgPage,
    '--bg-page-gradient': pageGradient,
    '--bg-sidebar': hexBg2,
    '--bg-card': '#FFFFFF',
    '--bg-card-alt': hexBg2,
    '--bg-input': '#FFFFFF',
    '--bg-overlay': 'rgba(0, 0, 0, 0.4)',
    '--border-color': 'rgba(' + r + ', ' + g + ', ' + b + ', 0.25)',
    '--border-card': 'rgba(' + r + ', ' + g + ', ' + b + ', 0.16)',
    '--sidebar-border': 'rgba(' + r + ', ' + g + ', ' + b + ', 0.2)',
    '--scrollbar-thumb': 'rgba(' + r + ', ' + g + ', ' + b + ', 0.35)',
    '--text-primary': '#0F172A',
    '--text-secondary': '#475569',
    '--text-muted': '#94A3B8',
    '--header-bg': 'rgba(' + bgr3 + ', ' + bgg3 + ', ' + bgb3 + ', 0.95)',
    '--header-border': 'rgba(' + r + ', ' + g + ', ' + b + ', 0.15)',
    '--shadow-card': '0 4px 18px rgba(' + r + ', ' + g + ', ' + b + ', 0.08)',
    '--shadow-primary': '0 4px 16px rgba(' + r + ', ' + g + ', ' + b + ', 0.28)',
    '--glass-bg': 'rgba(255, 255, 255, 0.65)',
    '--glass-border': 'rgba(255, 255, 255, 0.85)',
    '--glass-shadow': '0 8px 32px rgba(' + r + ', ' + g + ', ' + b + ', 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
    '--glass-blur': '16px',
    '--glass-inner': 'rgba(255, 255, 255, 0.6)',
    '--glass-inner-border': 'rgba(255, 255, 255, 0.8)',
    '--is-dark-theme': '0'
  };
}

// Task 12.7: Custom Color Picker (Áp dụng trọn bộ bảng màu đồng bộ)
function applyCustomTheme(silent, explicitHex) {
  var hex = explicitHex;
  if (!hex) {
    var hexInput = document.getElementById('customColorHex');
    if (hexInput) hex = hexInput.value.trim();
  }
  if (!hex) {
    try {
      var cur = localStorage.getItem(window.__tutorThemeKey());
      if (cur && cur.startsWith('custom:')) hex = cur.split(':')[1];
    } catch(e) {}
  }
  var vars = hex ? computeCustomThemeVars(hex) : null;
  if (!vars) {
    if (!silent) {
      if (typeof showToast === 'function') {
        showToast('Mã màu không hợp lệ. Vui lòng nhập đúng #RRGGBB (ví dụ: #2563EB)', 'error');
      } else {
        alert('Mã màu không hợp lệ. Vui lòng nhập đúng #RRGGBB (ví dụ: #2563EB)');
      }
    }
    return;
  }

  var root = document.documentElement;
  // Xóa class theme tĩnh
  Array.from(root.classList).forEach(function(cls) {
    if (cls.startsWith('theme-') || cls.startsWith('preset-')) {
      root.classList.remove(cls);
    }
  });

  // Thiết lập toàn bộ biến CSS hài hòa
  Object.keys(vars).forEach(function(prop) {
    root.style.setProperty(prop, vars[prop]);
  });
  root.setAttribute('data-theme', 'light');

  try { localStorage.setItem(window.__tutorThemeKey(), 'custom:' + hex); } catch(e) {}

  var hexInput = document.getElementById('customColorHex');
  if (hexInput && hexInput.value.toUpperCase() !== hex.toUpperCase()) hexInput.value = hex.toUpperCase();
  var picker = document.getElementById('customColorPicker');
  if (picker && picker.value.toLowerCase() !== hex.toLowerCase()) picker.value = hex;

  document.querySelectorAll('#themeSwitcherPanel [data-theme]').forEach(function(el) {
    el.classList.remove('active');
  });

  var label = document.getElementById('themeCurrentLabel');
  if (label) label.textContent = 'Màu tùy chỉnh ' + hex.toUpperCase();

  // Đồng bộ sang Iframe Lịch tức thì
  syncThemeToCalendarIframe();

  if (typeof rerenderChartsForTheme === 'function') rerenderChartsForTheme();
  if (typeof calendar !== 'undefined' && calendar && typeof calendar.render === 'function') calendar.render();
  if (typeof updateSettingsThemeUI === 'function') updateSettingsThemeUI();
  if (!silent && typeof showToast === 'function') showToast('Đã áp dụng màu tùy chỉnh!', 'success');
}

// Đồng bộ 2 chiều giữa Color Picker & Input HEX kèm Live Preview tức thì
function setupCustomColorSync() {
  var picker = document.getElementById('customColorPicker');
  var hexInput = document.getElementById('customColorHex');
  if (picker && hexInput) {
    picker.addEventListener('input', function() {
      hexInput.value = this.value.toUpperCase();
      applyCustomTheme(true); // Xem trước tức thì khi kéo chọn màu!
    });
    hexInput.addEventListener('input', function() {
      var v = this.value.trim();
      if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
        picker.value = v;
        applyCustomTheme(true); // Xem trước tức thì khi nhập mã HEX!
      }
    });
  }
}

// Export functions to window
window.THEME_NAMES = THEME_NAMES;
window.applyTheme = applyTheme;
window.openThemeSwitcher = openThemeSwitcher;
window.closeThemeSwitcher = closeThemeSwitcher;
window.computeCustomThemeVars = computeCustomThemeVars;
window.applyCustomTheme = applyCustomTheme;

// Lắng nghe tín hiệu yêu cầu đồng bộ theme và cập nhật lịch từ iframe lịch
window.addEventListener('message', function(e) {
  // BẢO MẬT: chỉ nhận tin nhắn cùng origin, và (nếu có iframe lịch) chỉ từ chính iframe lịch
  if (e.origin !== window.location.origin) return;
  var calFrameEl = document.getElementById('tutorCalendarIframe');
  if (calFrameEl && calFrameEl.contentWindow && e.source !== calFrameEl.contentWindow) return;
  if (e.data && (e.data.type === 'calendarReady' || e.data.type === 'requestTheme')) {
    syncThemeToCalendarIframe();
  }
  if (e.data && e.data.type === 'tutorScheduleUpdated' && Array.isArray(e.data.schedule)) {
    lastLoadedTutorSchedule = e.data.schedule;
    if (typeof renderUpcomingSchedule === 'function') {
      renderUpcomingSchedule(e.data.schedule);
    }
    if (typeof refreshTutorScheduleDisplay === 'function') {
      refreshTutorScheduleDisplay(e.data.schedule);
    }
  }
});

// Khởi chạy khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', function() {
  setupCustomColorSync();
  var saved = localStorage.getItem(window.__tutorThemeKey());
  if (saved && saved.startsWith('custom:')) {
    var hex = saved.split(':')[1];
    var hexInput = document.getElementById('customColorHex');
    var picker = document.getElementById('customColorPicker');
    if (hexInput) hexInput.value = hex;
    if (picker) picker.value = hex;
    applyCustomTheme(true);
  } else if (saved) {
    applyTheme(saved);
  } else {
    applyTheme('theme-azure-mist-minimal');
  }

  // Tự động gắn hook load cho iframe lịch để đồng bộ ngay khi load xong
  var calFrame = document.getElementById('tutorCalendarIframe');
  if (calFrame) {
    calFrame.addEventListener('load', function() {
      syncThemeToCalendarIframe();
      setTimeout(syncThemeToCalendarIframe, 100);
      setTimeout(syncThemeToCalendarIframe, 350);
      try {
        if (calFrame.contentWindow && Array.isArray(calFrame.contentWindow.tutorScheduleSheetData) && calFrame.contentWindow.tutorScheduleSheetData.length > 0) {
          lastLoadedTutorSchedule = calFrame.contentWindow.tutorScheduleSheetData;
          if (typeof renderUpcomingSchedule === 'function') {
            renderUpcomingSchedule(lastLoadedTutorSchedule);
          }
        }
      } catch(e) {}
    });
  }
});

/* ============================================================
 * TASK 6 — Settings Modal Controllers
 * ============================================================ */

function openSettingsModal() {
    var modal = document.getElementById('settingsModal');
    if (!modal) return;
    modal.style.display = 'flex';

    var dm = localStorage.getItem('tutorDarkMode') === 'true';
    var dmToggle = document.getElementById('darkModeToggle');
    if (dmToggle) dmToggle.checked = dm;

    var nb = localStorage.getItem('tutorNotifBrowser') !== 'false';
    var nbToggle = document.getElementById('notifBrowserToggle');
    if (nbToggle) nbToggle.checked = nb;

    var ns = localStorage.getItem('tutorNotifSound') !== 'false';
    var nsToggle = document.getElementById('notifSoundToggle');
    if (nsToggle) nsToggle.checked = ns;

    renderSettingsThemes();

    var cur = document.getElementById('settingsCurrentPin');
    var np = document.getElementById('settingsNewPin');
    var cp = document.getElementById('settingsConfirmPin');
    if (cur) cur.value = '';
    if (np) np.value = '';
    if (cp) cp.value = '';
}
window.openSettingsModal = openSettingsModal;

function closeSettingsModal() {
    var modal = document.getElementById('settingsModal');
    if (modal) modal.style.display = 'none';
}
window.closeSettingsModal = closeSettingsModal;

function togglePinInputVisibility(inputId, btn) {
    var inp = document.getElementById(inputId);
    if (!inp) return;
    if (inp.type === 'password') {
        inp.type = 'text';
        if (btn) btn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
    } else {
        inp.type = 'password';
        if (btn) btn.innerHTML = '<i class="fa-solid fa-eye"></i>';
    }
}
window.togglePinInputVisibility = togglePinInputVisibility;

function changePin() {
    var curEl = document.getElementById('settingsCurrentPin');
    var npEl = document.getElementById('settingsNewPin');
    var cpEl = document.getElementById('settingsConfirmPin');

    var cur = curEl ? curEl.value.trim() : '';
    var nPin = npEl ? npEl.value.trim() : '';
    var cPin = cpEl ? cpEl.value.trim() : '';

    if (!cur) { showToast('Vui lòng nhập mã PIN hiện tại!', 'warning'); return; }
    if (!nPin) { showToast('Vui lòng nhập mã PIN mới!', 'warning'); return; }
    if (nPin.length < 4) { showToast('Mã PIN phải có ít nhất 4 ký tự!', 'warning'); return; }
    if (nPin !== cPin) { showToast('Mã PIN xác nhận không khớp!', 'error'); return; }

    var truePin = (tutorDataGlobal && tutorDataGlobal.tutorPin ? tutorDataGlobal.tutorPin : "").trim();
    if (cur !== truePin) {
        showToast('Mã PIN hiện tại không chính xác!', 'error');
        return;
    }

    var btn = document.querySelector('.account-security-card .settings-action-btn') || document.querySelector('[onclick="changePin()"]') || document.querySelector('.settings-action-btn');
    var origText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang đổi...';
    }

    google.script.run
        .withSuccessHandler(function(res) {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = origText || '<i class="fa-solid fa-key"></i> Đổi mã PIN';
            }
            if (res && res.error) {
                showToast('Lỗi: ' + res.error, 'error');
            } else {
                if (tutorDataGlobal) tutorDataGlobal.tutorPin = nPin;
                var pinInput = document.getElementById('maPin');
                if (pinInput) pinInput.value = nPin;
                var accPinInput = document.getElementById('accTutorPin');
                if (accPinInput) accPinInput.value = nPin;

                if (curEl) curEl.value = '';
                if (npEl) npEl.value = '';
                if (cpEl) cpEl.value = '';
                showToast('Đổi mã PIN bảo mật thành công!', 'success');
            }
        })
        .withFailureHandler(function(err) {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = origText || '<i class="fa-solid fa-key"></i> Đổi mã PIN';
            }
            showToast('Lỗi kết nối: ' + err.toString(), 'error');
        })
        .capNhatThongTinGiaSu(
            tutorDataGlobal ? tutorDataGlobal.tutorPhone : '',
            tutorDataGlobal ? tutorDataGlobal.tutorName : '',
            tutorDataGlobal ? tutorDataGlobal.tutorPhone : '',
            nPin,
            tutorDataGlobal ? (tutorDataGlobal.qrCode || "") : ""
        );
}
window.changePin = changePin;

function toggleDarkMode(enabled) {
    document.documentElement.setAttribute('data-dark-mode', enabled ? 'true' : 'false');
    localStorage.setItem('tutorDarkMode', enabled ? 'true' : 'false');
    if (typeof rerenderChartsForTheme === 'function') {
        rerenderChartsForTheme();
    }
}
window.toggleDarkMode = toggleDarkMode;

// Auto apply dark mode on boot
(function() {
    try {
        var dm = localStorage.getItem('tutorDarkMode') === 'true';
        if (dm) {
            document.documentElement.setAttribute('data-dark-mode', 'true');
        }
    } catch(e) {}
})();

function renderSettingsThemes() {
    updateSettingsThemeUI();
}
window.renderSettingsThemes = renderSettingsThemes;

function updateSettingsThemeUI() {
    var cur = localStorage.getItem(window.__tutorThemeKey()) || 'theme-azure-mist-minimal';
    var nameEl = document.getElementById('settingsThemeActiveName');
    var descEl = document.getElementById('settingsThemeActiveDesc');
    var orbEl = document.getElementById('settingsThemeOrbPreview');

    if (nameEl) {
        if (cur.startsWith('custom:')) {
            var hex = cur.split(':')[1];
            nameEl.textContent = 'Màu tùy chỉnh ' + hex.toUpperCase();
            if (descEl) descEl.textContent = 'Mã màu tự chọn ' + hex.toUpperCase();
            if (orbEl) {
                orbEl.style.background = hex;
                orbEl.style.boxShadow = '0 0 12px ' + hex + '66';
            }
        } else {
            var themeName = (typeof THEME_NAMES !== 'undefined' && THEME_NAMES[cur]) ? THEME_NAMES[cur] : cur;
            nameEl.textContent = themeName;
            if (descEl) descEl.textContent = '30 phong cách giao diện & phối màu cá nhân hóa';
            if (orbEl) {
                var orbSource = document.querySelector('#themeSwitcherPanel [data-theme="' + cur + '"] .theme-orb, #themeSwitcherPanel [data-theme="' + cur + '"] .theme-dot');
                if (orbSource && orbSource.style.background) {
                    orbEl.style.background = orbSource.style.background;
                } else if (cur === 'theme-dark-purple') {
                    orbEl.style.background = 'linear-gradient(135deg, #0B0826, #8E4DFF)';
                } else {
                    orbEl.style.background = 'var(--color-primary, #8E4DFF)';
                }
                orbEl.style.boxShadow = '0 0 12px var(--color-primary-light, rgba(142,77,255,0.4))';
            }
        }
    }

    document.querySelectorAll('.settings-quick-preset').forEach(function(btn) {
        var isActive = (btn.dataset.theme === cur);
        btn.classList.toggle('active', isActive);
        if (isActive) {
            btn.style.borderColor = 'var(--color-primary, #8E4DFF)';
            btn.style.background = 'var(--nav-active-bg, rgba(142,77,255,0.15))';
            btn.style.color = 'var(--color-primary, #8E4DFF)';
            btn.style.fontWeight = '700';
        } else {
            btn.style.borderColor = 'var(--border-color)';
            btn.style.background = 'var(--bg-card)';
            btn.style.color = 'var(--text-primary)';
            btn.style.fontWeight = '500';
        }
    });
}
window.updateSettingsThemeUI = updateSettingsThemeUI;

function applySettingsTheme(themeId) {
    if (typeof applyTheme === 'function') {
        applyTheme(themeId);
    }
    updateSettingsThemeUI();
    if (typeof showToast === 'function') {
        showToast('Đã áp dụng giao diện mới!', 'success');
    }
}
window.applySettingsTheme = applySettingsTheme;

function toggleBrowserNotif(enabled) {
    localStorage.setItem('tutorNotifBrowser', enabled ? 'true' : 'false');
    if (enabled && 'Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission().then(function(perm) {
            if (perm !== 'granted') {
                showToast('Trình duyệt đã từ chối quyền thông báo.', 'warning');
                var el = document.getElementById('notifBrowserToggle');
                if (el) el.checked = false;
                localStorage.setItem('tutorNotifBrowser', 'false');
            } else {
                showToast('Đã cấp quyền nhận thông báo!', 'success');
            }
        });
    }
}
window.toggleBrowserNotif = toggleBrowserNotif;

function toggleNotifSound(enabled) {
    localStorage.setItem('tutorNotifSound', enabled ? 'true' : 'false');
    showToast(enabled ? 'Đã bật âm thanh thông báo' : 'Đã tắt âm thanh thông báo', 'info');
}
window.toggleNotifSound = toggleNotifSound;

/* ============================================================
 * TASK 7 — Multi-Tab Onboarding Tour Engine
 * ============================================================ */
var currentOnboardingTab = 'overview';
var currentOnboardingStep = 0;
var onboardingSteps = [];

var TAB_NAMES = {
    overview: 'Tổng quan',
    reports: 'Báo cáo',
    diary: 'Nhật ký buổi học',
    calendar: 'Lịch dạy',
    students: 'Học sinh',
    tuition: 'Học phí',
    invoice: 'Phiếu học phí'
};

var tabOnboardingSteps = {
    overview: [
        {
            target: '#tutorKpiGrid',
            title: '📊 Chỉ số Tổng quan',
            desc: 'Theo dõi nhanh tổng số học sinh đang dạy, số buổi đã dạy, tổng giờ dạy và học phí dự kiến trong tháng.',
            placement: 'bottom'
        },
        {
            target: '#tutorUpcomingScheduleBox',
            title: '📅 Lịch dạy sắp tới',
            desc: 'Xem danh sách các ca dạy hôm nay và ngày mai để chủ động sắp xếp thời gian và chuẩn bị giáo án.',
            placement: 'bottom'
        },
        {
            target: '#revenueBarChartBox',
            title: '📈 Thống kê & Biểu đồ',
            desc: 'Biểu đồ trực quan hóa doanh thu và số giờ dạy theo từng tháng giúp bạn dễ dàng theo dõi tiến độ.',
            placement: 'top'
        },
        {
            target: '.tutor-sidebar-nav',
            title: '🧭 Các Mục Quản Lý Chính',
            desc: 'Nhấp vào các mục bên trái (Báo cáo, Nhật ký, Lịch dạy, Học sinh, Học phí) để quản lý lớp học. Mỗi mục sẽ tự động hướng dẫn chi tiết khi bạn mở lần đầu!',
            placement: 'right'
        },
        {
            target: '#sidebarBtnTheme, #mobileBtnTheme',
            title: '🎨 Đổi Giao Diện & Màu Sắc',
            desc: 'Nhấp vào đây để chọn hơn 30 bộ màu và phong cách giao diện (Sáng, Tối, Pastel, Hiện đại...) theo sở thích cá nhân của bạn.',
            placement: 'right'
        },
        {
            target: '#sidebarBtnAccount, #mobileBtnAccount',
            title: '👤 Quản Lý Tài Khoản Gia Sư',
            desc: 'Cập nhật ảnh đại diện, họ tên, số điện thoại và thông tin ngân hàng để hệ thống tự động tạo mã VietQR thanh toán trên phiếu học phí.',
            placement: 'right'
        },
        {
            target: '#sidebarBtnSettings, #mobileBtnSettings',
            title: '⚙️ Cài Đặt Hệ Thống & Hướng Dẫn',
            desc: 'Bật/tắt âm thanh chuông báo, cấp quyền thông báo trình duyệt và xem lại hướng dẫn sử dụng của bất kỳ mục nào mỗi khi bạn cần.',
            placement: 'right'
        }
    ],
    reports: [
        {
            target: '.report-filter-toolbar',
            title: '📊 Bộ lọc Báo cáo học tập',
            desc: 'Chọn khoảng thời gian (Từ ngày - Đến ngày) và chọn học sinh cụ thể để tổng hợp kết quả học tập.',
            placement: 'bottom'
        },
        {
            target: '.report-actions',
            title: '📸 Xuất Báo Cáo Chuyên Nghiệp',
            desc: 'Tùy chọn xuất ảnh PNG sắc nét hoặc tải file PDF chuyên nghiệp để gửi trực tiếp cho phụ huynh qua Zalo/Facebook.',
            placement: 'bottom'
        },
        {
            target: '#reportPreviewContainer',
            title: '👁️ Xem Trước Báo Cáo Trực Quan',
            desc: 'Khung xem trước toàn bộ nhận xét, số buổi học, tỷ lệ chuyên cần và biểu đồ điểm số trước khi xuất.',
            placement: 'top'
        }
    ],
    diary: [
        {
            target: '.diary-filters',
            title: '🔍 Bộ Lọc Nhật Ký Buổi Học',
            desc: 'Lọc lịch sử bài giảng theo từng học sinh và theo tháng để theo dõi tiến độ chi tiết.',
            placement: 'bottom'
        },
        {
            target: '#tutorQuickAnnouncementWidget',
            title: '📢 Thông Báo Nhanh Cho Phụ Huynh',
            desc: 'Gửi tin nhắn, lời dặn dò hoặc thông báo dời/nghỉ học nhanh chóng đến phụ huynh và học sinh.',
            placement: 'bottom'
        },
        {
            target: '#tutorHomeworkSection',
            title: '📝 Quản Lý Bài Tập Về Nhà',
            desc: 'Giao bài tập mới (đính kèm ảnh, file Word/PDF hoặc link), hẹn ngày nộp bài và xem/chấm điểm bài học sinh đã nộp.',
            placement: 'bottom'
        },
        {
            target: '.schedule-section',
            title: '📋 Lịch Sử Học & Thêm Buổi Học Mới',
            desc: 'Bấm nút "Thêm buổi học" để điểm danh, ghi nhận xét buổi dạy và chấm điểm đầu giờ/định kỳ cho học sinh.',
            placement: 'top'
        }
    ],
    calendar: [
        {
            target: '.calendar-embed-wrapper',
            title: '📅 Bảng Lịch Dạy Toàn Diện',
            desc: 'Xem trực quan toàn bộ các ca dạy trong tuần và tháng với màu sắc riêng biệt cho từng em học sinh.',
            placement: 'bottom'
        },
        {
            target: '#tutorCalendarIframe',
            title: '⚡ Thao Tác Trực Tiếp Trên Lịch',
            desc: 'Bấm vào bất kỳ ca học nào để xem chi tiết, đổi giờ dạy, đổi ngày học hoặc báo nghỉ chỉ với 1 cú nhấp chuột.',
            placement: 'top'
        }
    ],
    students: [
        {
            target: '.students-toolbar-actions',
            title: '➕ Thêm & Quản Lý Học Sinh',
            desc: 'Bấm "Thêm học sinh" để nhập thông tin học sinh mới, hoặc vào "Thùng rác" để khôi phục học sinh đã xóa.',
            placement: 'bottom'
        },
        {
            target: '#tutorStudentsGrid',
            title: '📇 Thẻ Hồ Sơ Học Sinh Chi Tiết',
            desc: 'Mỗi thẻ hiển thị tiến độ bài học, chuyên cần, lịch học cố định, ghi chú và các nút thao tác: Sửa thông tin, Vào nhật ký, Xóa.',
            placement: 'top'
        }
    ],
    tuition: [
        {
            target: '.tuition-filters',
            title: '📅 Lọc Kỳ Học Phí',
            desc: 'Chọn xem học phí theo từng tháng hoặc tất cả các tháng để theo dõi thu chi rõ ràng.',
            placement: 'bottom'
        },
        {
            target: '.tuition-banner-grid',
            title: '💰 3 Thẻ Tổng Quan Thu Nhập',
            desc: 'Theo dõi tổng thu dự kiến (số buổi × đơn giá), tổng tiền đã thanh toán và khoản học phí còn phải thu.',
            placement: 'bottom'
        },
        {
            target: '#tuitionTable, #tuitionMobileList',
            title: '🧾 Danh Sách Học Phí & Hóa Đơn e-Receipt',
            desc: 'Xem tình trạng đóng học phí từng học sinh, bấm nút "Hóa đơn" để tạo phiếu học phí kèm mã VietQR gửi phụ huynh.',
            placement: 'top'
        }
    ],
    invoice: [
        {
            target: '.tuition-template-pills',
            title: '🎨 Chọn Mẫu Phiếu (Mẫu 1 & Mẫu 2)',
            desc: 'Chuyển đổi linh hoạt giữa Mẫu 1 (chi tiết từng buổi học, chuyên cần, bài tập về nhà) và Mẫu 2 (tinh gọn, hiện đại, hiển thị lịch học và mã QR thanh toán).',
            placement: 'bottom'
        },
        {
            target: '#tuitionBoxStudentInfo',
            title: '⚙️ Bật / Tắt Các Mục Hiển Thị',
            desc: 'Chủ động bật hoặc tắt các thông tin bạn muốn hiển thị trên phiếu: Tên học sinh, Lớp/Môn, Học phí, Số buổi học, Ngày học, Chiết khấu, Phụ thu và Mã QR.',
            placement: 'right'
        },
        {
            target: '#tuitionBoxPeriodInfo',
            title: '📅 Kỳ Học & Tự Động Tính Học Phí',
            desc: 'Chọn khoảng thời gian (Từ ngày - Đến ngày) để hệ thống tự đếm số buổi học, số giờ và tính học phí chính xác; hoặc tùy chỉnh tiêu đề kỳ học theo ý bạn.',
            placement: 'right'
        },
        {
            target: '#tuitionInvoicePreviewCol',
            title: '👁️ Xem Trước Trực Tiếp (Live Preview)',
            desc: 'Phiếu học tập tự động cập nhật ngay khi bạn thay đổi thông tin ở cột trái. Với Mẫu 2, bạn còn có thể nhấp trực tiếp vào phần nhận xét để sửa lời dặn dò!',
            placement: 'left'
        },
        {
            target: '#btnTuitionPromptAI',
            title: '✨ Nút Tạo Prompt AI Nhận Xét',
            desc: 'Tự động tổng hợp dữ liệu 30 ngày qua (điểm số, chuyên cần, bài tập) thành mẫu Prompt AI hoàn chỉnh chuẩn bố cục 3 phần. Chỉ cần bấm để sao chép rồi dán vào ChatGPT / Gemini!',
            placement: 'top'
        },
        {
            target: '.tuition-modal-footer',
            title: '🚀 Xuất Phiếu & Gửi Phụ Huynh',
            desc: 'Dễ dàng "Lưu bản nháp" để sửa tiếp sau này, "Xuất PDF" in ấn, "Copy ảnh" để dán ngay (Ctrl+V) vào Zalo/Messenger, hoặc "Xuất phiếu (ảnh)" gửi phụ huynh.',
            placement: 'top'
        }
    ]
};

// Hướng dẫn riêng biệt chuẩn theo giao diện Điện thoại (Mobile)
var tabOnboardingStepsMobile = {
    overview: [
        {
            target: '#tutorKpiGrid',
            title: '📊 Chỉ số Tổng quan',
            desc: 'Theo dõi nhanh tổng số học sinh, số buổi đã dạy, tổng giờ dạy và học phí dự kiến trong tháng ngay trên màn hình chính.',
            placement: 'bottom'
        },
        {
            target: '.tutor-mobile-menu-btn',
            title: '☰ Menu Quản Lý Lớp Học',
            desc: 'Chạm vào nút Menu 3 gạch ở góc trên bên trái để mở danh mục các mục: Báo cáo, Nhật ký, Lịch dạy, Học sinh và Học phí.',
            placement: 'bottom'
        },
        {
            target: '#mobileBtnTheme, #sidebarBtnTheme',
            title: '🎨 Đổi Giao Diện & Màu Sắc',
            desc: 'Chạm vào biểu tượng bảng màu ở góc trên để chọn hơn 30 phong cách giao diện (Sáng, Tối, Pastel, Hiện đại...) theo sở thích cá nhân.',
            placement: 'bottom'
        },
        {
            target: '#mobileBtnAccount, #sidebarBtnAccount',
            title: '👤 Quản Lý Tài Khoản & VietQR',
            desc: 'Chạm vào biểu tượng tài khoản để cập nhật họ tên, ảnh đại diện và ảnh mã QR ngân hàng để tự động tạo mã VietQR trên phiếu học tập.',
            placement: 'bottom'
        },
        {
            target: '#mobileBtnSettings, #sidebarBtnSettings',
            title: '⚙️ Cài Đặt & Hướng Dẫn',
            desc: 'Chạm vào biểu tượng bánh răng để bật/tắt chuông báo hoặc xem lại hướng dẫn sử dụng của bất kỳ mục nào mỗi khi bạn cần.',
            placement: 'bottom'
        },
        {
            target: '#tutorUpcomingScheduleBox',
            title: '📅 Lịch Dạy Sắp Tới',
            desc: 'Xem nhanh danh sách các ca dạy hôm nay và ngày mai được sắp xếp gọn gàng theo dạng thẻ trên điện thoại.',
            placement: 'top'
        },
        {
            target: '#revenueBarChartBox',
            title: '📈 Thống Kê & Biểu Đồ',
            desc: 'Vuốt xuống dưới để xem biểu đồ trực quan hóa doanh thu và số giờ dạy theo từng tháng giúp bạn dễ dàng theo dõi tiến độ.',
            placement: 'top'
        }
    ],
    reports: [
        {
            target: '.report-filter-toolbar',
            title: '📊 Bộ Lọc Báo Cáo',
            desc: 'Chọn khoảng thời gian (Từ ngày - Đến ngày) và chọn học sinh cụ thể để tổng hợp kết quả học tập.',
            placement: 'bottom'
        },
        {
            target: '.report-actions',
            title: '📸 Xuất Báo Cáo Gửi Phụ Huynh',
            desc: 'Chạm để xuất ảnh PNG sắc nét hoặc tải file PDF để gửi trực tiếp cho phụ huynh qua Zalo, Messenger.',
            placement: 'bottom'
        },
        {
            target: '#reportPreviewContainer',
            title: '👁️ Xem Trước Báo Cáo Trực Quan',
            desc: 'Vuốt xuống dưới để xem toàn bộ nhận xét, số buổi học, tỷ lệ chuyên cần và biểu đồ điểm số trước khi xuất.',
            placement: 'top'
        }
    ],
    diary: [
        {
            target: '.diary-filters',
            title: '🔍 Bộ Lọc Nhật Ký Buổi Học',
            desc: 'Lọc lịch sử bài giảng theo từng học sinh và theo tháng để theo dõi tiến độ chi tiết.',
            placement: 'bottom'
        },
        {
            target: '#tutorQuickAnnouncementWidget',
            title: '📢 Thông Báo Nhanh Cho Phụ Huynh',
            desc: 'Chạm để gửi tin nhắn, lời dặn dò hoặc thông báo dời/nghỉ học nhanh chóng đến phụ huynh và học sinh.',
            placement: 'bottom'
        },
        {
            target: '#tutorHomeworkSection',
            title: '📝 Quản Lý Bài Tập Về Nhà',
            desc: 'Giao bài tập mới (đính kèm ảnh, file Word/PDF hoặc liên kết), hẹn ngày nộp bài và xem, chấm điểm bài học sinh đã nộp.',
            placement: 'bottom'
        },
        {
            target: '.schedule-section',
            title: '📋 Lịch Sử Học & Thêm Buổi Học',
            desc: 'Chạm nút "Thêm buổi học" để điểm danh, ghi nhận xét bài giảng và chấm điểm buổi học cho học sinh.',
            placement: 'top'
        }
    ],
    calendar: [
        {
            target: '.calendar-embed-wrapper',
            title: '📅 Bảng Lịch Dạy Dạng Di Động',
            desc: 'Xem trực quan toàn bộ các ca dạy trong tuần và tháng với màu sắc riêng biệt cho từng em học sinh, tối ưu hiển thị vừa vặn trên điện thoại.',
            placement: 'bottom'
        },
        {
            target: '#tutorCalendarIframe',
            title: '⚡ Thao Tác Trực Tiếp Trên Lịch',
            desc: 'Chạm vào bất kỳ ca học nào để xem chi tiết, đổi giờ dạy, đổi ngày học hoặc báo nghỉ một cách nhanh chóng.',
            placement: 'top'
        }
    ],
    students: [
        {
            target: '.students-toolbar-actions',
            title: '➕ Thêm & Quản Lý Học Sinh',
            desc: 'Chạm "Thêm học sinh" để nhập thông tin học sinh mới, hoặc vào "Thùng rác" để khôi phục học sinh đã xóa.',
            placement: 'bottom'
        },
        {
            target: '#tutorStudentsGrid',
            title: '📇 Danh Sách Thẻ Học Sinh',
            desc: 'Mỗi thẻ hiển thị tiến độ bài học, chuyên cần, lịch học, ghi chú và các nút thao tác: Sửa thông tin, Vào nhật ký hoặc Phiếu học phí.',
            placement: 'top'
        }
    ],
    tuition: [
        {
            target: '.tuition-filters',
            title: '📅 Lọc Kỳ Học Phí',
            desc: 'Chọn xem học phí theo từng tháng hoặc tất cả các tháng để theo dõi thu chi rõ ràng.',
            placement: 'bottom'
        },
        {
            target: '.tuition-banner-grid',
            title: '💰 3 Thẻ Tổng Quan Thu Nhập',
            desc: 'Theo dõi tổng thu dự kiến, tổng tiền đã thanh toán và khoản học phí còn phải thu.',
            placement: 'bottom'
        },
        {
            target: '#tuitionMobileList, #tuitionTable',
            title: '🧾 Danh Sách Học Phí Dạng Thẻ',
            desc: 'Xem tình trạng đóng học phí từng học sinh trên điện thoại, chạm nút "Hóa đơn" để tạo phiếu học tập kèm mã VietQR gửi phụ huynh.',
            placement: 'top'
        }
    ],
    invoice: [
        {
            target: '.tuition-template-pills',
            title: '🎨 Chọn Mẫu Phiếu Học Tập',
            desc: 'Chuyển đổi linh hoạt giữa Mẫu 1 (chi tiết từng buổi học, chuyên cần, bài tập về nhà) và Mẫu 2 (tinh gọn, hiện đại, hiển thị lịch học và mã QR thanh toán).',
            placement: 'bottom'
        },
        {
            target: '#tuitionBoxStudentInfo',
            title: '⚙️ Bật / Tắt Các Mục Hiển Thị',
            desc: 'Chủ động bật hoặc tắt các thông tin bạn muốn hiển thị trên phiếu: Tên học sinh, Lớp/Môn, Học phí, Số buổi học, Ngày học, Chiết khấu, Phụ thu và Mã QR.',
            placement: 'bottom'
        },
        {
            target: '#tuitionBoxPeriodInfo',
            title: '📅 Kỳ Học & Tự Động Tính Học Phí',
            desc: 'Chọn khoảng thời gian (Từ ngày - Đến ngày) để hệ thống tự đếm số buổi học, số giờ và tính học phí chính xác.',
            placement: 'bottom'
        },
        {
            target: '#tuitionInvoicePreviewCol',
            title: '👁️ Xem Trước Trực Tiếp Phiếu Học Tập',
            desc: 'Cuộn xuống dưới để xem trước phiếu học tập tự động cập nhật ngay khi bạn thay đổi thông tin. Với Mẫu 2, bạn có thể chạm trực tiếp vào phần nhận xét để sửa lời dặn dò!',
            placement: 'top'
        },
        {
            target: '#btnTuitionPromptAI',
            title: '✨ Nút Tạo Prompt AI Nhận Xét',
            desc: 'Tự động tổng hợp dữ liệu 30 ngày qua (điểm số, chuyên cần, bài tập) thành mẫu Prompt AI hoàn chỉnh chuẩn bố cục 3 phần. Chỉ cần chạm để sao chép rồi dán vào ChatGPT / Gemini trên điện thoại!',
            placement: 'top'
        },
        {
            target: '.tuition-modal-footer',
            title: '🚀 Xuất Phiếu & Gửi Phụ Huynh',
            desc: 'Dễ dàng "Lưu bản nháp" để sửa tiếp sau này, "Xuất PDF", hoặc chạm "Copy ảnh" để dán gửi ngay cho phụ huynh qua Zalo, Messenger.',
            placement: 'top'
        }
    ]
};

function getTabOnboardingSteps(tabKey) {
    var isMobile = (window.innerWidth <= 768);
    if (isMobile && tabOnboardingStepsMobile && tabOnboardingStepsMobile[tabKey]) {
        return tabOnboardingStepsMobile[tabKey];
    }
    return tabOnboardingSteps[tabKey] || [];
}
window.getTabOnboardingSteps = getTabOnboardingSteps;

function getCurrentActiveTutorTab() {
    var invModal = document.getElementById('tutorTuitionInvoiceModal');
    if (invModal && invModal.style.display !== 'none') {
        return 'invoice';
    }
    var activeItem = document.querySelector('.sidebar-nav-item.active');
    if (activeItem && activeItem.dataset.tab) {
        return activeItem.dataset.tab;
    }
    var sections = ['overview', 'reports', 'diary', 'calendar', 'students', 'tuition'];
    for (var i = 0; i < sections.length; i++) {
        var sec = document.getElementById('tutorSection' + sections[i].charAt(0).toUpperCase() + sections[i].slice(1));
        if (sec && sec.style.display !== 'none') {
            return sections[i];
        }
    }
    return 'overview';
}
window.getCurrentActiveTutorTab = getCurrentActiveTutorTab;

function shouldShowTabOnboarding(tabKey) {
    var steps = getTabOnboardingSteps(tabKey);
    if (!steps || steps.length === 0) return false;
    var phone = (tutorDataGlobal && tutorDataGlobal.tutorPhone) ? tutorDataGlobal.tutorPhone : (currentTutorPhone || 'default');
    if (tabKey === 'overview' && localStorage.getItem('tutorOnboarded_' + phone) === 'true') {
        return false;
    }
    return localStorage.getItem('tutorOnboarded_' + tabKey + '_' + phone) !== 'true';
}
window.shouldShowTabOnboarding = shouldShowTabOnboarding;

function shouldShowOnboarding() {
    return shouldShowTabOnboarding('overview');
}
window.shouldShowOnboarding = shouldShowOnboarding;

function startTabOnboarding(tabKey, force) {
    var steps = getTabOnboardingSteps(tabKey);
    if (!steps || steps.length === 0) return;
    if (!force && !shouldShowTabOnboarding(tabKey)) return;

    currentOnboardingTab = tabKey;
    currentOnboardingStep = 0;
    onboardingSteps = steps;

    var overlay = document.getElementById('onboardingOverlay');
    if (overlay) overlay.style.display = 'block';

    window.addEventListener('resize', updateOnboardingPositions);
    window.addEventListener('scroll', updateOnboardingPositions, true);

    showOnboardingStep(0);
}
window.startTabOnboarding = startTabOnboarding;

function startOnboarding() {
    startTabOnboarding('overview', true);
}
window.startOnboarding = startOnboarding;

function isElementVisibleInViewportFlow(el) {
    if (!el) return false;
    var style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        return false;
    }
    var rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    // Bỏ qua các phần tử bị ẩn lệch hoàn toàn ra ngoài lề trái hoặc lề phải (ví dụ sidebar desktop trên mobile có left: -290px)
    if (rect.right <= 0 || rect.left >= window.innerWidth) {
        return false;
    }
    return true;
}

function getOnboardingTargetElement(targetSelector) {
    if (!targetSelector) return null;
    var els = document.querySelectorAll(targetSelector);
    // Ưu tiên phần tử thực sự hiển thị trên màn hình hiện tại (Mobile/Desktop)
    for (var i = 0; i < els.length; i++) {
        var el = els[i];
        if (isElementVisibleInViewportFlow(el)) {
            return el;
        }
    }
    // Dự phòng kiểm tra offsetParent & chiều cao > 0
    for (var j = 0; j < els.length; j++) {
        var el2 = els[j];
        if (el2 && el2.offsetParent !== null && el2.getBoundingClientRect().height > 0) {
            return el2;
        }
    }
    return document.querySelector(targetSelector);
}

function updateOnboardingPositions() {
    if (currentOnboardingStep < 0 || currentOnboardingStep >= onboardingSteps.length) return;
    var step = onboardingSteps[currentOnboardingStep];
    var targetEl = getOnboardingTargetElement(step.target);
    var spotlight = document.getElementById('onboardingSpotlight');
    var tooltip = document.getElementById('onboardingTooltip');

    if (!targetEl || !tooltip) {
        if (spotlight) spotlight.style.display = 'none';
        if (tooltip) {
            tooltip.style.top = '50%';
            tooltip.style.left = '50%';
            tooltip.style.transform = 'translate(-50%, -50%)';
        }
        return;
    }

    var rect = targetEl.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
        if (spotlight) spotlight.style.display = 'none';
        if (tooltip) {
            tooltip.style.top = '50%';
            tooltip.style.left = '50%';
            tooltip.style.transform = 'translate(-50%, -50%)';
        }
        return;
    }

    var isMobile = (window.innerWidth <= 768);
    var pad = isMobile ? 6 : 8;

    // Khoét lỗ sáng trực tiếp quanh phần tử mục tiêu (sáng rõ nét 100%, không mờ che chữ)
    if (spotlight) {
        spotlight.style.display = 'block';
        spotlight.style.top = Math.max(0, rect.top - pad) + 'px';
        spotlight.style.left = Math.max(0, rect.left - pad) + 'px';
        spotlight.style.width = (rect.width + pad * 2) + 'px';
        spotlight.style.height = (rect.height + pad * 2) + 'px';
        if (isMobile && rect.width < 50 && rect.height < 50 && Math.abs(rect.width - rect.height) < 12) {
            spotlight.style.borderRadius = '50%';
        } else {
            spotlight.style.borderRadius = isMobile ? '12px' : '16px';
        }
    }

    // Căn vị trí Tooltip
    tooltip.style.transform = 'none';

    if (isMobile) {
        var viewportHeight = window.innerHeight;
        var tooltipH = tooltip.offsetHeight || 160;
        var targetCenterY = rect.top + (rect.height / 2);

        // Nếu phần tử mục tiêu nằm ở nửa dưới màn hình hoặc chiếm đáy:
        // Đặt tooltip ở phía TRÊN đỉnh màn hình (top: 16px) để KHÔNG che lấp phần tử đang hướng dẫn!
        if (targetCenterY > viewportHeight * 0.45 || rect.bottom > viewportHeight - tooltipH - 24) {
            tooltip.style.top = '16px';
            tooltip.style.bottom = 'auto';
        } else {
            // Ngược lại nếu mục tiêu ở phía trên (menu bar, header...), đặt tooltip ở ĐÁY (bottom: 16px)
            tooltip.style.top = 'auto';
            tooltip.style.bottom = '16px';
        }
        tooltip.style.left = '16px';
        tooltip.style.right = '16px';
        tooltip.style.width = 'calc(100vw - 32px)';
        tooltip.style.maxWidth = 'calc(100vw - 32px)';
        return;
    }

    // --- Căn vị trí Tooltip trên Desktop ---
    var tooltipWidth = Math.min(380, window.innerWidth - 40);
    var tooltipHeight = tooltip.offsetHeight || 180;
    tooltip.style.bottom = 'auto';
    tooltip.style.right = 'auto';
    tooltip.style.width = tooltipWidth + 'px';
    tooltip.style.maxWidth = '380px';

    var top = 0;
    var left = 0;

    if (step.placement === 'bottom') {
        top = rect.bottom + 16;
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
    } else if (step.placement === 'top') {
        top = rect.top - tooltipHeight - 16;
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
    } else if (step.placement === 'right') {
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        left = rect.right + 16;
    } else if (step.placement === 'left') {
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        left = rect.left - tooltipWidth - 16;
    } else {
        top = rect.bottom + 16;
        left = rect.left;
    }

    // Tự động lật lên phía trên nếu tràn viền dưới màn hình
    if (top + tooltipHeight > window.innerHeight - 20) {
        if (rect.top - tooltipHeight - 16 > 20) {
            top = rect.top - tooltipHeight - 16;
        } else {
            top = window.innerHeight - tooltipHeight - 20;
        }
    }
    if (top < 20) top = 20;
    if (left < 20) left = 20;
    if (left + tooltipWidth > window.innerWidth - 20) {
        left = window.innerWidth - tooltipWidth - 20;
    }

    tooltip.style.top = top + 'px';
    tooltip.style.left = left + 'px';
}
window.updateOnboardingPositions = updateOnboardingPositions;

function showOnboardingStep(idx) {
    if (idx < 0 || idx >= onboardingSteps.length) {
        finishOnboarding();
        return;
    }
    currentOnboardingStep = idx;
    var step = onboardingSteps[idx];

    var targetEl = getOnboardingTargetElement(step.target);
    var stepCount = document.getElementById('onboardingStepCount');
    var titleEl = document.getElementById('onboardingTitle');
    var descEl = document.getElementById('onboardingDesc');
    var prevBtn = document.getElementById('onboardingPrevBtn');
    var nextBtn = document.getElementById('onboardingNextBtn');

    var tabLabel = TAB_NAMES[currentOnboardingTab] || 'Hướng dẫn';
    if (stepCount) stepCount.innerText = tabLabel + ' · Bước ' + (idx + 1) + ' / ' + onboardingSteps.length;
    if (titleEl) titleEl.innerText = step.title;
    if (descEl) descEl.innerText = step.desc;

    if (prevBtn) {
        prevBtn.style.visibility = (idx === 0) ? 'hidden' : 'visible';
    }
    if (nextBtn) {
        nextBtn.innerHTML = (idx === onboardingSteps.length - 1) 
            ? 'Hoàn thành <i class="fa-solid fa-check"></i>' 
            : 'Tiếp <i class="fa-solid fa-arrow-right"></i>';
    }

    if (targetEl) {
        try {
            var isMobile = (window.innerWidth <= 768);
            if (isMobile && targetEl.closest && targetEl.closest('.tutor-mobile-header')) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                targetEl.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: isMobile ? 'center' : 'nearest' 
                });
            }
        } catch(e) {}
    }

    // Đính kèm touch swipe trên điện thoại nếu chưa có
    var tooltip = document.getElementById('onboardingTooltip');
    if (tooltip && !tooltip.dataset.hasSwipeListener) {
        tooltip.dataset.hasSwipeListener = 'true';
        var touchStartX = 0;
        var touchStartY = 0;
        tooltip.addEventListener('touchstart', function(e) {
            if (e.changedTouches && e.changedTouches[0]) {
                touchStartX = e.changedTouches[0].clientX;
                touchStartY = e.changedTouches[0].clientY;
            }
        }, { passive: true });
        tooltip.addEventListener('touchend', function(e) {
            if (e.changedTouches && e.changedTouches[0]) {
                var diffX = e.changedTouches[0].clientX - touchStartX;
                var diffY = e.changedTouches[0].clientY - touchStartY;
                if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY) * 1.4) {
                    if (diffX < 0) {
                        nextOnboardingStep();
                    } else {
                        prevOnboardingStep();
                    }
                }
            }
        }, { passive: true });
    }

    updateOnboardingPositions();
    setTimeout(updateOnboardingPositions, 150);
    setTimeout(updateOnboardingPositions, 350);
    setTimeout(updateOnboardingPositions, 600);
}
window.showOnboardingStep = showOnboardingStep;

function nextOnboardingStep() {
    if (currentOnboardingStep < onboardingSteps.length - 1) {
        showOnboardingStep(currentOnboardingStep + 1);
    } else {
        finishOnboarding();
    }
}
window.nextOnboardingStep = nextOnboardingStep;

function prevOnboardingStep() {
    if (currentOnboardingStep > 0) {
        showOnboardingStep(currentOnboardingStep - 1);
    }
}
window.prevOnboardingStep = prevOnboardingStep;

function skipOnboarding() {
    finishOnboarding();
}
window.skipOnboarding = skipOnboarding;

function finishOnboarding(silent) {
    var overlay = document.getElementById('onboardingOverlay');
    if (overlay) overlay.style.display = 'none';
    var spotlight = document.getElementById('onboardingSpotlight');
    if (spotlight) spotlight.style.display = 'none';

    window.removeEventListener('resize', updateOnboardingPositions);
    window.removeEventListener('scroll', updateOnboardingPositions, true);

    var phone = (tutorDataGlobal && tutorDataGlobal.tutorPhone) ? tutorDataGlobal.tutorPhone : (currentTutorPhone || 'default');
    localStorage.setItem('tutorOnboarded_' + currentOnboardingTab + '_' + phone, 'true');
    if (currentOnboardingTab === 'overview') {
        localStorage.setItem('tutorOnboarded_' + phone, 'true');
    }

    if (!silent) {
        var tabLabel = TAB_NAMES[currentOnboardingTab] || 'mục này';
        showToast('Đã xem xong hướng dẫn phần ' + tabLabel + '!', 'success');
    }
}
window.finishOnboarding = finishOnboarding;

function restartOnboarding(resetAll) {
    closeSettingsModal();
    var phone = (tutorDataGlobal && tutorDataGlobal.tutorPhone) ? tutorDataGlobal.tutorPhone : (currentTutorPhone || 'default');
    
    if (resetAll) {
        var allKeys = Object.keys(tabOnboardingSteps);
        if (typeof tabOnboardingStepsMobile === 'object') {
            Object.keys(tabOnboardingStepsMobile).forEach(function(k) {
                if (allKeys.indexOf(k) === -1) allKeys.push(k);
            });
        }
        allKeys.forEach(function(k) {
            localStorage.removeItem('tutorOnboarded_' + k + '_' + phone);
        });
        localStorage.removeItem('tutorOnboarded_' + phone);
        if (typeof switchTutorNavTab === 'function') {
            switchTutorNavTab(document.querySelector('.sidebar-nav-item[data-tab="overview"]'), 'overview');
        }
        setTimeout(function() {
            startTabOnboarding('overview', true);
        }, 350);
        showToast('Đã đặt lại hướng dẫn cho tất cả các mục!', 'info');
    } else {
        var currentTab = getCurrentActiveTutorTab();
        localStorage.removeItem('tutorOnboarded_' + currentTab + '_' + phone);
        startTabOnboarding(currentTab, true);
    }
}
window.restartOnboarding = restartOnboarding;

function startInvoiceOnboarding(force) {
    if (typeof startTabOnboarding === 'function') {
        startTabOnboarding('invoice', force !== false);
    }
}
window.startInvoiceOnboarding = startInvoiceOnboarding;



