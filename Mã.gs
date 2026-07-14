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
  if (clean.charAt(0) === '0') {
    clean = clean.substring(1);
  }
  return clean;
}

function loginSystem(phone, pin) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Tự động khởi tạo sheet Admin nếu chưa có
  initAdminSheet(ss);
  
  var normPhone = normalizePhone(phone);
  
  // 1. Quét Học Sinh trước (Ưu tiên, không cần PIN)
  var sheetHS = ss.getSheetByName('Mã học sinh');
  if (sheetHS) {
    var dataHS = sheetHS.getDataRange().getDisplayValues();
    for (var i = 1; i < dataHS.length; i++) {
      if (normalizePhone(dataHS[i][3]) === normPhone) { 
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
        if (normalizePhone(dataAdmin[i][2]) === normPhone) {
          return { requiresPin: true, name: dataAdmin[i][1] };
        }
      }
    }
    
    // Kiểm tra SĐT có trong danh sách Gia sư không
    var sheetGS = ss.getSheetByName('Mã gia sư');
    if (sheetGS) {
      var dataGS = sheetGS.getDataRange().getDisplayValues();
      for (var i = 1; i < dataGS.length; i++) {
        if (normalizePhone(dataGS[i][2]) === normPhone) {
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
  // A. Thử đối chiếu với quyền Admin trước
  var sheetAdmin = ss.getSheetByName('Mã admin');
  if (sheetAdmin) {
    var dataAdmin = sheetAdmin.getDataRange().getDisplayValues();
    for (var i = 1; i < dataAdmin.length; i++) {
      if (normalizePhone(dataAdmin[i][2]) === normPhone) {
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
      if (normalizePhone(dataGS[i][2]) === normPhone) {
        var tDelDate = (dataGS[i].length > 5) ? dataGS[i][5].trim() : "";
        if (tDelDate !== "") continue;
        
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

  // Nếu đã nhập PIN nhưng không khớp cả hai
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
  var tutorData = {
    tutorPhone: tutorPhone,
    tutorName: gsRow[1],
    tutorPin: gsRow[3],
    qrCode: (gsRow.length > 4) ? gsRow[4] : "",
    students: [],
    deletedStudents: [],
    totalUnpaidIncome: 0,
    classCount: 0
  };

  var normTutorPhone = normalizePhone(tutorPhone);

  var sheetHS = ss.getSheetByName('Mã học sinh');
  if (sheetHS) {
    clearOldDeletedStudents(sheetHS);
    var dataHS = sheetHS.getDataRange().getDisplayValues();
    for (var i = 1; i < dataHS.length; i++) {
      var sdtPhuTrach = (dataHS[i].length > 6) ? String(dataHS[i][6]).trim() : "";
      if (normalizePhone(sdtPhuTrach) === normTutorPhone) {
        var xoaDate = (dataHS[i].length > 7) ? String(dataHS[i][7]).trim() : "";
        if (!xoaDate) {
          tutorData.students.push({
            phone: dataHS[i][3],
            name: dataHS[i][2],
            tuition: dataHS[i][5]
          });
        } else {
          tutorData.deletedStudents.push({
            phone: dataHS[i][3],
            name: dataHS[i][2],
            tuition: dataHS[i][5],
            deletedDate: xoaDate
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
function themHocSinhMoi(tutorPhone, phuHuynhName, studentName, studentPhone, tuition) {
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
    
    // Tính STT tiếp theo
    var nextStt = 1;
    if (dataHS.length > 1) {
      var lastStt = parseInt(dataHS[dataHS.length - 1][0]);
      if (!isNaN(lastStt)) nextStt = lastStt + 1;
    }
    
    // Ghi vào sheet Mã học sinh
    sheetHS.appendRow([nextStt, phuHuynhName, studentName, "'" + studentPhone, "", tuition, "'" + tutorPhone]);
    var lastRowHS = sheetHS.getLastRow();
    sheetHS.getRange(lastRowHS, 1, 1, 7).setFontFamily("Arial");
    
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
function suaThongTinHocSinh(oldPhone, phuHuynhName, studentName, studentPhone, tuition) {
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
    
    // Cập nhật sheet Mã học sinh
    sheetHS.getRange(rowIndex, 2).setValue(phuHuynhName).setFontFamily("Arial");
    sheetHS.getRange(rowIndex, 3).setValue(studentName).setFontFamily("Arial");
    sheetHS.getRange(rowIndex, 4).setValue("'" + studentPhone).setFontFamily("Arial");
    sheetHS.getRange(rowIndex, 6).setValue(tuition).setFontFamily("Arial");
    
    // Nếu SĐT hoặc Tên học sinh thay đổi, đồng bộ hóa sang các bảng khác
    var oldName = dataHS[rowIndex-1][2];
    var isNameChanged = (oldName !== studentName);
    var isPhoneChanged = (normOldPhone !== normStudentPhone);
    
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
    
    return { success: true };
  } catch (e) {
    return { error: "Lỗi backend: " + e.toString() };
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
      var deletedDateStr = data[i][7]; // Cột H (index 7)
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
    
    for (var i = 1; i < dataHS.length; i++) {
      if (normalizePhone(dataHS[i][3]) === normStudentPhone && 
          normalizePhone(dataHS[i][6]) === normTutorPhone) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex === -1) {
      return { error: "Không tìm thấy học sinh cần xóa." };
    }
    
    var now = new Date();
    var dateString = Utilities.formatDate(now, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
    sheetHS.getRange(rowIndex, 8).setValue(dateString).setFontFamily("Arial");
    
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
    
    for (var i = 1; i < dataHS.length; i++) {
      if (normalizePhone(dataHS[i][3]) === normStudentPhone && 
          normalizePhone(dataHS[i][6]) === normTutorPhone) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex === -1) {
      return { error: "Không tìm thấy học sinh để khôi phục." };
    }
    
    sheetHS.getRange(rowIndex, 8).setValue("").setFontFamily("Arial");
    
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
      for (var i = 1; i < dataGS.length; i++) {
        var tPhone = dataGS[i][2].trim();
        var tName = dataGS[i][1];
        var tPin = dataGS[i][3];
        var tQrUrl = (dataGS[i].length > 4) ? dataGS[i][4].trim() : "";
        var tDelDate = (dataGS[i].length > 5) ? dataGS[i][5].trim() : "";
        
        if (tDelDate === "") {
          data.tutors.push({
            name: tName,
            phone: tPhone,
            pin: tPin,
            qrUrl: tQrUrl
          });
          tutorMap[normalizePhone(tPhone)] = tName;
        } else {
          data.deletedTutors.push({
            name: tName,
            phone: tPhone,
            deletedDate: tDelDate,
            qrUrl: tQrUrl
          });
        }
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
          deletedDate: (dataHS[i].length > 7) ? dataHS[i][7] : ""
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
    
    return data;
  } catch (e) {
    return { error: "Lỗi hệ thống Admin: " + e.toString() };
  }
}

// Lưu thông tin gia sư (Thêm mới/Cập nhật) từ quyền Admin
function adminLuuGiaSur(oldPhone, name, phone, pin, qrUrl) {
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
      } else {
        return { error: "Không tìm thấy gia sư để cập nhật." };
      }
    } else {
      var nextStt = 1;
      if (dataGS.length > 1) {
        var lastStt = parseInt(dataGS[dataGS.length - 1][0]);
        if (!isNaN(lastStt)) nextStt = lastStt + 1;
      }
      sheetGS.appendRow([nextStt, name, "'" + phone, "'" + pin, qrUrl, ""]);
      var lastRow = sheetGS.getLastRow();
      sheetGS.getRange(lastRow, 1, 1, 6).setFontFamily("Arial");
    }
    return { success: true };
  } catch (e) {
    return { error: "Lỗi backend: " + e.toString() };
  } finally {
    lock.releaseLock();
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
    
    for (var i = 1; i < dataGS.length; i++) {
      if (normalizePhone(dataGS[i][2]) === normTutorPhone) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex === -1) {
      return { error: "Không tìm thấy gia sư cần xóa." };
    }
    
    var now = new Date();
    var dateString = Utilities.formatDate(now, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
    sheetGS.getRange(rowIndex, 6).setValue(dateString).setFontFamily("Arial");
    
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
    
    for (var i = 1; i < dataGS.length; i++) {
      if (normalizePhone(dataGS[i][2]) === normTutorPhone) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex === -1) {
      return { error: "Không tìm thấy gia sư để khôi phục." };
    }
    
    sheetGS.getRange(rowIndex, 6).setValue("").setFontFamily("Arial");
    
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

