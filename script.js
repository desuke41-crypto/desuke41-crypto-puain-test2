const cards = [...document.querySelectorAll('.weather-card')];
const unitSwitch = document.querySelector('.unit-switch');
const unitLabels = unitSwitch.querySelectorAll('span');
const updatedAt = document.querySelector('#updated-at');
const refreshButton = document.querySelector('#refresh-weather');
let useFahrenheit = false;
const weatherData = new Map();

const weatherCodes = {
  0: ['快晴', 'sun'], 1: ['晴れ', 'partly'], 2: ['晴れ時々くもり', 'partly'], 3: ['くもり', 'cloud'],
  45: ['霧', 'cloud'], 48: ['霧', 'cloud'], 51: ['弱い霧雨', 'rain'], 53: ['霧雨', 'rain'], 55: ['強い霧雨', 'rain'],
  61: ['弱い雨', 'rain'], 63: ['雨', 'rain'], 65: ['強い雨', 'rain'], 71: ['弱い雪', 'snow'], 73: ['雪', 'snow'],
  75: ['強い雪', 'snow'], 80: ['にわか雨', 'rain'], 81: ['にわか雨', 'rain'], 82: ['激しい雨', 'rain'],
  85: ['にわか雪', 'snow'], 86: ['強いにわか雪', 'snow'], 95: ['雷雨', 'storm'], 96: ['雷雨・ひょう', 'storm'], 99: ['激しい雷雨', 'storm'],
};

const displayTemp = (celsius) => useFahrenheit ? Math.round((celsius * 9) / 5 + 32) : Math.round(celsius);
const weatherInfo = (code, isDay = true) => {
  const [label, icon] = weatherCodes[code] ?? ['天気不明', 'cloud'];
  return [label, code === 0 && !isDay ? 'moon' : icon];
};

function renderCard(card, data) {
  const current = data.current;
  const [condition, iconClass] = weatherInfo(current.weather_code, Boolean(current.is_day));
  card.querySelector('.local-time').textContent = current.time.slice(11, 16);
  card.querySelector('.weather-icon').className = `weather-icon ${iconClass}`;
  card.querySelector('.weather-icon').setAttribute('aria-label', condition);
  card.querySelector('.temp strong').textContent = displayTemp(current.temperature_2m);
  card.querySelector('.temp sup').textContent = useFahrenheit ? '°F' : '°C';
  card.querySelector('.condition').innerHTML = `${condition} <span>・</span> 体感 ${displayTemp(current.apparent_temperature)}°`;
  const details = card.querySelectorAll('.details b');
  details[0].textContent = `${current.precipitation_probability ?? 0}%`;
  details[1].textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  details[2].textContent = `${current.relative_humidity_2m}%`;
  card.querySelector('.mini-forecast').innerHTML = data.daily.time.slice(1, 4).map((date, index) => {
    const i = index + 1;
    const [label, icon] = weatherInfo(data.daily.weather_code[i]);
    const weekday = new Intl.DateTimeFormat('ja-JP', { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
    return `<div><small>${weekday}</small><i class="forecast-icon ${icon}" aria-label="${label}"></i><b>${displayTemp(data.daily.temperature_2m_max[i])}°</b><span>${displayTemp(data.daily.temperature_2m_min[i])}°</span></div>`;
  }).join('');
  card.classList.remove('is-loading');
}

async function fetchCityWeather(card) {
  const params = new URLSearchParams({
    latitude: card.dataset.latitude, longitude: card.dataset.longitude,
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation_probability,weather_code,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min', timezone: 'auto', forecast_days: '4',
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!response.ok) throw new Error(`天気APIエラー: ${response.status}`);
  return response.json();
}

async function updateWeather() {
  refreshButton.disabled = true;
  updatedAt.classList.remove('error');
  updatedAt.lastChild.textContent = ' 最新の天気を取得しています…';
  cards.forEach((card) => card.classList.add('is-loading'));
  const results = await Promise.allSettled(cards.map(fetchCityWeather));
  let successful = 0;
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      weatherData.set(cards[index].dataset.city, result.value);
      renderCard(cards[index], result.value);
      successful += 1;
    } else {
      cards[index].classList.remove('is-loading');
      console.error(result.reason);
    }
  });
  if (successful === cards.length) {
    updatedAt.lastChild.textContent = ` 最終更新：${new Intl.DateTimeFormat('ja-JP', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())}`;
  } else {
    updatedAt.classList.add('error');
    updatedAt.lastChild.textContent = successful ? ` ${successful}/${cards.length}都市を更新しました。再度お試しください。` : ' 天気を取得できませんでした。通信環境をご確認ください。';
  }
  refreshButton.disabled = false;
}

unitSwitch.addEventListener('click', () => {
  useFahrenheit = !useFahrenheit;
  unitLabels[0].classList.toggle('selected', !useFahrenheit);
  unitLabels[1].classList.toggle('selected', useFahrenheit);
  cards.forEach((card) => {
    const data = weatherData.get(card.dataset.city);
    if (data) renderCard(card, data);
  });
});
refreshButton.addEventListener('click', updateWeather);
updateWeather();
