const { cmd } = require("../command");
const axios = require("axios");

cmd({
    pattern: "ytmp3",
    alias: ["audio3", "song"],
    react: "🎶",
    desc: "Download YouTube Audio via Skyzopedia API.",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    try {
        if (!q || !q.includes("http")) {
            return reply(`❓ *Example:* \n${prefix + command} https://youtu.be/xxx`);
        }

        const url = q.trim();
        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });
        reply("🔄 *KAMRAN-MD:* Sedang memproses audio, mohon tunggu...");

        // Fetching data from Skyzopedia API
        const apiResponse = await axios.get(`https://api.skyzopedia.web.id/download/ytdl-mp3?apikey=skyy&url=${url}`);
        const data = apiResponse.data;

        if (!data || !data.result || !data.result.download) {
            return reply("❌ *Error:* Data audio tidak ditemukan atau API Key expired.");
        }

        const { title, thumb, duration, download } = data.result;

        // --- Stylish Caption ---
        const caption = `
╭━━━━━━━〔 𝐘𝐓 𝐌𝐏𝟑 𝐃𝐋 〕━━━━━━━┈⊷
┃
┃ 🎵 *𝗧𝗶𝘁𝗹𝗲:* ${title || 'YouTube Audio'}
┃ 🕒 *𝗗𝘂𝗿𝗮𝘁𝗶𝗼𝗻:* ${duration || 'N/A'}
┃ 🔗 *𝗨𝗥𝗟:* ${url}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━┈⊷
⚡ *Audio sedang dikirim...*

> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋᴀᴍʀᴀɴ-ᴍᴅ`;

        // Step 1: Send Thumbnail with Info
        await conn.sendMessage(from, { 
            image: { url: thumb || 'https://i.ibb.co/video-placeholder.png' }, 
            caption: caption 
        }, { quoted: mek });

        // Step 2: Send Audio File
        await conn.sendMessage(from, {
            audio: { url: download },
            mimetype: "audio/mpeg",
            fileName: `${title}.mp3`,
            ptt: false
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (err) {
        console.error("YTMP3 Error:", err);
        reply("❌ *Error:* Terjadi kesalahan saat mengambil audio. Pastikan URL benar.");
    }
});
