const form = document.querySelector('.reservation-form');
const status = document.querySelector('.reservation-status');

form.addEventListener('submit', (event) => {
  event.preventDefault();
  status.hidden = false;
  form.reset();
});
