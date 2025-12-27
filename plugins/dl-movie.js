//---------------------------------------------------------------------------
//           KAMRAN-MD - BAISCOPES MOVIE DOWNLOADER
//---------------------------------------------------------------------------
//  🚀 TWO-STEP MOVIE SEARCH & DOWNLOAD (LID & NEWSLETTER SUPPORT)
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');
const config = require('../config');

const apiKey = "68b82f136163869bbb3b5513baf49658";

// Newsletter Context for professional branding
const newsletterContext = {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363418144382782@newsletter',
        newsletterName: 'KAMRAN-MD',
        serverMessageId: 143
    }
};

// 1. Movie Search (To get the URL)
cmd({
    pattern: "baiscope",
    alias: ["bmovie", "moviefind"],
    desc: "Search movies from Baiscopes.",
    category: "search",
    react: "🔍",
    filename: __filename,
}, async (conn, mek, m, { from, text, reply }) => {
    if (!text) return reply("🎥 *Baiscope Search*\n\nUsage: `.baiscope <movie name>`\nExample: `.baiscope Captain America` ");

    try {
        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

        // First we search to get the baiscope link
        const searchUrl = `https://sadaslk-apis.vercel.app/api/v1/movie/baiscopes/search?q=${encodeURIComponent(text)}&apiKey=${apiKey}`;
        const response = await axios.get(searchUrl);
        const results = response.data.result;

        if (!results || results.length === 0) {
            return reply("❌ No movies found for this name.");
        }

        let listMsg = `╭──〔 *🎬 BAISCOPE SEARCH* 〕\n\n`;
        results.forEach((res, i) => {
            listMsg += `*${i + 1}.* ${res.title}\n🔗 Link: ${res.link}\n\n`;
        });
        listMsg += `*Tip:* Copy the link and use \`.mdl <link>\` to get download details.\n\n*🚀 Powered by KAMRAN-MD*`;

        await reply(listMsg);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("Search Error:", e);
        reply("❌ Error searching for movies.");
    }
});

// 2. Movie Downloader (Using the URL as you specified)
cmd({
    pattern: "mdl",
    alias: ["moviedl", "infodl"],
    desc: "Download movie details using Baiscope link.",
    category: "download",
    react: "📥",
    filename: __filename,
}, async (conn, mek, m, { from, text, reply }) => {
    if (!text || !text.includes("baiscopes.lk")) {
        return reply("❌ Please provide a valid Baiscope movie link.\n\nExample: `.mdl https://baiscopes.lk/movies/captain-america/` ");
    }

    try {
        await conn.sendMessage(from, { react: { text: "📥", key: mek.key } });

        // Using your exact API structure
        const dlUrl = `https://sadaslk-apis.vercel.app/api/v1/movie/baiscopes/infodl?q=${encodeURIComponent(text)}&apiKey=${apiKey}`;
        const response = await axios.get(dlUrl);
        const movie = response.data;

        if (!movie || movie.status === false) {
            return reply("❌ Failed to fetch details. Make sure the link is correct.");
        }

        const details = movie.result;
        const infoMsg = `╭──〔 *🎬 MOVIE DOWNLOAD INFO* 〕  
├─ 📝 *Title:* ${details.title}
├─ 📅 *Year:* ${details.year || '2025'}
├─ ⭐️ *IMDb:* ${details.imdb_rating || 'N/A'}
├─ 🎭 *Category:* ${details.category || 'N/A'}
╰───────────────────🚀

*📖 Description:* ${details.description || 'No description provided.'}

*📥 DOWNLOAD LINKS:*
${details.download_links || 'No links found.'}

*🚀 Powered by KAMRAN-MD*`;

        await conn.sendMessage(from, { 
            image: { url: details.image || 'https://files.catbox.moe/ly6553.jpg' }, 
            caption: infoMsg,
            contextInfo: newsletterContext
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("DL Error:", e);
        reply("❌ Error fetching movie details.");
    }
});
