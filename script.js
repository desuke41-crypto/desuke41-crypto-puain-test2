const BLOG_URL = 'https://desuke41.hateblo.jp/';
const FEED_URL = `${BLOG_URL}feed`;
const WEATHER_REFRESH_MS = 30 * 60 * 1000;

const ranking = document.querySelector('#ranking');
const grid = document.querySelector('#article-grid');
const repostGrid = document.querySelector('#repost-grid');
const search = document.querySelector('#search');
const weatherGrid = document.querySelector('#weather-grid');
const weatherStatus = document.querySelector('#weather-status');
const shareStatus = document.querySelector('#share-status');
const refreshWeatherButton = document.querySelector('#refresh-weather');

let articles = [];
let activeCategory = 'all';

const WEATHER_CITIES = [
  { country: '日本', city: '福島市', slug: 'fukushima', latitude: 37.7608, longitude: 140.4747 },
  { country: '日本', city: '東京', slug: 'tokyo', latitude: 35.6762, longitude: 139.6503 },
  { country: '韓国', city: 'ソウル', slug: 'seoul', latitude: 37.5665, longitude: 126.9780 },
  { country: '台湾', city: '台北', slug: 'taipei', latitude: 25.0330, longitude: 121.5654 },
];

const WEATHER_LABELS = {
  0: ['快晴', '☀'], 1: ['晴れ', '🌤'], 2: ['一部曇り', '⛅'], 3: ['曇り', '☁'],
  45: ['霧', '🌫'], 48: ['霧氷を伴う霧', '🌫'], 51: ['弱い霧雨', '🌦'], 53: ['霧雨', '🌦'],
  55: ['強い霧雨', '🌧'], 56: ['弱い着氷性の霧雨', '🌧'], 57: ['着氷性の霧雨', '🌧'],
  61: ['弱い雨', '🌦'], 63: ['雨', '🌧'], 65: ['強い雨', '🌧'], 66: ['弱い着氷性の雨', '🌧'],
  67: ['着氷性の雨', '🌧'], 71: ['弱い雪', '🌨'], 73: ['雪', '🌨'], 75: ['強い雪', '❄'],
  77: ['霧雪', '🌨'], 80: ['弱いにわか雨', '🌦'], 81: ['にわか雨', '🌧'], 82: ['激しいにわか雨', '⛈'],
  85: ['弱いにわか雪', '🌨'], 86: ['強いにわか雪', '❄'], 95: ['雷雨', '⛈'],
  96: ['ひょうを伴う雷雨', '⛈'], 99: ['激しいひょうを伴う雷雨', '⛈'],
};

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[char]));

const safeUrl = (value) => {
  try {
    const url = new URL(value, BLOG_URL);
    return url.origin === new URL(BLOG_URL).origin ? url.href : BLOG_URL;
  } catch {
    return BLOG_URL;
  }
};

function parseFeed(xml) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('フィードを解析できませんでした');
  return [...doc.querySelectorAll('entry')].map((entry) => {
    const raw = entry.querySelector('summary, content')?.textContent || '';
    const published = new Date(entry.querySelector('published, updated')?.textContent);
    return {
      title: entry.querySelector('title')?.textContent.trim() || '無題の記事',
      url: safeUrl(entry.querySelector('link[rel="alternate"]')?.getAttribute('href') || ''),
      category: entry.querySelector('category')?.getAttribute('term') || 'ブログ',
      summary: new DOMParser().parseFromString(raw, 'text/html').body.textContent.trim().slice(0, 110),
      published,
      date: Number.isNaN(published.valueOf()) ? '' : new Intl.DateTimeFormat('ja-JP').format(published),
      bookmarks: 0,
    };
  });
}

function rankMarkup(article, index) {
  const metric = article.pv ? `${Number(article.pv).toLocaleString()} PV` : `${article.bookmarks || 0} users`;
  return `<a class="rank-item" href="${safeUrl(article.url)}" target="_blank" rel="noreferrer"><span class="rank-number">${String(index + 1).padStart(2, '0')}</span><span class="rank-copy"><small>${escapeHtml(article.category)}</small><h3>${escapeHtml(article.title)}</h3></span><span class="rank-meta">${escapeHtml(article.date)}　·　${metric}</span><span class="arrow">↗</span></a>`;
}

function cardMarkup(article) {
  return `<a class="article-card" href="${safeUrl(article.url)}" target="_blank" rel="noreferrer"><small>${escapeHtml(article.category)}</small><h3>${escapeHtml(article.title)}</h3><p>${escapeHtml(article.summary)}</p><span class="card-footer"><span>${escapeHtml(article.date)}</span><span>READ ↗</span></span></a>`;
}

function renderArticles() {
  const query = search.value.trim().toLowerCase();
  const visible = articles.filter((article) => (
    (activeCategory === 'all' || article.category === activeCategory)
    && `${article.title}${article.summary}${article.category}`.toLowerCase().includes(query)
  ));
  grid.innerHTML = visible.map(cardMarkup).join('');
  document.querySelector('#result-count').textContent = `${visible.length} STORIES`;
  document.querySelector('#empty').hidden = visible.length > 0;
}

function renderFilters() {
  const categories = [...new Set(articles.map((article) => article.category))].slice(0, 6);
  document.querySelector('#category-filters').innerHTML = categories
    .map((category) => `<button class="filter" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`)
    .join('');
}

function renderReposts(sorted) {
  const oldEnough = sorted.filter((article) => Date.now() - article.published > 1000 * 60 * 60 * 24 * 120);
  const picks = (oldEnough.length >= 3 ? oldEnough : sorted).slice(0, 3);
  repostGrid.innerHTML = picks.map((article, index) => `<a class="repost-card" href="${safeUrl(article.url)}" target="_blank" rel="noreferrer"><span class="pick-number">PICK ${String(index + 1).padStart(2, '0')}　↗</span><h3>${escapeHtml(article.title)}</h3><p>${escapeHtml(article.summary)}</p><span class="reason">${article.bookmarks ? `反応の多かった記事 · ${article.bookmarks} users` : '時間をおいて、もう一度届けたい記事'}</span></a>`).join('');
}

async function bookmarkCount(url) {
  try {
    const response = await fetch(`https://bookmark.hatenaapis.com/count/entry?url=${encodeURIComponent(url)}`);
    return response.ok ? Number(await response.text()) || 0 : 0;
  } catch {
    return 0;
  }
}

async function initializeArticles() {
  try {
    const [feedResponse, popularResponse] = await Promise.all([
      fetch(FEED_URL),
      fetch('popular-posts.json', { cache: 'no-store' }),
    ]);
    if (!feedResponse.ok) throw new Error(`HTTP ${feedResponse.status}`);
    articles = parseFeed(await feedResponse.text());
    const popularData = popularResponse.ok ? await popularResponse.json() : { articles: [] };
    await Promise.all(articles.map(async (article) => { article.bookmarks = await bookmarkCount(article.url); }));
    const ranked = Array.isArray(popularData.articles) && popularData.articles.length
      ? popularData.articles
      : [...articles].sort((a, b) => b.bookmarks - a.bookmarks || b.published - a.published);
    ranking.innerHTML = ranked.slice(0, 5).map(rankMarkup).join('');
    document.querySelector('#ranking-description').textContent = popularData.articles?.length
      ? 'アクセス解析のPV順位で並べています。'
      : '公開されている、はてなブックマーク数を参考に並べています。';
    document.querySelector('#feed-status').textContent = `${articles.length}件の公開記事を読み込みました。`;
    document.querySelector('#hero-count').textContent = `${articles.length} STORIES / UPDATED TODAY`;
    renderReposts(ranked.map((rankedArticle) => articles.find((article) => article.url === rankedArticle.url) || rankedArticle));
    renderFilters();
    renderArticles();
  } catch (error) {
    console.error(error);
    document.querySelector('#feed-status').textContent = '記事を取得できませんでした。時間をおいて再読み込みしてください。';
    ranking.innerHTML = '<p class="empty">ランキングを表示できませんでした。</p>';
    repostGrid.innerHTML = '<p class="loading-light">候補を選定できませんでした。</p>';
  }
}

function weatherCardMarkup(location, forecast) {
  const [condition, icon] = WEATHER_LABELS[forecast.current.weather_code] || ['天気情報', '🌡'];
  const temperature = Math.round(forecast.current.temperature_2m);
  const apparent = Math.round(forecast.current.apparent_temperature);
  const maximum = Math.round(forecast.daily.temperature_2m_max[0]);
  const minimum = Math.round(forecast.daily.temperature_2m_min[0]);
  const rain = forecast.daily.precipitation_probability_max[0] ?? 0;
  const wind = Math.round(forecast.current.wind_speed_10m);
  return `<article class="weather-card" id="weather-${location.slug}">
    <div class="weather-place"><p>${escapeHtml(location.country)}</p><h3>${escapeHtml(location.city)}</h3></div>
    <span class="weather-icon" aria-hidden="true">${icon}</span>
    <div class="weather-now"><strong>${temperature}<small>°C</small></strong><p>${condition}</p></div>
    <dl><div><dt>最高 / 最低</dt><dd>${maximum}° / ${minimum}°</dd></div><div><dt>降水確率</dt><dd>${rain}%</dd></div><div><dt>体感 / 風速</dt><dd>${apparent}° / ${wind} km/h</dd></div></dl>
    <button class="share-weather" type="button" data-city="${escapeHtml(location.city)}" data-country="${escapeHtml(location.country)}" data-slug="${location.slug}">ブログ用リンクをコピー</button>
  </article>`;
}

function weatherErrorMarkup(location) {
  return `<article class="weather-card weather-card-error" id="weather-${location.slug}">
    <div class="weather-place"><p>${escapeHtml(location.country)}</p><h3>${escapeHtml(location.city)}</h3></div>
    <span class="weather-icon" aria-hidden="true">🌡</span>
    <p class="weather-unavailable">現在の天気データは利用できません。</p>
    <button class="share-weather" type="button" data-city="${escapeHtml(location.city)}" data-country="${escapeHtml(location.country)}" data-slug="${location.slug}">ブログ用リンクをコピー</button>
  </article>`;
}

async function fetchWeather(location) {
  const parameters = new URLSearchParams({
    latitude: location.latitude,
    longitude: location.longitude,
    current: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: 'auto',
    forecast_days: '1',
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${parameters}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`${location.city}: HTTP ${response.status}`);
  return response.json();
}

function scrollToWeatherHash() {
  const targetId = decodeURIComponent(window.location.hash.slice(1));
  if (!targetId.startsWith('weather-')) return;
  const target = document.getElementById(targetId);
  if (target) requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
}

async function loadWeather() {
  refreshWeatherButton.disabled = true;
  weatherGrid.setAttribute('aria-busy', 'true');
  weatherStatus.textContent = '4都市の最新データを取得しています…';
  shareStatus.textContent = '';
  const results = await Promise.allSettled(WEATHER_CITIES.map(fetchWeather));
  weatherGrid.innerHTML = results.map((result, index) => (
    result.status === 'fulfilled'
      ? weatherCardMarkup(WEATHER_CITIES[index], result.value)
      : weatherErrorMarkup(WEATHER_CITIES[index])
  )).join('');
  const successCount = results.filter((result) => result.status === 'fulfilled').length;
  const now = new Intl.DateTimeFormat('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date());
  weatherStatus.textContent = successCount === WEATHER_CITIES.length
    ? `4都市の最新データを表示しています。最終更新 ${now}`
    : `${successCount}都市を表示しています。取得できなかった都市は時間をおいて再読み込みしてください。`;
  weatherGrid.setAttribute('aria-busy', 'false');
  refreshWeatherButton.disabled = false;
  scrollToWeatherHash();
}

function copyPlainText(value) {
  if (typeof document.execCommand !== 'function') return false;
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.append(textarea);
  textarea.select();
  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  } finally {
    textarea.remove();
  }
  return copied;
}

async function copyWeatherLink(button) {
  const label = `${button.dataset.country}・${button.dataset.city}の天気予報`;
  const targetUrl = new URL(window.location.href);
  targetUrl.hash = `weather-${button.dataset.slug}`;
  const url = targetUrl.href;
  const html = `<a href="${url}">${escapeHtml(label)}</a>`;
  const markdown = `[${label}](${url})`;

  try {
    if (navigator.clipboard?.write && window.ClipboardItem) {
      await navigator.clipboard.write([new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([markdown], { type: 'text/plain' }),
      })]);
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(markdown);
    } else if (!copyPlainText(markdown)) {
      throw new Error('このブラウザではコピーが許可されませんでした');
    }
    shareStatus.textContent = `「${label}」の文字付きリンクをコピーしました。ブログの編集画面に貼り付けてください。`;
  } catch (error) {
    console.error(error);
    if (copyPlainText(markdown)) {
      shareStatus.textContent = `「${label}」のMarkdownリンクをコピーしました。`;
    } else {
      shareStatus.textContent = 'リンクをコピーできませんでした。ブラウザのコピー許可を確認してください。';
    }
  }
}

search.addEventListener('input', renderArticles);
document.querySelector('.filter-row').addEventListener('click', (event) => {
  const button = event.target.closest('.filter');
  if (!button) return;
  document.querySelectorAll('.filter').forEach((item) => item.classList.remove('active'));
  button.classList.add('active');
  activeCategory = button.dataset.category;
  renderArticles();
});
weatherGrid.addEventListener('click', (event) => {
  const button = event.target.closest('.share-weather');
  if (button) copyWeatherLink(button);
});
refreshWeatherButton.addEventListener('click', loadWeather);

const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.site-header nav');
menuButton.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.textContent = open ? 'CLOSE' : 'MENU';
});
nav.addEventListener('click', () => {
  nav.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.textContent = 'MENU';
});

initializeArticles();
loadWeather();
window.setInterval(loadWeather, WEATHER_REFRESH_MS);
window.addEventListener('hashchange', scrollToWeatherHash);
