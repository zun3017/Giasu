import re
with open('class-dashboard.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern 1: if (confirm("...")) {
# We will use re.sub with a custom function to handle the closing bracket
def repl1(match):
    msg = match.group(1)
    body = match.group(2)
    return f'showCustomConfirm("{msg}", function() {{{body}}});'

# Match if (confirm("MSG")) { BODY }
# We use a non-greedy match for BODY up to the closing } that matches the if block.
# Since python regex doesn't easily do balanced brackets, we will just match up to `\n            }` for these specific functions.
content = re.sub(r'if \(confirm\("([^"]+)"\)\) \{([\s\S]*?)\n            \}', repl1, content)

# Pattern 2: if (!confirm("...")) return; ...
# We need to wrap the rest of the function in the callback.
# markSelectedAsPaid (line 2645):
content = re.sub(r'if \(!confirm\("([^"]+)"\)\) return;\s*btn\.disabled = true;\s*btn\.innerHTML = \'<i class="fa-solid fa-circle-notch fa-spin"></i> Đang lưu...\';\s*showSyncToast\(''pending''\);\s*google\.script\.run\.withSuccessHandler\(function\(res\) \{([\s\S]*?)\}\)\.markClassInvoiceBulkPaid\(logIds, activeInvoiceStudentId\);',
                 r'showCustomConfirm("\1", function() {\n            btn.disabled = true;\n            btn.innerHTML = \'<i class="fa-solid fa-circle-notch fa-spin"></i> Đang lưu...\';\n            showSyncToast(''pending'');\n            \n            google.script.run.withSuccessHandler(function(res) {\2}).markClassInvoiceBulkPaid(logIds, activeInvoiceStudentId);\n            });', content)

# permanentDeleteHw (line 2994):
content = re.sub(r'if \(!confirm\("([^"]+)"\)\) return;\s*showSyncToast\(''pending''\);\s*google\.script\.run\.withSuccessHandler\(function\(res\) \{([\s\S]*?)\}\)\.purgeClassItem\(type, itemId, className\);',
                 r'showCustomConfirm("\1", function() {\n            showSyncToast(''pending'');\n            google.script.run.withSuccessHandler(function(res) {\2}).purgeClassItem(type, itemId, className);\n        });', content)

with open('class-dashboard.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
