const articles = [
  { title: '知っておきたい、お金とのちょうどいい付き合い方', category: 'お金', date: '2026.08.18', minutes: 6, summary: '難しく考えすぎず、今日から始められる小さな習慣をまとめました。' },
  { title: '毎日の暮らしを少し軽くする、7つの小さな工夫', category: '暮らし', date: '2026.08.10', minutes: 5, summary: '無理なく続けられて、生活に余白が生まれるアイデアをご紹介。' },
  { title: 'はじめてでもわかる、デジタル資産の基礎知識', category: 'デジタル', date: '2026.07.29', minutes: 8, summary: 'よく耳にする言葉や仕組みを、初心者向けにやさしく解説します。' },
  { title: '大人になってからの「学び直し」を楽しむコツ', category: '学び', date: '2026.07.16', minutes: 4, summary: '勉強を義務にしない、自分のペースで学び続けるヒント。' },
  { title: '情報に疲れないために、私がやめた5つのこと', category: '暮らし', date: '2026.07.02', minutes: 5, summary: '情報との距離を整えて、大切なことに集中するための記録です。' },
  { title: '今日から見直す、シンプルな家計の整え方', category: 'お金', date: '2026.06.21', minutes: 7, summary: '続けやすさを第一にした、家計を把握するための基本ステップ。' },
];

const blogUrl = 'https://desuke41.hateblo.jp/';
const ranking = document.querySelector('#ranking');
const grid = document.querySelector('#article-grid');
const empty = document.querySelector('#empty');
const search = document.querySelector('#search');
const filterButtons = [...document.querySelectorAll('[data-filter]')];
let activeFilter = 'all';

ranking.innerHTML = articles.slice(0, 5).map((article, index) => `
  <a class="rank-item" href="${blogUrl}" target="_blank" rel="noreferrer">
    <span class="rank-number">0${index + 1}</span>
    <span class="rank-copy"><small>${article.category}</small><h3>${article.title}</h3></span>
    <span class="rank-meta">${article.date}　·　${article.minutes} MIN READ</span><span class="arrow">↗</span>
  </a>`).join('');

function renderArticles() {
  const query = search.value.trim().toLowerCase();
  const visible = articles.filter((article) => (activeFilter === 'all' || article.category === activeFilter) && `${article.title}${article.summary}`.toLowerCase().includes(query));
  grid.innerHTML = visible.map((article) => `
    <a class="article-card" href="${blogUrl}" target="_blank" rel="noreferrer">
      <small>${article.category}</small><h3>${article.title}</h3><p>${article.summary}</p>
      <span class="card-footer"><span>${article.date}</span><span>${article.minutes} MIN READ　↗</span></span>
    </a>`).join('');
  empty.hidden = visible.length > 0;
}

filterButtons.forEach((button) => button.addEventListener('click', () => {
  activeFilter = button.dataset.filter;
  filterButtons.forEach((item) => item.classList.toggle('selected', item === button));
  renderArticles();
}));
search.addEventListener('input', renderArticles);

const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.site-header nav');
menuButton.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.textContent = isOpen ? 'CLOSE' : 'MENU';
});
nav.addEventListener('click', () => { nav.classList.remove('open'); menuButton.setAttribute('aria-expanded', 'false'); menuButton.textContent = 'MENU'; });
renderArticles();
