const { cmd } = require('../command');
const axios = require('axios');

/**
 * AIO Downloader Core Function
 */
async function aioDownload(url) {
    const res = await axios.get(
        `https://kyzoymd-downloader.vercel.app/api/download?url=${encodeURIComponent(url)}`
    );
    return res.data;
}

cmd({
    pattern: "aio",
    alias: ["dl", "download"],
    react: "📥",
    desc: "All-in-One Downloader (TikTok, FB, IG, YT, etc.)",
    category: "downloader",
    filename: __filename
},           
async (conn, mek, m, { from, q, reply, prefix }) => {
    try {
        if (!q) return reply(`*Usage:* ${prefix}aio <link>\n*Example:* ${prefix}aio https://link_here`);

        // --- TRUE LID FIX ---
        // Decode JID to handle LID groups and private chats correctly
        const targetChat = conn.decodeJid(from);

        await conn.sendMessage(targetChat, { react: { text: "⏳", key: m.key } });
        reply("⏳ *Downloading media...* Please wait.");

        const data = await aioDownload(q.trim());
        if (!data.success) {
            await conn.sendMessage(targetChat, { react: { text: "❌", key: m.key } });
            return reply("❌ *Download failed!* Please check the link or try again later.");
        }

        const results = data.results || [];
        if (!results.length) return reply("❌ *Media not found!*");

        for (let r of results) {
            let videoUrl = r.hd_url || r.download_url;
            let audioUrl = r.music;
            let thumb = r.thumbnail;

            let caption = `📥 *AIO DOWNLOADER PRO* 📥\n\n`;
            caption += `🌐 *Platform:* ${data.platform || "-"}\n`;
            caption += `📌 *Title:* ${r.title || "-"}\n`;
            caption += `⏱️ *Duration:* ${r.duration || "-"} sec\n`;
            caption += `🔗 *Source:* ${data.original_url || q}\n\n`;
            caption += `*LID Fix Active - Knight Bot*`;

            // 1. Send Video to Decoded JID
            if (videoUrl) {
                await conn.sendMessage(targetChat, {
                    video: { url: videoUrl },
                    mimetype: "video/mp4",
                    caption: caption
                }, { quoted: mek });
            }

            // 2. Send Audio to Decoded JID
            if (audioUrl) {
                await conn.sendMessage(targetChat, {
                    audio: { url: audioUrl },
                    mimetype: "audio/mpeg",
                    fileName: `${r.title || "audio"}.mp3`
                }, { quoted: mek });
            }

            // 3. Send Thumbnail (If no video/audio or specifically needed)
            if (thumb && !videoUrl) {
                await conn.sendMessage(targetChat, {
                    image: { url: thumb },
                    caption: "🖼️ *Thumbnail*"
                }, { quoted: mek });
            }
        }

        await conn.sendMessage(targetChat, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.error("AIO Error:", e);
        reply("❌ *Error:* An unexpected error occurred while downloading.");
    }
});

  
