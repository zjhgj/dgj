const { cmd } = require('../command');
const axios = require('axios');
const cheerio = require('cheerio');

const baseUrl = 'https://otakudesu.best';
const headers = { 
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' 
};

// --- Helper Scraper Functions ---
const scraper = {
    search: async (query) => {
        const { data } = await axios.get(`${baseUrl}/?s=${query}&post_type=anime`, { headers });
        const $ = cheerio.load(data);
        const result = [];
        $('.chivsrc li').each((i, el) => {
            result.push({
                title: $(el).find('h2 a').text().trim(),
                thumb: $(el).find('img').attr('src'),
                status: $(el).find('.set').next().text().trim(),
                url: $(el).find('h2 a').attr('href')
            });
        });
        return result;
    },
    detail: async (url) => {
        const { data } = await axios.get(url, { headers });
        const $ = cheerio.load(data);
        const info = $('.infozin .infozingle');
        const detail = {
            thumb: $('.fotoanime img').attr('src'),
            title: info.find('p:contains("Judul")').text().split(':')[1]?.trim(),
            score: info.find('p:contains("Skor")').text().split(':')[1]?.trim(),
            status: info.find('p:contains("Status")').text().split(':')[1]?.trim(),
            genre: info.find('p:contains("Genre")').text().split(':')[1]?.trim(),
            sinopsis: $('.sinopc').text().trim(),
            episodes: []
        };
        $('.episodelist ul li').each((i, el) => {
            detail.episodes.push({
                title: $(el).find('a').text().trim(),
                url: $(el).find('a').attr('href')
            });
        });
        return detail;
    },
    episode: async (url) => {
        const { data } = await axios.get(url, { headers });
        const $ = cheerio.load(data);
        const download = [];
        $('.download ul li').each((i, el) => {
            const res = $(el).find('strong').text().trim();
            const links = [];
            $(el).find('a').each((j, link) => {
                links.push($(link).text().trim() + ": " + $(link).attr('href'));
            });
            download.push(`*${res}*:\n${links.join('\n')}`);
        });
        return {
            title: $('.venser h1').text().trim(),
            downloads: download.join('\n\n')
        };
    }
};

// --- Commands ---

// 1. Search Anime
cmd({
    pattern: "otaku",
    alias: ["anime", "otakusearch"],
    category: "anime",
    desc: "Search anime on Otakudesu",
    react: "🔍",
    filename: __filename
}, async (conn, mek, m, { q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide an anime name to search.");
        const results = await scraper.search(q);
        if (results.length === 0) return reply("❌ No results found.");

        let txt = `⛩️ *Otakudesu Search Results* ⛩️\n\n`;
        results.forEach((anime, i) => {
            txt += `*${i + 1}.* ${anime.title}\nStatus: ${anime.status}\nURL: ${anime.url}\n\n`;
        });
        txt += `_Use .otaku-det <url> to see details._`;
        reply(txt);
    } catch (e) {
        reply("❌ Error: " + e.message);
    }
});

// 2. Anime Details
cmd({
    pattern: "otaku-det",
    alias: ["animedet"],
    category: "anime",
    desc: "Get anime details and episode list",
    react: "📜",
    filename: __filename
}, async (conn, mek, m, { q, reply }) => {
    try {
        if (!q || !q.includes('otakudesu')) return reply("❌ Please provide a valid Otakudesu anime URL.");
        const det = await scraper.detail(q);

        let txt = `🎬 *${det.title}*\n\n`;
        txt += `⭐ *Score:* ${det.score}\n`;
        txt += `📌 *Status:* ${det.status}\n`;
        txt += `🎭 *Genre:* ${det.genre}\n\n`;
        txt += `📖 *Synopsis:* ${det.sinopsis.substring(0, 500)}...\n\n`;
        txt += `📺 *Episodes:*\n`;
        det.episodes.forEach((ep, i) => {
            txt += `${i + 1}. ${ep.title}\nLink: ${ep.url}\n\n`;
        });
        
        await conn.sendMessage(m.chat, { image: { url: det.thumb }, caption: txt }, { quoted: mek });
    } catch (e) {
        reply("❌ Error: " + e.message);
    }
});

// 3. Episode Download Links
cmd({
    pattern: "otaku-ep",
    alias: ["anime-dl"],
    category: "anime",
    desc: "Get anime download links for an episode",
    react: "📥",
    filename: __filename
}, async (conn, mek, m, { q, reply }) => {
    try {
        if (!q || !q.includes('otakudesu')) return reply("❌ Please provide a valid episode URL.");
        const ep = await scraper.episode(q);

        let txt = `📥 *Download Links: ${ep.title}*\n\n`;
        txt += ep.downloads;
        reply(txt);
    } catch (e) {
        reply("❌ Error: " + e.message);
    }
});
