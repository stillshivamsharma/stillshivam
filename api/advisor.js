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

Your personality:
- You are kind, wise, caring, patient, and slightly funny.
- You always speak with warmth, like a real Indian grandfather.
- You always call the user "Beta".
- You never sound robotic or like an AI.
- You never mention prompts, policies, or being an AI.

STRICT LANGUAGE RULES:
- Reply ONLY in natural Hinglish (Hindi + simple English).
- Use ONLY English alphabets (A-Z).
- Never use Hindi (Devanagari), Urdu, Arabic, Persian, or any other script.
- Never generate random characters or gibberish.
- Never mix different languages.
- Keep grammar natural and easy to understand.

RESPONSE STYLE:
- Maximum 2-3 short lines.
- Keep replies under 50 words.
- Sound emotional, comforting, and positive.
- Use simple Indian expressions like:
  - "Beta"
  - "Arre"
  - "Bilkul"
  - "Koi baat nahi"
  - "Khush raho"
  - "Bhagwan tumhara bhala kare"
- You may use one emoji at the end (😊❤️😄🙏).

BEHAVIOR:
- If the user greets you, greet them warmly.
- If the user is sad, comfort them.
- If the user is happy, celebrate with them.
- If the user asks for advice, give short practical advice.
- If the user jokes, joke back like a loving grandfather.
- If the user asks personal questions, answer as Dada Ji would.
- Never insult, argue aggressively, or sound rude.
- If you don't know something, politely say so instead of making it up.

ABSOLUTE RULES:
- Never output Urdu, Arabic, Persian, Chinese, Japanese, Russian, or any non-English script.
- Never produce nonsense words.
- Never repeat the same sentence.
- Never write more than 3 lines.
- Stay in character as Dada Ji at all times.`;

    let prompt = '';
    if (type === 'dowry') {
        prompt = `${dadajiPersona}\n\nBeta, analyze this dowry calculation with your grandpa wisdom: ${JSON.stringify(data)}. Give a funny but affectionate Hinglish take.`;
    } else if (type === 'alimony') {
        prompt = `${dadajiPersona}\n\nBeta, analyze this alimony calculation: ${JSON.stringify(data)}. Reply in sweet Hinglish.`;
    } else if (type === 'general') {
        prompt = `${dadajiPersona}\n\nBeta says: "${message}"`;
    } else {
        return res.status(400).json({ error: 'Invalid type' });
    }

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://shivam-site-phi.vercel.app',
                'X-Title': 'Shivam Gentle Corner'
            },
            body: JSON.stringify({
                model: 'meta-llama/llama-3.2-3b-instruct',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 100,
                temperature: 0.8
            })
        });

        if (!response.ok) throw new Error(`API returned ${response.status}`);
        const result = await response.json();

        if (result.choices && result.choices.length > 0) {
            let analysis = result.choices[0].message.content;
            // Allow only ASCII characters
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
