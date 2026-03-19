const { cmd } = require('../command');
const axios = require('axios');
const cheerio = require('cheerio');

// --- IG SCRAPER LOGIC ---
const igDown = {
    generateIP: () => {
        const octet = () => Math.floor(Math.random() * 256);
        return `${octet()}.${octet()}.${octet()}.${octet()}`;
    },
    download: async (url) => {
        try {
            const randomIP = igDown.generateIP();
            const client = axios.create({
                baseURL: 'https://indown.io',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'x-forwarded-for': randomIP
                }
            });

            const getHome = await client.get('/');
            const $ = cheerio.load(getHome.data);
            const token = $('input[name="_token"]').val();
            const cookies = getHome.headers['set-cookie']?.join('; ');

            const params = new URLSearchParams();
            params.append('link', url);
            params.append('_token', token);

            const { data: resHtml } = await client.post('/download', params, {
                headers: { 'Cookie': cookies, 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const $res = cheerio.load(resHtml);
            const media = [];

            // Video check
            $res('video source').each((i, el) => {
                const src = $(el).attr('src');
                if (src) media.push({ type: 'video', url: src });
            });

            // Image check (if no video)
            if (media.length === 0) {
                $res('div.container.mt-4 img').each((i, el) => {
                    const src = $(el).attr('src');
                    if (src && !src.includes('logo')) media.push({ type: 'image', url: src });
                });
            }
            return media;
        } catch (e) {
            return [];
        }
    }
};

// --- BOT COMMAND ---
cmd({
    pattern: "ig",
    alias: ["insta", "instagram", "igdl"],
    category: "downloader",
    react: "📸",
    desc: "Download Instagram Reels/Posts"
}, async (conn, mek, m, { q, reply, react, botFooter }) => {
    if (!q) return reply("Bhai, Instagram link toh dein! \nExample: .ig https://www.instagram.com/reel/xxx");
    if (!q.includes("instagram.com")) return reply("❌ Link valid nahi hai.");

    try {
        await react("⏳");
        const results = await igDown.download(q);

        if (results.length === 0) {
            await react("❌");
            return reply("Media nahi mil saka. Shayad account private hai ya link expired.");
        }

        await react("📥");

        for (let item of results) {
            if (item.type === 'video') {
                await conn.sendMessage(m.chat, { 
                    video: { url: item.url }, 
                    caption: `✅ *Instagram Video Downloaded*\n\n> *${botFooter}*` 
                }, { quoted: m });
            } else {
                await conn.sendMessage(m.chat, { 
                    image: { url: item.url }, 
                    caption: `✅ *Instagram Image Downloaded*\n\n> *${botFooter}*` 
                }, { quoted: m });
            }
        }
        await react("✅");

    } catch (err) {
        console.error(err);
        await react("❌");
        reply("Acha khasa error aa gaya! Thori der baad try karein.");
    }
});
