const { cmd } = require('../command'); // Aapke bot ka standard command handler
const axios = require('axios');
const yts = require("yt-search");

cmd({
    pattern: "play7",
    alias: ["ytplay", "song7"],
    category: "downloader",
    react: "🎶",
    desc: "Search and download YouTube audio"
}, async (conn, mek, m, { q, reply, react, botFooter }) => {
    
    if (!q) return reply("Bhai, kisi gaane ka naam ya link toh dein! \nExample: .play tamm tamm");

    await react("⏳");

    try {
        // 1. YouTube Search
        let search = await yts(q);
        let vid = search.videos[0];
        if (!vid) {
            await react("❌");
            return reply("❌ Maaf, gaana nahi mila.");
        }

        let url = vid.url;

        // 2. Fetch Audio via NeoAPI
        let api = `https://www.neoapis.xyz/api/downloader/ytdl?url=${encodeURIComponent(url)}&type=mp3`;
        let { data } = await axios.get(api);

        // API Response check
        if (!data || !data.result) {
            await react("❌");
            return reply("❌ Audio link fetch karne mein masla aa raha hai.");
        }

        let res = data.result;

        let caption = `*🎵 KAMRAN-MD PLAY*

*📌 Title:* ${vid.title}
*⌚ Duration:* ${vid.timestamp}
*👁️ Views:* ${vid.views}
*👤 Channel:* ${vid.author.name}
*🔗 URL:* ${url}

> *${botFooter || 'DR KAMRAN-MD'}*`.trim();

        // 3. Send Thumbnail + Info
        await conn.sendMessage(m.chat, {
            image: { url: vid.thumbnail },
            caption: caption
        }, { quoted: mek });

        // 4. Send Audio File
        await conn.sendMessage(m.chat, {
            audio: { url: res.url }, // NeoAPI usually gives result.url
            mimetype: "audio/mpeg",
            fileName: `${vid.title}.mp3`
        }, { quoted: mek });

        await react("✅");

    } catch (e) {
        console.error("Play Error:", e);
        await react("❌");
        reply("❌ Error: " + e.message);
    }
});
