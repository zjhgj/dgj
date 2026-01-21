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

        if (!data || !data.status || !data.result) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply("🚫 *API ERROR:* Failed to fetch media. Make sure the post is public.");
        }

        const results = Array.isArray(data.result) ? data.result : [data.result];

        for (let item of results) {
            const mediaUrl = item.url;
            const isVideo = item.type === 'video' || mediaUrl.includes(".mp4");

            const caption = `✨ *𝐈𝐍𝐒𝐓𝐀𝐆𝐑𝐀𝐌 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐑* ✨\n\n` +
                            `🛰️ *ꜱᴛᴀᴛᴜꜱ:* Success\n` +
                            `👤 *ᴅᴏᴡɴʟᴏᴀᴅᴇᴅ ʙʏ:* KAMRAN-MD\n\n` +
                            `> ✅ Transmitted Successfully`;

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
        }

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (e) {
        console.error("Insta Download Error:", e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply("❌ *KAMRAN-MD SYSTEM ERROR:* " + e.message);
    }
});
