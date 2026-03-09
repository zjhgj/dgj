const { cmd } = require("../command");
const axios = require("axios");
const yts = require('yt-search');

cmd({
    pattern: "ytmp3",
    alias: ["audio", "song"],
    react: "🎶",
    desc: "Download YouTube Audio via Arslan API.",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    try {
        if (!q || !q.includes("http")) {
            return reply(`❓ *Example:* \n${prefix + command} https://youtu.be/0geqOYqwL0s`);
        }

        const url = q.trim();
        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        // API URL updated based on your working link
        const apiUrl = `https://arslan-apis.vercel.app/download/ytmp3?url=${encodeURIComponent(url)}`;
        const res = await axios.get(apiUrl);
        const data = res.data;

        // Validating working response format
        if (!data || !data.status || !data.result || !data.result.status) {
            return reply("❌ *Error:* Data audio tidak ditemukan atau API expired.");
        }

        const metadata = data.result.metadata;
        const downloadUrl = data.result.download.url;

        // --- Stylish Caption ---
        const caption = `
╭━━━━━━━〔 𝐘𝐓 𝐌𝐏𝟑 𝐃𝐋 〕━━━━━━━┈⊷
┃
┃ 🎵 *𝗧𝗶𝘁𝗹𝗲:* ${metadata.title}
┃ 🕒 *𝗗𝘂𝗿𝗮𝘁𝗶𝗼𝗻:* ${metadata.duration} seconds
┃ 🔗 *𝗧𝘆𝗽𝗲:* ${metadata.type}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━┈⊷
⚡ *Audio sedang dikirim...*

> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋᴀᴍʀᴀɴ-ᴍᴅ`;

        // Step 1: Send Info Caption
        await conn.sendMessage(from, { 
            image: { url: 'https://i.ibb.co/video-placeholder.png' }, // Placeholder if thumb missing
            caption: caption 
        }, { quoted: mek });

        // Step 2: Send Audio File
        await conn.sendMessage(from, {
            audio: { url: downloadUrl },
            mimetype: "audio/mpeg",
            fileName: `${metadata.title}.mp3`,
            ptt: false
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (err) {
        console.error("YTMP3 Error:", err);
        reply("❌ *Error:* Connection timed out or invalid API response.");
    }
});
