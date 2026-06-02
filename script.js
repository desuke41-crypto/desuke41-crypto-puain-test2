const manualArticles = [
  // ここに全記事を登録すると、RSSを使わずに一覧表示できます。
  // 例:
  // {
  //   title: '記事タイトル',
  //   url: 'https://your-blog.hatenablog.com/entry/2026/01/01/000000',
  //   date: '2026-01-01',
  //   categories: ['日記'],
  //   excerpt: '記事の抜粋をここに入れます。',
  // },
];

const STORAGE_KEY = 'my-hatena-blog-articles';
const articleList = document.querySelector('#article-list');
const emptyState = document.querySelector('#empty-state');
const visibleCount = document.querySelector('#visible-count');
const totalCount = document.querySelector('#total-count');
const feedForm = document.querySelector('.feed-form');
const feedInput = document.querySelector('#feed-url');
const feedStatus = document.querySelector('#feed-status');
const searchInput = document.querySelector('#article-search');
const monthFilter = document.querySelector('#month-filter');
const categoryFilter = document.querySelector('#category-filter');
const sortOrder = document.querySelector('#sort-order');
const clearButton = document.querySelector('.clear-button');

let articles = loadStoredArticles();
let filters = {
  search: '',
  month: 'all',
  category: 'all',
  sort: 'newest',
};

function loadStoredArticles() {
  const storedArticles = localStorage.getItem(STORAGE_KEY);
  if (storedArticles) {
    try {
      return JSON.parse(storedArticles);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  return manualArticles;
}

function saveArticles(nextArticles) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextArticles));
}

function normalizeFeedUrl(value) {
  const url = new URL(value);
  if (!url.pathname.endsWith('/rss')) {
    url.pathname = `${url.pathname.replace(/\/$/, '')}/rss`;
  }
  return url.toString();
}

function stripHtml(html) {
  const parser = new DOMParser();
  const documentFromHtml = parser.parseFromString(html, 'text/html');
  return documentFromHtml.body.textContent.replace(/\s+/g, ' ').trim();
}

function getEntryValue(entry, selector) {
  return entry.querySelector(selector)?.textContent.trim() ?? '';
}

function parseFeed(xmlText) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, 'application/xml');
  const parseError = xml.querySelector('parsererror');
  if (parseError) throw new Error('RSSの解析に失敗しました。');

  const entries = Array.from(xml.querySelectorAll('entry, item'));

  return entries.map((entry) => {
    const atomLink = entry.querySelector('link[rel="alternate"]')?.getAttribute('href') || entry.querySelector('link')?.textContent.trim();
    const rawDate = getEntryValue(entry, 'published') || getEntryValue(entry, 'updated') || getEntryValue(entry, 'pubDate');
    const summary = getEntryValue(entry, 'summary') || getEntryValue(entry, 'description') || getEntryValue(entry, 'content');
    const categories = Array.from(entry.querySelectorAll('category'))
      .map((category) => category.getAttribute('term') || category.textContent.trim())
      .filter(Boolean);

    return {
      title: getEntryValue(entry, 'title') || '無題の記事',
      url: atomLink || '#',
      date: rawDate ? new Date(rawDate).toISOString().slice(0, 10) : '',
      categories,
      excerpt: stripHtml(summary).slice(0, 140),
    };
  });
}

function formatDate(dateText) {
  if (!dateText) return '日付なし';
  return new Intl.DateTimeFormat('ja-JP', { dateStyle: 'medium' }).format(new Date(dateText));
}

function getMonth(dateText) {
  return dateText ? dateText.slice(0, 7) : 'unknown';
}

function uniqueValues(values) {
  return [...new Set(values)].filter(Boolean).sort((a, b) => b.localeCompare(a, 'ja'));
}

function updateFilterOptions() {
  const selectedMonth = monthFilter.value;
  const selectedCategory = categoryFilter.value;
  const months = uniqueValues(articles.map((article) => getMonth(article.date)));
  const categories = uniqueValues(articles.flatMap((article) => article.categories));

  monthFilter.innerHTML = '<option value="all">すべての年月</option>';
  months.forEach((month) => {
    const option = document.createElement('option');
    option.value = month;
    option.textContent = month === 'unknown' ? '日付なし' : month;
    monthFilter.append(option);
  });
  monthFilter.value = months.includes(selectedMonth) ? selectedMonth : 'all';

  categoryFilter.innerHTML = '<option value="all">すべてのカテゴリ</option>';
  categories.forEach((category) => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categoryFilter.append(option);
  });
  categoryFilter.value = categories.includes(selectedCategory) ? selectedCategory : 'all';
}

function getFilteredArticles() {
  const keyword = filters.search.toLowerCase();
  const filteredArticles = articles.filter((article) => {
    const matchesSearch = `${article.title} ${article.excerpt} ${article.categories.join(' ')}`.toLowerCase().includes(keyword);
    const matchesMonth = filters.month === 'all' || getMonth(article.date) === filters.month;
    const matchesCategory = filters.category === 'all' || article.categories.includes(filters.category);
    return matchesSearch && matchesMonth && matchesCategory;
  });

  return filteredArticles.sort((a, b) => {
    if (filters.sort === 'oldest') return new Date(a.date) - new Date(b.date);
    if (filters.sort === 'title') return a.title.localeCompare(b.title, 'ja');
    return new Date(b.date) - new Date(a.date);
  });
}

function renderArticles() {
  updateFilterOptions();
  const filteredArticles = getFilteredArticles();
  articleList.innerHTML = '';

  filteredArticles.forEach((article) => {
    const item = document.createElement('article');
    item.className = 'article-card';

    const publishedAt = document.createElement('time');
    publishedAt.dateTime = article.date;
    publishedAt.textContent = formatDate(article.date);

    const title = document.createElement('h3');
    const link = document.createElement('a');
    link.href = article.url;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.textContent = article.title;
    title.append(link);

    const excerpt = document.createElement('p');
    excerpt.textContent = article.excerpt || '抜粋はありません。';

    const meta = document.createElement('div');
    meta.className = 'article-meta';
    const categories = article.categories.length > 0 ? article.categories : ['カテゴリなし'];
    categories.forEach((category) => {
      const tag = document.createElement('span');
      tag.textContent = category;
      meta.append(tag);
    });

    item.append(publishedAt, title, excerpt, meta);
    articleList.append(item);
  });

  emptyState.hidden = articles.length > 0;
  visibleCount.textContent = String(filteredArticles.length);
  totalCount.textContent = `全${articles.length}件`;
}

feedForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!feedInput.value.trim()) return;

  const feedUrl = normalizeFeedUrl(feedInput.value.trim());
  feedStatus.textContent = 'RSSを読み込んでいます…';

  try {
    const response = await fetch(feedUrl);
    if (!response.ok) throw new Error('RSSを取得できませんでした。');
    const xmlText = await response.text();
    articles = parseFeed(xmlText);
    saveArticles(articles);
    feedStatus.textContent = `${articles.length}件の記事を読み込みました。`;
    renderArticles();
  } catch (error) {
    feedStatus.textContent = `${error.message} ブラウザから直接取得できない場合は、script.js の manualArticles に記事データを登録してください。`;
  }
});

searchInput?.addEventListener('input', () => {
  filters.search = searchInput.value.trim();
  renderArticles();
});

monthFilter?.addEventListener('change', () => {
  filters.month = monthFilter.value;
  renderArticles();
});

categoryFilter?.addEventListener('change', () => {
  filters.category = categoryFilter.value;
  renderArticles();
});

sortOrder?.addEventListener('change', () => {
  filters.sort = sortOrder.value;
  renderArticles();
});

clearButton?.addEventListener('click', () => {
  filters = { search: '', month: 'all', category: 'all', sort: 'newest' };
  searchInput.value = '';
  monthFilter.value = 'all';
  categoryFilter.value = 'all';
  sortOrder.value = 'newest';
  renderArticles();
});

renderArticles();
