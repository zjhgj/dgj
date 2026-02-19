const axios = require("axios");
const cheerio = require("cheerio");
const { cmd } = require("../command");

const HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
};

cmd({
    pattern: "movie",
    alias: ["dlmovie", "getfilm"],
    react: "📥",
    desc: "Direct Movie Downloader (No selection, direct download).",
    category: "downloader",
    filename: __filename
},           
async (conn, mek, m, { q, reply, from }) => {
    try {
        if (!q) return reply("🔎 *Please provide a movie name!*");

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        // Step 1: Search for Movie
        const searchUrl = `https://moviedrivebd.com/?s=${encodeURIComponent(q)}`;
        const { data } = await axios.get(searchUrl, { headers: HEADERS });
        const $ = cheerio.load(data);

        const firstResult = $("div.result-item").first();
        const movieTitle = firstResult.find("article > div.details > div.title > a").text().trim();
        const movieLink = firstResult.find("article > div.details > div.title > a").attr("href");

        if (!movieLink) return reply("❌ Movie nahi mili! Sahi naam likhein.");

        // Step 2: Fetch Quality Links (Directly picking the first available quality)
        const { data: moviePage } = await axios.get(movieLink, { headers: HEADERS });
        const $m = cheerio.load(moviePage);
        const dlPageUrl = $m("a[href*='/links/']").first().attr("href");

        if (!dlPageUrl) return reply("❌ Download links abhi available nahi hain.");

        const { data: dlPage } = await axios.get(dlPageUrl, { headers: HEADERS });
        const $d = cheerio.load(dlPage);
        
        // Sabse pehla download button dhoondna
        const finalBtn = $d(".download-section a.download-btn").first().attr("href");

        if (!finalBtn) return reply("❌ Direct link nahi mil paya.");

        // Step 3: Send Movie as Document
        await reply(`🚀 *Found:* ${movieTitle}\n📦 *Status:* Sending file...`);

        await conn.sendMessage(from, {
            document: { url: finalBtn },
            mimetype: "video/mp4",
            fileName: `${movieTitle}.mp4`,
            caption: `✅ *${movieTitle}* Downloaded Successfully!\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN*`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (err) {
        console.error(err);
        reply("❌ Error: File size bahut badi ho sakti hai ya link expire ho gaya hai.");
    }
});
                                                                            
