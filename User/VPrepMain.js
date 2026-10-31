function toggleMenu() {
  const navLinks = document.querySelector('.navLinks');
  const navAuth = document.querySelector('.navAuth');
  if (navLinks) navLinks.classList.toggle('active');
  if (navAuth) navAuth.classList.toggle('active');
}

function closePopup() {
  const popup = document.getElementById('vprepPopup');
  if (!popup) return;
  popup.classList.add('hide');
  setTimeout(() => {
    popup.style.display = 'none';
  }, 600);
}

function showSet(setName) {
  const sets = [
    'pCore', 'pElective', 'UniCore-NSE', 'uniCore-BESC', 'uniCore-SDC',
    'uniCore-HSMC', 'uniCore-Proj_Internships', 'uniElective-NSE',
    'uniElective-ME', 'uniElective-HSME', 'uniElective-OP', 'NonGraded'
  ];

  sets.forEach(set => {
    document.querySelectorAll(`.${set}`).forEach(element => {
      element.classList.remove('show');
    });
  });

  document.querySelectorAll(`.${setName}`).forEach(element => {
    element.classList.add('show');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.btns button').forEach(button => {
    button.addEventListener('click', () => {
      const match = button.getAttribute('onclick')?.match(/'([^']+)'/);
      if (match) showSet(match[1]);

      const target = document.getElementById('autoScroll');
      const navbar = document.getElementById('navBar');
      if (target) {
        const offset = window.scrollY + target.getBoundingClientRect().top -
          (navbar?.offsetHeight || 0) - 10;
        window.scrollTo({ top: offset, behavior: 'smooth' });
      }
    });
  });

  document.querySelectorAll('.navLinks a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      const target = document.getElementById(link.getAttribute('href').slice(1));
      const navbar = document.getElementById('navBar');
      if (!target) return;

      window.scrollTo({
        top: window.scrollY + target.getBoundingClientRect().top -
          (navbar?.offsetHeight || 0) - 10,
        behavior: 'smooth'
      });
    });
  });

  document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
      question.parentElement.classList.toggle('active');
    });
  });

  const hamburger = document.querySelector('.hamburger');
  if (hamburger) hamburger.addEventListener('click', toggleMenu);

  setTimeout(closePopup, 5000);
});
