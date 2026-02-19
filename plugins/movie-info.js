const axios = require("axios");
const cheerio = require("cheerio");
const sharp = require("sharp");
const { cmd } = require("../command");

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
};

// ================= SESSION STORAGE =================
if (!global.movieSessions) global.movieSessions = new Map();

// ================= HELPERS =================
async function getThumbnailBuffer(url) {
  try {
    if (!url) return null;
    const { data } = await axios.get(url, { responseType: "arraybuffer", headers: HEADERS });
    return await sharp(data).resize(300, 300).jpeg({ quality: 80 }).toBuffer();
  } catch { return null; }
}

async function getFinalLink(dlPageUrl) {
  try {
    const { data } = await axios.get(dlPageUrl, { headers: HEADERS, maxRedirects: 5 });
    const $ = cheerio.load(data);
    return $("a.button2.download-link").attr("href") || $("a#download").attr("href");
  } catch { return null; }
}

// ================= COMMAND =================
cmd({
    pattern: "film",
    alias: ["movie", "moviebd", "mdbd", "movies"],
    react: "🎬",
    desc: "Search & download movies from MovieDriveBD.",
    category: "downloader",
    filename: __filename
},           
async (conn, mek, m, { q, reply, sender, from }) => {
    try {
        if (!q) return reply("🔎 *Please provide a movie name!*");

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        // ================= SEARCH PHASE =================
        const searchUrl = `https://moviedrivebd.com/?s=${encodeURIComponent(q)}`;
        const { data } = await axios.get(searchUrl, { headers: HEADERS });
        const $ = cheerio.load(data);

        const results = [];
        $("div.result-item").each((i, el) => {
            const title = $(el).find("article > div.details > div.title > a").text().trim();
            const link = $(el).find("article > div.details > div.title > a").attr("href");
            if (link) results.push({ title, link });
        });

        if (!results.length) return reply("❌ No results found!");

        let searchText = `🎬 *MOVIE SEARCH RESULTS*\n\n🔎 *Query:* ${q}\n\n`;
        results.forEach((v, i) => { searchText += `*${i + 1}.* ${v.title}\n`; });
        searchText += `\n✳️ *Reply with number to select movie.*`;

        const sentMsg = await reply(searchText);

        // Save session for this user
        global.movieSessions.set(sender, {
            stage: "search",
            results,
            from: from
        });

        // ================= SESSION HANDLER =================
        // Ye part aapke main bot handler (index.js) mein input catch karne ke liye setup hota hai
        // Lekin yahan main template de raha hoon jo aksar 'upsert' ke through handle hota hai.

    } catch (err) {
        console.error(err);
        reply("❌ Error while searching movie!");
    }
});

// Note: Interactive Reply Logic (Catching numbers 1, 2, 3) 
// Usually placed in your message listener.
      
