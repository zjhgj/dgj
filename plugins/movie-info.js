const axios = require("axios");
const cheerio = require("cheerio");
const { cmd } = require("../command");

// Session storage for interactive replies
if (!global.movieSessions) global.movieSessions = new Map();

cmd({
    pattern: "movie",
    alias: ["film", "moviebd"],
    react: "🎬",
    desc: "Search & download movies from MovieDriveBD.",
    category: "downloader",
    filename: __filename
},           
async (conn, mek, m, { q, reply, sender, from }) => {
    try {
        if (!q) return reply("🔎 *Please provide a movie name!*\nExample: .movie Raja Saab");

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        // Step 1: Search Scraper (2026 Updated)
        const searchUrl = `https://moviedrivebd.com/?s=${encodeURIComponent(q)}`;
        const { data } = await axios.get(searchUrl, { 
            headers: { "User-Agent": "Mozilla/5.0" } 
        });
        const $ = cheerio.load(data);

        const results = [];
        $("div.result-item").each((i, el) => {
            const title = $(el).find("article > div.details > div.title > a").text().trim();
            const link = $(el).find("article > div.details > div.title > a").attr("href");
            if (link) results.push({ title, link });
        });

        if (results.length === 0) return reply("❌ No results found for: " + q);

        // Step 2: Display Results
        let searchText = `🎬 *MOVIE SEARCH RESULTS*\n\n🔎 *Query:* ${q}\n\n`;
        results.forEach((v, i) => { 
            searchText += `*${i + 1}.* ${v.title}\n`; 
        });
        searchText += `\n✳️ *Reply with number (e.g. 1) to select movie.*`;

        const sentMsg = await conn.sendMessage(from, { text: searchText }, { quoted: mek });

        // Step 3: Save Session with Expiry (Active for 10 mins)
        global.movieSessions.set(sender, {
            stage: "search",
            results,
            msgId: sentMsg.key.id,
            time: Date.now()
        });

    } catch (err) {
        console.error("Movie Error:", err);
        reply("❌ Error: API/Server is down. Please try again later.");
    }
});

/**
 * IMPORTANT: Is logic ko apne 'main handler' ya 'message listener' 
 * mein add karein jahan numbers (1, 2, 3) catch hote hain.
 */
