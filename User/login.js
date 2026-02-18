const AUTH_BASE_URL = 'https://vprep.up.railway.app/api/user';
const GOOGLE_CLIENT_ID = '532888851770-f60ujqr566s0i1p9nqp1qtdl7qbjmhje.apps.googleusercontent.com';

// Email validation helper – restrict to Google-hosted domains only
function isAllowedEmail(email) {
  const pattern = /^[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})$/;
  const match = email.match(pattern);
  if (!match) return false;

  const domain = match[1].toLowerCase();
  const allowedDomains = ['gmail.com', 'vitbhopal.ac.in'];
  return allowedDomains.includes(domain);
}

// helper: toggle loading state on primary button
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
  // ---------- EMAIL / PASSWORD LOGIN ----------
  const form = document.querySelector('form');
  const loginBtn = document.getElementById('loginBtn'); // from updated HTML

  if (form) {
    const emailInput = form.querySelector('input[type="email"]');
    const passwordInput = form.querySelector('input[type="password"]');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

      if (!email || !password) {
        alert('Please enter email and password');
        return;
      }

      if (!isAllowedEmail(email)) {
        alert('Please use your Google / VIT email address.');
        return;
      }

      setButtonLoading(loginBtn, true);

      try {
        const res = await fetch(`${AUTH_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        if (!res.ok) {
          let errorMsg = 'Login failed';
          try {
            const errorJson = await res.json();
            errorMsg = errorJson.message || errorJson.error || errorMsg;
          } catch (_) {
            const text = await res.text();
            if (text) errorMsg = text;
          }

          console.error('Login error response:', errorMsg);

          if (errorMsg.includes('does not have a password yet')) {
            alert('You signed up with Google. Please log in with Google or set a password.');
          } else if (errorMsg.includes('Invalid password')) {
            alert('❌ Password is incorrect. Please try again.');
          } else if (errorMsg.includes('User not found')) {
            alert('No account found. Please sign up first.');
            window.location.href = 'signup.html';
          } else {
            alert(errorMsg);
          }
          return;
        }

        const data = await res.json();
        localStorage.setItem('vprepEmail', email);
        localStorage.setItem('vprepToken', data.token || '');
        localStorage.setItem('vprepUser', JSON.stringify({
          name: data.name || email,
          plan: data.plan || 'FREE',
          validTill: data.validTill || null
        }));

        window.location.href = 'VPrepMain.html';
      } catch (err) {
        console.error('Login error:', err);
        alert('Server error. Please try again.');
      } finally {
        setButtonLoading(loginBtn, false);
      }
    });
  }

  // ---------- GOOGLE LOGIN (SINGLE DEFINITION) ----------
  window.handleGoogleLogin = function (response) {
    const idToken = response.credential;
    // optional: show loading on same button or a separate Google button if you wrap it
    setButtonLoading(loginBtn, true);

    fetch(`${AUTH_BASE_URL}/auth/google/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    })
      .then(async res => {
        if (!res.ok) {
          const text = await res.text();

          if (res.status === 404 || text.includes('No account found for this Google email')) {
            alert('Looks like you are new here. Please sign up with Google first, then come back to log in.');
            window.location.href = 'signup.html';
            return;
          }

          alert(text || 'Google login failed, please try again');
          throw new Error(text || 'Google login failed');
        }
        return res.json();
      })
      .then(data => {
        if (!data) return; // already redirected on 404 case

        localStorage.setItem('vprepEmail', data.email);
        localStorage.setItem('vprepToken', data.token || '');
        localStorage.setItem('vprepUser', JSON.stringify({
          name: data.name || data.email,
          plan: data.plan || 'FREE',
          validTill: data.validTill || null,
          passwordSet: data.passwordSet ?? true
        }));

        if (data.passwordSet === false) {
          window.location.href = 'set-password.html';
        } else {
          window.location.href = 'VPrepMain.html';
        }
      })
      .catch(err => {
        console.error('Google login error:', err);
      })
      .finally(() => {
        setButtonLoading(loginBtn, false);
      });
  };

  // ---------- INITIALIZE GOOGLE SIGN-IN ----------
  if (window.google && window.google.accounts && window.google.accounts.id) {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: window.handleGoogleLogin
    });

    const googleDiv = document.getElementById('google-signin');
    if (googleDiv) {
      google.accounts.id.renderButton(googleDiv, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with' // "Continue with Google"
      });
    }
  }
});
