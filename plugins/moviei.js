const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "donghua",
    alias: ["dh", "anime-detail"],
    react: "🏮",
    desc: "Get details and download links for Donghua movies.",
    category: "download",
    use: ".donghua <url>",
    filename: __filename
}, async (conn, mek, m, { from, reply, text }) => {
    
    // SAFE KEY LOGIC: "reading key" error fix karne ke liye
    const msgKey = m?.key || mek?.key || null;

    try {
        if (!text) return reply("🔗 Please provide a DonghuaFilm URL!\nExample: .donghua https://donghuafilm.com/anime/soul-land-movie-sword-of-dust/");

        if (msgKey) await conn.sendMessage(from, { react: { text: '⏳', key: msgKey } });

        // Stable Loading Message
        let waitMsg = await conn.sendMessage(from, { text: "🏮 *Fetching Donghua details...*" }, { quoted: m });

        // API Configuration
        const apiUrl = `https://api.cuki.biz.id/api/movie/donghua-detail?apikey=cuki-x&url=${encodeURIComponent(text)}`;
        
        const response = await axios.get(apiUrl, {
            headers: { 'x-api-key': 'cuki-x' }
        });

        const data = response.data;

        if (!data || data.status !== 200 || !data.result) {
            throw new Error("Data nahi mila! URL check karein ya API down ho sakti hai.");
        }

        const dh = data.result;

        // Message Formatting
        let resMsg = `🏮 *DONGHUA MOVIE DETAIL*\n\n`;
        resMsg += `📝 *Title:* ${dh.title || "N/A"}\n`;
        resMsg += `🎬 *Type:* ${dh.type || "N/A"}\n`;
        resMsg += `📅 *Status:* ${dh.status || "N/A"}\n`;
        resMsg += `🌟 *Rating:* ${dh.rating || "N/A"}\n\n`;
        
        // Handling Episode/Download Links
        if (dh.episodes && dh.episodes.length > 0) {
            resMsg += `📥 *Download Links:*\n`;
            dh.episodes.forEach((ep) => {
                resMsg += `\n📍 *${ep.title || 'Episode'}*\n🔗 ${ep.url}\n`;
            });
        }

        resMsg += `\n> © PROVA MD ❤️`;

        // SAFE EDIT: Checking if waitMsg.key exists before editing
        if (waitMsg && waitMsg.key) {
            await conn.sendMessage(from, { text: resMsg, edit: waitMsg.key });
        } else {
            await conn.sendMessage(from, { text: resMsg }, { quoted: m });
        }

        if (msgKey) await conn.sendMessage(from, { react: { text: '✅', key: msgKey } });

    } catch (e) {
        console.error(e);
        // Error handling without crashing
        await conn.sendMessage(from, { text: `❌ *Error:* ${e.message}` }, { quoted: m });
        if (msgKey) await conn.sendMessage(from, { react: { text: '❌', key: msgKey } });
    }
});

