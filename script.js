const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.main-nav');
const searchToggle = document.querySelector('.search-toggle');
const searchPanel = document.querySelector('.search-panel');

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  nav?.classList.toggle('open', !isOpen);
});

searchToggle?.addEventListener('click', () => {
  const isOpen = searchToggle.getAttribute('aria-expanded') === 'true';
  searchToggle.setAttribute('aria-expanded', String(!isOpen));
  searchPanel?.classList.toggle('open', !isOpen);
  searchPanel?.setAttribute('aria-hidden', String(isOpen));
  if (!isOpen) searchPanel?.querySelector('input')?.focus();
});

document.querySelectorAll('.category').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelector('.category.active')?.classList.remove('active');
    button.classList.add('active');
    const selected = button.dataset.category;
    document.querySelectorAll('.article-card').forEach((card) => {
      card.classList.toggle('is-hidden', selected !== 'all' && card.dataset.category !== selected);
    });
  });
});

document.querySelectorAll('.bookmark').forEach((button) => {
  button.addEventListener('click', () => {
    const saved = button.classList.toggle('saved');
    button.setAttribute('aria-label', saved ? '保存済みの記事' : '記事を保存');
    const count = Number(button.textContent.trim().replace('♡', '').replace('♥', ''));
    button.innerHTML = `<span>${saved ? '♥' : '♡'}</span> ${saved ? count + 1 : count - 1}`;
  });
});

document.querySelector('.more-button')?.addEventListener('click', (event) => {
  event.currentTarget.textContent = 'すべての記事を表示しました';
  event.currentTarget.disabled = true;
});

document.querySelector('.newsletter form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const button = event.currentTarget.querySelector('button');
  button.textContent = '登録しました ✓';
  button.disabled = true;
});
