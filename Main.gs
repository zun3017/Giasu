// ==========================================
// CENTRAL WEB APP ROUTER & AUTHENTICATION
// ==========================================

function doGet(e) {
  var page = (e && e.parameter && e.parameter.p) ? e.parameter.p : 'index';
  try {
    return HtmlService.createHtmlOutputFromFile(page)
        .setTitle('Quản lý & Tra cứu học tập')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } catch (err) {
    try {
      return HtmlService.createHtmlOutputFromFile('Index')
          .setTitle('Quản lý & Tra cứu học tập')
          .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
          .addMetaTag('viewport', 'width=device-width, initial-scale=1');
    } catch (err2) {
      return HtmlService.createHtmlOutput(
        '<div style="font-family: sans-serif; padding: 30px; text-align: center;">' +
        '<h2 style="color: #EF4444;">⚠️ Lỗi chưa tạo file giao diện index trên Google Apps Script</h2>' +
        '<p style="color: #4B5563; font-size: 15px;">Trên trình duyệt Google Apps Script Editor online, bạn cần tạo thêm 1 file HTML đặt tên là <b>index</b> và dán nội dung từ file <code>index.html</code> vào nhé!</p>' +
        '</div>'
      );
    }
  }
}

function doPost(e) {
  try {
    var contents = (e && e.postData && e.postData.contents) ? e.postData.contents : "{}";
    var data = JSON.parse(contents);
    var funcName = data.functionName;
    var args = data.arguments || [];
    
    if (funcName && typeof this[funcName] === 'function') {
      var result = this[funcName].apply(this, args);
      return ContentService.createTextOutput(JSON.stringify({ result: result }))
          .setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({ error: "Hàm '" + funcName + "' không tồn tại trên server backend." }))
          .setMimeType(ContentService.MimeType.JSON);
    }
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
        .setMimeType(ContentService.MimeType.JSON);
  }
}

function normalizePhone(p) {
  if (!p) return "";
  var clean = String(p).replace(/\D/g, "");
  if (clean.length > 1 && clean.charAt(0) === '0') {
    clean = clean.substring(1);
  }
  return clean;
}

// Hàm xác thực đăng nhập trung tâm (Gia sư, Lớp học, Admin, Phụ huynh)
function loginSystem(phone, pin, childName) {
  var ssMain = SpreadsheetApp.getActiveSpreadsheet(); // SHEET CHÍNH DÀNH CHO GIA SƯ 1-1 / ADMIN
  var ssClass = (typeof getClassSpreadsheet === 'function') ? getClassSpreadsheet() : ssMain; // SHEET LỚP HỌC NHÓM
  
  // Tự động khởi tạo sheet Admin trên SHEET CHÍNH nếu chưa có
  initAdminSheet(ssMain);
  
  var rawInput = String(phone || "").trim();
  var normPhone = normalizePhone(rawInput);
  if (rawInput === "") {
    return { error: 'Vui lòng nhập Số điện thoại hoặc Mã học sinh để đăng nhập.' };
  }

  // --- ƯU TIÊN A: Nếu có truyền mã PIN (Đăng nhập Gia sư / Admin) ---
  if (pin && String(pin).trim() !== "") {
    var phoneFoundInStaff = false;

    // 1. Thử đối chiếu với quyền Admin trên SHEET CHÍNH trước
    var sheetAdmin = ssMain.getSheetByName('Mã admin');
    if (sheetAdmin) {
      var dataAdmin = sheetAdmin.getDataRange().getDisplayValues();
      for (var i = 1; i < dataAdmin.length; i++) {
        var adminPhone = normalizePhone(dataAdmin[i][2]);
        if (adminPhone !== "" && adminPhone === normPhone) {
          phoneFoundInStaff = true;
          var trueAdminPin = String(dataAdmin[i][3]).trim();
          if (String(pin).trim() === trueAdminPin) {
            return {
              role: 'admin',
              thongBao: "Đăng nhập với quyền Admin thành công!",
              data: getAdminDashboardData()
            };
          }
        }
      }
    }

    // 2. Thử đối chiếu với quyền Gia sư trên SHEET CHÍNH
    var sheetGS = ssMain.getSheetByName('Mã gia sư');
    if (sheetGS) {
      var dataGS = sheetGS.getDataRange().getDisplayValues();
      for (var i = 1; i < dataGS.length; i++) {
        var gsPhone = normalizePhone(dataGS[i][2]);
        if (gsPhone !== "" && gsPhone === normPhone) {
          var tDelDate = (dataGS[i].length > 5) ? dataGS[i][5].trim() : "";
          if (tDelDate !== "") continue;
          phoneFoundInStaff = true;
          var trueTutorPin = String(dataGS[i][3]).trim();
          if (String(pin).trim() === trueTutorPin) {
            var tStatus = (dataGS[i].length > 9) ? dataGS[i][9].trim() : "";
            if (tStatus === "Vô hiệu hóa") {
              return { error: 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ Admin!' };
            }
            return { 
              role: 'tutor', 
              thongBao: "Đăng nhập với quyền Gia sư thành công!", 
              data: getTutorDashboardData(phone, dataGS[i], ss) 
            };
          }
        }
      }
    }

    // Nếu SĐT có trong danh sách Gia sư/Admin nhưng nhập sai mã PIN
    if (phoneFoundInStaff) {
      return { error: 'Mã PIN không chính xác!' };
    }
  }

  // --- B: Thu thập học sinh trùng SĐT phụ huynh (Đăng nhập Phụ huynh / Học sinh) ---
  var matches = [];
  var rawLower = rawInput.toLowerCase();
  
  var sheetHS = ssMain.getSheetByName('Mã học sinh');
  if (sheetHS) {
    var dataHS = sheetHS.getDataRange().getDisplayValues();
    for (var i = 1; i < dataHS.length; i++) {
      if (!dataHS[i] || dataHS[i].length < 1) continue;
      var delDate = (dataHS[i].length > 8) ? String(dataHS[i][8]).trim() : "";
      if (delDate !== "") continue; // Skip soft-deleted students
      
      var hsId = String(dataHS[i][0] || "").trim();
      var hsName = String(dataHS[i][2] || "").trim();
      var isMatch = false;

      for (var col = 0; col < dataHS[i].length; col++) {
        var val = String(dataHS[i][col] || "").trim();
        if (val === "") continue;
        if (normPhone !== "" && normalizePhone(val) === normPhone) {
          isMatch = true;
          break;
        }
        if (val.toLowerCase() === rawLower) {
          isMatch = true;
          break;
        }
      }

      if (isMatch) {
        matches.push({
          source: 'tutor',
          rowData: dataHS[i],
          name: hsName || hsId,
          id: hsId
        });
      }
    }
  }

  var sheetClassStudents = ssClass.getSheetByName('Học sinh lớp học');
  if (sheetClassStudents) {
    var dataCS = sheetClassStudents.getDataRange().getDisplayValues();
    for (var i = 1; i < dataCS.length; i++) {
      if (!dataCS[i] || dataCS[i].length < 1) continue;
      var delDateCS = (dataCS[i].length > 8) ? String(dataCS[i][8]).trim() : "";
      if (delDateCS !== "") continue;
      
      var csId = String(dataCS[i][0] || "").trim();
      var csName = String(dataCS[i][1] || "").trim();
      var isMatch = false;

      for (var col = 0; col < dataCS[i].length; col++) {
        var val = String(dataCS[i][col] || "").trim();
        if (val === "") continue;
        if (normPhone !== "" && normalizePhone(val) === normPhone) {
          isMatch = true;
          break;
        }
        if (val.toLowerCase() === rawLower) {
          isMatch = true;
          break;
        }
      }

      if (isMatch) {
        matches.push({
          source: 'class',
          rowData: dataCS[i],
          name: csName || csId,
          id: csId
        });
      }
    }
  }

  // Phân luồng đăng nhập học sinh
  if (matches.length > 0) {
    if (childName) {
      var target = matches.find(function(m) { return m.name === childName || m.id === childName; });
      if (target) {
        if (target.source === 'tutor') {
          return {
            role: 'student',
            thongBao: "Đăng nhập thành công",
            data: traCuuDuLieuHocSinh(phone, target.rowData, ss)
          };
        } else {
          return {
            role: 'student',
            thongBao: "Đăng nhập thành công",
            data: traCuuDuLieuHocSinhLop(phone, target.rowData, ss)
          };
        }
      }
    }

    if (matches.length > 1) {
      var childrenList = matches.map(function(m) { return { name: m.name, code: m.id }; });
      return {
        role: 'student',
        multipleStudents: true,
        childrenList: childrenList
      };
    }

    var single = matches[0];
    if (single.source === 'tutor') {
      return {
        role: 'student',
        thongBao: "Đăng nhập thành công",
        data: traCuuDuLieuHocSinh(phone, single.rowData, ss)
      };
    } else {
      return {
        role: 'student',
        thongBao: "Đăng nhập thành công",
        data: traCuuDuLieuHocSinhLop(phone, single.rowData, ss)
      };
    }
  }

  // Nếu không truyền PIN và không tìm thấy học sinh
  var sheetAdmin = ss.getSheetByName('Mã admin');
  if (sheetAdmin) {
    var dataAdmin = sheetAdmin.getDataRange().getDisplayValues();
    for (var i = 1; i < dataAdmin.length; i++) {
      var adminPhone = normalizePhone(dataAdmin[i][2]);
      if (adminPhone !== "" && adminPhone === normPhone) {
        return { requiresPin: true, name: dataAdmin[i][1] };
      }
    }
  }
  
  var sheetGS = ss.getSheetByName('Mã gia sư');
  if (sheetGS) {
    var dataGS = sheetGS.getDataRange().getDisplayValues();
    for (var i = 1; i < dataGS.length; i++) {
      var gsPhone = normalizePhone(dataGS[i][2]);
      if (gsPhone !== "" && gsPhone === normPhone) {
        var tDelDate = (dataGS[i].length > 5) ? dataGS[i][5].trim() : "";
        if (tDelDate === "") {
          return { requiresPin: true, name: dataGS[i][1] };
        }
      }
    }
  }

  return { error: 'Số điện thoại không tồn tại trên hệ thống.' };
}
