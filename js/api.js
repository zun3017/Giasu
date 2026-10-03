/**
 * ============================================================================
 * SUPABASE API GATEWAY - PHÃ‚N VÃ™NG: Há»† THá»NG GIA SÆ¯ 1-1 (SCOPE: GIASU)
 * ============================================================================
 * - Äá»™c láº­p 100% vá»›i Web Lá»›p Há»c, toÃ n bá»™ báº£ng mang tiá»n tá»‘ gs_*
 * - TÆ°Æ¡ng thÃ­ch 100% vá»›i toÃ n bá»™ hÃ m gá»i tá»« Google Apps Script (Tutor, Student, Admin)
 * - Tá»± Ä‘á»™ng náº¡p dá»¯ liá»‡u gá»‘c tá»« Supabase
 * - Káº¿ thá»«a Ä‘áº§y Ä‘á»§: XÃ³a má»m, ThÃ¹ng rÃ¡c, vÃ  Tá»± Ä‘á»™ng há»§y sau 10 ngÃ y.
 */

const APP_CONFIG = {
    APP_NAME: 'Há»‡ Thá»‘ng Gia SÆ°',
    SCOPE: 'giasu',
    SUPABASE_URL: 'https://iefnuwhdvzxomusvfuqz.supabase.co',
    SUPABASE_KEY: 'sb_publishable_TSuZENBNGAJIzsnLyCAauQ_Z-KVZKlZ',
    TABLES: {
        TUTORS: 'gs_tutors',
        STUDENTS: 'gs_students',
        EVALUATIONS: 'gs_evaluations',
        SCHEDULES: 'gs_schedules',
        HOMEWORK: 'gs_homework',
        SUBMISSIONS: 'gs_submissions',
        FEEDBACKS: 'gs_feedbacks',
        ADMINS: 'gs_admins'
    },
    // URL Google Apps Script Web App cá»§a báº¡n Ä‘á»ƒ tá»± Ä‘á»™ng lÆ°u bÃ i ná»™p vÃ o Google Drive
    DRIVE_UPLOAD_URL: 'https://script.google.com/macros/s/AKfycbwQZA0UlCibTKjuq0AIJM1kfQjKwPbiIKE7-VfDjpiizjU-gaxJBuYOLTKdTmnETjbd/exec',
    SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwQZA0UlCibTKjuq0AIJM1kfQjKwPbiIKE7-VfDjpiizjU-gaxJBuYOLTKdTmnETjbd/exec',
    HOMEWORK_DRIVE_FOLDER: 'https://drive.google.com/drive/folders/1cGu7nt0K0paWCg-9nlHgqxVp0I_6h8M8?usp=drive_link',
    ASSIGNMENT_DRIVE_FOLDER: 'https://drive.google.com/drive/folders/11z6CIwULBhR6CKcUzhvHDaTMjiUA7Iiu?usp=drive_link'
};

function getHeaders() {
    return {
        'apikey': APP_CONFIG.SUPABASE_KEY,
        'Authorization': `Bearer ${APP_CONFIG.SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        'x-giasu-phone': sessionStorage.getItem('userPhone') || (window.tempAuth ? window.tempAuth.phone : ''),
        'x-giasu-pin': sessionStorage.getItem('userPin') || (window.tempAuth ? window.tempAuth.pin : ''),
        'x-giasu-role': sessionStorage.getItem('userRole') || ''
    };
}

function normalizePhone(p) {
    if (!p) return "";
    return String(p).replace(/\D/g, '').replace(/^84/, '0').replace(/^0+/, '');
}

function cleanScore(s) {
    if (!s || s === "KhÃ´ng cÃ³" || s === "-" || s === "null" || s === "") return "KhÃ´ng cÃ³";
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
    // Máº·c Ä‘á»‹nh sau ngÃ y giao bÃ i trong vÃ²ng 4 ngÃ y
    baseDate.setDate(baseDate.getDate() + 4);
    let dd = String(baseDate.getDate()).padStart(2, '0');
    let mm = String(baseDate.getMonth() + 1).padStart(2, '0');
    let yyyy = baseDate.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

function extractHwTitleAndDueDate(rawName, rawDueDate, rawReleaseDate) {
    let title = String(rawName || "").trim();
    let dueDate = (rawDueDate && String(rawDueDate).trim()) ? String(rawDueDate).trim() : "";
    if (!dueDate && title.includes("[Háº¡n:")) {
        let m = title.match(/\[Háº¡n:\s*([^\]]+)\]/);
        if (m) {
            dueDate = m[1].trim();
            title = title.replace(/\[Háº¡n:\s*[^\]]+\]/, "").trim();
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

async function supaGet(table, queryParams = "") {
    try {
        const url = `${APP_CONFIG.SUPABASE_URL}/rest/v1/${table}${queryParams ? '?' + queryParams : ''}`;
        const res = await fetch(url, { method: 'GET', headers: getHeaders() });
        if (!res.ok) {
            console.error(`[${APP_CONFIG.SCOPE}] SupaGet Error [${table}]:`, res.status, await res.text());
            return [];
        }
        return await res.json();
    } catch (e) {
        console.error(`[${APP_CONFIG.SCOPE}] SupaGet Network Error:`, e);
        return [];
    }
}

async function supaPost(table, body) {
    const url = `${APP_CONFIG.SUPABASE_URL}/rest/v1/${table}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { ...getHeaders(), 'Prefer': 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
}

async function supaPatch(table, matchParam, body) {
    const url = `${APP_CONFIG.SUPABASE_URL}/rest/v1/${table}?${matchParam}`;
    const res = await fetch(url, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
}

async function supaDelete(table, matchParam) {
    const url = `${APP_CONFIG.SUPABASE_URL}/rest/v1/${table}?${matchParam}`;
    const res = await fetch(url, { method: 'DELETE', headers: getHeaders() });
    if (!res.ok) throw new Error(await res.text());
    return true;
}

// ============================================================================
// Báº¢O Máº¬T: CHá»NG XSS (dÃ¹ng chung cho má»i trang cÃ³ náº¡p api.js)
// ============================================================================
// escapeHtml: dÃ¹ng cho Má»ŒI dá»¯ liá»‡u ngÆ°á»i dÃ¹ng chÃ¨n vÃ o innerHTML / thuá»™c tÃ­nh HTML
function escapeHtml(v) {
    if (v === null || v === undefined) return '';
    return String(v).replace(/[&<>"'`]/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' }[c];
    });
}
// safeUrl: chá»‰ cho phÃ©p http(s), blob, data:image, hoáº·c Ä‘Æ°á»ng dáº«n tÆ°Æ¡ng Ä‘á»‘i. Cháº·n javascript:, vbscript:, data:text/html...
function safeUrl(u) {
    if (u === null || u === undefined) return '';
    var s = String(u).trim();
    if (!s) return '';
    var probe = s.replace(/[\u0000-\u0020\u007f-\u009f]/g, '').toLowerCase();
    if (/^(https?:|blob:)/.test(probe)) return s;
    if (/^data:(image\/(png|jpe?g|gif|webp|bmp)|application\/pdf);base64,/.test(probe)) return s;
    if (!/^[a-z][a-z0-9+.\-]*:/.test(probe)) return s; // tÆ°Æ¡ng Ä‘á»‘i
    return '#';
}
// safeUrlAttr: safeUrl + escape Ä‘á»ƒ Ä‘áº·t trong href="..." / src="..."
function safeUrlAttr(u) { return escapeHtml(safeUrl(u)); }
// jsStr: chÃ¨n giÃ¡ trá»‹ vÃ o chuá»—i JS náº±m trong thuá»™c tÃ­nh onclick="fn('...')" hoáº·c onclick='fn("...")'
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
// Äá»ŠNH Dáº NG TIá»€N Tá»† & Há»ŒC PHÃ (Dáº¤U CHáº¤M NGÄ‚N CÃCH Má»–I 3 Sá»: 200.000)
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
    
    // XÃ³a sá»‘ 0 vÃ´ nghÄ©a á»Ÿ Ä‘áº§u (vÃ­ dá»¥: 050000 -> 50.000)
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

// Tá»± Ä‘á»™ng báº¯t sá»± kiá»‡n Ä‘á»‹nh dáº¡ng tiá»n tá»‡ trÃªn toÃ n há»‡ thá»‘ng cho má»i Ã´ nháº­p giÃ¡ tiá»n
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
// CÆ  CHáº¾ Tá»° Äá»˜NG Dá»ŒN Dáº¸P THÃ™NG RÃC VÃ€ Ã KIáº¾N PHáº¢N Há»’I QUÃ 10 NGÃ€Y (PHÃ‚N VÃ™NG: GIA SÆ¯)
// ============================================================================
function parseDateCustom(str) {
    if (!str) return null;
    if (typeof str === 'number') return new Date(str);
    str = String(str).trim();
    
    // Khá»›p Ä‘á»‹nh dáº¡ng DD/MM/YYYY hoáº·c HH:MM:SS DD/MM/YYYY hoáº·c DD/MM/YYYY, HH:MM:SS
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

        // Tá»± Ä‘á»™ng quÃ©t vÃ  xÃ³a sáº¡ch cÃ¡c pháº£n há»“i quÃ¡ 10 ngÃ y khá»i báº£ng Feedbacks
        let fbs = await supaGet(APP_CONFIG.TABLES.FEEDBACKS, 'select=*');
        for (let fb of fbs) {
            if (fb.feedback_id !== 'SYSTEM_MARQUEE' && isOlderThan10Days(fb.submitted_at)) {
                await supaDelete(APP_CONFIG.TABLES.FEEDBACKS, `feedback_id=eq.${encodeURIComponent(fb.feedback_id)}`);
            }
        }

        // Tá»± Ä‘á»™ng quÃ©t vÃ  xÃ³a vÄ©nh viá»…n cÃ¡c bÃ i táº­p Ä‘Ã£ ná»™p á»Ÿ tráº¡ng thÃ¡i ThÃ¹ng rÃ¡c (Deleted) quÃ¡ 10 ngÃ y
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
// GOOGLE APPS SCRIPT RUN INSTANCE CHO Há»† THá»NG GIA SÆ¯
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
            // 1. ÄÄ‚NG NHáº¬P & XÃC THá»°C
            // ==========================================
            if (functionName === 'loginSystem') {
                const phone = args[0] || "";
                const pin = args[1] || "";
                const childName = args[2] || "";
                const norm = normalizePhone(phone);
                
                if (pin && String(pin).trim() !== "") {
                    // Báº¢O Máº¬T: khÃ´ng táº£i cáº£ báº£ng PIN vá» trÃ¬nh duyá»‡t ná»¯a. So khá»›p PIN ngay trong truy váº¥n (pin=eq.X),
                    // chá»‰ tráº£ vá» dÃ²ng khá»›p vÃ  KHÃ”NG select cá»™t pin.
                    const rawId = String(phone).trim();
                    const pinStr = String(pin).trim();
                    const idCands = Array.from(new Set([rawId, norm, norm ? '0' + norm : '', norm ? '84' + norm : ''].filter(Boolean)));
                    const enc = v => encodeURIComponent('"' + String(v).replace(/"/g, '') + '"');
                    const phoneOr = (col, idCol) => 'or=(' + idCands.map(c => `${col}.eq.${enc(c)}`).concat(idCands.map(c => `${idCol}.eq.${enc(c)}`)).join(',') + ')';
                    window.tempAuth = { phone: rawId, pin: pinStr };
                    const GENERIC_ERR = 'Sá»‘ Ä‘iá»‡n thoáº¡i hoáº·c mÃ£ PIN khÃ´ng chÃ­nh xÃ¡c!';
                    let admins = (rawId && pinStr) ? await supaGet(APP_CONFIG.TABLES.ADMINS, `select=admin_id,name,phone&${phoneOr('phone', 'admin_id')}&pin=eq.${encodeURIComponent(pinStr)}`) : [];
                    let mAdmin = admins.find(a => normalizePhone(a.phone) === norm || String(a.admin_id).trim() === rawId);
                    if (mAdmin) {
                        result = {
                            role: 'admin',
                            thongBao: "ÄÄƒng nháº­p vá»›i quyá»n Admin thÃ nh cÃ´ng!",
                            data: await getAdminDashboardDataInternal()
                        };
                    } else {
                        let tutors = (rawId && pinStr) ? await supaGet(APP_CONFIG.TABLES.TUTORS, `select=tutor_id,name,phone,status,deleted_date&${phoneOr('phone', 'tutor_id')}&pin=eq.${encodeURIComponent(pinStr)}`) : [];
                        let mTutor = tutors.find(t => (normalizePhone(t.phone) === norm || String(t.tutor_id).trim() === rawId) && !t.deleted_date);
                        if (mTutor) {
                            if (mTutor.status === 'VÃ´ hiá»‡u hÃ³a') {
                                result = { error: 'TÃ i khoáº£n cá»§a báº¡n Ä‘Ã£ bá»‹ vÃ´ hiá»‡u hÃ³a. Vui lÃ²ng liÃªn há»‡ Admin!' };
                            } else {
                                result = {
                                    role: 'tutor',
                                    thongBao: "ÄÄƒng nháº­p vá»›i quyá»n Gia sÆ° thÃ nh cÃ´ng!",
                                    data: await getTutorDashboardDataInternal(mTutor.phone)
                                };
                            }
                        } else {
                            result = { error: GENERIC_ERR };
                        }
                    }
                } else {
                    let studentsRaw = await supaGet(APP_CONFIG.TABLES.STUDENTS, `select=*`);
                    let activeStudents = studentsRaw.filter(s => !s.deleted_date);
                    // Báº¢O Máº¬T: chá»‰ khá»›p theo SÄT phá»¥ huynh / mÃ£ há»c sinh / mÃ£ bÃ i táº­p. KHÃ”NG cho Ä‘Äƒng nháº­p báº±ng tÃªn há»c sinh.
                    let matches = activeStudents.filter(s => {
                        let sPhone = normalizePhone(s.parent_phone);
                        let sId = normalizePhone(s.student_id);
                        let sHw = normalizePhone(s.homework_id);
                        return (sPhone && sPhone === norm) || (sId && sId === norm) || (sHw && sHw === norm) ||
                               (s.student_id && s.student_id === String(phone).trim()) || (s.parent_phone && s.parent_phone === String(phone).trim());
                    });
                    
                    if (matches.length === 0) {
                        result = { error: 'Sá»‘ Ä‘iá»‡n thoáº¡i hoáº·c MÃ£ há»c sinh khÃ´ng tá»“n táº¡i trÃªn há»‡ thá»‘ng.' };
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
                            let att = e.attendance_status || "ÄÃ£ há»c";
                            let content = e.lesson_content || "";
                            let comment = (e.nhan_xet !== undefined && e.nhan_xet !== null) ? String(e.nhan_xet).trim() : 
                                          ((e["nháº­n xÃ©t"] !== undefined && e["nháº­n xÃ©t"] !== null) ? String(e["nháº­n xÃ©t"]).trim() : 
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
                                mon: e.subject || "ToÃ¡n há»c",
                                noiDung: content,
                                nhanXet: comment,
                                danhGiaBTVN: (e.hw_eval && String(e.hw_eval).trim()) ? String(e.hw_eval).trim() : ((att.toLowerCase().indexOf('nghi') !== -1 || att.toLowerCase().indexOf('huy') !== -1 || att.toLowerCase().indexOf('vang') !== -1) ? "-" : "HoÃ n thÃ nh"),
                                btvn: (e.hw_eval && String(e.hw_eval).trim()) ? String(e.hw_eval).trim() : ((att.toLowerCase().indexOf('nghi') !== -1 || att.toLowerCase().indexOf('huy') !== -1 || att.toLowerCase().indexOf('vang') !== -1) ? "-" : "HoÃ n thÃ nh"),
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
                            mon: "Gia sÆ°",
                            tenBai: extractHwTitleAndDueDate(h.hw_name, h.due_date, h.release_date).title,
                            link: h.external_link || h.file_url || ""
                        }));
                        
                        result = {
                            role: 'student',
                            thongBao: "ÄÄƒng nháº­p thÃ nh cÃ´ng",
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
            // 2. DASHBOARD GIA SÆ¯ & CHI TIáº¾T Há»ŒC SINH
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
                    let att = e.attendance_status || "ÄÃ£ há»c";
                    let content = e.lesson_content || "";
                    let comment = (e.nhan_xet !== undefined && e.nhan_xet !== null) ? String(e.nhan_xet).trim() : 
                                  ((e["nháº­n xÃ©t"] !== undefined && e["nháº­n xÃ©t"] !== null) ? String(e["nháº­n xÃ©t"]).trim() : 
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
                        mon: e.subject || "ToÃ¡n há»c",
                        noiDung: content,
                        nhanXet: comment,
                        danhGiaBTVN: (e.hw_eval && String(e.hw_eval).trim()) ? String(e.hw_eval).trim() : ((att.toLowerCase().indexOf('nghi') !== -1 || att.toLowerCase().indexOf('huy') !== -1 || att.toLowerCase().indexOf('vang') !== -1) ? "-" : "HoÃ n thÃ nh"),
                        btvn: (e.hw_eval && String(e.hw_eval).trim()) ? String(e.hw_eval).trim() : ((att.toLowerCase().indexOf('nghi') !== -1 || att.toLowerCase().indexOf('huy') !== -1 || att.toLowerCase().indexOf('vang') !== -1) ? "-" : "HoÃ n thÃ nh"),
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
                    tutorName: s.tutor_name,
                    studentName: s.student_name,
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
            // 3. THÃŠM / Sá»¬A / XÃ“A BUá»”I Há»ŒC
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
                    subject: monHoc || "ToÃ¡n há»c",
                    lesson_content: noiDung || "",
                    hw_eval: (danhGiaBTVN && String(danhGiaBTVN).trim()) ? String(danhGiaBTVN).trim() : ((trangThai && (trangThai.toLowerCase().indexOf('nghi') !== -1 || trangThai.toLowerCase().indexOf('huy') !== -1 || trangThai.toLowerCase().indexOf('vang') !== -1)) ? "-" : "HoÃ n thÃ nh"),
                    entry_test: diemDauGio ? String(diemDauGio) : "",
                    term_test: diemDinhKi ? String(diemDinhKi) : "",
                    attendance_status: trangThai || "ÄÃ£ há»c",
                    paid_status: "ChÆ°a Ä‘Ã³ng",
                    nhan_xet: commentVal
                };
                try {
                    await supaPost(APP_CONFIG.TABLES.EVALUATIONS, [payload]);
                } catch (errPost) {
                    let errStr = (errPost && (errPost.message || errPost.toString())) || "";
                    if (errStr.includes("nhan_xet") || errStr.includes("nháº­n xÃ©t") || errStr.includes("PGRST204")) {
                        try {
                            delete payload.nhan_xet;
                            payload["nháº­n xÃ©t"] = commentVal;
                            await supaPost(APP_CONFIG.TABLES.EVALUATIONS, [payload]);
                        } catch (errPostVN) {
                            delete payload["nháº­n xÃ©t"];
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
                    subject: monHoc || "ToÃ¡n há»c",
                    lesson_content: noiDung || "",
                    hw_eval: (danhGiaBTVN && String(danhGiaBTVN).trim()) ? String(danhGiaBTVN).trim() : ((trangThai && (trangThai.toLowerCase().indexOf('nghi') !== -1 || trangThai.toLowerCase().indexOf('huy') !== -1 || trangThai.toLowerCase().indexOf('vang') !== -1)) ? "-" : "HoÃ n thÃ nh"),
                    entry_test: diemDauGio ? String(diemDauGio) : "",
                    term_test: diemDinhKi ? String(diemDinhKi) : "",
                    attendance_status: trangThai || "ÄÃ£ há»c",
                    nhan_xet: commentVal
                };
                try {
                    await supaPatch(APP_CONFIG.TABLES.EVALUATIONS, `eval_id=eq.${encodeURIComponent(evalId)}`, patchData);
                } catch (errPatch) {
                    let errStr = (errPatch && (errPatch.message || errPatch.toString())) || "";
                    if (errStr.includes("nhan_xet") || errStr.includes("nháº­n xÃ©t") || errStr.includes("PGRST204")) {
                        try {
                            delete patchData.nhan_xet;
                            patchData["nháº­n xÃ©t"] = commentVal;
                            await supaPatch(APP_CONFIG.TABLES.EVALUATIONS, `eval_id=eq.${encodeURIComponent(evalId)}`, patchData);
                        } catch (errPatchVN) {
                            delete patchData["nháº­n xÃ©t"];
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
                        paid_status: "ÄÃ£ Ä‘Ã³ng",
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
                            paid_status: "ÄÃ£ Ä‘Ã³ng",
                            paid_date: nowStr
                        });
                    }
                }
                if (unpaidRowIndices && unpaidRowIndices.length > 0) {
                    for (let id of unpaidRowIndices) {
                        await supaPatch(APP_CONFIG.TABLES.EVALUATIONS, `eval_id=eq.${encodeURIComponent(id)}`, {
                            paid_status: "ChÆ°a Ä‘Ã³ng",
                            paid_date: ""
                        });
                    }
                }
                result = { success: true };
            }
            
            // ==========================================
            // 4. QUáº¢N LÃ Há»ŒC SINH & THÃ™NG RÃC GIA SÆ¯
            // ==========================================
            else if (functionName === 'themHocSinhMoi' || functionName === 'saveTutorStudent') {
                const [tutorPhone, phuHuynhName, studentName, studentPhone, tuition, maBaiTap, thongBao, billingType] = args;
                const p = String(studentPhone || "").trim();
                const norm = normalizePhone(p);
                const sId = p || `HS_GS_${Date.now()}`;
                const finalHwId = String(maBaiTap || p || sId).trim();
                const normHw = normalizePhone(finalHwId);
                
                let students = await supaGet(APP_CONFIG.TABLES.STUDENTS, `select=*`);
                
                // Kiá»ƒm tra xem mÃ£ bÃ i táº­p cÃ³ bá»‹ trÃ¹ng vá»›i há»c sinh khÃ¡c khÃ´ng
                let dupHw = students.find(s => {
                    if (s.deleted_date) return false;
                    // Bá» qua chÃ­nh há»c sinh nÃ y náº¿u Ä‘ang thÃªm láº¡i hoáº·c khÃ´i phá»¥c
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
                        error: `MÃ£ bÃ i táº­p "${finalHwId}" Ä‘Ã£ Ä‘Æ°á»£c sá»­ dá»¥ng. Vui lÃ²ng Ä‘á»•i mÃ£ bÃ i táº­p khÃ¡c!` 
                    };
                } else {
                    let existing = students.find(s => 
                        s.student_id === sId || 
                        (norm && (normalizePhone(s.student_id) === norm || normalizePhone(s.parent_phone) === norm))
                    );

                    let studentPayload = {
                        student_name: studentName,
                        parent_name: phuHuynhName || ("Phá»¥ huynh " + studentName),
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
                
                // Kiá»ƒm tra xem mÃ£ bÃ i táº­p má»›i cÃ³ bá»‹ trÃ¹ng vá»›i há»c sinh khÃ¡c khÃ´ng
                let dupHw = students.find(s => {
                    if (s.deleted_date) return false;
                    // Bá» qua chÃ­nh há»c sinh Ä‘ang sá»­a
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
                        error: `MÃ£ bÃ i táº­p "${finalHwId}" Ä‘Ã£ Ä‘Æ°á»£c sá»­ dá»¥ng. Vui lÃ²ng Ä‘á»•i mÃ£ bÃ i táº­p khÃ¡c!` 
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
            // 5. BÃ€I Táº¬P GIA SÆ¯
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
                
                // Náº¿u Gia sÆ° cÃ³ Ä‘Ã­nh kÃ¨m file vÃ  Ä‘Ã£ cáº¥u hÃ¬nh Google Apps Script Web App, lÆ°u file tháº³ng vÃ o Google Drive
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
                                    studentName || 'Giao bÃ i táº­p',
                                    title || 'Äá» bÃ i táº­p',
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
                        console.warn("LÆ°u Drive timeout hoáº·c lá»—i, tá»± Ä‘á»™ng chuyá»ƒn sang lÆ°u an toÃ n trá»±c tiáº¿p:", driveErr);
                    }
                }
                
                // LÆ°u trá»¯ trá»±c tiáº¿p file base64 an toÃ n náº¿u Drive chÆ°a tráº£ vá» link
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
                        payload.hw_name = title + (finalDue ? ` [Háº¡n: ${finalDue}]` : "");
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
                
                // Náº¿u cÃ³ file má»›i, upload lÃªn Google Drive
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
                                    'Giao bÃ i táº­p',
                                    title || 'Äá» bÃ i táº­p',
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
                        console.warn("Lá»—i cáº­p nháº­t file lÃªn Drive, chuyá»ƒn sang lÆ°u trá»±c tiáº¿p:", driveErr);
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
                        updateData.hw_name = title + (finalDue ? ` [Háº¡n: ${finalDue}]` : "");
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
                    status: "ÄÃ£ cháº¥m"
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
                const norm = normalizePhone(rawCode);
                
                let studentsRaw = await supaGet(APP_CONFIG.TABLES.STUDENTS, `select=*`);
                let activeStudents = studentsRaw.filter(s => !s.deleted_date);
                let target = activeStudents.find(s => {
                    let sHw = normalizePhone(s.homework_id);
                    let sId = normalizePhone(s.student_id);
                    let sParent = normalizePhone(s.parent_phone);
                    // Báº¢O Máº¬T: khÃ´ng cháº¥p nháº­n tÃªn há»c sinh lÃ m mÃ£ truy cáº­p
                    return (sHw && sHw === norm) || (sId && sId === norm) || (sParent && sParent === norm) ||
                           (s.homework_id && s.homework_id === rawCode) || (s.student_id && s.student_id === rawCode) || (s.parent_phone && s.parent_phone === rawCode);
                });
                
                if (!target) {
                    result = { timThay: false, thongBao: "MÃ£ bÃ i táº­p khÃ´ng há»£p lá»‡!" };
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
                const subId = `SUB_GS_${Date.now()}`;
                const nowStr = new Date().toLocaleString('vi-VN');
                const todayStr = new Date().toLocaleDateString('vi-VN');
                let fileUrl = "";
                
                // Tra cá»©u thÃ´ng tin há»c sinh Ä‘á»ƒ gáº¯n chuáº©n mÃ£
                let studentsRaw = await supaGet(APP_CONFIG.TABLES.STUDENTS, `select=*`);
                let norm = normalizePhone(ma);
                let target = studentsRaw.find(s => {
                    let sHw = normalizePhone(s.homework_id);
                    let sId = normalizePhone(s.student_id);
                    let sParent = normalizePhone(s.parent_phone);
                    // Báº¢O Máº¬T: chá»‰ xÃ¡c Ä‘á»‹nh há»c sinh theo mÃ£, khÃ´ng theo tÃªn do client gá»­i lÃªn (chá»‘ng ná»™p bÃ i giáº£ danh)
                    return (sHw && sHw === norm) || (sId && sId === norm) || (sParent && sParent === norm) ||
                           (s.homework_id && s.homework_id === ma) || (s.student_id && s.student_id === ma) || (s.parent_phone && s.parent_phone === ma);
                });

                const finalCode = (target && target.homework_id) ? target.homework_id : ma;
                const finalStudentName = (target && target.student_name) ? target.student_name : (studentName || "Há»c sinh");

                // Náº¿u Ä‘Ã£ cáº¥u hÃ¬nh Google Apps Script Web App cÅ©, gá»i trá»±c tiáº¿p hÃ m uploadHomeworkFiles trong Student.gs
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
                        console.warn("Lá»—i gá»i Apps Script Web App cÅ©, chuyá»ƒn sang lÆ°u trá»¯ an toÃ n:", driveErr);
                    }
                }
                
                // Fallback náº¿u chÆ°a cáº¥u hÃ¬nh Google Drive Web App hoáº·c khÃ´ng dÃ¹ng Drive
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
                                    name: f.fileName || (`áº¢nh ${fIdx + 1}`),
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
                    lesson_name: lessonName || "BÃ i lÃ m gia sÆ°",
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
            // 6. Ã KIáº¾N PHáº¢N Há»’I PHá»¤ HUYNH (10 NGÃ€Y Gáº¦N NHáº¤T)
            // ==========================================
            else if (functionName === 'getTutorFeedback') {
                const [tutorPhone] = args;
                let fbs = await supaGet(APP_CONFIG.TABLES.FEEDBACKS, `select=*`);
                
                // Láº¥y danh sÃ¡ch há»c sinh cá»§a gia sÆ° nÃ y (náº¿u cÃ³ tutorPhone)
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

                // Lá»c chÃ­nh xÃ¡c chá»‰ láº¥y cÃ¡c pháº£n há»“i cá»§a PHá»¤ HUYNH trong 10 ngÃ y gáº§n nháº¥t
                let recentFbs = [];
                for (let fb of fbs) {
                    // TUYá»†T Äá»I KHÃ”NG Láº¤Y THÃ”NG BÃO Há»† THá»NG Cá»¦A ADMIN
                    if (fb.feedback_id === 'SYSTEM_MARQUEE' || fb.student_phone === 'ADMIN' || fb.student_name === 'ThÃ´ng bÃ¡o há»‡ thá»‘ng') {
                        continue;
                    }

                    if (isOlderThan10Days(fb.submitted_at)) {
                        // Tá»± Ä‘á»™ng dá»n dáº¹p xÃ³a khá»i Supabase náº¿u quÃ¡ 10 ngÃ y
                        supaDelete(APP_CONFIG.TABLES.FEEDBACKS, `feedback_id=eq.${encodeURIComponent(fb.feedback_id)}`).catch(() => {});
                    } else {
                        // Náº¿u cÃ³ tutorPhone, chá»‰ láº¥y pháº£n há»“i cá»§a há»c sinh thuá»™c gia sÆ° Ä‘Ã³
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
                const fbId = `FB_GS_${Date.now()}`;
                await supaPost(APP_CONFIG.TABLES.FEEDBACKS, [{
                    feedback_id: fbId,
                    student_phone: String(maHS || ""),
                    student_name: tenHocSinh || "Phá»¥ huynh",
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
                    result = { error: 'Tá»« chá»‘i truy cáº­p: Thiáº¿u thÃ´ng tin xÃ¡c thá»±c Admin!' };
                } else {
                    // Báº¢O Máº¬T: Ä‘Ã£ xÃ³a backdoor 302001/1234. So khá»›p PIN trong truy váº¥n, khÃ´ng táº£i cáº£ báº£ng admin.
                    const rawA = String(adminPhone).trim();
                    const candsA = Array.from(new Set([rawA, normAdminPhone, normAdminPhone ? '0' + normAdminPhone : ''].filter(Boolean)));
                    const encA = v => encodeURIComponent('"' + String(v).replace(/"/g, '') + '"');
                    const orA = 'or=(' + candsA.map(c => `phone.eq.${encA(c)}`).concat(candsA.map(c => `admin_id.eq.${encA(c)}`)).join(',') + ')';
                    let adminsRaw = await supaGet(APP_CONFIG.TABLES.ADMINS, `select=admin_id,phone&${orA}&pin=eq.${encodeURIComponent(String(adminPin).trim())}`);
                    let validAdmin = Array.isArray(adminsRaw) && adminsRaw.some(a =>
                        normalizePhone(a.phone) === normAdminPhone || String(a.admin_id).trim() === rawA
                    );
                    
                    if (!validAdmin) {
                        result = { error: 'Tá»« chá»‘i truy cáº­p: ThÃ´ng tin xÃ¡c thá»±c Admin khÃ´ng há»£p lá»‡ hoáº·c Ä‘Ã£ háº¿t háº¡n!' };
                    } else {
                        result = await getAdminDashboardDataInternal();
                    }
                }
            }
            
            else if (functionName === 'adminLuuGiaSu' || functionName === 'adminLuuGiaSur' || functionName === 'saveTutorAccount') {
                const [oldPhone, name, phone, pin, qrUrl, createdDate, nextBillingDate, accountType] = args;
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
                    await supaPatch(APP_CONFIG.TABLES.TUTORS, `tutor_id=eq.${encodeURIComponent(existing.tutor_id)}`, {
                        name: name,
                        phone: p,
                        pin: pin,
                        qr_url: qrUrl !== undefined ? qrUrl : existing.qr_url,
                        registered_date: createdDate || existing.registered_date,
                        next_due_date: nextBilling || existing.next_due_date,
                        account_type: accountType || existing.account_type || "Gia sÆ° (1-1)"
                    });
                } else {
                    await supaPost(APP_CONFIG.TABLES.TUTORS, [{
                        tutor_id: p,
                        name: name,
                        phone: p,
                        pin: pin,
                        qr_url: qrUrl || "",
                        registered_date: createdDate || new Date().toLocaleDateString('vi-VN'),
                        next_due_date: nextBilling,
                        account_type: accountType || "Gia sÆ° (1-1)",
                        status: "Hoáº¡t Ä‘á»™ng"
                    }]);
                }
                result = { success: true };
            }
            
            else if (functionName === 'adminCapNhatTaiKhoanAdmin') {
                const [oldPhone, name, phone, pin] = args;
                const p = oldPhone || phone;
                let admins = await supaGet(APP_CONFIG.TABLES.ADMINS, `select=*`);
                let target = admins.find(a => normalizePhone(a.phone) === normalizePhone(p) || String(a.admin_id).trim() === String(p).trim());
                let targetId = target ? target.admin_id : p;
                
                await supaPatch(APP_CONFIG.TABLES.ADMINS, `admin_id=eq.${encodeURIComponent(targetId)}`, {
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
                
                // Kiá»ƒm tra xem cÃ³ pháº£i tÃ i khoáº£n admin khÃ´ng
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

                    // Äá»“ng bá»™ Ä‘á»•i sá»‘ Ä‘iá»‡n thoáº¡i gia sÆ° trong danh sÃ¡ch há»c sinh náº¿u cÃ³ Ä‘á»•i phone
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
                
                await supaPatch(APP_CONFIG.TABLES.TUTORS, `tutor_id=eq.${encodeURIComponent(targetId)}`, { status: status || 'Hoáº¡t Ä‘á»™ng' });
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
                
                // Gia háº¡n thÃªm 1 thÃ¡ng cho Ä‘áº¿n khi ngÃ y háº¡n má»›i vÆ°á»£t qua ngÃ y hiá»‡n táº¡i
                do {
                    nextDate.setMonth(nextDate.getMonth() + 1);
                } while (nextDate <= today);
                
                // Giá»¯ láº¡i Ä‘Ãºng ngÃ y chu ká»³ náº¿u há»£p lá»‡
                if (dayOfMonth && dayOfMonth <= 28) {
                    nextDate.setDate(dayOfMonth);
                }
                
                let nextDueStr = `${String(nextDate.getDate()).padStart(2, '0')}/${String(nextDate.getMonth() + 1).padStart(2, '0')}/${nextDate.getFullYear()}`;
                
                await supaPatch(APP_CONFIG.TABLES.TUTORS, `tutor_id=eq.${encodeURIComponent(targetId)}`, {
                    next_due_date: nextDueStr,
                    status: 'Hoáº¡t Ä‘á»™ng'
                });
                result = { success: true, nextDue: nextDueStr };
            }
            
            else if (functionName === 'adminLuuMarquee') {
                const [text] = args;
                let cleanText = String(text || '').trim();
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
                            student_name: 'ThÃ´ng bÃ¡o há»‡ thá»‘ng',
                            content: cleanText,
                            submitted_at: new Date().toLocaleString('vi-VN')
                        }]);
                    }
                } else {
                    if (fbs && fbs.length > 0) {
                        await supaDelete(APP_CONFIG.TABLES.FEEDBACKS, 'feedback_id=eq.SYSTEM_MARQUEE');
                    }
                }
                result = { success: true };
            }
            
            else {
                console.warn(`[${APP_CONFIG.SCOPE}] HÃ m ${functionName} Ä‘ang fallback.`);
                result = { success: true };
            }
            
            window.tempAuth = null;
            if (self._successHandler) {
                self._successHandler(result);
            }
            
        } catch (err) {
            window.tempAuth = null;
            console.error(`[${APP_CONFIG.SCOPE}] Lá»—i API [${functionName}]:`, err);
            if (self._failureHandler) self._failureHandler(err.toString());
            else if (self._successHandler) self._successHandler({ error: err.message || err.toString() });
        }
    }
}

// HELPER INTERNAL: Load Dashboard Gia SÆ°
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
        deletedDate: s.deleted_date || "Gáº§n Ä‘Ã¢y",
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
            let isAttended = att.includes("Ä‘Ã£ há»c") || att.includes("há»c bÃ¹") || att.includes("cÃ³ máº·t");
            let isPaid = String(e.paid_status || "").toLowerCase().includes("Ä‘Ã£ Ä‘Ã³ng");
            if (isAttended && !isPaid) {
                totalUnpaid += Number(st.tuition) || 0;
            }
        });
    });
    
    let marqueeFbs = await supaGet(APP_CONFIG.TABLES.FEEDBACKS, 'feedback_id=eq.SYSTEM_MARQUEE');
    let marqueeText = (marqueeFbs && marqueeFbs.length > 0) ? marqueeFbs[0].content : "";
    
    return {
        tutorPhone: matchedTutor ? matchedTutor.phone : tutorPhone,
        tutorName: matchedTutor ? matchedTutor.name : "Gia sÆ°",
        tutorPin: matchedTutor ? matchedTutor.pin : "",
        qrCode: matchedTutor ? matchedTutor.qr_url : "",
        students: activeStudents,
        deletedStudents: deletedStudents,
        totalUnpaidIncome: totalUnpaid,
        classCount: activeStudents.length,
        marqueeAnnouncement: marqueeText
    };
}

// HELPER INTERNAL: Load Dashboard Admin
async function getAdminDashboardDataInternal() {
    let tutorsRaw = await supaGet(APP_CONFIG.TABLES.TUTORS, `select=*`);
    let studentsRaw = await supaGet(APP_CONFIG.TABLES.STUDENTS, `select=*`);
    let evalsRaw = await supaGet(APP_CONFIG.TABLES.EVALUATIONS, `select=*`);
    let adminsRaw = await supaGet(APP_CONFIG.TABLES.ADMINS, `select=*`);
    let marqueeFbs = await supaGet(APP_CONFIG.TABLES.FEEDBACKS, 'feedback_id=eq.SYSTEM_MARQUEE');
    let marqueeText = (marqueeFbs && marqueeFbs.length > 0) ? marqueeFbs[0].content : "";
    
    let tutors = tutorsRaw.filter(t => !t.deleted_date).map(t => ({
        name: t.name,
        phone: t.phone,
        pin: t.pin,
        qrUrl: t.qr_url,
        createdDate: t.registered_date || "18/07/2026",
        nextBillingDate: t.next_due_date || "18/09/2026",
        lastActive: t.last_active || "Vá»«a xong",
        status: t.status || "Hoáº¡t Ä‘á»™ng",
        accountType: t.account_type || "Gia sÆ° (1-1)"
    }));
    
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
    
    // TÃ­nh toÃ¡n bÃ¡o cÃ¡o doanh thu & lÆ°Æ¡ng chi tiáº¿t theo thÃ¡ng vÃ  gia sÆ°
    let defaultYear = new Date().getFullYear();
    let incomeReports = {};
    
    evalsRaw.filter(e => !e.deleted_date).forEach(e => {
        let att = String(e.attendance_status || '').toLowerCase();
        let isAttended = att.includes('Ä‘Ã£ há»c') || att.includes('há»c bÃ¹') || att.includes('cÃ³ máº·t');
        if (!isAttended) return;

        let month = 0, year = defaultYear;
        let dateStr = String(e.study_date || '').trim();
        if (dateStr.includes('/')) {
            let parts = dateStr.split('/');
            if (parts.length >= 2) {
                month = parseInt(parts[1], 10);
                if (parts.length >= 3 && parts[2].length >= 4) {
                    year = parseInt(parts[2], 10);
                }
            }
        }
        if (!month || month < 1 || month > 12) {
            month = new Date().getMonth() + 1;
        }
        let mKey = 'ThÃ¡ng ' + month + '/' + year;

        let normPhone = normalizePhone(e.student_phone);
        let st = studentsRaw.find(s => 
            (normPhone && (normalizePhone(s.student_id) === normPhone || normalizePhone(s.parent_phone) === normPhone)) ||
            (e.student_name && s.student_name && s.student_name.trim().toLowerCase() === e.student_name.trim().toLowerCase())
        );

        let fee = st ? (Number(st.tuition_fee) || 0) : 0;
        let isPaid = String(e.paid_status || '').toLowerCase().includes('Ä‘Ã£ Ä‘Ã³ng');

        let tutorPhone = e.tutor_phone || (st ? st.tutor_phone : '');
        let normTutor = normalizePhone(tutorPhone);
        let tutor = tutorsRaw.find(t => normalizePhone(t.phone) === normTutor || String(t.tutor_id).trim() === String(tutorPhone).trim());
        let tKey = tutor ? tutor.phone : (tutorPhone || 'OTHER');
        let tName = tutor ? tutor.name : 'Gia sÆ°';

        if (!incomeReports[mKey]) {
            incomeReports[mKey] = { expected: 0, paid: 0, unpaid: 0, tutors: {} };
        }
        incomeReports[mKey].expected += fee;
        if (isPaid) {
            incomeReports[mKey].paid += fee;
        } else {
            incomeReports[mKey].unpaid += fee;
        }

        if (!incomeReports[mKey].tutors[tKey]) {
            incomeReports[mKey].tutors[tKey] = { name: tName, expected: 0, paid: 0, unpaid: 0 };
        }
        incomeReports[mKey].tutors[tKey].expected += fee;
        if (isPaid) {
            incomeReports[mKey].tutors[tKey].paid += fee;
        } else {
            incomeReports[mKey].tutors[tKey].unpaid += fee;
        }
    });

    let adminInfo = (adminsRaw && adminsRaw.length > 0) ? {
        name: adminsRaw[0].name,
        phone: adminsRaw[0].phone,
        pin: adminsRaw[0].pin
    } : { name: 'Quáº£n trá»‹ viÃªn', phone: '', pin: '' };
    
    return {
        tutors: tutors,
        students: students,
        deletedTutors: deletedTutors,
        incomeReports: incomeReports,
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

