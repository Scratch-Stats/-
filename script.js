// Global state
let isLoggedIn = false;
let currentUser = null;
const adminUsername = 'Admin1';

// Mock data storage
let appData = {
    verifiedUsers: [],
    featuredProjects: [],
    featuredStudios: [],
    featuredUsers: []
};

// Load data from localStorage
function loadData() {
    const saved = localStorage.getItem('scratchStatsData');
    if (saved) {
        appData = JSON.parse(saved);
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('scratchStatsData', JSON.stringify(appData));
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    setupEventListeners();
    loadPublicStats();
    loadFeaturedContent();
    checkSession();
});

// Setup event listeners
function setupEventListeners() {
    // Login modal
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginModal = document.getElementById('loginModal');
    const closeBtn = document.querySelector('.close');
    const loginForm = document.getElementById('loginForm');

    loginBtn.addEventListener('click', () => {
        loginModal.style.display = 'block';
    });

    logoutBtn.addEventListener('click', logout);

    closeBtn.addEventListener('click', () => {
        loginModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === loginModal) {
            loginModal.style.display = 'none';
        }
    });

    loginForm.addEventListener('submit', handleLogin);

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', switchTab);
    });

    // Search functionality
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
}

// Perform search
async function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    
    if (!query) {
        alert('Please enter a search term');
        return;
    }

    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '<p class="loading">Searching...</p>';
    document.getElementById('searchModal').style.display = 'block';

    try {
        // Search for projects
        const projectsResponse = await fetch(`https://api.scratch.mit.edu/search/projects?q=${encodeURIComponent(query)}&limit=5`);
        const projectsData = await projectsResponse.json();

        // Search for users
        const usersResponse = await fetch(`https://api.scratch.mit.edu/search/users?q=${encodeURIComponent(query)}&limit=5`);
        const usersData = await usersResponse.json();

        let html = '';

        // Display projects
        if (projectsData && projectsData.length > 0) {
            html += '<h3>Projects</h3><div class="search-results-list">';
            projectsData.forEach(project => {
                html += `
                    <div class="search-result-item">
                        <h4>${project.title}</h4>
                        <p>By <strong>@${project.creator.username}</strong></p>
                        <p>❤️ ${project.stats.favorites} | 💬 ${project.stats.comments}</p>
                        <a href="https://scratch.mit.edu/projects/${project.id}/" target="_blank" class="result-link">View Project →</a>
                    </div>
                `;
            });
            html += '</div>';
        }

        // Display users
        if (usersData && usersData.length > 0) {
            html += '<h3>Users</h3><div class="search-results-list">';
            usersData.forEach(user => {
                html += `
                    <div class="search-result-item">
                        <h4>@${user.username}</h4>
                        <p>ID: ${user.id}</p>
                        <a href="https://scratch.mit.edu/users/${user.username}/" target="_blank" class="result-link">View Profile →</a>
                    </div>
                `;
            });
            html += '</div>';
        }

        if (!projectsData || projectsData.length === 0 && (!usersData || usersData.length === 0)) {
            html = '<p class="no-results">No results found for "' + query + '"</p>';
        }

        searchResults.innerHTML = html;
    } catch (error) {
        console.error('Search error:', error);
        searchResults.innerHTML = '<p class="error">Error performing search. Please try again.</p>';
    }
}

// Close search modal
function closeSearchModal() {
    document.getElementById('searchModal').style.display = 'none';
}

// Handle login
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');

    if (username === adminUsername && password === 'Scratch@Admin2024!Secure') {
        isLoggedIn = true;
        currentUser = username;
        createSession();
        document.getElementById('loginModal').style.display = 'none';
        updateUIState();
        loadAdminPanel();
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        errorDiv.style.display = 'none';
    } else {
        errorDiv.textContent = 'Invalid username or password';
        errorDiv.style.display = 'block';
    }
}

// Logout
function logout() {
    isLoggedIn = false;
    currentUser = null;
    clearSession();
    updateUIState();
    document.getElementById('adminPanel').style.display = 'none';
}

// Update UI state based on login
function updateUIState() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const adminPanel = document.getElementById('adminPanel');

    if (isLoggedIn) {
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        adminPanel.style.display = 'block';
    } else {
        loginBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        adminPanel.style.display = 'none';
    }
}

// Check if session is still valid
function checkSession() {
    const session = sessionStorage.getItem('adminSession');
    if (session) {
        const sessionData = JSON.parse(session);
        if (new Date(sessionData.expiry) > new Date()) {
            isLoggedIn = true;
            currentUser = sessionData.username;
            updateUIState();
            loadAdminPanel();
        } else {
            clearSession();
        }
    }
}

// Load public statistics
async function loadPublicStats() {
    try {
        // Mock data - in production, this would call the Scratch API
        const stats = {
            users: Math.floor(Math.random() * 100000000) + 50000000,
            projects: Math.floor(Math.random() * 50000000) + 25000000,
            studios: Math.floor(Math.random() * 5000000) + 1000000,
            comments: Math.floor(Math.random() * 200000000) + 100000000
        };

        document.getElementById('totalUsers').textContent = stats.users.toLocaleString();
        document.getElementById('totalProjects').textContent = stats.projects.toLocaleString();
        document.getElementById('totalStudios').textContent = stats.studios.toLocaleString();
        document.getElementById('totalComments').textContent = stats.comments.toLocaleString();
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load featured content with clickable links
function loadFeaturedContent() {
    const projectsDiv = document.getElementById('featuredProjects');
    const studiosDiv = document.getElementById('featuredStudios');
    const usersDiv = document.getElementById('featuredUsers');

    projectsDiv.innerHTML = appData.featuredProjects.map(p => 
        `<a href="https://scratch.mit.edu/projects/${p.id}/" target="_blank" class="featured-item featured-link"><strong>${p.title}</strong><p>ID: ${p.id}</p></a>`
    ).join('') || '<p style="color:#999;">No featured projects yet</p>';

    studiosDiv.innerHTML = appData.featuredStudios.map(s => 
        `<a href="https://scratch.mit.edu/studios/${s.id}/" target="_blank" class="featured-item featured-link"><strong>${s.title}</strong><p>ID: ${s.id}</p></a>`
    ).join('') || '<p style="color:#999;">No featured studios yet</p>';

    usersDiv.innerHTML = appData.featuredUsers.map(u => 
        `<a href="https://scratch.mit.edu/users/${u.username}/" target="_blank" class="featured-item featured-link"><strong>@${u.username}</strong><p>✓ Verified</p></a>`
    ).join('') || '<p style="color:#999;">No featured users yet</p>';
}

// Load admin panel
function loadAdminPanel() {
    loadVerifiedUsers();
    loadManagedFeatured();
}

// Verify user
function verifyUser() {
    const username = document.getElementById('verifyUsername').value.trim();
    if (!username) {
        alert('Please enter a username');
        return;
    }

    if (!appData.verifiedUsers.includes(username)) {
        appData.verifiedUsers.push(username);
        saveData();
        document.getElementById('verifyUsername').value = '';
        loadVerifiedUsers();
        alert(`✓ ${username} has been verified!`);
    } else {
        alert(`${username} is already verified`);
    }
}

// Load verified users list
function loadVerifiedUsers() {
    const list = document.getElementById('verifiedUsersList');
    list.innerHTML = appData.verifiedUsers.map(user => 
        `<div class="list-item">
            <span>✓ @${user}</span>
            <button class="btn btn-danger" onclick="unverifyUser('${user}')">Remove</button>
        </div>`
    ).join('') || '<p style="color:#999;">No verified users yet</p>';
}

// Unverify user
function unverifyUser(username) {
    appData.verifiedUsers = appData.verifiedUsers.filter(u => u !== username);
    saveData();
    loadVerifiedUsers();
}

// Feature project
function featureProject() {
    const id = document.getElementById('projectId').value.trim();
    const title = document.getElementById('projectTitle').value.trim();

    if (!id || !title) {
        alert('Please enter project ID and title');
        return;
    }

    appData.featuredProjects.unshift({ id, title });
    if (appData.featuredProjects.length > 6) appData.featuredProjects.pop();
    saveData();
    document.getElementById('projectId').value = '';
    document.getElementById('projectTitle').value = '';
    loadFeaturedContent();
    loadManagedFeatured();
    alert(`✓ Project "${title}" featured!`);
}

// Feature studio
function featureStudio() {
    const id = document.getElementById('studioId').value.trim();
    const title = document.getElementById('studioTitle').value.trim();

    if (!id || !title) {
        alert('Please enter studio ID and title');
        return;
    }

    appData.featuredStudios.unshift({ id, title });
    if (appData.featuredStudios.length > 6) appData.featuredStudios.pop();
    saveData();
    document.getElementById('studioId').value = '';
    document.getElementById('studioTitle').value = '';
    loadFeaturedContent();
    loadManagedFeatured();
    alert(`✓ Studio "${title}" featured!`);
}

// Feature user
function featureUser() {
    const username = document.getElementById('userId').value.trim();

    if (!username) {
        alert('Please enter a username');
        return;
    }

    appData.featuredUsers.unshift({ username });
    if (appData.featuredUsers.length > 6) appData.featuredUsers.pop();
    saveData();
    document.getElementById('userId').value = '';
    loadFeaturedContent();
    loadManagedFeatured();
    alert(`✓ @${username} featured!`);
}

// Load managed featured content
function loadManagedFeatured() {
    const projectsDiv = document.getElementById('manageFeaturedProjects');
    const studiosDiv = document.getElementById('manageFeaturedStudios');
    const usersDiv = document.getElementById('manageFeaturedUsers');

    projectsDiv.innerHTML = appData.featuredProjects.map((p, i) => 
        `<div class="manage-item">
            <span>${p.title}</span>
            <button class="btn btn-danger" onclick="removeFeature('projects', ${i})">Remove</button>
        </div>`
    ).join('') || '<p style="color:#999;">No featured projects</p>';

    studiosDiv.innerHTML = appData.featuredStudios.map((s, i) => 
        `<div class="manage-item">
            <span>${s.title}</span>
            <button class="btn btn-danger" onclick="removeFeature('studios', ${i})">Remove</button>
        </div>`
    ).join('') || '<p style="color:#999;">No featured studios</p>';

    usersDiv.innerHTML = appData.featuredUsers.map((u, i) => 
        `<div class="manage-item">
            <span>@${u.username}</span>
            <button class="btn btn-danger" onclick="removeFeature('users', ${i})">Remove</button>
        </div>`
    ).join('') || '<p style="color:#999;">No featured users</p>';
}

// Remove featured item
function removeFeature(type, index) {
    if (type === 'projects') appData.featuredProjects.splice(index, 1);
    else if (type === 'studios') appData.featuredStudios.splice(index, 1);
    else if (type === 'users') appData.featuredUsers.splice(index, 1);
    saveData();
    loadFeaturedContent();
    loadManagedFeatured();
}

// Switch tabs
function switchTab(e) {
    const tabName = e.target.getAttribute('data-tab');
    
    // Remove active class from all buttons and content
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to clicked button and its content
    e.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

// Session management
function createSession() {
    const session = {
        username: currentUser,
        createdAt: new Date(),
        expiry: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hour expiry
    };
    sessionStorage.setItem('adminSession', JSON.stringify(session));
}

function clearSession() {
    sessionStorage.removeItem('adminSession');
}

// Auto-refresh stats every 5 minutes
setInterval(loadPublicStats, 5 * 60 * 1000);
