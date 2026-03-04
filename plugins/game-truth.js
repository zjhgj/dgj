const { cmd } = require("../command");
const axios = require("axios");

/**
 * KAMRAN-MD: Core Downloader Logic
 * API Powered by savevideoid
 */
async function aioDownload(url) {
    try {
        const res = await axios.get(
            `https://savevideoid.vercel.app/api/download?url=${encodeURIComponent(url)}`
        );
        return res.data;
    } catch (e) {
        return { success: false };
    }
}

cmd({
    pattern: "aio",
    alias: ["dl", "allvid"],
    react: "📥",
    desc: "All-in-one downloader for FB, IG, TW, TikTok, etc.",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    try {
        // Step 1: Input Validation
        if (!q) return reply(`❓ *Example:* ${prefix + command} https://link-video-anda`);

        // Step 2: Reaction & Initial Message
        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });
        reply("🚀 *KAMRAN-MD:* Processing your request, please wait...");

        // Step 3: Fetch Data from API
        const data = await aioDownload(q);
        if (!data.success || !data.results) {
            await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
            return reply("❌ *Error:* Media not found or link is invalid.");
        }

        const results = data.results || [];
        const platform = data.platform || "Unknown";

        // Step 4: Loop through results and send media
        for (let r of results) {
            let videoUrl = r.hd_url || r.download_url || r.url;
            let audioUrl = r.music || r.audio;
            let thumb = r.thumbnail;

            let caption = `📥 *KAMRAN-MD DOWNLOADER*\n\n`;
            caption += `🌐 *Platform:* ${platform.toUpperCase()}\n`;
            caption += `📌 *Title:* ${r.title || "No Title"}\n`;
            if (r.duration) caption += `⏱ *Duration:* ${r.duration} sec\n`;
            caption += `🔗 *Source:* ${data.original_url}\n\n`;
            caption += `> © ᴋᴀᴍʀᴀɴ-ᴍᴅ ᴘʀᴏᴛᴇᴄᴛɪᴏɴ`;

            // --- SEND VIDEO ---
            if (videoUrl) {
                await conn.sendMessage(from, {
                    video: { url: videoUrl },
                    mimetype: "video/mp4",
                    caption: caption
                }, { quoted: m });
            }

            // --- SEND AUDIO ---
            if (audioUrl) {
                await conn.sendMessage(from, {
                    audio: { url: audioUrl },
                    mimetype: "audio/mpeg",
                    fileName: "kamran_audio.mp3"
                }, { quoted: m });
            }

            // --- SEND THUMBNAIL (Optional) ---
            if (thumb && !videoUrl) {
                await conn.sendMessage(from, {
                    image: { url: thumb },
                    caption: "🖼 *Thumbnail Result*"
                }, { quoted: m });
            }
        }

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.error("AIO DL Error:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
        reply("❌ *KAMRAN-MD Error:* An unexpected error occurred.");
    }
});
        
