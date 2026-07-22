import re
text = open('temp.js', encoding='utf-8').read()
text = re.sub(r'//.*', '', text)
text = re.sub(r'/\*.*?\*/', '', text, flags=re.DOTALL)
text = re.sub(r'\"(?:\\.|[^\\\"])*\"', '\"\"', text)
text = re.sub(r'\'(?:\\.|[^\\\'])*\'', '\'\'', text)
text = re.sub(r'\`(?:\\.|[^\\\`])*\`', '\'\'', text)

idx = 62496
start = max(0, idx - 100)
end = min(len(text), idx + 100)
print(repr(text[start:end]))
