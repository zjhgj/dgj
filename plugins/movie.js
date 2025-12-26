// ✅ Coded by DR KAMRAN for KAMRAN MD
// ⚙️ API: https://movanest.zone.id/v2/sublk?url=

const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "mv",
    alias: ["film", "watch"],
    desc: "Search and get download links for movies.",
    category: "download",
    react: "🍿",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("🎥 Please provide a Movie name or URL!\n\nExample: `.movie Inception` or `.movie https://example.com/movie`.");

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // ⚙️ API Configuration
        const apiUrl = `https://movanest.zone.id/v2/sublk?url=${encodeURIComponent(q)}`;
        
        // 🔍 Fetch Data
        const response = await axios.get(apiUrl);
        const data = response.data;

        // Check if API response is valid
        if (!data || !data.status || !data.result) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return await reply("❌ No results found or API is currently down. Please try again later.");
        }

        const movie = data.result;

        // 🖼️ Create Information Caption
        const movieCaption = `
*🎬 MOVIE DOWNLOADER*

🎞️ *Title:* ${movie.title || 'Unknown'}
📅 *Release:* ${movie.release_date || 'N/A'}
⭐ *Rating:* ${movie.rating || 'N/A'}
📂 *Quality:* ${movie.quality || 'HD'}

🔗 *Download/Watch Link:*
${movie.download_url || movie.link || 'No link available'}

*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN*`;

        // 📦 Send Movie Poster and Details
        await conn.sendMessage(from, {
            image: { url: movie.thumbnail || movie.poster || 'https://i.imgur.com/8B1OId6.jpeg' },
            caption: movieCaption
        }, { quoted: mek });

        // ✅ Final success reaction
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("❌ Error in .movie command:", e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await reply(`⚠️ *Error:* ${e.message || "An unexpected error occurred while fetching the movie."}`);
    }
});
