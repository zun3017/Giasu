// Tải toàn bộ dữ liệu báo cáo và quản trị cho trang Admin
function getAdminDashboardData() {
  var cache = CacheService.getScriptCache();
  var cacheKey = "admin_dashboard_data";
  var cached = cache.get(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch(e) {
      Logger.log("Lỗi parse cache admin: " + e.toString());
    }
  }
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    initAdminSheet(ss);
    
    var data = {
      tutors: [],
      students: [],
      deletedTutors: [],
      incomeReports: {},
      marqueeAnnouncement: PropertiesService.getScriptProperties().getProperty('marquee_announcement') || ""
    };
    
    // 1. Tải toàn bộ gia sư
    var sheetGS = ss.getSheetByName('Mã gia sư');
    var tutorMap = {};
    if (sheetGS) {
      clearOldDeletedTutors(sheetGS);
      var dataGS = getSheetDisplayValuesCached('Mã gia sư');
      var todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy");
      var sheetUpdated = false;
      
      for (var i = 1; i < dataGS.length; i++) {
        var tPhone = dataGS[i][2].trim();
        var tName = dataGS[i][1];
        var tPin = dataGS[i][3];
        var tQrUrl = (dataGS[i].length > 4) ? dataGS[i][4].trim() : "";
        var tDelDate = (dataGS[i].length > 5) ? dataGS[i][5].trim() : "";
        var tCreatedDate = (dataGS[i].length > 6) ? dataGS[i][6].trim() : "";
        var tNextBillingDate = (dataGS[i].length > 7) ? dataGS[i][7].trim() : "";
        var tLastActive = (dataGS[i].length > 8) ? dataGS[i][8].trim() : "";
        
        if (tCreatedDate === "") {
          tCreatedDate = todayStr;
          sheetGS.getRange(i + 1, 7).setValue("'" + tCreatedDate);
          sheetUpdated = true;
        }
        if (tNextBillingDate === "") {
          tNextBillingDate = addOneMonthToDateString(tCreatedDate);
          sheetGS.getRange(i + 1, 8).setValue("'" + tNextBillingDate);
          sheetUpdated = true;
        }
        
        var tStatus = (dataGS[i].length > 9) ? dataGS[i][9].trim() : "";
        var tAccountType = (dataGS[i].length > 10 && dataGS[i][10].trim() !== "") ? dataGS[i][10].trim() : "Cả hai";
        
        if (tDelDate === "") {
          data.tutors.push({
            name: tName,
            phone: tPhone,
            pin: tPin,
            qrUrl: tQrUrl,
            createdDate: tCreatedDate,
            nextBillingDate: tNextBillingDate,
            lastActive: tLastActive,
            status: tStatus,
            accountType: tAccountType
          });
          tutorMap[normalizePhone(tPhone)] = tName;
        } else {
          data.deletedTutors.push({
            name: tName,
            phone: tPhone,
            deletedDate: tDelDate,
            qrUrl: tQrUrl,
            createdDate: tCreatedDate,
            nextBillingDate: tNextBillingDate,
            lastActive: tLastActive,
            status: tStatus
          });
        }
      }
      if (sheetUpdated) {
        clearSheetCache('Mã gia sư');
      }
    }
    
    // 2. Tải toàn bộ học sinh
    var sheetHS = ss.getSheetByName('Mã học sinh');
    var studentMap = {};
    if (sheetHS) {
      var dataHS = getSheetDisplayValuesCached('Mã học sinh');
      for (var i = 1; i < dataHS.length; i++) {
        var s = {
          stt: dataHS[i][0],
          parentName: dataHS[i][1],
          name: dataHS[i][2],
          phone: dataHS[i][3],
          tuition: parseFloat(dataHS[i][5]) || 0,
          tutorPhone: dataHS[i][6],
          deletedDate: (dataHS[i].length > 8) ? dataHS[i][8] : ""
        };
        data.students.push(s);
        studentMap[normalizePhone(s.phone)] = s;
      }
    }
    
    // 3. Tính toán báo cáo học phí từ Bảng đánh giá
    var sheetDG = ss.getSheetByName('Bảng đánh giá học tập ');
    if (sheetDG) {
      var dataDG = getSheetDisplayValuesCached('Bảng đánh giá học tập ');
      var reports = {};
      
      for (var j = 1; j < dataDG.length; j++) {
        var phone = String(dataDG[j][0]).trim();
        var tuan = String(dataDG[j][2]).trim();
        var ngay = String(dataDG[j][3]).trim();
        var trangThai = String(dataDG[j][9]).trim();
        var tienDong = (dataDG[j].length > 10) ? String(dataDG[j][10]).trim() : "";
        
        if (phone && tuan !== "" && ngay !== "") {
          var sInfo = studentMap[normalizePhone(phone)];
          if (sInfo) {
            var tuitionFee = sInfo.tuition;
            var monthYear = parseMonthYearFromDateStr(ngay) || ("Tháng " + (new Date().getMonth() + 1) + "/" + new Date().getFullYear());
            
            if (!reports[monthYear]) {
              reports[monthYear] = { expected: 0, paid: 0, unpaid: 0, tutors: {} };
            }
            
            if (trangThai.toLowerCase().indexOf("hủy") !== -1 || trangThai.toLowerCase().indexOf("nghỉ") !== -1) {
              continue;
            }
            
            var tutorPhoneKey = sInfo.tutorPhone ? sInfo.tutorPhone.trim() : "";
            var tutorNameVal = tutorMap[normalizePhone(tutorPhoneKey)] || "Chưa gán gia sư";
            if (tutorPhoneKey === "") {
              tutorPhoneKey = "no_tutor";
            }
            
            if (!reports[monthYear].tutors[tutorPhoneKey]) {
              reports[monthYear].tutors[tutorPhoneKey] = { name: tutorNameVal, expected: 0, paid: 0, unpaid: 0 };
            }
            
            reports[monthYear].expected += tuitionFee;
            reports[monthYear].tutors[tutorPhoneKey].expected += tuitionFee;
            
            if (tienDong === "Đã đóng") {
              reports[monthYear].paid += tuitionFee;
              reports[monthYear].tutors[tutorPhoneKey].paid += tuitionFee;
            } else {
              reports[monthYear].unpaid += tuitionFee;
              reports[monthYear].tutors[tutorPhoneKey].unpaid += tuitionFee;
            }
          }
        }
      }
      data.incomeReports = reports;
    }
    
    // Lưu vào cache trong 10 phút
    try {
      cache.put(cacheKey, JSON.stringify(data), 600);
    } catch(e) {
      Logger.log("Lỗi ghi cache admin dash: " + e.toString());
    }
    
    return data;
  } catch (e) {
    return { error: "Lỗi hệ thống Admin: " + e.toString() };
  }
}

// Thêm học sinh mới kèm tự động cấp phát 15 dòng bên bảng đánh giá
function themHocSinhMoi(tutorPhone, phuHuynhName, studentName, studentPhone, tuition, maBaiTap, thongBao) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetHS = ss.getSheetByName('Mã học sinh');
    if (!sheetHS) return { error: "Không tìm thấy dữ liệu học sinh." };
    
    var dataHS = sheetHS.getDataRange().getDisplayValues(); // Sử dụng trực tiếp để đảm bảo kiểm tra trùng lặp thời gian thực
    for (var i = 1; i < dataHS.length; i++) {
      if (String(dataHS[i][3]).trim() === String(studentPhone).trim()) {
        return { error: "Số điện thoại phụ huynh này đã tồn tại trên hệ thống." };
      }
    }
    
    var cleanMa = String(maBaiTap || "").trim().toUpperCase();
    if (cleanMa !== "") {
      for (var i = 1; i < dataHS.length; i++) {
        if (dataHS[i].length > 7 && String(dataHS[i][7]).trim().toUpperCase() === cleanMa) {
          return { error: "Mã bài tập '" + cleanMa + "' này đã được cấp cho học sinh khác." };
        }
      }
    }
    
    var nextStt = 1;
    if (dataHS.length > 1) {
      var lastStt = parseInt(dataHS[dataHS.length - 1][0]);
      if (!isNaN(lastStt)) nextStt = lastStt + 1;
    }
    
    sheetHS.appendRow([nextStt, phuHuynhName, studentName, "'" + studentPhone, thongBao || "", tuition, "'" + tutorPhone, "'" + cleanMa]);
    var lastRowHS = sheetHS.getLastRow();
    sheetHS.getRange(lastRowHS, 1, 1, 8).setFontFamily("Arial");
    
    var sheetDG = ss.getSheetByName('Bảng đánh giá học tập ');
    if (sheetDG) {
      sheetDG.appendRow(["", "", "", "", "", "", "", "", "", "", "", ""]);
      var lastRowDGSpacer = sheetDG.getLastRow();
      sheetDG.getRange(lastRowDGSpacer, 1, 1, 12).setFontFamily("Arial");
      
      for (var k = 0; k < 15; k++) {
        sheetDG.appendRow(["", studentName, "", "", "", "", "", "", "", "", "", ""]);
        var lastRowDGFill = sheetDG.getLastRow();
        sheetDG.getRange(lastRowDGFill, 1, 1, 12).setFontFamily("Arial");
      }
    }
    
    // Clear caches
    clearSheetCache('Mã học sinh');
    clearSheetCache('Bảng đánh giá học tập ');
    clearTutorCache(tutorPhone);
    
    return { success: true };
  } catch (e) {
    return { error: "Lỗi backend: " + e.toString() };
  }
}

// Sửa thông tin học sinh và đồng bộ sang các bảng liên quan
function suaThongTinHocSinh(oldPhone, phuHuynhName, studentName, studentPhone, tuition, maBaiTap, thongBao) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetHS = ss.getSheetByName('Mã học sinh');
    if (!sheetHS) return { error: "Không tìm thấy dữ liệu học sinh." };
    
    var dataHS = sheetHS.getDataRange().getDisplayValues();
    var rowIndex = -1;
    var normOldPhone = normalizePhone(oldPhone);
    var normStudentPhone = normalizePhone(studentPhone);
    
    for (var i = 1; i < dataHS.length; i++) {
      if (normalizePhone(dataHS[i][3]) === normOldPhone) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex === -1) return { error: "Không tìm thấy học sinh cần sửa." };
    
    if (normOldPhone !== normStudentPhone) {
      for (var i = 1; i < dataHS.length; i++) {
        if (normalizePhone(dataHS[i][3]) === normStudentPhone) {
          return { error: "Số điện thoại phụ huynh mới đã tồn tại trên hệ thống." };
        }
      }
    }
    
    var cleanMa = String(maBaiTap || "").trim().toUpperCase();
    if (cleanMa !== "") {
      for (var i = 1; i < dataHS.length; i++) {
        if (normalizePhone(dataHS[i][3]) !== normOldPhone && dataHS[i].length > 7 && String(dataHS[i][7]).trim().toUpperCase() === cleanMa) {
          return { error: "Mã bài tập '" + cleanMa + "' này đã được cấp cho học sinh khác." };
        }
      }
    }
    
    var oldName = dataHS[rowIndex-1][2];
    var oldMaHw = (dataHS[rowIndex-1].length > 7) ? String(dataHS[rowIndex-1][7]).trim().toUpperCase() : "";
    var isNameChanged = (oldName !== studentName);
    var isPhoneChanged = (normOldPhone !== normStudentPhone);
    var isMaHwChanged = (oldMaHw !== cleanMa);
    
    sheetHS.getRange(rowIndex, 2).setValue(phuHuynhName).setFontFamily("Arial");
    sheetHS.getRange(rowIndex, 3).setValue(studentName).setFontFamily("Arial");
    sheetHS.getRange(rowIndex, 4).setValue("'" + studentPhone).setFontFamily("Arial");
    sheetHS.getRange(rowIndex, 5).setValue(thongBao || "").setFontFamily("Arial");
    sheetHS.getRange(rowIndex, 6).setValue(tuition).setFontFamily("Arial");
    sheetHS.getRange(rowIndex, 8).setValue("'" + cleanMa).setFontFamily("Arial");
    
    if (isPhoneChanged || isNameChanged) {
      // 1. Đồng bộ sang Bảng đánh giá học tập
      var sheetDG = ss.getSheetByName('Bảng đánh giá học tập ');
      if (sheetDG) {
        var dataDG = sheetDG.getDataRange().getValues();
        for (var j = 1; j < dataDG.length; j++) {
          var matchPhone = (normalizePhone(dataDG[j][0]) === normOldPhone);
          var matchName = (String(dataDG[j][1]).trim() === String(oldName).trim());
          
          if (matchName) {
            if (isNameChanged) {
              sheetDG.getRange(j + 1, 2).setValue(studentName).setFontFamily("Arial");
            }
            if (isPhoneChanged && matchPhone) {
              sheetDG.getRange(j + 1, 1).setValue("'" + studentPhone).setFontFamily("Arial");
            }
          }
        }
        clearSheetCache('Bảng đánh giá học tập ');
      }
      
      // 2. Đồng bộ sang Bài kiểm tra
      var sheetBT = ss.getSheetByName('Bài kiểm tra');
      if (sheetBT) {
        var dataBT = sheetBT.getDataRange().getValues();
        for (var k = 1; k < dataBT.length; k++) {
          if (normalizePhone(dataBT[k][0]) === normOldPhone) {
            if (isPhoneChanged) sheetBT.getRange(k + 1, 1).setValue("'" + studentPhone).setFontFamily("Arial");
            if (isNameChanged) sheetBT.getRange(k + 1, 2).setValue(studentName).setFontFamily("Arial");
          }
        }
        clearSheetCache('Bài kiểm tra');
      }
      
      // 3. Đồng bộ sang Lịch học
      if (isNameChanged) {
        var sheetLH = ss.getSheetByName('Lịch học');
        if (sheetLH) {
          var dataLH = sheetLH.getDataRange().getValues();
          for (var m = 1; m < dataLH.length; m++) {
            if (String(dataLH[m][1]).trim() === String(oldName).trim()) {
              sheetLH.getRange(m + 1, 2).setValue(studentName).setFontFamily("Arial");
            }
          }
          clearSheetCache('Lịch học');
        }
      }
    }
    
    // Đồng bộ Mã bài tập mới sang sheet 'Bài tập'
    if (isMaHwChanged && oldMaHw !== "") {
      var sheetHW = ss.getSheetByName('Bài tập');
      if (sheetHW) {
        var dataHW = sheetHW.getDataRange().getValues();
        for (var n = 1; n < dataHW.length; n++) {
          if (dataHW[n].length > 4 && String(dataHW[n][4]).trim().toUpperCase() === oldMaHw) {
            sheetHW.getRange(n + 1, 5).setValue("'" + cleanMa).setFontFamily("Arial");
          }
        }
        clearSheetCache('Bài tập');
      }
    }
    
    // Clear caches
    clearSheetCache('Mã học sinh');
    clearCachesForStudent(oldPhone);
    if (isPhoneChanged) {
      clearCachesForStudent(studentPhone);
    }
    
    return { success: true };
  } catch (e) {
    return { error: "Lỗi backend: " + e.toString() };
  }
}

// Lưu thông tin gia sư (Thêm mới/Cập nhật) từ Admin
function adminLuuGiaSu(oldPhone, name, phone, pin, qrUrl, createdDate, nextBillingDate, accountType) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetGS = ss.getSheetByName('Mã gia sư');
    if (!sheetGS) return { error: "Không tìm thấy sheet 'Mã gia sư'" };
    
    var dataGS = sheetGS.getDataRange().getDisplayValues();
    var rowIndex = -1;
    
    if (String(oldPhone).trim() !== String(phone).trim()) {
      for (var i = 1; i < dataGS.length; i++) {
        if (String(dataGS[i][2]).trim() === String(phone).trim()) {
          return { error: "Số điện thoại gia sư này đã tồn tại." };
        }
      }
    }
    
    var todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy");
    var accTypeVal = accountType || "Cả hai";

    if (oldPhone) {
      for (var i = 1; i < dataGS.length; i++) {
        if (String(dataGS[i][2]).trim() === String(oldPhone).trim()) {
          rowIndex = i + 1;
          break;
        }
      }
      if (rowIndex !== -1) {
        sheetGS.getRange(rowIndex, 2).setValue(name);
        sheetGS.getRange(rowIndex, 3).setValue("'" + phone);
        sheetGS.getRange(rowIndex, 4).setValue("'" + pin);
        sheetGS.getRange(rowIndex, 5).setValue(qrUrl);
        if (createdDate) {
          sheetGS.getRange(rowIndex, 7).setValue("'" + createdDate);
        }
        if (nextBillingDate) {
          sheetGS.getRange(rowIndex, 8).setValue("'" + nextBillingDate);
        }
        sheetGS.getRange(rowIndex, 11).setValue("'" + accTypeVal);
      } else {
        return { error: "Không tìm thấy gia sư để cập nhật." };
      }
    } else {
      var nextStt = 1;
      if (dataGS.length > 1) {
        var lastStt = parseInt(dataGS[dataGS.length - 1][0]);
        if (!isNaN(lastStt)) nextStt = lastStt + 1;
      }
      var regDate = createdDate || todayStr;
      var billDate = nextBillingDate || addOneMonthToDateString(regDate);
      
      sheetGS.appendRow([nextStt, name, "'" + phone, "'" + pin, qrUrl, "", "'" + regDate, "'" + billDate, "", "", "'" + accTypeVal]);
      var lastRow = sheetGS.getLastRow();
      sheetGS.getRange(lastRow, 1, 1, 11).setFontFamily("Arial");
    }
    
    // Clear caches
    clearSheetCache('Mã gia sư');
    CacheService.getScriptCache().remove("admin_dashboard_data");
    if (oldPhone) clearTutorCache(oldPhone);
    clearTutorCache(phone);
    
    return { success: true };
  } catch (e) {
    return { error: "Lỗi backend: " + e.toString() };
  } finally {
    lock.releaseLock();
  }
}

// Xác nhận đóng tiền thuê web từ Gia sư và gia hạn chu kỳ đóng phí thêm 1 tháng
function adminXacNhanDongTienTutor(tutorPhone) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetGS = ss.getSheetByName('Mã gia sư');
    if (!sheetGS) return { error: "Không tìm thấy sheet 'Mã gia sư'" };
    
    var dataGS = sheetGS.getDataRange().getDisplayValues();
    var rowIndex = -1;
    
    for (var i = 1; i < dataGS.length; i++) {
      if (String(dataGS[i][2]).trim() === String(tutorPhone).trim()) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex === -1) return { error: "Không tìm thấy gia sư này trên hệ thống." };
    
    var currentBillDate = sheetGS.getRange(rowIndex, 8).getDisplayValue().trim();
    if (!currentBillDate) {
      currentBillDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy");
    }
    
    var newBillDate = addOneMonthToDateString(currentBillDate);
    sheetGS.getRange(rowIndex, 8).setValue("'" + newBillDate);
    
    // Clear caches
    clearSheetCache('Mã gia sư');
    clearTutorCache(tutorPhone);
    
    return { success: true, newBillingDate: newBillDate };
  } catch (e) {
    return { error: "Lỗi gia hạn chu kỳ đóng tiền: " + e.toString() };
  } finally {
    lock.releaseLock();
  }
}

// Lưu dòng chạy chữ thông báo từ Admin gửi cho tất cả các Gia sư
function adminLuuMarquee(text) {
  try {
    PropertiesService.getScriptProperties().setProperty('marquee_announcement', text || "");
    
    // Clear cache báo cáo admin và tất cả gia sư sẽ đọc giá trị này trực tiếp khi reset cache
    var cache = CacheService.getScriptCache();
    cache.remove("admin_dashboard_data");
    
    return { success: true };
  } catch (e) {
    return { error: "Lỗi lưu thông báo chạy chữ: " + e.toString() };
  }
}

// Lưu thông tin học sinh và phân bổ lớp từ Admin
function adminLuuHocSinh(oldPhone, phuHuynhName, studentName, studentPhone, tuition, tutorPhone) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetHS = ss.getSheetByName('Mã học sinh');
    if (!sheetHS) return { error: "Không tìm thấy sheet 'Mã học sinh'" };
    
    var dataHS = sheetHS.getDataRange().getDisplayValues();
    
    if (String(oldPhone).trim() !== String(studentPhone).trim()) {
      for (var i = 1; i < dataHS.length; i++) {
        if (String(dataHS[i][3]).trim() === String(studentPhone).trim()) {
          return { error: "Số điện thoại phụ huynh này đã tồn tại." };
        }
      }
    }
    
    var rowIndex = -1;
    if (oldPhone) {
      for (var i = 1; i < dataHS.length; i++) {
        if (String(dataHS[i][3]).trim() === String(oldPhone).trim()) {
          rowIndex = i + 1;
          break;
        }
      }
      if (rowIndex !== -1) {
        sheetHS.getRange(rowIndex, 2).setValue(phuHuynhName);
        sheetHS.getRange(rowIndex, 3).setValue(studentName);
        sheetHS.getRange(rowIndex, 4).setValue("'" + studentPhone);
        sheetHS.getRange(rowIndex, 6).setValue(tuition);
        sheetHS.getRange(rowIndex, 7).setValue("'" + tutorPhone);
        
        var oldName = dataHS[rowIndex - 1][2];
        if (String(oldName).trim() !== String(studentName).trim()) {
          var sheetDG = ss.getSheetByName('Bảng đánh giá học tập ');
          if (sheetDG) {
            var dataDG = sheetDG.getDataRange().getDisplayValues();
            for (var k = 1; k < dataDG.length; k++) {
              if (String(dataDG[k][0]).trim() === String(oldPhone).trim() || 
                  String(dataDG[k][1]).trim() === String(oldName).trim()) {
                sheetDG.getRange(k + 1, 2).setValue(studentName);
              }
            }
            clearSheetCache('Bảng đánh giá học tập ');
          }
        }
      } else {
        return { error: "Không tìm thấy học sinh để cập nhật." };
      }
    } else {
      var nextStt = 1;
      if (dataHS.length > 1) {
        var lastStt = parseInt(dataHS[dataHS.length - 1][0]);
        if (!isNaN(lastStt)) nextStt = lastStt + 1;
      }
      sheetHS.appendRow([nextStt, phuHuynhName, studentName, "'" + studentPhone, "", tuition, "'" + tutorPhone]);
      var lastRowHS = sheetHS.getLastRow();
      sheetHS.getRange(lastRowHS, 1, 1, 7).setFontFamily("Arial");
      
      var sheetDG = ss.getSheetByName('Bảng đánh giá học tập ');
      if (sheetDG) {
        sheetDG.appendRow(["", "", "", "", "", "", "", "", "", "", "", ""]);
        var lastRowDGSpacer = sheetDG.getLastRow();
        sheetDG.getRange(lastRowDGSpacer, 1, 1, 12).setFontFamily("Arial");
        
        for (var k = 0; k < 15; k++) {
          sheetDG.appendRow(["", studentName, "", "", "", "", "", "", "", "", "", ""]);
          var lastRowDGFill = sheetDG.getLastRow();
          sheetDG.getRange(lastRowDGFill, 1, 1, 12).setFontFamily("Arial");
        }
        clearSheetCache('Bảng đánh giá học tập ');
      }
    }
    
    // Clear caches
    clearSheetCache('Mã học sinh');
    clearCachesForStudent(oldPhone);
    clearCachesForStudent(studentPhone);
    clearTutorCache(tutorPhone);
    
    return { success: true };
  } catch (e) {
    return { error: "Lỗi backend: " + e.toString() };
  } finally {
    lock.releaseLock();
  }
}

// Cập nhật tài khoản cá nhân Admin
function adminCapNhatTaiKhoan(oldPhone, name, phone, pin) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = initAdminSheet(ss);
    var data = sheet.getDataRange().getDisplayValues();
    
    var rowIndex = -1;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][2]).trim() === String(oldPhone).trim()) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex !== -1) {
      sheet.getRange(rowIndex, 2).setValue(name);
      sheet.getRange(rowIndex, 3).setValue("'" + phone);
      sheet.getRange(rowIndex, 4).setValue("'" + pin);
      
      // Clear cache
      clearSheetCache('Mã admin');
      
      return { success: true };
    } else {
      return { error: "Không tìm thấy thông tin Admin cần cập nhật." };
    }
  } catch (e) {
    return { error: "Lỗi backend: " + e.toString() };
  } finally {
    lock.releaseLock();
  }
}

// Xóa gia sư tạm thời (Đánh dấu ngày xóa)
function xoaGiaSuTamThoi(tutorPhone) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetGS = ss.getSheetByName('Mã gia sư');
    if (!sheetGS) return { error: "Không tìm thấy sheet 'Mã gia sư'" };
    
    var dataGS = sheetGS.getDataRange().getDisplayValues();
    var rowIndex = -1;
    var normTutorPhone = normalizePhone(tutorPhone);
    
    var targetRowData = null;
    for (var i = 1; i < dataGS.length; i++) {
      if (normalizePhone(dataGS[i][2]) === normTutorPhone) {
        rowIndex = i + 1;
        targetRowData = dataGS[i];
        break;
      }
    }
    
    if (rowIndex === -1) {
      return { error: "Không tìm thấy gia sư cần xóa." };
    }
    
    var now = new Date();
    var dateString = Utilities.formatDate(now, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
    sheetGS.getRange(rowIndex, 6).setValue(dateString).setFontFamily("Arial");
    writeTrashLog(ss, "Gia sư", "Xóa tạm thời", targetRowData);
    
    // Clear caches
    clearSheetCache('Mã gia sư');
    clearTutorCache(tutorPhone);
    
    return { success: true };
  } catch (e) {
    return { error: "Lỗi backend: " + e.toString() };
  }
}

// Khôi phục gia sư từ thùng rác
function khoiPhucGiaSu(tutorPhone) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetGS = ss.getSheetByName('Mã gia sư');
    if (!sheetGS) return { error: "Không tìm thấy sheet 'Mã gia sư'" };
    
    var dataGS = sheetGS.getDataRange().getDisplayValues();
    var rowIndex = -1;
    var normTutorPhone = normalizePhone(tutorPhone);
    
    var targetRowData = null;
    for (var i = 1; i < dataGS.length; i++) {
      if (normalizePhone(dataGS[i][2]) === normTutorPhone) {
        rowIndex = i + 1;
        targetRowData = dataGS[i];
        break;
      }
    }
    
    if (rowIndex === -1) {
      return { error: "Không tìm thấy gia sư để khôi phục." };
    }
    
    sheetGS.getRange(rowIndex, 6).setValue("").setFontFamily("Arial");
    writeTrashLog(ss, "Gia sư", "Khôi phục", targetRowData);
    
    // Clear caches
    clearSheetCache('Mã gia sư');
    clearTutorCache(tutorPhone);
    
    return { success: true };
  } catch (e) {
    return { error: "Lỗi backend: " + e.toString() };
  }
}

// Tự động dọn dẹp các gia sư đã xóa tạm thời quá 10 ngày
function clearOldDeletedTutors(sheetGS) {
  try {
    var data = sheetGS.getDataRange().getValues();
    var now = new Date();
    var cacheCleared = false;
    // Vòng lặp ngược để xóa dòng an toàn
    for (var i = data.length - 1; i >= 1; i--) {
      var deletedDateStr = data[i][5];
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
                writeTrashLog(ss, "Gia sư", "Xóa vĩnh viễn do hết hạn", data[i]);
                sheetGS.deleteRow(i + 1);
                
                var tutorPhone = data[i][2];
                clearTutorCache(tutorPhone);
                cacheCleared = true;
              }
            }
          }
        }
      }
    }
    if (cacheCleared) {
      clearSheetCache('Mã gia sư');
    }
  } catch (err) {
    Logger.log("Lỗi dọn dẹp gia sư hết hạn: " + err.toString());
  }
}

// Thay đổi trạng thái vô hiệu hóa/kích hoạt gia sư
function adminSetTutorStatus(tutorPhone, status) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetGS = ss.getSheetByName('Mã gia sư');
    if (!sheetGS) return { error: "Không tìm thấy sheet 'Mã gia sư'" };
    
    var dataGS = sheetGS.getDataRange().getDisplayValues();
    var normT = normalizePhone(tutorPhone);
    var rowIndex = -1;
    for (var i = 1; i < dataGS.length; i++) {
      if (normalizePhone(dataGS[i][2]) === normT) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex !== -1) {
      sheetGS.getRange(rowIndex, 10).setValue(status);
      SpreadsheetApp.flush();
      
      // Clear caches
      clearSheetCache('Mã gia sư');
      clearTutorCache(tutorPhone);
      
      return { success: true };
    } else {
      return { error: "Không tìm thấy gia sư cần cập nhật trạng thái." };
    }
  } catch (e) {
    return { error: "Lỗi hệ thống: " + e.toString() };
  } finally {
    lock.releaseLock();
  }
}

// Hết file Admin.gs
