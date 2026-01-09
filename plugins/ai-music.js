const { cmd } = require('../command');
const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scraper function for SaveTik
 */
async function tiktokScraper(url) {
    try {
        const r = await axios.post(
            'https://savetik.co/api/ajaxSearch',
            new URLSearchParams({ q: url, lang: 'id' }).toString(),
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10)',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest',
                    origin: 'https://savetik.co',
                    referer: 'https://savetik.co/id1'
                }
            }
        );
        const $ = cheerio.load(r.data.data);
        return {
            title: $('h3').first().text().trim() || 'TikTok Media',
            thumbnail: $('.image-tik img').attr('src') || $('.thumbnail img').attr('src') || null,
            mp4: $('.dl-action a:contains("MP4")').not(':contains("HD")').attr('href') || null,
            mp4_hd: $('.dl-action a:contains("HD")').attr('href') || null,
            mp3: $('.dl-action a:contains("MP3")').attr('href') || null,
            foto: $('.photo-list a[href*="snapcdn"]').map((_, e) => $(e).attr('href')).get()
        };
    } catch (e) {
        return { status: 'error', msg: e.message };
    }
}

cmd({
    pattern: "tiktok",
    alias: ["tt", "ttdl", "savetik"],
    react: "📥",
    desc: "Download TikTok videos or photos (LID Fixed).",
    category: "downloader",
    filename: __filename
},           
async (conn, mek, m, { from, q, reply, prefix }) => {
    try {
        if (!q) return reply(`*Usage:* ${prefix}tiktok <link>\n*Example:* ${prefix}tiktok https://vt.tiktok.com/ZSfEbDw89/`);

        // --- TRUE LID FIX ---
        const targetChat = conn.decodeJid(from);

        await conn.sendMessage(targetChat, { react: { text: "⏳", key: m.key } });

        const data = await tiktokScraper(q.trim());

        if (data.status === 'error' || (!data.mp4 && data.foto.length === 0)) {
            return reply("❌ Failed to fetch TikTok media. Make sure the link is valid and public.");
        }

        let caption = `🎬 *TIKTOK DOWNLOADER* 🎬\n\n📌 *Title:* ${data.title}\n\n*LID Fix Active - KAMRAN MD*`;

        // 1. Handle Photos (SlideShow)
        if (data.foto && data.foto.length > 0) {
            reply(`📸 Detecting ${data.foto.length} photos. Sending slide...`);
            for (let img of data.foto) {
                await conn.sendMessage(targetChat, { image: { url: img } }, { quoted: mek });
            }
        } 
        // 2. Handle Video
        else if (data.mp4 || data.mp4_hd) {
            const videoLink = data.mp4_hd || data.mp4;
            await conn.sendMessage(targetChat, {
                video: { url: videoLink },
                caption: caption,
                mimetype: "video/mp4"
            }, { quoted: mek });
        }

        // 3. Handle Audio (Optional but recommended)
        if (data.mp3) {
            await conn.sendMessage(targetChat, {
                audio: { url: data.mp3 },
                mimetype: "audio/mpeg",
                fileName: `${data.title}.mp3`
            }, { quoted: mek });
        }

        await conn.sendMessage(targetChat, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.error("TikTok Error:", e);
        reply("❌ An unexpected error occurred.");
    }
});
