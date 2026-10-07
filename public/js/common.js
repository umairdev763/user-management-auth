$(function () {
  $('#logoutBtn').on('click', function () {
    $.post('/api/auth/logout')
      .always(function () { window.location.href = '/'; });
  });
});
