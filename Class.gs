// Class.gs - Backend logic for Class Management System (Mô hình quản lý Lớp học)

const CLASS_SPREADSHEET_ID = '1g4M-WjXxCf-rx9aVNBcKrs6dgXsAlZGVupQP8P3xgyc';

function getClassSpreadsheet() {
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
  return ss;
}

// Hàm tự động khởi tạo 6 trang tính chuẩn màu cho Google Sheet Lớp học nhóm nếu chưa có
function initClassSpreadsheetSchema(ss) {
  if (!ss) return;

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
  if (!sStudents) {
    sStudents = ss.insertSheet('Học sinh lớp học');
    sStudents.appendRow(["Mã học sinh", "Tên học sinh", "SĐT Phụ huynh", "Mã lớp", "Tên lớp", "Ngày nhập học", "Trạng thái", "Ghi chú", "Ngày xóa"]);
    sStudents.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#8E4DFF").setFontColor("#FFFFFF");
    sStudents.setFrozenRows(1);
  }

  // 3. Sheet 'Nhật ký buổi học'
  var sLogs = ss.getSheetByName('Nhật ký buổi học');
  if (!sLogs) {
    sLogs = ss.insertSheet('Nhật ký buổi học');
    sLogs.appendRow(["Mã nhật ký", "Mã lớp", "Tên lớp", "Tuần số", "Ngày học", "Môn học", "Trạng thái cả lớp", "Đánh giá BTVN", "Bài kiểm tra đầu giờ", "Bài kiểm tra định kỳ", "Nhận xét chung buổi học", "Nhận xét riêng từng học sinh (JSON)"]);
    sLogs.getRange(1, 1, 1, 12).setFontWeight("bold").setBackground("#10B981").setFontColor("#FFFFFF");
    sLogs.setFrozenRows(1);
  }

  // 4. Sheet 'Bài tập lớp học'
  var sHw = ss.getSheetByName('Bài tập lớp học');
  if (!sHw) {
    sHw = ss.insertSheet('Bài tập lớp học');
    sHw.appendRow(["Mã bài tập", "Mã lớp", "Tên lớp", "Tên bài tập", "Môn học", "Nội dung / Link bài tập", "Hạn nộp", "Ngày giao"]);
    sHw.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#F59E0B").setFontColor("#FFFFFF");
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

// Hàm đăng nhập dành cho Giáo viên Lớp học nhóm (Cô lập hoàn toàn trên Sheet 2)
function loginClassSystem(phone, pin) {
  var ss = getClassSpreadsheet(); // Tự động đảm bảo kết nối Sheet 2 Lớp học nhóm
  var normPhone = normalizePhone(phone || "");
  if (!normPhone) {
    return { success: false, error: "Vui lòng nhập số điện thoại hợp lệ." };
  }

  var classes = getClassList(phone, "");
  
  // Tùy chọn kiểm tra PIN nếu giáo viên cài mã PIN trên Sheet 2
  var sheetClasses = ss.getSheetByName('Danh sách lớp học');
  if (sheetClasses) {
    var data = sheetClasses.getDataRange().getDisplayValues();
    for (var i = 1; i < data.length; i++) {
      var dbPhone = normalizePhone(data[i][2] || "");
      if (dbPhone === normPhone) {
        var dbPin = (data[i].length > 7) ? String(data[i][7] || "").trim() : "";
        if (dbPin !== "" && pin && String(pin).trim() !== dbPin) {
          return { success: false, error: "Mã PIN bảo mật không chính xác!" };
        }
      }
    }
  }

  var teacherName = "Giáo viên Lớp học";
  if (classes && classes.length > 0) {
    teacherName = "Giáo viên (" + (classes[0].subject || "Lớp học") + ")";
  }

  return {
    success: true,
    role: "class_tutor",
    tutorPhone: phone,
    tutorName: teacherName,
    classes: classes
  };
}

// Lấy danh sách Lớp học của Giáo viên theo SĐT hoặc Mã Giáo Viên
function getClassList(tutorPhone, tutorCode) {
  var ss = getClassSpreadsheet();
  var sheetClasses = ss.getSheetByName('Danh sách lớp học');
  
  if (!sheetClasses) {
    // Khởi tạo sheet Danh sách lớp học nếu chưa có
    sheetClasses = ss.insertSheet('Danh sách lớp học');
    sheetClasses.appendRow(["Mã lớp", "Tên lớp", "SĐT / Mã Giáo viên", "Môn học", "Lịch học cố định", "Sĩ số tối đa", "Loại học phí"]);
    sheetClasses.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#5B2EFF").setFontColor("#FFFFFF");
    return [];
  }
  
  var normPhone = normalizePhone(tutorPhone || "");
  var normCode = String(tutorCode || "").trim().toLowerCase();
  
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
          tutorCode: data[i][2] || "",
          subject: data[i][3] || "",
          schedule: data[i][4] || "",
          maxStudents: data[i][5] || "20",
          feeType: (data[i].length > 6 && data[i][6]) ? data[i][6] : "per_session"
        };
        
        allClasses.push(clsObj);
        
        var dbVal = String(data[i][2] || "").trim();
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
        }
        
        if (isMatch) {
          matchedClasses.push(clsObj);
        }
      }
    }
  }
  
  // Nếu tìm thấy theo SĐT / Mã GV thì lấy matchedClasses, nếu không thì lấy toàn bộ allClasses
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

// Xóa tạm Lớp học vào Thùng rác (Soft Delete)
function deleteClass(classId, className) {
  var ss = getClassSpreadsheet();
  var sheetClasses = ss.getSheetByName('Danh sách lớp học');
  if (sheetClasses) {
    var data = sheetClasses.getDataRange().getDisplayValues();
    var nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(classId).trim()) {
        sheetClasses.getRange(i + 1, 6).setValue(nowStr);
        SpreadsheetApp.flush();
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

// === QUẢN LÝ NHẬT KÝ BÀI HỌC VÀ NHẬN XÉT CHI TIẾT TRỰC TIẾP TRÊN SHEET TÊN LỚP ===

function getOrCreateClassLessonLogSheet(ss, className) {
  if (!ss) ss = getClassSpreadsheet();
  var sheetName = className ? String(className).trim() : 'Nhật ký học tập lớp';
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
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
      "Chi tiết nhận xét riêng (JSON)",
      "Ngày xóa"
    ]);
    sheet.getRange(1, 1, 1, 13).setFontWeight("bold").setBackground("#8E4DFF").setFontColor("#FFFFFF");
  } else {
    if (sheet.getLastColumn() < 13) {
      sheet.getRange(1, 13).setValue("Ngày xóa").setFontWeight("bold").setBackground("#8E4DFF").setFontColor("#FFFFFF");
    }
  }
  return sheet;
}

function saveClassLessonLog(classId, className, weekNum, studyDate, subject, status, hwEval, entryTest, termTest, generalNote, studentNotesJson) {
  var ss = getClassSpreadsheet();
  var sheet = getOrCreateClassLessonLogSheet(ss, className);
  var logId = "LOG_LH_" + new Date().getTime();
  
  sheet.appendRow([
    logId,
    classId || "",
    className || "",
    weekNum || "",
    studyDate || "",
    subject || "",
    status || "Đã học",
    hwEval || "Hoàn thành",
    entryTest || "Không có",
    termTest || "Không có",
    generalNote || "",
    studentNotesJson || "{}",
    "" // Cột 13: Ngày xóa (Trống = Hoạt động)
  ]);
  
  SpreadsheetApp.flush();
  return { success: true, logId: logId };
}

function getClassLessonLogs(classId, className) {
  var ss = getClassSpreadsheet();
  var sheet = getOrCreateClassLessonLogSheet(ss, className);
  var data = sheet.getDataRange().getDisplayValues();
  
  var logs = [];
  var cleanClassId = String(classId || "").trim();
  var cleanClassName = String(className || "").trim();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i].length >= 11 && data[i][0] !== "") {
      var deletedAt = (data[i].length > 12) ? String(data[i][12]).trim() : "";
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
  
  logs.reverse();
  return logs;
}

// Xóa tạm Nhật ký buổi học vào Thùng rác (Soft Delete)
function deleteClassLessonLog(logId, className) {
  var ss = getClassSpreadsheet();
  var sheet = getOrCreateClassLessonLogSheet(ss, className);
  var data = sheet.getDataRange().getDisplayValues();
  var nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(logId).trim()) {
      sheet.getRange(i + 1, 13).setValue(nowStr);
      SpreadsheetApp.flush();
      break;
    }
  }
  return { success: true };
}

// === QUẢN LÝ THÙNG RÁC VÀ PHỤC HỒI (RECYCLE BIN & RESTORE) ===

function getClassTrashItems(tutorPhone, tutorCode) {
  var ss = getClassSpreadsheet();
  var trashList = [];
  
  // 1. Lớp học đã xóa
  var sheetClasses = ss.getSheetByName('Danh sách lớp học');
  if (sheetClasses) {
    var data = sheetClasses.getDataRange().getDisplayValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i].length >= 6) {
        var deletedAt = String(data[i][5]).trim();
        if (deletedAt !== "") {
          trashList.push({
            type: 'class',
            id: data[i][0],
            name: data[i][1],
            detail: "Môn: " + (data[i][3] || "Toán") + " | " + (data[i][4] || ""),
            deletedAt: deletedAt
          });
        }
      }
    }
  }

  // 2. Học sinh đã xóa
  var sheetStudents = ss.getSheetByName('Học sinh lớp học');
  if (sheetStudents) {
    var dataS = sheetStudents.getDataRange().getDisplayValues();
    for (var j = 1; j < dataS.length; j++) {
      if (dataS[j].length >= 9) {
        var deletedAtS = String(dataS[j][8]).trim();
        if (deletedAtS !== "") {
          trashList.push({
            type: 'student',
            id: dataS[j][0],
            name: dataS[j][1],
            detail: "Lớp ID: " + dataS[j][2] + " | Phụ huynh: " + (dataS[j][5] || dataS[j][3] || ""),
            deletedAt: deletedAtS
          });
        }
      }
    }
  }

  // 3. Nhật ký buổi học đã xóa (quét trên tất cả các sheet lớp học)
  var allSheets = ss.getSheets();
  allSheets.forEach(function(sh) {
    var shName = sh.getName();
    if (shName !== 'Danh sách lớp học' && shName !== 'Học sinh lớp học' && shName !== 'Bài tập lớp' && shName !== 'Lịch học lớp' && shName !== 'Thông báo lớp' && shName !== 'Mã gia sư' && shName !== 'Mã admin') {
      var dataL = sh.getDataRange().getDisplayValues();
      for (var k = 1; k < dataL.length; k++) {
        if (dataL[k].length >= 13) {
          var deletedAtL = String(dataL[k][12]).trim();
          if (deletedAtL !== "") {
            trashList.push({
              type: 'lessonLog',
              id: dataL[k][0],
              name: "Buổi học ngày " + (dataL[k][4] || "") + " (" + shName + ")",
              className: shName,
              detail: "Nội dung: " + (dataL[k][10] || "Bài học"),
              deletedAt: deletedAtL
            });
          }
        }
      }
    }
  });

  trashList.reverse();
  return trashList;
}

// Phục hồi mục đã xóa từ Thùng rác
function restoreClassItem(type, itemId, className) {
  var ss = getClassSpreadsheet();
  
  if (type === 'class') {
    var sheetC = ss.getSheetByName('Danh sách lớp học');
    if (sheetC) {
      var dataC = sheetC.getDataRange().getDisplayValues();
      for (var i = 1; i < dataC.length; i++) {
        if (String(dataC[i][0]).trim() === String(itemId).trim()) {
          sheetC.getRange(i + 1, 6).setValue("");
          SpreadsheetApp.flush();
          return { success: true };
        }
      }
    }
  } else if (type === 'student') {
    var sheetS = ss.getSheetByName('Học sinh lớp học');
    if (sheetS) {
      var dataS = sheetS.getDataRange().getDisplayValues();
      for (var j = 1; j < dataS.length; j++) {
        if (String(dataS[j][0]).trim() === String(itemId).trim()) {
          sheetS.getRange(j + 1, 9).setValue("");
          SpreadsheetApp.flush();
          return { success: true };
        }
      }
    }
  } else if (type === 'lessonLog') {
    var targetSheet = ss.getSheetByName(className) || ss.getSheetByName('Nhật ký học tập lớp');
    if (targetSheet) {
      var dataL = targetSheet.getDataRange().getDisplayValues();
      for (var k = 1; k < dataL.length; k++) {
        if (String(dataL[k][0]).trim() === String(itemId).trim()) {
          targetSheet.getRange(k + 1, 13).setValue("");
          SpreadsheetApp.flush();
          return { success: true };
        }
      }
    }
  }
  
  return { success: false, error: "Không tìm thấy mục cần phục hồi." };
}

// Xóa vĩnh viễn mục khỏi Thùng rác
function purgeClassItem(type, itemId, className) {
  var ss = getClassSpreadsheet();
  
  if (type === 'class') {
    var sheetC = ss.getSheetByName('Danh sách lớp học');
    if (sheetC) {
      var dataC = sheetC.getDataRange().getDisplayValues();
      for (var i = 1; i < dataC.length; i++) {
        if (String(dataC[i][0]).trim() === String(itemId).trim()) {
          sheetC.deleteRow(i + 1);
          SpreadsheetApp.flush();
          return { success: true };
        }
      }
    }
  } else if (type === 'student') {
    var sheetS = ss.getSheetByName('Học sinh lớp học');
    if (sheetS) {
      var dataS = sheetS.getDataRange().getDisplayValues();
      for (var j = 1; j < dataS.length; i++) {
        if (String(dataS[j][0]).trim() === String(itemId).trim()) {
          sheetS.deleteRow(j + 1);
          SpreadsheetApp.flush();
          return { success: true };
        }
      }
    }
  } else if (type === 'lessonLog') {
    var targetSheet = ss.getSheetByName(className) || ss.getSheetByName('Nhật ký học tập lớp');
    if (targetSheet) {
      var dataL = targetSheet.getDataRange().getDisplayValues();
      for (var k = 1; k < dataL.length; k++) {
        if (String(dataL[k][0]).trim() === String(itemId).trim()) {
          targetSheet.deleteRow(k + 1);
          SpreadsheetApp.flush();
          return { success: true };
        }
      }
    }
  }
  
  return { success: false, error: "Không tìm thấy mục cần xóa vĩnh viễn." };
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

// === QUẢN LÝ BÀI TẬP GIAO LỚP HỌC (SHEET 'Bài tập giao lớp') ===

function getOrCreateClassHomeworkSheet(ss) {
  if (!ss) ss = getClassSpreadsheet();
  var sheet = ss.getSheetByName('Bài tập giao lớp');
  if (!sheet) {
    sheet = ss.insertSheet('Bài tập giao lớp');
    sheet.appendRow(["Mã bài tập", "Mã lớp", "Tên lớp", "Tên bài tập", "Ngày giao", "Link đính kèm", "URL File đính kèm"]);
    sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#8E4DFF").setFontColor("#FFFFFF");
  }
  return sheet;
}

function getClassHomeworkList(classId, className) {
  var ss = getClassSpreadsheet();
  var sheet = getOrCreateClassHomeworkSheet(ss);
  var data = sheet.getDataRange().getDisplayValues();
  var list = [];
  
  var cleanId = String(classId || "").trim();
  var cleanName = String(className || "").trim().toLowerCase();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i] && data[i].length >= 4 && data[i][0] !== "") {
      var rowClassId = String(data[i][1] || "").trim();
      var rowClassName = String(data[i][2] || "").trim().toLowerCase();
      
      if ((cleanId !== "" && rowClassId === cleanId) || (cleanName !== "" && rowClassName === cleanName) || (cleanId === "" && cleanName === "")) {
        list.push({
          hwId: data[i][0],
          classId: data[i][1],
          className: data[i][2],
          title: data[i][3],
          releaseDate: data[i][4] || "",
          link: data[i][5] || "",
          fileUrl: data[i][6] || ""
        });
      }
    }
  }
  list.reverse();
  return list;
}

function saveClassHomework(classId, className, title, releaseDate, fileUrl, link) {
  try {
    var ss = getClassSpreadsheet();
    var sheet = getOrCreateClassHomeworkSheet(ss);
    var hwId = "HW_" + new Date().getTime().toString().slice(-6);
    
    sheet.appendRow([hwId, classId || "", className || "", title || "Bài tập mới", releaseDate || "", link || "", fileUrl || ""]);
    SpreadsheetApp.flush();
    return { success: true, hwId: hwId };
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
        sheet.deleteRow(i + 1);
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

function getClassAnnouncement(classId) {
  var ss = getClassSpreadsheet();
  var sheet = getOrCreateClassAnnouncementSheet(ss);
  var data = sheet.getDataRange().getDisplayValues();
  var cleanId = String(classId || "").trim();
  
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i] && data[i].length >= 4 && String(data[i][1]).trim() === cleanId) {
      return data[i][3] || "";
    }
  }
  return "";
}

function saveClassAnnouncement(classId, className, text) {
  try {
    var ss = getClassSpreadsheet();
    var sheet = getOrCreateClassAnnouncementSheet(ss);
    var cleanId = String(classId || "").trim();
    var nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");
    
    sheet.appendRow(["ANN_" + new Date().getTime(), cleanId, className || "", text || "", nowStr]);
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

  // 2. Quét nhật ký đã bị soft delete trong 'Nhật ký buổi học'
  var sheetLogs = ss.getSheetByName('Nhật ký buổi học');
  if (sheetLogs) {
    var dataL = sheetLogs.getDataRange().getDisplayValues();
    for (var j = 1; j < dataL.length; j++) {
      var rowL = dataL[j];
      var delAtLog = (rowL.length > 12) ? String(rowL[12]).trim() : "";
      if (delAtLog !== "") {
        items.push({
          type: 'lessonLog',
          id: rowL[0] || "",
          name: "Buổi học ngày " + (rowL[4] || "-"),
          className: rowL[2] || rowL[1] || "",
          detail: "Tuần: " + (rowL[3] || "-") + " | Lớp: " + (rowL[2] || "-"),
          deletedAt: delAtLog
        });
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
          return { success: true };
        }
      }
    }
  } else if (type === 'lessonLog') {
    var sheetL = ss.getSheetByName('Nhật ký buổi học');
    if (sheetL) {
      var dataL = sheetL.getDataRange().getDisplayValues();
      for (var j = 1; j < dataL.length; j++) {
        if (String(dataL[j][0]).trim() === String(itemId).trim()) {
          sheetL.getRange(j + 1, 13).setValue("");
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
    var sheetL = ss.getSheetByName('Nhật ký buổi học');
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

// Lưu thông báo nhanh cho Lớp học vào Sheet 'Thông báo lớp'
function saveClassAnnouncement(classId, className, text) {
  try {
    var ss = getClassSpreadsheet();
    var sheet = ss.getSheetByName('Thông báo lớp');
    if (!sheet) {
      initClassSpreadsheetSchema(ss);
      sheet = ss.getSheetByName('Thông báo lớp');
    }
    
    var data = sheet.getDataRange().getDisplayValues();
    var found = false;
    var nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(classId).trim()) {
        sheet.getRange(i + 1, 3).setValue(text);
        sheet.getRange(i + 1, 4).setValue(nowStr);
        found = true;
        break;
      }
    }
    
    if (!found) {
      sheet.appendRow([classId, className, text, nowStr]);
    }
    
    SpreadsheetApp.flush();
    return { success: true };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// Lấy thông báo nhanh của Lớp học từ Sheet 'Thông báo lớp'
function getClassAnnouncement(classId) {
  try {
    var ss = getClassSpreadsheet();
    var sheet = ss.getSheetByName('Thông báo lớp');
    if (!sheet) return "";
    
    var data = sheet.getDataRange().getDisplayValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(classId).trim()) {
        return data[i][2] || "";
      }
    }
    return "";
  } catch (e) {
    return "";
  }
}

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
    tenHocSinh: studentName,
    thongBaoHocSinh: thongBaoText,
    lichSuHocTap: [],
    baiTap: []
  };

  // 1. Trích xuất Nhật ký buổi học của Lớp học
  var sheetLogs = ss.getSheetByName('Nhật ký buổi học');
  if (sheetLogs) {
    var dataLogs = sheetLogs.getDataRange().getDisplayValues();
    for (var l = 1; l < dataLogs.length; l++) {
      var rowClassId = String(dataLogs[l][1] || "").trim();
      var rowClassName = String(dataLogs[l][2] || "").trim();
      
      if (rowClassId === String(classId).trim() || (className && rowClassName === String(className).trim())) {
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
            if (pObj && pObj[studentId]) {
              if (pObj[studentId].attendance) privateAtt = pObj[studentId].attendance;
              if (pObj[studentId].privateNote) privateNote = pObj[studentId].privateNote + (generalNote ? " (" + generalNote + ")" : "");
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
          link: dataHw[h][5] || ""
        });
      }
    }
  }

  return ketQua;
}
