// YouTube Clone - JS Logic
(function() {
    const API_BASE = '/api/yt-search';
    const videoGrid = document.getElementById('videoGrid');
    const mainContent = document.getElementById('mainContent');
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('menuBtn');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    // Sidebar toggle
    menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('full-width');
    });

    // Search functionality
    function performSearch() {
        const query = searchInput.value.trim();
        if (!query) return;
        loadVideos(query);
    }
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    // Load trending videos on homepage
    async function loadTrending() {
        showGrid();
        videoGrid.innerHTML = '<div class="yt-video-card"><p>Loading...</p></div>';
        try {
            const res = await fetch(`${API_BASE}?action=search&query=trending&maxResults=20&category=10`);
            const data = await res.json();
            if (data.videos && data.videos.length > 0) {
                renderVideoGrid(data.videos);
            }
        } catch (e) {
            videoGrid.innerHTML = '<p>Failed to load videos.</p>';
        }
    }

    // Load videos for a search query
    async function loadVideos(query) {
        showGrid();
        videoGrid.innerHTML = '<div class="yt-video-card"><p>Loading...</p></div>';
        try {
            const res = await fetch(`${API_BASE}?action=search&query=${encodeURIComponent(query)}&maxResults=20&category=10`);
            const data = await res.json();
            if (data.videos && data.videos.length > 0) {
                renderVideoGrid(data.videos);
            } else {
                videoGrid.innerHTML = '<p>No results found.</p>';
            }
        } catch (e) {
            videoGrid.innerHTML = '<p>Search failed.</p>';
        }
    }

    // Render video grid
    function renderVideoGrid(videos) {
        videoGrid.innerHTML = '';
        videos.forEach(video => {
            const card = createVideoCard(video);
            card.addEventListener('click', () => openWatchPage(video.id));
            videoGrid.appendChild(card);
        });
    }

    // Create a video card element
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

    // Open watch page with embed player
    function openWatchPage(videoId) {
        mainContent.innerHTML = `
            <div class="yt-watch">
                <div class="yt-watch-player">
                    <iframe src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1" allowfullscreen></iframe>
                </div>
                <div class="yt-watch-sidebar" id="watchSidebar">
                    <p>Loading related...</p>
                </div>
            </div>
        `;
        loadRelatedVideos(videoId);
    }

    // Load related videos for watch sidebar
    async function loadRelatedVideos(videoId) {
        const sidebar = document.getElementById('watchSidebar');
        try {
            const res = await fetch(`${API_BASE}?action=related&relatedTo=${videoId}&maxResults=10`);
            const data = await res.json();
            if (data.videos && data.videos.length > 0) {
                sidebar.innerHTML = '';
                data.videos.forEach(video => {
                    const card = createVideoCard(video);
                    card.addEventListener('click', () => openWatchPage(video.id));
                    sidebar.appendChild(card);
                });
            } else {
                sidebar.innerHTML = '<p>No related videos.</p>';
            }
        } catch (e) {
            sidebar.innerHTML = '<p>Failed to load related.</p>';
        }
    }

    // Show grid (clear watch page)
    function showGrid() {
        mainContent.innerHTML = '<div class="yt-grid" id="videoGrid"></div>';
        // Reassign videoGrid reference because innerHTML destroyed the old one
        window.videoGrid = document.getElementById('videoGrid');
    }

    // Helper escape HTML
    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Initialize
    loadTrending();
})();
