const weatherGrid = document.querySelector('#weather-grid');
const weatherStatus = document.querySelector('#weather-status');
const lastUpdated = document.querySelector('#last-updated');
const refreshButtons = [
  document.querySelector('#refresh-weather'),
  document.querySelector('#refresh-weather-bottom'),
].filter(Boolean);

const WEATHER_CITIES = [
  { country: '日本', city: '福島市', latitude: 37.7608, longitude: 140.4747 },
  { country: '日本', city: '東京', latitude: 35.6762, longitude: 139.6503 },
  { country: '韓国', city: 'ソウル', latitude: 37.5665, longitude: 126.9780 },
  { country: '台湾', city: '台北', latitude: 25.0330, longitude: 121.5654 },
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

function setLoading(isLoading) {
  refreshButtons.forEach((button) => {
    button.disabled = isLoading;
    button.textContent = isLoading ? '読み込み中…' : button.id === 'refresh-weather-bottom' ? '↻ 再読み込み' : '↻ 最新情報に更新';
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

    weatherStatus.textContent = '4都市の最新データを表示しています。';
    lastUpdated.textContent = `最終更新 ${now}`;
  } catch (error) {
    console.error(error);
    weatherStatus.textContent = '天気を取得できませんでした。時間をおいて再読み込みしてください。';
    lastUpdated.textContent = 'データ更新に失敗しました';
  } finally {
    setLoading(false);
  }
}

refreshButtons.forEach((button) => button.addEventListener('click', loadWeather));
loadWeather();
