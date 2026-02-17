// subscription.js
// Uses Razorpay + VPrep payment APIs instead of temporary /activate

const RAZORPAY_KEY_ID = 'YOUR_TEST_KEY_ID'; // TODO: replace with real key

async function startSubscription(plan, subjectId) {
  const email = localStorage.getItem('vprepEmail');
  const token = localStorage.getItem('vprepToken'); // JWT you store after login

  if (!email || !token) {
    alert('Please log in first.');
    window.location.href = 'login.html';
    return;
  }

  // Decide backend URL based on plan
  let url;
  if (plan === 'SUBJECT') {
    if (!subjectId) {
      alert('Please select a subject first.');
      return;
    }
    url = 'http://localhost:8080/api/payments/subject?subjectId=' + encodeURIComponent(subjectId);
  } else if (plan === 'MONTHLY') {
    url = 'http://localhost:8080/api/payments/monthly';
  } else if (plan === 'YEARLY') {
    url = 'http://localhost:8080/api/payments/yearly';
  } else {
    alert('Unknown plan: ' + plan);
    return;
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });

    if (!res.ok) {
      const msg = await res.text();
      alert('Could not start payment: ' + msg);
      return;
    }

    const data = await res.json();
    // data should contain at least: razorpayOrderId, amount, keyId? etc.

    openRazorpayCheckout({
      plan: plan,
      email: email,
      orderId: data.razorpayOrderId,
      amount: data.amount,
      keyId: data.keyId || RAZORPAY_KEY_ID
    });
  } catch (e) {
    console.error(e);
    alert('Server error. Please try again.');
  }
}

function openRazorpayCheckout(opts) {
  const options = {
    key: opts.keyId,
    amount: opts.amount,           // in paise
    currency: 'INR',
    name: 'VPrep',
    description: 'VPrep ' + opts.plan + ' Plan',
    order_id: opts.orderId,
    prefill: {
      email: opts.email
    },
    handler: function (response) {
      // Final plan activation will be done by backend webhook.
      alert('Payment successful! Your plan will be activated shortly.');
      window.location.href = 'VPrepMain.html';
    },
    theme: {
      color: '#3b82f6'
    }
  };

  const rzp = new Razorpay(options);
  rzp.open();
}
