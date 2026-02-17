// NAVBAR: MOBILE TOGGLE
function toggleMenu() {
  const navLinks = document.querySelector('.navLinks');
  const navAuth  = document.querySelector('.navAuth');
  if (navLinks) navLinks.classList.toggle('active');
  if (navAuth)  navAuth.classList.toggle('active');
}

// USER MENU (TOP RIGHT)
function showUserMenu(user) {
  const navAuth  = document.getElementById('navAuth');
  const userMenu = document.getElementById('userMenu');
  if (!navAuth || !userMenu) return;

  navAuth.classList.add('hidden');
  userMenu.classList.remove('hidden');

  const initials = (user.name || '')
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  document.getElementById('avatarCircle').textContent = initials || 'U';
  document.getElementById('userName').textContent = user.name || 'User';

  document.getElementById('userPlan').textContent = 'Free user';

  const expiryEl = document.getElementById('planExpiry');
  if (expiryEl) {
    expiryEl.style.display = 'none';
  }
}

// course set buttons
const btnContainer = document.querySelector('.btns');
if (btnContainer) {
  btnContainer.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', () => {
      // get set name from inline onclick or data attribute
      const match = button.getAttribute('onclick')?.match(/'([^']+)'/);
      const setName = match ? match[1] : button.dataset.setName;
      if (setName) {
        showSet(setName);
      }

      // smooth scroll to AutoScroll section with navbar offset
      const targetEl = document.querySelector('#autoScroll'); // or '.AutoScroll'
      if (targetEl) {
        const navbar = document.querySelector('.navbar');
        const navHeight = navbar ? navbar.offsetHeight : 0;

        const rect = targetEl.getBoundingClientRect();
        const offsetTop = window.pageYOffset + rect.top - navHeight - 10;

        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
      }
    });
  });
}
 
// POPUP AUTO HIDE
setTimeout(() => {
  const popup = document.getElementById('vprepPopup');
  if (popup) {
    popup.classList.add('hide');
    setTimeout(() => (popup.style.display = 'none'), 600);
  }
}, 5000);

function closePopup() {
  const popup = document.getElementById('vprepPopup');
  if (popup) {
    popup.classList.add('hide');
    setTimeout(() => (popup.style.display = 'none'), 600);
  }
}

// COURSE SET SWITCHING
function showSet(setName) {
  const sets = [
    'pCore', 'pElective', 'UniCore-NSE', 'uniCore-BESC', 'uniCore-SDC',
    'uniCore-HSMC', 'uniCore-Proj_Internships', 'uniElective-NSE',
    'uniElective-ME', 'uniElective-HSME', 'uniElective-OP', 'NonGraded'
  ];

  sets.forEach(set => {
    const elements = document.getElementsByClassName(set);
    for (let el of elements) {
      el.classList.remove('show');
    }
  });

  const selectedElements = document.getElementsByClassName(setName);
  for (let el of selectedElements) {
    el.classList.add('show');
  }
}


document.addEventListener('DOMContentLoaded', () => {
  // NAVBAR SMOOTH SCROLL
  document.querySelectorAll('.navLinks a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const targetId = link.getAttribute('href').slice(1);
      const targetEl = document.getElementById(targetId);
      if (!targetEl) return;
  
      const navbar = document.querySelector('.navbar'); // your fixed nav
      const navHeight = navbar ? navbar.offsetHeight : 0;
  
      const rect = targetEl.getBoundingClientRect();
      const offsetTop = window.pageYOffset + rect.top - navHeight - 10; // extra 10px gap
  
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    });
  });
  
  // FAQ toggles
  document.querySelectorAll('.faq-question').forEach(q => {
    q.addEventListener('click', function () {
      this.parentElement.classList.toggle('active');
    });
  });

  // restore logged-in user (for avatar)
  const saved = localStorage.getItem('vprepUser');
  if (saved) {
    try {
      const user = JSON.parse(saved);
      if (user && user.name) {
        showUserMenu(user);
      }
    } catch (e) {
      console.error('Invalid vprepUser in storage', e);
    }
  }

  // login / signup buttons
  document.getElementById('loginBtn')?.addEventListener('click', () => {
    window.location.href = 'login.html';
  });
  document.getElementById('signupBtn')?.addEventListener('click', () => {
    window.location.href = 'signup.html';
  });

  // avatar click -> show dropdown for 5s
  let dropdownTimeout = null;
  document.getElementById('avatarCircle')?.addEventListener('click', () => {
    const dropdown = document.querySelector('.user-dropdown');
    if (!dropdown) return;

    if (dropdown.style.display === 'block') {
      dropdown.style.display = 'none';
      if (dropdownTimeout) clearTimeout(dropdownTimeout);
      return;
    }

    dropdown.style.display = 'block';
    if (dropdownTimeout) clearTimeout(dropdownTimeout);
    dropdownTimeout = setTimeout(() => {
      dropdown.style.display = 'none';
    }, 5000);
  });

  // logout button inside dropdown
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('vprepEmail');
    localStorage.removeItem('vprepToken');
    localStorage.removeItem('vprepUser');

    document.getElementById('userMenu')?.classList.add('hidden');
    document.getElementById('navAuth')?.classList.remove('hidden');

    window.location.href = 'login.html';
  });

  // materials page init
  const subjectName = detectSubjectName();
  console.log('📚 Loading materials for:', subjectName);
  loadMaterials(subjectName);

  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', toggleMenu);
  }

  const typeFilter = document.getElementById('typeFilter');
  if (typeFilter) {
    typeFilter.addEventListener('change', () => renderTable());
  }
});

const API_BASE_URL = 'https://vprep.up.railway.app/api/files';
const USER_BASE_URL = 'https://vprep.up.railway.app/api/user';


// ===== LOGIN GUARD FOR MATERIAL PAGES ONLY =====
(function enforceLoginForMaterials() {
  const protectedPaths = [
    '/materials/',
    '/content/',
    'materials.html',
    'pdf-viewer.html',
    'study-notes.html'
  ];

  const currentPath = window.location.pathname;
  const isProtectedPage = protectedPaths.some(path => currentPath.includes(path));

  if (!isProtectedPage) {
    return;
  }

  const email = localStorage.getItem('vprepEmail');
  const token = localStorage.getItem('vprepToken');

  if (!email || !token) {
    alert('Please log in or sign up to access study materials.');
    window.location.href = 'login.html';
  }
})();


// ========== UTILITIES ==========
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 MB";
  const k = 1024;
  return (bytes / (k * k)).toFixed(2) + " MB";
}

function formatDate(dateString) {
  if (!dateString) return "Unknown";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Unknown";
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (e) {
    console.error('Date formatting error:', e);
    return "Unknown";
  }
}

function getFileTypeIcon(fileType) {
  if (!fileType) return "📄";
  const type = fileType.toLowerCase();
  if (type.includes("notes")) return "📄";
  if (type.includes("assignment")) return "📝";
  if (type.includes("pyq")) return "📜";
  return "📄";
}

function getTypeIconAndTag(type) {
  const icons = {
    notes: { icon: '📄', tag: 'Notes' },
    assignment: { icon: '📝', tag: 'Assignment' },
    pyq: { icon: '📜', tag: 'PYQ' }
  };
  const info = icons[type] || icons.notes;
  return {
    iconHtml: `<span title="${info.tag}" style="margin-left: 8px;">${info.icon}</span>`,
    tagHtml: `<span style="background: #e8f4f8; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem;">${info.tag}</span>`
  };
}

function closePdfViewer() {
  const viewerSection = document.getElementById('viewerSection');
  const pdfFrame = document.getElementById('pdfFrame');
  if (viewerSection) viewerSection.style.display = 'none';
  if (pdfFrame) pdfFrame.src = '';
}

// NEW viewPdf: no view limits, no /views/check
async function viewPdf(fileId, fileName) {
  const token = localStorage.getItem('vprepToken');
  if (!token) {
    alert('Please log in again to view materials.');
    window.location.href = 'login.html';
    return;
  }

  const pdfUrl = `${API_BASE_URL}/view/${encodeURIComponent(fileId)}#toolbar=0`;
  window.open(pdfUrl, '_blank', 'noopener,noreferrer');
}

function downloadPdf(fileId, fileName) {
  const token = localStorage.getItem('vprepToken');
  if (!token) {
    alert('Please log in again to download materials.');
    window.location.href = 'login.html';
    return;
  }

  const downloadUrl = `${API_BASE_URL}/download/${fileId}`;
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


// ==================== MAIN FUNCTIONS ====================
function detectSubjectName() {
  const heading = document.querySelector('h1.heading');
  if (heading) {
    return heading.textContent.trim();
  }
  const title = document.title.replace(' Materials', '').trim();
  return title || 'Unknown Subject';
}

async function loadMaterials(subjectName) {
  const info = document.getElementById('materialsInfo');
  const noMaterials = document.getElementById('noMaterials');
  const tbody = document.getElementById('materialsBody');

  if (info) info.textContent = `Loading materials for ${subjectName}...`;
  if (tbody) tbody.innerHTML = '';

  try {
    const encodedSubject = encodeURIComponent(subjectName);
    const url = `${API_BASE_URL}/subject/${encodedSubject}`;
    console.log('🔗 Fetching from:', url);

    const token = localStorage.getItem('vprepToken');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, { headers });

    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }

    window.allFiles = await res.json();
    console.log(`✅ Found ${window.allFiles?.length || 0} materials`);

    if (!window.allFiles || window.allFiles.length === 0) {
      if (info) info.textContent = '';
      if (noMaterials) noMaterials.style.display = 'block';
      return;
    }
    if (noMaterials) noMaterials.style.display = 'none';
    if (info) info.textContent = '';
    renderTable();
  } catch (error) {
    console.error('❌ Error loading materials:', error);
    if (info) {
      info.textContent = `Error loading materials: ${error.message}`;
    }
    if (noMaterials) noMaterials.style.display = 'block';
  }
}

function renderTable() {
  const tbody = document.getElementById('materialsBody');
  const typeFilter = document.getElementById('typeFilter');

  if (!tbody || !typeFilter || !window.allFiles) return;

  tbody.innerHTML = '';

  const filterValue = typeFilter.value;
  const filtered = window.allFiles.filter(f => {
    if (filterValue === 'all') return true;
    return (f.fileType || '').toLowerCase() === filterValue.toLowerCase();
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 20px;">
          No materials found for this filter
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(f => {
    const tr = document.createElement('tr');
    const uploaded = f.uploadDate ? formatDate(f.uploadDate) : '—';
    const sizeFormatted = formatFileSize(f.fileSize);
    const type = (f.fileType || 'notes').toLowerCase();
    const { iconHtml, tagHtml } = getTypeIconAndTag(type);

    tr.innerHTML = `
      <td>
        ${f.fileName}
        ${iconHtml}
        <div style="font-size: 0.8rem; color: #888; margin-top: 4px;">
          ${uploaded}
        </div>
      </td>
      <td>${tagHtml}</td>
      <td>${sizeFormatted}</td>
      <td>
        <button type="button" class="view-btn"
                onclick="viewPdf('${f.id}', '${f.fileName}')">
          View
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}
