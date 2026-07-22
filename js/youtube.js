(function() {
    const API_BASE = '/api/yt-search';
    const DETAILS_API = '/api/video-details';
    const mainContent = document.getElementById('mainContent');
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('menuBtn');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    let player = null;
    let currentVideoId = null;

    function getVideoGrid() {
        return document.getElementById('videoGrid');
    }

    // ---- Sidebar toggle ----
    menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('full-width');
    });

    // ---- Search ----
    function performSearch() {
        const query = searchInput.value.trim();
        if (!query) return;
        loadVideos(query);
    }
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    // ---- Load trending ----
    async function loadTrending() {
        showGrid();
        const grid = getVideoGrid();
        if (!grid) return;
        grid.innerHTML = '<div class="yt-video-card"><p>Loading...</p></div>';
        try {
            const res = await fetch(`${API_BASE}?action=search&query=trending&maxResults=20&category=10`);
            const data = await res.json();
            if (data.videos && data.videos.length) {
                renderVideoGrid(data.videos, grid);
            } else {
                grid.innerHTML = '<p>No trending videos found.</p>';
            }
        } catch (e) {
            grid.innerHTML = '<p>Failed to load videos.</p>';
        }
    }

    async function loadVideos(query) {
        showGrid();
        const grid = getVideoGrid();
        if (!grid) return;
        grid.innerHTML = '<div class="yt-video-card"><p>Loading...</p></div>';
        try {
            const res = await fetch(`${API_BASE}?action=search&query=${encodeURIComponent(query)}&maxResults=20&category=10`);
            const data = await res.json();
            if (data.videos && data.videos.length) {
                renderVideoGrid(data.videos, grid);
            } else {
                grid.innerHTML = '<p>No results found.</p>';
            }
        } catch (e) {
            grid.innerHTML = '<p>Search failed.</p>';
        }
    }

    function renderVideoGrid(videos, grid) {
        grid.innerHTML = '';
        videos.forEach(video => {
            const card = createVideoCard(video);
            card.addEventListener('click', () => openWatchPage(video.id));
            grid.appendChild(card);
        });
    }

    function createVideoCard(video) {
        const card = document.createElement('div');
        card.className = 'yt-video-card';
        card.innerHTML = `
            <div class="yt-thumbnail">
                <img src="${video.thumbnail}" alt="" loading="lazy">
            </div>
            <div class="yt-video-info">
                <div class="yt-channel-avatar"></div>
                <div>
                    <div class="yt-video-title">${escapeHTML(video.title)}</div>
                    <div class="yt-channel-name">${escapeHTML(video.channel)}</div>
                    <div class="yt-video-meta">${video.views || 'N/A views'} · ${video.published || 'Unknown'}</div>
                </div>
            </div>
        `;
        return card;
    }

    // ---- Watch Page ----
    async function openWatchPage(videoId) {
        currentVideoId = videoId;
        mainContent.innerHTML = `
            <div class="yt-watch">
                <div class="yt-watch-main">
                    <div class="yt-watch-player-container" id="playerContainer"></div>
                    <div class="yt-video-details" id="videoDetails">Loading...</div>
                </div>
                <div class="yt-watch-sidebar" id="watchSidebar">
                    <p>Loading related...</p>
                </div>
            </div>
        `;

        // Load YouTube player
        if (player) player.destroy();
        player = new YT.Player('playerContainer', {
            videoId: videoId,
            playerVars: {
                autoplay: 0,
                controls: 1,
                modestbranding: 1,
                rel: 0,
                enablejsapi: 1
            },
            events: {
                onReady: () => {}
            }
        });

        // Fetch video details
        loadVideoDetails(videoId);
        // Fetch related videos
        loadRelatedVideos(videoId);
    }

    async function loadVideoDetails(videoId) {
        const container = document.getElementById('videoDetails');
        if (!container) return;
        try {
            const res = await fetch(`${DETAILS_API}?id=${videoId}`);
            const data = await res.json();
            if (data.error) {
                container.innerHTML = '<p>Could not load details.</p>';
                return;
            }
            const title = data.title || 'Unknown';
            const channel = data.channel || 'Unknown';
            const description = data.description || 'No description';
            const views = data.views || '0';
            container.innerHTML = `
                <h1>${escapeHTML(title)}</h1>
                <div class="yt-video-meta-row">
                    <div class="yt-channel-info">
                        <img src="https://via.placeholder.com/40" alt="channel">
                        <div>
                            <div class="yt-channel-name">${escapeHTML(channel)}</div>
                            <div class="yt-video-meta">${views} views</div>
                        </div>
                    </div>
                    <button class="yt-sub-btn">Subscribe</button>
                </div>
                <div class="yt-video-description">${escapeHTML(description)}</div>
            `;
        } catch (e) {
            container.innerHTML = '<p>Failed to load details.</p>';
        }
    }

    async function loadRelatedVideos(videoId) {
        const sidebarEl = document.getElementById('watchSidebar');
        if (!sidebarEl) return;
        try {
            const res = await fetch(`${API_BASE}?action=related&relatedTo=${videoId}&maxResults=10`);
            const data = await res.json();
            if (data.videos && data.videos.length) {
                sidebarEl.innerHTML = '';
                data.videos.forEach(video => {
                    const card = createVideoCard(video);
                    card.addEventListener('click', () => openWatchPage(video.id));
                    sidebarEl.appendChild(card);
                });
            } else {
                sidebarEl.innerHTML = '<p>No related videos.</p>';
            }
        } catch (e) {
            sidebarEl.innerHTML = '<p>Failed to load related.</p>';
        }
    }

    function showGrid() {
        mainContent.innerHTML = '<div class="yt-grid" id="videoGrid"></div>';
    }

    // ---- Keyboard Shortcuts ----
    document.addEventListener('keydown', (e) => {
        // Ignore if typing in search
        if (document.activeElement === searchInput) return;
        if (!player || typeof player.getPlayerState !== 'function') return;

        switch (e.key) {
            case ' ':
                e.preventDefault();
                if (player.getPlayerState() === 1) player.pauseVideo();
                else player.playVideo();
                break;
            case 'm':
                if (player.isMuted()) player.unMute();
                else player.mute();
                break;
            case 'f':
                // fullscreen via player element
                const iframe = player.getIframe();
                if (iframe) {
                    if (iframe.requestFullscreen) iframe.requestFullscreen();
                    else if (iframe.webkitRequestFullscreen) iframe.webkitRequestFullscreen();
                }
                break;
            case 'i':
                // go back to home (trending)
                loadTrending();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                player.seekTo(player.getCurrentTime() - 5, true);
                break;
            case 'ArrowRight':
                e.preventDefault();
                player.seekTo(player.getCurrentTime() + 5, true);
                break;
        }
    });

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Initialize
    loadTrending();
})();
