const { cmd } = require('../command');
const axios = require('axios');
const cheerio = require('cheerio');

// --- SCRAPER FUNCTIONS ---
async function searchDonghua(search) {
    try {
        const { data: html } = await axios.get("https://donghuafilm.com/", { params: { s: search } });
        const $ = cheerio.load(html);
        let result = [];
        $("article.bs").each((i, v) => {
            const $article = $(v);
            const $link = $article.find('a[itemprop="url"]');
            result.push({
                title: $link.attr("title") || "",
                url: $link.attr("href") || "",
                image: $article.find("img").attr("data-src") || $article.find("img").attr("src") || "",
                status: $article.find(".status, .epx").first().text().trim() || "",
                type: $article.find(".typez").text().trim() || ""
            });
        });
        return result;
    } catch (e) { return []; }
}

async function detailDonghua(url) {
    try {
        const { data: html } = await axios.get(url);
        const $ = cheerio.load(html);
        const description = $(".desc, .info-content .desc, .ninfo .desc").text().trim();
        const details = {
            title: $(".entry-title").text().trim(),
            description: description,
            coverImage: $(".bigcover img").attr("data-src") || $(".bigcover img").attr("src") || "",
            status: $('span:contains("Status:")').next().text().trim(),
            studio: $('span:contains("Studio:") a').text().trim(),
            episodes: []
        };
        $(".eplister li").each((i, v) => {
            details.episodes.push({
                number: $(i).find(".epl-num").text().trim(),
                title: $(v).find(".epl-title").text().trim(),
                url: $(v).find("a").attr("href") || ""
            });
        });
        return details;
    } catch (e) { return null; }
}

// --- COMMAND: SEARCH ---
cmd({
    pattern: "donghua",
    alias: ["dhsearch"],
    react: "🔍",
    desc: "Search for Donghua (Chinese Anime).",
    category: "anime",
    filename: __filename
},           
async (conn, mek, m, { from, q, reply, prefix }) => {
    try {
        if (!q) return reply(`*Usage:* ${prefix}donghua <name>\n*Example:* ${prefix}donghua soul`);
        
        const targetChat = conn.decodeJid(from);
        const results = await searchDonghua(q);

        if (results.length === 0) return reply("❌ No Donghua found with that name.");

        let caption = `🎬 *DONGHUA SEARCH RESULTS* 🎬\n\n`;
        results.forEach((v, i) => {
            caption += `*${i + 1}.* ${v.title}\n📌 *Status:* ${v.status}\n🔗 *Link:* ${v.url}\n\n`;
        });
        caption += `*LID Fix Active - Knight Bot*`;

        await conn.sendMessage(targetChat, { 
            image: { url: results[0].image }, 
            caption: caption 
        }, { quoted: mek });

    } catch (e) { reply("❌ Error searching Donghua."); }
});

// --- COMMAND: DETAIL ---
cmd({
    pattern: "dhdetail",
    alias: ["donghuainfo"],
    react: "ℹ️",
    desc: "Get detailed info of a Donghua via URL.",
    category: "anime",
    filename: __filename
},           
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q || !q.startsWith("http")) return reply("⚠️ Please provide a valid Donghua Film URL.");

        const targetChat = conn.decodeJid(from);
        const data = await detailDonghua(q.trim());

        if (!data) return reply("❌ Failed to fetch details.");

        let caption = `✨ *${data.title}* ✨\n\n` +
                      `📝 *Description:* ${data.description.slice(0, 500)}...\n\n` +
                      `📊 *Status:* ${data.status}\n` +
                      `🎥 *Studio:* ${data.studio}\n` +
                      `🎞️ *Total Episodes Found:* ${data.episodes.length}\n\n` +
                      `*LID Fix Active - Knight Bot*`;

        await conn.sendMessage(targetChat, { 
            image: { url: data.coverImage }, 
            caption: caption 
        }, { quoted: mek });

    } catch (e) { reply("❌ Error fetching Donghua details."); }
});
