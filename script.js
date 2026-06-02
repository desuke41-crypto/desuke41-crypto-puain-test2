const subscribeButtons = document.querySelectorAll('.subscribe, .subscribe-top');

subscribeButtons.forEach((button) => {
  button.addEventListener('click', (event) => {
    event.preventDefault();
    const isFollowing = button.classList.toggle('is-following');
    document.querySelectorAll('.subscribe').forEach((item) => {
      item.classList.toggle('is-following', isFollowing);
      item.textContent = isFollowing ? '読者です' : '読者になる';
    });
    document.querySelectorAll('.subscribe-top').forEach((item) => {
      item.textContent = isFollowing ? '読者です' : '読者になる';
    });
  });
});

document.querySelector('.search form')?.addEventListener('submit', (event) => {
  event.preventDefault();
});
