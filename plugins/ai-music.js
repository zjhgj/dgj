const { cmd } = require('../command');

cmd({
    pattern: "tiktok",
    alias: ["tt", "ttdl"],
    react: "🎬",
    desc: "Download TikTok videos without watermark (LID Fixed).",
    category: "downloader",
    filename: __filename
},           
async (conn, mek, m, { from, q, reply, fetchJson, prefix }) => {
    try {
        // --- TRUE LID FIX ---
        // Decode JID to handle LID groups and private chats correctly
        const targetChat = conn.decodeJid(from);

        if (!q) {
            return reply(`*Usage:* ${prefix}tiktok <link>\n*Example:* ${prefix}tiktok https://vt.tiktok.com/ZSfEbDw89/`);
        }

        const ttUrl = q.trim();
        if (!/^https?:\/\/(www\.)?(vm\.tiktok\.com|vt\.tiktok\.com|tiktok\.com)\//i.test(ttUrl)) {
            return reply("❌ Invalid TikTok link. Please provide a valid URL.");
        }

        // Send Reaction to decoded JID
        await conn.sendMessage(targetChat, { react: { text: "⏳", key: m.key } });

        const apiUrl = `https://api.elrayyxml.web.id/api/downloader/tiktok?url=${encodeURIComponent(ttUrl)}`;
        const result = await fetchJson(apiUrl);

        if (!result || result.status !== true || !result.result) {
            return reply("❌ Failed to fetch data from TikTok API.");
        }

        const data = result.result;
        const videoUrl = data.data;

        if (!videoUrl || !videoUrl.startsWith("http")) {
            return reply("❌ Video link not found or invalid.");
        }

        const music = data.music_info || {};
        const audioUrl = music.url;

        let captionText = `📥 *TIKTOK DOWNLOADER* 📥\n\n`;
        if (data.title) captionText += `🎬 *Judul:* ${data.title}\n`;
        if (data.author?.fullname) captionText += `👤 *Author:* ${data.author.fullname}\n`;
        if (data.region) captionText += `🌍 *Region:* ${data.region}\n`;
        if (data.duration) captionText += `⏱️ *Durasi:* ${data.duration}\n`;
        captionText += `\n*LID Fix Active - Powered by Knight Bot*`;

        // Sending Video to Decoded JID (Ensures delivery in LID groups)
        await conn.sendMessage(targetChat, {
            video: { url: videoUrl },
            caption: captionText,
            mimetype: "video/mp4"
        }, { quoted: mek });

        // Sending Audio to Decoded JID
        if (audioUrl && audioUrl.startsWith("http")) {
            await conn.sendMessage(targetChat, {
                audio: { url: audioUrl },
                mimetype: "audio/mpeg",
                fileName: `${data.title || "tiktok"}.mp3`
            }, { quoted: mek });
        } else {
            await reply("⚠️ Audio could not be found for this video.");
        }

        await conn.sendMessage(targetChat, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.error("TikTok Error:", e);
        reply("❌ An error occurred while processing the TikTok video. Please try again later.");
    }
});

            
