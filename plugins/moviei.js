const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "movie",
    alias: ["cinesubz", "dinka", "m-dl"],
    react: "🎬",
    desc: "Extract movie links from Dinka or Cinesubz.",
    category: "download",
    use: ".movie <url>",
    filename: __filename
}, async (conn, mek, m, { from, reply, text }) => {
    
    // SAFE KEY LOGIC: "reading key" error se bachne ke liye
    const msgKey = m?.key || mek?.key || null;

    try {
        if (!text) return reply("🔗 Please provide a DinkaMovies or Cinesubz link!");

        // URL detect karke sahi API select karna
        let apiUrl = "";
        if (text.includes("cinesubz.lk")) {
            apiUrl = `https://api.srihub.store/movie/cinesubzdl?url=${encodeURIComponent(text)}`;
        } else if (text.includes("blogspot.com")) {
            apiUrl = `https://api.srihub.store/movie/dinkadl?url=${encodeURIComponent(text)}&apikey=dew_3sF2K3607ScVjFT0EpYlPu3HEeZmZbSKJR7uj9m7`;
        } else {
            return reply("❌ Invalid Link! Sirf Cinesubz.lk ya DinkaMovies (Blogspot) links support hain.");
        }

        if (msgKey) await conn.sendMessage(from, { react: { text: '⏳', key: msgKey } });
        
        // Wait message handle karna taaki "key" error na aaye
        const waitMsg = await conn.sendMessage(from, { text: "🎬 *Extracting movie data...*" }, { quoted: m });

        const response = await axios.get(apiUrl);
        const data = response.data;

        if (!data || data.status === false) throw new Error("Link extract nahi ho paya!");

        const movie = data.result;
        let resultMsg = `🎬 *MOVIE EXTRACTOR*\n\n`;
        resultMsg += `📝 *Title:* ${movie.title || "N/A"}\n`;
        resultMsg += `📅 *Year:* ${movie.year || "N/A"}\n\n`;
        
        if (movie.links && movie.links.length > 0) {
            movie.links.forEach((link, index) => {
                resultMsg += `${index + 1}. *${link.quality}* (${link.size || '??'})\n🔗 ${link.url}\n\n`;
            });
        }

        // Editing message safely
        if (waitMsg && waitMsg.key) {
            await conn.sendMessage(from, { text: resultMsg, edit: waitMsg.key });
        } else {
            await reply(resultMsg);
        }

        if (msgKey) await conn.sendMessage(from, { react: { text: '✅', key: msgKey } });

    } catch (e) {
        reply(`❌ *Failed:* ${e.message}`);
        if (msgKey) await conn.sendMessage(from, { react: { text: '❌', key: msgKey } });
    }
});
                
