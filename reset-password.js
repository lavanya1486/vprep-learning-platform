const AUTH_BASE_URL = 'https://vprep.up.railway.app/api/user';

// shared helper
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
  // read token from URL: /reset-password.html?token=XXXX
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  if (!token) {
    alert('Invalid or missing reset link.');
    window.location.href = 'login.html';
    return;
  }

  const form = document.getElementById('reset-form');
  const newPasswordInput = document.getElementById('new-password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const resetBtn = document.getElementById('resetBtn');

  if (!form || !newPasswordInput || !confirmPasswordInput) {
    console.error('Reset form elements not found');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newPassword = newPasswordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    if (!newPassword || !confirmPassword) {
      alert('Please fill both password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      alert('Password should be at least 8 characters long.');
      return;
    }

    setButtonLoading(resetBtn, true);

    try {
      const res = await fetch(`${AUTH_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newPassword
        })
      });

      if (!res.ok) {
        const text = await res.text();
        alert(text || 'Reset link is invalid or expired. Please request a new one.');
        return;
      }

      alert('Password reset successful. Please log in with your new password.');
      window.location.href = 'login.html';
    } catch (err) {
      console.error('Reset password error:', err);
      alert('Server error. Please try again.');
    } finally {
      setButtonLoading(resetBtn, false);
    }
  });
});
