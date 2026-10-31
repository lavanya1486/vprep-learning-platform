const STATIC_MATERIALS_BASE = '../content/materials';

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
  if (!fileType) return "ðŸ“„";

  const type = fileType.toLowerCase();
  if (type.includes("notes")) return "ðŸ“„";
  if (type.includes("assignment")) return "ðŸ“";
  if (type.includes("pyq")) return "ðŸ“œ";

  return "ðŸ“„";
}

function getTypeIconAndTag(type) {
  const icons = {
    notes: { icon: 'ðŸ“„', tag: 'Notes' },
    assignment: { icon: 'ðŸ“', tag: 'Assignment' },
    pyq: { icon: 'ðŸ“œ', tag: 'PYQ' }
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

function viewPdf(fileUrl) {
  window.open(fileUrl, '_blank', 'noopener,noreferrer');
}


function downloadPdf(fileUrl, fileName) {
  const link = document.createElement('a');
  link.href = fileUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function toggleMenu() {
  const navLinks = document.querySelector('.navLinks');
  if (navLinks) {
    navLinks.classList.toggle('active');
  }
}

async function checkViewsAllowed() {
  return { allowed: true, remaining: null };
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
  if (!document.getElementById('materialsBody')) return;

  const info = document.getElementById('materialsInfo');
  const noMaterials = document.getElementById('noMaterials');
  const tbody = document.getElementById('materialsBody');

  if (info) info.textContent = `Loading materials for ${subjectName}...`;
  if (tbody) tbody.innerHTML = '';

  try {
    const slug = subjectName
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const res = await fetch(`${STATIC_MATERIALS_BASE}/${slug}.json`);

    if (res.status === 404) {
      window.allFiles = [];
    } else if (!res.ok) {
      throw new Error(`Materials file failed: ${res.status}`);
    } else {
      const data = await res.json();
      window.allFiles = Array.isArray(data) ? data : (data.resources || []);
    }

    if (!window.allFiles || window.allFiles.length === 0) {
      if (info) info.textContent = '';
      if (noMaterials) noMaterials.style.display = 'block';
      return;
    }
    if (noMaterials) noMaterials.style.display = 'none';
    if (info) info.textContent = '';
    renderTable();
  } catch (error) {
    console.error('Error loading materials:', error);
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
                onclick="viewPdf('${f.fileUrl}')">
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
  console.log('ðŸ“š Loading materials for:', subjectName);
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
