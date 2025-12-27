//---------------------------------------------------------------------------
//           KAMRAN-MD - WALLPAPER SEARCH (WALLPAPERFLARE)
//---------------------------------------------------------------------------
//  🚀 SCRAPER INTEGRATED WITH LID & NEWSLETTER SUPPORT
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');
const cheerio = require('cheerio');
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
 * Wallpaper Scraper Function
 */
async function wallpaperScraper(query) {
    try {
        const url = `https://www.wallpaperflare.com/search?wallpaper=${encodeURIComponent(query)}`;
        const { data } = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        });

        const $ = cheerio.load(data);
        const results = [];

        $('li[itemprop="associatedMedia"]').each((_, el) => {
            const title = $(el).find('figcaption[itemprop="caption description"]').text().trim();
            const image = $(el).find("img").attr("data-src");
            const page = $(el).find('a[itemprop="url"]').attr("href");
            const resolution = $(el).find(".res").text().trim();

            if (image && page) {
                results.push({
                    title,
                    resolution,
                    image,
                    page: `https://www.wallpaperflare.com${page}`
                });
            }
        });

        return results;
    } catch (error) {
        console.error("Scraper Error:", error.message);
        return [];
    }
}

// --- WALLPAPER COMMAND ---

cmd({
    pattern: "wallpaper",
    alias: ["wall", "wp"],
    desc: "Search for high-quality wallpapers.",
    category: "search",
    react: "🖼️",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    if (!text) return reply("🖼️ *Wallpaper Search*\n\nUsage: `.wallpaper <query>`\nExample: `.wallpaper Cyberpunk` ");

    try {
        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

        const results = await wallpaperScraper(text);

        if (results.length === 0) {
            return reply("❌ No wallpapers found for your search.");
        }

        // Picking a random wallpaper from the results
        const randomWall = results[Math.floor(Math.random() * results.length)];

        const caption = `╭──〔 *🖼️ WALLPAPER INFO* 〕  
├─ 📝 *Title:* ${randomWall.title || 'N/A'}
├─ 📏 *Resolution:* ${randomWall.resolution || 'HD'}
├─ 🔗 *Source:* WallpaperFlare
╰───────────────────🚀

*🚀 Powered by KAMRAN-MD*`;

        await conn.sendMessage(from, { 
            image: { url: randomWall.image }, 
            caption: caption,
            contextInfo: newsletterContext
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("Wallpaper Command Error:", e);
        reply("❌ An error occurred while fetching wallpapers.");
    }
});
