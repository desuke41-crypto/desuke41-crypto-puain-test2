const filterButtons = document.querySelectorAll('.filter-button');
const blogCards = document.querySelectorAll('.blog-card');
const searchForm = document.querySelector('.search-form');
const searchInput = document.querySelector('#blog-search');
const resultCount = document.querySelector('#result-count');
let selectedCategory = 'all';
let searchTerm = '';

const updateResults = () => {
  let visibleCount = 0;

  blogCards.forEach((card) => {
    const matchesCategory = selectedCategory === 'all' || card.dataset.category === selectedCategory;
    const searchableText = `${card.textContent} ${card.dataset.keywords}`.toLowerCase();
    const matchesSearch = searchableText.includes(searchTerm.toLowerCase());
    const isVisible = matchesCategory && matchesSearch;

    card.classList.toggle('is-hidden', !isVisible);
    if (isVisible) visibleCount += 1;
  });

  if (resultCount) {
    resultCount.textContent = `${visibleCount}件のブログを表示しています`;
  }
};

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    filterButtons.forEach((item) => item.classList.remove('is-active'));
    button.classList.add('is-active');
    selectedCategory = button.dataset.category;
    updateResults();
  });
});

searchForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  searchTerm = searchInput?.value.trim() ?? '';
  updateResults();
});

searchInput?.addEventListener('input', () => {
  searchTerm = searchInput.value.trim();
  updateResults();
});
