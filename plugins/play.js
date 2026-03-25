const { cmd } = require('../command');
const axios = require('axios');
const yts = require("yt-search");

cmd({
    pattern: "play7",
    alias: ["song7", "ytplay7"],
    category: "downloader",
    react: "🎶",
    desc: "Search and download YouTube audio"
}, async (conn, mek, m, { q, reply, react, botFooter }) => {
    
    if (!q) return reply("Bhai, gaane ka naam toh likhein!");

    await react("⏳");

    try {
        // 1. Search Logic
        const search = await yts(q);
        const vid = search.videos[0];
        if (!vid) {
            await react("❌");
            return reply("❌ Gaana nahi mila!");
        }

        // 2. Updated API URL (Fixed Path)
        // Note: 'mp3' ko 'type' parameter mein rakha hai
        const apiUrl = `https://www.neoapis.xyz/api/downloader/ytdl?url=${encodeURIComponent(vid.url)}&type=mp3`;
        
        const { data } = await axios.get(apiUrl, { timeout: 30000 });

        // Check if data is coming
        if (!data || !data.result || !data.result.url) {
            await react("❌");
            return reply("❌ API se link nahi mil saka. Shayad server down hai.");
        }

        const audioUrl = data.result.url;

        // 3. Sending Info + Thumbnail
        let caption = `*🎵 PLAY MUSIC*

*📌 Title:* ${vid.title}
*⌚ Duration:* ${vid.timestamp}
*👤 Channel:* ${vid.author.name}
*🔗 URL:* ${vid.url}

> *${botFooter || 'DR KAMRAN-MD'}*`;

        await conn.sendMessage(m.chat, { 
            image: { url: vid.thumbnail }, 
            caption: caption 
        }, { quoted: mek });

        // 4. Sending Audio
        await conn.sendMessage(m.chat, { 
            audio: { url: audioUrl }, 
            mimetype: 'audio/mpeg',
            fileName: `${vid.title}.mp3`
        }, { quoted: mek });

        await react("✅");

    } catch (e) {
        console.error("Play Error:", e.message);
        await react("❌");
        // User ko error dikhana taaki pata chale kya masla hai
        reply(`❌ Masla: API timeout ya network error.`);
    }
});
