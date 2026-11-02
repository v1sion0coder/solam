// Saves the new password. This public key is meant to be in the app; the server's rules protect the data.
(function resetForm() {
  var SERVER = 'https://qbagnygvfelkcuzomugw.supabase.co';
  var PUBLIC_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYWdueWd2ZmVsa2N1em9tdWd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2NDMyMTAsImV4cCI6MjEwOTIxOTIxMH0.vzdnafVzlWt9E7na-wOlotrv6RcE6VCNDiAF4Vo2vDc';
  var box = document.getElementById('form-box');
  var message = document.getElementById('message');
  var link = window.solamReset;

  function show(id) {
    box.hidden = true;
    document.getElementById(id).hidden = false;
  }

  if (!link.token || !link.isRecovery) {
    show('bad');
    return;
  }

  document.getElementById('form').addEventListener('submit', function submit(event) {
    event.preventDefault();
    var password = document.getElementById('password').value;
    if (password.length < 8) {
      message.textContent = 'At least 8 characters. / Не короче 8 символов.';
      return;
    }
    message.textContent = '';
    fetch(SERVER + '/auth/v1/user', {
      method: 'PUT',
      headers: { apikey: PUBLIC_KEY, Authorization: 'Bearer ' + link.token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: password }),
    }).then(function result(response) {
      if (response.ok) {
        link.token = null;
        show('done');
      } else if (response.status === 401 || response.status === 403) {
        show('bad');
      } else {
        message.textContent = 'That password wasn\'t accepted. Try a different one. / Этот пароль не подошёл. Попробуйте другой.';
      }
    }).catch(function failed() {
      message.textContent = 'Check your internet connection. / Проверьте интернет.';
    });
  });
})();
