const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "fb2",
    alias: ["facebook2", "fbdl2"],
    react: "🔵",
    desc: "Download Facebook Videos/Reels.",
    category: "download",
    use: ".fb <link>",
    filename: __filename
},           
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("⚠️ *KAMRAN-MD:* Please provide a valid Facebook video link.");
        
        // Basic Link Validation
        if (!q.includes("facebook.com") && !q.includes("fb.watch") && !q.includes("fb.com")) {
            return reply("❌ *KAMRAN-MD:* Invalid link. Please provide a real Facebook URL.");
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        // API Call
        const apiUrl = `https://drkamran.vercel.app/api/download/facebook?url=${encodeURIComponent(q)}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        // Check for result existence
        if (!data || !data.status || !data.result) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply("🚫 *API ERROR:* Failed to fetch media. The video might be private, deleted, or the API is down.");
        }

        const res = data.result;
        // API response sometimes gives 'hd'/'sd' or 'url'
        const videoUrl = res.hd || res.sd || res.url || (Array.isArray(res) ? res[0].url : null);
        
        if (!videoUrl) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply("❌ *KAMRAN-MD:* Could not find a valid video stream in the API response.");
        }

        const caption = `✨ *𝐅𝐀𝐂𝐄𝐁𝐎𝐎𝐊 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐑* ✨\n\n` +
                        `📝 *ᴛɪᴛʟᴇ:* ${res.title || 'Facebook Video'}\n` +
                        `🛰️ *ꜱᴛᴀᴛᴜꜱ:* Success\n` +
                        `👤 *ᴅᴏᴡɴʟᴏᴀᴅᴇᴅ ʙʏ:* KAMRAN-MD\n\n` +
                        `> ✅ Transmitted Successfully`;

        // Sending Video
        await conn.sendMessage(from, { 
            video: { url: videoUrl }, 
            caption: caption 
        }, { quoted: m });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (e) {
        console.error("FB Download Error:", e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply("❌ *KAMRAN-MD SYSTEM ERROR:* " + (e.response?.data?.message || e.message));
    }
});
