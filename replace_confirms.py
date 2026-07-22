import re

with open('class-dashboard.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Inject showCustomConfirm before showToast
inject_code = """function showCustomConfirm(message, callback) {
            var modal = document.createElement('div');
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100vw';
            modal.style.height = '100vh';
            modal.style.background = 'rgba(3, 8, 29, 0.8)';
            modal.style.backdropFilter = 'blur(8px)';
            modal.style.webkitBackdropFilter = 'blur(8px)';
            modal.style.zIndex = '99999';
            modal.style.display = 'flex';
            modal.style.alignItems = 'center';
            modal.style.justifyContent = 'center';
            modal.style.fontFamily = "'Inter', sans-serif";
            
            var box = document.createElement('div');
            box.style.background = 'rgba(11, 8, 38, 0.95)';
            box.style.border = '1px solid rgba(142, 77, 255, 0.3)';
            box.style.borderRadius = '16px';
            box.style.padding = '30px';
            box.style.maxWidth = '400px';
            box.style.width = '90%';
            box.style.textAlign = 'center';
            box.style.boxShadow = '0 20px 50px rgba(0,0,0,0.5)';
            box.style.transform = 'scale(0.8)';
            box.style.opacity = '0';
            box.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            
            box.innerHTML = 
                '<div style="font-size: 44px; color: #FFD23F; margin-bottom: 15px;"><i class="fa-solid fa-circle-question"></i></div>' +
                '<h4 style="color: #FFF; margin: 0 0 10px; font-size: 18px; font-weight: 700;">Xác nhận</h4>' +
                '<p style="color: #A6ADCE; font-size: 14px; margin: 0 0 24px; line-height: 1.5; text-align: center;">' + message + '</p>' +
                '<div style="display: flex; gap: 12px; justify-content: center;">' +
                    '<button id="confirmCancelBtn" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #A6ADCE; padding: 10px 24px; border-radius: 20px; font-size: 13px; font-weight:600; cursor: pointer; transition: all 0.3s; outline: none; border-style: solid;">Hủy</button>' +
                    '<button id="confirmOkBtn" style="background: linear-gradient(135deg, #8E4DFF 0%, #5B21B6 100%); border: none; color: #FFF; padding: 10px 24px; border-radius: 20px; font-size: 13px; font-weight:600; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 10px rgba(142, 77, 255, 0.2); outline: none;">Đồng ý</button>' +
                '</div>';
                
            modal.appendChild(box);
            document.body.appendChild(modal);
            box.offsetHeight; // force reflow
            
            box.style.transform = 'scale(1)';
            box.style.opacity = '1';
            
            var cancelBtn = box.querySelector('#confirmCancelBtn');
            var okBtn = box.querySelector('#confirmOkBtn');
            
            cancelBtn.onmouseenter = () => cancelBtn.style.background = 'rgba(255,255,255,0.1)';
            cancelBtn.onmouseleave = () => cancelBtn.style.background = 'rgba(255,255,255,0.05)';
            okBtn.onmouseenter = () => okBtn.style.transform = 'translateY(-2px)';
            okBtn.onmouseleave = () => okBtn.style.transform = 'translateY(0)';
            
            var closeConfirm = function(result) {
                box.style.transform = 'scale(0.8)';
                box.style.opacity = '0';
                modal.style.opacity = '0';
                modal.style.transition = 'opacity 0.3s ease';
                setTimeout(function() {
                    modal.remove();
                    if (result && callback) callback();
                }, 300);
            };
            
            cancelBtn.onclick = () => closeConfirm(false);
            okBtn.onclick = () => closeConfirm(true);
        }

        function showToast(message, type) {"""

if "function showCustomConfirm" not in content:
    content = content.replace("        function showToast(message, type) {", inject_code)

import re

# We will use Regex to find `if (confirm("...")) { ... }` or `if (!confirm("...")) return;`
# But it's easier to just do it via specific string replacements since they can span multiple lines.
# Actually, since I reverted everything, let's just do exactly what I know is in the code.

# Instead of large multiline replace which might fail due to tabs/spaces, I'll use regex to replace all `if (confirm("...")) {` with `showCustomConfirm("...", function() {`
# And add `});` at the appropriate closing bracket.

content = re.sub(r'if \(confirm\("Bạn có chắc chắn muốn xóa lớp " \+ cls\.className \+ " không\?"\)\) \{([\s\S]*?deleteClass\(cls\.classId, cls\.className\);[\s\S]*?)\}', 
                 r'showCustomConfirm("Bạn có chắc chắn muốn xóa lớp " + cls.className + " không?", function() {\1});', content)

content = re.sub(r'if \(confirm\("Bạn có chắc chắn muốn chuyển học sinh này vào thùng rác không\?"\)\) \{([\s\S]*?deleteClassStudent\(studentId\);[\s\S]*?)\}', 
                 r'showCustomConfirm("Bạn có chắc chắn muốn chuyển học sinh này vào thùng rác không?", function() {\1});', content)

content = re.sub(r'if \(confirm\("Bạn có chắc chắn muốn chuyển học sinh này vào thùng rác không\? \(Có thể khôi phục lại bất kỳ lúc nào từ Thùng rác\)\."\)\) \{([\s\S]*?removeStudent\(studentId\);[\s\S]*?)\}', 
                 r'showCustomConfirm("Bạn có chắc chắn muốn chuyển học sinh này vào thùng rác không? (Có thể khôi phục lại bất kỳ lúc nào từ Thùng rác).", function() {\1});', content)

content = re.sub(r'if \(confirm\("Bạn có chắc chắn muốn xóa VĨNH VIỄN học sinh này khỏi Google Sheets\? Hành động này không thể hoàn tác!"\)\) \{([\s\S]*?deleteClassStudentPermanently\(studentId\);[\s\S]*?)\}', 
                 r'showCustomConfirm("Bạn có chắc chắn muốn xóa VĨNH VIỄN học sinh này khỏi Google Sheets? Hành động này không thể hoàn tác!", function() {\1});', content)

content = re.sub(r'if \(confirm\("Bạn có chắc chắn muốn xóa nhật ký buổi học này không\?"\)\) \{([\s\S]*?deleteClassLessonLog\(logId\);[\s\S]*?)\}', 
                 r'showCustomConfirm("Bạn có chắc chắn muốn xóa nhật ký buổi học này không?", function() {\1});', content)

content = re.sub(r'if \(confirm\("Bạn có chắc chắn muốn xóa bài tập này\?"\)\) \{([\s\S]*?deleteClassHomework\(hwId\);[\s\S]*?)\}', 
                 r'showCustomConfirm("Bạn có chắc chắn muốn xóa bài tập này?", function() {\1});', content)


# For the "if (!confirm(...)) return;" ones:
content = re.sub(
    r'if \(!confirm\("Bạn có chắc chắn đánh dấu " \+ logIds\.length \+ " buổi học này là ĐÃ THANH TOÁN\?"\)\) return;\s*showSyncToast\(''pending''\);([\s\S]*?\.markClassLessonLogsAsPaid\(logIds\);)',
    r'showCustomConfirm("Bạn có chắc chắn đánh dấu " + logIds.length + " buổi học này là ĐÃ THANH TOÁN?", function() {\n                showSyncToast(''pending'');\1\n            });', content
)

content = re.sub(
    r'if \(!confirm\("Bạn có chắc chắn muốn XÓA VĨNH VIỄN mục này khỏi hệ thống\? Không thể khôi phục sau khi xóa!"\)\) return;\s*showSyncToast\(''pending''\);([\s\S]*?\.permanentDeleteClassHomework\(hwId\);)',
    r'showCustomConfirm("Bạn có chắc chắn muốn XÓA VĨNH VIỄN mục này khỏi hệ thống? Không thể khôi phục sau khi xóa!", function() {\n            showSyncToast(''pending'');\1\n        });', content
)


with open('class-dashboard.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done replacing.")
