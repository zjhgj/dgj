const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "ig",
    alias: ["instagram", "igdl"],
    desc: "Download Instagram Reels/Videos using dr-kamran API.",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❓ *Instagram ka link dein.*\nExample: .ig https://www.instagram.com/reel/xxx/");
        
        // Check if link is Instagram
        if (!q.includes("instagram.com")) return reply("❌ Ye Instagram ka link nahi hai.");

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        // Using Jawad-Tech API
        const apiUrl = `https://jawad-tech.vercel.app/downloader?url=${encodeURIComponent(q)}`;
        const response = await axios.get(apiUrl);
        
        const data = response.data;

        // API checks based on response structure
        if (!data || !data.result || data.result.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
            return reply("❌ *Media nahi mil saka.* Link private ho sakta hai ya API down hai.");
        }

        const results = data.result;

        // Loop through results (for multiple slides/carousel)
        for (let item of results) {
            const mediaUrl = item.url;
            
            // Checking if it's video or image (usually .mp4 for videos)
            if (mediaUrl.includes(".mp4") || mediaUrl.includes("video")) {
                await conn.sendMessage(from, { 
                    video: { url: mediaUrl }, 
                    caption: "✅ *Instagram Video Downloaded by Knight Bot*",
                    mimetype: 'video/mp4'
                }, { quoted: m });
            } else {
                await conn.sendMessage(from, { 
                    image: { url: mediaUrl },
                    caption: "✅ *Instagram Image Downloaded*"
                }, { quoted: m });
            }
        }

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.error("IGDL Error:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
        reply("❌ *Error:* Download karne mein masla hua. Link check karein.");
    }
});

