"""Build a public-only Markdown site. Run: python3 scripts/build.py"""
from pathlib import Path
import re, json, shutil, unicodedata
from urllib.parse import quote
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'dist'
OUT.mkdir(exist_ok=True)
for item in OUT.iterdir():
    if item.is_dir(): shutil.rmtree(item)
    else: item.unlink()
notes = []
for p in sorted(ROOT.rglob('*.md')):
    rel = p.relative_to(ROOT)
    if any(x.startswith('.') or x in {'dist','node_modules','scripts'} for x in rel.parts) or p.name in {'README.md','_sidebar.md','AGENTS.md'}: continue
    text = p.read_text()
    if re.match(r'^---\s*\n[\s\S]*?\bdraft:\s*true\b[\s\S]*?\n---', text, re.I): continue
    text = re.sub(r'^---\s*\n[\s\S]*?\n---\s*\n', '', text)
    dest = OUT / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(text)
    clean = re.sub(r'!\[\[[^\]]*\]\]|!\[[^\]]*\]\([^)]*\)', '', text)
    clean = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', clean)
    clean = re.sub(r'[#>*`|\[\]]', '', clean)
    clean = re.sub(r'https?://\S+', '', clean)
    clean = re.sub(r'\s+', ' ', clean).strip()
    notes.append(dict(path=rel.as_posix(), title=p.stem, category={'Github Blog':'블로그 만들기','GitHub Blog와 Obsidian과 연동하기':'블로그 만들기','SQLD':'SQLD','자격증-SQLD':'SQLD','자격증 - 정보처리기사 (필기)':'정보처리기사','자격증-경영정보시각화능력':'경영정보시각화능력','프로젝트 끝날 때까지 개념 완벽히 이해할 것':'개발 개념'}.get(rel.parts[0],rel.parts[0]) if len(rel.parts)>1 else '학습 메모', excerpt=clean[:130], search=clean, minutes=max(1,round(len(text)/650))))
for folder in ['assets','img']:
    shutil.copytree(ROOT / folder, OUT / folder, dirs_exist_ok=True)
for p in ROOT.glob('*.png'): shutil.copy2(p, OUT / p.name)
shutil.copy2(ROOT / 'index.html', OUT / 'index.html')
(OUT / 'README.md').write_text('<!-- home -->')
(OUT / '.nojekyll').touch()
(OUT / 'assets/notes.js').write_text('window.NOTES = '+json.dumps(notes,ensure_ascii=False)+';')
lines=['- [전체 기록](#/)','- [☀ Sunshine](https://h3clo.github.io/sunshine/)','']
for category in dict.fromkeys(n['category'] for n in notes):
    lines += ['- **'+category+'**']
    lines += ['  - ['+n['title']+'](/'+quote(n['path'])+')' for n in notes if n['category']==category]
(OUT / '_sidebar.md').write_text('\n'.join(lines))
# File lookup includes assets for Obsidian embeds, with Unicode normalization.
lookup={}
for p in OUT.rglob('*'):
    if p.is_file():
        rel=p.relative_to(OUT).as_posix()
        for key in [rel,p.name,p.stem]: lookup.setdefault(unicodedata.normalize('NFC',key),rel)
(OUT / 'assets/lookup.js').write_text('window.NOTE_FILES = '+json.dumps(lookup,ensure_ascii=False)+';')
print(f'Built {len(notes)} public notes in {OUT}')
