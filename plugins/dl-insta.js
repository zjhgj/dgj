const { cmd } = require('../command');
const axios = require('axios');

// 1. INSTAGRAM DOWNLOADER FIX
cmd({
    pattern: "ig",
    alias: ["instagram", "igdl"],
    desc: "Download Instagram Media.",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❓ *Instagram link dein.*");
        if (!q.includes("instagram.com")) return reply("❌ Link sahi nahi hai.");

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        const apiUrl = `https://jawad-tech.vercel.app/downloader?url=${encodeURIComponent(q)}`;
        const response = await axios.get(apiUrl);
        
        // Flexible data checking
        let media = response.data.result || response.data.data || response.data;
        
        if (!media || (Array.isArray(media) && media.length === 0)) {
            throw new Error("No media found");
        }

        const results = Array.isArray(media) ? media : [media];

        for (let item of results) {
            let downloadUrl = typeof item === 'string' ? item : (item.url || item.downloadUrl || item.link);
            if (!downloadUrl) continue;

            if (downloadUrl.includes(".mp4") || downloadUrl.includes("video")) {
                await conn.sendMessage(from, { 
                    video: { url: downloadUrl }, 
                    caption: "✅ *Instagram Video*",
                    mimetype: 'video/mp4'
                }, { quoted: m });
            } else {
                await conn.sendMessage(from, { 
                    image: { url: downloadUrl },
                    caption: "✅ *Instagram Image*"
                }, { quoted: m });
            }
        }
        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
        reply("❌ *Error:* API ne data nahi diya ya link private hai.");
    }
});

// 2. PLAYCH COMMAND FIX (Based on your screenshot error)
cmd({
    pattern: "playch",
    desc: "Play song in specific JID/Channel.",
    category: "main",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q || !q.includes("|")) {
            return reply("❌ *Format:* .playch JID | Song Name\n*Example:* .playch 12345@g.us | daku");
        }

        const [jid, ...songPart] = q.split("|");
        const songName = songPart.join("|").trim();
        const targetJid = jid.trim();

        if (!targetJid.includes("@")) return reply("❌ Sahi JID enter karein.");
        if (!songName) return reply("❌ Song ka naam likhein.");

        reply(`⏳ *Processing:* "${songName}" for JID: ${targetJid}...`);
        
        // Yahan aap apna YouTube search aur download logic add karein
        // Phir conn.sendMessage(targetJid, ...) use karein

    } catch (e) {
        reply("❌ Kuch masla hua: " + e.message);
    }
});
