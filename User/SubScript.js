const API_BASE_URL = 'https://vprep.up.railway.app/api/files';
const USER_BASE_URL = 'https://vprep.up.railway.app/api/user';

// ===== LOGIN GUARD FOR MATERIAL PAGES =====
(function enforceLoginForMaterials() {
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

async function viewPdf(fileId, fileName) {
  const token = localStorage.getItem('vprepToken');
  if (!token) {
    alert('Please log in again to view materials.');
    window.location.href = 'login.html';
    return;
  }

  const url = `${API_BASE_URL}/view/${encodeURIComponent(fileId)}`;

  try {
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      alert(`Failed to load PDF (status ${res.status}).`);
      return;
    }

    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl + '#toolbar=0', '_blank', 'noopener,noreferrer');
  } catch (e) {
    console.error('PDF open error:', e);
    alert('Network error while opening PDF.');
  }
}


function downloadPdf(fileId, fileName) {
  const downloadUrl = `${API_BASE_URL}/download/${fileId}`;
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function toggleMenu() {
  const navLinks = document.querySelector('.navLinks');
  if (navLinks) {
    navLinks.classList.toggle('active');
  }
}

async function checkViewsAllowed() {
  const token = localStorage.getItem('vprepToken');
  if (!token) {
    return { allowed: false, remaining: 0 };
  }

  const res = await fetch(`${USER_BASE_URL}/views/check`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    throw new Error(`View check failed: ${res.status}`);
  }
  return res.json(); // { allowed, remaining }
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

// Fetch materials for specific subject from backend
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
    const uploaded = f.uploadDate
      ? formatDate(f.uploadDate)
      : '—';
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

// ==================== EVENT LISTENERS ====================
document.addEventListener('DOMContentLoaded', () => {
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
