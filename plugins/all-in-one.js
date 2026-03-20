const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "dl",
    alias: ["download", "ig2", "fb2", "tiktok3", "tiktok2"],
    desc: "Download All Social Media Videos/Images.",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❓ *Please provide a link.*");
        
        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        const apiUrl = `https://jawad-tech.vercel.app/downloader?url=${encodeURIComponent(q)}`;
        const response = await axios.get(apiUrl);
        
        const data = response.data.result || response.data.data || response.data;
        
        if (!data) throw new Error("No data received");

        const mediaList = Array.isArray(data) ? data : (typeof data === 'object' ? [data] : [data]);

        for (let item of mediaList) {
            let downloadUrl = typeof item === 'string' ? item : (item.url || item.downloadUrl || item.link || item.hd || item.nowm || item.sd);
            
            if (!downloadUrl) continue;

            // Check if it's a video based on extension or common indicators
            const isVideo = downloadUrl.includes(".mp4") || downloadUrl.includes("video") || (item.type && item.type.includes("video"));

            if (isVideo) {
                await conn.sendMessage(from, { 
                    video: { url: downloadUrl }, 
                    caption: "> ✅ *Video Downloaded Successfully*",
                    mimetype: 'video/mp4',
                    fileName: `video.mp4` // Extra stability
                }, { quoted: m });
            } else {
                await conn.sendMessage(from, { 
                    image: { url: downloadUrl },
                    caption: "> ✅ *Image Downloaded Successfully*"
                }, { quoted: m });
            }
        }

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
        reply("❌ *Error:* Video fetch nahi ho saki. Link check karein ya API badlein.");
    }
});
