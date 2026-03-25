const { cmd } = require('../command');
const axios = require('axios');
const yts = require("yt-search");

cmd({
    pattern: "song6",
    alias: ["video6", "yt7", "play7"],
    category: "downloader",
    react: "📥",
    desc: "Search and download YouTube audio/video"
}, async (conn, mek, m, { q, reply, react, botFooter }) => {

    if (!q) return reply("Bhai, kisi gaane ka naam ya link toh dein!");

    await react("⏳");

    try {
        // 1. Search Logic using yt-search
        const search = await yts(q);
        const data = search.videos[0];

        if (!data) {
            await react("❌");
            return reply("❌ Maaf kijiyega, koi result nahi mila.");
        }

        const url = data.url;
        const infoMsg = `*🎬 KAMRAN-MD YT DOWNLOADER*\n\n` +
            `📝 *Title:* ${data.title}\n` +
            `⌚ *Duration:* ${data.timestamp}\n` +
            `👁️ *Views:* ${data.views}\n` +
            `🔗 *Link:* ${url}\n\n` +
            `> *${botFooter}*`;

        // Pehle info aur thumbnail bhejein
        await conn.sendMessage(m.chat, { image: { url: data.thumbnail }, caption: infoMsg }, { quoted: mek });

        // 2. Download Logic using axios & NeoAPI
        // Audio Download
        const audioRes = await axios.get(`https://www.neoapis.xyz/api/downloader/ytdl?url=${encodeURIComponent(url)}&type=mp3`);
        
        if (audioRes.data && audioRes.data.result) {
            await conn.sendMessage(m.chat, { 
                audio: { url: audioRes.data.result.url }, 
                mimetype: 'audio/mpeg',
                fileName: `${data.title}.mp3`
            }, { quoted: mek });
        }

        // Video Download
        const videoRes = await axios.get(`https://www.neoapis.xyz/api/downloader/ytdl?url=${encodeURIComponent(url)}&type=mp4`);
        
        if (videoRes.data && videoRes.data.result) {
            await conn.sendMessage(m.chat, { 
                video: { url: videoRes.data.result.url }, 
                caption: `✅ *${data.title}*\n\n> *${botFooter}*`,
                mimetype: 'video/mp4'
            }, { quoted: mek });
        }

        await react("✅");

    } catch (e) {
        console.error(e);
        await react("❌");
        reply("❌ Masla aa gaya: " + e.message);
    }
});
