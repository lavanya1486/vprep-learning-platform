const AUTH_BASE_URL = 'https://vprep.up.railway.app/api/user';

// generic loading helper
function setButtonLoading(btn, isLoading) {
  if (!btn) return;
  if (isLoading) {
    btn.classList.add('is-loading');
    btn.disabled = true;
  } else {
    btn.classList.remove('is-loading');
    btn.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('set-password-form');
  const newPwd = document.getElementById('new-password');
  const confirmPwd = document.getElementById('confirm-password');
  const saveBtn = document.getElementById('savePasswordBtn');

  if (!form || !newPwd || !confirmPwd) {
    console.error('Set password form elements not found');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const p1 = newPwd.value.trim();
    const p2 = confirmPwd.value.trim();

    if (!p1 || !p2) {
      alert('Please enter password in both fields.');
      return;
    }
    if (p1 !== p2) {
      alert('Passwords do not match.');
      return;
    }
    if (p1.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }

    const token = localStorage.getItem('vprepToken');
    if (!token) {
      alert('Session expired. Please log in again.');
      window.location.href = 'login.html';
      return;
    }

    setButtonLoading(saveBtn, true);

    try {
      const res = await fetch(`${AUTH_BASE_URL}/auth/set-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword: p1 })
      });

      if (!res.ok) {
        const msg = await res.text();
        alert(msg || 'Failed to set password. Please try again.');
        return;
      }

      alert('Password set successfully! You can now log in using email and password or Google.');

      const user = JSON.parse(localStorage.getItem('vprepUser') || '{}');
      user.passwordSet = true;
      localStorage.setItem('vprepUser', JSON.stringify(user));

      window.location.href = 'VPrepMain.html';
    } catch (err) {
      console.error('Set password error:', err);
      alert('Server error. Please try again.');
    } finally {
      setButtonLoading(saveBtn, false);
    }
  });
});
