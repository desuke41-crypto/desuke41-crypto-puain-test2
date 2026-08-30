const BLOG_URL = 'https://desuke41.hateblo.jp/';
const FEED_URL = `${BLOG_URL}feed`;
const ranking = document.querySelector('#ranking');
const grid = document.querySelector('#article-grid');
const empty = document.querySelector('#empty');
const search = document.querySelector('#search');
const feedStatus = document.querySelector('#feed-status');
let articles = [];

const escapeHtml = (value) => value.replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[character]));

function articleMarkup(article, index, ranked = false) {
  const title = escapeHtml(article.title);
  const category = escapeHtml(article.category || 'ブログ記事');
  const rankingLabel = ranked ? 'MOST READ' : 'NEW POST';
  if (ranked) {
    return `<a class="rank-item" href="${article.url}" target="_blank" rel="noreferrer">
      <span class="rank-number">0${index + 1}</span>
      <span class="rank-copy"><small>${category}</small><h3>${title}</h3></span>
      <span class="rank-meta">${article.date}　·　${rankingLabel}</span><span class="arrow">↗</span>
    </a>`;
  }
  return `<a class="article-card" href="${article.url}" target="_blank" rel="noreferrer">
    <small>${category}</small><h3>${title}</h3><p>${escapeHtml(article.summary)}</p>
    <span class="card-footer"><span>${article.date}</span><span>${rankingLabel}　↗</span></span>
  </a>`;
}

function renderArticles() {
  const query = search.value.trim().toLowerCase();
  const visible = articles.filter((article) => `${article.title}${article.summary}${article.category}`.toLowerCase().includes(query));
  grid.innerHTML = visible.map((article, index) => articleMarkup(article, index)).join('');
  empty.hidden = visible.length > 0 || !articles.length;
}

function parseFeed(xml) {
  const documentNode = new DOMParser().parseFromString(xml, 'application/xml');
  if (documentNode.querySelector('parsererror')) throw new Error('フィードを解析できませんでした');
  const feed = documentNode.documentElement;
  const blogTitle = feed.querySelector(':scope > title')?.textContent.trim();
  const blogDescription = feed.querySelector(':scope > subtitle')?.textContent.trim();
  if (blogTitle) {
    document.querySelectorAll('[data-blog-title]').forEach((element) => { element.textContent = blogTitle; });
    document.title = `${blogTitle}｜人気記事`;
  }
  if (blogDescription) document.querySelector('#blog-description').textContent = blogDescription;
  return [...feed.querySelectorAll('entry')].map((entry) => {
    const rawSummary = entry.querySelector('summary, content')?.textContent || '';
    const summary = new DOMParser().parseFromString(rawSummary, 'text/html').body.textContent.trim().slice(0, 90);
    const date = new Intl.DateTimeFormat('ja-JP').format(new Date(entry.querySelector('published, updated')?.textContent));
    return {
      title: entry.querySelector('title')?.textContent.trim() || '無題の記事',
      url: entry.querySelector('link[rel="alternate"]')?.getAttribute('href') || entry.querySelector('link')?.getAttribute('href') || BLOG_URL,
      category: entry.querySelector('category')?.getAttribute('term') || '', summary, date,
    };
  });
}

async function loadPopularArticles() {
  const response = await fetch('popular-posts.json', { cache: 'no-store' });
  if (!response.ok) throw new Error(`人気記事設定: HTTP ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data.articles)) throw new Error('人気記事設定の形式が正しくありません');
  return data;
}

function renderPopular(data) {
  const popular = data.articles.slice(0, 5);
  if (!popular.length) {
    ranking.innerHTML = `<div class="load-error"><b>アクセス数に基づく注目記事は準備中です。</b><span>アクセス数は公開APIから取得できないため、管理画面の「アクセス解析」または公式の「注目記事」を確認して設定します。</span><a href="${BLOG_URL}archive" target="_blank" rel="noreferrer">すべての記事を見る ↗</a></div>`;
    return;
  }
  ranking.innerHTML = popular.map((article, index) => articleMarkup({
    title: article.title || '無題の記事', url: article.url, category: article.category || '',
    summary: article.summary || '', date: article.date || '',
  }, index, true)).join('');
}

async function loadBlog() {
  try {
    const response = await fetch(FEED_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    articles = parseFeed(await response.text());
    feedStatus.textContent = `${articles.length}件の公開記事をブログから読み込みました。`;
    renderArticles();
  } catch (error) {
    console.error(error);
    feedStatus.textContent = '記事を取得できませんでした。時間をおいて再読み込みしてください。';
  }
}

loadPopularArticles().then(renderPopular).catch((error) => {
  console.error(error);
  ranking.innerHTML = '<div class="load-error"><b>注目記事の設定を読み込めませんでした。</b><span>時間をおいて再読み込みしてください。</span></div>';
});

search.addEventListener('input', renderArticles);
const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.site-header nav');
menuButton.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.textContent = isOpen ? 'CLOSE' : 'MENU';
});
nav.addEventListener('click', () => { nav.classList.remove('open'); menuButton.setAttribute('aria-expanded', 'false'); menuButton.textContent = 'MENU'; });
loadBlog();
