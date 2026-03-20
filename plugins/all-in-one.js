const { cmd } = require('../command');
const axios = require('axios');

// ALL VIDEO/MEDIA DOWNLOADER (Instagram, FB, TikTok etc.)
cmd({
    pattern: "dl",
    alias: ["download", "ig2", "fb2", "tiktok2"],
    desc: "Download All Social Media Videos/Images.",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❓ *Please provide a link.* (e.g. .dl [link])");
        
        // React with loading
        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        // API Request
        const apiUrl = `https://jawad-tech.vercel.app/downloader?url=${encodeURIComponent(q)}`;
        const response = await axios.get(apiUrl);
        
        // Data Extraction logic
        const data = response.data.result || response.data.data || response.data;
        
        if (!data) throw new Error("No data received");

        // Media ko array mein convert karna agar single object ho
        const mediaList = Array.isArray(data) ? data : (typeof data === 'object' ? [data] : [data]);

        for (let item of mediaList) {
            // URL nikalne ki koshish (different API formats ke liye)
            let downloadUrl = typeof item === 'string' ? item : (item.url || item.downloadUrl || item.link || item.hd || item.sd);
            
            if (!downloadUrl) continue;

            // Media type check (Video vs Image)
            const isVideo = downloadUrl.toLowerCase().match(/\.(mp4|mkv|mov|avi)/) || item.type === 'video';

            if (isVideo) {
                await conn.sendMessage(from, { 
                    video: { url: downloadUrl }, 
                    caption: "✅ *Video Downloaded*",
                    mimetype: 'video/mp4'
                }, { quoted: m });
            } else {
                await conn.sendMessage(from, { 
                    image: { url: downloadUrl },
                    caption: "✅ *Image Downloaded*"
                }, { quoted: m });
            }
        }

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
        reply("❌ *Error:* Link private hai ya API temporarily down hai.");
    }
});
