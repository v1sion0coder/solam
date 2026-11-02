// The reset link carries a temporary code. It is read once and wiped from the address bar right away.
(function readResetLink() {
  var values = new URLSearchParams(location.hash.slice(1));
  window.solamReset = {
    token: values.get('access_token'),
    isRecovery: values.get('type') === 'recovery',
  };
  history.replaceState(null, '', location.pathname);
})();
