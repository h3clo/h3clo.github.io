(() => {
  const media = window.LIFE_MEDIA || [];
  const recipes = [
    { id:'tomato-marinade', title:'🍅 토마토 마리네이드', description:'차갑게 두고 먹는 산뜻한 토마토', image:'/life/images/tomato-marinade.png', kind:'recipe' },
    { id:'blueberry-sorbet', title:'🍧 블루베리 셔벗', description:'블루베리와 요구르트 두 가지 재료', image:'/life/images/blueberry-sorbet.png', kind:'recipe' },
    { id:'blueberry-compote', title:'🫐 블루베리 콩포트', description:'매실청으로 뭉근하게 끓인 콩포트', image:'/life/images/blueberry-compote.png', kind:'recipe' },
    { id:'basque-cheesecake', title:'🍰 바스크 치즈 케이크', description:'23cm 원형 팬 기준', image:'/life/images/basque-cheesecake.png', kind:'recipe' },
    { id:'basque-cheesecake-yogurt', title:'🍰 그릭요거트 바스크 치즈 케이크', description:'생크림과 그릭요거트를 넣은 버전', image:'/life/images/basque-cheesecake.png', kind:'recipe' },
    { id:'lasagna-roll', title:'🍝 라자냐롤', description:'시금치 크림소스를 넣어 돌돌 말아 구워요', image:null, kind:'recipe' }
  ];
  const labels = { movie:'영화', book:'책', webtoon:'웹툰', drama:'드라마', series:'시리즈', podcast:'팟캐스트', recipe:'요리', other:'기타' };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  let view = 'all';
  let kind = 'all';
  let query = '';

  function card(item, type) {
    const href = type === 'recipe' ? `#/recipes/${encodeURIComponent(item.id)}` : `#/media/${encodeURIComponent(item.id)}`;
    const image = item.image || item.cover;
    const imageClass = image ? '' : ' media-card-no-image';
    const status = item.status ? `<span class="media-status">${esc(item.status === 'ongoing' ? '진행 중' : item.status)}</span>` : '';
    const rating = item.rating ? `<span class="media-rating" aria-label="평점 ${esc(item.rating)}점">★ ${esc(item.rating)}</span>` : '';
    const date = item.finished || item.started;
    const dateLabel = date ? `<span class="media-date">${item.finished ? '완료' : '시작'} ${esc(String(date).slice(0,10).replaceAll('-','.'))}</span>` : '';
    const mediaInfo = type === 'media' ? `<div class="media-card-meta"><span class="media-kind">${esc(labels[item.kind] || item.kind)}</span>${status}${dateLabel}${rating}</div>` : '';
    return `<a class="${type}-card" href="${href}">${image ? `<img src="${esc(image)}" alt="${esc(item.title)} 표지" loading="lazy">` : '<span class="recipe-placeholder" aria-hidden="true">🍝</span>'}<span class="card-copy">${mediaInfo}<strong>${esc(item.title)}</strong>${item.description ? `<span class="card-description">${esc(item.description)}</span>` : ''}</span></a>`;
  }

  function homeMarkup() {
    return `<section class="life-hero"><p class="life-eyebrow">LIFE, TASTE & STORIES</p><h1>먹고, 보고, 읽고<br>오래 기억하기<span>.</span></h1><p>만들어 먹은 것, 재미있게 본 콘텐츠, 마음에 남은 순간을 모읍니다.</p></section>
      <section class="life-library" aria-label="일상 기록 모아보기">
        <div class="life-toolbar"><div class="life-view-tabs" role="tablist" aria-label="기록 종류"><button type="button" data-view="all" role="tab">전체 <small>${recipes.length + media.length}</small></button><button type="button" data-view="recipe" role="tab">요리 <small>${recipes.length}</small></button><button type="button" data-view="media" role="tab">콘텐츠 <small>${media.length}</small></button></div><label class="life-search"><span class="sr-only">제목 검색</span><input id="life-search" type="search" placeholder="제목으로 찾아보기" autocomplete="off"></label></div>
        <div id="life-kinds" class="life-kind-filters" aria-label="콘텐츠 종류"></div><div id="life-results" aria-live="polite"></div>
      </section>`;
  }

  function renderHome() {
    const tab = document.querySelector('.life-view-tabs');
    const results = document.getElementById('life-results');
    const kindFilters = document.getElementById('life-kinds');
    if (!tab || !results || !kindFilters) return;
    tab.querySelectorAll('[data-view]').forEach(button => {
      const active = button.dataset.view === view;
      button.setAttribute('aria-selected', String(active));
      button.classList.toggle('active', active);
    });
    const visibleRecipes = view === 'media' ? [] : recipes.filter(item => `${item.title} ${item.description}`.toLocaleLowerCase().includes(query));
    const kinds = [...new Set(media.map(item => item.kind))].sort((a,b) => (labels[a] || a).localeCompare(labels[b] || b,'ko'));
    kindFilters.hidden = view === 'recipe';
    kindFilters.innerHTML = view === 'recipe' ? '' : `<button type="button" data-kind="all" class="${kind==='all'?'active':''}" aria-pressed="${kind==='all'}">전체</button>${kinds.map(value=>`<button type="button" data-kind="${esc(value)}" class="${kind===value?'active':''}" aria-pressed="${kind===value}">${esc(labels[value]||value)} <small>${media.filter(item=>item.kind===value).length}</small></button>`).join('')}`;
    const visibleMedia = view === 'recipe' ? [] : media.filter(item => (kind === 'all' || item.kind === kind) && `${item.title} ${labels[item.kind]||item.kind} ${item.status||''}`.toLocaleLowerCase().includes(query));
    let html = '';
    if (visibleRecipes.length) html += `<section class="life-group"><div class="life-group-heading"><div><p class="life-eyebrow">FROM MY KITCHEN</p><h2>식탁에서 <small>${visibleRecipes.length}</small></h2></div></div><div class="recipe-grid">${visibleRecipes.map(item=>card(item,'recipe')).join('')}</div></section>`;
    if (visibleMedia.length) {
      const grouped = kind === 'all' ? kinds.map(value=>[value,visibleMedia.filter(item=>item.kind===value)]).filter(([,items])=>items.length) : [[kind,visibleMedia]];
      html += grouped.map(([group,items])=>`<section class="life-group"><div class="life-group-heading"><div><p class="life-eyebrow">WATCHED, READ & SAVED</p><h2>${esc(labels[group]||group)} <small>${items.length}</small></h2></div></div><div class="media-grid">${items.map(item=>card(item,'media')).join('')}</div></section>`).join('');
    }
    results.innerHTML = html || '<p class="life-empty">이 조건에 맞는 기록이 아직 없어요.</p>';
    kindFilters.querySelectorAll('[data-kind]').forEach(button=>button.onclick=()=>{kind=button.dataset.kind;renderHome();});
  }

  function mediaDetail(path) {
    const id = decodeURIComponent(path.split('/').pop() || '');
    const item = media.find(value => value.id === id);
    if (!item) return '<p>기록을 찾을 수 없어요. <a href="/life/#/">목록으로 돌아가기</a></p>';
    const date = item.finished || item.started;
    return `<article class="media-detail"><a class="life-back" href="/life/#/">← 콘텐츠 모아보기</a><div class="media-detail-body">${item.cover?`<img src="${esc(item.cover)}" alt="${esc(item.title)} 표지">`:'<div class="detail-placeholder">✦</div>'}<div><p class="media-kind">${esc(labels[item.kind]||item.kind)}</p><h1>${esc(item.title)}</h1><p class="detail-caption">내 콘텐츠 목록에 적어 둔 기록이에요.</p><dl>${item.status?`<div><dt>상태</dt><dd>${esc(item.status==='ongoing'?'진행 중':item.status)}</dd></div>`:''}${date?`<div><dt>${item.finished?'완료일':'시작일'}</dt><dd>${esc(String(date).slice(0,10).replaceAll('-','.'))}</dd></div>`:''}${item.rating?`<div><dt>평점</dt><dd>★ ${esc(item.rating)}</dd></div>`:''}</dl><p class="detail-caption">감상이나 인상 깊었던 내용은 공개용으로 따로 정리한 뒤 여기에 더할 수 있어요.</p></div></div></article>`;
  }

  function afterRender(path) {
    if (path === '/') {
      document.title = '식탁과 일상 · 먹고, 보고, 읽고';
      renderHome();
      const search = document.getElementById('life-search');
      if (search) search.oninput = () => { query = search.value.normalize('NFC').toLocaleLowerCase().trim(); renderHome(); const updated = document.getElementById('life-search'); updated.focus(); updated.setSelectionRange(query.length,query.length); };
      document.querySelectorAll('.life-view-tabs [data-view]').forEach(button=>button.onclick=()=>{view=button.dataset.view;kind='all';renderHome();});
      return;
    }
    const isMedia = path.startsWith('/media/');
    const item = isMedia ? media.find(value=>value.id===decodeURIComponent(path.split('/').pop()||'')) : null;
    const heading = document.querySelector('.markdown-section h1');
    document.title = item ? `${item.title} · 식탁과 일상` : `${heading?.textContent || '레시피'} · 식탁과 일상`;
  }

  window.lifeBlog = {
    beforeEach(content, path) {
      if (path === '/') return homeMarkup();
      if (path.startsWith('/media/')) return mediaDetail(path);
      return `<p class="life-back"><a href="/life/#/">← 기록 모아보기</a></p>${content}`;
    },
    afterRender
  };
})();
