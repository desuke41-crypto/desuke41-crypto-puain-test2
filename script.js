document.querySelectorAll('a[href^="tel:"]').forEach((link) => {
  link.addEventListener('click', () => {
    link.dataset.clicked = 'true';
  });
});
