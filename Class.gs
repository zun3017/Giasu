// Class.gs - Backend logic for Class Management System (Mô hình quản lý Lớp học)

const CLASS_SPREADSHEET_ID = '1g4M-WjXxCf-rx9aVNBcKrs6dgXsAlZGVupQP8P3xgyc';

function getClassSpreadsheet() {
  if (typeof CLASS_SPREADSHEET_ID !== 'undefined' && CLASS_SPREADSHEET_ID.trim() !== '') {
    try {
      return SpreadsheetApp.openById(CLASS_SPREADSHEET_ID.trim());
    } catch (e) {
      Logger.log("Lỗi mở Class Spreadsheet, dùng mặc định: " + e.toString());
    }
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getOrCreateClassEvaluationSheet(ss, className) {
  if (!ss) ss = getClassSpreadsheet();
  var cleanName = String(className || "Lớp mới").trim();
  var sheetName = cleanName;
  var sheet = ss.getSheetByName(sheetName);
  
  // Kiểm tra nếu chưa có sheet tên mới thì thử tìm sheet tên cũ để tự động đổi tên
  if (!sheet) {
    var oldSheetName = "Bảng đánh giá học tập dành cho lớp học (" + cleanName + ")";
    var oldSheet = ss.getSheetByName(oldSheetName);
    if (oldSheet) {
      oldSheet.setName(sheetName);
      sheet = oldSheet;
    }
  }
  
  if (!sheet) {
    // Thử clone từ sheet mẫu 'Bảng đánh giá học tập ' nếu có, hoặc tạo mới với tiêu đề chuẩn
    var templateSheet = ss.getSheetByName('Bảng đánh giá học tập ');
    if (templateSheet) {
      sheet = templateSheet.copyTo(ss);
      sheet.setName(sheetName);
    } else {
      sheet = ss.insertSheet(sheetName);
      // Tạo hàng tiêu đề chuẩn
      sheet.appendRow([
        "Mã đánh giá", "Mã lớp", "Mã học sinh", "Tên học sinh", "Ngày học", 
        "Chuyên cần", "Điểm BTVN", "Điểm kiểm tra", "Đánh giá sao", "Ghi chú riêng", "Ghi chú chung buổi học"
      ]);
      sheet.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#8E4DFF").setFontColor("#FFFFFF");
    }
  }
  return sheet;
}

// Lấy danh sách Lớp học của Giáo viên theo SĐT
function getClassList(tutorPhone) {
  var ss = getClassSpreadsheet();
  var sheetClasses = ss.getSheetByName('Danh sách lớp học');
  
  if (!sheetClasses) {
    // Khởi tạo sheet Danh sách lớp học nếu chưa có
    sheetClasses = ss.insertSheet('Danh sách lớp học');
    sheetClasses.appendRow(["Mã lớp", "Tên lớp", "SĐT Gia sư", "Môn học", "Lịch học cố định", "Sĩ số tối đa", "Loại học phí"]);
    sheetClasses.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#5B2EFF").setFontColor("#FFFFFF");
    return [];
  }
  
  var normPhone = normalizePhone(tutorPhone);
  var data = sheetClasses.getDataRange().getDisplayValues();
  var allClasses = [];
  var matchedClasses = [];

  for (var i = 1; i < data.length; i++) {
    if (data[i] && data[i].length >= 2) {
      var cId = data[i][0] ? String(data[i][0]).trim() : "";
      var cName = data[i][1] ? String(data[i][1]).trim() : "";
      
      if (cName !== "" || cId !== "") {
        if (!cId) cId = "LH_" + i;
        if (!cName) cName = "Lớp " + i;
        
        var clsObj = {
          classId: cId,
          className: cName,
          tutorPhone: data[i][2] || "",
          subject: data[i][3] || "",
          schedule: data[i][4] || "",
          maxStudents: data[i][5] || "20",
          feeType: (data[i].length > 6 && data[i][6]) ? data[i][6] : "per_session"
        };
        
        allClasses.push(clsObj);
        
        var dbPhone = normalizePhone(data[i][2]);
        if (normPhone === "" || dbPhone === "" || dbPhone === normPhone) {
          matchedClasses.push(clsObj);
        }
      }
    }
  }
  
  // Nếu tìm theo SĐT có lớp thì lấy matchedClasses, nếu lệch SĐT thì trả về toàn bộ allClasses có trong sheet!
  return (matchedClasses.length > 0) ? matchedClasses : allClasses;
}

// Lấy toàn bộ dữ liệu tổng cho Phân hệ Lớp Học trong 1 chuyến gọi server duy nhất (1s)
function getClassDashboardData(tutorPhone, requestedClassId) {
  var classes = getClassList(tutorPhone);
  
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
function createClass(tutorPhone, className, subject, schedule, feeType) {
  var ss = getClassSpreadsheet();
  var normPhone = normalizePhone(tutorPhone);
  var sheetClasses = ss.getSheetByName('Danh sách lớp học');
  
  if (!sheetClasses) {
    getClassList(tutorPhone);
    sheetClasses = ss.getSheetByName('Danh sách lớp học');
  }
  
  var classId = "LH_" + new Date().getTime().toString().slice(-6);
  var cleanClassName = String(className).trim();
  
  sheetClasses.appendRow([classId, cleanClassName, tutorPhone, subject || "", schedule || "", "", feeType || "per_session"]);
  
  // Tự động tạo Tab Sheet đánh giá học tập riêng cho Lớp học mới!
  getOrCreateClassEvaluationSheet(ss, cleanClassName);
  
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
      
      SpreadsheetApp.flush();
      return { success: true };
    }
  }
  return { error: "Không tìm thấy lớp học với mã này." };
}

// Xóa Lớp học
function deleteClass(classId, className) {
  var ss = getClassSpreadsheet();
  var sheetClasses = ss.getSheetByName('Danh sách lớp học');
  if (sheetClasses) {
    var data = sheetClasses.getDataRange().getDisplayValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === classId) {
        sheetClasses.deleteRow(i + 1);
        break;
      }
    }
  }
  return { success: true };
}

// Lấy danh sách Học sinh thuộc một Lớp học
function getClassStudents(classId) {
  var ss = getClassSpreadsheet();
  var sheetStudents = ss.getSheetByName('Học sinh lớp học');
  var students = [];
  
  if (!sheetStudents) {
    sheetStudents = ss.insertSheet('Học sinh lớp học');
    sheetStudents.appendRow(["Mã học sinh", "Tên học sinh", "Mã lớp", "SĐT Phụ huynh", "Ngày tham gia", "Tên phụ huynh", "Học phí/buổi", "Mã bài tập", "Ngày xóa", "Loại học phí"]);
    sheetStudents.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#8E4DFF").setFontColor("#FFFFFF");
    return students;
  }
  
  var data = sheetStudents.getDataRange().getDisplayValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i].length >= 3 && data[i][2] === classId) {
      var deletedAt = (data[i].length > 8) ? data[i][8].trim() : "";
      if (deletedAt !== "") continue; // Bỏ qua học sinh nằm trong Thùng rác
      
      students.push({
        studentId: data[i][0],
        studentName: data[i][1],
        classId: data[i][2],
        parentPhone: data[i][3] || "",
        joinDate: data[i][4] || "",
        parentName: data[i][5] || "",
        fee: data[i][6] || "",
        homeworkCode: data[i][7] || "",
        feeType: (data[i].length > 9 && data[i][9]) ? data[i][9] : ""
      });
    }
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
    feeType || "" // Cột 10: Loại học phí (Trống = dùng loại mặc định của lớp)
  ]);
  
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

// Chỉnh sửa thông tin Học sinh Lớp học
function updateClassStudent(studentId, studentName, parentPhone, parentName, fee, homeworkCode, feeType) {
  var ss = getClassSpreadsheet();
  var sheetStudents = ss.getSheetByName('Học sinh lớp học');
  if (!sheetStudents) return { success: false, error: "Không tìm thấy sheet học sinh." };
  
  var data = sheetStudents.getDataRange().getDisplayValues();
  var rowIndex = -1;
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === studentId) {
      rowIndex = i + 1;
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
        sheetStudents.deleteRow(i + 1);
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

// === QUẢN LÝ NHẬT KÝ BÀI HỌC VÀ NHẬN XÉT CHI TIẾT THEO LỚP ===

function getOrCreateClassLessonLogSheet(ss) {
  if (!ss) ss = getClassSpreadsheet();
  var sheet = ss.getSheetByName('Nhật ký học tập lớp');
  if (!sheet) {
    sheet = ss.insertSheet('Nhật ký học tập lớp');
    sheet.appendRow([
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
      "Chi tiết nhận xét riêng (JSON)"
    ]);
    sheet.getRange(1, 1, 1, 12).setFontWeight("bold").setBackground("#8E4DFF").setFontColor("#FFFFFF");
  }
  return sheet;
}

function saveClassLessonLog(classId, className, weekNum, studyDate, subject, status, hwEval, entryTest, termTest, generalNote, studentNotesJson) {
  var ss = getClassSpreadsheet();
  var sheet = getOrCreateClassLessonLogSheet(ss);
  var logId = "LOG_LH_" + new Date().getTime();
  
  sheet.appendRow([
    logId,
    classId,
    className,
    weekNum || "",
    studyDate || "",
    subject || "",
    status || "Đã học",
    hwEval || "Hoàn thành",
    entryTest || "Không có",
    termTest || "Không có",
    generalNote || "",
    studentNotesJson || "{}"
  ]);
  
  return { success: true, logId: logId };
}

function getClassLessonLogs(classId, className) {
  var ss = getClassSpreadsheet();
  var sheet = getOrCreateClassLessonLogSheet(ss);
  var data = sheet.getDataRange().getDisplayValues();
  
  var logs = [];
  var cleanClassId = String(classId || "").trim();
  var cleanClassName = String(className || "").trim();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i].length >= 11 && data[i][0] !== "") {
      var rowClassId = String(data[i][1] || "").trim();
      var rowClassName = String(data[i][2] || "").trim();
      
      if (rowClassId === cleanClassId || rowClassName === cleanClassName) {
        var studentNotes = {};
        try {
          studentNotes = JSON.parse(data[i][11] || "{}");
        } catch(e) {
          studentNotes = {};
        }
        
        logs.push({
          logId: data[i][0],
          classId: data[i][1],
          className: data[i][2],
          weekNum: data[i][3],
          studyDate: data[i][4],
          subject: data[i][5],
          status: data[i][6],
          hwEval: data[i][7],
          entryTest: data[i][8],
          termTest: data[i][9],
          generalNote: data[i][10],
          studentNotes: studentNotes
        });
      }
    }
  }
  
  // Sắp xếp ngày mới nhất lên đầu
  logs.reverse();
  return logs;
}

function deleteClassLessonLog(logId) {
  var ss = getClassSpreadsheet();
  var sheet = getOrCreateClassLessonLogSheet(ss);
  var data = sheet.getDataRange().getDisplayValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === logId) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
  return { success: true };
}

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

function getClassAnnouncement(classId) {
  var ss = getClassSpreadsheet();
  var sheet = ss.getSheetByName('Thông báo lớp');
  if (!sheet) return "";
  
  var cleanClassId = String(classId || "").trim();
  var data = sheet.getDataRange().getDisplayValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === cleanClassId) {
      return data[i][2] || "";
    }
  }
  return "";
}

// === QUẢN LÝ BÀI TẬP LỚP HỌC ===

function saveClassHomework(classId, className, title, releaseDate, fileData, link) {
  var ss = getClassSpreadsheet();
  var sheet = ss.getSheetByName('Bài tập lớp');
  if (!sheet) {
    sheet = ss.insertSheet('Bài tập lớp');
    sheet.appendRow(["Mã bài tập", "Mã lớp", "Tên lớp", "Tên bài tập", "Ngày phát hành", "File đính kèm (URL)", "Tên file", "Link bài tập"]);
    sheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#8E4DFF").setFontColor("#FFFFFF");
  }
  
  var hwId = "HW_LH_" + new Date().getTime();
  var fileUrl = "";
  var fileName = "";
  
  if (fileData && fileData.base64) {
    try {
      var folderName = "VibeCode_Homework_Class";
      var folders = DriveApp.getFoldersByName(folderName);
      var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
      
      var blob = Utilities.newBlob(Utilities.base64Decode(fileData.base64), fileData.mimeType, fileData.fileName);
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      fileUrl = file.getUrl();
      fileName = fileData.fileName;
    } catch(e) {
      console.error("Lỗi upload file bài tập:", e);
    }
  }
  
  sheet.appendRow([
    hwId,
    classId || "",
    className || "",
    title || "",
    releaseDate || new Date().toLocaleDateString('vi-VN'),
    fileUrl,
    fileName,
    link || ""
  ]);
  
  return { success: true, hwId: hwId, fileUrl: fileUrl, fileName: fileName };
}

function getClassHomeworkList(classId, className) {
  var ss = getClassSpreadsheet();
  var sheet = ss.getSheetByName('Bài tập lớp');
  if (!sheet) return [];
  
  var data = sheet.getDataRange().getDisplayValues();
  var cleanClassId = String(classId || "").trim();
  var cleanClassName = String(className || "").trim();
  var list = [];
  
  for (var i = 1; i < data.length; i++) {
    if (data[i].length >= 5 && data[i][0] !== "") {
      var rClassId = String(data[i][1] || "").trim();
      var rClassName = String(data[i][2] || "").trim();
      
      if (rClassId === cleanClassId || rClassName === cleanClassName) {
        list.push({
          hwId: data[i][0],
          classId: data[i][1],
          className: data[i][2],
          title: data[i][3],
          releaseDate: data[i][4],
          fileUrl: data[i][5] || "",
          fileName: data[i][6] || "",
          link: data[i][7] || ""
        });
      }
    }
  }
  
  list.reverse();
  return list;
}

function deleteClassHomework(hwId) {
  var ss = getClassSpreadsheet();
  var sheet = ss.getSheetByName('Bài tập lớp');
  if (!sheet) return { success: false };
  
  var data = sheet.getDataRange().getDisplayValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === hwId) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
  return { success: true };
}

// Đồng bộ trạng thái đóng học phí của học sinh lớp học trong JSON
function updateClassStudentPaymentStatus(logId, studentId, isPaid) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var ss = getClassSpreadsheet();
    var sheet = ss.getSheetByName('Nhật ký học tập lớp');
    if (!sheet) return { success: false, error: "Không tìm thấy sheet 'Nhật ký học tập lớp'." };
    
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

// Lấy danh sách các bài nộp của cả lớp từ sheet Bài tập nộp lớp
function getClassSubmissions(classId) {
  var ss = getClassSpreadsheet();
  var sheet = ss.getSheetByName('Bài tập nộp lớp');
  var submissions = [];
  if (!sheet) return submissions;
  
  var data = sheet.getDataRange().getDisplayValues();
  var cleanClassId = String(classId || "").trim();
  for (var i = 1; i < data.length; i++) {
    if (data[i].length >= 8 && String(data[i][3]).trim() === cleanClassId) {
      submissions.push({
        subId: data[i][0],
        hwId: data[i][1],
        title: data[i][2],
        classId: data[i][3],
        studentId: data[i][4],
        studentName: data[i][5],
        fileUrl: data[i][6],
        submittedAt: data[i][7]
      });
    }
  }
  submissions.reverse();
  return submissions;
}
