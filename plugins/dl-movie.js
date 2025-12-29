//---------------------------------------------------------------------------
//           KAMRAN-MD - CINERU MOVIE & EPISODE DETAILS
//---------------------------------------------------------------------------
//  🚀 SCRAPE MOVIE DATA FROM CINERU.LK (AUTHORIZATION SUPPORTED)
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');
const config = require('../config');

// Newsletter Context for professional look
const newsletterContext = {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363418144382782@newsletter',
        newsletterName: 'KAMRAN-MD',
        serverMessageId: 143
    }
};

/**
 * Cineru API Configuration
 */
const CINERU_CONFIG = {
    API_KEY: "5149650e536620aa6639369d94b2e0ec7a40bbffcf196100bf723505891cd4cd",
    BASE_URL: "https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/cineru/movie"
};

// --- COMMAND: CINERU ---

cmd({
    pattern: "cineru",
    alias: ["movie", "cinema"],
    desc: "Get movie or episode details from Cineru.lk link.",
    category: "download",
    react: "🎬",
    filename: __filename,
}, async (conn, mek, m, { from, text, reply }) => {
    if (!text) {
        return reply(`🎬 *Cineru Movie Info*\n\nUsage: \`.cineru <cineru_link>\`\nExample: \`.cineru https://cineru.lk/kishkindhapuri-2025-sinhala-sub/\``);
    }

    if (!text.includes("cineru.lk")) {
        return reply("❌ Please provide a valid Cineru.lk URL.");
    }

    try {
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Fetching Data from API
        const response = await axios.get(CINERU_CONFIG.BASE_URL, {
            params: { url: text },
            headers: {
                'Authorization': `Bearer ${CINERU_CONFIG.API_KEY}`,
            },
            timeout: 20000
        });

        const data = response.data;

        if (!data || !data.status) {
            return reply("❌ Movie details not found. Make sure the link is correct.");
        }

        const movie = data.result;
        
        // Constructing professional caption
        let movieInfo = `╭──〔 *🎬 CINERU MOVIE INFO* 〕  
├─ 📝 *Title:* ${movie.title || 'N/A'}
├─ 📅 *Year:* ${movie.year || 'N/A'}
├─ 🎭 *Genre:* ${movie.genres || 'N/A'}
├─ ⏲️ *Runtime:* ${movie.runtime || 'N/A'}
├─ ⭐ *Rating:* ${movie.rating || 'N/A'}
╰───────────────────🚀

*📜 STORYLINE:*
${movie.description ? movie.description.substring(0, 500) + '...' : 'No description available.'}

*🔗 DOWNLOAD LINKS / EPISODES:*
${movie.links && movie.links.length > 0 
    ? movie.links.map((l, i) => `${i + 1}. [${l.quality}](${l.link})`).join('\n') 
    : 'No direct download links found.'}

*🚀 Powered by KAMRAN-MD*`;

        // Sending with Poster Image if available
        const posterUrl = movie.poster || movie.image || 'https://files.catbox.moe/ly6553.jpg';

        await conn.sendMessage(from, { 
            image: { url: posterUrl }, 
            caption: movieInfo,
            contextInfo: newsletterContext
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("Cineru Plugin Error:", e.response?.data || e.message);
        reply(`❌ *API Error:* ${e.response?.data?.message || "Failed to fetch movie data."}`);
    }
});
