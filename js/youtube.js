// js/youtube.js
(function () {
    'use strict';

    const API_BASE = '/api/yt-search';
    const DETAILS_API = '/api/video-details';

    const mainContent = document.getElementById('mainContent');
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('menuBtn');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    let isGridView = true;
    let currentQuery = 'trending music';
    let player = null;
    let relatedVideos = [];
    let currentVideoId = null;
    let ytApiReady = false;

    // YouTube IFrame API callback
    window.onYouTubeIframeAPIReady = () => {
        ytApiReady = true;
        console.log('YT API ready');
    };

    function waitForApi(callback) {
        if (ytApiReady) callback();
        else setTimeout(() => waitForApi(callback), 200);
    }

    // Sidebar toggle
    menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('full-width');
    });

    // Search
    function performSearch() {
        const query = searchInput.value.trim();
        if (!query) return;
        currentQuery = query;
        showGridView();
        loadVideos(query);
        document.querySelectorAll('.yt-chip').forEach(c => c.classList.remove('active'));
    }

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    // Chip bar events
    function attachChipEvents() {
        const chipBar = document.getElementById('chipBar');
        if (!chipBar) return;
        chipBar.addEventListener('click', (e) => {
            if (e.target.classList.contains('yt-chip')) {
                document.querySelectorAll('.yt-chip').forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');
                const category = e.target.textContent.trim();
                currentQuery = category === 'All' ? 'trending music' : category;
                loadVideos(currentQuery);
            }
        });
    }

    // Load videos grid
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
            grid.innerHTML = '<div style="color:#aaa;padding:20px;text-align:center;">Failed to load videos.</div>';
        }
    }

    function renderVideoGrid(videos, grid) {
        grid.innerHTML = '';
        videos.forEach(video => {
            const card = createVideoCard(video);
            card.addEventListener('click', () => openWatchPage(video.id, video.title, video.channel, video.thumbnail));
            grid.appendChild(card);
        });
    }

    // Create video card (used in grid and related sidebar)
    function createVideoCard(video, compact = false) {
        const card = document.createElement('div');
        card.className = 'yt-video-card';

        const durationHTML = video.isLive
            ? '<div class="yt-live-badge">LIVE</div>'
            : (video.duration ? `<div class="yt-duration">${video.duration}</div>` : '');

        // Generate channel initial avatar
        const initial = video.channel ? video.channel.charAt(0).toUpperCase() : '?';
        const avatarHTML = compact ? '' : `<div class="yt-channel-avatar" aria-hidden="true">${initial}</div>`;

        card.innerHTML = `
            <div class="yt-thumbnail-container">
                <img src="${video.thumbnail}" alt="Video thumbnail" loading="lazy">
                ${durationHTML}
            </div>
            <div class="yt-video-info">
                ${avatarHTML}
                <div class="yt-video-details">
                    <div class="yt-video-title">${escapeHTML(video.title)}</div>
                    <div class="yt-channel-name">${escapeHTML(video.channel)}</div>
                    <div class="yt-video-meta">${video.views || 'N/A'} views${video.published ? ' · ' + video.published : ''}</div>
                </div>
            </div>
        `;
        return card;
    }

    // Open watch page (uses IFrame API)
    function openWatchPage(videoId, title, channel, thumbnail) {
        currentVideoId = videoId;
        relatedVideos = [];

        mainContent.innerHTML = `
            <div class="yt-watch-container">
                <div class="yt-watch-main">
                    <div class="yt-watch-player" id="playerContainer"></div>
                    <div class="yt-watch-title">${escapeHTML(title)}</div>
                    <div class="yt-watch-channel">
                        <div class="yt-channel-avatar large" aria-hidden="true">${channel.charAt(0).toUpperCase()}</div>
                        <div>
                            <div class="yt-watch-channel-name">${escapeHTML(channel)}</div>
                            <div class="yt-watch-channel-subs" id="videoStats">Loading stats...</div>
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

        // Create player when API ready
        function createPlayer() {
            if (player) player.destroy();
            player = new YT.Player('playerContainer', {
                videoId: videoId,
                playerVars: {
                    autoplay: 1,
                    rel: 0,
                    enablejsapi: 1,
                    controls: 1,
                    modestbranding: 0,
                    origin: window.location.origin
                },
                events: {
                    'onStateChange': onPlayerStateChange,
                    'onError': onPlayerError
                }
            });
            loadVideoDetails(videoId);
            loadRelatedVideos(videoId);
        }
        waitForApi(createPlayer);
    }

    function onPlayerStateChange(event) {
        if (event.data === YT.PlayerState.ENDED && relatedVideos.length > 0) {
            const nextVideo = relatedVideos.shift();
            if (nextVideo && player && player.loadVideoById) {
                player.loadVideoById(nextVideo.id);
                currentVideoId = nextVideo.id;
                loadVideoDetails(nextVideo.id);
                loadRelatedVideos(nextVideo.id);
            }
        }
    }

    function onPlayerError(event) {
        console.error('Player error:', event.data);
    }

    // Load video details (description + stats)
    async function loadVideoDetails(videoId) {
        const descEl = document.getElementById('videoDescription');
        const statsEl = document.getElementById('videoStats');
        if (!descEl && !statsEl) return;
        try {
            const res = await fetch(`${DETAILS_API}?id=${videoId}`);
            const data = await res.json();
            if (descEl) descEl.textContent = data.description || 'No description available.';
            if (statsEl) {
                const views = parseInt(data.views).toLocaleString() || '0';
                const likes = parseInt(data.likes).toLocaleString() || '0';
                const pubDate = data.published ? new Date(data.published).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
                statsEl.textContent = `${views} views · ${likes} likes · ${pubDate}`;
            }
        } catch (e) {
            if (descEl) descEl.textContent = 'Failed to load description.';
            if (statsEl) statsEl.textContent = 'Stats unavailable';
        }
    }

    // Load related videos
    async function loadRelatedVideos(videoId) {
        const sidebarEl = document.getElementById('watchSidebar');
        if (!sidebarEl) return;
        sidebarEl.innerHTML = '<div style="color:#aaa;padding:20px;">Loading related...</div>';
        try {
            const res = await fetch(`${API_BASE}?action=related&relatedTo=${videoId}&maxResults=12`);
            const data = await res.json();
            if (data.videos && data.videos.length > 0) {
                relatedVideos = data.videos;
                sidebarEl.innerHTML = '';
                data.videos.forEach(video => {
                    const card = createVideoCard(video, true);
                    card.addEventListener('click', () => {
                        if (player && player.loadVideoById) {
                            player.loadVideoById(video.id);
                            currentVideoId = video.id;
                            loadVideoDetails(video.id);
                            loadRelatedVideos(video.id);
                            // Update title and channel display
                            document.querySelector('.yt-watch-title').textContent = video.title;
                            document.querySelector('.yt-watch-channel-name').textContent = video.channel;
                            // Update channel avatar
                            const avatarDiv = document.querySelector('.yt-watch-channel .yt-channel-avatar');
                            if (avatarDiv) avatarDiv.textContent = video.channel.charAt(0).toUpperCase();
                        }
                    });
                    sidebarEl.appendChild(card);
                });
            } else {
                sidebarEl.innerHTML = '<div style="color:#aaa;padding:20px;">No related videos found</div>';
                relatedVideos = [];
            }
        } catch (e) {
            sidebarEl.innerHTML = '<div style="color:#aaa;padding:20px;">Failed to load related videos</div>';
            relatedVideos = [];
        }
    }

    // Show grid view (home)
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
        attachChipEvents();
        isGridView = true;
    }

    // Keyboard shortcut: press 'i' to go home
    document.addEventListener('keydown', (e) => {
        if (document.activeElement === searchInput) return;
        if (e.key === 'i' && !e.ctrlKey && !e.metaKey) {
            showGridView();
            loadVideos('trending music');
            searchInput.value = '';
        }
    });

    // Initial load
    loadVideos('trending music');
})();
