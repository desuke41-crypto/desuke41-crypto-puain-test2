const BLOG_URL = 'https://desuke41.hateblo.jp/';
const FEED_URL = `${BLOG_URL}feed`;
const ranking = document.querySelector('#ranking');
const grid = document.querySelector('#article-grid');
const empty = document.querySelector('#empty');
const search = document.querySelector('#search');
const feedStatus = document.querySelector('#feed-status');
const weatherGrid = document.querySelector('#weather-grid');
const weatherStatus = document.querySelector('#weather-status');
const shareStatus = document.querySelector('#share-status');
let articles = [];

const WEATHER_CITIES = [
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

const shareButtonMarkup = (location) => `<button class="share-weather" type="button" data-city="${location.city}" data-country="${location.country}" data-slug="${location.slug}">ブログ用リンクをコピー</button>`;

const escapeHtml = (value) => value.replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[character]));

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

async function loadWeather() {
  try {
    const forecasts = await Promise.all(WEATHER_CITIES.map(async (location) => {
      const parameters = new URLSearchParams({
        latitude: location.latitude,
        longitude: location.longitude,
        current: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m',
        daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max',
        timezone: 'auto',
        forecast_days: '1',
      });
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${parameters}`);
      if (!response.ok) throw new Error(`天気API: HTTP ${response.status}`);
      return { location, forecast: await response.json() };
    }));

    weatherGrid.innerHTML = forecasts.map(({ location, forecast }) => {
      const [condition, icon] = WEATHER_LABELS[forecast.current.weather_code] || ['天気情報', '🌡'];
      const temperature = Math.round(forecast.current.temperature_2m);
      const apparent = Math.round(forecast.current.apparent_temperature);
      const maximum = Math.round(forecast.daily.temperature_2m_max[0]);
      const minimum = Math.round(forecast.daily.temperature_2m_min[0]);
      const rain = forecast.daily.precipitation_probability_max[0] ?? 0;
      const wind = Math.round(forecast.current.wind_speed_10m);
      return `<article class="weather-card" id="weather-${location.slug}">
        <div class="weather-place"><p>${location.country}</p><h3>${location.city}</h3></div>
        <span class="weather-icon" aria-hidden="true">${icon}</span>
        <div class="weather-now"><strong>${temperature}<small>°C</small></strong><p>${condition}</p></div>
        <dl><div><dt>最高 / 最低</dt><dd>${maximum}° / ${minimum}°</dd></div><div><dt>降水確率</dt><dd>${rain}%</dd></div><div><dt>体感 / 風速</dt><dd>${apparent}° / ${wind} km/h</dd></div></dl>
        ${shareButtonMarkup(location)}
      </article>`;
    }).join('');
    weatherStatus.textContent = '3都市の最新データを表示しています。';
  } catch (error) {
    console.error(error);
    weatherStatus.textContent = '天気を取得できませんでした。時間をおいて再読み込みしてください。';
    weatherGrid.innerHTML = WEATHER_CITIES.map((location) => `<article class="weather-card weather-card-error" id="weather-${location.slug}">
      <div class="weather-place"><p>${location.country}</p><h3>${location.city}</h3></div>
      <span class="weather-icon" aria-hidden="true">🌡</span>
      <p class="weather-unavailable">現在の天気データは利用できません。</p>
      ${shareButtonMarkup(location)}
    </article>`).join('');
  }
}

function copyPlainText(value) {
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.append(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}

async function copyWeatherLink(button) {
  const label = `${button.dataset.country}・${button.dataset.city}の天気予報`;
  const url = new URL(`#weather-${button.dataset.slug}`, window.location.href).href;
  const html = `<a href="${url}">${label}</a>`;
  const markdown = `[${label}](${url})`;

  try {
    if (navigator.clipboard?.write && window.ClipboardItem) {
      await navigator.clipboard.write([new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([markdown], { type: 'text/plain' }),
      })]);
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(markdown);
    } else {
      copyPlainText(markdown);
    }
    shareStatus.textContent = `「${label}」の文字付きリンクをコピーしました。ブログの編集画面に貼り付けてください。`;
  } catch (error) {
    console.error(error);
    copyPlainText(markdown);
    shareStatus.textContent = `「${label}」のMarkdownリンクをコピーしました。`;
  }
}

function parseFeed(xml) {
  const documentNode = new DOMParser().parseFromString(xml, 'application/xml');
  if (documentNode.querySelector('parsererror')) throw new Error('フィードを解析できませんでした');
  const feed = documentNode.documentElement;
  const blogDescription = feed.querySelector(':scope > subtitle')?.textContent.trim();
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

async function loadWeather() {
  setLoading(true);
  weatherStatus.textContent = '福島市・東京・ソウル・台北の最新データを取得しています…';

  try {
    const forecasts = await Promise.all(WEATHER_CITIES.map(async (location) => {
      const parameters = new URLSearchParams({
        latitude: location.latitude,
        longitude: location.longitude,
        current: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m',
        daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max',
        timezone: 'auto',
        forecast_days: '1',
      });

      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${parameters}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`天気API: HTTP ${response.status}`);
      return { location, forecast: await response.json() };
    }));

    weatherGrid.innerHTML = forecasts.map(({ location, forecast }) => {
      const [condition, icon] = WEATHER_LABELS[forecast.current.weather_code] || ['天気情報', '🌡'];
      const temperature = Math.round(forecast.current.temperature_2m);
      const apparent = Math.round(forecast.current.apparent_temperature);
      const maximum = Math.round(forecast.daily.temperature_2m_max[0]);
      const minimum = Math.round(forecast.daily.temperature_2m_min[0]);
      const rain = forecast.daily.precipitation_probability_max[0] ?? 0;
      const wind = Math.round(forecast.current.wind_speed_10m);

      return `<article class="weather-card">
        <div class="weather-place"><p>${location.country}</p><h3>${location.city}</h3></div>
        <span class="weather-icon" aria-hidden="true">${icon}</span>
        <div class="weather-now"><strong>${temperature}<small>°C</small></strong><p>${condition}</p></div>
        <dl>
          <div><dt>最高 / 最低</dt><dd>${maximum}° / ${minimum}°</dd></div>
          <div><dt>降水確率</dt><dd>${rain}%</dd></div>
          <div><dt>体感 / 風速</dt><dd>${apparent}° / ${wind} km/h</dd></div>
        </dl>
      </article>`;
    }).join('');

    const now = new Intl.DateTimeFormat('ja-JP', {
      month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(new Date());

async function initialize() {
  loadWeather();
  let hasAccessRanking = false;
  try {
    hasAccessRanking = renderPopular(await loadPopularArticles());
  } catch (error) {
    console.error(error);
    weatherStatus.textContent = '天気を取得できませんでした。時間をおいて再読み込みしてください。';
    lastUpdated.textContent = 'データ更新に失敗しました';
  } finally {
    setLoading(false);
  }
}

search.addEventListener('input', renderArticles);
weatherGrid.addEventListener('click', (event) => {
  const button = event.target.closest('.share-weather');
  if (button) copyWeatherLink(button);
});
const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.site-header nav');
menuButton.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.textContent = isOpen ? 'CLOSE' : 'MENU';
});
nav.addEventListener('click', () => { nav.classList.remove('open'); menuButton.setAttribute('aria-expanded', 'false'); menuButton.textContent = 'MENU'; });
initialize();
