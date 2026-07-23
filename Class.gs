// Class.gs - Backend logic for Class Management System (Mô hình quản lý Lớp học)

const CLASS_SPREADSHEET_ID = '1g4M-WjXxCf-rx9aVNBcKrs6dgXsAlZGVupQP8P3xgyc';

var ssCache = null;
var schemaInitialized = false;

function getClassSpreadsheet() {
  if (ssCache) return ssCache;
  
  var ss = null;
  if (typeof CLASS_SPREADSHEET_ID !== 'undefined' && CLASS_SPREADSHEET_ID.trim() !== '') {
    try {
      ss = SpreadsheetApp.openById(CLASS_SPREADSHEET_ID.trim());
    } catch (e) {
      Logger.log("Lỗi mở Class Spreadsheet, dùng mặc định: " + e.toString());
    }
  }
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
  
  initClassSpreadsheetSchema(ss);
  ssCache = ss;
  return ss;
}

function clearClassCache(classId, type) {
  var cache = CacheService.getScriptCache();
  
  if (!type) {
    cache.remove("all_classes_raw");
    cache.remove("all_class_logs_raw");
  }

  if (!classId) return;
  var cleanClassId = String(classId).trim();
  if (type) {
    cache.remove("class_" + type + "_" + cleanClassId);
    if (type === "logs") cache.remove("all_class_logs_raw");
  } else {
    cache.remove("class_students_" + cleanClassId);
    cache.remove("class_logs_" + cleanClassId);
    cache.remove("class_hw_" + cleanClassId);
    cache.remove("class_announce_" + cleanClassId);
  }
}

// Hàm tự động khởi tạo 6 trang tính chuẩn màu cho Google Sheet Lớp học nhóm nếu chưa có
function initClassSpreadsheetSchema(ss) {
  if (!ss || schemaInitialized) return;

  // 1. Sheet 'Danh sách lớp học'
  var sClasses = ss.getSheetByName('Danh sách lớp học');
  if (!sClasses) {
    sClasses = ss.insertSheet('Danh sách lớp học');
    sClasses.appendRow(["Mã lớp", "Tên lớp", "SĐT / Mã Giáo viên", "Môn học", "Lịch học cố định", "Sĩ số tối đa", "Loại học phí", "Mã PIN Giáo viên"]);
    sClasses.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#5B2EFF").setFontColor("#FFFFFF");
    sClasses.setFrozenRows(1);
  }

  // 2. Sheet 'Học sinh lớp học'
  var sStudents = ss.getSheetByName('Học sinh lớp học');
  var studentHeaders = ["Mã học sinh", "Tên học sinh", "Mã lớp", "SĐT Phụ huynh", "Ngày tham gia", "Tên phụ huynh", "Học phí/buổi", "Mã bài tập", "Ngày xóa", "Loại học phí"];
  if (!sStudents) {
    sStudents = ss.insertSheet('Học sinh lớp học');
    sStudents.appendRow(studentHeaders);
    sStudents.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#8E4DFF").setFontColor("#FFFFFF");
    sStudents.setFrozenRows(1);
  }

  // 4. Sheet 'Bài tập lớp học'
  var sHw = ss.getSheetByName('Bài tập lớp học');
  var homeworkHeaders = ["Mã bài tập", "Mã lớp", "Tên lớp", "Tên bài tập", "Ngày giao", "Link đính kèm", "URL File đính kèm", "Tên file"];
  if (!sHw) {
    sHw = ss.insertSheet('Bài tập lớp học');
    sHw.appendRow(homeworkHeaders);
    sHw.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#8E4DFF").setFontColor("#FFFFFF");
    sHw.setFrozenRows(1);
  }

  // 5. Sheet 'Học sinh nộp bài lớp học'
  var sSubmissions = ss.getSheetByName('Học sinh nộp bài lớp học');
  if (!sSubmissions) {
    sSubmissions = ss.insertSheet('Học sinh nộp bài lớp học');
    sSubmissions.appendRow(["Mã nộp bài", "Mã bài tập", "Mã lớp", "Mã học sinh", "Tên học sinh", "SĐT Phụ huynh", "Link bài nộp", "Trạng thái chấm", "Điểm số", "Nhận xét Giáo viên", "Thời gian nộp"]);
    sSubmissions.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#3B82F6").setFontColor("#FFFFFF");
    sSubmissions.setFrozenRows(1);
  }

  // 6. Sheet 'Ý kiến Phụ huynh lớp học'
  var sFeedback = ss.getSheetByName('Ý kiến Phụ huynh lớp học');
  if (!sFeedback) {
    sFeedback = ss.insertSheet('Ý kiến Phụ huynh lớp học');
    sFeedback.appendRow(["Mã ý kiến", "Mã lớp", "SĐT Phụ huynh", "Tên học sinh", "Nội dung đóng góp", "Thời gian gửi"]);
    sFeedback.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#EC4899").setFontColor("#FFFFFF");
    sFeedback.setFrozenRows(1);
  }

  // 7. Sheet 'Thông báo lớp'
  var sAnnounce = ss.getSheetByName('Thông báo lớp');
  if (!sAnnounce) {
    sAnnounce = ss.insertSheet('Thông báo lớp');
    sAnnounce.appendRow(["Mã lớp", "Tên lớp", "Nội dung thông báo", "Thời gian cập nhật"]);
    sAnnounce.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#8E4DFF").setFontColor("#FFFFFF");
    sAnnounce.setFrozenRows(1);
  }

  // 8. Sheet 'Nhật ký chung' (Database tập trung cho tất cả nhật ký học tập)
  var sLogs = ss.getSheetByName('Nhật ký chung');
  if (!sLogs) {
    sLogs = ss.insertSheet('Nhật ký chung');
    sLogs.setFrozenRows(0);
  }

  schemaInitialized = true;
}

// Hệ thống Block Allocation: Cấp phát 15 dòng trống cho mỗi lớp trong Nhật ký chung
function allocateClassBlock(ss, classId, className) {
  var sheetName = 'Nhật ký chung';
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  
  var data = sheet.getDataRange().getValues();
  // Kiểm tra xem lớp này đã được cấp phát Block chưa
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][1]).trim() === classId && String(data[i][0]).includes("--- NHẬT KÝ LỚP HỌC")) {
      return sheet; // Đã cấp phát
    }
  }
  
  // Chưa cấp phát -> Tạo Block mới ở cuối sheet
  sheet.appendRow(["--- NHẬT KÝ LỚP HỌC: " + className.toUpperCase() + " ---", classId, "", "", "", "", "", "", "", "", "", "", ""]);
  var headerRow = sheet.getLastRow();
  sheet.getRange(headerRow, 1, 1, 13).setFontWeight("bold").setBackground("#5B2EFF").setFontColor("#FFFFFF");
  
  var logHeaders = [
    "Mã nhật ký", "Mã lớp", "Tên lớp", "Tuần dạy", "Ngày học", "Môn học",
    "Trạng thái", "Đánh giá BTVN", "Điểm KT Đầu giờ", "Điểm KT Định kỳ",
    "Nội dung & Nhận xét chung", "Chi tiết nhận xét riêng (JSON)", "Ngày xóa"
  ];
  sheet.appendRow(logHeaders);
  sheet.getRange(headerRow + 1, 1, 1, 13).setFontWeight("bold").setBackground("#8E4DFF").setFontColor("#FFFFFF");
  
  // Chèn 15 dòng trống cho lớp này
  for (var k = 0; k < 15; k++) {
    sheet.appendRow(["", classId, className, "", "", "", "", "", "", "", "", "", ""]);
  }
  
  return sheet;
}

// Hàm đăng nhập dành cho Giáo viên Lớp học nhóm (Xác thực tài khoản tại Sheet Chính, lấy lớp tại Sheet Lớp)
function loginClassSystem(phone, pin) {
  var ssMain = SpreadsheetApp.getActiveSpreadsheet(); // Sheet chính Gia sư 1-1 / Admin chứa danh mục tài khoản Giáo viên
  var normPhone = normalizePhone(phone || "");
  if (!normPhone) {
    return { success: false, error: "Vui lòng nhập số điện thoại hợp lệ." };
  }

  // 1. Xác thực tài khoản giáo viên tại Sheet Chính ('Mã gia sư')
  var sheetGS = ssMain.getSheetByName('Mã gia sư');
  if (!sheetGS) {
    return { success: false, error: "Hệ thống chưa thiết lập danh sách Giáo viên." };
  }

  var dataGS = sheetGS.getDataRange().getValues();
  var teacherFound = false;
  var teacherName = "Giáo viên Lớp học";
  var tutorCode = "";

  for (var i = 1; i < dataGS.length; i++) {
    var rawPhone = dataGS[i][2] !== null && dataGS[i][2] !== undefined ? String(dataGS[i][2]).trim() : "";
    if (rawPhone && !rawPhone.startsWith("0") && /^\d+$/.test(rawPhone)) {
      rawPhone = "0" + rawPhone;
    }
    var gsPhone = normalizePhone(rawPhone);
    if (gsPhone !== "" && gsPhone === normPhone) {
      var tDelDate = (dataGS[i].length > 5 && dataGS[i][5] !== null) ? String(dataGS[i][5]).trim() : "";
      if (tDelDate !== "") continue; // Bỏ qua giáo viên đã xóa

      teacherFound = true;
      var truePin = String(dataGS[i][3] !== null && dataGS[i][3] !== undefined ? dataGS[i][3] : "").trim();
      var inputPin = String(pin || "").trim();
      
      if (inputPin !== truePin) {
        return { success: false, error: "Mã PIN bảo mật không chính xác!" };
      }

      var tStatus = (dataGS[i].length > 9 && dataGS[i][9] !== null) ? String(dataGS[i][9]).trim() : "";
      if (tStatus === "Vô hiệu hóa") {
        return { success: false, error: "Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ Admin!" };
      }

      teacherName = dataGS[i][1] || teacherName;
      tutorCode = dataGS[i][0] || "";
      break;
    }
  }

  if (!teacherFound) {
    return { success: false, error: "Số điện thoại giáo viên không tồn tại trên hệ thống." };
  }

  // 2. Lấy danh sách lớp học của giáo viên từ Sheet Lớp học
  var classes = getClassList(phone, tutorCode);

  return {
    success: true,
    role: "class_tutor",
    tutorPhone: phone,
    tutorName: teacherName,
    tutorCode: tutorCode,
    classes: classes
  };
}

// Lấy danh sách Lớp học của Giáo viên theo SĐT hoặc Mã Giáo Viên
function getClassList(tutorPhone, tutorCode, ssParam) {
  var normPhone = normalizePhone(tutorPhone || "");
  var normCode = String(tutorCode || "").trim().toLowerCase();
  
  var teacherName = "";
  var cache = CacheService.getScriptCache();
  try {
    var gsCacheKey = "all_tutors_raw";
    var cachedGS = cache.get(gsCacheKey);
    var dataGS = null;
    
    if (cachedGS) {
      try { dataGS = JSON.parse(cachedGS); } catch(e){}
    }
    
    if (!dataGS) {
      var ssMain = SpreadsheetApp.getActiveSpreadsheet();
      var sheetGS = ssMain.getSheetByName('Mã gia sư');
      if (sheetGS) {
        dataGS = sheetGS.getDataRange().getValues();
        try {
          var gsStr = JSON.stringify(dataGS);
          if (gsStr.length < 95000) cache.put(gsCacheKey, gsStr, 600);
        } catch(e) {}
      }
    }
    
    if (dataGS) {
      for (var k = 1; k < dataGS.length; k++) {
        if (dataGS[k] && dataGS[k].length > 2) {
          var rawPhone = dataGS[k][2] !== null && dataGS[k][2] !== undefined ? String(dataGS[k][2]).trim() : "";
          if (rawPhone && !rawPhone.startsWith("0") && /^\d+$/.test(rawPhone)) {
            rawPhone = "0" + rawPhone;
          }
          if (normalizePhone(rawPhone) === normPhone) {
            teacherName = String(dataGS[k][1]).trim().toLowerCase();
            break;
          }
        }
      }
    }
  } catch (e) {
    Logger.log("Lỗi tra cứu tên giáo viên: " + e.toString());
  }
  
  var clsCacheKey = "all_classes_raw";
  var cachedCls = cache.get(clsCacheKey);
  var data = null;
  
  if (cachedCls) {
    try { 
      data = JSON.parse(cachedCls);
      if (!Array.isArray(data) || data.length <= 1) {
        data = null;
        cache.remove(clsCacheKey);
      }
    } catch(e){ data = null; cache.remove(clsCacheKey); }
  }
  
  if (!data || !Array.isArray(data) || data.length <= 1) {
    var ss = ssParam || getClassSpreadsheet();
    var sheetClasses = ss.getSheetByName('Danh sách lớp học');
    if (!sheetClasses) {
      sheetClasses = ss.insertSheet('Danh sách lớp học');
      sheetClasses.appendRow(["Mã lớp", "Tên lớp", "SĐT / Mã Giáo viên", "Môn học", "Lịch học cố định", "Sĩ số tối đa", "Loại học phí"]);
      sheetClasses.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#5B2EFF").setFontColor("#FFFFFF");
      return [];
    }
    data = sheetClasses.getDataRange().getValues();
    try {
      if (data && data.length > 1) {
        var clsStr = JSON.stringify(data);
        if (clsStr.length < 95000) cache.put(clsCacheKey, clsStr, 180);
      }
    } catch(e) {}
  }
  var allClasses = [];
  var matchedClasses = [];

  for (var i = 1; i < data.length; i++) {
    if (data[i] && data[i].length >= 2) {
      var cId = data[i][0] ? String(data[i][0]).trim() : "";
      var cName = data[i][1] ? String(data[i][1]).trim() : "";
      
      if (cName !== "" || cId !== "") {
        if (!cId) cId = "LH_" + i;
        if (!cName) cName = "Lớp " + i;
        
        var dbVal = data[i][2] !== null && data[i][2] !== undefined ? String(data[i][2]).trim() : "";
        if (dbVal && !dbVal.startsWith("0") && /^\d+$/.test(dbVal)) {
          dbVal = "0" + dbVal;
        }
        
        var clsObj = {
          classId: cId,
          className: cName,
          tutorPhone: dbVal,
          tutorCode: dbVal,
          subject: data[i][3] ? String(data[i][3]).trim() : "",
          schedule: data[i][4] ? String(data[i][4]).trim() : "",
          maxStudents: data[i][5] !== null && data[i][5] !== undefined ? String(data[i][5]).trim() : "20",
          feeType: (data[i].length > 6 && data[i][6]) ? String(data[i][6]).trim() : "per_session"
        };
        
        allClasses.push(clsObj);
        
        var dbPhone = normalizePhone(dbVal);
        var dbCode = dbVal.toLowerCase();
        
        var isMatch = false;
        if (normPhone === "" && normCode === "") {
          isMatch = true;
        } else if (dbVal === "") {
          isMatch = true;
        } else if (normPhone !== "" && dbPhone === normPhone) {
          isMatch = true;
        } else if (normCode !== "" && dbCode === normCode) {
          isMatch = true;
        } else if (teacherName !== "" && dbCode === teacherName) {
          isMatch = true; // Khớp bằng Tên Giáo viên
        }
        
        if (isMatch) {
          matchedClasses.push(clsObj);
        }
      }
    }
  }
  
  // Nếu tìm thấy theo SĐT / Mã GV / Tên GV thì lấy matchedClasses, nếu không thì lấy toàn bộ allClasses
  return (matchedClasses.length > 0) ? matchedClasses : allClasses;
}

// Lấy toàn bộ dữ liệu tổng cho Phân hệ Lớp Học trong 1 chuyến gọi server duy nhất (1s)
function getClassDashboardData(tutorPhone, requestedClassId, tutorCode) {
  var classes = getClassList(tutorPhone, tutorCode);
  
  if (!classes || classes.length === 0) {
    return {
      success: true,
      classes: [],
      activeClass: null,
      students: [],
      lessonLogs: [],
      announcement: "",
      homeworkList: []
    };
  }
  
  var activeClass = null;
  if (requestedClassId) {
    for (var i = 0; i < classes.length; i++) {
      if (classes[i].classId === requestedClassId) {
        activeClass = classes[i];
        break;
      }
    }
  }
  if (!activeClass) {
    activeClass = classes[0];
  }
  
  var students = getClassStudents(activeClass.classId);
  var lessonLogs = getClassLessonLogs(activeClass.classId, activeClass.className);
  var announcement = getClassAnnouncement(activeClass.classId);
  var homeworkList = getClassHomeworkList(activeClass.classId, activeClass.className);
  
  return {
    success: true,
    classes: classes,
    activeClass: activeClass,
    students: students || [],
    lessonLogs: lessonLogs || [],
    announcement: announcement || "",
    homeworkList: homeworkList || []
  };
}

// Tạo Lớp học mới
function createClass(tutorPhone, className, subject, schedule, feeType, tutorCode) {
  var ss = getClassSpreadsheet();
  var sheetClasses = ss.getSheetByName('Danh sách lớp học');
  
  if (!sheetClasses) {
    getClassList(tutorPhone, tutorCode);
    sheetClasses = ss.getSheetByName('Danh sách lớp học');
  }
  
  var classId = "LH_" + new Date().getTime().toString().slice(-6);
  var cleanClassName = String(className).trim();
  var ownerCred = (tutorCode && String(tutorCode).trim() !== "") ? String(tutorCode).trim() : (tutorPhone || "");
  
  sheetClasses.appendRow([classId, cleanClassName, ownerCred, subject || "", schedule || "", "", feeType || "per_session"]);
  
  // Cấp phát 15 dòng trống vào Nhật ký chung
  allocateClassBlock(ss, classId, cleanClassName);
  
  clearClassCache(null, null); // Xóa cache Danh sách lớp chung
  SpreadsheetApp.flush();
  
  return { success: true, classId: classId, className: cleanClassName, feeType: feeType || "per_session" };
}

// Cập nhật thông tin Lớp học (Tên lớp, Lịch dạy, Môn học, Loại học phí)
function updateClassInfo(classId, className, subject, schedule, feeType) {
  var ss = getClassSpreadsheet();
  var sheetClasses = ss.getSheetByName('Danh sách lớp học');
  if (!sheetClasses) return { error: "Không tìm thấy sheet Danh sách lớp học." };
  
  var data = sheetClasses.getDataRange().getDisplayValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === classId) {
      var oldClassName = data[i][1];
      sheetClasses.getRange(i + 1, 2).setValue(className);
      sheetClasses.getRange(i + 1, 4).setValue(subject);
      sheetClasses.getRange(i + 1, 5).setValue(schedule);
      sheetClasses.getRange(i + 1, 7).setValue(feeType || "per_session");
      
      // Nếu đổi tên lớp, tự động đổi tên Tab Sheet tương ứng
      if (oldClassName && oldClassName !== className) {
        var oldSheet = ss.getSheetByName(oldClassName) || ss.getSheetByName("Bảng đánh giá học tập dành cho lớp học (" + oldClassName + ")");
        if (oldSheet) {
          oldSheet.setName(className);
        }
      }
      
      clearClassCache(classId);
      SpreadsheetApp.flush();
      return { success: true };
    }
  }
  return { error: "Không tìm thấy lớp học với mã này." };
}

// Xóa tạm Lớp học vào Thùng rác (Soft Delete)
function deleteClass(classId, className) {
  var ss = getClassSpreadsheet();
  var sheetClasses = ss.getSheetByName('Danh sách lớp học');
  if (sheetClasses) {
    var data = sheetClasses.getDataRange().getDisplayValues();
    var nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(classId).trim()) {
        sheetClasses.getRange(i + 1, 8).setValue(nowStr); // Cột 8: Ngày xóa
        clearClassCache(classId);
        SpreadsheetApp.flush();
        break;
      }
    }
  }
  return { success: true };
}

// Lấy danh sách Học sinh thuộc một Lớp học
function getClassStudents(classId, ssParam) {
  var cleanClassId = String(classId || "").trim();
  if (cleanClassId === "") return [];
  
  var cache = CacheService.getScriptCache();
  var cacheKey = "class_students_" + cleanClassId;
  var cached = cache.get(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch(e) {
      Logger.log("Lỗi parse cache students: " + e.toString());
    }
  }
  
  var ss = ssParam || getClassSpreadsheet();
  var sheetStudents = ss.getSheetByName('Học sinh lớp học');
  var students = [];
  
  if (!sheetStudents) {
    sheetStudents = ss.insertSheet('Học sinh lớp học');
    sheetStudents.appendRow(["Mã học sinh", "Tên học sinh", "Mã lớp", "SĐT Phụ huynh", "Ngày tham gia", "Tên phụ huynh", "Học phí/buổi", "Mã bài tập", "Ngày xóa", "Loại học phí"]);
    sheetStudents.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#8E4DFF").setFontColor("#FFFFFF");
    return students;
  }
  
  var data = sheetStudents.getDataRange().getValues(); // Dùng getValues() để đọc thô siêu nhanh
  for (var i = 1; i < data.length; i++) {
    if (data[i].length >= 3 && String(data[i][2]).trim() === cleanClassId) {
      var deletedAt = (data[i].length > 8 && data[i][8] !== null) ? String(data[i][8]).trim() : "";
      if (deletedAt !== "") continue; // Bỏ qua học sinh nằm trong Thùng rác
      
      var phoneVal = data[i][3] !== null && data[i][3] !== undefined ? String(data[i][3]).trim() : "";
      if (phoneVal && !phoneVal.startsWith("0") && /^\d+$/.test(phoneVal)) {
        phoneVal = "0" + phoneVal;
      }
      
      var joinDateVal = "";
      if (data[i][4] instanceof Date) {
        joinDateVal = Utilities.formatDate(data[i][4], Session.getScriptTimeZone(), "dd/MM/yyyy");
      } else {
        joinDateVal = data[i][4] ? String(data[i][4]).trim() : "";
      }
      
      students.push({
        studentId: data[i][0] ? String(data[i][0]).trim() : "",
        studentName: data[i][1] ? String(data[i][1]).trim() : "",
        classId: String(data[i][2]).trim(),
        parentPhone: phoneVal,
        joinDate: joinDateVal,
        parentName: data[i][5] ? String(data[i][5]).trim() : "",
        fee: data[i][6] !== null && data[i][6] !== undefined ? String(data[i][6]).trim() : "",
        homeworkCode: data[i][7] !== null && data[i][7] !== undefined ? String(data[i][7]).trim() : "",
        feeType: (data[i].length > 9 && data[i][9]) ? String(data[i][9]).trim() : ""
      });
    }
  }
  
  try {
    cache.put(cacheKey, JSON.stringify(students), 600); // Lưu đệm 10 phút
  } catch(e) {
    Logger.log("Lỗi lưu cache students: " + e.toString());
  }
  
  return students;
}

// Thêm Học sinh mới vào Lớp học (Đầy đủ thông tin Phụ huynh, Học phí, Mã bài tập, Loại học phí)
function addClassStudent(classId, studentName, parentPhone, parentName, fee, homeworkCode, feeType) {
  var ss = getClassSpreadsheet();
  var sheetStudents = ss.getSheetByName('Học sinh lớp học');
  if (!sheetStudents) {
    getClassStudents(classId);
    sheetStudents = ss.getSheetByName('Học sinh lớp học');
  }
  
  var studentId = "HS_LH_" + new Date().getTime().toString().slice(-6);
  var joinDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy");
  
  sheetStudents.appendRow([
    studentId,
    studentName,
    classId,
    "'" + (parentPhone || ""),
    joinDate,
    parentName || "",
    fee || "",
    homeworkCode || "",
    "", // Cột 9: Ngày xóa (Trống = Hoạt động)
    feeType || "" // Cột 10: Loại học phí
  ]);
  
  clearClassCache(classId, "students");
  
  return {
    success: true,
    studentId: studentId,
    studentName: studentName,
    parentPhone: parentPhone,
    parentName: parentName,
    fee: fee,
    homeworkCode: homeworkCode,
    feeType: feeType || ""
  };
}

// Aliases cho các hàm CRUD Học sinh & Lớp học
function saveClassStudent(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
  if (typeof arg2 === 'string' && arguments.length >= 8) {
    return addClassStudent(arg1, arg3, arg4, arg5, arg6, arg7, arg8);
  } else {
    return addClassStudent(arg1, arg2, arg3, arg4, arg5, arg6, arg7);
  }
}

function deleteClassStudent(studentId) {
  return removeClassStudent(studentId);
}

function saveClass(tutorPhone, className, subject, schedule, feeType, tutorCode) {
  return createClass(tutorPhone, className, subject, schedule, feeType, tutorCode);
}

// Chỉnh sửa thông tin Học sinh Lớp học
function updateClassStudent(studentId, studentName, parentPhone, parentName, fee, homeworkCode, feeType) {
  var ss = getClassSpreadsheet();
  var sheetStudents = ss.getSheetByName('Học sinh lớp học');
  if (!sheetStudents) return { success: false, error: "Không tìm thấy sheet học sinh." };
  
  var data = sheetStudents.getDataRange().getDisplayValues();
  var rowIndex = -1;
  var classId = "";
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === studentId) {
      rowIndex = i + 1;
      classId = data[i][2];
      break;
    }
  }
  
  if (rowIndex !== -1) {
    sheetStudents.getRange(rowIndex, 2).setValue(studentName || "").setFontFamily("Arial");
    sheetStudents.getRange(rowIndex, 4).setValue("'" + (parentPhone || "")).setFontFamily("Arial");
    sheetStudents.getRange(rowIndex, 6).setValue(parentName || "").setFontFamily("Arial");
    sheetStudents.getRange(rowIndex, 7).setValue(fee || "").setFontFamily("Arial");
    sheetStudents.getRange(rowIndex, 8).setValue(homeworkCode || "").setFontFamily("Arial");
    sheetStudents.getRange(rowIndex, 10).setValue(feeType || "").setFontFamily("Arial");
    if (classId) clearClassCache(classId, "students");
    SpreadsheetApp.flush();
    return { success: true };
  }
  return { success: false, error: "Không tìm thấy học sinh cần sửa." };
}

// Chuyển Học sinh Lớp học vào Thùng rác (Soft delete)
function removeClassStudent(studentId) {
  var ss = getClassSpreadsheet();
  var sheetStudents = ss.getSheetByName('Học sinh lớp học');
  if (sheetStudents) {
    var data = sheetStudents.getDataRange().getDisplayValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === studentId) {
        var nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");
        sheetStudents.getRange(i + 1, 9).setValue(nowStr);
        var classId = data[i][2];
        if (classId) clearClassCache(classId, "students");
        SpreadsheetApp.flush();
        break;
      }
    }
  }
  return { success: true };
}

// Lấy danh sách Học sinh trong Thùng rác của Lớp học
function getClassTrashStudents(classId) {
  var ss = getClassSpreadsheet();
  var sheetStudents = ss.getSheetByName('Học sinh lớp học');
  var trashList = [];
  if (!sheetStudents) return trashList;
  
  var data = sheetStudents.getDataRange().getDisplayValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i].length >= 3 && data[i][2] === classId) {
      var deletedAt = (data[i].length > 8) ? data[i][8].trim() : "";
      if (deletedAt !== "") {
        trashList.push({
          studentId: data[i][0],
          studentName: data[i][1],
          classId: data[i][2],
          parentPhone: data[i][3] || "",
          parentName: data[i][5] || "",
          deletedAt: deletedAt
        });
      }
    }
  }
  return trashList;
}

// Khôi phục Học sinh từ Thùng rác Lớp học
function restoreClassStudent(studentId) {
  var ss = getClassSpreadsheet();
  var sheetStudents = ss.getSheetByName('Học sinh lớp học');
  if (sheetStudents) {
    var data = sheetStudents.getDataRange().getDisplayValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === studentId) {
        sheetStudents.getRange(i + 1, 9).setValue("");
        var classId = data[i][2];
        if (classId) clearClassCache(classId, "students");
        SpreadsheetApp.flush();
        break;
      }
    }
  }
  return { success: true };
}

// Xóa vĩnh viễn Học sinh khỏi Sheet Lớp học
function deleteClassStudentPermanently(studentId) {
  var ss = getClassSpreadsheet();
  var sheetStudents = ss.getSheetByName('Học sinh lớp học');
  if (sheetStudents) {
    var data = sheetStudents.getDataRange().getDisplayValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === studentId) {
        var classId = data[i][2];
        sheetStudents.deleteRow(i + 1);
        if (classId) clearClassCache(classId, "students");
        SpreadsheetApp.flush();
        break;
      }
    }
  }
  return { success: true };
}

// Lưu Đánh Giá Hàng Loạt Cho Lớp Học (Batch Evaluation) vào Sheet riêng của lớp
function saveClassBatchEvaluation(classId, className, studyDate, globalNotes, evaluationRows) {
  var ss = getClassSpreadsheet();
  var sheetEval = getOrCreateClassEvaluationSheet(ss, className);
  
  if (!evaluationRows || !Array.isArray(evaluationRows) || evaluationRows.length === 0) {
    return { error: "Không có dữ liệu đánh giá để lưu." };
  }
  
  for (var i = 0; i < evaluationRows.length; i++) {
    var row = evaluationRows[i];
    var evalId = "EV_" + new Date().getTime() + "_" + i;
    
    // Đảm bảo mặc định chuyên cần là "Có mặt" nếu không chọn
    var attendanceStatus = row.attendance || "Có mặt";
    var privateNotes = row.privateNotes || "";
    
    sheetEval.appendRow([
      evalId,
      classId,
      row.studentId || "",
      row.studentName || "",
      studyDate || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy"),
      attendanceStatus,
      row.homeworkScore || "",
      row.testScore || "",
      row.stars || "5",
      privateNotes,
      globalNotes || ""
    ]);
  }
  
  return { success: true, count: evaluationRows.length };
}

// Lấy lịch sử đánh giá gần đây của một Lớp học
function getClassEvaluations(className) {
  var ss = getClassSpreadsheet();
  var sheetEval = getOrCreateClassEvaluationSheet(ss, className);
  var data = sheetEval.getDataRange().getDisplayValues();
  
  var list = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i].length >= 6 && data[i][0] !== "") {
      list.push({
        evalId: data[i][0],
        classId: data[i][1],
        studentId: data[i][2],
        studentName: data[i][3],
        studyDate: data[i][4],
        attendance: data[i][5],
        homeworkScore: data[i][6],
        testScore: data[i][7],
        stars: data[i][8],
        privateNotes: data[i][9],
        globalNotes: data[i][10] || ""
      });
    }
  }
  return list;
}

// Đăng nhập hệ thống Lớp học dành cho Giáo viên Lớp học
function loginClassSystem(phone, pin) {
  var ss = getClassSpreadsheet();
  var normPhone = normalizePhone(phone);
  
  if (normPhone === "") {
    return { error: "Vui lòng nhập số điện thoại hợp lệ!" };
  }
  
  // Lấy dữ liệu tên giáo viên và phân quyền từ danh sách Gia sư
  var tutorName = "Giáo viên Lớp học";
  var accountType = "Cả hai";
  var found = false;
  
  var dataGS = getSheetDisplayValuesCached('Mã gia sư');
  for (var i = 1; i < dataGS.length; i++) {
    if (dataGS[i].length > 2 && normalizePhone(dataGS[i][2]) === normPhone) {
      found = true;
      tutorName = dataGS[i][1];
      accountType = (dataGS[i].length > 10 && dataGS[i][10].trim() !== "") ? dataGS[i][10].trim() : "Cả hai";
      break;
    }
  }

  // Chặn nếu tài khoản chỉ được phân quyền Gia sư 1-1
  if (found && accountType === "Gia sư (1-1)") {
    return { error: "Tài khoản của bạn được phân quyền làm Gia sư dạy 1-1. Vui lòng chọn mục 'Dành cho Gia sư' ở thanh menu để đăng nhập!" };
  }
  
  var classes = getClassList(phone);
  
  return {
    success: true,
    role: 'class_tutor',
    accountType: accountType,
    tutorName: tutorName,
    tutorPhone: phone,
    classes: classes
  };
}

// === QUẢN LÝ THỜI KHÓA BIỂU THẬT DÀNH CHO LỚP HỌC (SHEET 'Lịch học lớp') ===

function getOrCreateClassScheduleSheet(ss) {
  if (!ss) ss = getClassSpreadsheet();
  var sheet = ss.getSheetByName('Lịch học lớp');
  if (!sheet) {
    sheet = ss.insertSheet('Lịch học lớp');
    sheet.appendRow(["Mã lịch", "SĐT Giáo viên", "Tiêu đề ca dạy", "Các thứ trong tuần", "Giờ bắt đầu", "Giờ kết thúc", "Màu sắc"]);
    sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#8E4DFF").setFontColor("#FFFFFF");
  }
  return sheet;
}

function getClassScheduleEvents(tutorPhone) {
  var ss = getClassSpreadsheet();
  var sheet = getOrCreateClassScheduleSheet(ss);
  var normPhone = normalizePhone(tutorPhone);
  var data = sheet.getDataRange().getDisplayValues();
  
  var events = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i].length >= 6 && data[i][0] !== "") {
      var dbPhone = normalizePhone(data[i][1]);
      if (dbPhone !== "" && dbPhone === normPhone) {
        var daysArr = [];
        try {
          daysArr = JSON.parse(data[i][3]);
        } catch(e) {
          daysArr = [1, 4];
        }
        events.push({
          id: data[i][0],
          title: data[i][2],
          daysOfWeek: daysArr,
          startTime: data[i][4],
          endTime: data[i][5],
          backgroundColor: data[i][6] || "#8E4DFF",
          borderColor: data[i][6] || "#8E4DFF"
        });
      }
    }
  }
  return events;
}

function addClassScheduleEvent(tutorPhone, title, daysOfWeek, startTime, endTime, color) {
  var ss = getClassSpreadsheet();
  var sheet = getOrCreateClassScheduleSheet(ss);
  var eventId = "SCH_" + new Date().getTime();
  
  var daysJson = JSON.stringify(daysOfWeek || [1]);
  sheet.appendRow([eventId, "'" + tutorPhone, title, daysJson, startTime, endTime, color || "#8E4DFF"]);
  
  return {
    success: true,
    event: {
      id: eventId,
      title: title,
      daysOfWeek: daysOfWeek,
      startTime: startTime,
      endTime: endTime,
      backgroundColor: color || "#8E4DFF",
      borderColor: color || "#8E4DFF"
    }
  };
}

function deleteClassScheduleEvent(eventId) {
  var ss = getClassSpreadsheet();
  var sheet = getOrCreateClassScheduleSheet(ss);
  var data = sheet.getDataRange().getDisplayValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === eventId) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
  return { success: true };
}

// === LỊCH HỌC LỚP THEO KHUNG GOOGLE CALENDAR (GIAO DIỆN CHUẨN TƯƠNG THÍCH GIA SƯ 1-1) ===

function getClassSchedule(tutorPhone) {
  var ss = getClassSpreadsheet();
  var normPhone = normalizePhone(tutorPhone);
  var sheet = ss.getSheetByName('Lịch học lớp');
  
  if (!sheet) {
    sheet = ss.insertSheet('Lịch học lớp');
    sheet.appendRow(["Tên lớp", "SĐT Giáo viên", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"]);
    sheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#8E4DFF").setFontColor("#FFFFFF");
    return [];
  }
  
  var data = sheet.getDataRange().getDisplayValues();
  var scheduleList = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i].length >= 2) {
      var dbPhone = normalizePhone(data[i][1]);
      if (dbPhone !== "" && dbPhone === normPhone) {
        scheduleList.push({
          studentName: data[i][0],
          className: data[i][0],
          mon: data[i][2] || "",
          tue: data[i][3] || "",
          wed: data[i][4] || "",
          thu: data[i][5] || "",
          fri: data[i][6] || "",
          sat: data[i][7] || "",
          sun: data[i][8] || ""
        });
      }
    }
  }
  return scheduleList;
}

function saveClassScheduleItem(tutorPhone, className, mon, tue, wed, thu, fri, sat, sun) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var ss = getClassSpreadsheet();
    var sheet = ss.getSheetByName('Lịch học lớp');
    if (!sheet) {
      getClassSchedule(tutorPhone);
      sheet = ss.getSheetByName('Lịch học lớp');
    }
    
    var normPhone = normalizePhone(tutorPhone);
    var cleanClassName = String(className || "").trim();
    var data = sheet.getDataRange().getDisplayValues();
    
    var rowIndex = -1;
    for (var i = 1; i < data.length; i++) {
      if (normalizePhone(data[i][1]) === normPhone && String(data[i][0]).trim() === cleanClassName) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex !== -1) {
      sheet.getRange(rowIndex, 3).setValue(mon || "").setFontFamily("Arial");
      sheet.getRange(rowIndex, 4).setValue(tue || "").setFontFamily("Arial");
      sheet.getRange(rowIndex, 5).setValue(wed || "").setFontFamily("Arial");
      sheet.getRange(rowIndex, 6).setValue(thu || "").setFontFamily("Arial");
      sheet.getRange(rowIndex, 7).setValue(fri || "").setFontFamily("Arial");
      sheet.getRange(rowIndex, 8).setValue(sat || "").setFontFamily("Arial");
      sheet.getRange(rowIndex, 9).setValue(sun || "").setFontFamily("Arial");
    } else {
      sheet.appendRow([cleanClassName, "'" + tutorPhone, mon || "", tue || "", wed || "", thu || "", fri || "", sat || "", sun || ""]);
      var lastRow = sheet.getLastRow();
      sheet.getRange(lastRow, 1, 1, 9).setFontFamily("Arial");
    }
    return { success: true };
  } catch(e) {
    return { error: "Lỗi lưu lịch lớp: " + e.toString() };
  } finally {
    lock.releaseLock();
  }
}

// === QUẢN LÝ NHẬT KÝ BÀI HỌC VÀ NHẬN XÉT CHI TIẾT TRỰC TIẾP TRÊN SHEET TÊN LỚP ===

function getOrCreateClassLessonLogSheet(ss, className) {
  if (!ss) ss = getClassSpreadsheet();
  var sheetName = 'Nhật ký chung';
  var sheet = ss.getSheetByName(sheetName);
  var logHeaders = [
    "Mã nhật ký",
    "Mã lớp",
    "Tên lớp",
    "Tuần dạy",
    "Ngày học",
    "Môn học",
    "Trạng thái",
    "Đánh giá BTVN",
    "Điểm KT Đầu giờ",
    "Điểm KT Định kỳ",
    "Nội dung & Nhận xét chung",
    "Chi tiết nhận xét riêng (JSON)",
    "Ngày xóa"
  ];
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(logHeaders);
    sheet.getRange(1, 1, 1, 13).setFontWeight("bold").setBackground("#8E4DFF").setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
  } else {
    sheet.getRange(1, 1, 1, 13).setValues([logHeaders]).setFontWeight("bold").setBackground("#8E4DFF").setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function saveClassLessonLog(classId, className, weekNum, studyDate, subject, status, hwEval, entryTest, termTest, generalNote, studentNotesJson, editingLogId) {
  var ss = getClassSpreadsheet();
  var sheet = ss.getSheetByName('Nhật ký chung');
  if (!sheet) {
    allocateClassBlock(ss, classId, className);
    sheet = ss.getSheetByName('Nhật ký chung');
  }
  
  var data = sheet.getDataRange().getValues();
  
  if (editingLogId) {
    for (var i = 0; i < data.length; i++) {
      if (String(data[i][0]).trim() === editingLogId) {
        var updateRow = i + 1;
        var updateData = [
          editingLogId, classId || "", className || "", weekNum || "", studyDate || "", subject || "",
          status || "Đã học", hwEval || "Hoàn thành", entryTest || "Không có", termTest || "Không có",
          generalNote || "", studentNotesJson || "{}", ""
        ];
        sheet.getRange(updateRow, 1, 1, 13).setValues([updateData]);
        clearClassCache(classId, "logs");
        SpreadsheetApp.flush();
        return { success: true };
      }
    }
  }

  var targetRowIndex = -1;
  var classBlockFound = false;
  var blockStart = -1;
  
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][1]).trim() === classId && String(data[i][0]).includes("--- NHẬT KÝ LỚP HỌC")) {
      classBlockFound = true;
      blockStart = i;
      break;
    }
  }
  
  if (!classBlockFound) {
    allocateClassBlock(ss, classId, className);
    data = sheet.getDataRange().getValues();
    for (var i = 0; i < data.length; i++) {
      if (String(data[i][1]).trim() === classId && String(data[i][0]).includes("--- NHẬT KÝ LỚP HỌC")) {
        blockStart = i;
        break;
      }
    }
  }
  
  var logId = "LOG_LH_" + new Date().getTime();
  var newRowData = [
    logId, classId || "", className || "", weekNum || "", studyDate || "", subject || "",
    status || "Đã học", hwEval || "Hoàn thành", entryTest || "Không có", termTest || "Không có",
    generalNote || "", studentNotesJson || "{}", ""
  ];
  
  var lastRowOfPartition = blockStart + 1;
  
  for (var j = blockStart + 2; j < data.length; j++) {
    if (String(data[j][0]).includes("--- NHẬT KÝ LỚP HỌC")) break;
    lastRowOfPartition = j;
    if (targetRowIndex === -1 && String(data[j][0]).trim() === "") {
      targetRowIndex = j + 1;
    }
  }
  
  if (targetRowIndex === -1) {
    var insertRowPos = lastRowOfPartition + 1; 
    sheet.insertRowsAfter(insertRowPos, 15);
    for (var d = 1; d <= 15; d++) {
      sheet.getRange(insertRowPos + d, 2, 1, 2).setValues([[classId, className]]);
    }
    targetRowIndex = insertRowPos + 1;
  }
  
  sheet.getRange(targetRowIndex, 1, 1, 13).setValues([newRowData]);
  
  clearClassCache(classId, "logs");
  SpreadsheetApp.flush();
  return { success: true };
}

function getClassLessonLogs(classId, className, ssParam) {
  var cleanClassId = String(classId || "").trim();
  if (cleanClassId === "") return [];
  
  var cache = CacheService.getScriptCache();
  var cacheKey = "all_class_logs_raw";
  var cached = cache.get(cacheKey);
  var data = null;
  
  if (cached) {
    try { data = JSON.parse(cached); } catch(e){}
  }
  
  if (!data) {
    var ss = ssParam || getClassSpreadsheet();
    var sheet = ss.getSheetByName('Nhật ký chung');
    if (!sheet) return [];
    data = sheet.getDataRange().getValues();
    try {
      var logsStr = JSON.stringify(data);
      if (logsStr.length < 95000) cache.put(cacheKey, logsStr, 600);
    } catch(e) {}
  }
  
  var logs = [];
  var cleanClassName = String(className || "").trim();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i].length >= 11 && data[i][0] !== "") {
      var deletedAt = (data[i].length > 12 && data[i][12] !== null) ? String(data[i][12]).trim() : "";
      if (deletedAt !== "") continue; // Bỏ qua nhật ký nằm trong Thùng rác
      
      var rowClassId = String(data[i][1] || "").trim();
      var rowClassName = String(data[i][2] || "").trim();
      
      if (rowClassId === cleanClassId || rowClassName === cleanClassName || cleanClassName === "") {
        var studentNotes = {};
        try {
          studentNotes = JSON.parse(data[i][11] || "{}");
        } catch(e) {
          studentNotes = {};
        }
        
        var studyDateVal = "";
        if (data[i][4] instanceof Date) {
          studyDateVal = Utilities.formatDate(data[i][4], Session.getScriptTimeZone(), "dd/MM/yyyy");
        } else {
          studyDateVal = data[i][4] ? String(data[i][4]).trim() : "";
        }
        
        logs.push({
          logId: String(data[i][0]).trim(),
          classId: String(data[i][1]).trim(),
          className: String(data[i][2]).trim(),
          weekNum: data[i][3] !== null && data[i][3] !== undefined ? String(data[i][3]).trim() : "",
          studyDate: studyDateVal,
          subject: data[i][5] ? String(data[i][5]).trim() : "",
          status: data[i][6] ? String(data[i][6]).trim() : "",
          hwEval: data[i][7] ? String(data[i][7]).trim() : "",
          entryTest: data[i][8] !== null && data[i][8] !== undefined ? String(data[i][8]).trim() : "",
          termTest: data[i][9] !== null && data[i][9] !== undefined ? String(data[i][9]).trim() : "",
          generalNote: data[i][10] ? String(data[i][10]).trim() : "",
          studentNotes: studentNotes
        });
      }
    }
  }
  
  logs.reverse();
  return logs;
}

// Xóa tạm Nhật ký buổi học vào Thùng rác (Soft Delete)
function deleteClassLessonLog(logId, className) {
  var ss = getClassSpreadsheet();
  var sheet = null;
  if (className && String(className).trim() !== '') {
    sheet = ss.getSheetByName(String(className).trim());
  }
  if (!sheet) {
    sheet = getOrCreateClassLessonLogSheet(ss, className);
  }
  
  var nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");
  var found = false;
  
  if (sheet) {
    var data = sheet.getDataRange().getDisplayValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(logId).trim()) {
        sheet.getRange(i + 1, 13).setValue(nowStr);
        var classId = data[i][1];
        if (classId) clearClassCache(classId, "logs");
        SpreadsheetApp.flush();
        found = true;
        break;
      }
    }
  }

  // Nếu không tìm thấy ở Sheet chỉ định, quét tìm tất cả các Sheet còn lại
  if (!found) {
    var sheets = ss.getSheets();
    for (var s = 0; s < sheets.length; s++) {
      var sh = sheets[s];
      var data = sh.getDataRange().getDisplayValues();
      if (data.length > 1 && data[0].length >= 13 && String(data[0][0]).trim() === "Mã nhật ký") {
        for (var i = 1; i < data.length; i++) {
          if (String(data[i][0]).trim() === String(logId).trim()) {
            sh.getRange(i + 1, 13).setValue(nowStr);
            var classId = data[i][1];
            if (classId) clearClassCache(classId, "logs");
            SpreadsheetApp.flush();
            found = true;
            break;
          }
        }
      }
      if (found) break;
    }
  }
  
  return { success: true };
}

// === QUẢN LÝ THÙNG RÁC VÀ PHỤC HỒI (RECYCLE BIN & RESTORE) ===

// === ĐÃ XÓA TRÙNG LẶP THÙNG RÁC 1 ===

// === QUẢN LÝ THÔNG BÁO NHANH LỚP HỌC ===

function saveClassAnnouncement(classId, className, announcementText) {
  var ss = getClassSpreadsheet();
  var sheet = ss.getSheetByName('Thông báo lớp');
  if (!sheet) {
    sheet = ss.insertSheet('Thông báo lớp');
    sheet.appendRow(["Mã lớp", "Tên lớp", "Nội dung thông báo", "Thời gian tạo"]);
    sheet.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#8E4DFF").setFontColor("#FFFFFF");
  }
  
  var cleanClassId = String(classId || "").trim();
  var data = sheet.getDataRange().getDisplayValues();
  var rowIndex = -1;
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === cleanClassId) {
      rowIndex = i + 1;
      break;
    }
  }
  
  var nowStr = new Date().toLocaleString('vi-VN');
  if (rowIndex !== -1) {
    sheet.getRange(rowIndex, 3).setValue(announcementText || "");
    sheet.getRange(rowIndex, 4).setValue(nowStr);
  } else {
    sheet.appendRow([cleanClassId, className || "", announcementText || "", nowStr]);
  }
  
  return { success: true };
}

// Đã xóa trùng lặp getClassAnnouncement 1

// === ĐÃ XÓA TRÙNG LẶP HÀM BÀI TẬP 1 ===

// Đồng bộ trạng thái đóng học phí của học sinh lớp học trong JSON
function updateClassStudentPaymentStatus(logId, studentId, isPaid) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var ss = getClassSpreadsheet();
    var sheet = ss.getSheetByName('Nhật ký chung');
    if (!sheet) return { success: false, error: "Không tìm thấy sheet 'Nhật ký chung'." };
    
    var data = sheet.getDataRange().getDisplayValues();
    var rowIndex = -1;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === logId) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex !== -1) {
      var jsonCell = sheet.getRange(rowIndex, 12);
      var jsonStr = jsonCell.getValue() || "{}";
      var studentNotes = {};
      try {
        studentNotes = JSON.parse(jsonStr);
      } catch(e) {
        studentNotes = {};
      }
      
      if (!studentNotes[studentId]) {
        studentNotes[studentId] = {
          studentName: "Học sinh",
          attendance: "Có mặt",
          privateNote: ""
        };
      }
      
      studentNotes[studentId].paid = (isPaid === true || isPaid === "true");
      
      jsonCell.setValue(JSON.stringify(studentNotes));
      clearClassCache(null, "logs");
      SpreadsheetApp.flush();
      return { success: true };
    }
    return { success: false, error: "Không tìm thấy mã nhật ký." };
  } catch(e) {
    return { success: false, error: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

function markClassInvoiceBulkPaid(logIds, studentId) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var ss = getClassSpreadsheet();
    var sheet = ss.getSheetByName('Nhật ký chung');
    if (!sheet) return { success: false, error: "Không tìm thấy sheet 'Nhật ký chung'." };
    
    var data = sheet.getDataRange().getDisplayValues();
    
    var updated = false;
    for (var i = 1; i < data.length; i++) {
      var currentLogId = data[i][0];
      if (logIds.indexOf(currentLogId) !== -1) {
        var rowIndex = i + 1;
        var jsonStr = data[i][11] || "{}"; // column L is index 11
        var studentNotes = {};
        try {
          studentNotes = JSON.parse(jsonStr);
        } catch(e) {
          studentNotes = {};
        }
        
        if (!studentNotes[studentId]) {
          studentNotes[studentId] = {
            studentName: "Học sinh",
            attendance: "Có mặt",
            privateNote: ""
          };
        }
        
        studentNotes[studentId].paid = true;
        sheet.getRange(rowIndex, 12).setValue(JSON.stringify(studentNotes));
        updated = true;
      }
    }
    
    if (updated) {
      clearClassCache(null, "logs");
      SpreadsheetApp.flush();
      return { success: true };
    }
    return { success: false, error: "Không tìm thấy nhật ký để cập nhật." };
  } catch(e) {
    return { success: false, error: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

function getClassSubmissions(classId) {
  var ss = getClassSpreadsheet();
  var sheet = ss.getSheetByName('Học sinh nộp bài lớp học');
  var submissions = [];
  if (!sheet) return submissions;
  
  // Tạo bản đồ Mã bài tập -> Tên bài tập
  var hwTitleMap = {};
  var sheetHw = ss.getSheetByName('Bài tập lớp học');
  if (sheetHw) {
    var dataHw = sheetHw.getDataRange().getDisplayValues();
    for (var k = 1; k < dataHw.length; k++) {
      hwTitleMap[dataHw[k][0]] = dataHw[k][3]; // Mã bài tập -> Tên bài tập
    }
  }

  var data = sheet.getDataRange().getDisplayValues();
  var cleanClassId = String(classId || "").trim();
  for (var i = 1; i < data.length; i++) {
    if (data[i].length >= 11 && String(data[i][2]).trim() === cleanClassId) {
      var hwIdVal = data[i][1];
      submissions.push({
        subId: data[i][0],
        hwId: hwIdVal,
        title: hwTitleMap[hwIdVal] || hwIdVal || "Bài tập lớp học",
        classId: data[i][2],
        studentId: data[i][3],
        studentName: data[i][4],
        fileUrl: data[i][6],
        submittedAt: data[i][10]
      });
    }
  }
  submissions.reverse();
  return submissions;
}

// === QUẢN LÝ BÀI TẬP GIAO LỚP HỌC (SHEET 'Bài tập lớp học') ===

function getOrCreateClassHomeworkSheet(ss) {
  if (!ss) ss = getClassSpreadsheet();
  var sheet = ss.getSheetByName('Bài tập lớp học');
  var homeworkHeaders = ["Mã bài tập", "Mã lớp", "Tên lớp", "Tên bài tập", "Ngày giao", "Link đính kèm", "URL File đính kèm", "Tên file"];
  if (!sheet) {
    sheet = ss.insertSheet('Bài tập lớp học');
    sheet.appendRow(homeworkHeaders);
    sheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#8E4DFF").setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
  } else {
    sheet.getRange(1, 1, 1, 8).setValues([homeworkHeaders]).setFontWeight("bold").setBackground("#8E4DFF").setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getClassHomeworkList(classId, className, ssParam) {
  var cleanClassId = String(classId || "").trim();
  if (cleanClassId === "") return [];
  
  var cache = CacheService.getScriptCache();
  var cacheKey = "class_hw_" + cleanClassId;
  var cached = cache.get(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch(e) {
      Logger.log("Lỗi parse cache hw: " + e.toString());
    }
  }
  
  var ss = ssParam || getClassSpreadsheet();
  var sheet = getOrCreateClassHomeworkSheet(ss);
  var data = sheet.getDataRange().getValues(); // Dùng getValues() để đọc thô siêu nhanh
  var list = [];
  
  var cleanName = String(className || "").trim().toLowerCase();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i] && data[i].length >= 4 && data[i][0] !== "") {
      var rowClassId = String(data[i][1] || "").trim();
      var rowClassName = String(data[i][2] || "").trim().toLowerCase();
      
      if ((cleanClassId !== "" && rowClassId === cleanClassId) || (cleanName !== "" && rowClassName === cleanName) || (cleanClassId === "" && cleanName === "")) {
        var releaseDateVal = "";
        if (data[i][4] instanceof Date) {
          releaseDateVal = Utilities.formatDate(data[i][4], Session.getScriptTimeZone(), "dd/MM/yyyy");
        } else {
          releaseDateVal = data[i][4] ? String(data[i][4]).trim() : "";
        }
        
        list.push({
          hwId: String(data[i][0]).trim(),
          classId: String(data[i][1]).trim(),
          className: String(data[i][2]).trim(),
          title: String(data[i][3]).trim(),
          releaseDate: releaseDateVal,
          link: data[i][5] ? String(data[i][5]).trim() : "",
          fileUrl: data[i][6] ? String(data[i][6]).trim() : "",
          fileName: data[i].length > 7 && data[i][7] ? String(data[i][7]).trim() : ""
        });
      }
    }
  }
  list.reverse();
  
  try {
    cache.put(cacheKey, JSON.stringify(list), 600); // Lưu đệm 10 phút
  } catch(e) {
    Logger.log("Lỗi lưu cache hw: " + e.toString());
  }
  
  return list;
}

// Lấy Tên Gia sư từ Mã lớp học
function getTutorNameByClassId(classId, ssClassParam) {
  try {
    var ssClass = ssClassParam || getClassSpreadsheet();
    var sheetClasses = ssClass ? ssClass.getSheetByName('Danh sách lớp học') : null;
    if (!sheetClasses) return "Giáo viên không tên";
    
    var dataC = sheetClasses.getDataRange().getDisplayValues();
    var tutorIdOrPhone = "";
    for (var i = 1; i < dataC.length; i++) {
      if (dataC[i][0] === classId) {
        tutorIdOrPhone = String(dataC[i][2] || "").trim();
        break;
      }
    }
    
    if (!tutorIdOrPhone) return "Giáo viên không tên";
    
    var normPhone = normalizePhone(tutorIdOrPhone);
    var normCode = tutorIdOrPhone.toLowerCase();
    
    var ssMain = SpreadsheetApp.getActiveSpreadsheet();
    var sheetGS = ssMain.getSheetByName('Mã gia sư');
    if (!sheetGS) return "Giáo viên không tên";
    
    var dataGS = sheetGS.getDataRange().getDisplayValues();
    for (var j = 1; j < dataGS.length; j++) {
      var gsPhone = normalizePhone(dataGS[j][4] || "");
      var gsCode = String(dataGS[j][8] || "").trim().toLowerCase();
      if ((normPhone !== "" && gsPhone === normPhone) || 
          (normCode !== "" && gsCode === normCode)) {
        return dataGS[j][2] || "Giáo viên không tên";
      }
    }
  } catch (e) {
    console.error("Lỗi getTutorNameByClassId:", e);
  }
  return "Giáo viên không tên";
}

function saveClassHomework(classId, className, title, releaseDate, fileData, link) {
  try {
    var ss = getClassSpreadsheet();
    var sheet = getOrCreateClassHomeworkSheet(ss);
    var hwId = "HW_LH_" + new Date().getTime();
    var fileUrl = "";
    var fileName = "";
    
    if (fileData && fileData.base64) {
      try {
        var parentFolderId = "1hloyK1wJcq5944hgvfmCu5YYmKXR12qM";
        var parentFolder = DriveApp.getFolderById(parentFolderId);
        
        var tutorName = getTutorNameByClassId(classId, ss);
        var tutorFolders = parentFolder.getFoldersByName(tutorName);
        var tutorFolder = tutorFolders.hasNext() ? tutorFolders.next() : parentFolder.createFolder(tutorName);

        var classFolderName = className || "Lớp học không tên";
        var classFolders = tutorFolder.getFoldersByName(classFolderName);
        var classFolder = classFolders.hasNext() ? classFolders.next() : tutorFolder.createFolder(classFolderName);
        
        var blob = Utilities.newBlob(Utilities.base64Decode(fileData.base64), fileData.mimeType, fileData.fileName);
        var file = classFolder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        fileUrl = file.getUrl();
        fileName = fileData.fileName;
      } catch(uploadErr) {
        console.error("Lỗi upload file bài tập:", uploadErr);
      }
    }
    
    sheet.appendRow([
      hwId,
      classId || "",
      className || "",
      title || "Bài tập mới",
      releaseDate || new Date().toLocaleDateString('vi-VN'),
      link || "",
      fileUrl,
      fileName
    ]);
    clearClassCache(classId, "hw");
    SpreadsheetApp.flush();
    return { success: true, hwId: hwId, fileUrl: fileUrl, fileName: fileName };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}

function deleteClassHomework(hwId) {
  try {
    var ss = getClassSpreadsheet();
    var sheet = getOrCreateClassHomeworkSheet(ss);
    var data = sheet.getDataRange().getDisplayValues();
    var cleanId = String(hwId || "").trim();
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === cleanId) {
        var classId = data[i][1];
        sheet.deleteRow(i + 1);
        if (classId) clearClassCache(classId, "hw");
        SpreadsheetApp.flush();
        return { success: true };
      }
    }
    return { success: false, error: "Không tìm thấy bài tập để xóa." };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}

// === QUẢN LÝ THÔNG BÁO NHANH LỚP HỌC (SHEET 'Thông báo lớp') ===

function getOrCreateClassAnnouncementSheet(ss) {
  if (!ss) ss = getClassSpreadsheet();
  var sheet = ss.getSheetByName('Thông báo lớp');
  if (!sheet) {
    sheet = ss.insertSheet('Thông báo lớp');
    sheet.appendRow(["Mã thông báo", "Mã lớp", "Tên lớp", "Nội dung thông báo", "Thời gian tạo"]);
    sheet.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#8E4DFF").setFontColor("#FFFFFF");
  }
  return sheet;
}

function getClassAnnouncement(classId, ssParam) {
  var cleanClassId = String(classId || "").trim();
  if (cleanClassId === "") return "";
  
  var cache = CacheService.getScriptCache();
  var cacheKey = "class_announce_" + cleanClassId;
  var cached = cache.get(cacheKey);
  if (cached !== null) return cached;
  
  try {
    var ss = ssParam || getClassSpreadsheet();
    var sheet = ss.getSheetByName('Thông báo lớp');
    if (!sheet) return "";
    
    var data = sheet.getDataRange().getValues(); // Dùng getValues() để đọc nhanh
    if (data.length <= 1) {
      cache.put(cacheKey, "", 600);
      return "";
    }
    
    var headers = data[0];
    var colClassId = headers.indexOf("Mã lớp");
    var colText = headers.indexOf("Nội dung thông báo");
    
    if (colClassId === -1) colClassId = (headers.indexOf("Mã lớp") !== -1) ? headers.indexOf("Mã lớp") : 0;
    if (colText === -1) colText = (headers.indexOf("Nội dung thông báo") !== -1) ? headers.indexOf("Nội dung thông báo") : 2;
    
    // Nếu có cả "Mã thông báo" đứng đầu (5 cột)
    if (headers[0] === "Mã thông báo" || headers.indexOf("Mã thông báo") !== -1) {
      colClassId = headers.indexOf("Mã lớp") !== -1 ? headers.indexOf("Mã lớp") : 1;
      colText = headers.indexOf("Nội dung thông báo") !== -1 ? headers.indexOf("Nội dung thông báo") : 3;
    }
    
    // Quét từ dưới lên để lấy thông báo mới nhất
    for (var i = data.length - 1; i >= 1; i--) {
      if (data[i] && data[i].length > Math.max(colClassId, colText) && String(data[i][colClassId]).trim() === cleanClassId) {
        var val = data[i][colText] ? String(data[i][colText]).trim() : "";
        cache.put(cacheKey, val, 600);
        return val;
      }
    }
    cache.put(cacheKey, "", 600);
    return "";
  } catch(e) {
    return "";
  }
}

function saveClassAnnouncement(classId, className, text) {
  try {
    var ss = getClassSpreadsheet();
    var sheet = ss.getSheetByName('Thông báo lớp');
    if (!sheet) {
      initClassSpreadsheetSchema(ss);
      sheet = ss.getSheetByName('Thông báo lớp');
    }
    
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    
    var colClassId = headers.indexOf("Mã lớp");
    var colText = headers.indexOf("Nội dung thông báo");
    var colClassName = headers.indexOf("Tên lớp");
    var colTime = headers.indexOf("Thời gian tạo") !== -1 ? headers.indexOf("Thời gian tạo") : headers.indexOf("Thời gian cập nhật");
    var colId = headers.indexOf("Mã thông báo");
    
    if (colClassId === -1) colClassId = 1;
    if (colText === -1) colText = 3;
    if (colClassName === -1) colClassName = 2;
    if (colTime === -1) colTime = 4;
    
    var cleanId = String(classId || "").trim();
    var nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");
    
    // Ghi đè dòng thông báo cũ của lớp đó nếu đã có, hoặc tạo mới dòng nếu chưa có
    var foundIndex = -1;
    for (var i = 1; i < data.length; i++) {
      if (data[i] && data[i].length > colClassId && String(data[i][colClassId]).trim() === cleanId) {
        foundIndex = i + 1;
        break;
      }
    }
    
    if (foundIndex !== -1) {
      sheet.getRange(foundIndex, colText + 1).setValue(text || "");
      sheet.getRange(foundIndex, colTime + 1).setValue(nowStr);
    } else {
      var newRow = [];
      if (colId !== -1) newRow[colId] = "ANN_" + new Date().getTime();
      newRow[colClassId] = cleanId;
      newRow[colClassName] = className || "";
      newRow[colText] = text || "";
      newRow[colTime] = nowStr;
      
      // Đảm bảo không có ô undefined gây lỗi appendRow
      for (var idx = 0; idx < Math.max(colClassId, colClassName, colText, colTime, colId) + 1; idx++) {
        if (newRow[idx] === undefined) newRow[idx] = "";
      }
      sheet.appendRow(newRow);
    }
    
    // Xóa cache
    clearClassCache(classId, "announce");
    SpreadsheetApp.flush();
    return { success: true };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}

// === QUẢN LÝ TỰ ĐỘNG LƯU TRỮ VÀO SHEET 'Thùng rác' SAU 10 NGÀY ===

function getOrCreateClassTrashSheet(ss) {
  if (!ss) ss = getClassSpreadsheet();
  var sheet = ss.getSheetByName('Thùng rác');
  if (!sheet) {
    sheet = ss.insertSheet('Thùng rác');
    sheet.appendRow(["Mã lưu trữ", "Thời gian lưu trữ", "Loại mục", "Tên / Nội dung", "Mã mục", "Tên lớp liên quan", "Ngày xóa ban đầu", "Dữ liệu dòng (JSON)"]);
    sheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#EF4444").setFontColor("#FFFFFF");
  }
  return sheet;
}

function cleanupOldClassTrash(ss) {
  if (!ss) ss = getClassSpreadsheet();
  var trashSheet = getOrCreateClassTrashSheet(ss);
  var now = new Date();
  var tenDaysMs = 10 * 24 * 60 * 60 * 1000;
  
  // 1. Dọn dẹp Học sinh xóa > 10 ngày trong sheet 'Học sinh lớp học'
  var sheetStudents = ss.getSheetByName('Học sinh lớp học');
  if (sheetStudents) {
    var dataS = sheetStudents.getDataRange().getDisplayValues();
    for (var i = dataS.length - 1; i >= 1; i--) {
      if (dataS[i].length >= 9) {
        var deletedAtS = String(dataS[i][8]).trim();
        if (deletedAtS !== "") {
          var delDate = (typeof parseAppScriptDate === "function") ? parseAppScriptDate(deletedAtS) : new Date(deletedAtS);
          if (delDate && (now.getTime() - delDate.getTime() > tenDaysMs)) {
            trashSheet.appendRow([
              "TRASH_S_" + new Date().getTime() + "_" + i,
              Utilities.formatDate(now, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm"),
              "student",
              dataS[i][1] || "Học sinh",
              dataS[i][0] || "",
              dataS[i][2] || "",
              deletedAtS,
              JSON.stringify(dataS[i])
            ]);
            sheetStudents.deleteRow(i + 1);
          }
        }
      }
    }
  }

  // 2. Dọn dẹp Lớp học xóa > 10 ngày trong sheet 'Danh sách lớp học'
  var sheetClasses = ss.getSheetByName('Danh sách lớp học');
  if (sheetClasses) {
    var dataC = sheetClasses.getDataRange().getDisplayValues();
    for (var j = dataC.length - 1; j >= 1; j--) {
      if (dataC[j].length >= 6) {
        var deletedAtC = String(dataC[j][5]).trim();
        if (deletedAtC !== "") {
          var delDateC = (typeof parseAppScriptDate === "function") ? parseAppScriptDate(deletedAtC) : new Date(deletedAtC);
          if (delDateC && (now.getTime() - delDateC.getTime() > tenDaysMs)) {
            trashSheet.appendRow([
              "TRASH_C_" + new Date().getTime() + "_" + j,
              Utilities.formatDate(now, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm"),
              "class",
              dataC[j][1] || "Lớp học",
              dataC[j][0] || "",
              "",
              deletedAtC,
              JSON.stringify(dataC[j])
            ]);
            sheetClasses.deleteRow(j + 1);
          }
        }
      }
    }
  }

  // 3. Dọn dẹp Nhật ký buổi học xóa > 10 ngày trên các sheet lớp
  var allSheets = ss.getSheets();
  allSheets.forEach(function(sh) {
    var shName = sh.getName();
    if (shName !== 'Danh sách lớp học' && shName !== 'Học sinh lớp học' && shName !== 'Bài tập lớp' && shName !== 'Lịch học lớp' && shName !== 'Thông báo lớp' && shName !== 'Mã gia sư' && shName !== 'Mã admin' && shName !== 'Thùng rác') {
      var dataL = sh.getDataRange().getDisplayValues();
      for (var k = dataL.length - 1; k >= 1; k--) {
        if (dataL[k].length >= 13) {
          var deletedAtL = String(dataL[k][12]).trim();
          if (deletedAtL !== "") {
            var delDateL = (typeof parseAppScriptDate === "function") ? parseAppScriptDate(deletedAtL) : new Date(deletedAtL);
            if (delDateL && (now.getTime() - delDateL.getTime() > tenDaysMs)) {
              trashSheet.appendRow([
                "TRASH_L_" + new Date().getTime() + "_" + k,
                Utilities.formatDate(now, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm"),
                "lessonLog",
                "Buổi học " + (dataL[k][4] || "") + " (" + shName + ")",
                dataL[k][0] || "",
                shName,
                deletedAtL,
                JSON.stringify(dataL[k])
              ]);
              sh.deleteRow(k + 1);
            }
          }
        }
      }
    }
  });

  SpreadsheetApp.flush();
}

// Lấy ý kiến phản hồi của phụ huynh dành cho giáo viên Lớp học
function getClassTutorFeedback(tutorPhone, tutorCode) {
  var ss = getClassSpreadsheet();
  var sheetFeedback = ss.getSheetByName('Ý kiến phụ huynh');
  var feedbacks = [];
  if (!sheetFeedback) return feedbacks;
  
  var classes = getClassList(tutorPhone, tutorCode);
  var classIds = classes.map(function(c) { return c.classId; });
  
  var studentPhones = [];
  var sheetStudents = ss.getSheetByName('Học sinh lớp học');
  if (sheetStudents) {
    var dataS = sheetStudents.getDataRange().getDisplayValues();
    for (var i = 1; i < dataS.length; i++) {
      if (dataS[i].length >= 4 && classIds.indexOf(dataS[i][2]) !== -1) {
        var sPhone = normalizePhone(dataS[i][3]);
        var sCode = String(dataS[i][0]).trim().toLowerCase();
        if (sPhone) studentPhones.push(sPhone);
        if (sCode) studentPhones.push(sCode);
      }
    }
  }

  var dataFB = sheetFeedback.getDataRange().getDisplayValues();
  for (var j = dataFB.length - 1; j >= 1; j--) {
    if (dataFB[j].length >= 4 && dataFB[j][0] !== "") {
      var fbPhone = normalizePhone(dataFB[j][1]);
      var fbCode = String(dataFB[j][1]).trim().toLowerCase();
      
      if (studentPhones.indexOf(fbPhone) !== -1 || studentPhones.indexOf(fbCode) !== -1 || studentPhones.length === 0) {
        feedbacks.push({
          timestamp: dataFB[j][0],
          studentPhone: dataFB[j][1],
          studentName: dataFB[j][2],
          content: dataFB[j][3]
        });
      }
    }
  }

  return feedbacks;
}

// Lấy danh sách mục đã xóa tạm (Thùng rác) của hệ thống Lớp học
function getClassTrashItems(tutorPhone, tutorCode) {
  var ss = getClassSpreadsheet();
  var items = [];

  // 1. Quét học sinh đã bị soft delete trong 'Học sinh lớp học'
  var sheetStudents = ss.getSheetByName('Học sinh lớp học');
  if (sheetStudents) {
    var dataS = sheetStudents.getDataRange().getDisplayValues();
    for (var i = 1; i < dataS.length; i++) {
      var row = dataS[i];
      var deletedAt = (row.length > 8) ? String(row[8]).trim() : "";
      if (deletedAt !== "") {
        items.push({
          type: 'student',
          id: row[0] || "",
          name: row[1] || "Học sinh",
          className: row[4] || row[3] || "",
          detail: "Lớp: " + (row[4] || row[3] || "-") + " | SĐT PH: " + (row[2] || "-"),
          deletedAt: deletedAt
        });
      }
    }
  }

  // 2. Quét nhật ký đã bị soft delete trong các trang tính Lớp học cụ thể
  var sheetClasses = ss.getSheetByName('Danh sách lớp học');
  if (sheetClasses) {
    var classData = sheetClasses.getDataRange().getDisplayValues();
    for (var c = 1; c < classData.length; c++) {
      var classNameVal = classData[c][1];
      if (classNameVal) {
        var sheetL = ss.getSheetByName(String(classNameVal).trim());
        if (sheetL) {
          var dataL = sheetL.getDataRange().getDisplayValues();
          for (var j = 1; j < dataL.length; j++) {
            var rowL = dataL[j];
            var delAtLog = (rowL.length > 12) ? String(rowL[12]).trim() : "";
            if (delAtLog !== "") {
              items.push({
                type: 'lessonLog',
                id: rowL[0] || "",
                name: "Buổi học ngày " + (rowL[4] || "-"),
                className: classNameVal,
                detail: "Tuần: " + (rowL[3] || "-") + " | Lớp: " + classNameVal,
                deletedAt: delAtLog
              });
            }
          }
        }
      }
    }
  }

  return items;
}

// Phục hồi mục trong Thùng rác Lớp học
function restoreClassItem(type, itemId, className) {
  var ss = getClassSpreadsheet();
  if (type === 'student') {
    var sheetS = ss.getSheetByName('Học sinh lớp học');
    if (sheetS) {
      var dataS = sheetS.getDataRange().getDisplayValues();
      for (var i = 1; i < dataS.length; i++) {
        if (String(dataS[i][0]).trim() === String(itemId).trim()) {
          sheetS.getRange(i + 1, 9).setValue("");
          var classId = dataS[i][2];
          if (classId) clearClassCache(classId, "students");
          SpreadsheetApp.flush();
          return { success: true };
        }
      }
    }
  } else if (type === 'lessonLog') {
    var targetSheetName = className ? String(className).trim() : 'Nhật ký học tập lớp';
    var sheetL = ss.getSheetByName(targetSheetName);
    if (sheetL) {
      var dataL = sheetL.getDataRange().getDisplayValues();
      for (var j = 1; j < dataL.length; j++) {
        if (String(dataL[j][0]).trim() === String(itemId).trim()) {
          sheetL.getRange(j + 1, 13).setValue(""); // Hủy ngày xóa (Cột 13)
          var classId = dataL[j][1];
          if (classId) clearClassCache(classId, "logs");
          SpreadsheetApp.flush();
          return { success: true };
        }
      }
    }
  }
  return { success: false, error: "Không tìm thấy mục để khôi phục." };
}

// Xóa vĩnh viễn mục trong Thùng rác Lớp học
function purgeClassItem(type, itemId, className) {
  var ss = getClassSpreadsheet();
  if (type === 'student') {
    var sheetS = ss.getSheetByName('Học sinh lớp học');
    if (sheetS) {
      var dataS = sheetS.getDataRange().getDisplayValues();
      for (var i = dataS.length - 1; i >= 1; i--) {
        if (String(dataS[i][0]).trim() === String(itemId).trim()) {
          sheetS.deleteRow(i + 1);
          return { success: true };
        }
      }
    }
  } else if (type === 'lessonLog') {
    var targetSheetName = className ? String(className).trim() : 'Nhật ký học tập lớp';
    var sheetL = ss.getSheetByName(targetSheetName);
    if (sheetL) {
      var dataL = sheetL.getDataRange().getDisplayValues();
      for (var j = dataL.length - 1; j >= 1; j--) {
        if (String(dataL[j][0]).trim() === String(itemId).trim()) {
          sheetL.deleteRow(j + 1);
          return { success: true };
        }
      }
    }
  }
  return { success: false, error: "Không tìm thấy mục để xóa vĩnh viễn." };
}

// Cập nhật thông tin tài khoản Giáo viên / Gia sư
function updateTutorAccountInfo(phone, name, pin) {
  try {
    var ss = getClassSpreadsheet();
    var sheetC = ss.getSheetByName('Danh sách lớp học');
    if (sheetC) {
      var dataC = sheetC.getDataRange().getDisplayValues();
      for (var i = 1; i < dataC.length; i++) {
        var rowPhone = (dataC[i][2] || "").toString().trim();
        if (rowPhone === String(phone).trim() || normalizePhone(rowPhone) === normalizePhone(phone)) {
          if (name) sheetC.getRange(i + 1, 3).setValue(name);
          if (pin) sheetC.getRange(i + 1, 8).setValue(pin);
        }
      }
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function updateTutorAccount(phone, name, pin) {
  return updateTutorAccountInfo(phone, name, pin);
}

// Đã xóa trùng lặp getClassAnnouncement 3

// Tra cứu dữ liệu cho Học sinh / Phụ huynh thuộc hệ thống Lớp học
function traCuuDuLieuHocSinhLop(phone, csRow, ss) {
  if (!ss) ss = getClassSpreadsheet();
  
  var studentId = csRow[0] || "";
  var studentName = csRow[1] || "Học sinh";
  var classId = csRow[2] || "";
  var parentPhone = csRow[3] || "";
  var parentName = csRow[5] || "";
  
  // Lấy tên lớp từ 'Danh sách lớp học'
  var className = "Lớp học";
  var sheetClasses = ss.getSheetByName('Danh sách lớp học');
  if (sheetClasses && classId) {
    var dataClasses = sheetClasses.getDataRange().getDisplayValues();
    for (var c = 1; c < dataClasses.length; c++) {
      if (String(dataClasses[c][0]).trim() === String(classId).trim()) {
        className = dataClasses[c][1] || className;
        break;
      }
    }
  }

  // Lấy thông báo lớp
  var thongBaoText = getClassAnnouncement(classId);

  var ketQua = {
    timThay: true,
    isClass: true,
    classId: classId,
    tenHocSinh: studentName,
    thongBaoHocSinh: thongBaoText,
    lichSuHocTap: [],
    baiTap: []
  };

  // 1. Trích xuất Nhật ký buổi học của Lớp học (Đọc từ sheet riêng của lớp hoặc sheet Nhật ký chung)
  var sheetLogs = ss.getSheetByName(className) || ss.getSheetByName('Nhật ký chung');
  if (sheetLogs) {
    var dataLogs = sheetLogs.getDataRange().getDisplayValues();
    for (var l = 1; l < dataLogs.length; l++) {
      var logId = String(dataLogs[l][0] || "").trim();
      if (logId === "") continue; // Bỏ qua các dòng trống
      
      var delDate = (dataLogs[l].length > 12) ? String(dataLogs[l][12]).trim() : "";
      if (delDate !== "") continue; // Bỏ qua nhật ký đã bị xóa tạm
      
      var rowClassId = String(dataLogs[l][1] || "").trim();
      var rowClassName = String(dataLogs[l][2] || "").trim();
      
      if (rowClassId === String(classId).trim() || (className && rowClassName === String(className).trim()) || sheetLogs.getName() === className) {
        var weekNum = dataLogs[l][3] || "-";
        var studyDate = dataLogs[l][4] || "-";
        var subject = dataLogs[l][5] || className;
        var classStatus = dataLogs[l][6] || "Có mặt";
        var hwEval = dataLogs[l][7] || "Bình thường";
        var entryTest = dataLogs[l][8] || "Không có";
        var termTest = dataLogs[l][9] || "Không có";
        var generalNote = dataLogs[l][10] || "";
        var studentNotesRaw = dataLogs[l][11] || "";
        
        var privateAtt = classStatus;
        var privateNote = generalNote;
        
        if (studentNotesRaw && studentNotesRaw.trim() !== "") {
          try {
            var pObj = JSON.parse(studentNotesRaw);
            if (pObj) {
              var sData = pObj[studentId] || pObj[String(studentId).trim()] || pObj[studentName];
              if (!sData) {
                for (var kKey in pObj) {
                  if (kKey === String(studentId).trim() || kKey.toLowerCase() === String(studentName).toLowerCase()) {
                    sData = pObj[kKey];
                    break;
                  }
                }
              }
              if (!sData && typeof pObj === 'object') {
                var keys = Object.keys(pObj);
                if (keys.length === 1) {
                  sData = pObj[keys[0]];
                }
              }
              if (sData) {
                if (sData.attendance) privateAtt = sData.attendance;
                if (sData.privateNote !== undefined && sData.privateNote !== null) {
                  var pN = String(sData.privateNote).trim();
                  if (pN !== "") privateNote = pN + (generalNote ? " (" + generalNote + ")" : "");
                }
                
                var eVal = (sData.entryTest !== undefined && sData.entryTest !== null && String(sData.entryTest).trim() !== "") ? sData.entryTest : (sData.entryScore !== undefined ? sData.entryScore : sData.entry);
                if (eVal !== undefined && eVal !== null && String(eVal).trim() !== "") {
                  entryTest = String(eVal).trim();
                }

                var tVal = (sData.termTest !== undefined && sData.termTest !== null && String(sData.termTest).trim() !== "") ? sData.termTest : (sData.termScore !== undefined ? sData.termScore : sData.term);
                if (tVal !== undefined && tVal !== null && String(tVal).trim() !== "") {
                  termTest = String(tVal).trim();
                }
              }
            }
          } catch(e){}
        }

        ketQua.lichSuHocTap.push({
          tuan: weekNum,
          ngay: studyDate,
          mon: subject,
          noiDung: privateNote || "Nhật ký buổi học",
          danhGiaBTVN: hwEval,
          diemDauGio: entryTest,
          diemDinhKi: termTest,
          trangThai: privateAtt
        });
      }
    }
  }

  // 2. Trích xuất Bài tập đã giao của Lớp học
  var sheetHw = ss.getSheetByName('Bài tập lớp học');
  if (sheetHw) {
    var dataHw = sheetHw.getDataRange().getDisplayValues();
    for (var h = 1; h < dataHw.length; h++) {
      var hwClassId = String(dataHw[h][1] || "").trim();
      var hwClassName = String(dataHw[h][2] || "").trim();
      if (hwClassId === String(classId).trim() || (className && hwClassName === String(className).trim())) {
        ketQua.baiTap.push({
          mon: dataHw[h][4] || hwClassName || "Bài tập lớp",
          tenBai: dataHw[h][3] || "Bài tập",
          link: dataHw[h][6] || dataHw[h][5] || "" // Lấy URL Drive (Col G) hoặc link ngoài (Col F)
        });
      }
    }
  }

  return ketQua;
}


// === NEW TUITION OVERVIEW FUNCTIONS ===

function updateClassStudentPaymentStatusBulk(logIds, studentId, isPaid) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var ss = getClassSpreadsheet();
    var sheet = ss.getSheetByName('Nhật ký chung');
    if (!sheet) return { success: false, error: "Không tìm thấy sheet 'Nhật ký chung'." };
    
    var data = sheet.getDataRange().getDisplayValues();
    var updated = false;
    
    for (var i = 1; i < data.length; i++) {
      var currentLogId = data[i][0];
      if (logIds.indexOf(currentLogId) !== -1) {
        var rowIndex = i + 1;
        var jsonStr = data[i][11] || "{}";
        var studentNotes = {};
        try {
          studentNotes = JSON.parse(jsonStr);
        } catch(e) {
          studentNotes = {};
        }
        
        if (!studentNotes[studentId]) {
          studentNotes[studentId] = {
            studentName: "Học sinh",
            attendance: "Có mặt",
            privateNote: ""
          };
        }
        
        studentNotes[studentId].paid = (isPaid === true || isPaid === "true");
        sheet.getRange(rowIndex, 12).setValue(JSON.stringify(studentNotes));
        updated = true;
      }
    }
    
    if (updated) {
      clearClassCache(null, "logs");
      SpreadsheetApp.flush();
      return { success: true };
    }
    return { success: false, error: "Không tìm thấy nhật ký để cập nhật." };
  } catch(e) {
    return { success: false, error: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

function updateMultipleStudentsPaymentStatus(updates) {
  // updates = [{logId: "...", studentId: "...", isPaid: true}, ...]
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var ss = getClassSpreadsheet();
    var sheet = ss.getSheetByName('Nhật ký chung');
    if (!sheet) return { success: false, error: "Không tìm thấy sheet 'Nhật ký chung'." };
    
    var data = sheet.getDataRange().getDisplayValues();
    var updated = false;
    
    // Create a map for quick lookup: { logId: [ {studentId, isPaid}, ... ] }
    var updatesMap = {};
    for (var k = 0; k < updates.length; k++) {
      var u = updates[k];
      if (!updatesMap[u.logId]) updatesMap[u.logId] = [];
      updatesMap[u.logId].push(u);
    }
    
    for (var i = 1; i < data.length; i++) {
      var currentLogId = data[i][0];
      if (updatesMap[currentLogId]) {
        var rowIndex = i + 1;
        var jsonStr = data[i][11] || "{}";
        var studentNotes = {};
        try {
          studentNotes = JSON.parse(jsonStr);
        } catch(e) {
          studentNotes = {};
        }
        
        var modifications = updatesMap[currentLogId];
        for (var j = 0; j < modifications.length; j++) {
          var sid = modifications[j].studentId;
          var isPaid = modifications[j].isPaid;
          
          if (!studentNotes[sid]) {
            studentNotes[sid] = {
              studentName: "Học sinh",
              attendance: "Có mặt",
              privateNote: ""
            };
          }
          studentNotes[sid].paid = (isPaid === true || isPaid === "true");
        }
        
        sheet.getRange(rowIndex, 12).setValue(JSON.stringify(studentNotes));
        updated = true;
      }
    }
    
    if (updated) {
      clearClassCache(null, "logs");
      SpreadsheetApp.flush();
      return { success: true };
    }
    return { success: false, error: "Không có nhật ký nào được cập nhật." };
  } catch(e) {
    return { success: false, error: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

// Lấy danh sách ý kiến đóng góp từ Phụ huynh cho Giáo viên lớp học
function getClassTutorFeedback(tutorPhone, tutorCode) {
  try {
    var ss = getClassSpreadsheet();
    var sheet = ss.getSheetByName('Ý kiến Phụ huynh lớp học');
    if (!sheet) return [];
    
    var data = sheet.getDataRange().getDisplayValues();
    if (data.length <= 1) return [];
    
    var result = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row || row.length < 5) continue;
      
      var feedbackId = row[0] || "";
      var classId = row[1] || "";
      var parentPhone = row[2] || "";
      var studentName = row[3] || "Học sinh";
      var content = row[4] || "";
      var timestamp = row[5] || "";
      
      if (!content || content.trim() === "") continue;
      
      result.push({
        feedbackId: feedbackId,
        classId: classId,
        studentPhone: parentPhone,
        studentName: studentName,
        content: content,
        timestamp: timestamp
      });
    }
    
    result.reverse(); // Đưa phản hồi mới nhất lên đầu
    return result;
  } catch(e) {
    Logger.log("Lỗi getClassTutorFeedback: " + e.toString());
    return [];
  }
}

// === QUẢN LÝ THÔNG BÁO LỚP HỌC ===

function saveClassAnnouncement(classId, className, text) {
  try {
    var ss = getClassSpreadsheet();
    var sheetName = "Thông báo lớp";
    var sheet = ss.getSheetByName(sheetName);
    var headers = ["Mã thông báo", "Mã lớp", "Tên lớp", "Nội dung thông báo", "Thời gian cập nhật"];
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#8E4DFF").setFontColor("#FFFFFF");
    }
    
    var data = sheet.getDataRange().getDisplayValues();
    var cleanClassId = String(classId || "").trim();
    var targetRowIndex = -1;
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][1] || "").trim() === cleanClassId) {
        targetRowIndex = i + 1;
        break;
      }
    }
    
    var nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
    
    if (targetRowIndex > 0) {
      sheet.getRange(targetRowIndex, 4).setValue(text || "");
      sheet.getRange(targetRowIndex, 5).setValue(nowStr);
    } else {
      var annId = "TB_" + new Date().getTime();
      sheet.appendRow([annId, cleanClassId, className || "", text || "", nowStr]);
    }
    
    clearClassCache(cleanClassId, "announcement");
    SpreadsheetApp.flush();
    return { success: true };
  } catch (e) {
    Logger.log("Lỗi saveClassAnnouncement: " + e.toString());
    return { success: false, error: e.toString() };
  }
}

function getClassAnnouncement(classId) {
  try {
    var ss = getClassSpreadsheet();
    var sheet = ss.getSheetByName('Thông báo lớp');
    if (!sheet) return "";
    
    var data = sheet.getDataRange().getDisplayValues();
    var cleanClassId = String(classId || "").trim();
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][1] || "").trim() === cleanClassId) {
        return data[i][3] || "";
      }
    }
    return "";
  } catch (e) {
    Logger.log("Lỗi getClassAnnouncement: " + e.toString());
    return "";
  }
}
