// api/form-action.js
export default function handler(req, res) {
    const endpoint = process.env.FORMSPREE_ENDPOINT;
    if (!endpoint) {
        // If not set, return empty; frontend will handle gracefully
        return res.status(200).json({ endpoint: '' });
    }
    return res.status(200).json({ endpoint });
}