const API_BASE_URL = "https://vprep.up.railway.app/api/user";
const GOOGLE_CLIENT_ID =
  "532888851770-f60ujqr566s0i1p9nqp1qtdl7qbjmhje.apps.googleusercontent.com";


// Email validation helper – restrict to Google-hosted domains only
function isAllowedEmail(email) {
  const atIndex = email.lastIndexOf("@");
  if (atIndex === -1) return false;

  const domain = email.slice(atIndex + 1).toLowerCase();
  const allowedDomains = ["gmail.com", "vitbhopal.ac.in"];
  return allowedDomains.includes(domain);
}


// Generic loading helper for buttons
function setButtonLoading(btn, isLoading) {
  if (!btn) return;
  if (isLoading) {
    btn.classList.add("is-loading");
    btn.disabled = true;
  } else {
    btn.classList.remove("is-loading");
    btn.disabled = false;
  }
}


// FRONTEND helper: detect “email already registered” in any backend message
function isEmailAlreadyRegisteredMessage(msg) {
  if (!msg) return false;
  const m = msg.toLowerCase();
  // broader match: email + already/exist/duplicate/unique
  return (
    m.includes("email") &&
    (m.includes("already") ||
      m.includes("exist") ||
      m.includes("duplicate") ||
      m.includes("unique"))
  );
}


document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signup-form");
  const profileForm = document.getElementById("profile-form");
  const signupBtn = document.getElementById("signupBtn");
  const profileBtn = document.getElementById("profileBtn");

  // ---------- EMAIL / PASSWORD SIGNUP ----------
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();

      if (!email || !password) {
        alert("Please enter email and password.");
        return;
      }

      if (!isAllowedEmail(email)) {
        alert("Please use your Google / VIT email address.");
        return;
      }

      setButtonLoading(signupBtn, true);

      try {
        const res = await fetch(`${API_BASE_URL}/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
          let msg = "Signup failed.";
          const raw = await res.text();

          try {
            const json = JSON.parse(raw || "{}");
            msg = json.error || json.message || msg;
          } catch {
            if (raw) msg = raw;
          }

          console.log("Signup error raw:", raw);
          console.log("Signup error msg:", msg);

          if (isEmailAlreadyRegisteredMessage(msg)) {
            alert("This email is already registered. Please log in instead.");
          } else {
            alert("Signup failed: " + msg);
          }
          return;
        }

        // ✅ Success
        window.location.href = "login.html";
      } catch (err) {
        console.error(err);
        alert("Network error contacting server. Please try again.");
      } finally {
        setButtonLoading(signupBtn, false);
      }
    });
  }

  // ---------- PROFILE FORM (OPTIONAL) ----------
  if (profileForm) {
    profileForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      setButtonLoading(profileBtn, true);

      try {
        const firstName = document.getElementById("first-name").value.trim();
        const lastName = document.getElementById("last-name").value.trim();
        const course = document.getElementById("course").value.trim();
        const year = document.getElementById("year").value;

        if (!firstName || !lastName || !course || !year) {
          alert("Please fill all profile fields.");
          return;
        }

        alert("Profile completed! Redirecting...");
        window.location.href = "login.html";
      } catch (err) {
        console.error(err);
        alert("Something went wrong. Please try again.");
      } finally {
        setButtonLoading(profileBtn, false);
      }
    });
  }

  // ---------- GOOGLE SIGNUP ----------
  window.handleGoogleSignup = function (response) {
    const idToken = response.credential;

    setButtonLoading(signupBtn, true);

    fetch(`${API_BASE_URL}/auth/google/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    })
      .then(async (res) => {
        const raw = await res.text();
        let data = null;
        let msg = "Google signup failed.";

        try {
          data = raw ? JSON.parse(raw) : null;
          msg = (data && (data.error || data.message)) || msg;
        } catch {
          if (raw) msg = raw;
        }

        console.log("Google signup status:", res.status);
        console.log("Google signup raw:", raw);
        console.log("Google signup msg:", msg);

        // If backend says "email already registered", treat as success/login
        if (!res.ok && isEmailAlreadyRegisteredMessage(msg)) {
          alert("This email is already registered. Logging you in.");
          // Expect backend to still send user/token payload on this path.
          return data;
        }

        if (!res.ok) {
          throw new Error(msg);
        }

        return data;
      })
      .then((data) => {
        if (!data) {
          alert("Signup succeeded but server returned no data.");
          return;
        }

        localStorage.setItem("vprepEmail", data.email);
        localStorage.setItem("vprepToken", data.token || "");
        localStorage.setItem(
          "vprepUser",
          JSON.stringify({
            name: data.name || data.email,
            plan: data.plan || "FREE",
            validTill: data.validTill || null,
            passwordSet: data.passwordSet ?? false,
          })
        );

        if (data.passwordSet === false) {
          window.location.href = "set-password.html";
        } else {
          window.location.href = "login.html";
        }
      })
      .catch((err) => {
        console.error(err);
        alert(err.message || "Google signup failed. Please try again.");
      })
      .finally(() => {
        setButtonLoading(signupBtn, false);
      });
  };

  // ---------- GOOGLE SIGNUP BUTTON INIT ----------
  if (window.google && window.google.accounts && window.google.accounts.id) {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: window.handleGoogleSignup,
    });

    const googleDiv = document.getElementById("google-signup");
    if (googleDiv) {
      window.google.accounts.id.renderButton(googleDiv, {
        theme: "outline",
        size: "large",
        text: "signup_with",
      });
    }
  }
});
