let flights = [];
let isLoading = true;

const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('.nav-link');
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navLinks');
const darkToggle = document.getElementById('darkModeToggle');
const body = document.body;

async function fetchFlights() {
    try {
        const res = await fetch('data/flights.json');
        if (!res.ok) throw new Error('Failed to load flights.json');
        flights = await res.json();
    } catch (err) {
        console.error('Using fallback data:', err);
        flights = [
            { id: 1, date: '2026-02-10', drone: 'Mavic 3', duration: 25, status: 'completed' },
            { id: 2, date: '2026-02-11', drone: 'Phantom 4', duration: 42, status: 'in-air' }
        ];
    } finally {
        isLoading = false;
        renderAll();
    }
}

function renderAll() {
    renderStats();
    renderFlights('recentFlightsList', 'all', 3);
    const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
    renderFlights('flightsList', activeFilter);
}

function renderStats() {
    if (!flights.length) return;
    const totalFlights = flights.length;
    const totalTime = flights.reduce((acc, f) => acc + f.duration, 0);
    const avgDuration = Math.round(totalTime / totalFlights);
    const uniqueDrones = [...new Set(flights.map(f => f.drone))].length;

    const statsHtml = `
        <div class="stat-card">
            <h3>Total Flights</h3>
            <p>${totalFlights}</p>
        </div>
        <div class="stat-card">
            <h3>Flight Time</h3>
            <p>${(totalTime / 60).toFixed(1)} h</p>
        </div>
        <div class="stat-card">
            <h3>Active Drones</h3>
            <p>${uniqueDrones}</p>
        </div>
        <div class="stat-card">
            <h3>Avg. Duration</h3>
            <p>${avgDuration} min</p>
        </div>
    `;
    document.getElementById('statsGrid').innerHTML = statsHtml;
}

function renderFlights(containerId, filter = 'all', limit = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (isLoading) {
        container.innerHTML = '<div class="loading">Loading flights...</div>';
        return;
    }

    let filtered = filter === 'all' 
        ? flights 
        : flights.filter(f => f.status === filter);
    
    if (limit) filtered = filtered.slice(0, limit);

    if (filtered.length === 0) {
        container.innerHTML = '<div class="loading">No flights found</div>';
        return;
    }

    container.innerHTML = filtered.map(f => `
        <div class="flight-item">
            <div class="flight-info">
                <span class="flight-date">${f.date}</span>
                <span class="flight-drone">${f.drone}</span>
            </div>
            <span class="flight-duration">${f.duration} min</span>
            <span class="status ${f.status}">${f.status}</span>
        </div>
    `).join('');
}

function showPage(pageId) {
    pages.forEach(page => page.classList.toggle('active', page.id === pageId));
    navLinks.forEach(link => {
        const isActive = link.dataset.page === pageId;
        link.classList.toggle('active', isActive);
    });
    window.location.hash = pageId;
}

function setDarkMode(isDark) {
    body.classList.toggle('dark', isDark);
    if (darkToggle) darkToggle.checked = isDark;
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function initDarkMode() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') setDarkMode(true);
    else if (saved === 'light') setDarkMode(false);
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) setDarkMode(true);
    else setDarkMode(false);

    if (darkToggle) {
        darkToggle.addEventListener('change', e => setDarkMode(e.target.checked));
    }
}

function initEventListeners() {
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showPage(link.dataset.page);
            navMenu.classList.remove('active');
        });
    });

    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.replace('#', '');
        if (hash && [...pages].some(p => p.id === hash)) showPage(hash);
        else showPage('dashboard');
    });

    hamburger.addEventListener('click', () => navMenu.classList.toggle('active'));
    document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
            navMenu.classList.remove('active');
        }
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderFlights('flightsList', btn.dataset.filter);
        });
    });

    const form = document.getElementById('addFlightForm');
    const feedback = document.getElementById('formFeedback');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const drone = document.getElementById('drone').value;
            const date = document.getElementById('date').value;
            const duration = document.getElementById('duration').value;
            const status = document.getElementById('status').value;

            if (!drone || !date || !duration) {
                feedback.style.color = 'var(--danger)';
                feedback.textContent = '❌ All fields required';
                return;
            }
            if (parseInt(duration) <= 0) {
                feedback.style.color = 'var(--danger)';
                feedback.textContent = '❌ Duration must be positive';
                return;
            }

            const newFlight = {
                id: flights.length + 1,
                date,
                drone,
                duration: parseInt(duration),
                status
            };
            flights.push(newFlight);
            feedback.style.color = 'var(--success)';
            feedback.textContent = '✅ Flight added! (demo)';
            form.reset();
            renderAll();
        });
    }
}

function init() {
    fetchFlights();
    initDarkMode();
    initEventListeners();

    const hash = window.location.hash.replace('#', '');
    if (hash && [...pages].some(p => p.id === hash)) showPage(hash);
    else showPage('dashboard');
}

init();
