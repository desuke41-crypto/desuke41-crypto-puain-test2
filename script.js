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
  const rankingLabel = ranked ? article.rankLabel : 'NEW POST';
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
  if (!popular.length) return false;
  setRankingHeading('人気記事', 'PV RANKING', 'はてなブログのアクセス解析で確認したPV順位です。');
  ranking.innerHTML = popular.map((article, index) => articleMarkup({
    title: article.title || '無題の記事', url: article.url, category: article.category || '',
    summary: article.summary || '', date: article.date || '',
    rankLabel: Number.isFinite(article.pv) ? `${article.pv.toLocaleString()} PV` : 'アクセス解析順位',
  }, index, true)).join('');
  return true;
}

function setRankingHeading(title, kicker, description) {
  document.querySelector('#ranking-title').textContent = title;
  document.querySelector('#ranking-kicker').textContent = kicker;
  document.querySelector('#ranking-description').textContent = description;
}

async function bookmarkCount(url) {
  try {
    const response = await fetch(`https://bookmark.hatenaapis.com/count/entry?url=${encodeURIComponent(url)}`);
    if (!response.ok) return { available: false, count: 0 };
    return { available: true, count: Number(await response.text()) || 0 };
  } catch (error) {
    console.error(error);
    return { available: false, count: 0 };
  }
}

async function renderPublicRanking() {
  const results = await Promise.all(articles.map((article) => bookmarkCount(article.url)));
  if (results.some((result) => result.available)) {
    const bookmarked = articles.map((article, index) => ({
      ...article, bookmarks: results[index].count, rankLabel: `${results[index].count} users`,
    })).sort((a, b) => b.bookmarks - a.bookmarks).slice(0, 5);
    setRankingHeading('人気記事', 'HATENA BOOKMARKS', '実アクセス数は公開されていないため、はてなブックマーク数順です。');
    ranking.innerHTML = bookmarked.map((article, index) => articleMarkup(article, index, true)).join('');
    return;
  }
  const recent = articles.slice(0, 5).map((article) => ({ ...article, rankLabel: 'PVデータ利用不可' }));
  setRankingHeading('新着記事（ランキングなし）', 'LATEST POSTS', 'PV数・はてなブックマーク数を取得できなかったため、新着順です。');
  ranking.innerHTML = recent.map((article, index) => articleMarkup(article, index, true)).join('');
}

async function loadBlog(hasAccessRanking) {
  try {
    const response = await fetch(FEED_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    articles = parseFeed(await response.text());
    feedStatus.textContent = `${articles.length}件の公開記事をブログから読み込みました。`;
    renderArticles();
    if (!hasAccessRanking) await renderPublicRanking();
  } catch (error) {
    console.error(error);
    feedStatus.textContent = '記事を取得できませんでした。時間をおいて再読み込みしてください。';
  }
}

async function initialize() {
  let hasAccessRanking = false;
  try {
    hasAccessRanking = renderPopular(await loadPopularArticles());
  } catch (error) {
    console.error(error);
  }
  await loadBlog(hasAccessRanking);
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
initialize();
