export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { action, query, relatedTo, maxResults } = req.query;
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'YouTube API key not configured' });
    }

    let url;
    if (action === 'search') {
        if (!query) return res.status(400).json({ error: 'Query required' });
        url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${maxResults || 6}&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`;
    } else if (action === 'related') {
        if (!relatedTo) return res.status(400).json({ error: 'relatedTo required' });
        url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${maxResults || 6}&relatedToVideoId=${relatedTo}&type=video&key=${apiKey}`;
    } else {
        return res.status(400).json({ error: 'Invalid action. Use "search" or "related".' });
    }

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.error) return res.status(500).json({ error: data.error.message });

        const videos = (data.items || []).map(item => ({
            id: item.id.videoId,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails.medium.url
        }));

        return res.status(200).json({ videos });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch from YouTube' });
    }
}