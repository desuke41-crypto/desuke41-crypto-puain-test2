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
  const bookmarkLabel = article.bookmarks ? `${article.bookmarks} USERS` : 'NEW POST';
  if (ranked) {
    return `<a class="rank-item" href="${article.url}" target="_blank" rel="noreferrer">
      <span class="rank-number">0${index + 1}</span>
      <span class="rank-copy"><small>${category}</small><h3>${title}</h3></span>
      <span class="rank-meta">${article.date}　·　${bookmarkLabel}</span><span class="arrow">↗</span>
    </a>`;
  }
  return `<a class="article-card" href="${article.url}" target="_blank" rel="noreferrer">
    <small>${category}</small><h3>${title}</h3><p>${escapeHtml(article.summary)}</p>
    <span class="card-footer"><span>${article.date}</span><span>${bookmarkLabel}　↗</span></span>
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
      category: entry.querySelector('category')?.getAttribute('term') || '', summary, date, bookmarks: 0,
    };
  });
}

async function bookmarkCount(url) {
  try {
    const response = await fetch(`https://bookmark.hatenaapis.com/count/entry?url=${encodeURIComponent(url)}`);
    if (!response.ok) return 0;
    return Number(await response.text()) || 0;
  } catch { return 0; }
}

async function loadBlog() {
  try {
    const response = await fetch(FEED_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    articles = parseFeed(await response.text());
    const counts = await Promise.all(articles.map((article) => bookmarkCount(article.url)));
    articles.forEach((article, index) => { article.bookmarks = counts[index]; });
    const popular = [...articles].sort((a, b) => b.bookmarks - a.bookmarks).slice(0, 5);
    ranking.innerHTML = popular.map((article, index) => articleMarkup(article, index, true)).join('');
    feedStatus.textContent = `${articles.length}件の公開記事をブログから読み込みました。`;
    renderArticles();
  } catch (error) {
    console.error(error);
    ranking.innerHTML = `<div class="load-error"><b>記事を読み込めませんでした。</b><span>ブログで人気記事をご覧ください。</span><a href="${BLOG_URL}archive" target="_blank" rel="noreferrer">desuke41のブログの記事一覧へ ↗</a></div>`;
    feedStatus.textContent = '記事を取得できませんでした。時間をおいて再読み込みしてください。';
  }
}

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
