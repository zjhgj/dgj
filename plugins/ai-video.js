const { cmd } = require('../command'); // Aapke bot ka command handler
const axios = require('axios');

// Function to handle the API request
const img2toPrompt = async (base64Image) => {
    const r = await axios.post(
        'https://wabpfqsvdkdjpjjkbnok.supabase.co/functions/v1/unified-prompt-dev',
        { 
            feature: 'image-to-prompt-en', 
            language: 'en', 
            image: base64Image 
        },
        {
            responseType: 'stream',
            headers: {
                'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhYnBmcXN2ZGtkanBqamtibm9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzczNjk5MjEsImV4cCI6MjA1Mjk0NTkyMX0.wGGq1SWLIRELdrntLntBz-QH-JxoHUdz8Gq-0ha-4a4',
                'content-type': 'application/json',
                'origin': 'https://generateprompt.ai',
                'referer': 'https://generateprompt.ai/',
                'user-agent': 'Mozilla/5.0'
            }
        }
    );

    return new Promise((resolve, reject) => {
        let result = '';
        let buffer = '';

        r.data.on('data', (chunk) => {
            buffer += chunk.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop(); 

            for (const line of lines) {
                if (!line.startsWith('data:')) continue;
                const raw = line.slice(5).trim();
                try {
                    const json = JSON.parse(raw);
                    const text = json?.choices?.[0]?.delta?.content || json?.content || json?.text || '';
                    result += text;
                } catch {}
            }
        });

        r.data.on('end', () => resolve(result.trim()));
        r.data.on('error', reject);
    });
};

cmd({
    pattern: "img2prompt",
    alias: ["toprompt", "getprompt"],
    react: "🔍",
    desc: "Convert an image into an AI prompt description.",
    category: "tools",
    use: "Reply to an image with .img2prompt",
    filename: __filename
}, async (conn, mek, m, { from, reply, quoted, mime }) => {
    // Image check logic
    const q = quoted ? quoted : m;
    const mediaMime = (q.msg || q).mimetype || '';

    if (!mediaMime.startsWith('image/')) {
        return reply("📸 Please reply to an image to convert it into a prompt.");
    }

    try {
        await reply("⏳ *Analyzing image, please wait...*");

        // Download and convert to base64
        const mediaBuffer = await q.download();
        const base64 = `data:${mediaMime};base64,${mediaBuffer.toString('base64')}`;
        
        const result = await img2toPrompt(base64);
        
        if (!result) {
            return reply("❌ Failed to get prompt from this image.");
        }

        let responseText = `📷 *IMAGE TO PROMPT*\n\n` +
                          `${result}\n\n` +
                          `> © kamran-ᴍᴅ ꜱʏꜱᴛᴇᴍ 🛡️`;

        await conn.sendMessage(from, { text: responseText }, { quoted: mek });

    } catch (e) {
        console.error(e);
        reply("❌ Error processing image. The API might be busy.");
    }
});
                  
