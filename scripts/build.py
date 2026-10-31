"""Build a public-only Markdown site. Run: python3 scripts/build.py"""
from pathlib import Path
import re, json, shutil, unicodedata, subprocess, hashlib
from datetime import datetime
from urllib.parse import quote
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'dist'
OUT.mkdir(exist_ok=True)
for item in OUT.iterdir():
    if item.is_dir(): shutil.rmtree(item)
    else: item.unlink()
def note_dates(path, text):
    header = re.match(r'^---[ \t]*\n([\s\S]*?)\n---(?:\n|$)', text)
    metadata = {}
    if header:
        for line in header.group(1).splitlines():
            match = re.match(r'^(created|created_at|date|updated|updated_at|modified):\s*(.*?)\s*$', line)
            if match:
                value = match.group(2).strip("\"'")
                try:
                    datetime.fromisoformat(value.replace('Z', '+00:00'))
                    metadata[match.group(1)] = value
                except ValueError:
                    pass
    result = subprocess.run(['git', 'log', '--follow', '--format=%aI', '--', path], cwd=ROOT, capture_output=True, text=True)
    history = [line for line in result.stdout.splitlines() if line]
    created = next((metadata[k] for k in ['created','created_at','date'] if k in metadata), None)
    updated = next((metadata[k] for k in ['updated','updated_at','modified'] if k in metadata), None)
    return dict(created=created or (history[-1] if history else None),
                updated=updated or (history[0] if history else None),
                createdSource='md' if created else 'git', updatedSource='md' if updated else 'git')

notes = []
for p in sorted(ROOT.rglob('*.md')):
    rel = p.relative_to(ROOT)
    if any(x.startswith('.') or x in {'dist','node_modules','scripts'} for x in rel.parts) or p.name in {'README.md','_sidebar.md','AGENTS.md'}: continue
    text = p.read_text()
    if re.match(r'^---\s*\n[\s\S]*?\bdraft:\s*true\b[\s\S]*?\n---', text, re.I): continue
    if rel.parts[0] == 'life':
        # Life posts are published at their own gallery and stay out of the developer archive.
        dest = OUT / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(re.sub(r'^---\s*\n[\s\S]*?\n---\s*\n', '', text))
        continue
    dates = note_dates(rel.as_posix(), text)
    text = re.sub(r'^---\s*\n[\s\S]*?\n---\s*\n', '', text)
    dest = OUT / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(text)
    clean = re.sub(r'!\[\[[^\]]*\]\]|!\[[^\]]*\]\([^)]*\)', '', text)
    clean = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', clean)
    clean = re.sub(r'[#>*`|\[\]]', '', clean)
    clean = re.sub(r'https?://\S+', '', clean)
    clean = re.sub(r'\s+', ' ', clean).strip()
    notes.append(dict(**dates, path=rel.as_posix(), title=p.stem, category={'Github Blog':'블로그 만들기','GitHub Blog와 Obsidian과 연동하기':'블로그 만들기','SQLD':'SQLD','자격증-SQLD':'SQLD','자격증 - 정보처리기사 (필기)':'정보처리기사','자격증-경영정보시각화능력':'경영정보시각화능력','프로젝트 끝날 때까지 개념 완벽히 이해할 것':'개발 개념'}.get(rel.parts[0],rel.parts[0]) if len(rel.parts)>1 else '학습 메모', excerpt=clean[:130], search=clean, minutes=max(1,round(len(text)/650))))
for folder in ['assets','img']:
    shutil.copytree(ROOT / folder, OUT / folder, dirs_exist_ok=True)
if (ROOT / 'life').exists():
    shutil.copytree(ROOT / 'life', OUT / 'life', dirs_exist_ok=True)
for p in ROOT.glob('*.png'): shutil.copy2(p, OUT / p.name)
shutil.copy2(ROOT / 'index.html', OUT / 'index.html')
(OUT / 'README.md').write_text('<!-- home -->')
(OUT / 'projects.md').write_text('<!-- projects -->')
(OUT / '.nojekyll').touch()
(OUT / 'assets/notes.js').write_text('window.NOTES = '+json.dumps(notes,ensure_ascii=False)+';')
lines=['- [전체 기록](#/)','- [토이 프로젝트](/projects.md)','- [일상 블로그](/life/)','']
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
# Version assets so a browser cannot mix old scripts with new pages after deployment.
for html_path, asset_dir, prefix in [
    (OUT / 'index.html', OUT / 'assets', 'assets'),
    (OUT / 'life/index.html', OUT / 'life/assets', '/life/assets'),
]:
    html = html_path.read_text()
    for asset in asset_dir.iterdir():
        if asset.is_file() and asset.suffix in {'.js', '.css'}:
            version = hashlib.sha256(asset.read_bytes()).hexdigest()[:12]
            html = html.replace(f'{prefix}/{asset.name}\"', f'{prefix}/{asset.name}?v={version}\"')
    html_path.write_text(html)
print(f'Built {len(notes)} public notes in {OUT}')
