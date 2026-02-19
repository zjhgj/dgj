const axios = require('axios');
const { cmd } = require('../command');

/**
 * Helper function to handle the Leofame API logic
 */
async function getFreeTiktokLikes(url) {
    try {
        // Step 1: Get the page to extract CSRF/Session token and cookies
        const page = await axios.get('https://leofame.com/free-tiktok-likes', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36'
            }
        });

        const html = page.data;
        const tokenMatch = html.match(/var\s+token\s*=\s*'([^']+)'/);
        
        if (!tokenMatch) throw new Error("Could not find security token.");
        
        const token = tokenMatch[1];
        const cookies = page.headers['set-cookie']
            ? page.headers['set-cookie'].map(v => v.split(';')[0]).join('; ')
            : '';

        // Step 2: Send the POST request to the API
        const res = await axios.post('https://leofame.com/free-tiktok-likes?api=1',
            new URLSearchParams({
                token: token,
                timezone_offset: 'Asia/Karachi', // Updated for your region
                free_link: url
            }).toString(),
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Origin': 'https://leofame.com',
                    'Referer': 'https://leofame.com/free-tiktok-likes',
                    'Cookie': cookies,
                    'X-Requested-With': 'XMLHttpRequest'
                }
            }
        );

        return res.data;
    } catch (error) {
        throw error;
    }
}

// --- Bot Command ---

cmd({
    pattern: "tlike",
    alias: ["tiktoklike", "freelike"],
    react: "❤️",
    desc: "Get free TikTok likes on your video link.",
    category: "tools",
    filename: __filename
},           
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❓ *Please provide a TikTok video link.*\nExample: `.tlike https://vt.tiktok.com/xxxx/`承");

        if (!q.includes('tiktok.com')) return reply("❌ Invalid TikTok URL.");

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        const result = await getFreeTiktokLikes(q);

        // Leofame usually returns JSON with 'success' or 'error' message
        if (result.status === 'success' || result.message?.toLowerCase().includes('success')) {
            const successMsg = `✅ *TikTok Likes Requested!*\n\n` +
                               `💬 *Status:* ${result.message || 'Processing'}\n` +
                               `🔗 *URL:* ${q}\n\n` +
                               `*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN*`;
            
            reply(successMsg);
            await conn.sendMessage(from, { react: { text: '🚀', key: m.key } });
        } else {
            reply(`⚠️ *Notice:* ${result.message || 'API rejected the request. It might be on cooldown.'}`);
        }

    } catch (err) {
        console.error("TikTok Like Error:", err);
        reply(`❌ *Error:* ${err.message || "Failed to connect to the provider."}`);
    }
});

