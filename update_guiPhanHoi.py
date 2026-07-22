import sys, re
sys.stdout.reconfigure(encoding='utf-8')
with open('Student.gs', 'r', encoding='utf-8') as f:
    content = f.read()

old_func = re.search(r'function guiPhanHoi\(maHS.*?return \{ thanhCong: false.*?}', content, re.DOTALL)
if not old_func:
    print('Failed to find function')
    sys.exit(1)

new_func = """function guiPhanHoi(maHS, tenHocSinh, noiDung, isClass, classId, className) {
  try {
    if (isClass) {
      var ssClass = getClassSpreadsheet();
      var sheetName = "Ý kiến Phụ huynh lớp học";
      var sFeedback = ssClass.getSheetByName(sheetName);
      if (!sFeedback) {
        sFeedback = ssClass.insertSheet(sheetName);
        sFeedback.appendRow(["Mã ý kiến", "Mã lớp", "SĐT Phụ huynh", "Tên học sinh", "Nội dung đóng góp", "Thời gian gửi"]);
        sFeedback.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#8E4DFF").setFontColor("#FFFFFF");
      }
      var feedbackId = "YKIEN_" + new Date().getTime();
      sFeedback.appendRow([feedbackId, classId, "'" + maHS, tenHocSinh, noiDung, new Date()]);
      return { thanhCong: true };
    }

    // Logic cũ cho gia sư 1 kèm 1
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = "Ý kiến phụ huynh";
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(["Thời gian", "Số điện thoại học sinh", "Tên học sinh", "Ý kiến phản hồi phụ huynh"]);
      sheet.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#f3f3f3");
    }
    
    sheet.appendRow([new Date(), "'" + maHS, tenHocSinh, noiDung]);
    
    var cache = CacheService.getScriptCache();
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
}"""

content = content.replace(old_func.group(0), new_func)
with open('Student.gs', 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated Student.gs successfully.')
