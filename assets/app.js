(() => {
  const notes = window.NOTES || [];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const href = path => '#/' + path.split('/').map(encodeURIComponent).join('/');
  const read = (key, fallback) => { try { return localStorage.getItem(key) || fallback; } catch { return fallback; } };
  const save = (key, value) => { try { localStorage.setItem(key,value); } catch {} };
  let theme = read('theme', matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.dataset.theme = theme;
  document.getElementById('theme').onclick = () => { theme = theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = theme; save('theme',theme); };
  let font = Number(read('reading-size','17'));
  if (!Number.isFinite(font)) font = 17;
  font = Math.max(14, Math.min(24,font));
  document.documentElement.style.setProperty('--reading-size',font+'px');
  document.querySelector('.skip').onclick = event => { event.preventDefault(); const main=document.getElementById('main'); if(main){main.tabIndex=-1; main.focus();} };
  let category = '전체';
  const categories = ['전체',...new Set(notes.map(n=>n.category))];
  function home() {
    return `<section class="intro"><p class="eyebrow">A LITTLE MORE, EVERY DAY</p><h1>배운 것을 기록하고,<br>생각한 것을 만듭니다<span>.</span></h1><p>개발하며 만난 질문과 배움, 그리고 작은 프로젝트들.</p></section>
    <a class="project" href="https://h3clo.github.io/sunshine/"><span class="sun" aria-hidden="true">☀</span><div><span class="eyebrow">SIDE PROJECT · SUNSHINE</span><h2>잠깐, 다른 도시의 햇살을 만나볼까요?</h2><p>세계의 라이브캠과 현지 날씨를 만나는 작은 창문.</p></div><span class="project-arrow" aria-hidden="true">↗</span></a>
    <section class="archive" aria-labelledby="archive-title"><div class="archive-head"><h2 id="archive-title">쌓아가는 기록 <small>${notes.length}</small></h2><label class="search"><span class="sr-only">제목과 본문 검색</span><input id="note-search" type="search" placeholder="어떤 기록을 찾고 있나요?" autocomplete="off"></label></div><div class="filters" aria-label="주제 필터">${categories.map(c=>`<button type="button" data-category="${esc(c)}" aria-pressed="${c===category}">${esc(c)}</button>`).join('')}</div><p id="result-count" class="sr-only" role="status"></p><div id="note-list" class="note-grid"></div></section><footer class="home-footer">조금씩 배우고, 오래 남기기.<a href="https://github.com/h3clo/h3clo.github.io">GitHub ↗</a></footer>`;
  }
  function filter() {
    const query = (document.getElementById('note-search')?.value || '').normalize('NFC').toLowerCase().trim();
    const selected = notes.filter(n=>(category==='전체'||n.category===category) && `${n.title} ${n.category} ${n.search}`.normalize('NFC').toLowerCase().includes(query));
    document.getElementById('note-list').innerHTML=selected.length ? selected.map(n=>`<a class="note-card" href="${href(n.path)}"><span class="note-category">${esc(n.category)}</span><h3>${esc(n.title)}</h3><p>${esc(n.excerpt || '차근차근 채워가는 학습 기록입니다.')}</p><span class="note-bottom">${n.minutes}분 읽기 <span aria-hidden="true">↗</span></span></a>`).join('') : '<p class="empty">찾는 기록이 없어요. 다른 검색어나 주제를 선택해 보세요.</p>';
    document.getElementById('result-count').textContent=`${selected.length}개의 기록`;
    document.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.category===category));
  }
  function resolve(target) { return window.NOTE_FILES?.[target.normalize('NFC')]; }
  window.$docsify = {
    name: 'h3clo', loadSidebar: true, auto2top: true, relativePath: true,
    plugins: [function(hook,vm) {
      hook.beforeEach(content => {
        const isHome = vm.route.path === '/';
        document.body.classList.toggle('home',isHome);
        if (isHome) { document.title='h3clo · 기록과 프로젝트'; return home(); }
        const path = decodeURIComponent(vm.route.path.replace(/^\//,''));
        const note = notes.find(n=>n.path.replace(/\.md$/,'').normalize('NFC')===path.replace(/\.md$/,'').normalize('NFC'));
        document.title=(note?.title || '기록')+' · h3clo';
        content=content.replace(/(!?)\[\[([^\]]+)\]\]/g,(all,embed,raw)=>{
          const [target,alias]=raw.split('|');
          const [file,anchor]=target.split('#');
          const found=resolve(file);
          if(!found) return embed ? `\n> 첨부 파일을 찾을 수 없습니다: ${esc(file)}\n` : esc(alias||target);
          const url=found.split('/').map(encodeURIComponent).join('/');
          if(embed && !found.endsWith('.md')) return `<img src="/${url}" alt="${esc(alias||file)}" loading="lazy">`;
          return `[${esc(alias||file)}](/${url}${anchor ? '?id='+encodeURIComponent(anchor) : ''})`;
        });
        const series = note ? notes.filter(n=>n.category===note.category) : [];
        const index=series.indexOf(note);
        return `<div class="reading-tools"><a href="#/">← 전체 기록</a><div><button type="button" data-size="-1" aria-label="글자 축소">가−</button><button type="button" data-size="1" aria-label="글자 확대">가+</button><button type="button" id="share">링크 복사</button></div></div>\n\n`+
          (note ? `<p class="article-meta">${esc(note.category)} · ${note.minutes}분 읽기</p>\n\n# ${esc(note.title)}\n\n` : '')+content+
          `<nav class="article-nav" aria-label="같은 주제의 기록">${index>0?`<a href="${href(series[index-1].path)}">← ${esc(series[index-1].title)}</a>`:'<span></span>'}${index>=0&&index<series.length-1?`<a href="${href(series[index+1].path)}">${esc(series[index+1].title)} →</a>`:''}</nav>`;
      });
      hook.doneEach(()=>{
        const current = notes.find(n=>n.path.replace(/\.md$/,'').normalize('NFC')===decodeURIComponent(vm.route.path.replace(/^\//,'')).replace(/\.md$/,'').normalize('NFC'));
        document.title=current ? current.title+' · h3clo' : 'h3clo · 기록과 프로젝트';
        if(document.body.classList.contains('home')) {
          filter();
          document.getElementById('note-search').oninput=filter;
          document.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>{category=b.dataset.category;filter();});
        }
        document.querySelectorAll('[data-size]').forEach(b=>b.onclick=()=>{font=Math.max(14,Math.min(24,font+Number(b.dataset.size)));document.documentElement.style.setProperty('--reading-size',font+'px');save('reading-size',String(font));});
        const share=document.getElementById('share');
        if(share)share.onclick=async()=>{try {await navigator.clipboard.writeText(location.href);share.textContent='복사 완료';} catch {share.textContent='주소창 링크를 복사해 주세요';}};
      });
    }]
  };
})();
