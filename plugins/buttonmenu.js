//---------------------------------------------------------------------------
//           KAMRAN-MD - ALL-IN-ONE (AIO) DOWNLOADER
//---------------------------------------------------------------------------
//  🚀 DOWNLOAD FROM FB, IG, TIKTOK, TWITTER, YT VIA NEXRAY API
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "aio",
    alias: ["dl", "download", "get"],
    desc: "Download video from various platforms (FB, IG, TikTok, YT, etc.)",
    category: "download",
    use: ".aio <url>",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    try {
        if (!q) return reply(`✨ *AIO Downloader* ✨\n\nUsage: \`${prefix + command} <url>\`\n\nSupport: TikTok, Instagram, Facebook, Twitter, YouTube.`);

        // 1. React with loading
        await conn.sendMessage(from, { react: { text: "📥", key: mek.key } });

        // 2. Fetch data from Nexray AIO API
        const apiUrl = `https://api.nexray.web.id/downloader/aio?url=${encodeURIComponent(q)}`;
        
        const response = await axios.get(apiUrl);
        const res = response.data;

        // Check if API returned success
        if (!res || !res.status || !res.result) {
            return reply("❌ *Error:* Failed to fetch download link. Make sure the URL is valid and public.");
        }

        const data = res.result;
        
        // Extract info (API results vary by platform, so we handle common fields)
        const title = data.title || "AIO Downloader";
        const downloadUrl = data.url || data.video || data.mp4 || data.nowatermark;
        const thumbnail = data.thumbnail || data.thumb;

        if (!downloadUrl) return reply("❌ *Error:* Could not find a downloadable video link.");

        // 3. Send the Media
        await conn.sendMessage(from, {
            video: { url: downloadUrl },
            caption: `✅ *Download Successful*\n\n📌 *Title:* ${title}\n🔗 *Source:* ${q}\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋᴀᴍʀᴀɴ-ᴍᴅ`,
            contextInfo: {
                externalAdReply: {
                    title: "AIO VIDEO DOWNLOADER",
                    body: title,
                    mediaType: 1,
                    sourceUrl: q,
                    thumbnailUrl: thumbnail,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

        // Final Success Reaction
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("AIO Error:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ *API Error:* ${e.message || "Failed to process the request."}`);
    }
});
