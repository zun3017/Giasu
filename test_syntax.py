import sys, re

text = open('temp.js', encoding='utf-8').read()

# Strip comments
text = re.sub(r'//.*', '', text)
text = re.sub(r'/\*.*?\*/', '', text, flags=re.DOTALL)

# Strip strings
text = re.sub(r'\"(?:\\.|[^\\\"])*\"', '\"\"', text)
text = re.sub(r'\'(?:\\.|[^\\\'])*\'', '\'\'', text)
text = re.sub(r'\`(?:\\.|[^\\\`])*\`', '\'\'', text)

stack = []
for i, c in enumerate(text):
    if c in '{[(':
        stack.append((c, i))
    elif c in '}])':
        if not stack:
            print(f'Unbalanced {c} at {i}')
            sys.exit(1)
        top, idx = stack.pop()
        if (c == '}' and top != '{') or (c == ']' and top != '[') or (c == ')' and top != '('):
            print(f'Mismatched {c} matches {top} at {i}')
            sys.exit(1)

if stack:
    print('Unclosed:', stack)
    sys.exit(1)

print('Balanced!')
