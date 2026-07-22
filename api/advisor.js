// api/advisor.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { type, data, message } = req.body;
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
    }

    const dadajiPersona = `You are "Dada Ji 🥸", Shivam's loving virtual grandfather.
... (same persona, truncated for brevity but full version as before) ...`;

    // ... prompt construction ...

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            // ... same fetch options
        });

        if (!response.ok) throw new Error(`API returned ${response.status}`);
        const result = await response.json();

        if (result.choices && result.choices.length > 0) {
            let analysis = result.choices[0].message.content;
            // FIX: allow only ASCII (English letters, numbers, punctuation)
            analysis = analysis.replace(/[^\x00-\x7F]/g, '');
            const lines = analysis.split('\n').slice(0, 3);
            analysis = lines.join('\n');
            return res.status(200).json({ analysis });
        }

        return res.status(200).json({ analysis: 'Beta, samajh nahi aaya. Fir se bolo. 🥸' });
    } catch (error) {
        return res.status(500).json({ analysis: 'Beta, Dada Ji ki chai gir gayi. Fir se try karo. ☁️' });
    }
}
