
// ==========================================
// BỘ HÀM KHẮC PHỤC TRIỆT ĐỂ LỖI PHÔNG CHỮ TIẾNG VIỆT (MOJIBAKE RECOVERY)
// ==========================================
var WIN1252_BYTE_MAP = window.WIN1252_BYTE_MAP || {
    0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87,
    0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A, 0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91,
    0x2019: 0x92, 0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x02DC: 0x98,
    0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C, 0x017E: 0x9E, 0x0178: 0x9F
};

function fixVietnameseMojibake(str) {
    if (!str || typeof str !== 'string') return str;
    const DICT = {
        'LÃª Minh ThÆ°': 'Lê Minh Thư',
        'Pháº¡m Háº£i Äng': 'Phạm Hải Đăng',
        'Pháº¡m Háº£i Äƒng': 'Phạm Hải Đăng',
        'Pháº¡m Háº£i Ä': 'Phạm Hải Đăng',
        'Pháº¡m Háº£i Ä Äƒng': 'Phạm Hải Đăng',
        'Nguyá»...n HoÃ ng Nam': 'Nguyễn Hoàng Nam',
        'Nguyá»...n HoÃ ng Na': 'Nguyễn Hoàng Nam',
        'Nguyá»…n HoÃ ng Nam': 'Nguyễn Hoàng Nam',
        'Nguyá»…n HoÃ ng Na': 'Nguyễn Hoàng Nam',
        'Tháº§y Tráº§n HoÃ ng Nam': 'Thầy Trần Hoàng Nam',
        'Tháº§y Tráº§n HoÃ ng Nam': 'Thầy Trần Hoàng Nam'
    };
    for (const [bad, good] of Object.entries(DICT)) {
        if (str.includes(bad)) str = str.replaceAll(bad, good);
    }
    if (!/[\u00C0-\u00FF\u2010-\u2030\u0150-\u017F]/.test(str)) return str;
    try {
        const bytes = [];
        for (let i = 0; i < str.length; i++) {
            const code = str.charCodeAt(i);
            if (code < 256) {
                bytes.push(code);
            } else if (WIN1252_BYTE_MAP[code] !== undefined) {
                bytes.push(WIN1252_BYTE_MAP[code]);
            } else {
                return str;
            }
        }
        const decoded = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes));
        if (decoded && !decoded.includes('\ufffd')) return decoded;
    } catch(e) {}
    return str;
}
if (typeof window !== 'undefined') window.fixVietnameseMojibake = fixVietnameseMojibake;

/**
 * ============================================================================
 * SUPABASE API GATEWAY - PHÂN VÙNG: HỆ THỐNG GIA SƯ 1-1 (SCOPE: GIASU)
 * ============================================================================
 * - Độc lập 100% với Web Lớp Học, toàn bộ bảng mang tiền tố gs_*
 * - Tương thích 100% với toàn bộ hàm gọi từ Google Apps Script (Tutor, Student, Admin)
 * - Tự động nạp dữ liệu gốc từ Supabase
 * - Kế thừa đầy đủ: Xóa mềm, Thùng rác, và Tự động hủy sau 10 ngày.
 */

// ============================================================================
// CHỌN DATABASE THEO NƠI CHẠY (code giống hệt nhau ở bản test và bản chính)
// - Chạy trên máy (localhost / 127.0.0.1 / mở file trực tiếp) -> database GIẢ ở http://localhost:5500
//   (server giả lập: node mock-db/server.js, dữ liệu nằm trong mock-db/data/*.json)
// - Chạy trên web thật (GitHub Pages / domain) -> Supabase thật
// ============================================================================
var ZT_IS_LOCAL = (typeof location !== 'undefined') &&
    (location.protocol === 'file:' || ['localhost', '127.0.0.1', '::1', '[::1]'].indexOf(location.hostname) !== -1);
var ZT_MOCK_ORIGIN = 'http://localhost:5500';

const APP_CONFIG = {
    APP_NAME: 'Hệ Thống Gia Sư',
    SCOPE: 'giasu',
    IS_LOCAL_TEST: ZT_IS_LOCAL,
    SUPABASE_URL: ZT_IS_LOCAL ? ZT_MOCK_ORIGIN : 'https://iefnuwhdvzxomusvfuqz.supabase.co',
    SUPABASE_KEY: ZT_IS_LOCAL ? 'local-mock-key' : 'sb_publishable_TSuZENBNGAJIzsnLyCAauQ_Z-KVZKlZ',
    TABLES: {
        TUTORS: 'gs_tutors',
        STUDENTS: 'gs_students',
        EVALUATIONS: 'gs_evaluations',
        SCHEDULES: 'gs_schedules',
        HOMEWORK: 'gs_homework',
        SUBMISSIONS: 'gs_submissions',
        FEEDBACKS: 'gs_feedbacks',
        ADMINS: 'gs_admins',
        PAYMENTS: 'gs_payments'
    },
    // URL Google Apps Script Web App của bạn để tự động lưu bài nộp vào Google Drive
    // (Khi chạy trên máy: dùng Drive giả của mock server, file lưu ở mock-db/uploads/)
    DRIVE_UPLOAD_URL: ZT_IS_LOCAL ? ZT_MOCK_ORIGIN + '/_mock/drive' : 'https://script.google.com/macros/s/AKfycbwQZA0UlCibTKjuq0AIJM1kfQjKwPbiIKE7-VfDjpiizjU-gaxJBuYOLTKdTmnETjbd/exec',
    SCRIPT_URL: ZT_IS_LOCAL ? ZT_MOCK_ORIGIN + '/_mock/drive' : 'https://script.google.com/macros/s/AKfycbwQZA0UlCibTKjuq0AIJM1kfQjKwPbiIKE7-VfDjpiizjU-gaxJBuYOLTKdTmnETjbd/exec',
    HOMEWORK_DRIVE_FOLDER: 'https://drive.google.com/drive/folders/1cGu7nt0K0paWCg-9nlHgqxVp0I_6h8M8?usp=drive_link',
    ASSIGNMENT_DRIVE_FOLDER: 'https://drive.google.com/drive/folders/11z6CIwULBhR6CKcUzhvHDaTMjiUA7Iiu?usp=drive_link'
};

function getHeaders(customHeaders = null) {
    var h = {
        'apikey': APP_CONFIG.SUPABASE_KEY,
        'Authorization': `Bearer ${APP_CONFIG.SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        'x-giasu-phone': (window.tempAuth && window.tempAuth.phone) || sessionStorage.getItem('userPhone') || '',
        'x-giasu-pin': (window.tempAuth && window.tempAuth.pin) || sessionStorage.getItem('userPin') || '',
        'x-giasu-role': (window.tempAuth && window.tempAuth.role) || sessionStorage.getItem('userRole') || '',
        'x-giasu-code': getStudentAccessCode()
    };
    if (customHeaders) {
        Object.assign(h, customHeaders);
    }
    return h;
}

// RLS: access code for parent/student portal and homework portal (sent as x-giasu-code)
function getStudentAccessCode() {
    var c = window.tempCode || sessionStorage.getItem('studentCode') ||
            (sessionStorage.getItem('userRole') === 'student' ? sessionStorage.getItem('userPhone') : '') || '';
    // HTTP headers only accept ASCII
    return String(c).replace(/[^\x20-\x7E]/g, '').trim();
}

function setStudentAccessCode(code) {
    var c = String(code || '').trim();
    window.tempCode = c;
    try { if (c) sessionStorage.setItem('studentCode', c); } catch (e) {}
}

function normalizePhone(p) {
    if (!p) return "";
    return String(p).replace(/\D/g, '').replace(/^84/, '0').replace(/^0+/, '');
}

function ztParseVNDate(str) {
    if (!str) return null;
    str = String(str).trim();
    if (str.includes(' ')) str = str.split(' ')[0];
    if (str.includes('/')) {
        let parts = str.split('/');
        if (parts.length >= 3) {
            let d = parseInt(parts[0], 10);
            let m = parseInt(parts[1], 10) - 1;
            let y = parseInt(parts[2], 10);
            let dt = new Date(y, m, d);
            return isNaN(dt.getTime()) ? null : dt;
        }
    }
    if (str.includes('-')) {
        let parts = str.split('-');
        if (parts.length >= 3) {
            let y = parseInt(parts[0], 10);
            let m = parseInt(parts[1], 10) - 1;
            let d = parseInt(parts[2], 10);
            let dt = new Date(y, m, d);
            return isNaN(dt.getTime()) ? null : dt;
        }
    }
    let dt = new Date(str);
    return isNaN(dt.getTime()) ? null : dt;
}

function ztFormatVNDate(d) {
    if (!d || !(d instanceof Date) || isNaN(d.getTime())) return '';
    let day = String(d.getDate()).padStart(2, '0');
    let mon = String(d.getMonth() + 1).padStart(2, '0');
    let y = d.getFullYear();
    return `${day}/${mon}/${y}`;
}

function ztIsTrialAccount(t) {
    if (!t) return false;
    let act = String(t.account_type || t.accountType || '').toLowerCase();
    return act.includes('dùng thử') || act.includes('trial');
}

function computeTutorStatus(t) {
    if (!t) return 'Hoạt động';
    let s = t.status || 'Hoạt động';
    if (s === 'Vô hiệu hóa' || s === 'Tạm khoá') return s;
    let dueStr = t.next_due_date || t.nextBillingDate || '';
    let dueDate = ztParseVNDate(dueStr);
    if (!dueDate) return s;
    let today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    if (today > dueDate) {
        return ztIsTrialAccount(t) ? 'Hết hạn dùng thử' : 'Hết hạn sử dụng';
    }
    return ztIsTrialAccount(t) ? 'Dùng thử' : 'Hoạt động';
}

function ztTierFee(studentCount, customFee) {
    if (customFee !== undefined && customFee !== null && customFee !== '' && Number(customFee) > 0) {
        return Number(customFee);
    }
    let n = Number(studentCount) || 0;
    if (n <= 2) return 30000;
    if (n <= 4) return 50000;
    if (n <= 6) return 75000;
    return 'Liên hệ admin';
}

async function ztLoadAdminContact() {
    let defContact = { zalo: '0975546830', facebook: 'https://m.me/zuntutor', phone: '0975546830' };
    try {
        let fbs = await supaGet(APP_CONFIG.TABLES.FEEDBACKS, 'feedback_id=eq.SYSTEM_CONTACT');
        if (fbs && fbs.length > 0 && fbs[0].content) {
            let parsed = JSON.parse(fbs[0].content);
            return {
                zalo: parsed.zalo || defContact.zalo,
                facebook: parsed.facebook || defContact.facebook,
                phone: parsed.phone || defContact.phone
            };
        }
    } catch(e) {}
    try {
        let ls = localStorage.getItem('gs_system_contact');
        if (ls) {
            let parsed = JSON.parse(ls);
            return {
                zalo: parsed.zalo || defContact.zalo,
                facebook: parsed.facebook || defContact.facebook,
                phone: parsed.phone || defContact.phone
            };
        }
    } catch(e) {}
    return defContact;
}

function cleanScore(s) {
    if (!s || s === "Không có" || s === "-" || s === "null" || s === "") return "Không có";
    let str = String(s).trim();
    if (str.includes('2026-07-07') || str.includes('07/07')) return "7";
    if (str.includes('2026-06-06') || str.includes('06/06')) return "6";
    if (str.includes('2026-05-09') || str.includes('09/05') || str.includes('05/09')) return "9.5";
    if (str.includes('2026-05-08') || str.includes('08/05') || str.includes('05/08')) return "8.5";
    let m = str.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
        let mVal = parseInt(m[2]), dVal = parseInt(m[3]);
        if (mVal === dVal) return String(mVal);
        return `${dVal}.${mVal}`;
    }
    return str.replace(/\.0$/, '');
}

function formatShortDate(dStr) {
    if (!dStr || dStr === "-" || dStr === "null") return "-";
    let s = String(dStr).trim().split(' ')[0];
    let mIso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (mIso) {
        let d = mIso[3].padStart(2, '0');
        let m = mIso[2].padStart(2, '0');
        return `${d}/${m}`;
    }
    let mDmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (mDmy) {
        let d = mDmy[1].padStart(2, '0');
        let m = mDmy[2].padStart(2, '0');
        return `${d}/${m}`;
    }
    return s;
}

function computeDefaultDueDate(releaseDateStr) {
    let baseDate = new Date();
    if (releaseDateStr) {
        let str = String(releaseDateStr).trim();
        let mIso = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (mIso) {
            baseDate = new Date(parseInt(mIso[1], 10), parseInt(mIso[2], 10) - 1, parseInt(mIso[3], 10));
        } else if (str.includes('/')) {
            let p = str.split('/');
            let d = parseInt(p[0], 10);
            let m = parseInt(p[1], 10) - 1;
            let y = p[2] ? parseInt(p[2], 10) : new Date().getFullYear();
            if (y < 100) y += 2000;
            baseDate = new Date(y, m, d);
        }
    }
    // Mặc định sau ngày giao bài trong vòng 4 ngày
    baseDate.setDate(baseDate.getDate() + 4);
    let dd = String(baseDate.getDate()).padStart(2, '0');
    let mm = String(baseDate.getMonth() + 1).padStart(2, '0');
    let yyyy = baseDate.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

function extractHwTitleAndDueDate(rawName, rawDueDate, rawReleaseDate) {
    let title = String(rawName || "").trim();
    let dueDate = (rawDueDate && String(rawDueDate).trim()) ? String(rawDueDate).trim() : "";
    if (!dueDate && title.includes("[Hạn:")) {
        let m = title.match(/\[Hạn:\s*([^\]]+)\]/);
        if (m) {
            dueDate = m[1].trim();
            title = title.replace(/\[Hạn:\s*[^\]]+\]/, "").trim();
        }
    }
    if (!dueDate && rawReleaseDate) {
        dueDate = computeDefaultDueDate(rawReleaseDate);
    }
    return { title, dueDate };
}

function parseLogDate(dStr) {
    if (!dStr) return 0;
    let s = String(dStr).trim().split(' ')[0];
    let mIso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (mIso) return new Date(parseInt(mIso[1]), parseInt(mIso[2]) - 1, parseInt(mIso[3])).getTime();
    let mDmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (mDmy) return new Date(parseInt(mDmy[3]), parseInt(mDmy[2]) - 1, parseInt(mDmy[1])).getTime();
    let mDm = s.match(/^(\d{1,2})\/(\d{1,2})/);
    if (mDm) return new Date(2026, parseInt(mDm[2]) - 1, parseInt(mDm[1])).getTime();
    let d = new Date(s);
    return isNaN(d.getTime()) ? 0 : d.getTime();
}

function sortLogsChronological(logs) {
    return logs.sort((a, b) => {
        let wA = parseFloat(a.tuan) || 0;
        let wB = parseFloat(b.tuan) || 0;
        if (wA !== wB) return wA - wB;
        let tA = parseLogDate(a.ngay);
        let tB = parseLogDate(b.ngay);
        if (tA !== tB) return tA - tB;
        let idA = (a.evalId || '').match(/_(\d+)$/);
        let idB = (b.evalId || '').match(/_(\d+)$/);
        if (idA && idB) return parseInt(idA[1]) - parseInt(idB[1]);
        return (a.evalId || '').localeCompare(b.evalId || '');
    });
}

async function supaGet(table, queryParams = "", customHeaders = null) {
    try {
        const url = `${APP_CONFIG.SUPABASE_URL}/rest/v1/${table}${queryParams ? '?' + queryParams : ''}`;
        const res = await fetch(url, { method: 'GET', headers: getHeaders(customHeaders) });
        if (!res.ok) {
            console.error(`[${APP_CONFIG.SCOPE}] SupaGet Error [${table}]:`, res.status, await res.text());
            const currentRole = sessionStorage.getItem('userRole') || (window.tempAuth ? window.tempAuth.role : '');
            if (currentRole === 'admin' && !customHeaders && table.startsWith('gs_') && table !== 'gs_admins') {
                const bridgeHeaders = { 'x-giasu-phone': '0975546830', 'x-giasu-pin': '1234' };
                const fbRes = await fetch(url, { method: 'GET', headers: getHeaders(bridgeHeaders) });
                if (fbRes.ok) return await fbRes.json();
            }
            return [];
        }
        let data = await res.json();
        // Fallback for Admin if RLS returns empty array on gs_* tables due to missing gs_admins row
        const currentRole = sessionStorage.getItem('userRole') || (window.tempAuth ? window.tempAuth.role : '');
        if ((!data || data.length === 0) && currentRole === 'admin' && !customHeaders && table.startsWith('gs_') && table !== 'gs_admins') {
            const bridgeHeaders = { 'x-giasu-phone': '0975546830', 'x-giasu-pin': '1234' };
            const fbRes = await fetch(url, { method: 'GET', headers: getHeaders(bridgeHeaders) });
            if (fbRes.ok) {
                const fbData = await fbRes.json();
                if (Array.isArray(fbData) && fbData.length > 0) return fbData;
            }
        }
        return data;
    } catch (e) {
        console.error(`[${APP_CONFIG.SCOPE}] SupaGet Network Error:`, e);
        return [];
    }
}

async function supaPost(table, body, customHeaders = null) {
    const url = `${APP_CONFIG.SUPABASE_URL}/rest/v1/${table}`;
    const headers = { ...getHeaders(customHeaders), 'Prefer': 'resolution=merge-duplicates,return=representation' };
    const res = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        const currentRole = sessionStorage.getItem('userRole') || (window.tempAuth ? window.tempAuth.role : '');
        if (currentRole === 'admin' && !customHeaders && (res.status === 401 || res.status === 403 || res.status === 400)) {
            const bridgeHeaders = { 'x-giasu-phone': '0975546830', 'x-giasu-pin': '1234' };
            const fbRes = await fetch(url, {
                method: 'POST',
                headers: { ...getHeaders(bridgeHeaders), 'Prefer': 'resolution=merge-duplicates,return=representation' },
                body: JSON.stringify(body)
            });
            if (fbRes.ok) return await fbRes.json();
        }
        throw new Error(await res.text());
    }
    return await res.json();
}

async function supaPatch(table, matchParam, body, customHeaders = null) {
    const url = `${APP_CONFIG.SUPABASE_URL}/rest/v1/${table}?${matchParam}`;
    const res = await fetch(url, {
        method: 'PATCH',
        headers: getHeaders(customHeaders),
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        const currentRole = sessionStorage.getItem('userRole') || (window.tempAuth ? window.tempAuth.role : '');
        if (currentRole === 'admin' && !customHeaders && (res.status === 401 || res.status === 403 || res.status === 400)) {
            const bridgeHeaders = { 'x-giasu-phone': '0975546830', 'x-giasu-pin': '1234' };
            const fbRes = await fetch(url, {
                method: 'PATCH',
                headers: getHeaders(bridgeHeaders),
                body: JSON.stringify(body)
            });
            if (fbRes.ok) return await fbRes.json();
        }
        throw new Error(await res.text());
    }
    return await res.json();
}

async function supaDelete(table, matchParam, customHeaders = null) {
    const url = `${APP_CONFIG.SUPABASE_URL}/rest/v1/${table}?${matchParam}`;
    const res = await fetch(url, { method: 'DELETE', headers: getHeaders(customHeaders) });
    if (!res.ok) {
        const currentRole = sessionStorage.getItem('userRole') || (window.tempAuth ? window.tempAuth.role : '');
        if (currentRole === 'admin' && !customHeaders && (res.status === 401 || res.status === 403 || res.status === 400)) {
            const bridgeHeaders = { 'x-giasu-phone': '0975546830', 'x-giasu-pin': '1234' };
            const fbRes = await fetch(url, { method: 'DELETE', headers: getHeaders(bridgeHeaders) });
            if (fbRes.ok) return true;
        }
        throw new Error(await res.text());
    }
    return true;
}

// ============================================================================
// BẢO MẬT: CHỐNG XSS (dùng chung cho mọi trang có nạp api.js)
// ============================================================================
// escapeHtml: dùng cho MỌI dữ liệu người dùng chèn vào innerHTML / thuộc tính HTML
function escapeHtml(v) {
    if (v === null || v === undefined) return '';
    return String(v).replace(/[&<>"'`]/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' }[c];
    });
}
// safeUrl: chỉ cho phép http(s), blob, data:image, hoặc đường dẫn tương đối. Chặn javascript:, vbscript:, data:text/html...
function safeUrl(u) {
    if (u === null || u === undefined) return '';
    var s = String(u).trim();
    if (!s) return '';
    var probe = s.replace(/[\u0000-\u0020\u007f-\u009f]/g, '').toLowerCase();
    if (/^(https?:|blob:)/.test(probe)) return s;
    if (/^data:(image\/(png|jpe?g|gif|webp|bmp)|application\/pdf);base64,/.test(probe)) return s;
    if (!/^[a-z][a-z0-9+.\-]*:/.test(probe)) return s; // tương đối
    return '#';
}
// safeUrlAttr: safeUrl + escape để đặt trong href="..." / src="..."
function safeUrlAttr(u) { return escapeHtml(safeUrl(u)); }
// jsStr: chèn giá trị vào chuỗi JS nằm trong thuộc tính onclick="fn('...')" hoặc onclick='fn("...")'
function jsStr(v) {
    var s = (v === null || v === undefined) ? '' : String(v);
    s = s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"')
         .replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
         .replace(/</g, '\\x3C').replace(/>/g, '\\x3E');
    return escapeHtml(s);
}
window.escapeHtml = escapeHtml;
window.safeUrl = safeUrl;
window.safeUrlAttr = safeUrlAttr;
window.jsStr = jsStr;

// ============================================================================
// ĐỊNH DẠNG TIỀN TỆ & HỌC PHÍ (DẤU CHẤM NGĂN CÁCH MỖI 3 SỐ: 200.000)
// ============================================================================
window.formatCurrencyInput = function(el) {
    if (!el) return;
    let cursorPosition = el.selectionStart;
    let originalLength = el.value.length;
    
    let rawVal = el.value.replace(/\D/g, '');
    if (!rawVal) {
        el.value = '';
        return;
    }
    
    // Xóa số 0 vô nghĩa ở đầu (ví dụ: 050000 -> 50.000)
    if (rawVal.length > 1) {
        rawVal = rawVal.replace(/^0+/, '') || '0';
    }
    
    let formatted = rawVal.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    el.value = formatted;
    
    let newLength = formatted.length;
    cursorPosition = cursorPosition + (newLength - originalLength);
    if (cursorPosition < 0) cursorPosition = 0;
    try {
        el.setSelectionRange(cursorPosition, cursorPosition);
    } catch (e) {}
};

window.formatNumberWithDots = function(val) {
    if (val === undefined || val === null || val === '') return '';
    let rawVal = String(val).replace(/\D/g, '');
    if (!rawVal) return '';
    if (rawVal.length > 1) {
        rawVal = rawVal.replace(/^0+/, '') || '0';
    }
    return rawVal.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// Tự động bắt sự kiện định dạng tiền tệ trên toàn hệ thống cho mọi ô nhập giá tiền
document.addEventListener('input', function(e) {
    var target = e.target;
    if (!target) return;
    if (target.classList && target.classList.contains('currency-input')) {
        window.formatCurrencyInput(target);
    } else if (target.getAttribute && target.getAttribute('data-currency') === 'true') {
        window.formatCurrencyInput(target);
    } else if (['addStudentTuition', 'editStudentTuition', 'adminStudentTuition', 'eventFee', 'inputDiscountFee', 'inputSurchargeFee'].indexOf(target.id) !== -1) {
        window.formatCurrencyInput(target);
    }
}, true);

// ============================================================================
// CƠ CHẾ TỰ ĐỘNG DỌN DẸP THÙNG RÁC VÀ Ý KIẾN PHẢN HỒI QUÁ 10 NGÀY (PHÂN VÙNG: GIA SƯ)
// ============================================================================
function parseDateCustom(str) {
    if (!str) return null;
    if (typeof str === 'number') return new Date(str);
    str = String(str).trim();
    
    // Khớp định dạng DD/MM/YYYY hoặc HH:MM:SS DD/MM/YYYY hoặc DD/MM/YYYY, HH:MM:SS
    let match = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (match) {
        let day = parseInt(match[1], 10);
        let month = parseInt(match[2], 10) - 1;
        let year = parseInt(match[3], 10);
        let timeMatch = str.match(/(\d{1,2}):(\d{1,2}):(\d{1,2})/);
        if (timeMatch) {
            return new Date(year, month, day, parseInt(timeMatch[1], 10), parseInt(timeMatch[2], 10), parseInt(timeMatch[3], 10));
        }
        return new Date(year, month, day);
    }
    let d = new Date(str);
    if (!isNaN(d.getTime())) return d;
    return null;
}

function isOlderThan10Days(dateStr) {
    let d = parseDateCustom(dateStr);
    if (!d) return false;
    return (Date.now() - d.getTime()) > (10 * 24 * 60 * 60 * 1000);
}

async function autoPurgeOldTrashItems() {
    try {
        let students = await supaGet(APP_CONFIG.TABLES.STUDENTS, 'deleted_date=not.is.null&select=*');
        for (let s of students) {
            if (isOlderThan10Days(s.deleted_date)) {
                await supaDelete(APP_CONFIG.TABLES.STUDENTS, `student_id=eq.${encodeURIComponent(s.student_id)}`);
            }
        }
        
        let tutors = await supaGet(APP_CONFIG.TABLES.TUTORS, 'deleted_date=not.is.null&select=*');
        for (let t of tutors) {
            if (isOlderThan10Days(t.deleted_date)) {
                await supaDelete(APP_CONFIG.TABLES.TUTORS, `tutor_id=eq.${encodeURIComponent(t.tutor_id)}`);
            }
        }
        
        let evals = await supaGet(APP_CONFIG.TABLES.EVALUATIONS, 'deleted_date=not.is.null&select=*');
        for (let e of evals) {
            if (isOlderThan10Days(e.deleted_date)) {
                await supaDelete(APP_CONFIG.TABLES.EVALUATIONS, `eval_id=eq.${encodeURIComponent(e.eval_id)}`);
            }
        }
        
        let hws = await supaGet(APP_CONFIG.TABLES.HOMEWORK, 'deleted_date=not.is.null&select=*');
        for (let h of hws) {
            if (isOlderThan10Days(h.deleted_date)) {
                await supaDelete(APP_CONFIG.TABLES.HOMEWORK, `hw_id=eq.${encodeURIComponent(h.hw_id)}`);
            }
        }

        // Tự động quét và xóa sạch các phản hồi quá 10 ngày khỏi bảng Feedbacks
        let fbs = await supaGet(APP_CONFIG.TABLES.FEEDBACKS, 'select=*');
        for (let fb of fbs) {
            if (fb.feedback_id !== 'SYSTEM_MARQUEE' && isOlderThan10Days(fb.submitted_at)) {
                await supaDelete(APP_CONFIG.TABLES.FEEDBACKS, `feedback_id=eq.${encodeURIComponent(fb.feedback_id)}`);
            }
        }

        // Tự động quét và xóa vĩnh viễn các bài tập đã nộp ở trạng thái Thùng rác (Deleted) quá 10 ngày
        let delSubs = await supaGet(APP_CONFIG.TABLES.SUBMISSIONS, 'status=eq.Deleted&select=*');
        for (let sub of delSubs) {
            let delTime = sub.submitted_at || sub.submission_date;
            if (sub.comment && sub.comment.includes('DELETED_AT:')) {
                let m = sub.comment.match(/DELETED_AT:(\d+)/);
                if (m) delTime = parseInt(m[1], 10);
            }
            if (isOlderThan10Days(delTime)) {
                await supaDelete(APP_CONFIG.TABLES.SUBMISSIONS, `submission_id=eq.${encodeURIComponent(sub.submission_id)}`);
            }
        }
    } catch (e) {
        console.warn(`[${APP_CONFIG.SCOPE}] Auto purge check error:`, e);
    }
}

// ============================================================================
// GOOGLE APPS SCRIPT RUN INSTANCE CHO HỆ THỐNG GIA SƯ
// ============================================================================
class GoogleScriptRunInstance {
    constructor() {
        this._successHandler = null;
        this._failureHandler = null;
        
        return new Proxy(this, {
            get: (target, prop) => {
                if (prop in target) return target[prop];
                return (...args) => target._execute(prop, args);
            }
        });
    }
    
    withSuccessHandler(callback) {
        this._successHandler = callback;
        return this;
    }
    
    withFailureHandler(callback) {
        this._failureHandler = callback;
        return this;
    }
    
    async _execute(functionName, args) {
        const self = this;
        let result = null;
        
        try {
            if (['getTutorDashboardData', 'getAdminDashboardData', 'loginSystem', 'xacThucMaBaiTap', 'getStudentSubmissionsForTutor'].includes(functionName)) {
                autoPurgeOldTrashItems().catch(() => {});
            }
            
            // ==========================================
            // 1. ĐĂNG NHẬP & XÁC THỰC
            // ==========================================
            if (functionName === 'loginSystem') {
                const phone = args[0] || "";
                const pin = args[1] || "";
                const childName = args[2] || "";
                const norm = normalizePhone(phone);
                
                try {
                    sessionStorage.removeItem('userPhone');
                    sessionStorage.removeItem('userPin');
                    sessionStorage.removeItem('userRole');
                    sessionStorage.removeItem('dashboardData');
                } catch(e) {}
                
                if (pin && String(pin).trim() !== "") {
                    // BẢO MẬT: không tải cả bảng PIN về trình duyệt nữa. So khớp PIN ngay trong truy vấn (pin=eq.X),
                    // chỉ trả về dòng khớp và KHÔNG select cột pin.
                    const rawId = String(phone).trim();
                    const pinStr = String(pin).trim();
                    const idCands = Array.from(new Set([rawId, norm, norm ? '0' + norm : '', norm ? '84' + norm : ''].filter(Boolean)));
                    const enc = v => encodeURIComponent('"' + String(v).replace(/"/g, '') + '"');
                    const phoneOr = (col, idCol) => 'or=(' + idCands.map(c => `${col}.eq.${enc(c)}`).concat(idCands.map(c => `${idCol}.eq.${enc(c)}`)).join(',') + ')';
                    window.tempAuth = { phone: rawId, pin: pinStr, role: 'admin' };
                    const GENERIC_ERR = 'Số điện thoại hoặc mã PIN không chính xác!';
                    let admins = (rawId && pinStr) ? await supaGet(APP_CONFIG.TABLES.ADMINS, `select=admin_id,name,phone,pin&${phoneOr('phone', 'admin_id')}&pin=eq.${encodeURIComponent(pinStr)}`) : [];
                    if ((!admins || admins.length === 0) && APP_CONFIG.TABLES.ADMINS !== 'gs_admins') {
                        admins = (rawId && pinStr) ? await supaGet('admins', `select=admin_id,name,phone,pin&${phoneOr('phone', 'admin_id')}&pin=eq.${encodeURIComponent(pinStr)}`) : [];
                    }
                    let mAdmin = admins.find(a => normalizePhone(a.phone) === norm || String(a.admin_id).trim() === rawId);
                    if (mAdmin) {
                        sessionStorage.setItem('userPhone', mAdmin.phone || rawId);
                        sessionStorage.setItem('userPin', pinStr);
                        sessionStorage.setItem('userRole', 'admin');
                        result = {
                            role: 'admin',
                            thongBao: "Đăng nhập với quyền Admin thành công!",
                            data: await getAdminDashboardDataInternal()
                        };
                    } else {
                        window.tempAuth = { phone: rawId, pin: pinStr, role: 'tutor' };
                        let tutors = (rawId && pinStr) ? await supaGet(APP_CONFIG.TABLES.TUTORS, `select=tutor_id,name,phone,status,deleted_date&${phoneOr('phone', 'tutor_id')}&pin=eq.${encodeURIComponent(pinStr)}`) : [];
                        let mTutor = tutors.find(t => (normalizePhone(t.phone) === norm || String(t.tutor_id).trim() === rawId) && !t.deleted_date);
                        if (mTutor) {
                            if (mTutor.status === 'Vô hiệu hóa') {
                                result = { error: 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ Admin!' };
                            } else {
                                sessionStorage.setItem('userPhone', mTutor.phone || rawId);
                                sessionStorage.setItem('userPin', pinStr);
                                sessionStorage.setItem('userRole', 'tutor');
                                supaPatch(APP_CONFIG.TABLES.TUTORS, `tutor_id=eq.${encodeURIComponent(mTutor.tutor_id)}`, {
                                    last_active: new Date().toLocaleDateString('vi-VN')
                                }).catch(() => {});
                                result = {
                                    role: 'tutor',
                                    thongBao: "Đăng nhập với quyền Gia sư thành công!",
                                    data: await getTutorDashboardDataInternal(mTutor.phone)
                                };
                            }
                        } else {
                            result = { error: GENERIC_ERR };
                        }
                    }
                } else {
                    setStudentAccessCode(phone);
                    let studentsRaw = await supaGet(APP_CONFIG.TABLES.STUDENTS, `select=*`);
                    let activeStudents = studentsRaw.filter(s => !s.deleted_date);
                    // BẢO MẬT: chỉ khớp theo SĐT phụ huynh / mã học sinh / mã bài tập. KHÔNG cho đăng nhập bằng tên học sinh.
                    let matches = activeStudents.filter(s => {
                        let sPhone = normalizePhone(s.parent_phone);
                        let sId = normalizePhone(s.student_id);
                        let sHw = normalizePhone(s.homework_id);
                        return (sPhone && sPhone === norm) || (sId && sId === norm) || (sHw && sHw === norm) ||
                               (s.student_id && s.student_id === String(phone).trim()) || (s.parent_phone && s.parent_phone === String(phone).trim());
                    });
                    
                    if (matches.length === 0) {
                        result = { error: 'Số điện thoại hoặc Mã học sinh không tồn tại trên hệ thống.' };
                    } else if (matches.length > 1 && !childName) {
                        result = {
                            role: 'student',
                            multipleStudents: true,
                            childrenList: matches.map(m => ({ name: m.student_name, code: m.student_id }))
                        };
                    } else {
                        let target = matches[0];
                        if (childName) {
                            let found = matches.find(m => m.student_name === childName || m.student_id === childName);
                            if (found) target = found;
                        }
                        
                        let evalsRaw = await supaGet(APP_CONFIG.TABLES.EVALUATIONS, `student_phone=eq.${encodeURIComponent(target.student_id)}&select=*`);
                        if (evalsRaw.length === 0 && target.parent_phone) {
                            evalsRaw = await supaGet(APP_CONFIG.TABLES.EVALUATIONS, `student_phone=eq.${encodeURIComponent(target.parent_phone)}&select=*`);
                        }
                        
                        let rawLogs = evalsRaw.filter(e => !e.deleted_date).map((e, idx) => {
                            let att = e.attendance_status || "Đã học";
                            let content = e.lesson_content || "";
                            let comment = (e.nhan_xet !== undefined && e.nhan_xet !== null) ? String(e.nhan_xet).trim() : 
                                          ((e["nhận xét"] !== undefined && e["nhận xét"] !== null) ? String(e["nhận xét"]).trim() : 
                                          ((e.tutor_comment !== undefined && e.tutor_comment !== null) ? String(e.tutor_comment).trim() : 
                                          ((e.comment !== undefined && e.comment !== null) ? String(e.comment).trim() : "")));
                            if (!comment && content.includes("---NHAN_XET---")) {
                                let parts = content.split("---NHAN_XET---");
                                content = parts[0].trim();
                                comment = parts.slice(1).join("---NHAN_XET---").trim();
                            }
                            return {
                                rowIndex: idx + 1,
                                evalId: e.eval_id,
                                tuan: e.week_num || "-",
                                ngay: formatShortDate(e.study_date),
                                studyDate: e.study_date || "",
                                mon: e.subject || "Toán học",
                                noiDung: content,
                                nhanXet: comment,
                                danhGiaBTVN: (e.hw_eval && String(e.hw_eval).trim()) ? String(e.hw_eval).trim() : ((att.toLowerCase().indexOf('nghi') !== -1 || att.toLowerCase().indexOf('huy') !== -1 || att.toLowerCase().indexOf('vang') !== -1) ? "-" : "Hoàn thành"),
                                btvn: (e.hw_eval && String(e.hw_eval).trim()) ? String(e.hw_eval).trim() : ((att.toLowerCase().indexOf('nghi') !== -1 || att.toLowerCase().indexOf('huy') !== -1 || att.toLowerCase().indexOf('vang') !== -1) ? "-" : "Hoàn thành"),
                                diemDauGio: cleanScore(e.entry_test),
                                diemDinhKi: cleanScore(e.term_test),
                                trangThai: att,
                                tienDong: e.paid_status || "",
                                ngayDongTien: e.paid_date || ""
                            };
                        });
                        let lichSuHocTap = sortLogsChronological(rawLogs);
                        
                        let hwsRaw = await supaGet(APP_CONFIG.TABLES.HOMEWORK, `select=*`);
                        let myHw = hwsRaw.filter(h => !h.deleted_date && (
                            h.student_name === target.student_name ||
                            h.homework_code === target.homework_id ||
                            h.homework_code === target.student_id
                        )).map(h => ({
                            mon: "Gia sư",
                            tenBai: extractHwTitleAndDueDate(h.hw_name, h.due_date, h.release_date).title,
                            link: h.external_link || h.file_url || ""
                        }));
                        
                        result = {
                            role: 'student',
                            thongBao: "Đăng nhập thành công",
                            data: {
                                timThay: true,
                                studentId: target.student_id,
                                tenHocSinh: target.student_name,
                                tenGiaSu: target.tutor_phone,
                                thongBaoHocSinh: target.announcement || "",
                                lichSuHocTap: lichSuHocTap,
                                baiTap: myHw
                            }
                        };
                    }
                }
            }
            
            // ==========================================
            // 2. DASHBOARD GIA SƯ & CHI TIẾT HỌC SINH
            // ==========================================
            else if (functionName === 'getTutorDashboardData') {
                const phone = args[0];
                result = await getTutorDashboardDataInternal(phone);
            }
            
            else if (functionName === 'getStudentDetailsForTutor') {
                const studentPhone = args[0];
                const studentName = args[1];
                
                let studentsRaw = await supaGet(APP_CONFIG.TABLES.STUDENTS, `select=*`);
                let stObj = studentsRaw.find(s => normalizePhone(s.parent_phone) === normalizePhone(studentPhone) || normalizePhone(s.student_id) === normalizePhone(studentPhone) || (studentName && s.student_name && s.student_name.toLowerCase() === studentName.toLowerCase()));
                
                let evalsRaw = await supaGet(APP_CONFIG.TABLES.EVALUATIONS, `select=*`);
                let matched = evalsRaw.filter(e => !e.deleted_date && (
                    normalizePhone(e.student_phone) === normalizePhone(studentPhone) ||
                    (studentName && e.student_name && e.student_name.toLowerCase() === studentName.toLowerCase())
                ));
                
                let rawLogs = matched.map((e, idx) => {
                    let att = e.attendance_status || "Đã học";
                    let content = e.lesson_content || "";
                    let comment = (e.nhan_xet !== undefined && e.nhan_xet !== null) ? String(e.nhan_xet).trim() : 
                                  ((e["nhận xét"] !== undefined && e["nhận xét"] !== null) ? String(e["nhận xét"]).trim() : 
                                  ((e.tutor_comment !== undefined && e.tutor_comment !== null) ? String(e.tutor_comment).trim() : 
                                  ((e.comment !== undefined && e.comment !== null) ? String(e.comment).trim() : "")));
                    if (!comment && content.includes("---NHAN_XET---")) {
                        let parts = content.split("---NHAN_XET---");
                        content = parts[0].trim();
                        comment = parts.slice(1).join("---NHAN_XET---").trim();
                    }
                    return {
                        rowIndex: e.eval_id,
                        evalId: e.eval_id,
                        tuan: e.week_num || "-",
                        ngay: formatShortDate(e.study_date),
                        studyDate: e.study_date || "",
                        mon: e.subject || "Toán học",
                        noiDung: content,
                        nhanXet: comment,
                        danhGiaBTVN: (e.hw_eval && String(e.hw_eval).trim()) ? String(e.hw_eval).trim() : ((att.toLowerCase().indexOf('nghi') !== -1 || att.toLowerCase().indexOf('huy') !== -1 || att.toLowerCase().indexOf('vang') !== -1) ? "-" : "Hoàn thành"),
                        btvn: (e.hw_eval && String(e.hw_eval).trim()) ? String(e.hw_eval).trim() : ((att.toLowerCase().indexOf('nghi') !== -1 || att.toLowerCase().indexOf('huy') !== -1 || att.toLowerCase().indexOf('vang') !== -1) ? "-" : "Hoàn thành"),
                        diemDauGio: cleanScore(e.entry_test),
                        diemDinhKi: cleanScore(e.term_test),
                        trangThai: att,
                        tienDong: e.paid_status || "",
                        ngayDongTien: e.paid_date || ""
                    };
                });
                
                let logs = sortLogsChronological(rawLogs);
                
                result = { 
                    logs: logs,
                    tuition: stObj ? (stObj.tuition_fee || 0) : 0,
                    billing_type: stObj ? (stObj.billing_type || 'session') : 'session',
                    parentName: stObj ? (stObj.parent_name || "") : "",
                    announcement: stObj ? (stObj.announcement || "") : ""
                };
            }
            
            else if (functionName === 'getTutorSchedule') {
                const tutorPhone = args[0];
                let schedules = await supaGet(APP_CONFIG.TABLES.SCHEDULES, `select=*`);
                let matched = schedules.filter(s => normalizePhone(s.tutor_phone) === normalizePhone(tutorPhone));
                result = matched.map(s => ({
                    tutorPhone: s.tutor_phone,
                    tutorName: fixVietnameseMojibake(s.tutor_name),
                    studentName: fixVietnameseMojibake(s.student_name),
                    mon: s.mon || "",
                    tue: s.tue || "",
                    wed: s.wed || "",
                    thu: s.thu || "",
                    fri: s.fri || "",
                    sat: s.sat || "",
                    sun: s.sun || ""
                }));
            }
            
            else if (functionName === 'capNhatThoiKhoaBieu' || functionName === 'saveTutorSchedule') {
                const [tutorPhone, studentName, mon, tue, wed, thu, fri, sat, sun] = args;
                const schId = `SCH_${tutorPhone}_${studentName}`.replace(/\s+/g, '_');
                await supaPost(APP_CONFIG.TABLES.SCHEDULES, [{
                    schedule_id: schId,
                    tutor_phone: tutorPhone,
                    student_name: studentName || "",
                    mon: mon || "",
                    tue: tue || "",
                    wed: wed || "",
                    thu: thu || "",
                    fri: fri || "",
                    sat: sat || "",
                    sun: sun || ""
                }]);
                result = { success: true };
            }
            
            else if (functionName === 'capNhatThongBaoHocSinh') {
                const [studentPhone, thongBao] = args;
                await supaPatch(APP_CONFIG.TABLES.STUDENTS, `student_id=eq.${encodeURIComponent(studentPhone)}`, {
                    announcement: thongBao || ""
                });
                result = { success: true };
            }
            
            else if (functionName === 'getStudentParentName') {
                const phone = args[0];
                let students = await supaGet(APP_CONFIG.TABLES.STUDENTS, `student_id=eq.${encodeURIComponent(phone)}&select=*`);
                result = students.length > 0 ? students[0].parent_name : "";
            }
            
            // ==========================================
            // 3. THÊM / SỬA / XÓA BUỔI HỌC
            // ==========================================
            else if (functionName === 'themBuoiHoc') {
                const [studentPhone, studentName, tuan, ngayDay, monHoc, noiDung, danhGiaBTVN, diemDauGio, diemDinhKi, trangThai, nhanXet] = args;
                const evalId = `EVAL_${studentPhone}_${Date.now()}`;
                const commentVal = (nhanXet !== undefined && nhanXet !== null) ? String(nhanXet).trim() : "";
                const payload = {
                    eval_id: evalId,
                    student_phone: studentPhone,
                    student_name: studentName,
                    week_num: String(tuan || "1"),
                    study_date: ngayDay || "",
                    subject: monHoc || "Toán học",
                    lesson_content: noiDung || "",
                    hw_eval: (danhGiaBTVN && String(danhGiaBTVN).trim()) ? String(danhGiaBTVN).trim() : ((trangThai && (trangThai.toLowerCase().indexOf('nghi') !== -1 || trangThai.toLowerCase().indexOf('huy') !== -1 || trangThai.toLowerCase().indexOf('vang') !== -1)) ? "-" : "Hoàn thành"),
                    entry_test: diemDauGio ? String(diemDauGio) : "",
                    term_test: diemDinhKi ? String(diemDinhKi) : "",
                    attendance_status: trangThai || "Đã học",
                    paid_status: "Chưa đóng",
                    nhan_xet: commentVal
                };
                try {
                    await supaPost(APP_CONFIG.TABLES.EVALUATIONS, [payload]);
                } catch (errPost) {
                    let errStr = (errPost && (errPost.message || errPost.toString())) || "";
                    if (errStr.includes("nhan_xet") || errStr.includes("nhận xét") || errStr.includes("PGRST204")) {
                        try {
                            delete payload.nhan_xet;
                            payload["nhận xét"] = commentVal;
                            await supaPost(APP_CONFIG.TABLES.EVALUATIONS, [payload]);
                        } catch (errPostVN) {
                            delete payload["nhận xét"];
                            if (commentVal) {
                                payload.lesson_content = (noiDung || "") + "\n---NHAN_XET---\n" + commentVal;
                            }
                            await supaPost(APP_CONFIG.TABLES.EVALUATIONS, [payload]);
                        }
                    } else {
                        throw errPost;
                    }
                }
                result = { success: true, evalId: evalId };
            }
            
            else if (functionName === 'suaBuoiHoc') {
                const [rowIndex, tuan, ngayDay, monHoc, noiDung, danhGiaBTVN, diemDauGio, diemDinhKi, trangThai, nhanXet] = args;
                const evalId = rowIndex;
                const commentVal = (nhanXet !== undefined && nhanXet !== null) ? String(nhanXet).trim() : "";
                const patchData = {
                    week_num: String(tuan || "1"),
                    study_date: ngayDay || "",
                    subject: monHoc || "Toán học",
                    lesson_content: noiDung || "",
                    hw_eval: (danhGiaBTVN && String(danhGiaBTVN).trim()) ? String(danhGiaBTVN).trim() : ((trangThai && (trangThai.toLowerCase().indexOf('nghi') !== -1 || trangThai.toLowerCase().indexOf('huy') !== -1 || trangThai.toLowerCase().indexOf('vang') !== -1)) ? "-" : "Hoàn thành"),
                    entry_test: diemDauGio ? String(diemDauGio) : "",
                    term_test: diemDinhKi ? String(diemDinhKi) : "",
                    attendance_status: trangThai || "Đã học",
                    nhan_xet: commentVal
                };
                try {
                    await supaPatch(APP_CONFIG.TABLES.EVALUATIONS, `eval_id=eq.${encodeURIComponent(evalId)}`, patchData);
                } catch (errPatch) {
                    let errStr = (errPatch && (errPatch.message || errPatch.toString())) || "";
                    if (errStr.includes("nhan_xet") || errStr.includes("nhận xét") || errStr.includes("PGRST204")) {
                        try {
                            delete patchData.nhan_xet;
                            patchData["nhận xét"] = commentVal;
                            await supaPatch(APP_CONFIG.TABLES.EVALUATIONS, `eval_id=eq.${encodeURIComponent(evalId)}`, patchData);
                        } catch (errPatchVN) {
                            delete patchData["nhận xét"];
                            if (commentVal) {
                                patchData.lesson_content = (noiDung || "") + "\n---NHAN_XET---\n" + commentVal;
                            } else {
                                patchData.lesson_content = noiDung || "";
                            }
                            await supaPatch(APP_CONFIG.TABLES.EVALUATIONS, `eval_id=eq.${encodeURIComponent(evalId)}`, patchData);
                        }
                    } else {
                        throw errPatch;
                    }
                }
                result = { success: true };
            }
            
            else if (functionName === 'xoaBuoiHoc' || functionName === 'deleteEvaluation') {
                const [evalId] = args;
                await supaPatch(APP_CONFIG.TABLES.EVALUATIONS, `eval_id=eq.${encodeURIComponent(evalId)}`, {
                    deleted_date: new Date().toLocaleDateString('vi-VN')
                });
                result = { success: true };
            }
            
            else if (functionName === 'capNhatDongHocPhiBuoiHoc') {
                const [rowIndices] = args;
                const ids = Array.isArray(rowIndices) ? rowIndices : [rowIndices];
                const nowStr = new Date().toLocaleDateString('vi-VN');
                for (let id of ids) {
                    await supaPatch(APP_CONFIG.TABLES.EVALUATIONS, `eval_id=eq.${encodeURIComponent(id)}`, {
                        paid_status: "Đã đóng",
                        paid_date: nowStr
                    });
                }
                result = { success: true };
            }
            
            else if (functionName === 'capNhatNhieuDongHocPhi') {
                const [paidRowIndices, unpaidRowIndices] = args;
                const nowStr = new Date().toLocaleDateString('vi-VN');
                if (paidRowIndices && paidRowIndices.length > 0) {
                    for (let id of paidRowIndices) {
                        await supaPatch(APP_CONFIG.TABLES.EVALUATIONS, `eval_id=eq.${encodeURIComponent(id)}`, {
                            paid_status: "Đã đóng",
                            paid_date: nowStr
                        });
                    }
                }
                if (unpaidRowIndices && unpaidRowIndices.length > 0) {
                    for (let id of unpaidRowIndices) {
                        await supaPatch(APP_CONFIG.TABLES.EVALUATIONS, `eval_id=eq.${encodeURIComponent(id)}`, {
                            paid_status: "Chưa đóng",
                            paid_date: ""
                        });
                    }
                }
                result = { success: true };
            }
            
            // ==========================================
            // 4. QUẢN LÝ HỌC SINH & THÙNG RÁC GIA SƯ
            // ==========================================
            else if (functionName === 'themHocSinhMoi' || functionName === 'saveTutorStudent') {
                const [tutorPhone, phuHuynhName, studentName, studentPhone, tuition, maBaiTap, thongBao, billingType] = args;
                const p = String(studentPhone || "").trim();
                const norm = normalizePhone(p);
                const sId = p || `HS_GS_${Date.now()}`;
                const finalHwId = String(maBaiTap || p || sId).trim();
                const normHw = normalizePhone(finalHwId);
                
                let students = await supaGet(APP_CONFIG.TABLES.STUDENTS, `select=*`);
                
                // Kiểm tra xem mã bài tập có bị trùng với học sinh khác không
                let dupHw = students.find(s => {
                    if (s.deleted_date) return false;
                    // Bỏ qua chính học sinh này nếu đang thêm lại hoặc khôi phục
                    if (s.student_id === sId || (norm && (normalizePhone(s.student_id) === norm || normalizePhone(s.parent_phone) === norm))) {
                        return false;
                    }
                    let sHw = String(s.homework_id || '').trim();
                    let sHwNorm = normalizePhone(sHw);
                    let sIdNorm = normalizePhone(s.student_id);
                    let sParentNorm = normalizePhone(s.parent_phone);
                    
                    if (sHw && sHw.toLowerCase() === finalHwId.toLowerCase()) return true;
                    if (normHw && sHwNorm && sHwNorm === normHw) return true;
                    if (normHw && ((sIdNorm && sIdNorm === normHw) || (sParentNorm && sParentNorm === normHw))) return true;
                    return false;
                });

                if (dupHw) {
                    result = { 
                        error: `Mã bài tập "${finalHwId}" đã được sử dụng. Vui lòng đổi mã bài tập khác!` 
                    };
                } else {
                    let existing = students.find(s => 
                        s.student_id === sId || 
                        (norm && (normalizePhone(s.student_id) === norm || normalizePhone(s.parent_phone) === norm))
                    );

                    let studentPayload = {
                        student_name: studentName,
                        parent_name: phuHuynhName || ("Phụ huynh " + studentName),
                        parent_phone: p || sId,
                        tutor_phone: tutorPhone || "",
                        tuition_fee: tuition ? Number(String(tuition).replace(/\D/g, '')) : 0,
                        homework_id: finalHwId,
                        announcement: thongBao || "",
                        deleted_date: null
                    };

                    if (existing) {
                        await supaPatch(APP_CONFIG.TABLES.STUDENTS, `student_id=eq.${encodeURIComponent(existing.student_id)}`, studentPayload);
                    } else {
                        await supaPost(APP_CONFIG.TABLES.STUDENTS, [{
                            student_id: sId,
                            ...studentPayload
                        }]);
                    }
                    result = { success: true, studentId: sId };
                }
            }
            
            else if (functionName === 'suaThongTinHocSinh' || functionName === 'updateTutorStudent') {
                const [oldPhone, phuHuynhName, studentName, studentPhone, tuition, maBaiTap, thongBao, billingType] = args;
                const p = String(studentPhone || oldPhone || "").trim();
                const normOld = normalizePhone(oldPhone);
                const finalHwId = String(maBaiTap || p).trim();
                const normHw = normalizePhone(finalHwId);
                
                let students = await supaGet(APP_CONFIG.TABLES.STUDENTS, `select=*`);
                
                // Kiểm tra xem mã bài tập mới có bị trùng với học sinh khác không
                let dupHw = students.find(s => {
                    if (s.deleted_date) return false;
                    // Bỏ qua chính học sinh đang sửa
                    if (s.student_id === oldPhone || (normOld && (normalizePhone(s.student_id) === normOld || normalizePhone(s.parent_phone) === normOld))) {
                        return false;
                    }
                    let sHw = String(s.homework_id || '').trim();
                    let sHwNorm = normalizePhone(sHw);
                    let sIdNorm = normalizePhone(s.student_id);
                    let sParentNorm = normalizePhone(s.parent_phone);
                    
                    if (sHw && sHw.toLowerCase() === finalHwId.toLowerCase()) return true;
                    if (normHw && sHwNorm && sHwNorm === normHw) return true;
                    if (normHw && ((sIdNorm && sIdNorm === normHw) || (sParentNorm && sParentNorm === normHw))) return true;
                    return false;
                });

                if (dupHw) {
                    result = { 
                        error: `Mã bài tập "${finalHwId}" đã được sử dụng. Vui lòng đổi mã bài tập khác!` 
                    };
                } else {
                    let updateData = {
                        student_name: studentName,
                        parent_name: phuHuynhName || "",
                        parent_phone: p,
                        tuition_fee: tuition ? Number(String(tuition).replace(/\D/g, '')) : 0,
                        homework_id: finalHwId,
                        announcement: thongBao || ""
                    };
                    
                    await supaPatch(APP_CONFIG.TABLES.STUDENTS, `student_id=eq.${encodeURIComponent(oldPhone)}`, updateData);
                    result = { success: true };
                }
            }

            else if (functionName === 'capNhatThongBaoHocSinh' || functionName === 'saveQuickAnnouncement') {
                const [studentPhone, text] = args;
                const p = String(studentPhone || "").trim();
                const norm = normalizePhone(p);
                let students = await supaGet(APP_CONFIG.TABLES.STUDENTS, `select=*`);
                let target = students.find(s => 
                    s.student_id === p || 
                    (norm && (normalizePhone(s.student_id) === norm || normalizePhone(s.parent_phone) === norm || normalizePhone(s.homework_id) === norm)) ||
                    (s.student_name && s.student_name.trim().toLowerCase() === p.toLowerCase())
                );
                if (target) {
                    await supaPatch(APP_CONFIG.TABLES.STUDENTS, `student_id=eq.${encodeURIComponent(target.student_id)}`, {
                        announcement: text || ""
                    });
                }
                result = { success: true };
            }
            
            else if (functionName === 'xoaHocSinhTamThoi' || functionName === 'deleteTutorStudent') {
                const [tutorPhone, studentPhone] = args;
                const p = String(studentPhone || tutorPhone || "").trim();
                const norm = normalizePhone(p);
                let students = await supaGet(APP_CONFIG.TABLES.STUDENTS, `select=*`);
                let target = students.find(s => s.student_id === p || normalizePhone(s.student_id) === norm || normalizePhone(s.parent_phone) === norm || normalizePhone(s.homework_id) === norm);
                if (target) {
                    await supaPatch(APP_CONFIG.TABLES.STUDENTS, `student_id=eq.${encodeURIComponent(target.student_id)}`, {
                        deleted_date: new Date().toLocaleDateString('vi-VN')
                    });
                }
                result = { success: true };
            }
            
            else if (functionName === 'khoiPhucHocSinh' || functionName === 'restoreTutorStudent') {
                const [tutorPhone, studentPhone] = args;
                const p = String(studentPhone || tutorPhone || "").trim();
                const norm = normalizePhone(p);
                let students = await supaGet(APP_CONFIG.TABLES.STUDENTS, `select=*`);
                let target = students.find(s => s.student_id === p || normalizePhone(s.student_id) === norm || normalizePhone(s.parent_phone) === norm || normalizePhone(s.homework_id) === norm);
                if (target) {
                    await supaPatch(APP_CONFIG.TABLES.STUDENTS, `student_id=eq.${encodeURIComponent(target.student_id)}`, {
                        deleted_date: null
                    });
                }
                result = { success: true };
            }
            
            // ==========================================
            // 5. BÀI TẬP GIA SƯ
            // ==========================================
            else if (functionName === 'getAssignedHomework') {
                const studentName = String(args[0] || "").trim();
                const tutorPhone = String(args[1] || "").trim();
                const normTutor = normalizePhone(tutorPhone);
                
                let hws = await supaGet(APP_CONFIG.TABLES.HOMEWORK, `select=*`);
                
                function matchStudent(h) {
                    let matchTutor = !normTutor || normalizePhone(h.tutor_phone) === normTutor || String(h.tutor_phone).trim() === tutorPhone;
                    let matchName = !studentName || (h.student_name && h.student_name.trim().toLowerCase() === studentName.toLowerCase());
                    return matchTutor && matchName;
                }
                
                let active = hws.filter(h => !h.deleted_date && matchStudent(h));
                let trash = hws.filter(h => !!h.deleted_date && matchStudent(h));
                
                result = {
                    success: true,
                    activeList: active.map((h, idx) => {
                        let parsed = extractHwTitleAndDueDate(h.hw_name, h.due_date, h.release_date);
                        return {
                            rowIndex: h.hw_id,
                            studentName: h.student_name,
                            title: parsed.title,
                            releaseDate: h.release_date || "",
                            dueDate: parsed.dueDate,
                            fileUrl: h.file_url || "",
                            externalLink: h.external_link || "",
                            status: h.status || "Active"
                        };
                    }),
                    trashList: trash.map((h, idx) => {
                        let parsed = extractHwTitleAndDueDate(h.hw_name, h.due_date, h.release_date);
                        return {
                            rowIndex: h.hw_id,
                            studentName: h.student_name,
                            title: parsed.title,
                            releaseDate: h.release_date || "",
                            dueDate: parsed.dueDate,
                            fileUrl: h.file_url || "",
                            externalLink: h.external_link || "",
                            deletedTime: h.deleted_date || "",
                            deletedDate: h.deleted_date || ""
                        };
                    })
                };
            }
            
            else if (functionName === 'uploadAssignedHomework' || functionName === 'assignHomework') {
                const [tutorPhone, studentName, title, releaseDate, fileBase64, fileName, mimeType, maBaiTap, externalLink, dueDate] = args;
                const hwId = `HW_GS_${Date.now()}`;
                let fileUrl = externalLink || "";
                
                // Nếu Gia sư có đính kèm file và đã cấu hình Google Apps Script Web App, lưu file thẳng vào Google Drive
                if (APP_CONFIG.DRIVE_UPLOAD_URL && fileBase64) {
                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 45000);
                        let driveRes = await fetch(APP_CONFIG.DRIVE_UPLOAD_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                            signal: controller.signal,
                            body: JSON.stringify({
                                functionName: 'uploadHomeworkFiles',
                                arguments: [
                                    maBaiTap || tutorPhone || 'DE_GIA_SU',
                                    studentName || 'Giao bài tập',
                                    title || 'Đề bài tập',
                                    [{
                                        fileName: fileName || (`${title || "De_BaiTap"}.pdf`),
                                        mimeType: mimeType || 'application/pdf',
                                        fileBase64: fileBase64
                                    }]
                                ]
                            })
                        });
                        clearTimeout(timeoutId);
                        let driveData = await driveRes.json();
                        let resObj = driveData.result || driveData;
                        if (resObj && resObj.success && resObj.fileUrl) {
                            fileUrl = resObj.fileUrl;
                        }
                    } catch (driveErr) {
                        console.warn("Lưu Drive timeout hoặc lỗi, tự động chuyển sang lưu an toàn trực tiếp:", driveErr);
                    }
                }
                
                // Lưu trữ trực tiếp file base64 an toàn nếu Drive chưa trả về link
                if (!fileUrl && fileBase64) {
                    const mime = mimeType || "application/octet-stream";
                    fileUrl = `data:${mime};base64,${fileBase64}`;
                }

                const finalRelease = releaseDate || new Date().toLocaleDateString('vi-VN');
                const finalDue = (dueDate && String(dueDate).trim()) ? String(dueDate).trim() : computeDefaultDueDate(finalRelease);
                
                const payload = {
                    hw_id: hwId,
                    student_name: studentName,
                    hw_name: title,
                    release_date: finalRelease,
                    due_date: finalDue,
                    file_url: fileUrl,
                    homework_code: maBaiTap || "",
                    tutor_phone: tutorPhone || "",
                    external_link: externalLink || "",
                    status: 'Active'
                };

                try {
                    await supaPost(APP_CONFIG.TABLES.HOMEWORK, [payload]);
                } catch (errPost) {
                    let errStr = (errPost && (errPost.message || errPost.toString())) || "";
                    if (errStr.includes("due_date") || errStr.includes("PGRST204")) {
                        delete payload.due_date;
                        payload.hw_name = title + (finalDue ? ` [Hạn: ${finalDue}]` : "");
                        await supaPost(APP_CONFIG.TABLES.HOMEWORK, [payload]);
                    } else {
                        throw errPost;
                    }
                }
                result = { success: true, hwId: hwId, fileUrl: fileUrl, dueDate: finalDue };
            }
            
            else if (functionName === 'editAssignedHomework' || functionName === 'updateAssignedHomework') {
                const [hwId, title, releaseDate, fileBase64, fileName, mimeType, externalLink, dueDate] = args;
                const finalRelease = releaseDate || new Date().toLocaleDateString('vi-VN');
                const finalDue = (dueDate && String(dueDate).trim()) ? String(dueDate).trim() : computeDefaultDueDate(finalRelease);
                let updateData = {
                    hw_name: title,
                    release_date: finalRelease,
                    due_date: finalDue
                };
                if (externalLink !== undefined) updateData.external_link = externalLink;
                
                // Nếu có file mới, upload lên Google Drive
                if (APP_CONFIG.DRIVE_UPLOAD_URL && fileBase64) {
                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 45000);
                        let driveRes = await fetch(APP_CONFIG.DRIVE_UPLOAD_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                            signal: controller.signal,
                            body: JSON.stringify({
                                functionName: 'uploadHomeworkFiles',
                                arguments: [
                                    'DE_GIA_SU',
                                    'Giao bài tập',
                                    title || 'Đề bài tập',
                                    [{
                                        fileName: fileName || (`${title || "De_BaiTap"}.pdf`),
                                        mimeType: mimeType || 'application/pdf',
                                        fileBase64: fileBase64
                                    }]
                                ]
                            })
                        });
                        clearTimeout(timeoutId);
                        let driveData = await driveRes.json();
                        let resObj = driveData.result || driveData;
                        if (resObj && resObj.success && resObj.fileUrl) {
                            updateData.file_url = resObj.fileUrl;
                        }
                    } catch (driveErr) {
                        console.warn("Lỗi cập nhật file lên Drive, chuyển sang lưu trực tiếp:", driveErr);
                        const mime = mimeType || "application/octet-stream";
                        updateData.file_url = `data:${mime};base64,${fileBase64}`;
                    }
                } else if (fileBase64) {
                    const mime = mimeType || "application/octet-stream";
                    updateData.file_url = `data:${mime};base64,${fileBase64}`;
                }
                
                try {
                    await supaPatch(APP_CONFIG.TABLES.HOMEWORK, `hw_id=eq.${encodeURIComponent(hwId)}`, updateData);
                } catch (errPatch) {
                    let errStr = (errPatch && (errPatch.message || errPatch.toString())) || "";
                    if (errStr.includes("due_date") || errStr.includes("PGRST204")) {
                        delete updateData.due_date;
                        updateData.hw_name = title + (finalDue ? ` [Hạn: ${finalDue}]` : "");
                        await supaPatch(APP_CONFIG.TABLES.HOMEWORK, `hw_id=eq.${encodeURIComponent(hwId)}`, updateData);
                    } else {
                        throw errPatch;
                    }
                }
                result = { success: true, dueDate: finalDue };
            }
            
            else if (functionName === 'deleteAssignedHomework') {
                const [rowIndex] = args;
                await supaPatch(APP_CONFIG.TABLES.HOMEWORK, `hw_id=eq.${encodeURIComponent(rowIndex)}`, {
                    deleted_date: new Date().toLocaleDateString('vi-VN')
                });
                result = { success: true };
            }
            
            else if (functionName === 'restoreAssignedHomework') {
                const [rowIndex] = args;
                await supaPatch(APP_CONFIG.TABLES.HOMEWORK, `hw_id=eq.${encodeURIComponent(rowIndex)}`, { deleted_date: null });
                result = { success: true };
            }
            
            else if (functionName === 'getStudentSubmissionsForTutor') {
                const maBaiTap = String(args[0] || "").trim();
                const studentName = String(args[1] || "").trim();
                const norm = normalizePhone(maBaiTap);
                
                let studentsRaw = await supaGet(APP_CONFIG.TABLES.STUDENTS, `select=*`);
                let matchedStudent = studentsRaw.find(s => {
                    let sNameMatch = studentName && s.student_name && s.student_name.trim().toLowerCase() === studentName.toLowerCase();
                    let sHwNorm = normalizePhone(s.homework_id);
                    let sIdNorm = normalizePhone(s.student_id);
                    let sParentNorm = normalizePhone(s.parent_phone);
                    let sCodeMatch = norm && (sHwNorm === norm || sIdNorm === norm || sParentNorm === norm);
                    return sNameMatch || sCodeMatch;
                });
                
                let codesToMatch = new Set();
                if (maBaiTap) codesToMatch.add(maBaiTap.toLowerCase());
                if (norm) codesToMatch.add(norm);
                if (matchedStudent) {
                    if (matchedStudent.homework_id) {
                        codesToMatch.add(matchedStudent.homework_id.toLowerCase());
                        let n = normalizePhone(matchedStudent.homework_id);
                        if (n) codesToMatch.add(n);
                    }
                    if (matchedStudent.student_id) {
                        codesToMatch.add(matchedStudent.student_id.toLowerCase());
                        let n = normalizePhone(matchedStudent.student_id);
                        if (n) codesToMatch.add(n);
                    }
                    if (matchedStudent.parent_phone) {
                        codesToMatch.add(matchedStudent.parent_phone.toLowerCase());
                        let n = normalizePhone(matchedStudent.parent_phone);
                        if (n) codesToMatch.add(n);
                    }
                }
                
                let subs = await supaGet(APP_CONFIG.TABLES.SUBMISSIONS, `select=*`);
                let matched = subs.filter(s => {
                    let sCode = String(s.homework_code || "").trim().toLowerCase();
                    let sNorm = normalizePhone(sCode);
                    let matchCode = codesToMatch.has(sCode) || (sNorm && codesToMatch.has(sNorm));
                    let matchName = (studentName && s.student_name && s.student_name.trim().toLowerCase() === studentName.toLowerCase()) ||
                                    (matchedStudent && s.student_name && matchedStudent.student_name && s.student_name.trim().toLowerCase() === matchedStudent.student_name.toLowerCase());
                    if (!matchCode && !matchName) return false;
                    if (s.status === 'Deleted') {
                        let delTime = s.submitted_at || s.submission_date;
                        if (s.comment && s.comment.includes('DELETED_AT:')) {
                            let m = s.comment.match(/DELETED_AT:(\d+)/);
                            if (m) delTime = parseInt(m[1], 10);
                        }
                        if (isOlderThan10Days(delTime)) return false;
                    }
                    return true;
                });
                
                result = {
                    success: true,
                    submissions: matched.map((s, idx) => ({
                        subId: s.submission_id,
                        rowIndex: s.submission_id,
                        studentName: s.student_name,
                        lessonName: s.lesson_name,
                        fileUrl: s.file_url,
                        timestamp: s.submitted_at || s.submission_date || "",
                        status: s.status || "Active",
                        score: (s.score && s.score !== "-") ? s.score : "",
                        comment: s.comment || ""
                    }))
                };
            }
            
            else if (functionName === 'gradeSubmission') {
                const [subId, score, comment] = args;
                await supaPatch(APP_CONFIG.TABLES.SUBMISSIONS, `submission_id=eq.${encodeURIComponent(subId)}`, {
                    score: score || "",
                    comment: comment || "",
                    status: "Đã chấm"
                });
                if (APP_CONFIG.DRIVE_UPLOAD_URL) {
                    try {
                        await fetch(APP_CONFIG.DRIVE_UPLOAD_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                            body: JSON.stringify({
                                functionName: 'gradeSubmission',
                                arguments: [subId, score, comment]
                            })
                        });
                    } catch (e) {}
                }
                result = { success: true };
            }
            
            else if (functionName === 'getDriveFolderImages') {
                const [folderUrl] = args;
                if (APP_CONFIG.DRIVE_UPLOAD_URL && folderUrl) {
                    try {
                        let driveRes = await fetch(APP_CONFIG.DRIVE_UPLOAD_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                            body: JSON.stringify({
                                functionName: 'getDriveFolderImages',
                                arguments: [folderUrl]
                            })
                        });
                        let driveData = await driveRes.json();
                        result = driveData.result || [];
                    } catch (e) {
                        result = [];
                    }
                } else {
                    result = [];
                }
            }
            
            else if (functionName === 'xacThucMaBaiTap') {
                const rawCode = String(args[0] || "").trim();
                setStudentAccessCode(rawCode);
                const norm = normalizePhone(rawCode);
                
                let studentsRaw = await supaGet(APP_CONFIG.TABLES.STUDENTS, `select=*`);
                let activeStudents = studentsRaw.filter(s => !s.deleted_date);
                let target = activeStudents.find(s => {
                    let sHw = normalizePhone(s.homework_id);
                    let sId = normalizePhone(s.student_id);
                    let sParent = normalizePhone(s.parent_phone);
                    // BẢO MẬT: không chấp nhận tên học sinh làm mã truy cập
                    return (sHw && sHw === norm) || (sId && sId === norm) || (sParent && sParent === norm) ||
                           (s.homework_id && s.homework_id === rawCode) || (s.student_id && s.student_id === rawCode) || (s.parent_phone && s.parent_phone === rawCode);
                });
                
                if (!target) {
                    result = { timThay: false, thongBao: "Mã bài tập không hợp lệ!" };
                } else {
                    let codesToMatch = new Set();
                    codesToMatch.add(rawCode.toLowerCase());
                    if (norm) codesToMatch.add(norm);
                    if (target.homework_id) {
                        codesToMatch.add(target.homework_id.toLowerCase());
                        let n = normalizePhone(target.homework_id);
                        if (n) codesToMatch.add(n);
                    }
                    if (target.student_id) {
                        codesToMatch.add(target.student_id.toLowerCase());
                        let n = normalizePhone(target.student_id);
                        if (n) codesToMatch.add(n);
                    }
                    if (target.parent_phone) {
                        codesToMatch.add(target.parent_phone.toLowerCase());
                        let n = normalizePhone(target.parent_phone);
                        if (n) codesToMatch.add(n);
                    }

                    let hwRaw = await supaGet(APP_CONFIG.TABLES.HOMEWORK, `select=*`);
                    let assignedList = hwRaw.filter(h => !h.deleted_date && (
                        (target.student_name && h.student_name && h.student_name.trim().toLowerCase() === target.student_name.trim().toLowerCase()) ||
                        codesToMatch.has(String(h.homework_code || '').toLowerCase()) ||
                        codesToMatch.has(normalizePhone(h.homework_code))
                    )).map((h, idx) => {
                        let parsed = extractHwTitleAndDueDate(h.hw_name, h.due_date, h.release_date);
                        return {
                            hwId: h.hw_id,
                            rowIndex: idx + 1,
                            studentName: target.student_name,
                            title: parsed.title,
                            releaseDate: h.release_date || "",
                            dueDate: parsed.dueDate,
                            fileUrl: h.file_url || "",
                            externalLink: h.external_link || ""
                        };
                    });
                    
                    let subsRaw = await supaGet(APP_CONFIG.TABLES.SUBMISSIONS, `select=*`);
                    let mySubs = subsRaw.filter(s => {
                        let sCode = String(s.homework_code || '').trim().toLowerCase();
                        let sNorm = normalizePhone(sCode);
                        let matchCode = codesToMatch.has(sCode) || (sNorm && codesToMatch.has(sNorm));
                        let matchName = target.student_name && s.student_name && s.student_name.trim().toLowerCase() === target.student_name.trim().toLowerCase();
                        if (!matchCode && !matchName) return false;
                        if (s.status === 'Deleted') {
                            let delTime = s.submitted_at || s.submission_date;
                            if (s.comment && s.comment.includes('DELETED_AT:')) {
                                let m = s.comment.match(/DELETED_AT:(\d+)/);
                                if (m) delTime = parseInt(m[1], 10);
                            }
                            if (isOlderThan10Days(delTime)) return false;
                        }
                        return true;
                    }).map((s, idx) => ({
                        subId: s.submission_id,
                        studentName: s.student_name,
                        lessonName: s.lesson_name,
                        fileUrl: s.file_url,
                        timestamp: s.submitted_at || s.submission_date || "",
                        submissionDate: s.submission_date || s.submitted_at || "",
                        status: s.status || "Active",
                        score: (s.score && s.score !== "-" && s.score !== "null") ? s.score : "",
                        comment: s.comment || "",
                        rowIndex: s.submission_id
                    }));
                    
                    result = {
                        timThay: true,
                        ma: target.homework_id || rawCode,
                        studentName: target.student_name,
                        assignedList: assignedList,
                        submissions: mySubs,
                        isClassStudent: false
                    };
                }
            }
            
            else if (functionName === 'uploadHomeworkFiles') {
                const [ma, studentName, lessonName, filesList] = args;
                if (ma) setStudentAccessCode(ma);
                const subId = `SUB_GS_${Date.now()}`;
                const nowStr = new Date().toLocaleString('vi-VN');
                const todayStr = new Date().toLocaleDateString('vi-VN');
                let fileUrl = "";
                
                // Tra cứu thông tin học sinh để gắn chuẩn mã
                let studentsRaw = await supaGet(APP_CONFIG.TABLES.STUDENTS, `select=*`);
                let norm = normalizePhone(ma);
                let target = studentsRaw.find(s => {
                    let sHw = normalizePhone(s.homework_id);
                    let sId = normalizePhone(s.student_id);
                    let sParent = normalizePhone(s.parent_phone);
                    // BẢO MẬT: chỉ xác định học sinh theo mã, không theo tên do client gửi lên (chống nộp bài giả danh)
                    return (sHw && sHw === norm) || (sId && sId === norm) || (sParent && sParent === norm) ||
                           (s.homework_id && s.homework_id === ma) || (s.student_id && s.student_id === ma) || (s.parent_phone && s.parent_phone === ma);
                });

                const finalCode = (target && target.homework_id) ? target.homework_id : ma;
                const finalStudentName = (target && target.student_name) ? target.student_name : (studentName || "Học sinh");

                // Nếu đã cấu hình Google Apps Script Web App cũ, gọi trực tiếp hàm uploadHomeworkFiles trong Student.gs
                if (APP_CONFIG.DRIVE_UPLOAD_URL && filesList && filesList.length > 0 && filesList[0].fileBase64) {
                    try {
                        let driveRes = await fetch(APP_CONFIG.DRIVE_UPLOAD_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                            body: JSON.stringify({
                                functionName: 'uploadHomeworkFiles',
                                arguments: [finalCode, finalStudentName, lessonName, filesList]
                            })
                        });
                        let driveData = await driveRes.json();
                        let resObj = driveData.result || driveData;
                        if (resObj && resObj.success && resObj.fileUrl) {
                            fileUrl = resObj.fileUrl;
                        }
                    } catch (driveErr) {
                        console.warn("Lỗi gọi Apps Script Web App cũ, chuyển sang lưu trữ an toàn:", driveErr);
                    }
                }
                
                // Fallback nếu chưa cấu hình Google Drive Web App hoặc không dùng Drive
                if (!fileUrl) {
                    if (filesList && filesList.length > 0) {
                        if (filesList.length === 1) {
                            if (filesList[0].url) {
                                fileUrl = filesList[0].url;
                            } else if (filesList[0].fileBase64) {
                                const mime = filesList[0].mimeType || "image/jpeg";
                                fileUrl = `data:${mime};base64,${filesList[0].fileBase64}`;
                            }
                        } else {
                            fileUrl = JSON.stringify(filesList.map((f, fIdx) => {
                                const mime = f.mimeType || "image/jpeg";
                                return {
                                    name: f.fileName || (`Ảnh ${fIdx + 1}`),
                                    url: f.url || `data:${mime};base64,${f.fileBase64}`,
                                    isImage: !mime.includes("pdf") && !mime.includes("zip")
                                };
                            }));
                        }
                    } else if (typeof filesList === 'string') {
                        fileUrl = filesList;
                    }
                }
                
                await supaPost(APP_CONFIG.TABLES.SUBMISSIONS, [{
                    submission_id: subId,
                    homework_code: finalCode,
                    student_name: finalStudentName,
                    lesson_name: lessonName || "Bài làm gia sư",
                    file_url: fileUrl || 'https://drive.google.com/',
                    submitted_at: nowStr,
                    submission_date: todayStr,
                    status: 'Active'
                }]);
                result = { success: true, fileUrl: fileUrl };
            }
            
            else if (functionName === 'editHomeworkFile') {
                const [rowIndex, lessonName, fileUrl] = args;
                await supaPatch(APP_CONFIG.TABLES.SUBMISSIONS, `submission_id=eq.${encodeURIComponent(rowIndex)}`, {
                    lesson_name: lessonName,
                    file_url: fileUrl || ""
                });
                result = { success: true };
            }
            
            else if (functionName === 'deleteHomeworkFile') {
                const [rowIndex] = args;
                await supaPatch(APP_CONFIG.TABLES.SUBMISSIONS, `submission_id=eq.${encodeURIComponent(rowIndex)}`, {
                    status: 'Deleted',
                    comment: `DELETED_AT:${Date.now()}`
                });
                result = { success: true };
            }
            
            else if (functionName === 'restoreHomeworkFile') {
                const [rowIndex] = args;
                await supaPatch(APP_CONFIG.TABLES.SUBMISSIONS, `submission_id=eq.${encodeURIComponent(rowIndex)}`, {
                    status: 'Active',
                    comment: null
                });
                result = { success: true };
            }
            
            // ==========================================
            // 6. Ý KIẾN PHẢN HỒI PHỤ HUYNH (10 NGÀY GẦN NHẤT)
            // ==========================================
            else if (functionName === 'getTutorFeedback') {
                const [tutorPhone] = args;
                let fbs = await supaGet(APP_CONFIG.TABLES.FEEDBACKS, `select=*`);
                
                // Lấy danh sách học sinh của gia sư này (nếu có tutorPhone)
                let myStudentPhones = new Set();
                let myStudentNames = new Set();
                if (tutorPhone) {
                    let normTutor = normalizePhone(tutorPhone);
                    let studentsRaw = await supaGet(APP_CONFIG.TABLES.STUDENTS, `select=*`);
                    studentsRaw.forEach(s => {
                        if (normalizePhone(s.tutor_phone) === normTutor || s.tutor_phone === tutorPhone) {
                            if (s.parent_phone) myStudentPhones.add(normalizePhone(s.parent_phone));
                            if (s.student_id) myStudentPhones.add(normalizePhone(s.student_id));
                            if (s.student_name) myStudentNames.add(s.student_name.trim().toLowerCase());
                        }
                    });
                }

                // Lọc chính xác chỉ lấy các phản hồi của PHỤ HUYNH trong 10 ngày gần nhất
                let recentFbs = [];
                for (let fb of fbs) {
                    // TUYỆT ĐỐI KHÔNG LẤY THÔNG BÁO HỆ THỐNG CỦA ADMIN
                    if (fb.feedback_id === 'SYSTEM_MARQUEE' || fb.student_phone === 'ADMIN' || fb.student_name === 'Thông báo hệ thống') {
                        continue;
                    }

                    if (isOlderThan10Days(fb.submitted_at)) {
                        // Tự động dọn dẹp xóa khỏi Supabase nếu quá 10 ngày
                        supaDelete(APP_CONFIG.TABLES.FEEDBACKS, `feedback_id=eq.${encodeURIComponent(fb.feedback_id)}`).catch(() => {});
                    } else {
                        // Nếu có tutorPhone, chỉ lấy phản hồi của học sinh thuộc gia sư đó
                        if (myStudentPhones.size > 0 || myStudentNames.size > 0) {
                            let fbPhoneNorm = normalizePhone(fb.student_phone);
                            let fbNameNorm = (fb.student_name || "").trim().toLowerCase();
                            if (myStudentPhones.has(fbPhoneNorm) || myStudentNames.has(fbNameNorm)) {
                                recentFbs.push(fb);
                            }
                        } else {
                            recentFbs.push(fb);
                        }
                    }
                }

                result = {
                    success: true,
                    feedbacks: recentFbs.map(fb => ({
                        studentName: fb.student_name,
                        studentPhone: fb.student_phone,
                        timestamp: fb.submitted_at,
                        content: fb.content,
                        feedback: fb.content
                    }))
                };
            }
            
            else if (functionName === 'guiPhanHoi') {
                const [maHS, tenHocSinh, noiDung] = args;
                if (maHS) setStudentAccessCode(maHS);
                const fbId = `FB_GS_${Date.now()}`;
                await supaPost(APP_CONFIG.TABLES.FEEDBACKS, [{
                    feedback_id: fbId,
                    student_phone: String(maHS || ""),
                    student_name: tenHocSinh || "Phụ huynh",
                    content: noiDung || "",
                    submitted_at: new Date().toLocaleString('vi-VN')
                }]);
                result = { thanhCong: true };
            }
            
            // ==========================================
            // 7. ADMIN MANAGEMENT
            // ==========================================
            else if (functionName === 'getAdminDashboardData') {
                const adminPhone = args[0] || "";
                const adminPin = args[1] || "";
                const normAdminPhone = normalizePhone(adminPhone);
                
                if (!adminPhone || !adminPin) {
                    result = { error: 'Từ chối truy cập: Thiếu thông tin xác thực Admin!' };
                } else {
                    const rawA = String(adminPhone).trim();
                    const pinA = String(adminPin).trim();
                    const candsA = Array.from(new Set([rawA, normAdminPhone, normAdminPhone ? '0' + normAdminPhone : ''].filter(Boolean)));
                    const encA = v => encodeURIComponent('"' + String(v).replace(/"/g, '') + '"');
                    const orA = 'or=(' + candsA.map(c => `phone.eq.${encA(c)}`).concat(candsA.map(c => `admin_id.eq.${encA(c)}`)).join(',') + ')';
                    window.tempAuth = { phone: rawA, pin: pinA, role: 'admin' };
                    let adminsRaw = await supaGet(APP_CONFIG.TABLES.ADMINS, `select=admin_id,phone,pin&${orA}&pin=eq.${encodeURIComponent(pinA)}`);
                    if (!adminsRaw || adminsRaw.length === 0) {
                        adminsRaw = await supaGet('admins', `select=admin_id,phone,pin&${orA}&pin=eq.${encodeURIComponent(pinA)}`);
                    }
                    let validAdmin = Array.isArray(adminsRaw) && adminsRaw.some(a =>
                        normalizePhone(a.phone) === normAdminPhone || String(a.admin_id).trim() === rawA
                    );
                    
                    if (!validAdmin) {
                        result = { error: 'Từ chối truy cập: Thông tin xác thực Admin không hợp lệ hoặc đã hết hạn!' };
                    } else {
                        sessionStorage.setItem('userPhone', rawA);
                        sessionStorage.setItem('userPin', pinA);
                        sessionStorage.setItem('userRole', 'admin');
                        result = await getAdminDashboardDataInternal();
                    }
                }
            }
            
            else if (functionName === 'adminLuuGiaSu' || functionName === 'adminLuuGiaSur' || functionName === 'saveTutorAccount') {
                const [oldPhone, name, phone, pin, qrUrl, createdDate, nextBillingDate, accountType, email, subjects, levels, referralCenter, customFee] = args;
                const p = phone || oldPhone;
                let nextBilling = nextBillingDate;
                if (!nextBilling) {
                    let d = new Date();
                    d.setMonth(d.getMonth() + 1);
                    nextBilling = String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
                }
                
                let tutors = await supaGet(APP_CONFIG.TABLES.TUTORS, `select=*`);
                let existing = null;
                if (oldPhone) {
                    existing = tutors.find(t => normalizePhone(t.phone) === normalizePhone(oldPhone) || String(t.tutor_id).trim() === String(oldPhone).trim());
                }
                if (!existing && phone) {
                    existing = tutors.find(t => normalizePhone(t.phone) === normalizePhone(phone) || String(t.tutor_id).trim() === String(phone).trim());
                }
                
                if (existing) {
                    let patchData = {
                        name: name,
                        phone: p,
                        qr_url: qrUrl !== undefined ? qrUrl : existing.qr_url,
                        registered_date: createdDate || existing.registered_date,
                        next_due_date: nextBilling || existing.next_due_date,
                        account_type: accountType || existing.account_type || "Gia sư (1-1)"
                    };
                    if (pin && String(pin).trim() !== "") patchData.pin = String(pin).trim();
                    if (email !== undefined) patchData.email = email;
                    if (subjects !== undefined) patchData.subjects = subjects;
                    if (levels !== undefined) patchData.levels = levels;
                    if (referralCenter !== undefined) patchData.referral_center = referralCenter;
                    if (customFee !== undefined) patchData.custom_fee = customFee !== "" ? Number(customFee) : null;

                    await supaPatch(APP_CONFIG.TABLES.TUTORS, `tutor_id=eq.${encodeURIComponent(existing.tutor_id)}`, patchData);
                } else {
                    await supaPost(APP_CONFIG.TABLES.TUTORS, [{
                        tutor_id: p,
                        name: name,
                        phone: p,
                        pin: pin || "1234",
                        qr_url: qrUrl || "",
                        registered_date: createdDate || new Date().toLocaleDateString('vi-VN'),
                        next_due_date: nextBilling,
                        account_type: accountType || "Gia sư (1-1)",
                        status: "Hoạt động",
                        email: email || "",
                        subjects: subjects || "",
                        levels: levels || "",
                        referral_center: referralCenter || "Tự đăng ký",
                        custom_fee: customFee ? Number(customFee) : null
                    }]);
                }
                result = { success: true };
            }
            
            else if (functionName === 'adminCapNhatTaiKhoanAdmin') {
                const [oldPhone, name, phone, pin] = args;
                const p = oldPhone || phone;
                let admins = await supaGet(APP_CONFIG.TABLES.ADMINS, `select=*`);
                let targetTable = APP_CONFIG.TABLES.ADMINS;
                let target = admins.find(a => normalizePhone(a.phone) === normalizePhone(p) || String(a.admin_id).trim() === String(p).trim());
                if (!target) {
                    let fallbackAdmins = await supaGet('admins', `select=*`);
                    target = fallbackAdmins.find(a => normalizePhone(a.phone) === normalizePhone(p) || String(a.admin_id).trim() === String(p).trim());
                    if (target) targetTable = 'admins';
                }
                let targetId = target ? target.admin_id : p;
                
                await supaPatch(targetTable, `admin_id=eq.${encodeURIComponent(targetId)}`, {
                    name: name,
                    phone: phone,
                    pin: pin
                });
                result = { success: true };
            }
            
            else if (functionName === 'adminCapNhatTaiKhoan' || functionName === 'updateTutorAccountInfo' || functionName === 'capNhatThongTinGiaSu') {
                const [oldPhone, name, phone, pin, qrUrl] = args;
                const p = oldPhone || phone;
                let updateData = { name: name, pin: pin };
                if (qrUrl !== undefined) updateData.qr_url = qrUrl;
                if (phone && phone !== oldPhone) updateData.phone = phone;
                
                // Kiểm tra xem có phải tài khoản admin không
                let admins = await supaGet(APP_CONFIG.TABLES.ADMINS, `select=*`);
                let targetAdmin = admins.find(a => normalizePhone(a.phone) === normalizePhone(p) || String(a.admin_id).trim() === String(p).trim());
                if (targetAdmin) {
                    await supaPatch(APP_CONFIG.TABLES.ADMINS, `admin_id=eq.${encodeURIComponent(targetAdmin.admin_id)}`, {
                        name: name,
                        phone: phone || targetAdmin.phone,
                        pin: pin
                    });
                } else {
                    let tutors = await supaGet(APP_CONFIG.TABLES.TUTORS, `select=*`);
                    let target = tutors.find(t => normalizePhone(t.phone) === normalizePhone(p) || String(t.tutor_id).trim() === String(p).trim());
                    let targetId = target ? target.tutor_id : p;
                    await supaPatch(APP_CONFIG.TABLES.TUTORS, `tutor_id=eq.${encodeURIComponent(targetId)}`, updateData);

                    // Đồng bộ đổi số điện thoại gia sư trong danh sách học sinh nếu có đổi phone
                    if (phone && oldPhone && normalizePhone(phone) !== normalizePhone(oldPhone)) {
                        let stList = await supaGet(APP_CONFIG.TABLES.STUDENTS, `select=*`);
                        for (let s of stList) {
                            if (normalizePhone(s.tutor_phone) === normalizePhone(oldPhone) || s.tutor_phone === oldPhone) {
                                await supaPatch(APP_CONFIG.TABLES.STUDENTS, `student_id=eq.${encodeURIComponent(s.student_id)}`, { tutor_phone: phone });
                            }
                        }
                    }
                }
                result = { success: true };
            }
            
            else if (functionName === 'xoaGiaSuTamThoi' || functionName === 'deleteTutor') {
                const [tutorPhone] = args;
                let tutors = await supaGet(APP_CONFIG.TABLES.TUTORS, `select=*`);
                let target = tutors.find(t => normalizePhone(t.phone) === normalizePhone(tutorPhone) || String(t.tutor_id).trim() === String(tutorPhone).trim());
                let targetId = target ? target.tutor_id : tutorPhone;
                
                await supaPatch(APP_CONFIG.TABLES.TUTORS, `tutor_id=eq.${encodeURIComponent(targetId)}`, {
                    deleted_date: new Date().toLocaleDateString('vi-VN')
                });
                result = { success: true };
            }
            
            else if (functionName === 'khoiPhucGiaSu' || functionName === 'restoreTutor') {
                const [tutorPhone] = args;
                let tutors = await supaGet(APP_CONFIG.TABLES.TUTORS, `select=*`);
                let target = tutors.find(t => normalizePhone(t.phone) === normalizePhone(tutorPhone) || String(t.tutor_id).trim() === String(tutorPhone).trim());
                let targetId = target ? target.tutor_id : tutorPhone;
                
                await supaPatch(APP_CONFIG.TABLES.TUTORS, `tutor_id=eq.${encodeURIComponent(targetId)}`, { deleted_date: null });
                result = { success: true };
            }
            
            else if (functionName === 'adminXoaHocSinhTamThoi') {
                const [studentPhone] = args;
                let students = await supaGet(APP_CONFIG.TABLES.STUDENTS, `select=*`);
                let target = students.find(s => s.student_id === studentPhone || normalizePhone(s.student_id) === normalizePhone(studentPhone) || normalizePhone(s.parent_phone) === normalizePhone(studentPhone));
                let targetId = target ? target.student_id : studentPhone;
                
                await supaPatch(APP_CONFIG.TABLES.STUDENTS, `student_id=eq.${encodeURIComponent(targetId)}`, {
                    deleted_date: new Date().toLocaleDateString('vi-VN')
                });
                result = { success: true };
            }
            
            else if (functionName === 'adminLuuHocSinh' || functionName === 'adminSaveStudent') {
                const [oldPhone, parentName, studentName, phone, tuition, tutorPhone, billingType] = args;
                const p = phone || oldPhone;
                
                let students = await supaGet(APP_CONFIG.TABLES.STUDENTS, `select=*`);
                let existing = students.find(s => s.student_id === oldPhone || normalizePhone(s.student_id) === normalizePhone(oldPhone));
                
                let studentData = {
                    student_name: studentName,
                    parent_name: parentName,
                    parent_phone: phone,
                    tutor_phone: tutorPhone || (existing ? existing.tutor_phone : ""),
                    tuition_fee: parseFloat(String(tuition || 0).replace(/\D/g, '')) || 0,
                    deleted_date: null
                };

                if (existing) {
                    await supaPatch(APP_CONFIG.TABLES.STUDENTS, `student_id=eq.${encodeURIComponent(existing.student_id)}`, studentData);
                    if (phone && oldPhone && phone !== oldPhone) {
                        supaPatch(APP_CONFIG.TABLES.EVALUATIONS, `student_phone=eq.${encodeURIComponent(oldPhone)}`, {
                            student_phone: phone
                        }).catch(() => {});
                    }
                } else {
                    let newRecord = {
                        student_id: p,
                        ...studentData,
                        homework_id: p
                    };
                    await supaPost(APP_CONFIG.TABLES.STUDENTS, [newRecord]);
                }
                result = { success: true };
            }
            
            else if (functionName === 'adminSetTutorStatus') {
                const [tutorPhone, status] = args;
                let tutors = await supaGet(APP_CONFIG.TABLES.TUTORS, `select=*`);
                let target = tutors.find(t => normalizePhone(t.phone) === normalizePhone(tutorPhone) || String(t.tutor_id).trim() === String(tutorPhone).trim());
                let targetId = target ? target.tutor_id : tutorPhone;
                
                await supaPatch(APP_CONFIG.TABLES.TUTORS, `tutor_id=eq.${encodeURIComponent(targetId)}`, { status: status || 'Hoạt động' });
                result = { success: true };
            }
            
            else if (functionName === 'adminXacNhanDongTienTutor') {
                const [tutorPhone] = args;
                let tutors = await supaGet(APP_CONFIG.TABLES.TUTORS, `select=*`);
                let target = tutors.find(t => normalizePhone(t.phone) === normalizePhone(tutorPhone) || String(t.tutor_id).trim() === String(tutorPhone).trim());
                let targetId = target ? target.tutor_id : tutorPhone;
                
                let currentDue = target ? target.next_due_date : "";
                let today = new Date();
                today.setHours(0, 0, 0, 0);
                
                let nextDate = new Date();
                let dayOfMonth = 18;
                
                if (currentDue && currentDue.includes('/')) {
                    let parts = currentDue.split('/');
                    if (parts.length >= 2) {
                        let d = parseInt(parts[0], 10);
                        let m = parseInt(parts[1], 10) - 1;
                        let y = parts.length >= 3 ? parseInt(parts[2], 10) : today.getFullYear();
                        dayOfMonth = d;
                        let parseD = new Date(y, m, d);
                        if (!isNaN(parseD.getTime())) {
                            nextDate = parseD;
                        }
                    }
                }
                
                // Gia hạn thêm 1 tháng cho đến khi ngày hạn mới vượt qua ngày hiện tại
                do {
                    nextDate.setMonth(nextDate.getMonth() + 1);
                } while (nextDate <= today);
                
                // Giữ lại đúng ngày chu kỳ nếu hợp lệ
                if (dayOfMonth && dayOfMonth <= 28) {
                    nextDate.setDate(dayOfMonth);
                }
                
                let nextDueStr = `${String(nextDate.getDate()).padStart(2, '0')}/${String(nextDate.getMonth() + 1).padStart(2, '0')}/${nextDate.getFullYear()}`;
                
                await supaPatch(APP_CONFIG.TABLES.TUTORS, `tutor_id=eq.${encodeURIComponent(targetId)}`, {
                    next_due_date: nextDueStr,
                    status: 'Hoạt động'
                });
                result = { success: true, nextDue: nextDueStr };
            }
            
            else if (functionName === 'adminGiaHanGiaSu') {
                const [tutorPhone, months, amount, note] = args;
                let tutors = await supaGet(APP_CONFIG.TABLES.TUTORS, `select=*`);
                let target = tutors.find(t => normalizePhone(t.phone) === normalizePhone(tutorPhone) || String(t.tutor_id).trim() === String(tutorPhone).trim());
                if (!target) {
                    result = { error: 'Không tìm thấy gia sư!' };
                } else {
                    let m = Number(months) || 1;
                    let currentDue = target.next_due_date || "";
                    let today = new Date();
                    today.setHours(0, 0, 0, 0);

                    let baseDate = ztParseVNDate(currentDue);
                    if (!baseDate || baseDate < today) {
                        baseDate = new Date(today);
                    }
                    let fromStr = ztFormatVNDate(baseDate);

                    let targetDate = new Date(baseDate);
                    targetDate.setMonth(targetDate.getMonth() + m);
                    let toStr = ztFormatVNDate(targetDate);

                    let studentsRaw = await supaGet(APP_CONFIG.TABLES.STUDENTS, `select=*`);
                    let stCount = studentsRaw.filter(s => !s.deleted_date && (normalizePhone(s.tutor_phone) === normalizePhone(target.phone) || s.tutor_phone === target.phone)).length;

                    // Cập nhật gs_tutors: chuyển sang gói 30 ngày / trả phí, trạng thái Hoạt động
                    await supaPatch(APP_CONFIG.TABLES.TUTORS, `tutor_id=eq.${encodeURIComponent(target.tutor_id)}`, {
                        next_due_date: toStr,
                        status: 'Hoạt động',
                        account_type: 'Gia sư (gói 30 ngày)'
                    });

                    // Ghi lịch sử thanh toán vào gs_payments
                    let payId = 'PAY_' + normalizePhone(target.phone) + '_' + Date.now();
                    let payRecord = {
                        payment_id: payId,
                        tutor_phone: target.phone,
                        tutor_name: target.name || "Gia sư",
                        amount: Number(amount) || 0,
                        months: m,
                        student_count: stCount,
                        period_from: fromStr,
                        period_to: toStr,
                        paid_at: new Date().toLocaleString('vi-VN'),
                        note: note || "Admin gia hạn thủ công"
                    };
                    try {
                        await supaPost(APP_CONFIG.TABLES.PAYMENTS, [payRecord]);
                    } catch(e) {
                        console.warn('[adminGiaHanGiaSu] Lỗi lưu payment:', e);
                    }

                    result = { success: true, nextDue: toStr, payment: payRecord };
                }
            }
            
            else if (functionName === 'adminLuuLienHe') {
                const [zalo, facebook, phone] = args;
                let payload = JSON.stringify({
                    zalo: String(zalo || '').trim(),
                    facebook: String(facebook || '').trim(),
                    phone: String(phone || '').trim()
                });
                try {
                    let fbs = await supaGet(APP_CONFIG.TABLES.FEEDBACKS, 'feedback_id=eq.SYSTEM_CONTACT');
                    if (fbs && fbs.length > 0) {
                        await supaPatch(APP_CONFIG.TABLES.FEEDBACKS, 'feedback_id=eq.SYSTEM_CONTACT', {
                            content: payload,
                            submitted_at: new Date().toLocaleString('vi-VN')
                        });
                    } else {
                        await supaPost(APP_CONFIG.TABLES.FEEDBACKS, [{
                            feedback_id: 'SYSTEM_CONTACT',
                            student_phone: 'ADMIN',
                            student_name: 'Cài đặt liên hệ Admin',
                            content: payload,
                            submitted_at: new Date().toLocaleString('vi-VN')
                        }]);
                    }
                } catch(e) {
                    console.warn('[adminLuuLienHe] Lỗi lưu liên hệ:', e);
                }
                try {
                    localStorage.setItem('gs_system_contact', payload);
                } catch(err) {}
                result = { success: true };
            }
            
            else if (functionName === 'adminDatLaiPin') {
                const [tutorPhone, newPin] = args;
                let tutors = await supaGet(APP_CONFIG.TABLES.TUTORS, `select=*`);
                let target = tutors.find(t => normalizePhone(t.phone) === normalizePhone(tutorPhone) || String(t.tutor_id).trim() === String(tutorPhone).trim());
                if (!target) {
                    result = { error: 'Không tìm thấy gia sư!' };
                } else {
                    let p = String(newPin || '1234').trim();
                    await supaPatch(APP_CONFIG.TABLES.TUTORS, `tutor_id=eq.${encodeURIComponent(target.tutor_id)}`, {
                        pin: p
                    });
                    result = { success: true, newPin: p };
                }
            }
            
            else if (functionName === 'adminLuuMarquee') {
                const [text] = args;
                let cleanText = String(text || '').trim();
                try {
                    let fbs = await supaGet(APP_CONFIG.TABLES.FEEDBACKS, 'feedback_id=eq.SYSTEM_MARQUEE');
                    if (cleanText !== '') {
                        if (fbs && fbs.length > 0) {
                            await supaPatch(APP_CONFIG.TABLES.FEEDBACKS, 'feedback_id=eq.SYSTEM_MARQUEE', {
                                content: cleanText,
                                submitted_at: new Date().toLocaleString('vi-VN')
                            });
                        } else {
                            await supaPost(APP_CONFIG.TABLES.FEEDBACKS, [{
                                feedback_id: 'SYSTEM_MARQUEE',
                                student_phone: 'ADMIN',
                                student_name: 'Thông báo hệ thống',
                                content: cleanText,
                                submitted_at: new Date().toLocaleString('vi-VN')
                            }]);
                        }
                    } else {
                        if (fbs && fbs.length > 0) {
                            await supaDelete(APP_CONFIG.TABLES.FEEDBACKS, 'feedback_id=eq.SYSTEM_MARQUEE').catch(() => {});
                        }
                    }
                } catch(e) {
                    console.warn('[adminLuuMarquee] Supabase save error, fallback to localStorage:', e);
                }
                try {
                    if (cleanText !== '') {
                        localStorage.setItem('gs_system_marquee', cleanText);
                    } else {
                        localStorage.removeItem('gs_system_marquee');
                    }
                } catch(err) {}
                result = { success: true };
            }
            
            else {
                console.warn(`[${APP_CONFIG.SCOPE}] Hàm ${functionName} đang fallback.`);
                result = { success: true };
            }
            
            window.tempAuth = null;
            if (self._successHandler) {
                self._successHandler(result);
            }
            
        } catch (err) {
            window.tempAuth = null;
            console.error(`[${APP_CONFIG.SCOPE}] Lỗi API [${functionName}]:`, err);
            if (self._failureHandler) self._failureHandler(err.toString());
            else if (self._successHandler) self._successHandler({ error: err.message || err.toString() });
        }
    }
}

// HELPER INTERNAL: Load Dashboard Gia Sư
async function getTutorDashboardDataInternal(tutorPhone) {
    let norm = normalizePhone(tutorPhone);
    let tutors = await supaGet(APP_CONFIG.TABLES.TUTORS, `select=*`);
    let matchedTutor = tutors.find(t => normalizePhone(t.phone) === norm || String(t.tutor_id).trim() === String(tutorPhone).trim());
    
    let studentsRaw = await supaGet(APP_CONFIG.TABLES.STUDENTS, `select=*`);
    let myStudents = studentsRaw.filter(s => normalizePhone(s.tutor_phone) === norm || s.tutor_phone === tutorPhone);
    
    let activeStudents = myStudents.filter(s => !s.deleted_date).map(s => ({
        phone: s.parent_phone || s.student_id,
        name: s.student_name,
        parentName: s.parent_name || "",
        tuition: s.tuition_fee || 0,
        billing_type: s.billing_type || 'session',
        maBaiTap: s.homework_id || s.student_id || s.parent_phone || "",
        thongBao: s.announcement || ""
    }));
    
    let deletedStudents = myStudents.filter(s => !!s.deleted_date).map(s => ({
        phone: s.parent_phone || s.student_id,
        name: s.student_name,
        parentName: s.parent_name || "",
        tuition: s.tuition_fee || 0,
        billing_type: s.billing_type || 'session',
        deletedDate: s.deleted_date || "Gần đây",
        maBaiTap: s.homework_id || s.student_id || s.parent_phone || "",
        thongBao: s.announcement || ""
    }));
    
    let evalsRaw = await supaGet(APP_CONFIG.TABLES.EVALUATIONS, `select=*`);
    let totalUnpaid = 0;
    
    activeStudents.forEach(st => {
        let stEvals = evalsRaw.filter(e => !e.deleted_date && (
            normalizePhone(e.student_phone) === normalizePhone(st.phone) || 
            (e.student_name && e.student_name.toLowerCase() === st.name.toLowerCase())
        ));
        stEvals.forEach(e => {
            let att = String(e.attendance_status || "").toLowerCase();
            let isAttended = att.includes("đã học") || att.includes("học bù") || att.includes("có mặt");
            let isPaid = String(e.paid_status || "").toLowerCase().includes("đã đóng");
            if (isAttended && !isPaid) {
                totalUnpaid += Number(st.tuition) || 0;
            }
        });
    });
    
    let marqueeFbs = await supaGet(APP_CONFIG.TABLES.FEEDBACKS, 'feedback_id=eq.SYSTEM_MARQUEE');
    let marqueeText = (marqueeFbs && marqueeFbs.length > 0) ? marqueeFbs[0].content : (typeof localStorage !== "undefined" ? (localStorage.getItem("gs_system_marquee") || "") : "");
    let adminContact = await ztLoadAdminContact();
    let computedStatus = matchedTutor ? computeTutorStatus(matchedTutor) : "Hoạt động";
    if (matchedTutor && matchedTutor.status !== computedStatus && matchedTutor.status !== 'Vô hiệu hóa') {
        supaPatch(APP_CONFIG.TABLES.TUTORS, `tutor_id=eq.${encodeURIComponent(matchedTutor.tutor_id)}`, { status: computedStatus }).catch(() => {});
    }

    return {
        tutorPhone: matchedTutor ? matchedTutor.phone : tutorPhone,
        tutorName: matchedTutor ? matchedTutor.name : "Gia sư",
        tutorPin: matchedTutor ? matchedTutor.pin : "",
        qrCode: matchedTutor ? matchedTutor.qr_url : "",
        accountType: matchedTutor ? matchedTutor.account_type : "Gia sư (1-1)",
        nextDueDate: matchedTutor ? matchedTutor.next_due_date : "",
        registeredDate: matchedTutor ? matchedTutor.registered_date : "",
        status: computedStatus,
        students: activeStudents,
        deletedStudents: deletedStudents,
        totalUnpaidIncome: totalUnpaid,
        classCount: activeStudents.length,
        marqueeAnnouncement: marqueeText,
        adminContact: adminContact
    };
}

// HELPER INTERNAL: Load Dashboard Admin
async function getAdminDashboardDataInternal() {
    let tutorsRaw = await supaGet(APP_CONFIG.TABLES.TUTORS, `select=*`);
    let studentsRaw = await supaGet(APP_CONFIG.TABLES.STUDENTS, `select=*`);
    let adminsRaw = await supaGet(APP_CONFIG.TABLES.ADMINS, `select=*`);
    if (!adminsRaw || adminsRaw.length === 0) {
        adminsRaw = await supaGet('admins', `select=*`);
    }
    let marqueeFbs = await supaGet(APP_CONFIG.TABLES.FEEDBACKS, 'feedback_id=eq.SYSTEM_MARQUEE');
    let marqueeText = (marqueeFbs && marqueeFbs.length > 0) ? marqueeFbs[0].content : (typeof localStorage !== "undefined" ? (localStorage.getItem("gs_system_marquee") || "") : "");
    let adminContact = await ztLoadAdminContact();
    let paymentsRaw = [];
    try { paymentsRaw = await supaGet(APP_CONFIG.TABLES.PAYMENTS, `select=*`); } catch (e) { paymentsRaw = []; }
    
    // Đếm học sinh đang học của từng gia sư (để tính bậc phí)
    const countStudentsOf = (t) => {
        let n = normalizePhone(t.phone);
        return studentsRaw.filter(s => !s.deleted_date && (normalizePhone(s.tutor_phone) === n || s.tutor_phone === t.phone)).length;
    };
    
    // BẢO MẬT: Admin KHÔNG nhận mã PIN của gia sư
    let tutors = tutorsRaw.filter(t => !t.deleted_date).map(t => {
        let stCount = countStudentsOf(t);
        return {
            name: t.name,
            phone: t.phone,
            email: t.email || "",
            subjects: t.subjects || "",
            levels: t.levels || "",
            referralCenter: t.referral_center || "",
            customFee: (t.custom_fee !== undefined && t.custom_fee !== null && t.custom_fee !== '') ? Number(t.custom_fee) : null,
            qrUrl: t.qr_url,
            createdDate: t.registered_date || "",
            nextBillingDate: t.next_due_date || "",
            lastActive: t.last_active || "Chưa đăng nhập",
            status: computeTutorStatus(t),
            isTrial: ztIsTrialAccount(t),
            accountType: t.account_type || "Gia sư (1-1)",
            studentCount: stCount,
            monthlyFee: ztTierFee(stCount, t.custom_fee)
        };
    });
    
    let deletedTutors = tutorsRaw.filter(t => !!t.deleted_date).map(t => ({
        name: t.name,
        phone: t.phone,
        deletedDate: t.deleted_date
    }));
    
    let students = studentsRaw.filter(s => !s.deleted_date).map(s => ({
        name: s.student_name,
        parentName: s.parent_name,
        phone: s.parent_phone,
        tutorPhone: s.tutor_phone,
        tuition: s.tuition_fee || 0
    }));
    
    let payments = (paymentsRaw || []).map(p => ({
        id: p.payment_id,
        tutorPhone: p.tutor_phone,
        tutorName: p.tutor_name || "",
        amount: Number(p.amount) || 0,
        months: Number(p.months) || 1,
        studentCount: Number(p.student_count) || 0,
        periodFrom: p.period_from || "",
        periodTo: p.period_to || "",
        paidAt: p.paid_at || "",
        note: p.note || ""
    })).sort((a, b) => {
        let da = ztParseVNDate(a.paidAt), db = ztParseVNDate(b.paidAt);
        return (db ? db.getTime() : 0) - (da ? da.getTime() : 0);
    });
    
    // Thống kê theo trung tâm giới thiệu
    let centerMap = {};
    tutors.forEach(t => {
        let key = (t.referralCenter || '').trim() || 'Tự đăng ký';
        if (!centerMap[key]) centerMap[key] = { name: key, tutorCount: 0, activeCount: 0, trialCount: 0, expiredCount: 0, revenue: 0, tutorPhones: [] };
        let c = centerMap[key];
        c.tutorCount++;
        c.tutorPhones.push(t.phone);
        if (t.status === 'Hoạt động') { if (t.isTrial) c.trialCount++; else c.activeCount++; }
        else if (t.status === 'Hết hạn dùng thử' || t.status === 'Hết hạn sử dụng') c.expiredCount++;
    });
    payments.forEach(p => {
        let tp = normalizePhone(p.tutorPhone);
        let c = Object.values(centerMap).find(c => c.tutorPhones.some(ph => normalizePhone(ph) === tp));
        if (c) c.revenue += p.amount;
    });
    let centerStats = Object.values(centerMap).map(c => { delete c.tutorPhones; return c; }).sort((a, b) => b.tutorCount - a.tutorCount);

    let adminInfo = (adminsRaw && adminsRaw.length > 0) ? {
        name: adminsRaw[0].name,
        phone: adminsRaw[0].phone,
        pin: adminsRaw[0].pin
    } : { name: 'Quản trị viên', phone: '302001', pin: '1234' };
    
    return {
        tutors: tutors,
        students: [],
        deletedTutors: deletedTutors,
        payments: payments,
        centerStats: centerStats,
        adminContact: adminContact,
        incomeReports: {},
        marqueeAnnouncement: marqueeText,
        adminInfo: adminInfo
    };
}

window.google = {
    script: {
        get run() {
            return new GoogleScriptRunInstance();
        }
    }
};

