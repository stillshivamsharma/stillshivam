// ==================== YOUTUBE CLONE JS ====================
(function() {
    'use strict';

    // API Base URL
    const API_BASE = '/api/yt-search';
    const DETAILS_API = '/api/video-details';

    // DOM Elements
    const mainContent = document.getElementById('mainContent');
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('menuBtn');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const chipBar = document.getElementById('chipBar');

    // State
    let isGridView = true;
    let currentQuery = 'trending music';

    // ==================== SIDEBAR TOGGLE ====================
    menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('full-width');
    });

    // ==================== SEARCH ====================
    function performSearch() {
        const query = searchInput.value.trim();
        if (!query) return;
        currentQuery = query;
        showGridView();
        loadVideos(query);
        // Update active chip
        document.querySelectorAll('.yt-chip').forEach(c => c.classList.remove('active'));
    }

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    // ==================== CHIP BAR ====================
    chipBar.addEventListener('click', (e) => {
        if (e.target.classList.contains('yt-chip')) {
            document.querySelectorAll('.yt-chip').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            const category = e.target.textContent.trim();
            currentQuery = category === 'All' ? 'trending music' : category;
            showGridView();
            loadVideos(currentQuery);
        }
    });

    // ==================== LOAD VIDEOS ====================
    async function loadVideos(query) {
        const grid = document.getElementById('videoGrid');
        if (!grid) return;
        grid.innerHTML = '<div style="color:#aaa;padding:20px;text-align:center;">Loading...</div>';

        try {
            const res = await fetch(`${API_BASE}?action=search&query=${encodeURIComponent(query)}&maxResults=24&category=10`);
            const data = await res.json();
            if (data.videos && data.videos.length > 0) {
                renderVideoGrid(data.videos, grid);
            } else {
                grid.innerHTML = '<div style="color:#aaa;padding:20px;text-align:center;">No videos found</div>';
            }
        } catch (e) {
            grid.innerHTML = '<div style="color:#aaa;padding:20px;text-align:center;">Failed to load videos. Try again.</div>';
        }
    }

    // ==================== RENDER VIDEO GRID ====================
    function renderVideoGrid(videos, grid) {
        grid.innerHTML = '';
        videos.forEach(video => {
            const card = createVideoCard(video);
            card.addEventListener('click', () => openWatchPage(video.id, video.title, video.channel, video.thumbnail));
            grid.appendChild(card);
        });
    }

    // ==================== CREATE VIDEO CARD ====================
    function createVideoCard(video, compact = false) {
        const card = document.createElement('div');
        card.className = 'yt-video-card';

        const durationHTML = video.isLive
            ? '<div class="yt-live-badge">LIVE</div>'
            : (video.duration ? `<div class="yt-duration">${video.duration}</div>` : '');

        card.innerHTML = `
            <div class="yt-thumbnail-container">
                <img src="${video.thumbnail}" alt="" loading="lazy">
                ${durationHTML}
            </div>
            <div class="yt-video-info">
                ${!compact ? `<div class="yt-channel-avatar"><img src="https://via.placeholder.com/36" alt="" loading="lazy"></div>` : ''}
                <div class="yt-video-details">
                    <div class="yt-video-title">${escapeHTML(video.title)}</div>
                    <div class="yt-channel-name">${escapeHTML(video.channel)}</div>
                    <div class="yt-video-meta">${video.views || 'N/A'} views${video.published ? ' · ' + video.published : ''}</div>
                </div>
            </div>
        `;
        return card;
    }

    // ==================== WATCH PAGE ====================
    async function openWatchPage(videoId, title, channel, thumbnail) {
        mainContent.innerHTML = `
            <div class="yt-watch-container">
                <div class="yt-watch-main">
                    <div class="yt-watch-player">
                        <iframe src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1"
                            allowfullscreen allow="autoplay; encrypted-media">
                        </iframe>
                    </div>
                    <div class="yt-watch-title">${escapeHTML(title)}</div>
                    <div class="yt-watch-channel">
                        <img src="https://via.placeholder.com/40" alt="">
                        <div>
                            <div class="yt-watch-channel-name">${escapeHTML(channel)}</div>
                            <div class="yt-watch-channel-subs">Loading...</div>
                        </div>
                        <button class="yt-subscribe-btn">Subscribe</button>
                    </div>
                    <div class="yt-watch-desc" id="videoDescription">Loading description...</div>
                </div>
                <div class="yt-watch-sidebar" id="watchSidebar">
                    <div style="color:#aaa;padding:20px;">Loading related videos...</div>
                </div>
            </div>
        `;

        // Load video details
        loadVideoDetails(videoId);
        // Load related videos
        loadRelatedVideos(videoId);
    }

    // ==================== LOAD VIDEO DETAILS ====================
    async function loadVideoDetails(videoId) {
        const descEl = document.getElementById('videoDescription');
        if (!descEl) return;
        try {
            const res = await fetch(`${DETAILS_API}?id=${videoId}`);
            const data = await res.json();
            if (data.description) {
                descEl.textContent = data.description;
            } else {
                descEl.textContent = 'No description available.';
            }
        } catch (e) {
            descEl.textContent = 'Failed to load description.';
        }
    }

    // ==================== LOAD RELATED VIDEOS ====================
    async function loadRelatedVideos(videoId) {
        const sidebarEl = document.getElementById('watchSidebar');
        if (!sidebarEl) return;
        try {
            const res = await fetch(`${API_BASE}?action=related&relatedTo=${videoId}&maxResults=12`);
            const data = await res.json();
            if (data.videos && data.videos.length > 0) {
                sidebarEl.innerHTML = '';
                data.videos.forEach(video => {
                    const card = createVideoCard(video, true);
                    card.addEventListener('click', () => openWatchPage(video.id, video.title, video.channel, video.thumbnail));
                    sidebarEl.appendChild(card);
                });
            } else {
                sidebarEl.innerHTML = '<div style="color:#aaa;padding:20px;">No related videos</div>';
            }
        } catch (e) {
            sidebarEl.innerHTML = '<div style="color:#aaa;padding:20px;">Failed to load related videos</div>';
        }
    }

    // ==================== SHOW GRID VIEW ====================
    function showGridView() {
        mainContent.innerHTML = `
            <div class="yt-chip-bar" id="chipBar">
                <button class="yt-chip active">All</button>
                <button class="yt-chip">Music</button>
                <button class="yt-chip">Live</button>
                <button class="yt-chip">Gaming</button>
                <button class="yt-chip">News</button>
                <button class="yt-chip">Movies</button>
                <button class="yt-chip">Learning</button>
            </div>
            <div class="yt-grid" id="videoGrid"></div>
        `;
        // Re-attach chip bar listener
        const newChipBar = document.getElementById('chipBar');
        if (newChipBar) {
            newChipBar.addEventListener('click', (e) => {
                if (e.target.classList.contains('yt-chip')) {
                    document.querySelectorAll('.yt-chip').forEach(c => c.classList.remove('active'));
                    e.target.classList.add('active');
                    const category = e.target.textContent.trim();
                    currentQuery = category === 'All' ? 'trending music' : category;
                    loadVideos(currentQuery);
                }
            });
        }
        isGridView = true;
    }

    // ==================== KEYBOARD SHORTCUTS ====================
    document.addEventListener('keydown', (e) => {
        if (document.activeElement === searchInput) return;
        if (e.key === 'i' && !e.ctrlKey && !e.metaKey) {
            showGridView();
            loadVideos('trending music');
            searchInput.value = '';
        }
    });

    // ==================== HELPER ====================
    function escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ==================== INITIAL LOAD ====================
    loadVideos('trending music');

})();
