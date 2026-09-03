const BLOG_URL = 'https://desuke41.hateblo.jp/';
const FEED_URL = `${BLOG_URL}feed`;
const ranking = document.querySelector('#ranking');
const grid = document.querySelector('#article-grid');
const repostGrid = document.querySelector('#repost-grid');
const search = document.querySelector('#search');
let articles = [];
let activeCategory = 'all';

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const safeUrl = (value) => { try { const url = new URL(value, BLOG_URL); return url.origin === new URL(BLOG_URL).origin ? url.href : BLOG_URL; } catch { return BLOG_URL; } };

function parseFeed(xml) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('フィードを解析できませんでした');
  return [...doc.querySelectorAll('entry')].map((entry) => {
    const raw = entry.querySelector('summary, content')?.textContent || '';
    const published = new Date(entry.querySelector('published, updated')?.textContent);
    return { title: entry.querySelector('title')?.textContent.trim() || '無題の記事', url: safeUrl(entry.querySelector('link[rel="alternate"]')?.getAttribute('href') || ''), category: entry.querySelector('category')?.getAttribute('term') || 'ブログ', summary: new DOMParser().parseFromString(raw, 'text/html').body.textContent.trim().slice(0, 110), published, date: Number.isNaN(published.valueOf()) ? '' : new Intl.DateTimeFormat('ja-JP').format(published), bookmarks: 0 };
  });
}

function rankMarkup(article, index) {
  const metric = article.pv ? `${Number(article.pv).toLocaleString()} PV` : `${article.bookmarks || 0} users`;
  return `<a class="rank-item" href="${safeUrl(article.url)}" target="_blank" rel="noreferrer"><span class="rank-number">${String(index + 1).padStart(2, '0')}</span><span class="rank-copy"><small>${escapeHtml(article.category)}</small><h3>${escapeHtml(article.title)}</h3></span><span class="rank-meta">${escapeHtml(article.date)}　·　${metric}</span><span class="arrow">↗</span></a>`;
}

function cardMarkup(article) { return `<a class="article-card" href="${safeUrl(article.url)}" target="_blank" rel="noreferrer"><small>${escapeHtml(article.category)}</small><h3>${escapeHtml(article.title)}</h3><p>${escapeHtml(article.summary)}</p><span class="card-footer"><span>${escapeHtml(article.date)}</span><span>READ ↗</span></span></a>`; }

function renderArticles() {
  const query = search.value.trim().toLowerCase();
  const visible = articles.filter((a) => (activeCategory === 'all' || a.category === activeCategory) && `${a.title}${a.summary}${a.category}`.toLowerCase().includes(query));
  grid.innerHTML = visible.map(cardMarkup).join('');
  document.querySelector('#result-count').textContent = `${visible.length} STORIES`;
  document.querySelector('#empty').hidden = visible.length > 0;
}

function renderFilters() {
  const categories = [...new Set(articles.map((a) => a.category))].slice(0, 6);
  document.querySelector('#category-filters').innerHTML = categories.map((c) => `<button class="filter" data-category="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('');
  document.querySelector('.filter-row').addEventListener('click', (event) => { const button = event.target.closest('.filter'); if (!button) return; document.querySelectorAll('.filter').forEach((item) => item.classList.remove('active')); button.classList.add('active'); activeCategory = button.dataset.category; renderArticles(); });
}

function renderReposts(sorted) {
  const oldEnough = sorted.filter((a) => Date.now() - a.published > 1000 * 60 * 60 * 24 * 120);
  const picks = (oldEnough.length >= 3 ? oldEnough : sorted).slice(0, 3);
  repostGrid.innerHTML = picks.map((a, i) => `<a class="repost-card" href="${safeUrl(a.url)}" target="_blank" rel="noreferrer"><span class="pick-number">PICK ${String(i + 1).padStart(2, '0')}　↗</span><h3>${escapeHtml(a.title)}</h3><p>${escapeHtml(a.summary)}</p><span class="reason">${a.bookmarks ? `反応の多かった記事 · ${a.bookmarks} users` : '時間をおいて、もう一度届けたい記事'}</span></a>`).join('');
}

async function bookmarkCount(url) { try { const response = await fetch(`https://bookmark.hatenaapis.com/count/entry?url=${encodeURIComponent(url)}`); return response.ok ? Number(await response.text()) || 0 : 0; } catch { return 0; } }

async function initialize() {
  try {
    const [feedResponse, popularResponse] = await Promise.all([fetch(FEED_URL), fetch('popular-posts.json', { cache: 'no-store' })]);
    if (!feedResponse.ok) throw new Error(`HTTP ${feedResponse.status}`);
    articles = parseFeed(await feedResponse.text());
    const popularData = popularResponse.ok ? await popularResponse.json() : { articles: [] };
    await Promise.all(articles.map(async (article) => { article.bookmarks = await bookmarkCount(article.url); }));
    const ranked = Array.isArray(popularData.articles) && popularData.articles.length ? popularData.articles : [...articles].sort((a, b) => b.bookmarks - a.bookmarks || b.published - a.published);
    ranking.innerHTML = ranked.slice(0, 5).map(rankMarkup).join('');
    document.querySelector('#ranking-description').textContent = popularData.articles?.length ? 'アクセス解析のPV順位で並べています。' : '公開されている、はてなブックマーク数を参考に並べています。';
    document.querySelector('#feed-status').textContent = `${articles.length}件の公開記事を読み込みました。`;
    document.querySelector('#hero-count').textContent = `${articles.length} STORIES / UPDATED TODAY`;
    renderReposts(ranked.map((rankedArticle) => articles.find((a) => a.url === rankedArticle.url) || rankedArticle));
    renderFilters(); renderArticles();
  } catch (error) {
    console.error(error);
    document.querySelector('#feed-status').textContent = '記事を取得できませんでした。時間をおいて再読み込みしてください。';
    ranking.innerHTML = '<p class="empty">ランキングを表示できませんでした。</p>';
    repostGrid.innerHTML = '<p class="loading-light">候補を選定できませんでした。</p>';
  }
}

search.addEventListener('input', renderArticles);
const menuButton = document.querySelector('.menu-button'); const nav = document.querySelector('.site-header nav');
menuButton.addEventListener('click', () => { const open = nav.classList.toggle('open'); menuButton.setAttribute('aria-expanded', String(open)); menuButton.textContent = open ? 'CLOSE' : 'MENU'; });
initialize();
