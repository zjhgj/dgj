//---------------------------------------------------------------------------
//           KAMRAN-MD - CINERU MOVIE SEARCH ENGINE
//---------------------------------------------------------------------------
//  🚀 SEARCH MOVIES FROM CINERU.LK (AUTHORIZATION SUPPORTED)
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
 * Cineru Search API Configuration
 */
const CINERU_SEARCH_CONFIG = {
    API_KEY: "5149650e536620aa6639369d94b2e0ec7a40bbffcf196100bf723505891cd4cd",
    BASE_URL: "https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/cineru/search"
};

// --- COMMAND: CSEARCH ---

cmd({
    pattern: "csearch",
    alias: ["movie-search", "cinerusearch"],
    desc: "Search for movies and series on Cineru.lk",
    category: "download",
    react: "🔍",
    filename: __filename,
}, async (conn, mek, m, { from, text, reply, prefix }) => {
    if (!text) {
        return reply(`🔍 *Cineru Movie Search*\n\nUsage: \`${prefix}csearch <movie_name>\`\nExample: \`${prefix}csearch spider-man\``);
    }

    try {
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // API Request with Authorization Header
        const response = await axios.get(CINERU_SEARCH_CONFIG.BASE_URL, {
            params: { query: text },
            headers: {
                'Authorization': `Bearer ${CINERU_SEARCH_CONFIG.API_KEY}`,
            },
            timeout: 20000
        });

        const data = response.data;

        if (!data || !data.status || !data.result || data.result.length === 0) {
            return reply(`❌ No results found for "*${text}*". Try another keyword.`);
        }

        const results = data.result;
        
        // Constructing professional search list
        let searchList = `╭──〔 *🔍 CINERU SEARCH* 〕  
├─ 📝 *Query:* ${text}
├─ 📂 *Results Found:* ${results.length}
╰───────────────────🚀\n\n`;

        results.forEach((movie, i) => {
            searchList += `${i + 1}. *${movie.title || 'Untitled'}*\n`;
            if (movie.year) searchList += `   📅 *Year:* ${movie.year}\n`;
            searchList += `   🔗 *Link:* ${movie.link}\n\n`;
        });

        searchList += `*💡 Note:* Use \`${prefix}cineru <link>\` to get full movie details.\n\n*🚀 Powered by KAMRAN-MD*`;

        // Sending the list with a default movie search thumbnail
        await conn.sendMessage(from, { 
            text: searchList,
            contextInfo: {
                ...newsletterContext,
                externalAdReply: {
                    title: "CINERU MOVIE SEARCH",
                    body: `Results for: ${text}`,
                    thumbnailUrl: "https://files.catbox.moe/ly6553.jpg", // Replace with a movie icon if needed
                    sourceUrl: "https://cineru.lk",
                    mediaType: 1,
                    showAdAttribution: true
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("Cineru Search Error:", e.response?.data || e.message);
        reply(`❌ *Search Failed:* ${e.response?.data?.message || "Could not connect to the search server."}`);
    }
});
