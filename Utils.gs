// Chuẩn hóa số điện thoại loại bỏ ký tự đặc biệt và số 0 ở đầu để so khớp chính xác
function normalizePhone(p) {
  if (!p) return "";
  var clean = String(p).replace(/\D/g, "");
  if (clean.length > 1 && clean.charAt(0) === '0') {
    clean = clean.substring(1);
  }
  return clean;
}

// --- BỘ NHỚ ĐỆM CACHE SERVICES (TỐI ƯU HÓA TỐC ĐỘ) ---

// Đọc dữ liệu từ cache hoặc sheet dạng Display Values
function getSheetDisplayValuesCached(sheetName) {
  var cache = CacheService.getScriptCache();
  var cacheKey = "sheet_display_" + sheetName.replace(/\s+/g, "_");
  var cachedData = cache.get(cacheKey);
  if (cachedData) {
    try {
      return JSON.parse(cachedData);
    } catch(e) {
      Logger.log("Lỗi parse cache display values: " + e.toString());
    }
  }
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  var values = sheet.getDataRange().getDisplayValues();
  try {
    var jsonStr = JSON.stringify(values);
    // Kích thước tối đa của một item trong Apps Script cache là 100KB (khoảng 100.000 ký tự)
    if (jsonStr.length < 95000) {
      cache.put(cacheKey, jsonStr, 600); // Lưu 10 phút
    }
  } catch(e) {
    Logger.log("Lỗi ghi cache cho sheet " + sheetName + ": " + e.toString());
  }
  return values;
}

// Đọc dữ liệu từ cache hoặc sheet dạng Raw Values
function getSheetValuesCached(sheetName) {
  var cache = CacheService.getScriptCache();
  var cacheKey = "sheet_values_" + sheetName.replace(/\s+/g, "_");
  var cachedData = cache.get(cacheKey);
  if (cachedData) {
    try {
      return JSON.parse(cachedData);
    } catch(e) {
      Logger.log("Lỗi parse cache raw values: " + e.toString());
    }
  }
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  var values = sheet.getDataRange().getValues();
  try {
    var jsonStr = JSON.stringify(values);
    if (jsonStr.length < 95000) {
      cache.put(cacheKey, jsonStr, 600); // Lưu 10 phút
    }
  } catch(e) {
    Logger.log("Lỗi ghi cache cho sheet " + sheetName + ": " + e.toString());
  }
  return values;
}

// Xóa cache của 1 sheet khi có bất kỳ thay đổi ghi/xóa nào
function clearSheetCache(sheetName) {
  try {
    var cache = CacheService.getScriptCache();
    var suffix = sheetName.replace(/\s+/g, "_");
    cache.remove("sheet_display_" + suffix);
    cache.remove("sheet_values_" + suffix);
    
    // Đồng thời xóa cache liên quan của Admin dashboard vì admin dùng nhiều nguồn dữ liệu gộp
    cache.remove("admin_dashboard_data");
  } catch(e) {
    Logger.log("Lỗi xóa cache: " + e.toString());
  }
}

// --- CÁC HÀM TIỆN ÍCH DÙNG CHUNG ---

// Khởi tạo trang tính 'Mã admin' LUÔN TRÊN SHEET CHÍNH (SpreadsheetApp.getActiveSpreadsheet())
function initAdminSheet(ss) {
  var mainSS = SpreadsheetApp.getActiveSpreadsheet();
  var sheetAdmin = mainSS.getSheetByName('Mã admin');
  if (!sheetAdmin) {
    sheetAdmin = mainSS.insertSheet('Mã admin');
    sheetAdmin.appendRow(["Mã admin", "Họ tên Admin", "SĐT Admin", "Mã PIN Admin"]);
    sheetAdmin.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#FFD23F").setFontColor("#000000");
    sheetAdmin.setFrozenRows(1);
    sheetAdmin.appendRow(["ADM_001", "Quản trị viên", "'0999999999", "123456"]);
    clearSheetCache('Mã admin');
  }
  return sheetAdmin;
}

// Khởi tạo sheet Bài tập
function initHomeworkSheet(ss) {
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Bài tập');
  if (!sheet) {
    sheet = ss.insertSheet('Bài tập');
  }
  if (sheet.getLastRow() === 0 || sheet.getRange(1, 1).getValue() === "") {
    sheet.appendRow([
      "Thời gian nộp",
      "Tên học sinh",
      "Tên bài học",
      "Link Google Drive liên kết",
      "Mã bài tập",
      "Ngày nộp",
      "Trạng thái nộp"
    ]);
    sheet.getRange("A1:G1").setFontWeight("bold").setBackground("#F3F4F6").setFontFamily("Arial");
    clearSheetCache('Bài tập');
  }
  return sheet;
}

// Khởi tạo sheet Bài tập giao
function initAssignedHwSheet(ss) {
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Bài tập giao');
  if (!sheet) {
    sheet = ss.insertSheet('Bài tập giao');
  }
  if (sheet.getLastRow() === 0 || sheet.getRange(1, 1).getValue() === "") {
    sheet.appendRow([
      "Thời gian giao",
      "Tên học sinh",
      "Tên bài tập",
      "Ngày phát hành",
      "Link file bài tập",
      "Mã bài tập",
      "Trạng thái",
      "Thời gian xóa",
      "Gia sư giao",
      "Link liên kết"
    ]);
    sheet.getRange("A1:J1").setFontWeight("bold").setBackground("#E2D1FF").setFontFamily("Arial");
    clearSheetCache('Bài tập giao');
  } else {
    // Tự động bổ sung cột 10 nếu chưa có (tương thích ngược)
    if (sheet.getLastColumn() < 10) {
      sheet.getRange(1, 10).setValue("Link liên kết").setFontWeight("bold").setBackground("#E2D1FF").setFontFamily("Arial");
      clearSheetCache('Bài tập giao');
    }
  }
  return sheet;
}

// Helper cộng thêm 1 tháng cho định dạng ngày dd/MM/yyyy
function addOneMonthToDateString(dateStr) {
  try {
    var parts = dateStr.split("/");
    if (parts.length === 3) {
      var d = parseInt(parts[0], 10);
      var m = parseInt(parts[1], 10) - 1; // Tháng tính từ 0
      var y = parseInt(parts[2], 10);
      var dateObj = new Date(y, m, d);
      dateObj.setMonth(dateObj.getMonth() + 1);
      
      var day = String(dateObj.getDate());
      if (day.length === 1) day = "0" + day;
      var month = String(dateObj.getMonth() + 1);
      if (month.length === 1) month = "0" + month;
      var year = dateObj.getFullYear();
      
      return day + "/" + month + "/" + year;
    }
  } catch (e) {
    Logger.log("Lỗi addOneMonthToDateString: " + e.toString());
  }
  return dateStr;
}

// Ghi nhật ký biến động thùng rác (Xóa tạm thời / Khôi phục / Xóa vĩnh viễn)
function writeTrashLog(ss, type, action, rowData) {
  try {
    var sheetTrash = ss.getSheetByName('Thùng rác');
    if (!sheetTrash) {
      sheetTrash = ss.insertSheet('Thùng rác');
    }
    if (sheetTrash.getLastRow() === 0 || sheetTrash.getRange(1, 1).getValue() === "") {
      sheetTrash.appendRow([
        "Thời gian ghi nhận", 
        "Loại đối tượng", 
        "Hành động", 
        "Số điện thoại", 
        "Tên đối tượng", 
        "Số điện thoại liên quan", 
        "Dữ liệu dòng gốc (JSON)"
      ]);
      sheetTrash.getRange("A1:G1").setFontWeight("bold").setBackground("#F3F4F6").setFontFamily("Arial");
    }
    
    var now = new Date();
    var dateString = Utilities.formatDate(now, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
    
    var phone = "";
    var name = "";
    var relatedPhone = "";
    
    if (type === "Học sinh") {
      phone = (rowData.length > 3) ? String(rowData[3]).trim() : "";
      name = (rowData.length > 2) ? String(rowData[2]).trim() : "";
      relatedPhone = (rowData.length > 6) ? String(rowData[6]).trim() : "";
    } else if (type === "Gia sư") {
      phone = (rowData.length > 2) ? String(rowData[2]).trim() : "";
      name = (rowData.length > 1) ? String(rowData[1]).trim() : "";
      relatedPhone = "";
    } else if (type === "Bài tập") {
      phone = (rowData.length > 4) ? String(rowData[4]).trim() : ""; // Mã bài tập
      name = (rowData.length > 1) ? String(rowData[1]).trim() : "";  // Tên học sinh
      relatedPhone = (rowData.length > 2) ? String(rowData[2]).trim() : ""; // Tên bài học
    } else if (type === "Ý kiến phụ huynh") {
      phone = (rowData.length > 1) ? String(rowData[1]).trim() : ""; // Số điện thoại học sinh
      name = (rowData.length > 2) ? String(rowData[2]).trim() : "";  // Tên học sinh
      relatedPhone = "";
    }
    
    var jsonData = JSON.stringify(rowData);
    sheetTrash.appendRow([dateString, type, action, phone, name, relatedPhone, jsonData]);
    
    var lastRow = sheetTrash.getLastRow();
    sheetTrash.getRange(lastRow, 1, 1, 7).setFontFamily("Arial");
    
    clearSheetCache('Thùng rác');
  } catch (e) {
    Logger.log("Lỗi ghi nhật ký thùng rác: " + e.toString());
  }
}

// Helper: Lấy chỉ số các cột dựa trên tên tiêu đề hàng 1 của sheet
function getHeaderIndices(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return {};
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var indices = {};
  for (var i = 0; i < headers.length; i++) {
    var title = headers[i] ? headers[i].toString().trim() : "";
    if (title !== "") {
      indices[title] = i;
    }
  }
  return indices;
}

// Helper: Ghi dữ liệu vào dòng mới theo đúng cột tiêu đề
function writeRowWithHeaders(sheet, headerMap, rowDataMap) {
  var nextRow = sheet.getLastRow() + 1;
  for (var key in rowDataMap) {
    var colIdx = headerMap[key];
    if (colIdx !== undefined) {
      sheet.getRange(nextRow, colIdx + 1).setValue(rowDataMap[key]);
    }
  }
  return nextRow;
}

// Trích xuất ID file từ URL
function extractFileIdFromUrl(url) {
  if (!url) return null;
  var matches = url.match(/[-\w]{25,}/);
  return matches ? matches[0] : null;
}

// Phân tích chuỗi ngày sang đối tượng Date trong Apps Script
function parseAppScriptDate(dateStr) {
  try {
    if (!dateStr) return null;
    var parts = dateStr.split(" ");
    var dateParts = parts[0].split("/");
    if (dateParts.length === 3) {
      var day = parseInt(dateParts[0]);
      var month = parseInt(dateParts[1]) - 1;
      var year = parseInt(dateParts[2]);
      
      var hour = 0, min = 0, sec = 0;
      if (parts.length > 1) {
        var timeParts = parts[1].split(":");
        hour = parseInt(timeParts[0] || "0");
        min = parseInt(timeParts[1] || "0");
        sec = parseInt(timeParts[2] || "0");
      }
      return new Date(year, month, day, hour, min, sec);
    }
    var parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) return parsed;
  } catch (err) {}
  return null;
}

// Chuẩn hóa mã bài tập
function normalizeMa(ma) {
  if (!ma) return "";
  var clean = String(ma).trim().toUpperCase();
  // Loại bỏ ký tự nháy đơn ở đầu nếu có
  if (clean.indexOf("'") === 0) {
    clean = clean.substring(1);
  }
  // Nếu là mã số thuần (chỉ chứa chữ số), bỏ các số 0 ở đầu để so sánh giá trị số tương đương
  if (/^\d+$/.test(clean)) {
    return String(Number(clean));
  }
  return clean;
}

// Phân tích tháng/năm từ các định dạng chuỗi ngày khác nhau
function parseMonthYearFromDateStr(dateStr) {
  if (!dateStr) return null;
  var clean = String(dateStr).split(" ")[0].trim();
  if (!clean) return null;
  
  var parts = clean.split(/[-/]/);
  var month = -1;
  var year = new Date().getFullYear();
  
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      month = parseInt(parts[1], 10);
      year = parseInt(parts[0], 10);
    } else {
      month = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
    }
  } else if (parts.length === 2) {
    var p0 = parseInt(parts[0], 10);
    var p1 = parseInt(parts[1], 10);
    if (parts[0].length === 4) {
      month = p1;
      year = p0;
    } else if (parts[1].length === 4) {
      month = p0;
      year = p1;
    } else {
      month = p1;
      year = new Date().getFullYear();
    }
  }
  
  if (isNaN(month) || month < 1 || month > 12 || isNaN(year)) {
    return null;
  }
  return "Tháng " + month + "/" + year;
}

// Lưu file vào Google Drive và trả về URL (Mục đích dự phòng)
function saveFileToDrive(studentName, lessonName, fileBase64, fileName, mimeType) {
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
  
  var fileData = Utilities.base64Decode(fileBase64);
  var ext = "";
  var lastDot = fileName.lastIndexOf(".");
  if (lastDot !== -1) {
    ext = fileName.substring(lastDot);
  } else {
    if (mimeType === "application/pdf") ext = ".pdf";
    else if (mimeType === "image/png") ext = ".png";
    else if (mimeType === "image/jpeg" || mimeType === "image/jpg") ext = ".jpg";
    else if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") ext = ".docx";
  }
  
  var now = new Date();
  var dateStrForFile = Utilities.formatDate(now, Session.getScriptTimeZone(), "dd-MM-yyyy");
  var newFileName = studentName + " - " + lessonName + " - " + dateStrForFile + ext;
  
  var blob = Utilities.newBlob(fileData, mimeType, newFileName);
  var file = studentFolder.createFile(blob);
  
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (sharingErr) {
    Logger.log("Không thể chia sẻ file công khai (Bỏ qua): " + sharingErr.toString());
  }
  
  return file.getUrl();
}

// Định dạng toàn bộ các sheet trong file (từ dòng 2 trở đi)
function formatAllSheets() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheets = ss.getSheets();
    for (var i = 0; i < sheets.length; i++) {
      formatSheetFromRow2(sheets[i]);
    }
  } catch (e) {
    Logger.log("Lỗi định dạng toàn bộ sheet: " + e.toString());
  }
}

// Định dạng một sheet cụ thể (từ dòng 2 trở đi)
function formatSheetFromRow2(sheet) {
  if (!sheet) return;
  try {
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow >= 2 && lastCol >= 1) {
      sheet.getRange(2, 1, lastRow - 1, lastCol)
           .setFontFamily("Arial")
           .setFontSize(11)
           .setHorizontalAlignment("center")
           .setVerticalAlignment("middle");
    }
  } catch (e) {
    Logger.log("Lỗi định dạng sheet " + sheet.getName() + ": " + e.toString());
  }
}

// Simple Trigger onEdit chạy tự động khi người dùng sửa tay trên sheet
function onEdit(e) {
  if (!e) return;
  try {
    var range = e.range;
    var startRow = range.getRow();
    var endRow = range.getLastRow();
    var sheet = range.getSheet();
    
    if (startRow === 1) {
      if (endRow > 1) {
        var numRows = range.getNumRows();
        var dataRange = sheet.getRange(2, range.getColumn(), numRows - 1, range.getNumColumns());
        dataRange.setFontFamily("Arial")
                 .setFontSize(11)
                 .setHorizontalAlignment("center")
                 .setVerticalAlignment("middle");
      }
    } else {
      range.setFontFamily("Arial")
           .setFontSize(11)
           .setHorizontalAlignment("center")
           .setVerticalAlignment("middle");
    }
  } catch (err) {
    Logger.log("Lỗi onEdit: " + err.toString());
  }
}


// Xóa phản hồi cũ hơn 10 ngày
function cleanupOldFeedback(sheet, dateColumnIndex) {
  try {
    if (!sheet) return;
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return;
    
    var tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    
    for (var i = data.length - 1; i >= 1; i--) {
      var dateVal = data[i][dateColumnIndex];
      if (dateVal instanceof Date) {
        if (dateVal < tenDaysAgo) {
          sheet.deleteRow(i + 1);
        }
      } else if (typeof dateVal === 'string' && dateVal.length > 0) {
        var parsedDate = new Date(dateVal);
        if (!isNaN(parsedDate.getTime()) && parsedDate < tenDaysAgo) {
          sheet.deleteRow(i + 1);
        }
      }
    }
  } catch(e) {}
}
