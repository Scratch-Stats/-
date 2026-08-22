// =========================
// Global State
// =========================

let isLoggedIn = false;
let currentUser = null;
const adminUsername = "Duke_Scratch56";

// Backend URL
const BACKEND = "https://scratch-stats-backend.onrender.com";

// Admin Token Headers
function getAdminHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + sessionStorage.getItem("adminToken")
    };
}

// Local fallback (only for pending requests)
let appData = {
    pendingVerify: [],
    pendingAdmin: []
};

// =========================
// Init
// =========================

document.addEventListener("DOMContentLoaded", () => {
    loadData();
    setupEventListeners();
    loadPublicStats();
    loadLeaderboard();
    checkSession();
});

// =========================
// Load & Save (local only)
// =========================

function loadData() {
    const saved = localStorage.getItem("scratchStatsData");
    if (saved) {
        appData = JSON.parse(saved);
        appData.pendingVerify ||= [];
        appData.pendingAdmin ||= [];
    }
}

function saveData() {
    localStorage.setItem("scratchStatsData", JSON.stringify(appData));
}

// =========================
// Event Listeners
// =========================

function setupEventListeners() {
    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const loginModal = document.getElementById("loginModal");
    const closeBtn = document.querySelector(".close");
    const loginForm = document.getElementById("loginForm");

    loginBtn.addEventListener("click", () => loginModal.style.display = "block");
    logoutBtn.addEventListener("click", logout);
    closeBtn.addEventListener("click", () => loginModal.style.display = "none");

    window.addEventListener("click", (e) => {
        if (e.target === loginModal) loginModal.style.display = "none";
    });

    loginForm.addEventListener("submit", handleLogin);

    // Tabs
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", switchTab);
    });

    // Search
    const searchInput = document.getElementById("searchInput");
    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") performSearch();
    });
}

// =========================
// Search
// =========================

async function performSearch() {
    const query = document.getElementById("searchInput").value.trim();
    if (!query) return alert("Please enter a search term");

    const searchResults = document.getElementById("searchResults");
    searchResults.innerHTML = "<p class='loading'>Searching...</p>";
    document.getElementById("searchModal").style.display = "block";

    try {
        const [projectsRes, usersRes] = await Promise.all([
            fetch(`${BACKEND}/api/search/projects?q=${encodeURIComponent(query)}&limit=5`),
            fetch(`${BACKEND}/api/search/users?q=${encodeURIComponent(query)}&limit=5`)
        ]);

        const projects = await projectsRes.json();
        const users = await usersRes.json();

        let html = "";

        if (Array.isArray(projects) && projects.length > 0) {
            html += `<h3>Projects</h3><div class="search-results-list">`;
            projects.forEach(p => {
                html += `
                    <div class="search-result-item">
                        <h4>${p.title || "Untitled"}</h4>
                        <p>By <strong>@${p.creator?.username || "Unknown"}</strong></p>
                        <p>❤️ ${p.stats?.favorites || 0} | 💬 ${p.stats?.comments || 0}</p>
                        <a href="https://scratch.mit.edu/projects/${p.id}/" target="_blank" class="result-link">View Project →</a>
                    </div>`;
            });
            html += `</div>`;
        }

        if (Array.isArray(users) && users.length > 0) {
            html += `<h3>Users</h3><div class="search-results-list">`;
            users.forEach(u => {
                html += `
                    <div class="search-result-item">
                        <h4>@${u.username}</h4>
                        <p>ID: ${u.id}</p>
                        <a href="https://scratch.mit.edu/users/${u.username}/" target="_blank" class="result-link">View Profile →</a>
                    </div>`;
            });
            html += `</div>`;
        }

        searchResults.innerHTML = html || `<p class="no-results">No results found for "${query}"</p>`;

    } catch (err) {
        console.error("Search error:", err);
        searchResults.innerHTML = "<p class='error'>Error performing search.</p>";
    }
}

function closeSearchModal() {
    document.getElementById("searchModal").style.display = "none";
}

// =========================
// Login (Backend)
// =========================

async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const errorDiv = document.getElementById("loginError");

    try {
        const res = await fetch(`${BACKEND}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (!res.ok) {
            errorDiv.textContent = "Invalid username or password";
            errorDiv.style.display = "block";
            return;
        }

        sessionStorage.setItem("adminToken", data.token);
        isLoggedIn = true;
        currentUser = username;

        updateUIState();
        loadAdminPanel();
        document.getElementById("loginModal").style.display = "none";

    } catch (err) {
        errorDiv.textContent = "Login error";
        errorDiv.style.display = "block";
    }
}

function logout() {
    isLoggedIn = false;
    currentUser = null;
    sessionStorage.removeItem("adminToken");
    updateUIState();
    document.getElementById("adminPanel").style.display = "none";
}

function updateUIState() {
    document.getElementById("loginBtn").style.display = isLoggedIn ? "none" : "block";
    document.getElementById("logoutBtn").style.display = isLoggedIn ? "block" : "none";
    document.getElementById("adminPanel").style.display = isLoggedIn ? "block" : "none";
}

// =========================
// Stats
// =========================

function loadPublicStats() {
    const stats = {
        users: 250000000 + Math.floor(Math.random() * 50000000),
        projects: 180000000 + Math.floor(Math.random() * 30000000),
        studios: 8000000 + Math.floor(Math.random() * 2000000),
        comments: 580000000 + Math.floor(Math.random() * 100000000)
    };

    document.getElementById("totalUsers").textContent = stats.users.toLocaleString();
    document.getElementById("totalProjects").textContent = stats.projects.toLocaleString();
    document.getElementById("totalStudios").textContent = stats.studios.toLocaleString();
    document.getElementById("totalComments").textContent = stats.comments.toLocaleString();
}

// =========================
// Admin Panel
// =========================

function loadAdminPanel() {
    loadVerifiedUsers();
    loadPendingRequests();
}

// =========================
// Verified Users (Backend)
// =========================

async function loadVerifiedUsers() {
    try {
        const res = await fetch(`${BACKEND}/verified`);
        const data = await res.json();

        const list = document.getElementById("verifiedUsersList");
        list.innerHTML =
            data.verifiedUsers.map(user =>
                `<div class="list-item">
                    <span>✓ @${user}</span>
                    <button class="btn btn-danger" onclick="unverifyUser('${user}')">Remove</button>
                </div>`
            ).join("") || `<p style="color:#999;">No verified users yet</p>`;
    } catch (err) {
        console.error("Verified error:", err);
    }
}

async function verifyUser() {
    const username = document.getElementById("verifyUsername").value.trim();
    if (!username) return alert("Enter a username");

    await fetch(`${BACKEND}/verified/add`, {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({ username })
    });

    loadVerifiedUsers();
}

async function unverifyUser(username) {
    await fetch(`${BACKEND}/verified/remove`, {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({ username })
    });

    loadVerifiedUsers();
}

// =========================
// Pending Requests (local only)
// =========================

function loadPendingRequests() {
    const verifyDiv = document.getElementById("pendingVerifyList");
    const adminDiv = document.getElementById("pendingAdminList");

    verifyDiv.innerHTML =
        appData.pendingVerify.map((req, i) =>
            `<div class="pending-card">
                <strong>@${req.username}</strong>
                <p>${req.reason}</p>
            </div>`
        ).join("") || `<p style="color:#999;">No pending verification requests</p>`;

    adminDiv.innerHTML =
        appData.pendingAdmin.map((req, i) =>
            `<div class="pending-card">
                <strong>@${req.username}</strong>
                <p>${req.reason}</p>
            </div>`
        ).join("") || `<p style="color:#999;">No pending admin requests</p>`;
}

// =========================
// Leaderboard
// =========================

async function loadLeaderboard() {
    try {
        const res = await fetch(`${BACKEND}/leaderboard`);
        const data = await res.json();

        const list = document.getElementById("leaderboardList");
        if (!list) return;

        list.innerHTML = data.map((u, i) => `
            <div class="leaderboard-item">
                <div class="leaderboard-rank">#${i + 1}</div>
                <div class="leaderboard-info">
                    <strong>@${u.username}</strong>
                    <p>${u.followers.toLocaleString()} followers</p>
                </div>
                <a href="https://scratch.mit.edu/users/${u.username}/" target="_blank" class="leaderboard-link">View →</a>
            </div>
        `).join("");

    } catch (err) {
        console.error("Leaderboard error:", err);
    }
}

// =========================
// Tabs
// =========================

function switchTab(e) {
    const tabName = e.target.getAttribute("data-tab");

    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"));

    e.target.classList.add("active");
    document.getElementById(tabName).classList.add("active");
}
