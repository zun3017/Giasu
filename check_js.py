with open('class-dashboard.html', 'r', encoding='utf-8') as f:
    html = f.read()

start = html.rfind('<script>')
if start != -1:
    js = html[start+8 : html.rfind('</script>')]
    lines = js.split('\n')
    braces = 0
    parens = 0
    in_str = False
    str_char = ''
    in_block_comment = False
    
    for line_idx, line in enumerate(lines):
        i = 0
        while i < len(line):
            c = line[i]
            if not in_str and not in_block_comment:
                if c == '/' and i+1 < len(line) and line[i+1] == '/':
                    break
                elif c == '/' and i+1 < len(line) and line[i+1] == '*':
                    in_block_comment = True
                    i += 1
                elif c in ('\"', "'"):
                    in_str = True
                    str_char = c
                elif c == '{': braces += 1
                elif c == '}': braces -= 1
                elif c == '(': parens += 1
                elif c == ')': parens -= 1
            elif in_str:
                if c == '\\\\' and i+1 < len(line): i += 1
                elif c == str_char: in_str = False
            elif in_block_comment:
                if c == '*' and i+1 < len(line) and line[i+1] == '/':
                    in_block_comment = False
                    i += 1
            i += 1
        # Print lines where nesting level is unusually high or changes
        if braces > 0 or parens > 0:
            # Let's print out the end of the script to see what's open
            pass
    
    print(f"Final state - Braces: {braces}, Parens: {parens}")
    
    # We want to find the mismatched parens/braces. We can keep a stack of line numbers.
    stack = []
    for line_idx, line in enumerate(lines):
        i = 0
        while i < len(line):
            c = line[i]
            if not in_str and not in_block_comment:
                if c == '/' and i+1 < len(line) and line[i+1] == '/': break
                elif c == '/' and i+1 < len(line) and line[i+1] == '*': in_block_comment = True; i += 1
                elif c in ('\"', "'"): in_str = True; str_char = c
                elif c in ('{', '('): stack.append((c, line_idx + 1004))
                elif c in ('}', ')'):
                    if stack:
                        top, l = stack.pop()
                    else:
                        print(f"Extra closing {c} at line {line_idx + 1004}")
            elif in_str:
                if c == '\\\\' and i+1 < len(line): i += 1
                elif c == str_char: in_str = False
            elif in_block_comment:
                if c == '*' and i+1 < len(line) and line[i+1] == '/': in_block_comment = False; i += 1
            i += 1

    print("Unclosed structures:", stack)
