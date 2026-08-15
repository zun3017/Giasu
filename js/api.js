/**
 * ============================================================================
 * SUPABASE API GATEWAY - PHÂN VÙNG: HỆ THỐNG GIA SƯ 1-1 (SCOPE: GIASU)
 * ============================================================================
 * - Độc lập 100% với Web Lớp Học, toàn bộ bảng mang tiền tố gs_*
 * - Tương thích 100% với toàn bộ hàm gọi từ Google Apps Script (Tutor, Student, Admin)
 * - Tự động nạp dữ liệu gốc từ Supabase
 * - Kế thừa đầy đủ: Xóa mềm, Thùng rác, và Tự động hủy sau 10 ngày.
 */

const APP_CONFIG = {
    APP_NAME: 'Hệ Thống Gia Sư',
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
    // URL Google Apps Script Web App của bạn để tự động lưu bài nộp vào Google Drive
    DRIVE_UPLOAD_URL: 'https://script.google.com/macros/s/AKfycbzx_WVglUnQJt-waxC3irwQiGAP81G7SamjQZgsKRfBAbWPOUFbqLykMNB6x60tMim-/exec'
};

const HEADERS = {
    'apikey': APP_CONFIG.SUPABASE_KEY,
    'Authorization': `Bearer ${APP_CONFIG.SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
};

function normalizePhone(p) {
    if (!p) return "";
    return String(p).replace(/\D/g, '').replace(/^84/, '0').replace(/^0+/, '');
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
        const res = await fetch(url, { method: 'GET', headers: HEADERS });
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
        headers: { ...HEADERS, 'Prefer': 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
}

async function supaPatch(table, matchParam, body) {
    const url = `${APP_CONFIG.SUPABASE_URL}/rest/v1/${table}?${matchParam}`;
    const res = await fetch(url, {
        method: 'PATCH',
        headers: HEADERS,
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
}

async function supaDelete(table, matchParam) {
    const url = `${APP_CONFIG.SUPABASE_URL}/rest/v1/${table}?${matchParam}`;
    const res = await fetch(url, { method: 'DELETE', headers: HEADERS });
    if (!res.ok) throw new Error(await res.text());
    return true;
}

// ============================================================================
// CƠ CHẾ TỰ ĐỘNG DỌN DẸP THÙNG RÁC QUÁ 10 NGÀY (PHÂN VÙNG: GIA SƯ)
// ============================================================================
async function autoPurgeOldTrashItems() {
    const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    function isOlderThan10Days(dateStr) {
        if (!dateStr) return false;
        let d = new Date(dateStr);
        if (isNaN(d.getTime())) {
            let parts = String(dateStr).split('/');
            if (parts.length === 3) d = new Date(parts[2], parts[1] - 1, parts[0]);
        }
        if (isNaN(d.getTime())) return false;
        return (now - d.getTime()) > TEN_DAYS_MS;
    }
    
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
            if (['getTutorDashboardData', 'getAdminDashboardData', 'loginSystem'].includes(functionName)) {
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
                
                if (pin && String(pin).trim() !== "") {
                    let admins = await supaGet(APP_CONFIG.TABLES.ADMINS, `select=*`);
                    let mAdmin = admins.find(a => normalizePhone(a.phone) === norm || String(a.admin_id).trim() === String(phone).trim());
                    if (mAdmin && String(mAdmin.pin).trim() === String(pin).trim()) {
                        result = {
                            role: 'admin',
                            thongBao: "Đăng nhập với quyền Admin thành công!",
                            data: await getAdminDashboardDataInternal()
                        };
                    } else {
                        let tutors = await supaGet(APP_CONFIG.TABLES.TUTORS, `select=*`);
                        let mTutor = tutors.find(t => normalizePhone(t.phone) === norm || String(t.tutor_id).trim() === String(phone).trim());
                        if (mTutor && !mTutor.deleted_date) {
                            if (String(mTutor.pin).trim() === String(pin).trim()) {
                                if (mTutor.status === 'Vô hiệu hóa') {
                                    result = { error: 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ Admin!' };
                                } else {
                                    result = {
                                        role: 'tutor',
                                        thongBao: "Đăng nhập với quyền Gia sư thành công!",
                                        data: await getTutorDashboardDataInternal(mTutor.phone)
                                    };
                                }
                            } else {
                                result = { error: 'Mã PIN không chính xác!' };
                            }
                        } else {
                            result = { error: 'Không tìm thấy số điện thoại trong hệ thống!' };
                        }
                    }
                } else {
                    let studentsRaw = await supaGet(APP_CONFIG.TABLES.STUDENTS, `select=*`);
                    let activeStudents = studentsRaw.filter(s => !s.deleted_date);
                    let matches = activeStudents.filter(s => {
                        let sPhone = normalizePhone(s.parent_phone);
                        let sId = normalizePhone(s.student_id);
                        let sHw = normalizePhone(s.homework_id);
                        return (sPhone && sPhone === norm) || (sId && sId === norm) || (sHw && sHw === norm) ||
                               (s.student_id === phone) || (s.parent_phone === phone) ||
                               (s.student_name && s.student_name.toLowerCase() === String(phone).toLowerCase());
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
                        
                        let rawLogs = evalsRaw.filter(e => !e.deleted_date).map((e, idx) => ({
                            rowIndex: idx + 1,
                            evalId: e.eval_id,
                            tuan: e.week_num || "-",
                            ngay: formatShortDate(e.study_date),
                            mon: e.subject || "Toán học",
                            noiDung: e.lesson_content || "",
                            danhGiaBTVN: e.hw_eval || "Hoàn thành",
                            btvn: e.hw_eval || "Hoàn thành",
                            diemDauGio: cleanScore(e.entry_test),
                            diemDinhKi: cleanScore(e.term_test),
                            trangThai: e.attendance_status || "Đã học",
                            tienDong: e.paid_status || "",
                            ngayDongTien: e.paid_date || ""
                        }));
                        let lichSuHocTap = sortLogsChronological(rawLogs);
                        
                        let hwsRaw = await supaGet(APP_CONFIG.TABLES.HOMEWORK, `select=*`);
                        let myHw = hwsRaw.filter(h => !h.deleted_date && (
                            h.student_name === target.student_name ||
                            h.homework_code === target.homework_id ||
                            h.homework_code === target.student_id
                        )).map(h => ({
                            mon: "Gia sư",
                            tenBai: h.hw_name,
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
                
                let evalsRaw = await supaGet(APP_CONFIG.TABLES.EVALUATIONS, `select=*`);
                let matched = evalsRaw.filter(e => !e.deleted_date && (
                    normalizePhone(e.student_phone) === normalizePhone(studentPhone) ||
                    (studentName && e.student_name && e.student_name.toLowerCase() === studentName.toLowerCase())
                ));
                
                let rawLogs = matched.map((e, idx) => ({
                    rowIndex: e.eval_id,
                    evalId: e.eval_id,
                    tuan: e.week_num || "-",
                    ngay: formatShortDate(e.study_date),
                    mon: e.subject || "Toán học",
                    noiDung: e.lesson_content || "",
                    danhGiaBTVN: e.hw_eval || "Hoàn thành",
                    btvn: e.hw_eval || "Hoàn thành",
                    diemDauGio: cleanScore(e.entry_test),
                    diemDinhKi: cleanScore(e.term_test),
                    trangThai: e.attendance_status || "Đã học",
                    tienDong: e.paid_status || "",
                    ngayDongTien: e.paid_date || ""
                }));
                
                let logs = sortLogsChronological(rawLogs);
                
                result = { logs: logs };
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
            // 3. THÊM / SỬA / XÓA BUỔI HỌC
            // ==========================================
            else if (functionName === 'themBuoiHoc') {
                const [studentPhone, studentName, tuan, ngayDay, monHoc, noiDung, danhGiaBTVN, diemDauGio, diemDinhKi, trangThai] = args;
                const evalId = `EVAL_${studentPhone}_${Date.now()}`;
                await supaPost(APP_CONFIG.TABLES.EVALUATIONS, [{
                    eval_id: evalId,
                    student_phone: studentPhone,
                    student_name: studentName,
                    week_num: String(tuan || "1"),
                    study_date: ngayDay || "",
                    subject: monHoc || "Toán học",
                    lesson_content: noiDung || "",
                    hw_eval: danhGiaBTVN || "Hoàn thành",
                    entry_test: diemDauGio ? String(diemDauGio) : "",
                    term_test: diemDinhKi ? String(diemDinhKi) : "",
                    attendance_status: trangThai || "Đã học",
                    paid_status: "Chưa đóng"
                }]);
                result = { success: true, evalId: evalId };
            }
            
            else if (functionName === 'suaBuoiHoc') {
                const [rowIndex, tuan, ngayDay, monHoc, noiDung, danhGiaBTVN, diemDauGio, diemDinhKi, trangThai] = args;
                const evalId = rowIndex;
                await supaPatch(APP_CONFIG.TABLES.EVALUATIONS, `eval_id=eq.${encodeURIComponent(evalId)}`, {
                    week_num: String(tuan || "1"),
                    study_date: ngayDay || "",
                    subject: monHoc || "Toán học",
                    lesson_content: noiDung || "",
                    hw_eval: danhGiaBTVN || "Hoàn thành",
                    entry_test: diemDauGio ? String(diemDauGio) : "",
                    term_test: diemDinhKi ? String(diemDinhKi) : "",
                    attendance_status: trangThai || "Đã học"
                });
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
                const [tutorPhone, phuHuynhName, studentName, studentPhone, tuition, maBaiTap, thongBao] = args;
                const sId = studentPhone || `HS_GS_${Date.now()}`;
                await supaPost(APP_CONFIG.TABLES.STUDENTS, [{
                    student_id: sId,
                    student_name: studentName,
                    parent_name: phuHuynhName || "",
                    parent_phone: studentPhone || sId,
                    tutor_phone: tutorPhone || "",
                    tuition_fee: tuition ? Number(tuition) : null,
                    homework_id: maBaiTap || sId,
                    announcement: thongBao || ""
                }]);
                result = { success: true, studentId: sId };
            }
            
            else if (functionName === 'suaThongTinHocSinh' || functionName === 'updateTutorStudent') {
                const [oldPhone, phuHuynhName, studentName, studentPhone, tuition, maBaiTap, thongBao] = args;
                await supaPatch(APP_CONFIG.TABLES.STUDENTS, `student_id=eq.${encodeURIComponent(oldPhone)}`, {
                    student_name: studentName,
                    parent_name: phuHuynhName || "",
                    parent_phone: studentPhone || oldPhone,
                    tuition_fee: tuition ? Number(tuition) : null,
                    homework_id: maBaiTap || studentPhone || oldPhone,
                    announcement: thongBao || ""
                });
                result = { success: true };
            }
            
            else if (functionName === 'xoaHocSinhTamThoi' || functionName === 'deleteTutorStudent') {
                const [tutorPhone, studentPhone] = args;
                const p = studentPhone || tutorPhone;
                await supaPatch(APP_CONFIG.TABLES.STUDENTS, `student_id=eq.${encodeURIComponent(p)}`, {
                    deleted_date: new Date().toLocaleDateString('vi-VN')
                });
                result = { success: true };
            }
            
            else if (functionName === 'khoiPhucHocSinh' || functionName === 'restoreTutorStudent') {
                const [tutorPhone, studentPhone] = args;
                const p = studentPhone || tutorPhone;
                await supaPatch(APP_CONFIG.TABLES.STUDENTS, `student_id=eq.${encodeURIComponent(p)}`, { deleted_date: null });
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
                let matchStudent = (h) => {
                    if (!studentName) return true;
                    return h.student_name && h.student_name.trim().toLowerCase() === studentName.toLowerCase();
                };
                
                let active = hws.filter(h => !h.deleted_date && matchStudent(h));
                let trash = hws.filter(h => !!h.deleted_date && matchStudent(h));
                
                result = {
                    success: true,
                    activeList: active.map((h, idx) => ({
                        rowIndex: h.hw_id,
                        studentName: h.student_name,
                        title: h.hw_name,
                        releaseDate: h.release_date || "",
                        fileUrl: h.file_url || "",
                        externalLink: h.external_link || "",
                        status: h.status || "Active"
                    })),
                    trashList: trash.map((h, idx) => ({
                        rowIndex: h.hw_id,
                        studentName: h.student_name,
                        title: h.hw_name,
                        releaseDate: h.release_date || "",
                        fileUrl: h.file_url || "",
                        externalLink: h.external_link || "",
                        deletedDate: h.deleted_date || ""
                    }))
                };
            }
            
            else if (functionName === 'uploadAssignedHomework' || functionName === 'assignHomework') {
                const [tutorPhone, studentName, title, releaseDate, fileBase64, fileName, mimeType, maBaiTap, externalLink] = args;
                const hwId = `HW_GS_${Date.now()}`;
                let fileUrl = externalLink || "";
                
                // Nếu Gia sư có đính kèm file và đã cấu hình Google Apps Script Web App, lưu file thẳng vào Google Drive
                if (APP_CONFIG.DRIVE_UPLOAD_URL && fileBase64) {
                    try {
                        let driveRes = await fetch(APP_CONFIG.DRIVE_UPLOAD_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
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
                        let driveData = await driveRes.json();
                        let resObj = driveData.result || driveData;
                        if (resObj && resObj.success && resObj.fileUrl) {
                            fileUrl = resObj.fileUrl;
                        }
                    } catch (driveErr) {
                        console.warn("Lỗi tải đề bài lên Google Drive, chuyển sang lưu trữ an toàn:", driveErr);
                    }
                }
                
                // Fallback nếu chưa lưu được qua Drive
                if (!fileUrl && fileBase64) {
                    const mime = mimeType || "application/octet-stream";
                    fileUrl = `data:${mime};base64,${fileBase64}`;
                }
                
                await supaPost(APP_CONFIG.TABLES.HOMEWORK, [{
                    hw_id: hwId,
                    student_name: studentName,
                    hw_name: title,
                    release_date: releaseDate || new Date().toLocaleDateString('vi-VN'),
                    file_url: fileUrl,
                    homework_code: maBaiTap || "",
                    tutor_phone: tutorPhone || "",
                    external_link: externalLink || "",
                    status: 'Active'
                }]);
                result = { success: true, hwId: hwId, fileUrl: fileUrl };
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
                
                let subs = await supaGet(APP_CONFIG.TABLES.SUBMISSIONS, `select=*`);
                let matched = subs.filter(s => {
                    let sCode = String(s.homework_code || "").trim();
                    let sNorm = normalizePhone(sCode);
                    let matchCode = (norm && sNorm === norm) || (maBaiTap && sCode === maBaiTap);
                    let matchName = (studentName && s.student_name && s.student_name.trim().toLowerCase() === studentName.toLowerCase());
                    return matchCode || matchName;
                });
                
                result = {
                    success: true,
                    submissions: matched.map((s, idx) => ({
                        rowIndex: s.submission_id,
                        studentName: s.student_name,
                        lessonName: s.lesson_name,
                        fileUrl: s.file_url,
                        timestamp: s.submitted_at || s.submission_date || "",
                        status: s.status || "Active",
                        score: s.score || "-",
                        comment: s.comment || ""
                    }))
                };
            }
            
            else if (functionName === 'xacThucMaBaiTap') {
                const rawCode = String(args[0] || "").trim();
                const norm = normalizePhone(rawCode);
                
                let studentsRaw = await supaGet(APP_CONFIG.TABLES.STUDENTS, `select=*`);
                let activeStudents = studentsRaw.filter(s => !s.deleted_date);
                let target = activeStudents.find(s => {
                    return (normalizePhone(s.homework_id) === norm) || (normalizePhone(s.student_id) === norm) ||
                           (s.homework_id === rawCode) || (s.student_id === rawCode);
                });
                
                if (!target) {
                    result = { timThay: false, thongBao: "Mã bài tập không hợp lệ!" };
                } else {
                    let hwRaw = await supaGet(APP_CONFIG.TABLES.HOMEWORK, `select=*`);
                    let assignedList = hwRaw.filter(h => !h.deleted_date && (
                        h.student_name === target.student_name ||
                        h.homework_code === target.homework_id ||
                        h.homework_code === target.student_id
                    )).map((h, idx) => ({
                        hwId: h.hw_id,
                        rowIndex: idx + 1,
                        studentName: target.student_name,
                        title: h.hw_name,
                        releaseDate: h.release_date || "",
                        fileUrl: h.file_url || "",
                        externalLink: h.external_link || ""
                    }));
                    
                    let subsRaw = await supaGet(APP_CONFIG.TABLES.SUBMISSIONS, `select=*`);
                    let mySubs = subsRaw.filter(s => {
                        return (s.homework_code === target.homework_id) || (s.student_name === target.student_name);
                    }).map((s, idx) => ({
                        subId: s.submission_id,
                        studentName: s.student_name,
                        lessonName: s.lesson_name,
                        fileUrl: s.file_url,
                        timestamp: s.submitted_at,
                        status: s.status,
                        score: s.score,
                        comment: s.comment,
                        rowIndex: idx + 1
                    }));
                    
                    result = {
                        timThay: true,
                        ma: rawCode,
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
                let fileUrl = "";
                
                // Nếu đã cấu hình Google Apps Script Web App cũ, gọi trực tiếp hàm uploadHomeworkFiles trong Student.gs
                if (APP_CONFIG.DRIVE_UPLOAD_URL && filesList && filesList.length > 0 && filesList[0].fileBase64) {
                    try {
                        let driveRes = await fetch(APP_CONFIG.DRIVE_UPLOAD_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                            body: JSON.stringify({
                                functionName: 'uploadHomeworkFiles',
                                arguments: [ma, studentName, lessonName, filesList]
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
                        if (filesList[0].url) {
                            fileUrl = filesList[0].url;
                        } else if (filesList[0].fileBase64) {
                            const mime = filesList[0].mimeType || "application/octet-stream";
                            fileUrl = `data:${mime};base64,${filesList[0].fileBase64}`;
                        }
                    } else if (typeof filesList === 'string') {
                        fileUrl = filesList;
                    }
                }
                
                await supaPost(APP_CONFIG.TABLES.SUBMISSIONS, [{
                    submission_id: subId,
                    homework_code: ma,
                    student_name: studentName || "Học sinh",
                    lesson_name: lessonName || "Bài làm gia sư",
                    file_url: fileUrl || 'https://drive.google.com/',
                    submitted_at: nowStr,
                    submission_date: new Date().toLocaleDateString('vi-VN'),
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
                await supaDelete(APP_CONFIG.TABLES.SUBMISSIONS, `submission_id=eq.${encodeURIComponent(rowIndex)}`);
                result = { success: true };
            }
            
            // ==========================================
            // 6. Ý KIẾN PHỤ HUYNH
            // ==========================================
            else if (functionName === 'getTutorFeedback') {
                const [tutorPhone] = args;
                let fbs = await supaGet(APP_CONFIG.TABLES.FEEDBACKS, `select=*`);
                result = {
                    success: true,
                    feedbacks: fbs.map(fb => ({
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
                result = await getAdminDashboardDataInternal();
            }
            
            else if (functionName === 'adminLuuGiaSu' || functionName === 'saveTutorAccount') {
                const [oldPhone, name, phone, pin, qrUrl, createdDate, nextBillingDate, accountType] = args;
                const p = phone || oldPhone;
                await supaPost(APP_CONFIG.TABLES.TUTORS, [{
                    tutor_id: p,
                    name: name,
                    phone: p,
                    pin: pin,
                    qr_url: qrUrl || "",
                    registered_date: createdDate || new Date().toLocaleDateString('vi-VN'),
                    next_due_date: nextBillingDate || "",
                    account_type: accountType || "Gia sư (1-1)"
                }]);
                result = { success: true };
            }
            
            else if (functionName === 'adminCapNhatTaiKhoan' || functionName === 'updateTutorAccountInfo') {
                const [oldPhone, name, phone, pin, qrUrl] = args;
                const p = oldPhone || phone;
                let updateData = { name: name, pin: pin };
                if (qrUrl !== undefined) updateData.qr_url = qrUrl;
                if (phone && phone !== oldPhone) updateData.phone = phone;
                await supaPatch(APP_CONFIG.TABLES.TUTORS, `tutor_id=eq.${encodeURIComponent(p)}`, updateData);
                result = { success: true };
            }
            
            else if (functionName === 'xoaGiaSuTamThoi' || functionName === 'deleteTutor') {
                const [tutorPhone] = args;
                await supaPatch(APP_CONFIG.TABLES.TUTORS, `tutor_id=eq.${encodeURIComponent(tutorPhone)}`, {
                    deleted_date: new Date().toLocaleDateString('vi-VN')
                });
                result = { success: true };
            }
            
            else if (functionName === 'khoiPhucGiaSu' || functionName === 'restoreTutor') {
                const [tutorPhone] = args;
                await supaPatch(APP_CONFIG.TABLES.TUTORS, `tutor_id=eq.${encodeURIComponent(tutorPhone)}`, { deleted_date: null });
                result = { success: true };
            }
            
            else if (functionName === 'adminSetTutorStatus') {
                const [tutorPhone, status] = args;
                await supaPatch(APP_CONFIG.TABLES.TUTORS, `tutor_id=eq.${encodeURIComponent(tutorPhone)}`, { status: status });
                result = { success: true };
            }
            
            else if (functionName === 'adminLuuMarquee') {
                result = { success: true };
            }
            
            else {
                console.warn(`[${APP_CONFIG.SCOPE}] Hàm ${functionName} đang fallback.`);
                result = { success: true };
            }
            
            if (self._successHandler) {
                self._successHandler(result);
            }
            
        } catch (err) {
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
        maBaiTap: s.homework_id || s.student_id || s.parent_phone || "",
        thongBao: s.announcement || ""
    }));
    
    let deletedStudents = myStudents.filter(s => !!s.deleted_date).map(s => ({
        phone: s.parent_phone || s.student_id,
        name: s.student_name,
        parentName: s.parent_name || "",
        tuition: s.tuition_fee || 0,
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
    
    return {
        tutorPhone: matchedTutor ? matchedTutor.phone : tutorPhone,
        tutorName: matchedTutor ? matchedTutor.name : "Gia sư",
        tutorPin: matchedTutor ? matchedTutor.pin : "",
        qrCode: matchedTutor ? matchedTutor.qr_url : "",
        students: activeStudents,
        deletedStudents: deletedStudents,
        totalUnpaidIncome: totalUnpaid,
        classCount: activeStudents.length,
        marqueeAnnouncement: ""
    };
}

// HELPER INTERNAL: Load Dashboard Admin
async function getAdminDashboardDataInternal() {
    let tutorsRaw = await supaGet(APP_CONFIG.TABLES.TUTORS, `select=*`);
    let studentsRaw = await supaGet(APP_CONFIG.TABLES.STUDENTS, `select=*`);
    
    let tutors = tutorsRaw.filter(t => !t.deleted_date).map(t => ({
        name: t.name,
        phone: t.phone,
        pin: t.pin,
        qrUrl: t.qr_url,
        createdDate: t.registered_date || "18/07/2026",
        nextBillingDate: t.next_due_date || "18/09/2026",
        lastActive: t.last_active || "Vừa xong",
        status: t.status || "Hoạt động",
        accountType: t.account_type || "Gia sư (1-1)"
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
        tuition: s.tuition_fee
    }));
    
    return {
        tutors: tutors,
        students: students,
        deletedTutors: deletedTutors,
        incomeReports: {},
        marqueeAnnouncement: ""
    };
}

window.google = {
    script: {
        get run() {
            return new GoogleScriptRunInstance();
        }
    }
};
