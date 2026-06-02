const articles = [
  { title: '朝の台所と、新しく迎えた器のこと', excerpt: '少しだけ早起きした休日。新しく迎えた白い器に、いつもの朝ごはんを盛り付けてみました。', category: '暮らし', date: '2025.03.18', iso: '2025-03-18', read: '5 min read', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=85', featured: true, likes: 124 },
  { title: '春を待つ、鎌倉ひとり散歩', excerpt: '海の近くを歩きながら、小さなお店を巡る一日。まだ少し冷たい風にも春の気配を感じました。', category: '旅', date: '2025.03.12', iso: '2025-03-12', read: '7 min read', image: 'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?auto=format&fit=crop&w=900&q=85', likes: 118 },
  { title: '休日に焼く、素朴なレモンケーキ', excerpt: '国産レモンの香りを楽しむ、混ぜて焼くだけの簡単なレシピ。お茶の時間が少し特別になります。', category: '食べもの', date: '2025.03.05', iso: '2025-03-05', read: '4 min read', image: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&w=900&q=85', likes: 96 },
  { title: '最近読んで、心に残った3冊', excerpt: '何度もページをめくり返したくなる本を、最近読んだものの中から3冊選びました。', category: '本と映画', date: '2025.02.27', iso: '2025-02-27', read: '6 min read', image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=85', likes: 78 },
  { title: '部屋にグリーンを。春の模様替え', excerpt: '窓辺に小さな植物を増やしました。置く場所や鉢選びで変わった、部屋の小さな景色。', category: '暮らし', date: '2025.02.20', iso: '2025-02-20', read: '5 min read', image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&q=85', likes: 89 },
  { title: '静かな温泉町で過ごす、冬の週末', excerpt: '雪の残る路地と、湯けむりの向こうに見えた山。何もしない時間を楽しむ小さな旅です。', category: '旅', date: '2025.02.11', iso: '2025-02-11', read: '8 min read', image: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=900&q=85', likes: 135 },
  { title: '毎日使うものこそ、気持ちのよいものを', excerpt: '台所の道具を少しだけ見直しました。長く使えるものを選ぶと、毎日の家事も軽やかに。', category: '暮らし', date: '2025.02.03', iso: '2025-02-03', read: '4 min read', image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=85', likes: 67 },
  { title: '喫茶店で考えた、余白のある時間', excerpt: '珈琲を待ちながら眺めた窓の外。予定を詰め込まない午後も、ときには必要なのかもしれません。', category: '日々のこと', date: '2025.01.28', iso: '2025-01-28', read: '3 min read', image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=900&q=85', likes: 76 },
  { title: '金沢で見つけた、おいしいもの帖', excerpt: '市場の海鮮丼、路地裏の甘味処、夜の小料理屋。金沢で味わったものをまとめました。', category: '旅', date: '2025.01.20', iso: '2025-01-20', read: '8 min read', image: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?auto=format&fit=crop&w=900&q=85', likes: 102 },
  { title: '冬の夜に作りたい、根菜のポタージュ', excerpt: '冷蔵庫にある野菜をじっくり煮込んで。寒い夜にほっとする、やさしい味のスープです。', category: '食べもの', date: '2025.01.14', iso: '2025-01-14', read: '4 min read', image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=85', likes: 82 },
  { title: '雨の日に観たい、静かな映画たち', excerpt: '家で過ごす午後に観たい、余韻の長い映画を集めました。温かい飲みものをお供にどうぞ。', category: '本と映画', date: '2025.01.06', iso: '2025-01-06', read: '5 min read', image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=85', likes: 71 },
  { title: '一年のはじまりに、暮らしを整える', excerpt: '新しい年を心地よく始めるために。大げさではない、身の回りの小さな整え方について。', category: '暮らし', date: '2025.01.02', iso: '2025-01-02', read: '6 min read', image: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=900&q=85', likes: 93 }
];

const grid = document.querySelector('#article-grid');
const count = document.querySelector('#article-count');
const emptyState = document.querySelector('#empty-state');
const searchInput = document.querySelector('#search-input');
const sortSelect = document.querySelector('#sort-select');
const categoryButtons = [...document.querySelectorAll('[data-category]')];
let activeCategory = 'すべて';

const render = () => {
  const term = searchInput.value.trim().toLowerCase();
  const filtered = articles
    .filter((article) => activeCategory === 'すべて' || article.category === activeCategory)
    .filter((article) => `${article.title}${article.excerpt}${article.category}`.toLowerCase().includes(term))
    .sort((a, b) => sortSelect.value === 'popular' ? b.likes - a.likes : sortSelect.value === 'oldest' ? a.iso.localeCompare(b.iso) : b.iso.localeCompare(a.iso));

  grid.innerHTML = filtered.map((article) => `
    <article class="article-card">
      <a class="article-image" href="#" aria-label="${article.title}を読む">
        <img src="${article.image}" alt="" loading="lazy" />
        ${article.featured ? '<span class="featured">FEATURED</span>' : ''}
      </a>
      <div class="article-body">
        <div class="article-meta"><span>${article.category}</span><time datetime="${article.iso}">${article.date}</time></div>
        <h3><a href="#">${article.title}</a></h3>
        <p>${article.excerpt}</p>
        <div class="article-footer"><small>${article.read}</small><a href="#" aria-label="${article.title}を読む">読む <span>→</span></a></div>
      </div>
    </article>`).join('');
  count.textContent = filtered.length;
  emptyState.hidden = filtered.length > 0;
  document.querySelector('.pagination').hidden = filtered.length === 0;
};

searchInput.addEventListener('input', render);
sortSelect.addEventListener('change', render);
categoryButtons.forEach((button) => button.addEventListener('click', () => {
  categoryButtons.forEach((item) => item.classList.remove('is-active'));
  button.classList.add('is-active');
  activeCategory = button.dataset.category;
  render();
}));

document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('[data-view]').forEach((item) => { item.classList.remove('is-active'); item.setAttribute('aria-pressed', 'false'); });
  button.classList.add('is-active');
  button.setAttribute('aria-pressed', 'true');
  grid.classList.toggle('is-list', button.dataset.view === 'list');
}));

document.querySelector('[data-focus-search]').addEventListener('click', () => {
  searchInput.focus();
  searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.desktop-nav');
menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  nav.classList.toggle('is-open', !isOpen);
});

render();
