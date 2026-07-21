// api/screenshot-key.js
export default function handler(req, res) {
    const key = process.env.SCREENSHOTONE_API_KEY;
    if (!key) {
        return res.status(500).json({ error: 'ScreenshotOne API key not configured' });
    }
    return res.status(200).json({ key });
}