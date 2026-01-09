//---------------------------------------------------------------------------
//           KAMRAN-MD - TIKTOK DOWNLOADER (VIDEO & AUDIO)
//---------------------------------------------------------------------------
//  🚀 DOWNLOAD TIKTOK VIDEOS NO WATERMARK & MP3
//  Credit: Fauzialifatah (API)
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "tiktok2",
    alias: ["tt", "ttdl"],
    desc: "Download TikTok videos without watermark and get audio.",
    category: "download",
    use: ".tiktok <url>",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply, react, prefix, command }) => {
    try {
        if (!q) return reply(`📥 *TikTok Downloader* ✨\n\nUsage: \`${prefix + command} <tiktok_url>\`\nExample: \`${prefix + command} https://vt.tiktok.com/ZSfEbDw89/\``);

        // 1. Validate URL
        if (!/^https?:\/\/(www\.)?(vm\.tiktok\.com|vt\.tiktok\.com|tiktok\.com)\//i.test(q.trim())) {
            return reply("❌ Link tidak valid. Pastikan itu link TikTok yang benar.");
        }

        await react("🎬");

        // 2. Fetch Data from API
        const apiUrl = `https://api.elrayyxml.web.id/api/downloader/tiktok?url=${encodeURIComponent(q.trim())}`;
        const response = await axios.get(apiUrl);
        const result = response.data;

        if (!result || result.status !== true || !result.result) {
            return reply("❌ Gagal mengambil data dari API TikTok. Coba lagi nanti.");
        }

        const data = result.result;
        const videoUrl = data.data; // Watermark-free video
        const music = data.music_info || {};
        const audioUrl = music.url;

        if (!videoUrl) return reply("❌ Link video tidak ditemukan.");

        // 3. Prepare Caption
        let captionText = `📥 *TIKTOK DOWNLOADER*\n\n`;
        if (data.title) captionText += `🎬 *Judul:* ${data.title}\n`;
        if (data.author && data.author.fullname) captionText += `👤 *Author:* ${data.author.fullname}\n`;
        if (data.region) captionText += `🌍 *Region:* ${data.region}\n`;
        if (data.duration) captionText += `⏱ *Durasi:* ${data.duration}\n`;
        captionText += `\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋᴀᴍʀᴀɴ-ᴍᴅ`;

        // 4. Send Video
        await conn.sendMessage(from, {
            video: { url: videoUrl },
            caption: captionText,
            contextInfo: {
                externalAdReply: {
                    title: "TIKTOK DOWNLOADER",
                    body: data.title || "KAMRAN-MD DOWNLOADER",
                    mediaType: 1,
                    sourceUrl: q,
                    thumbnailUrl: data.cover || "",
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

        // 5. Send Audio (Optional if exists)
        if (audioUrl && audioUrl.startsWith("http")) {
            await conn.sendMessage(from, { 
                audio: { url: audioUrl }, 
                mimetype: "audio/mpeg", 
                ptt: false 
            }, { quoted: mek });
        }

        await react("✅");

    } catch (e) {
        console.error("TikTok Error:", e);
        await react("❌");
        reply("❌ Terjadi kesalahan saat memproses TikTok. Pastikan API sedang aktif.");
    }
});
