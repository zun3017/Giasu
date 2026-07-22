import sys, re
sys.stdout.reconfigure(encoding='utf-8')
with open('Class.gs', 'r', encoding='utf-8') as f:
    content = f.read()

old_func = re.search(r'function saveClassLessonLog\(classId.*?\n}', content, re.DOTALL)
if not old_func:
    print('Failed to find function')
    sys.exit(1)

new_func = """function saveClassLessonLog(classId, className, weekNum, studyDate, subject, status, hwEval, entryTest, termTest, generalNote, studentNotesJson, editingLogId) {
  var ss = getClassSpreadsheet();
  var sheet = ss.getSheetByName('Nhật ký chung');
  if (!sheet) {
    allocateClassBlock(ss, classId, className);
    sheet = ss.getSheetByName('Nhật ký chung');
  }
  
  var data = sheet.getDataRange().getValues();
  
  if (editingLogId) {
    for (var i = 0; i < data.length; i++) {
      if (String(data[i][0]).trim() === editingLogId) {
        var updateRow = i + 1;
        var updateData = [
          editingLogId, classId || "", className || "", weekNum || "", studyDate || "", subject || "",
          status || "Đã học", hwEval || "Hoàn thành", entryTest || "Không có", termTest || "Không có",
          generalNote || "", studentNotesJson || "{}", ""
        ];
        sheet.getRange(updateRow, 1, 1, 13).setValues([updateData]);
        clearClassCache(classId, "logs");
        SpreadsheetApp.flush();
        return { success: true };
      }
    }
  }

  var targetRowIndex = -1;
  var classBlockFound = false;
  var blockStart = -1;
  
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][1]).trim() === classId && String(data[i][0]).includes("--- NHẬT KÝ LỚP HỌC")) {
      classBlockFound = true;
      blockStart = i;
      break;
    }
  }
  
  if (!classBlockFound) {
    allocateClassBlock(ss, classId, className);
    data = sheet.getDataRange().getValues();
    for (var i = 0; i < data.length; i++) {
      if (String(data[i][1]).trim() === classId && String(data[i][0]).includes("--- NHẬT KÝ LỚP HỌC")) {
        blockStart = i;
        break;
      }
    }
  }
  
  var logId = "LOG_LH_" + new Date().getTime();
  var newRowData = [
    logId, classId || "", className || "", weekNum || "", studyDate || "", subject || "",
    status || "Đã học", hwEval || "Hoàn thành", entryTest || "Không có", termTest || "Không có",
    generalNote || "", studentNotesJson || "{}", ""
  ];
  
  var lastRowOfPartition = blockStart + 1;
  
  for (var j = blockStart + 2; j < data.length; j++) {
    if (String(data[j][0]).includes("--- NHẬT KÝ LỚP HỌC")) break;
    lastRowOfPartition = j;
    if (targetRowIndex === -1 && String(data[j][0]).trim() === "") {
      targetRowIndex = j + 1;
    }
  }
  
  if (targetRowIndex === -1) {
    var insertRowPos = lastRowOfPartition + 1; 
    sheet.insertRowsAfter(insertRowPos, 15);
    for (var d = 1; d <= 15; d++) {
      sheet.getRange(insertRowPos + d, 2, 1, 2).setValues([[classId, className]]);
    }
    targetRowIndex = insertRowPos + 1;
  }
  
  sheet.getRange(targetRowIndex, 1, 1, 13).setValues([newRowData]);
  
  clearClassCache(classId, "logs");
  SpreadsheetApp.flush();
  return { success: true };
}"""

content = content.replace(old_func.group(0), new_func)
with open('Class.gs', 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated Class.gs successfully.')
