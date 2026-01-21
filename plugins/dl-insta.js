const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "insta",
    alias: ["ig", "instagram", "igdl"],
    react: "📸",
    desc: "Download Instagram Reels, Videos, or Images.",
    category: "download",
    use: ".insta <link>",
    filename: __filename
},           
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("⚠️ *KAMRAN-MD:* Please provide a valid Instagram link.");
        if (!q.includes("instagram.com")) return reply("❌ *KAMRAN-MD:* Invalid link. Please provide a real Instagram URL.");

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        // API Call to your specific endpoint
        const apiUrl = `https://drkamran.vercel.app/api/download/instagram?url=${encodeURIComponent(q)}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (!data || !data.status) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply("🚫 *API ERROR:* Failed to fetch media from Instagram. Maybe the post is private or link is broken.");
        }

        // Checking if it's a single file or multiple (handling array or single result)
        const result = data.result;
        const mediaUrl = Array.isArray(result) ? result[0].url : result.url;
        const caption = `✨ *𝐈𝐍𝐒𝐓𝐀𝐆𝐑𝐀𝐌 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐑* ✨\n\n` +
                        `🛰️ *ꜱᴛᴀᴛᴜꜱ:* Success\n` +
                        `👤 *ᴅᴏᴡɴʟᴏᴀᴅᴇᴅ ʙʏ:* KAMRAN-MD\n\n` +
                        `> ✅ Transmitted Successfully`;

        // Detecting if it's a video or image
        const isVideo = mediaUrl.includes(".mp4") || (Array.isArray(result) && result[0].type === 'video');

        if (isVideo) {
            await conn.sendMessage(from, { 
                video: { url: mediaUrl }, 
                caption: caption 
            }, { quoted: m });
        } else {
            await conn.sendMessage(from, { 
                image: { url: mediaUrl }, 
                caption: caption 
            }, { quoted: m });
        }

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (e) {
        console.error("Insta Download Error:", e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply("❌ *KAMRAN-MD SYSTEM ERROR:* " + e.message);
    }
});
