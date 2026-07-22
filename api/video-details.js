export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    const { id } = req.query;
    if (!id) {
        return res.status(400).json({ error: 'Video ID required' });
    }
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'YouTube API key not configured' });
    }
    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${id}&key=${apiKey}`
        );
        const data = await response.json();
        if (!data.items || data.items.length === 0) {
            return res.status(404).json({ error: 'Video not found' });
        }
        const video = data.items[0];
        const snippet = video.snippet;
        const stats = video.statistics;
        res.status(200).json({
            title: snippet.title,
            channel: snippet.channelTitle,
            description: snippet.description,
            views: stats.viewCount || '0',
            likes: stats.likeCount || '0',
            published: snippet.publishedAt
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch video details' });
    }
}
