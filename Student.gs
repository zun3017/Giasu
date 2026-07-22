// Lấy dữ liệu cho Học sinh/Phụ huynh tra cứu kết quả
function traCuuDuLieuHocSinh(phone, hsRow, ss) {
  var studentName = hsRow[2];
  var normPhone = normalizePhone(phone);
  
  // Kiểm tra trong bộ nhớ đệm trước
  var cache = CacheService.getScriptCache();
  var cacheKey = "student_dash_" + normPhone;
  var cached = cache.get(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch(e) {
      Logger.log("Lỗi parse cache student dash: " + e.toString());
    }
  }
  
  var ketQua = {
    timThay: true,
    tenHocSinh: studentName,
    thongBaoHocSinh: (hsRow.length > 4) ? hsRow[4].trim() : "",
    lichSuHocTap: [],
    baiTap: []
  };

  // 1. Lấy Lịch Sử Học Tập (Sử dụng hàm Cached của Sheet)
  var sheetDanhGia = ss.getSheetByName('Bảng đánh giá học tập '); 
  if (sheetDanhGia) {
    var dataDanhGia = getSheetDisplayValuesCached('Bảng đánh giá học tập ');
    
    // a. Thử khớp theo SĐT trước
    for (var j = 1; j < dataDanhGia.length; j++) {
      if (normalizePhone(dataDanhGia[j][0]) === normPhone) { 
        if (String(dataDanhGia[j][2]).trim() !== "") {
          ketQua.lichSuHocTap.push({
            tuan: dataDanhGia[j][2],
            ngay: dataDanhGia[j][3],
            mon: dataDanhGia[j][4],
            noiDung: dataDanhGia[j][5],
            danhGiaBTVN: dataDanhGia[j][6],
            diemDauGio: dataDanhGia[j][7],
            diemDinhKi: dataDanhGia[j][8],
            trangThai: dataDanhGia[j][9]
          });
        }
      }
    }
    
    // b. Fallback theo tên học sinh nếu không có log nào khớp theo SĐT
    if (ketQua.lichSuHocTap.length === 0 && studentName) {
      var targetName = String(studentName).trim().toLowerCase();
      for (var j = 1; j < dataDanhGia.length; j++) {
        if (String(dataDanhGia[j][1]).trim().toLowerCase() === targetName) { 
          if (String(dataDanhGia[j][2]).trim() !== "") {
            ketQua.lichSuHocTap.push({
              tuan: dataDanhGia[j][2],
              ngay: dataDanhGia[j][3],
              mon: dataDanhGia[j][4],
              noiDung: dataDanhGia[j][5],
              danhGiaBTVN: dataDanhGia[j][6],
              diemDauGio: dataDanhGia[j][7],
              diemDinhKi: dataDanhGia[j][8],
              trangThai: dataDanhGia[j][9]
            });
          }
        }
      }
    }
  }

  // 2. Lấy Bài Kiểm Tra (Sử dụng hàm Cached của Sheet)
  var sheetBaiTap = ss.getSheetByName('Bài kiểm tra');
  if (sheetBaiTap) {
    var dataBaiTap = getSheetDisplayValuesCached('Bài kiểm tra');
    
    // a. Thử khớp theo SĐT trước
    for (var k = 1; k < dataBaiTap.length; k++) {
      if (normalizePhone(dataBaiTap[k][0]) === normPhone) { 
        ketQua.baiTap.push({
          mon: dataBaiTap[k][2],
          tenBai: dataBaiTap[k][3],
          link: dataBaiTap[k][4]
        });
      }
    }
    
    // b. Fallback theo tên học sinh nếu không có bài kiểm tra nào khớp theo SĐT
    if (ketQua.baiTap.length === 0 && studentName) {
      var targetName = String(studentName).trim().toLowerCase();
      for (var k = 1; k < dataBaiTap.length; k++) {
        if (String(dataBaiTap[k][1]).trim().toLowerCase() === targetName) { 
          ketQua.baiTap.push({
            mon: dataBaiTap[k][2],
            tenBai: dataBaiTap[k][3],
            link: dataBaiTap[k][4]
          });
        }
      }
    }
  }
  
  // Lưu kết quả vào cache trong 5 phút
  try {
    cache.put(cacheKey, JSON.stringify(ketQua), 300);
  } catch(e) {
    Logger.log("Lỗi ghi cache student dash: " + e.toString());
  }
  
  return ketQua;
}

// Xóa bộ nhớ đệm học sinh khi có cập nhật mới
function clearStudentCache(phone) {
  try {
    var cache = CacheService.getScriptCache();
    var norm = normalizePhone(phone);
    cache.remove("student_dash_" + norm);
    cache.remove("student_logs_" + norm);
    
    // Đồng thời xóa cache báo cáo Admin
    cache.remove("admin_dashboard_data");
  } catch(e) {
    Logger.log("Lỗi xóa cache học sinh: " + e.toString());
  }
}

// Gửi ý kiến phản hồi của phụ huynh
function guiPhanHoi(maHS, tenHocSinh, noiDung) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = "Ý kiến phụ huynh";
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(["Thời gian", "Số điện thoại học sinh", "Tên học sinh", "Ý kiến phản hồi phụ huynh"]);
      sheet.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#f3f3f3");
    }
    
    sheet.appendRow([new Date(), "'" + maHS, tenHocSinh, noiDung]);
    
    // Xóa bộ nhớ đệm liên quan đến danh sách phản hồi của gia sư phụ trách học sinh này
    var cache = CacheService.getScriptCache();
    // Chúng ta không biết gia sư nào phụ trách học sinh này ngay lúc này, nên xóa hết feedback cache của gia sư
    // Hoặc tìm SĐT gia sư từ sheet Mã học sinh và xóa cache cụ thể của gia sư đó
    var sheetHS = ss.getSheetByName('Mã học sinh');
    if (sheetHS) {
      var dataHS = getSheetDisplayValuesCached('Mã học sinh');
      var normHSPhone = normalizePhone(maHS);
      for (var i = 1; i < dataHS.length; i++) {
        if (normalizePhone(dataHS[i][3]) === normHSPhone) {
          var tutorPhone = dataHS[i][6];
          if (tutorPhone) {
            cache.remove("tutor_feedback_" + normalizePhone(tutorPhone));
          }
          break;
        }
      }
    }
    
    return { thanhCong: true };
  } catch (error) {
    return { thanhCong: false, thongBao: error.toString() };
  }
}

// --- CỔNG NỘP BÀI TẬP CỦA HỌC SINH (xacThucMaBaiTap, upload, edit, delete, restore) ---

// Xóa cache cổng nộp bài tập
function clearHomeworkPortalCache(ma) {
  try {
    var cache = CacheService.getScriptCache();
    cache.remove("student_hw_portal_" + normalizeMa(ma));
  } catch(e) {
    Logger.log("Lỗi xóa cache homework portal: " + e.toString());
  }
}

// Xác thực Mã bài tập (Đăng nhập và lấy lịch sử nộp bài / bài tập giao)
function xacThucMaBaiTap(ma) {
  var cleanMa = String(ma).trim().toUpperCase();
  if (cleanMa === "") {
    return { timThay: false, thongBao: "Vui lòng nhập mã bài tập của học sinh!" };
  }
  
  // Kiểm tra bộ nhớ đệm trước
  var cache = CacheService.getScriptCache();
  var cacheKey = "student_hw_portal_" + normalizeMa(cleanMa);
  var cached = cache.get(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch(e) {
      Logger.log("Lỗi parse cache homework portal: " + e.toString());
    }
  }

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var ssClass = getClassSpreadsheet(); // Mở Sheet lớp học
    
    // 1. Quét tìm học sinh 1-1 trước
    var sheetHS = ss.getSheetByName('Mã học sinh');
    var isClassStudent = false;
    var studentName = "";
    var classId = "";
    var studentId = "";
    var foundRow = -1;
    
    if (sheetHS) {
      var dataHS = getSheetDisplayValuesCached('Mã học sinh');
      for (var i = 1; i < dataHS.length; i++) {
        if (dataHS[i].length > 7 && normalizeMa(dataHS[i][7]) === normalizeMa(cleanMa)) {
          foundRow = i;
          studentName = dataHS[i][2];
          break;
        }
      }
    }
    
    // 2. Nếu không tìm thấy, quét tiếp trong Học sinh lớp học (trên sheet lớp)
    if (foundRow === -1 && ssClass) {
      var sheetCS = ssClass.getSheetByName('Học sinh lớp học');
      if (sheetCS) {
        var dataCS = sheetCS.getDataRange().getDisplayValues();
        for (var i = 1; i < dataCS.length; i++) {
          if (dataCS[i].length > 7 && normalizeMa(dataCS[i][7]) === normalizeMa(cleanMa)) {
            foundRow = i;
            studentId = dataCS[i][0];
            studentName = dataCS[i][1];
            classId = dataCS[i][2];
            isClassStudent = true;
            break;
          }
        }
      }
    }
    
    if (foundRow === -1) {
      return { timThay: false, thongBao: "Mã bài tập không hợp lệ hoặc học sinh chưa được cấp mã!" };
    }
    
    var submissions = [];
    var assignedList = [];
    
    if (isClassStudent && ssClass) {
      // Đọc lịch sử bài nộp của lớp học nhóm từ sheet 'Học sinh nộp bài lớp học'
      var sheetSub = ssClass.getSheetByName('Học sinh nộp bài lớp học');
      var hwTitleMap = {};
      var sheetHwList = ssClass.getSheetByName('Bài tập lớp học');
      
      if (sheetHwList) {
        var dataHwList = sheetHwList.getDataRange().getDisplayValues();
        for (var k = 1; k < dataHwList.length; k++) {
          hwTitleMap[dataHwList[k][0]] = dataHwList[k][3]; // Mã bài tập -> Tên bài tập
          
          var hwClassId = dataHwList[k][1] ? String(dataHwList[k][1]).trim() : "";
          if (hwClassId === classId || hwClassId === "") {
            assignedList.push({
              rowIndex: k + 1,
              timestamp: dataHwList[k][4] || "",
              studentName: studentName,
              title: dataHwList[k][3],
              releaseDate: dataHwList[k][4],
              fileUrl: dataHwList[k][6] || "",
              externalLink: dataHwList[k][5] || ""
            });
          }
        }
      }
      
      if (sheetSub) {
        var dataSub = sheetSub.getDataRange().getDisplayValues();
        for (var j = 1; j < dataSub.length; j++) {
          if (dataSub[j].length >= 11 && dataSub[j][3] === studentId) {
            var hwIdVal = dataSub[j][1];
            submissions.push({
              timestamp: dataSub[j][10] || "",
              studentName: dataSub[j][4] || "",
              lessonName: hwTitleMap[hwIdVal] || hwIdVal || "Bài tập lớp học",
              fileUrl: dataSub[j][6] || "",
              ma: cleanMa,
              submissionDate: dataSub[j][10] ? dataSub[j][10].split(" ")[0] : "",
              status: "Active",
              rowIndex: j + 1
            });
          }
        }
      }
    } else {
      // 1-1 Tutor logic
      var sheetHW = initHomeworkSheet(ss);
      var dataHW = getSheetDisplayValuesCached('Bài tập');
      var hwHeaders = getHeaderIndices(sheetHW);
      
      var colMa = hwHeaders["Mã bài tập"] !== undefined ? hwHeaders["Mã bài tập"] : 4;
      var colTime = hwHeaders["Thời gian nộp"] !== undefined ? hwHeaders["Thời gian nộp"] : 0;
      var colName = hwHeaders["Tên học sinh"] !== undefined ? hwHeaders["Tên học sinh"] : 1;
      var colLesson = hwHeaders["Tên bài học"] !== undefined ? hwHeaders["Tên bài học"] : 2;
      var colUrl = hwHeaders["Link Google Drive liên kết"] !== undefined ? hwHeaders["Link Google Drive liên kết"] : 3;
      var colDate = hwHeaders["Ngày nộp"] !== undefined ? hwHeaders["Ngày nộp"] : 5;
      var colStatus = hwHeaders["Trạng thái nộp"] !== undefined ? hwHeaders["Trạng thái nộp"] : 6;
      
      for (var j = 1; j < dataHW.length; j++) {
        if (dataHW[j].length > colMa && normalizeMa(dataHW[j][colMa]) === normalizeMa(cleanMa)) {
          submissions.push({
            timestamp: dataHW[j][colTime] || "",
            studentName: dataHW[j][colName] || "",
            lessonName: dataHW[j][colLesson] || "",
            fileUrl: dataHW[j][colUrl] || "",
            ma: dataHW[j][colMa] || "",
            submissionDate: dataHW[j][colDate] || "",
            status: dataHW[j][colStatus] || "Active",
            rowIndex: j + 1
          });
        }
      }
      
      var sheetAssigned = ss.getSheetByName('Bài tập giao');
      if (sheetAssigned) {
        var dataAssigned = getSheetDisplayValuesCached('Bài tập giao');
        for (var k = 1; k < dataAssigned.length; k++) {
          if (dataAssigned[k].length > 6 && normalizeMa(dataAssigned[k][5]) === normalizeMa(cleanMa) && dataAssigned[k][6] === "Active") {
            assignedList.push({
              rowIndex: k + 1,
              timestamp: dataAssigned[k][0],
              studentName: dataAssigned[k][1],
              title: dataAssigned[k][2],
              releaseDate: dataAssigned[k][3],
              fileUrl: dataAssigned[k][4],
              externalLink: dataAssigned[k].length > 9 ? dataAssigned[k][9] : ""
            });
          }
        }
      }
    }
    
    var result = {
      timThay: true,
      ma: cleanMa,
      studentName: studentName,
      submissions: submissions,
      assignedList: assignedList,
      isClassStudent: isClassStudent,
      classId: classId,
      studentId: studentId
    };
    
    try {
      cache.put(cacheKey, JSON.stringify(result), 600);
    } catch(e) {
      Logger.log("Lỗi ghi cache homework portal: " + e.toString());
    }
    
    return result;
  } catch (e) {
    return { timThay: false, thongBao: "Lỗi hệ thống: " + e.toString() };
  }
}

// Tải file bài tập đơn lẻ lên (Tương thích ngược)
function uploadHomeworkFile(ma, studentName, lessonName, fileBase64, fileName, mimeType) {
  return uploadHomeworkFiles(ma, studentName, lessonName, [{ fileBase64: fileBase64, fileName: fileName, mimeType: mimeType }]);
}

// Lưu tệp nộp bài của học sinh (Hỗ trợ nén nhiều ảnh thành 1 file ZIP)
function uploadHomeworkFiles(ma, studentName, lessonName, filesList) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Kiểm tra xem có phải học sinh lớp học nhóm không
    var isClassStudent = false;
    var classId = "";
    var studentId = "";
    var rawMa = String(ma || "").trim().toLowerCase();
    var normMa = normalizePhone(ma);
    
    var ssClass = getClassSpreadsheet();
    if (ssClass) {
      var sheetCS = ssClass.getSheetByName('Học sinh lớp học');
      if (sheetCS) {
        var dataCS = sheetCS.getDataRange().getDisplayValues();
        for (var i = 1; i < dataCS.length; i++) {
          if (!dataCS[i] || dataCS[i].length < 1) continue;
          var isMatch = false;
          for (var col = 0; col < dataCS[i].length; col++) {
            var val = String(dataCS[i][col] || "").trim();
            if (val === "") continue;
            if (val.toLowerCase() === rawMa || (normMa !== "" && normalizePhone(val) === normMa)) {
              isMatch = true;
              break;
            }
          }
          if (isMatch) {
            studentId = dataCS[i][0];
            studentName = studentName || dataCS[i][1];
            classId = dataCS[i][2];
            isClassStudent = true;
            break;
          }
        }
      }
    }
    
    var parentFolderId = "1ZKHCDdZzkMqLTV4guvMNkKYbaQHCEGus";
    var parentFolder;
    var driveApp = DriveApp;
    
    try {
      parentFolder = driveApp.getFolderById(parentFolderId);
    } catch (err) {
      var folders = driveApp.getRootFolder().getFoldersByName("BÀI TẬP GIA SƯ");
      if (folders.hasNext()) {
        parentFolder = folders.next();
      } else {
        parentFolder = driveApp.getRootFolder().createFolder("BÀI TẬP GIA SƯ");
      }
    }
    
    var studentFolders = parentFolder.getFoldersByName(studentName);
    var studentFolder;
    if (studentFolders.hasNext()) {
      studentFolder = studentFolders.next();
    } else {
      studentFolder = parentFolder.createFolder(studentName);
    }
    
    var now = new Date();
    var shortDateString = Utilities.formatDate(now, Session.getScriptTimeZone(), "dd/MM/yyyy");
    var dateString = Utilities.formatDate(now, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
    
    var fileUrl = "";
    
    if (filesList && filesList.length > 0) {
      var blobs = [];
      for (var i = 0; i < filesList.length; i++) {
        var fileObj = filesList[i];
        if (!fileObj || !fileObj.fileBase64) continue;
        
        var fileData = Utilities.base64Decode(fileObj.fileBase64);
        var ext = "";
        var lastDot = fileObj.fileName.lastIndexOf(".");
        if (lastDot !== -1) {
          ext = fileObj.fileName.substring(lastDot);
        } else {
          if (fileObj.mimeType === "application/pdf") ext = ".pdf";
          else if (fileObj.mimeType === "image/png") ext = ".png";
          else if (fileObj.mimeType === "image/jpeg" || fileObj.mimeType === "image/jpg") ext = ".jpg";
          else if (fileObj.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") ext = ".docx";
        }
        
        var newFileName = studentName + " - " + shortDateString.split('/').join('-') + " - " + lessonName + (filesList.length > 1 ? (" - " + (i + 1)) : "") + ext;
        blobs.push(Utilities.newBlob(fileData, fileObj.mimeType, newFileName));
      }
      
      if (blobs.length === 1) {
        var singleFile = studentFolder.createFile(blobs[0]);
        try { singleFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (fErr) {}
        fileUrl = singleFile.getUrl();
      } else if (blobs.length > 1) {
        var zipName = studentName + " - " + shortDateString.split('/').join('-') + " - " + lessonName + ".zip";
        var zipBlob = Utilities.zip(blobs, zipName);
        var zipFile = studentFolder.createFile(zipBlob);
        try { zipFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (fErr) {}
        fileUrl = zipFile.getUrl();
      }
    }
    
    if (isClassStudent) {
      if (ssClass) {
        var sheetSub = ssClass.getSheetByName('Học sinh nộp bài lớp học');
        if (!sheetSub) {
          sheetSub = ssClass.insertSheet('Học sinh nộp bài lớp học');
          sheetSub.appendRow(["Mã nộp bài", "Mã bài tập", "Mã lớp", "Mã học sinh", "Tên học sinh", "SĐT Phụ huynh", "Link bài nộp", "Trạng thái chấm", "Điểm số", "Nhận xét Giáo viên", "Thời gian nộp"]);
          sheetSub.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#8E4DFF").setFontColor("#FFFFFF");
          sheetSub.setFrozenRows(1);
        }
        
        var subId = "SUB_LH_" + new Date().getTime();
        
        // Lấy SĐT Phụ huynh
        var parentPhone = "";
        var sheetCS = ssClass.getSheetByName('Học sinh lớp học');
        if (sheetCS) {
          var dataCS = sheetCS.getDataRange().getDisplayValues();
          for (var i = 1; i < dataCS.length; i++) {
            if (dataCS[i][0] === studentId) {
              parentPhone = dataCS[i][3] || "";
              break;
            }
          }
        }
        
        sheetSub.appendRow([
          subId,
          lessonName,       // Mã bài tập
          classId,          // Mã lớp
          studentId,        // Mã học sinh
          studentName,      // Tên học sinh
          parentPhone,      // SĐT Phụ huynh
          fileUrl,          // Link bài nộp
          "Chưa chấm",      // Trạng thái chấm
          "",               // Điểm số
          "",               // Nhận xét Giáo viên
          dateString        // Thời gian nộp
        ]);
        
        clearHomeworkPortalCache(ma);
        
        return {
          success: true,
          fileUrl: fileUrl,
          submissionDate: shortDateString,
          timestamp: dateString,
          status: "Active",
          rowIndex: sheetSub.getLastRow()
        };
      }
    } else {
      var sheetHW = initHomeworkSheet(ss);
      var hwHeaders = getHeaderIndices(sheetHW);
      
      var rowData = {};
      rowData["Thời gian nộp"] = dateString;
      rowData["Tên học sinh"] = studentName;
      rowData["Tên bài học"] = lessonName;
      rowData["Link Google Drive liên kết"] = fileUrl;
      rowData["Mã bài tập"] = "'" + ma.toUpperCase();
      rowData["Ngày nộp"] = shortDateString;
      rowData["Trạng thái nộp"] = "Active";
      
      var lastRow = writeRowWithHeaders(sheetHW, hwHeaders, rowData);
      sheetHW.getRange(lastRow, 1, 1, sheetHW.getLastColumn()).setFontFamily("Arial");
      
      clearSheetCache('Bài tập');
      clearHomeworkPortalCache(ma);
      
      return {
        success: true,
        fileUrl: fileUrl,
        submissionDate: shortDateString,
        timestamp: dateString,
        status: "Active",
        rowIndex: lastRow
      };
    }
  } catch (e) {
    return { error: "Lỗi hệ thống: " + e.toString() };
  }
}

// Khởi tạo sheet lưu trữ bài tập nộp của lớp học nhóm
function initClassHomeworkSubmissionSheet(ss) {
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Bài tập nộp lớp');
  if (!sheet) {
    sheet = ss.insertSheet('Bài tập nộp lớp');
    sheet.appendRow([
      "Mã nộp bài",
      "Mã bài tập lớp",
      "Tên bài học",
      "Mã lớp",
      "Mã học sinh",
      "Tên học sinh",
      "Link file nộp bài",
      "Thời gian nộp"
    ]);
    sheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#8E4DFF").setFontColor("#FFFFFF");
  }
  return sheet;
}

// Chỉnh sửa bài tập đã nộp
function editHomeworkFile(rowIndex, lessonName, fileBase64OrList, fileName, mimeType) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var r = parseInt(rowIndex);

    var ssClass = getClassSpreadsheet();
    var sheetSub = ssClass ? ssClass.getSheetByName('Học sinh nộp bài lớp học') : null;
    var sheetHW = initHomeworkSheet(ss);
    
    var targetSheet = sheetHW;
    var isClass = false;
    var data = getSheetDisplayValuesCached('Bài tập');
    
    if (sheetSub) {
      var dataSub = sheetSub.getDataRange().getDisplayValues();
      if (!isNaN(r) && r >= 2 && r <= dataSub.length) {
        targetSheet = sheetSub;
        data = dataSub;
        isClass = true;
      }
    }
    
    if (isNaN(r) || r < 2 || r > data.length) {
      return { error: "Vị trí dòng không hợp lệ." };
    }
    
    var studentName = isClass ? data[r - 1][4] : data[r - 1][1];
    var oldUrl = isClass ? data[r - 1][6] : data[r - 1][3];
    var colLessonIdx = isClass ? 1 : 2;
    
    targetSheet.getRange(r, colLessonIdx + 1).setValue(lessonName);
    var fileUrl = oldUrl;
    
    var filesList = [];
    if (Array.isArray(fileBase64OrList)) {
      filesList = fileBase64OrList;
    } else if (fileBase64OrList && fileName) {
      filesList = [{ fileBase64: fileBase64OrList, fileName: fileName, mimeType: mimeType }];
    }
    
    if (filesList && filesList.length > 0) {
      var driveApp = DriveApp;
      if (oldUrl) {
        var matches = oldUrl.match(/[-\w]{25,}/);
        if (matches && matches[0]) {
          try {
            if (oldUrl.indexOf("/folders/") !== -1 || oldUrl.indexOf("/drive/folders/") !== -1) {
              driveApp.getFolderById(matches[0]).setTrashed(true);
            } else {
              driveApp.getFileById(matches[0]).setTrashed(true);
            }
          } catch (deleteErr) {
            Logger.log("Không thể dọn dẹp tệp cũ: " + deleteErr.toString());
          }
        }
      }
      
      var parentFolderId = "1ZKHCDdZzkMqLTV4guvMNkKYbaQHCEGus";
      var parentFolder;
      try {
        parentFolder = driveApp.getFolderById(parentFolderId);
      } catch (err) {
        var folders = driveApp.getRootFolder().getFoldersByName("BÀI TẬP GIA SƯ");
        if (folders.hasNext()) parentFolder = folders.next();
        else parentFolder = driveApp.getRootFolder().createFolder("BÀI TẬP GIA SƯ");
      }
      
      var studentFolders = parentFolder.getFoldersByName(studentName);
      var studentFolder;
      if (studentFolders.hasNext()) studentFolder = studentFolders.next();
      else studentFolder = parentFolder.createFolder(studentName);
      
      var now = new Date();
      var shortDateString = Utilities.formatDate(now, Session.getScriptTimeZone(), "dd/MM/yyyy");
      var blobs = [];
      for (var i = 0; i < filesList.length; i++) {
        var fileObj = filesList[i];
        if (!fileObj || !fileObj.fileBase64) continue;
        
        var fileData = Utilities.base64Decode(fileObj.fileBase64);
        var ext = "";
        var lastDot = fileObj.fileName.lastIndexOf(".");
        if (lastDot !== -1) ext = fileObj.fileName.substring(lastDot);
        else {
          if (fileObj.mimeType === "application/pdf") ext = ".pdf";
          else if (fileObj.mimeType === "image/png") ext = ".png";
          else ext = ".jpg";
        }
        var newFileName = studentName + " - " + shortDateString.split('/').join('-') + " - " + lessonName + (filesList.length > 1 ? (" - " + (i + 1)) : "") + ext;
        blobs.push(Utilities.newBlob(fileData, fileObj.mimeType, newFileName));
      }
      
      if (blobs.length === 1) {
        var singleFile = studentFolder.createFile(blobs[0]);
        try { singleFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (fErr) {}
        fileUrl = singleFile.getUrl();
      } else if (blobs.length > 1) {
        var zipName = studentName + " - " + shortDateString.split('/').join('-') + " - " + lessonName + ".zip";
        var zipBlob = Utilities.zip(blobs, zipName);
        var zipFile = studentFolder.createFile(zipBlob);
        try { zipFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (fErr) {}
        fileUrl = zipFile.getUrl();
      }
      
      var urlColIdx = isClass ? 7 : 4;
      targetSheet.getRange(r, urlColIdx).setValue(fileUrl);
    }
    
    SpreadsheetApp.flush();
    if (isClass) clearSheetCache('Bài tập nộp lớp');
    else clearSheetCache('Bài tập');
    
    return { success: true, fileUrl: fileUrl };
  } catch(e) {
    return { error: "Lỗi chỉnh sửa: " + e.toString() };
  }
}

// Xóa tạm thời bài nộp của học sinh
function deleteHomeworkFile(rowIndex) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var r = parseInt(rowIndex);
    
    var ssClass = getClassSpreadsheet();
    var sheetSub = ssClass ? ssClass.getSheetByName('Học sinh nộp bài lớp học') : null;
    var sheetHW = initHomeworkSheet(ss);
    
    var targetSheet = sheetHW;
    var isClass = false;
    var data = getSheetDisplayValuesCached('Bài tập');
    
    if (sheetSub) {
      var dataSub = sheetSub.getDataRange().getDisplayValues();
      if (!isNaN(r) && r >= 2 && r <= dataSub.length) {
        targetSheet = sheetSub;
        data = dataSub;
        isClass = true;
      }
    }
    
    if (isNaN(r) || r < 2 || r > data.length) {
      return { error: "Vị trí dòng không hợp lệ." };
    }
    
    if (isClass) {
      var ma = data[r - 1][1]; // Mã bài tập hoặc số điện thoại phụ huynh
      targetSheet.deleteRow(r);
      clearHomeworkPortalCache(ma);
      return { success: true };
    } else {
      var hwHeaders = getHeaderIndices(sheetHW);
      var colDateIdx = hwHeaders["Ngày nộp"] !== undefined ? hwHeaders["Ngày nộp"] : 5;
      var colStatusIdx = hwHeaders["Trạng thái nộp"] !== undefined ? hwHeaders["Trạng thái nộp"] : 6;
      var colMaIdx = hwHeaders["Mã bài tập"] !== undefined ? hwHeaders["Mã bài tập"] : 4;
      
      var now = new Date();
      var todayStr = Utilities.formatDate(now, Session.getScriptTimeZone(), "dd/MM/yyyy");
      var submissionDateStr = sheetHW.getRange(r, colDateIdx + 1).getDisplayValue().trim();
      var ma = data[r - 1][colMaIdx];
      
      if (submissionDateStr !== todayStr) {
        return { error: "Đã quá hạn xóa bài tập (chỉ được xóa trong ngày nộp)." };
      }
      
      sheetHW.getRange(r, colStatusIdx + 1).setValue("Deleted").setFontFamily("Arial");
      writeTrashLog(ss, "Bài tập", "Xóa bài tập tạm thời", data[r - 1]);
      
      clearSheetCache('Bài tập');
      clearHomeworkPortalCache(ma);
      
      return { success: true };
    }
  } catch (e) {
    return { error: "Lỗi hệ thống: " + e.toString() };
  }
}

// Khôi phục bài nộp từ Thùng rác
function restoreHomeworkFile(rowIndex) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var r = parseInt(rowIndex);
    
    var ssClass = getClassSpreadsheet();
    var sheetSub = ssClass ? ssClass.getSheetByName('Học sinh nộp bài lớp học') : null;
    
    // Nếu là Học sinh lớp học và đã bị xóa dòng, không khôi phục được nữa
    if (sheetSub) {
      var dataSub = sheetSub.getDataRange().getDisplayValues();
      if (!isNaN(r) && r >= 2 && r <= dataSub.length) {
        return { error: "Không hỗ trợ khôi phục bài nộp lớp học trực tiếp, vui lòng nộp lại bài tập." };
      }
    }
    
    var sheetHW = initHomeworkSheet(ss);
    var hwHeaders = getHeaderIndices(sheetHW);
    var data = sheetHW.getDataRange().getValues();
    if (isNaN(r) || r < 2 || r > data.length) {
      return { error: "Vị trí dòng không hợp lệ." };
    }
    
    var colDateIdx = hwHeaders["Ngày nộp"] !== undefined ? hwHeaders["Ngày nộp"] : 5;
    var colStatusIdx = hwHeaders["Trạng thái nộp"] !== undefined ? hwHeaders["Trạng thái nộp"] : 6;
    var colMaIdx = hwHeaders["Mã bài tập"] !== undefined ? hwHeaders["Mã bài tập"] : 4;
    
    var now = new Date();
    var todayStr = Utilities.formatDate(now, Session.getScriptTimeZone(), "dd/MM/yyyy");
    var submissionDateStr = sheetHW.getRange(r, colDateIdx + 1).getDisplayValue().trim();
    var ma = data[r - 1][colMaIdx];
    
    if (submissionDateStr !== todayStr) {
      return { error: "Đã quá hạn khôi phục (chỉ được khôi phục trong ngày nộp)." };
    }
    
    sheetHW.getRange(r, colStatusIdx + 1).setValue("Active").setFontFamily("Arial");
    writeTrashLog(ss, "Bài tập", "Khôi phục bài tập", data[r - 1]);
    
    clearSheetCache('Bài tập');
    clearHomeworkPortalCache(ma);
    
    return { success: true };
  } catch (e) {
    return { error: "Lỗi hệ thống: " + e.toString() };
  }
}

// Đã xóa hàm bóng ma traCuuDuLieuHocSinhLop trùng lặp để chạy bản chuẩn trong Class.gs

// Hết file Student.gs
