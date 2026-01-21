const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "fb",
    alias: ["facebook", "fbdl"],
    react: "🔵",
    desc: "Download Facebook Videos/Reels.",
    category: "download",
    use: ".fb <link>",
    filename: __filename
},           
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("⚠️ *KAMRAN-MD:* Please provide a valid Facebook video link.");
        if (!q.includes("facebook.com") && !q.includes("fb.watch")) {
            return reply("❌ *KAMRAN-MD:* Invalid link. Please provide a real Facebook URL.");
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        // API Call to your specific endpoint
        const apiUrl = `https://drkamran.vercel.app/api/download/facebook?url=${encodeURIComponent(q)}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (!data || !data.status || !data.result) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply("🚫 *API ERROR:* Failed to fetch media from Facebook. Make sure the video is public.");
        }

        const result = data.result;
        
        // Priority: HD quality, then SD
        const videoUrl = result.hd || result.sd;
        
        if (!videoUrl) {
            return reply("❌ *KAMRAN-MD:* Could not find a downloadable video URL.");
        }

        const caption = `✨ *𝐅𝐀𝐂𝐄𝐁𝐎𝐎𝐊 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐑* ✨\n\n` +
                        `📝 *ᴛɪᴛʟᴇ:* ${result.title || 'FB Video'}\n` +
                        `🛰️ *ꜱᴛᴀᴛᴜꜱ:* Success\n` +
                        `🎥 *ǫᴜᴀʟɪᴛʏ:* ${result.hd ? 'HD' : 'SD'}\n` +
                        `👤 *ᴅᴏᴡɴʟᴏᴀᴅᴇᴅ ʙʏ:* KAMRAN-MD\n\n` +
                        `> ✅ Transmitted Successfully`;

        // Sending the video
        await conn.sendMessage(from, { 
            video: { url: videoUrl }, 
            caption: caption 
        }, { quoted: m });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (e) {
        console.error("FB Download Error:", e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply("❌ *KAMRAN-MD SYSTEM ERROR:* " + e.message);
    }
});
