const { cmd } = require('../command');
const axios = require('axios');

/**
 * AIO Downloader Function
 */
async function aioDownload(url) {
    try {
        const res = await axios.get(
            `https://kyzoymd-downloader.vercel.app/api/download?url=${encodeURIComponent(url)}`
        );
        return res.data;
    } catch (e) {
        console.error("API Error:", e);
        return { success: false };
    }
}

cmd({
    pattern: "aio",
    alias: ["download", "alldl"],
    react: "📥",
    desc: "All-in-One Downloader (FB, IG, TikTok, etc.)",
    category: "download",
    use: ".aio <link>",
    filename: __filename
}, async (conn, mek, m, { from, reply, q, usedPrefix, command }) => {
    try {
        if (!q) return reply(`❌ Please provide a link!\nExample: .aio https://tiktok.com/...`);

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        const data = await aioDownload(q);
        if (!data.success) return reply("❌ Download failed! Link invalid ya API down ho sakti hai.");

        const results = data.results || [];
        if (!results.length) return reply("❌ Media nahi mila!");

        for (let r of results) {
            let videoUrl = r.hd_url || r.download_url;
            let audioUrl = r.music;
            let thumb = r.thumbnail;

            let caption = `📥 *AIO DOWNLOADER*\n\n`;
            caption += `🌐 *Platform:* ${data.platform || "Universal"}\n`;
            caption += `📌 *Title:* ${r.title || "-"}\n`;
            caption += `⏱ *Duration:* ${r.duration || "-"} sec\n\n`;
            caption += `> © KAMRAN-MD ❤️`;

            // 1. Send Video if available
            if (videoUrl) {
                await conn.sendMessage(from, {
                    video: { url: videoUrl },
                    mimetype: "video/mp4",
                    caption: caption
                }, { quoted: mek });
            }

            // 2. Send Audio/Music if available
            if (audioUrl) {
                // Music ko Audio file ke taur par
                await conn.sendMessage(from, {
                    audio: { url: audioUrl },
                    mimetype: "audio/mpeg",
                    fileName: "music.mp3"
                }, { quoted: mek });

                // Music ko Voice Note (PTT) ke taur par (Optional
                                       
