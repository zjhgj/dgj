const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "cinesubz",
    alias: ["csdl", "movie2"],
    react: "🎬",
    desc: "Extract download links from Cinesubz.lk movies.",
    category: "download",
    use: ".cinesubz <cinesubz_url>",
    filename: __filename
}, async (conn, mek, m, { from, reply, text }) => {
    
    // FIX: Safe Key logic for PROVA-MD stability
    const msgKey = m?.key || mek?.key || null;

    try {
        if (!text) return reply("🔗 Please provide a Cinesubz.lk movie link!");
        if (!text.includes("cinesubz.lk")) return reply("❌ This command only supports Cinesubz links!");

        if (msgKey) await conn.sendMessage(from, { react: { text: '⏳', key: msgKey } });
        
        // Stable loading message
        let waitMsg = await conn.sendMessage(from, { text: "🎬 *Fetching movie data from Cinesubz...*" }, { quoted: m });

        // Safe Edit Helper
        const safeEdit = async (txt) => {
            if (waitMsg && waitMsg.key) {
                await conn.sendMessage(from, { text: txt, edit: waitMsg.key });
            } else {
                await conn.sendMessage(from, { text: txt }, { quoted: m });
            }
        };

        // API Request to SriHub
        const apiUrl = `https://api.srihub.store/movie/cinesubzdl?url=${encodeURIComponent(text)}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (!data || data.status === false || !data.result) {
            throw new Error(data.message || "Failed to extract data. Link might be invalid.");
        }

        const movie = data.result;

        // Formatting the Result
        let resultMsg = `🎬 *MOVIE EXTRACTOR (CINESUBZ)*\n\n`;
        resultMsg += `📝 *Title:* ${movie.title || "N/A"}\n`;
        resultMsg += `📅 *Year:* ${movie.year || "N/A"}\n`;
        resultMsg += `⭐ *Rating:* ${movie.rating || "N/A"}\n\n`;
        
        if (movie.links && movie.links.length > 0) {
            resultMsg += `📥 *Download Qualities:*\n`;
            movie.links.forEach((link, index) => {
                resultMsg += `\n${index + 1}. *${link.quality}* (${link.size || 'Size Unknown'})\n🔗 ${link.url}\n`;
            });
        } else {
            resultMsg += `❌ No download links found for this movie.`;
        }

        resultMsg += `\n> © PROVA MD ❤️`;

        // Sending final result
        await safeEdit(resultMsg);

        if (msgKey) await conn.sendMessage(from, { react: { text: '✅', key: msgKey } });

    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { text: `❌ *Extraction Failed:* ${e.message}` }, { quoted: m });
        if (msgKey) await conn.sendMessage(from, { react: { text: '❌', key: msgKey } });
    }
});
          
