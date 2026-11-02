// If someone added this front page to their Home Screen, opening it goes straight to the app.
if (window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches) {
  window.location.replace('app/');
}
