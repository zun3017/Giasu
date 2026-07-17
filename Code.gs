function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('Quản lý & Tra cứu học tập')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Chuẩn hóa số điện thoại loại bỏ ký tự đặc biệt và số 0 ở đầu để so khớp chính xác
function normalizePhone(p) {
  if (!p) return "";
  var clean = String(p).replace(/\D/g, "");
  if (clean.length > 1 && clean.charAt(0) === '0') {
    clean = clean.substring(1);
  }
  return clean;
}

function loginSystem(phone, pin) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Tự động khởi tạo sheet Admin nếu chưa có
  initAdminSheet(ss);
  
  var normPhone = normalizePhone(phone);
  if (normPhone === "") {
    return { error: 'Số điện thoại không hợp lệ.' };
  }
  
  // 1. Quét Học Sinh trước (Ưu tiên, không cần PIN)
  var sheetHS = ss.getSheetByName('Mã học sinh');
  if (sheetHS) {
    var dataHS = sheetHS.getDataRange().getDisplayValues();
    for (var i = 1; i < dataHS.length; i++) {
      var hsPhone = normalizePhone(dataHS[i][3]);
      if (hsPhone !== "" && hsPhone === normPhone) { 
        return { 
          role: 'student', 
          thongBao: "Đăng nhập thành công", 
          data: traCuuDuLieuHocSinh(phone, dataHS[i], ss) 
        };
      }
    }
  }

  // Nếu không truyền PIN lên, kiểm tra xem số điện thoại có thuộc diện cần nhập PIN không
  if (!pin) {
    // Kiểm tra xem SĐT có nằm trong danh sách Admin không
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
    
    // Kiểm tra SĐT có trong danh sách Gia sư không
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

  // Nếu đã truyền mã PIN, xác thực phân luồng dựa trên PIN (Trùng SĐT vẫn nhận diện đúng vai trò)
  var phoneFound = false; // Cờ kiểm tra SĐT có tồn tại trong hệ thống không

  // A. Thử đối chiếu với quyền Admin trước
  var sheetAdmin = ss.getSheetByName('Mã admin');
  if (sheetAdmin) {
    var dataAdmin = sheetAdmin.getDataRange().getDisplayValues();
    for (var i = 1; i < dataAdmin.length; i++) {
      var adminPhone = normalizePhone(dataAdmin[i][2]);
      if (adminPhone !== "" && adminPhone === normPhone) {
        phoneFound = true;
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

  // B. Thử đối chiếu với quyền Gia sư sau
  var sheetGS = ss.getSheetByName('Mã gia sư');
  if (sheetGS) {
    var dataGS = sheetGS.getDataRange().getDisplayValues();
    for (var i = 1; i < dataGS.length; i++) {
      var gsPhone = normalizePhone(dataGS[i][2]);
      if (gsPhone !== "" && gsPhone === normPhone) {
        var tDelDate = (dataGS[i].length > 5) ? dataGS[i][5].trim() : "";
        if (tDelDate !== "") continue;
        phoneFound = true;
        var trueTutorPin = String(dataGS[i][3]).trim();
        if (String(pin).trim() === trueTutorPin) {
          return { 
            role: 'tutor', 
            thongBao: "Đăng nhập với quyền Gia sư thành công!", 
            data: getTutorDashboardData(phone, dataGS[i], ss) 
          };
        }
      }
    }
  }

  // Phân biệt lỗi: SĐT không tồn tại vs PIN sai
  if (!phoneFound) {
    return { error: 'Số điện thoại không tồn tại trên hệ thống.' };
  }
  return { error: 'Mã PIN không chính xác!' };
}

// Lấy dữ liệu cho Học sinh (Giữ nguyên logic cũ)
function traCuuDuLieuHocSinh(phone, hsRow, ss) {
  var studentName = hsRow[2];
  var ketQua = {
    timThay: true,
    tenHocSinh: studentName,
    thongBaoHocSinh: (hsRow.length > 4) ? hsRow[4].trim() : "",
    lichSuHocTap: [],
    baiTap: []
  };

  var normPhone = normalizePhone(phone);

  // 1. Lấy Lịch Sử Học Tập
  var sheetDanhGia = ss.getSheetByName('Bảng đánh giá học tập '); 
  if (sheetDanhGia) {
    var dataDanhGia = sheetDanhGia.getDataRange().getDisplayValues();
    
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

  // 2. Lấy Bài Kiểm Tra
  var sheetBaiTap = ss.getSheetByName('Bài kiểm tra');
  if (sheetBaiTap) {
    var dataBaiTap = sheetBaiTap.getDataRange().getDisplayValues();
    
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
  return ketQua;
}

// Lấy dữ liệu tổng quan cho Gia sư
function getTutorDashboardData(tutorPhone, gsRow, ss) {
  // Cập nhật ngày hoạt động cuối cùng của Gia sư ngầm
  updateTutorLastActive(ss, tutorPhone);
  
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

  var normTutorPhone = normalizePhone(tutorPhone);

  var sheetHS = ss.getSheetByName('Mã học sinh');
  if (sheetHS) {
    clearOldDeletedStudents(sheetHS);
    var dataHS = sheetHS.getDataRange().getDisplayValues();
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
            tuition: dataHS[i][5],
            maBaiTap: maHw,
            thongBao: thongBao
          });
        } else {
          tutorData.deletedStudents.push({
            phone: dataHS[i][3],
            name: dataHS[i][2],
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
    var dataDG = sheetDG.getDataRange().getDisplayValues();
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
  
  return tutorData;
}

// Lấy Thời Khóa Biểu
function getTutorSchedule(tutorPhone) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetLich = ss.getSheetByName('Lịch học');
  if (!sheetLich) return { error: "Chưa tạo sheet 'Lịch học'" };
  
  var dataLich = sheetLich.getDataRange().getDisplayValues();
  var schedule = [];
  var normTutorPhone = normalizePhone(tutorPhone);

  // Headers: SĐT Gia sư | Tên học sinh | Tên gia sư | Thứ hai | Thứ ba | Thứ tư | Thứ năm | Thứ sáu | Thứ bảy | Chủ nhật
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
  return schedule;
}

// Lấy toàn bộ log học tập của 1 học sinh để frontend tự vẽ biểu đồ & xuất hóa đơn
function getStudentDetailsForTutor(studentPhone, studentName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetDanhGia = ss.getSheetByName('Bảng đánh giá học tập ');
  if (!sheetDanhGia) return { error: "Không tìm thấy Bảng đánh giá học tập" };
  
  var dataDanhGia = sheetDanhGia.getDataRange().getDisplayValues();
  var logs = [];
  var normStudentPhone = normalizePhone(studentPhone);
  
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
          btvn: dataDanhGia[i][6], // Đánh giá bài tập về nhà
          diemDauGio: dataDanhGia[i][7],
          diemDinhKi: dataDanhGia[i][8],
          trangThai: dataDanhGia[i][9], // Trạng thái học (Có mặt/Vắng...)
          tienDong: (dataDanhGia[i].length > 10) ? dataDanhGia[i][10] : "" // Tiền đóng ("Đã đóng" hoặc trống)
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
  
  return { logs: logs };
}

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
    return { thanhCong: true };
  } catch (error) {
    return { thanhCong: false, thongBao: error.toString() };
  }
}

// Thêm học sinh mới kèm tự động cấp phát 15 dòng
function themHocSinhMoi(tutorPhone, phuHuynhName, studentName, studentPhone, tuition, maBaiTap, thongBao) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetHS = ss.getSheetByName('Mã học sinh');
    if (!sheetHS) return { error: "Không tìm thấy sheet 'Mã học sinh'" };
    
    // Kiểm tra xem SĐT học sinh (SĐT phụ huynh) đã tồn tại chưa
    var dataHS = sheetHS.getDataRange().getDisplayValues();
    for (var i = 1; i < dataHS.length; i++) {
      if (String(dataHS[i][3]).trim() === String(studentPhone).trim()) {
        return { error: "Số điện thoại phụ huynh này đã tồn tại trên hệ thống." };
      }
    }
    
    // Kiểm tra trùng Mã bài tập (nếu có nhập)
    var cleanMa = String(maBaiTap || "").trim().toUpperCase();
    if (cleanMa !== "") {
      for (var i = 1; i < dataHS.length; i++) {
        if (dataHS[i].length > 7 && String(dataHS[i][7]).trim().toUpperCase() === cleanMa) {
          return { error: "Mã bài tập '" + cleanMa + "' này đã được cấp cho học sinh khác." };
        }
      }
    }
    
    // Tính STT tiếp theo
    var nextStt = 1;
    if (dataHS.length > 1) {
      var lastStt = parseInt(dataHS[dataHS.length - 1][0]);
      if (!isNaN(lastStt)) nextStt = lastStt + 1;
    }
    
    // Ghi vào sheet Mã học sinh
    sheetHS.appendRow([nextStt, phuHuynhName, studentName, "'" + studentPhone, thongBao || "", tuition, "'" + tutorPhone, "'" + cleanMa]);
    var lastRowHS = sheetHS.getLastRow();
    sheetHS.getRange(lastRowHS, 1, 1, 8).setFontFamily("Arial");
    
    // Phân bổ 15 dòng trống bên sheet Bảng đánh giá học tập
    var sheetDG = ss.getSheetByName('Bảng đánh giá học tập ');
    if (sheetDG) {
      // Chèn 1 dòng trống làm khoảng cách, sau đó chèn 15 dòng pre-filled Tên học sinh
      sheetDG.appendRow(["", "", "", "", "", "", "", "", "", "", "", ""]);
      var lastRowDGSpacer = sheetDG.getLastRow();
      sheetDG.getRange(lastRowDGSpacer, 1, 1, 12).setFontFamily("Arial");
      
      for (var k = 0; k < 15; k++) {
        sheetDG.appendRow(["", studentName, "", "", "", "", "", "", "", "", "", ""]);
        var lastRowDGFill = sheetDG.getLastRow();
        sheetDG.getRange(lastRowDGFill, 1, 1, 12).setFontFamily("Arial");
      }
    }
    
    return { success: true };
  } catch (e) {
    return { error: "Lỗi backend: " + e.toString() };
  }
}

// Sửa thông tin học sinh
function suaThongTinHocSinh(oldPhone, phuHuynhName, studentName, studentPhone, tuition, maBaiTap, thongBao) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetHS = ss.getSheetByName('Mã học sinh');
    if (!sheetHS) return { error: "Không tìm thấy sheet 'Mã học sinh'" };
    
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
    
    // Nếu đổi SĐT, kiểm tra xem SĐT mới có trùng với ai khác không
    if (normOldPhone !== normStudentPhone) {
      for (var i = 1; i < dataHS.length; i++) {
        if (normalizePhone(dataHS[i][3]) === normStudentPhone) {
          return { error: "Số điện thoại phụ huynh mới đã tồn tại trên hệ thống." };
        }
      }
    }
    
    // Kiểm tra trùng Mã bài tập (nếu có nhập)
    var cleanMa = String(maBaiTap || "").trim().toUpperCase();
    if (cleanMa !== "") {
      for (var i = 1; i < dataHS.length; i++) {
        if (normalizePhone(dataHS[i][3]) !== normOldPhone && dataHS[i].length > 7 && String(dataHS[i][7]).trim().toUpperCase() === cleanMa) {
          return { error: "Mã bài tập '" + cleanMa + "' này đã được cấp cho học sinh khác." };
        }
      }
    }
    
    // Cập nhật sheet Mã học sinh
    sheetHS.getRange(rowIndex, 2).setValue(phuHuynhName).setFontFamily("Arial");
    sheetHS.getRange(rowIndex, 3).setValue(studentName).setFontFamily("Arial");
    sheetHS.getRange(rowIndex, 4).setValue("'" + studentPhone).setFontFamily("Arial");
    sheetHS.getRange(rowIndex, 5).setValue(thongBao || "").setFontFamily("Arial"); // Lưu thông báo
    sheetHS.getRange(rowIndex, 6).setValue(tuition).setFontFamily("Arial");
    sheetHS.getRange(rowIndex, 8).setValue("'" + cleanMa).setFontFamily("Arial"); // Lưu Mã bài tập
    
    // Nếu SĐT hoặc Tên học sinh hoặc Mã bài tập thay đổi, đồng bộ hóa sang các bảng khác
    var oldName = dataHS[rowIndex-1][2];
    var oldMaHw = (dataHS[rowIndex-1].length > 7) ? String(dataHS[rowIndex-1][7]).trim().toUpperCase() : "";
    var isNameChanged = (oldName !== studentName);
    var isPhoneChanged = (normOldPhone !== normStudentPhone);
    var isMaHwChanged = (oldMaHw !== cleanMa);
    
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
      }
      
      // 3. Đồng bộ sang Lịch học (chỉ có Tên học sinh)
      if (isNameChanged) {
        var sheetLH = ss.getSheetByName('Lịch học');
        if (sheetLH) {
          var dataLH = sheetLH.getDataRange().getValues();
          for (var m = 1; m < dataLH.length; m++) {
            if (String(dataLH[m][1]).trim() === String(oldName).trim()) {
              sheetLH.getRange(m + 1, 2).setValue(studentName).setFontFamily("Arial");
            }
          }
        }
      }
    }
    
    // Đồng bộ Mã bài tập mới sang sheet 'Bài tập' (nếu có đổi mã)
    if (isMaHwChanged && oldMaHw !== "") {
      var sheetHW = ss.getSheetByName('Bài tập');
      if (sheetHW) {
        var dataHW = sheetHW.getDataRange().getValues();
        for (var n = 1; n < dataHW.length; n++) {
          if (dataHW[n].length > 4 && String(dataHW[n][4]).trim().toUpperCase() === oldMaHw) {
            sheetHW.getRange(n + 1, 5).setValue("'" + cleanMa).setFontFamily("Arial");
          }
        }
      }
    }
    
    return { success: true };
  } catch (e) {
    return { error: "Lỗi backend: " + e.toString() };
  }
}

// Cập nhật nhanh thông báo phụ huynh/học sinh (việc gấp)
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
    return { success: true };
  } catch (e) {
    return { error: "Lỗi backend: " + e.toString() };
  } finally {
    lock.releaseLock();
  }
}

// Thêm buổi học
function themBuoiHoc(studentPhone, studentName, tuan, ngayDay, monHoc, noiDung, danhGiaBTVN, diemDauGio, diemDinhKi, trangThai) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetDG = ss.getSheetByName('Bảng đánh giá học tập ');
    if (!sheetDG) return { error: "Không tìm thấy sheet 'Bảng đánh giá học tập '" };
    
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
    
    // Áp dụng định dạng phông chữ Arial cho toàn bộ hàng vừa cập nhật
    sheetDG.getRange(targetRowIndex, 1, 1, 12).setFontFamily("Arial");
    
    return { success: true };
  } catch (e) {
    return { error: "Lỗi backend: " + e.toString() };
  }
}

// Cập nhật hồ sơ gia sư & đồng bộ SĐT
function capNhatThongTinGiaSu(tutorPhoneCu, tenMoi, sdtMoi, pinMoi) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetGS = ss.getSheetByName('Mã gia sư');
    if (!sheetGS) return { error: "Không tìm thấy sheet 'Mã gia sư'" };
    
    var dataGS = sheetGS.getDataRange().getDisplayValues();
    var tutorRowIndex = -1;
    for (var i = 1; i < dataGS.length; i++) {
      if (String(dataGS[i][2]).trim() === String(tutorPhoneCu).trim()) {
        tutorRowIndex = i + 1;
        break;
      }
    }
    
    if (tutorRowIndex === -1) return { error: "Không tìm thấy tài khoản gia sư." };
    
    var isPhoneChanged = (String(tutorPhoneCu).trim() !== String(sdtMoi).trim());
    if (isPhoneChanged) {
      for (var i = 1; i < dataGS.length; i++) {
        if (String(dataGS[i][2]).trim() === String(sdtMoi).trim()) {
          return { error: "Số điện thoại mới này đã được đăng ký bởi gia sư khác." };
        }
      }
    }
    
    sheetGS.getRange(tutorRowIndex, 2).setValue(tenMoi).setFontFamily("Arial");
    sheetGS.getRange(tutorRowIndex, 3).setValue("'" + sdtMoi).setFontFamily("Arial");
    sheetGS.getRange(tutorRowIndex, 4).setValue("'" + pinMoi).setFontFamily("Arial");
    
    if (isPhoneChanged) {
      var sheetHS = ss.getSheetByName('Mã học sinh');
      if (sheetHS) {
        var dataHS = sheetHS.getDataRange().getValues();
        for (var j = 1; j < dataHS.length; j++) {
          if (String(dataHS[j][6]).trim() === String(tutorPhoneCu).trim()) {
            sheetHS.getRange(j + 1, 7).setValue("'" + sdtMoi).setFontFamily("Arial");
          }
        }
      }
      
      var sheetLH = ss.getSheetByName('Lịch học');
      if (sheetLH) {
        var dataLH = sheetLH.getDataRange().getValues();
        for (var k = 1; k < dataLH.length; k++) {
          if (String(dataLH[k][0]).trim() === String(tutorPhoneCu).trim()) {
            sheetLH.getRange(k + 1, 1).setValue("'" + sdtMoi).setFontFamily("Arial");
          }
        }
      }
    }
    
    return { success: true };
  } catch (e) {
    return { error: "Lỗi backend: " + e.toString() };
  }
}

function getStudentParentName(studentPhone) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetHS = ss.getSheetByName('Mã học sinh');
  if (sheetHS) {
    var dataHS = sheetHS.getDataRange().getDisplayValues();
    for (var i = 1; i < dataHS.length; i++) {
      if (String(dataHS[i][3]).trim() === String(studentPhone).trim()) {
        return dataHS[i][1];
      }
    }
  }
  return "";
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
    
    // Định dạng phông chữ Arial
    sheetDG.getRange(r, 1, 1, 12).setFontFamily("Arial");
    
    return { success: true };
  } catch (e) {
    return { error: "Lỗi backend: " + e.toString() };
  }
}

// Cập nhật thời khóa biểu của học sinh
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
        var dataGS = sheetGS.getDataRange().getDisplayValues();
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
    
    return { success: true };
  } catch (e) {
    return { error: "Lỗi backend: " + e.toString() };
  }
}

// Tự động dọn dẹp các học sinh đã xóa quá 10 ngày
function clearOldDeletedStudents(sheetHS) {
  try {
    var data = sheetHS.getDataRange().getValues();
    var now = new Date();
    // Vòng lặp ngược để xóa dòng an toàn
    for (var i = data.length - 1; i >= 1; i--) {
      var deletedDateStr = (data[i].length > 8) ? data[i][8] : ""; // Cột I (index 8)
      if (deletedDateStr) {
        // Tách ngày dạng dd/MM/yyyy HH:mm:ss sang đối tượng Date hợp lệ
        var parts = String(deletedDateStr).split(" ");
        if (parts.length >= 1) {
          var dateParts = parts[0].split("/");
          if (dateParts.length === 3) {
            var dd = parseInt(dateParts[0]);
            var mm = parseInt(dateParts[1]) - 1; // 0-indexed month
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
              }
            }
          }
        }
      }
    }
  } catch (err) {
    // Bỏ qua lỗi dọn dẹp để không làm gián đoạn luồng chính
  }
}

// Xóa học sinh tạm thời (đánh dấu ngày xóa)
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
    
    if (rowIndex === -1) {
      return { error: "Không tìm thấy học sinh cần xóa." };
    }
    
    var now = new Date();
    var dateString = Utilities.formatDate(now, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
    sheetHS.getRange(rowIndex, 9).setValue(dateString).setFontFamily("Arial");
    writeTrashLog(ss, "Học sinh", "Xóa tạm thời", targetRowData);
    
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
    
    if (rowIndex === -1) {
      return { error: "Không tìm thấy học sinh để khôi phục." };
    }
    
    sheetHS.getRange(rowIndex, 9).setValue("").setFontFamily("Arial");
    writeTrashLog(ss, "Học sinh", "Khôi phục", targetRowData);
    
    return { success: true };
  } catch (e) {
    return { error: "Lỗi backend: " + e.toString() };
  }
}

// Xóa hoàn toàn một buổi học (dọn dẹp dữ liệu các cột C đến J)
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
    
    sheetDG.getRange(r, 3, 1, 8).setValue("");
    sheetDG.getRange(r, 1, 1, 12).setFontFamily("Arial");
    
    return { success: true };
  } catch (e) {
    return { error: "Lỗi backend: " + e.toString() };
  } finally {
    lock.releaseLock();
  }
}

// Khởi tạo trang tính Admin nếu chưa tồn tại
function initAdminSheet(ss) {
  var sheet = ss.getSheetByName('Mã admin');
  if (!sheet) {
    sheet = ss.insertSheet('Mã admin');
    sheet.appendRow(['STT', 'Tên Admin', 'SĐT Admin', 'Mã PIN']);
    sheet.appendRow([1, 'Chủ cơ sở', "'0987654321", "'123456"]);
    sheet.getRange(1, 1, 2, 4).setFontFamily('Arial');
  }
  return sheet;
}

// Tải toàn bộ dữ liệu báo cáo và đối tượng phục vụ trang quản trị Admin
function getAdminDashboardData() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    initAdminSheet(ss);
    
    var data = {
      tutors: [],
      students: [],
      deletedTutors: [],
      incomeReports: {}
    };
    
    // 1. Tải toàn bộ gia sư
    var sheetGS = ss.getSheetByName('Mã gia sư');
    var tutorMap = {};
    if (sheetGS) {
      clearOldDeletedTutors(sheetGS);
      var dataGS = sheetGS.getDataRange().getDisplayValues();
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
        
        // Tự động điền mặc định nếu gia sư chưa có ngày tạo/hạn đóng phí (do nhập thủ công trên Google Sheet)
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
        
        if (tDelDate === "") {
          data.tutors.push({
            name: tName,
            phone: tPhone,
            pin: tPin,
            qrUrl: tQrUrl,
            createdDate: tCreatedDate,
            nextBillingDate: tNextBillingDate,
            lastActive: tLastActive
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
            lastActive: tLastActive
          });
        }
      }
      if (sheetUpdated) {
        SpreadsheetApp.flush();
      }
    }
    
    // 2. Tải toàn bộ học sinh
    var sheetHS = ss.getSheetByName('Mã học sinh');
    var studentMap = {};
    if (sheetHS) {
      var dataHS = sheetHS.getDataRange().getDisplayValues();
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
      var dataDG = sheetDG.getDataRange().getDisplayValues();
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
    
    // Tải dòng chữ chạy thông báo
    data.marqueeAnnouncement = PropertiesService.getScriptProperties().getProperty('marquee_announcement') || "";
    
    return data;
  } catch (e) {
    return { error: "Lỗi hệ thống Admin: " + e.toString() };
  }
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

// Cập nhật ngày giờ hoạt động cuối cùng của gia sư
function updateTutorLastActive(ss, tutorPhone) {
  try {
    var sheetGS = ss.getSheetByName('Mã gia sư');
    if (!sheetGS) return;
    var dataGS = sheetGS.getDataRange().getDisplayValues();
    for (var i = 1; i < dataGS.length; i++) {
      if (String(dataGS[i][2]).trim() === String(tutorPhone).trim()) {
        var todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");
        sheetGS.getRange(i + 1, 9).setValue(todayStr); // Cột I (9) là lastActive
        break;
      }
    }
  } catch (e) {
    Logger.log("Lỗi cập nhật lastActive: " + e.toString());
  }
}

// Lưu thông tin gia sư (Thêm mới/Cập nhật) từ quyền Admin
function adminLuuGiaSur(oldPhone, name, phone, pin, qrUrl, createdDate, nextBillingDate) {
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
      
      sheetGS.appendRow([nextStt, name, "'" + phone, "'" + pin, qrUrl, "", "'" + regDate, "'" + billDate, ""]);
      var lastRow = sheetGS.getLastRow();
      sheetGS.getRange(lastRow, 1, 1, 9).setFontFamily("Arial");
    }
    return { success: true };
  } catch (e) {
    return { error: "Lỗi backend: " + e.toString() };
  } finally {
    lock.releaseLock();
  }
}

// Admin xác nhận đóng tiền và gia hạn chu kỳ nhắc đóng phí thuê web thêm 1 tháng
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
    
    return { success: true, newBillingDate: newBillDate };
  } catch (e) {
    return { error: "Lỗi gia hạn chu kỳ đóng tiền: " + e.toString() };
  } finally {
    lock.releaseLock();
  }
}

// Lưu dòng chạy chữ thông báo từ Admin gửi cho các Gia sư
function adminLuuMarquee(text) {
  try {
    PropertiesService.getScriptProperties().setProperty('marquee_announcement', text || "");
    return { success: true };
  } catch (e) {
    return { error: "Lỗi lưu thông báo chạy chữ: " + e.toString() };
  }
}

// Lưu thông tin học sinh và phân bổ lớp (Thêm mới/Cập nhật) từ quyền Admin
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
      }
    }
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

// Xác nhận đóng học phí linh hoạt cho các buổi học được chọn
function capNhatDongHocPhiBuoiHoc(rowIndices) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetDG = ss.getSheetByName('Bảng đánh giá học tập ');
    if (!sheetDG) return { error: "Không tìm thấy Bảng đánh giá học tập" };
    
    rowIndices.forEach(function(r) {
      var rowIndex = parseInt(r);
      if (!isNaN(rowIndex) && rowIndex >= 2 && rowIndex <= sheetDG.getLastRow()) {
        sheetDG.getRange(rowIndex, 11).setValue("Đã đóng");
      }
    });
    
    return { success: true };
  } catch (e) {
    return { error: "Lỗi backend: " + e.toString() };
  } finally {
    lock.releaseLock();
  }
}

// Phân tích tháng/năm từ các định dạng chuỗi ngày khác nhau (hỗ trợ YYYY-MM-DD, DD/MM/YYYY, D/M, v.v.)
function parseMonthYearFromDateStr(dateStr) {
  if (!dateStr) return null;
  var clean = String(dateStr).split(" ")[0].trim();
  if (!clean) return null;
  
  var parts = clean.split(/[-/]/);
  var month = -1;
  var year = new Date().getFullYear();
  
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      month = parseInt(parts[1], 10);
      year = parseInt(parts[0], 10);
    } else {
      // DD-MM-YYYY hoặc DD/MM/YYYY
      month = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
    }
  } else if (parts.length === 2) {
    var p0 = parseInt(parts[0], 10);
    var p1 = parseInt(parts[1], 10);
    if (parts[0].length === 4) {
      // YYYY-MM
      month = p1;
      year = p0;
    } else if (parts[1].length === 4) {
      // MM/YYYY
      month = p0;
      year = p1;
    } else {
      // Định dạng D/M hoặc DD/MM (ví dụ "8/6")
      month = p1;
      year = new Date().getFullYear();
    }
  }
  
  if (isNaN(month) || month < 1 || month > 12 || isNaN(year)) {
    return null;
  }
  return "Tháng " + month + "/" + year;
}

// Xóa gia sư tạm thời (đánh dấu ngày xóa)
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
    
    return { success: true };
  } catch (e) {
    return { error: "Lỗi backend: " + e.toString() };
  }
}

// Tự động dọn dẹp các gia sư đã xóa quá 10 ngày
function clearOldDeletedTutors(sheetGS) {
  try {
    var data = sheetGS.getDataRange().getValues();
    var now = new Date();
    // Vòng lặp ngược để xóa dòng an toàn
    for (var i = data.length - 1; i >= 1; i--) {
      var deletedDateStr = data[i][5]; // Cột F (index 5)
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
              }
            }
          }
        }
      }
    }
  } catch (err) {
    // Bỏ qua lỗi
  }
}

// Cập nhật trạng thái đóng học phí hàng loạt (cả đóng và hủy đóng)
function capNhatNhieuDongHocPhi(paidRowIndices, unpaidRowIndices) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetDG = ss.getSheetByName('Bảng đánh giá học tập ');
    if (!sheetDG) return { error: "Không tìm thấy sheet 'Bảng đánh giá học tập '" };
    
    var lastRow = sheetDG.getLastRow();
    
    // Ghi log debug ra ô M1 để dễ dàng kiểm tra xem frontend truyền gì lên backend
    sheetDG.getRange("M1").setValue("DEBUG: paid=" + paidRowIndices.join(",") + " | unpaid=" + unpaidRowIndices.join(","));
    
    // 1. Cập nhật "Đã đóng"
    for (var i = 0; i < paidRowIndices.length; i++) {
      var r = parseInt(paidRowIndices[i]);
      if (!isNaN(r) && r >= 2) {
        sheetDG.getRange(r, 11).setValue("Đã đóng"); // Cột K (cột 11) - Tiền đóng
      }
    }
    
    // 2. Cập nhật "" (Chưa đóng/Hủy đóng)
    for (var i = 0; i < unpaidRowIndices.length; i++) {
      var r = parseInt(unpaidRowIndices[i]);
      if (!isNaN(r) && r >= 2) {
        sheetDG.getRange(r, 11).setValue(""); // Sử dụng setValue("")
        sheetDG.getRange(r, 11).clearContent(); // Kết hợp thêm clearContent() cho chắc chắn
      }
    }
    
    // Định dạng phông chữ Arial cho tất cả dòng bị ảnh hưởng
    var allRows = paidRowIndices.concat(unpaidRowIndices);
    for (var i = 0; i < allRows.length; i++) {
      var r = parseInt(allRows[i]);
      if (!isNaN(r) && r >= 2) {
        sheetDG.getRange(r, 1, 1, 12).setFontFamily("Arial");
      }
    }
    
    SpreadsheetApp.flush(); // Đồng bộ ngay lập tức các thay đổi lên Google Sheets
    return { success: true };
  } catch (e) {
    return { error: "Lỗi backend: " + e.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Xử lý các yêu cầu POST từ GitHub Pages hoặc môi trường ngoài.
 * Đóng vai trò là API Gateway để gọi các hàm tương ứng và trả về JSON.
 */
function doPost(e) {
  try {
    // Phân tích dữ liệu JSON gửi lên
    var requestData = JSON.parse(e.postData.contents);
    var functionName = requestData.functionName;
    var args = requestData.arguments || [];
    
    // Tìm hàm trong phạm vi global của Apps Script
    var global = this || globalThis;
    if (typeof global[functionName] === 'function') {
      var result = global[functionName].apply(null, args);
      
      // Trả về kết quả JSON với cấu hình CORS đầy đủ
      return ContentService.createTextOutput(JSON.stringify({ result: result }))
                           .setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({ error: "Không tìm thấy hàm '" + functionName + "' trên Apps Script." }))
                           .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Lỗi hệ thống: " + error.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

// Ghi nhật ký biến động thùng rác (Xóa tạm thời / Khôi phục / Xóa vĩnh viễn)
function writeTrashLog(ss, type, action, rowData) {
  try {
    var sheetTrash = ss.getSheetByName('Thùng rác');
    if (!sheetTrash) {
      sheetTrash = ss.insertSheet('Thùng rác');
    }
    if (sheetTrash.getLastRow() === 0 || sheetTrash.getRange(1, 1).getValue() === "") {
      // Tự động khởi tạo sheet với font Arial và tiêu đề in đậm
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
  } catch (e) {
    Logger.log("Lỗi ghi nhật ký thùng rác: " + e.toString());
  }
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
  }
  return sheet;
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

// Lưu file vào Google Drive và trả về URL
function saveFileToDrive(studentName, lessonName, fileBase64, fileName, mimeType) {
  var parentFolderId = "1ZKHCDdZzkMqLTV4guvMNkKYbaQHCEGus";
  var parentFolder;
  var driveApp = DriveApp;
  
  try {
    parentFolder = driveApp.getFolderById(parentFolderId);
  } catch (err) {
    // FALLBACK: Tự động tìm hoặc tạo thư mục "BÀI TẬP GIA SƯ" ở gốc Drive của tài khoản chạy script
    var folders = driveApp.getRootFolder().getFoldersByName("BÀI TẬP GIA SƯ");
    if (folders.hasNext()) {
      parentFolder = folders.next();
    } else {
      parentFolder = driveApp.getRootFolder().createFolder("BÀI TẬP GIA SƯ");
    }
  }
  
  // 2. Tìm hoặc tạo thư mục con theo tên học sinh
  var studentFolders = parentFolder.getFoldersByName(studentName);
  var studentFolder;
  if (studentFolders.hasNext()) {
    studentFolder = studentFolders.next();
  } else {
    studentFolder = parentFolder.createFolder(studentName);
  }
  
  // 3. Giải mã file Base64
  var fileData = Utilities.base64Decode(fileBase64);
  
  // 4. Chuẩn hóa tên file: [Tên Học Sinh] - [Tên Bài Học] - [Ngày Nộp].[Đuôi file]
  var ext = "";
  var lastDot = fileName.lastIndexOf(".");
  if (lastDot !== -1) {
    ext = fileName.substring(lastDot);
  } else {
    if (mimeType === "application/pdf") ext = ".pdf";
    else if (mimeType === "image/png") ext = ".png";
    else if (mimeType === "image/jpeg" || mimeType === "image/jpg") ext = ".jpg";
    else if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") ext = ".docx";
    else if (mimeType === "application/msword") ext = ".doc";
  }
  
  var now = new Date();
  var dateStrForFile = Utilities.formatDate(now, Session.getScriptTimeZone(), "dd-MM-yyyy");
  var newFileName = studentName + " - " + lessonName + " - " + dateStrForFile + ext;
  
  // 5. Tạo file trong thư mục học sinh
  var blob = Utilities.newBlob(fileData, mimeType, newFileName);
  var file = studentFolder.createFile(blob);
  
  // 6. Cấp quyền xem cho bất kỳ ai có link (nếu lỗi quyền của tổ chức Workspace thì bỏ qua và tiếp tục)
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (sharingErr) {
    Logger.log("Không thể chia sẻ file công khai (Bỏ qua): " + sharingErr.toString());
  }
  
  return file.getUrl();
}

// Xác thực Mã bài tập (đăng nhập cổng nộp bài bằng mã ở Cột H của Mã học sinh)
function xacThucMaBaiTap(ma) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetHS = ss.getSheetByName('Mã học sinh');
    if (!sheetHS) return { timThay: false, thongBao: "Không tìm thấy sheet 'Mã học sinh'" };
    
    var dataHS = sheetHS.getDataRange().getDisplayValues();
    var foundStudentRow = -1;
    var cleanMa = String(ma).trim().toUpperCase();
    
    // Tìm kiếm trong Cột H (index 7) của Mã học sinh
    for (var i = 1; i < dataHS.length; i++) {
      if (dataHS[i].length > 7 && normalizeMa(dataHS[i][7]) === normalizeMa(cleanMa)) {
        foundStudentRow = i;
        break;
      }
    }
    
    if (foundStudentRow === -1) {
      return { timThay: false, thongBao: "Mã bài tập không hợp lệ hoặc học sinh chưa được cấp mã!" };
    }
    
    var studentName = dataHS[foundStudentRow][2]; // Họ tên học sinh
    var studentPhone = dataHS[foundStudentRow][3]; // Số điện thoại phụ huynh
    
    // Truy vấn lịch sử bài nộp của mã này trong sheet 'Bài tập'
    var sheetHW = initHomeworkSheet(ss);
    var dataHW = sheetHW.getDataRange().getDisplayValues();
    var hwHeaders = getHeaderIndices(sheetHW);
    
    var colMa = hwHeaders["Mã bài tập"] !== undefined ? hwHeaders["Mã bài tập"] : 4;
    var colTime = hwHeaders["Thời gian nộp"] !== undefined ? hwHeaders["Thời gian nộp"] : 0;
    var colName = hwHeaders["Tên học sinh"] !== undefined ? hwHeaders["Tên học sinh"] : 1;
    var colLesson = hwHeaders["Tên bài học"] !== undefined ? hwHeaders["Tên bài học"] : 2;
    var colUrl = hwHeaders["Link Google Drive liên kết"] !== undefined ? hwHeaders["Link Google Drive liên kết"] : 3;
    var colDate = hwHeaders["Ngày nộp"] !== undefined ? hwHeaders["Ngày nộp"] : 5;
    var colStatus = hwHeaders["Trạng thái nộp"] !== undefined ? hwHeaders["Trạng thái nộp"] : 6;
    
    var submissions = [];
    
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
          rowIndex: j + 1 // 1-indexed row number in 'Bài tập' sheet
        });
      }
    }
    
    // Truy vấn danh sách bài tập được giao cho mã này trong sheet 'Bài tập giao'
    var sheetAssigned = ss.getSheetByName('Bài tập giao');
    var assignedList = [];
    if (sheetAssigned) {
      var dataAssigned = sheetAssigned.getDataRange().getDisplayValues();
      for (var k = 1; k < dataAssigned.length; k++) {
        if (dataAssigned[k].length > 6 && normalizeMa(dataAssigned[k][5]) === normalizeMa(cleanMa) && dataAssigned[k][6] === "Active") {
          assignedList.push({
            rowIndex: k + 1,
            timestamp: dataAssigned[k][0],
            studentName: dataAssigned[k][1],
            title: dataAssigned[k][2],
            releaseDate: dataAssigned[k][3],
            fileUrl: dataAssigned[k][4]
          });
        }
      }
    }
    
    return {
      timThay: true,
      ma: cleanMa,
      studentName: studentName,
      submissions: submissions,
      assignedList: assignedList
    };
  } catch (e) {
    return { timThay: false, thongBao: "Lỗi hệ thống: " + e.toString() };
  }
}

// Học sinh nộp bài tập mới (hỗ trợ file đơn lẻ - tương thích ngược)
function uploadHomeworkFile(ma, studentName, lessonName, fileBase64, fileName, mimeType) {
  try {
    return uploadHomeworkFiles(ma, studentName, lessonName, [{ fileBase64: fileBase64, fileName: fileName, mimeType: mimeType }]);
  } catch (e) {
    return { error: "Lỗi hệ thống: " + e.toString() };
  }
}

// Học sinh nộp nhiều file bài tập mới (nén thành 1 file ZIP lưu trên Drive và lưu link ZIP vào sheet)
function uploadHomeworkFiles(ma, studentName, lessonName, filesList) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetHW = initHomeworkSheet(ss);
    var hwHeaders = getHeaderIndices(sheetHW);
    
    // 1. Tạo hoặc lấy thư mục cha
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
    
    // 2. Tìm hoặc tạo thư mục học sinh
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
      // Tạo blob cho tất cả các file
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
        
        var newFileName = studentName + " - " + shortDateString.replace(/\//g, "-") + " - " + lessonName + (filesList.length > 1 ? (" - " + (i + 1)) : "") + ext;
        blobs.push(Utilities.newBlob(fileData, fileObj.mimeType, newFileName));
      }
      
      if (blobs.length === 1) {
        // 1 file: tải thẳng không nén
        var singleFile = studentFolder.createFile(blobs[0]);
        try { singleFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (fErr) {}
        fileUrl = singleFile.getUrl();
      } else if (blobs.length > 1) {
        // Nhiều file: nén thành ZIP
        var zipName = studentName + " - " + shortDateString.replace(/\//g, "-") + " - " + lessonName + ".zip";
        var zipBlob = Utilities.zip(blobs, zipName);
        var zipFile = studentFolder.createFile(zipBlob);
        try { zipFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (fErr) {}
        fileUrl = zipFile.getUrl();
      }
    }
    
    // Chuẩn bị dữ liệu ghi theo tên cột (thêm dấu ' để giữ số 0 ở đầu)
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
    
    return {
      success: true,
      fileUrl: fileUrl,
      submissionDate: shortDateString,
      timestamp: dateString,
      status: "Active",
      rowIndex: lastRow
    };
  } catch (e) {
    return { error: "Lỗi hệ thống: " + e.toString() };
  }
}

// Chỉnh sửa bài tập đã nộp (thay tên bài hoặc nén file ZIP mới thay thế file cũ)
function editHomeworkFile(rowIndex, lessonName, fileBase64OrList, fileName, mimeType) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetHW = initHomeworkSheet(ss);
    var hwHeaders = getHeaderIndices(sheetHW);
    var r = parseInt(rowIndex);
    
    var data = sheetHW.getDataRange().getDisplayValues();
    if (isNaN(r) || r < 2 || r > data.length) {
      return { error: "Vị trí dòng không hợp lệ." };
    }
    
    var colDateIdx = hwHeaders["Ngày nộp"] !== undefined ? hwHeaders["Ngày nộp"] : 5;
    var colNameIdx = hwHeaders["Tên học sinh"] !== undefined ? hwHeaders["Tên học sinh"] : 1;
    var colUrlIdx = hwHeaders["Link Google Drive liên kết"] !== undefined ? hwHeaders["Link Google Drive liên kết"] : 3;
    var colLessonIdx = hwHeaders["Tên bài học"] !== undefined ? hwHeaders["Tên bài học"] : 2;
    var colTimeIdx = hwHeaders["Thời gian nộp"] !== undefined ? hwHeaders["Thời gian nộp"] : 0;
    var colStatusIdx = hwHeaders["Trạng thái nộp"] !== undefined ? hwHeaders["Trạng thái nộp"] : 6;
    
    // Kiểm tra khóa ngày nộp
    var now = new Date();
    var todayStr = Utilities.formatDate(now, Session.getScriptTimeZone(), "dd/MM/yyyy");
    var submissionDateStr = data[r - 1][colDateIdx].trim();
    
    if (submissionDateStr !== todayStr) {
      return { error: "Đã quá hạn sửa bài tập (chỉ được sửa trong ngày nộp)." };
    }
    
    var studentName = data[r - 1][colNameIdx];
    var oldUrl = data[r - 1][colUrlIdx];
    
    // Cập nhật tên bài học
    sheetHW.getRange(r, colLessonIdx + 1).setValue(lessonName);
    
    var fileUrl = oldUrl;
    
    // Tương thích ngược: Phân tách danh sách file
    var filesList = [];
    if (Array.isArray(fileBase64OrList)) {
      filesList = fileBase64OrList;
    } else if (fileBase64OrList && fileName) {
      filesList = [{ fileBase64: fileBase64OrList, fileName: fileName, mimeType: mimeType }];
    }
    
    // Nếu có danh sách file mới truyền lên
    if (filesList && filesList.length > 0) {
      var driveApp = DriveApp;
      
      // Xóa file ZIP cũ hoặc thư mục cũ của buổi nộp này
      if (oldUrl) {
        var matches = oldUrl.match(/[-\w]{25,}/);
        if (matches && matches[0]) {
          try {
            if (oldUrl.indexOf("/folders/") !== -1 || oldUrl.indexOf("/drive/folders/") !== -1) {
              var oldFolder = driveApp.getFolderById(matches[0]);
              oldFolder.setTrashed(true);
            } else {
              var oldFile = driveApp.getFileById(matches[0]);
              oldFile.setTrashed(true);
            }
          } catch (deleteErr) {
            Logger.log("Không thể dọn dẹp tệp cũ: " + deleteErr.toString());
          }
        }
      }
      
      // Tìm hoặc tạo thư mục học sinh
      var parentFolderId = "1ZKHCDdZzkMqLTV4guvMNkKYbaQHCEGus";
      var parentFolder;
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
      
      if (filesList.length === 1) {
        var fileObj = filesList[0];
        if (fileObj && fileObj.fileBase64) {
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
          
          var newFileName = studentName + " - " + shortDateString.replace(/\//g, "-") + " - " + lessonName + ext;
          var blob = Utilities.newBlob(fileData, fileObj.mimeType, newFileName);
          var file = studentFolder.createFile(blob);
          
          try {
            file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          } catch (fErr) {}
          
          fileUrl = file.getUrl();
          sheetHW.getRange(r, colUrlIdx + 1).setValue(fileUrl);
        }
      } else {
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
          
          var newFileName = studentName + " - " + lessonName + " - " + (i + 1) + ext;
          var blob = Utilities.newBlob(fileData, fileObj.mimeType, newFileName);
          blobs.push(blob);
        }
        
        if (blobs.length > 0) {
          var zipName = studentName + " - " + shortDateString.replace(/\//g, "-") + " - " + lessonName + ".zip";
          var zipBlob = Utilities.zip(blobs, zipName);
          var zipFile = studentFolder.createFile(zipBlob);
          
          try {
            zipFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          } catch (fErr) {}
          
          fileUrl = zipFile.getUrl();
          sheetHW.getRange(r, colUrlIdx + 1).setValue(fileUrl);
        }
      }
    }
    
    var dateString = Utilities.formatDate(now, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
    sheetHW.getRange(r, colTimeIdx + 1).setValue(dateString);
    sheetHW.getRange(r, colStatusIdx + 1).setValue("Active"); // Reset trạng thái nếu đang tạm xóa
    sheetHW.getRange(r, 1, 1, sheetHW.getLastColumn()).setFontFamily("Arial");
    
    return { success: true, fileUrl: fileUrl, timestamp: dateString };
  } catch (e) {
    return { error: "Lỗi hệ thống: " + e.toString() };
  }
}


// Xóa tạm thời bài tập (Cột G = Deleted)
function deleteHomeworkFile(rowIndex) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetHW = initHomeworkSheet(ss);
    var hwHeaders = getHeaderIndices(sheetHW);
    var r = parseInt(rowIndex);
    
    var data = sheetHW.getDataRange().getValues();
    if (isNaN(r) || r < 2 || r > data.length) {
      return { error: "Vị trí dòng không hợp lệ." };
    }
    
    var colDateIdx = hwHeaders["Ngày nộp"] !== undefined ? hwHeaders["Ngày nộp"] : 5;
    var colStatusIdx = hwHeaders["Trạng thái nộp"] !== undefined ? hwHeaders["Trạng thái nộp"] : 6;
    
    var now = new Date();
    var todayStr = Utilities.formatDate(now, Session.getScriptTimeZone(), "dd/MM/yyyy");
    var submissionDateStr = sheetHW.getRange(r, colDateIdx + 1).getDisplayValue().trim();
    
    if (submissionDateStr !== todayStr) {
      return { error: "Đã quá hạn xóa bài tập (chỉ được xóa trong ngày nộp)." };
    }
    
    // Đổi trạng thái sang Deleted
    sheetHW.getRange(r, colStatusIdx + 1).setValue("Deleted").setFontFamily("Arial");
    
    // Ghi log Thùng rác
    writeTrashLog(ss, "Bài tập", "Xóa bài tập tạm thời", data[r - 1]);
    
    return { success: true };
  } catch (e) {
    return { error: "Lỗi hệ thống: " + e.toString() };
  }
}

// Khôi phục bài tập (Cột G = Active)
function restoreHomeworkFile(rowIndex) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetHW = initHomeworkSheet(ss);
    var hwHeaders = getHeaderIndices(sheetHW);
    var r = parseInt(rowIndex);
    
    var data = sheetHW.getDataRange().getValues();
    if (isNaN(r) || r < 2 || r > data.length) {
      return { error: "Vị trí dòng không hợp lệ." };
    }
    
    var colDateIdx = hwHeaders["Ngày nộp"] !== undefined ? hwHeaders["Ngày nộp"] : 5;
    var colStatusIdx = hwHeaders["Trạng thái nộp"] !== undefined ? hwHeaders["Trạng thái nộp"] : 6;
    
    var now = new Date();
    var todayStr = Utilities.formatDate(now, Session.getScriptTimeZone(), "dd/MM/yyyy");
    var submissionDateStr = sheetHW.getRange(r, colDateIdx + 1).getDisplayValue().trim();
    
    if (submissionDateStr !== todayStr) {
      return { error: "Đã quá hạn khôi phục (chỉ được khôi phục trong ngày nộp)." };
    }
    
    // Đổi trạng thái sang Active
    sheetHW.getRange(r, colStatusIdx + 1).setValue("Active").setFontFamily("Arial");
    
    // Ghi log Thùng rác
    writeTrashLog(ss, "Bài tập", "Khôi phục bài tập", data[r - 1]);
    
    return { success: true };
  } catch (e) {
    return { error: "Lỗi hệ thống: " + e.toString() };
  }
}

// ================= GIA SƯ GIAO BÀI TẬP =================

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
      "Gia sư giao"
    ]);
    sheet.getRange("A1:I1").setFontWeight("bold").setBackground("#E2D1FF").setFontFamily("Arial");
  }
  return sheet;
}

// Trích xuất ID file từ URL
function extractFileIdFromUrl(url) {
  if (!url) return null;
  var matches = url.match(/[-\w]{25,}/);
  return matches ? matches[0] : null;
}

// Dọn dẹp thùng rác bài tập giao (Xóa quá 1 ngày = 24 giờ)
function cleanTrashHw(sheet) {
  var data = sheet.getDataRange().getValues();
  var now = new Date().getTime();
  var oneDayMs = 24 * 60 * 60 * 1000;
  
  // Duyệt ngược để xóa dòng an toàn
  for (var i = data.length - 1; i >= 1; i--) {
    var status = data[i][6]; // Cột G (Trạng thái)
    var deletedTimeStr = data[i][7]; // Cột H (Thời gian xóa)
    
    if (status === "Deleted" && deletedTimeStr) {
      var deletedTime = new Date(deletedTimeStr).getTime();
      if (!isNaN(deletedTime) && (now - deletedTime) > oneDayMs) {
        // 1. Xóa file trên Google Drive
        var fileUrl = data[i][4]; // Cột E (Link file)
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
        // 2. Xóa dòng trên Sheet
        sheet.deleteRow(i + 1);
      }
    }
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
  
  // Tạo thư mục theo tên học sinh bên trong thư mục bài tập gia sư giao
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

// Gia sư lấy danh sách bài tập đã giao
function getAssignedHomework(studentName, tutorPhone) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = initAssignedHwSheet(ss);
    
    // Tự động dọn dẹp bài đã xóa quá 24h
    cleanTrashHw(sheet);
    
    var data = sheet.getDataRange().getDisplayValues();
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
          deletedTime: data[i][7]
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

// Gia sư tải bài tập giao lên
function uploadAssignedHomework(tutorPhone, studentName, title, releaseDate, fileBase64, fileName, mimeType, maBaiTap) {
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
      "'" + tutorPhone
    ]);
    
    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1, 1, 9).setFontFamily("Arial");
    
    return { success: true, rowIndex: lastRow, fileUrl: fileUrl };
  } catch (e) {
    return { error: "Lỗi hệ thống: " + e.toString() };
  }
}

// Gia sư chỉnh sửa bài tập đã giao
function editAssignedHomework(rowIndex, title, releaseDate, fileBase64, fileName, mimeType) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = initAssignedHwSheet(ss);
    var r = parseInt(rowIndex);
    
    var data = sheet.getDataRange().getDisplayValues();
    if (isNaN(r) || r < 2 || r > data.length) {
      return { error: "Vị trí dòng không hợp lệ." };
    }
    
    var studentName = data[r - 1][1];
    sheet.getRange(r, 3).setValue(title);
    sheet.getRange(r, 4).setValue(releaseDate);
    
    var fileUrl = data[r - 1][4];
    if (fileBase64 && fileName) {
      fileUrl = saveTutorFileToDrive(studentName, title, fileBase64, fileName, mimeType);
      sheet.getRange(r, 5).setValue(fileUrl);
    }
    
    sheet.getRange(r, 7).setValue("Active");
    sheet.getRange(r, 8).setValue("");
    
    return { success: true, fileUrl: fileUrl };
  } catch (e) {
    return { error: "Lỗi hệ thống: " + e.toString() };
  }
}

// Gia sư xóa bài tập đã giao (Chuyển vào thùng rác)
function deleteAssignedHomework(rowIndex) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = initAssignedHwSheet(ss);
    var r = parseInt(rowIndex);
    
    var data = sheet.getDataRange().getDisplayValues();
    if (isNaN(r) || r < 2 || r > data.length) {
      return { error: "Vị trí dòng không hợp lệ." };
    }
    
    var now = new Date();
    // Ghi nhận mốc thời gian xóa chuẩn ISO để tính toán quá hạn 24h
    var dateString = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
    
    sheet.getRange(r, 7).setValue("Deleted");
    sheet.getRange(r, 8).setValue(dateString);
    
    return { success: true };
  } catch (e) {
    return { error: "Lỗi hệ thống: " + e.toString() };
  }
}

// Gia sư khôi phục bài tập giao từ thùng rác
function restoreAssignedHomework(rowIndex) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = initAssignedHwSheet(ss);
    var r = parseInt(rowIndex);
    
    var data = sheet.getDataRange().getDisplayValues();
    if (isNaN(r) || r < 2 || r > data.length) {
      return { error: "Vị trí dòng không hợp lệ." };
    }
    
    sheet.getRange(r, 7).setValue("Active");
    sheet.getRange(r, 8).setValue("");
    
    return { success: true };
  } catch (e) {
    return { error: "Lỗi hệ thống: " + e.toString() };
  }
}

// Gia sư lấy danh sách bài nộp của học sinh
function getStudentSubmissionsForTutor(maBaiTap) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetHW = initHomeworkSheet(ss);
    var dataHW = sheetHW.getDataRange().getDisplayValues();
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
    
    // Bài nộp mới nhất lên đầu
    submissions.reverse();
    
    return { submissions: submissions };
  } catch (e) {
    return { error: "Lỗi hệ thống: " + e.toString() };
  }
}

// ================= TỰ ĐỘNG ĐỊNH DẠNG SHEET (ARIAL, 11, CENTER) =================

// Định dạng toàn bộ các sheet trong file (từ dòng 2 trở đi để giữ nguyên tiêu đề dòng 1)
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
        // Nếu bôi đen chọn cả tiêu đề dòng 1, chỉ format từ dòng 2 trở xuống
        var numRows = range.getNumRows();
        var dataRange = sheet.getRange(2, range.getColumn(), numRows - 1, range.getNumColumns());
        dataRange.setFontFamily("Arial")
                 .setFontSize(11)
                 .setHorizontalAlignment("center")
                 .setVerticalAlignment("middle");
      }
    } else {
      // Format trực tiếp vùng ô đang sửa
      range.setFontFamily("Arial")
           .setFontSize(11)
           .setHorizontalAlignment("center")
           .setVerticalAlignment("middle");
    }
  } catch (err) {
    Logger.log("Lỗi onEdit: " + err.toString());
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

// Lấy danh sách ý kiến phụ huynh thuộc các lớp của Gia sư
function getTutorFeedback(tutorPhone) {
  try {
    // 1. Dọn dẹp các phản hồi cũ trước (tối đa 1 lần mỗi 12 tiếng để tránh làm chậm web)
    var cache = CacheService.getScriptCache();
    var lastClean = cache.get("lastFeedbackClean");
    if (!lastClean) {
      cleanupOldFeedback();
      cache.put("lastFeedbackClean", "done", 12 * 60 * 60); // Lưu trong 12 giờ
    }
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 2. Tìm SĐT của toàn bộ học sinh do gia sư này phụ trách
    var sheetHS = ss.getSheetByName('Mã học sinh');
    var studentPhones = [];
    if (sheetHS) {
      var dataHS = sheetHS.getDataRange().getDisplayValues();
      var normTutorPhone = normalizePhone(tutorPhone);
      for (var i = 1; i < dataHS.length; i++) {
        if (normalizePhone(dataHS[i][6]) === normTutorPhone) {
          studentPhones.push(normalizePhone(dataHS[i][3])); // SĐT học sinh
        }
      }
    }
    
    // 3. Đọc dữ liệu ý kiến phụ huynh và lọc theo học sinh tương ứng
    var sheetFeedback = ss.getSheetByName('Ý kiến phụ huynh');
    var feedbacks = [];
    if (sheetFeedback) {
      var dataFB = sheetFeedback.getDataRange().getDisplayValues();
      for (var j = dataFB.length - 1; j >= 1; j--) { // Phản hồi mới nhất lên đầu
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
    
    return { success: true, feedbacks: feedbacks };
  } catch (e) {
    return { error: "Lỗi backend: " + e.toString() };
  }
}

// Chuẩn hóa mã bài tập (nếu là số điện thoại hoặc mã thuần số bị mất số 0 ở đầu trên Sheets thì chuyển đổi so sánh cho khớp)
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

