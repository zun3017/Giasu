// Lấy dữ liệu tổng quan cho Gia sư
function getTutorDashboardData(tutorPhone, gsRow, ss) {
  // Cập nhật ngày hoạt động cuối cùng của Gia sư ngầm
  updateTutorLastActive(ss, tutorPhone);
  
  var normTutorPhone = normalizePhone(tutorPhone);
  var cache = CacheService.getScriptCache();
  var cacheKey = "tutor_dash_" + normTutorPhone;
  var cached = cache.get(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch(e) {
      Logger.log("Lỗi parse cache tutor dash: " + e.toString());
    }
  }
  
  var tutorData = {
    tutorPhone: tutorPhone,
    tutorName: gsRow[1],
    tutorPin: gsRow[3],
    qrCode: (gsRow.length > 4) ? gsRow[4] : "",
    students: [],
    deletedStudents: [],
    totalUnpaidIncome: 0,
    classCount: 0,
    marqueeAnnouncement: PropertiesService.getScriptProperties().getProperty('marquee_announcement') || ""
  };

  var sheetHS = ss.getSheetByName('Mã học sinh');
  if (sheetHS) {
    clearOldDeletedStudents(sheetHS);
    var dataHS = getSheetDisplayValuesCached('Mã học sinh');
    for (var i = 1; i < dataHS.length; i++) {
      var sdtPhuTrach = (dataHS[i].length > 6) ? String(dataHS[i][6]).trim() : "";
      if (normalizePhone(sdtPhuTrach) === normTutorPhone) {
        var xoaDate = (dataHS[i].length > 8) ? String(dataHS[i][8]).trim() : "";
        var maHw = (dataHS[i].length > 7) ? String(dataHS[i][7]).trim().toUpperCase() : "";
        var thongBao = (dataHS[i].length > 4) ? String(dataHS[i][4]).trim() : "";
        if (!xoaDate) {
          tutorData.students.push({
            phone: dataHS[i][3],
            name: dataHS[i][2],
            parentName: dataHS[i][1] ? String(dataHS[i][1]).trim() : "",
            tuition: dataHS[i][5],
            maBaiTap: maHw,
            thongBao: thongBao
          });
        } else {
          tutorData.deletedStudents.push({
            phone: dataHS[i][3],
            name: dataHS[i][2],
            parentName: dataHS[i][1] ? String(dataHS[i][1]).trim() : "",
            tuition: dataHS[i][5],
            deletedDate: xoaDate,
            maBaiTap: maHw,
            thongBao: thongBao
          });
        }
      }
    }
  }
  
  // Tính toán thu nhập chưa thanh toán (unpaid income) và số lớp
  var sheetDG = ss.getSheetByName('Bảng đánh giá học tập ');
  var totalUnpaidIncome = 0;
  
  if (sheetDG && tutorData.students.length > 0) {
    var dataDG = getSheetDisplayValuesCached('Bảng đánh giá học tập ');
    var studentMap = {};
    tutorData.students.forEach(function(st) {
      studentMap[normalizePhone(st.phone)] = parseFloat(st.tuition) || 0;
    });
    
    for (var j = 1; j < dataDG.length; j++) {
      var phoneDG = normalizePhone(dataDG[j][0]);
      if (studentMap.hasOwnProperty(phoneDG)) {
        var tt = String(dataDG[j][9]).trim().toLowerCase();
        var isDaBu = (tt.indexOf("đã bù") !== -1 || tt === "học bù");
        var isPresent = (tt.indexOf("đã học") !== -1 || tt === "có mặt" || tt === "có");
        
        var isPaid = String(dataDG[j][10]).trim().toLowerCase().indexOf("đã đóng") !== -1;
        if ((isPresent || isDaBu) && !isPaid) {
          totalUnpaidIncome += studentMap[phoneDG];
        }
      }
    }
  }
  
  tutorData.totalUnpaidIncome = totalUnpaidIncome;
  tutorData.classCount = tutorData.students.length;
  
  try {
    cache.put(cacheKey, JSON.stringify(tutorData), 600);
  } catch(e) {
    Logger.log("Lỗi ghi cache tutor dash: " + e.toString());
  }
  
  return tutorData;
}

// Xóa cache liên quan của Gia sư
function clearTutorCache(tutorPhone) {
  try {
    var cache = CacheService.getScriptCache();
    var norm = normalizePhone(tutorPhone);
    cache.remove("tutor_dash_" + norm);
    cache.remove("tutor_schedule_" + norm);
    cache.remove("tutor_feedback_" + norm);
    
    // Đồng thời xóa cache báo cáo Admin
    cache.remove("admin_dashboard_data");
  } catch(e) {
    Logger.log("Lỗi xóa cache gia sư: " + e.toString());
  }
}

// Hàm dọn dẹp cache cho các buổi học của một học sinh cụ thể
function clearCachesForStudent(studentPhone, studentName) {
  var normS = normalizePhone(studentPhone);
  var dataHS = getSheetDisplayValuesCached('Mã học sinh');
  
  if (!normS && studentName) {
    var targetName = String(studentName).trim().toLowerCase();
    for (var i = 1; i < dataHS.length; i++) {
      if (String(dataHS[i][2]).trim().toLowerCase() === targetName) {
        normS = normalizePhone(dataHS[i][3]);
        break;
      }
    }
  }

  if (normS) {
    clearStudentCache(normS);
  }
  
  // Tìm gia sư phụ trách để xóa cache gia sư tương ứng
  var tutorPhone = "";
  if (normS) {
    for (var i = 1; i < dataHS.length; i++) {
      if (normalizePhone(dataHS[i][3]) === normS) {
        tutorPhone = dataHS[i][6];
        break;
      }
    }
  }
  if (tutorPhone) {
    clearTutorCache(tutorPhone);
  }
}

// Cập nhật ngày hoạt động cuối cùng của Gia sư
function updateTutorLastActive(ss, tutorPhone) {
  try {
    var sheetGS = ss.getSheetByName('Mã gia sư');
    if (!sheetGS) return;
    
    // Đọc display values trực tiếp thay vì cache vì đây là update ngầm liên tục
    var dataGS = sheetGS.getDataRange().getDisplayValues();
    for (var i = 1; i < dataGS.length; i++) {
      if (String(dataGS[i][2]).trim() === String(tutorPhone).trim()) {
        var todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");
        sheetGS.getRange(i + 1, 9).setValue(todayStr); // Cột I (9) là lastActive
        
        // Vì ghi đè cột lastActive, ta xóa cache của sheet Gia sư
        clearSheetCache('Mã gia sư');
        break;
      }
    }
  } catch (e) {
    Logger.log("Lỗi cập nhật lastActive: " + e.toString());
  }
}

// Lấy Thời Khóa Biểu của Gia sư phụ trách các học sinh
function getTutorSchedule(tutorPhone) {
  var normTutorPhone = normalizePhone(tutorPhone);
  var cache = CacheService.getScriptCache();
  var cacheKey = "tutor_schedule_" + normTutorPhone;
  var cached = cache.get(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch(e) {
      Logger.log("Lỗi parse cache schedule: " + e.toString());
    }
  }
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetLich = ss.getSheetByName('Lịch học');
  if (!sheetLich) return { error: "Chưa tạo sheet 'Lịch học'" };
  
  var dataLich = getSheetDisplayValuesCached('Lịch học');
  var schedule = [];

  for (var i = 1; i < dataLich.length; i++) {
    if (normalizePhone(dataLich[i][0]) === normTutorPhone) {
      schedule.push({
        studentName: dataLich[i][1],
        mon: dataLich[i][3],
        tue: dataLich[i][4],
        wed: dataLich[i][5],
        thu: dataLich[i][6],
        fri: dataLich[i][7],
        sat: dataLich[i][8],
        sun: dataLich[i][9]
      });
    }
  }
  
  try {
    cache.put(cacheKey, JSON.stringify(schedule), 600);
  } catch(e) {
    Logger.log("Lỗi ghi cache schedule: " + e.toString());
  }
  
  return schedule;
}

// Lấy toàn bộ log học tập của 1 học sinh phục vụ gia sư
function getStudentDetailsForTutor(studentPhone, studentName) {
  var normStudentPhone = normalizePhone(studentPhone);
  var cache = CacheService.getScriptCache();
  var cacheKey = "student_logs_" + normStudentPhone;
  var cached = cache.get(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch(e) {
      Logger.log("Lỗi parse cache student logs: " + e.toString());
    }
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetDanhGia = ss.getSheetByName('Bảng đánh giá học tập ');
  if (!sheetDanhGia) return { error: "Không tìm thấy Bảng đánh giá học tập" };
  
  var dataDanhGia = getSheetDisplayValuesCached('Bảng đánh giá học tập ');
  var logs = [];
  
  // 1. Cố gắng so khớp theo Số điện thoại
  for (var i = 1; i < dataDanhGia.length; i++) {
    if (normalizePhone(dataDanhGia[i][0]) === normStudentPhone) {
      if (String(dataDanhGia[i][2]).trim() !== "") {
        logs.push({
          rowIndex: i + 1,
          tuan: dataDanhGia[i][2],
          ngay: dataDanhGia[i][3],
          mon: dataDanhGia[i][4],
          noiDung: dataDanhGia[i][5],
          btvn: dataDanhGia[i][6], 
          diemDauGio: dataDanhGia[i][7],
          diemDinhKi: dataDanhGia[i][8],
          trangThai: dataDanhGia[i][9], 
          tienDong: (dataDanhGia[i].length > 10) ? dataDanhGia[i][10] : "" 
        });
      }
    }
  }
  
  // 2. Dự phòng (Fallback): Nếu không tìm thấy log nào bằng SĐT, so khớp bằng Tên học sinh
  if (logs.length === 0 && studentName) {
    var targetName = String(studentName).trim().toLowerCase();
    for (var i = 1; i < dataDanhGia.length; i++) {
      if (String(dataDanhGia[i][1]).trim().toLowerCase() === targetName) {
        if (String(dataDanhGia[i][2]).trim() !== "") {
          logs.push({
            rowIndex: i + 1,
            tuan: dataDanhGia[i][2],
            ngay: dataDanhGia[i][3],
            mon: dataDanhGia[i][4],
            noiDung: dataDanhGia[i][5],
            btvn: dataDanhGia[i][6],
            diemDauGio: dataDanhGia[i][7],
            diemDinhKi: dataDanhGia[i][8],
            trangThai: dataDanhGia[i][9],
            tienDong: (dataDanhGia[i].length > 10) ? dataDanhGia[i][10] : ""
          });
        }
      }
    }
  }
  
  var result = { logs: logs };
  try {
    cache.put(cacheKey, JSON.stringify(result), 300); // Lưu cache 5 phút
  } catch(e) {
    Logger.log("Lỗi ghi cache student logs: " + e.toString());
  }
  
  return result;
}

// Cập nhật nhanh thông báo phụ huynh/học sinh từ gia sư
function capNhatThongBaoHocSinh(studentPhone, thongBao) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetHS = ss.getSheetByName('Mã học sinh');
    if (!sheetHS) return { error: "Không tìm thấy sheet 'Mã học sinh'" };
    
    var dataHS = sheetHS.getDataRange().getDisplayValues();
    var rowIndex = -1;
    var normPhone = normalizePhone(studentPhone);
    for (var i = 1; i < dataHS.length; i++) {
      if (normalizePhone(dataHS[i][3]) === normPhone) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex === -1) return { error: "Không tìm thấy học sinh." };
    
    sheetHS.getRange(rowIndex, 5).setValue(thongBao || "").setFontFamily("Arial");
    
    // Clear cache
    clearSheetCache('Mã học sinh');
    clearCachesForStudent(studentPhone, typeof studentName !== "undefined" ? studentName : null);
    
    return { success: true };
  } catch (e) {
    return { error: "Lỗi backend: " + e.toString() };
  } finally {
    lock.releaseLock();
  }
}

// Thêm buổi học mới và nhận xét
function themBuoiHoc(studentPhone, studentName, tuan, ngayDay, monHoc, noiDung, danhGiaBTVN, diemDauGio, diemDinhKi, trangThai) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetDG = ss.getSheetByName('Bảng đánh giá học tập ');
    if (!sheetDG) return { error: "Không tìm thấy sheet 'Bảng đánh giá học tập '" };
    
    // Sử dụng cached display values để kiểm tra
    var dataDG = sheetDG.getDataRange().getDisplayValues();
    var studentRows = [];
    
    for (var i = 1; i < dataDG.length; i++) {
      if (String(dataDG[i][1]).trim() === String(studentName).trim()) {
        studentRows.push(i);
      }
    }
    
    if (studentRows.length === 0) {
      sheetDG.appendRow(["", "", "", "", "", "", "", "", "", "", "", ""]);
      var spacerRow = sheetDG.getLastRow();
      sheetDG.getRange(spacerRow, 1, 1, 12).setFontFamily("Arial");
      
      for (var k = 0; k < 15; k++) {
        sheetDG.appendRow(["", studentName, "", "", "", "", "", "", "", "", "", ""]);
        var newDGRow = sheetDG.getLastRow();
        sheetDG.getRange(newDGRow, 1, 1, 12).setFontFamily("Arial");
      }
      dataDG = sheetDG.getDataRange().getDisplayValues();
      studentRows = [];
      for (var i = 1; i < dataDG.length; i++) {
        if (String(dataDG[i][1]).trim() === String(studentName).trim()) {
          studentRows.push(i);
        }
      }
    }
    
    var targetRowIndex = -1;
    for (var idx = 0; idx < studentRows.length; idx++) {
      var rIdx = studentRows[idx];
      if (String(dataDG[rIdx][0]).trim() === "") {
        targetRowIndex = rIdx + 1;
        break;
      }
    }
    
    if (targetRowIndex === -1) {
      var lastRowOfPartition = studentRows[studentRows.length - 1] + 1;
      sheetDG.insertRowsAfter(lastRowOfPartition, 15);
      for (var d = 1; d <= 15; d++) {
        sheetDG.getRange(lastRowOfPartition + d, 2).setValue(studentName).setFontFamily("Arial");
      }
      targetRowIndex = lastRowOfPartition + 1;
    }
    
    sheetDG.getRange(targetRowIndex, 1).setValue("'" + studentPhone);
    sheetDG.getRange(targetRowIndex, 3).setValue(tuan);
    sheetDG.getRange(targetRowIndex, 4).setValue(ngayDay);
    try {
      sheetDG.getRange(targetRowIndex, 5).setValue(monHoc);
    } catch (e) {
      if (monHoc === "Vật lý") {
        sheetDG.getRange(targetRowIndex, 5).setValue("Vật Lý");
      } else {
        throw e;
      }
    }
    sheetDG.getRange(targetRowIndex, 6).setValue(noiDung);
    sheetDG.getRange(targetRowIndex, 7).setValue(danhGiaBTVN);
    sheetDG.getRange(targetRowIndex, 8).setValue(diemDauGio);
    sheetDG.getRange(targetRowIndex, 9).setValue(diemDinhKi);
    sheetDG.getRange(targetRowIndex, 10).setValue(trangThai);
    sheetDG.getRange(targetRowIndex, 11).setValue("");
    sheetDG.getRange(targetRowIndex, 12).setValue("");
    
    sheetDG.getRange(targetRowIndex, 1, 1, 12).setFontFamily("Arial");
    
    // Clear caches
    clearSheetCache('Bảng đánh giá học tập ');
    clearCachesForStudent(studentPhone, typeof studentName !== "undefined" ? studentName : null);
    
    return { success: true };
  } catch (e) {
    return { error: "Lỗi backend: " + e.toString() };
  }
}

// Sửa nhật ký buổi học
function suaBuoiHoc(rowIndex, tuan, ngayDay, monHoc, noiDung, danhGiaBTVN, diemDauGio, diemDinhKi, trangThai) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetDG = ss.getSheetByName('Bảng đánh giá học tập ');
    if (!sheetDG) return { error: "Không tìm thấy sheet 'Bảng đánh giá học tập '" };
    
    var r = parseInt(rowIndex);
    if (isNaN(r) || r < 2 || r > sheetDG.getLastRow()) {
      return { error: "Vị trí dòng cập nhật không hợp lệ." };
    }
    
    // Đọc SĐT học sinh từ dòng trước khi ghi đè để dọn dẹp cache
    var studentPhone = sheetDG.getRange(r, 1).getDisplayValue();
    var studentName = sheetDG.getRange(r, 2).getDisplayValue();
    
    sheetDG.getRange(r, 3).setValue(tuan);
    sheetDG.getRange(r, 4).setValue(ngayDay);
    try {
      sheetDG.getRange(r, 5).setValue(monHoc);
    } catch (e) {
      if (monHoc === "Vật lý") {
        sheetDG.getRange(r, 5).setValue("Vật Lý");
      } else {
        throw e;
      }
    }
    sheetDG.getRange(r, 6).setValue(noiDung);
    sheetDG.getRange(r, 7).setValue(danhGiaBTVN);
    sheetDG.getRange(r, 8).setValue(diemDauGio);
    sheetDG.getRange(r, 9).setValue(diemDinhKi);
    sheetDG.getRange(r, 10).setValue(trangThai);
    
    sheetDG.getRange(r, 1, 1, 12).setFontFamily("Arial");
    
    // Clear caches
    clearSheetCache('Bảng đánh giá học tập ');
    clearCachesForStudent(studentPhone, typeof studentName !== "undefined" ? studentName : null);
    
    return { success: true };
  } catch (e) {
    return { error: "Lỗi backend: " + e.toString() };
  }
}

// Cập nhật lịch học (Thời khóa biểu)
function capNhatThoiKhoaBieu(tutorPhone, studentName, mon, tue, wed, thu, fri, sat, sun) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetLH = ss.getSheetByName('Lịch học');
    if (!sheetLH) return { error: "Không tìm thấy sheet 'Lịch học'" };
    
    var dataLH = sheetLH.getDataRange().getDisplayValues();
    var rowIndex = -1;
    for (var i = 1; i < dataLH.length; i++) {
      if (String(dataLH[i][0]).trim() === String(tutorPhone).trim() && 
          String(dataLH[i][1]).trim() === String(studentName).trim()) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex !== -1) {
      sheetLH.getRange(rowIndex, 4).setValue(mon).setFontFamily("Arial");
      sheetLH.getRange(rowIndex, 5).setValue(tue).setFontFamily("Arial");
      sheetLH.getRange(rowIndex, 6).setValue(wed).setFontFamily("Arial");
      sheetLH.getRange(rowIndex, 7).setValue(thu).setFontFamily("Arial");
      sheetLH.getRange(rowIndex, 8).setValue(fri).setFontFamily("Arial");
      sheetLH.getRange(rowIndex, 9).setValue(sat).setFontFamily("Arial");
      sheetLH.getRange(rowIndex, 10).setValue(sun).setFontFamily("Arial");
    } else {
      var tutorName = "";
      var sheetGS = ss.getSheetByName('Mã gia sư');
      if (sheetGS) {
        var dataGS = getSheetDisplayValuesCached('Mã gia sư');
        for (var j = 1; j < dataGS.length; j++) {
          if (String(dataGS[j][2]).trim() === String(tutorPhone).trim()) {
            tutorName = dataGS[j][1];
            break;
          }
        }
      }
      sheetLH.appendRow(["'" + tutorPhone, studentName, tutorName, mon, tue, wed, thu, fri, sat, sun]);
      var lastRow = sheetLH.getLastRow();
      sheetLH.getRange(lastRow, 1, 1, 10).setFontFamily("Arial");
    }
    
    // Clear caches
    clearSheetCache('Lịch học');
    clearTutorCache(tutorPhone);
    
    return { success: true };
  } catch (e) {
    return { error: "Lỗi backend: " + e.toString() };
  }
}

// Tự động dọn dẹp các học sinh đã xóa tạm thời quá 10 ngày
function clearOldDeletedStudents(sheetHS) {
  try {
    var data = sheetHS.getDataRange().getValues();
    var now = new Date();
    var cacheCleared = false;
    // Vòng lặp ngược để xóa dòng an toàn
    for (var i = data.length - 1; i >= 1; i--) {
      var deletedDateStr = (data[i].length > 8) ? data[i][8] : "";
      if (deletedDateStr) {
        var parts = String(deletedDateStr).split(" ");
        if (parts.length >= 1) {
          var dateParts = parts[0].split("/");
          if (dateParts.length === 3) {
            var dd = parseInt(dateParts[0]);
            var mm = parseInt(dateParts[1]) - 1;
            var yyyy = parseInt(dateParts[2]);
            
            var hh = 0, min = 0, ss = 0;
            if (parts.length >= 2) {
              var timeParts = parts[1].split(":");
              if (timeParts.length >= 3) {
                hh = parseInt(timeParts[0]);
                min = parseInt(timeParts[1]);
                ss = parseInt(timeParts[2]);
              }
            }
            
            var deletedDate = new Date(yyyy, mm, dd, hh, min, ss);
            if (!isNaN(deletedDate.getTime())) {
              var diffTime = now.getTime() - deletedDate.getTime();
              var diffDays = diffTime / (1000 * 3600 * 24);
              if (diffDays > 10) {
                var ss = SpreadsheetApp.getActiveSpreadsheet();
                writeTrashLog(ss, "Học sinh", "Xóa vĩnh viễn do hết hạn", data[i]);
                sheetHS.deleteRow(i + 1);
                
                var studentPhone = data[i][3];
                clearStudentCache(studentPhone);
                cacheCleared = true;
              }
            }
          }
        }
      }
    }
    if (cacheCleared) {
      clearSheetCache('Mã học sinh');
    }
  } catch (err) {
    Logger.log("Lỗi dọn dẹp học sinh hết hạn: " + err.toString());
  }
}

// Xóa học sinh tạm thời
function xoaHocSinhTamThoi(tutorPhone, studentPhone) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetHS = ss.getSheetByName('Mã học sinh');
    if (!sheetHS) return { error: "Không tìm thấy sheet 'Mã học sinh'" };
    
    var dataHS = sheetHS.getDataRange().getDisplayValues();
    var rowIndex = -1;
    var normStudentPhone = normalizePhone(studentPhone);
    var normTutorPhone = normalizePhone(tutorPhone);
    
    var targetRowData = null;
    for (var i = 1; i < dataHS.length; i++) {
      if (normalizePhone(dataHS[i][3]) === normStudentPhone && 
          normalizePhone(dataHS[i][6]) === normTutorPhone) {
        rowIndex = i + 1;
        targetRowData = dataHS[i];
        break;
      }
    }
    
    if (rowIndex === -1) return { error: "Không tìm thấy học sinh cần xóa." };
    
    var now = new Date();
    var dateString = Utilities.formatDate(now, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
    sheetHS.getRange(rowIndex, 9).setValue(dateString).setFontFamily("Arial");
    writeTrashLog(ss, "Học sinh", "Xóa tạm thời", targetRowData);
    
    // Clear caches
    clearSheetCache('Mã học sinh');
    clearCachesForStudent(studentPhone, typeof studentName !== "undefined" ? studentName : null);
    
    return { success: true };
  } catch (e) {
    return { error: "Lỗi backend: " + e.toString() };
  }
}

// Khôi phục học sinh từ thùng rác
function khoiPhucHocSinh(tutorPhone, studentPhone) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetHS = ss.getSheetByName('Mã học sinh');
    if (!sheetHS) return { error: "Không tìm thấy sheet 'Mã học sinh'" };
    
    var dataHS = sheetHS.getDataRange().getDisplayValues();
    var rowIndex = -1;
    var normStudentPhone = normalizePhone(studentPhone);
    var normTutorPhone = normalizePhone(tutorPhone);
    
    var targetRowData = null;
    for (var i = 1; i < dataHS.length; i++) {
      if (normalizePhone(dataHS[i][3]) === normStudentPhone && 
          normalizePhone(dataHS[i][6]) === normTutorPhone) {
        rowIndex = i + 1;
        targetRowData = dataHS[i];
        break;
      }
    }
    
    if (rowIndex === -1) return { error: "Không tìm thấy học sinh để khôi phục." };
    
    sheetHS.getRange(rowIndex, 9).setValue("").setFontFamily("Arial");
    writeTrashLog(ss, "Học sinh", "Khôi phục", targetRowData);
    
    // Clear caches
    clearSheetCache('Mã học sinh');
    clearCachesForStudent(studentPhone, typeof studentName !== "undefined" ? studentName : null);
    
    return { success: true };
  } catch (e) {
    return { error: "Lỗi backend: " + e.toString() };
  }
}

// Xóa hoàn toàn một buổi học
function xoaBuoiHoc(rowIndex) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetDG = ss.getSheetByName('Bảng đánh giá học tập ');
    if (!sheetDG) return { error: "Không tìm thấy sheet 'Bảng đánh giá học tập '" };
    
    var r = parseInt(rowIndex);
    if (isNaN(r) || r < 2 || r > sheetDG.getLastRow()) {
      return { error: "Vị trí dòng cần xóa không hợp lệ." };
    }
    
    var studentPhone = sheetDG.getRange(r, 1).getDisplayValue();
    var studentName = sheetDG.getRange(r, 2).getDisplayValue();
    
    // Xóa toàn bộ dữ liệu từ cột 1 đến cột 12 (tránh để sót cột Tên học sinh khiến logic tự động lấy bị nhầm)
    sheetDG.getRange(r, 1, 1, 12).setValue(""); 
    sheetDG.getRange(r, 1, 1, 12).setFontFamily("Arial");
    
    // Clear caches
    clearSheetCache('Bảng đánh giá học tập ');
    clearCachesForStudent(studentPhone, typeof studentName !== "undefined" ? studentName : null);
    
    return { success: true };
  } catch (e) {
    return { error: "Lỗi backend: " + e.toString() };
  } finally {
    lock.releaseLock();
  }
}

// Xác nhận đóng học phí cho các buổi học được chọn
function capNhatDongHocPhiBuoiHoc(rowIndices) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetDG = ss.getSheetByName('Bảng đánh giá học tập ');
    if (!sheetDG) return { error: "Không tìm thấy Bảng đánh giá học tập" };
    
    var clearedPhones = {};
    rowIndices.forEach(function(r) {
      var rowIndex = parseInt(r);
      if (!isNaN(rowIndex) && rowIndex >= 2 && rowIndex <= sheetDG.getLastRow()) {
        sheetDG.getRange(rowIndex, 11).setValue("Đã đóng");
        
        var phone = sheetDG.getRange(rowIndex, 1).getDisplayValue();
        if (phone && !clearedPhones[phone]) {
          clearedPhones[phone] = true;
        }
      }
    });
    
    // Clear caches
    clearSheetCache('Bảng đánh giá học tập ');
    for (var phone in clearedPhones) {
      clearCachesForStudent(phone, null);
    }
    
    return { success: true };
  } catch (e) {
    return { error: "Lỗi backend: " + e.toString() };
  } finally {
    lock.releaseLock();
  }
}

// Cập nhật trạng thái đóng học phí hàng loạt
function capNhatNhieuDongHocPhi(paidRowIndices, unpaidRowIndices) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetDG = ss.getSheetByName('Bảng đánh giá học tập ');
    if (!sheetDG) return { error: "Không tìm thấy sheet 'Bảng đánh giá học tập '" };
    
    // 1. Cập nhật "Đã đóng"
    for (var i = 0; i < paidRowIndices.length; i++) {
      var r = parseInt(paidRowIndices[i]);
      if (!isNaN(r) && r >= 2) {
        sheetDG.getRange(r, 11).setValue("Đã đóng");
      }
    }
    
    // 2. Cập nhật "" (Chưa đóng/Hủy đóng)
    for (var i = 0; i < unpaidRowIndices.length; i++) {
      var r = parseInt(unpaidRowIndices[i]);
      if (!isNaN(r) && r >= 2) {
        sheetDG.getRange(r, 11).setValue("");
        sheetDG.getRange(r, 11).clearContent();
      }
    }
    
    // Định dạng phông chữ Arial cho tất cả dòng bị ảnh hưởng và tìm các số điện thoại để xóa cache
    var allRows = paidRowIndices.concat(unpaidRowIndices);
    var clearedPhones = {};
    for (var i = 0; i < allRows.length; i++) {
      var r = parseInt(allRows[i]);
      if (!isNaN(r) && r >= 2) {
        sheetDG.getRange(r, 1, 1, 12).setFontFamily("Arial");
        
        var phone = sheetDG.getRange(r, 1).getDisplayValue();
        if (phone && !clearedPhones[phone]) {
          clearedPhones[phone] = true;
        }
      }
    }
    
    SpreadsheetApp.flush();
    
    // Clear caches
    clearSheetCache('Bảng đánh giá học tập ');
    for (var phone in clearedPhones) {
      clearCachesForStudent(phone, null);
    }
    
    return { success: true };
  } catch (e) {
    return { error: "Lỗi backend: " + e.toString() };
  } finally {
    lock.releaseLock();
  }
}

// Lưu file bài tập của Gia sư lên Drive
function saveTutorFileToDrive(studentName, title, fileBase64, fileName, mimeType) {
  var parentFolderId = "1-B1us7HYEGodr4Rb4ePRrQ25lm-0Sqq1";
  var parentFolder;
  var driveApp = DriveApp;
  
  try {
    parentFolder = driveApp.getFolderById(parentFolderId);
  } catch (err) {
    throw new Error("Không thể truy cập thư mục Drive của Gia sư (ID: " + parentFolderId + "). Lỗi: " + err.toString() + ". Vui lòng cấp quyền chỉnh sửa.");
  }
  
  var studentFolders = parentFolder.getFoldersByName(studentName);
  var studentFolder;
  if (studentFolders.hasNext()) {
    studentFolder = studentFolders.next();
  } else {
    studentFolder = parentFolder.createFolder(studentName);
  }
  
  var fileData = Utilities.base64Decode(fileBase64);
  var ext = "";
  var lastDot = fileName.lastIndexOf(".");
  if (lastDot !== -1) {
    ext = fileName.substring(lastDot);
  }
  
  var now = new Date();
  var dateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), "dd-MM-yyyy");
  var newFileName = "[Gia sư giao] " + studentName + " - " + title + " - " + dateStr + ext;
  
  var blob = Utilities.newBlob(fileData, mimeType, newFileName);
  var file = studentFolder.createFile(blob);
  
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {
    Logger.log("Không thể chia sẻ file gia sư giao: " + e.toString());
  }
  
  return file.getUrl();
}

// Dọn dẹp thùng rác bài tập giao (quá 24 giờ)
function cleanTrashHw(sheet) {
  var data = sheet.getDataRange().getValues();
  var now = new Date().getTime();
  var oneDayMs = 24 * 60 * 60 * 1000;
  var rowDeleted = false;
  
  for (var i = data.length - 1; i >= 1; i--) {
    var status = data[i][6];
    var deletedTimeStr = data[i][7];
    
    if (status === "Deleted" && deletedTimeStr) {
      var deletedTime = new Date(deletedTimeStr).getTime();
      if (!isNaN(deletedTime) && (now - deletedTime) > oneDayMs) {
        var fileUrl = data[i][4];
        if (fileUrl) {
          var fileId = extractFileIdFromUrl(fileUrl);
          if (fileId) {
            try {
              DriveApp.getFileById(fileId).setTrashed(true);
            } catch (e) {
              Logger.log("Lỗi dọn dẹp Drive file bài tập giao: " + e.toString());
            }
          }
        }
        sheet.deleteRow(i + 1);
        rowDeleted = true;
      }
    }
  }
  if (rowDeleted) {
    clearSheetCache('Bài tập giao');
  }
}

// Lấy danh sách bài tập đã giao
function getAssignedHomework(studentName, tutorPhone) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = initAssignedHwSheet(ss);
    
    cleanTrashHw(sheet);
    
    var data = getSheetDisplayValuesCached('Bài tập giao');
    var activeList = [];
    var trashList = [];
    var normTutorPhone = normalizePhone(tutorPhone);
    
    for (var i = 1; i < data.length; i++) {
      var matchStudent = (String(data[i][1]).trim().toLowerCase() === String(studentName).trim().toLowerCase());
      var matchTutor = (normalizePhone(data[i][8]) === normTutorPhone);
      
      if (matchStudent && matchTutor) {
        var item = {
          rowIndex: i + 1,
          timestamp: data[i][0],
          studentName: data[i][1],
          title: data[i][2],
          releaseDate: data[i][3],
          fileUrl: data[i][4],
          maBaiTap: data[i][5],
          status: data[i][6],
          deletedTime: data[i][7],
          externalLink: data[i].length > 9 ? data[i][9] : ""
        };
        
        if (item.status === "Active") {
          activeList.push(item);
        } else if (item.status === "Deleted") {
          trashList.push(item);
        }
      }
    }
    
    return { activeList: activeList, trashList: trashList };
  } catch (e) {
    return { error: "Lỗi hệ thống: " + e.toString() };
  }
}

// Tải bài tập giao lên
function uploadAssignedHomework(tutorPhone, studentName, title, releaseDate, fileBase64, fileName, mimeType, maBaiTap, externalLink) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = initAssignedHwSheet(ss);
    
    var fileUrl = "";
    if (fileBase64 && fileName) {
      fileUrl = saveTutorFileToDrive(studentName, title, fileBase64, fileName, mimeType);
    }
    
    var now = new Date();
    var dateString = Utilities.formatDate(now, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
    
    if (!releaseDate) {
      releaseDate = Utilities.formatDate(now, Session.getScriptTimeZone(), "dd/MM/yyyy");
    }
    
    sheet.appendRow([
      dateString,
      studentName,
      title,
      releaseDate,
      fileUrl,
      maBaiTap.toUpperCase(),
      "Active",
      "",
      "'" + tutorPhone,
      externalLink || ""
    ]);
    
    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1, 1, 10).setFontFamily("Arial");
    
    // Clear caches
    clearSheetCache('Bài tập giao');
    clearHomeworkPortalCache(maBaiTap);
    
    return { success: true, rowIndex: lastRow, fileUrl: fileUrl };
  } catch (e) {
    return { error: "Lỗi hệ thống: " + e.toString() };
  }
}

// Chỉnh sửa bài tập đã giao
function editAssignedHomework(rowIndex, title, releaseDate, fileBase64, fileName, mimeType, externalLink) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = initAssignedHwSheet(ss);
    var r = parseInt(rowIndex);
    
    var data = getSheetDisplayValuesCached('Bài tập giao');
    if (isNaN(r) || r < 2 || r > data.length) {
      return { error: "Vị trí dòng không hợp lệ." };
    }
    
    var studentName = data[r - 1][1];
    var maBaiTap = data[r - 1][5];
    
    sheet.getRange(r, 3).setValue(title);
    sheet.getRange(r, 4).setValue(releaseDate);
    sheet.getRange(r, 10).setValue(externalLink || "");
    
    var fileUrl = data[r - 1][4];
    if (fileBase64 && fileName) {
      fileUrl = saveTutorFileToDrive(studentName, title, fileBase64, fileName, mimeType);
      sheet.getRange(r, 5).setValue(fileUrl);
    }
    
    sheet.getRange(r, 7).setValue("Active");
    sheet.getRange(r, 8).setValue("");
    
    // Clear caches
    clearSheetCache('Bài tập giao');
    clearHomeworkPortalCache(maBaiTap);
    
    return { success: true, fileUrl: fileUrl };
  } catch (e) {
    return { error: "Lỗi hệ thống: " + e.toString() };
  }
}

// Xóa bài tập đã giao (chuyển vào thùng rác)
function deleteAssignedHomework(rowIndex) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = initAssignedHwSheet(ss);
    var r = parseInt(rowIndex);
    
    var data = getSheetDisplayValuesCached('Bài tập giao');
    if (isNaN(r) || r < 2 || r > data.length) {
      return { error: "Vị trí dòng không hợp lệ." };
    }
    
    var maBaiTap = data[r - 1][5];
    var now = new Date();
    var dateString = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
    
    sheet.getRange(r, 7).setValue("Deleted");
    sheet.getRange(r, 8).setValue(dateString);
    
    // Clear caches
    clearSheetCache('Bài tập giao');
    clearHomeworkPortalCache(maBaiTap);
    
    return { success: true };
  } catch (e) {
    return { error: "Lỗi hệ thống: " + e.toString() };
  }
}

// Khôi phục bài tập giao
function restoreAssignedHomework(rowIndex) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = initAssignedHwSheet(ss);
    var r = parseInt(rowIndex);
    
    var data = getSheetDisplayValuesCached('Bài tập giao');
    if (isNaN(r) || r < 2 || r > data.length) {
      return { error: "Vị trí dòng không hợp lệ." };
    }
    
    var maBaiTap = data[r - 1][5];
    sheet.getRange(r, 7).setValue("Active");
    sheet.getRange(r, 8).setValue("");
    
    // Clear caches
    clearSheetCache('Bài tập giao');
    clearHomeworkPortalCache(maBaiTap);
    
    return { success: true };
  } catch (e) {
    return { error: "Lỗi hệ thống: " + e.toString() };
  }
}

// Gia sư lấy danh sách bài tập đã nộp
function getStudentSubmissionsForTutor(maBaiTap) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetHW = initHomeworkSheet(ss);
    var dataHW = getSheetDisplayValuesCached('Bài tập');
    var submissions = [];
    
    var cleanMa = String(maBaiTap).trim().toUpperCase();
    if (cleanMa === "") {
      return { submissions: [] };
    }
    
    var hwHeaders = getHeaderIndices(sheetHW);
    var colMa = hwHeaders["Mã bài tập"] !== undefined ? hwHeaders["Mã bài tập"] : 4;
    var colStatus = hwHeaders["Trạng thái nộp"] !== undefined ? hwHeaders["Trạng thái nộp"] : 6;
    var colTime = hwHeaders["Thời gian nộp"] !== undefined ? hwHeaders["Thời gian nộp"] : 0;
    var colLesson = hwHeaders["Tên bài học"] !== undefined ? hwHeaders["Tên bài học"] : 2;
    var colUrl = hwHeaders["Link Google Drive liên kết"] !== undefined ? hwHeaders["Link Google Drive liên kết"] : 3;
    
    for (var i = 1; i < dataHW.length; i++) {
      if (dataHW[i].length > colMa && normalizeMa(dataHW[i][colMa]) === normalizeMa(cleanMa)) {
        var statusStr = (dataHW[i].length > colStatus) ? dataHW[i][colStatus] : "Active";
        if (statusStr === "Active") {
          submissions.push({
            timestamp: dataHW[i][colTime] || "",
            lessonName: dataHW[i][colLesson] || "",
            fileUrl: dataHW[i][colUrl] || ""
          });
        }
      }
    }
    
    submissions.reverse();
    
    return { submissions: submissions };
  } catch (e) {
    return { error: "Lỗi hệ thống: " + e.toString() };
  }
}

// Lấy phản hồi từ phụ huynh cho gia sư
function getTutorFeedback(tutorPhone) {
  var normTutorPhone = normalizePhone(tutorPhone);
  var cache = CacheService.getScriptCache();
  var cacheKey = "tutor_feedback_" + normTutorPhone;
  var cached = cache.get(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch(e) {
      Logger.log("Lỗi parse cache feedback: " + e.toString());
    }
  }

  try {
    var cacheTemp = CacheService.getScriptCache();
    var lastClean = cacheTemp.get("lastFeedbackClean");
    if (!lastClean) {
      cleanupOldFeedback();
      cacheTemp.put("lastFeedbackClean", "done", 12 * 60 * 60);
    }
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    var sheetHS = ss.getSheetByName('Mã học sinh');
    var studentPhones = [];
    if (sheetHS) {
      var dataHS = getSheetDisplayValuesCached('Mã học sinh');
      for (var i = 1; i < dataHS.length; i++) {
        if (normalizePhone(dataHS[i][6]) === normTutorPhone) {
          studentPhones.push(normalizePhone(dataHS[i][3]));
        }
      }
    }
    
    var sheetFeedback = ss.getSheetByName('Ý kiến phụ huynh');
    var feedbacks = [];
    if (sheetFeedback) {
      cleanupOldFeedback(sheetFeedback, 0);
      var dataFB = sheetFeedback.getDataRange().getDisplayValues(); // Phản hồi không cache nguyên sheet vì ít dòng nhưng cần lấy real-time
      for (var j = dataFB.length - 1; j >= 1; j--) {
        var studentPhone = normalizePhone(dataFB[j][1]);
        if (studentPhones.indexOf(studentPhone) !== -1) {
          feedbacks.push({
            timestamp: dataFB[j][0],
            studentPhone: dataFB[j][1],
            studentName: dataFB[j][2],
            content: dataFB[j][3]
          });
        }
      }
    }
    
    var result = { success: true, feedbacks: feedbacks };
    try {
      cache.put(cacheKey, JSON.stringify(result), 600);
    } catch(e) {
      Logger.log("Lỗi ghi cache feedback: " + e.toString());
    }
    
    return result;
  } catch (e) {
    return { error: "Lỗi backend: " + e.toString() };
  }
}

// Dọn dẹp ý kiến phụ huynh gửi quá 10 ngày trước (chuyển vào Thùng rác và xóa khỏi sheet)
function cleanupOldFeedback() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Ý kiến phụ huynh');
    if (!sheet) return;
    
    var data = sheet.getDataRange().getDisplayValues();
    if (data.length <= 1) return;
    
    var now = new Date();
    var tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    
    // Quét ngược từ dưới lên để xóa an toàn
    for (var i = data.length - 1; i >= 1; i--) {
      var timeStr = data[i][0];
      if (!timeStr) continue;
      
      var dateVal = parseAppScriptDate(timeStr);
      if (dateVal && dateVal < tenDaysAgo) {
        // Ghi nhật ký vào Thùng rác
        writeTrashLog(ss, "Ý kiến phụ huynh", "Tự động xóa (quá 10 ngày)", data[i]);
        // Xóa dòng
        sheet.deleteRow(i + 1);
      }
    }
  } catch (e) {
    Logger.log("Lỗi dọn dẹp ý kiến phụ huynh: " + e.toString());
  }
}

// Lấy tên Phụ huynh theo SĐT Học sinh
function getStudentParentName(phone) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Mã học sinh');
    if (!sheet) return "";
    var data = sheet.getDataRange().getDisplayValues();
    var normP = normalizePhone(phone);
    for (var i = 1; i < data.length; i++) {
      if (normalizePhone(data[i][3]) === normP) {
        return String(data[i][1] || "").trim();
      }
    }
  } catch(e) {}
  return "";
}
