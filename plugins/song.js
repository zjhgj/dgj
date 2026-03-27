const { cmd } = require('../command');
const axios = require('axios');
const yts = require("yt-search");

cmd({
    pattern: "play",
    alias: ["song", "ytmp3"],
    category: "downloader",
    react: "🎶",
    desc: "Download YouTube audio via NazirGanz API"
}, async (conn, mek, m, { q, reply, react, botFooter }) => {
    
    if (!q) return reply("Bhai, gaane ka naam ya link toh dein!");

    await react("⏳");

    try {
        // 1. Search if it's text, otherwise use link
        let url = q;
        let title = "Audio";
        let thumb = "";

        if (!q.includes("youtube.com") && !q.includes("youtu.be")) {
            const search = await yts(q);
            const vid = search.videos[0];
            if (!vid) return reply("❌ Gaana nahi mila!");
            url = vid.url;
            title = vid.title;
            thumb = vid.thumbnail;
        }

        // 2. API Call (NazirGanz)
        const apiUrl = `https://api.nazirganz.space/api/dl/youtube?url=${encodeURIComponent(url)}&type=mp3`;
        const { data } = await axios.get(apiUrl, { timeout: 45000 });

        // API Response Check (Aksar data.result ya data.url mein link hota hai)
        const downloadUrl = data.result || data.url || (data.data && data.data.url);

        if (!downloadUrl) {
            await react("❌");
            return reply("❌ Download link nahi mil saka. API shayad down hai.");
        }

        // 3. Sending Audio Info
        const info = `*🎵 YOUTUBE DOWNLOADER*

📝 *Title:* ${title}
🔗 *Source:* ${url}

> *${botFooter || 'DR KAMRAN-MD'}*`.trim();

        if (thumb) {
            await conn.sendMessage(m.chat, { image: { url: thumb }, caption: info }, { quoted: mek });
        }

        // 4. Sending Audio File
        await conn.sendMessage(m.chat, { 
            audio: { url: downloadUrl }, 
            mimetype: 'audio/mpeg',
            fileName: `${title}.mp3`
        }, { quoted: mek });

        await react("✅");

    } catch (e) {
        console.error("YTMP3 Error:", e.message);
        await react("❌");
        reply(`❌ Masla: API ne reply nahi diya.`);
    }
});
