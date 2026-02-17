const AUTH_BASE_URL = 'https://vprep.up.railway.app/api/user';

// reuse same email validation
function isAllowedEmail(email) {
  const pattern = /^[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})$/;
  const match = email.match(pattern);
  if (!match) return false;
  const domain = match[1].toLowerCase();
  const allowedDomains = ['gmail.com', 'vitbhopal.ac.in'];
  return allowedDomains.includes(domain);
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('forgot-form');
  const emailInput = document.getElementById('forgot-email');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    if (!email) {
      alert('Please enter your email');
      return;
    }
    if (!isAllowedEmail(email)) {
      alert('Please use your Google / VIT email address.');
      return;
    }

    try {
      const res = await fetch(`${AUTH_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      // backend always returns 200/generic message, which is good practice [web:11]
      if (res.ok) {
        alert('If an account exists for this email, a reset link has been sent.');
        // optionally redirect back to login
        window.location.href = 'login.html';
      } else {
        alert('Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      alert('Server error. Please try again.');
    }
  });
});
