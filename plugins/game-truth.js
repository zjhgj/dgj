const { cmd } = require("../command");
const axios = require("axios");

cmd({
    pattern: "aio2",
    alias: ["download", "apoc"],
    react: "📥",
    desc: "Multi-functional downloader using Apocalypse API.",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    try {
        // Step 1: Input Check
        if (!q) return reply(`❓ *Example:* ${prefix + command} https://tiktok.com/video/12345`);

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        // Step 2: API Request 
        const apiUrl = `https://api.apocalypse.web.id/download/aio?url=${encodeURIComponent(q)}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        // Step 3: Validation
        if (!data || !data.status || !data.result) {
            await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
            return reply("❌ *KAMRAN-MD Error:* Media could not be fetched. Make sure the link is valid.");
        }

        const res = data.result;
        let caption = `📥 *KAMRAN-MD DOWNLOADER*\n\n`;
        caption += `📌 *Title:* ${res.title || "No Title"}\n`;
        caption += `🌐 *Source:* ${q}\n\n`;
        caption += `> © ᴋᴀᴍʀᴀɴ-ᴍᴅ ᴘʀᴏᴛᴇᴄᴛɪᴏɴ`;

        // Step 4: Media Sending Logic
        // Apocalypse API aksar 'url' ya 'media' fields mein data deti hai
        const mediaUrl = res.url || res.download || res.media;

        if (mediaUrl) {
            // Check if it's a video or image based on link or API response
            const isVideo = mediaUrl.includes(".mp4") || res.type === "video";
            
            if (isVideo) {
                await conn.sendMessage(from, {
                    video: { url: mediaUrl },
                    mimetype: "video/mp4",
                    caption: caption
                }, { quoted: m });
            } else {
                await conn.sendMessage(from, {
                    image: { url: mediaUrl },
                    caption: caption
                }, { quoted: m });
            }
        } else {
            return reply("❌ *Error:* No downloadable media found in API response.");
        }

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.error("New AIO Error:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
        reply(`⚠️ *KAMRAN-MD Error:* ${e.message}`);
    }
});
                               
