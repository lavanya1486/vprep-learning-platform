const API_BASE_URL = 'https://vprep.up.railway.app/api';
let authToken = localStorage.getItem('adminToken');
let allFiles = [];

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();

  if (authToken) {
    showLoggedInState();
    switchSection('upload');
    loadUploadedFiles();
  } else {
    showLoginState();
    switchSection('login');
  }

  loadSubjectsFromBackend();
});

function setupEventListeners() {
  // Sidebar navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      const section = item.getAttribute('data-section');
      if (section) {
        switchSection(section);
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      }
    });
  });

  // Login form
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  // Upload form
  document.getElementById('uploadForm').addEventListener('submit', handleUpload);
  // Filter change
  document.getElementById('filterSubject').addEventListener('change', handleFilterChange);
  // Refresh
  document.getElementById('refreshBtn')?.addEventListener('click', loadUploadedFiles);

  // Drag & drop
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');

  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });
  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      fileInput.files = files;
      updateFileDisplay(files[0]);
    }
  });

  fileInput.addEventListener('change', e => {
    if (e.target.files.length > 0) {
      updateFileDisplay(e.target.files[0]);
    }
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  document.getElementById('headerLogout').addEventListener('click', handleLogout);
}

async function handleLogin(e) {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const loginBtn = e.target.querySelector('button');

  loginBtn.disabled = true;
  loginBtn.innerHTML = ' Logging in...';

  try {
    const response = await fetch(`${API_BASE_URL}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })   // send username + password
    });

    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (response.ok && data && data.token) {
      authToken = data.token;
      localStorage.setItem('adminToken', authToken);
      localStorage.setItem('adminUsername', username);  // store username
      showLoggedInState();
      switchSection('upload');
      loadUploadedFiles();
      showNotification('Login successful!', 'success');
    } else {
      const msg = (data && data.message) || text || 'Login failed';
      showNotification(msg, 'error');
    }
  } catch (err) {
    console.error('Login error:', err);
    showNotification('Connection error. Please try again.', 'error');
  } finally {
    loginBtn.disabled = false;
    loginBtn.innerHTML = ' Login';
  }
}

function handleLogout() {
  authToken = null;
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUsername');

  document.getElementById('loginForm').reset();
  document.getElementById('uploadForm').reset();
  document.getElementById('fileName').classList.remove('active');

  showLoginState();
  switchSection('login');
  showNotification('Logged out successfully', 'success');
}

function updateFileDisplay(file) {
  const fileNameDisplay = document.getElementById('fileName');
  fileNameDisplay.textContent =
    `✓ Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
  fileNameDisplay.classList.add('active');
}

async function handleUpload(e) {
  e.preventDefault();

  const subject = document.getElementById('subject').value;
  const fileType = document.getElementById('fileType').value;
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];

  if (!file) {
    showNotification('Please select a file', 'error');
    return;
  }
  if (!file.name.endsWith('.pdf')) {
    showNotification('Only PDF files are allowed', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('subject', subject);
  formData.append('fileType', fileType);

  showUploadStatus('Uploading...', 'loading');

  const uploadBtn = e.target.querySelector('button');
  uploadBtn.disabled = true;
  uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

  try {
    const response = await fetch(`${API_BASE_URL}/admin/files/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: formData
    });

    let data = null;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (response.ok) {
      showUploadStatus('✓ File uploaded successfully!', 'success');
      document.getElementById('uploadForm').reset();
      document.getElementById('fileName').classList.remove('active');
      setTimeout(() => {
        loadUploadedFiles();
        showNotification('File uploaded successfully!', 'success');
      }, 1000);
    } else {
      const msg = (data && data.message) || 'Upload failed';
      showUploadStatus(`✗ ${msg}`, 'error');
      showNotification(msg, 'error');
    }
  } catch (err) {
    console.error('Upload error:', err);
    showUploadStatus('✗ Connection error', 'error');
    showNotification('Connection error. Please try again.', 'error');
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload File';
  }
}

async function loadUploadedFiles() {
  try {
    if (!authToken) {
      showNotification('Admin session expired. Please log in again.', 'error');
      showLoginState();
      switchSection('login');
      return;
    }

    const response = await fetch(`${API_BASE_URL}/admin/files/subjects`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.status === 401 || response.status === 403) {
      showNotification('Admin session expired. Please log in again.', 'error');
      handleLogout();
      return;
    }

    if (!response.ok) {
      showNotification('Failed to load subjects', 'error');
      return;
    }

    const subjects = await response.json();
    const tbody = document.getElementById('filesTableBody');

    if (!subjects || subjects.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 40px;">
            <i class="fas fa-inbox" style="font-size: 2rem; color: #ccc;"></i>
            <p>No files uploaded yet</p>
          </td>
        </tr>`;
      allFiles = [];
      return;
    }

    let filesData = [];
    for (const subject of subjects) {
      const filesResponse = await fetch(
        `${API_BASE_URL}/admin/files/subject/${encodeURIComponent(subject)}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (filesResponse.status === 401 || filesResponse.status === 403) {
        showNotification('Admin session expired. Please log in again.', 'error');
        handleLogout();
        return;
      }

      if (!filesResponse.ok) continue;

      const files = await filesResponse.json();
      filesData = [
        ...filesData,
        ...files.map(file => ({ ...file, subject }))
      ];
    }

    allFiles = filesData;
    applyFilter();
  } catch (err) {
    console.error('Error loading files:', err);
    showNotification('Failed to load files', 'error');
  }
}

function handleFilterChange() {
  applyFilter();
}

function applyFilter() {
  const filterSubject = document.getElementById('filterSubject').value;
  const tbody = document.getElementById('filesTableBody');
  let filteredFiles = allFiles;

  if (filterSubject) {
    filteredFiles = allFiles.filter(file => file.subject === filterSubject);
  }

  if (!filteredFiles || filteredFiles.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px;">
          <i class="fas fa-search" style="font-size: 2rem; color: #ccc;"></i>
          <p>No files found for selected filter</p>
        </td>
      </tr>`;
  } else {
    tbody.innerHTML = filteredFiles
      .map(
        file => `
        <tr>
          <td><i class="fas fa-file-pdf"></i> ${file.fileName}</td>
          <td>${file.subject}</td>
          <td><span class="badge">${file.fileType}</span></td>
          <td>${(file.fileSize / 1024).toFixed(2)} KB</td>
          <td>${new Date(file.uploadDate).toLocaleDateString()}</td>
          <td>
            <div class="action-buttons">
              <a href="${API_BASE_URL}/admin/files/download/${file.id}"
                 class="download-link" download>
                <i class="fas fa-download"></i> Download
              </a>
              <button class="btn-danger" onclick="deleteFile(${file.id})">
                <i class="fas fa-trash"></i> Delete
              </button>
            </div>
          </td>
        </tr>`
      )
      .join('');
  }
}

async function deleteFile(fileId) {
  if (!confirm('Are you sure you want to delete this file?')) return;

  try {
    const response = await fetch(`${API_BASE_URL}/admin/files/delete/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.ok) {
      showNotification('File deleted successfully', 'success');
      loadUploadedFiles();
    } else {
      let msg = 'Failed to delete file';
      try {
        const text = await response.text();
        const data = text ? JSON.parse(text) : null;
        if (data && data.message) msg = data.message;
      } catch {}
      showNotification(msg, 'error');
    }
  } catch (err) {
    console.error('Delete error:', err);
    showNotification('Connection error', 'error');
  }
}

function showLoggedInState() {
  const username = localStorage.getItem('adminUsername') || 'Admin';
  document.getElementById('adminUsername').textContent = username;
  document.getElementById('adminName').style.display = 'block';
  document.getElementById('headerLogout').style.display = 'block';

  document
    .querySelectorAll('.nav-item[data-section="upload"]')
    .forEach(el => (el.style.display = 'flex'));
  document
    .querySelectorAll('.nav-item[data-section="manage"]')
    .forEach(el => (el.style.display = 'flex'));
  document
    .querySelectorAll('.nav-item[data-section="login"]')
    .forEach(el => (el.style.display = 'none'));
  document
    .querySelectorAll('#logoutBtn')
    .forEach(el => (el.style.display = 'flex'));
}

function showLoginState() {
  document.getElementById('adminName').style.display = 'none';
  document.getElementById('headerLogout').style.display = 'none';

  document
    .querySelectorAll('.nav-item[data-section="upload"]')
    .forEach(el => (el.style.display = 'none'));
  document
    .querySelectorAll('.nav-item[data-section="manage"]')
    .forEach(el => (el.style.display = 'none'));
  document
    .querySelectorAll('.nav-item[data-section="login"]')
    .forEach(el => (el.style.display = 'flex'));
  document
    .querySelectorAll('#logoutBtn')
    .forEach(el => (el.style.display = 'none'));
}

function switchSection(sectionName) {
  document.querySelectorAll('.content-section').forEach(section => {
    section.classList.remove('active');
  });

  const selectedSection = document.getElementById(sectionName + 'Section');
  if (selectedSection) selectedSection.classList.add('active');

  const titles = {
    login: 'Admin Login',
    upload: 'Upload Study Materials',
    manage: 'Manage Files'
  };
  document.getElementById('pageTitle').textContent =
    titles[sectionName] || 'Admin Panel';

  if (sectionName === 'manage') {
    loadUploadedFiles();
  }
}

function showUploadStatus(message, type) {
  const statusDiv = document.getElementById('uploadStatus');
  statusDiv.className = `upload-status ${type}`;
  statusDiv.innerHTML = `<div id="statusContent">${message}</div>`;
  statusDiv.style.display = 'block';

  if (type === 'success') {
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
}

function showNotification(message, type) {
  console.log(`[${type.toUpperCase()}] ${message}`);
}

function loadSubjectsFromBackend() {
  const subjectSelect = document.getElementById('subject');
  const filterSelect = document.getElementById('filterSubject');

  const subjects = [
    'Object Oriented Programming with C++',
    'Software Engineering',
    'Operating Systems',
    'Parallel and Distributed Computing',
    'Python Programming',
    'Microprocessor and Microcontrollers',
    'Data Structures and Algorithms',
    'Computer Architecture and Organization',
    'Theory Of Computation And Compiler Design',
    'Database Management Systems',
    'Design and Analysis of Algorithms',
    'Computer Networks',
    'Internet and Web Programming',
    'Digital Logic Design',
    'Internet of Things',
    'Healthcare Information Systems',
    'Data Visualizations',
    'Cloud Computing',
    'Knowledge Engineering',
    'Data Mining And Data Warehousing',
    'Information Retrieval and Web Search',
    'Ethical Hacking',
    'Cyber Security Framework',
    'Virtualization Essentials',
    'Forensic Science',
    'Soft Computing',
    'Computer Vision',
    'Mobile Application Development',
    'Agile Software Development',
    'Medical Imaging',
    'AWS Cloud Practitioner',
    'AWS Solution Architect',
    'Salesforce',
    'Bigdata Analytics',
    'Machine Learning',
    'Software Defined Network',
    'Software Project Management',
    'Software Testing',
    'Augmented Reality and Virtual Reality',
    'Wireless Sensor Networks',
    'Embedded Systems',
    'Pattern Recognition And Image Analysis',
    'Applied Cryptography',
    'Mathematical Foundations for Cybersecurity',
    'Engineering Chemistry',
    'Introduction to Computational chemistry',
    'Calculus',
    'Discrete Mathematics and Graph Theory',
    'Transform Techniques and Difference Equations',
    'Applied Linear Algebra',
    'Probability, Statistics and Reliability',
    'Engineering Physics',
    'Introduction to Computational Physics',
    'Fundamentals Of Space Physics',
    'Fundamentals in AI & ML',
    'Electric Circuits and Systems',
    'Engineering Design and Modelling',
    'Introduction to Problem Solving and Programming',
    'Programming in Java',
    'Competitive Coding Practices',
    'Lateral Thinking',
    'Professional Communication Skills for Engineers',
    'Dynamics of workplace communication Skills',
    'Environmental Sustainability',
    'Effective Technical Communication',
    'Advanced Technical Communication',
    'Summer Industrial Internship',
    'Semester Internship',
    'Project Exhibition - I',
    'Project Exhibition - II',
    'Engineering Project in Community Service',
    'Capstone Project - Phase 1',
    'Capstone Project - Phase 2',
    'Modelling and Simulation of Biological Systems',
    'Differential And Difference Equations',
    'Applied Numerical Method',
    'Operations Research',
    'Random Process',
    'Computational Game Theory',
    'Biophysics',
    'Bio Inspired Design',
    'Foundations of Data Science',
    'Cyber Physical Systems',
    'Human Computer Interaction',
    'Body Area Networks',
    'Sensors And Iot',
    'Introduction to Computational Linguistics',
    'Unmanned Aerial Vehicles',
    'Human Resource Management',
    'International Business',
    'Emotional Intelligence',
    'Behavioural Science',
    'Principles Of Management And Organization Behaviour',
    'Technology Entrepreneurship',
    'Digital Literacy',
    'Open Source Software (Linux Administration)',
    'Extra Curricular Activities',
    'Swachh Bharat',
    'Indian Constitution',
    'Indian Heritage',
    'Universal Human Values - I',
    'Universal Human Values - II'
  ];

  subjectSelect.innerHTML = '<option value="">Select a subject...</option>';
  filterSelect.innerHTML = '<option value="">All Subjects</option>';

  subjects.forEach(subject => {
    const option1 = document.createElement('option');
    option1.value = subject;
    option1.textContent = subject;
    subjectSelect.appendChild(option1);

    const option2 = document.createElement('option');
    option2.value = subject;
    option2.textContent = subject;
    filterSelect.appendChild(option2);
  });

  console.log('Subjects loaded: ' + subjects.length);
}
